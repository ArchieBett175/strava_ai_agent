from GatherData import main as stravaApi_main
from GeminiRunningDataAnalyzer import main as dataAnalyzer_main
from assignCalendarEvent import main as assignCalEvent_main

from StravaApiAuth import getAuthenticatedUser, getAthleteinfo
from GatherData import gatherLastRunsFromTen, processActivityData, dumpJsonFile
import time
import json


def main():
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
        print(f"\n---Processing run {i}/{len(listOfRunIDs)} ---")
        activity = processActivityData(client, run)

        if activity:
            activityArray.append(activity)
            print(f"✓ Successfully processed activity {run}")
        else:
            failed_activities.append(run)
            print(f"✗ Failed to process activity {run}")

        # delay to help request rates on strava api
        time.sleep(0.5)

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

    stravaApi_main()

    planCreated = False

    while True:
        summarise = input("Would you like to summarise this running data : (y/n)")
        if summarise == "y":
            dataAnalyzer_main()
            planCreated = True
            break
        elif summarise == "n":
            break
        else:
            print(f"Input {summarise} invalid, respond with either 'y' or 'n'.")

    if planCreated:
        assignCalEvent_main()


if __name__ == "__main__":
    main()
