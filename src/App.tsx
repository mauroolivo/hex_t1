import { useEffect, useState } from 'react';

import { ThreeStage } from './components/ThreeStage';
import { useSceneStore } from './store/sceneStore';

const SAMPLE_VIDEO = {
  title: 'Chandra short film trailer',
  durationLabel: '01:00',
  formatLabel: 'WEBM',
  sourceLabel: 'Wikimedia Commons',
  creatorLabel: 'Fateme Ahmadi',
  filename: 'chandra-trailer-60s.webm',
  url: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Chandra_-_Short_Film_Trailer.webm',
  sourcePageUrl:
    'https://commons.wikimedia.org/wiki/File:Chandra_-_Short_Film_Trailer.webm',
} as const;

type VideoStatus = 'idle' | 'loading' | 'ready' | 'error';
type FrameStatus = 'idle' | 'extracting' | 'ready' | 'error';
type TextureStatus = 'idle' | 'applied' | 'no-cubes';

type ExtractedFrame = {
  imageUrl: string;
  squareImageUrl: string;
  timeSeconds: number;
};

const VIDEO_STATUS_COPY: Record<VideoStatus, string> = {
  idle: 'Ready to download a 1-minute remote clip.',
  loading: 'Downloading the trailer and preparing the in-app player...',
  ready: 'Downloaded locally. The preview is playing from the downloaded file.',
  error:
    'The video could not be downloaded. Open the source page and try again.',
};

