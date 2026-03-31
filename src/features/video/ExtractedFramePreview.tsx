import { type ExtractedFrame, formatTimestamp } from './sampleVideo';

type ExtractedFramePreviewProps = {
  extractedFrame: ExtractedFrame | null;
  textureStatusCopy: string;
  onClose: () => void;
};

function ExtractedFramePreview({
  extractedFrame,
  textureStatusCopy,
  onClose,
}: ExtractedFramePreviewProps) {
  if (!extractedFrame) {
    return null;
  }

  return (
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
            onClick={onClose}
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
  );
}

export { ExtractedFramePreview };
