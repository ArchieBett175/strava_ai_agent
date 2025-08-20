import React, { useState } from "react";

import { motion, useTime, useTransform } from "motion/react";
import api from "../api";
import Loader from "./loader";
import AnalysisComponent from "./AnalysisComponent";

const GeminiAnalysisSection = ({ setGemAnalysed }) => {
  const time = useTime();

  const rotate = useTransform(time, [0, 3000], [0, 360], {
    clamp: false,
  });

  const rotatingBg = useTransform(rotate, (r) => {
    return `conic-gradient(from ${r}deg, #ff4545, #00ff99, #006aff, #ff0095, #ff4545)`;
  });

  const [clicked, setClicked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadedAnalysis, setLoadedAnalysis] = useState(false);
  const [mdContent, setMdContent] = useState();

  const handleClick = async () => {
    setClicked(true);
    setLoading(true);
    try {
      const res = await api.get("/gemini-analysis");
      if (res) {
        console.log(res.data.analysis);
        setGemAnalysed(() => res.data.success);
        setLoadedAnalysis(true);
        setMdContent(res.data.analysis);
      }
    } catch (error) {
      console.log("An Unexpected Error Occured", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative text-white w-full py-10 flex justify-center">
      <div className="flex flex-col items-center gap-16">
        <div className="flex flex-col items-center text-5xl font-rubik gap-4">
          <h1>Use this data to get a personalised review</h1>
          <h1 className="text-zinc-300">
            Then generate a 5 week plan for you to get quicker
          </h1>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-3xl text-gray-400">
            {loading
              ? "Analysing Strava Data"
              : loadedAnalysis
              ? "Scroll down for analysis, whilst I load your plan"
              : ""}
          </h1>

          {loading ? <Loader /> : <div />}
        </div>
        <motion.div
          className="relative z-10 cursor-pointer w-fit"
          whileHover="hover"
          initial="initial"
          whileTap="tap"
          hidden={clicked}
        >
          <motion.button
            className="bg-zinc-900 px-5 py-3 rounded-2xl text-2xl font-rubik relative z-10 cursor-pointer"
            variants={{
              initial: { scale: 1, background: "#27272a" },
              hover: { scale: 1.1, background: "#3f3f46" },
              tap: { scale: 0.95, background: "#00000" },
            }}
            onClick={handleClick}
            disabled={clicked}
          >
            Get Gemini Analysis
          </motion.button>
          <motion.div
            className="absolute -inset-[2px] rounded-2xl"
            style={{ background: rotatingBg }}
            variants={{
              initial: { scale: 1, inset: "-2px" },
              hover: { scale: 1.1, inset: "-3px" },
              tap: { scale: 0.95, inset: "1px" },
            }}
          />
        </motion.div>
        {loadedAnalysis ? (
          <AnalysisComponent markdownContent={mdContent} loading={loading} />
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default GeminiAnalysisSection;
