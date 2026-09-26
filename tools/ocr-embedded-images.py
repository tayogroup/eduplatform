# -*- coding: utf-8 -*-
"""OCR a PDF by reading its EMBEDDED IMAGES, not its rendered pages.

WHY THIS EXISTS. ocrmypdf rasterises each page at a DPI relative to the page's
own box, then hands that raster to tesseract. That is correct for an ordinary
scan and useless for a PDF whose page box lies about its size.

Cambridge_LS_Maths_9_Learners_Book_OCR.pdf is the worked example. Measured:

  page box            0.87 x 1.08 inches
  embedded image      3296 x 2331 px      -> an effective 3805 DPI
  unique images       178, for 354 pages  -> each scan is a two-page spread
                                             placed on two consecutive pages
  result of ocrmypdf  252 of 354 pages (71%) came back with under 50 characters,
                      and what did come through was garbled: "This paliemn has
                      rotational symmetry", "low i eee a copy of the pattern"

At default settings a 0.87-inch page rasterises to a few hundred pixels wide,
which is far too small to read a textbook page - so tesseract returned almost
nothing, and nothing in the output said so. Whole-book average: 298 characters
per page, against 2,619 for the Stage 7 Teacher's Resources that OCR'd
normally.

Going at the embedded images instead sidesteps the page geometry entirely:
they are full resolution, and each one is a whole spread. Measured on the same
book, one spread returned 5,095 characters - about 2,500 per book page - and
the text reads cleanly.

THE CHECK THAT MATTERS IS THE BLANK-PAGE RATE, NOT THE AVERAGE. A mean of
characters per page hides a bimodal failure: this book averaged 298 because
102 pages were fine and 252 were empty. Always count how many pages came back
under 50 characters.

    python tools/ocr-embedded-images.py <in.pdf> <out.txt> [--limit N]

Writes one "======== IMAGE n (pages a, b) ========" block per unique image, so
a later extractor can map text back to pages. Skips an image it has already
seen, which is what makes 354 pages cost 178 OCR runs rather than 354.
"""
import os
import subprocess
import sys
import tempfile

TESS = os.environ.get("TESSERACT_EXE", r"C:\Program Files\Tesseract-OCR\tesseract.exe")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2:
        sys.exit(__doc__)
    src, dst = args[0], args[1]
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])

    if not os.path.exists(TESS):
        sys.exit("  tesseract not found at %s (set TESSERACT_EXE)" % TESS)

    import pymupdf
    doc = pymupdf.open(src)

    # image xref -> the 1-based pages that show it
    pages_of = {}
    order = []
    for i in range(doc.page_count):
        imgs = doc[i].get_images(full=True)
        if not imgs:
            continue
        x = imgs[0][0]
        if x not in pages_of:
            pages_of[x] = []
            order.append(x)
        pages_of[x].append(i + 1)

    if limit:
        order = order[:limit]
    print("  %s: %d pages, %d unique image(s) to OCR"
          % (os.path.basename(src), doc.page_count, len(order)))

    out = []
    empty = 0
    tmp = tempfile.mkdtemp(prefix="ocrimg-")
    for n, x in enumerate(order, 1):
        info = doc.extract_image(x)
        img = os.path.join(tmp, "i.%s" % info["ext"])
        with open(img, "wb") as f:
            f.write(info["image"])
        base = os.path.join(tmp, "i")
        subprocess.run([TESS, img, base, "--psm", "1"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        txt = ""
        if os.path.exists(base + ".txt"):
            with open(base + ".txt", encoding="utf-8", errors="replace") as f:
                txt = f.read()
            os.remove(base + ".txt")
        if len(txt.strip()) < 50:
            empty += 1
        out.append("======== IMAGE %d (pages %s) ========\n%s"
                   % (n, ", ".join(map(str, pages_of[x])), txt.strip()))
        if n % 20 == 0:
            print("    %d/%d ... %d empty so far" % (n, len(order), empty))

    with open(dst, "w", encoding="utf-8") as f:
        f.write("\n\n".join(out))

    total = sum(len(b) for b in out)
    print("  wrote %s" % dst)
    print("  %d image(s), %d returned under 50 chars (%.0f%%), %d chars total"
          % (len(order), empty, 100.0 * empty / max(len(order), 1), total))
    print("  verdict: %s" % ("USABLE" if empty * 4 < len(order) else "STILL FAILING"))


if __name__ == "__main__":
    main()