function triggerBrowserDownload(url: string, filename: string) {
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function formatTimestamp(timeSeconds: number) {
  const roundedSeconds = Math.max(0, Math.floor(timeSeconds));
  const minutes = String(Math.floor(roundedSeconds / 60)).padStart(2, '0');
  const seconds = String(roundedSeconds % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function getFrameStatusCopy(
  videoUrl: string | null,
  frameStatus: FrameStatus,
  extractedFrame: ExtractedFrame | null
) {
  if (!videoUrl) {
    return 'Download the video first to unlock frame extraction.';
  }

  if (frameStatus === 'extracting') {
    return 'Extracting a random frame from the downloaded video...';
  }

  if (frameStatus === 'error') {
    return 'Frame extraction failed. Try another random position.';
  }

  if (frameStatus === 'ready' && extractedFrame) {
    return `Random frame extracted at ${formatTimestamp(extractedFrame.timeSeconds)}.`;
  }

  return 'Downloaded video ready for random frame extraction.';
}

function getTextureStatusCopy(textureStatus: TextureStatus) {
  if (textureStatus === 'applied') {
    return 'A centered square crop was applied to the latest cube.';
  }

  if (textureStatus === 'no-cubes') {
    return 'No cubes were present, so the square crop was not applied.';
  }

  return 'Each extracted frame also creates a square texture copy for the latest cube.';
}

function createSquareImageUrl(sourceCanvas: HTMLCanvasElement) {
  const squareSize = Math.min(sourceCanvas.width, sourceCanvas.height);
  const squareCanvas = document.createElement('canvas');
  const squareContext = squareCanvas.getContext('2d');

  if (!squareContext || squareSize <= 0) {
    throw new Error('Square crop failed');
  }

  const offsetX = Math.floor((sourceCanvas.width - squareSize) / 2);
  const offsetY = Math.floor((sourceCanvas.height - squareSize) / 2);

  squareCanvas.width = squareSize;
  squareCanvas.height = squareSize;
  squareContext.drawImage(
    sourceCanvas,
    offsetX,
    offsetY,
    squareSize,
    squareSize,
    0,
    0,
    squareSize,
    squareSize
  );

  return squareCanvas.toDataURL('image/png');
}

function extractRandomFrame(videoUrl: string): Promise<ExtractedFrame> {
  return new Promise((resolve, reject) => {
    const frameVideo = document.createElement('video');
    const frameCanvas = document.createElement('canvas');

    const cleanup = () => {
      frameVideo.pause();
      frameVideo.removeAttribute('src');
      frameVideo.load();
      frameVideo.onloadedmetadata = null;
      frameVideo.onseeked = null;
      frameVideo.onerror = null;
    };

    const fail = () => {
      cleanup();
      reject(new Error('Frame extraction failed'));
    };

    frameVideo.preload = 'auto';
    frameVideo.muted = true;
    frameVideo.playsInline = true;
    frameVideo.onerror = fail;
    frameVideo.onloadedmetadata = () => {
      if (
        !Number.isFinite(frameVideo.duration) ||
        frameVideo.duration <= 0 ||
        frameVideo.videoWidth <= 0 ||
        frameVideo.videoHeight <= 0
      ) {
        fail();

        return;
      }

      const safeEndTime = Math.max(frameVideo.duration - 0.2, 0.1);
      const minimumSeekTime = Math.min(0.05, safeEndTime);
      const randomTimeSeconds =
        minimumSeekTime +
        Math.random() * Math.max(safeEndTime - minimumSeekTime, 0);

      frameVideo.onseeked = () => {
        const context = frameCanvas.getContext('2d');

        if (!context) {
          fail();

          return;
        }

        frameCanvas.width = frameVideo.videoWidth;
        frameCanvas.height = frameVideo.videoHeight;
        context.drawImage(
          frameVideo,
          0,
          0,
          frameCanvas.width,
          frameCanvas.height
        );

        try {
          const imageUrl = frameCanvas.toDataURL('image/png');
          const squareImageUrl = createSquareImageUrl(frameCanvas);

          cleanup();
          resolve({
            imageUrl,
            squareImageUrl,
            timeSeconds: randomTimeSeconds,
          });
        } catch {
          fail();
        }
      };

      frameVideo.currentTime = randomTimeSeconds;
    };
    frameVideo.src = videoUrl;
    frameVideo.load();
  });
}

export default function App() {
  const cubeCount = useSceneStore((state) => state.cubes.length);
  const cubeSize = useSceneStore((state) => state.cubeSize);
  const setCubeSize = useSceneStore((state) => state.setCubeSize);
  const clearCubes = useSceneStore((state) => state.clearCubes);
  const applyTextureToLatestCube = useSceneStore(
    (state) => state.applyTextureToLatestCube
  );
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('idle');
  const [frameStatus, setFrameStatus] = useState<FrameStatus>('idle');
  const [textureStatus, setTextureStatus] = useState<TextureStatus>('idle');
  const [extractedFrame, setExtractedFrame] = useState<ExtractedFrame | null>(
    null
  );

  const frameStatusCopy = getFrameStatusCopy(
    videoObjectUrl,
    frameStatus,
    extractedFrame
  );
  const textureStatusCopy = getTextureStatusCopy(textureStatus);

  useEffect(() => {
    return () => {
      if (videoObjectUrl) {
        URL.revokeObjectURL(videoObjectUrl);
      }
    };
  }, [videoObjectUrl]);

  useEffect(() => {
    if (cubeCount === 0 && textureStatus === 'applied') {
      setTextureStatus('idle');
    }
  }, [cubeCount, textureStatus]);

  const closeVideoPlayer = () => {
    setIsVideoPlayerOpen(false);

    if (!videoObjectUrl) {
      setVideoStatus('idle');
    }
  };

  const closeExtractedFrame = () => {
    setExtractedFrame(null);
    setFrameStatus('idle');
  };

  const handleVideoDownload = async () => {
    setIsVideoPlayerOpen(true);

    if (videoStatus === 'loading') {
      return;
    }

    if (videoObjectUrl) {
      triggerBrowserDownload(videoObjectUrl, SAMPLE_VIDEO.filename);
      setVideoStatus('ready');

      return;
    }

    setVideoStatus('loading');

    try {
      const response = await fetch(SAMPLE_VIDEO.url);

      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
      }

      const videoBlob = await response.blob();
      const nextVideoObjectUrl = URL.createObjectURL(videoBlob);

      setVideoObjectUrl((previousVideoObjectUrl) => {
        if (previousVideoObjectUrl) {
          URL.revokeObjectURL(previousVideoObjectUrl);
        }

        return nextVideoObjectUrl;
      });
      triggerBrowserDownload(nextVideoObjectUrl, SAMPLE_VIDEO.filename);
      setVideoStatus('ready');
    } catch {
      setVideoStatus('error');
    }
  };

  const handleRandomFrameExtraction = async () => {
    if (!videoObjectUrl || frameStatus === 'extracting') {
      return;
    }

    setFrameStatus('extracting');

    try {
      const nextExtractedFrame = await extractRandomFrame(videoObjectUrl);
      const didApplyTexture = applyTextureToLatestCube(
        nextExtractedFrame.squareImageUrl
      );

      setExtractedFrame(nextExtractedFrame);
      setFrameStatus('ready');
      setTextureStatus(didApplyTexture ? 'applied' : 'no-cubes');
    } catch {
      setFrameStatus('error');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f5f8f2_0%,#d7e0d7_42%,#9eb0aa_100%)] text-slate-900">
      <ThreeStage />

      {extractedFrame ? (
        <section className="pointer-events-none absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
          <div className="pointer-events-auto w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-white/70 bg-white/88 text-slate-900 shadow-[0_28px_75px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.3em] text-emerald-700 uppercase">
                  Random frame
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatTimestamp(extractedFrame.timeSeconds)}
                </p>
              </div>
              <button
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                type="button"
                onClick={closeExtractedFrame}
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 p-3">
              <img
                className="block aspect-video w-full rounded-2xl bg-slate-100 object-cover"
                src={extractedFrame.imageUrl}
                alt={`Random frame captured at ${formatTimestamp(extractedFrame.timeSeconds)}`}
              />

              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                <img
                  className="h-16 w-16 rounded-xl border border-slate-200 bg-slate-100 object-cover"
                  src={extractedFrame.squareImageUrl}
                  alt="Square crop prepared for cube texture"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.24em] text-slate-500 uppercase">
                    Cube texture
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {textureStatusCopy}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-4 sm:justify-start sm:p-6">
        <div className="pointer-events-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-4xl border border-white/55 bg-white/72 p-5 shadow-[0_32px_90px_-36px_rgba(15,23,42,0.6)] backdrop-blur-xl sm:max-h-[calc(100vh-3rem)] sm:p-6">
          <p className="text-xs font-semibold tracking-[0.35em] text-slate-500 uppercase">
            Hexagon Lab
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Three.js cube stage
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
            Click the grid to place cubes. Keep the size at 1 for fixed cubes,
            or set any custom size before placing the next one.
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
                    setCubeSize(Number.parseFloat(event.target.value));
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
                      setCubeSize(nextValue);
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
                  setCubeSize(1);
                }}
              >
                Use fixed 1x1x1
              </button>
              <button
                className="rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-rose-300 hover:bg-rose-50"
                type="button"
                onClick={clearCubes}
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

            <div className="grid gap-4 rounded-[28px] border border-emerald-200/80 bg-linear-to-br from-emerald-50/95 via-white/95 to-sky-50/90 p-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.5)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.28em] text-emerald-700 uppercase">
                    Remote video
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-950">
                    {SAMPLE_VIDEO.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {SAMPLE_VIDEO.formatLabel} clip by{' '}
                    {SAMPLE_VIDEO.creatorLabel} via {SAMPLE_VIDEO.sourceLabel}.
                    Length: {SAMPLE_VIDEO.durationLabel}.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase shadow-sm">
                  {SAMPLE_VIDEO.formatLabel}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-wait disabled:bg-emerald-500"
                  type="button"
                  disabled={
                    videoStatus === 'loading' || frameStatus === 'extracting'
                  }
                  onClick={handleVideoDownload}
                >
                  {videoStatus === 'loading'
                    ? 'Downloading video...'
                    : videoObjectUrl
                      ? 'Download again'
                      : 'Download and preview sample video'}
                </button>
                <button
                  className="rounded-2xl border border-emerald-300 bg-white/90 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:border-emerald-400 hover:bg-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                  type="button"
                  disabled={!videoObjectUrl || frameStatus === 'extracting'}
                  onClick={handleRandomFrameExtraction}
                >
                  {frameStatus === 'extracting'
                    ? 'Extracting frame...'
                    : extractedFrame
                      ? 'Extract another frame'
                      : 'Extract random frame'}
                </button>
                {isVideoPlayerOpen ? (
                  <button
                    className="rounded-2xl border border-slate-300 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-white sm:col-span-2"
                    type="button"
                    onClick={closeVideoPlayer}
                  >
                    Hide player
                  </button>
                ) : null}
              </div>

              <div className="grid gap-2 rounded-2xl bg-white/70 px-3 py-3 text-xs leading-5 text-slate-600 shadow-inner shadow-white/50">
                <span>{VIDEO_STATUS_COPY[videoStatus]}</span>
                <span>{frameStatusCopy}</span>
                <span>{textureStatusCopy}</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs leading-5 text-slate-600">
                <a
                  className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 transition hover:text-emerald-700"
                  href={SAMPLE_VIDEO.sourcePageUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Source details
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isVideoPlayerOpen ? (
        <section className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-4 sm:justify-end sm:p-6">
          <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-[30px] border border-white/70 bg-slate-950/92 text-white shadow-[0_32px_90px_-32px_rgba(15,23,42,0.8)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.3em] text-emerald-300 uppercase">
                  Video player
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {SAMPLE_VIDEO.title} · {SAMPLE_VIDEO.durationLabel}
                </p>
              </div>
              <button
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
                type="button"
                onClick={closeVideoPlayer}
              >
                Close
              </button>
            </div>

            <div className="bg-[linear-gradient(180deg,rgba(20,83,45,0.18),rgba(15,23,42,0))] p-3">
              {videoObjectUrl ? (
                <video
                  className="block aspect-video w-full rounded-2xl bg-black object-cover"
                  src={videoObjectUrl}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  onError={() => {
                    setVideoStatus('error');
                  }}
                >
                  Your browser does not support embedded video playback.
                </video>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl bg-black/75 px-6 text-center text-sm leading-6 text-white/72">
                  {VIDEO_STATUS_COPY[videoStatus]}
                </div>
              )}

              <p className="mt-3 text-xs leading-5 text-white/65">
                Downloaded from {SAMPLE_VIDEO.sourceLabel}. Source credit:{' '}
                {SAMPLE_VIDEO.creatorLabel}.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
