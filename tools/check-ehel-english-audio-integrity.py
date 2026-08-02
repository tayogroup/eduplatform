"""Audio integrity for Ehel English, across EVERY descriptor type rather than a subset.

Science, Computing, Global Perspectives and Intensive English each have an audio check;
English had none, so nothing gated the 17,000-odd clips its eight grades reference. This
is that gate.

For every audio descriptor the course can play it asks four things:

  * does an `available: true` descriptor actually name a source,
  * does that file exist on disk,
  * is it real audio (ID3 tag or MPEG frame sync) rather than an HTML error body a failed
    fetch wrote to an .mp3 path,
  * and is the clip long enough for the script it claims to narrate.

Descriptors marked `available: false` are counted as pending and are NOT failures — they
are honest placeholders for audio nobody has bought yet.

Exits non-zero when any problem is found, so it can gate a release.

    python tools/check-ehel-english-audio-integrity.py

Two things worth knowing before changing the thresholds below.

The duration test works off file size, not a decode: these clips are 128 kbps CBR mp3, so
size/16000 gives seconds within about 0.1 s of the decoded duration. That keeps the check
dependency-free (no ffprobe) and fast enough to walk every grade.

It is a proxy for syllable density, not a constant, so it can only catch gross loss — a
dropped clause lands near 40 chars/sec. It cannot catch a clip that is subtly wrong, and a
clip flagged here is a candidate for a listen, not a proven defect. See RATE_MAX.
"""
import collections
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = os.path.join(ROOT, 'src', 'prototypes', 'ehel-academy', 'english')
GENERATOR = os.path.join(ROOT, 'tools', 'generate-ehel-english-audio.js')

# The approved voice runs 12-18 chars/sec across the corpus. This sat at 20.0 and flagged
# g4 eng-g04-t03-u09-act06 at 20.2 — which was then confirmed COMPLETE two ways: ElevenLabs
# scribe_v1 transcribed it back to the script word for word, and re-synthesising the same
# 138 characters returned 6.92s against the original's 6.83s. The sentence is simply read
# briskly (199 wpm vs a sibling's 179) at near-identical syllable density. So 20.0 sat
# exactly on top of a good clip. 23 keeps headroom above the only verified-good outlier
# while still catching a dropped clause, which lands near 40.
RATE_MAX = 23.0

# Below ~120 characters the rate is meaningless — a one-second vocabulary clip trivially
# exceeds any threshold. Dropping this floor once produced 1,182 false alarms in Grade 1
# alone. Do not remove it to "check more clips"; it checks noise.
MIN_CHARS_FOR_RATE = 120

BYTES_PER_SECOND = 16000  # 128 kbps CBR

# What the generator's own narration() does, mirrored below in narration(). Duplicating a
# transform is how the Science and Computing audio checks drifted from their generators, so
# this asserts the source still matches instead of trusting the copy: if someone changes
# what is sent to ElevenLabs, this check fails loudly rather than silently measuring the
# wrong expectation.
EXPECTED_GENERATOR_PATTERNS = [
    r'.replace(/🤖|💡|📚|✨|[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")',
    r'.replace(/\(\s*Ask your AI Tutor[^)]*\)/gi, "")',
    r'.replace(/\s+/g, " ")',
]


def assert_generator_transform_unchanged():
    """Fail if the generator's narration() no longer matches what narration() mirrors."""
    try:
        src = open(GENERATOR, encoding='utf-8').read()
    except OSError as exc:
        sys.exit(f'cannot read the generator to verify its transform: {exc}')
    missing = [p for p in EXPECTED_GENERATOR_PATTERNS if p not in src]
    if missing:
        print('GENERATOR TRANSFORM DRIFTED', file=sys.stderr)
        print(f'  {GENERATOR} no longer contains:', file=sys.stderr)
        for p in missing:
            print(f'      {p}', file=sys.stderr)
        print('  This check measures each clip against the text the generator SENDS, so a', file=sys.stderr)
        print('  changed transform makes every duration comparison wrong. Update narration()', file=sys.stderr)
        print('  and EXPECTED_GENERATOR_PATTERNS here to match the generator, then re-run.', file=sys.stderr)
        sys.exit(2)


def narration(value):
    """Mirror of narration() in generate-ehel-english-audio.js.

    ☀-➿ is spelled as the literal range the generator uses; the explicit
    emoji it also lists all fall inside \U0001F000-\U0001FAFF.
    """
    v = re.sub(r'[\U0001F000-\U0001FAFF☀-➿]', '', str(value or ''))
    v = re.sub(r'\(\s*Ask your AI Tutor[^)]*\)', '', v, flags=re.I)
    return re.sub(r'\s+', ' ', v).strip()


def valid_mp3(path):
    """True for an ID3 tag or an MPEG frame sync — not an HTML body saved as .mp3."""
    try:
        with open(path, 'rb') as fh:
            head = fh.read(3)
    except OSError:
        return False
    return head[:3] == b'ID3' or (len(head) > 1 and head[0] == 0xFF and (head[1] & 0xE0) == 0xE0)


rows = collections.defaultdict(lambda: collections.defaultdict(int))
problems = collections.defaultdict(list)


