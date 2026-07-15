#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'src', 'media', 'live-session-templates');
const QA_DIR = path.join(ROOT, 'deliverables', 'live-session-agenda-template-preview');
const PPTX_PATH = path.join(OUT_DIR, 'live-session-agenda-template.pptx');
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');
const MONTAGE_PATH = path.join(QA_DIR, 'live-session-agenda-template.webp');

const W = 1280;
const H = 720;
const COLORS = {
  ink: '#173044',
  muted: '#60735f',
  green: '#2f6f4e',
  greenSoft: '#effbea',
  gold: '#d6a642',
  goldSoft: '#fff4dc',
  cream: '#fffdf7',
  line: '#dbe5d8',
  brown: '#6f4e32',
};

const slides = [
  {
    kind: 'welcome',
    title: 'Welcome Students',
    subtitle: '[Teacher name] | [Class / Group] | [Session date]',
    body: 'Assalamu alaikum. We will begin soon.',
  },
  {
    kind: 'agenda',
    title: 'Session Agenda',
    items: [
      '[1] Welcome and attendance',
      '[2] Review from last session',
      '[3] Today\'s topic',
      '[4] Guided practice',
      '[5] Questions and next steps',
    ],
  },
  {
    kind: 'topic',
    title: 'Session Topic Materials',
    label: 'Topic Slide 1',
    prompt: '[Add the first key idea, example, or recitation focus here.]',
  },
  {
    kind: 'topic',
    title: 'Session Topic Materials',
    label: 'Topic Slide 2',
    prompt: '[Add explanation points, vocabulary, or board notes here.]',
  },
  {
    kind: 'topic',
    title: 'Session Topic Materials',
    label: 'Topic Slide 3',
    prompt: '[Add guided practice instructions or student examples here.]',
  },
  {
    kind: 'topic',
    title: 'Session Topic Materials',
    label: 'Topic Slide 4',
    prompt: '[Add correction points, pronunciation focus, or examples here.]',
  },
  {
    kind: 'topic',
    title: 'Session Topic Materials',
    label: 'Topic Slide 5',
    prompt: '[Add final practice activity, check questions, or recap examples here.]',
  },
  {
    kind: 'summary',
    title: 'Summary',
    items: [
      '[What students learned]',
      '[What students practiced]',
      '[Common correction / reminder]',
      '[Homework or practice target]',
    ],
  },
  {
    kind: 'next',
    title: 'Next Session',
    items: [
      'Next date: [date and time]',
      'Next topic: [topic]',
      'Prepare: [practice / reading / activity]',
      'Bring: [materials needed]',
    ],
  },
  {
    kind: 'end',
    title: 'END',
    subtitle: 'Jazakum Allahu khairan',
  },
];

function addShape(slide, geometry, position, fill, lineFill = 'none', width = 0, name) {
  return slide.shapes.add({
    geometry,
    name,
    position,
    fill,
    line: { style: 'solid', fill: lineFill, width },
  });
}

function addText(slide, text, position, style = {}, name) {
  const box = addShape(slide, 'textbox', position, style.fill || 'none', 'none', 0, name);
  box.text = text;
  box.text.style = {
    fontSize: style.fontSize || 24,
    bold: Boolean(style.bold),
    color: style.color || COLORS.ink,
    alignment: style.alignment || 'left',
    verticalAlignment: style.verticalAlignment || 'top',
  };
  return box;
}

function addChrome(slide, index, label) {
  slide.background.fill = COLORS.cream;
  addShape(slide, 'rect', { left: 0, top: 0, width: W, height: 64 }, COLORS.green);
  addText(slide, 'Live Session Agenda', { left: 52, top: 16, width: 420, height: 34 }, {
    fontSize: 18,
    bold: true,
    color: '#ffffff',
  }, 'template-name');
  addText(slide, label, { left: 820, top: 16, width: 260, height: 34 }, {
    fontSize: 16,
    bold: true,
    color: '#ffffff',
    alignment: 'right',
  }, 'slide-section');
  addText(slide, String(index).padStart(2, '0'), { left: 1124, top: 12, width: 94, height: 40 }, {
    fontSize: 24,
    bold: true,
    color: COLORS.green,
    alignment: 'center',
    verticalAlignment: 'middle',
    fill: '#ffffff',
  }, 'slide-number');
  addShape(slide, 'rect', { left: 0, top: 684, width: W, height: 36 }, COLORS.greenSoft);
  addText(slide, '[Class name]   [Teacher]   [Date]', { left: 52, top: 692, width: 580, height: 22 }, {
    fontSize: 13,
    bold: true,
    color: COLORS.muted,
  }, 'fillable-footer');
}

