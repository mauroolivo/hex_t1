import { SampleVideoCard } from '../features/video/SampleVideoCard';
import {
  type FrameStatus,
  type VideoStatus,
} from '../features/video/sampleVideo';

type SceneControlsPanelProps = {
  cubeCount: number;
  cubeSize: number;
  frameStatus: FrameStatus;
  frameStatusCopy: string;
  hasExtractedFrame: boolean;
  isVideoPlayerOpen: boolean;
  onClearCubes: () => void;
  onClosePlayer: () => void;
  onDownload: () => void | Promise<void>;
  onExtractFrame: () => void | Promise<void>;
  onSetCubeSize: (size: number) => void;
  textureStatusCopy: string;
  videoObjectUrl: string | null;
  videoStatus: VideoStatus;
};

function SceneControlsPanel({
  cubeCount,
  cubeSize,
  frameStatus,
  frameStatusCopy,
  hasExtractedFrame,
  isVideoPlayerOpen,
  onClearCubes,
  onClosePlayer,
  onDownload,
  onExtractFrame,
  onSetCubeSize,
  textureStatusCopy,
  videoObjectUrl,
  videoStatus,
}: SceneControlsPanelProps) {
  return (
    <section className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-4 sm:justify-start sm:p-6">
      <div className="pointer-events-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-4xl border border-white/55 bg-white/72 p-5 shadow-[0_32px_90px_-36px_rgba(15,23,42,0.6)] backdrop-blur-xl sm:max-h-[calc(100vh-3rem)] sm:p-6">
        <p className="text-xs font-semibold tracking-[0.35em] text-slate-500 uppercase">
          Hex Lab
        </p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Three.js cube stage
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
          Click the grid to place cubes.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-[0.25em] text-slate-500 uppercase">
              Cube size
            </span>
            <div className="flex items-center gap-3">
              <input
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-300 accent-emerald-600"
                type="range"
                min="0.5"
                max="4"
                step="0.25"
                value={cubeSize}
                onChange={(event) => {
                  onSetCubeSize(Number.parseFloat(event.target.value));
                }}
              />
              <input
                className="w-24 rounded-2xl border border-slate-300/90 bg-white/90 px-3 py-2 text-sm font-medium text-slate-900 ring-0 transition outline-none focus:border-emerald-500"
                type="number"
                min="0.5"
                max="4"
                step="0.25"
                value={cubeSize}
                onChange={(event) => {
                  const nextValue = Number.parseFloat(event.target.value);

                  if (!Number.isNaN(nextValue)) {
                    onSetCubeSize(nextValue);
                  }
                }}
              />
            </div>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="button"
              onClick={() => {
                onSetCubeSize(1);
              }}
            >
              Use fixed 1x1x1
            </button>
            <button
              className="rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-rose-300 hover:bg-rose-50"
              type="button"
              onClick={onClearCubes}
            >
              Reset stage
            </button>
          </div>

          <div className="grid gap-2 rounded-2xl bg-slate-950/88 px-4 py-4 text-sm text-white shadow-inner shadow-black/10">
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/65">Placed cubes</span>
              <strong className="text-lg font-semibold">{cubeCount}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 text-white/80">
              <span>Current size</span>
              <span>{cubeSize.toFixed(2)}</span>
            </div>
            <div className="text-xs tracking-[0.25em] text-emerald-300/90 uppercase">
              Orbit: rotate, pan, zoom
            </div>
            <p className="text-[11px] leading-5 text-white/72">
              Click-drag to rotate. Cmd-click-drag to pan. Wheel to zoom.
            </p>
          </div>

          <SampleVideoCard
            frameStatus={frameStatus}
            frameStatusCopy={frameStatusCopy}
            hasExtractedFrame={hasExtractedFrame}
            isVideoPlayerOpen={isVideoPlayerOpen}
            onClosePlayer={onClosePlayer}
            onDownload={onDownload}
            onExtractFrame={onExtractFrame}
            textureStatusCopy={textureStatusCopy}
            videoObjectUrl={videoObjectUrl}
            videoStatus={videoStatus}
          />
        </div>
      </div>
    </section>
  );
}

export { SceneControlsPanel };
