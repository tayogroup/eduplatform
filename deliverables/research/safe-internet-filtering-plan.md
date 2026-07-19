# Ehel Safe Internet — Proposal Review and Implementation Plan

*2026-07-19 — review of the "central cloud filtering service" proposal (AdGuard Home + WireGuard + device registration + Moodle integration) and a phased implementation plan for EduPlatform / Ehel Academy.*

**Scope clarifications (2026-07-19):** (1) Safe Internet is a **platform service offered by EduPlatform to its consumers** (edufortomorrow.com, uniso.site, quraantest.academy, future tenants) for *their* students — so every table, policy, and report is scoped by `consumerid` + `workspaceid` like the rest of the platform, and the feature is enabled per consumer via the existing `copyjson` feature flags (`safe_internet`). (2) **Safe Exam Browser is out of scope for now** — exam lockdown is deferred entirely; only the network-level child-safe and Learning Mode policies are in scope.

---

## Part 1 — Review of the proposal

### What the proposal gets right

1. **Central cloud filtering instead of family routers** — correct call. No hardware purchase, one place to operate, works on any Wi-Fi network.
2. **AdGuard Home + WireGuard as the stack** — both are genuinely free, mature, and self-hostable. AdGuard Home's per-client policies, SafeSearch enforcement, and query log map exactly to the requirements.
3. **DNS-only as the default, stricter mode only for controlled sessions** — right trade-off. Full-tunnel VPN for all child traffic all the time would be a bandwidth, privacy, and support burden far out of proportion to the benefit.
4. **Naming the real cost honestly** — "the larger cost would be developing and supporting the device-enrolment system, not server hosting." This is the single most accurate sentence in the proposal. The server is a weekend; the enrollment/support system is the product.
5. **The bypass list** — uninstalling the client, parent admin accounts, second devices, mobile data, alternate OS boot. All real. The conclusion (device-level enforcement via non-admin accounts, Family Link, Screen Time/MDM) is the correct one.

### Corrections and gaps

**1. WireGuard is not needed for the default mode — encrypted DNS with client IDs replaces it.**
The proposal routes DNS through a VPN profile. AdGuard Home natively supports **DNS-over-TLS / DNS-over-HTTPS / DNS-over-QUIC with per-device Client IDs** (`<deviceid>.dns.ehel.example`). Every mainstream OS can pin encrypted DNS *without any VPN or custom app*:

| Platform | Mechanism | Locked how |
|---|---|---|
| Android | Private DNS (DoT hostname) | Family Link blocks settings changes |
| iOS/iPadOS | Signed `.mobileconfig` DNS profile (DoH/DoT) | Screen Time passcode / profile removal restriction |
| Windows 10/11 | DoH in OS settings (or NextDNS-style registry policy) | Child = standard (non-admin) account |
| macOS | Configuration profile (DoH/DoT) | Standard account + profile removal restriction |

This removes the custom "Ehel Safe Internet app," the WireGuard client, and most first-run support tickets from the critical path. **WireGuard remains in the design only as the optional full-tunnel mode** (Phase 5) for high-need families or supervised devices.

