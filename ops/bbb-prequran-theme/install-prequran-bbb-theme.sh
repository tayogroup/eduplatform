#!/usr/bin/env bash
set -euo pipefail

THEME_VERSION="20260708-scrollmaterial"
ASSET_DIR="/var/www/bigbluebutton-default/prequran-theme"
NGINX_INCLUDE="/etc/bigbluebutton/nginx/prequran-bbb-theme.nginx"
BACKUP_DIR="/root/prequran-bbb-theme-backups/$(date +%Y%m%d-%H%M%S)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root on the BBB server." >&2
  exit 1
fi

mkdir -p "$ASSET_DIR" "$BACKUP_DIR"

if [[ -f "$NGINX_INCLUDE" ]]; then
  cp "$NGINX_INCLUDE" "$BACKUP_DIR/prequran-bbb-theme.nginx"
fi

cp "$SCRIPT_DIR/prequran-bbb-theme.css" "$ASSET_DIR/prequran-bbb-theme.css"
cp "$SCRIPT_DIR/prequran-bbb-theme.js" "$ASSET_DIR/prequran-bbb-theme.js"
chmod 0644 "$ASSET_DIR/prequran-bbb-theme.css" "$ASSET_DIR/prequran-bbb-theme.js"

cat > "$NGINX_INCLUDE" <<NGINX
# Quraan Academy BBB Virtual Tutor launcher.
# Installed by install-prequran-bbb-theme.sh.

location ^~ /prequran-theme/ {
    alias /var/www/bigbluebutton-default/prequran-theme/;
    add_header Cache-Control "no-cache";
}

gzip off;
proxy_set_header Accept-Encoding "";
sub_filter_once off;
sub_filter_types text/html;
sub_filter '</head>' '<link rel="stylesheet" href="/prequran-theme/prequran-bbb-theme.css?v=${THEME_VERSION}"><script defer src="/prequran-theme/prequran-bbb-theme.js?v=${THEME_VERSION}"></script></head>';
NGINX

nginx -t
systemctl reload nginx

VERIFY_URL="http://127.0.0.1/prequran-theme/prequran-bbb-theme.js?v=${THEME_VERSION}"
VERIFY_STATUS="$(curl -k -s -o /dev/null -w '%{http_code}' -H 'Host: live.quraantest.academy' "$VERIFY_URL" || true)"
if [[ "$VERIFY_STATUS" != "200" ]]; then
  echo "Install did not make the BBB theme asset reachable. HTTP status: ${VERIFY_STATUS}" >&2
  echo "Expected local check: curl -k -I -H 'Host: live.quraantest.academy' ${VERIFY_URL}" >&2
  echo "Check that /etc/nginx/sites-enabled/bigbluebutton includes /etc/bigbluebutton/nginx/*.nginx." >&2
  exit 1
fi

echo "PreQuran BBB Virtual Tutor launcher installed."
echo "CSS: https://live.quraantest.academy/prequran-theme/prequran-bbb-theme.css?v=${THEME_VERSION}"
echo "JS:  https://live.quraantest.academy/prequran-theme/prequran-bbb-theme.js?v=${THEME_VERSION}"
echo "Verify in BBB: open DevTools Console and run document.getElementById('pqa-vt-live-launcher') !== null"
echo "Backup directory: $BACKUP_DIR"
