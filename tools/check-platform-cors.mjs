#!/usr/bin/env node
// Does the platform still answer the app's cross-origin calls?
//
//   node tools/check-platform-cors.mjs                 # the launch host, every endpoint
//   node tools/check-platform-cors.mjs --host a,b      # other hosts
//   node tools/check-platform-cors.mjs --json
//
// Written after 2026-08-26, when book narration stopped for a day and nothing
// in this repo could say why. A browser-integrity challenge had been put in
// front of the Moodle box, and it answered CORS PREFLIGHTS with a 200 HTML
// interstitial carrying no Access-Control-Allow-Origin. A preflight is sent by
// the browser with no cookies, ever, so passing the challenge in a tab never
// helped the app: every cross-origin call died before it was made.
//
// Three things made it invisible, and each is a reason this check exists:
//
//   - The failure is in a response NOBODY LOGS. A blocked preflight never
//     reaches Apache, so the server's access log showed zero narration calls
//     rather than failing ones — the block's signature and its alibi at once.
//   - Every OTHER kind of narration kept working, because those are
//     pre-rendered mp3s on the CDN. Only the surfaces that call the platform at
//     runtime broke, which reads as "one feature is broken" rather than "the
//     API is unreachable".
//   - A probe run ON the box passes. The challenge layer exempts local
//     traffic, so `curl` from cPanel Terminal answered 204 with correct CORS
//     headers in the same minute an external client got the interstitial. Only
//     an off-box client can see this, which is exactly what a deploy step is.
//
// It asserts the CONTRACT, not the symptom. The interstitial's wording, its
// vendor and its URL are all things that can change; what cannot is what our
// own PHP promises for an allowed origin — 2xx with the origin echoed back and
// the launch token's header allowed. Anything else in front of Moodle fails
// that by construction, whatever it looks like. The challenge fingerprint below
// is used only to make the error message name the cause, never to decide it.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHELL = path.join(ROOT, "src/prototypes/ehel-academy/shell");

// The host a learner actually launches from. It is NOT derivable from this
// repo: the app is told where the platform is at launch time (?pwsEndpoint,
// built from $CFG->wwwroot), and the box serves nine Moodles across many
// hostnames. This is the one the access log says the learners use — check with
// `ls -S ~/access-logs/` on the server, which sorts by traffic.
const DEFAULT_HOSTS = ["students.k-12.ehelacademy.org"];

const USAGE = `usage: node tools/check-platform-cors.mjs [--host a[,b]] [--json]

  --host   platform hostname(s) to probe (default: ${DEFAULT_HOSTS.join(", ")};
           also read from EHEL_PLATFORM_HOST)
  --json   machine-readable result on stdout

exit 0 = every endpoint answers the preflight correctly
     1 = at least one does not — the app's calls are dead for a browser
     2 = bad usage, or the endpoint list could not be read from the source
     3 = could not reach the host at all, so nothing was checked`;

// An unrecognised argument is refused rather than ignored. A typo that silently
// falls back to the default probes a host nobody asked about and reports a
// clean bill of health for it.
const argv = process.argv.slice(2);
let hosts = (process.env.EHEL_PLATFORM_HOST || "").split(",").map((h) => h.trim()).filter(Boolean);
let json = false;
for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (arg === "--json") json = true;
  else if (arg === "--host") hosts = String(argv[++i] || "").split(",").map((h) => h.trim()).filter(Boolean);
  else if (arg.startsWith("--host=")) hosts = arg.slice(7).split(",").map((h) => h.trim()).filter(Boolean);
  else if (arg === "--help" || arg === "-h") { console.log(USAGE); process.exit(0); }
  else { console.error(`Unrecognised argument: ${arg}\n\n${USAGE}`); process.exit(2); }
}
if (!hosts.length) hosts = DEFAULT_HOSTS;

// ── what to probe, read from the source rather than listed here ───────────────
//
// A hand-kept list only ever covers the endpoints that have already broken
// once. These come out of the code that calls them, so an endpoint added to the
// app is probed by the next release without anybody remembering to add it.

function readIfPresent(file) {
  try { return fs.readFileSync(file, "utf8"); } catch { return ""; }
}

function shellSources() {
  const files = [];
  for (const dir of [SHELL, path.join(SHELL, "subjects")]) {
    let names = [];
    try { names = fs.readdirSync(dir); } catch { continue; }
    for (const name of names) if (name.endsWith(".js")) files.push(path.join(dir, name));
  }
  return files;
}

