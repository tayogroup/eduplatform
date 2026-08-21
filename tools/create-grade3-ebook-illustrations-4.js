#!/usr/bin/env node

// Grade 3, the FOURTH book of each unit. Companion to -2.js and -3.js; the
// header in -2.js explains how the four books of a unit divide its five texts.
// These ten are built from the LISTENING texts — the dialogues and spoken
// pieces a learner hears rather than reads, and the ones no book on the shelf
// had used:
//
//   1  Mina's Two Voices        Unit 1  "Public and Private"
//   2  The Quietest Room        Unit 2  "In the Classroom"
//   3  Sami's Calendar          Unit 3  "Making a Calendar"
//   4  Friday at the Market     Unit 4  "At the Market"
//   5  The Night the Wall Shook Unit 5  "What Happened?"
//   6  Who Is Kinder?           Unit 6  "Who Is Kinder?"
//   7  Have You Ever?           Unit 7  "Have You Ever…?"
//   8  Ten to a Million         Unit 8  "Numbers Big and Small"
//   9  Everyone Gets a Turn     Unit 9  "A Group Discussion"
//   10 Showcase Day             Unit 10 "Planning the Showcase" and "Showcase Day"
//
// A dialogue is two people and no scenery, so these books do what the unit's own
// listening tracks cannot: they put the conversation somewhere. Every one of
// them then carries the exchange one step past where the recording stops —
// Mina actually goes to the market, Sami actually makes his calendar, the wall
// actually gets its stones — because a picture book needs the thing to happen.
//
// Usage: node tools/create-grade3-ebook-illustrations-4.js [book-key|all]
// Output: src/prototypes/ehel-academy/english/ebooks/<book>/page-NN.svg

const {
  C, W, H, writeBooks, acacia, bench, marketStall, confetti, dustPuffs, goat, hen, chick,
  wildBird, lulu, lampPost, clockTower, schoolBell, playBall, mango, fruitBowl, river,
  waterBottle, thoughtBubble, rain, rainbow, puddle, litterBits, recycleBin, gardenPlant,
  seedRow, fence, sapling, plantStage, wateringCan, seedProp, flatStone, ladder,
  notepad, mapProp, rulerProp, metreStick, balanceScale, tensLine, patternStrip,
  bookShelf, openBook, calendarBoard, house, hut, libraryBuilding, townBus, crossing,
  cloudPuff, lowSun, bunting, easel, lookLine, motionArcs, kite, sailboat, ferryBoat,
  sunsetScene, roomScene, roomBox, gardenScene, streetScene, nightScene,
  G2, G3, figure, heldBook, heldPaper, heldShell, heldFolder, heldBasket,
  classroomScene, plainRoomScene, townScene, coastScene, forestScene, mountainScene,
  desk, globeProp, shells, hospital, poster, monthWall, gardenWall, boxOfIdeas,
  hourClock, microphone, stageCurtain, basketProp, courtHouse, collegeFront,
  thermometerProp, frostPatch, numberLadder, folderProp, photoFrame, signPost,
} = require("./lib/ehel-ebook-kit-grade3.js");

const homeScene = () => roomScene({ wall: "#efe0c6", floor: "#c9a06c" });
const eveningRoom = () => `${roomScene({ wall: "#3f4a63", floor: "#7d5b3e" })}
  <rect width="${W}" height="${H}" fill="#27395c" opacity="0.30"/>`;
// The school library. Shelves on the floor AND up the wall on both sides: a
// library page drawn with one low bookcase is two thirds empty wall, and it
// reads as a corridor with some books in it rather than as a room full of them.
// The middle stays clear, so figures and a page's own prop still have somewhere
// to stand.
const libraryScene = () => `${plainRoomScene({ wall: "#e4dcc8" })}
  ${bookShelf(250, 300, 0.78, { count: 7 })}${bookShelf(1350, 300, 0.78, { count: 7 })}
  ${bookShelf(250, 600, 0.9, { count: 8 })}${bookShelf(1350, 600, 0.9, { count: 8 })}
  ${bookShelf(250, 940, 1.15, { count: 9 })}${bookShelf(1350, 940, 1.15, { count: 9 })}
  ${poster(800, 300, 0.72, { colour: G3.teal, lines: 3 })}`;
const yardScene = () => `${townScene()}${acacia(1300, 620, 1.35)}`;
// A dark, blowing sky for the night the wall shook.
// The storm garden. gardenScene() draws a sun at (1360, 150) and there is no
// option to leave it out, so the biggest cloud is parked exactly on top of it:
// the first render put a bright sun in a black sky above two boys holding a
// wall down in a gale.
const stormScene = () => `${gardenScene()}
  <rect width="${W}" height="${H}" fill="#3c4557" opacity="0.40"/>
  ${cloudPuff(320, 220, 1.4, { grey: true })}${cloudPuff(880, 170, 1.5, { grey: true })}${cloudPuff(1360, 150, 1.9, { grey: true })}`;

// ================================================================ Book 1
// Mina's Two Voices — Unit 1: "Public and Private"

