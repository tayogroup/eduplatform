#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadArtifactTool() {
  try {
    return await import('@oai/artifact-tool');
  } catch (error) {
    const explicit = process.env.CODEX_ARTIFACT_TOOL_MODULE || '';
    const fallback = path.join(
      os.homedir(),
      '.cache',
      'codex-runtimes',
      'codex-primary-runtime',
      'dependencies',
      'node',
      'node_modules',
      '@oai',
      'artifact-tool',
      'dist',
      'artifact_tool.mjs',
    );
    const modulePath = explicit !== '' ? explicit : fallback;
    return import(pathToFileURL(modulePath).href);
  }
}

const { Presentation, PresentationFile } = await loadArtifactTool();

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'src', 'media', 'live-session-templates');
const QA_DIR = path.join(ROOT, 'deliverables', 'live-session-agenda-template-arabic-preview');
const PPTX_PATH = path.join(OUT_DIR, 'live-session-agenda-template-ar.pptx');
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');
const MONTAGE_PATH = path.join(QA_DIR, 'live-session-agenda-template-ar.webp');

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
    title: 'مرحبًا بالطلاب',
    subtitle: '[اسم المعلم] | [الصف / المجموعة] | [تاريخ الجلسة]',
    body: 'السلام عليكم. سنبدأ قريبًا.',
  },
  {
    kind: 'agenda',
    title: 'جدول الجلسة',
    items: [
      '١. الترحيب وتسجيل الحضور',
      '٢. مراجعة الدرس السابق',
      '٣. موضوع اليوم',
      '٤. تدريب موجه',
      '٥. أسئلة وخطوات قادمة',
    ],
  },
  {
    kind: 'topic',
    title: 'مواد موضوع الجلسة',
    label: 'شريحة الموضوع ١',
    prompt: '[أضف الفكرة الرئيسية الأولى أو المثال أو محور التلاوة هنا.]',
  },
  {
    kind: 'topic',
    title: 'مواد موضوع الجلسة',
    label: 'شريحة الموضوع ٢',
    prompt: '[أضف نقاط الشرح أو المفردات أو ملاحظات اللوح هنا.]',
  },
  {
    kind: 'topic',
    title: 'مواد موضوع الجلسة',
    label: 'شريحة الموضوع ٣',
    prompt: '[أضف تعليمات التدريب الموجه أو أمثلة الطلاب هنا.]',
  },
  {
    kind: 'topic',
    title: 'مواد موضوع الجلسة',
    label: 'شريحة الموضوع ٤',
    prompt: '[أضف نقاط التصحيح أو محور النطق أو الأمثلة هنا.]',
  },
  {
    kind: 'topic',
    title: 'مواد موضوع الجلسة',
    label: 'شريحة الموضوع ٥',
    prompt: '[أضف نشاط المراجعة النهائي أو أسئلة التحقق أو أمثلة الخلاصة هنا.]',
  },
  {
    kind: 'summary',
    title: 'الملخص',
    items: [
      '[ما تعلمه الطلاب]',
      '[ما تدرب عليه الطلاب]',
      '[تصحيح أو تذكير مشترك]',
      '[واجب أو هدف تدريب]',
    ],
  },
  {
    kind: 'next',
    title: 'الجلسة القادمة',
    items: [
      'الموعد القادم: [التاريخ والوقت]',
      'الموضوع القادم: [الموضوع]',
      'التحضير: [تدريب / قراءة / نشاط]',
      'إحضار: [المواد المطلوبة]',
    ],
  },
  {
    kind: 'end',
    title: 'انتهت الجلسة',
    subtitle: 'جزاكم الله خيرًا',
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
    alignment: style.alignment || 'right',
    verticalAlignment: style.verticalAlignment || 'top',
  };
  return box;
}

