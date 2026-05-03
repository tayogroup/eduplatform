#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const unitsDir = path.resolve(process.cwd(), 'src/units');
const required = ['unitid', 'lessonid', 'steps'];
let failed = false;

for (const unit of fs.readdirSync(unitsDir, { withFileTypes: true })) {
  if (!unit.isDirectory()) continue;

  const configPath = path.join(unitsDir, unit.name, 'unit.config.js');
  if (!fs.existsSync(configPath)) {
    console.error(`Missing config: ${configPath}`);
    failed = true;
    continue;
  }

  const text = fs.readFileSync(configPath, 'utf8');
  for (const key of required) {
    if (!text.includes(key)) {
      console.error(`Missing required key "${key}" in ${configPath}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Unit config validation passed.');
