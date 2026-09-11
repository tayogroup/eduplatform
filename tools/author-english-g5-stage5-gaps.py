# -*- coding: utf-8 -*-
"""Author the teaching Grade 5 was missing for five Stage 5 objectives, then
claim them. The Grade 4 equivalent is author-english-g4-stage4-gaps.py; this
follows its shapes and its rules.

WHAT WAS MISSING. Grade 5 claimed 87 of the 92 Stage 5 objectives. The five
left were taught nowhere in its ten units:

  5Ww.03  single and double consonants: full, -ful, -fully
  5Ww.06  homonyms: one spelling, several meanings (wave)
  5Ww.07  less common letter strings said differently (pour, hour; piece, pie)
  5Ww.08  exceptions to known spelling rules
  5SLp.04 choosing the media for a presentation

WHAT THIS ADDS, in shapes the shell and the app already render:

  grammar rules   -ful and -fully, and doubling before -ing (Unit 4, beside
                  its -ful words); the rule-breakers of three spelling rules
                  (Unit 5, beside its word families); homonyms, starting from
                  "the current youth history programme" (Unit 7); letter
                  strings with more than one sound, starting from physician
                  and philosophy (Unit 8)
  speaking task   choose the media for the capstone presentation (Unit 10)

Each rule's practice line carries its own key after "Check yourself", and
every new item gets an answer-key row. Grammar and speaking items carry an
audio descriptor marked unavailable, so the app speaks their text. The codes
are claimed on the outcome that already carries the unit's word-level (or,
for 5SLp.04, presentation) claims:

  5Ww.03 -> Unit 4 lo06   5Ww.08 -> Unit 5 lo08   5Ww.06 -> Unit 7 lo03
  5Ww.07 -> Unit 8 lo03   5SLp.04 -> Unit 10 lo05

THIS IS AUTHORING. Every new item is flagged "Needs curriculum review" and the
outcomes whose mapping widens move to a re-review flag. Nothing here was read
by a reviewer.

    python tools/author-english-g5-stage5-gaps.py          # dry run
    python tools/author-english-g5-stage5-gaps.py --write

Idempotent: an item whose title is already present is left alone; a code
already claimed is not claimed twice.
"""
import io
import json
import os
import sys

UNITS = os.path.join('src', 'prototypes', 'ehel-academy', 'english', 'grade-5', 'data', 'units')
FRAMEWORK = os.path.join('src', 'curriculum', 'cambridge-english-0058.json')
ORIGIN = 'Ehel authoring 2026-09-11 (Stage 5 gaps: -ful and -fully, spelling-rule exceptions, homonyms, letter strings, choosing presentation media)'
SOURCE = "Authored from the unit's own words and readings"
NEW_FLAG = 'Needs curriculum review (new content, 2026-09-11)'
MAP_FLAG = 'Needs re-review (Cambridge mapping extended with the objectives the unit now teaches, 2026-09-11)'
NO_CLIP = {'available': False,
           'status': 'Not recorded - authored 2026-09-11; the app speaks the text. Record with the generator when the content is approved.'}

