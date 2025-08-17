import React from "react";
import api from "../api";
import CalendarInfoForm from "./calendarInfoForm";

const CalendarInfo = () => {
  const addCalInfo = async (timeValues) => {
    try {
      await api.post("/times", {
        startTime: timeValues[0],
        timeZone: timeValues[1],
      });
    } catch (error) {
      console.error("error adding time values", error);
    }
  };

  return (
    <div className="flex justify-center font-medium text-2xl">
      <div className="flex flex-col justify-center mx-auto my-10">
        <h1>Submit time</h1>
        <CalendarInfoForm addCalInfo={addCalInfo} />
      </div>
    </div>
  );
};

export default CalendarInfo;
