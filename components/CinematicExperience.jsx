"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Html, PerformanceMonitor, Preload, useGLTF } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import Lenis from "lenis";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CHAPTERS, MEMORIES, easeInOutCinematic, focalLengthToFov } from "@/data/cinematicTimeline";
import LoadingOverlay from "@/components/LoadingOverlay";
import MemoryModal from "@/components/MemoryModal";
import GuideModal from "@/components/GuideModal";
import EnvelopeModal from "@/components/EnvelopeModal";
import { playMemoryClick } from "@/lib/sounds";

const MODEL_URL = "/assets/model.glb";
const BGM_URL = "/assets/bgm.mp3";
const WORLD_UP = new THREE.Vector3(0, 1, 0);

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function findMemoryObject(object) {
  let current = object;
  while (current) {
    if (MEMORIES[current.name]) return current.name;
    current = current.parent;
  }
  return null;
}

function useLenisProgress({ onProgress } = {}) {
  const progressRef = useRef(0);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 2.2,
      wheelMultiplier: 0.55,
      touchMultiplier: 0.65,
      smoothWheel: true,
      smoothTouch: true
    });

    lenis.on("scroll", ({ scroll, limit }) => {
      const p = limit > 0 ? clamp01(scroll / limit) : 0;
      progressRef.current = p;
      if (onProgress) onProgress(p);
    });

    let rafId = 0;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [onProgress]);

  return progressRef;
}

function buildTimeline(scene) {
  scene.updateMatrixWorld(true);

  const points = [];
  const fovs = [];
  const chapterForPoint = [];
  const focusByChapter = new Map();
  const orbitByChapter = new Map();

  CHAPTERS.forEach((chapter) => {
    const focus = scene.getObjectByName(chapter.focus);
    const orbit = scene.getObjectByName(chapter.orbit);
    if (focus) focusByChapter.set(chapter.id, focus.getWorldPosition(new THREE.Vector3()));
    if (orbit) orbitByChapter.set(chapter.id, orbit.getWorldPosition(new THREE.Vector3()));

    chapter.cameras.forEach((name) => {
      const marker = scene.getObjectByName(name);
      if (!marker) return;
      points.push(marker.getWorldPosition(new THREE.Vector3()));
      fovs.push(marker.isCamera && marker.fov ? marker.fov : focalLengthToFov(chapter.lens));
      chapterForPoint.push(chapter.id);
    });
  });

  if (points.length < 2) {
    points.push(new THREE.Vector3(0, 2, 8), new THREE.Vector3(0, 2, 4));
    fovs.push(35, 35);
    chapterForPoint.push(CHAPTERS[0].id, CHAPTERS[0].id);
  }

  return {
    curve: new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.45),
    points,
    fovs,
    chapterForPoint,
    focusByChapter,
    orbitByChapter
  };
}

function FloatingParticles({ intensityRef }) {
  const points = useRef();
  const geometry = useMemo(() => {
    const count = 900;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = Math.random() * 12 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!points.current) return;
    const t = clock.getElapsedTime();
    points.current.rotation.y = t * 0.012;
    points.current.position.y = Math.sin(t * 0.45) * 0.08;
    points.current.material.opacity = mix(points.current.material.opacity, 0.08 + intensityRef.current * 0.18, 0.05);
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled>
      <pointsMaterial size={0.025} transparent opacity={0.12} color="#fff2ce" depthWrite={false} />
    </points>
  );
}

