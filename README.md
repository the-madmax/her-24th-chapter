# Her 24th Cinematic Website

A premium cinematic birthday web experience built around an authored Blender GLB scene. The site preserves the original Blender cameras, camera markers, focus targets, memory objects, and cinematic framing, then turns them into a scroll-controlled interactive film.

The experience starts with a slot-machine date gate, streams the large master scene, starts background music after unlock, and lets the visitor move forward or backward through Cafe, Office, Palace, and Bedroom chapters by scrolling.

## Tech Stack

- Next.js 15
- React 19
- React Three Fiber 9
- Drei 10
- Three.js
- React Three Postprocessing
- Postprocessing
- Lenis smooth scrolling
- GSAP dependency installed for timeline/motion expansion
- App Router
- API routes for local asset streaming

## Project Structure

```txt
app/
  api/assets/[kind]/route.js   Streams the GLB and music assets
  globals.css                  Global styling and responsive UI
  layout.jsx                   Metadata and favicon registration
  page.jsx                     Slot gate to cinematic experience flow

components/
  CinematicExperience.jsx      R3F canvas, scene controller, camera rig, post FX
  LoadingOverlay.jsx           Drei loading progress UI
  MemoryModal.jsx              Modal for clicked memory objects
  SlotGate.jsx                 DDMMYYYY slot-machine authentication

data/
  cinematicTimeline.js         Chapter metadata, camera marker order, memories

masterscene/
  final_export_v1.glb          Main authored Blender export

bgm/
  calm flute.mp3               Background music

public/
  favicon.svg                  Site favicon

CINEMATIC_FLOW.md              Cinematic direction and implementation notes
```

## Commands

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run the production build locally:

```bash
npm run start
```

Run linting:

```bash
npm run lint
```

The local site usually runs at:

```txt
http://localhost:3000
```

## Unlock Logic

The first screen is a slot-machine gate.

- The visitor enters a date in `DDMMYYYY` format.
- Digits are changed by scrolling over each reel or using the reel buttons.
- The lever only unlocks the experience when all 8 digits match.
- If the sequence is wrong, the lever refuses to open.
- Each correct leading digit increases the fog intensity.
- The default unlock code is `24062002`.

To change the unlock date, set:

```bash
NEXT_PUBLIC_UNLOCK_DATE=DDMMYYYY
```

Example:

```bash
NEXT_PUBLIC_UNLOCK_DATE=24062002 npm run dev
```

On Windows PowerShell:

```powershell
$env:NEXT_PUBLIC_UNLOCK_DATE="24062002"; npm run dev
```

## Loading Logic

After the lever unlocks:

- The main cinematic experience mounts.
- The background music from `bgm/calm flute.mp3` starts.
- The GLB is loaded through Drei `useGLTF`.
- `LoadingOverlay` reads Drei loading progress and shows a percentage.
- The main GLB is streamed from `/api/assets/model`.
- The music is streamed from `/api/assets/bgm`.

The asset route supports ranged requests, which is important for audio playback and large asset delivery.

## Camera And Scroll Logic

The camera system is built in `components/CinematicExperience.jsx`.

Core behavior:

- Blender marker names are discovered from the loaded GLB.
- Authored camera marker positions are preserved.
- A `THREE.CatmullRomCurve3` path is built across the camera markers.
- Scroll progress from Lenis maps to progress along that curve.
- Camera motion uses eased progress, not linear interpolation.
- Camera rotation is derived from a smoothed look target.
- The camera quaternion is eased with `slerp`.
- FOV is blended per chapter using the intended lens language.

Lens language:

- Cafe: 35mm
- Office: 45mm
- Palace: 26mm
- Bedroom: 50mm

Focus targets:

- `Focus_Cafe`
- `Focus_Office`
- `Focus_Throne`
- `Focus_Bed`

The camera always eases toward the current chapter focus instead of snapping.

## Chapter Timeline Logic

The chapter definitions live in `data/cinematicTimeline.js`.

Chapters:

- Cafe
- Office
- Palace / Throne
- Bedroom

Each chapter defines:

- title
- short story text
- mood
- lens
- focus object name
- orbit object name
- ordered camera markers
- exposure range
- bloom range
- color grade hint

Scroll direction is reversible:

- Scroll forward to move forward through the film.
- Scroll backward to move backward through the film.

## Orbit And Breathing Motion

When an `Orbit_*` marker exists for a chapter, the camera target receives a subtle organic motion:

- slight vertical breathing
- soft horizontal drift
- tiny handheld imperfection

The scene avoids robotic motion and does not animate every object.

## Memory Logic

The supported memory object names are:

- `Memory_FirstGift`
- `Memory_Momos`
- `Memory_Biryani`

When a memory mesh is hovered:

- the cursor changes
- bloom increases slightly
- particles become more visible
- the object receives a subtle emissive pulse
- music volume dips gently

When clicked:

- a modal opens
- placeholder image/text are shown for now

Memory placeholder content is stored in `data/cinematicTimeline.js`.

## Post-Processing Logic

The app blends post-processing values as the visitor scrolls:

- bloom intensity
- exposure
- depth-of-field focus distance
- bokeh scale
- vignette

The renderer uses ACES Filmic tone mapping and sRGB output.

## Music Logic

Music starts only after successful unlock.

Current music file:

```txt
bgm/calm flute.mp3
```

The UI includes a music toggle. During memory emphasis moments, volume is gently reduced to make the memory feel more intimate.

## Performance Strategy

Current performance choices:

- The 297MB GLB is not duplicated into `public`.
- Assets stream through API routes.
- The R3F experience is dynamically imported with `ssr: false`.
- Suspense is used around the GLB scene.
- Drei loading progress is shown.
- Adaptive DPR responds to device performance.
- Postprocessing multisampling is disabled for performance.
- Imported meshes use frustum culling.
- Imported meshes do not cast shadows by default.
- Runtime animation is limited to camera sway, particles, and memory highlights.

Recommended future optimization pass:

- Export a Draco/Meshopt-compressed master GLB.
- Convert large textures to KTX2/Basis.
- Split the master scene into staged per-chapter GLBs if first load is too heavy.
- Use LODs for decorative objects.
- Instance repeated decorations if they exist in the Blender scene.

## Favicon

The favicon is registered in `app/layout.jsx` and stored at:

```txt
public/favicon.svg
```

If replacing it, keep the file path the same or update the `metadata.icons` entry.

## Troubleshooting

If the browser shows an old client-side error after a rebuild:

1. Stop the running server.
2. Delete `.next`.
3. Run `npm run build`.
4. Run `npm run start`.
5. Open a fresh URL such as `http://localhost:3000/?fresh=1`.

The earlier `ReactCurrentBatchConfig` crash was caused by an incompatible React/R3F renderer combination. The project now uses the React 19-compatible R3F stack.

## Main Files To Edit

- Change unlock/date behavior: `components/SlotGate.jsx`
- Change chapter order or copy: `data/cinematicTimeline.js`
- Change camera and scene behavior: `components/CinematicExperience.jsx`
- Change memory modal UI: `components/MemoryModal.jsx`
- Change global visual styling: `app/globals.css`
- Change streamed asset paths: `app/api/assets/[kind]/route.js`
