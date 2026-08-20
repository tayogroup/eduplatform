#!/usr/bin/env node

// Generates the vector illustrations for the Musa picture-book series:
//   - Musa's Muddy Stripes        (book 1)
//   - Musa Helps a Friend         (book 2, sequel)
// One shared character/scenery kit keeps the cast identical across books.
// Every page carries subtle ambient CSS animation (rain, ripples, tails,
// blinks, swaying grass); all motion is disabled automatically for
// prefers-reduced-motion users.
// Usage: node tools/create-musa-ebook-illustrations.js [muddy-stripes|helps-a-friend|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

// The palette, animation stylesheet, cast and scenery all live in the shared
// kit — the Grade 2 books draw the same storyworld from the same paths.
const {
  C, STYLE, W, H,
  delayAt, face, mouth, mudSpots,
  zebra, giraffe, elephant, ostrich, monkey, kiki, donkey, hen, goat, chick, wildBird, lulu,
  river, lake, sailboat, fish, bigLeaf, cityBuildings, marketStall, lampPost, clockTower, nest,
  sky, sun, hills, ground, tallGrass, acacia, puddle, fallenBranch, nightScene,
  chalkboard, bench, schoolBell, baobabHome, swing, kite, playBall, cookpot, mango, thoughtBubble,
  barn, fence, haystack, seedRow, scarecrow, carrot, bigFlower, raceBanner,
  dustPuffs, confetti, rain, splashArcs, waterSpray, sunnyPatch, rainbow, vine,
  basicScene, writeBooks,
} = require("./lib/ehel-ebook-kit.js");


// ---------------------------------------------------------------- book 1: Musa's Muddy Stripes

const muddyStripesPages = [
  `${basicScene()}${acacia(210, 640, 1.1)}${acacia(1430, 620, 0.9)}
   ${puddle(800, 880, 280, 62)}
   ${giraffe({ x: 380, y: 640, s: 1.02 })}
   ${elephant({ x: 1220, y: 700, s: 0.98, flip: true })}
   ${ostrich({ x: 1040, y: 650, s: 0.9, flip: true })}
   ${monkey({ x: 540, y: 740, s: 0.95 })}
   ${zebra({ x: 800, y: 670, s: 1.12 })}`,

  `${basicScene()}${acacia(1380, 640, 1.05)}
   ${tallGrass(220, 900, 1.4)}${tallGrass(1240, 940, 1.5)}${tallGrass(1420, 860, 1.1)}
   ${zebra({ x: 720, y: 690, s: 1.2, pose: "run" })}
   <g stroke="${C.grassDark}" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.7"><path d="M 430 800 q -50 -8 -80 10"/><path d="M 1030 810 q 50 -10 84 6"/></g>`,

  `${basicScene()}${acacia(200, 630, 1)}
   ${giraffe({ x: 430, y: 630, s: 0.98, pose: "run" })}
   ${zebra({ x: 1050, y: 690, s: 1.12, pose: "run" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 780 760 q -40 -12 -70 6"/><path d="M 690 800 q -36 -8 -62 8"/></g>`,

  `${basicScene()}${acacia(1420, 630, 1)}
   ${elephant({ x: 420, y: 710, s: 1, trunkUp: true, pose: "run" })}
   ${zebra({ x: 1080, y: 690, s: 1.12, pose: "run" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 760 780 q -40 -12 -70 6"/><path d="M 680 820 q -36 -8 -62 8"/></g>`,

  `${basicScene()}${acacia(240, 640, 1.05)}${tallGrass(1400, 900, 1.3)}
   ${ostrich({ x: 560, y: 660, s: 0.95, pose: "run" })}
   ${zebra({ x: 1020, y: 690, s: 1.12, pose: "run" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 330 800 q -40 -12 -70 6"/><path d="M 760 800 q -36 -10 -64 6"/></g>`,

  `${basicScene()}${acacia(1400, 640, 1)}
   ${fallenBranch(800, 900, 1.15)}
   ${zebra({ x: 790, y: 560, s: 1.15, pose: "leap" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.7"><path d="M 520 700 q -46 -8 -80 10"/><path d="M 470 750 q -40 -6 -70 10"/></g>`,

  `${basicScene()}${acacia(220, 630, 1)}
   ${puddle(900, 870, 330, 76)}
   ${splashArcs(900, 850)}
   ${zebra({ x: 900, y: 750, s: 1.1, mood: "surprised", sunk: true })}`,

  `${basicScene()}${acacia(1410, 640, 1)}
   ${puddle(1030, 890, 280, 62)}
   ${zebra({ x: 620, y: 700, s: 1.12, mood: "sad", heavyMud: true })}
   ${mudSpots([[420, 870, 22], [820, 930, 18]])}`,

  `${basicScene()}${acacia(240, 640, 1.05)}
   ${puddle(1240, 900, 200, 48)}
   ${zebra({ x: 850, y: 700, s: 1.1, mood: "sad", heavyMud: true, flip: true })}
   ${monkey({ x: 430, y: 750, s: 1, arms: "up", leaves: true })}
   <g class="anim-splash" stroke="${C.leaf}" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 560 620 q 30 -20 60 -14"/><path d="M 560 660 q 34 -8 64 2"/></g>`,

  `${basicScene()}${acacia(1420, 630, 0.95)}
   ${puddle(760, 910, 220, 50, 0)}
   ${elephant({ x: 380, y: 710, s: 1.05, trunkUp: true })}
   ${waterSpray(500, 540, 900, 560)}
   ${zebra({ x: 980, y: 700, s: 1.1, mood: "surprised", muddy: true, flip: true })}
   <g stroke="${C.water}" stroke-width="7" fill="none" stroke-linecap="round"><path d="M 880 760 q -14 30 -34 40"/><path d="M 1100 750 q 14 32 32 44"/></g>`,

  `${basicScene()}${sunnyPatch(1180, 840)}${acacia(180, 630, 1)}
   ${ostrich({ x: 480, y: 660, s: 0.95, fanning: true })}
   ${zebra({ x: 880, y: 690, s: 1.08 })}
   ${giraffe({ x: 1330, y: 620, s: 0.95, flip: true })}`,

  `${basicScene()}${rainbow(800, 560)}${acacia(180, 640, 1)}${acacia(1440, 630, 0.9)}
   ${puddle(800, 890, 280, 62, 0)}
   ${zebra({ x: 780, y: 680, s: 1.1 })}
   ${elephant({ x: 1120, y: 700, s: 0.95, flip: true, trunkUp: true })}
   ${giraffe({ x: 360, y: 620, s: 0.92 })}
   ${ostrich({ x: 1330, y: 650, s: 0.85, flip: true })}
   ${monkey({ x: 540, y: 770, s: 0.9, arms: "up" })}
   <g class="anim-splash" stroke="${C.water}" stroke-width="7" fill="none" stroke-linecap="round"><path d="M 600 840 q -24 -36 -58 -44"/><path d="M 1000 850 q 26 -38 60 -46"/></g>`,
];

// ---------------------------------------------------------------- book 2: Musa Helps a Friend

