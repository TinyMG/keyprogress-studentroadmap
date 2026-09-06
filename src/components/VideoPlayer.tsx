import { videoView } from "../logic/video";

export default function VideoPlayer({ url }: { url: string }) {
  const v = videoView(url);
  if (!v) return null;
  if (v.kind === "iframe") {
    return (
      <iframe
        src={v.src}
        className="aspect-video w-full rounded-lg border border-slate-200"
        allow="accelerometer; encrypted-media; picture-in-picture"
        allowFullScreen
        title="Resource video"
      />
    );
  }
  if (v.kind === "file") {
    return (
      <video
        src={v.src}
        controls
        className="w-full rounded-lg border border-slate-200"
      />
    );
  }
  return (
    <a
      href={v.href}
      target="_blank"
      rel="noreferrer"
      className="text-sm font-medium text-brand-600 hover:underline"
    >
      Open video ↗
    </a>
  );
}
