# Her 24th Cinematic Flow

## 1. Overall cinematic flow
The visitor starts at a minimal slot-machine gate. The correct `DDMMYYYY` unlock code fogs the gate progressively as each leading digit becomes correct, then the lever opens the film. After authentication, the master GLB streams in, the music starts, and the experience becomes a scroll-controlled single-shot film.

Chapters:

1. Cafe: warm golden-hour nostalgia, slowest opening pace, 35mm.
2. Office: ambition and growth, steadier movement, 45mm.
3. Palace: dream and victory, widest sweeping reveal, 26mm.
4. Bedroom: quiet intimacy, longest pauses and least UI, 50mm.

## 2. Scroll timeline
The page uses one tall scroll track. Scroll progress maps from `0..1` across every authored camera marker in chapter order. Forward scroll advances the film; backward scroll reverses the same path.

## 3. Transition logic
Transition markers remain part of the same Catmull-Rom curve so the camera never jumps:

- `Transition_Cafe_Exit` dissolves warmth, reduces particles, and eases into `Transition_Office_Intro`.
- `Transition_Office_Exit` tightens movement before `Transition_Throne_Intro`.
- `Transition_Throne_Intro` increases exposure and scale feeling for the reveal.
- `Transition_Bed_Intro` warms the grade, reduces bloom, and slows into the ending.

## 4. Camera interpolation system
Camera positions are read from the GLB by name and interpolated with `THREE.CatmullRomCurve3`. FOV is blended per segment using authored camera FOV when present, otherwise the scene lens language fallback is used:

- Cafe: 35mm
- Office: 45mm
- Palace: 26mm
- Bedroom: 50mm

Rotation is derived from a smoothed look target, then eased with quaternion slerp.

## 5. Scene controller
The scene controller discovers:

- `Cam_*` and `Transition_*` objects for movement
- `Focus_*` objects for gaze
- `Orbit_*` objects for subtle breathing orbit state
- `Memory_*` objects for hover and click interactions

It owns chapter detection, target smoothing, FOV smoothing, post-processing state, and memory hover boosts.

## 6. Animation controller
Only restrained cinematic motion is applied:

- camera sway
- subtle target breathing
- floating dust particles
- memory hover shimmer through bloom and particle intensity

Authored scene objects are not globally animated or redesigned.

## 7. UI appearance timing
UI remains minimal:

- chapter title and short copy in the lower-left
- thin progress indicator
- music toggle
- menu button placeholder
- memory modal only after clicking a shining memory object

The UI fades through normal React/CSS transitions while the camera continues.

## 8. Music synchronization
The MP3 from `bgm/calm flute.mp3` starts after the lever unlock. During memory hover/click moments, volume gently dips to make the memory feel more intimate. The music toggle mutes without stopping scroll progression.

## 9. Particle timing
Particles are always extremely subtle. They increase when memory objects are active, then decay after passing. The slot-machine gate also uses progressive fog based on correct leading digits.

## 10. Post-processing changes
Per chapter, the controller blends:

- bloom
- exposure
- depth-of-field focus distance
- bokeh scale
- vignette

Memory hover temporarily increases bloom and particle opacity.

## 11. Mobile adaptations
Mobile uses adaptive DPR, lower DPR on performance decline, hidden progress rail, compact slot controls, and the same authored camera route. The camera framing is preserved; quality is reduced through render settings rather than changing composition.

## 12. Performance optimization strategy
The master 297MB GLB is streamed through an API route instead of duplicated. Loading progress is visible while assets initialize. The scene uses Suspense, `useGLTF` with Draco support, `Preload`, adaptive DPR, disabled multisampling in post, frustum culling, no shadow casting on imported meshes, and minimal runtime animation.

Recommended next asset pass:

- generate Draco and Meshopt compressed master export
- split Cafe, Office, Palace, Bedroom into staged GLBs if load time is too high
- convert large textures to KTX2/Basis
- add LODs for mobile-heavy decorations
- instance repeated decorations if the Blender file contains duplicates
