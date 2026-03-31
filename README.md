# Hex Lab

Hex Lab is a small interactive Three.js playground built with React, TypeScript, and Vite. It lets you place cubes on a 3D stage, change their size before placement, download and preview a sample video in-app, extract a random frame from that video, and apply a square crop of the extracted frame as a texture on the latest cube.

## Main Features

- Interactive 3D stage with click-to-place cubes.
- Adjustable cube size with both slider and numeric input.
- Quick reset to fixed `1x1x1` cube size.
- Stage reset to clear all cubes.
- Orbit controls for rotate, pan, and zoom.
- In-app video download and preview for a remote one-minute sample clip.
- Random frame extraction from the downloaded video.
- Automatic centered square crop generation.
- Square crop applied as a texture to the latest cube when one exists.
- Production bundle split so Three.js code stays under the default Vite chunk warning threshold.

## Stack

- React 19
- TypeScript
- Vite 8
- Three.js
- Zustand
- Tailwind CSS v4

## Installation

### Prerequisites

Use a recent Node.js version with `npm` available.

### Install Dependencies

```bash
npm install
```

### Start The Development Server

```bash
npm run dev
```

Vite will print a local URL in the terminal, usually `http://localhost:5173`.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

- `npm run dev`: starts the local development server.
- `npm run build`: creates a production build in `dist/`.
- `npm run preview`: serves the production build locally.
- `npm run lint`: runs ESLint across the project.

## How To Use

1. Start the app with `npm run dev`.
2. Click the ground grid to place cubes in the scene.
3. Change the cube size before placing the next cube using the slider or number input.
4. Use `Use fixed 1x1x1` to snap back to the default cube size.
5. Use `Reset stage` to remove all cubes.
6. Use the video panel to download and preview the sample trailer.
7. Click `Extract random frame` to capture a frame from a random timestamp.
8. After extraction, the full frame appears in the top-right preview and a square crop is prepared as a cube texture.
9. If at least one cube exists, that square crop is applied to the latest cube automatically.

## Project Structure

```text
src/
  App.tsx                        App composition root
  components/
    SceneControlsPanel.tsx       Scene controls and main overlay panel
    ThreeStage.tsx               Three.js scene, renderer, and mesh syncing
  features/
    video/
      sampleVideo.ts             Video metadata and frame extraction helpers
      useSampleVideo.ts          Video workflow state and actions
      SampleVideoCard.tsx        Video controls card
      VideoPlayerOverlay.tsx     Bottom video player overlay
      ExtractedFramePreview.tsx  Extracted frame preview overlay
  store/
    sceneStore.ts                Zustand scene state and cube actions
```

## Notes

- The sample video is `Chandra short film trailer` from Wikimedia Commons.
- If you extract a frame before any cube is present, the frame preview still works, but no texture is applied.
- The Three.js stage is lazy-loaded, and the production build uses manual chunking in Vite to keep bundle sizes under control.

## Build Status

The project has been verified with:

```bash
npm run lint
npm run build
```
