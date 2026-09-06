// Classify a resource video URL into how it should be rendered.
// Pure so it can be self-checked without a DB or browser.

export type VideoView =
  | { kind: "iframe"; src: string } // YouTube/Vimeo embed
  | { kind: "file"; src: string } // direct file / storage URL
  | { kind: "link"; href: string }; // fallback anchor

const YT =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d{6,})/;
const FILE_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)$/;

export function videoView(
  url: string | null | undefined,
): VideoView | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;

  const yt = u.match(YT);
  if (yt) {
    return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  }
  const vm = u.match(VIMEO);
  if (vm) {
    return {
      kind: "iframe",
      src: `https://player.vimeo.com/video/${vm[1]}`,
    };
  }

  const path = u.split("?")[0].toLowerCase();
  const isFile =
    FILE_EXT.test(path) ||
    path.includes("/object/public/resource-videos/");
  if (isFile && /^https?:\/\//i.test(u)) {
    return { kind: "file", src: u };
  }

  if (/^https?:\/\//i.test(u)) return { kind: "link", href: u };
  return null;
}
