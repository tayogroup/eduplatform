/* What the learner controls need from the platform, and nothing else.
 *
 * Ehel's copies of learner-controls.js import platformUrl/platformHeaders from
 * wehel.js and escapeHtml from course-shell.js. Neither of those belongs in this
 * school: wehel.js is six hundred lines of AI tutor, and Professor Adow TVET has
 * no Wehel. So this module provides the four functions the controls actually
 * call, with the SAME semantics, and nothing is dragged in behind them.
 *
 * THE SEMANTICS ARE COPIED, NOT REINVENTED, because they are a wire contract
 * with local_hubredirect. Two of them are load-bearing in ways that are not
 * obvious from the name:
 *
 *   platformOrigin() returns "" unless the launch actually carried a
 *   cross-origin pwsEndpoint. A same-origin endpoint, an unparseable one, or a
 *   missing one all mean "not launched from Moodle", and the controls then
 *   refuse to mount rather than posting into the void.
 *
 *   platformHeaders() sends `Authorization: Bearer <launch token>` and NOT
 *   credentials. That is deliberate and measured on the live platform:
 *   MoodleSession is issued with no SameSite attribute, which browsers treat as
 *   Lax, and Lax cookies are not sent on a cross-site POST. The bearer token is
 *   what proves who is calling once the call is cross-origin.
 *
 * `platformUrl("…")` is assigned at top level in learner-controls.js on purpose:
 * tools/check-platform-cors.mjs discovers endpoints by parsing exactly that
 * shape, so moving those constants inside a function silently stops the release
 * gate probing them.
 */

/* A launch looks like  …/lesson.html?pwsToken=…&pwsEndpoint=https://moodle/… */
const params = () => new URLSearchParams(location.search);

export const LAUNCH_TOKEN = (params().get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "");
export const LAUNCH_ENDPOINT = (params().get("pwsEndpoint") || "").trim();

function platformOrigin() {
  const endpoint = LAUNCH_ENDPOINT;
  if (!endpoint) return "";
  try {
    const url = new URL(endpoint, location.href);
    /* same-origin means this is not a Moodle launch; a bad param is not an origin */
    if (!/^https?:$/.test(url.protocol) || url.origin === location.origin) return "";
    return url.origin;
  } catch {
    return "";
  }
}

/* Resolved once: location.search does not change under the lesson's own
   navigation, and a per-call parse would only invite the two halves to
   disagree about whether there is a platform at all. */
export const PLATFORM_ORIGIN = platformOrigin();

export const platformUrl = (path) => `${PLATFORM_ORIGIN}${path}`;

export function platformHeaders(extra = {}) {
  return LAUNCH_TOKEN ? { ...extra, Authorization: `Bearer ${LAUNCH_TOKEN}` } : { ...extra };
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
