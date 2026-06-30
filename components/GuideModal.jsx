"use client";

export default function GuideModal({ show, onClose }) {
  if (!show) return null;

  return (
    <div className="guideOverlay" onClick={onClose}>
      <div className="guideCard" onClick={(e) => e.stopPropagation()}>
        <button className="modalClose" onClick={onClose} aria-label="Close guide">×</button>
        <h2>How to explore</h2>
        <ul>
          <li><strong>🖱️ Desktop:</strong> Scroll down slowly to move through the scenes. Best viewed with smooth, slow scrolling to enjoy all the camera angles.</li>
          <li><strong>⌨️ Keyboard:</strong> Use <kbd>↓</kbd> and <kbd>↑</kbd> arrow keys to scroll if you don't have a mouse wheel.</li>
          <li><strong>✨ Glowing objects:</strong> Three interactive memories are hidden in the scenes. Hover over them — they'll glow brighter. Click to unlock each memory.</li>
          <li><strong>📱 Phone:</strong> Tap and drag to scroll. The experience auto-adjusts for mobile. If performance feels sluggish, it adapts automatically.</li>
          <li><strong>🎵 Sangeet:</strong> Toggle the music button in the top-right corner.</li>
        </ul>
        <p className="guideHint">Click anywhere outside or press × to close</p>
      </div>
    </div>
  );
}