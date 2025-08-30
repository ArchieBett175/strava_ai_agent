# Standard library imports
import sys
import time
import json
import asyncio
import os
import webbrowser
from pathlib import Path
from typing import List, Optional, Dict, Any, Union

# Third-party imports
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, ValidationError

from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials

# Add the src directory to Python path before local imports
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir))

# Local imports (after path setup)
from StravaApiAuth import (
    getAuthenticatedUser,
    getAthleteinfo,
    get_code_for_tokens,
    CLIENT_ID,
)  # noqa: E402
from GatherData import gatherLastRunsFromTen, processActivityData, dumpJsonFile  # noqa: E402
from GeminiRunningDataAnalyzer import (  # noqa: E402
    getGenAiClient,
    readRunningData,
    runningAnalysis,
    runningPlan,
)
from assignCalendarEvent import (  # noqa: E402 s
    get_credentials,
    gettrainingPlan,
    validate_time_input,
    validate_timezone,
    createCalendarEvents,
)


os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"  # REMOVE BEFORE PRODUCTION s
app = FastAPI()

origins = ["http://localhost:5173"]

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = "http://localhost:8000/google-callback"
SCOPES = ["https://www.googleapis.com/auth/calendar"]

userTokens = {}  # Temporary for development purposes will be replaced with a database structure upon full deployment


class StravaUserDetails(BaseModel):
    runnerId: int
    runnerName: str
    activities: List[Any]
    failedActivites: List[Any]


class RunnerActivitiesSuccess(BaseModel):
    success: bool = True
    data: StravaUserDetails


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: str
    details: Optional[Dict[str, Any]] = None


class Workout(BaseModel):
    day: str
    date: str
    type: str
    description: str
    distance_km: Optional[Union[float, int]] = None
    target_pace_min_km: Optional[str] = None
    duration_minutes: Optional[Union[int, float]] = None

    class Config:
        extra = "allow"


class Week(BaseModel):
    week_number: int
    workouts: List[Workout]

    class Config:
        extra = "allow"


class RunningPlan(BaseModel):
    weeks: List[Week]

    total_weeks: Optional[int] = None
    plan_type: Optional[str] = None
    fitness_level: Optional[str] = None

    class Config:
        extra = "allow"


class AiSuccessResponse(BaseModel):
    success: bool = True
    planData: RunningPlan
    message: str = "Analysis and Generation Success"


class AiRawResponse(BaseModel):
    success: bool = True
    planData: Dict[str, Any]
    message: str = "Plan and Analysis generation Success"
    validationWarnings: Optional[List[str]] = None


class AiAnalysisResponse(BaseModel):
    success: bool = True
    analysis: str
    message: str = "Analysis Generation Success"


class Times(BaseModel):
    startTime: str
    timeZone: str


class AuthStatusResponse(BaseModel):
    auth_complete: bool
    data_processing: bool
    data_complete: bool
    error: Optional[str] = None


class AuthStartResponse(BaseModel):
    auth_url: str
    message: str


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/start-auth", response_model=AuthStartResponse)
async def start_stava_auth():
    global oauth_state

    try:
        from stravalib import Client

        client = Client()
        redirect_url = "http://127.0.0.1:8000/strava-callback"
        request_scope = ["read_all", "profile:read_all", "activity:read_all"]

        url = client.authorization_url(
            client_id=CLIENT_ID, redirect_uri=redirect_url, scope=request_scope
        )

        return AuthStartResponse(
            auth_url=url, message="Please complete authorisation in open browser window"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start auth: {str(e)}")


@app.get("/strava-callback")
async def strava_callback(request: Request):
    global oauth_state

    code = request.query_params.get("code")
    error = request.query_params.get("error")

    if error:
        return RedirectResponse(url=f"http://localhost:5173/?auth=error&msg={error}")

    if code:
        # asyncio.create_task(process_strava_data_background())

        tokens = get_code_for_tokens(code)

        return RedirectResponse(url="http://localhost:5173/?auth=success")

    return HTMLResponse(
        content="<h1>Authorization Failed</h1><p>No authorization code received.</p>",
        status_code=400,
    )


@app.get("/runner", response_model=RunnerActivitiesSuccess)
def get_runner_details():
    try:
        strava_data = getStravaData()
        if not strava_data:
            raise HTTPException(
                status_code=503,
                detail=ErrorResponse(
                    message="Unable to connect to strava API",
                    error_code="STRAVA_UNAVAILABLE",
                ).model_dump(),
            )

        user = StravaUserDetails(
            runnerId=strava_data["athlete_info"]["id"],
            runnerName=(
                strava_data["athlete_info"]["firstname"]
                + " "
                + strava_data["athlete_info"]["lastname"]
            ),
            activities=strava_data["user_data"],
            failedActivites=strava_data["failed_activities"],
        )

        return RunnerActivitiesSuccess(data=user)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                message="Invalid data received from Strava API",
                error_code="VALIDATION_ERROR",
                details={"validation_error": str(e)},
            ).model_dump(),
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                message="An Unexpected error occurred", error_code="INTERNAL_ERROR"
            ).model_dump(),
        )


