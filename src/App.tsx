import { lazy, Suspense } from 'react';

import { SceneControlsPanel } from './components/SceneControlsPanel';
import { ExtractedFramePreview } from './features/video/ExtractedFramePreview';
import { VideoPlayerOverlay } from './features/video/VideoPlayerOverlay';
import { useSampleVideo } from './features/video/useSampleVideo';
import { useSceneStore } from './store/sceneStore';

const LazyThreeStage = lazy(() => import('./components/ThreeStage'));

export default function App() {
  const cubeCount = useSceneStore((state) => state.cubes.length);
  const cubeSize = useSceneStore((state) => state.cubeSize);
  const setCubeSize = useSceneStore((state) => state.setCubeSize);
  const clearCubes = useSceneStore((state) => state.clearCubes);
  const applyTextureToLatestCube = useSceneStore(
    (state) => state.applyTextureToLatestCube
  );
  const {
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
  } = useSampleVideo({
    applyTextureToLatestCube,
    cubeCount,
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f5f8f2_0%,#d7e0d7_42%,#9eb0aa_100%)] text-slate-900">
      <Suspense
        fallback={
          <div className="absolute inset-0">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_44%)]" />
          </div>
        }
      >
        <LazyThreeStage />
      </Suspense>

      <ExtractedFramePreview
        extractedFrame={extractedFrame}
        textureStatusCopy={textureStatusCopy}
        onClose={closeExtractedFrame}
      />

      <SceneControlsPanel
        cubeCount={cubeCount}
        cubeSize={cubeSize}
        frameStatus={frameStatus}
        frameStatusCopy={frameStatusCopy}
        hasExtractedFrame={extractedFrame !== null}
        isVideoPlayerOpen={isVideoPlayerOpen}
        onClearCubes={clearCubes}
        onClosePlayer={closeVideoPlayer}
        onDownload={handleVideoDownload}
        onExtractFrame={handleRandomFrameExtraction}
        onSetCubeSize={setCubeSize}
        textureStatusCopy={textureStatusCopy}
        videoObjectUrl={videoObjectUrl}
        videoStatus={videoStatus}
      />

      <VideoPlayerOverlay
        isOpen={isVideoPlayerOpen}
        onClose={closeVideoPlayer}
        onVideoError={handleVideoPlaybackError}
        videoObjectUrl={videoObjectUrl}
        videoStatus={videoStatus}
      />
    </main>
  );
}
