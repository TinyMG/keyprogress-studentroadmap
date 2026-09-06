import assert from "node:assert/strict";
import { videoView } from "./video.ts";

// Nothing -> null
assert.equal(videoView(null), null);
assert.equal(videoView(undefined), null);
assert.equal(videoView(""), null);
assert.equal(videoView("   "), null);
assert.equal(videoView("not a url"), null);

// YouTube long + short + shorts -> iframe embed
assert.deepEqual(videoView("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), {
  kind: "iframe",
  src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
});
assert.deepEqual(videoView("https://youtu.be/dQw4w9WgXcQ?t=42"), {
  kind: "iframe",
  src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
});
assert.deepEqual(
  videoView("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
  {
    kind: "iframe",
    src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
);

// Vimeo -> player embed
assert.deepEqual(videoView("https://vimeo.com/123456789"), {
  kind: "iframe",
  src: "https://player.vimeo.com/video/123456789",
});
assert.deepEqual(videoView("https://vimeo.com/video/123456789"), {
  kind: "iframe",
  src: "https://player.vimeo.com/video/123456789",
});

// Direct video files -> <video>
assert.deepEqual(videoView("https://x.com/a/b/c.mp4"), {
  kind: "file",
  src: "https://x.com/a/b/c.mp4",
});
assert.deepEqual(videoView("https://x.com/clip.webm?dl=1"), {
  kind: "file",
  src: "https://x.com/clip.webm?dl=1",
});

// Supabase storage object (even without a known extension) -> <video>
assert.deepEqual(
  videoView(
    "https://proj.supabase.co/storage/v1/object/public/" +
      "resource-videos/videos/123-lesson",
  ),
  { kind: "file", src: "https://proj.supabase.co/storage/v1/object/public/resource-videos/videos/123-lesson" },
);

// Other http(s) URL -> plain link
assert.deepEqual(videoView("https://example.com/lesson-page"), {
  kind: "link",
  href: "https://example.com/lesson-page",
});

console.log("video.test: all assertions passed");
