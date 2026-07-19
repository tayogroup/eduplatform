#!/usr/bin/env bash
# Ehel Safe Internet — AdGuard Home resolver install (Ubuntu 22.04/24.04).
# Run as root on a fresh VPS. Usage:
#   DNS_DOMAIN=dns1.safe.example.com ADMIN_USER=ehel ADMIN_PASS_BCRYPT='...' ./install-safenet-server.sh
# ADMIN_PASS_BCRYPT: generate locally with: htpasswd -B -n -b user 'password' (take the hash part).
set -euo pipefail

DNS_DOMAIN="${DNS_DOMAIN:?set DNS_DOMAIN to this server's public hostname (e.g. dns1.safe.example.com)}"
ADMIN_USER="${ADMIN_USER:?set ADMIN_USER}"
ADMIN_PASS_BCRYPT="${ADMIN_PASS_BCRYPT:?set ADMIN_PASS_BCRYPT (bcrypt hash)}"
ADMIN_ALLOW_CIDR="${ADMIN_ALLOW_CIDR:-}"   # optional: restrict web admin to your IP, e.g. 203.0.113.5/32

echo "== System hardening =="
apt-get update -y
apt-get install -y unattended-upgrades ufw curl
dpkg-reconfigure -f noninteractive unattended-upgrades

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 53/udp    # plain DNS (needed during device bootstrap; can be closed later)
ufw allow 53/tcp
ufw allow 853/tcp   # DNS-over-TLS (client IDs)
ufw allow 443/tcp   # DNS-over-HTTPS (client IDs)
ufw allow 784/udp   # DNS-over-QUIC
if [ -n "$ADMIN_ALLOW_CIDR" ]; then
  ufw allow from "$ADMIN_ALLOW_CIDR" to any port 8443 proto tcp   # admin UI
else
  echo "NOTE: admin UI (8443) not opened; reach it via SSH tunnel: ssh -L 8443:127.0.0.1:8443 root@$DNS_DOMAIN"
fi
ufw --force enable

echo "== AdGuard Home install =="
curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh | sh -s -- -v

echo "== TLS certificate (Let's Encrypt) =="
# HTTP-01 on port 80 is easiest for the server's own hostname. For wildcard
# client-ID certs (*.DNS_DOMAIN) use DNS-01 with your DNS provider's API and
# certbot's provider plugin — see README.md. Bootstrap with the bare hostname:
apt-get install -y certbot
systemctl stop AdGuardHome || true
certbot certonly --standalone -d "$DNS_DOMAIN" --agree-tos --register-unsafely-without-email -n
systemctl start AdGuardHome

CERT_DIR="/etc/letsencrypt/live/$DNS_DOMAIN"
DEPLOY_HOOK="/etc/letsencrypt/renewal-hooks/deploy/adguard-reload.sh"
cat > "$DEPLOY_HOOK" <<'HOOK'
#!/usr/bin/env bash
systemctl restart AdGuardHome
HOOK
chmod +x "$DEPLOY_HOOK"

cat <<EOF

== Done. Next steps ==
1. Open the admin UI (SSH tunnel or allowed IP): https://$DNS_DOMAIN:8443
   First-run wizard: admin user '$ADMIN_USER'.
2. Apply the reference config: merge ops/safenet/AdGuardHome.yaml.template
   into /opt/AdGuardHome/AdGuardHome.yaml (stop service, edit, start), pointing
   tls cert/key at:
     $CERT_DIR/fullchain.pem
     $CERT_DIR/privkey.pem
3. For per-device Client IDs you need a WILDCARD cert (*.$DNS_DOMAIN) via
   DNS-01 — see README.md section 'Wildcard certificate'.
4. Repeat on the secondary VPS, then set up adguardhome-sync (README.md).
EOF