def account(grade, cat, desc, text, where):
    source = (desc or {}).get('source') or (desc or {}).get('normal')
    if not desc or desc.get('available') is not True:
        rows[grade][cat + '|pending'] += 1
        return
    rows[grade][cat + '|live'] += 1
    if not source:
        problems['no source on an available descriptor'].append(where)
        return
    path = os.path.normpath(os.path.join(E, source))
    if not os.path.exists(path):
        problems['available descriptor, file missing'].append(f'{where} -> {source}')
        return
    size = os.path.getsize(path)
    if size <= 1000:
        problems['file under 1 KB'].append(f'{where} -> {source}')
        return
    if not valid_mp3(path):
        problems['not valid audio (bad header)'].append(f'{where} -> {source}')
        return
    script = narration(text)
    seconds = size / BYTES_PER_SECOND
    if len(script) > MIN_CHARS_FOR_RATE and seconds > 0:
        rate = len(script) / seconds
        if rate > RATE_MAX:
            problems['clip too short for its script'].append(
                f'{where} {len(script)}ch/{seconds:.1f}s={rate:.0f}ch/s')


def walk_other(node, grade, name, path=''):
    """Audio descriptors in quiz/capstone/assessment/lecture files, wherever they sit."""
    if isinstance(node, dict):
        if isinstance(node.get('source'), str) and node['source'].endswith('.mp3'):
            account(grade, f'other:{name}', node, '', f'g{grade} {name}{path}')
        for key, value in node.items():
            walk_other(value, grade, name, f'{path}.{key}')
    elif isinstance(node, list):
        for i, value in enumerate(node):
            walk_other(value, grade, name, f'{path}[{i}]')


def main():
    assert_generator_transform_unchanged()

    for grade in range(1, 9):
        units = os.path.join(E, f'grade-{grade}', 'data', 'units')
        for filename in sorted(os.listdir(units)):
            unit = json.load(open(os.path.join(units, filename), encoding='utf-8'))
            for r in unit.get('readings', []):
                account(grade, 'readings', r.get('audio'), r.get('passageScript'),
                        f"g{grade} {r['readingId']}")
            for x in unit.get('grammar', []):
                account(grade, 'grammar', x.get('audio'),
                        f"{x.get('explanation')} {x.get('ruleAndExamples', '')}",
                        f"g{grade} {x['grammarId']}")
                account(grade, 'practice', x.get('practiceAudio'), x.get('practice'),
                        f"g{grade} {x['grammarId']}-practice")
            for s in unit.get('speaking', []):
                account(grade, 'speaking', s.get('audio'), s.get('instructionsAndModelLines'),
                        f"g{grade} {s['speakingId']}")
            for w in unit.get('writing', []):
                account(grade, 'writing', w.get('audio'), w.get('promptAndInstructions'),
                        f"g{grade} {w['writingId']}")
            for a in unit.get('activities', []):
                account(grade, 'activities', a.get('audio'), a.get('instructionsAndItems'),
                        f"g{grade} {a['activityId']}")
            for v in unit.get('dictionaryLinks', []):
                sentence_audio = v.get('sentenceAudio') or []
                for i, sentence in enumerate(v.get('practiceSentences') or []):
                    account(grade, 'sentences',
                            sentence_audio[i] if i < len(sentence_audio) else None,
                            sentence, f"g{grade} {v['vocabularyId']}#{i + 1}")
                account(grade, 'meanings', v.get('meaningAudio'), v.get('childMeaning'),
                        f"g{grade} {v['vocabularyId']}-meaning")

        dictionary = os.path.join(E, f'grade-{grade}', 'data', f'master-dictionary.grade{grade}.json')
        for entry in json.load(open(dictionary, encoding='utf-8'))['entries']:
            account(grade, 'dict words', entry.get('audio'), entry.get('displayWord'),
                    f"g{grade} dict {entry['displayWord']}")

        for other in sorted(glob.glob(os.path.join(E, f'grade-{grade}', 'data', '*.json'))):
            if os.path.basename(other).startswith('master-dictionary'):
                continue
            walk_other(json.load(open(other, encoding='utf-8')), grade, os.path.basename(other))

    cats = ['readings', 'grammar', 'practice', 'speaking', 'writing', 'activities',
            'sentences', 'meanings', 'dict words']
    print('LIVE (available:true and verified) per grade')
    print(f"{'grade':>5} " + ' '.join(f'{c[:9]:>10}' for c in cats))
    for grade in range(1, 9):
        print(f'{grade:>5} ' + ' '.join(f"{rows[grade][c + '|live']:>10}" for c in cats))

    total_live = sum(rows[g][c + '|live'] for g in range(1, 9) for c in cats)
    print(f'\ntotal live: {total_live}')

    pending = collections.Counter()
    for grade in range(1, 9):
        for key, count in rows[grade].items():
            if key.endswith('|pending'):
                pending[key.split('|')[0]] += count
    if pending:
        print('pending (declared available:false - placeholders, not failures) by source:')
        for key, count in pending.most_common():
            print(f'  {key:>24} {count}')

    total = sum(len(v) for v in problems.values())
    print(f'\nPROBLEMS ({total} total)')
    if not problems:
        print('  none')
    for kind, items in problems.items():
        print(f'  {kind}: {len(items)}')
        for item in items[:5]:
            print(f'      {item}')
        if len(items) > 5:
            print(f'      ... and {len(items) - 5} more')

    return 1 if total else 0


if __name__ == '__main__':
    sys.exit(main())
