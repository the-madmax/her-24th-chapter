export const CHAPTERS = [
  {
    id: "cafe",
    title: "The Time travelling Cafe",
    copy: "Where memories are visited with steaming hot Chai.",
    mood: "warm, golden, hopeful",
    lens: 35,
    focus: "Focus_Cafe",
    orbit: "Orbit_Cafe",
    cameras: [
      "Cam_Cafe_01_Start",
      "Cam_Cafe_02_Mid",
      "Cam_Cafe_03_MidTop",
      "Cam_Cafe_04_FrontFar",
      "Cam_Cafe_05_FrontNear_End",
      "Cam_Cafe_06_End",
      "Transition_Cafe_Exit"
    ],
    exposure: [0.95, 1.1],
    bloom: [0.18, 0.32],
    grade: "#ffd19a"
  },
  {
    id: "office",
    title: "The Work",
    copy: "One thing at a time, the perseverance will pay off one day.",
    mood: "ambition, growth, confidence",
    lens: 45,
    focus: "Focus_Office",
    orbit: "Orbit_Office",
    cameras: [
      "Transition_Office_Intro",
      "Cam_Office_01_Start",
      "Cam_Office_02_Mid",
      "Cam_Office_03_Close",
      "Cam_Office_04_Inside",
      "Cam_Office_05_End",
      "Transition_Office_Exit"
    ],
    exposure: [0.9, 1.0],
    bloom: [0.12, 0.2],
    grade: "#d7e7ff"
  },
  {
    id: "throne",
    title: "The Queen & her Kingdom",
    copy: "She is the princess, She is the Queen, She is EVERYTHING!",
    mood: "fantasy, achievement, victory",
    lens: 26,
    focus: "Focus_Throne",
    orbit: "Orbit_Throne",
    cameras: [
      "Transition_Throne_Intro",
      "Cam_Throne_01_Start",
      "Cam_Throne_02_Lion",
      "Cam_Throne_03_Gifts",
      "Cam_Throne_04_Close",
      "Cam_Throne_05_Face",
      "Cam_Throne_06_End",
      "Transition_Throne_Exit"
    ],
    exposure: [1.05, 1.28],
    bloom: [0.24, 0.48],
    grade: "#f8e7b2"
  },
  {
    id: "bed",
    title: "A Quiet Place",
    copy: "There will be heavy tides and also there will be calmness, with a gist of smile of winning everything that may have seemed to be impossible before.",
    mood: "personal, intimate, love",
    lens: 50,
    focus: "Focus_Bed",
    orbit: "Orbit_Bed",
    cameras: [
      "Transition_Bed_Intro",
      "Cam_Bed_01_Start",
      "Cam_Bed_02_Mid",
      "Cam_Bed_03_Close",
      "Cam_Bed_04_WideNear",
      "Cam_Bed_05_Face"
    ],
    exposure: [0.82, 0.92],
    bloom: [0.08, 0.16],
    grade: "#ffc7aa"
  }
];

export const MEMORIES = {
  Memory_FirstGift: {
    title: "The Best Gift",
    text: "Your time is the best gift in the world. Each memory carries a story, and it will continue and become the best.",
    image: "/images/first-gift.jpg"
  },
  Memory_Momos: {
    title: "Momos",
    text: "The Momos I had with you are the bestest. Ek plate veg steamed momo is the best sentence with the cutest voice I can hear all day, whole life.",
    image: "/images/momos.jpg"
  },
  Memory_Biryani: {
    title: "Biryani",
    text: "If she wants Biryani, I'll get her one, No matter the distance, the cost, the anything!",
    image: "/images/biryani.jpg"
  }
};

export function focalLengthToFov(focalLength, filmHeight = 24) {
  return (2 * Math.atan(filmHeight / (2 * focalLength)) * 180) / Math.PI;
}

export function easeInOutCinematic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
