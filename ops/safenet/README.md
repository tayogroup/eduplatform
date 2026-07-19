# Ehel Safe Internet — resolver operations

Two AdGuard Home resolvers (different providers/regions) serve all consumers'
enrolled child devices over encrypted DNS with per-device Client IDs. The
Moodle plugin (local_hubredirect/safenet.php + safenetlib.php) is the only
management surface — parents never touch AdGuard.

## VPS sizing

DNS filtering is CPU-light; the sizing drivers are (1) the 30-day query log on
disk and (2) memory for AdGuard's in-RAM stats. Rule of thumb: a child device
makes ~5–10k DNS queries/day ≈ **~2–3 MB of query log per device per day**,
so 30-day retention ≈ **60–90 MB of disk per device**.

| Stage | Devices | Spec per VPS | Example / price |
|---|---|---|---|
| Pilot | ≤ 100 | 2 vCPU, 4 GB RAM, 40 GB NVMe | Hetzner CX22 (~€4/mo), Vultr/DO 2 GB (~$10–12/mo) |
| Rollout | ≤ 1,000 | 2 vCPU, 4 GB RAM, 80–100 GB NVMe | Hetzner CX32 (~€7/mo), DO 4 GB (~$24/mo) |
| Scale | ≤ 5,000 | 4 vCPU, 8 GB RAM, 160+ GB (or trim retention) | ~€15–30/mo each |

Guidance:

- **Buy 4 GB RAM from day one** even though 1 GB would run: AdGuard keeps
  stats/log indexes in memory, DoT/DoH TLS sessions add up, and the sync and
  certbot tooling live on the same box. The price difference is a few dollars.
- **Disk math before RAM math**: at 1,000 devices the 30-day log is ~60–90 GB.
  If disk becomes the constraint, first shorten `querylog.interval` (e.g. 14
  days) or disable per-query logging and keep only statistics — parents' portal
  summaries use aggregated stats, so raw-log retention is a policy choice, not
  a functional requirement.
- **Bandwidth is a non-issue**: even 1,000 devices is ~1–2 Mbps of DNS traffic;
  every provider's included transfer covers it hundreds of times over.
- **Placement**: two different providers/regions for real redundancy, chosen
  near the families. Suggested split: one EU node (Hetzner Falkenstein or
  Helsinki — good routing to East Africa and Europe) + one US East node
  (Vultr/DigitalOcean New Jersey or Atlanta) for North-American families.
  Both hostnames go into every device profile; the OS tries the reachable one.
- **Requirements when ordering**: dedicated IPv4, ports 53/443/853/784 open
  (no provider DNS-port blocking), KVM-based (not container/VPS-lite), snapshots
  or backups add-on enabled (~$1–2/mo).
- **Upgrade trigger**: sustained CPU > 40%, RAM > 70%, or disk > 70% — resize
  in place (both suggested providers support live/offline resizes).

## Bring-up order

0. **First login hardening** (providers often hand over password-based root SSH):
   `ssh-copy-id root@<server>`, then in `/etc/ssh/sshd_config` set
   `PasswordAuthentication no` and `PermitRootLogin prohibit-password`,
   then `systemctl reload sshd`. Verify key login from a second terminal
   before closing the first.
1. **DNS records**: `dns1.safe.<domain>` and `dns2.safe.<domain>` → the two VPS.
   Plus a wildcard record `*.dns1.safe.<domain>` / `*.dns2.safe.<domain>`
   (client-ID hostnames resolve to the same server).
2. On each VPS: run `install-safenet-server.sh` (see header for env vars).
3. **Wildcard certificate** (required for Client IDs):
   `certbot certonly --manual --preferred-challenges dns -d 'dns1.safe.<domain>' -d '*.dns1.safe.<domain>'`
   or the DNS-provider plugin for auto-renewal. Point the `tls:` section of
   AdGuardHome.yaml at the wildcard cert.
4. Merge `AdGuardHome.yaml.template` into each server's config; restart.
5. **Sync**: install [adguardhome-sync](https://github.com/bakito/adguardhome-sync)
   on the primary (or as a third tiny container) — origin = dns1, replica = dns2,
   interval 1m. Verify a client added on dns1 appears on dns2.
6. **Monitoring**: external uptime checks (e.g. UptimeRobot free tier) probing
   DoT on 853 of both servers + disk alerts. Both server IPs go into every
   device profile so one can die without killing family internet.
7. Nightly config backup: copy `/opt/AdGuardHome/AdGuardHome.yaml` off-box
   (it is the entire state besides logs).

## Moodle bridge configuration

Set on the Moodle side (admin CLI or config):

    php admin/cli/cfg.php --component=local_prequran --name=safenet_dns_domain --set=dns1.safe.<domain>
    php admin/cli/cfg.php --component=local_prequran --name=safenet_dns_domain2 --set=dns2.safe.<domain>
    php admin/cli/cfg.php --component=local_prequran --name=safenet_api_url --set=https://127.0.0.1:8443   # via tunnel/private net
    php admin/cli/cfg.php --component=local_prequran --name=safenet_api_user --set=<admin user>
    php admin/cli/cfg.php --component=local_prequran --name=safenet_api_pass --set=<admin pass>

The bridge talks to AdGuard's REST control API (`/control/clients/add`,
`/control/clients/update`, `/control/stats`). If the API URL is unset, the
portal still works (device registry + instructions) and marks devices as
"pending sync".

## Per-device verification script (run at every enrollment)

1. Device resolves through its Client ID: AdGuard query log shows the ClientID.
2. `exampleadultsite.com` → blocked page/NXDOMAIN.
3. Google search for a filtered term → SafeSearch forced.
4. A consumer domain (e.g. quraantest.academy) loads and a live session joins.
5. Turn on Learning Mode from the portal → non-allowlisted site fails; turn off → returns.

## Break-glass (parent-facing, keep in help article)

If the child's internet breaks and Ehel support is unreachable:
Android: Settings → Network → Private DNS → Off. iPad: Settings → General →
VPN & Device Management → remove the Ehel profile (requires Screen Time
passcode). Windows: change the network's DNS back to Automatic (parent/admin
account). Re-enroll from the parent portal afterwards.

## Privacy commitments (implementation-relevant)

- Query log retention 30 days (configured in AdGuardHome.yaml `querylog.interval`).
- Parents see per-child summaries in the portal, never other families' data.
- Unenrollment deletes the AdGuard client and the device row; logs age out.
- All parent/staff actions are audited in `local_prequran_safenet_evt`.
