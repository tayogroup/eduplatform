"""Add explicit RTL paragraph metadata to generated Arabic PowerPoint decks."""

from __future__ import annotations

import os
import re
import sys
import zipfile
from pathlib import Path


def _patch_slide_xml(xml: str) -> str:
    xml = re.sub(r"<a:pPr\s*/>", '<a:pPr rtl="1" algn="r"/>', xml)
    xml = re.sub(r"<a:pPr(?![^>]*\brtl=)([^>]*)>", r'<a:pPr rtl="1"\1>', xml)
    xml = re.sub(r"<a:pPr(?![^>]*\balgn=)([^>]*)>", r'<a:pPr algn="r"\1>', xml)
    xml = re.sub(r"<a:rPr(?![^>]*\blang=)([^>]*)>", r'<a:rPr lang="ar-SA"\1>', xml)
    return xml


def patch_pptx(path: Path) -> tuple[int, int]:
    tmp = path.with_suffix(path.suffix + ".tmp")
    slide_count = 0
    rtl_count = 0

    with zipfile.ZipFile(path, "r") as source, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as target:
        for item in source.infolist():
            data = source.read(item.filename)
            if item.filename.startswith("ppt/slides/slide") and item.filename.endswith(".xml"):
                slide_count += 1
                xml = data.decode("utf-8")
                patched = _patch_slide_xml(xml)
                rtl_count += patched.count('rtl="1"')
                data = patched.encode("utf-8")
            target.writestr(item, data)

    os.replace(tmp, path)
    return slide_count, rtl_count


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: patch_arabic_pptx_rtl.py <pptx> [<pptx> ...]", file=sys.stderr)
        return 2

    for arg in argv[1:]:
        path = Path(arg)
        if not path.exists():
            print(f"missing: {path}", file=sys.stderr)
            return 1
        slides, rtl = patch_pptx(path)
        print(f"patched {path}: slides={slides} rtlMarkers={rtl}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