const helpsAFriendPages = [
  `${basicScene()}${acacia(210, 640, 1.1)}${acacia(1430, 620, 0.9)}
   ${puddle(800, 870, 300, 66)}
   ${giraffe({ x: 400, y: 640, s: 1.05 })}
   ${elephant({ x: 1210, y: 700, s: 1, flip: true, trunkUp: true })}
   ${ostrich({ x: 1050, y: 650, s: 0.92, flip: true })}
   ${monkey({ x: 560, y: 740, s: 0.95, arms: "up" })}
   ${zebra({ x: 800, y: 680, s: 1.1 })}`,

  `${basicScene(true)}
   <g class="anim-cloud"><circle cx="1330" cy="150" r="62" fill="#f4f0e2" opacity="0.85"/><circle cx="1306" cy="138" r="52" fill="${C.rainTop}"/></g>
   ${acacia(280, 650, 1.15)}${acacia(1330, 630, 0.95)}
   ${puddle(520, 850, 200, 48)}${puddle(1080, 900, 240, 54)}${puddle(820, 760, 120, 30)}
   ${rain()}`,

  `${basicScene()}${acacia(1380, 640, 1.05)}
   ${puddle(560, 900, 210, 50)}
   ${zebra({ x: 620, y: 700, s: 1.15, pose: "run" })}
   <g class="anim-splash" stroke="${C.water}" stroke-width="8" fill="none" stroke-linecap="round"><path d="M 430 860 q -30 -40 -70 -50"/><path d="M 700 870 q 30 -44 66 -56"/></g>`,

  `${basicScene()}${acacia(260, 640, 1.1)}
   ${zebra({ x: 560, y: 690, s: 1.15, mood: "surprised" })}
   <g stroke="#7d97ad" stroke-width="8" fill="none" stroke-linecap="round">
     <path class="anim-wave" style="animation-delay:0s" d="M 1160 420 q 30 -30 0 -60"/>
     <path class="anim-wave" style="animation-delay:0.4s" d="M 1210 440 q 46 -46 0 -92"/>
     <path class="anim-wave" style="animation-delay:0.8s" d="M 1260 460 q 62 -62 0 -124"/>
   </g>
   <path d="M 1000 620 q 60 -20 120 0 q -20 60 -60 60 q -40 0 -60 -60 z" fill="${C.grassDark}" opacity="0.6"/>`,

  `${basicScene()}${acacia(220, 630, 1.05)}
   ${puddle(980, 850, 340, 80)}
   ${elephant({ x: 980, y: 760, s: 1.05, stuck: true, mood: "sad" })}
   ${mudSpots([[760, 800, 24], [1220, 810, 20], [980, 900, 26]])}`,

  `${basicScene()}${acacia(1400, 640, 1)}
   ${puddle(1000, 860, 320, 74)}
   ${elephant({ x: 1030, y: 780, s: 1, stuck: true, mood: "sad" })}
   ${zebra({ x: 520, y: 700, s: 1.1 })}
   <g class="anim-float" fill="#e76f51" opacity="0.9"><path d="M 700 400 c -8 -14 -28 -9 -28 5 c 0 12 15 20 28 29 c 13 -9 28 -17 28 -29 c 0 -14 -20 -19 -28 -5 z"/></g>`,

  `${basicScene()}${acacia(200, 640, 1.05)}
   ${zebra({ x: 430, y: 690, s: 1.02, mood: "surprised" })}
   ${giraffe({ x: 900, y: 620, s: 0.98, flip: true })}
   ${ostrich({ x: 1180, y: 660, s: 0.9, flip: true, pose: "run" })}
   ${monkey({ x: 1400, y: 780, s: 0.9, flip: true, arms: "up" })}`,

  `${basicScene()}${acacia(1410, 630, 1)}
   ${puddle(1060, 860, 300, 70)}
   ${elephant({ x: 1090, y: 780, s: 1, stuck: true, mood: "surprised", trunkUp: true })}
   ${vine("M 420 700 q 200 -90 420 -40 q 140 30 220 -10")}
   ${monkey({ x: 400, y: 700, s: 0.95, arms: "up" })}`,

  `${basicScene()}${acacia(180, 630, 1)}
   ${puddle(1180, 870, 280, 66)}
   ${elephant({ x: 1200, y: 790, s: 0.98, stuck: true, mood: "surprised", trunkUp: true })}
   ${vine("M 340 680 q 240 -60 520 -20 q 160 20 260 -30", 12, true)}
   ${zebra({ x: 760, y: 700, s: 1, pull: true, flip: true })}
   ${giraffe({ x: 480, y: 630, s: 0.95, flip: true })}
   ${ostrich({ x: 300, y: 680, s: 0.85, flip: true, pose: "run" })}
   ${monkey({ x: 940, y: 760, s: 0.85, arms: "up", mood: "surprised" })}`,

  `${basicScene()}${acacia(1420, 640, 0.95)}
   ${puddle(1080, 890, 300, 66)}
   ${splashArcs(1080, 890)}
   ${elephant({ x: 830, y: 640, s: 1.02, flip: true, mood: "surprised", trunkUp: true, muddy: true })}
   ${zebra({ x: 460, y: 700, s: 1, mood: "surprised", muddy: true })}
   ${monkey({ x: 1330, y: 780, s: 0.88, arms: "up", mood: "surprised" })}`,

  `${basicScene()}${acacia(230, 640, 1)}
   ${puddle(820, 900, 240, 54)}
   ${zebra({ x: 620, y: 690, s: 1.05, muddy: true })}
   ${elephant({ x: 1120, y: 700, s: 0.95, flip: true, muddy: true, trunkUp: true })}
   ${giraffe({ x: 320, y: 620, s: 0.92 })}
   ${ostrich({ x: 900, y: 640, s: 0.85, flip: true })}
   ${monkey({ x: 1400, y: 780, s: 0.9, flip: true, arms: "up" })}
   ${mudSpots([[350, 560, 12], [980, 520, 12], [1240, 600, 10]])}`,

  `${basicScene()}${rainbow(800, 560)}${acacia(180, 640, 1)}${acacia(1440, 630, 0.9)}
   ${puddle(800, 890, 280, 62, 0)}
   ${zebra({ x: 660, y: 690, s: 1.05 })}
   ${elephant({ x: 1000, y: 700, s: 0.95, flip: true, trunkUp: true })}
   ${giraffe({ x: 380, y: 620, s: 0.92 })}
   ${ostrich({ x: 1240, y: 650, s: 0.85, flip: true })}
   ${monkey({ x: 820, y: 770, s: 0.85, arms: "up" })}
   <g class="anim-splash" stroke="${C.water}" stroke-width="7" fill="none" stroke-linecap="round"><path d="M 600 840 q -24 -36 -58 -44"/><path d="M 1010 850 q 26 -38 60 -46"/></g>`,
];

// ---------------------------------------------------------------- book 3: Musa's Big Race