function CinematicScene({ progressRef, onChapter, onMemory, onPostChange, initialFog }) {
  const gltf = useGLTF(MODEL_URL, true);
  const { camera, gl, size } = useThree();
  const timeline = useMemo(() => buildTimeline(gltf.scene), [gltf.scene]);
  const memoryMeshes = useMemo(() => [], []);
  const target = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const lookMatrix = useMemo(() => new THREE.Matrix4(), []);
  const desiredQuat = useMemo(() => new THREE.Quaternion(), []);
  const lastChapter = useRef("");
  const lastPostUpdate = useRef(0);
  const memoryBoostRef = useRef(0);
  const hoverMemory = useRef(null);
  const carriedFog = Math.min(initialFog || 0, 0.18);
  const cafeLightRef = useRef(null);
  const cafeTargetRef = useRef(null);

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    memoryMeshes.length = 0;

    gltf.scene.traverse((object) => {
      object.frustumCulled = true;
      if (object.isMesh) {
        object.castShadow = false;
        object.receiveShadow = true;
        object.userData.baseScale = object.scale.clone();
        const memoryName = findMemoryObject(object);
        if (memoryName) {
          object.userData.memoryName = memoryName;
          object.material = Array.isArray(object.material)
            ? object.material.map((material) => material.clone())
            : object.material.clone();
          memoryMeshes.push(object);
        }
      }
    });
  }, [gl, gltf.scene, memoryMeshes]);

  useFrame(({ clock }) => {
    const raw = clamp01(progressRef.current);
    const eased = easeInOutCinematic(raw);
    const point = timeline.curve.getPoint(eased);
    const segmentFloat = eased * (timeline.points.length - 1);
    const segment = Math.min(timeline.points.length - 2, Math.floor(segmentFloat));
    const local = easeInOutCinematic(segmentFloat - segment);
    const chapterId = timeline.chapterForPoint[segment] || CHAPTERS[0].id;
    const nextChapterId = timeline.chapterForPoint[segment + 1] || chapterId;
    const chapter = CHAPTERS.find((item) => item.id === chapterId) || CHAPTERS[0];
    const nextChapter = CHAPTERS.find((item) => item.id === nextChapterId) || chapter;

    const focusA = timeline.focusByChapter.get(chapterId) || new THREE.Vector3(0, 1.5, 0);
    const focusB = timeline.focusByChapter.get(nextChapterId) || focusA;
    desiredTarget.current.copy(focusA).lerp(focusB, local);

    const orbitAnchor = timeline.orbitByChapter.get(chapterId);
    const orbitStrength = orbitAnchor ? 0.06 : 0.025;
    const time = clock.getElapsedTime();
    const breath = new THREE.Vector3(
      Math.sin(time * 0.93) * orbitStrength,
      Math.sin(time * 0.57) * orbitStrength * 0.55,
      Math.cos(time * 0.78) * orbitStrength
    );
    desiredTarget.current.add(breath);

    const handheld = new THREE.Vector3(
      Math.sin(time * 1.71) * 0.018,
      Math.sin(time * 2.03) * 0.012,
      Math.cos(time * 1.37) * 0.018
    );
    camera.position.lerp(point.add(handheld), 0.075);
    target.current.lerp(desiredTarget.current, 0.07);

    lookMatrix.lookAt(camera.position, target.current, WORLD_UP);
    desiredQuat.setFromRotationMatrix(lookMatrix);
    camera.quaternion.slerp(desiredQuat, 0.08);

    const markerFov = mix(timeline.fovs[segment], timeline.fovs[segment + 1] || timeline.fovs[segment], local);
    camera.fov = mix(camera.fov, markerFov, 0.055);
    camera.near = 0.03;
    camera.far = 220;
    camera.updateProjectionMatrix();

    const memoryBoost = hoverMemory.current ? 1 : 0;
    memoryBoostRef.current = mix(memoryBoostRef.current, memoryBoost, 0.045);

    // Cafe warm light — fades in during cafe chapter, fades out elsewhere
    if (cafeLightRef.current) {
      const cafeIntensity = chapterId === "cafe" ? 0.6 : 0;
      cafeLightRef.current.intensity = mix(cafeLightRef.current.intensity, cafeIntensity, 0.03);
    }

    if (lastChapter.current !== chapter.id) {
      lastChapter.current = chapter.id;
      onChapter(chapter);
    }

    if (time - lastPostUpdate.current > 0.08) {
      lastPostUpdate.current = time;
      const bloom = mix(chapter.bloom[0], nextChapter.bloom[1], local) * 0.55 + memoryBoostRef.current * 0.08;
      const exposure = mix(chapter.exposure[0], nextChapter.exposure[1], local) * 0.82;
      const distance = camera.position.distanceTo(target.current);
      gl.toneMappingExposure = exposure;
      onPostChange({
        bloom,
        exposure,
        focusDistance: Math.max(0.006, Math.min(0.055, distance / 700)),
        bokeh: chapter.id === "bed" ? 0.72 : 0.45,
        particles: memoryBoostRef.current
      });
    }

    memoryMeshes.forEach((mesh) => {
      const active = mesh.userData.memoryName === hoverMemory.current;
      const pulse = active ? 0.55 + Math.sin(time * 4.2) * 0.12 : 0.08 + Math.sin(time * 1.7) * 0.025;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        if (!material || !material.emissive) return;
        material.emissive.set("#ffd89b");
        material.emissiveIntensity = mix(material.emissiveIntensity || 0, pulse, 0.12);
      });
    });
  });

  return (
    <>
      <color attach="background" args={["#070604"]} />
      <fog attach="fog" args={["#c9ac82", 36 - carriedFog * 8, 150 - carriedFog * 20]} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[6, 8, 4]} intensity={0.72} color="#ffe1b5" />
      {/* Cafe warm accent light */}
      <pointLight ref={cafeLightRef} position={[-1.5, 2.2, 2.8]} intensity={0} distance={6} color="#ffc285" />
      <primitive
        object={gltf.scene}
        onPointerMove={(event) => {
          const memoryName = findMemoryObject(event.object);
          hoverMemory.current = memoryName;
          document.body.classList.toggle("isHoveringMemory", Boolean(memoryName));
        }}
        onPointerOut={() => {
          hoverMemory.current = null;
          document.body.classList.remove("isHoveringMemory");
        }}
        onClick={(event) => {
          const memoryName = findMemoryObject(event.object);
          if (memoryName) {
            onMemory(MEMORIES[memoryName]);
            playMemoryClick();
          }
        }}
      />
      <FloatingParticles intensityRef={memoryBoostRef} />
      {size.width < 700 && (
        <Html position={[0, -100, 0]} style={{ display: "none" }}>
          mobile
        </Html>
      )}
    </>
  );
}

