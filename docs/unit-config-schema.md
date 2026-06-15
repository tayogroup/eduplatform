# Unit Config Schema

Each lesson exposes `window.UNIT_CFG` from `unit.config.js` after passing through `PQUnitConfigNormalizer`.

## Required Top-Level Sections

```text
schemaVersion
identity
moodle
release
assets
steps
filterSets
content
media
messages
```

## identity

Required strings:

```text
lessonId
unitId
unitKey
storagePrefix
keyPrefix
```

`unitKey` must match the folder name under `src/units`. `keyPrefix` must prefix every `content.items[].key`.

## moodle

Required strings:

```text
wsGetFunction
wsSetFunction
```

Both must be valid Moodle function names using letters, numbers, and underscores.

## release

Required strings:

```text
version
assetVersion
```

Use release-based asset versions. Do not use dynamic values such as `Date.now()` or `dev`.

## assets

Required cloning fields:

```text
cdnRoot
unitMediaRoot
filePrefix
mediaPadWidth
```

`filePrefix` must prefix every `content.items[].audio` and `content.items[].video`.

## steps

`steps` must be a non-empty array. Each step requires:

```text
id
type
label
passFilters
```

Every `passFilters` entry must be `all` or a key defined in `filterSets`.

## content.items

Each content item requires:

```text
key
text
row
displayCol
audio
video
```

Rules:

```text
key values must be unique
row must be a positive integer
displayCol must be a positive integer within the grid
span must not overflow the grid
wordLimit must match content.items.length
audio and video filenames must start with assets.filePrefix
```

Use `docs/examples/unit.lesson.template.json` as the preferred full lesson authoring shape. Use `docs/examples/unit-content.template.json` only when you need a standalone `content.items` array.

## media

Media paths should be derived from the unit key and should normally stay under:

```text
/pre_quraan/lessons/<unit-key>/media/
```

Intro/lecture videos are standardized separately under:

```text
src/media/messages/lectures/<unit-key>_lecture.mp4
/pre_quraan/messages/lectures/<unit-key>_lecture.mp4
```

When `assets.cdnRoot` is `/pre_quraan`, validation checks that referenced local media files exist under `src/media`.

## messages

Step message text belongs in `unit.messages.js`. `unit.config.js` should keep only stable message settings and the manifest reference:

```text
messages.manifest: ./unit.messages.js
```

When creating a lesson from a manifest, write learner-facing messages under:

```text
unitMessages.entry
unitMessages.entryPasses
unitMessages.completion
```

The clone tool copies those values into `unit.messages.js`.

## Forbidden Clone Artifacts

New lessons must not contain:

```text
unresolved {{PLACEHOLDERS}}
Alphabet-specific paths or keys
replacement text such as ????
mojibake/encoding artifacts
unexpected files or directories under src/units/<unit-key>
```
