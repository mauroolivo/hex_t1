const VIDEO_ID = '5S0o7uuKJo8';
const VIDEO_START_SECONDS = 403;

function buildPlayerUrl() {
  const url = new URL(`https://www.youtube.com/embed/${VIDEO_ID}`);

  url.searchParams.set('start', String(VIDEO_START_SECONDS));
  url.searchParams.set('playsinline', '1');
  url.searchParams.set('rel', '0');
  url.searchParams.set('modestbranding', '1');

  return url.toString();
}

export function YouTubePlayerCard() {
  const playerUrl = buildPlayerUrl();

  return (
    <section className="grid gap-3 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/75 p-3 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.5)]">
      <p className="text-xs font-semibold tracking-[0.25em] text-slate-500 uppercase">
        YouTube
      </p>
      <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-inner ring-1 shadow-black/25 ring-black/8">
        <div className="aspect-video">
          <iframe
            className="h-full w-full"
            src={playerUrl}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  );
}
