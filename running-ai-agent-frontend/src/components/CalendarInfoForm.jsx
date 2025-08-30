import React, { useState } from "react";

const CalendarInfoForm = ({ addCalInfo }) => {
  const [timeValues, setTimeValues] = useState(["", "Europe/London"]);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);
  const [showInvalidWarning, setShowInvalidWarning] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowEmptyWarning(false);
    setShowInvalidWarning(false);

    if (timeValues[0].trim() && timeValues[1].trim()) {
      if (isValidTimeFormat(timeValues[0].trim())) {
        addCalInfo(timeValues);
        setTimeValues(["", "Europe/London"]);
      } else {
        console.error("Error validating starttime format");
        setShowInvalidWarning(true);
      }
    } else {
      console.error("Validation failed - one or both fields are empty");
      setShowEmptyWarning(true);
    }
  };

  const isValidTimeFormat = (time) => {
    // Regex for HH:MM:SS (24-hour format)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 text-black items-center"
    >
      <div className="flex text-zinc-100 py-2 items-center justify-center gap-5">
        <label htmlFor="startTime">Start Time</label>
        <input
          id="startTime"
          name="startTime"
          type="text"
          placeholder="HH:MM:SS"
          value={timeValues[0]}
          onChange={(e) => setTimeValues([e.target.value, timeValues[1]])}
          className="bg-zinc-700  px-5 py-2 rounded-2xl"
        />
      </div>
      <div className="flex text-zinc-100 py-2 items-center gap-5 justify-center">
        <label htmlFor="timeZones">Time Zone</label>
        <select
          id="timeZones"
          name="timeZones"
          value={timeValues[1]}
          onChange={(e) => setTimeValues([timeValues[0], e.target.value])}
          className="bg-zinc-700 px-5 py-2 rounded-2xl"
        >
          <option value="Europe/London">Europe/London</option>
          <option value="America/New_York">America/New_York</option>
          <option value="America/Los_Angeles">America/Los_Angeles</option>
          <option value="America/Chicago">America/Chicago</option>
          <option value="America/Denver">America/Denver</option>
          <option value="Asia/Tokyo">Asia/Tokyo</option>
          <option value="Australia/Sydney">Australia/Sydney</option>
          <option value="Europe/Paris">Europe/Paris</option>
          <option value="Europe/Berlin">Europe/Berlin</option>
        </select>
      </div>
      <button
        type="submit"
        className="bg-zinc-700 rounded-2xl text-white px-5 py-2 w-full hover:bg-gray-500 hover:cursor-pointer"
      >
        Submit
      </button>
      {showEmptyWarning && (
        <div className="flex justify-center">
          <h1 className="text-xl text-red-300">
            Warning please enter a value for StartTime
          </h1>
        </div>
      )}
      {showInvalidWarning && (
        <div className="flex justify-center w-100 text-center">
          <h1 className="text-xl text-red-300 text-center">
            Warning invalid start time entry, enter in format HH:MM:SS
          </h1>
        </div>
      )}
    </form>
  );
};

export default CalendarInfoForm;
