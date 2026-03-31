import { useEffect, useState } from 'react';

import {
  type ExtractedFrame,
  type FrameStatus,
  type TextureStatus,
  type VideoStatus,
  SAMPLE_VIDEO,
  extractRandomFrame,
  getFrameStatusCopy,
  getTextureStatusCopy,
  triggerBrowserDownload,
} from './sampleVideo';

type UseSampleVideoOptions = {
  applyTextureToLatestCube: (textureUrl: string) => boolean;
  cubeCount: number;
};

function useSampleVideo({
  applyTextureToLatestCube,
  cubeCount,
}: UseSampleVideoOptions) {
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

      setVideoObjectUrl(nextVideoObjectUrl);
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

  const handleVideoPlaybackError = () => {
    setVideoStatus('error');
  };

  return {
    closeExtractedFrame,
    closeVideoPlayer,
    extractedFrame,
    frameStatus,
    frameStatusCopy,
    handleRandomFrameExtraction,
    handleVideoDownload,
    handleVideoPlaybackError,
    isVideoPlayerOpen,
    textureStatusCopy,
    videoObjectUrl,
    videoStatus,
  };
}

export { useSampleVideo };