const bigRacePages = [
  // 1 cover: everyone at the race banner
  `${basicScene()}${acacia(180, 640, 1)}${acacia(1450, 630, 0.9)}
   ${raceBanner(800, 560, 1.1)}
   ${giraffe({ x: 360, y: 640, s: 0.98 })}
   ${elephant({ x: 1200, y: 700, s: 0.96, flip: true, trunkUp: true })}
   ${ostrich({ x: 1030, y: 650, s: 0.9, flip: true })}
   ${monkey({ x: 540, y: 750, s: 0.92, arms: "up" })}
   ${zebra({ x: 790, y: 690, s: 1.1 })}`,

  // 2 race day: friends line up
  `${basicScene()}${acacia(1440, 630, 0.9)}
   ${raceBanner(430, 570, 0.9)}
   ${zebra({ x: 340, y: 700, s: 0.95 })}
   ${giraffe({ x: 620, y: 650, s: 0.9 })}
   ${elephant({ x: 900, y: 720, s: 0.9 })}
   ${ostrich({ x: 1130, y: 680, s: 0.85 })}
   ${monkey({ x: 1380, y: 770, s: 0.9, flip: true })}`,

  // 3 ready steady go
  `${basicScene()}${acacia(220, 630, 1)}
   ${monkey({ x: 350, y: 730, s: 1.05, arms: "up", mood: "surprised" })}
   ${zebra({ x: 700, y: 700, s: 0.98, pose: "run" })}
   ${ostrich({ x: 1000, y: 660, s: 0.86, pose: "run" })}
   ${elephant({ x: 1280, y: 720, s: 0.86, pose: "run" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 520 810 q -40 -12 -70 6"/><path d="M 850 820 q -36 -10 -64 6"/></g>`,

  // 4 Musa in front
  `${basicScene()}${acacia(1400, 640, 1)}${tallGrass(1280, 930, 1.3)}
   ${zebra({ x: 1000, y: 680, s: 1.18, pose: "run" })}
   ${ostrich({ x: 420, y: 690, s: 0.7, pose: "run" })}
   ${giraffe({ x: 220, y: 660, s: 0.68, pose: "run" })}
   ${elephant({ x: 590, y: 740, s: 0.66, pose: "run" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 760 790 q -40 -12 -70 6"/><path d="M 700 830 q -36 -8 -62 8"/></g>`,

  // 5 past the big acacia
  `${basicScene()}${acacia(400, 620, 1.5)}${tallGrass(180, 920, 1.4)}
   ${zebra({ x: 950, y: 690, s: 1.15, pose: "run" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 700 800 q -46 -8 -80 10"/></g>`,

  // 6 the leap (series motif)
  `${basicScene()}${acacia(210, 640, 0.95)}
   ${fallenBranch(870, 900, 1.1)}
   ${zebra({ x: 860, y: 560, s: 1.15, pose: "leap" })}
   ${tallGrass(1400, 920, 1.2)}`,

  // 7 BUMP! the little elephant trips
  `${basicScene()}${acacia(1420, 630, 0.95)}
   ${dustPuffs(760, 830)}
   ${elephant({ x: 760, y: 770, s: 1.05, stuck: true, mood: "sad" })}
   ${ostrich({ x: 1350, y: 660, s: 0.7, flip: false, pose: "run" })}`,

  // 8 Musa stops: the finish line is so close
  `${basicScene()}${raceBanner(1330, 580, 0.85)}${acacia(180, 630, 0.95)}
   ${zebra({ x: 820, y: 690, s: 1.12, flip: true, mood: "surprised" })}
   ${elephant({ x: 300, y: 790, s: 0.62, stuck: true, mood: "sad" })}`,

  // 9 Musa runs back to his friend
  `${basicScene()}${acacia(1430, 640, 0.95)}
   ${elephant({ x: 950, y: 770, s: 1, stuck: true, mood: "sad" })}
   ${zebra({ x: 480, y: 700, s: 1.08, pose: "run" })}
   <g class="anim-float" fill="#e76f51" opacity="0.9"><path d="M 700 400 c -8 -14 -28 -9 -28 5 c 0 12 15 20 28 29 c 13 -9 28 -17 28 -29 c 0 -14 -20 -19 -28 -5 z"/></g>`,

  // 10 running the last part together
  `${basicScene()}${raceBanner(1350, 570, 0.8)}${acacia(200, 630, 0.95)}
   ${zebra({ x: 640, y: 690, s: 1.05, pose: "run" })}
   ${elephant({ x: 1000, y: 710, s: 0.95, pose: "run", trunkUp: true })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 430 800 q -40 -12 -70 6"/><path d="M 810 820 q -36 -8 -62 8"/></g>`,

  // 11 the ostrich wins; everyone cheers
  `${basicScene()}${raceBanner(800, 560, 1.05)}${confetti(800, 420)}
   ${ostrich({ x: 800, y: 650, s: 1 })}
   ${monkey({ x: 470, y: 760, s: 0.95, arms: "up" })}
   ${giraffe({ x: 250, y: 630, s: 0.88 })}
   ${zebra({ x: 1120, y: 700, s: 0.95, flip: true })}
   ${elephant({ x: 1420, y: 730, s: 0.85, flip: true, trunkUp: true })}`,

  // 12 a real winner (trilogy rainbow ending)
  `${basicScene()}${rainbow(800, 560)}${acacia(180, 640, 1)}${acacia(1440, 630, 0.9)}
   ${zebra({ x: 700, y: 690, s: 1.08 })}
   ${elephant({ x: 1020, y: 710, s: 0.95, flip: true, trunkUp: true })}
   ${giraffe({ x: 360, y: 620, s: 0.9 })}
   ${ostrich({ x: 1260, y: 650, s: 0.85, flip: true })}
   ${monkey({ x: 850, y: 780, s: 0.85, arms: "up" })}`,
];

// ---------------------------------------------------------------- Kiki series (Term 1)
// Book 1: Kiki Goes to School

const kikiSchoolPages = [
  // 1 cover: the tree school
  `${basicScene()}${acacia(1150, 600, 1.35)}
   ${chalkboard(1130, 830, 1)}${schoolBell(360, 840, 1)}
   ${giraffe({ x: 620, y: 630, s: 0.9, glasses: true })}
   ${elephant({ x: 1420, y: 760, s: 0.6 })}
   ${ostrich({ x: 880, y: 740, s: 0.55 })}
   ${kiki({ x: 470, y: 800, s: 1.25, backpack: true, arms: "up" })}`,

  // 2 first day: leaving home with the new red bag
  `${basicScene()}${baobabHome(320, 900, 0.9)}
   ${monkey({ x: 210, y: 760, s: 0.95, flower: true, arms: "up" })}
   ${monkey({ x: 420, y: 750, s: 1.1, shade: "#77836f", arms: "up" })}
   ${kiki({ x: 900, y: 800, s: 1.2, backpack: true })}
   ${tallGrass(1360, 930, 1.3)}`,

  // 3 Musa cameo on the path
  `${basicScene()}${acacia(1420, 630, 0.95)}
   ${zebra({ x: 1000, y: 690, s: 1.05 })}
   ${kiki({ x: 480, y: 800, s: 1.2, backpack: true, flip: true, arms: "up" })}`,

  // 4 the school looks big; Kiki feels shy
  `${basicScene()}${acacia(1050, 590, 1.5)}
   ${chalkboard(1040, 840, 1.1)}${schoolBell(1420, 840, 1)}${bench(760, 900, 1)}
   ${kiki({ x: 280, y: 810, s: 1.15, backpack: true, mood: "sad" })}`,

  // 5 Miss Twiga says welcome
  `${basicScene()}${acacia(240, 630, 1)}
   ${giraffe({ x: 850, y: 620, s: 1.05, glasses: true, bend: true })}
   ${kiki({ x: 1250, y: 800, s: 1.2, backpack: true, arms: "up" })}`,

  // 6 sitting next to the little elephant
  `${basicScene()}${acacia(1400, 620, 1.1)}${chalkboard(1380, 850, 0.9)}
   ${elephant({ x: 900, y: 720, s: 0.8 })}
   ${kiki({ x: 560, y: 790, s: 1.15 })}
   ${bench(720, 900, 1.5)}`,

  // 7 learning hello
  `${basicScene()}${chalkboard(400, 800, 1.3)}
   ${giraffe({ x: 800, y: 620, s: 0.85, glasses: true })}
   ${kiki({ x: 1100, y: 800, s: 1.1, arms: "up" })}
   ${elephant({ x: 1380, y: 760, s: 0.62, trunkUp: true })}`,

  // 8 counting one two three
  `${basicScene()}${chalkboard(400, 800, 1.3, "dots")}
   ${giraffe({ x: 800, y: 620, s: 0.85, glasses: true })}
   ${kiki({ x: 1080, y: 800, s: 1.1, arms: "up" })}
   ${ostrich({ x: 1360, y: 740, s: 0.6 })}`,

  // 9 sharing the mango
  `${basicScene()}${acacia(220, 630, 1)}
   ${kiki({ x: 660, y: 800, s: 1.15 })}
   ${elephant({ x: 1020, y: 740, s: 0.75, trunkUp: true })}
   ${mango(830, 830, 1.4)}${mango(880, 850, 1.1)}`,

  // 10 a new friend
  `${basicScene()}${acacia(1420, 630, 0.95)}${tallGrass(200, 920, 1.3)}
   ${kiki({ x: 620, y: 800, s: 1.15, arms: "up" })}
   ${ostrich({ x: 950, y: 720, s: 0.72, pose: "run" })}`,

  // 11 the bell rings
  `${basicScene()}${schoolBell(800, 840, 1.4)}${acacia(1350, 630, 1)}
   ${giraffe({ x: 320, y: 630, s: 0.85, glasses: true })}
   ${kiki({ x: 1080, y: 800, s: 1.15, backpack: true, arms: "up" })}
   ${elephant({ x: 1370, y: 770, s: 0.6 })}`,

  // 12 telling the family at night
  `${nightScene()}${baobabHome(1150, 900, 1, { lit: true })}
   ${monkey({ x: 420, y: 760, s: 0.95, flower: true })}
   ${monkey({ x: 640, y: 750, s: 1.1, shade: "#77836f" })}
   ${kiki({ x: 850, y: 800, s: 1.2, arms: "up" })}
   ${kiki({ x: 260, y: 830, s: 0.62 })}`,
];

// Book 2: Kiki's Family Day

