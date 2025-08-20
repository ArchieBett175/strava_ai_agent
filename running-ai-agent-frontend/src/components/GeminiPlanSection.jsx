import React, { useEffect, useRef, useState } from "react";
import api from "../api";
import Loader from "./loader";

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
          date: "2025-09-01",
          type: "Rest",
          description: "Complete rest or light stretching.",
          distance_km: null,
          target_pace_min_km: null,
          duration_minutes: null,
        },
        {
          day: "Tuesday",
          date: "2025-09-02",
          type: "Interval Training",
          description:
            "Warm-up (1.5km easy), 5 x 1000m repeats at 4:40-4:55/km pace with 3 min jogging recovery between reps, Cool-down (1.5km easy). Focus on maintaining strong form.",
          distance_km: 8.0,
          target_pace_min_km: "4:40-4:55",
          duration_minutes: 55,
        },
        {
          day: "Wednesday",
          date: "2025-09-03",
          type: "Easy Run",
          description:
            "Easy conversational pace. Re-emphasize Zone 2 HR. If you struggled last week, slow down even more. This run is for recovery.",
          distance_km: 4.5,
          target_pace_min_km: "7:00-7:45",
          duration_minutes: 35,
        },
        {
          day: "Thursday",
          date: "2025-09-04",
          type: "Tempo Run",
          description:
            "Warm-up (1.5km easy), 4km at a comfortably hard tempo pace (5:10-5:20/km), Cool-down (1.5km easy). Maintain a steady effort throughout the tempo segment.",
          distance_km: 7.0,
          target_pace_min_km: "5:10-5:20",
          duration_minutes: 50,
        },
        {
          day: "Friday",
          date: "2025-09-05",
          type: "Rest",
          description: "Complete rest or light active recovery.",
          distance_km: null,
          target_pace_min_km: null,
          duration_minutes: null,
        },
        {
          day: "Saturday",
          date: "2025-09-06",
          type: "Long Run",
          description:
            "Long easy run. Continue to focus on maintaining Zone 2 heart rate. It's okay to take short walk breaks if your HR spikes.",
          distance_km: 10.5,
          target_pace_min_km: "6:45-7:30",
          duration_minutes: 80,
        },
        {
          day: "Sunday",
          date: "2025-09-07",
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
  const [error, setError] = useState();
  //   const [plan, setPlan] = useState();
  const hasFetched = useRef(false);

  const getGemPlan = async () => {
    console.log("Fetching");
    if (hasFetched.current) {
      return;
    }

    hasFetched.current = true;

    setloading(true);
    try {
      const res = await api.get("/gemini-plan");
      console.log("fetching plan");
      if (res) {
        const data = res.data;
        setPlan(() => data.planData);
      }
    } catch (error) {
      console.error(
        "An Unexpected Error Occured when trying to retrieve plan",
        error
      );
      setError(error);
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    if (gemAnalysed) {
      getGemPlan();
    }
    // console.log(getMonths());
  }, [gemAnalysed]);

  const getMonths = () => {
    const weeks = plan.weeks;

    const months = {};

    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      const mondayMonth = week.workouts[0].date.slice(5, 7);
      const sundayMonth = week.workouts[6].date.slice(5, 7);

      if (months[mondayMonth] === undefined) {
        months[mondayMonth] = 1;
      } else if (months[sundayMonth] === undefined) {
        months[sundayMonth] = 1;
      }
    }

    const titleMonths = [];
    for (let month in months) {
      titleMonths.push(monthsMap[month]);
    }

    return titleMonths;
  };

  const formatDate = (day, date) => {
    const month = monthsMap[date.slice(5, 7)];
    const dayNum = date.slice(8);
    const accent = () => {
      if (
        (parseInt(dayNum) > 3 && parseInt(dayNum) < 21) ||
        (parseInt(dayNum) > 23 && parseInt(dayNum) < 31)
      ) {
        return "th";
      } else if (parseInt(dayNum.slice(-1)) === 1) {
        return "st";
      } else if (parseInt(dayNum.slice(-1)) === 2) {
        return "nd";
      } else {
        return "rd";
      }
    };

    return [day, [dayNum, accent()].join(""), month];
  };

  return (
    <div className="relative text-white w-full flex justify-center">
      <div className="w-[90%] h-screen bg-red-200">
        <h1></h1>
      </div>
    </div>
  );
};

export default GeminiPlanSection;
