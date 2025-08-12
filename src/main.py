from GatherData import main as stravaApi_main
from GeminiRunningDataAnalyzer import main as dataAnalyzer_main
from assignCalendarEvent import main as assignCalEvent_main


def main():
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
