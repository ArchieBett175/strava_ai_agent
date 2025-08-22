import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const RenderCalendarCell = ({ cellData, weekIndex, dayIndex, formatDate }) => {
  const [showToolTip, setShowToolTip] = useState(false);
  const key = `${weekIndex}-${dayIndex}`;

  if (!cellData || cellData[0] === 1) {
    return null;
  }

  if (cellData[0] === 0) {
    return <div key={key} className="h-24 bg-transparent rounded"></div>;
  }

  if (typeof cellData[0] === "string") {
    return (
      <div
        key={key}
        className="col-span-7 p-4 text-start text-3xl font-bold text-white rounded-xl bg-zinc-900 mask-r-from-20"
      >
        {cellData[0]}
      </div>
    );
  }

  const workout = cellData[0];
  const isRest = workout.type.includes("Rest");

  return (
    <div className="relative">
      {" "}
      {/* Move relative here and remove from motion.div */}
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onMouseEnter={() => setShowToolTip(true)}
        onMouseLeave={() => setShowToolTip(false)}
        key={key}
        className={`h-30 p-2 border border-zinc-600 rounded font-rubik overflow-ellipsis ${
          isRest ? "bg-zinc-700" : "bg-blue-600"
        }`}
      >
        <div className="text-md text-gray-300">
          {workout.day} {formatDate(workout.day, workout.date)[1]}
        </div>
        <div className="text-md font-semibold text-white truncate">
          {workout.type}
        </div>
        {workout.distance_km && (
          <div className="text-sm text-gray-300">{workout.distance_km}km</div>
        )}
      </motion.div>
      <AnimatePresence>
        {showToolTip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`absolute -top-10 ml-2 border border-zinc-500
             bg-zinc-800 px-5 py-4 rounded-2xl text-md font-rubik 
              z-[10] flex flex-col gap-2 overflow-auto whitespace-normal 
              w-80 max-w-sm pointer-events-none shadow-xl ${
                workout.day === "Monday" ||
                workout.day === "Tuesday" ||
                workout.day === "Wednesday"
                  ? "left-full"
                  : "right-full"
              }`}
            style={{ zIndex: 9999 }} // Inline style as backup
          >
            <div className="font-semibold text-white">{workout.type}</div>
            {workout.description && (
              <div className="text-gray-300 text-sm">{workout.description}</div>
            )}
            {workout.target_pace_min_km && (
              <div className="text-gray-300 text-sm">
                Target Pace: {workout.target_pace_min_km} min/km
              </div>
            )}
            {workout.duration_minutes && (
              <div className="text-gray-300 text-sm">
                Duration: {workout.duration_minutes} minutes
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RenderCalendarCell;