GRAMMAR = {
    4: [dict(
        title='One L or Two? Full, -ful and -fully',
        practiceType='Guided application',
        explanation='The word full has two ls. When it becomes a suffix it keeps only one: dread + ful = dreadful, delight + ful = delightful. Add -ly to a -ful word and the l doubles again: dreadfully, gratefully. The same care with single and double letters applies when you add -ing or -ed to a short verb.',
        ruleAndExamples='The word on its own has two ls: “The jug is full.”\nThe suffix has one l: dread + ful = dreadful, force + ful = forceful, delight + ful = delightful, hope + ful = hopeful.\nAdd -ly to a -ful word and you get -fully, with two ls: careful → carefully, dreadful → dreadfully, grateful → gratefully.\nA short verb with one short vowel before its last consonant doubles that consonant before -ing or -ed: stop → stopping, plan → planned.\nIt does not double after two vowels or a long vowel sound: rain → raining, hope → hoping.',
        commonMistake='Writing -full at the end of a word (hopefull, dreadfull), or one l in -fully (carefuly). The suffix always has one l, and the adverb always has two.',
        memoryTip='Full is a whole word, so it keeps both ls. As a suffix it loses one. Add -ly and the second l comes back: care-ful-ly.',
        practice='Part A. Add -ful to each word and write the new word: 1. dread 2. force 3. delight 4. duty 5. hope | Part B. Turn each -ful word into an adverb: 6. careful 7. grateful 8. forceful | Part C. Add -ing to each verb, doubling the last letter only where the rule says so: 9. plan 10. rain 11. stop 12. shout | Check yourself: 1. dreadful 2. forceful 3. delightful 4. dutiful (the y changes to i) 5. hopeful 6. carefully 7. gratefully 8. forcefully 9. planning 10. raining 11. stopping 12. shouting',
        outcome='lo06')],
    5: [dict(
        title='When the Spelling Rules Break',
        practiceType='Guided recognition',
        explanation='Spelling rules work most of the time, but some common words break them. A careful speller learns the rule first and then its exceptions, because the rule-breakers are often words we use every day.',
        ruleAndExamples='Rule: drop the final e before a suffix that starts with a vowel. hope → hoping, communicate → communication, encourage → encouraging.\nException: keep the e after c or g before -able or -ous, so the letter stays soft. notice → noticeable, courage → courageous, change → changeable.\nRule: change y to i before a suffix. happy → happiness, carry → carried.\nException: keep the y before -ing, and in some short words. carry → carrying, shy → shyness, dry → dryness.\nRule: i before e, except after c. piece, believe, receive, ceiling.\nException: science, their, weird, height and neighbour break it.',
        commonMistake='Applying a rule where it breaks: noticable, shiness, carriing, wierd.',
        memoryTip='Learn the rule, then keep its rule-breakers in your spelling log and read them aloud once a week.',
        practice='Part A. Add the suffix, write the word, and say whether it follows the rule or breaks it: 1. hope + ing 2. notice + able 3. courage + ous 4. happy + ness 5. carry + ing 6. shy + ness | Part B. Correct each misspelling: 7. wierd 8. sceince 9. recieve | Check yourself: 1. hoping (follows) 2. noticeable (breaks: the e stays so the c stays soft) 3. courageous (breaks: the e stays so the g stays soft) 4. happiness (follows) 5. carrying (breaks: the y stays before -ing) 6. shyness (breaks) 7. weird 8. science 9. receive',
        outcome='lo08')],
    7: [dict(
        title='Homonyms: One Spelling, Several Meanings',
        practiceType='Guided recognition',
        explanation='A homonym is a word with one spelling and more than one meaning. The words around it tell you which meaning is meant. In The Forgotten Mural, the visitor says the mural may join the current youth history programme: current there means happening now, not a flow of water.',
        ruleAndExamples='current: happening now (“the current programme”); a flow of water or air (“a strong current in the river”); a flow of electricity (“an electric current”).\nwave: a movement of the hand (“She gave a wave”); a moving ridge of sea water (“a huge wave”); a curl in hair (“a wave in her hair”).\nfair: just and equal (“a fair decision”); a public event with stalls (“the school fair”); light in colour (“fair hair”).\nlight: not heavy (“a light bag”); brightness (“the light from the window”).\nRead the whole sentence before you decide which meaning fits.',
        commonMistake='Taking the first meaning you know. In “We bought juice at the school fair”, fair is an event, not a judgement.',
        memoryTip='One spelling, many jobs: ask what job the word is doing in THIS sentence.',
        practice='Part A. Write which meaning of current, wave or fair is used in each sentence: 1. The visitor mentioned the current youth history programme. 2. The swimmers fought against the current. 3. Omar gave Amal a wave from his stall. 4. The judge made a fair decision. 5. We bought juice at the school fair. | Part B. Write two sentences for one of these words, with a different meaning in each: bank, bat, ring. | Check yourself: 1. happening now 2. a flow of water 3. a movement of the hand 4. just and equal 5. a public event with stalls. Part B is open: for example, “We sat on the river bank.” and “Mum put her money in the bank.”',
        outcome='lo03')],
    8: [dict(
        title='Same Letters, Different Sounds',
        practiceType='Guided recognition',
        explanation='Some letter strings are said in more than one way, so you cannot always spell a word from its sound. Pour and hour share ou but do not rhyme; piece and pie share ie but sound different. This unit’s physician, physics and philosophy all spell the f sound with ph.',
        ruleAndExamples='ou: pour, four (said “or”); hour, sound (said “ow”); touch, young (said “u”); soup, group (said “oo”).\nie: piece, field (said “ee”); pie, tie (said “eye”); friend (said “e”).\nph: physician, physics, philosophy, telegraph (said “f”).\nea: bread, head (said “e”); bead, seat (said “ee”); great, break (said “ay”).\nWhen you learn a word with one of these strings, say it, spell it aloud and group it with words that sound the same.',
        commonMistake='Spelling by sound alone: peece for piece, our for hour, fisician for physician.',
        memoryTip='Sort each new word into its sound family: pour goes with four, and hour goes with sound.',
        practice='Part A. Sort these words by the sound of ou: pour, hour, touch, soup, four, sound, young, group. | Part B. Choose the correct spelling: 1. a (peice / piece) of cake 2. The (physician / fisician) checked the patient. 3. Wait for an (hour / our). 4. We ate (bred / bread) with our soup. | Check yourself: Part A: said “or” pour, four; said “ow” hour, sound; said “u” touch, young; said “oo” soup, group. Part B: 1. piece 2. physician 3. hour 4. bread',
        outcome='lo03')],
}

