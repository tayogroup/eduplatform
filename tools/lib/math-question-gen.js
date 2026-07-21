// Procedural math question generator. Produces genuine, stage-scaled
// multiple-choice questions whose answers are computed (correct by
// construction) with plausible near-miss distractors. Deterministic per unit
// via a seeded RNG so rebuilds are stable.

// --- seeded RNG (mulberry32) ---
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const seedFrom = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

// Build a question from a numeric answer with unique near-miss distractors.
function numericMcq(rng, question, answer, explanation, distractorSet) {
  const opts = new Set([String(answer)]);
  const pool = [...distractorSet].map(String).filter((d) => d !== String(answer));
  for (const d of pool) { if (opts.size >= 4) break; opts.add(d); }
  // Top up with small offsets if needed.
  let delta = 1;
  while (opts.size < 4) { const cand = String(Number(answer) + delta); if (Number(answer) + delta >= 0 && !opts.has(cand)) opts.add(cand); delta = delta > 0 ? -delta : -delta + 1; }
  const arr = [...opts].slice(0, 4);
  // deterministic shuffle
  const rot = Math.floor(rng() * arr.length);
  return { question, options: arr.slice(rot).concat(arr.slice(0, rot)), answer: String(answer), explanation };
}
function choiceMcq(rng, question, answer, distractors, explanation) {
  const opts = [String(answer), ...distractors.map(String).filter((d) => d !== String(answer))].slice(0, 4);
  const rot = Math.floor(rng() * opts.length);
  return { question, options: opts.slice(rot).concat(opts.slice(0, rot)), answer: String(answer), explanation };
}

// Stage-appropriate magnitudes.
function maxFor(stage) { return [0, 20, 100, 1000, 10000, 100000, 1000000, 1000000, 1000000][stage] || 1000; }