@app.get("/gemini-analysis")
def generate_ai_analysis():
    try:
        geminiData = getGeminiAnalysis()
        if not geminiData:
            raise HTTPException(
                status_code=503,
                detail=ErrorResponse(
                    message=geminiData["message"], error_code=geminiData["error_code"]
                ),
            )
        analysisTxt = geminiData["analysis"]
        return AiAnalysisResponse(analysis=analysisTxt)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                message="An Unexpected error occurred", error_code="INTERNAL_ERROR"
            ).model_dump(),
        )


@app.get("/gemini-plan")
def generate_runner_plan(validate: bool = True):
    try:
        geminiData = getGeminiPlan()
        if not geminiData:
            raise HTTPException(
                status_code=503,
                detail=ErrorResponse(
                    message=geminiData["message"], error_code=geminiData["error_code"]
                ),
            )
        planDict = json.loads(geminiData["plan"])

        if not validate:
            return AiRawResponse(planData=planDict)

        try:
            plan = RunningPlan(**planDict)
            return AiSuccessResponse(planData=plan)
        except ValidationError as e:
            warnings = [f"Validation warning: {error['msg']}" for error in e.errors()]
            print(f"Plan validation warnings: {warnings}")

            return AiRawResponse(
                planData=planDict,
                message="Plan and analaysis generated with validation warnings",
                validationWarnings=warnings,
            )

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                message="AI Model returned invaild JSON",
                error_code="INVALID_JSON",
                details={"JSON_ERROR": str(e)},
            ).model_dump(),
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                message="An Unexpected error occurred", error_code="INTERNAL_ERROR"
            ).model_dump(),
        )


@app.get("/google-auth")
async def google_auth(user_id: str):
    if not user_id:
        raise HTTPException(
            status_code=400, detail="user_id query parameter is required"
        )

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uris": [GOOGLE_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
    )

    # Keep the original redirect URI - don't modify it
    flow.redirect_uri = GOOGLE_REDIRECT_URI

    # Pass user_id in the state parameter instead of the URL
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=f"user_id:{user_id}",  # Embed user_id in state
    )

    # Store the state for validation (you can also store user_id here if needed)
    userTokens[state] = {"user_id": user_id, "state": state}

    return {"auth_url": auth_url}


@app.get("/google-callback")
async def google_callback(request: Request):
    # Get the state parameter from the callback
    state = request.query_params.get("state")
    if not state:
        raise HTTPException(
            status_code=400, detail="State parameter missing from callback"
        )

    # Extract user_id from state
    if not state.startswith("user_id:"):
        raise HTTPException(status_code=400, detail="Invalid state parameter format")

    user_id = state.split(":", 1)[1]

    # Validate that we have this state stored
    if state not in userTokens:
        raise HTTPException(
            status_code=400, detail="Invalid or expired state parameter"
        )

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uris": [GOOGLE_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        state=state,
    )

    # Use the original redirect URI
    flow.redirect_uri = GOOGLE_REDIRECT_URI

    # Fetch the token using the authorization response
    flow.fetch_token(authorization_response=str(request.url))
    creds = flow.credentials

    # Store credentials under user_id
    userTokens[user_id] = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes,
    }

    # Clean up the state entry
    if state in userTokens:
        del userTokens[state]

    return RedirectResponse(
        url=f"http://localhost:5173/?google=success&user_id={user_id}"
    )


@app.post("/times")
def valTimes(times: Times):
    try:
        print(times)
        inputCalTimeTimeZone(times.startTime, times.timeZone)
        print("success")

        return {
            "message": "Calendar uploaded successfully to google calendar",
            "data": times,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail="Calendar upload failed")


