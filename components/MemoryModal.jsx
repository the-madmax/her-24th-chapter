"use client";

export default function MemoryModal({ memory, onClose }) {
  if (!memory) return null;

  return (
    <div className="memoryModal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="memoryCard" onClick={(event) => event.stopPropagation()}>
        <button className="modalClose" onClick={onClose} aria-label="Close memory">
          x
        </button>
        <div className="memoryImage">
          {memory.image ? <img src={memory.image} alt="" /> : <span>Image placeholder</span>}
        </div>
        <h2>{memory.title}</h2>
        <p>{memory.text}</p>
      </div>
    </div>
  );
}