SPEAKING = {
    10: dict(
        title='Speaking 7: Choose Your Media',
        activityType='Guided speaking',
        instructionsAndModelLines='Before your final presentation, decide which media will carry it best.\nList the choices: a poster, a slide show, a short audio or video recording, a booklet or handout, or real objects to hold up.\nFor each one, ask three questions: Who is my audience? What do they need to see or hear? Where will I present, and for how long?\nChoose one main medium and one extra one, and give a reason for each.\nModel answer: I will use a poster, because my audience is Grade 2 and they need big pictures, and a short recording of birdsong, because they have never heard the birds I describe.\nTell a partner, an adult or the AI tutor your choice and your reasons, then ask whether they would choose differently.',
        recordingRequired=False,
        aiTutorPrompt='With an adult present, tell the tutor your audience and your topic, and ask it to suggest one medium you had not thought of and one reason it might work.',
        key='Look for one main medium and one extra, each with a reason tied to the audience, the content or the place. A choice with no reason is not yet complete; a reason that names the audience is strong.',
        outcome='lo05'),
}

CLAIMS = {
    4: {'lo06': ['5Ww.03']},
    5: {'lo08': ['5Ww.08']},
    7: {'lo03': ['5Ww.06']},
    8: {'lo03': ['5Ww.07']},
    10: {'lo05': ['5SLp.04']},
}


def sub(c):
    return c[1:c.index('.')]


def strand(c):
    return 'SL' if sub(c).startswith('SL') else sub(c)[0]


def place(cs, c, order):
    same = [i for i, x in enumerate(cs) if sub(x) == sub(c)]
    if same:
        group = sorted([cs[i] for i in same] + [c], key=lambda x: order[x])
        return cs[:same[0]] + group + cs[same[-1] + 1:]
    kin = [i for i, x in enumerate(cs) if strand(x) == strand(c)]
    at = kin[-1] + 1 if kin else len(cs)
    return cs[:at] + [c] + cs[at:]