class StravaDataManager:
    def __init__(self):
        self.stravaClient = None
        self.athleteInfo = None
        self.activityData = []
        self.failedActivities = []
        self.isAuthenticated = False

    def authenticate(self):
        """Handle Strava Authentication"""
        try:
            self.stravaClient = getAuthenticatedUser()
            self.athleteInfo = getAthleteinfo(self.stravaClient)

            if self.athleteInfo:
                print(f"Hi {self.athleteInfo['firstname']}, you are now authenticated!")
                print(f"Athlete ID: {self.athleteInfo['id']}")
                self.isAuthenticated = True
                return True
            return False
        except Exception as e:
            print(f"Authentication Failed: {e}")
            return False

    def gatherRecentRuns(self, count=10):
        """Gather list of Recent run IDs from strava get actvities"""
        if not self.isAuthenticated:
            print("Please Authenticate First")
            return False

        run_ids = gatherLastRunsFromTen(self.stravaClient)

        if isinstance(run_ids, str):  # error message returned
            print(run_ids)
            return False

        return run_ids

    def processActivities(self, run_ids):
        """Process multiple activies giving progress reports"""
        self.activityData = []
        self.failedActivities = []

        print(f"Processing {len(run_ids)} runs...")

        for i, run in enumerate(run_ids, 1):
            print(f"\n---Processing run {i}/{len(run_ids)} ---")
            activity = processActivityData(self.stravaClient, run)

            if activity:
                self.activityData.append(activity)
                print(f"✓ Successfully processed activity {run}")
            else:
                self.failedActivities.append(run)
                print(f"✗ Failed to process activity {run}")

            # delay to help request rates on strava api
            time.sleep(0.5)

        self._printProcessingSummary()
        return len(self.activityData) > 0

    def saveDataToFile(self):
        """dumps json data to an external JSON file"""

        if not self.activityData:
            print("No activities to save.")
            return False

        dumpJsonFile(self.activityData)
        print(f"Successfully saved {len(self.activityData)} activities to JSON file")
        return True

    def gatherAndProcessAllData(self):
        """Combines all function for ease of use in main function"""
        if not self.authenticate():
            return False

        runsIds = self.gatherRecentRuns()
        if not runsIds:
            return False

        if not self.processActivities(runsIds):
            return False

        return self.saveDataToFile()

    def _printProcessingSummary(self):
        """Private Method to print summary of process"""
        print("\n=== Processing Complete ===")
        print(f"Successfully processed: {len(self.activityData)} activities")
        print(f"Failed activities: {len(self.failedActivities)}")

        if self.failedActivities:
            print(f"Failed activity IDs: {self.failedActivities}")

    # Getters for frontend use
    def getAthleteInfo(self):
        return self.athleteInfo

    def getActivityData(self):
        return self.activityData

    def getFailedActivities(self):
        return self.failedActivities


class RunningPlanGeneratorManager:
    def __init__(self):
        self.geminiClient = None
        self.runningData = None
        self.analysis = None
        self.plan = None
        self.isInitialised = None

    def initialise(self):
        """Initialise the ai agent with data from Strava"""
        try:
            self.geminiClient = getGenAiClient()
            self.runningData = readRunningData()
            if self.runningData and self.geminiClient:
                self.isInitialised = True
                return True
            else:
                return False
        except Exception as e:
            print(f"Iitialisation failed: {e}")
            return False

    def Analyse(self):
        """Uses gemini to analyse users previous runs"""
        if not self.isInitialised:
            print("Please Initialise first")
            return False

        self.analysis = runningAnalysis(self.geminiClient, self.runningData)

        if self.analysis is not None:  # ADD THIS CHECK
            return True
        else:
            print("Analysis failed")
            return False

    def generatePlan(self):
        """Generates a 5 week running plan"""
        if not self.isInitialised:
            print("Please Initialise first")
            return False

        if not self.analysis:
            print("Please analyse data first")
            return False

        print(
            "I will now be generating a 5 week plan, based on the analysis for you to get quicker."
        )
        print("Generating...")

        self.plan = runningPlan(self.geminiClient, self.analysis)
        return self.plan is not None

    # data getters

    def get_analysis(self):
        return self.analysis

    def get_plan(self):
        return self.plan


