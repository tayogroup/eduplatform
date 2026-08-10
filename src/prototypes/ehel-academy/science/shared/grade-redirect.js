const stage = Number(document.documentElement.dataset.stage || document.documentElement.dataset.grade);
// "../index.html", not "../". They serve the same bytes but they are two
// different objects at the edge, and only the filename form tracks releases:
// the directory form pins itself to whatever release was current the first time
// anyone asked for it, and English's sat twenty-one versions behind for days,
// through six purges, because Perma-Cache does not clear on an ordinary one.
// Naming the file keeps every per-stage link on the pointer that moves.
const target = new URL("../index.html", location.href);
target.search = location.search;
target.searchParams.set("stage", stage);
if (!target.searchParams.has("unit")) target.searchParams.set("unit", 1);
target.hash = location.hash || "overview";
location.replace(target.href);