export default function CinematicExperience({ initialFog = 0 }) {
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const lastProgress = useRef(0);
  const wasAtEnd = useRef(false);

  const handleProgress = useCallback((p) => {
    lastProgress.current = p;
    // If scrolled to end (>= 99%)
    if (p >= 0.99) {
      if (!wasAtEnd.current) {
        wasAtEnd.current = true;
        setTimeout(() => setShowEnvelope(true), 800);
      }
    }
    // If scrolled back up below 30% and previously triggered the envelope, reset
    if (p < 0.3 && wasAtEnd.current) {
      wasAtEnd.current = false;
    }
  }, []);

  const progressRef = useLenisProgress({ onProgress: handleProgress });
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [chapter, setChapter] = useState(CHAPTERS[0]);
  const [memory, setMemory] = useState(null);
  const [dpr, setDpr] = useState([1, 1.8]);
  const [post, setPost] = useState({
    bloom: 0.18,
    exposure: 1,
    focusDistance: 0.03,
    bokeh: 1.7,
    particles: 0
  });

  useEffect(() => {
    audioRef.current = new Audio(BGM_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.38;
    audioRef.current.play().catch(() => {});

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!audioRef.current) return;
    const memoryDip = post.particles > 0.2 ? 0.24 : 0.38;
    audioRef.current.volume += (memoryDip - audioRef.current.volume) * 0.08;
  }, [post.particles]);

  // Keyboard arrow key navigation
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const delta = e.key === "ArrowDown" ? window.innerHeight * 0.4 : -window.innerHeight * 0.4;
        window.scrollBy({ top: delta, behavior: "smooth" });
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <section className="experience">
      <div className="canvasStage">
        <Canvas
          dpr={dpr}
          camera={{ position: [0, 2, 8], fov: 38, near: 0.03, far: 220 }}
          gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        >
          <PerformanceMonitor onDecline={() => setDpr([0.75, 1.2])} onIncline={() => setDpr([1, 1.8])} />
          <AdaptiveDpr pixelated={false} />
          <Suspense fallback={null}>
            <CinematicScene
              progressRef={progressRef}
              onChapter={setChapter}
              onMemory={setMemory}
              onPostChange={setPost}
              initialFog={initialFog}
            />
            <EffectComposer multisampling={0}>
              <Bloom luminanceThreshold={0.62} intensity={post.bloom} mipmapBlur />
              <Vignette eskil={false} offset={0.18} darkness={0.72} />
            </EffectComposer>
            <Preload all />
          </Suspense>
        </Canvas>
      </div>
      <LoadingOverlay />
      <div className="storyUi">
        <p>{chapter.title}</p>
        <h1>{chapter.copy}</h1>
      </div>
      <div className="progressRail">
        <span style={{ transform: `scaleY(${Math.max(0.04, progressRef.current)})` }} />
      </div>
      <button className="musicToggle" onClick={() => setMuted((value) => !value)} aria-label="Toggle music">
        {muted ? "Sangeet off" : "Sangeet on"}
      </button>
      <button className="menuButton" onClick={() => setGuideOpen(true)} aria-label="Menu">
        Menu
      </button>
      <MemoryModal memory={memory} onClose={() => setMemory(null)} />
      <GuideModal show={guideOpen} onClose={() => setGuideOpen(false)} />
      <EnvelopeModal show={showEnvelope} onClose={() => setShowEnvelope(false)} />
      <div className="scrollTrack" />

      {/* Intro title overlay */}
      {!introDone && (
        <div className="introTitle" onClick={() => setIntroDone(true)}>
          <h1>Her Chapters</h1>
          <p>Click anywhere to begin</p>
        </div>
      )}
    </section>
  );
}

useGLTF.preload(MODEL_URL, true);