function discoverEndpoints() {
  const found = new Map(); // path -> { path, credentialed }
  const sources = shellSources().map((file) => readIfPresent(file));

  // Every cross-origin call the app makes goes through platformUrl(), which is
  // what rebases a root-relative path onto the launch's platform origin. The
  // constant it is assigned to is what the fetch call names, so keep it: it is
  // how the credential question below gets answered from the code instead of
  // from a list somebody has to maintain.
  const constants = new Map(); // CONST NAME -> path
  for (const source of sources) {
    for (const m of source.matchAll(/(?:const|let)\s+([A-Z][A-Z0-9_]*)\s*=[^;\n]*platformUrl\("(\/[^"]+)"\)/g)) {
      constants.set(m[1], m[2]);
    }
    for (const m of source.matchAll(/platformUrl\("(\/[^"]+)"\)/g)) {
      if (!found.has(m[1])) found.set(m[1], { path: m[1], credentialed: false });
    }
  }

  // A platformUrl() that is only ever assigned to a link's href is a TOP-LEVEL
  // NAVIGATION, not a cross-origin call: the browser sends no preflight for a
  // link, so CORS does not apply and probing it fails the gate about a page
  // working exactly as designed. The case that forced this: the student Join
  // pill's href to live_sessions.php (v337), a login-gated PAGE that answers
  // OPTIONS with its redirect -- the v339 release gate called that an outage.
  // Detected from the code like everything else here (a path whose EVERY
  // appearance is `.href = platformUrl(...)` is a link), and each drop is
  // printed, because a sweep that shrinks silently is the failure this file
  // exists to prevent.
  for (const [path] of [...found]) {
    const esc = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("(\\.href\\s*=\\s*)?platformUrl\\(\"" + esc + "\"\\)", "g");
    let total = 0;
    let navonly = 0;
    for (const source of sources) {
      for (const m of source.matchAll(re)) {
        total++;
        if (m[1]) navonly++;
      }
    }
    if (total > 0 && total === navonly) {
      found.delete(path);
      console.log(`  (navigation-only, not probed: ${path} -- a link target; no preflight is ever sent for a link)`);
    }
  }

  // Whether an endpoint needs Access-Control-Allow-Credentials is a property of
  // the CALL, not of the server: a browser rejects a credentialed response that
  // does not carry it, and requires nothing for one that is not credentialed.
  // So read it off the fetch — `credentials: "include"`, or the dev-twin
  // ternary that is "include" in production. Asserting it everywhere fails the
  // progress gateway, which authenticates by bearer token alone and correctly
  // omits the header; asserting it nowhere would miss the header going missing
  // on the six that do need it.
  for (const source of sources) {
    for (const m of source.matchAll(/fetch\(\s*([A-Z][A-Z0-9_]*)\s*,([\s\S]{0,500}?)\)/g)) {
      const target = constants.get(m[1]);
      if (!target) continue;
      if (/credentials:[^,}]*"include"/.test(m[2])) found.get(target).credentialed = true;
    }
  }

  // The progress gateway is the exception to the discovery rule: the app is
  // handed its ABSOLUTE url as a launch parameter, so it never appears in a
  // platformUrl() call. The path is minted server-side, so read it from the
  // minting line — the same rule, one file further along. It is reached with a
  // bearer token and no credentials, which is why nothing above marks it.
  //
  // Its FILE is the thing to guard, not just its parse. A release cut from a
  // `git archive` tree does not contain it — the recipe in CLAUDE.md pulls
  // `src/moodle/local_hubredirect` and nothing else — so on 2026-08-27 this
  // check ran inside a release and printed "Preflighting 6 endpoint(s)" over a
  // green tick. Six of seven, silently, at the exact moment an operator trusts
  // it most. The floor below could not see it: a floor of 5 against a true 7
  // passes a partial parse, the same shape as the portal-route gate's 50.
  const libPath = path.join(ROOT, "src/moodle/local_prequran/progress_gatewaylib.php");
  if (!fs.existsSync(libPath)) {
    console.error(`✗ cannot read ${path.relative(ROOT, libPath)}, which is where the progress gateway's path comes from.`);
    console.error("  Without it this check sweeps one endpoint fewer and says so in a line nobody reads.");
    console.error("  If this is a release tree, add `src/moodle` to the git archive pathspec and run it again.");
    process.exit(2);
  }
  const lib = readIfPresent(libPath);
  for (const m of lib.matchAll(/'(\/local\/prequran\/progress_gateway\.php)'/g)) {
    if (!found.has(m[1])) found.set(m[1], { path: m[1], credentialed: false });
  }

  return [...found.values()].sort((a, b) => a.path.localeCompare(b.path));
}