function addEditableArea(slide, top = 232, height = 330) {
  addShape(slide, 'roundRect', { left: 96, top, width: 1088, height }, '#ffffff', COLORS.line, 2, 'editable-content-frame');
  addText(slide, '[Type your session content here]', { left: 132, top: top + 32, width: 1016, height: 58 }, {
    fontSize: 28,
    bold: true,
    color: COLORS.ink,
  }, 'fillable-content-heading');
  addText(slide, '[Add notes, examples, Arabic text, images, or practice prompts. Keep each slide simple so it remains readable inside BigBlueButton.]', { left: 132, top: top + 112, width: 1016, height: 128 }, {
    fontSize: 22,
    color: COLORS.muted,
  }, 'fillable-content-body');
}

function addBulletList(slide, items, top = 210) {
  items.forEach((item, idx) => {
    const y = top + idx * 72;
    addShape(slide, 'ellipse', { left: 112, top: y + 8, width: 34, height: 34 }, idx % 2 === 0 ? COLORS.gold : COLORS.green);
    addText(slide, item, { left: 168, top: y, width: 920, height: 52 }, {
      fontSize: 28,
      bold: true,
      color: COLORS.ink,
      verticalAlignment: 'middle',
    }, `fillable-list-item-${idx + 1}`);
  });
}

function addSlide(presentation, cfg, index) {
  const slide = presentation.slides.add();
  const label = cfg.kind === 'topic' ? cfg.label : cfg.title;
  addChrome(slide, index, label);

  if (cfg.kind === 'welcome') {
    addText(slide, cfg.title, { left: 96, top: 176, width: 1088, height: 86 }, {
      fontSize: 58,
      bold: true,
      color: COLORS.ink,
      alignment: 'center',
    }, 'welcome-title');
    addText(slide, cfg.subtitle, { left: 180, top: 284, width: 920, height: 44 }, {
      fontSize: 25,
      bold: true,
      color: COLORS.brown,
      alignment: 'center',
    }, 'fillable-session-details');
    addShape(slide, 'roundRect', { left: 262, top: 382, width: 756, height: 92 }, COLORS.goldSoft, COLORS.gold, 2, 'welcome-message-frame');
    addText(slide, cfg.body, { left: 300, top: 408, width: 680, height: 42 }, {
      fontSize: 30,
      bold: true,
      color: COLORS.brown,
      alignment: 'center',
      verticalAlignment: 'middle',
    }, 'fillable-welcome-message');
    return;
  }

  addText(slide, cfg.title, { left: 96, top: 112, width: 960, height: 62 }, {
    fontSize: cfg.kind === 'end' ? 76 : 42,
    bold: true,
    color: COLORS.ink,
    alignment: cfg.kind === 'end' ? 'center' : 'left',
  }, 'slide-title');

  if (cfg.kind === 'agenda' || cfg.kind === 'summary' || cfg.kind === 'next') {
    addBulletList(slide, cfg.items, 212);
    return;
  }

  if (cfg.kind === 'topic') {
    addText(slide, cfg.label, { left: 96, top: 174, width: 360, height: 34 }, {
      fontSize: 22,
      bold: true,
      color: COLORS.green,
    }, 'topic-label');
    addText(slide, cfg.prompt, { left: 482, top: 174, width: 702, height: 42 }, {
      fontSize: 20,
      bold: true,
      color: COLORS.muted,
      alignment: 'right',
    }, 'topic-prompt');
    addEditableArea(slide, 236, 324);
    return;
  }

  if (cfg.kind === 'end') {
    addText(slide, cfg.subtitle, { left: 180, top: 342, width: 920, height: 52 }, {
      fontSize: 32,
      bold: true,
      color: COLORS.brown,
      alignment: 'center',
    }, 'end-subtitle');
  }
}

async function writeBlob(filePath, blob) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Buffer.from(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(QA_DIR, { recursive: true });

  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  slides.forEach((slide, index) => addSlide(presentation, slide, index + 1));

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, '0')}`;
    await writeBlob(path.join(QA_DIR, `${stem}.png`), await presentation.export({ slide, format: 'png', scale: 1 }));
    const layout = await slide.export({ format: 'layout' });
    await fs.writeFile(path.join(QA_DIR, `${stem}.layout.json`), await layout.text(), 'utf8');
  }

  await writeBlob(MONTAGE_PATH, await presentation.export({ format: 'webp', montage: true, scale: 1 }));

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(PPTX_PATH);

  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify({
    template: 'Live Session Agenda',
    description: 'Fillable BigBlueButton-compatible PowerPoint template for teacher live sessions.',
    pptx: 'live-session-agenda-template.pptx',
    slides: slides.map((slide, index) => ({
      number: index + 1,
      title: slide.title,
      role: slide.kind === 'topic' ? slide.label : slide.kind,
    })),
  }, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${PPTX_PATH}`);
  console.log(`Wrote ${MANIFEST_PATH}`);
  console.log(`Wrote previews to ${QA_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
