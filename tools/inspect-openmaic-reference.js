#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const file = path.resolve(process.argv[2] || 'outputs/openmaic/reference/fractions-with-pizza-bunny-reference.html');
const html = fs.readFileSync(file, 'utf8');

function extractObjectAfter(marker) {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Missing marker: ${marker}`);
  const start = html.indexOf('{', markerIndex);
  if (start < 0) throw new Error(`Missing object after marker: ${marker}`);

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < html.length; i += 1) {
    const ch = html[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error(`Unterminated object after marker: ${marker}`);
}

const manifest = JSON.parse(extractObjectAfter('const manifest ='));
const summary = {
  file,
  bytes: fs.statSync(file).size,
  stage: manifest.stage?.name || '',
  scenes: (manifest.scenes || []).map((scene, index) => ({
    number: index + 1,
    title: scene.title || '',
    contentType: scene.content?.type || '',
    questions: scene.content?.type === 'quiz' ? (scene.content.questions || []).length : 0,
    questionText: scene.content?.type === 'quiz'
      ? (scene.content.questions || []).map((question) => ({
        question: question.question || question.prompt || '',
        options: question.options || question.choices || [],
        answer: question.answer || question.correctAnswer || question.correct || '',
      }))
      : undefined,
    speech: (scene.actions || []).filter((action) => action.type === 'speech').length,
  })),
};

console.log(JSON.stringify(summary, null, 2));
