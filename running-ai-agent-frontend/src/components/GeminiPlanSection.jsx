import React, { useEffect, useRef, useState } from "react";
import api from "../api";
import Loader from "./loader";
import { motion, AnimatePresence } from "motion/react";
import RenderCalendarCell from "./RenderCalendarCell";
import CalendarExportSection from "./CalendarExportSection";

const plan = {
  weeks: [
    {
      week_number: 1,
      workouts: [
        {
          day: "Monday",
          date: "2025-08-25",
          type: "Rest",
          description: "Complete rest or light stretching.",
          distance_km: null,
          target_pace_min_km: null,
          duration_minutes: null,
        },
        {
          day: "Tuesday",
          date: "2025-08-26",
          type: "Interval Training",
          description:
            "Warm-up (1.5km easy), 6 x 800m repeats at 4:45-5:00/km pace with 2-3 min jogging recovery between reps, Cool-down (1.5km easy). Focus on consistent pacing for repeats.",
          distance_km: 7.0,
          target_pace_min_km: "4:45-5:00",
          duration_minutes: 50,
        },
        {
          day: "Wednesday",
          date: "2025-08-27",
          type: "Easy Run",
          description:
            "Easy conversational pace. CRITICAL: Maintain a true Zone 2 heart rate (e.g., 120-135 bpm). Slow down significantly if HR rises. This is for recovery and aerobic base building.",
          distance_km: 4.0,
          target_pace_min_km: "7:00-7:45",
          duration_minutes: 30,
        },
        {
          day: "Thursday",
          date: "2025-08-28",
          type: "Tempo Run",
          description:
            "Warm-up (1.5km easy), 3km at a comfortably hard tempo pace (5:15-5:25/km), Cool-down (1.5km easy). You should be able to speak in short sentences.",
          distance_km: 6.0,
          target_pace_min_km: "5:15-5:25",
          duration_minutes: 45,
        },
        {
          day: "Friday",
          date: "2025-08-29",
          type: "Rest",
          description:
            "Complete rest or light active recovery (e.g., gentle walk or cycling).",
          distance_km: null,
          target_pace_min_km: null,
          duration_minutes: null,
        },
        {
          day: "Saturday",
          date: "2025-08-30",
          type: "Long Run",
          description:
            "Long easy run. Focus on maintaining Zone 2 heart rate throughout. If HR consistently goes up, walk to bring it down. Stay hydrated.",
          distance_km: 9.0,
          target_pace_min_km: "6:45-7:30",
          duration_minutes: 70,
        },
        {
          day: "Sunday",
          date: "2025-08-31",
          type: "Rest",
          description: "Complete rest or very light stretching/mobility work.",
          distance_km: null,
          target_pace_min_km: null,
          duration_minutes: null,
        },
      ],
    },
    {
      week_number: 2,
      workouts: [
        {
          day: "Monday",
          date: "2025-08-31",
          type: "Rest",
          description: "Complete rest or light stretching.",
          distance_km: null,
          target_pace_min_km: null,
          duration_minutes: null,
        },
        {
          day: "Tuesday",
          date: "2025-09-01",
          type: "Interval Training",
          description:
            "Warm-up (1.5km easy), 5 x 1000m repeats at 4:40-4:55/km pace with 3 min jogging recovery between reps, Cool-down (1.5km easy). Focus on maintaining strong form.",
          distance_km: 8.0,
          target_pace_min_km: "4:40-4:55",
          duration_minutes: 55,
        },
        {
          day: "Wednesday",
          date: "2025-09-02",
          type: "Easy Run",
          description:
            "Easy conversational pace. Re-emphasize Zone 2 HR. If you struggled last week, slow down even more. This run is for recovery.",
          distance_km: 4.5,
          target_pace_min_km: "7:00-7:45",
          duration_minutes: 35,
        },
        {
          day: "Thursday",
          date: "2025-09-03",
          type: "Tempo Run",
          description:
            "Warm-up (1.5km easy), 4km at a comfortably hard tempo pace (5:10-5:20/km), Cool-down (1.5km easy). Maintain a steady effort throughout the tempo segment.",
          distance_km: 7.0,
          target_pace_min_km: "5:10-5:20",
          duration_minutes: 50,
        },
        {
          day: "Friday",
          date: "2025-09-04",
          type: "Rest",
          description: "Complete rest or light active recovery.",
          distance_km: null,
          target_pace_min_km: null,
          duration_minutes: null,
        },
        {
          day: "Saturday",
          date: "2025-09-05",
          type: "Long Run",
          description:
            "Long easy run. Continue to focus on maintaining Zone 2 heart rate. It's okay to take short walk breaks if your HR spikes.",
          distance_km: 10.5,
          target_pace_min_km: "6:45-7:30",
          duration_minutes: 80,
        },
        {
          day: "Sunday",
          date: "2025-09-06",
          type: "Rest",
          description: "Complete rest or very light stretching/mobility work.",
          distance_km: null,
          target_pace_min_km: null,
          duration_minutes: null,
        },
      ],
    },
  ],
};