const kikiFamilyPages = [
  // 1 cover: the family at the baobab
  `${basicScene()}${baobabHome(1100, 900, 1.05)}
   ${monkey({ x: 340, y: 750, s: 0.98, flower: true })}
   ${monkey({ x: 560, y: 740, s: 1.15, shade: "#77836f" })}
   ${kiki({ x: 760, y: 800, s: 1.2, arms: "up" })}
   ${kiki({ x: 420, y: 840, s: 0.62 })}`,

  // 2 the baobab home
  `${basicScene()}${baobabHome(800, 910, 1.25)}${tallGrass(220, 930, 1.4)}${tallGrass(1400, 940, 1.3)}`,

  // 3 Mama, Papa and little Nia
  `${basicScene()}${baobabHome(240, 890, 0.8)}
   ${monkey({ x: 620, y: 750, s: 1, flower: true })}
   ${monkey({ x: 900, y: 740, s: 1.18, shade: "#77836f" })}
   ${kiki({ x: 1160, y: 830, s: 0.62 })}
   ${kiki({ x: 1360, y: 790, s: 1.15, arms: "up" })}`,

  // 4 helping Mama cook
  `${basicScene()}${baobabHome(1350, 890, 0.8)}
   ${cookpot(780, 870, 1.3)}
   ${monkey({ x: 480, y: 750, s: 1, flower: true })}
   ${kiki({ x: 1050, y: 810, s: 1.15, arms: "up" })}`,

  // 5 helping Papa with mangoes
  `${basicScene()}${acacia(1150, 620, 1.3)}
   ${mango(1050, 470, 1)}${mango(1180, 440, 1)}${mango(1280, 490, 1)}
   ${monkey({ x: 880, y: 740, s: 1.18, shade: "#77836f", arms: "up" })}
   ${kiki({ x: 480, y: 810, s: 1.15 })}
   ${mango(560, 860, 1.2)}${mango(610, 880, 1)}`,

  // 6 Nia drops her banana
  `${basicScene()}${baobabHome(280, 890, 0.85)}
   ${kiki({ x: 850, y: 830, s: 0.72, mood: "sad" })}
   <path d="M 940 900 q 30 -26 64 -10 q -8 26 -40 26 q -18 0 -24 -16 z" fill="#f4d35e" stroke="${C.ink}" stroke-width="3.4"/>
   ${kiki({ x: 1250, y: 790, s: 1.15, mood: "surprised", flip: true })}`,

  // 7 Kiki shares hers (series kindness motif)
  `${basicScene()}${acacia(1420, 630, 0.95)}
   ${kiki({ x: 700, y: 800, s: 1.15, arms: "up" })}
   ${kiki({ x: 1000, y: 840, s: 0.72 })}
   <path d="M 850 760 q 30 -26 64 -10 q -8 26 -40 26 q -18 0 -24 -16 z" fill="#f4d35e" stroke="${C.ink}" stroke-width="3.4"/>
   <g class="anim-float" fill="#e76f51" opacity="0.9"><path d="M 860 520 c -8 -14 -28 -9 -28 5 c 0 12 15 20 28 29 c 13 -9 28 -17 28 -29 c 0 -14 -20 -19 -28 -5 z"/></g>`,

  // 8 dinner together
  `${basicScene()}${baobabHome(1350, 890, 0.8)}
   ${cookpot(800, 880, 1.2)}
   ${monkey({ x: 430, y: 760, s: 0.95, flower: true })}
   ${monkey({ x: 620, y: 750, s: 1.12, shade: "#77836f" })}
   ${kiki({ x: 1010, y: 810, s: 1.1 })}
   ${kiki({ x: 1160, y: 850, s: 0.6 })}
   ${mango(900, 920, 1.1)}${mango(700, 940, 1)}`,

  // 9 Papa's story about a brave zebra
  `${nightScene()}${baobabHome(280, 890, 0.85, { lit: true })}
   ${monkey({ x: 640, y: 760, s: 1.15, shade: "#77836f", arms: "up" })}
   ${kiki({ x: 900, y: 820, s: 1.1 })}
   ${kiki({ x: 1040, y: 850, s: 0.6 })}
   ${thoughtBubble(1180, 380, 1, zebra({ x: 30, y: 30, s: 0.34, pose: "run" }))}`,

  // 10 Mama's soft song
  `${nightScene()}${baobabHome(1280, 890, 0.85, { lit: true })}
   ${monkey({ x: 620, y: 750, s: 1, flower: true })}
   ${kiki({ x: 900, y: 830, s: 1.1 })}
   ${kiki({ x: 1030, y: 860, s: 0.6 })}
   <g fill="#f6f0d8"><g class="anim-float" style="animation-delay:0s"><circle cx="700" cy="520" r="9"/><rect x="706" y="470" width="5" height="52" rx="2.5"/></g><g class="anim-float" style="animation-delay:0.9s"><circle cx="790" cy="470" r="9"/><rect x="796" y="420" width="5" height="52" rx="2.5"/></g></g>`,

  // 11 goodnight hugs
  `${nightScene()}${baobabHome(1200, 900, 1, { lit: true })}
   ${monkey({ x: 480, y: 760, s: 0.98, flower: true, arms: "up" })}
   ${monkey({ x: 700, y: 750, s: 1.15, shade: "#77836f", arms: "up" })}
   ${kiki({ x: 590, y: 820, s: 1.1, arms: "up" })}
   ${kiki({ x: 820, y: 850, s: 0.6, arms: "up" })}`,

  // 12 dreaming of a happy home
  `${nightScene()}${baobabHome(800, 920, 1.2, { lit: false })}
   ${kiki({ x: 1330, y: 840, s: 0.9 })}
   ${tallGrass(220, 940, 1.3)}`,
];

// Book 3: Kiki and the Big Game

const kikiGamePages = [
  // 1 cover: the playground
  `${basicScene()}${acacia(1150, 590, 1.4)}${swing(1150, 780, 1)}
   ${kite(400, 300, 0.9)}
   ${playBall(700, 880, 1)}
   ${kiki({ x: 480, y: 800, s: 1.2, arms: "up" })}
   ${elephant({ x: 900, y: 750, s: 0.62 })}
   ${ostrich({ x: 1400, y: 750, s: 0.58 })}`,

  // 2 play day at school
  `${basicScene()}${chalkboard(320, 800, 1)}${schoolBell(1430, 840, 1)}
   ${giraffe({ x: 650, y: 630, s: 0.85, glasses: true })}
   ${kiki({ x: 950, y: 800, s: 1.15, arms: "up" })}
   ${elephant({ x: 1200, y: 760, s: 0.6, trunkUp: true })}`,

  // 3 playing ball
  `${basicScene()}${acacia(220, 630, 1)}
   ${playBall(800, 860, 1.2)}
   ${kiki({ x: 520, y: 800, s: 1.15, arms: "up" })}
   ${elephant({ x: 1080, y: 740, s: 0.72, trunkUp: true })}
   ${ostrich({ x: 1350, y: 720, s: 0.62 })}`,

  // 4 the ostrich runs fast
  `${basicScene()}${acacia(1420, 630, 0.95)}${tallGrass(200, 920, 1.3)}
   ${ostrich({ x: 900, y: 690, s: 0.95, pose: "run" })}
   ${kiki({ x: 400, y: 800, s: 1.15, arms: "up" })}
   <g stroke="#cbb27a" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 660 800 q -40 -12 -70 6"/></g>`,

  // 5 high on the swing
  `${basicScene()}${acacia(800, 570, 1.5)}${swing(800, 760, 1.3)}
   ${kiki({ x: 800, y: 640, s: 1, arms: "up" })}
   ${elephant({ x: 320, y: 760, s: 0.62 })}`,

  // 6 flying the big red kite
  `${basicScene()}${acacia(220, 630, 1)}
   ${kite(1050, 320, 1.1)}
   ${kiki({ x: 850, y: 800, s: 1.15, arms: "up" })}
   ${elephant({ x: 1200, y: 760, s: 0.62, trunkUp: true })}`,

  // 7 the wind takes the kite
  `${basicScene()}
   ${kite(1250, 240, 0.95)}
   <g stroke="#9db4c6" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 500 320 q 90 -40 180 0 q 90 40 180 0"/><path d="M 420 440 q 90 -40 180 0 q 90 40 180 0"/></g>
   ${kiki({ x: 620, y: 800, s: 1.15, mood: "surprised", arms: "up" })}
   ${elephant({ x: 950, y: 760, s: 0.62, mood: "surprised" })}`,

  // 8 stuck in the tall tall tree
  `${basicScene()}${acacia(1050, 600, 1.5)}
   ${kite(1120, 420, 0.85, { stuck: true })}
   ${kiki({ x: 550, y: 810, s: 1.15, mood: "sad" })}
   ${elephant({ x: 850, y: 770, s: 0.6, mood: "sad" })}`,

  // 9 Kiki has an idea
  `${basicScene()}${acacia(1420, 630, 0.95)}
   ${kiki({ x: 700, y: 800, s: 1.25, mood: "surprised", arms: "up" })}
   ${elephant({ x: 1050, y: 760, s: 0.62 })}
   ${ostrich({ x: 1300, y: 730, s: 0.58 })}`,

  // 10 the tall friend reaches up up up
  `${basicScene()}${acacia(1050, 600, 1.5)}
   ${kite(1120, 420, 0.85, { stuck: true })}
   ${giraffe({ x: 780, y: 620, s: 1.1 })}
   ${kiki({ x: 420, y: 810, s: 1.1, arms: "up" })}`,

  // 11 hooray - and Musa comes to play
  `${basicScene()}${acacia(220, 630, 1)}
   ${kite(600, 330, 0.9)}
   ${giraffe({ x: 950, y: 620, s: 0.95 })}
   ${zebra({ x: 1150, y: 700, s: 0.95 })}
   ${kiki({ x: 550, y: 800, s: 1.15, arms: "up" })}
   ${elephant({ x: 800, y: 770, s: 0.58, trunkUp: true })}`,

  // 12 games are best with friends
  `${basicScene()}${acacia(1400, 620, 1.1)}${swing(1400, 800, 0.9)}
   ${kite(300, 280, 0.85)}
   ${playBall(760, 880, 1)}
   ${kiki({ x: 550, y: 800, s: 1.15, arms: "up" })}
   ${zebra({ x: 1050, y: 700, s: 0.9 })}
   ${elephant({ x: 1330, y: 760, s: 0.55, trunkUp: true })}
   ${ostrich({ x: 900, y: 740, s: 0.55 })}`,
];

