const grade = Number(document.documentElement.dataset.grade);
const target = new URL("../", location.href);
target.search = location.search;
target.searchParams.set("grade", grade);
if (!target.searchParams.has("unit")) target.searchParams.set("unit", grade === 1 ? 0 : 1);
target.hash = location.hash || "overview";
location.replace(target.href);
