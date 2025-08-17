import React, { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";

const ImagePopUp = ({ xpos, ypos, source, alt, transition }) => {
  const imageOnePos = [150, 100];
  const src = "/images/running_australia.jpg";

  return (
    <motion.div
      className="absolute rounded-2xl max-h-50 z-0"
      style={{
        left: `${xpos}px`,
        top: `${ypos}px`,
      }}
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
    >
      <img
        src={source}
        alt={alt}
        className="rounded-2xl opacity-80 mask-b-from-20 object-cover max-h-50 w-100"
      />
    </motion.div>
  );
};

export default ImagePopUp;