// ---------------------------------------------------------------- Duku farm series (Term 2)
// Book 1: Duku Makes a Scarecrow

const dukuScarecrowPages = [
  // 1 cover: the farm crew and their scarecrow
  `${basicScene()}${barn(300, 850, 0.9)}${fence(1180, 900, 1, 3)}
   ${scarecrow(1050, 840, 1)}
   ${donkey({ x: 640, y: 700, s: 1 })}
   ${hen({ x: 900, y: 830, s: 1 })}
   ${goat({ x: 1370, y: 760, s: 0.85, flip: true })}`,

  // 2 Duku's green farm
  `${basicScene()}${barn(1150, 860, 1.1)}${fence(180, 900, 1, 4)}
   ${donkey({ x: 600, y: 700, s: 1.15 })}
   ${tallGrass(300, 930, 1.2)}`,

  // 3 Koko plants seeds
  `${basicScene()}${barn(260, 840, 0.75)}
   ${seedRow(850, 900, 1.1, { sprouts: false })}
   ${hen({ x: 1250, y: 820, s: 1.15 })}`,

  // 4 the birds come to eat them
  `${basicScene()}${fence(1240, 900, 1, 2)}
   ${seedRow(750, 900, 1.1, { sprouts: false })}
   ${wildBird(620, 850, 1.1)}${wildBird(800, 870, 1)}${wildBird(950, 840, 1.05, true)}
   ${hen({ x: 1250, y: 810, s: 1.1, mood: "surprised" })}`,

  // 5 Duku's idea
  `${basicScene()}${acacia(1420, 630, 0.95)}
   ${donkey({ x: 620, y: 700, s: 1.15, mood: "surprised" })}
   ${hen({ x: 1000, y: 830, s: 0.95 })}
   ${goat({ x: 1250, y: 770, s: 0.85, flip: true })}`,

  // 6 Gigi finds a stick
  `${basicScene()}${acacia(300, 630, 1)}${fence(1240, 900, 1, 2)}
   ${goat({ x: 800, y: 760, s: 1.05 })}
   <path d="M 950 860 l 220 -26" stroke="${C.acaciaTrunk}" stroke-width="14" stroke-linecap="round"/>
   <path d="M 1080 842 l 24 -34" stroke="${C.acaciaTrunk}" stroke-width="8" stroke-linecap="round"/>`,

  // 7 straw and an old hat
  `${basicScene()}${haystack(400, 900, 0.9)}
   ${hen({ x: 700, y: 830, s: 1 })}
   ${donkey({ x: 1050, y: 710, s: 1 })}
   <path d="M 1240 860 q 40 -14 80 0 l -12 -8 q -8 -26 -28 -26 q -20 0 -28 26 z" fill="#a3542f" stroke="${C.ink}" stroke-width="4"/>`,

  // 8 tap tap tap - building together
  `${basicScene()}${scarecrow(800, 850, 1.05, { hat: false })}
   ${donkey({ x: 420, y: 720, s: 0.95 })}
   ${goat({ x: 1150, y: 770, s: 0.85, flip: true })}
   ${hen({ x: 1330, y: 840, s: 0.9, flip: true })}
   ${dustPuffs(800, 890)}`,

  // 9 the funny scarecrow is done
  `${basicScene()}${scarecrow(800, 840, 1.15)}
   ${donkey({ x: 400, y: 710, s: 1 })}
   ${hen({ x: 620, y: 850, s: 0.95 })}
   ${goat({ x: 1180, y: 770, s: 0.9, flip: true })}`,

  // 10 the birds fly away hungry
  `${basicScene()}${scarecrow(500, 840, 0.95)}
   ${wildBird(900, 400, 1, true)}${wildBird(1050, 330, 0.95, true)}${wildBird(1200, 420, 1.05, true)}
   ${donkey({ x: 1000, y: 720, s: 1, mood: "sad" })}`,

  // 11 a little garden just for the birds
  `${basicScene()}${seedRow(500, 910, 0.9)}
   ${wildBird(400, 850, 1)}${wildBird(600, 860, 0.95)}
   ${donkey({ x: 950, y: 710, s: 1 })}
   ${hen({ x: 1230, y: 830, s: 0.95 })}
   ${goat({ x: 1420, y: 780, s: 0.8, flip: true })}`,

  // 12 everyone has food
  `${basicScene()}${scarecrow(300, 840, 0.9)}${seedRow(1150, 910, 0.9)}
   ${wildBird(1050, 850, 1)}${wildBird(1250, 860, 0.95)}
   ${donkey({ x: 650, y: 700, s: 1.05 })}
   ${hen({ x: 900, y: 840, s: 0.95 })}
   ${goat({ x: 1420, y: 770, s: 0.8, flip: true })}`,
];

// Book 2: The Little Lost Chick

const lostChickPages = [
  // 1 cover: Koko and her chicks at the barn
  `${basicScene()}${barn(1150, 860, 1)}${fence(180, 900, 1, 3)}
   ${hen({ x: 600, y: 820, s: 1.2 })}
   ${chick(780, 880, 1.1)}${chick(850, 900, 1)}${chick(920, 880, 1.05)}${chick(990, 900, 0.95)}${chick(1060, 880, 1)}`,

  // 2 good morning farm
  `${basicScene()}${barn(400, 860, 1)}${fence(1100, 900, 1, 3)}
   ${donkey({ x: 900, y: 710, s: 1.05 })}
   ${tallGrass(1400, 930, 1.2)}`,

  // 3 five little chicks
  `${basicScene()}${fence(950, 900, 1, 3)}
   ${hen({ x: 450, y: 820, s: 1.15 })}
   ${chick(700, 890, 1.1)}${chick(810, 900, 1)}${chick(920, 890, 1.05)}${chick(1030, 900, 0.95)}${chick(1140, 890, 1)}`,

  // 4 Pip loves to hop
  `${basicScene()}${acacia(280, 630, 1)}
   ${chick(800, 850, 1.6, "happy")}
   ${hen({ x: 1200, y: 820, s: 1.05 })}
   <g stroke="#cbb27a" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 680 900 q 20 -40 60 -50"/><path d="M 900 890 q 24 -44 62 -52"/></g>`,

  // 5 counting one two three four
  `${basicScene()}${barn(280, 840, 0.75)}
   ${hen({ x: 600, y: 810, s: 1.15, mood: "surprised" })}
   ${chick(850, 890, 1.05)}${chick(960, 900, 1)}${chick(1070, 890, 1.05)}${chick(1180, 900, 0.95)}`,

  // 6 where is little Pip
  `${basicScene()}${fence(1150, 900, 1, 3)}
   ${hen({ x: 500, y: 820, s: 1.1, mood: "sad" })}
   ${donkey({ x: 850, y: 720, s: 1, mood: "sad" })}
   ${goat({ x: 1250, y: 770, s: 0.85, flip: true, mood: "sad" })}`,

  // 7 Duku looks in the barn
  `${basicScene()}${barn(800, 880, 1.3)}
   ${donkey({ x: 400, y: 730, s: 1.05, mood: "surprised" })}`,

  // 8 Gigi looks by the pond
  `${basicScene()}${acacia(250, 630, 1)}
   ${puddle(950, 880, 300, 66, 0)}
   ${goat({ x: 550, y: 770, s: 1, mood: "surprised" })}`,

  // 9 Musa looks in the tall grass
  `${basicScene()}${tallGrass(500, 920, 1.8)}${tallGrass(800, 940, 1.6)}${tallGrass(1100, 920, 1.7)}
   ${zebra({ x: 400, y: 690, s: 1.05, mood: "surprised" })}`,

  // 10 a tiny sound - peep peep
  `${basicScene()}${haystack(1100, 900, 1.1)}
   ${hen({ x: 500, y: 820, s: 1.05, mood: "surprised" })}
   ${donkey({ x: 750, y: 720, s: 0.95, mood: "surprised" })}
   <g stroke="#7d97ad" stroke-width="7" fill="none" stroke-linecap="round">
     <path class="anim-wave" style="animation-delay:0s" d="M 1010 620 q 24 -24 0 -48"/>
     <path class="anim-wave" style="animation-delay:0.4s" d="M 1050 640 q 38 -38 0 -76"/>
   </g>`,

  // 11 Pip asleep in the soft hay
  `${basicScene()}${haystack(800, 900, 1.4)}
   ${chick(800, 790, 1.4)}
   ${hen({ x: 420, y: 830, s: 1.05 })}`,

  // 12 safe at home
  `${basicScene()}${barn(1200, 860, 0.95)}
   ${hen({ x: 500, y: 820, s: 1.1 })}
   ${chick(680, 890, 1)}${chick(760, 900, 0.95)}${chick(840, 890, 1)}${chick(920, 900, 0.95)}${chick(1000, 880, 1.05)}
   ${donkey({ x: 300, y: 730, s: 0.85 })}${goat({ x: 1420, y: 790, s: 0.7, flip: true })}`,
];