function addChrome(slide, index, label) {
  slide.background.fill = COLORS.cream;
  addShape(slide, 'rect', { left: 0, top: 0, width: W, height: 64 }, COLORS.green);
  addText(slide, 'جدول الجلسة المباشرة', { left: 760, top: 16, width: 420, height: 34 }, {
    fontSize: 18,
    bold: true,
    color: '#ffffff',
    alignment: 'right',
  }, 'template-name');
  addText(slide, label, { left: 210, top: 16, width: 420, height: 34 }, {
    fontSize: 16,
    bold: true,
    color: '#ffffff',
    alignment: 'left',
  }, 'slide-section');
  addText(slide, String(index).padStart(2, '0'), { left: 62, top: 12, width: 94, height: 40 }, {
    fontSize: 24,
    bold: true,
    color: COLORS.green,
    alignment: 'center',
    verticalAlignment: 'middle',
    fill: '#ffffff',
  }, 'slide-number');
  addShape(slide, 'rect', { left: 0, top: 684, width: W, height: 36 }, COLORS.greenSoft);
  addText(slide, '[اسم الصف]   [المعلم]   [التاريخ]', { left: 648, top: 692, width: 580, height: 22 }, {
    fontSize: 13,
    bold: true,
    color: COLORS.muted,
    alignment: 'right',
  }, 'fillable-footer');
}

function addEditableArea(slide, top = 232, height = 330) {
  addShape(slide, 'roundRect', { left: 96, top, width: 1088, height }, '#ffffff', COLORS.line, 2, 'editable-content-frame');
  addText(slide, '[اكتب محتوى الجلسة هنا]', { left: 132, top: top + 32, width: 1016, height: 58 }, {
    fontSize: 28,
    bold: true,
    color: COLORS.ink,
    alignment: 'right',
  }, 'fillable-content-heading');
  addText(slide, '[أضف ملاحظات أو أمثلة أو نصًا عربيًا أو صورًا أو أسئلة تدريب. اجعل كل شريحة بسيطة لتبقى واضحة داخل BigBlueButton.]', { left: 132, top: top + 112, width: 1016, height: 128 }, {
    fontSize: 22,
    color: COLORS.muted,
    alignment: 'right',
  }, 'fillable-content-body');
}

function addBulletList(slide, items, top = 210) {
  items.forEach((item, idx) => {
    const y = top + idx * 72;
    addShape(slide, 'ellipse', { left: 1134, top: y + 8, width: 34, height: 34 }, idx % 2 === 0 ? COLORS.gold : COLORS.green);
    addText(slide, item, { left: 168, top: y, width: 920, height: 52 }, {
      fontSize: 28,
      bold: true,
      color: COLORS.ink,
      alignment: 'right',
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

  addText(slide, cfg.title, { left: 224, top: 112, width: 960, height: 62 }, {
    fontSize: cfg.kind === 'end' ? 76 : 42,
    bold: true,
    color: COLORS.ink,
    alignment: cfg.kind === 'end' ? 'center' : 'right',
  }, 'slide-title');

  if (cfg.kind === 'agenda' || cfg.kind === 'summary' || cfg.kind === 'next') {
    addBulletList(slide, cfg.items, 212);
    return;
  }

  if (cfg.kind === 'topic') {
    addText(slide, cfg.label, { left: 824, top: 174, width: 360, height: 34 }, {
      fontSize: 22,
      bold: true,
      color: COLORS.green,
      alignment: 'right',
    }, 'topic-label');
    addText(slide, cfg.prompt, { left: 96, top: 174, width: 702, height: 42 }, {
      fontSize: 20,
      bold: true,
      color: COLORS.muted,
      alignment: 'left',
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

async function writeManifest() {
  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    existing = {};
  }
  const next = {
    ...existing,
    arabicTemplate: 'Live Session Agenda Arabic',
    arabicPptx: 'live-session-agenda-template-ar.pptx',
    variants: {
      ...(existing.variants || {}),
      en: 'live-session-agenda-template.pptx',
      ar: 'live-session-agenda-template-ar.pptx',
    },
  };
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
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
  await writeManifest();

  console.log(`Wrote ${PPTX_PATH}`);
  console.log(`Wrote ${MANIFEST_PATH}`);
  console.log(`Wrote previews to ${QA_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
