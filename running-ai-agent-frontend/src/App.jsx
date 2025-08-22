import { useState } from "react";
import CalendarInfo from "./components/CalendarInfo";
import Hero from "./components/Hero";
import StravaDataContainer from "./components/StravaDataContainer";
import StravaImportSection from "./components/StravaImportSection";
import { ReactLenis } from "lenis/dist/lenis-react";
import GeminiAnalysisSection from "./components/GeminiAnalysisSection";
import GeminiPlanSection from "./components/GeminiPlanSection";

function App() {
  const [stravaData, setStravaData] = useState(null);
  const [gemAnalysed, setGemAnalysed] = useState(null);

  return (
    <ReactLenis root options={{ lerp: 0.05 }}>
      <div className="h-fit">
        <Hero setStravaData={setStravaData} />
        {stravaData !== null ? (
          <StravaDataContainer workoutData={stravaData} />
        ) : (
          <div />
        )}
        <GeminiAnalysisSection setGemAnalysed={setGemAnalysed} />
        <GeminiPlanSection gemAnalysed={gemAnalysed} />
      </div>
    </ReactLenis>
  );
}

export default App;
