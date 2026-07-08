#!/usr/bin/env bash
#
# Update the bundled frontend in static/ from the latest versatiles-frontend release.
#
# The full release (https://github.com/versatiles-org/versatiles-frontend) ships a
# complete frontend that is far larger than what this server needs. We only refresh
# the files we already bundle, so the static/ folder keeps its lean, curated shape.
#
# Deliberately NOT touched / excluded:
#   - static/index.html            our own, minimal viewer page
#   - static/assets/glyphs/**      large, rarely-changing font glyphs
#   - *.map                        source maps, not needed in the shipped frontend
#
set -euo pipefail

URL="https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend-min.tar.gz"
STATIC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../static" && pwd)"

cd "$STATIC_DIR"

# Collect the files we currently ship and want to refresh from the release.
files=()
while IFS= read -r f; do files+=("$f"); done < <(
	find . -type f \
		! -name '.DS_Store' \
		! -name '*.map' \
		! -path './index.html' \
		! -path './assets/glyphs/*' \
		| sed 's|^\./||' | sort
)

if [ ${#files[@]} -eq 0 ]; then
	echo "Nothing to update in $STATIC_DIR" >&2
	exit 1
fi

echo "Updating ${#files[@]} file(s) in static/ from $URL"
printf '  %s\n' "${files[@]}"

# Pipeline: download -> gunzip -> untar, extracting only the files listed above.
# tar exits non-zero if any listed file is missing from the release, which flags
# that the upstream frontend has been restructured and this script needs a look.
curl -fsSL "$URL" \
	| gzip -d \
	| tar -x -C "$STATIC_DIR" "${files[@]}"

echo "Done."