const twoVoicesPages = [
  // 1 cover: Mina and Amal at the market gate
  `${townScene()}${marketStall(1180, 890, 0.9)}${signPost(400, 900, 0.8, { label: "MARKET", colour: G3.plum })}
   ${figure("amal", { x: 700, y: 918, s: 1.72 })}
   ${figure("mina", { x: 920, y: 920, s: 1.3, arms: "up" })}`,

  // 2 "Why can I shout at home, but not at the market?"
  `${homeScene()}${roomBox(1260, 640, 1.1, "living")}
   ${figure("mina", { x: 620, y: 952, s: 1.32, arms: "up" })}
   ${figure("amal", { x: 880, y: 950, s: 1.66 })}`,

  // 3 "At home, in private, you can play and be as loud as you like."
  `${homeScene()}${playBall(1240, 946, 1.3)}
   ${figure("mina", { x: 700, y: 952, s: 1.34, arms: "up" })}
   ${figure("idris", { x: 940, y: 950, s: 1.42, arms: "up" })}`,

  // 4 nobody minds if we laugh, or bang a drum, in our own house
  `${homeScene()}${roomBox(400, 640, 1.1, "bedroom")}${confetti(980, 560)}
   ${figure("mina", { x: 900, y: 952, s: 1.32, arms: "up" })}
   ${figure("amal", { x: 1140, y: 950, s: 1.6, arms: "up" })}`,

  // 5 "But outside, in public, you stay calm and speak softly."
  `${townScene()}${marketStall(1220, 890, 0.8)}
   ${figure("amal", { x: 660, y: 918, s: 1.7, arms: "point" })}
   ${figure("mina", { x: 900, y: 920, s: 1.28 })}`,

  // 6 other people are shopping, working, or resting near you
  `${townScene()}${marketStall(1120, 890, 0.94)}${basketProp(860, 916, 1, { kind: "grain" })}${bench(400, 930, 1.25)}
   ${figure("omar", { x: 1000, y: 918, s: 1.56 })}
   ${figure("hana", { x: 480, y: 918, s: 1.54 })}`,

  // 7 "So it is like taking turns with noise?" - "Exactly."
  `${townScene()}${thoughtBubble(1180, 400, 1.5, `${patternStrip(0, 10, 0.55, { cells: 3 })}`)}
   ${figure("mina", { x: 640, y: 920, s: 1.32 })}
   ${figure("amal", { x: 870, y: 918, s: 1.66 })}`,

  // 8 the next morning we went to the market, and Mina held my hand
  `${townScene()}${marketStall(1180, 890, 0.86)}${signPost(1420, 900, 0.7, { label: "GATE", colour: G3.teal })}
   ${figure("amal", { x: 640, y: 918, s: 1.68 })}
   ${figure("mina", { x: 850, y: 920, s: 1.28 })}`,

  // 9 she used her small voice at the fruit stall, and Omar smiled
  `${townScene()}${marketStall(1120, 890, 0.94)}${basketProp(830, 916, 1.05, { kind: "fruit" })}
   ${figure("omar", { x: 1000, y: 918, s: 1.58 })}
   ${figure("mina", { x: 660, y: 920, s: 1.32 })}`,

  // 10 then a little boy started crying, lost between the baskets
  `${townScene()}${basketProp(1180, 916, 1.15, { kind: "grain" })}${basketProp(1360, 916, 1, { kind: "fruit" })}
   ${figure("idris", { x: 900, y: 918, s: 1.24, mood: "sad" })}
   ${figure("mina", { x: 640, y: 920, s: 1.3, mood: "surprised" })}`,

  // 11 Mina used her big voice, and somebody was looking for him
  `${townScene()}${marketStall(1240, 890, 0.78)}${dustPuffs(1000, 930)}
   ${figure("mina", { x: 620, y: 920, s: 1.36, arms: "up" })}
   ${figure("mum", { x: 900, y: 918, s: 1.58, arms: "up" })}
   ${figure("idris", { x: 1120, y: 918, s: 1.26 })}`,

  // 12 a quiet voice and a loud voice are both good ones
  `${sunsetScene()}${house(1280, 900, 0.78)}
   ${figure("amal", { x: 660, y: 900, s: 1.7 })}
   ${figure("mina", { x: 890, y: 902, s: 1.3, arms: "up" })}`,
];

// ================================================================ Book 2
// The Quietest Room — Unit 2: "In the Classroom"

const quietestRoomPages = [
  // 1 cover: the library shelves
  `${libraryScene()}
   ${figure("amal", { x: 740, y: 950, s: 1.76, holding: heldBook })}`,

  // 2 "Today's lesson is about authors. Did everybody bring a book?"
  `${classroomScene()}
   ${figure("yasmin", { x: 620, y: 950, s: 1.68, arms: "point" })}
   ${figure("maya", { x: 900, y: 950, s: 1.54, holding: heldBook })}
   ${figure("daniel", { x: 1100, y: 950, s: 1.54 })}`,

  // 3 Maya brought her book and her eraser, in case her notes needed fixing
  `${classroomScene()}${desk(1180, 950, 1.32, { item: openBook(0, 0, 0.5) })}
   ${figure("maya", { x: 700, y: 950, s: 1.7, holding: heldBook })}`,

  // 4 a story about a clever camel: "The author is very funny."
  `${classroomScene()}${thoughtBubble(1180, 400, 1.5, `${openBook(0, 20, 0.6)}`)}
   ${figure("maya", { x: 680, y: 950, s: 1.68, arms: "up" })}`,

  // 5 Daniel's book was about a girl who wanted to be a scientist
  `${classroomScene()}${globeProp(1220, 940, 1.4)}
   ${figure("daniel", { x: 680, y: 950, s: 1.7, holding: heldBook })}`,

  // 6 "Reading at home is a good way to prepare."
  `${classroomScene()}${poster(1240, 690, 1.05, { colour: G3.leafy, lines: 4 })}
   ${figure("yasmin", { x: 640, y: 950, s: 1.68 })}
   ${figure("nora", { x: 920, y: 950, s: 1.54 })}`,

  // 7 "Choose a topic, and put in plenty of details."
  `${classroomScene()}${notepad(1200, 790, 1.3)}
   ${figure("yasmin", { x: 640, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 920, y: 950, s: 1.56, holding: heldPaper })}`,

  // 8 but I could not choose. Every book was somebody else's idea.
  `${libraryScene()}
   ${figure("amal", { x: 660, y: 950, s: 1.7, mood: "sad" })}`,

  // 9 "Can we talk about our books with a friend first?"
  `${libraryScene()}
   ${figure("maya", { x: 760, y: 950, s: 1.62, arms: "up" })}
   ${figure("yasmin", { x: 1060, y: 950, s: 1.62 })}`,

  // 10 so I told Nora about the teacher in my book
  `${libraryScene()}${desk(1030, 950, 1.3, { item: openBook(0, 0, 0.5) })}
   ${figure("amal", { x: 700, y: 950, s: 1.68, holding: heldBook })}
   ${figure("nora", { x: 930, y: 950, s: 1.56 })}`,

  // 11 and that was my topic. It had been all along.
  `${libraryScene()}${notepad(1010, 790, 1.3)}
   ${figure("amal", { x: 700, y: 950, s: 1.72, holding: heldPaper })}`,

  // 12 the quietest room in the school, and the loudest idea I had
  `${libraryScene()}
   ${figure("amal", { x: 760, y: 950, s: 1.74, arms: "up" })}`,
];

