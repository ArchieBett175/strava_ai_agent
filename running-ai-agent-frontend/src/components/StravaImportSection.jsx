import React, { useEffect, useState } from "react";
import api from "../api";
import Loader from "./loader";
import { motion } from "motion/react";

const StravaImportSection = ({ setStravaData }) => {
  const [clicked, setClicked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState();

  const handleClick = async () => {
    try {
      const res = await api.get("/start-auth");
      const authUrl = res.data.auth_url;
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error occurred", error);
    }
  };

  const getUserData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/runner");
      const data = res.data.data;
      if (data) {
        setStravaData(data);
        setLoaded(true);
      }
    } catch (error) {
      console.error("Error Fetching from Strava API", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get("auth");

    if (authStatus === "success") {
      const section = document.getElementById("strava-data");
      if (section) section.scrollIntoView({ behavior: "smooth" });
      setClicked(true);
      getUserData();

      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authStatus === "error") {
      const msg = params.get("msg");
      console.error("Auth failed:", msg);
      setClicked(false);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  return (
    <div
      className="h-fit flex justify-center items-center relative z-10 pb-10"
      id="strava-data"
    >
      <div className="flex flex-col items-center relative">
        <h1 className="text-6xl font-rubik text-center">
          Import your last workouts from Strava
        </h1>
        <h1 className="text-4xl text-center font-rubik text-gray-400 text-shadow-lg">
          Watch Ai give you a comprehensive review, and a 5 week plan
        </h1>
        <motion.button
          className="bg-zinc-900 px-5 py-2 rounded-2xl border-white border-[1px] mt-7 font-rubik text-2xl cursor-pointer hover:bg-zinc-800"
          onClick={handleClick}
          disabled={clicked}
          hidden={clicked}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
        >
          Import your Strava
        </motion.button>
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-rubik mt-10 text-gray-400">
            {loading
              ? "Loading Strava Data"
              : loaded
              ? "Scroll Down Take A Look"
              : ""}
          </h1>
          {loading ? <Loader /> : <div />}
        </div>
      </div>
    </div>
  );
};

export default StravaImportSection;
