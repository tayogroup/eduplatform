#!/bin/sh
# Installs the repo's pre-commit guard into .git/hooks/pre-commit.
#
#     sh tools/hooks/install.sh
#
# Run it once per clone. Hooks are not version-controlled, so a fresh checkout
# has none until this is run — and this shared working tree is exactly where the
# guard matters, so it is worth running on any machine where two sessions work at
# once.
#
# It writes a SHIM, not a copy: the logic stays in tools/hooks/pre-commit, where
# it is tracked and reviewable, and an edit there takes effect immediately.
#
# core.hooksPath is deliberately not used. Git LFS owns post-checkout,
# post-commit, post-merge and pre-push in .git/hooks/, and pointing hooksPath
# elsewhere makes git stop reading that directory — disabling all four silently.

set -e
root=$(git rev-parse --show-toplevel)
target="$root/.git/hooks/pre-commit"

if [ -e "$target" ] && ! grep -q "tools/hooks/pre-commit" "$target" 2>/dev/null; then
  echo "Refusing to overwrite an existing $target that is not this shim."
  echo "Look at it, merge what it does into tools/hooks/pre-commit, then delete it."
  exit 1
fi

printf '%s\n' '#!/bin/sh' 'exec "$(git rev-parse --show-toplevel)/tools/hooks/pre-commit" "$@"' > "$target"
chmod +x "$target"
echo "Installed $target -> tools/hooks/pre-commit"
echo "Guarding:"
sed -e 's/#.*//' -e '/^[[:space:]]*$/d' "$root/tools/hooks/co-edited-files" | sed 's/^/  /'
