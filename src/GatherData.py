from pydantic import BaseModel
from datetime import timedelta
import math
import json
import time
from stravalib.exc import Fault, RateLimitExceeded, AccessUnauthorized
from StravaApiAuth import getAuthenticatedUser, getAthleteinfo

# Our data models to be used when prompting the AI


class Split(BaseModel):
    id: int
    distance: float
    avgSpeed: str
    time: str
    elevationDiff: float
    avgHr: int


class Activity(BaseModel):
    id: int
    name: str
    description: str
    averageSpeed: str
    date: str
    distanceTotal: str
    movingTime: str
    avgHr: float | None
    maxHr: float | None
    splits: list[Split]


def processActivityData(client, activity_id=None, max_retries=3):
    """
    Processes a single activity returning a single activity object with error handling
    """
    for attempt in range(max_retries):
        try:
            print(
                f"Processing activity ID: {activity_id} (attempt {attempt + 1}/{max_retries})"
            )
            activ = client.get_activity(activity_id=activity_id)

            # Formatting of basic activity data
            startDate = activ.start_date
            formatted_date = startDate.strftime("%d-%m-%Y")

            movingTime = activ.moving_time
            movingTimeDelta = timedelta(seconds=movingTime)
            formattedMovingTime = str(movingTimeDelta)

            averageSpeed = convertSpeed(activ.average_speed)

            totalDistance = activ.distance
            formattedDistance = str(round(totalDistance / 1000, 2)) + " KM"

            # Formatting heartrate if it is apparent in the activity
            if activ.has_heartrate:
                avgHR, maxHR = activ.average_heartrate, activ.max_heartrate
            else:
                avgHR, maxHR = None, None

            # processing and formatting splits
            splits = activ.splits_metric
            splitArray = []

            for split in splits:
                totTime = split.moving_time
                moving_time_delta = timedelta(seconds=totTime)
                formatted_moving_time_split = str(moving_time_delta)

                formattedSpeed = convertSpeed(split.average_speed)

                tempSplitDict = {
                    "id": split.split,
                    "distance": split.distance,
                    "avgSpeed": formattedSpeed,
                    "time": formatted_moving_time_split,
                    "elevationDiff": split.elevation_difference,
                    "avgHr": round(split.average_heartrate),
                }

                tempSplit = Split(**tempSplitDict)
                splitArray.append(tempSplit)

            tempDict = {
                "id": activ.id,
                "name": activ.name,
                "description": activ.description,
                "averageSpeed": averageSpeed,
                "date": formatted_date,
                "distanceTotal": formattedDistance,
                "movingTime": formattedMovingTime,
                "avgHr": avgHR,
                "maxHr": maxHR,
                "splits": splitArray,
            }

            return Activity(**tempDict)

        except RateLimitExceeded as e:
            print(f"Rate limit exceeded. Waiting 60 seconds... : {e}")
            time.sleep(60)
            continue

        except AccessUnauthorized as e:
            print(f"Access denied for activity {activity_id}. Skipping... : {e}")
            return None

        except Fault as e:
            error_msg = str(e)
            if "500 Server Error" in error_msg:
                print(f"Server error for activity {activity_id}: {error_msg}")
                if attempt < max_retries - 1:
                    wait_time = 2**attempt  # Exponential backoff: 1s, 2s, 4s
                    print(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(
                        f"Failed to get activity {activity_id} after {max_retries} attempts"
                    )
                    return None
            elif "404" in error_msg:
                print(f"Activity {activity_id} not found. Skipping...")
                return None
            else:
                print(f"API error for activity {activity_id}: {error_msg}")
                return None

        except Exception as e:
            print(f"Unexpected error for activity {activity_id}: {e}")
            return None

    return None


def convertSpeed(speed):
    """
    Speed comes into this function in metres per second but for a more
    recognised format i will convert it to pace or min/km this therefore will become a string
    """
    decVal = 16.667 / speed
    rem = decVal - int(decVal)
    secs = math.ceil(round((60 * rem), 2))

    if secs >= 60:
        secs = secs - 60
        decVal += 1

    if secs < 10:
        finalSecs = "0" + str(secs)
    else:
        finalSecs = str(secs)
    total = str(math.floor(decVal)) + ":" + finalSecs + "/km"

    return total


def gatherLastRunsFromTen(client):
    """
    gets all activities between specified start and end date set to an event limit
    """
    activities = list(client.get_activities(limit=200))

    runListIds = []

    if activities:
        for acti in activities:
            if acti.type == "Run":
                runListIds.append(acti.id)
                if len(runListIds) == 10:
                    break

        if runListIds:
            return runListIds
        else:
            return (
                "No runs found in your last 10 activities, get running to gather data"
            )
    else:
        return "No Activities on this account"


def dumpJsonFile(activityData, filePath="users_running_data.json"):
    """
    save activities to a json file with the use of pydantic built in method
    """
    with open(filePath, "w") as f:
        activityDicts = [activity.model_dump() for activity in activityData]
        json.dump(activityDicts, f, indent=2)


def main():
    """
    Main function to run the application
    """
    client = getAuthenticatedUser()

    athleteInfo = getAthleteinfo(client)
    if athleteInfo:
        print(f"Hi {athleteInfo['firstname']}, you are now authenticated!")
        print(f"Athlete ID: {athleteInfo['id']}")

    listOfRunIDs = gatherLastRunsFromTen(client)

    if isinstance(listOfRunIDs, str):  # Error message returned
        print(listOfRunIDs)
        return

    activityArray = []
    failed_activities = []

    print(f"Processing {len(listOfRunIDs)} runs...")

    for i, run in enumerate(listOfRunIDs, 1):
        print(f"\n--- Processing run {i}/{len(listOfRunIDs)} ---")
        activity = processActivityData(client, run)

        if activity:
            activityArray.append(activity)
            print(f"✓ Successfully processed activity {run}")
        else:
            failed_activities.append(run)
            print(f"✗ Failed to process activity {run}")

        # Small delay to be gentle on the API
        time.sleep(0.5)

    # Summary
    print("\n=== Processing Complete ===")
    print(f"Successfully processed: {len(activityArray)} activities")
    print(f"Failed activities: {len(failed_activities)}")

    if failed_activities:
        print(f"Failed activity IDs: {failed_activities}")

    if activityArray:
        dumpJsonFile(activityArray)
        print(f"Successfully saved {len(activityArray)} activities to JSON file")
    else:
        print("No activities were successfully processed.")


if __name__ == "__main__":
    main()
