// Grammar visuals: labelled SVG diagrams for the grammar workshop. A
// classifier maps each grammar lesson (title + explanation text) to a
// diagram — tense timelines, sentence anatomy, question words, pronouns,
// punctuation, comparatives, articles, plurals, conjunctions, passive voice
// and conditionals — so every lesson teaches visually as well as in prose.

const esc = (value = "") => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Ordered rules: first match wins. Specific before general.
const RULES = [
  ["past-continuous", /past continuous|was \w+ing|were \w+ing/i],
  ["present-perfect", /present perfect|have \+? ?(past participle|verb)|has \w+ed|since.*for|for.*since/i],
  ["future", /future|will\b|going to/i],
  ["past-simple", /past simple|simple past|\bpast tense|yesterday|-ed\b|irregular verb/i],
  ["present-continuous", /present continuous|happening now|is \w+ing|are \w+ing|am \w+ing/i],
  ["present-simple", /present simple|simple present|every day|habit|routine/i],
  ["conditional", /conditional|if\b.*would|zero conditional|first conditional|second conditional/i],
  ["passive", /passive/i],
  ["comparative", /comparative|superlative|-er\b|-est\b|more \w+ than|the most/i],
  ["question", /question|wh-|interrogat|yes\/no/i],
  ["pronoun", /pronoun|\bhe\b.*\bshe\b|myself|yourself|himself|possessive/i],
  ["article", /article|\ba\/an\b|definite|indefinite|\bthe\b.*\ba\b.*\ban\b/i],
  ["plural", /plural|singular|more than one|-s\b|-es\b/i],
  ["punctuation", /punctuation|full stop|\bcommas?\b|apostrophe|capital letter|question mark|exclamation|quotation|speech marks/i],
  ["conjunction", /conjunction|connect|linking word|because|although|however|\band\b.*\bbut\b/i],
  ["adjective", /adjective|describing word|adverb|-ly\b/i],
  ["preposition", /preposition|\bin\b.*\bon\b.*\bat\b|position word/i],
  // NB: a bare "can" is NOT a modal trigger — it appears incidentally in ordinary
  // prose ("adjectives can use different prepositions", "I can ___") and used to
  // mislabel 27 lessons across all grades as modal-verb lessons.
  ["modal", /modal|\bcould\b|\bshould\b|\bmust\b|\bmight\b|\bmay\b|\bought\b/i],
  ["reported", /reported speech|direct speech|indirect speech/i],
  ["conjunction2", /joining|linking/i],
  ["comparative2", /comparison|compare/i],
  ["sentence", /sentence|subject.*verb|clause|word order|statement|imperative/i],
];
const ALIAS = { conjunction2: "conjunction", comparative2: "comparative" };

// Topics whose keywords are common in ordinary prose ("we must choose the right
// one") need a narrower pattern when scanning the explanation — otherwise an
// incidental modal verb relabels a homophones lesson as a modal-verb lesson.
const EXPLANATION_SCOPE = { modal: /modal/i };

export function grammarTopic(title, explanation) {
  // Title is authoritative; explanation is only a fallback (its prose often
  // mentions "what/when/how" and would over-trigger the question rule).
  for (const [topic, pattern] of RULES) if (pattern.test(String(title))) return ALIAS[topic] || topic;
  for (const [topic, pattern] of RULES) {
    if ((EXPLANATION_SCOPE[topic] || pattern).test(String(explanation))) return ALIAS[topic] || topic;
  }
  return "sentence";
}

// --- timeline helper: past ---- now ---- future with a highlight span ---
function timeline(highlight, label, sub) {
  const zones = { past: [60, 165], now: [185, 215], future: [235, 340] };
  const [hx1, hx2] = zones[highlight] || zones.now;
  return `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false">
    <line x1="40" y1="70" x2="360" y2="70" class="g-axis"/>
    <path d="M360 70l-9-5v10z" class="g-axis-head"/>
    <line x1="200" y1="52" x2="200" y2="88" class="g-now"/>
    <text x="90" y="105" class="g-tiny">past</text><text x="200" y="105" class="g-tiny strong">now</text><text x="315" y="105" class="g-tiny">future</text>
    <rect x="${hx1}" y="58" width="${hx2 - hx1}" height="24" rx="12" class="g-span"/>
    <text x="200" y="30" class="g-label">${esc(label)}</text>
    ${sub ? `<text x="200" y="46" class="g-tiny">${esc(sub)}</text>` : ""}
  </svg>`;
}