// Book 3: Duku's Five Senses

const dukuSensesPages = [
  // 1 cover: Duku and Kiki with sun, flower and mango
  `${basicScene()}${barn(300, 850, 0.8)}${bigFlower(1250, 900, 1.2)}
   ${donkey({ x: 700, y: 710, s: 1.1 })}
   ${kiki({ x: 1050, y: 810, s: 1.1, arms: "up" })}
   ${mango(950, 880, 1.3)}`,

  // 2 a fresh new day
  `${basicScene()}${barn(1150, 860, 1)}${fence(200, 900, 1, 3)}
   ${donkey({ x: 650, y: 710, s: 1.15 })}`,

  // 3 he SAW the bright sun
  `${basicScene()}${acacia(250, 630, 1)}
   ${donkey({ x: 800, y: 720, s: 1.1, flip: true })}
   <g class="anim-glow"><circle cx="1350" cy="160" r="150" fill="${C.sunGlow}" opacity="0.5"/></g>`,

  // 4 he HEARD the little birds
  `${basicScene()}${acacia(1100, 620, 1.2)}
   ${wildBird(1000, 420, 1)}${wildBird(1180, 380, 0.95)}${wildBird(1300, 450, 1.05, true)}
   ${donkey({ x: 550, y: 710, s: 1.1 })}
   <g stroke="#7d97ad" stroke-width="6" fill="none" stroke-linecap="round">
     <path class="anim-wave" style="animation-delay:0s" d="M 900 480 q 20 -20 0 -40"/>
     <path class="anim-wave" style="animation-delay:0.5s" d="M 935 500 q 30 -30 0 -60"/>
   </g>`,

  // 5 he SMELLED the sweet mango tree
  `${basicScene()}${acacia(1000, 620, 1.3)}
   ${mango(900, 460, 1)}${mango(1050, 430, 1)}${mango(1150, 480, 0.95)}
   ${donkey({ x: 550, y: 710, s: 1.1 })}
   <g stroke="#e0966c" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.8">
     <path class="anim-wave" style="animation-delay:0s" d="M 760 600 q 14 -24 0 -46"/>
     <path class="anim-wave" style="animation-delay:0.6s" d="M 800 590 q 16 -28 0 -52"/>
   </g>`,

  // 6 he TOUCHED the soft hay
  `${basicScene()}${haystack(950, 900, 1.3)}
   ${donkey({ x: 550, y: 720, s: 1.1 })}`,

  // 7 he TASTED a crunchy carrot
  `${basicScene()}${fence(1150, 900, 1, 3)}
   ${donkey({ x: 700, y: 710, s: 1.15 })}
   ${carrot(950, 840, 1.6)}`,

  // 8 Kiki comes to visit
  `${basicScene()}${barn(300, 850, 0.8)}
   ${kiki({ x: 950, y: 800, s: 1.2, arms: "up" })}
   ${donkey({ x: 600, y: 710, s: 1.05 })}`,

  // 9 what do you hear? a bell!
  `${basicScene()}${schoolBell(1100, 850, 1.2)}
   ${kiki({ x: 700, y: 800, s: 1.1, arms: "up" })}
   ${donkey({ x: 400, y: 720, s: 1, mood: "surprised" })}`,

  // 10 what do you smell? a flower!
  `${basicScene()}${bigFlower(950, 890, 1.5)}
   ${kiki({ x: 650, y: 800, s: 1.1 })}
   ${donkey({ x: 350, y: 720, s: 1 })}`,

  // 11 what do you taste? sweet mango!
  `${basicScene()}${acacia(1350, 630, 1)}
   ${mango(950, 850, 1.6)}
   ${kiki({ x: 650, y: 800, s: 1.1, arms: "up" })}
   ${donkey({ x: 350, y: 720, s: 1 })}`,

  // 12 five senses hooray
  `${basicScene()}${bigFlower(250, 900, 1.1)}${carrot(1350, 880, 1.2)}${mango(1250, 900, 1.2)}
   ${donkey({ x: 700, y: 710, s: 1.1 })}
   ${kiki({ x: 1020, y: 800, s: 1.15, arms: "up" })}
   ${wildBird(450, 850, 0.95)}`,
];

// ---------------------------------------------------------------- Lulu journey series (Term 3)
// Book 1: Lulu Says Let's Go!

const luluGoPages = [
  // 1 cover: Lulu flying high over the savanna
  `${basicScene()}${acacia(300, 640, 1.1)}${acacia(1350, 630, 0.95)}
   ${lulu({ x: 800, y: 340, s: 1.8, flying: true })}
   ${zebra({ x: 520, y: 720, s: 0.8 })}
   ${monkey({ x: 1150, y: 780, s: 0.75, arms: "up" })}`,

  // 2 Lulu lived by the big acacia
  `${basicScene()}${acacia(800, 610, 1.5)}
   ${lulu({ x: 830, y: 470, s: 1.6 })}
   ${tallGrass(250, 920, 1.3)}`,

  // 3 time to fly to the great lake
  `${basicScene()}${acacia(300, 630, 1.05)}
   ${lulu({ x: 700, y: 450, s: 1.7, flying: true, arms: "up" })}
   ${wildBird(420, 520, 0.9, true)}`,

  // 4 goodbye Musa
  `${basicScene()}${puddle(650, 890, 240, 54)}
   ${zebra({ x: 620, y: 700, s: 1.05, mood: "happy" })}
   ${lulu({ x: 1050, y: 420, s: 1.6, flying: true })}`,

  // 5 over Duku's farm
  `${basicScene()}${barn(500, 900, 0.7)}${fence(900, 920, 0.8, 3)}
   ${donkey({ x: 750, y: 790, s: 0.68 })}
   ${lulu({ x: 1100, y: 380, s: 1.6, flying: true })}`,

  // 6 up up up - the world looked small
  `${basicScene()}
   ${acacia(400, 780, 0.5)}${acacia(1200, 800, 0.45)}${barn(800, 830, 0.35)}
   ${lulu({ x: 800, y: 280, s: 1.9, flying: true })}
   <g stroke="#f4efe4" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.7"><path d="M 400 340 q 60 -18 120 0"/><path d="M 1150 420 q 60 -18 120 0"/></g>`,

  // 7 she flew fast and far
  `${basicScene()}${tallGrass(300, 930, 1.2)}
   ${lulu({ x: 900, y: 400, s: 1.8, flying: true })}
   <g stroke="#9db4c6" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"><path d="M 500 380 q 90 -30 180 0"/><path d="M 460 480 q 90 -30 180 0"/></g>`,

  // 8 tired wings
  `${basicScene(true)}
   ${lulu({ x: 800, y: 480, s: 1.7, flying: true, mood: "sad" })}
   ${hills()}`,

  // 9 resting in a tall tree
  `${basicScene()}${acacia(900, 620, 1.4)}
   ${lulu({ x: 930, y: 470, s: 1.5, mood: "sad" })}`,

  // 10 a kind old bird shares her seeds
  `${basicScene()}${acacia(800, 610, 1.4)}
   ${lulu({ x: 700, y: 480, s: 1.4 })}
   ${wildBird(920, 470, 1.5)}
   ${seedRow(820, 500, 0.35, { sprouts: false })}`,

  // 11 thank you - now I can go on
  `${basicScene()}${acacia(350, 630, 1.05)}
   ${lulu({ x: 800, y: 400, s: 1.7, flying: true, arms: "up" })}
   ${wildBird(500, 470, 1.1, true)}`,

  // 12 the great lake is near
  `${basicScene()}${lake(1250, 640, 330, 60)}
   ${lulu({ x: 700, y: 380, s: 1.8, flying: true })}
   ${tallGrass(250, 920, 1.3)}`,
];

