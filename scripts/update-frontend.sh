#!/usr/bin/env bash
#
# Update the bundled frontend in static/ from the latest versatiles-frontend release.
#
# The full release (https://github.com/versatiles-org/versatiles-frontend) ships a
# complete frontend that is far larger than what this server needs. We only refresh
# the files we already bundle, so the static/ folder keeps its lean, curated shape.
# A library in assets/lib/ is refreshed as a whole folder, so that files a new version
# adds next to the ones we ship (e.g. MapLibre's worker modules) come along.
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

ARCHIVE="$(mktemp)"
trap 'rm -f "$ARCHIVE"' EXIT
curl -fsSL "$URL" -o "$ARCHIVE"

# Add every file of the release that sits in the folder of a library we ship.
lib_dirs="$(printf '%s\n' "${files[@]}" | grep '^assets/lib/' | sed 's|/[^/]*$|/|' | sort -u || true)"
if [ -n "$lib_dirs" ]; then
	while IFS= read -r f; do files+=("$f"); done < <(
		tar -tzf "$ARCHIVE" \
			| grep -v '/$' \
			| grep -v '\.map$' \
			| while IFS= read -r entry; do
				dir="${entry%/*}/"
				if printf '%s\n' "$lib_dirs" | grep -qxF "$dir"; then echo "$entry"; fi
			done
	)
fi
unique=()
while IFS= read -r f; do unique+=("$f"); done < <(printf '%s\n' "${files[@]}" | sort -u)
files=("${unique[@]}")

echo "Updating ${#files[@]} file(s) in static/ from $URL"
printf '  %s\n' "${files[@]}"

# tar exits non-zero if any listed file is missing from the release, which flags
# that the upstream frontend has been restructured and this script needs a look.
tar -xzf "$ARCHIVE" -C "$STATIC_DIR" "${files[@]}"

echo "Done."
