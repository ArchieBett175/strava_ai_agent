import React, { useState } from "react";
import { motion, AnimatePresence, hover } from "motion/react";
import { X } from "lucide-react";

const emojiArray = ["🏃", "🏃‍♂️", "🏃‍♀️", "👟"];

const StravaDataItem = ({ workout }) => {
  const [showToolTip, setShowToolTip] = useState(false);
  const currEmoji = useState(() => {
    const i = Math.floor(Math.random() * 4);
    return emojiArray[i];
  });

  return (
    <div className="flex flex-col text-gray-100 font-rubik">
      <hr />
      <div className="flex items-center mt-5">
        <div className="text-7xl bg-zinc-500/30 p-6 flex justify-center items-center mt-5 rounded-3xl mx-10">
          {currEmoji}
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <h1 className="text-lg text-zinc-600">{workout.date}</h1>
          <h1 className="text-3xl">{workout.name} </h1>
          <p className="text-md leading-tight mr-10 text-zinc-300">
            {workout.description}
          </p>
          <p className="flex gap-8 text-zinc-600">
            <span>{workout.averageSpeed}</span>{" "}
            <span>{workout.distanceTotal}</span>{" "}
            <span>{workout.movingTime}</span>{" "}
            <span>
              <span className="text-green-700"> Average HR: </span>
              {`${workout.avgHr}bpm`}
            </span>{" "}
            <span>
              <span className="text-green-700"> Max HR: </span>{" "}
              {`${workout.maxHr}bpm`}
            </span>
          </p>
        </div>
        <motion.div
          className="p-5 mt-5 relative"
          onMouseEnter={() => setShowToolTip(true)}
          onMouseLeave={() => setShowToolTip(false)}
          initial="initial"
          whileHover="hover"
        >
          <motion.div
            variants={{ initial: { rotate: 0 }, hover: { rotate: 135 } }}
            className="p-5"
          >
            <X className="size-10 rotate-45" />
          </motion.div>
          <AnimatePresence>
            {showToolTip && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute -top-20 right-full mr-2 bg-gray-800 px-5 py-4 rounded-2xl text-lg font-rubik whitespace-nowrap z-10 flex flex-col gap-2 "
              >
                <h1 className="text-2xl text-zinc-400">Splits</h1>
                {workout.splits.map((split, i) => (
                  <div key={split.id || i}>
                    <p>
                      {" "}
                      <span>{`Split ${split.id}- `} </span>
                      <span>{`${
                        Math.round((split.distance / 1000) * 10) / 10
                      } Km`}</span>
                      {" | "}
                      <span>{split.avgSpeed}</span> {" | "}
                      <span>{split.time}</span> {" | "}
                      <span>{`Average HR: ${split.avgHr}bpm`}</span> {" | "}
                      <span>{`Elevation Difference ${split.elevationDiff}`}</span>
                    </p>
                    <hr />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default StravaDataItem;
