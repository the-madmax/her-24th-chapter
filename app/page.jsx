"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import SlotGate from "@/components/SlotGate";

const CinematicExperience = dynamic(() => import("@/components/CinematicExperience"), {
  ssr: false
});

export default function Home() {
  const [unlocked, setUnlocked] = useState(false);
  const [fogLevel, setFogLevel] = useState(0);

  return (
    <main>
      {!unlocked && (
        <SlotGate
          target={process.env.NEXT_PUBLIC_UNLOCK_DATE || "01072002"}
          onProgress={setFogLevel}
          onUnlock={() => setUnlocked(true)}
        />
      )}
      {unlocked && <CinematicExperience initialFog={fogLevel} />}
    </main>
  );
}
