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

export {
  SAMPLE_VIDEO,
  VIDEO_STATUS_COPY,
  extractRandomFrame,
  formatTimestamp,
  getFrameStatusCopy,
  getTextureStatusCopy,
  triggerBrowserDownload,
};
export type { ExtractedFrame, FrameStatus, TextureStatus, VideoStatus };