// ================================================================ Book 3
// Sami's Calendar — Unit 3: "Making a Calendar"

const samiCalendarPages = [
  // 1 cover: Amal showing Sami her calendar
  `${classroomScene()}${monthWall(886, 380, 0.8, { columns: 4 })}
   ${figure("amal", { x: 340, y: 950, s: 1.7, holding: heldPaper })}
   ${figure("sami", { x: 1330, y: 950, s: 1.58 })}`,

  // 2 "Look at my calendar. I made it for the whole year."
  `${classroomScene()}${calendarBoard(1220, 660, 1.15, { ring: 6 })}
   ${figure("amal", { x: 640, y: 950, s: 1.7, arms: "point" })}
   ${figure("sami", { x: 900, y: 950, s: 1.56 })}`,

  // 3 "In June we have school games, so I drew a football."
  `${yardScene()}${playBall(1160, 936, 1.3)}${motionArcs(980, 850, 1.15)}
   ${figure("amal", { x: 640, y: 900, s: 1.68, arms: "up" })}`,

  // 4 "In August we visit my grandmother, so I drew a house."
  `${townScene()}${house(1180, 900, 0.92)}
   ${figure("hana", { x: 900, y: 900, s: 1.58 })}
   ${figure("amal", { x: 640, y: 900, s: 1.64, arms: "up" })}`,

  // 5 "In October we pick mangoes. I drew a whole basket."
  `${gardenScene()}${mango(1180, 660, 1.3)}${basketProp(1360, 906, 1.1, { kind: "fruit" })}
   ${figure("amal", { x: 700, y: 900, s: 1.68, arms: "up" })}`,

  // 6 "Can I make a calendar too?" asked Sami
  `${classroomScene()}${desk(1180, 950, 1.3, { item: notepad(0, 0, 0.55) })}
   ${figure("sami", { x: 700, y: 950, s: 1.7, arms: "up" })}`,

  // 7 "Of course. First write the months in order."
  `${classroomScene()}${monthWall(886, 380, 0.8, { columns: 4, highlight: 0 })}
   ${figure("amal", { x: 340, y: 950, s: 1.66, arms: "point" })}`,

  // 8 Sami's June was not my June: his grandfather takes him out in the boat
  `${coastScene()}${sailboat(1180, 600, 1.25)}
   ${figure("sami", { x: 660, y: 930, s: 1.7, arms: "up" })}`,

  // 9 his August was not my August: his baby cousin was born in it
  `${homeScene()}${roomBox(1250, 640, 1.1, "living")}
   ${figure("sami", { x: 640, y: 950, s: 1.68 })}
   ${figure("mina", { x: 900, y: 952, s: 1.2 })}`,

  // 10 and his December had a fishing net right across the page
  `${coastScene()}${shells(1180, 934, 1.05)}${ferryBoat(1320, 600, 0.95)}
   ${figure("sami", { x: 660, y: 930, s: 1.68, holding: heldPaper })}`,

  // 11 twelve months, the same twelve, and two completely different years
  `${classroomScene()}${monthWall(886, 380, 0.8, { columns: 4, highlight: 11 })}
   ${figure("amal", { x: 330, y: 950, s: 1.62 })}
   ${figure("sami", { x: 1340, y: 950, s: 1.58 })}`,

  // 12 we hung both calendars on the wall, side by side
  `${classroomScene()}${calendarBoard(1080, 660, 1, { ring: 24 })}${calendarBoard(1360, 660, 1, { ring: 9 })}
   ${figure("amal", { x: 520, y: 950, s: 1.66, arms: "up" })}
   ${figure("sami", { x: 760, y: 950, s: 1.6, arms: "up" })}`,
];

// ================================================================ Book 4
// Friday at the Market — Unit 4: "At the Market"