const DIAGRAMS = {
  "present-simple": { caption: "Present simple describes habits and routines — things that happen again and again.", art: () => `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false"><line x1="40" y1="70" x2="360" y2="70" class="g-axis"/><path d="M360 70l-9-5v10z" class="g-axis-head"/><line x1="200" y1="52" x2="200" y2="88" class="g-now"/><text x="90" y="105" class="g-tiny">past</text><text x="200" y="105" class="g-tiny strong">now</text><text x="315" y="105" class="g-tiny">future</text>${[80, 140, 200, 260, 320].map((x) => `<circle cx="${x}" cy="70" r="7" class="g-dot"/>`).join("")}<text x="200" y="30" class="g-label">I walk to school every day.</text></svg>` },
  "present-continuous": { caption: "Present continuous describes what is happening right now, at this moment.", art: () => timeline("now", "She is reading now.", "am/is/are + verb-ing") },
  "past-simple": { caption: "Past simple describes a finished action at a known time in the past.", art: () => timeline("past", "We visited the market yesterday.", "verb + -ed, or an irregular form") },
  "past-continuous": { caption: "Past continuous describes an action that was in progress at a moment in the past.", art: () => timeline("past", "I was cooking when you called.", "was/were + verb-ing") },
  "present-perfect": { caption: "Present perfect connects the past to now — the action matters in the present.", art: () => `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false"><line x1="40" y1="70" x2="360" y2="70" class="g-axis"/><path d="M360 70l-9-5v10z" class="g-axis-head"/><line x1="200" y1="52" x2="200" y2="88" class="g-now"/><text x="90" y="105" class="g-tiny">past</text><text x="200" y="105" class="g-tiny strong">now</text><text x="315" y="105" class="g-tiny">future</text><rect x="90" y="58" width="112" height="24" rx="12" class="g-span"/><path d="M196 70l8 0" class="g-axis"/><text x="200" y="30" class="g-label">I have lived here for five years.</text><text x="200" y="46" class="g-tiny">have/has + past participle</text></svg>` },
  future: { caption: "Future forms describe what will happen after now.", art: () => timeline("future", "We will travel tomorrow.", "will + verb · going to + verb") },
  conditional: { caption: "A conditional links a condition (if…) with its result.", art: () => `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false"><rect x="30" y="45" width="150" height="44" rx="10" class="g-box blue"/><text x="105" y="63" class="g-tag">IF (condition)</text><text x="105" y="80" class="g-word">if it rains…</text><path d="M186 67h40m0 0l-8-5m8 5l-8 5" class="g-arrow"/><rect x="232" y="45" width="150" height="44" rx="10" class="g-box teal"/><text x="307" y="63" class="g-tag">THEN (result)</text><text x="307" y="80" class="g-word">…we stay inside</text></svg>` },
  passive: { caption: "In the passive voice, the action moves to the front — who did it comes later or is left out.", art: () => `<svg viewBox="0 0 400 140" class="g-diagram" aria-hidden="true" focusable="false"><text x="60" y="34" class="g-tiny">Active:</text><rect x="95" y="18" width="70" height="26" rx="7" class="g-box blue"/><text x="130" y="35" class="g-word">Amina</text><rect x="175" y="18" width="70" height="26" rx="7" class="g-box gold"/><text x="210" y="35" class="g-word">wrote</text><rect x="255" y="18" width="80" height="26" rx="7" class="g-box teal"/><text x="295" y="35" class="g-word">the story</text><text x="60" y="90" class="g-tiny">Passive:</text><rect x="95" y="74" width="80" height="26" rx="7" class="g-box teal"/><text x="135" y="91" class="g-word">The story</text><rect x="185" y="74" width="100" height="26" rx="7" class="g-box gold"/><text x="235" y="91" class="g-word">was written</text><rect x="295" y="74" width="80" height="26" rx="7" class="g-box blue"/><text x="335" y="91" class="g-word">by Amina</text><path d="M290 48c-60 8-140 8-155 22" class="g-swap"/><text x="200" y="128" class="g-tiny">be + past participle</text></svg>` },
  comparative: { caption: "Comparatives compare two things; superlatives pick out the top of the whole group.", art: () => `<svg viewBox="0 0 400 140" class="g-diagram" aria-hidden="true" focusable="false"><rect x="70" y="88" width="50" height="30" class="g-bar"/><rect x="175" y="63" width="50" height="55" class="g-bar mid"/><rect x="280" y="33" width="50" height="85" class="g-bar top"/><text x="95" y="132" class="g-tiny">tall</text><text x="200" y="132" class="g-tiny">taller</text><text x="305" y="132" class="g-tiny strong">the tallest</text><text x="200" y="20" class="g-label">tall → taller → the tallest</text></svg>` },
  question: { caption: "Question words each ask about something different — person, thing, place, time, reason or way.", art: () => `<svg viewBox="0 0 400 150" class="g-diagram" aria-hidden="true" focusable="false">${[["Who?", "person"], ["What?", "thing"], ["Where?", "place"], ["When?", "time"], ["Why?", "reason"], ["How?", "way"]].map(([w, m], i) => { const x = 42 + (i % 3) * 118, y = 28 + Math.floor(i / 3) * 62; return `<rect x="${x}" y="${y}" width="96" height="42" rx="9" class="g-box ${["blue", "teal", "gold"][i % 3]}"/><text x="${x + 48}" y="${y + 18}" class="g-word">${w}</text><text x="${x + 48}" y="${y + 34}" class="g-tag">${m}</text>`; }).join("")}</svg>` },
  pronoun: { caption: "Pronouns stand in place of nouns so we do not repeat names.", art: () => `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false"><rect x="40" y="46" width="110" height="34" rx="9" class="g-box blue"/><text x="95" y="68" class="g-word">Hannah</text><path d="M156 63h48m0 0l-8-5m8 5l-8 5" class="g-arrow"/><rect x="210" y="46" width="70" height="34" rx="9" class="g-box teal"/><text x="245" y="68" class="g-word">she</text><text x="200" y="112" class="g-tiny">I · you · he · she · it · we · they</text><text x="200" y="26" class="g-label">Use a pronoun instead of repeating the name.</text></svg>` },
  article: { caption: "Use 'a' before consonant sounds, 'an' before vowel sounds, and 'the' for a specific thing.", art: () => `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false">${[["a", "book", "blue"], ["an", "orange", "gold"], ["the", "sun", "teal"]].map(([art2, n, c], i) => { const x = 40 + i * 118; return `<rect x="${x}" y="40" width="44" height="34" rx="9" class="g-box ${c}"/><text x="${x + 22}" y="62" class="g-word">${art2}</text><rect x="${x + 50}" y="40" width="60" height="34" rx="9" class="g-box plain"/><text x="${x + 80}" y="62" class="g-word dark">${n}</text>`; }).join("")}<text x="200" y="105" class="g-tiny">a + consonant sound · an + vowel sound · the = that one</text></svg>` },
  plural: { caption: "Most plurals add -s or -es; some words change completely.", art: () => `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false">${[["cat", "cats"], ["box", "boxes"], ["child", "children"]].map(([a, b], i) => { const y = 30 + i * 34; return `<text x="110" y="${y}" class="g-word dark">${a}</text><path d="M160 ${y - 5}h60m0 0l-8-5m8 5l-8 5" class="g-arrow"/><text x="280" y="${y}" class="g-word dark strong">${b}</text>`; }).join("")}</svg>` },
  punctuation: { caption: "Punctuation marks each do a job: end, pause, own, ask or exclaim.", art: () => `<svg viewBox="0 0 400 150" class="g-diagram" aria-hidden="true" focusable="false">${[[".", "end a sentence"], [",", "short pause"], ["'", "belonging"], ["?", "ask"], ["!", "strong feeling"], ["“ ”", "speech"]].map(([m, j], i) => { const x = 42 + (i % 3) * 118, y = 28 + Math.floor(i / 3) * 62; return `<rect x="${x}" y="${y}" width="96" height="42" rx="9" class="g-box plain"/><text x="${x + 48}" y="${y + 22}" class="g-mark">${m}</text><text x="${x + 48}" y="${y + 36}" class="g-tag dark">${j}</text>`; }).join("")}</svg>` },
  conjunction: { caption: "Conjunctions join two ideas into one sentence.", art: () => `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false"><rect x="30" y="46" width="120" height="36" rx="9" class="g-box blue"/><text x="90" y="69" class="g-word">I was tired</text><rect x="162" y="46" width="60" height="36" rx="18" class="g-box gold"/><text x="192" y="69" class="g-word">but</text><rect x="234" y="46" width="136" height="36" rx="9" class="g-box teal"/><text x="302" y="69" class="g-word">I kept reading</text><text x="200" y="112" class="g-tiny">and · but · or · so · because · although</text></svg>` },
  adjective: { caption: "Adjectives describe nouns; adverbs describe verbs.", art: () => `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false"><rect x="55" y="40" width="80" height="34" rx="9" class="g-box gold"/><text x="95" y="62" class="g-word">bright</text><rect x="141" y="40" width="70" height="34" rx="9" class="g-box plain"/><text x="176" y="62" class="g-word dark">moon</text><text x="133" y="100" class="g-tiny">adjective + noun</text><rect x="240" y="40" width="60" height="34" rx="9" class="g-box plain"/><text x="270" y="62" class="g-word dark">runs</text><rect x="306" y="40" width="80" height="34" rx="9" class="g-box teal"/><text x="346" y="62" class="g-word">quickly</text><text x="312" y="100" class="g-tiny">verb + adverb</text></svg>` },
  preposition: { caption: "Prepositions tell us where or when: in, on, at, under, next to.", art: () => `<svg viewBox="0 0 400 140" class="g-diagram" aria-hidden="true" focusable="false"><rect x="70" y="80" width="90" height="36" rx="5" class="g-box plain"/><circle cx="115" cy="64" r="13" class="g-dot big"/><text x="115" y="132" class="g-tiny">on the box</text><rect x="240" y="60" width="90" height="56" rx="5" class="g-box plain"/><circle cx="285" cy="92" r="13" class="g-dot big teal"/><text x="285" y="132" class="g-tiny">in the box</text></svg>` },
  modal: { caption: "Modal verbs adjust how sure, able or obliged we are.", art: () => `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false"><line x1="50" y1="66" x2="350" y2="66" class="g-axis"/>${[["might", 70], ["could", 140], ["should", 215], ["must", 300]].map(([w, x], i) => `<circle cx="${x}" cy="66" r="6" class="g-dot"/><text x="${x}" y="${i % 2 ? 46 : 94}" class="g-tiny strong">${w}</text>`).join("")}<text x="60" y="118" class="g-tiny">less certain</text><text x="330" y="118" class="g-tiny">certain / required</text></svg>` },
  reported: { caption: "Reported speech retells someone's words — the tense usually steps back.", art: () => `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false"><rect x="35" y="34" width="150" height="40" rx="12" class="g-box blue"/><text x="110" y="59" class="g-word">“I am happy.”</text><path d="M191 54h44m0 0l-8-5m8 5l-8 5" class="g-arrow"/><rect x="240" y="34" width="140" height="40" rx="9" class="g-box teal"/><text x="310" y="52" class="g-tag">reported</text><text x="310" y="68" class="g-word">she was happy</text><text x="200" y="110" class="g-tiny">say/said + that · tense steps back</text></svg>` },
  sentence: { caption: "A sentence needs a subject (who) and a verb (does what) — often with an object.", art: () => `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false"><rect x="40" y="46" width="100" height="38" rx="9" class="g-box blue"/><text x="90" y="63" class="g-tag">SUBJECT</text><text x="90" y="79" class="g-word">The girl</text><rect x="156" y="46" width="88" height="38" rx="9" class="g-box gold"/><text x="200" y="63" class="g-tag">VERB</text><text x="200" y="79" class="g-word">reads</text><rect x="260" y="46" width="100" height="38" rx="9" class="g-box teal"/><text x="310" y="63" class="g-tag">OBJECT</text><text x="310" y="79" class="g-word">a book</text><text x="200" y="112" class="g-tiny">who + does what + to what</text></svg>` },
};

