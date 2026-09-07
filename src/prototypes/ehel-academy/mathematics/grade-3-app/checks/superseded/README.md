# Superseded checkers

`check-sides-sizes-seconds.mjs` tested the lesson that the 2026-09-07 split
divided into Shapes and Symmetry, Measure It, and Time and Direction. It is kept
because its assertions are the only ones that recompute the geometry, unit
conversion and time-interval maths independently of what the page claims — the
kind that caught real defects — and re-deriving them from scratch would be worse
than porting them.

**It does not run.** The file it opens no longer exists. It was not split
automatically because it uses a different section-comment style from the other
checkers and two of its `go()` calls take a variable rather than a literal (the
whole-deck loop, and the UNITS table), so an automatic split would have either
dropped its measure assertions or retargeted them at the wrong slides without
saying so.

Until it is ported by hand, units 5–7 are covered by `../check-runtime.mjs`,
which walks every slide, exercises the check step and catches runtime errors,
but answers with the page's own `dataset.right` and so does **not** verify that
the maths is right. That gap is real and is the reason this file is kept rather
than deleted.
