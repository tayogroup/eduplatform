// Pre-render the picture books' narration, one clip per PAGE.
//
//   node tools/generate-ehel-english-ebook-audio.js --dry          characters and cost, nothing sent
//   node tools/generate-ehel-english-ebook-audio.js --grade 1      that grade's books
//   node tools/generate-ehel-english-ebook-audio.js --grade 1 --limit 20
//
// WHY THIS EXISTS, and what it reverses. CLAUDE.md records the original
// decision: "Book narration is runtime TTS, not pre-rendered clips ... so a new
// book costs nothing to generate." Owner decision 2026-09-08 to pre-render it
// instead, and the arithmetic supports it rather than merely permitting it:
// runtime TTS bills EVERY PLAY, so a book read by thirty children is thirty
// renders of the same page, for ever. This is one render, once.
//
// Measured before writing a byte: Grade 1 is 76 books, 910 pages, 44,553
// characters - about $13 at $0.30/1k. The whole catalogue is 286 books, 3,430
// pages, 234,545 characters, about $70.
//
// IT ALSO MAKES THE READ-ALONG EXACT. A page spoken by the runtime voice can
// only be followed by polling "has it stopped talking yet"; a pre-rendered clip
// has a duration, so the caption highlight can use the same character-share
// estimate the unit readings use (english.js :: startNarrationSync), and the
// two reading surfaces behave the same way.
//
// Clips land BESIDE the artwork - ebooks/<book-id>/page-NN.mp3 next to
// page-NN.svg - because a book belongs to several grades at once and its
// narration should not be filed under one of them. ebookAsset() already
// resolves that directory in dev and on the CDN alike, so nothing new has to
// be deployed or wired.
//
// Idempotent: a page whose clip already exists and is non-trivially sized is
// skipped, so a re-run costs nothing. --force re-renders.
const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
for (const line of fs.readFileSync(path.join(REPO, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}
const { tts, VOICE_ID, MODEL_ID } = require(path.join(REPO, "tools/lib/ehel-tts.js"));

const SHELL = path.join(REPO, "src/prototypes/ehel-academy/shell/subjects/english.js");
const EBOOKS = path.join(REPO, "src/prototypes/ehel-academy/english/ebooks");

const argv = process.argv.slice(2);
const known = new Set(["--dry", "--force", "--grade", "--limit"]);
for (const a of argv) {
  if (a.startsWith("--") && !known.has(a)) {
    // An unrecognised flag must never fall through to "do everything": this is
    // billed per character, and the other generators refuse for the same reason.
    console.error(`Unknown argument ${a}. Use --dry, --grade N, --limit N, --force.`);
    process.exit(2);
  }
}
const dry = argv.includes("--dry");
const force = argv.includes("--force");
const grade = argv.includes("--grade") ? Number(argv[argv.indexOf("--grade") + 1]) : null;
const limit = argv.includes("--limit") ? Number(argv[argv.indexOf("--limit") + 1]) : Infinity;

// The catalogue, read out of the shell by the same bracket-balance the build
// uses - it is a non-exported const in a file too DOM-dependent to import.
function catalogue() {
  const src = fs.readFileSync(SHELL, "utf8");
  const marker = "const ebookCatalog = [";
  const start = src.indexOf(marker);
  if (start < 0) throw new Error("ebookCatalog not found in english.js");
  let i = start + marker.length - 1, depth = 0, end = -1;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === "[") depth++;
    else if (c === "]") { depth--; if (depth === 0) { end = i; break; } }
  }
  return new Function("return " + src.slice(start + marker.length - 1, end + 1))();
}

const pad = (n) => String(n).padStart(2, "0");

(async () => {
  const books = catalogue().filter((b) => (grade == null || (b.grades || []).includes(grade)));
  const jobs = [];
  let chars = 0, skipped = 0, blank = 0;

  for (const book of books) {
    book.pages.forEach((page, i) => {
      const text = String(page.text || "").trim();
      // A title page or a wordless spread has nothing to say. Counted and
      // reported rather than silently passed over.
      if (!text) { blank++; return; }
      const file = path.join(EBOOKS, book.id, `page-${pad(i + 1)}.mp3`);
      if (!force && fs.existsSync(file) && fs.statSync(file).size > 1024) { skipped++; return; }
      jobs.push({ book: book.id, page: i + 1, text, file });
      chars += text.length;
    });
  }

  console.log(`\n  Picture-book narration${grade ? `, Grade ${grade}` : ", whole catalogue"}`);
  console.log(`  ${books.length} books | ${jobs.length} pages to render | ${skipped} already done | ${blank} with no text`);
  console.log(`  ${chars.toLocaleString()} characters  ~$${(chars * 0.3 / 1000).toFixed(2)} at $0.30/1k`);
  console.log(`  voice ${VOICE_ID} | model ${MODEL_ID}\n`);
  if (dry) { console.log("  --dry: nothing sent.\n"); return; }
  if (!jobs.length) { console.log("  Nothing to do.\n"); return; }

  let done = 0, failed = 0;
  for (const job of jobs.slice(0, limit)) {
    fs.mkdirSync(path.dirname(job.file), { recursive: true });
    try {
      const buf = await tts(job.text);
      fs.writeFileSync(job.file, buf);
      done++;
      if (done % 25 === 0) console.log(`    ${done}/${Math.min(jobs.length, limit)}…`);
    } catch (e) {
      failed++;
      console.error(`    FAILED ${job.book} page ${job.page}: ${String(e.message).slice(0, 120)}`);
      // Stop on a run of failures rather than burning the key against a wall.
      if (failed > 5) { console.error("    too many failures - stopping."); break; }
    }
  }
  console.log(`\n  wrote ${done} clip(s), ${failed} failed.\n`);
})();
