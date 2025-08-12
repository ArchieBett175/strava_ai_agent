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


def formatPlanForCal(workout, timeZone, startTime="09:00:00"):
    description = workout["description"]
    if workout["type"] != "Rest":
        if workout["distance_km"]:
            description += f" Total Distance: {workout['distance_km']} KM ."
        if workout["target_pace_min_km"]:
            description += f" Aim for {workout['target_pace_min_km']} as a successful pace for this workout."
        if workout["duration_minutes"]:
            description += (
                f" This should take you around {workout['duration_minutes']} minutes."
            )

    if workout["type"] == "Rest" or not workout["duration_minutes"]:
        minsToAdd = 10
    else:
        minsToAdd = workout["duration_minutes"]

    dtStartTime = dt.datetime.strptime(startTime, "%H:%M:%S")
    endTime = dtStartTime + dt.timedelta(minutes=minsToAdd)

    endTimeStr = endTime.strftime("%H:%M:%S")

    event = {
        "summary": workout["type"],
        "description": description,
        "colorId": "6",  # Fixed typo: was "colourId"
        "start": {
            "dateTime": f"{workout['date']}T{startTime}",
            "timeZone": timeZone,
        },
        "end": {
            "dateTime": f"{workout['date']}T{endTimeStr}",
            "timeZone": timeZone,
        },
    }

    return event


def createCalendarEvents(dataSet, creds, timeZone, startTime):
    """Create calendar events using a single service connection"""
    if not dataSet:
        return "Cannot Create calendar events as dataSet is not available"

    weeks = dataSet["plan"]["weeks"]

    # Create service once and reuse it
    try:
        with build("calendar", "v3", credentials=creds) as service:
            events_created = 0

            for week in weeks:
                days = week["workouts"]
                for day in days:
                    event = formatPlanForCal(
                        workout=day, timeZone=timeZone, startTime=startTime
                    )

                    success = insertCalEvent(service, event)
                    if success:
                        events_created += 1

            print(f"\nSuccessfully created {events_created} calendar events!")

    except HttpError as error:
        print(f"An error occurred while creating calendar service: {error}")
        return None


def insertCalEvent(service, event):
    """Insert a single calendar event using existing service connection"""
    try:
        created_event = (
            service.events().insert(calendarId="primary", body=event).execute()
        )
        print(f"Event created: {event['summary']} - {created_event.get('htmlLink')}")
        return True

    except HttpError as error:
        print(f"An error occurred creating event '{event['summary']}': {error}")
        return False


def get_credentials():
    """Handle OAuth2 authentication and return credentials"""
    creds = None

    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json")

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Error refreshing credentials: {e}")
                # If refresh fails, we'll need to re-authenticate
                creds = None

        if not creds:
            if not os.path.exists("credentials.json"):
                print("Error: credentials.json file not found!")
                print(
                    "Please download your OAuth2 credentials from Google Cloud Console"
                )
                return None

            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)

        # Save credentials for next run
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    return creds


def validate_time_input(time_str):
    """Validate time input format"""
    try:
        dt.datetime.strptime(time_str, "%H:%M:%S")
        return True
    except ValueError:
        return False


def validate_timezone(timezone_str):
    """Basic timezone validation"""
    # Common IANA timezone patterns
    common_timezones = [
        "Europe/London",
        "America/New_York",
        "America/Los_Angeles",
        "America/Chicago",
        "America/Denver",
        "Asia/Tokyo",
        "Australia/Sydney",
        "Europe/Paris",
        "Europe/Berlin",
    ]

    if timezone_str in common_timezones or "/" in timezone_str:
        return True
    return False


def main():
    """Main function with improved error handling and user input validation"""
    print("=== Training Plan to Google Calendar Integration ===\n")

    # Get credentials
    creds = get_credentials()
    if not creds:
        print("Failed to authenticate. Exiting.")
        return

    # Load training plan
    data = gettrainingPlan()
    if "error" in data:
        print(f"Error loading training plan: {data['error']}")
        return

    print("Training plan loaded successfully!")

    while True:
        createCal = (
            input(
                "\nWould you like to port this training plan over to Google Calendar? (y/n): "
            )
            .lower()
            .strip()
        )

        if createCal == "y":
            # Get and validate time input
            while True:
                time = input(
                    "What time would you like to schedule your workouts? (Format: HH:MM:SS, e.g., 09:00:00): "
                ).strip()

                if validate_time_input(time):
                    break
                else:
                    print("Invalid time format. Please use HH:MM:SS (e.g., 09:00:00)")

            # Get and validate timezone input
            while True:
                timeZone = input(
                    "What timezone are you in? (IANA format, e.g., Europe/London): "
                ).strip()

                if validate_timezone(timeZone):
                    break
                else:
                    print(
                        "Please enter a valid IANA timezone (e.g., Europe/London, America/New_York)"
                    )

            print(f"\nCreating calendar events for {time} in {timeZone}...")
            createCalendarEvents(data, creds, timeZone, time)
            break

        elif createCal == "n":
            print("No calendar events created. Goodbye!")
            break
        else:
            print(f"Input '{createCal}' invalid, respond with either 'y' or 'n'.")


if __name__ == "__main__":
    main()
