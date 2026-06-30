"use client";

import { useMemo, useState } from "react";

const DIGITS = Array.from({ length: 10 }, (_, index) => index);

export default function SlotGate({ target, onProgress, onUnlock }) {
  const [values, setValues] = useState(() => Array(8).fill(0));
  const [status, setStatus] = useState("Enter the date");
  const targetDigits = useMemo(() => target.padStart(8, "0").slice(0, 8).split("").map(Number), [target]);
  const correctPrefix = values.findIndex((value, index) => value !== targetDigits[index]);
  const progress = correctPrefix === -1 ? 8 : correctPrefix;

  function updateDigit(index, delta) {
    const next = [...values];
    next[index] = (next[index] + delta + 10) % 10;
    setValues(next);

    const nextPrefix = next.findIndex((value, digitIndex) => value !== targetDigits[digitIndex]);
    onProgress(nextPrefix === -1 ? 1 : Math.max(0, nextPrefix / 8));
    setStatus("Enter the date");
  }

  function pullLever() {
    if (values.join("") === targetDigits.join("")) {
      setStatus("Unlocked");
      onProgress(1);
      onUnlock();
      return;
    }

    setStatus("The lever refuses to move");
    onProgress(Math.max(0.08, progress / 8));
  }

  return (
    <section className="slotGate" style={{ "--fog": Math.max(0.08, progress / 8) }}>
      <div className="slotFog" />
      <div className="slotPanel" aria-label="Birthday date unlock">
        <p className="kicker">Her 24th</p>
        <h1>Set the date</h1>
        <div className="slotMachine">
          {values.map((value, index) => (
            <div
              className="reel"
              key={index}
              onWheel={(event) => {
                event.preventDefault();
                updateDigit(index, event.deltaY > 0 ? 1 : -1);
              }}
            >
              <button aria-label={`Increase digit ${index + 1}`} onClick={() => updateDigit(index, 1)}>
                +
              </button>
              <div className={value === targetDigits[index] ? "digit correct" : "digit"}>
                {DIGITS[value]}
              </div>
              <button aria-label={`Decrease digit ${index + 1}`} onClick={() => updateDigit(index, -1)}>
                -
              </button>
            </div>
          ))}
        </div>
        <div className="dateHint">DDMMYYYY</div>
        <button className="lever" onClick={pullLever} aria-label="Pull lever">
          <span />
        </button>
        <p className="gateStatus">{status}</p>
      </div>
    </section>
  );
}
