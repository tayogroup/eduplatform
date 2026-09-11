# Ehel Intensive English — People, Places and Voice

This replaces the character canon a school course needs. The intensive course is
**self-teaching and language-neutral**, and it is for **adults**. All three
change who appears in the content.

## Who the learner is

**An adult ESL learner**, of any first language. Level 1 starts before A1: the
learner may know no English at all. They may be a nurse, a driver, a business
owner or a parent, and they are studying intensively, often alone and often
tired.

- **Write to an adult.** Their life is the material: work, the shops, the
  clinic, appointments, forms, travel, money, the people around them.
- **No child-only worlds.** No toys, no cartoon animals doing human things, no
  playground games, no "let's have fun!", no stickers or prizes as the point of
  a task. An animal can appear as an animal.
- **Assume an adult, but never a particular life.** Do not assume the learner
  has a job, a car, a home of their own, children, papers, or money to spend.
  Where a task would need one, let them invent it or offer the other side ("at
  work, or where you study").
- **Studying is adult work here.** An adult learner may well be at an English
  school, so a lesson, a class, a notebook and homework are their world too.

## The default is you, not a character

A school course follows a child through a world because a child reads better
when there is someone to follow. A learner working alone at night does not need
a protagonist — they need the sentence they will use tomorrow.

So the default subject of this course is **you**, and the default cast is
**roles**:

> the person at the desk · a shop assistant · the bus driver · a neighbour ·
> a classmate or a colleague · the doctor · the librarian · the receptionist ·
> the person next to you on the bus · someone in your family

Roles carry no ethnicity, no religion and no nationality. They are also what the
learner actually needs to rehearse: you will meet *a shop assistant* many times
and a named character never.

**Write in second person wherever the content allows it.** "You go to the desk
and say your name" beats "Maria went to the desk and said her name", because the
first is a rehearsal and the second is a story about somebody else.

## When a name is genuinely needed

Some tasks need one — a dialogue with two speakers, a form with a name on it, a
worked example, a short story. Then:

1. **Use a first name only.** Surnames add ethnicity for no teaching gain. The
   one exception is a form that asks for a surname, where the surname is the
   point; use a short, plain one and vary it.
2. **Vary the origin across the course** so no single background reads as the
   default. Draw from different regions across units rather than clustering.
3. **Keep names short and phonetically simple**, because at Pre-A1 and A1 the
   learner is still decoding. A name that is itself a pronunciation problem
   steals attention from the pattern being taught.
4. **A name is a label, not a character.** Do not give it a backstory, a family,
   or a personality that has to stay consistent across units. There is no canon
   to contradict because there is deliberately no continuing cast.
5. **Never make the name carry the point.** If a task only works because the
   character is a refugee, a mother, or a foreigner, rewrite the task.

A working set, mixed by origin and easy to decode:

> Ana · Ben · Dan · Eva · Hana · Ivan · Lena · Leo · Mark · Mia · Nadia ·
> Omar · Priya · Sam · Tomas · Yara · Zoe

Check any new name against the school course before using it, since that course
does have a canon and its names are spoken for:

```bash
grep -ro "\b<name>\b" --include="*.json" src/prototypes/ehel-academy/english/grade-*/data | wc -l
```

## Places

Use the **kind** of place, not the country:

> a clinic · a school · a library · a market · a shop · a bus station ·
> a park · a kitchen · a street · a café · a post office · a bank

No city names, no flags, no currency symbols, no national institutions. If a
task needs a price, write the number and "the price", never a currency. If it
needs an address, use a house number and a street name with no national marker.

## Voice

- **Assume competence and no English.** The learner may be a nurse, a driver, a
  Year 5 pupil or a business owner. They lack the language, not intelligence,
  and nothing you write may imply otherwise.
- **Simple is not childish.** "Go to the desk. Give them this paper." is short
  and respectful. "Now we are going to be clever helpers!" is neither.
- **No pity and no inspiration.** Do not write the learner as struggling, brave,
  or on a journey. They are studying a language.
- **Do not ask for disclosure.** No task may require the learner to write or say
  anything about their immigration status, income, health or family
  circumstances. Where a task needs personal details — a form, an introduction,
  a family tree — say plainly that they may invent them.
- **UK English.** Spelling (colour, centre, practise as the verb) and
  vocabulary (holiday, lift, chemist, post office, rubbish, trousers). The
  course never names the variety; it simply uses it.

## What this course does not do

- It does not name the learner's first language, or assume there is one shared
  language in the room.
- It does not contrast English with another language. A learner who does not
  speak that language learns nothing from the comparison, and a learner who does
  may be told something wrong about their own. "Many languages do not need a
  word here" is the furthest it goes.
- It does not use a religious or national frame for any topic. Festivals,
  holidays and food appear as categories, not as one tradition's examples.
- It does not carry a continuing cast, so there is no canon to keep consistent
  and no name that must mean the same person in Unit 3 and Unit 17.
