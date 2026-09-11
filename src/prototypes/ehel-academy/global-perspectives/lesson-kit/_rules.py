# -*- coding: utf-8 -*-
"""The things this kit COMPUTES rather than trusts, in one place.

build-lessons.py refuses content that breaks them and check-coverage.py
re-checks the shipped pages against them. Both import from here, so the
builder and the gate cannot drift apart - the same rule the topic index and
the narration hashes keep elsewhere in this repo (one definition, shared by
the builder and the gate), and the same stance the Computing kit's _rules.py
takes for Robo and the data table: computed beats claimed.

Global Perspectives at Stage 1 is a skills subject, so what can be computed
is not arithmetic on a grid but the RELATIONSHIPS the skills are about:

  survey_counts     the pictogram a survey makes, from the answers the
                    classmates actually give (1Rc.01 -> 1Rf.01)
  pictogram_answer  what a question about a pictogram is really asking,
                    computed from its rows: the most, the fewest, how many of
                    one, whether any (1Ad.01)
  relevant          which options are ABOUT the topic - by tag, never by an
                    authored ok flag - for a relevant answer (1Mi.01), a
                    follow-up question (1Ml.01), a thing known about a topic
                    (1Ap.01), a reason for an opinion (1Ea.01)
  relevant_sources  which sources can tell you about a topic (1Es.01)
  solutions         which of the given actions actually fixes the issue
                    (1As.01)
  share_outcome     who gets to finish when a child shares, or does not
                    share, a resource a partner needs (1Cc.01)
  question_fits     whether a question word and an ending make the question
                    a round asked for (1Rq.01)
"""


def survey_counts(people, options):
    """The pictogram rows a survey produces: one row per option, in order."""
    counts = {o["id"]: 0 for o in options}
    for p in people:
        counts[p["answer"]] = counts.get(p["answer"], 0) + 1
    return [{"label": o["t"], "pic": o["pic"], "value": counts[o["id"]]} for o in options]


def observe_counts(scene, rounds):
    """The table an observation makes: how many things of each kind are in the scene."""
    return [{"label": r["label"], "pic": r["pic"], "value": sum(1 for it in scene if it["kind"] == r["kind"])} for r in rounds]


def pictogram_answer(rows, check):
    """The one answer a pictogram question has, or None if it has no single one.

    Stage 3 (3Ad.01, draw simple conclusions) adds three: `more` (is a more
    than b? Yes/No, a tie refused), `total` (all the rows added up) and
    `difference` (how many more a has than b)."""
    kind = check.get("kind")
    if kind == "total":
        return str(sum(r["value"] for r in rows))
    if kind in ("more", "difference"):
        a = next((r for r in rows if r["label"] == check.get("a")), None)
        b = next((r for r in rows if r["label"] == check.get("b")), None)
        if a is None or b is None or a is b:
            return None
        if kind == "more":
            return None if a["value"] == b["value"] else ("Yes" if a["value"] > b["value"] else "No")
        return str(abs(a["value"] - b["value"]))
    if kind in ("most", "least"):
        pick = max if kind == "most" else min
        best = pick(r["value"] for r in rows)
        winners = [r["label"] for r in rows if r["value"] == best]
        if len(winners) != 1:
            return None    # a tie has no single answer; the question is unfair
        return winners[0]
    row = next((r for r in rows if r["label"] == check.get("row")), None)
    if row is None:
        return None
    if kind == "count":
        return str(row["value"])
    if kind == "any":
        return "Yes" if row["value"] > 0 else "No"
    return None


def relevant(options, topics):
    """Indexes of the options whose tag is one of `topics` (a string or a list)."""
    if isinstance(topics, str):
        topics = [topics]
    return [k for k, o in enumerate(options) if o.get("about") in topics]


def supporting(reasons, tag, stance):
    """Indexes of the reasons that are about `tag` AND back up `stance`.
    A reason says which stances it supports in `supports`; one that argues
    against a stance is not a reason for it, however on-topic it is."""
    return [k for k, o in enumerate(reasons) if o.get("about") == tag and stance in (o.get("supports") or [])]


def mixed_pair_exists(reasons, tag, stance, mixed_ids):
    """A mixed stance ("I partly agree") needs two of its supporting reasons
    that do not both back the same one-sided stance."""
    sides = [set(o.get("supports") or []) - set(mixed_ids) for o in reasons
             if o.get("about") == tag and stance in (o.get("supports") or [])]
    return any(not (a & b) for i, a in enumerate(sides) for b in sides[i + 1:])


def relevant_sources(sources, topic):
    """Ids of the sources that can tell you about the topic."""
    return [s["id"] for s in sources if topic in (s.get("about") or [])]


def solutions(actions, needs):
    """Ids of the actions whose effect is what the issue needs."""
    return [a["id"] for a in actions if a.get("effect") == needs]


def allocations(tasks, members):
    """For each task, the ids of the members whose skills include what it needs."""
    return {t["id"]: [m["id"] for m in members if t["needs"] in (m.get("skills") or [])] for t in tasks}


def share_outcome(you, give, need):
    """Who can finish after you give `give` of your `you` items, when each of
    you needs `need`: "both", "you", "partner" or "neither"."""
    if give < 0 or give > you:
        return None
    mine, theirs = you - give, give
    if mine >= need and theirs >= need:
        return "both"
    if mine >= need:
        return "you"
    if theirs >= need:
        return "partner"
    return "neither"


def question_fits(ends, end_id, word):
    """Whether `word` + the ending `end_id` is a question the ending allows."""
    end = next((e for e in ends if e["id"] == end_id), None)
    return bool(end) and word in (end.get("words") or [])
