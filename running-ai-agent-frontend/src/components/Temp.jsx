import React from "react";
import BgImage from "./BgImage";
import ImagePopUp from "./ImagePopUp";
import { useTime, useTransform, motion } from "motion/react";
const heroImages = [
  {
    id: 1,
    source: "/images/running_australia.jpg",
    alt: "A scenic photo of a man running near sydney harbour bridge",
    xPos: 150,
    yPos: 100,
  },
  {
    id: 2,
    source: "/images/running_group.jpg",
    alt: "Close up of lower leg of many people running in a group",
    xPos: 900,
    yPos: 50,
  },
  {
    id: 3,
    source: "/images/running_mountain.jpg",
    alt: "A photo of a lonely runner, heading towards a mountain, photo taken from behind",
    xPos: 800,
    yPos: 375,
  },
  {
    id: 4,
    source: "/images/running_solo.jpg",
    alt: "A close up picture of a runner mid stride, blue shoes on a tarmac road",
    xPos: 75,
    yPos: 450,
  },
];

const SECTION_HEIGHT = 1500;

const Hero = () => {
  const time = useTime();

  const rotate = useTransform(time, [0, 3000], [0, 360], {
    clamp: false,
  });

  const rotatingBg = useTransform(rotate, (r) => {
    return `conic-gradient(from ${r}deg, #ff4545, #00ff99, #006aff, #ff0095, #ff4545)`;
  });

  return (
    <BgImage>
      <div
        className="text-white flex flex-col items-center relative"
        style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)` }}
      >
        <ImageToZoom />
        <div>
          <div className="font-regular text-7xl font-rubik w-3/4 mt-50 z-10">
            <h1 className=" text-shadow-lg ">Get Your next training block</h1>
            <h1 className="text-gray-400 text-shadow-lg">
              From your previous workouts
            </h1>
          </div>
          <motion.div
            className="relative mt-10 z-10 cursor-pointer"
            whileHover="hover"
            initial="initial"
            whileTap="tap"
          >
            <motion.button
              className="bg-zinc-800 py-2 px-7 text-3xl rounded-2xl font-rubik shadow-2xl shadow-gray-900 z-10 relative cursor-pointer"
              variants={{
                initial: { scale: 1, background: "#27272a" },
                hover: { scale: 1.1, background: "#3f3f46" },
                tap: { scale: 0.95, background: "#00000" },
              }}
            >
              Find Out How
            </motion.button>
            <motion.div
              className="absolute -inset-[1px] rounded-2xl"
              style={{
                background: rotatingBg,
              }}
              variants={{
                initial: { scale: 1, inset: "-1px" },
                hover: { scale: 1.1, inset: "-3px" },
                tap: { scale: 0.95, inset: "1px" },
              }}
            ></motion.div>
          </motion.div>
          <div>
            {heroImages.map((img, i) => (
              <ImagePopUp
                key={img.id}
                source={img.source}
                alt={img.alt}
                xpos={img.xPos}
                ypos={img.yPos}
                transition={{ duration: 0.3, delay: i * 0.5 }}
              />
            ))}
          </div>
        </div>
      </div>
    </BgImage>
  );
};

const ImageToZoom = () => {
  return (
    <div
      className="sticky top-0 h-screen w-full"
      style={{
        backgroundImage: "url(/images/runnning_mountain.jpg)",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
};

export default Hero;
