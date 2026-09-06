/* Execute each composed lesson's JS and compare against the SHIPPED original.
 *
 * A static dangling-name check produced only false positives (it cannot see
 * function parameters), so the code is run instead. The DOM stub is
 * deliberately incomplete, which means the run stops somewhere in every file -
 * so the stop on its own says nothing.
 *
 * The control is what makes it evidence: each composed lesson is compared with
 * the shipped original it was built from, through the identical harness. A
 * failure both produce is the stub's fault. A failure only the composed file
 * produces is the composition's fault, which is the only question being asked.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const SP = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const V2 = path.join(SP, "g1v2");

function stub(name) {
  const t = function () { return stub(name); };
  t.nodeName = name; t.style = {}; t.dataset = {};
  t.classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
  t.textContent = ""; t.innerHTML = ""; t.value = ""; t.hidden = false;
  t.disabled = false; t.className = ""; t.children = [];
  return new Proxy(t, {
    get(o, k) {
      if (k === Symbol.iterator) return [][Symbol.iterator].bind([]);
      if (k === "length") return 0;
      if (k === "then") return undefined;
      if (k in o) return o[k];
      return stub(name + "." + String(k));
    },
    set() { return true; },
    apply() { return stub(name + "()"); },
  });
}

function run(dir, f) {
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  const js = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
  const doc = stub("document");
  const box = {
    console: { log() {}, warn() {}, error() {} },
    document: new Proxy(doc, {
      get(o, k) {
        if (k === "getElementById" || k === "querySelector" || k === "createElement") return () => stub("el");
        if (k === "querySelectorAll" || k === "getElementsByClassName") return () => [];
        if (k === "addEventListener" || k === "removeEventListener") return () => {};
        if (k === "body" || k === "documentElement" || k === "head") return stub("body");
        if (k === "title") return "";
        return stub("document." + String(k));
      },
      set() { return true; },
    }),
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    speechSynthesis: stub("speechSynthesis"),
    SpeechSynthesisUtterance: function () { return stub("u"); },
    location: { href: "", search: "", origin: "https://x", protocol: "https:", reload() {} },
    navigator: { userAgent: "node", language: "en-GB", mediaDevices: stub("md") },
    fetch: () => Promise.resolve({ ok: false, json: async () => ({}), text: async () => "" }),
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    URL, URLSearchParams, Math, Date, JSON, Promise, Set, Map, Array, Object, String, Number,
    Audio: function () { return stub("audio"); },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    performance: { now: () => 0 },
    scrollTo() {}, scrollBy() {}, scroll() {}, focus() {}, blur() {},
    alert() {}, confirm: () => true, print() {}, open: () => null,
    innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
    addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true,
    crypto: { getRandomValues: (a) => a, randomUUID: () => "x" },
    MutationObserver: function () { return { observe() {}, disconnect() {}, takeRecords: () => [] }; },
    IntersectionObserver: function () { return { observe() {}, disconnect() {} }; },
    ResizeObserver: function () { return { observe() {}, disconnect() {} }; },
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    AbortController: function () { return { abort() {}, signal: {} }; },
    CustomEvent: function () { return {}; }, Event: function () { return {}; },
    btoa: (x) => Buffer.from(String(x)).toString("base64"),
    atob: (x) => Buffer.from(String(x), "base64").toString(),
    DOMParser: function () { return { parseFromString: () => stub("doc") }; },
    XMLSerializer: function () { return { serializeToString: () => "" }; },
    Image: function () { return stub("img"); },
    Blob: function () { return {}; },
    FileReader: function () { return stub("fr"); },
    SpeechRecognition: function () { return stub("sr"); },
    webkitSpeechRecognition: function () { return stub("sr"); },
    AudioContext: function () { return stub("ac"); },
    webkitAudioContext: function () { return stub("ac"); },
    HTMLElement: function () {}, Node: function () {}, Element: function () {},
  };
  box.window = box;
  box.globalThis = box;
  try {
    vm.createContext(box);
    new vm.Script(js, { filename: f }).runInContext(box, { timeout: 20000 });
    return null;
  } catch (e) {
    return String(e.message);
  }
}

const PAIRS = [
  ["counting-to-twenty.html", "up-to-twenty.html"],
  ["adding-and-taking-away.html", "up-to-twenty.html"],
  ["halves-and-wholes.html", "halves-and-wholes.html"],
  ["what-comes-next.html", "what-comes-next.html"],
  ["shapes-and-sizes.html", "shapes-and-sizes.html"],
  ["days-months-and-clocks.html", "shapes-and-sizes.html"],
  ["asking-and-sorting.html", "asking-and-sorting.html"],
];

let bad = 0;
for (const [out, base] of PAIRS) {
  const a = run(V2, out);
  const b = run(SP, base);
  const real = a !== null && a !== b;
  if (real) bad++;
  const note = a === null ? "ran to completion"
    : a === b ? "stops exactly where the shipped " + base.replace(".html", "") + " stops (harness limit)"
      : "NEW FAILURE the original does not have: " + a.slice(0, 78);
  console.log((real ? "XX " : "   ") + out.padEnd(31) + note);
}
console.log("\n" + (bad
  ? bad + " composed lesson(s) fail in a way their original does not"
  : "no composed lesson fails in any way its shipped original does not"));
process.exitCode = bad ? 1 : 0;
