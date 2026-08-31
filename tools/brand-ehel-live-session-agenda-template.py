#!/usr/bin/env python3
"""Put the Ehel Academy crest on the live-session agenda templates.

The two decks a teacher starts from carried no artwork at all -- 41,534 bytes,
ten slides, zero media parts -- so every live session opened on an unbranded
page. This builds the branded copies that ship in local_hubredirect/pix/ from
the plain originals in inputs/, which is the only reason the branding can be
adjusted twice: editing the shipped deck in place leaves nothing to rebuild
from, and the crest would then have to be removed by hand before it could be
moved.

Two placements, and both are decided by where each deck's own header already
puts its text:

  * a small crest in the green header band of every slide, on the OUTER edge --
    left in English, right in the mirrored Arabic deck, where the title sits on
    the right and the space on the left is taken by the slide-number chip.
  * one large crest on slide 1, in the gap the title slide already leaves
    between the header band and its welcome line.

Byte-stable: the parts copied from the source keep their own timestamps and new
parts get a fixed one, so re-running produces an identical file and a rebuild
that changes nothing shows as nothing in git.

    python tools/brand-ehel-live-session-agenda-template.py --dry
    python tools/brand-ehel-live-session-agenda-template.py
"""

from __future__ import annotations

import argparse
import hashlib
import io
import re
import sys
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "inputs" / "ehel-live-session-agenda-source"
PIX_DIR = ROOT / "src" / "moodle" / "local_hubredirect" / "pix"
LOGO = PIX_DIR / "ehel-academy-logo-transparent.png"

# The crest is stored once per deck and referenced by every slide.
MEDIA_PART = "ppt/media/ehel-academy-crest.png"
MEDIA_TARGET = "../media/ehel-academy-crest.png"
CREST_PX = 512
FIXED_DATE = (2026, 1, 1, 0, 0, 0)

A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
IMAGE_REL = R_NS + "/image"

# Slide geometry, in EMU. 12192000 x 6858000 (16:9); the header band is the top
# 609600 and is solid #2F6F4E in both decks.
SLIDE_W = 12192000
BAND_H = 609600
HEADER_CREST = 457200
HEADER_MARGIN = 228600
HERO_CREST = 838200
HERO_Y = 685800

# The English header title starts hard against the left margin, which is where
# its crest goes, so that one shape moves right. The Arabic deck needs no such
# move: its title is right-aligned and ends 952500 short of the edge.
EN_TITLE_FROM = (495300, 152400, 4000500, 323850)
EN_TITLE_TO_X = 800100

DECKS = [
    {
        "name": "live-session-agenda-template.pptx",
        "variant": "en",
        "crest_x": HEADER_MARGIN,
        "shift": EN_TITLE_FROM,
        "shift_to": EN_TITLE_TO_X,
    },
    {
        "name": "live-session-agenda-template-ar.pptx",
        "variant": "ar",
        "crest_x": SLIDE_W - HEADER_MARGIN - HEADER_CREST,
        "shift": None,
        "shift_to": None,
    },
]


