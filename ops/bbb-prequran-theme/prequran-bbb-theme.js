(function () {
  "use strict";

  var PANEL_ID = "pqa-vt-live-panel-client";
  var LAUNCHER_ID = "pqa-vt-live-launcher";
  var MATERIALS_LAUNCHER_ID = "pqa-materials-live-launcher";
  var WHITEBOARD_FIT_ID = "pqa-whiteboard-fit-helper";
  var WHITEBOARD_SCROLL_ID = "pqa-whiteboard-scroll-helper";
  var LESSON_STAGE_ID = "pqa-current-lesson-stage";
  var STYLE_ID = "pqa-vt-live-panel-style";
  var TITLE_CLASS = "pqa-vt-title-launcher";
  var DETAILS_CLASS = "pqa-vt-session-details";
  var PRESENTATION_HOST_CLASS = "pqa-current-lesson-host";
  var PRESENTATION_FIXED_CLASS = "pqa-current-lesson-fixed";
  var TUTOR_PATH = "/local/hubredirect/live_virtual_tutor.php";
  var POPUP_NAME = "pqa_virtual_tutor_live";
  var MATERIALS_POPUP_NAME = "pqa_materials_live";
  var LESSON_POPUP_NAME = "pqa_current_lesson_live";
  var AUTO_OPEN_MIN_DELAY_MS = 9000;
  var AUTO_OPEN_MAX_DELAY_MS = 18000;
  var scheduled = false;
  var cachedTutorUrl = "";
  var autoOpenStarted = false;
  var lessonWindow = null;
  var lessonStageMounted = false;
  var lessonStageAttempts = 0;
  var whiteboardFitStarted = false;
  var lastWhiteboardFitAt = 0;
  var lastWhiteboardSignature = "";
  var lastCoordinateFitSignature = "";
  var whiteboardScrollEnabled = false;
  var whiteboardScrollOffset = 0;
  var whiteboardScrollTarget = null;
  var whiteboardScrollHost = null;

  function moodleBaseUrl() {
    var host = window.location.hostname || "quraantest.academy";
    if (host.indexOf("live.") === 0) {
      host = host.substring(5);
    }
    return window.location.protocol + "//" + host;
  }

  function queryValue(name) {
    var params = new URLSearchParams(window.location.search || "");
    return params.get(name) || params.get(name.toLowerCase()) || "";
  }

  function sameMoodleTutorUrl(url) {
    try {
      var parsed = new URL(url, moodleBaseUrl());
      return parsed.pathname === TUTOR_PATH;
    } catch (e) {
      return false;
    }
  }

  function normalizeTutorUrl(url) {
    var parsed;
    try {
      parsed = new URL(url, moodleBaseUrl());
    } catch (e) {
      parsed = new URL(TUTOR_PATH, moodleBaseUrl());
    }

    parsed.protocol = window.location.protocol;
    if (parsed.hostname.indexOf("live.") === 0) {
      parsed.hostname = parsed.hostname.substring(5);
    }
    parsed.pathname = TUTOR_PATH;
    parsed.searchParams.set("embed", "1");
    parsed.searchParams.set("panel", "1");
    parsed.searchParams.set("floating", "1");
    parsed.searchParams.set("frombbb", "1");
    return parsed.toString();
  }

  function tutorUrlFromJoinParams() {
    var direct = queryValue("userdata-prequran-tutor-url") || queryValue("userdata-pqa-tutor-url");
    if (direct) {
      return normalizeTutorUrl(direct);
    }

    var sessionid = queryValue("userdata-prequran-sessionid") || queryValue("sessionid");
    var workspaceid = queryValue("userdata-prequran-workspaceid") || queryValue("workspaceid");
    var studentid = queryValue("userdata-prequran-studentid") || queryValue("studentid");
    if (!sessionid) {
      return "";
    }

    var url = new URL(TUTOR_PATH, moodleBaseUrl());
    url.searchParams.set("sessionid", sessionid);
    url.searchParams.set("embed", "1");
    url.searchParams.set("panel", "1");
    url.searchParams.set("floating", "1");
    url.searchParams.set("frombbb", "1");
    if (workspaceid && workspaceid !== "0") {
      url.searchParams.set("workspaceid", workspaceid);
    }
    if (studentid && studentid !== "0") {
      url.searchParams.set("studentid", studentid);
    }
    return url.toString();
  }

  function tutorUrlFromDocument() {
    var links = document.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i += 1) {
      var href = links[i].getAttribute("href") || "";
      if (sameMoodleTutorUrl(href)) {
        return normalizeTutorUrl(href);
      }
    }
    return "";
  }

  function safeStorageText(storage) {
    var parts = [];
    if (!storage) {
      return "";
    }
    try {
      for (var i = 0; i < storage.length; i += 1) {
        var key = storage.key(i);
        if (!key) {
          continue;
        }
        parts.push(key);
        parts.push(storage.getItem(key) || "");
      }
    } catch (e) {
      return "";
    }
    return parts.join(" ");
  }

  function tutorUrlFromText(text) {
    if (!text) {
      return "";
    }

    var tutorMatch = text.match(/https?:\\?\/\\?\/[^"'\s<>]+\/local\/hubredirect\/live_virtual_tutor\.php[^"'\s<>]*/i);
    if (tutorMatch && tutorMatch[0]) {
      return normalizeTutorUrl(tutorMatch[0].replace(/\\\//g, "/").replace(/&amp;/g, "&"));
    }

    var sessionMatch = text.match(/\b(?:userdata-prequran-sessionid|sessionid)["':=\s]+(\d+)\b/i);
    if (!sessionMatch) {
      sessionMatch = text.match(/\bprequran-live-(\d+)\b/i);
    }
    if (!sessionMatch || !sessionMatch[1]) {
      return "";
    }

    var workspaceMatch = text.match(/\b(?:userdata-prequran-workspaceid|workspaceid)["':=\s]+(\d+)\b/i);
    var studentMatch = text.match(/\b(?:userdata-prequran-studentid|studentid)["':=\s]+(\d+)\b/i);
    var url = new URL(TUTOR_PATH, moodleBaseUrl());
    url.searchParams.set("sessionid", sessionMatch[1]);
    url.searchParams.set("embed", "1");
    url.searchParams.set("panel", "1");
    url.searchParams.set("floating", "1");
    url.searchParams.set("frombbb", "1");
    if (workspaceMatch && workspaceMatch[1] && workspaceMatch[1] !== "0") {
      url.searchParams.set("workspaceid", workspaceMatch[1]);
    }
    if (studentMatch && studentMatch[1] && studentMatch[1] !== "0") {
      url.searchParams.set("studentid", studentMatch[1]);
    }
    return url.toString();
  }

  function tutorUrlFromStorage() {
    return tutorUrlFromText(safeStorageText(window.localStorage) + " " + safeStorageText(window.sessionStorage));
  }

  function tutorUrlFromMeetingId() {
    var haystack = window.location.href + " " + (document.body ? (document.body.textContent || "").slice(0, 50000) : "");
    return tutorUrlFromText(haystack);
  }

  function tutorUrl() {
    var found = tutorUrlFromJoinParams() || tutorUrlFromDocument() || tutorUrlFromStorage() || tutorUrlFromMeetingId();
    if (found) {
      cachedTutorUrl = found;
      return found;
    }
    if (cachedTutorUrl) {
      return cachedTutorUrl;
    }
    return normalizeTutorUrl(TUTOR_PATH + "?embed=1&panel=1&floating=1&frombbb=1");
  }

  function lessonUrl() {
    var direct = queryValue("userdata-prequran-lesson-url") || queryValue("pqaLessonUrl");
    if (direct) {
      return direct;
    }

    var links = document.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i += 1) {
      if ((links[i].textContent || "").replace(/\s+/g, " ").trim() === "Click here to Open the Current Lesson") {
        return links[i].href;
      }
    }

    var tutor = tutorUrl();
    try {
      var tutorParsed = new URL(tutor, moodleBaseUrl());
      var sessionid = tutorParsed.searchParams.get("sessionid") || queryValue("userdata-prequran-sessionid") || queryValue("sessionid");
      var studentid = tutorParsed.searchParams.get("studentid") || queryValue("userdata-prequran-studentid") || queryValue("studentid") || "0";
      var url = new URL("/local/hubredirect/issue_child.php", moodleBaseUrl());
      url.searchParams.set("goto", "alphabet_listen");
      url.searchParams.set("managed_student", "0");
      url.searchParams.set("monitor_studentid", studentid);
      if (sessionid) {
        url.searchParams.set("live_sessionid", sessionid);
      }
      return url.toString();
    } catch (e) {
      return moodleBaseUrl() + "/local/hubredirect/issue_child.php?goto=alphabet_listen&managed_student=0";
    }
  }

  function materialsUrl() {
    var direct = queryValue("userdata-prequran-materials-url") || queryValue("pqaMaterialsUrl");
    if (direct) {
      return direct;
    }
    var sessionid = queryValue("userdata-prequran-sessionid") || queryValue("sessionid");
    if (!sessionid) {
      try {
        var parsedTutor = new URL(tutorUrl(), moodleBaseUrl());
        sessionid = parsedTutor.searchParams.get("sessionid") || "";
      } catch (e) {}
    }
    if (!sessionid) {
      var haystack = [
        window.location.href,
        safeStorageText(window.localStorage),
        safeStorageText(window.sessionStorage),
        document.body ? (document.body.textContent || "").slice(0, 60000) : ""
      ].join(" ");
      var match = haystack.match(/\bprequran-live-(\d+)\b/i) || haystack.match(/\b(?:userdata-prequran-sessionid|sessionid)["':=\s]+(\d+)\b/i);
      if (match && match[1]) {
        sessionid = match[1];
      }
    }
    if (!sessionid) {
      return "";
    }
    var url = new URL("/local/hubredirect/live_session_materials.php", moodleBaseUrl());
    url.searchParams.set("sessionid", sessionid);
    return url.toString();
  }

  function userRole() {
    return (queryValue("userdata-prequran-role") || queryValue("pqaRole") || "").toLowerCase();
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "." + TITLE_CLASS + "{cursor:pointer!important;text-decoration:underline!important;text-underline-offset:3px!important}",
      "." + DETAILS_CLASS + "{background:linear-gradient(135deg,#efffed 0%,#fff8e8 100%)!important;border:1px solid rgba(88,134,82,.28)!important;border-radius:12px!important;box-shadow:0 24px 64px rgba(26,50,32,.24)!important}",
      "." + DETAILS_CLASS + " *{border-color:rgba(88,134,82,.18)!important}",
      "." + DETAILS_CLASS + " a{color:#2f7d45!important;font-weight:800!important;text-decoration:underline!important;text-underline-offset:3px!important}",
      "." + DETAILS_CLASS + " [role='document'],." + DETAILS_CLASS + " [class*='content'],." + DETAILS_CLASS + " [class*='Content']{background:#dff5df!important}",
      "#" + LAUNCHER_ID + "{position:fixed;right:22px;bottom:22px;z-index:2147482999;display:inline-flex;align-items:center;gap:9px;min-height:46px;padding:0 16px;border:1px solid rgba(105,76,45,.28);border-radius:999px;background:#6f4e32;color:#fff;font:900 14px system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 16px 42px rgba(0,0,0,.28);cursor:pointer}",
      "#" + LAUNCHER_ID + ":hover{background:#5e4129}",
      "#" + LAUNCHER_ID + " .pqa-vt-dot{width:10px;height:10px;border-radius:50%;background:#9cf27c;box-shadow:0 0 0 4px rgba(156,242,124,.22)}",
      "#" + MATERIALS_LAUNCHER_ID + "{position:fixed;right:22px;bottom:76px;z-index:2147482999;display:inline-flex;align-items:center;gap:9px;min-height:46px;padding:0 16px;border:1px solid rgba(47,111,78,.34);border-radius:999px;background:#2f6f4e;color:#fff;font:900 14px system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 16px 42px rgba(0,0,0,.26);cursor:pointer}",
      "#" + MATERIALS_LAUNCHER_ID + ":hover{background:#285f43}",
      "#" + MATERIALS_LAUNCHER_ID + " .pqa-mat-icon{width:16px;height:16px;border:2px solid currentColor;border-radius:3px;box-shadow:inset 0 -4px 0 rgba(255,255,255,.22)}",
      "#" + WHITEBOARD_FIT_ID + "{position:fixed;right:22px;bottom:130px;z-index:2147482999;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 13px;border:1px solid rgba(37,74,121,.30);border-radius:999px;background:#315d96;color:#fff;font:900 13px system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 14px 36px rgba(0,0,0,.22);cursor:pointer}",
      "#" + WHITEBOARD_FIT_ID + ":hover{background:#284f82}",
      "#" + WHITEBOARD_SCROLL_ID + "{position:fixed;right:22px;bottom:182px;z-index:2147482999;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 13px;border:1px solid rgba(104,70,22,.30);border-radius:999px;background:#7b561f;color:#fff;font:900 13px system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 14px 36px rgba(0,0,0,.22);cursor:pointer}",
      "#" + WHITEBOARD_SCROLL_ID + ":hover{background:#684818}",
      "#" + WHITEBOARD_SCROLL_ID + "[aria-pressed='true']{background:#b1691b}",
      "#" + PANEL_ID + "{position:fixed;z-index:2147483000;right:22px;bottom:82px;width:min(440px,calc(100vw - 32px));max-height:calc(100vh - 112px);border:1px solid rgba(105,76,45,.22);border-radius:14px;background:#fff;box-shadow:0 26px 70px rgba(0,0,0,.34);overflow:hidden}",
      "#" + PANEL_ID + " .pqa-vt-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;background:linear-gradient(135deg,#eaffea 0%,#fff7e7 100%);border-bottom:1px solid rgba(105,76,45,.14);font:800 14px system-ui,-apple-system,Segoe UI,sans-serif;color:#3f2c1f}",
      "#" + PANEL_ID + " .pqa-vt-bar span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      "#" + PANEL_ID + " .pqa-vt-actions{display:flex;align-items:center;gap:7px}",
      "#" + PANEL_ID + " .pqa-vt-popout{min-height:34px;padding:0 11px;border:1px solid rgba(105,76,45,.22);border-radius:9px;background:#fff7e7;color:#3f2c1f;font:800 13px system-ui,-apple-system,Segoe UI,sans-serif;cursor:pointer;text-decoration:none}",
      "#" + PANEL_ID + " iframe{display:block;width:100%;height:min(640px,calc(100vh - 166px));border:0;background:#fff}",
      "." + PRESENTATION_HOST_CLASS + "{position:relative!important}",
      ".pqa-whiteboard-scroll-host{overflow:visible!important;overscroll-behavior:contain!important}",
      ".pqa-whiteboard-scroll-target{will-change:transform!important;transition:transform .12s ease-out!important}",
      "#" + LESSON_STAGE_ID + "{position:absolute;inset:0;z-index:20;background:#fff;display:flex;overflow:hidden}",
      "#" + LESSON_STAGE_ID + "." + PRESENTATION_FIXED_CLASS + "{position:fixed!important;inset:auto!important;z-index:2147482500!important;box-shadow:inset 0 0 0 1px rgba(23,48,68,.10)}",
      "#" + LESSON_STAGE_ID + " iframe{display:block;width:100%;height:100%;border:0;background:#fff}",
      "@media(max-width:760px){#" + LAUNCHER_ID + "{right:12px;bottom:12px;min-height:42px;padding:0 12px;font-size:13px}#" + MATERIALS_LAUNCHER_ID + "{right:12px;bottom:62px;min-height:42px;padding:0 12px;font-size:13px}#" + WHITEBOARD_FIT_ID + "{right:12px;bottom:112px;min-height:38px;padding:0 11px;font-size:12px}#" + WHITEBOARD_SCROLL_ID + "{right:12px;bottom:158px;min-height:38px;padding:0 11px;font-size:12px}#" + PANEL_ID + "{right:8px;bottom:62px;width:calc(100vw - 16px);max-height:calc(100vh - 76px)}#" + PANEL_ID + " iframe{height:calc(100vh - 132px)}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function ensureLauncher() {
    ensureStyle();
    var launcher = document.getElementById(LAUNCHER_ID);
    if (launcher) {
      return launcher;
    }

    launcher = document.createElement("button");
    launcher.id = LAUNCHER_ID;
    launcher.type = "button";
    launcher.setAttribute("aria-haspopup", "dialog");
    launcher.setAttribute("aria-controls", PANEL_ID);
    launcher.setAttribute("title", "Open Virtual Tutor");
    launcher.innerHTML = '<span class="pqa-vt-dot" aria-hidden="true"></span><span>Virtual Tutor</span>';
    launcher.addEventListener("click", openTutorWindow);
    document.body.appendChild(launcher);
    return launcher;
  }

  function ensureMaterialsLauncher() {
    ensureStyle();
    var url = materialsUrl();
    var role = userRole();
    var allowed = url && (!role || role === "teacher" || role === "admin_observer" || role === "moderator");
    var existing = document.getElementById(MATERIALS_LAUNCHER_ID);
    if (!allowed) {
      if (existing && existing.parentElement) {
        existing.parentElement.removeChild(existing);
      }
      return null;
    }
    if (existing) {
      return existing;
    }

    var launcher = document.createElement("button");
    launcher.id = MATERIALS_LAUNCHER_ID;
    launcher.type = "button";
    launcher.setAttribute("title", "Open Quraan Materials");
    launcher.innerHTML = '<span class="pqa-mat-icon" aria-hidden="true"></span><span>Quraan Materials</span>';
    launcher.addEventListener("click", openMaterialsWindow);
    document.body.appendChild(launcher);
    return launcher;
  }

  function ensureWhiteboardFitHelper() {
    ensureStyle();
    var role = userRole();
    var allowed = !role || role === "teacher" || role === "admin_observer" || role === "moderator";
    var existing = document.getElementById(WHITEBOARD_FIT_ID);
    if (!allowed) {
      if (existing && existing.parentElement) {
        existing.parentElement.removeChild(existing);
      }
      return null;
    }
    if (existing) {
      return existing;
    }

    var helper = document.createElement("button");
    helper.id = WHITEBOARD_FIT_ID;
    helper.type = "button";
    helper.setAttribute("title", "Fit the current agenda or material to the whiteboard");
    helper.innerHTML = "<span aria-hidden=\"true\">&#8596;</span><span>Fit Material</span>";
    helper.addEventListener("click", function () {
      fitWhiteboardPresentation("manual");
    });
    document.body.appendChild(helper);
    return helper;
  }

  function ensureWhiteboardScrollHelper() {
    ensureStyle();
    var role = userRole();
    var allowed = !role || role === "teacher" || role === "admin_observer" || role === "moderator";
    var existing = document.getElementById(WHITEBOARD_SCROLL_ID);
    if (!allowed) {
      if (existing && existing.parentElement) {
        existing.parentElement.removeChild(existing);
      }
      return null;
    }
    if (existing) {
      existing.setAttribute("aria-pressed", whiteboardScrollEnabled ? "true" : "false");
      return existing;
    }

    var helper = document.createElement("button");
    helper.id = WHITEBOARD_SCROLL_ID;
    helper.type = "button";
    helper.setAttribute("title", "Toggle mouse-wheel scrolling for the current material");
    helper.setAttribute("aria-pressed", "false");
    helper.innerHTML = "<span aria-hidden=\"true\">&#8597;</span><span>Scroll Material</span>";
    helper.addEventListener("click", function () {
      toggleWhiteboardScroll();
    });
    document.body.appendChild(helper);
    return helper;
  }

  function popupFeatures() {
    var width = Math.max(420, Math.round((window.screen && window.screen.availWidth ? window.screen.availWidth : 1280) * 0.34));
    var height = Math.min(760, Math.max(580, Math.round((window.screen && window.screen.availHeight ? window.screen.availHeight : 820) * 0.84)));
    var left = Math.max(0, Math.round(((window.screen && window.screen.availWidth ? window.screen.availWidth : 1280) - width) - 24));
    var top = Math.max(0, Math.round(((window.screen && window.screen.availHeight ? window.screen.availHeight : 820) - height) / 2));
    return "popup=yes,width=" + width + ",height=" + height + ",left=" + left + ",top=" + top + ",resizable=yes,scrollbars=yes";
  }

  function openTutorWindow() {
    ensureLauncher();
    var tutorWindow = window.open(tutorUrl(), POPUP_NAME, popupFeatures());
    if (tutorWindow && tutorWindow.focus) {
      tutorWindow.focus();
      return true;
    }
    openPanel();
    return false;
  }

  function openLessonWindow() {
    lessonWindow = window.open(lessonUrl(), LESSON_POPUP_NAME, popupFeatures()) || lessonWindow;
    if (lessonWindow && lessonWindow.focus) {
      lessonWindow.focus();
      return true;
    }
    return false;
  }

  function openMaterialsWindow() {
    var url = materialsUrl();
    if (!url) {
      return false;
    }
    var materialsWindow = window.open(url, MATERIALS_POPUP_NAME, popupFeatures());
    if (materialsWindow && materialsWindow.focus) {
      materialsWindow.focus();
      return true;
    }
    return false;
  }

  function visibleRect(element) {
    if (!element || element.nodeType !== 1 || !(element instanceof Element)) {
      return null;
    }
    var rect = element.getBoundingClientRect();
    if (rect.width < 480 || rect.height < 280 || rect.bottom <= 0 || rect.right <= 0 || rect.top >= window.innerHeight || rect.left >= window.innerWidth) {
      return null;
    }
    return rect;
  }

  function isLessonStageCandidate(element) {
    if (!element || element === document.body || element === document.documentElement || element.closest("#" + PANEL_ID) || element.closest("#" + LAUNCHER_ID)) {
      return false;
    }
    var rect = visibleRect(element);
    if (!rect) {
      return false;
    }
    var text = (element.textContent || "").replace(/\s+/g, " ").trim();
    if (/public chat|shared notes|content library|message public chat/i.test(text) && rect.left < window.innerWidth * 0.42) {
      return false;
    }
    return true;
  }

  function candidateScore(element) {
    var rect = visibleRect(element);
    if (!rect) {
      return 0;
    }
    var name = ((element.getAttribute("aria-label") || "") + " " + (element.className || "") + " " + (element.id || "")).toLowerCase();
    var score = rect.width * rect.height;
    if (/presentation|whiteboard|slide/.test(name)) {
      score += 900000;
    }
    if (rect.left > window.innerWidth * 0.25) {
      score += 250000;
    }
    if (rect.top > 80 && rect.bottom < window.innerHeight - 90) {
      score += 150000;
    }
    return score;
  }

  function presentationHostFromPoint() {
    var point = document.elementFromPoint(Math.round(window.innerWidth * 0.68), Math.round(window.innerHeight * 0.52));
    var node = point;
    var depth = 0;
    while (node && node.nodeType === 1 && depth < 10) {
      if (isLessonStageCandidate(node)) {
        return node;
      }
      node = node.parentElement;
      depth += 1;
    }
    return null;
  }

  function findPresentationHost() {
    var best = presentationHostFromPoint();
    if (best) {
      return best;
    }
    var bestScore = 0;
    var selectors = [
      "[data-test*='presentation']",
      "[data-test*='whiteboard']",
      "[aria-label*='Presentation']",
      "[aria-label*='presentation']",
      "[class*='presentation']",
      "[class*='Presentation']",
      "[class*='whiteboard']",
      "[class*='Whiteboard']",
      "[class*='slide']",
      "[class*='Slide']"
    ];
    var nodes = document.querySelectorAll(selectors.join(","));
    for (var i = 0; i < nodes.length; i += 1) {
      if (!isLessonStageCandidate(nodes[i])) {
        continue;
      }
      var score = candidateScore(nodes[i]);
      if (score > bestScore) {
        best = nodes[i];
        bestScore = score;
      }
    }
    return best;
  }

  function findLeftSidebarRight() {
    var right = 0;
    var nodes = document.querySelectorAll("aside, nav, [role='navigation'], [class*='sidebar'], [class*='Sidebar'], [class*='chat'], [class*='Chat']");
    for (var i = 0; i < nodes.length; i += 1) {
      var rect = nodes[i].getBoundingClientRect();
      if (rect.left <= 4 && rect.width >= 180 && rect.width <= window.innerWidth * 0.48 && rect.height >= window.innerHeight * 0.45) {
        right = Math.max(right, rect.right);
      }
    }
    return right;
  }

  function fallbackPresentationRect() {
    var left = Math.max(findLeftSidebarRight(), Math.round(window.innerWidth * 0.34));
    var top = Math.round(window.innerHeight * 0.25);
    var bottom = Math.round(window.innerHeight * 0.82);
    var right = window.innerWidth - 18;
    var whitePoint = document.elementFromPoint(Math.round(window.innerWidth * 0.68), Math.round(window.innerHeight * 0.52));
    var node = whitePoint;
    var depth = 0;
    while (node && node.nodeType === 1 && depth < 8) {
      var rect = visibleRect(node);
      if (rect && rect.left >= left - 80 && rect.top >= 90 && rect.bottom <= window.innerHeight - 80 && rect.width >= 520 && rect.height >= 320) {
        left = Math.max(left, rect.left);
        top = Math.max(90, rect.top);
        right = Math.min(window.innerWidth - 8, rect.right);
        bottom = Math.min(window.innerHeight - 80, rect.bottom);
        break;
      }
      node = node.parentElement;
      depth += 1;
    }
    if (bottom - top < 320) {
      bottom = Math.min(window.innerHeight - 96, top + 420);
    }
    if (right - left < 520) {
      left = Math.max(0, window.innerWidth * 0.18);
      right = window.innerWidth - 8;
    }
    return {
      left: Math.round(left),
      top: Math.round(top),
      width: Math.round(right - left),
      height: Math.round(bottom - top)
    };
  }

  function applyFixedLessonStage(stage) {
    var rect = fallbackPresentationRect();
    stage.classList.add(PRESENTATION_FIXED_CLASS);
    stage.style.left = rect.left + "px";
    stage.style.top = rect.top + "px";
    stage.style.width = rect.width + "px";
    stage.style.height = rect.height + "px";
  }

  function mountLessonInPresentation() {
    ensureStyle();
    var stage = document.getElementById(LESSON_STAGE_ID);
    if (!stage) {
      stage = document.createElement("section");
      stage.id = LESSON_STAGE_ID;
      stage.setAttribute("aria-label", "Current Lesson");
      stage.innerHTML = '<iframe title="Current Lesson" allow="autoplay; fullscreen; microphone; camera"></iframe>';
    }
    if (stage.parentElement !== document.body) {
      document.body.appendChild(stage);
    }
    applyFixedLessonStage(stage);
    var frame = stage.querySelector("iframe");
    var url = lessonUrl();
    if (frame && frame.getAttribute("src") !== url) {
      frame.setAttribute("src", url);
    }
    lessonStageMounted = true;
    return true;
  }

  function lessonExplainerHtml(url) {
    return [
      '<div style="max-width:720px;margin:0 auto;padding:24px;text-align:left;color:#173044;background:#dff5df;font:500 15px/1.45 system-ui,-apple-system,Segoe UI,sans-serif">',
      '<strong style="font-size:20px">Using Live Session</strong><br><br>',
      'Welcome. This is how to use the Pre-Quran Live Session.<br><br>',
      '<strong>1. Open the Live Sessions page</strong><br>',
      'From the dashboard, find the scheduled session you want to use.<br><br>',
      '<strong>2. Start the class</strong><br>',
      'If you are the teacher or admin, click <strong>Start class</strong>. This will open the BigBlueButton live room.<br><br>',
      '<strong>3. Wait for the session to load</strong><br>',
      'The system may also open the <strong>Current Lesson</strong> in a separate window and the <strong>Virtual Tutor</strong> in another floating window.<br><br>',
      '<strong>4. Join audio</strong><br>',
      'Inside BigBlueButton, join audio when prompted. Choose microphone if you will speak, or listen only if you are observing.<br><br>',
      '<strong>5. Use the support tools</strong><br>',
      'The live room is where the teacher speaks with students, uses chat, and guides the class.<br>',
      'The <strong>Current Lesson</strong> window shows the lesson students should follow during class.<br>',
      'The <strong>Virtual Tutor</strong> window is used for extra help, one step at a time.<br><br>',
      '<strong>During the class</strong><br>',
      'Keep the BigBlueButton room open. Do not close the Current Lesson or Virtual Tutor unless you no longer need them.<br><br>',
      '<strong>End of session</strong><br>',
      'The teacher can leave or end the meeting from BigBlueButton.',
      '</div>'
    ].join("");
  }

  function scheduleLessonStageMount() {
    if (lessonStageMounted || lessonStageAttempts >= 24) {
      return;
    }
    lessonStageAttempts += 1;
    window.setTimeout(function () {
      mountLessonInPresentation();
      if (!lessonStageMounted) {
        scheduleLessonStageMount();
      }
    }, lessonStageAttempts < 8 ? 1000 : 2500);
  }

  function openPanel() {
    ensureStyle();
    ensureLauncher();
    var panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", "Virtual Tutor");
      panel.innerHTML = '<div class="pqa-vt-bar"><span>Virtual Tutor</span><div class="pqa-vt-actions"><a class="pqa-vt-popout" target="_blank" rel="noopener">Window</a></div></div><iframe title="Virtual Tutor" allow="microphone; autoplay"></iframe>';
      document.body.appendChild(panel);
    }

    var url = tutorUrl();
    var frame = panel.querySelector("iframe");
    var popout = panel.querySelector(".pqa-vt-popout");
    if (popout) {
      popout.setAttribute("href", url);
      popout.onclick = function (event) {
        event.preventDefault();
        openTutorWindow();
      };
    }
    if (frame && frame.getAttribute("src") !== url) {
      frame.setAttribute("src", url);
    }
  }

  function isVirtualTutorTitleCandidate(element) {
    if (!element || element.nodeType !== 1 || element.closest("#" + PANEL_ID) || element.closest("#" + LAUNCHER_ID)) {
      return false;
    }

    var text = (element.textContent || "").replace(/\s+/g, " ").trim();
    if (text.indexOf("Virtual Tutor") === -1 || text.length > 80) {
      return false;
    }

    var rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.top < window.innerHeight && rect.width >= 36 && rect.width <= 360 && rect.height >= 12 && rect.height <= 90;
  }

  function titleFromTarget(target) {
    var node = target && target.nodeType === 1 ? target : null;
    var depth = 0;
    while (node && depth < 7) {
      if (isVirtualTutorTitleCandidate(node)) {
        return node;
      }
      node = node.parentElement;
      depth += 1;
    }
    return null;
  }

  function styleSessionDetails() {
    var nodes = document.querySelectorAll("h1, h2, h3, h4, div, span");
    for (var i = 0; i < nodes.length; i += 1) {
      var text = (nodes[i].textContent || "").replace(/\s+/g, " ").trim();
      if (text !== "Session Details" && text.indexOf("Use the Virtual Tutor for live lesson help") === -1) {
        continue;
      }

      var modal = nodes[i];
      for (var depth = 0; modal && depth < 8; depth += 1) {
        var rect = modal.getBoundingClientRect();
        var modalText = (modal.textContent || "").replace(/\s+/g, " ").trim();
        if (rect.width >= 360 && rect.width <= 980 && rect.height >= 90 && rect.height <= 560 && modalText.indexOf("Session Details") !== -1) {
          modal.classList.add(DETAILS_CLASS);
          if (!modal.getAttribute("data-pqa-lesson-replaced")) {
            var url = lessonUrl();
            modal.setAttribute("data-pqa-lesson-replaced", "1");
            modal.innerHTML = lessonExplainerHtml(url);
          }
          break;
        }
        modal = modal.parentElement;
      }
    }
  }

  function hideNativeContentLibrary() {
    var nodes = document.querySelectorAll("button, a, [role='button'], [role='tab'], li, div, span");
    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      if (node.closest("#" + PANEL_ID) || node.closest("#" + LAUNCHER_ID) || node.closest("#" + MATERIALS_LAUNCHER_ID)) {
        continue;
      }
      var text = (node.textContent || "").replace(/\s+/g, " ").trim();
      if (!/^content library$/i.test(text)) {
        continue;
      }
      var target = node;
      var depth = 0;
      while (target.parentElement && depth < 4) {
        var rect = target.parentElement.getBoundingClientRect();
        if (rect.left < window.innerWidth * 0.45 && rect.width >= 120 && rect.width <= 420) {
          target = target.parentElement;
        }
        depth += 1;
      }
      target.style.display = "none";
      target.setAttribute("aria-hidden", "true");
    }
  }

  function visibleButtonRect(element) {
    if (!element || element.nodeType !== 1 || !(element instanceof HTMLElement)) {
      return null;
    }
    if (element.closest("#" + PANEL_ID) || element.closest("#" + LAUNCHER_ID) || element.closest("#" + MATERIALS_LAUNCHER_ID) || element.closest("#" + WHITEBOARD_FIT_ID) || element.closest("#" + WHITEBOARD_SCROLL_ID)) {
      return null;
    }
    var style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity || "1") < 0.1) {
      return null;
    }
    var rect = element.getBoundingClientRect();
    if (rect.width < 16 || rect.height < 16 || rect.bottom <= 0 || rect.right <= 0 || rect.top >= window.innerHeight || rect.left >= window.innerWidth) {
      return null;
    }
    return rect;
  }

  function controlName(element) {
    return [
      element.getAttribute("aria-label") || "",
      element.getAttribute("title") || "",
      element.getAttribute("data-test") || "",
      element.getAttribute("data-testid") || "",
      element.getAttribute("data-tooltip") || "",
      element.textContent || "",
      element.className || "",
      element.id || ""
    ].join(" ").replace(/\s+/g, " ").trim();
  }

  function whiteboardSignature() {
    var text = "";
    var host = findPresentationHost();
    if (host) {
      text = (host.textContent || "").replace(/\s+/g, " ").slice(0, 500);
    }
    var images = document.querySelectorAll("img[src], canvas, svg, [style*='background-image']");
    var parts = [text, String(images.length)];
    for (var i = 0; i < images.length && i < 12; i += 1) {
      parts.push(images[i].getAttribute("src") || images[i].getAttribute("style") || images[i].className || images[i].id || "");
    }
    return parts.join("|");
  }

  function fitControlScore(element) {
    var rect = visibleButtonRect(element);
    if (!rect) {
      return 0;
    }
    var name = controlName(element);
    var normalized = name.toLowerCase();
    if (/leave|audio|microphone|camera|webcam|chat|users|poll|reaction|emoji|options|actions|upload|download|public chat|shared notes|caption|record|recording|breakout|settings|fullscreen/i.test(normalized)) {
      return 0;
    }

    var score = 0;
    if (/fit\s*(to)?\s*width|width\s*fit|fit.*presentation|presentation.*fit|fit.*slide|slide.*fit/i.test(normalized)) {
      score += 120;
    } else if (/fit\s*(to)?\s*page|page\s*fit|fit.*screen|screen.*fit|fit.*whiteboard|whiteboard.*fit/i.test(normalized)) {
      score += 95;
    } else if (/reset\s*zoom|zoom.*reset|zoom.*fit|fit/i.test(normalized)) {
      score += 65;
    } else if (/horizontal|expand|maximize|restore\s*zoom|\u2194|\u27f7|\u21d4/.test(name)) {
      score += 45;
    }

    if (score === 0) {
      return 0;
    }
    if (rect.top > window.innerHeight * 0.58) {
      score += 20;
    }
    if (rect.left > window.innerWidth * 0.45) {
      score += 14;
    }
    if (rect.width <= 72 && rect.height <= 72) {
      score += 8;
    }
    return score;
  }

  function findWhiteboardFitControl() {
    var best = null;
    var bestScore = 0;
    var nodes = document.querySelectorAll("button,[role='button'],[aria-label],[title],[data-test],[data-testid]");
    for (var i = 0; i < nodes.length; i += 1) {
      var score = fitControlScore(nodes[i]);
      if (score > bestScore) {
        best = nodes[i];
        bestScore = score;
      }
    }
    return best;
  }

  function clickElementAt(x, y) {
    var target = document.elementFromPoint(Math.round(x), Math.round(y));
    var node = target;
    var depth = 0;
    while (node && node.nodeType === 1 && depth < 5) {
      if (node.closest("#" + PANEL_ID) || node.closest("#" + LAUNCHER_ID) || node.closest("#" + MATERIALS_LAUNCHER_ID) || node.closest("#" + WHITEBOARD_FIT_ID) || node.closest("#" + WHITEBOARD_SCROLL_ID)) {
        return false;
      }
      var rect = visibleButtonRect(node);
      if (rect) {
        var name = controlName(node).toLowerCase();
        if (/leave|audio|microphone|camera|webcam|chat|users|poll|reaction|emoji|options|actions|upload|download|public chat|shared notes|record|recording|breakout|settings|fullscreen/i.test(name)) {
          return false;
        }
        node.click();
        return true;
      }
      node = node.parentElement;
      depth += 1;
    }
    return false;
  }

  function clickWhiteboardFitByPoint(signature) {
    if (signature && signature === lastCoordinateFitSignature) {
      return false;
    }
    var host = findPresentationHost();
    var rect = host ? host.getBoundingClientRect() : null;
    if (!rect || rect.width < 520 || rect.height < 320) {
      rect = fallbackPresentationRect();
      rect.right = rect.left + rect.width;
      rect.bottom = rect.top + rect.height;
    }
    var points = [
      [rect.right - 34, rect.bottom - 28],
      [rect.right - 82, rect.bottom - 28],
      [rect.right - 128, rect.bottom - 28],
      [window.innerWidth * 0.79, window.innerHeight - 88]
    ];
    for (var i = 0; i < points.length; i += 1) {
      if (clickElementAt(points[i][0], points[i][1])) {
        lastCoordinateFitSignature = signature || whiteboardSignature();
        return true;
      }
    }
    return false;
  }

  function fitWhiteboardPresentation(reason) {
    if (!liveSessionLooksReady()) {
      return false;
    }
    var now = Date.now();
    if (reason !== "manual" && now - lastWhiteboardFitAt < 2800) {
      return false;
    }
    var control = findWhiteboardFitControl();
    if (control) {
      lastWhiteboardFitAt = now;
      control.click();
      return true;
    }
    lastWhiteboardFitAt = now;
    return clickWhiteboardFitByPoint(whiteboardSignature());
  }

  function clearWhiteboardScrollTarget() {
    if (whiteboardScrollTarget && whiteboardScrollTarget.classList) {
      whiteboardScrollTarget.classList.remove("pqa-whiteboard-scroll-target");
      whiteboardScrollTarget.style.transform = "";
      whiteboardScrollTarget.style.transformOrigin = "";
      whiteboardScrollTarget.style.willChange = "";
    }
    if (whiteboardScrollHost && whiteboardScrollHost.classList) {
      whiteboardScrollHost.classList.remove("pqa-whiteboard-scroll-host");
    }
    whiteboardScrollTarget = null;
    whiteboardScrollHost = null;
    whiteboardScrollOffset = 0;
  }

  function materialSurfaceScore(element) {
    if (!element || element.nodeType !== 1 || !(element instanceof HTMLElement)) {
      return 0;
    }
    if (element.closest("#" + PANEL_ID) || element.closest("#" + LAUNCHER_ID) || element.closest("#" + MATERIALS_LAUNCHER_ID) || element.closest("#" + WHITEBOARD_FIT_ID) || element.closest("#" + WHITEBOARD_SCROLL_ID)) {
      return 0;
    }
    var rect = element.getBoundingClientRect();
    if (rect.width < 260 || rect.height < 240 || rect.bottom < 120 || rect.right < 320 || rect.top > window.innerHeight - 160 || rect.left > window.innerWidth - 160) {
      return 0;
    }
    var name = [
      element.getAttribute("aria-label") || "",
      element.getAttribute("data-test") || "",
      element.getAttribute("data-testid") || "",
      element.className || "",
      element.id || "",
      element.tagName || ""
    ].join(" ").toLowerCase();
    if (/toolbar|button|control|cursor|annotation|palette|chat|user|sidebar|video|webcam|audio|caption|actions/i.test(name)) {
      return 0;
    }

    var area = rect.width * rect.height;
    var score = area;
    if (/svg|canvas|image|presentation|slide|whiteboard|viewer|page|pdf/i.test(name)) {
      score += 1000000;
    }
    var style = window.getComputedStyle(element);
    if (/rgb\(255,\s*255,\s*255\)|#fff|white/i.test(style.backgroundColor || "")) {
      score += 250000;
    }
    if (rect.left > window.innerWidth * 0.18 && rect.top > 100) {
      score += 150000;
    }
    return score;
  }

  function findWhiteboardScrollTarget() {
    var host = findPresentationHost();
    if (!host) {
      return null;
    }
    var best = null;
    var bestScore = materialSurfaceScore(host);
    var nodes = host.querySelectorAll("svg,canvas,img,object,embed,[style*='background-image'],[class*='presentation'],[class*='Presentation'],[class*='whiteboard'],[class*='Whiteboard'],[class*='slide'],[class*='Slide'],[class*='page'],[class*='Page'],[data-test*='presentation'],[data-test*='slide'],[data-testid*='presentation'],[data-testid*='slide']");
    for (var i = 0; i < nodes.length; i += 1) {
      var score = materialSurfaceScore(nodes[i]);
      if (score > bestScore) {
        best = nodes[i];
        bestScore = score;
      }
    }
    if (!best && bestScore > 0) {
      best = host;
    }
    return best ? { host: host, target: best } : null;
  }

  function whiteboardScrollLimit() {
    var target = whiteboardScrollTarget;
    if (!target) {
      return 0;
    }
    var rect = target.getBoundingClientRect();
    var viewport = Math.max(360, window.innerHeight - 250);
    var extra = Math.max(0, rect.height - viewport);
    return Math.max(extra + 120, Math.round(window.innerHeight * 0.45));
  }

  function applyWhiteboardScrollOffset() {
    if (!whiteboardScrollTarget) {
      return;
    }
    var limit = whiteboardScrollLimit();
    if (whiteboardScrollOffset > 120) {
      whiteboardScrollOffset = 120;
    }
    if (whiteboardScrollOffset < -limit) {
      whiteboardScrollOffset = -limit;
    }
    whiteboardScrollTarget.style.transformOrigin = "center top";
    whiteboardScrollTarget.style.transform = "translate3d(0," + Math.round(whiteboardScrollOffset) + "px,0)";
  }

  function enableWhiteboardScroll() {
    clearWhiteboardScrollTarget();
    var found = findWhiteboardScrollTarget();
    if (!found) {
      return false;
    }
    whiteboardScrollHost = found.host;
    whiteboardScrollTarget = found.target;
    whiteboardScrollHost.classList.add("pqa-whiteboard-scroll-host");
    whiteboardScrollTarget.classList.add("pqa-whiteboard-scroll-target");
    whiteboardScrollOffset = 0;
    applyWhiteboardScrollOffset();
    whiteboardScrollEnabled = true;
    ensureWhiteboardScrollHelper();
    return true;
  }

  function disableWhiteboardScroll() {
    whiteboardScrollEnabled = false;
    clearWhiteboardScrollTarget();
    ensureWhiteboardScrollHelper();
  }

  function toggleWhiteboardScroll() {
    if (whiteboardScrollEnabled) {
      disableWhiteboardScroll();
      return;
    }
    enableWhiteboardScroll();
  }

  function handleWhiteboardWheel(event) {
    if (!whiteboardScrollEnabled || !liveSessionLooksReady()) {
      return;
    }
    if (!whiteboardScrollTarget || !document.documentElement.contains(whiteboardScrollTarget)) {
      if (!enableWhiteboardScroll()) {
        return;
      }
    }
    var host = whiteboardScrollHost || findPresentationHost();
    var insideHost = host && (event.target === host || (event.target && event.target.nodeType === 1 && host.contains(event.target)));
    var rect = host ? host.getBoundingClientRect() : null;
    var insideRect = rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!insideHost && !insideRect) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    whiteboardScrollOffset -= event.deltaY || 0;
    applyWhiteboardScrollOffset();
  }

  function resetWhiteboardScrollAfterDocumentChange() {
    if (!whiteboardScrollEnabled) {
      return;
    }
    window.setTimeout(function () {
      enableWhiteboardScroll();
    }, 800);
  }

  function scheduleWhiteboardFitAssist() {
    if (whiteboardFitStarted) {
      return;
    }
    whiteboardFitStarted = true;

    var attempts = 0;
    function tick() {
      attempts += 1;
      if (liveSessionLooksReady()) {
        fitWhiteboardPresentation("poll");
      }
      if (attempts < 90) {
        window.setTimeout(tick, attempts < 18 ? 1800 : 6000);
      }
    }

    window.setTimeout(tick, 3500);
    var observer = new MutationObserver(function () {
      if (!liveSessionLooksReady()) {
        return;
      }
      var signature = whiteboardSignature();
      if (signature && signature !== lastWhiteboardSignature) {
        lastWhiteboardSignature = signature;
        resetWhiteboardScrollAfterDocumentChange();
        window.setTimeout(function () {
          fitWhiteboardPresentation("document-change");
        }, 1200);
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "style", "class", "aria-label", "title"]
    });
  }

  function renameSessionDetailsTrigger() {
    var nodes = document.querySelectorAll("[aria-label], [title], [data-test], button, [role='button'], div, span");
    for (var i = 0; i < nodes.length; i += 1) {
      var aria = nodes[i].getAttribute("aria-label") || "";
      var title = nodes[i].getAttribute("title") || "";
      var text = (nodes[i].textContent || "").replace(/\s+/g, " ").trim();
      if (/open session details/i.test(aria) || /open session details/i.test(title) || text === "Open session details") {
        nodes[i].setAttribute("aria-label", "How to use live session");
        nodes[i].setAttribute("title", "How to use live session");
        if (text === "Open session details") {
          nodes[i].textContent = "How to use live session";
        }
      }
    }
  }

  function markTitle() {
    scheduled = false;
    ensureLauncher();
    ensureMaterialsLauncher();
    ensureWhiteboardFitHelper();
    ensureWhiteboardScrollHelper();
    tutorUrlFromDocument();
    var nodes = document.querySelectorAll("a, button, [role='button'], span, div");
    for (var i = 0; i < nodes.length; i += 1) {
      if (isVirtualTutorTitleCandidate(nodes[i])) {
        nodes[i].classList.add(TITLE_CLASS);
        nodes[i].setAttribute("title", "Open Virtual Tutor");
        if (!nodes[i].hasAttribute("tabindex")) {
          nodes[i].setAttribute("tabindex", "0");
        }
      }
    }
    styleSessionDetails();
    hideNativeContentLibrary();
    renameSessionDetailsTrigger();
    if (!lessonStageMounted && liveSessionLooksReady()) {
      mountLessonInPresentation();
    }
    scheduleWhiteboardFitAssist();
  }

  function scheduleMark() {
    if (scheduled) {
      return;
    }
    scheduled = true;
    window.requestAnimationFrame(markTitle);
  }

  function interceptTitleEvent(event) {
    var title = titleFromTarget(event.target);
    if (!title) {
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
    openTutorWindow();
    return true;
  }

  function shouldAutoOpen() {
    var direct = queryValue("userdata-prequran-tutor-open") || queryValue("pqaTutorOpen");
    if (direct === "1" || direct === "true") {
      return true;
    }
    return /\bvirtual tutor\b/i.test(document.title || "");
  }

  function shouldAutoOpenLesson() {
    var direct = queryValue("userdata-prequran-lesson-open") || queryValue("pqaLessonOpen");
    if (direct === "1" || direct === "true") {
      return true;
    }
    return userRole() === "student";
  }

  function liveSessionLooksReady() {
    if (document.readyState !== "complete") {
      return false;
    }
    var bodyText = (document.body && document.body.textContent ? document.body.textContent : "").replace(/\s+/g, " ").trim();
    if (bodyText.length < 400) {
      return false;
    }
    if (/connecting to|loading|please wait/i.test(bodyText.slice(0, 1200))) {
      return false;
    }
    if (document.querySelector("video, canvas, [aria-label*='Audio'], [aria-label*='Microphone'], [aria-label*='Actions'], [role='main']")) {
      return true;
    }
    return /public chat|users|actions|microphone|audio|leave/i.test(bodyText);
  }

  function scheduleAutoOpenAfterLiveReady() {
    if (autoOpenStarted || !shouldAutoOpen()) {
      return;
    }
    autoOpenStarted = true;
    var startedAt = Date.now();

    window.setTimeout(function waitForReady() {
      var waited = Date.now() - startedAt;
      if (waited >= AUTO_OPEN_MIN_DELAY_MS && (liveSessionLooksReady() || waited >= AUTO_OPEN_MAX_DELAY_MS)) {
        mountLessonInPresentation();
        if (shouldAutoOpenLesson()) {
          openLessonWindow();
        }
        openTutorWindow();
        return;
      }
      window.setTimeout(waitForReady, 750);
    }, AUTO_OPEN_MIN_DELAY_MS);
  }

  function start() {
    ensureStyle();
    ensureLauncher();
    ensureMaterialsLauncher();
    ensureWhiteboardFitHelper();
    ensureWhiteboardScrollHelper();
    scheduleMark();
    scheduleLessonStageMount();
    window.setTimeout(scheduleMark, 500);
    window.setTimeout(scheduleMark, 1000);
    window.setTimeout(scheduleMark, 3000);
    scheduleAutoOpenAfterLiveReady();
    scheduleWhiteboardFitAssist();

    window.addEventListener("resize", function () {
      var stage = document.getElementById(LESSON_STAGE_ID);
      if (stage && stage.classList.contains(PRESENTATION_FIXED_CLASS)) {
        applyFixedLessonStage(stage);
      }
    });

    document.addEventListener("pointerdown", interceptTitleEvent, true);
    document.addEventListener("mousedown", interceptTitleEvent, true);
    document.addEventListener("touchstart", interceptTitleEvent, true);
    document.addEventListener("click", interceptTitleEvent, true);
    document.addEventListener("wheel", handleWhiteboardWheel, {
      capture: true,
      passive: false
    });

    document.addEventListener("keydown", function (event) {
      var title = titleFromTarget(event.target);
      if (!title || (event.key !== "Enter" && event.key !== " ")) {
        return;
      }
      event.preventDefault();
      openTutorWindow();
    }, true);

    var observer = new MutationObserver(scheduleMark);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}());
