import React, { useEffect, useState } from "react";
import api from "../api";
import CalendarInfo from "./CalendarInfo";

const CalendarExportSection = () => {
  const [showInputForm, setShowInputForm] = useState(true);
  const [clicked, setClicked] = useState(false);

  const handleClick = async () => {
    try {
      const res = await api.get("/google-auth", {
        params: { user_id: "1234test" },
      });
      const authUrl = res.data.auth_url;
      window.location.href = authUrl;
    } catch (error) {
      console.error("An Unexpected Error occured", error);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get("google");

    if (authStatus === "success") {
      const section = document.getElementById("g-calendar-prompt");
      if (section) section.scrollIntoView({ behavior: "smooth" });
      setClicked(true);
      setShowInputForm(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div
      className="relative z-10 w-full flex text-white justify-center mb-10 font-rubik"
      id="g-calendar-prompt"
    >
      <div className="flex flex-col items-center">
        <button
          className="p-3 bg-zinc-800 border border-zinc-600 rounded-3xl w-75 text-2xl cursor-pointer"
          onClick={handleClick}
          hidden={clicked}
          disabled={clicked}
        >
          Export to your Google Calendar
        </button>

        <div>{showInputForm && <CalendarInfo />}</div>
      </div>
    </div>
  );
};

export default CalendarExportSection;