export function grammarDiagram(title, explanation) {
  const topic = grammarTopic(title, explanation);
  const entry = DIAGRAMS[topic] || DIAGRAMS.sentence;
  return `<figure class="grammar-visual" data-grammar-topic="${topic}">${entry.art()}<figcaption>${esc(entry.caption)}</figcaption></figure>`;
}

// --- Early-years phonics visuals -------------------------------------------
// Grade 1 "language patterns" are phonics, not sentence grammar: letter sounds
// ("A says /a/."), blending ("c-a-t, cat.") and spoken frames ("I see a ___.").
// The generic DIAGRAMS above are all wrong for these, so match on the pattern
// itself and return "" when nothing fits — no diagram beats a misleading one.
const PHONICS = [
  {
    // A says /a/.
    test: /^\s*([A-Za-z])\s+says\s+\/?([^/.\s]+)\/?\s*\.?\s*$/,
    caption: (m) => `The letter ${m[1].toUpperCase()} makes the sound /${m[2]}/.`,
    art: (m) => `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false"><rect x="60" y="34" width="96" height="62" rx="14" class="g-box blue"/><text x="108" y="80" class="g-word" style="font-size:38px">${esc(m[1].toUpperCase())}${esc(m[1].toLowerCase())}</text><path d="M170 65h50m0 0l-8-5m8 5l-8 5" class="g-arrow"/><rect x="234" y="34" width="106" height="62" rx="14" class="g-box gold"/><text x="287" y="76" class="g-word" style="font-size:30px">/${esc(m[2])}/</text><text x="200" y="118" class="g-tiny">letter → sound</text></svg>`,
  },
  {
    // c-a-t, cat.
    test: /^\s*([A-Za-z])\s*-\s*([A-Za-z])\s*-\s*([A-Za-z])\s*,\s*([A-Za-z]+)\s*\.?\s*$/,
    caption: (m) => `Blend the sounds together to read the word “${m[4]}”.`,
    art: (m) => {
      const boxes = [m[1], m[2], m[3]].map((letter, i) => {
        const x = 40 + i * 74;
        return `<rect x="${x}" y="38" width="60" height="52" rx="10" class="g-box ${["blue", "gold", "teal"][i]}"/><text x="${x + 30}" y="74" class="g-word" style="font-size:26px">${esc(letter)}</text>`;
      }).join("");
      return `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false">${boxes}<path d="M266 64h44m0 0l-8-5m8 5l-8 5" class="g-arrow"/><rect x="316" y="38" width="70" height="52" rx="10" class="g-box plain"/><text x="351" y="72" class="g-word dark" style="font-size:24px">${esc(m[4])}</text><text x="200" y="116" class="g-tiny">sound it out, then blend</text></svg>`;
    },
  },
  {
    // Spoken frames and model sentences: "I see a ___.", "I am ___ years old.",
    // "The ___ is ___ing.", "It is rainy.", "Which sense do I use?"
    // A speech card carries the whole line; gaps become a "your word" chip.
    test: /^\s*(\S.{0,44}?)\s*$/,
    caption: (m) => (/_{2,}/.test(m[1])
      ? "Say the whole sentence, and put your own word in the gap."
      : "Say this sentence out loud, clearly and warmly."),
    art: (m) => {
      const line = m[1].replace(/_{2,}/g, "――");
      const gap = /――/.test(line);
      const question = /\?\s*$/.test(m[1]);
      const size = line.length > 26 ? 19 : line.length > 20 ? 22 : 25;
      return `<svg viewBox="0 0 400 130" class="g-diagram" aria-hidden="true" focusable="false">`
        + `<rect x="28" y="26" width="344" height="60" rx="16" class="g-box blue"/>`
        + `<path d="M96 86l10 18 16-18z" class="g-box blue" stroke="none"/>`
        + `<text x="200" y="64" class="g-word" style="font-size:${size}px">${esc(line)}</text>`
        + (gap
          ? `<rect x="150" y="96" width="100" height="24" rx="12" class="g-box gold" stroke-dasharray="6 5"/><text x="200" y="113" class="g-tiny strong">your word</text>`
          : `<text x="200" y="112" class="g-tiny">${question ? "ask it, then answer it" : "listen, then say it back"}</text>`)
        + `</svg>`;
    },
  },
];

/**
 * Visual for an early-years phonics pattern. `pattern` is the lesson's
 * ruleAndExamples ("A says /a/."). Returns "" when the pattern is not a
 * recognised phonics shape, so the caller renders no diagram at all.
 */
export function phonicsDiagram(pattern) {
  const text = String(pattern || "");
  for (const rule of PHONICS) {
    const m = text.match(rule.test);
    if (m) return `<figure class="grammar-visual" data-phonics="1">${rule.art(m)}<figcaption>${esc(rule.caption(m))}</figcaption></figure>`;
  }
  return "";
}
