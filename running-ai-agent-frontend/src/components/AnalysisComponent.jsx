import React, { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { MdOutlineKeyboardDoubleArrowDown } from "react-icons/md";

const AnalysisComponent = ({ loading, markdownContent }) => {
  const [expand, setExpand] = useState(false);

  return (
    <div
      className={`w-5/6 rounded-xl bg-white/5 shadow-lg ring-1 ring-black/5 backdrop-blur-xs p-10 relative  ${
        expand ? "overflow-visible h-fit" : "overflow-hidden h-100"
      }`}
    >
      <div className={`w-full ${expand ? "" : "h-100 mask-b-from-0"}`}>
        <MarkdownRenderer content={markdownContent} />
      </div>
      {!expand ? (
        <div
          className=" absolute text-3xl bottom-10 place-self-center font-rubik bg-zinc-950/20 px-5 py-2 rounded-2xl flex items-center gap-5 cursor-pointer text-zinc-200 hover:text-white"
          onClick={() => {
            setExpand(true);
          }}
        >
          <h1>Click to expand</h1>
          <MdOutlineKeyboardDoubleArrowDown className="size-10" />
        </div>
      ) : (
        <div
          className=" absolute text-3xl bottom-2 place-self-center font-rubik bg-zinc-950/20 px-5 py-2 rounded-2xl flex items-center gap-5 cursor-pointer text-zinc-200 hover:text-white"
          onClick={() => {
            setExpand(false);
          }}
        >
          <h1>Click to Shrink</h1>
          <MdOutlineKeyboardDoubleArrowDown className="size-10 rotate-180" />
        </div>
      )}
    </div>
  );
};

export default AnalysisComponent;
