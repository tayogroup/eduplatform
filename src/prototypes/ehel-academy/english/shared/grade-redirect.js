const grade = Number(document.documentElement.dataset.grade);
// "../index.html", not "../". They serve the same bytes but they are two
// different objects at the edge, and only the filename form is on the short
// cache tier: the directory form fell to the 30-day default and pinned itself
// to whatever release was current the first time anyone asked for it. On
// 2026-08-10 that was v122, twenty-one releases behind, and six purges did not
// shift it — it is held in Perma-Cache, which an ordinary purge does not clear.
// Naming the file keeps every per-grade link on the pointer that actually
// tracks releases.
const target = new URL("../index.html", location.href);
target.search = location.search;
target.searchParams.set("grade", grade);
if (!target.searchParams.has("unit")) target.searchParams.set("unit", grade === 1 ? 0 : 1);
target.hash = location.hash || "overview";
location.replace(target.href);
