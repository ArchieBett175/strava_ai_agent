import React, { useEffect, useState } from "react";
import StravaDataItem from "./StravaDataItem";

const StravaDataContainer = ({ workoutData }) => {
  const [athleteName, setAthleteName] = useState();
  const [workoutList, setWorkoutList] = useState([]);

  const formatData = (d) => {
    const names = d.runnerName.split(" ");
    const firstName = names[0];
    const capitalisedName =
      firstName.charAt(0).toUpperCase() + firstName.slice(1);
    setAthleteName(capitalisedName);

    setWorkoutList(d.activities);
  };

  useEffect(() => {
    if (!workoutData) {
      console.log("waiting...");
    } else {
      console.log(workoutData);
      formatData(workoutData);
    }
  }, [workoutData]);

  return (
    <div className="w-full h-fit flex relative justify-center mb-50">
      <div className="w-3/4 h-fit flex flex-col gap-10">
        <h1 className="text-white text-center text-4xl font-rubik">{`Hi ${athleteName}, Check out your recent runs!`}</h1>
        {workoutList.map((workout, i) => (
          <StravaDataItem key={workout.id || i} workout={workout} />
        ))}
      </div>
    </div>
  );
};

export default StravaDataContainer;