runningPlanGenerator = RunningPlanGeneratorManager()


class calendarEventManager:
    def __init__(self, user_id: str):
        self.userId = user_id
        self.userCreds = None
        self.trainingPlan = None
        self.userTimeZone = None
        self.activityStartTime = None
        self.dataLoaded = False
        self.credsLoaded = False

    def loadUserCredentials(self):
        try:
            self.userCreds = get_user_credentials(self.userId)
            self.credsLoaded = True
            return True
        except Exception as e:
            print(f"Failed to fetch user Credentials: {e}")
            return False

    def loadTrainingPlan(self):
        self.trainingPlan = gettrainingPlan()
        if "error" in self.trainingPlan:
            print(f"Error loading training plan: {self.trainingPlan['error']}")
            return False
        else:
            print("Training plan loaded successfully!")
            self.dataLoaded = True
            return True

    def createCalEvents(self):
        if not self.credsLoaded:
            print("Please Authenticate user first")
            return False

        if not self.dataLoaded:
            print("Please Load data in first")
            return False

        print(
            f"\nCreating calendar events for {self.activityStartTime} in {self.userTimeZone}..."
        )
        if createCalendarEvents(
            self.trainingPlan, self.userCreds, self.userTimeZone, self.activityStartTime
        ):
            return True
        else:
            return False

    def validatedUserTimeZone(self, inputtedTimeZone):
        if validate_timezone(inputtedTimeZone):
            self.userTimeZone = inputtedTimeZone
            return True
        else:
            return False

    def validatedStartTime(self, inputtedStartTime):
        if validate_time_input(inputtedStartTime):
            self.activityStartTime = inputtedStartTime
            return True
        else:
            return False

    # getters
    def getUserCreds(self):
        return self.userCreds


def getStravaData():
    stravaManager = StravaDataManager()
    hasGatheredStravaData = stravaManager.gatherAndProcessAllData()

    if hasGatheredStravaData:
        userData = stravaManager.getActivityData()
        athleteInfo = stravaManager.getAthleteInfo()
        failedActivities = stravaManager.getFailedActivities()

        userDict = {
            "athlete_info": athleteInfo,
            "user_data": userData,
            "failed_activities": failedActivities,
        }
        return userDict
    else:
        return "Failed to retrieve strava user details"


def getGeminiAnalysis():
    if runningPlanGenerator.initialise():
        if runningPlanGenerator.Analyse():
            runAnalysis = runningPlanGenerator.get_analysis()
            aiDict = {
                "analysis": runAnalysis,
                "message": "Analysis Generation successful",
                "status": True,
            }
        else:
            return {
                "message": "Data analysis failed",
                "status": False,
                "error_code": "DATA_ANALYSIS_UNAVAILABLE",
            }
    else:
        return {
            "message": "Could not gather user running data",
            "status": False,
            "error_code": "USER_DATA_UNAVAILABLE",
        }

    return aiDict


def getGeminiPlan():
    if runningPlanGenerator.get_analysis() is not None:
        if runningPlanGenerator.generatePlan():
            plan = runningPlanGenerator.get_plan()
            aiDict = {
                "plan": plan,
                "message": "Analysis and plan Generation successful",
                "status": True,
            }
        else:
            return {
                "message": "Plan Generation Failed",
                "status": False,
                "error_code": "PLAN_GENERATION_UNAVAILABLE",
            }
    else:
        return {
            "message": "Could not find analysis",
            "status": False,
            "error_code": "PLAN_GENERATION_UNAVAILABLE",
        }
    return aiDict


def inputCalTimeTimeZone(time, timeZone):
    # Update function to post to google calendar,
    calEventManager = calendarEventManager()
    timeValid = calEventManager.validatedStartTime(time)
    timeZoneValid = calEventManager.validatedUserTimeZone(timeZone)

    print(timeValid, timeZoneValid)

    return timeValid and timeZoneValid


def get_user_credentials(user_id: str) -> Credentials:
    data = userTokens.get(user_id)

    if not data:
        raise Exception("User not authenticated with google calendar")

    return Credentials(
        token=data["token"],
        refresh_token=data["refresh_token"],
        token_uri=data["token_uri"],
        client_id=data["client_id"],
        client_secret=data["client_secret"],
        scopes=data["scopes"],
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