**2. AdGuard Home is not multi-tenant — plan around it.**
There is one admin UI and one flat client list. Per-family isolation, parent-facing reporting, and policy scheduling must live in *our* layer (the Moodle plugin talking to AdGuard's REST API), never by giving parents AdGuard access. At pilot scale (≤ a few hundred devices) one AdGuard instance is fine; the Client-ID scheme is the tenancy mechanism.

**3. Availability is a child-safety AND a homework-blocking issue.**
Once a device's DNS is pinned to our server, **our outage = the child's internet outage**. The proposal's single "small cloud VPS" is not acceptable even for a pilot. Minimum: **two VPS in different providers/regions**, both listed in every device profile, config synced (e.g. `adguardhome-sync`), external uptime monitoring, and a written parent-facing "break glass" procedure to detach a device. This roughly doubles hosting: realistic pilot infra is **$30–80/month**, not $10–40.

**4. Be explicit about what DNS filtering cannot do — and don't try to fix it with MITM.**
Domain-level only: it cannot filter individual pages, images inside an allowed site, or in-app content, and it cannot see or block offline apps. The tempting fix — TLS interception (MITM proxy with a root cert on children's devices) — should be **explicitly rejected**: it breaks apps, creates a catastrophic security liability, and is disproportionate for this audience. Accept domain granularity; use AdGuard's DNS-level SafeSearch (Google/Bing/DuckDuckGo) and YouTube Restricted Mode rewrites; put content-level control inside the learning surface (Moodle, SEB) where we actually own the pages.

**5. Privacy and safeguarding are first-class requirements, not an appendix.**
Query logs are behavioral data about minors. Before the first real family: a written data policy (what is logged, retention — recommend **30 days**, who can see it — the child's own parent and designated safeguarding staff only), per-family isolation in every report, deletion on unenrollment, and parental consent captured at enrollment. This costs little in the pilot and is very expensive to retrofit.

**6. Bypass: aim for *detection + friction*, not perfect prevention.**
Perfect prevention needs school-owned MDM devices — out of scope for family-owned hardware. The achievable bar: OS-level friction (the table above) plus **detection**: the filtering server knows when a registered device stops resolving through it. A device that goes silent during scheduled learning hours triggers the proposal's "early-disconnection alert" to the parent. That feedback loop, not technical lockdown, is the realistic enforcement mechanism, and it should be messaged to parents that way.

**7. Do not build a network-level exam mode.**
Exam lockdown is deferred entirely (SEB, from the assessment track, would be its eventual owner — a browser/device lock is strictly stronger than network allowlisting). In this project the strictest network policy is **Learning Mode** (AdGuard per-client allowlist toggled by Moodle) for live sessions and homework hours. No full-tunnel exam VPN.

**8. Honest build-vs-buy checkpoint.**
NextDNS (or similar) sells per-device encrypted DNS with parental categories at roughly $20/year per family, with the same Client-ID mechanics and none of the ops burden. Self-hosting AdGuard wins on data custody, per-family cost at scale, allowlist control, and the Moodle API integration — but the pilot should state this comparison openly so the decision is deliberate. (Recommendation: self-host, for data custody and the Learning-Mode API integration; revisit if ops burden bites.)

### Verdict

Architecture: sound, with one major simplification (encrypted DNS Client IDs instead of VPN for the default mode) and one major addition (redundancy). The cost estimate is optimistic on hosting and correctly pessimistic on enrollment/support. The Moodle integration and parent portal are where EduPlatform adds unique value — that is where the engineering budget should go.

---

## Part 2 — Implementation plan

### Target architecture (revised)

```
Child device (standard account, settings locked by Family Link / Screen Time / non-admin)
        │  DNS-over-TLS/HTTPS with per-device Client ID   ← default, no VPN
        │  (optional Phase-5: WireGuard full tunnel)
        ▼
  dns1.ehel.example ──sync── dns2.ehel.example      (2× VPS, AdGuard Home)
        │ per-client policy: child-safe / learning-mode / paused
        ▼
Allowed: Ehel domains, Moodle, Bunny CDN, BBB, curated education list
Blocked: adult, malware/phishing, gambling, social media (per-family choice)
        ▲
        │ REST API (policy toggles, query stats)
Moodle plugin (parent portal + Learning Mode + alerts)   ← the real product
```

### Phase 0 — Decisions and groundwork (week 1, no code)

- [ ] Pick the service domain (e.g. `safe.ehel…`) and naming for Client IDs (`<device>.dns.safe.…`).
- [ ] Order **two** small VPS (different providers/regions, 1–2 GB RAM each).
- [ ] Wildcard TLS certificate via Let's Encrypt DNS-01 (needed for Client-ID subdomains on DoT/DoH).
- [ ] Draft the one-page family data policy: what is logged, 30-day retention, who sees it, how to unenroll. Parent consent text for enrollment.
- [ ] Choose 3–5 pilot families (mix of Android and Windows; at least one iPad if possible) and get devices inventoried.
- [ ] Define pilot success criteria: e.g. blocked-category test pass, < 15 min enrollment per device, zero unexplained outages in 2 weeks, parent can read their child's summary unaided.

### Phase 1 — Filtering infrastructure (week 1–2)

- [ ] Harden both VPS (SSH keys only, firewall: 53/853/443 + admin via allowlisted IP or SSH tunnel).
- [ ] Install AdGuard Home on both; configure DoT (853) and DoH (443) with the wildcard cert; enable Client IDs.
- [ ] Upstream resolvers: family-safe upstreams as a safety net (e.g. Quad9/Cloudflare family variants) — defense in depth under our own blocklists.
- [ ] Blocklists: adult + malware/phishing lists; SafeSearch enforcement on; YouTube Restricted Mode rewrite.
- [ ] Allowlist baseline: all Ehel/consumer domains (edufortomorrow.com, uniso.site, quraantest.academy), Moodle assets, Bunny CDN, BBB server — verified against a real live-session run.
- [ ] `adguardhome-sync` from primary → secondary; both endpoints go into every device profile.
- [ ] Monitoring: external uptime checks on both resolvers + disk/query-latency alerts; documented restore procedure (config is one YAML — back it up nightly to the existing backup remote).
- [ ] **Gate:** a test device on each platform resolves through the service, blocked categories fail, an Ehel live session works end-to-end.

### Phase 2 — Concierge enrollment, no custom software (week 2–3)

Enroll the pilot families *manually* with written per-OS runbooks — this validates the flow before any portal code exists:

- [ ] Per-device Client ID issued from a simple registry (spreadsheet is fine for the pilot week).
- [ ] Android runbook: Family Link + Private DNS hostname; verify the child cannot change settings.
- [ ] Windows runbook: child standard account + DoH configuration; parent keeps the admin password.
- [ ] iPad runbook: generated signed `.mobileconfig` (DNS payload + removal restriction) + Screen Time passcode.
- [ ] Each enrollment ends with the same 5-minute verification script (blocked site fails, SafeSearch forced, Ehel works, device appears in query log under its Client ID).
- [ ] **Gate:** all pilot devices enrolled; one week of quiet operation; collect every friction point — that list becomes the portal backlog.

### Phase 3 — Moodle parent portal plugin v1 (weeks 3–6)

New local plugin (working name `local_ehelsafenet`), UI in the existing blue design system, audit rows in the `live_audit` pattern:

- [ ] Tables: `safenet_device` (childid, clientid, platform, status, enrolledat), `safenet_policy` (per device: profile, schedule), `safenet_event` (audit).
- [ ] Parent portal page (linked from the parent dashboard): registered devices, per-device status (last seen resolving, current policy), enrollment wizard that generates the Client ID, per-OS instructions, QR code, and the `.mobileconfig` download.
- [ ] Server bridge: small service (or cron) that pushes device/policy changes to AdGuard's REST API and pulls per-client query stats.
- [ ] Activity summary for parents: top allowed/blocked domains per child per day — summaries only, not the raw log.
- [ ] Heartbeat alerts: device with no queries for N minutes during its scheduled learning window → parent notification (reuse the existing notification patterns).
- [ ] Blocked-category selection per family (the proposal's parent-choice list) mapped to AdGuard client blocklist tags.
- [ ] **Gate:** a new family can enroll a device end-to-end from the portal without concierge help.

### Phase 4 — Learning Mode (weeks 6–8)

- [ ] Policy toggle via API: `child-safe` (default) ↔ `learning` (allowlist-only: Ehel + session materials) ↔ `paused` (parent override, time-boxed).
- [ ] Hook into live sessions: session start (the existing `live_sessions.php` flow) pushes `learning` for enrolled participant devices; session end / timeout restores `child-safe`. Always fail back to `child-safe`, never to `learning`, on errors.
- [ ] Homework mode: parent- or teacher-scheduled learning windows (schedule stored in `safenet_policy`, cron-applied).
- [ ] Exam integration: out of scope — no network exam mode; Learning Mode is the strictest policy this project ships.
- [ ] **Gate:** a real live session on quraantest.academy flips a pilot device into Learning Mode and back, with audit rows proving both transitions.

### Phase 5 — Hardening and scale (after pilot readout)

- [ ] WireGuard full-tunnel as an *opt-in* per-device mode for high-need families (server-side: WireGuard on the same VPS pair; per-device configs from the portal; bandwidth costs modeled before offering broadly).
- [ ] Capacity review (AdGuard comfortably handles thousands of devices for DNS; revisit instance sizing and log storage).
- [ ] Pricing decision: absorbed in tuition vs. add-on subscription; compare all-in cost against the NextDNS-style buy option with real pilot numbers.
- [ ] Security review of the portal + bridge (the bridge holds AdGuard admin credentials — secrets handling, API allowlisting).
- [ ] Support playbook: top-10 issues from the pilot as parent-facing help articles.

### Costs (revised, pilot)

| Item | Monthly |
|---|---|
| 2× VPS (redundant resolvers) | $12–40 |
| Monitoring + off-site backups | $5–20 |
| Domain + wildcard TLS | ~$1–2 amortized |
| **Infrastructure total** | **~$20–60/month** |
| Engineering (Phases 3–4) | the real cost: ~4–6 weeks of plugin + bridge work |
| Ongoing support | budget ~1–2 hrs/week during pilot |

### Top risks

| Risk | Mitigation |
|---|---|
| Resolver outage kills family internet | 2 servers, both in every profile; monitoring; parent break-glass doc |
| Child bypasses DNS (other device, mobile data, settings) | OS-level friction + heartbeat detection + parent alerts; set expectations honestly |
| Logs of minors mishandled | 30-day retention, per-family isolation, summaries-not-logs in UI, consent at enrollment |
| Enrollment too hard for parents | concierge pilot first; portal automates only what the pilot proved painful |
| Overblocking breaks homework | allowlist verified against real session flows; parent "report a wrongly blocked site" button in portal |
| AdGuard API is unofficial and may change | pin version; bridge isolates all API calls in one module |
