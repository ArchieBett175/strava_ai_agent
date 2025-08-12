import json
import typing as t
from google import genai
from datetime import datetime
from pydantic import BaseModel


def readRunningData(filePath: str = "users_running_data.json") -> t.Dict[str, t.Any]:
    """
    Reads running data from a json file and returns structured data for analysis

    Args:
        file_path: Path to the json file containing the data

    Returns:
        A dictionary containing the running data and basic stats
    """

    try:
        with open(filePath, "r") as f:
            activities = json.load(f)

        if not activities:
            return {"error": "No running activities found in the file"}

        return {"activities": activities}

    except FileNotFoundError:
        return {"error": f"File {filePath} not Found"}
    except json.JSONDecodeError:
        return {"error": "Invalid JSON format in the file"}
    except Exception as e:
        return {"error": f"Error reading data: {str(e)}"}


def runningAnalysis(client, runningData):
    promptAnalysis = f"""
        Analyse the following JSON data, which represents the users last 10 runs,
        provide a breif overview outlining percieved effort, any performance trends
        and any concerning health patterns. Focus on metrics such as average pace
        heart rate, distance and run descriptions to infer effor levels and identify trends
        the data is as follows: {json.dumps(runningData)}
    """

    print("Analysing...")

    response = client.models.generate_content(
        model="gemini-2.5-flash", contents=promptAnalysis
    )

    analysisResult = response.text

    print("Analysis of Runs:")
    print(analysisResult)

    return analysisResult


class Workout(BaseModel):
    day: str
    date: str
    type: str
    description: str
    distance_km: t.Optional[float] = None
    target_pace_min_km: t.Optional[str] = None
    duration_minutes: t.Optional[int] = None


class Week(BaseModel):
    week_number: int
    workouts: t.List[Workout]


class TrainingPlan(BaseModel):
    weeks: t.List[Week]


def runningPlan(client, runningAnalysis):
    now = datetime.now()
    promptPlan = f"""
    Based on the following analysis of the user's recent running performance, create a 5 week running plan 
    training 4 days a week training and the others rest or light recovery, starting next week to help them 
    get quicker the plan should be structured to improve speed and endurace, incorporating different run 
    types such as: interval training, tempo runs, easy runs and long runs. While prioritising aduquete 
    rest and recovery. The plan should include all days of the week and start from the monday following: {now}.
    Pace should be represented in a target time of minutes per kilometer. All distance values should be in
    Kilometers and Please give a rough estimate in minutes on how long each activity will take, so that these
    can be transfered to a calendar event. Every object you create must have all the credentials of the response
    Schema for continuity. The analyisis is as follows:
    {runningAnalysis}
    """

    responsePlan = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=promptPlan,
        config={
            "response_mime_type": "application/json",
            "response_schema": TrainingPlan,
        },
    )

    trainingPlanJsonStr = responsePlan.text
    trainingPlanDict = json.loads(trainingPlanJsonStr)
    print("\n\n5-Week Training Plan:")
    print(json.dumps(trainingPlanDict, indent=2))

    filePath = "5_week_plan.json"

    with open(filePath, "w") as f:
        json.dump(trainingPlanDict, f, indent=2)


def main():
    client = genai.Client()
    runningData = readRunningData()
    analysis = runningAnalysis(client, runningData)

    print("I will now create a 5 week plan from this analysis for you to get quicker")
    print("Generating ...")
    runningPlan(client, analysis)


if __name__ == "__main__":
    main()
