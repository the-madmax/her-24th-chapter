"use client";

import { useProgress } from "@react-three/drei";

export default function LoadingOverlay() {
  const { progress, active } = useProgress();

  return (
    <div className={active || progress < 100 ? "loadingOverlay visible" : "loadingOverlay"}>
      <div className="loadingMeter">
        <span>{Math.round(progress)}%</span>
        <div>
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
