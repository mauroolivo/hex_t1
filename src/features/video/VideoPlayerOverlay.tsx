import {
  SAMPLE_VIDEO,
  VIDEO_STATUS_COPY,
  type VideoStatus,
} from './sampleVideo';

type VideoPlayerOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  onVideoError: () => void;
  videoObjectUrl: string | null;
  videoStatus: VideoStatus;
};

function VideoPlayerOverlay({
  isOpen,
  onClose,
  onVideoError,
  videoObjectUrl,
  videoStatus,
}: VideoPlayerOverlayProps) {
  if (!isOpen) {
    return null;
  }

  return (
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
            onClick={onClose}
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
              onError={onVideoError}
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
  );
}

export { VideoPlayerOverlay };