// ---- topic generators: each returns an MCQ ----
const G = {
  number(rng, stage) {
    const kind = pick(rng, ["place", "compare", "round", "order"]);
    if (kind === "place") {
      const digits = Math.min(5, Math.max(2, stage));
      // Require a digit that is nonzero and appears exactly once, so the
      // question is unambiguous.
      let n, pos, d;
      for (let tries = 0; tries < 20; tries += 1) {
        n = randInt(rng, 10 ** (digits - 1), 10 ** digits - 1);
        pos = randInt(rng, 0, String(n).length - 1);
        d = Number(String(n)[pos]);
        if (d !== 0 && String(n).split(String(d)).length === 2) break;
        d = 0;
      }
      if (!d) return null;
      const value = d * 10 ** (String(n).length - 1 - pos);
      return numericMcq(rng, `In the number ${n.toLocaleString("en")}, what is the value of the digit ${d}?`, value, `${d} is in the ${["ones","tens","hundreds","thousands","ten thousands"][String(n).length-1-pos]} place, so it is worth ${value.toLocaleString("en")}.`, [d, value * 10, Math.max(1, Math.round(value / 10)), d * 10]);
    }
    if (kind === "compare") {
      const a = randInt(rng, 10, maxFor(stage));
      let b = randInt(rng, 10, maxFor(stage));
      if (b === a) b = a + randInt(rng, 1, 9);
      const ans = Math.max(a, b);
      return choiceMcq(rng, `Which number is greater: ${a.toLocaleString("en")} or ${b.toLocaleString("en")}?`, ans.toLocaleString("en"), [Math.min(a, b).toLocaleString("en"), "They are equal", (ans + 1).toLocaleString("en")], `${Math.max(a,b).toLocaleString("en")} is greater than ${Math.min(a,b).toLocaleString("en")}.`);
    }
    if (kind === "round") {
      const to = pick(rng, stage <= 2 ? [10] : [10, 100]);
      const n = randInt(rng, to, maxFor(stage));
      const ans = Math.round(n / to) * to;
      return numericMcq(rng, `Round ${n.toLocaleString("en")} to the nearest ${to}.`, ans, `${n} rounds to ${ans.toLocaleString("en")} — look at the ${to === 10 ? "ones" : "tens"} digit.`, [ans + to, ans - to, Math.floor(n / to) * to]);
    }
    // order: next number
    const n = randInt(rng, 5, maxFor(stage) - 1);
    return numericMcq(rng, `What number comes just after ${n.toLocaleString("en")}?`, n + 1, `Counting on one from ${n.toLocaleString("en")} gives ${(n+1).toLocaleString("en")}.`, [n - 1, n + 2, n + 10]);
  },
  calculation(rng, stage) {
    const op = pick(rng, ["+", "−", "×", "÷"]);
    const cap = Math.min(maxFor(stage), stage <= 2 ? 100 : 10000);
    if (op === "+") { const a = randInt(rng, 2, cap), b = randInt(rng, 2, cap); return numericMcq(rng, `Work out ${a.toLocaleString("en")} + ${b.toLocaleString("en")}.`, a + b, `${a.toLocaleString("en")} + ${b.toLocaleString("en")} = ${(a+b).toLocaleString("en")}.`, [a + b + 1, a + b - 1, a + b + 10, Math.abs(a - b)]); }
    if (op === "−") { const a = randInt(rng, 5, cap), b = randInt(rng, 1, a); return numericMcq(rng, `Work out ${a.toLocaleString("en")} − ${b.toLocaleString("en")}.`, a - b, `${a.toLocaleString("en")} − ${b.toLocaleString("en")} = ${(a-b).toLocaleString("en")}.`, [a - b + 1, a - b - 1, a + b, a - b + 10]); }
    if (op === "×") { const a = randInt(rng, 2, stage <= 3 ? 12 : 20), b = randInt(rng, 2, stage <= 3 ? 12 : 99); return numericMcq(rng, `Work out ${a} × ${b}.`, a * b, `${a} × ${b} = ${a*b}.`, [a * b + a, a * b - a, a * (b + 1), a + b]); }
    const b = randInt(rng, 2, 12), q = randInt(rng, 2, stage <= 3 ? 12 : 50), a = b * q;
    return numericMcq(rng, `Work out ${a} ÷ ${b}.`, q, `${a} ÷ ${b} = ${q} because ${b} × ${q} = ${a}.`, [q + 1, q - 1, a - b, q + b]);
  },
  fractions(rng, stage) {
    const kind = pick(rng, ["of", "compare", "equiv"]);
    if (kind === "of") { const den = pick(rng, [2, 3, 4, 5, 10]); const mult = randInt(rng, 2, stage <= 3 ? 8 : 20); const whole = den * mult; const ans = whole / den; return numericMcq(rng, `What is 1/${den} of ${whole}?`, ans, `Divide ${whole} into ${den} equal parts: ${whole} ÷ ${den} = ${ans}.`, [ans + den, whole - ans, den, ans * 2]); }
    if (kind === "compare") { return choiceMcq(rng, `Which fraction is larger: 1/2 or 1/4?`, "1/2", ["1/4", "They are equal", "1/8"], `Halves are bigger than quarters, so 1/2 is larger than 1/4.`); }
    return choiceMcq(rng, `Which fraction is equivalent to 1/2?`, "2/4", ["1/4", "2/3", "3/4"], `2/4 simplifies to 1/2, so they are equivalent.`);
  },
  measure(rng, stage) {
    const kind = pick(rng, ["area", "perimeter", "convert"]);
    if (kind === "area") { const w = randInt(rng, 2, stage <= 3 ? 9 : 20), h = randInt(rng, 2, stage <= 3 ? 9 : 20); return numericMcq(rng, `A rectangle is ${w} cm wide and ${h} cm tall. What is its area in square centimetres?`, w * h, `Area = width × height = ${w} × ${h} = ${w*h}.`, [2 * (w + h), w + h, w * h + w, w * h - h]); }
    if (kind === "perimeter") { const w = randInt(rng, 2, 20), h = randInt(rng, 2, 20); return numericMcq(rng, `A rectangle is ${w} cm wide and ${h} cm tall. What is its perimeter in centimetres?`, 2 * (w + h), `Perimeter = 2 × (width + height) = 2 × (${w} + ${h}) = ${2*(w+h)}.`, [w * h, w + h, 2 * (w + h) + 2]); }
    const kinds = [["metres", "centimetres", 100], ["kilograms", "grams", 1000], ["litres", "millilitres", 1000]];
    const [big, small, factor] = pick(rng, kinds); const n = randInt(rng, 2, 9);
    return numericMcq(rng, `How many ${small} are in ${n} ${big}?`, n * factor, `1 ${big.replace(/s$/,"")} = ${factor} ${small}, so ${n} ${big} = ${n*factor} ${small}.`, [factor, n * factor * 10, n * factor / 10, n + factor]);
  },
  time(rng, stage) {
    const kind = pick(rng, ["minutes", "duration"]);
    if (kind === "minutes") { const h = randInt(rng, 1, 6); return numericMcq(rng, `How many minutes are there in ${h} hour${h > 1 ? "s" : ""}?`, h * 60, `1 hour = 60 minutes, so ${h} hours = ${h*60} minutes.`, [h * 30, h * 100, 60 + h, h * 60 + 10]); }
    const start = randInt(rng, 1, 9), len = randInt(rng, 1, 3);
    return numericMcq(rng, `A lesson starts at ${start} o'clock and lasts ${len} hour${len > 1 ? "s" : ""}. At what hour does it end?`, start + len, `${start} + ${len} = ${start + len} o'clock.`, [start, start + len + 1, len, start - len]);
  },
  money(rng, stage) {
    const kind = pick(rng, ["total", "change"]);
    if (kind === "total") { const a = randInt(rng, 1, 50), b = randInt(rng, 1, 50); return numericMcq(rng, `Amina buys one item for ${a} and another for ${b}. How much does she spend altogether?`, a + b, `${a} + ${b} = ${a + b}.`, [Math.abs(a - b), a + b + 1, a + b + 10]); }
    const paid = randInt(rng, 20, 100), price = randInt(rng, 1, paid);
    return numericMcq(rng, `Yusuf pays ${paid} for something that costs ${price}. How much change does he get?`, paid - price, `Change = ${paid} − ${price} = ${paid - price}.`, [paid + price, paid - price + 1, price]);
  },
  statistics(rng, stage) {
    // Distinct values so max/mode questions are unambiguous.
    const set = new Set();
    while (set.size < 5) set.add(randInt(rng, 1, 20));
    const data = [...set];
    const kind = pick(rng, ["mode", "range", "max", "total"]);
    const list = data.join(", ");
    if (kind === "range") { const r = Math.max(...data) - Math.min(...data); return numericMcq(rng, `Here is some data: ${list}. What is the range?`, r, `Range = largest − smallest = ${Math.max(...data)} − ${Math.min(...data)} = ${r}.`, [Math.max(...data), Math.min(...data), r + 1]); }
    if (kind === "max") { return numericMcq(rng, `Here is some data: ${list}. What is the largest value?`, Math.max(...data), `Look for the biggest number: ${Math.max(...data)}.`, [Math.min(...data), Math.max(...data) - 1, data[0]]); }
    if (kind === "total") { const t = data.reduce((a, b) => a + b, 0); return numericMcq(rng, `A tally shows these counts: ${list}. What is the total?`, t, `Add them all: ${list.replace(/, /g, " + ")} = ${t}.`, [t + 1, t - 1, Math.max(...data)]); }
    // mode: force a repeat
    const withMode = [...data, data[0]]; const modeList = withMode.join(", ");
    return numericMcq(rng, `Here is some data: ${modeList}. Which value appears most often (the mode)?`, data[0], `${data[0]} appears more than any other value, so it is the mode.`, [Math.max(...data), Math.min(...data), data[1]]);
  },
  geometry(rng, stage) {
    const kind = pick(rng, ["sides", "solid", "angle"]);
    if (kind === "sides") { const shapes = [["triangle", 3], ["square", 4], ["pentagon", 5], ["hexagon", 6], ["octagon", 8]]; const [name, sides] = pick(rng, shapes); return numericMcq(rng, `How many sides does a ${name} have?`, sides, `A ${name} has ${sides} straight sides.`, [sides + 1, sides - 1, sides + 2]); }
    if (kind === "solid") { const solids = [["cube", "faces", 6], ["cube", "edges", 12], ["cube", "vertices", 8]]; const [name, part, count] = pick(rng, solids); return numericMcq(rng, `How many ${part} does a ${name} have?`, count, `A ${name} has ${count} ${part}.`, [count + 1, count - 1, count + 2]); }
    const angles = [["right angle", "90"], ["straight line", "180"], ["full turn", "360"]]; const [name, deg] = pick(rng, angles);
    return numericMcq(rng, `How many degrees are there in a ${name}?`, deg, `A ${name} measures ${deg}°.`, [String(Number(deg) + 90), String(Number(deg) - 90 || 45), String(Number(deg) / 2)]);
  },
  algebra(rng, stage) {
    const kind = pick(rng, ["sequence", "evaluate", "solve"]);
    if (kind === "sequence") { const start = randInt(rng, 1, 10), step = randInt(rng, 2, 9); const terms = [start, start + step, start + 2 * step, start + 3 * step]; const next = start + 4 * step; return numericMcq(rng, `Find the next term: ${terms.join(", ")}, ___`, next, `The rule is add ${step} each time, so the next term is ${terms[3]} + ${step} = ${next}.`, [next + step, next - step, terms[3] + 1]); }
    if (kind === "evaluate") { const a = randInt(rng, 2, 9), x = randInt(rng, 2, 9), b = randInt(rng, 1, 9); const ans = a * x + b; return numericMcq(rng, `If x = ${x}, what is the value of ${a}x + ${b}?`, ans, `${a} × ${x} + ${b} = ${a*x} + ${b} = ${ans}.`, [a + x + b, a * x, ans + a]); }
    const x = randInt(rng, 2, 20), a = randInt(rng, 1, 15); const b = x + a;
    return numericMcq(rng, `Solve for x: x + ${a} = ${b}.`, x, `Subtract ${a} from both sides: x = ${b} − ${a} = ${x}.`, [b, b + a, a]);
  },
};

