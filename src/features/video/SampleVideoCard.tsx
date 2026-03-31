import {
  type FrameStatus,
  type VideoStatus,
  SAMPLE_VIDEO,
  VIDEO_STATUS_COPY,
} from './sampleVideo';

type SampleVideoCardProps = {
  frameStatus: FrameStatus;
  frameStatusCopy: string;
  hasExtractedFrame: boolean;
  isVideoPlayerOpen: boolean;
  onClosePlayer: () => void;
  onDownload: () => void | Promise<void>;
  onExtractFrame: () => void | Promise<void>;
  textureStatusCopy: string;
  videoObjectUrl: string | null;
  videoStatus: VideoStatus;
};

function SampleVideoCard({
  frameStatus,
  frameStatusCopy,
  hasExtractedFrame,
  isVideoPlayerOpen,
  onClosePlayer,
  onDownload,
  onExtractFrame,
  textureStatusCopy,
  videoObjectUrl,
  videoStatus,
}: SampleVideoCardProps) {
  const downloadLabel =
    videoStatus === 'loading'
      ? 'Downloading video...'
      : videoObjectUrl
        ? 'Download again'
        : 'Download and preview sample video';
  const extractLabel =
    frameStatus === 'extracting'
      ? 'Extracting frame...'
      : hasExtractedFrame
        ? 'Extract another frame'
        : 'Extract random frame';

  return (
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
            {SAMPLE_VIDEO.formatLabel} clip by {SAMPLE_VIDEO.creatorLabel} via{' '}
            {SAMPLE_VIDEO.sourceLabel}. Length: {SAMPLE_VIDEO.durationLabel}.
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
          disabled={videoStatus === 'loading' || frameStatus === 'extracting'}
          onClick={onDownload}
        >
          {downloadLabel}
        </button>
        <button
          className="rounded-2xl border border-emerald-300 bg-white/90 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:border-emerald-400 hover:bg-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          type="button"
          disabled={!videoObjectUrl || frameStatus === 'extracting'}
          onClick={onExtractFrame}
        >
          {extractLabel}
        </button>
      </div>

      <div className="grid gap-2 rounded-2xl bg-white/70 px-3 py-3 text-xs leading-5 text-slate-600 shadow-inner shadow-white/50">
        <span>{VIDEO_STATUS_COPY[videoStatus]}</span>
        <span>{frameStatusCopy}</span>
        <span>{textureStatusCopy}</span>
      </div>

    </div>
  );
}

export { SampleVideoCard };