// Book 2: Lulu and the Wonderful Water

const luluWaterPages = [
  // 1 cover: Lulu over the sparkling lake
  `${basicScene()}${lake(800, 800, 520, 130)}
   ${sailboat(1100, 780, 0.9)}
   ${lulu({ x: 550, y: 420, s: 1.8, flying: true })}
   ${fish(450, 780, 1.1)}`,

  // 2 following the little river
  `${basicScene()}${river(800, 700, 1)}
   ${lulu({ x: 500, y: 400, s: 1.6, flying: true })}
   ${acacia(1300, 630, 0.95)}`,

  // 3 the river runs down the hills
  `${basicScene()}${river(650, 680, 1.1)}
   ${lulu({ x: 1050, y: 420, s: 1.6, flying: true })}
   ${tallGrass(1350, 920, 1.2)}`,

  // 4 rain begins to fall
  `${basicScene(true)}
   <g class="anim-cloud"><circle cx="500" cy="180" r="66" fill="#f4f0e2" opacity="0.85"/><circle cx="560" cy="200" r="52" fill="${C.rainTop}"/></g>
   ${rain()}
   ${lulu({ x: 800, y: 460, s: 1.6, flying: true, mood: "surprised" })}`,

  // 5 hiding under a big leaf
  `${basicScene(true)}${rain()}
   ${bigLeaf(800, 860, 1.5)}
   ${lulu({ x: 760, y: 800, s: 1.4 })}`,

  // 6 the rain stops - a rainbow
  `${basicScene()}${rainbow(800, 500)}
   ${lulu({ x: 800, y: 380, s: 1.7, flying: true, arms: "up" })}
   ${puddle(500, 900, 200, 46)}${puddle(1150, 920, 220, 48)}`,

  // 7 the great lake at last
  `${basicScene()}${lake(800, 820, 600, 140)}
   ${lulu({ x: 800, y: 420, s: 1.8, flying: true, mood: "surprised" })}`,

  // 8 hello little fish
  `${basicScene()}${lake(800, 850, 560, 120)}
   ${fish(750, 760, 1.6)}
   ${lulu({ x: 500, y: 560, s: 1.5, flying: true })}`,

  // 9 the little elephant splashing
  `${basicScene()}${lake(900, 850, 500, 110)}
   ${elephant({ x: 950, y: 760, s: 0.95, trunkUp: true })}
   ${splashArcs(950, 850, C.water)}
   ${lulu({ x: 450, y: 500, s: 1.5, flying: true })}`,

  // 10 a white boat sails by
  `${basicScene()}${lake(800, 850, 560, 120)}
   ${sailboat(950, 800, 1.2)}
   ${lulu({ x: 450, y: 480, s: 1.5, flying: true, arms: "up" })}`,

  // 11 cool clean water
  `${basicScene()}${lake(800, 860, 540, 110)}
   ${lulu({ x: 700, y: 740, s: 1.6 })}
   ${fish(1050, 790, 1.1)}`,

  // 12 water is wonderful
  `${basicScene()}${rainbow(800, 560)}${lake(800, 870, 560, 110)}
   ${lulu({ x: 800, y: 500, s: 1.8, flying: true, arms: "up" })}
   ${fish(500, 800, 1.1)}${sailboat(1200, 810, 0.8)}`,
];

// Book 3: Lulu in the City

const luluCityPages = [
  // 1 cover: the big city skyline
  `${basicScene()}${cityBuildings(800, 700, 1)}
   ${lulu({ x: 500, y: 350, s: 1.8, flying: true })}
   ${lampPost(1350, 880, 1)}`,

  // 2 past the lake was the big city
  `${basicScene()}${lake(300, 880, 260, 60)}${cityBuildings(1000, 680, 0.9)}
   ${lulu({ x: 550, y: 420, s: 1.6, flying: true, mood: "surprised" })}`,

  // 3 busy streets and tall buildings
  `${basicScene()}${cityBuildings(700, 660, 1.1)}
   <path d="M 0 900 q 400 -30 800 0 q 400 30 800 0 L 1600 1000 L 0 1000 Z" fill="#b9b0a6" stroke="#a39a8f" stroke-width="5"/>
   ${lulu({ x: 1250, y: 420, s: 1.6, flying: true })}
   ${lampPost(300, 880, 1)}${lampPost(1300, 900, 0.9)}`,

  // 4 the market and its mangoes
  `${basicScene()}${cityBuildings(400, 620, 0.7)}
   ${marketStall(950, 880, 1.3)}
   ${lulu({ x: 550, y: 550, s: 1.5, flying: true, arms: "up" })}`,

  // 5 Kiki and Mama at the market
  `${basicScene()}${marketStall(1050, 880, 1.2)}
   ${kiki({ x: 600, y: 810, s: 1.1, arms: "up" })}
   ${monkey({ x: 400, y: 760, s: 0.95, flower: true })}
   ${lulu({ x: 850, y: 560, s: 1.4, flying: true })}`,

  // 6 the city park
  `${basicScene()}${acacia(500, 630, 1.1)}${acacia(1150, 640, 1)}
   ${lampPost(800, 880, 1)}
   ${kiki({ x: 1000, y: 810, s: 1 })}
   ${lulu({ x: 620, y: 480, s: 1.4, flying: true })}`,

  // 7 the big clock tower
  `${basicScene()}${clockTower(800, 900, 1.1)}
   ${lulu({ x: 500, y: 400, s: 1.5, flying: true, mood: "surprised" })}
   ${kiki({ x: 1100, y: 820, s: 0.95, arms: "up" })}`,

  // 8 ding dong - the clock sings
  `${basicScene()}${clockTower(700, 900, 1.05)}
   <g stroke="#7d97ad" stroke-width="8" fill="none" stroke-linecap="round">
     <path class="anim-wave" style="animation-delay:0s" d="M 850 560 q 26 -26 0 -52"/>
     <path class="anim-wave" style="animation-delay:0.4s" d="M 895 580 q 40 -40 0 -80"/>
     <path class="anim-wave" style="animation-delay:0.8s" d="M 940 600 q 54 -54 0 -108"/>
   </g>
   ${lulu({ x: 1150, y: 480, s: 1.5, flying: true, arms: "up" })}`,

  // 9 city lights at night
  `${nightScene()}${cityBuildings(800, 700, 1, { lit: true })}
   ${lampPost(300, 880, 1, { lit: true })}${lampPost(1350, 900, 0.9, { lit: true })}
   ${lulu({ x: 500, y: 400, s: 1.6, flying: true })}`,

  // 10 a nest by the park lamp
  `${nightScene()}${acacia(900, 640, 1.2)}${lampPost(600, 880, 1.1, { lit: true })}
   ${nest(930, 500, 1.3)}
   ${lulu({ x: 930, y: 470, s: 1.4 })}`,

  // 11 the city hums good night
  `${nightScene()}${cityBuildings(1050, 720, 0.85, { lit: true })}${acacia(350, 650, 1)}
   ${nest(380, 520, 1.2)}
   ${lulu({ x: 380, y: 490, s: 1.3 })}
   <g fill="#f6f0d8"><g class="anim-float" style="animation-delay:0s"><circle cx="700" cy="420" r="8"/><rect x="705" y="376" width="4.5" height="46" rx="2"/></g><g class="anim-float" style="animation-delay:0.9s"><circle cx="790" cy="380" r="8"/><rect x="795" y="336" width="4.5" height="46" rx="2"/></g></g>`,

  // 12 friends make every place home
  `${basicScene()}${cityBuildings(400, 640, 0.7)}${acacia(1250, 630, 1)}
   ${lulu({ x: 800, y: 420, s: 1.7, flying: true, arms: "up" })}
   ${kiki({ x: 1050, y: 810, s: 1, arms: "up" })}
   ${monkey({ x: 1300, y: 770, s: 0.9, flower: true, arms: "up" })}
   ${wildBird(550, 500, 1, true)}`,
];