const fridayMarketPages = [
  // 1 cover: the three of them at the gate at eight o'clock
  `${townScene()}${signPost(1300, 900, 0.9, { label: "MARKET", colour: G3.plum })}${hourClock(400, 330, 1.3, { hour: 8 })}
   ${figure("mum", { x: 660, y: 918, s: 1.62 })}
   ${figure("amal", { x: 880, y: 918, s: 1.6, holding: heldBasket })}
   ${figure("sami", { x: 1080, y: 918, s: 1.56 })}`,

  // 2 "Where are we going?" - "To the market. On Friday my mother always goes."
  `${streetScene()}${lampPost(1330, 890, 1.1)}
   ${figure("sami", { x: 660, y: 890, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 900, y: 890, s: 1.62 })}`,

  // 3 "Is it busy on Fridays?" - "Very."
  `${townScene()}${marketStall(1120, 890, 0.94)}${marketStall(1400, 890, 0.72)}
   ${figure("omar", { x: 1010, y: 918, s: 1.54 })}
   ${figure("nora", { x: 780, y: 918, s: 1.5 })}
   ${figure("theo", { x: 600, y: 918, s: 1.52 })}
   ${figure("amal", { x: 420, y: 918, s: 1.58 })}`,

  // 4 "What do you buy?" - "Bananas and rice."
  `${townScene()}${marketStall(1140, 890, 0.9)}${basketProp(860, 916, 1.1, { kind: "grain" })}
   ${figure("mum", { x: 640, y: 918, s: 1.62 })}
   ${figure("amal", { x: 1010, y: 918, s: 1.56 })}`,

  // 5 "I like markets because they are noisy and full of life."
  `${townScene()}${marketStall(1180, 890, 0.86)}${dustPuffs(900, 930)}
   ${figure("sami", { x: 660, y: 918, s: 1.68, arms: "up" })}`,

  // 6 "I like the colours: yellow, red and green, everywhere you look."
  `${townScene()}${basketProp(1080, 916, 1.2, { kind: "fruit" })}${basketProp(1320, 916, 1.05, { kind: "fruit" })}${mango(420, 660, 1.15)}
   ${figure("amal", { x: 760, y: 918, s: 1.68, arms: "up" })}`,

  // 7 "Do you ever get lost in such a big crowd?"
  `${townScene()}${marketStall(1200, 890, 0.82)}${marketStall(360, 890, 0.68)}
   ${figure("sami", { x: 700, y: 918, s: 1.66, mood: "surprised" })}
   ${figure("amal", { x: 940, y: 918, s: 1.58 })}`,

  // 8 "Not really. I hold my mother's hand and stay beside her."
  `${townScene()}${marketStall(1240, 890, 0.8)}
   ${figure("mum", { x: 700, y: 918, s: 1.62 })}
   ${figure("amal", { x: 900, y: 918, s: 1.58 })}`,

  // 9 "Meet us at the gate at eight. And bring a basket for the rice."
  `${townScene()}${signPost(1220, 900, 0.94, { label: "GATE", colour: G3.teal })}${hourClock(420, 330, 1.3, { hour: 8 })}
   ${figure("amal", { x: 800, y: 918, s: 1.68, arms: "point" })}`,

  // 10 so Sami came with the biggest basket in his house
  `${townScene()}${basketProp(1120, 916, 1.5, { kind: "empty" })}
   ${figure("sami", { x: 700, y: 918, s: 1.7, arms: "up" })}`,

  // 11 we filled it, and then we could hardly carry it
  `${townScene()}${marketStall(340, 890, 0.78)}${basketProp(1000, 916, 1.45, { kind: "grain" })}${dustPuffs(760, 940)}
   ${figure("sami", { x: 800, y: 918, s: 1.66, arms: "up" })}
   ${figure("amal", { x: 1200, y: 918, s: 1.6, arms: "up" })}`,

  // 12 a crowd with no plan; a Friday morning with one
  `${sunsetScene()}${marketStall(1260, 890, 0.82)}
   ${figure("mum", { x: 620, y: 900, s: 1.6 })}
   ${figure("amal", { x: 840, y: 900, s: 1.62 })}
   ${figure("sami", { x: 1040, y: 900, s: 1.56 })}`,
];

// ================================================================ Book 5
// The Night the Wall Shook — Unit 5: "What Happened?"

