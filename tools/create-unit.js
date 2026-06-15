#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const unitsDir = path.join(root, 'src', 'units');
const defaultTemplate = 'template';
const unitFiles = ['index.html', 'unit.config.js', 'unit.messages.js', 'unit.css', 'unit.runtime.js'];

function usage() {
  console.log([
    'Create a new Pre-Quraan unit from an existing unit template.',
    '',
    'Usage:',
    '  node tools/create-unit.js --unit-key <key> --title "<title>" [options]',
    '  node tools/create-unit.js --manifest <json> [options]',
    '',
    'Required:',
    '  --manifest <json>            Full lesson manifest. CLI options override manifest values.',
    '  --unit-key <key>              Folder/key for the new unit, such as tanween. Required without --manifest.',
    '  --title "<title>"            Header title, such as "Tanween Listen Learn Unit". Required without --manifest.',
    '',
    'Common options:',
    `  --from <key>                  Template unit to copy. Default: ${defaultTemplate}`,
    '  --unit-id <id>                Moodle/unit state id. Default: <unit-key>_listen',
    '  --lesson-id <id>              Lesson id. Default: tajweed',
    '  --storage-prefix <id>         Storage prefix. Default: --unit-id',
    '  --key-prefix <prefix>         Content key prefix. Default: first 5 chars of unit-key + "_"',
    '  --file-prefix <prefix>        Media file prefix. Default: --key-prefix',
    '  --about "<label>"             About button label. Default: About <title without trailing Unit>',
    '  --page-title "<title>"        Browser title. Default: PQ Unit - <title>',
    '  --media-root <path>           Unit media root. Default: /lessons/<unit-key>/media',
    '  --ws-get <name>               Moodle get web-service name',
    '  --ws-set <name>               Moodle set web-service name',
    '  --version <semver>            Release version. Default: 1.0.0',
    '  --asset-version <value>       Asset version. Default: <unit-key>-v<version>',
    '  --message-unit-key <key>      Message audio key. Default: <unit-key>_movement',
    '',
    'Content and step options:',
    '  --content-file <json>         JSON array for content.items',
    '  --step-map old:new,old:new    Rename step ids in config, messages, and playback references',
    '  --messages-file <json>        JSON object for unit.messages.js PQ_UNIT_MESSAGES',
    '',
    'Safety:',
    '  --dry-run                     Show what would be created without writing files',
    '  --force                       Overwrite an existing target unit',
    '  --help                        Show this help',
    '',
    'Example:',
    '  node tools/create-unit.js --manifest docs/examples/unit.lesson.template.json --dry-run',
    '  node tools/create-unit.js --unit-key tanween --title "Tanween Listen Learn Unit" --content-file docs/examples/tanween-content.json --ws-get local_prequran_get_tanween_listen_state --ws-set local_prequran_set_tanween_listen_state --dry-run'
  ].join('\n'));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) fail(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    if (key === 'help' || key === 'dry-run' || key === 'force') {
      args[key] = true;
      continue;
    }
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) fail(`Missing value for --${key}`);
    args[key] = value;
    i += 1;
  }
  return args;
}

function requireSafeUnitKey(unitKey) {
  if (!/^[a-z][a-z0-9-]*$/.test(unitKey)) {
    fail('--unit-key must use lowercase letters, numbers, and hyphens, and start with a letter.');
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeJsString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function wsSafe(value) {
  return String(value || '').replace(/[^A-Za-z0-9_]/g, '_');
}

function replaceRequired(text, pattern, replacement, label) {
  if (!pattern.test(text)) fail(`Could not replace ${label}. Template shape may have changed.`);
  pattern.lastIndex = 0;
  const next = text.replace(pattern, replacement);
  return next;
}

function replaceStringProperty(text, property, value) {
  return replaceRequired(
    text,
    new RegExp(`(${escapeRegExp(property)}\\s*:\\s*)'[^']*'`),
    `$1'${escapeJsString(value)}'`,
    property
  );
}

function replaceOptionalStringProperty(text, property, value) {
  const pattern = new RegExp(`(${escapeRegExp(property)}\\s*:\\s*)'[^']*'`);
  if (!pattern.test(text)) return text;
  pattern.lastIndex = 0;
  return text.replace(pattern, `$1'${escapeJsString(value)}'`);
}

function parseStepMap(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((step, index) => {
      if (!step || typeof step !== 'object' || !step.from || !step.to) {
        fail(`Invalid manifest stepMap item ${index}. Expected { "from": "...", "to": "..." }.`);
      }
      return { from: String(step.from), to: String(step.to) };
    });
  }
  return value.split(',').map((pair) => {
    const parts = pair.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) fail(`Invalid --step-map pair: ${pair}`);
    return { from: parts[0], to: parts[1] };
  });
}

