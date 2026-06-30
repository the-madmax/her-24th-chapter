"use client";

import { useEffect, useState } from "react";

export default function EnvelopeModal({ show, onClose }) {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (show) {
      setOpened(false);
    }
  }, [show]);

  if (!show) return null;

  function handleOpen() {
    setOpened(true);
    const audio = new Audio("/audio/envelope-open.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }

  return (
    <div className="envelopeOverlay" onClick={opened ? onClose : undefined}>
      <div className="envelopeCard" onClick={(e) => e.stopPropagation()}>
        {!opened ? (
          <>
            <div className="envelopeFront" onClick={handleOpen}>
              <div className="envelopeFlap" />
              <div className="envelopeBody">
                <p className="envelopeLabel">A letter for you</p>
                <button className="envelopeOpenBtn" onClick={handleOpen}>Open ✉️</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <button className="modalClose" onClick={onClose} aria-label="Close letter">×</button>
            <div className="letterContent">
              <p className="letterGreeting">Happy Birthday</p>
              <p className="letterName">mera Pasandeeda Aurat!</p>
              <p className="letterBody">
                This is something for you! Hope u khush, if then me also Khush!
              </p>
              <div className="letterHeart">❤️</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}