const wallShookPages = [
  // 1 cover: the reading wall under a dark sky
  `${stormScene()}${gardenWall(1080, 890, 0.9, { length: 500 })}${motionArcs(560, 700, 1.3)}
   ${figure("sami", { x: 620, y: 900, s: 1.72, mood: "surprised" })}`,

  // 2 "Let me tell you what happened yesterday," said Sami
  `${classroomScene()}${desk(1200, 950, 1.3)}
   ${figure("sami", { x: 660, y: 950, s: 1.7, arms: "point" })}
   ${figure("nora", { x: 920, y: 950, s: 1.56 })}`,

  // 3 "The wind blew hard, and the wall began to shake."
  `${stormScene()}${gardenWall(1060, 890, 0.86, { length: 460 })}${motionArcs(520, 660, 1.35)}
   ${figure("sami", { x: 640, y: 900, s: 1.68, mood: "surprised" })}`,

  // 4 "I was standing by the garden when I heard the creaking."
  `${stormScene()}${gardenPlant(1300, 890, 1.05)}${seedRow(420, 906, 1.05)}
   ${figure("sami", { x: 780, y: 900, s: 1.7 })}`,

  // 5 "What did you do?" - "We ran to hold the frame."
  `${stormScene()}${gardenWall(1080, 890, 0.86, { length: 460 })}${dustPuffs(760, 930)}
   ${figure("sami", { x: 700, y: 900, s: 1.68, arms: "up" })}
   ${figure("leo", { x: 940, y: 900, s: 1.6, arms: "up" })}`,

  // 6 "Leo grabbed one side, and I grabbed the other."
  `${stormScene()}${gardenWall(880, 890, 0.94, { length: 520 })}
   ${figure("leo", { x: 520, y: 900, s: 1.66, arms: "up" })}
   ${figure("sami", { x: 1240, y: 900, s: 1.66, arms: "up" })}`,

  // 7 "We held on until the wind slowed down again."
  `${stormScene()}${gardenWall(1060, 890, 0.9, { length: 480 })}${motionArcs(480, 720, 1.15)}
   ${figure("sami", { x: 680, y: 900, s: 1.7, arms: "up" })}`,

  // 8 "Did it fall?" - "No. But we did not complete the support in time."
  `${gardenScene()}${gardenWall(1080, 890, 0.9, { length: 480 })}${flatStone(560, 906, 1.2)}
   ${figure("sami", { x: 700, y: 900, s: 1.68, mood: "sad" })}`,

  // 9 "The frame still needs more stones underneath it."
  `${gardenScene()}${gardenWall(1100, 890, 0.86, { length: 440 })}${flatStone(520, 906, 1.3)}${flatStone(680, 912, 1.05)}
   ${figure("leo", { x: 860, y: 900, s: 1.66, arms: "point" })}`,

  // 10 "What will you do differently?" - "Add more stones."
  `${gardenScene()}${flatStone(1120, 906, 1.35)}${flatStone(1300, 912, 1.1)}${ladder(400, 900, 1.05)}
   ${figure("sami", { x: 760, y: 900, s: 1.68 })}
   ${figure("nora", { x: 960, y: 900, s: 1.56, arms: "point" })}`,

  // 11 "Can I help after school?" - "Two pairs of hands finish faster."
  `${gardenScene()}${gardenWall(1120, 890, 0.86, { length: 440 })}
   ${figure("sami", { x: 640, y: 900, s: 1.68, arms: "up" })}
   ${figure("nora", { x: 880, y: 900, s: 1.58, arms: "up" })}`,

  // 12 we finished on the Thursday, and the next wind did not shake it
  `${gardenScene()}${gardenWall(1080, 890, 0.94, { length: 520 })}${gardenPlant(420, 890, 1.1)}
   ${figure("sami", { x: 660, y: 900, s: 1.68 })}
   ${figure("leo", { x: 880, y: 900, s: 1.58 })}
   ${figure("yasmin", { x: 340, y: 900, s: 1.56 })}`,
];

// ================================================================ Book 6
// Who Is Kinder? — Unit 6: "Who Is Kinder?"

const whoIsKinderPages = [
  // 1 cover: Sami and Leo, arguing cheerfully
  `${yardScene()}${bench(1240, 940, 1.35)}
   ${figure("sami", { x: 640, y: 900, s: 1.74, arms: "point" })}
   ${figure("leo", { x: 920, y: 900, s: 1.7, arms: "point" })}`,

  // 2 "My brother is kind to everybody. He shares his snacks."
  `${yardScene()}${bench(400, 940, 1.3)}${fruitBowl(1180, 930, 1.15)}
   ${figure("sami", { x: 700, y: 900, s: 1.7, arms: "up" })}
   ${figure("theo", { x: 950, y: 900, s: 1.56 })}`,

  // 3 "He never says an unkind word, even to the noisiest pupils."
  `${classroomScene()}${desk(1200, 950, 1.28)}
   ${figure("theo", { x: 680, y: 950, s: 1.66 })}
   ${figure("daniel", { x: 920, y: 950, s: 1.56 })}`,

  // 4 "That is nice," said Leo, "but my brother is kinder than yours."
  `${yardScene()}
   ${figure("leo", { x: 680, y: 900, s: 1.72, arms: "point" })}
   ${figure("sami", { x: 950, y: 900, s: 1.64, mood: "surprised" })}`,

  // 5 "He carries our neighbour's shopping every Friday."
  `${streetScene()}${basketProp(1120, 886, 1.2, { kind: "grain" })}${lampPost(1400, 890, 1.05)}
   ${figure("noah", { x: 940, y: 890, s: 1.68, arms: "up" })}
   ${figure("hana", { x: 660, y: 890, s: 1.56 })}`,

  // 6 "Does your brother help at school as well?"
  `${yardScene()}${schoolBell(1220, 640, 1.05)}
   ${figure("sami", { x: 660, y: 900, s: 1.68, arms: "point" })}
   ${figure("leo", { x: 920, y: 900, s: 1.66 })}`,

  // 7 "Of course. The younger pupils follow him at break."
  `${yardScene()}${playBall(1300, 936, 1.15)}
   ${figure("noah", { x: 620, y: 900, s: 1.7, arms: "up" })}
   ${figure("mina", { x: 860, y: 902, s: 1.24 })}
   ${figure("idris", { x: 1020, y: 900, s: 1.34 })}`,

  // 8 "All right. But is your brother strong as well as kind?"
  `${yardScene()}${bench(420, 940, 1.3)}
   ${figure("sami", { x: 720, y: 900, s: 1.7, arms: "point" })}
   ${figure("leo", { x: 980, y: 900, s: 1.66 })}`,

  // 9 "He could carry ten bags of rice when he was twelve!"
  `${townScene()}${basketProp(1120, 916, 1.35, { kind: "grain" })}${basketProp(1330, 916, 1.15, { kind: "grain" })}
   ${figure("leo", { x: 700, y: 918, s: 1.7, arms: "up" })}`,

  // 10 "That is impressive. But kindness matters more than strength."
  `${yardScene()}
   ${figure("sami", { x: 680, y: 900, s: 1.7 })}
   ${figure("leo", { x: 940, y: 900, s: 1.66 })}`,

  // 11 "I agree," said Leo - and there was nothing left to win
  `${yardScene()}${acacia(400, 660, 1.15)}${bench(1220, 940, 1.3)}
   ${figure("leo", { x: 700, y: 900, s: 1.68 })}
   ${figure("sami", { x: 940, y: 900, s: 1.66 })}`,

  // 12 "Then we are both lucky." And they went to carry something.
  `${sunsetScene()}${basketProp(1180, 906, 1.15, { kind: "fruit" })}
   ${figure("sami", { x: 660, y: 900, s: 1.68, arms: "up" })}
   ${figure("leo", { x: 900, y: 900, s: 1.66, arms: "up" })}`,
];