const monthsMap = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  10: "October",
  11: "November",
  12: "December",
};

const GeminiPlanSection = ({ gemAnalysed }) => {
  const [loading, setloading] = useState(false);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [error, setError] = useState();
  const [plan, setPlan] = useState();
  const hasFetched = useRef(false);
  const [calendar, setCalendar] = useState([]);

  const getGemPlan = async () => {
    console.log("Fetching");
    if (hasFetched.current) {
      console.log("Already fetched, skipping...");
      return;
    }

    hasFetched.current = true;

    setloading(true);
    try {
      const res = await api.get("/gemini-plan");
      console.log("fetching plan");
      if (res) {
        const data = res.data;
        setPlan(data.planData);
        setPlanLoaded(true);
        formatCalendar(data.planData);
      }
    } catch (error) {
      console.error(
        "An Unexpected Error Occured when trying to retrieve plan",
        error
      );
      setError(error);
      hasFetched.current = false;
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    if (gemAnalysed) {
      getGemPlan();
    }
  }, [gemAnalysed]);

  const formatCalendar = (planData = plan) => {
    if (!planData?.weeks) return;
    let calendar = [];
    const weeks = planData.weeks;

    let currentMonth = null;

    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      let weekArray = [];
      for (let j = 0; j < week.workouts.length; j++) {
        const workout = week.workouts[j];
        const workoutDate = formatDate(workout.day, workout.date);
        if (workoutDate[2] != currentMonth) {
          currentMonth = workoutDate[2];
          if (j === 0) {
            calendar.push([[currentMonth], [1], [1], [1], [1], [1], [1]]);
          } else {
            for (let n = j; n < 7; n++) {
              weekArray.push([0]);
            }
            calendar.push(weekArray);
            calendar.push([[currentMonth], [1], [1], [1], [1], [1], [1]]);
            weekArray = [];
            for (let m = 0; m < j; m++) {
              weekArray.push([0]);
            }
          }
        }
        weekArray.push([workout]);
      }
      calendar.push(weekArray);
    }
    // console.log(calendar);
    setCalendar(calendar);
  };

  const formatDate = (day, date) => {
    const month = monthsMap[date.slice(5, 7)];
    const dayNum = date.slice(8);
    const getOrdinal = (num) => {
      const n = parseInt(num);
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return [day, `${dayNum}${getOrdinal(dayNum)}`, month];
  };

  return (
    <div className="relative text-white w-full flex justify-center p-4 mb-15">
      <div className="w-full max-w-6xl">
        <div className="flex justify-center">
          {loading && (
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-rubik">
                Generating your 5 week plan{" "}
              </h1>
              <h1 className="text-xl font-rubik mt-5 text-zinc-400">
                This may take a while
              </h1>
              <Loader />
            </div>
          )}
        </div>
        {planLoaded && (
          <>
            <h2 className="text-4xl font-bold mb-4 text-center">
              Training Plan
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div
                  key={day}
                  className="text-center font-bold p-2 bg-zinc-800 rounded"
                >
                  {day}
                </div>
              ))}

              {/* Calendar cells */}
              {calendar.map((week, weekIndex) =>
                week.map((cellData, dayIndex) => (
                  <RenderCalendarCell
                    cellData={cellData}
                    weekIndex={weekIndex}
                    dayIndex={dayIndex}
                    formatDate={formatDate}
                    key={`${weekIndex}-${dayIndex}`}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GeminiPlanSection;