function readJsonFile(filePath, label) {
  const absolutePath = path.resolve(root, filePath);
  if (!fs.existsSync(absolutePath)) fail(`${label} not found: ${absolutePath}`);

  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

function validateContentItems(items, label) {
  if (!Array.isArray(items) || !items.length) fail(`${label} must contain a non-empty JSON array.`);
  items.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      fail(`${label} item ${index} must be an object.`);
    }
    for (const field of ['key', 'text', 'audio', 'video']) {
      if (typeof item[field] !== 'string' || !item[field].trim()) {
        fail(`${label} item ${index} is missing required string field "${field}".`);
      }
      if (/\?\?\?\?/.test(item[field])) {
        fail(`${label} item ${index} field "${field}" contains replacement placeholder text.`);
      }
    }
    for (const field of ['row', 'displayCol']) {
      if (!Number.isInteger(Number(item[field])) || Number(item[field]) < 1) {
        fail(`${label} item ${index} field "${field}" must be a positive integer.`);
      }
    }
  });
}

function replaceStepIds(text, stepMap) {
  let next = text;
  for (const step of stepMap) {
    const from = escapeRegExp(step.from);
    const to = escapeJsString(step.to);
    next = next.replace(new RegExp(`(id\\s*:\\s*)'${from}'`, 'g'), `$1'${to}'`);
    next = next.replace(new RegExp(`(['"])${from}\\1(?=\\s*:)`, 'g'), `'${to}'`);
    next = next.replace(new RegExp(`(stepId\\s*[:=]\\s*)'${from}'`, 'g'), `$1'${to}'`);
  }
  return next;
}

