
  /* ---- shared by the new Shape and Measures slides (2026-09-11 validation: 4Gg.02 and 4Gg.03 shared one step; name local people) ---- */
  const NH_WHO = [["Musa", "he"], ["Amina", "she"], ["Hodan", "she"], ["Omar", "he"], ["Leila", "she"], ["Yusuf", "he"]];
  const NH_C = 26, NH_P = 30;
  const nhGrid = (cols, rows) => {
    let g = "";
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++)
      g += '<rect class="cell" x="' + (NH_P + x * NH_C) + '" y="' + (NH_P + y * NH_C) + '" width="' + NH_C + '" height="' + NH_C + '"></rect>';
    return g;
  };
  const nhFill = (cls, x0, y0, w, h) => {
    let g = "";
    for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++)
      g += '<rect class="' + cls + '" x="' + (NH_P + x * NH_C) + '" y="' + (NH_P + y * NH_C) + '" width="' + NH_C + '" height="' + NH_C + '"></rect>';
    return g;
  };
  const nhLab = (x, y, t) => '<text class="compass" x="' + x + '" y="' + y + '">' + t + "</text>";

  /* ---- 1: perimeter, all the way round (4Gg.02 measure perimeter; 4Gg.03 the formula for a rectangle) ---- */
  let nh1 = null, nh1right = 0, nh1asked = 0, nh1lock = false;
  function nhNew1() {
    let w, h;
    do { w = rnd(3, 8); h = rnd(2, 5); } while (w * h === 2 * (w + h) || w * h === w + h);
    const who = NH_WHO[rnd(0, NH_WHO.length - 1)];
    const q = [
      who[0] + " puts a fence all the way round a garden " + w + " metres long and " + h + " metres wide. How many metres of fence does " + who[1] + " need?",
      who[0] + " walks all the way round the edge of a field " + w + " metres long and " + h + " metres wide. How far does " + who[1] + " walk?",
      who[0] + " sticks ribbon all the way round a card " + w + " centimetres long and " + h + " centimetres wide. How much ribbon does " + who[1] + " use?",
    ][rnd(0, 2)];
    const unit = /centimetres/.test(q) ? "cm" : "m";
    const opts = shuffle([2 * (w + h), w * h, w + h]);
    return { w: w, h: h, q: q, unit: unit, opts: opts };
  }
  function nhPaint1() {
    const w = nh1.w, h = nh1.h;
    let g = nhGrid(9, 6) + nhFill("fillA", 0, 0, w, h);
    g += nhLab(NH_P + w * NH_C / 2, NH_P - 10, w + " " + nh1.unit) + nhLab(NH_P + w * NH_C + 22, NH_P + h * NH_C / 2 + 4, h + " " + nh1.unit);
    $("nhpic1").innerHTML = g;
    $("nhq1").textContent = nh1.q;
    $("nhpick1").innerHTML = nh1.opts.map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + " " + nh1.unit + "</button>").join("");
    $("nhwork1").innerHTML = "";
    $("nhfb1").textContent = ""; $("nhfb1").className = "fb";
    $("nhtask1").textContent = "Answered " + nh1asked + " · " + nh1right + " right";
  }
  $("nhpick1").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || nh1lock) return;
    nh1lock = true; nh1asked++;
    const w = nh1.w, h = nh1.h, p = 2 * (w + h), ok = Number(b.dataset.v) === p;
    if (ok) nh1right++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("nhwork1"), [
      { k: "All the way round", v: w + " + " + h + " + " + w + " + " + h },
      { k: "The short way", v: "2 × (" + w + " + " + h + ") = <b>" + p + " " + nh1.unit + "</b>", total: true },
      { k: "Not", v: w + " × " + h + " = " + w * h + ", which is the area inside" },
    ]);
    $("nhfb1").textContent = (ok ? cheer() + " " : "It is " + p + " " + nh1.unit + ". ") + "All the way round is " + w + " add " + h + " add " + w + " add " + h +
      ", which is " + p + ". " + w + " times " + h + " is the area inside, not the distance round.";
    $("nhfb1").className = "fb " + (ok ? "good" : "bad");
    say($("nhfb1").textContent);
    if (nh1right >= 4) finish(0, "You can find the perimeter!");
    setTimeout(() => { nh1 = nhNew1(); nh1lock = false; nhPaint1(); }, 3000);
  });
  nh1 = nhNew1(); nhPaint1();

  /* ---- 2: the area of a compound shape, two rectangles added (4Gg.02) ---- */
  let nh2 = null, nh2right = 0, nh2asked = 0, nh2lock = false;
  function nhNew2() {
    const a = rnd(4, 7), b = rnd(2, 4), c = rnd(1, a - 2), d = rnd(1, 3);
    const who = NH_WHO[rnd(0, NH_WHO.length - 1)];
    const tot = a * b + c * d;
    return { a: a, b: b, c: c, d: d, who: who[0], tot: tot, opts: shuffle([tot, a * (b + d), a * b]) };
  }
  function nhPaint2() {
    const s = nh2;
    let g = nhGrid(9, 7) + nhFill("fillA", 0, 0, s.a, s.b) + nhFill("fillB", 0, s.b, s.c, s.d);
    g += nhLab(NH_P + s.a * NH_C / 2, NH_P - 10, s.a) + nhLab(NH_P + s.a * NH_C + 12, NH_P + s.b * NH_C / 2 + 4, s.b);
    g += nhLab(NH_P + s.c * NH_C / 2, NH_P + (s.b + s.d) * NH_C + 16, s.c) + nhLab(NH_P + s.c * NH_C + 12, NH_P + (s.b + s.d / 2) * NH_C + 4, s.d);
    $("nhpic2").innerHTML = g;
    $("nhq2").textContent = s.who + "'s vegetable garden is an L shape, made of a " + s.a + " by " + s.b + " rectangle and a " + s.c + " by " + s.d +
      " rectangle. How many squares does it cover?";
    $("nhpick2").innerHTML = s.opts.map((o) => '<button type="button" class="choice" data-v="' + o + '">' + o + " squares</button>").join("");
    $("nhwork2").innerHTML = "";
    $("nhfb2").textContent = ""; $("nhfb2").className = "fb";
    $("nhtask2").textContent = "Answered " + nh2asked + " · " + nh2right + " right";
  }
  $("nhpick2").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || nh2lock) return;
    nh2lock = true; nh2asked++;
    const s = nh2, ok = Number(b.dataset.v) === s.tot;
    if (ok) nh2right++;
    b.classList.add(ok ? "right" : "wrong");
    lines($("nhwork2"), [
      { k: "The big one", v: s.a + " × " + s.b + " = <b>" + s.a * s.b + "</b>" },
      { k: "The small one", v: s.c + " × " + s.d + " = <b>" + s.c * s.d + "</b>" },
      { k: "Add the areas", v: s.a * s.b + " + " + s.c * s.d + " = <b>" + s.tot + "</b> squares", total: true },
    ]);
    $("nhfb2").textContent = (ok ? cheer() + " " : "It is " + s.tot + " squares. ") + "The big rectangle is " + s.a + " times " + s.b + ", which is " + s.a * s.b +
      ", and the small one is " + s.c + " times " + s.d + ", which is " + s.c * s.d + ". Added together that is " + s.tot + ".";
    $("nhfb2").className = "fb " + (ok ? "good" : "bad");
    say($("nhfb2").textContent);
    if (nh2right >= 4) finish(1, "You can find the area of an L shape!");
    setTimeout(() => { nh2 = nhNew2(); nh2lock = false; nhPaint2(); }, 3200);
  });
  nh2 = nhNew2(); nhPaint2();