// ---------------------------------------------------------------- capstone crossover (Unit 10)
// The Big Friends Party: every series in one celebration.

const friendsPartyPages = [
  // 1 cover: the whole world under the party banner
  `${basicScene()}${rainbow(800, 520)}${raceBanner(800, 560, 1.1)}
   ${zebra({ x: 480, y: 700, s: 0.9 })}
   ${kiki({ x: 700, y: 810, s: 1, arms: "up", backpack: true })}
   ${donkey({ x: 950, y: 720, s: 0.85 })}
   ${lulu({ x: 800, y: 330, s: 1.5, flying: true })}
   ${elephant({ x: 1220, y: 730, s: 0.8, flip: true, trunkUp: true })}
   ${monkey({ x: 300, y: 780, s: 0.8, arms: "up" })}`,

  // 2 Lulu flies home from the big city
  `${basicScene()}${cityBuildings(280, 600, 0.55)}${acacia(1250, 630, 1.05)}
   ${lulu({ x: 800, y: 380, s: 1.7, flying: true, arms: "up" })}
   ${tallGrass(1450, 930, 1.2)}`,

  // 3 Musa says: a party for all our friends!
  `${basicScene()}${acacia(300, 630, 1.05)}${puddle(1150, 890, 240, 54)}
   ${zebra({ x: 700, y: 690, s: 1.15, mood: "surprised" })}
   ${lulu({ x: 1000, y: 440, s: 1.5, flying: true })}`,

  // 4 Kiki comes from school with the games
  `${basicScene()}${schoolBell(280, 840, 0.9)}
   ${giraffe({ x: 600, y: 620, s: 0.95, glasses: true })}
   ${kiki({ x: 900, y: 800, s: 1.15, backpack: true, arms: "up" })}
   ${playBall(1100, 880, 0.9)}
   ${kite(1300, 350, 0.8)}`,

  // 5 Duku comes from the farm with food
  `${basicScene()}${barn(280, 850, 0.7)}${fence(1300, 900, 0.9, 2)}
   ${donkey({ x: 650, y: 710, s: 1.05 })}
   ${hen({ x: 900, y: 840, s: 0.95 })}
   ${goat({ x: 1130, y: 770, s: 0.85 })}
   ${mango(800, 890, 1.2)}${mango(850, 910, 1)}${carrot(760, 900, 1)}`,

  // 6 the little elephant fills the puddle
  `${basicScene()}${acacia(1400, 630, 0.95)}
   ${puddle(900, 880, 320, 70, 0)}
   ${elephant({ x: 480, y: 720, s: 1, trunkUp: true })}
   ${waterSpray(600, 560, 950, 590)}
   ${lulu({ x: 1250, y: 460, s: 1.3, flying: true })}`,

  // 7 making the long, long table
  `${basicScene()}${acacia(240, 630, 1)}
   ${bench(700, 890, 1.6)}${bench(1100, 890, 1.6)}
   ${donkey({ x: 400, y: 730, s: 0.85 })}
   ${kiki({ x: 850, y: 800, s: 1, arms: "up" })}
   ${goat({ x: 1300, y: 780, s: 0.8, flip: true })}
   ${dustPuffs(900, 870)}`,

  // 8 hello hello - everyone greets everyone
  `${basicScene()}${raceBanner(800, 540, 1)}
   ${zebra({ x: 380, y: 710, s: 0.85 })}
   ${kiki({ x: 620, y: 810, s: 0.95, arms: "up" })}
   ${hen({ x: 820, y: 850, s: 0.85 })}
   ${ostrich({ x: 1000, y: 690, s: 0.75, flip: true })}
   ${monkey({ x: 1200, y: 790, s: 0.8, flip: true, flower: true, arms: "up" })}
   ${chick(920, 900, 0.9)}`,

  // 9 games and taking turns
  `${basicScene()}${acacia(1380, 620, 1.05)}${swing(1380, 800, 0.9)}
   ${playBall(800, 880, 1.1)}
   ${kiki({ x: 550, y: 800, s: 1, arms: "up" })}
   ${zebra({ x: 1050, y: 700, s: 0.9, pose: "run" })}
   ${kite(300, 300, 0.8)}
   ${ostrich({ x: 1250, y: 720, s: 0.65 })}`,

  // 10 eating and Mama's soft song
  `${basicScene()}${bench(800, 900, 2)}
   ${monkey({ x: 400, y: 770, s: 0.95, flower: true })}
   ${kiki({ x: 620, y: 820, s: 0.95 })}
   ${donkey({ x: 900, y: 740, s: 0.8 })}
   ${hen({ x: 1120, y: 850, s: 0.85 })}
   ${mango(750, 870, 1)}${carrot(820, 880, 0.9)}
   <g fill="#5a5148"><g class="anim-float" style="animation-delay:0s"><circle cx="500" cy="520" r="9"/><rect x="506" y="470" width="5" height="52" rx="2.5"/></g><g class="anim-float" style="animation-delay:0.9s"><circle cx="590" cy="470" r="9"/><rect x="596" y="420" width="5" height="52" rx="2.5"/></g></g>`,

  // 11 stars come out; the chicks sleep in the hay
  `${nightScene()}${haystack(1100, 900, 1.1)}
   ${chick(1050, 800, 0.9)}${chick(1130, 790, 0.85)}${chick(1190, 805, 0.9)}
   ${hen({ x: 850, y: 840, s: 0.95 })}
   ${zebra({ x: 400, y: 710, s: 0.85 })}
   ${lulu({ x: 620, y: 500, s: 1.2 })}
   ${nest(620, 530, 1)}`,

  // 12 look at our world - friends everywhere
  `${basicScene()}${rainbow(800, 500)}${acacia(180, 640, 0.95)}${cityBuildings(1450, 620, 0.4)}
   ${lulu({ x: 800, y: 320, s: 1.5, flying: true, arms: "up" })}
   ${zebra({ x: 400, y: 700, s: 0.85 })}
   ${kiki({ x: 620, y: 810, s: 0.9, arms: "up" })}
   ${donkey({ x: 860, y: 730, s: 0.75 })}
   ${elephant({ x: 1080, y: 740, s: 0.7, flip: true, trunkUp: true })}
   ${giraffe({ x: 220, y: 620, s: 0.75, glasses: true })}
   ${goat({ x: 1300, y: 780, s: 0.65, flip: true })}
   ${wildBird(950, 450, 0.9, true)}`,
];

// ---------------------------------------------------------------- write files

const books = {
  "muddy-stripes": { dir: "musas-muddy-stripes", pages: muddyStripesPages },
  "helps-a-friend": { dir: "musa-helps-a-friend", pages: helpsAFriendPages },
  "big-race": { dir: "musas-big-race", pages: bigRacePages },
  "kiki-school": { dir: "kiki-goes-to-school", pages: kikiSchoolPages },
  "kiki-family": { dir: "kikis-family-day", pages: kikiFamilyPages },
  "kiki-game": { dir: "kiki-and-the-big-game", pages: kikiGamePages },
  "duku-scarecrow": { dir: "duku-makes-a-scarecrow", pages: dukuScarecrowPages },
  "lost-chick": { dir: "the-little-lost-chick", pages: lostChickPages },
  "duku-senses": { dir: "dukus-five-senses", pages: dukuSensesPages },
  "lulu-go": { dir: "lulu-says-lets-go", pages: luluGoPages },
  "lulu-water": { dir: "lulu-and-the-wonderful-water", pages: luluWaterPages },
  "lulu-city": { dir: "lulu-in-the-city", pages: luluCityPages },
  "friends-party": { dir: "the-big-friends-party", pages: friendsPartyPages },
};

writeBooks(books, process.argv[2]);