function findMatchingBrace(text, startIndex, openChar, closeChar) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let i = startIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === openChar) depth += 1;
    if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function replaceContentItemsWithItems(text, items, label) {
  validateContentItems(items, label);
  const contentMatch = /content\s*:\s*\{/.exec(text);
  if (!contentMatch) fail('Could not find content block.');
  const contentOpen = text.indexOf('{', contentMatch.index);
  const contentClose = findMatchingBrace(text, contentOpen, '{', '}');
  if (contentClose < 0) fail('Could not parse content block.');
  const contentBlock = text.slice(contentOpen, contentClose + 1);
  const itemsMatch = /items\s*:\s*\[/.exec(contentBlock);
  if (!itemsMatch) fail('Could not find content.items array.');
  const itemsOpen = contentOpen + contentBlock.indexOf('[', itemsMatch.index);
  const itemsClose = findMatchingBrace(text, itemsOpen, '[', ']');
  if (itemsClose < 0) fail('Could not parse content.items array.');

  const rendered = '[\n' + items.map((item) => `      ${JSON.stringify(item)}`).join(',\n') + '\n    ]';
  return text.slice(0, itemsOpen) + rendered + text.slice(itemsClose + 1);
}

function replaceContentItems(text, contentFile) {
  if (!contentFile) return text;
  return replaceContentItemsWithItems(text, readJsonFile(contentFile, 'Content file'), '--content-file');
}

function renderJsValue(value, indent) {
  const spaces = ' '.repeat(indent);
  return JSON.stringify(value, null, 2).split('\n').map((line, index) => {
    return index === 0 ? line : spaces + line;
  }).join('\n');
}

function replaceMessagesPayload(text, messagesPayload) {
  if (!messagesPayload) return text;
  if (typeof messagesPayload !== 'object' || Array.isArray(messagesPayload)) {
    fail('Unit messages payload must be a JSON object.');
  }

  const pattern = /root\.PQ_UNIT_MESSAGES\s*=\s*Object\.freeze\(\s*\{/;
  const match = pattern.exec(text);
  if (!match) fail('Could not find PQ_UNIT_MESSAGES payload in unit.messages.js.');

  const objectStart = text.indexOf('{', match.index);
  const objectEnd = findMatchingBrace(text, objectStart, '{', '}');
  if (objectEnd < 0) fail('Could not parse PQ_UNIT_MESSAGES payload.');

  const closeParen = text.indexOf(')', objectEnd);
  if (closeParen < 0) fail('Could not parse PQ_UNIT_MESSAGES Object.freeze call.');

  const rendered = renderJsValue({
    entry: messagesPayload.entry || {},
    entryPasses: messagesPayload.entryPasses || {},
    completion: messagesPayload.completion || {}
  }, 4);

  return text.slice(0, objectStart) + rendered + text.slice(objectEnd + 1);
}

function replaceTopLevelProperty(text, property, value) {
  if (value === undefined) return text;

  const pattern = new RegExp(`\\n(\\s*)${escapeRegExp(property)}\\s*:\\s*([\\[{])`);
  const match = pattern.exec(text);
  if (!match) {
    return insertTopLevelProperty(text, property, value);
  }

  const indent = match[1];
  const openChar = match[2];
  const closeChar = openChar === '[' ? ']' : '}';
  const valueStart = match.index + match[0].lastIndexOf(openChar);
  const valueEnd = findMatchingBrace(text, valueStart, openChar, closeChar);
  if (valueEnd < 0) fail(`Could not parse configurable block: ${property}.`);

  const comma = text[valueEnd + 1] === ',' ? ',' : '';
  const rendered = `${indent}${property}: ${renderJsValue(value, indent.length + 2)}${comma}`;
  return text.slice(0, match.index + 1) + rendered + text.slice(valueEnd + 1 + comma.length);
}

function insertTopLevelProperty(text, property, value) {
  const contentMatch = /\n\s{2}content\s*:\s*\{/.exec(text);
  if (!contentMatch) fail(`Could not insert configurable block: ${property}. Template shape may have changed.`);

  const rendered = `\n  ${property}: ${renderJsValue(value, 4)},\n`;
  return text.slice(0, contentMatch.index) + rendered + text.slice(contentMatch.index);
}

function replaceTopLevelScalarProperty(text, property, value) {
  if (value === undefined) return text;

  const pattern = new RegExp(`\\n(\\s*)${escapeRegExp(property)}\\s*:\\s*([^,\\n]+),?`);
  const match = pattern.exec(text);
  const renderedValue = renderJsValue(value, 0);

  if (match) {
    const comma = match[0].trimEnd().endsWith(',') ? ',' : '';
    return text.slice(0, match.index + 1)
      + `${match[1]}${property}: ${renderedValue}${comma}`
      + text.slice(match.index + match[0].length);
  }

  const contentMatch = /\n\s{2}content\s*:\s*\{/.exec(text);
  if (!contentMatch) fail(`Could not insert scalar configurable field: ${property}. Template shape may have changed.`);
  return text.slice(0, contentMatch.index)
    + `\n  ${property}: ${renderedValue},\n`
    + text.slice(contentMatch.index);
}

function loadManifest(args) {
  if (!args.manifest) return {};
  const manifest = readJsonFile(args.manifest, 'Manifest');
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    fail('--manifest must contain a JSON object.');
  }
  return manifest;
}

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function replaceTemplatePlaceholders(text, options) {
  const replacements = {
    UNIT_KEY: options.unitKey,
    UNIT_ID: options.unitId,
    UNIT_TITLE: options.title,
    LESSON_ID: options.lessonId,
    STORAGE_PREFIX: options.storagePrefix,
    KEY_PREFIX: options.keyPrefix,
    FILE_PREFIX: options.filePrefix,
    WS_GET_FUNCTION: options.wsGet,
    WS_SET_FUNCTION: options.wsSet,
    VERSION: options.version,
    ASSET_VERSION: options.assetVersion,
    MESSAGE_UNIT_KEY: options.messageUnitKey
  };

  return Object.entries(replacements).reduce((next, [key, value]) => {
    return next.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
  }, text);
}

function withoutTrailingUnit(title) {
  return String(title).replace(/\s+Unit\s*$/i, '').trim();
}

function buildOptions(args) {
  const manifest = loadManifest(args);
  const identity = manifest.identity || {};
  const moodle = manifest.moodle || {};
  const release = manifest.release || {};
  const assets = manifest.assets || {};
  const ui = manifest.ui || {};
  const messages = manifest.messages || {};
  const unitMessages = args['messages-file']
    ? readJsonFile(args['messages-file'], 'Messages file')
    : (manifest.unitMessages || manifest.stepMessages || null);
  const content = manifest.content || {};

  const unitKey = pick(args['unit-key'], manifest.unitKey, identity.unitKey);
  if (!unitKey) fail('Missing required --unit-key.');
  requireSafeUnitKey(unitKey);
  const title = pick(args.title, manifest.title, ui.headerTitle);
  if (!title) fail('Missing required --title.');
  const version = pick(args.version, release.version, '1.0.0');
  const unitId = pick(args['unit-id'], manifest.unitId, identity.unitId, `${unitKey.replace(/-/g, '_')}_listen`);
  const lessonId = pick(args['lesson-id'], manifest.lessonId, identity.lessonId, 'tajweed');
  const storagePrefix = pick(args['storage-prefix'], manifest.storagePrefix, identity.storagePrefix, unitId);
  const keyPrefix = pick(args['key-prefix'], manifest.keyPrefix, identity.keyPrefix, `${unitKey.replace(/-/g, '').slice(0, 5)}_`);
  const filePrefix = pick(args['file-prefix'], manifest.filePrefix, assets.filePrefix, keyPrefix);
  const contentItems = args['content-file'] ? null : content.items;

  return {
    from: pick(args.from, manifest.from, defaultTemplate),
    unitKey,
    title,
    unitId,
    lessonId,
    storagePrefix,
    keyPrefix,
    filePrefix,
    about: pick(args.about, manifest.about, ui.aboutLabel, `About ${withoutTrailingUnit(title)}`),
    pageTitle: pick(args['page-title'], manifest.pageTitle, ui.pageTitle, `PQ Unit - ${title}`),
    mediaRoot: pick(args['media-root'], manifest.mediaRoot, assets.unitMediaRoot, `/lessons/${unitKey}/media`),
    wsGet: pick(args['ws-get'], manifest.wsGet, moodle.wsGetFunction, `local_prequran_get_${wsSafe(unitId)}_state`),
    wsSet: pick(args['ws-set'], manifest.wsSet, moodle.wsSetFunction, `local_prequran_set_${wsSafe(unitId)}_state`),
    version,
    assetVersion: pick(args['asset-version'], manifest.assetVersion, release.assetVersion, `${unitKey}-v${version}`),
    messageUnitKey: pick(args['message-unit-key'], manifest.messageUnitKey, messages.unitKey, `${unitKey}_movement`),
    unitMessages,
    contentFile: pick(args['content-file'], manifest.contentFile, ''),
    contentItems,
    config: manifest.config || {},
    stepMap: parseStepMap(pick(args['step-map'], manifest.stepMap, '')),
    dryRun: !!args['dry-run'],
    force: !!args.force
  };
}

function updateConfig(text, options) {
  let next = text;
  next = next.replace(/^\/\/ .*? - Unit Authoring Config/m, `// ${options.title} - Unit Authoring Config`);
  next = replaceStringProperty(next, 'lessonId', options.lessonId);
  next = replaceStringProperty(next, 'unitId', options.unitId);
  next = replaceStringProperty(next, 'unitKey', options.unitKey);
  next = replaceStringProperty(next, 'storagePrefix', options.storagePrefix);
  next = replaceStringProperty(next, 'keyPrefix', options.keyPrefix);
  next = replaceStringProperty(next, 'wsGetFunction', options.wsGet);
  next = replaceStringProperty(next, 'wsSetFunction', options.wsSet);
  next = replaceStringProperty(next, 'version', options.version);
  next = replaceStringProperty(next, 'assetVersion', options.assetVersion);
  next = replaceStringProperty(next, 'unitMediaRoot', options.mediaRoot);
  next = replaceStringProperty(next, 'filePrefix', options.filePrefix);
  next = replaceOptionalStringProperty(next, 'messageUnitKey', options.messageUnitKey);
  next = next.replace(/(adapter\s*:\s*\{[\s\S]*?unitKey\s*:\s*)'[^']*'/, `$1'${escapeJsString(options.unitId)}'`);
  next = replaceOptionalStringProperty(next, 'pageTitle', options.pageTitle);
  next = replaceOptionalStringProperty(next, 'headerTitle', options.title);
  next = replaceOptionalStringProperty(next, 'aboutLabel', options.about);
  next = next.replace(/window\.PQ_[A-Za-z0-9_]+\s*=\s*UNIT_CFG;/, `window.PQ_${options.unitId.replace(/[^A-Za-z0-9_]/g, '_')} = UNIT_CFG;`);
  next = replaceStepIds(next, options.stepMap);
  next = replaceContentItems(next, options.contentFile);
  if (options.contentItems) {
    next = replaceContentItemsWithItems(next, options.contentItems, 'manifest content.items');
  }
  for (const property of [
    'localization',
    'assets',
    'messaging',
    'settings',
    'steps',
    'writeLabelMap',
    'activeTileEffect',
    'activeAudioAnimation',
    'filterSets',
    'ui',
    'uiText',
    'speakUi',
    'speakPopupUi',
    'layout',
    'media',
    'messages',
    'playback',
    'write',
    'listenPlus',
    'words',
    'messageUi',
    'stepInjection',
    'stepNavigation',
    'defaults',
    'routes',
    'match',
    'focusBadge',
    'rewardBar',
    'stepperUi'
  ]) {
    next = replaceTopLevelProperty(next, property, options.config[property]);
  }
  for (const property of [
    'wordLimit'
  ]) {
    next = replaceTopLevelScalarProperty(next, property, options.config[property]);
  }
  return replaceTemplatePlaceholders(next, options);
}

function updateMessages(text, options) {
  let next = replaceStepIds(text, options.stepMap);
  next = next.replace(/alphabet/gi, options.unitKey);
  next = next.replace(/Alphabet/g, options.title);
  next = replaceMessagesPayload(next, options.unitMessages);
  return replaceTemplatePlaceholders(next, options);
}

function updateIndex(text, options) {
  let next = text;
  next = next.replace(/<title>[^<]*<\/title>/, `<title>${options.pageTitle}</title>`);
  next = next.replace(/data-unit="[^"]*"/, `data-unit="${options.unitKey}"`);
  next = next.replace(/src="\/pre_quraan\/units\/[^/]+\/js\/unit\.messages\.js(?:\?[^"]*)?"/g, 'src="./unit.messages.js"');
  next = next.replace(/src="\/pre_quraan\/units\/[^/]+\/js\/unit\.config\.js(?:\?[^"]*)?"/g, 'src="./unit.config.js"');
  next = next.replace(/src="\/pre_quraan\/units\/[^/]+\/js\/unit\.runtime\.js(?:\?[^"]*)?"/g, 'src="./unit.runtime.js"');
  return replaceTemplatePlaceholders(next, options);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const options = buildOptions(args);
  const sourceDir = options.from === 'template'
    ? path.join(root, 'src', 'templates', 'unit')
    : path.join(unitsDir, options.from);
  const targetDir = path.join(unitsDir, options.unitKey);

  if (!fs.existsSync(sourceDir)) fail(`Template unit not found: ${path.relative(root, sourceDir)}`);
  for (const file of unitFiles) {
    const sourceFile = path.join(sourceDir, file);
    if (!fs.existsSync(sourceFile)) fail(`Template is missing required file: ${path.relative(root, sourceFile)}`);
  }
  if (fs.existsSync(targetDir) && !options.force) {
    fail(`Target unit already exists: ${path.relative(root, targetDir)}. Use --force to overwrite.`);
  }

  const output = new Map();
  for (const file of unitFiles) {
    const sourceFile = path.join(sourceDir, file);
    let content = fs.readFileSync(sourceFile, 'utf8');
    if (file === 'index.html') content = updateIndex(content, options);
    if (file === 'unit.config.js') content = updateConfig(content, options);
    if (file === 'unit.messages.js') content = updateMessages(content, options);
    output.set(file, content);
  }

  if (options.dryRun) {
    console.log(`Dry run: would create ${path.relative(root, targetDir)}`);
    for (const file of unitFiles) console.log(`  ${path.join(path.relative(root, targetDir), file)}`);
    console.log('');
    console.log('Config replacements:');
    console.log(`  unitKey: ${options.unitKey}`);
    console.log(`  unitId: ${options.unitId}`);
    console.log(`  title: ${options.title}`);
    console.log(`  wsGetFunction: ${options.wsGet}`);
    console.log(`  wsSetFunction: ${options.wsSet}`);
    console.log(`  unitMediaRoot: ${options.mediaRoot}`);
    console.log(`  release.version: ${options.version}`);
    console.log(`  release.assetVersion: ${options.assetVersion}`);
    console.log(`  step mappings: ${options.stepMap.length || 'none'}`);
    console.log(`  content: ${options.contentFile || (options.contentItems ? 'manifest content.items' : 'template content retained')}`);
    console.log(`  unit messages: ${options.unitMessages ? 'manifest/messages file' : 'template messages retained'}`);
    console.log(`  config blocks: ${Object.keys(options.config).length ? Object.keys(options.config).join(', ') : 'none'}`);
    return;
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  for (const [file, content] of output) {
    fs.writeFileSync(path.join(targetDir, file), content, 'utf8');
  }

  console.log(`Created unit: ${path.relative(root, targetDir)}`);
  for (const file of unitFiles) console.log(`  ${path.join(path.relative(root, targetDir), file)}`);
  console.log('');
  console.log('Next: edit unit.config.js content/media, then run npm.cmd run validate:units.');
}

main();