def main():
    write = '--write' in sys.argv
    for arg in sys.argv[1:]:
        if arg != '--write':
            sys.exit('REFUSED: unrecognised argument %r. Use --write, or no argument for a dry run.' % arg)

    fw = json.load(io.open(FRAMEWORK, encoding='utf-8'))
    stage = [o['code'] for o in fw['objectivesByStage']['5']]
    order = {c: i for i, c in enumerate(stage)}
    for m in CLAIMS.values():
        for codes in m.values():
            for c in codes:
                if c not in order:
                    sys.exit('REFUSED: %s is not a Stage 5 objective' % c)

    docs = {}
    for n in range(1, 11):
        p = os.path.join(UNITS, 'unit-%d.json' % n)
        raw = io.open(p, encoding='utf-8').read()
        docs[n] = json.loads(raw)
        if json.dumps(docs[n], ensure_ascii=False, indent=2) + '\n' != raw:
            sys.exit('REFUSED: unit-%d.json does not round-trip through this writer.' % n)

    def claimed():
        s = set()
        for d in docs.values():
            for o in d['outcomes']:
                s.update(o.get('cambridgeObjectives') or [])
        return s & set(stage)

    before = claimed()
    added = {'grammar': 0, 'speaking': 0, 'keys': 0, 'codes': 0, 'flags': 0}
    changed = set()

    for n in sorted(set(GRAMMAR) | set(SPEAKING) | set(CLAIMS)):
        d = docs[n]
        uid = d['unit']['unitId']
        outcome_id = lambda suffix: '%s-%s' % (uid, suffix)
        answer_numbers = [int(a['answerId'].rsplit('-', 1)[1]) for a in d['answerKey'] if a['answerId'].rsplit('-', 1)[1].isdigit()]
        next_answer = [max(answer_numbers) if answer_numbers else 0]

        def key_row(content_id, content_type, text):
            next_answer[0] += 1
            aid = '%s-answer-%03d' % (uid, next_answer[0])
            while any(a['answerId'] == aid for a in d['answerKey']):
                next_answer[0] += 1
                aid = '%s-answer-%03d' % (uid, next_answer[0])
            d['answerKey'].append({'answerId': aid, 'unitId': uid, 'contentId': content_id,
                                   'contentType': content_type, 'answerOrGuidance': text,
                                   'origin': ORIGIN, 'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE})
            added['keys'] += 1

        have_gram = {g['title'] for g in d['grammar']}
        for g in GRAMMAR.get(n, []):
            if g['title'] in have_gram:
                continue
            if not any(o['outcomeId'] == outcome_id(g['outcome']) for o in d['outcomes']):
                sys.exit('REFUSED: unit-%d.json has no outcome %s' % (n, g['outcome']))
            gseq = max(x['sequence'] for x in d['grammar']) + 1
            gid = '%s-grammar%02d' % (uid, gseq)
            slug = ''.join(ch if ch.isalnum() else '-' for ch in g['title'].lower()).strip('-')
            while '--' in slug:
                slug = slug.replace('--', '-')
            d['grammar'].append({
                'grammarId': gid, 'conceptId': '%s-concept-%s' % (gid, slug), 'unitId': uid, 'sequence': gseq,
                'practiceType': g['practiceType'], 'title': g['title'], 'explanation': g['explanation'],
                'ruleAndExamples': g['ruleAndExamples'], 'commonMistake': g['commonMistake'],
                'memoryTip': g['memoryTip'], 'practice': g['practice'],
                'outcomeId': outcome_id(g['outcome']), 'origin': ORIGIN, 'reviewStatus': NEW_FLAG,
                'sourceFile': SOURCE, 'audio': dict(NO_CLIP), 'practiceAudio': dict(NO_CLIP)})
            key_row(gid, 'Language practice',
                    'The practice line carries its own key after "Check yourself". Watch for: %s' % g['commonMistake'])
            added['grammar'] += 1
            changed.add(n)

        if n in SPEAKING and SPEAKING[n]['title'] not in {s['title'] for s in d['speaking']}:
            s = SPEAKING[n]
            sseq = max(x['sequence'] for x in d['speaking']) + 1
            sid = '%s-speak%02d' % (uid, sseq)
            d['speaking'].append({
                'speakingId': sid, 'unitId': uid, 'sequence': sseq, 'title': s['title'],
                'outcomeId': outcome_id(s['outcome']), 'origin': ORIGIN, 'reviewStatus': NEW_FLAG, 'sourceFile': SOURCE,
                'activityType': s['activityType'], 'instructionsAndModelLines': s['instructionsAndModelLines'],
                'recordingRequired': s['recordingRequired'], 'aiTutorPrompt': s['aiTutorPrompt'],
                'audio': dict(NO_CLIP)})
            key_row(sid, 'Speaking', s['key'])
            added['speaking'] += 1
            changed.add(n)

        for suffix, codes in CLAIMS.get(n, {}).items():
            o = next((o for o in d['outcomes'] if o['outcomeId'] == outcome_id(suffix)), None)
            if o is None:
                sys.exit('REFUSED: unit-%d.json has no outcome %s' % (n, suffix))
            cs = list(o.get('cambridgeObjectives') or [])
            new = [c for c in codes if c not in cs]
            if not new:
                continue
            for c in new:
                cs = place(cs, c, order)
            o['cambridgeObjectives'] = cs
            added['codes'] += len(new)
            if o.get('reviewStatus') != MAP_FLAG:
                o['reviewStatus'] = MAP_FLAG
                added['flags'] += 1
            changed.add(n)

    after = claimed()
    if write:
        for n in sorted(changed):
            io.open(os.path.join(UNITS, 'unit-%d.json' % n), 'w', encoding='utf-8', newline='\n').write(
                json.dumps(docs[n], ensure_ascii=False, indent=2) + '\n')

    print('\n  Grade 5 Stage 5 gaps  (%s)' % ('WRITING' if write else 'dry run - add --write'))
    print('    grammar rules added   : %d' % added['grammar'])
    print('    speaking tasks added  : %d' % added['speaking'])
    print('    answer-key rows added : %d' % added['keys'])
    print('    codes claimed         : %d on %d outcome(s) re-flagged' % (added['codes'], added['flags']))
    print('    Stage 5 coverage      : %d/%d (%.0f%%) -> %d/%d (%.0f%%)' % (
        len(before), len(stage), 100.0 * len(before) / len(stage), len(after), len(stage), 100.0 * len(after) / len(stage)))
    print('    still unclaimed       : %s' % (', '.join(sorted(set(stage) - after)) or 'none'))
    print('    units touched         : %s' % ', '.join('u%d' % n for n in sorted(changed)))
    if not write and not changed:
        print('\n    nothing to do - already applied.')
    print('')


if __name__ == '__main__':
    main()