// Topic classifier — keep the rules in sync with
// src/prototypes/ehel-academy/mathematics/shared/math-visuals.js (ESM copy).
const TOPIC_RULES = [
  ["fractions", /fraction|decimal|percentage|percent|tenths|hundredths|ratio|proportion/i],
  ["time", /\btime\b|clock|hour|minute|calendar|o.clock|duration|telling the time/i],
  ["money", /money|coin|cash|price|change|currency|shilling|dollar|cost|budget/i],
  ["statistics", /statistic|data|chart|graph|pictogram|tally|table|probability|average|mean|median|mode|survey|frequenc/i],
  ["geometry", /geometr|shape|angle|symmetr|polygon|triangle|circle|square|quadrilat|3-?d|2-?d|solid|net\b|position|movement|turn|rotation|reflect|coordinate|transformation/i],
  ["measure", /measure|length|mass|weight|capacity|volume|area|perimeter|distance|metre|litre|gram|scale|temperature/i],
  ["algebra", /algebra|equation|expression|sequence|pattern|formula|variable|unknown|function|nth term|substitut/i],
  ["calculation", /calculat|add|subtract|multipl|divi|times table|arithmetic|sum|product|operation|column method|mental math/i],
  ["number", /number|place value|digit|counting|count|integer|negative|round|estimat|order|compar|odd|even|prime|factor|multiple|power|index|indices|square root/i],
];
function unitTopic(unitTitle, concepts = []) {
  const title = String(unitTitle || "");
  for (const [topic, pattern] of TOPIC_RULES) if (pattern.test(title)) return topic;
  const conceptText = concepts.map((c) => `${c.title} ${c.explanation}`).join(" ");
  let best = "number", bestScore = 0;
  for (const [topic, pattern] of TOPIC_RULES) {
    const matches = (conceptText.match(new RegExp(pattern, "gi")) || []).length;
    if (matches > bestScore) { bestScore = matches; best = topic; }
  }
  return best;
}

// Public: generate `count` questions for a unit topic + stage.
function generateQuestions(topic, stage, unitKey, count) {
  const gen = G[topic] || G.number;
  const rng = makeRng(seedFrom(`${unitKey}|${topic}|${stage}`));
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < count && guard < count * 12) {
    guard += 1;
    const q = gen(rng, stage);
    if (!q || q.options.length < 3 || !q.options.includes(q.answer)) continue;
    if (seen.has(q.question)) continue;
    seen.add(q.question);
    out.push(q);
  }
  return out;
}

module.exports = { generateQuestions, unitTopic };
