import React from "react";
import api from "../api";

const CalendarExportSection = () => {
  const handleClick = async () => {
    try {
      const res = await api.get("/google-auth", {
        params: { user_id: "1234test" },
      });
    } catch (error) {
      console.error("An Unexpected Error occured", error);
    }
  };

  return (
    <div className="relative z-10 w-full flex text-white justify-center mb-10 font-rubik">
      <div className="flex flex-col">
        <button className="p-3 bg-zinc-800 border border-zinc-600 rounded-3xl w-75 text-2xl cursor-pointer">
          Export to your Google Calendar
        </button>
      </div>
    </div>
  );
};

export default CalendarExportSection;
