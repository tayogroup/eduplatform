# Lesson Cloning Guide

This project uses a template-driven cloning flow. Do not copy an existing lesson folder by hand. Existing lessons are useful references, but `src/templates/unit` is the approved source for new lessons.

## The 8-Step Flow

1. Confirm the base is healthy.

```powershell
git status
npm.cmd run validate:units
npm.cmd run build:bunny:integration
npm.cmd run verify:bunny:integration
```

2. Prepare a full lesson manifest.

Copy `docs/examples/unit.lesson.template.json` and fill in the lesson identity, Moodle function names, release values, media roots, learner-facing `unitMessages`, optional config blocks, and `content.items`.

`docs/examples/unit-content.template.json` is only a smaller helper for `content.items`; it is not a full lesson template.

3. Preview the clone.

```powershell
npm.cmd run create:unit -- --manifest docs/examples/noon-sakinah.lesson.json --dry-run
```

4. Create the unit from the neutral template.

```powershell
npm.cmd run create:unit -- --manifest docs/examples/noon-sakinah.lesson.json
```

5. Edit only lesson-owned settings.

Keep changes inside:

```text
src/units/<unit-key>/unit.config.js
src/units/<unit-key>/unit.messages.js
src/units/<unit-key>/unit.css
```

Use `unit.config.js` for identity, content, media roots, enabled features, and lesson-specific overrides. Use `unit.messages.js` for learner-facing step messages.

6. Validate before preview.

```powershell
npm.cmd run validate:units
```

This catches syntax errors, unresolved template placeholders, wrong prefixes, missing media, bad Moodle function names, duplicate keys, unexpected unit files, and clone leftovers.

7. Build and verify Bunny output.

```powershell
npm.cmd run build:bunny:integration
npm.cmd run verify:bunny:integration
```

8. Update Moodle routes only after the Bunny path exists.

After verification, wire the relevant Moodle route to:

```text
/pre_quraan/units/<unit-key>/index.html?managed=1&v=<assetVersion>
```

Then run the environment gate for the intended deployment target.

## Unit-Owned Files

Each cloned unit must contain exactly these files:

```text
src/units/<unit-key>/index.html
src/units/<unit-key>/unit.config.js
src/units/<unit-key>/unit.messages.js
src/units/<unit-key>/unit.css
src/units/<unit-key>/unit.runtime.js
```

Do not add lesson-specific directories, copied shared scripts, copied shared CSS, or media under `src/units/<unit-key>`.

## Shared Resources

Keep shared behavior in shared locations:

```text
src/shared/css/
src/shared/js/
src/shared/js/patches/
src/app-shell/
tools/
docs/
```

Add per-lesson code only when the shared runtime cannot express the lesson. Prefer config and data first.

## Naming Rules

Use lowercase kebab-case for `unitKey`, such as `noon-sakinah`.

Use underscore prefixes for content keys and media filenames, such as:

```text
keyPrefix: noon_
filePrefix: noon_
audio: noon_01.mp3
video: noon_01.mp4
```

Use Moodle-safe function names with letters, numbers, and underscores only.

## Manifest Fields

The preferred manifest shape is:

```text
unitKey
title
from
lessonId
unitId
storagePrefix
keyPrefix
filePrefix
pageTitle
about
mediaRoot
messageUnitKey
unitMessages
moodle.wsGetFunction
moodle.wsSetFunction
release.version
release.assetVersion
stepMap
config
content.items
```

Supported `config` blocks are copied into `unit.config.js`:

```text
localization
messaging
steps
writeLabelMap
activeTileEffect
activeAudioAnimation
filterSets
ui
uiText
speakUi
speakPopupUi
layout
media
messages
playback
write
listenPlus
words
messageUi
stepNavigation
defaults
routes
match
focusBadge
rewardBar
stepperUi
```

CLI flags override manifest values, so a manifest can be reused safely:

```powershell
npm.cmd run create:unit -- --manifest docs/examples/noon-sakinah.lesson.json --version 1.0.1 --dry-run
```

## Unit Messages

Learner-facing step copy belongs in `unitMessages` in the manifest. The generator writes it into `src/units/<unit-key>/unit.messages.js` as `PQ_UNIT_MESSAGES`.

Supported message sections:

```text
unitMessages.entry
unitMessages.entryPasses
unitMessages.completion
```

You can also keep messages in a separate JSON object and pass it at creation time:

```powershell
npm.cmd run create:unit -- --manifest docs/examples/noon-sakinah.lesson.json --messages-file docs/examples/noon-sakinah.messages.json --dry-run
```
