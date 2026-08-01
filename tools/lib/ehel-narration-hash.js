// The naming scheme for pre-generated course narration, shared by every subject.
//
// A clip is stored as cyrb53(button text).mp3 and looked up the same way by the
// course UI at play time. Text in, filename out — so this and the copy in each
// subject's shared/course-ui.js must stay byte-identical. The per-subject
// check-…-audio-coverage run enforces that.

// cyrb53 — identical to the copy in each subject's shared/course-ui.js.
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

// The UI normalises a button's text the same way before hashing.
const clean = (t) => String(t || "").replace(/\s+/g, " ").trim();

// Clips shorter than this are not worth a request.
const MIN_CHARS = 8;

module.exports = { cyrb53, clean, MIN_CHARS };
