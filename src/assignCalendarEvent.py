import datetime as dt
import os.path
import json

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/calendar"]


def gettrainingPlan(filePath: str = "5_week_plan.json"):
    try:
        with open(filePath, "r") as f:
            plan = json.load(f)

        if not plan:
            return {"error": "No plan found in file"}
        else:
            return {"plan": plan}

    except FileNotFoundError:
        return {"error": f"File {filePath} not Found"}
    except json.JSONDecodeError:
        return {"error": "Invalid JSON format in the file"}
    except Exception as e:
        return {"error": f"Error reading data: {str(e)}"}


def formatPlanForCal(workout, startTime="09:00:00"):
    description = workout["description"]
    if workout["distance_km"]:
        description += f" Total Distance: {workout['distance_km']} KM ."
    if workout["target_pace_min_km"]:
        description += f" Aim for {workout['target_pace_min_km']} as a successful pace for this workout."
    if workout["duration_minutes"]:
        description += (
            f" This should take you around {workout['duration_minutes']} minutes."
        )

    if not workout["duration_minutes"]:
        minsToAdd = 10
    else:
        minsToAdd = workout["duration_minutes"]

    dtStartTime = dt.datetime.strptime(startTime, "%H:%M:%S")
    endTime = dtStartTime + dt.timedelta(minutes=minsToAdd)

    endTime = dt.datetime.strftime(endTime, "%H:%M:%S")

    event = {
        "summary": workout["type"],
        "description": description,
        "colourId": 6,
        "start": {
            "dateTime": f"{workout['date']}T{startTime}",
            "timeZone": "Europe/London",
        },
        "end": {
            "dateTime": f"{workout['date']}T{endTime}",
            "timeZone": "Europe/London",
        },
    }

    return event


def createCalendarEvents(dataSet, creds):
    if not dataSet:
        return "Cannot Create calander events as dataSet is not available"

    weeks = dataSet["plan"]["weeks"]

    for week in weeks:
        days = week["workouts"]
        for day in days:
            event = formatPlanForCal(workout=day)
            insertCalEvent(creds, event)


def insertCalEvent(creds, event):
    try:
        service = build("calendar", "v3", credentials=creds)

        event = service.events().insert(calendarId="primary", body=event).execute()

        print(f"Event created {event.get('htmlLink')}")

    except HttpError as error:
        print("An error occurred:", error)


def main():
    creds = None

    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json")

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)

        with open("token.json", "w") as token:
            token.write(creds.to_json())

    data = gettrainingPlan()
    createCalendarEvents(data, creds)


if __name__ == "__main__":
    main()