// The origin the app is served from, read from the release tool so the two
// cannot drift. A wrong origin here would be answered without CORS headers by
// a perfectly healthy server, and the check would fail for the wrong reason.
function appOrigin() {
  const deploy = readIfPresent(path.join(ROOT, "tools/deploy-app-version.js"));
  const zone = deploy.match(/^const ZONE = "([a-z0-9-]+)";/m);
  return zone ? `https://${zone[1]}.b-cdn.net` : "";
}

const ENDPOINTS = discoverEndpoints();
const ORIGIN = appOrigin();

// A parser that has stopped matching passes every assertion it never made. Both
// floors are the same guard the portal-route gate carries: refuse to run rather
// than report a clean sweep of nothing.
if (ENDPOINTS.length < 5) {
  console.error(`✗ read only ${ENDPOINTS.length} endpoint(s) out of the shell sources — expected at least 5.`);
  console.error("  The call pattern has changed and this check is now looking at nothing. Fix the parser, do not lower the floor.");
  process.exit(2);
}
// A floor is a weak guard and this one proved it: 6 of 7 cleared a floor of 5.
// So name the endpoint that a floor cannot miss. The gateway is the one that
// comes from a different file, in a different plugin, by a different rule — the
// single most likely thing to fall out of the sweep, and the file guard above
// catches only its ABSENCE, not a minting line that has moved.
if (!ENDPOINTS.some((e) => /progress_gateway\.php$/.test(e.path))) {
  console.error("✗ the progress gateway is missing from the endpoint list, though its source was readable.");
  console.error("  Its path is parsed out of progress_gatewaylib.php's minting line; that line has moved or changed shape.");
  process.exit(2);
}
// The same guard one level down: if the credential parser stops matching, every
// endpoint quietly becomes bearer-only and the ACAC assertion tests nothing on
// the six calls that need it. A silent downgrade is the failure this whole file
// is about, so refuse rather than run weaker.
if (!ENDPOINTS.some((e) => e.credentialed)) {
  console.error("✗ no endpoint was read as credentialed, but the app sends `credentials: \"include\"`.");
  console.error("  The fetch parser has stopped matching, so Access-Control-Allow-Credentials would go unchecked.");
  process.exit(2);
}
if (!ORIGIN) {
  console.error("✗ could not read the pull zone from tools/deploy-app-version.js, so the app's origin is unknown.");
  process.exit(2);
}

// ── the contract ─────────────────────────────────────────────────────────────

const TIMEOUT_MS = 20000;

// A bare hostname is https, which is every real platform. A full origin is
// accepted too (`http://127.0.0.1:8931`) so a staging box on another scheme or
// port can be probed — and so this check can be pointed at a saved copy of a
// challenge page to prove it still fails on one.
function originOf(host) {
  return /^https?:\/\//i.test(host) ? host.replace(/\/$/, "") : `https://${host}`;
}

