#!/usr/bin/env bash
set -euo pipefail

ASSET_DIR="/var/www/bigbluebutton-default/prequran-theme"
NGINX_INCLUDE="/etc/bigbluebutton/nginx/prequran-bbb-theme.nginx"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root on the BBB server." >&2
  exit 1
fi

rm -f "$NGINX_INCLUDE"
rm -rf "$ASSET_DIR"

nginx -t
systemctl reload nginx

echo "PreQuran BBB Virtual Tutor launcher removed."
