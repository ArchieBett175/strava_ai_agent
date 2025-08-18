import React from "react";
import { easeInOut, motion } from "motion/react";

const Loader = () => {
  const loadingContainerVarients = {
    start: {
      transition: {
        staggerChildren: 0.1,
      },
    },
    end: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const loadingCircleVarients = {
    start: {
      y: "0%",
    },
    end: {
      y: "100%",
    },
  };

  const loadingCircleTransition = {
    duration: 0.5,
    repeatType: "mirror",
    repeat: Infinity,
    ease: "easeInOut",
  };

  return (
    <motion.div
      className="w-16 h-16 flex justify-around mt-8"
      variants={loadingContainerVarients}
      initial="start"
      animate="end"
    >
      <motion.span
        className="block w-4 h-4 bg-gray-300 rounded-lg "
        variants={loadingCircleVarients}
        transition={loadingCircleTransition}
      />
      <motion.span
        className="block w-4 h-4 bg-gray-300 rounded-lg "
        variants={loadingCircleVarients}
        transition={loadingCircleTransition}
      />
      <motion.span
        className="block w-4 h-4 bg-gray-300 rounded-lg "
        variants={loadingCircleVarients}
        transition={loadingCircleTransition}
      />
    </motion.div>
  );
};

export default Loader;
