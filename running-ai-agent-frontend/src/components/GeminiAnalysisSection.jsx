import React from "react";

import { motion, useTime, useTransform } from "motion/react";

const GeminiAnalysisSection = () => {
  const time = useTime();

  const rotate = useTransform(time, [0, 3000], [0, 360], {
    clamp: false,
  });

  const rotatingBg = useTransform(rotate, (r) => {
    return `conic-gradient(from ${r}deg, #ff4545, #00ff99, #006aff, #ff0095, #ff4545)`;
  });

  return (
    <div className="relative text-white w-full py-10 flex justify-center">
      <div className="flex flex-col items-center gap-16">
        <div className="flex flex-col items-center text-5xl font-rubik gap-4">
          <h1>Use this data to get a personalised review</h1>
          <h1 className="text-zinc-300">
            Then generate a 5 week plan for you to get quicker
          </h1>
        </div>
        <motion.div
          className="relative z-10 cursor-pointer w-fit"
          whileHover="hover"
          initial="initial"
          whileTap="tap"
        >
          <motion.button
            className="bg-zinc-900 px-5 py-3 rounded-2xl text-2xl font-rubik relative z-10 cursor-pointer"
            variants={{
              initial: { scale: 1, background: "#27272a" },
              hover: { scale: 1.1, background: "#3f3f46" },
              tap: { scale: 0.95, background: "#00000" },
            }}
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
      </div>
    </div>
  );
};

export default GeminiAnalysisSection;
