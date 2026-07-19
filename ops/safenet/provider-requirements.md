# Hosting requirements — Ehel Safe Internet DNS resolver

*Document to share with a hosting provider when ordering or qualifying a server.
We are deploying a private, encrypted DNS filtering service (AdGuard Home) for a
children's-education platform. We need two such servers from two different
providers/regions; this document describes one server.*

## 1. Product type

- **Self-managed / unmanaged VPS or cloud server.** We administer everything ourselves.
- **Clean OS installation** — Ubuntu Server 22.04 LTS or 24.04 LTS (64-bit), minimal image.
- **No control panel** (no cPanel, Plesk, SPanel, etc.), no pre-installed web,
  mail, or DNS stack. Ports must be free for our own services.
- **Full root access via SSH** (key-based).
- KVM or equivalent full virtualization (not OpenVZ/LXC containers) — we need
  our own kernel networking (WireGuard may be added later).

## 2. Hardware specification

| Resource | Minimum | Preferred |
|---|---|---|
| vCPU | 2 | 2–4 |
| RAM | 4 GB | 4–8 GB |
| Storage | 40 GB NVMe/SSD | 80–100 GB NVMe |
| Bandwidth | 1 TB/month | Unmetered (traffic is light; DNS only) |

The workload is a DNS resolver: CPU and bandwidth usage are low; disk holds
30 days of query logs.

## 3. Network requirements (critical — please confirm each)

1. **One dedicated IPv4 address** (static, not shared, not CGNAT). IPv6 /64 welcome.
2. **All of the following inbound ports must be usable by our own services**,
   with no provider-side blocking, filtering, or pre-bound daemons:
   - **53/udp and 53/tcp** (DNS) — please confirm explicitly that inbound port 53
     is not blocked at the network edge; many providers filter it.
   - **443/tcp** (DNS-over-HTTPS)
   - **853/tcp** (DNS-over-TLS)
   - **784/udp and 853/udp** (DNS-over-QUIC)
   - **22/tcp** (SSH management)
3. Outbound traffic unrestricted (standard).
4. **Reverse DNS (PTR)** configurable for our IPv4 address.
5. No forced transparent proxying or DPI on our traffic.

## 4. Acceptable-use confirmation

Please confirm your AUP permits running a **public-facing authenticated DNS
resolver service**. Notes:

- This is **not an open resolver**: plain port-53 service is restricted by
  firewall to enrolled devices/bootstraps; encrypted DNS (DoT/DoH/DoQ) requires
  per-device client identifiers. It cannot be used for DNS amplification.
- Purpose: child-safety content filtering for a school platform's families.

## 5. Provisioning and operations

- **Snapshots and/or automatic offsite backups** available (add-on acceptable).
- Server resize/upgrade path (RAM/disk) without reinstallation preferred.
- Console/rescue access (VNC or equivalent) for lockout recovery.
- Uptime SLA and maintenance-notification policy — please state.
- Data-center location(s) offered — please list; we select region per our
  redundancy plan (our two servers must be in different regions).

## 6. Explicitly NOT required (do not quote these)

- Control panel licenses, managed support, website/WordPress tooling,
  email hosting, CDN, ecommerce features, malware scanning agents,
  SSL certificates (we issue our own via Let's Encrypt).

## 7. Qualification questions (a "no" on any is disqualifying)

1. Is this a self-managed server with full root SSH and a clean Ubuntu LTS image (no panel)?
2. Can our own daemons bind ports 53, 443, 853, and 784 — is inbound 53 unblocked?
3. Is the IPv4 address dedicated and static, with configurable PTR?
4. Is running a (non-open, authenticated) DNS resolver service permitted under your AUP?
5. What is the monthly price for 2 vCPU / 4 GB / 40 GB NVMe on those terms?
