import React, { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useTime,
} from "motion/react";

import BgImage from "./BgImage";
import StravaImportSection from "./StravaImportSection";

const SECTION_HEIGHT = 1500;

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
    source: "/images/running_solo.jpg",
    alt: "A close up picture of a runner mid stride, blue shoes on a tarmac road",
    xPos: 75,
    yPos: 450,
  },
];

const Hero = ({ setStravaData }) => {
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
        className="relative w-full text-white"
        style={{
          height: `calc(${SECTION_HEIGHT}px + 100vh)`,
        }}
      >
        <div className="absolute w-3/4 flex flex-col items-center top-60   place-self-center">
          <div className="font-regular text-7xl font-rubik w-full z-10">
            <h1 className=" text-shadow-lg ">Get Your next training block</h1>
            <h1 className="text-gray-400 text-shadow-lg">
              From your previous workouts
            </h1>
          </div>

          <div className="relative mt-10">
            <motion.div
              className="relative z-10 cursor-pointer w-fit"
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
                className="absolute -inset-[2px] rounded-2xl"
                style={{
                  background: rotatingBg,
                }}
                variants={{
                  initial: { scale: 1, inset: "-2px" },
                  hover: { scale: 1.1, inset: "-3px" },
                  tap: { scale: 0.95, inset: "1px" },
                }}
              ></motion.div>
            </motion.div>
          </div>
        </div>

        <ImageToZoom />
        <ParallaxImages />

        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-b from-zinc-950/0 to-zinc-950" />
        <StravaImportSection setStravaData={setStravaData} />
      </div>
    </BgImage>
  );
};

const ImageToZoom = () => {
  const { scrollY } = useScroll();

  const clip1 = useTransform(scrollY, [0, SECTION_HEIGHT], [25, 0]);
  const clip2 = useTransform(scrollY, [0, SECTION_HEIGHT], [75, 100]);

  const clipPath = useMotionTemplate`inset(${clip1}% ${clip1}% ${clip1}% ${clip1}% round 40px)`;
  const opacity = useTransform(
    scrollY,
    [SECTION_HEIGHT, SECTION_HEIGHT + 500],
    [1, 0]
  );

  const blur = useTransform(
    scrollY,
    [SECTION_HEIGHT / 4, SECTION_HEIGHT],
    [15, 0]
  );

  const filter = useMotionTemplate`blur(${blur}px)`;

  const backgroundSize = useTransform(
    scrollY,
    [0, SECTION_HEIGHT + 500],
    ["170%", "100%"]
  );

  return (
    <motion.div
      className="sticky top-0 h-screen w-full"
      style={{
        opacity,
        backgroundSize,
        clipPath,
        backgroundImage: "url(/images/running_mountain.jpg)",
        backgroundPosition: "75% 60%",
        backgroundRepeat: "no-repeat",
        filter,
      }}
    />
  );
};

const ParallaxImages = () => {
  return (
    <div className="relative z-10 mx-auto max-w-5xl px-4 pt-[200px]">
      <ParallaxImage
        src={heroImages[0].source}
        alt={heroImages[0].alt}
        start={-100}
        end={200}
        className={"w-1/3 shadow-2xl"}
      />
      <ParallaxImage
        src={heroImages[1].source}
        alt={heroImages[1].alt}
        start={200}
        end={-200}
        className={"w-2/3 shadow-2xl mx-auto"}
      />
      <ParallaxImage
        src={heroImages[2].source}
        alt={heroImages[2].alt}
        start={200}
        end={-550}
        className={"w-5/12  shadow-2xl ml-auto"}
      />
    </div>
  );
};

const ParallaxImage = ({ className, src, alt, start, end }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`${start}px end`, `end ${end * -1}px`],
  });

  const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.9]);

  const y = useTransform(scrollYProgress, [0, 1], [start, end]);

  const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;

  return (
    <motion.img
      ref={ref}
      style={{
        opacity,
        transform,
      }}
      className={className}
      src={src}
      alt={alt}
    />
  );
};

export default Hero;