// ================================================================ Book 7
// Have You Ever? — Unit 7: "Have You Ever…?"

const haveYouEverPages = [
  // 1 cover: the three of them swapping stories
  `${forestScene()}
   ${figure("nora", { x: 620, y: 950, s: 1.7 })}
   ${figure("amal", { x: 860, y: 950, s: 1.72 })}
   ${figure("leo", { x: 1100, y: 950, s: 1.64 })}`,

  // 2 "Have you ever explored a forest?" asked Nora
  `${forestScene()}
   ${figure("nora", { x: 680, y: 950, s: 1.72, arms: "point" })}
   ${figure("amal", { x: 950, y: 950, s: 1.62 })}`,

  // 3 "Yes, I have. I walked under the tall trees last year."
  `${forestScene()}${wildBird(1240, 460, 1.15, true)}
   ${figure("leo", { x: 720, y: 950, s: 1.72, arms: "up" })}`,

  // 4 "No, I haven't. I have only seen pictures."
  `${classroomScene()}${photoFrame(1200, 700, 1.15, { inner: acacia(0, 60, 0.42) })}
   ${figure("amal", { x: 700, y: 950, s: 1.7, mood: "sad" })}`,

  // 5 "It smells like rain and leaves," said Nora
  `${forestScene()}${river(1120, 900, 1.25)}
   ${figure("nora", { x: 660, y: 950, s: 1.72 })}`,

  // 6 "Have you ever visited the mountains, Amal?" - "No, I haven't."
  `${mountainScene()}
   ${figure("nora", { x: 660, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 920, y: 950, s: 1.68 })}`,

  // 7 "But I have seen a photograph of snow on a mountain top."
  `${classroomScene()}${photoFrame(1200, 700, 1.2, { inner: frostPatch(0, 40, 0.7) })}
   ${figure("amal", { x: 700, y: 950, s: 1.7, arms: "point" })}`,

  // 8 "I have climbed one. The path was steep, but the view..."
  `${mountainScene()}${cloudPuff(1220, 250, 1.25)}
   ${figure("nora", { x: 700, y: 950, s: 1.74, arms: "up" })}`,

  // 9 "Has anybody explored the rock pools?" asked Leo
  `${coastScene()}${shells(1180, 934, 1.05)}
   ${figure("leo", { x: 660, y: 930, s: 1.7, arms: "point" })}`,

  // 10 "I have. I found tiny crabs and shiny stones."
  `${coastScene()}${shells(1120, 930, 1.25)}${flatStone(1360, 926, 1.15)}
   ${figure("nora", { x: 660, y: 930, s: 1.7, holding: heldShell })}`,

  // 11 "Have you ever seen sunshine make a rainbow?" - "Yes, I have."
  `${coastScene()}${rainbow(1120, 380)}
   ${figure("amal", { x: 620, y: 930, s: 1.7, arms: "up" })}
   ${figure("leo", { x: 880, y: 930, s: 1.64, arms: "up" })}`,

  // 12 I have not done half of these things - but not yet is not never
  `${sunsetScene()}${mountainScene0()}
   ${figure("amal", { x: 700, y: 950, s: 1.74 })}
   ${figure("nora", { x: 950, y: 950, s: 1.6 })}`,
];

// The mountain, drawn as a distant silhouette for the last page: the sunset
// scene owns the sky there, so only the ridge line is wanted.
function mountainScene0() {
  return `<path d="M 900 700 L 1180 420 L 1460 700 Z" fill="${G3.mountainDark}" opacity="0.55"/>
    <path d="M 1180 420 L 1240 500 q -60 30 -120 0 z" fill="${G3.snow}" opacity="0.75"/>`;
}

// ================================================================ Book 8
// Ten to a Million — Unit 8: "Numbers Big and Small"

