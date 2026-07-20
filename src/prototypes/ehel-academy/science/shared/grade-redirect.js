const stage = Number(document.documentElement.dataset.stage || document.documentElement.dataset.grade);
const target = new URL("../", location.href);
target.search = location.search;
target.searchParams.set("stage", stage);
if (!target.searchParams.has("unit")) target.searchParams.set("unit", 1);
target.hash = location.hash || "overview";
location.replace(target.href);
