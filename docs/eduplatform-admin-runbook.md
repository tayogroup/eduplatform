# EduPlatform Admin Runbook

This runbook covers the recurring setup and verification steps for EduPlatform foundation domains and consumer apps.

## Add A Domain

1. In cPanel, open Domains and create the domain as a shared-root domain pointing at the Moodle application folder.
2. Do not add a cPanel redirect to `quraantest.academy`.
3. Add the exact host to `config.php` allowed hosts and keep `$CFG->wwwroot` dynamic by request host.
4. Add or verify the host in `local_prequran_consumer_domain` with the correct consumer, domain type, status, and primary flag.
5. Wait for AutoSSL, then test the exact host over HTTPS.

## Mirror Quraan Academy Hosting For EduForTomorrow

`quraanacademy.info` is the current working reference for a hosted consumer domain. To configure EduForTomorrow the same way, apply the same hosting shape to these hosts:

- `edufortomorrow.com`
- `www.edufortomorrow.com`
- `app.edufortomorrow.com`

Required parity:

1. DNS resolves to the same Moodle hosting server used by `quraanacademy.info`.
2. cPanel Domains contains each host with the same Moodle document root as `quraanacademy.info`.
3. cPanel Redirects has no redirect from EduForTomorrow to Quraan Academy, quraantest, or EduPlatform.
4. AutoSSL covers the bare, `www`, and `app` hosts.
5. Moodle `config.php` includes the EduForTomorrow hosts in the dynamic `$CFG->wwwroot` allowed-host list.
6. `local_prequran_consumer_domain` contains active rows for the `edu-for-tomorrow` consumer:
   - `edufortomorrow.com`, `public`, primary
   - `www.edufortomorrow.com`, `public`
   - `app.edufortomorrow.com`, `app`
7. Probe each host at `/local/hubredirect/consumer_probe.php` and confirm `trusted_domain=yes` and `consumer_slug=edu-for-tomorrow`.

## Configure Shared Resources

1. Keep static lesson assets, shared scripts, shared styles, live-session templates, and workspace material downloads on the EduPlatform shared resource origin.
2. In PreQuran plugin settings, set `bunny_shared_cdn_base_url` to the shared EduPlatform CDN/base URL used by all consumers.
3. Do not set shared resource settings to consumer-specific Quran Academy hosts such as `app.quraan.academy` or `quraanacademy.b-cdn.net`.
4. Treat legacy Quran/EHEL CDN hosts only as migration aliases; launchers should rewrite away from them to the shared origin.
5. After changing the shared resource origin, test Quran Academy, EduForTomorrow, and one institution workspace launch path.

## Create A Consumer

1. Sign in as a platform admin.
2. Open `/local/hubredirect/platform_consumers.php`.
3. Use the consumer wizard for academy, institution, marketplace, or teacher workspace.
4. Confirm these fields:
   - consumer slug and name
   - consumer type
   - support email
   - public route
   - dashboard route
   - email-from name
5. Verify the consumer appears in the platform consumer manager.

## Create Or Link A Workspace

1. For institutions and teacher workspaces, create or link a primary workspace during the wizard.
2. Add the first owner/admin user.
3. Confirm workspace membership under the People page.
4. Open the workspace dashboard and confirm the header, role, and counts match the consumer.
5. Use sample data only in test environments to validate students, teachers, sessions, attendance, materials, and reports.

## Troubleshoot SSL And Domain Resolver Issues

Use these checks in order:

1. cPanel Domains: host exists and uses the same Moodle document root.
2. cPanel Redirects: host is not redirected to `quraantest.academy`.
3. AutoSSL: certificate covers the bare, `www`, and `app` host variants you intend to use.
4. Moodle `config.php`: host is listed in the allowed-host array.
5. Consumer probe: `/local/hubredirect/consumer_probe.php` resolves to the expected consumer.
6. Platform diagnostics: `/local/hubredirect/platform_diagnostics.php` shows trusted domain, consumer, workspace, and route status.
7. Notification diagnostics: `/local/hubredirect/notification_diagnostics.php` confirms email subject branding.

## URLs To Test After Each Setup

Test the relevant hosts:

- `https://eduplatform.ai/local/hubredirect/consumer_probe.php`
- `https://www.eduplatform.ai/local/hubredirect/consumer_probe.php`
- `https://app.eduplatform.ai/local/hubredirect/consumer_probe.php`
- `https://quraantest.academy/local/hubredirect/consumer_probe.php`
- `https://quraanacademy.info/local/hubredirect/consumer_probe.php`
- `https://edufortomorrow.com/local/hubredirect/consumer_probe.php`

For each consumer, also test:

- public landing route
- branded login route
- dashboard route
- session expired page
- branded access denied page
- role redirect after login

Expected behavior: users stay on their domain, resolve to the correct consumer, and see branded EduPlatform, Quraan Academy, Huda-school, or EduForTomorrow copy instead of raw Moodle error pages.