const tenToMillionPages = [
  // 1 cover: the whole ladder, and Amal at the bottom of it
  `${classroomScene()}${numberLadder(880, 610, 0.52, { lit: 6 })}
   ${figure("amal", { x: 340, y: 950, s: 1.76, arms: "up" })}`,

  // 2 "Let's count big numbers. Start small, and we will grow."
  `${classroomScene({ boardText: "sums" })}
   ${figure("yasmin", { x: 780, y: 950, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 1060, y: 950, s: 1.58 })}`,

  // 3 "Ten. That is easy - like ten fingers."
  `${classroomScene()}${numberLadder(900, 900, 0.5, { lit: 1 })}
   ${figure("amal", { x: 340, y: 950, s: 1.7, arms: "up" })}`,

  // 4 "Now one hundred. That is ten groups of ten."
  `${classroomScene()}${numberLadder(900, 900, 0.5, { lit: 2 })}${tensLine(400, 800, 0.9)}
   ${figure("amal", { x: 340, y: 950, s: 1.66 })}`,

  // 5 "Next, one thousand. Imagine a thousand shells on the beach."
  `${coastScene()}${shells(1120, 930, 1.35, { count: 14 })}${shells(700, 950, 1.1, { count: 9 })}
   ${figure("amal", { x: 400, y: 930, s: 1.68, holding: heldShell })}`,

  // 6 I tried to imagine them, and they did not fit on the sand
  `${coastScene()}${shells(1000, 926, 1.5, { count: 16 })}
   ${figure("amal", { x: 420, y: 930, s: 1.7, mood: "surprised" })}`,

  // 7 "Then ten thousand, which is ten groups of one thousand."
  `${classroomScene()}${numberLadder(900, 900, 0.5, { lit: 4 })}
   ${figure("amal", { x: 340, y: 950, s: 1.66 })}`,

  // 8 "After that, one hundred thousand."
  `${classroomScene()}${numberLadder(900, 900, 0.5, { lit: 5 })}
   ${figure("yasmin", { x: 340, y: 950, s: 1.62, arms: "point" })}`,

  // 9 "And finally - one million."
  `${classroomScene()}${numberLadder(900, 900, 0.5, { lit: 6 })}
   ${figure("amal", { x: 340, y: 950, s: 1.7, mood: "surprised" })}`,

  // 10 "One million!" I shouted. "That is the biggest one we said!"
  `${classroomScene()}${numberLadder(900, 900, 0.5, { lit: 6 })}${confetti(700, 520)}
   ${figure("amal", { x: 340, y: 950, s: 1.74, arms: "up" })}`,

  // 11 "A million is one thousand thousands."
  `${classroomScene()}${patternStrip(1180, 700, 1.2, { kinds: ["square", "circle"], cells: 4, blankLast: false })}
   ${figure("yasmin", { x: 620, y: 950, s: 1.66, arms: "point" })}
   ${figure("amal", { x: 900, y: 950, s: 1.58 })}`,

  // 12 ten, one hundred, one thousand, ten thousand, a hundred thousand, a million
  `${coastScene()}${numberLadder(880, 880, 0.46, { lit: 6 })}${shells(420, 950, 1.05)}
   ${figure("amal", { x: 330, y: 930, s: 1.7, arms: "up" })}`,
];

// ================================================================ Book 9
// Everyone Gets a Turn — Unit 9: "A Group Discussion"

const everyoneTurnPages = [
  // 1 cover: the class planning the garden together
  `${classroomScene()}${gardenPlant(1330, 946, 1.1)}
   ${figure("leo", { x: 520, y: 950, s: 1.6 })}
   ${figure("maya", { x: 720, y: 950, s: 1.58 })}
   ${figure("adam", { x: 920, y: 950, s: 1.58 })}
   ${figure("yasmin", { x: 1140, y: 950, s: 1.62 })}`,

  // 2 "Suggest an idea, and allow everyone a turn before we choose."
  `${classroomScene()}${poster(1250, 690, 1.05, { colour: G3.leafy, lines: 4 })}
   ${figure("yasmin", { x: 640, y: 950, s: 1.68, arms: "point" })}
   ${figure("maya", { x: 920, y: 950, s: 1.56 })}`,

  // 3 "I suggest tomatoes, because we can eat them at lunch."
  `${classroomScene()}${plantStage(1220, 946, 1.5, "flower")}
   ${figure("leo", { x: 700, y: 950, s: 1.7, arms: "up" })}`,

  // 4 "And they do not need much space."
  `${gardenScene()}${seedRow(1120, 906, 1.15)}
   ${figure("leo", { x: 700, y: 900, s: 1.68, arms: "point" })}`,

  // 5 "Flowers too, so the bees have somewhere to visit."
  `${gardenScene()}${gardenPlant(1140, 890, 1.35)}
   ${figure("maya", { x: 700, y: 900, s: 1.7, arms: "up" })}`,

  // 6 "Could we grow herbs? My grandmother says mint is easy."
  `${classroomScene()}${plantStage(1240, 946, 1.35, "sprout")}
   ${figure("adam", { x: 700, y: 950, s: 1.7, arms: "point" })}`,

  // 7 "I like how each of you gave a reason for your idea."
  `${classroomScene()}${notepad(1220, 790, 1.25)}
   ${figure("yasmin", { x: 660, y: 950, s: 1.68 })}
   ${figure("leo", { x: 940, y: 950, s: 1.56 })}`,

  // 8 "Can we vote?" asked Leo. "That is a sensible suggestion."
  `${classroomScene()}
   ${figure("leo", { x: 520, y: 950, s: 1.6, arms: "up" })}
   ${figure("maya", { x: 740, y: 950, s: 1.58, arms: "up" })}
   ${figure("adam", { x: 950, y: 950, s: 1.58, arms: "up" })}
   ${figure("yasmin", { x: 1180, y: 950, s: 1.62, arms: "point" })}`,

  // 9 hands up for flowers, hands up for tomatoes, hands up for mint
  `${classroomScene()}${patternStrip(1240, 700, 1.1, { kinds: ["circle", "square"], cells: 3, blankLast: false })}
   ${figure("nora", { x: 560, y: 950, s: 1.56, arms: "up" })}
   ${figure("amal", { x: 760, y: 950, s: 1.6, arms: "up" })}
   ${figure("theo", { x: 960, y: 950, s: 1.56, arms: "up" })}`,

  // 10 every idea got a turn, so every idea got some ground
  `${gardenScene()}${seedRow(880, 906, 1.35)}${gardenPlant(1320, 890, 1.05)}
   ${figure("amal", { x: 520, y: 900, s: 1.62 })}
   ${figure("maya", { x: 720, y: 900, s: 1.56 })}`,

  // 11 "I hope we plant this week. The weather looks sunny."
  `${gardenScene()}${wateringCan(1180, 890, 1.3)}
   ${figure("maya", { x: 700, y: 900, s: 1.7, arms: "up" })}`,

  // 12 we started on Friday: tomatoes, flowers and mint, in three rows
  `${gardenScene()}${seedRow(1060, 906, 1.3)}${gardenPlant(1380, 890, 1.05)}${wateringCan(400, 890, 1.1)}
   ${figure("leo", { x: 620, y: 900, s: 1.6 })}
   ${figure("maya", { x: 820, y: 900, s: 1.58 })}
   ${figure("adam", { x: 1000, y: 900, s: 1.58 })}`,
];