async function preflight(host, endpoint) {
  const url = `${originOf(host)}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: "OPTIONS",
      redirect: "manual",
      // AbortSignal.timeout, not a setTimeout + AbortController: the manual
      // pair leaves a handle that node tears down after the last probe, and on
      // Windows that raced process.exit() into a libuv assertion — the tool
      // printed a correct verdict and then exited 127. See the exitCode note
      // at the bottom; a gate whose exit code is wrong is worse than no gate.
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Origin: ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
        // A browser sends its own UA; some challenge layers decide on it, so
        // looking like a browser keeps this measuring the rule and not the UA.
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
      },
    });
    return { url, response };
  } catch (error) {
    return { url, error };
  }
}

// Only ever used to explain a failure the contract already found. Never to
// decide one — see the header.
async function looksLikeAnInterstitial(response) {
  const type = (response.headers.get("content-type") || "").toLowerCase();
  const server = (response.headers.get("server") || "").toLowerCase();
  if (!type.includes("text/html")) return "";
  let body = "";
  try { body = (await response.text()).slice(0, 20000); } catch { /* body is a nicety */ }
  const fingerprints = [
    [/wsidchk|browser.?integrity/i, "a browser-integrity challenge"],
    [/One moment, please|checking your browser|verifying your browser/i, "a bot-challenge interstitial"],
    [/<title>[^<]*captcha/i, "a CAPTCHA page"],
  ];
  for (const [pattern, label] of fingerprints) if (pattern.test(body)) return label;
  if (server && !server.includes("apache")) return `something answering as "${response.headers.get("server")}"`;
  return "an HTML page";
}

function headerList(value) {
  return String(value || "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
}

async function checkEndpoint(host, { path: endpoint, credentialed }) {
  const { url, response, error } = await preflight(host, endpoint);
  if (error) {
    const unreachable = /abort|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|ECONNRESET|fetch failed/i.test(error.message || "");
    return { endpoint, url, credentialed, ok: false, unreachable, problems: [`the request itself failed: ${error.message}`] };
  }

  const problems = [];
  const acao = response.headers.get("access-control-allow-origin");
  const acac = (response.headers.get("access-control-allow-credentials") || "").toLowerCase();
  const acah = headerList(response.headers.get("access-control-allow-headers"));
  const acam = headerList(response.headers.get("access-control-allow-methods"));

  if (response.status < 200 || response.status >= 300) problems.push(`answered ${response.status}, not a 2xx`);
  if (acao !== ORIGIN) problems.push(`Access-Control-Allow-Origin is ${acao ? `"${acao}"` : "absent"}, not "${ORIGIN}"`);
  if (credentialed && acac !== "true") problems.push(`Access-Control-Allow-Credentials is ${acac ? `"${acac}"` : "absent"}, not "true" (this endpoint is called with credentials)`);
  // The launch token rides in Authorization, and a JSON body needs
  // Content-Type. A preflight that allows neither blocks every call the app
  // makes even when the origin is echoed correctly.
  for (const header of ["authorization", "content-type"]) {
    if (acah.length && !acah.includes(header)) problems.push(`Access-Control-Allow-Headers does not allow "${header}"`);
  }
  if (!acah.length) problems.push("Access-Control-Allow-Headers is absent");
  if (acam.length && !acam.includes("post")) problems.push("Access-Control-Allow-Methods does not allow POST");

  let served = "";
  if (problems.length) served = await looksLikeAnInterstitial(response);
  return { endpoint, url, credentialed, ok: problems.length === 0, status: response.status, servedBy: served, problems };
}

// ── run ──────────────────────────────────────────────────────────────────────

const results = [];
for (const host of hosts) {
  for (const endpoint of ENDPOINTS) results.push({ host, ...(await checkEndpoint(host, endpoint)) });
}

const failed = results.filter((r) => !r.ok);
const unreachable = failed.filter((r) => r.unreachable);
// Every endpoint on every host unreachable is a network answer, not a verdict
// about the platform — the laptop is offline, or DNS is down. Reporting that as
// drift would teach whoever sees it to ignore the check.
const allUnreachable = unreachable.length === results.length;

if (json) {
  console.log(JSON.stringify({ origin: ORIGIN, hosts, endpoints: ENDPOINTS, results }, null, 2));
} else {
  const credentialedCount = ENDPOINTS.filter((e) => e.credentialed).length;
  console.log(`Preflighting ${ENDPOINTS.length} endpoint(s) as ${ORIGIN} against: ${hosts.join(", ")}`);
  console.log(`${credentialedCount} of them are called with credentials, so those must echo Allow-Credentials too.\n`);
  for (const r of results) {
    if (r.ok) {
      console.log(`  ✓ ${r.endpoint}  (${r.status}${r.credentialed ? ", credentialed" : ""})`);
    } else {
      console.log(`  ✗ ${r.endpoint}`);
      for (const problem of r.problems) console.log(`      ${problem}`);
      if (r.servedBy) console.log(`      the reply came from ${r.servedBy}, so something is answering in front of Moodle`);
    }
  }
}

// process.exit() is the obvious ending here and it is the wrong one: it tears
// the process down while undici still holds sockets from the probes, and on
// Windows that surfaced as a libuv assertion and exit 127 — a FAILING check
// reporting a code no caller reads as failure, which is precisely the shape of
// bug this file exists to catch. Setting exitCode lets node drain and exit on
// its own with the verdict intact.
if (allUnreachable) {
  console.error(`\n✗ ${hosts.join(", ")} could not be reached at all, so NOTHING was checked.`);
  console.error("  This is not a pass and not a failure. Try again from a network that can see the platform.");
  process.exitCode = 3;
}

if (failed.length && !allUnreachable) {
  console.error(`\n✗ ${failed.length} of ${results.length} preflight(s) failed. A browser will refuse these calls,`);
  console.error("  so runtime narration, Wehel and progress saving are dead for anyone this affects — and the");
  console.error("  requests never reach Apache, so the server's access log will show nothing at all.");
  console.error("\n  If the reply came from something in front of Moodle, the fix is at the hosting/WAF layer:");
  console.error("  exempt OPTIONS requests and /local/hubredirect/* and /local/prequran/* from the challenge.");
  console.error("  Verify from OFF the box — a probe run on the server is exempted and always passes.");
  process.exitCode = 1;
}

if (!failed.length && !json) console.log(`\n✓ every endpoint answers the app's preflight correctly on ${hosts.join(", ")}.`);
