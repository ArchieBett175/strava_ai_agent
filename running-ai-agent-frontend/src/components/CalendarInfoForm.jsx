import React, { useState } from "react";

const CalendarInfoForm = ({ addCalInfo }) => {
  const [timeValues, setTimeValues] = useState(["", ""]);

  const handleSubmit = (e) => {
    console.log(timeValues);
    e.preventDefault();
    if (timeValues[0].trim() && timeValues[1].trim()) {
      addCalInfo(timeValues);
      setTimeValues(["", ""]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="start time"
        value={timeValues[0]}
        onChange={(e) => setTimeValues([e.target.value, timeValues[1]])}
        className="bg-white"
      />
      <input
        type="text"
        value={timeValues[1]}
        placeholder="time zone"
        onChange={(e) => setTimeValues([timeValues[0], e.target.value])}
        className="bg-white"
      />
      <button
        type="submit"
        className="bg-white rounded-2xl hover:bg-gray-500 hover:cursor-pointer"
      >
        Submit
      </button>
    </form>
  );
};

export default CalendarInfoForm;
