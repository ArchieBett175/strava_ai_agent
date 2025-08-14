from StravaApiAuth import getAuthenticatedUser, getAthleteinfo
from GatherData import gatherLastRunsFromTen, processActivityData, dumpJsonFile
from GeminiRunningDataAnalyzer import (
    getGenAiClient,
    readRunningData,
    runningAnalysis,
    runningPlan,
)
from assignCalendarEvent import (
    get_credentials,
    gettrainingPlan,
    validate_time_input,
    validate_timezone,
    createCalendarEvents,
)
import time


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
            self.isInitialised = True
            return True
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


class calendarEventManager:
    def __init__(self):
        self.userCreds = None
        self.trainingPlan = None
        self.userTimeZone = None
        self.activityStartTime = None
        self.dataLoaded = False
        self.credsLoaded = False

    def loadUserCredentials(self):
        try:
            self.userCreds = get_credentials()
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
            ("Please Authenticate user first")
            return False

        if not self.dataLoaded:
            ("Please Load data in first")
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


def main():
    stravaManager = StravaDataManager()
    hasGatheredStravaData = stravaManager.gatherAndProcessAllData()
    createdCal = False

    runningPlanGenerator = RunningPlanGeneratorManager()
    createdPlan = False
    if hasGatheredStravaData:
        while True:
            summarise = (
                input("Would you like to summarise this running data : (y/n)")
                .lower()
                .strip()
            )
            if summarise == "y":
                if runningPlanGenerator.initialise():  # CHECK RETURN VALUE
                    if runningPlanGenerator.Analyse():  # CHECK RETURN VALUE
                        createdPlan = runningPlanGenerator.generatePlan()
                    else:
                        print("Analysis failed")
                        createdPlan = False
                else:
                    print("Initialisation failed")
                    createdPlan = False
                break
            elif summarise == "n":
                createdPlan = False
                break
            else:
                print(f"Input {summarise} invalid, respond with either 'y' or 'n'.")
    if createdPlan:
        calenderEventCreator = calendarEventManager()
        while True:
            createCal = (
                input(
                    "\nWould you like to port this training plan over to Google Calendar? (y/n): "
                )
                .lower()
                .strip()
            )
            if createCal == "y":
                # Validate and get Users Time input
                while True:
                    time = input(
                        "What time would you like to schedule your workouts? (Format: HH:MM:SS, e.g., 09:00:00): "
                    ).strip()

                    if calenderEventCreator.validatedStartTime(time):
                        break
                    else:
                        print(
                            print(
                                "Invalid time format. Please use HH:MM:SS (e.g., 09:00:00)"
                            )
                        )

                while True:
                    timeZone = input(
                        "What timezone are you in? (IANA format, e.g., Europe/London): "
                    ).strip()

                    if calenderEventCreator.validatedUserTimeZone(timeZone):
                        break
                    else:
                        print(
                            "Please enter a valid IANA timezone (e.g., Europe/London, America/New_York)"
                        )

                calenderEventCreator.loadUserCredentials()
                calenderEventCreator.loadTrainingPlan()
                createdCal = calenderEventCreator.createCalEvents()
                break
            elif createCal == "n":
                print("No calendar events created. Goodbye!")
                break
            else:
                print(f"Input '{createCal}' invalid, respond with either 'y' or 'n'.")

    if createdCal:
        print("Calendar events created, thanks for using this service, have a nice day")
    else:
        print("Thanks for using this service, apologies if it didn't meet expectations")


if __name__ == "__main__":
    main()