def crest_bytes() -> bytes:
    """The crest at a size a header mark actually needs, not 940 KB of it."""
    with Image.open(LOGO) as img:
        img = img.convert("RGBA")
        img = img.resize((CREST_PX, CREST_PX), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def pic_xml(shape_id: int, name: str, rid: str, x: int, y: int, size: int) -> str:
    return (
        "<p:pic><p:nvPicPr>"
        f'<p:cNvPr id="{shape_id}" name="{name}" descr="Ehel Academy" />'
        f'<p:cNvPicPr><a:picLocks xmlns:a="{A_NS}" noChangeAspect="1" /></p:cNvPicPr>'
        "<p:nvPr /></p:nvPicPr>"
        f'<p:blipFill><a:blip xmlns:a="{A_NS}" xmlns:r="{R_NS}" r:embed="{rid}" />'
        f'<a:stretch xmlns:a="{A_NS}"><a:fillRect /></a:stretch></p:blipFill>'
        "<p:spPr>"
        f'<a:xfrm xmlns:a="{A_NS}"><a:off x="{x}" y="{y}" /><a:ext cx="{size}" cy="{size}" /></a:xfrm>'
        f'<a:prstGeom xmlns:a="{A_NS}" prst="rect"><a:avLst /></a:prstGeom>'
        "</p:spPr></p:pic>"
    )


def next_rid(rels_xml: str) -> str:
    """An id no relationship in this part already uses."""
    taken = set(re.findall(r'Id="([^"]+)"', rels_xml))
    n = 1
    while f"rIdEhelCrest{n}" in taken:
        n += 1
    return f"rIdEhelCrest{n}"


def add_image_rel(rels_xml: str, rid: str) -> str:
    rel = (
        f'<Relationship Type="{IMAGE_REL}" Target="{MEDIA_TARGET}" Id="{rid}" />'
    )
    return rels_xml.replace("</Relationships>", rel + "</Relationships>", 1)


def shift_title(slide_xml: str, frm: tuple[int, int, int, int], to_x: int) -> tuple[str, int]:
    """Move the header title clear of the crest, matched on its exact geometry."""
    x, y, cx, cy = frm
    old = f'<a:off x="{x}" y="{y}" /><a:ext cx="{cx}" cy="{cy}" />'
    new = f'<a:off x="{to_x}" y="{y}" /><a:ext cx="{cx}" cy="{cy}" />'
    return slide_xml.replace(old, new), slide_xml.count(old)


def brand(deck: dict, crest: bytes, dry: bool) -> dict:
    source = SOURCE_DIR / deck["name"]
    target = PIX_DIR / deck["name"]
    src = zipfile.ZipFile(source)
    names = src.namelist()
    if MEDIA_PART in names:
        raise SystemExit(f"{source.name}: already carries the crest — the source deck must stay plain.")

    slides = sorted(
        (n for n in names if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)),
        key=lambda n: int(re.search(r"(\d+)", n.rsplit("/", 1)[1]).group(1)),
    )
    report = {"deck": deck["name"], "slides": len(slides), "header": 0, "hero": 0, "shifted": 0}

    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as dst:
        for item in src.infolist():
            data = src.read(item.filename)

            if item.filename == "[Content_Types].xml":
                text = data.decode("utf8")
                if 'Extension="png"' not in text:
                    # After the <Types …> element, not after the first ">" in the
                    # file — that one closes the XML declaration.
                    opening = re.search(r"<Types\b[^>]*>", text)
                    if not opening:
                        raise SystemExit(f"{deck['name']}: [Content_Types].xml has no <Types> element.")
                    at = opening.end()
                    text = text[:at] + '<Default Extension="png" ContentType="image/png" />' + text[at:]
                data = text.encode("utf8")

            elif re.fullmatch(r"ppt/slides/_rels/slide\d+\.xml\.rels", item.filename):
                text = data.decode("utf8")
                rid = next_rid(text)
                data = add_image_rel(text, rid).encode("utf8")

            elif item.filename in slides:
                index = slides.index(item.filename) + 1
                text = data.decode("utf8")
                rels = src.read(
                    f"ppt/slides/_rels/{item.filename.rsplit('/', 1)[1]}.rels"
                ).decode("utf8")
                rid = next_rid(rels)
                additions = pic_xml(
                    900 + index,
                    "Ehel Academy crest",
                    rid,
                    deck["crest_x"],
                    (BAND_H - HEADER_CREST) // 2,
                    HEADER_CREST,
                )
                report["header"] += 1
                if index == 1:
                    additions += pic_xml(
                        950,
                        "Ehel Academy crest (title)",
                        rid,
                        (SLIDE_W - HERO_CREST) // 2,
                        HERO_Y,
                        HERO_CREST,
                    )
                    report["hero"] += 1
                if deck["shift"]:
                    text, moved = shift_title(text, deck["shift"], deck["shift_to"])
                    report["shifted"] += moved
                text = text.replace("</p:spTree>", additions + "</p:spTree>", 1)
                data = text.encode("utf8")

            info = zipfile.ZipInfo(item.filename, date_time=item.date_time)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = item.external_attr
            dst.writestr(info, data)

        info = zipfile.ZipInfo(MEDIA_PART, date_time=FIXED_DATE)
        info.compress_type = zipfile.ZIP_DEFLATED
        dst.writestr(info, crest)

    built = out.getvalue()
    report["bytes"] = len(built)
    report["sha256"] = hashlib.sha256(built).hexdigest()[:12]
    report["changed"] = not target.exists() or target.read_bytes() != built
    if not dry and report["changed"]:
        target.write_bytes(built)
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry", action="store_true", help="report, write nothing")
    args = parser.parse_args()

    if not SOURCE_DIR.is_dir():
        print(f"missing source decks: {SOURCE_DIR}", file=sys.stderr)
        return 2
    if not LOGO.is_file():
        print(f"missing logo: {LOGO}", file=sys.stderr)
        return 2

    crest = crest_bytes()
    print(f"crest: {LOGO.name} -> {CREST_PX}x{CREST_PX}, {len(crest):,} bytes")
    for deck in DECKS:
        report = brand(deck, crest, args.dry)
        state = "would write" if args.dry and report["changed"] else ("wrote" if report["changed"] else "unchanged")
        print(
            f"  {report['deck']}: {state} {report['bytes']:,} bytes (sha {report['sha256']}) — "
            f"{report['header']} header crest(s) over {report['slides']} slides, "
            f"{report['hero']} title crest, {report['shifted']} title(s) moved clear"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
