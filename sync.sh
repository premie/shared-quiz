#!/usr/bin/env bash
# Vendor the generic qualifier engine into a consuming app's src/shared-quiz/.
#
# The King-network sites consume this package by COPY (not submodule): the engine
# files are kept here as the single source of truth and synced into each app so
# they land in the app's own Tailwind content + bundle with zero extra config.
#
# Usage:
#   ./sync.sh ../injury-claim-king
#   ./sync.sh ../property-damage-king
#   ./sync.sh ../mold-law-king
#
# After syncing: commit the updated src/shared-quiz/ in the target app and push.
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
DEST_APP="${1:?usage: ./sync.sh <path-to-app-repo>}"
DEST="$DEST_APP/src/shared-quiz"

# Only the generic engine travels. Per-site questions/scoring/theme live in the
# app (e.g. src/config/qualifier.ts), not here.
ENGINE_FILES=(Qualifier.tsx engine-types.ts)

mkdir -p "$DEST"
for f in "${ENGINE_FILES[@]}"; do
  cp "$SRC/$f" "$DEST/$f"
done

# A minimal barrel so apps import from "@/shared-quiz".
cat > "$DEST/index.ts" <<'EOF'
// Vendored from premie/shared-quiz via ./sync.sh — do not edit here.
// Edit the canonical files in the shared-quiz repo and re-run sync.
export { Qualifier } from "./Qualifier";
export type {
  QualifierConfig,
  QualifierTheme,
  QualifierProps,
  QualifierIntro,
  QualifierBrand,
  QQuestion,
  QField,
  QType,
  FieldKind,
  QResult,
  Answers,
} from "./engine-types";
EOF

echo "Synced engine -> $DEST"
ls -1 "$DEST"
