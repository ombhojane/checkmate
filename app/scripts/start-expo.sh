#!/usr/bin/env bash
# start-expo.sh - ensures increased file limit for node watchers before starting expo

set -e

echo "[Start] Starting with file watcher improvements..."

if command -v watchman &> /dev/null; then
	echo "[Info] watchman found. Clearing previous watches and restarting watchman server..."
	watchman watch-del-all || true
	watchman shutdown-server || true
else
	echo "[Info] watchman not found. Attempting to increase ulimit for this session..."
	ulimit -n 65536 || true
	echo "[Info] Current ulimit: $(ulimit -n)"
fi

echo "[Start] Launching Expo with args: $@"
exec expo start "$@"
