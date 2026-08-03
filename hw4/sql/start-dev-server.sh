#!/bin/bash
# ============================================================
# Starts the two servers the app needs for local development:
# MySQL 5.7 (from the Anaconda install) and PHP's built-in web
# server. Use this if you are not running XAMPP.
#
#   ./hw4/sql/start-dev-server.sh
#
# Then open http://localhost:8080/
#
# With XAMPP instead, start Apache and MySQL from the XAMPP
# control panel and symlink hw4/ into htdocs. config/db.php
# finds either server on its own.
# ============================================================
set -e

MYSQL_HOME="$HOME/hw4-mysql"
MYSQLD=/opt/anaconda3/bin/mysqld
DOCROOT="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$MYSQL_HOME/run"

if [ ! -d "$MYSQL_HOME/data/mysql" ]; then
    echo "Initializing MySQL data directory..."
    mkdir -p "$MYSQL_HOME/data"
    "$MYSQLD" --initialize-insecure \
        --datadir="$MYSQL_HOME/data" \
        --basedir=/opt/anaconda3
fi

echo "Starting MySQL on port 3306..."
"$MYSQLD" \
    --datadir="$MYSQL_HOME/data" \
    --basedir=/opt/anaconda3 \
    --socket="$MYSQL_HOME/run/mysql.sock" \
    --port=3306 \
    --pid-file="$MYSQL_HOME/run/mysqld.pid" \
    --log-error="$MYSQL_HOME/run/error.log" &

MYSQL_PID=$!
trap 'kill $MYSQL_PID 2>/dev/null' EXIT

for _ in $(seq 1 30); do
    if /opt/anaconda3/bin/mysqladmin -h 127.0.0.1 -P 3306 -u root ping > /dev/null 2>&1; then
        break
    fi
    sleep 1
done

echo "MySQL is up. Starting PHP on http://localhost:8080/ (docroot $DOCROOT)"
php -S localhost:8080 -t "$DOCROOT"