// ================================================================ Book 10
// Showcase Day — Unit 10: "Planning the Showcase" and "Showcase Day"

const showcaseDayPages = [
  // 1 cover: the display tables in the school garden
  `${gardenScene()}${bunting(800, 200, 1.25, { span: 1300 })}${desk(1180, 900, 1.3, { item: folderProp(0, 0, 0.55) })}
   ${figure("amal", { x: 660, y: 900, s: 1.76, holding: heldFolder })}
   ${figure("nora", { x: 900, y: 900, s: 1.58 })}`,

  // 2 "One week left. Let us plan carefully."
  `${classroomScene()}${calendarBoard(1230, 660, 1.05, { ring: 26 })}
   ${figure("yasmin", { x: 640, y: 950, s: 1.68, arms: "point" })}
   ${figure("amal", { x: 920, y: 950, s: 1.56 })}`,

  // 3 "Where will the tables go?" - "In the garden, if it stays dry."
  `${gardenScene()}${desk(1160, 900, 1.3)}${desk(1400, 900, 1.15)}
   ${figure("amal", { x: 640, y: 900, s: 1.66, arms: "point" })}
   ${figure("yasmin", { x: 880, y: 900, s: 1.62 })}`,

  // 4 Maya measured the long table: two metres and forty centimetres
  `${gardenScene()}${desk(1140, 900, 1.32)}${metreStick(880, 896, 1.25)}
   ${figure("maya", { x: 660, y: 900, s: 1.68, holding: heldPaper })}`,

  // 5 "Then six booklets fit, with a gap between each."
  `${gardenScene()}${desk(1120, 900, 1.34, { item: folderProp(0, 0, 0.5) })}${patternStrip(600, 720, 1.05, { kinds: ["square"], cells: 4, blankLast: false })}
   ${figure("sami", { x: 820, y: 900, s: 1.66, arms: "point" })}`,

  // 6 twenty-eight chairs, because every parent had answered
  `${gardenScene()}${bench(1100, 900, 1.4)}${bench(1380, 906, 1.25)}${bench(420, 900, 1.3)}
   ${figure("nora", { x: 760, y: 900, s: 1.66, holding: heldPaper })}`,

  // 7 Sami and Leo built the folder stand out of the strong boxes
  `${gardenScene()}${folderProp(1200, 880, 1.25)}${ladder(1400, 900, 1)}
   ${figure("sami", { x: 680, y: 900, s: 1.68, arms: "up" })}
   ${figure("leo", { x: 920, y: 900, s: 1.6, arms: "up" })}`,

  // 8 "And if the heavy rain comes back?" - "Then we move to the library."
  `${streetScene({ rainy: true })}${rain()}${libraryBuilding(1180, 890, 1.1)}
   ${figure("yasmin", { x: 640, y: 890, s: 1.66, arms: "point" })}`,

  // 9 on the evening itself, I presented first
  `${gardenScene()}${bunting(800, 200, 1.2, { span: 1240 })}${desk(1180, 900, 1.28, { item: folderProp(0, 0, 0.5) })}
   ${figure("amal", { x: 700, y: 900, s: 1.76, holding: heldPaper })}`,

  // 10 Grandma Hana asked which page I was proudest of
  `${gardenScene()}${poster(1300, 700, 1, { colour: G3.gold, lines: 3 })}
   ${figure("hana", { x: 660, y: 900, s: 1.64, arms: "point" })}
   ${figure("amal", { x: 940, y: 900, s: 1.62 })}`,

  // 11 Doctor Sarah asked which page had been hardest
  `${gardenScene()}${thermometerProp(1320, 900, 1.2, { level: 0.6 })}${poster(1120, 700, 0.95, { colour: G3.sky, lines: 5 })}
   ${figure("sarah", { x: 640, y: 900, s: 1.62 })}
   ${figure("amal", { x: 880, y: 900, s: 1.6 })}`,

  // 12 then my goal for Grade 4, said out loud to the whole garden
  `${sunsetScene()}${bunting(800, 200, 1.2, { span: 1240 })}${confetti(820, 560)}
   ${figure("yasmin", { x: 340, y: 900, s: 1.6 })}
   ${figure("amal", { x: 700, y: 900, s: 1.8, arms: "up" })}
   ${figure("nora", { x: 960, y: 900, s: 1.58, arms: "up" })}
   ${figure("hana", { x: 1180, y: 900, s: 1.56 })}`,
];

// ---------------------------------------------------------------- write files

const books = {
  "voices": { dir: "minas-two-voices", pages: twoVoicesPages },
  "library": { dir: "the-quietest-room", pages: quietestRoomPages },
  "calendar": { dir: "samis-calendar", pages: samiCalendarPages },
  "market": { dir: "friday-at-the-market", pages: fridayMarketPages },
  "wall": { dir: "the-night-the-wall-shook", pages: wallShookPages },
  "kinder": { dir: "who-is-kinder", pages: whoIsKinderPages },
  "ever": { dir: "have-you-ever", pages: haveYouEverPages },
  "million": { dir: "ten-to-a-million", pages: tenToMillionPages },
  "turn": { dir: "everyone-gets-a-turn", pages: everyoneTurnPages },
  "showcase": { dir: "showcase-day", pages: showcaseDayPages },
};

writeBooks(books, process.argv[2]);
