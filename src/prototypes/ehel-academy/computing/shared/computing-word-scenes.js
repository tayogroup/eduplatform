// An interactive WebGL explainer for each Computing vocabulary word.
//
// Modelled on computing-word-pictures.js, which gives a word card a picture
// only where an emoji can honestly BE the word — and found that most of this
// vocabulary is abstract and has no honest picture. An animated scene reaches
// the words a still picture cannot: nothing pictures "debug", but a model that
// runs a program into its wrong step, swaps the step and runs again IS
// debugging. Same for repeat, backup, predict, wireless, tally. The scene
// shows the behaviour the word names, which in computing is almost always the
// meaning.
//
// This also recovers words the picture map deliberately excluded. "bug" has no
// emoji because 🐛 would teach a five-year-old that a bug is a caterpillar —
// but a robot visibly following one wrong step teaches exactly what it is.
// Likewise "malware": 🦠 is the biological virus, while a red program copying
// itself until the device's real work stops is the honest mechanism.
//
// Each entry names a scene in computing-webgl.js and carries its own caption:
// scenes are shared between words that name the same behaviour (algorithm,
// instruction, order and program all show a sequence running), and the caption
// is what ties the shared scene to THIS word. tools/check-computing-webgl-scenes.mjs
// holds the two files together — every scene named here must render geometry —
// and checks that every Grade 1-4 vocabulary word resolves to an entry (the
// grades whose word card shows the explainer; Stages 5-8 keep their design).
//
// The card shows ONE word at a time, so this is one live WebGL context per
// page. Do not render these into the deck half: its slides are all in the DOM
// at once, and a 15-word unit would be 15 contexts against a browser cap of
// about sixteen — the same arithmetic that keeps deck diagrams flat.

const esc = (value = "") => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const COMPUTING_WORD_SCENES = {
  // --- steps a computer follows --------------------------------------------
  algorithm: { scene: "sequence", caption: "An algorithm is a set of steps in the right order. Watch the runner do each step, first to last." },
  instruction: { scene: "sequence", caption: "Each block is one instruction — one small thing to do. The runner does one at a time." },
  order: { scene: "sequence", caption: "The steps run in order, first to last. Change the order and you change what happens." },
  program: { scene: "sequence", caption: "A program is steps written for a computer. Watch it run them one at a time, top to bottom." },
  app: { scene: "sequence", caption: "An app is a program — a set of steps the computer follows. Watch the steps run in order." },
  run: { scene: "sequence", caption: "Run means go! Watch the program start at the first step and keep going to the end." },
  step: { scene: "sequence", caption: "A step is one thing the program does. Watch the runner take them one at a time." },
  "start program": { scene: "sequence", caption: "Start program begins the run: the very first step goes first." },
  "stop program": { scene: "sequence", caption: "Stop program ends the run. After it, no more steps happen." },
  page: { scene: "sequence", caption: "A story's pages come one after another, in order — the program moves from one page to the next." },
  repeat: { scene: "loop", caption: "Repeat means do it again. Watch the ball go round the same steps and the counter climb with each lap." },
  precise: { scene: "precise", caption: "Precise means exact. Both robots get the same steps — the precise one follows them exactly and reaches the goal." },
  predict: { scene: "predict", caption: "Predicting is saying what the program will do BEFORE you run it. The grey ghost is the guess; the runner shows the truth." },

  // --- blocks and the things they move -------------------------------------
  scratchjr: { scene: "blocks", caption: "In ScratchJr you snap blocks together to make a program. Run it and the character obeys." },
  block: { scene: "blocks", caption: "Each block is one instruction. Snap blocks together to build a program, then run it." },
  character: { scene: "blocks", caption: "The character does what your blocks tell it. Run the program and watch it move." },
  code: { scene: "blocks", caption: "Code is instructions written so a computer can follow them. Watch the blocks snap together and run." },
  "say block": { scene: "blocks", caption: "The Say block makes your character show a message when the program reaches it — watch for it at the end." },

  // --- when programs go wrong ----------------------------------------------
  bug: { scene: "bugdebug", caption: "A bug is a mistake in a program — one wrong step. Watch the runner follow it and come off the path." },
  debug: { scene: "bugdebug", caption: "Debugging is finding the wrong step and fixing it. Watch the bad step swap out, then the run works." },
  test: { scene: "bugdebug", caption: "Testing is running your program and watching carefully. That is how you find the step that is wrong." },

  // --- robots and moving about ---------------------------------------------
  robot: { scene: "robot", caption: "A robot is a machine that follows a program. Watch it do exactly the steps it was given." },
  "move forward": { scene: "robot", caption: "Move forward takes the robot one square at a time — exactly as many squares as you say." },
  "turn left / right": { scene: "robot", caption: "Turning changes which way the robot faces. Then moving forward goes the new way." },
  "turn left": { scene: "robot", caption: "Turn left changes which way the robot faces. Then moving forward goes the new way." },
  "turn right": { scene: "robot", caption: "Turn right changes which way the robot faces. Then moving forward goes the new way." },
  "step up": { scene: "robot", caption: "A step block moves the robot one square in the direction you choose. Watch it follow the squares." },
  "step down": { scene: "robot", caption: "A step block moves the robot one square in the direction you choose. Watch it follow the squares." },
  "step left": { scene: "robot", caption: "A step block moves the robot one square in the direction you choose. Watch it follow the squares." },
  "step right": { scene: "robot", caption: "A step block moves the robot one square in the direction you choose. Watch it follow the squares." },
  real: { scene: "realfictional", caption: "Real robots are machines doing jobs, like the arm moving its load. They only do what their program says." },
  fictional: { scene: "realfictional", caption: "Fictional robots live in stories. This one floats with nothing holding it up — real robots cannot do that." },

  // --- drawing with a marker ------------------------------------------------
  "marker down / up": { scene: "marker", caption: "Marker down draws as it moves; marker up lifts and moves without drawing. That is why the trail has a gap." },
  "marker down": { scene: "marker", caption: "Marker down means the pen touches the floor and draws a line as it moves." },
  "marker up": { scene: "marker", caption: "Marker up lifts the pen, so it moves without drawing — watch the gap it leaves." },
  path: { scene: "marker", caption: "The path is the line your moves make. Watch the trail appear behind the marker." },

  // --- data ------------------------------------------------------------------
  data: { scene: "grouping", caption: "Data is information you collect. Watch each piece being gathered into the group where it belongs." },
  group: { scene: "grouping", caption: "Grouping puts things that belong together into the same set. Watch each one fly to its group." },
  sort: { scene: "sort", caption: "Sorting puts things in order. Watch the bars compare and swap until they line up." },
  tally: { scene: "tally", caption: "A tally is one mark for each thing you count — and the fifth mark crosses the four, making a bundle of five." },
  pictogram: { scene: "pictogram", caption: "A pictogram shows counts with little pictures. A longer row means a bigger count." },
  "bar graph": { scene: "bargraph", caption: "A bar graph shows counts as bars. Watch each bar grow as more things are counted." },
  present: { scene: "bargraph", caption: "Presenting data means showing it so people can read it at a glance — like these growing bars." },
  "data scientist": { scene: "bargraph", caption: "A data scientist collects data and turns it into pictures like this, to find the story hiding in the numbers." },
  question: { scene: "questions", caption: "Some questions have one right answer. Others get a different answer from everybody — watch both kinds." },
  "statistical question": { scene: "questions", caption: "A statistical question gets many different answers — everybody answers differently, so you collect the answers as data." },
  "non-statistical question": { scene: "questions", caption: "A non-statistical question has just one right answer. One question, one answer — nothing to collect." },
  "numerical data": { scene: "datatypes", caption: "Numerical data is numbers — things you can count or measure, like the columns growing on the left." },
  "categorical data": { scene: "datatypes", caption: "Categorical data is named groups — like the coloured sets on the right. You sort things into them, not measure them." },
  form: { scene: "database", caption: "A form collects answers. Each filled-in form becomes one record — one row in the table." },
  store: { scene: "storage", caption: "Storing means keeping data safe so you can use it later. Watch the file go in and the light show it is kept." },
  backup: { scene: "storage", caption: "A backup is a second copy kept somewhere else. If the first copy is lost, the backup is still safe." },
  barcode: { scene: "barcode", caption: "A barcode's stripes hold a number. Watch the red scanner line sweep across and read it out." },

  // --- machines --------------------------------------------------------------
  computer: { scene: "general", caption: "Every computer does the same three things: takes something in, works on it, and puts something out." },
  input: { scene: "general", caption: "Input goes INTO the computer — watch the ball carry it in from the left." },
  output: { scene: "general", caption: "Output comes OUT of the computer when the work is done — watch it leave on the right." },
  "digital device": { scene: "devices", caption: "A digital device is a machine with a computer inside — a desktop, a laptop, a tablet, a phone." },
  device: { scene: "devices", caption: "A device is a machine you use to do a job — here are four with a computer inside." },
  portable: { scene: "devices", caption: "Portable means easy to pick up and carry. Watch the small devices move about while the desktop stays put." },
  hardware: { scene: "hardwaresoftware", caption: "Hardware is the parts you can touch — the box, the screen, the keyboard." },
  software: { scene: "hardwaresoftware", caption: "Software is the instructions flowing inside the hardware. You cannot touch it, but it makes everything work." },

  // --- the network -----------------------------------------------------------
  network: { scene: "network", caption: "A network is devices joined together so they can share. Watch the messages travel out and back." },
  connect: { scene: "network", caption: "Connecting joins a device to the others. Once joined, data can run along every link." },
  "smart device": { scene: "network", caption: "A smart device is connected to the network, so it can send and receive — watch the traffic." },
  internet: { scene: "network", caption: "The internet is millions of networks joined together, all passing messages like this." },
  share: { scene: "packets", caption: "Sharing sends a copy to someone else. Watch the pieces travel across and arrive at the other end." },
  message: { scene: "packets", caption: "A message travels in small pieces and is put back together where it arrives." },
  wired: { scene: "wiredwireless", caption: "A wired connection uses a cable. Watch the data pulse along the wire on the left." },
  wireless: { scene: "wiredwireless", caption: "A wireless connection uses invisible radio waves — no cable. Watch the data hop across the air on the right." },
  "wi-fi": { scene: "wiredwireless", caption: "Wi-Fi carries data through the air by radio — no cable. Watch it hop across on the right." },
  "standalone device": { scene: "online", caption: "A standalone device works on its own, with no link to the network — like this one while its link is gone." },
  "connected device": { scene: "online", caption: "A connected device has a link to the network. Watch the link form and the data start to flow." },
  available: { scene: "online", caption: "Available means the connection is there and working — data can flow along it." },
  "not available": { scene: "online", caption: "Not available means the link is broken. Nothing can flow until it comes back." },
  icon: { scene: "online", caption: "An icon is a little picture with a meaning. Watch the connection icon change as the link comes and goes." },
  // Unit 9 teaches the connection icons themselves as vocabulary, written out
  // as descriptions. They all mean "connected" or "not connected", which is
  // exactly what this scene alternates between.
  "a screen with a plug, or small arrows": { scene: "online", caption: "That icon means the device is connected — the link is there and data can flow." },
  "a crossed-out icon, or the words not connected": { scene: "online", caption: "That icon means the link is broken — watch the cross appear when the connection goes." },
  "a globe": { scene: "online", caption: "The globe icon means the internet — the whole world of networks your device can reach." },
  "a globe with a line through it": { scene: "online", caption: "A globe with a line through it means the internet cannot be reached — watch the link break." },
  "a message like you're offline": { scene: "online", caption: "Offline means no connection right now. Watch what changes when the link goes." },

  // --- keeping things private ------------------------------------------------
  "personal information": { scene: "encryption", caption: "Personal information belongs to you. Scrambling it keeps it private, so only the right person can read it." },
  private: { scene: "encryption", caption: "Private means only you, and people you choose, can read it. Scrambling the letters keeps it that way." },
  malware: { scene: "malware", caption: "Malware is a bad program that sneaks in and copies itself until the device's real work cannot get through." },

  // ==== Grades 1, 3 and 4 =====================================================
  // The same rule throughout: the scene shows the behaviour the word names,
  // and the caption ties the shared scene to this word's meaning.

  // --- more steps and programs ----------------------------------------------
  sequence: { scene: "sequence", caption: "A sequence is steps in order, one after another. Watch the runner take them first to last." },
  reset: { scene: "sequence", caption: "Reset puts everything back to the start, ready to run again — watch the run begin again from step one." },
  pause: { scene: "sequence", caption: "Pause tells the program to wait a moment before its next step." },
  outcome: { scene: "predict", caption: "The outcome is what actually happens when the program runs — the runner shows it, after the ghost's guess." },
  change: { scene: "variable", caption: "Change one thing — a value, a step — and what the program does changes with it. Watch the new value replace the old." },
  speed: { scene: "speed", caption: "Speed is how fast the steps run. Both runners have the same steps — one just takes them faster." },
  edit: { scene: "blocks", caption: "Editing is changing your blocks — adding, removing or reordering them — to make the program better." },
  correct: { scene: "bugdebug", caption: "Correcting is putting the wrong step right. Watch the bad step swap out, then the run works." },
  error: { scene: "bugdebug", caption: "An error is something wrong in the program. Watch the runner follow it off the path — then the fix." },
  debugging: { scene: "bugdebug", caption: "Debugging is finding the wrong step and fixing it. Watch the bad step swap out, then the run works." },
  "test / testing": { scene: "bugdebug", caption: "Testing is running your program and watching carefully. That is how you find the step that is wrong." },
  "test systematically": { scene: "bugdebug", caption: "Testing systematically means changing ONE thing, running again, and watching what that one change did." },
  "logical thinking": { scene: "bugdebug", caption: "Logical thinking is following the steps in order to work out exactly what will happen — and where it went wrong." },
  efficient: { scene: "loop", caption: "An efficient program says it once and repeats it, instead of writing the same steps again and again." },
  concise: { scene: "loop", caption: "Concise means short and clear: one repeat block instead of the same steps written four times." },
  repetitive: { scene: "loop", caption: "Repetitive means the same thing again and again — which is exactly what a loop is for." },
  repetition: { scene: "loop", caption: "Repetition is doing the same steps again and again. Watch the ball go round and the counter climb." },
  loop: { scene: "loop", caption: "A loop runs the same steps again and again. Watch the ball go round and the counter climb with each lap." },
  iteration: { scene: "loop", caption: "Iteration means going round the loop once more. Each lap of the ball is one iteration — count them." },
  counter: { scene: "loop", caption: "The counter keeps the score of how many times the loop has run — watch the column grow one block per lap." },
  "forever loop": { scene: "loop", caption: "A forever loop never stops: the ball just keeps going round, lap after lap." },
  "forever block": { scene: "loop", caption: "The forever block repeats its steps without ever stopping — watch the ball keep circling." },
  "repeat block": { scene: "loop", caption: "The repeat block runs its steps a set number of times. Watch the counter climb to the target." },
  "repeat loop": { scene: "loop", caption: "A repeat loop runs the same steps a set number of times — watch the counter climb." },
  "repeat until loop": { scene: "loop", caption: "A repeat until loop goes round again and again and only stops when its condition is met." },
  "count-controlled loop": { scene: "loop", caption: "A count-controlled loop repeats exactly as many times as the count says — the counter shows how many so far." },
  condition: { scene: "selection", caption: "A condition is a question that is true or false. Watch the program take one path when it is true, the other when it is not." },
  random: { scene: "randompick", caption: "Random means the computer picks and you cannot know which before it lands — watch where it stops each round." },
  comment: { scene: "comment", caption: "A comment is a note for people. The program runs straight past it — the computer never reads it." },
  "sub-routine": { scene: "subroutine", caption: "A sub-routine is steps you name once and call whenever you need them. Watch the runner jump in, do them, and come back." },
  "my blocks": { scene: "subroutine", caption: "My Blocks lets you make your own block: name some steps once, then call them from the main program." },
  "define block": { scene: "subroutine", caption: "The define block holds the steps your new block will do. Calling it runs them, then carries on." },
  event: { scene: "events", caption: "An event is something that happens — a press, a click — that starts a program running. Nothing runs until it does." },
  "event block": { scene: "events", caption: "An event block waits for something to happen — then starts the steps under it. Watch the press set it off." },
  clicked: { scene: "events", caption: "Clicked is an event: the moment the button is clicked, the program starts." },
  pressed: { scene: "events", caption: "Pressed is an event: the moment the button is pressed, the steps fire." },
  "touch logo": { scene: "events", caption: "Touching the logo is an event: the moment it is touched, the program starts running." },
  shake: { scene: "events", caption: "A shake is an event the micro:bit can feel: the moment it happens, the program reacts." },
  coordinates: { scene: "robot", caption: "Coordinates name a square: how far across, then how far up. They tell the robot exactly where to be." },
  direction: { scene: "robot", caption: "Direction is which way to go. Watch the pointer show it before each move." },
  arrow: { scene: "robot", caption: "The arrow shows the direction of the next move — watch it point the way before the robot goes." },
  control: { scene: "robot", caption: "You control the robot by giving it instructions — it does exactly what the program says, nothing else." },
  shape: { scene: "shapes", caption: "Watch the pen draw the whole shape: forward along each side, a turn at each corner." },
  square: { scene: "shapes", caption: "Four sides and four turns, drawn one at a time — that is the program for this shape." },
  rectangle: { scene: "shapes", caption: "A rectangle is four sides and four turns — watch the pen draw each side in order." },

  // --- Scratch and making things --------------------------------------------
  scratch: { scene: "blocks", caption: "In Scratch you snap blocks together to make a program. Run it and the sprite obeys." },
  sprite: { scene: "blocks", caption: "The sprite is the character your blocks control. Run the program and watch it move." },
  backdrop: { scene: "looks", caption: "The backdrop is the scene behind your sprite. It can change without touching the program — watch it swap." },
  costume: { scene: "looks", caption: "A costume is the sprite's look. Swapping costumes changes how it looks, not what it does — watch both change." },
  "static object": { scene: "looks", caption: "A static object stays still — like the backdrop — while sprites move in front of it." },
  storyboard: { scene: "frames", caption: "A storyboard plans your story frame by frame, in order, before you build it." },
  animation: { scene: "frames", caption: "Animation shows still pictures quickly, one after another, so the eye sees movement — watch the frames play." },
  "games developer": { scene: "blocks", caption: "A games developer builds games out of programs — blocks, sprites and rules, like this." },
  "game developer": { scene: "blocks", caption: "A game developer builds games out of programs — blocks, sprites and rules, like this." },
  programmer: { scene: "blocks", caption: "A programmer writes programs: they choose the blocks, snap them together, and test what runs." },
  makecode: { scene: "blocks", caption: "MakeCode snaps blocks together into a program, like this — then sends it to the micro:bit." },
  tempo: { scene: "music", caption: "Tempo is how fast the beat goes. Listen with your eyes: the same tune plays slower, then faster." },
  beat: { scene: "music", caption: "The beat is the steady pulse under the music — watch it tap along evenly while the notes change." },
  melody: { scene: "music", caption: "A melody is notes in a pattern — higher, lower, higher again. Watch the pattern play in order." },
  note: { scene: "music", caption: "A note is one sound in the music — each ball is one note, higher or lower in pitch." },
  "music extension": { scene: "music", caption: "The music extension adds blocks that play notes — so your program can make a melody with a steady beat." },
  volume: { scene: "sound", caption: "Volume is how loud the sound is. Watch the waves grow when it is loud and shrink when it is quiet." },
  "speaker or headphones": { scene: "sound", caption: "A speaker or headphones turn the computer's data into sound you can hear — watch the waves ripple out." },

  // --- devices and what is inside them --------------------------------------
  desktop: { scene: "devices", caption: "A desktop is a computer that stays on the desk — the tower and screen on the left that never move." },
  laptop: { scene: "devices", caption: "A laptop is a computer you can fold up and carry — one of the portable ones bobbing about." },
  tablet: { scene: "devices", caption: "A tablet is a flat computer that is all screen — light enough to carry anywhere." },
  smartphone: { scene: "devices", caption: "A smartphone is a small computer that fits in your hand — the smallest device here." },
  android: { scene: "devices", caption: "Android is what runs many smartphones and tablets — the software inside the small portable devices." },
  "computing device": { scene: "devices", caption: "A computing device is any machine with a computer inside — desktop, laptop, tablet or phone." },
  keyboard: { scene: "hardwaresoftware", caption: "A keyboard is an input device: watch the data flow from it into the computer." },
  screen: { scene: "hardwaresoftware", caption: "The screen shows the computer's output — watch the data flow up to it. A computer's screen is called a monitor." },
  "input device": { scene: "hardwaresoftware", caption: "An input device sends information INTO the computer — watch the data flow in from the keyboard." },
  "output device": { scene: "hardwaresoftware", caption: "An output device brings information OUT of the computer — watch the data flow up to the screen." },
  "application software": { scene: "hardwaresoftware", caption: "Application software is the programs you choose to run — instructions flowing through the hardware to do YOUR job." },
  "system software": { scene: "hardwaresoftware", caption: "System software keeps the computer itself running — instructions flowing underneath everything else." },
  "operating system": { scene: "hardwaresoftware", caption: "The operating system runs the whole computer — every other program's instructions flow through it." },
  printer: { scene: "printer", caption: "A printer puts the computer's output on paper — watch each page come out with its printing on it." },
  "multifunction machine": { scene: "printer", caption: "A multifunction machine prints, scans and copies — one machine, several jobs. Here it is doing one: printing." },
  process: { scene: "general", caption: "Processing is the work in the middle: input goes in, the computer processes it, output comes out." },
  processor: { scene: "general", caption: "The processor is the middle box — the part of the computer where the work actually happens." },
  "control system": { scene: "general", caption: "A control system takes measurements in, decides, and sends actions out — in, work, out, round and round." },
  innovator: { scene: "general", caption: "An innovator builds something new that takes a problem in and puts a solution out — then makes it better." },
  "computer scientist": { scene: "abstraction", caption: "A computer scientist thinks like this: break the problem into parts, solve each, put them back together." },
  "computational thinking": { scene: "abstraction", caption: "Computational thinking is breaking a big problem into small parts you can solve one at a time." },
  decomposition: { scene: "abstraction", caption: "Decomposition breaks one big problem into small parts you can solve one at a time — watch it split and rejoin." },
  "sub-task": { scene: "abstraction", caption: "A sub-task is one small piece of the big job — watch the whole break into the parts you can actually do." },
  "manual": { scene: "manualautomatic", caption: "Manual means a person does it: one press, one piece of data. Watch the left side wait for each press." },
  automatic: { scene: "manualautomatic", caption: "Automatic means it happens by itself: the sensor on the right streams data in with nobody pressing anything." },
  sensor: { scene: "sensors", caption: "A sensor measures the real world — heat, light, distance — and turns it into data the computer can use." },
  "distance sensor": { scene: "sensors", caption: "A distance sensor measures how far away something is, and sends the reading in as data." },
  "light sensor": { scene: "sensors", caption: "A light sensor measures how bright it is, and sends the reading in as data — watch the readings follow the source." },
  "motion sensor": { scene: "sensors", caption: "A motion sensor notices movement and tells the computer the moment it happens." },
  "temperature sensor": { scene: "sensors", caption: "A temperature sensor measures how hot or cold it is — watch the readings rise and fall with the source." },
  "infrared sensor": { scene: "sensors", caption: "An infrared sensor sees a kind of light our eyes cannot, and turns what it detects into data." },
  "data logger": { scene: "sensors", caption: "A data logger keeps one reading after another, so you can see how the measurement changed over time." },
  "computer-controlled device": { scene: "robot", caption: "A computer-controlled device is a machine run by a program — it does exactly the steps it is given." },
  "physical computing device": { scene: "ledmatrix", caption: "A physical computing device is a small computer you can hold — like the micro:bit and its grid of lights." },
  led: { scene: "ledmatrix", caption: "An LED is one small light the program can switch on and off — the micro:bit has twenty-five of them." },
  "led display": { scene: "ledmatrix", caption: "The LED display is the grid of lights — the program switches them on and off to make patterns." },
  simulator: { scene: "ledmatrix", caption: "A simulator shows what the micro:bit will do before you have one in your hand — a model like this one." },
  drone: { scene: "robot", caption: "A drone is a flying robot: it follows its program's instructions exactly, step by step." },
  "driverless vehicle": { scene: "robot", caption: "A driverless vehicle is a robot car: its program and sensors steer it, one decision at a time." },
  "robotics engineer": { scene: "robot", caption: "A robotics engineer builds robots and writes the programs that tell them exactly what to do." },

  // --- files and storage ----------------------------------------------------
  file: { scene: "storage", caption: "A file is saved work kept under a name, stored so you can come back to it later." },
  "text file": { scene: "storage", caption: "A text file stores words. Like every file it is kept safe on a drive until you need it." },
  "image file": { scene: "pixels", caption: "An image file stores a picture as a grid of numbers — watch the picture build pixel by pixel." },
  "audio file": { scene: "sound", caption: "An audio file stores sound as data — play it and the waves come back out." },
  "video file": { scene: "frames", caption: "A video file stores many pictures shown quickly — frames that your eye reads as movement." },
  "storage device": { scene: "storage", caption: "A storage device keeps data safe when the computer is off — watch the file go in and stay kept." },
  "file size": { scene: "storage", caption: "Files take up space: a bigger file needs more room on the drive, so size matters when you store or send it." },

  // --- data, tables and charts ----------------------------------------------
  collect: { scene: "grouping", caption: "Collecting is gathering the data in before you can sort it — watch each piece come in to its group." },
  count: { scene: "tally", caption: "Counting is one mark for each thing — watch the tally grow as each one goes past." },
  record: { scene: "database", caption: "A record is one row — everything about one person or thing, kept together." },
  "data table": { scene: "database", caption: "A data table holds data in rows and columns, so you can find and compare things easily." },
  table: { scene: "database", caption: "A table holds data in rows and columns — one row per thing, one column per fact about it." },
  "kind of form": { scene: "database", caption: "Forms come in kinds — on paper or on a computer — and every filled-in form becomes one row of data." },
  "paper form": { scene: "database", caption: "A paper form collects answers by hand. Each filled form becomes one record — one row." },
  "computer form": { scene: "database", caption: "A computer form collects answers straight into the computer — each one becomes a record instantly." },
  database: { scene: "database", caption: "A database holds records in rows and fields in columns — and a search lights up just the rows that match." },
  "physical database": { scene: "database", caption: "A physical database is records on paper or cards — still rows of facts, just not on a computer." },
  "digital database": { scene: "database", caption: "A digital database keeps its records on a computer — so a search finds the matching rows instantly." },
  field: { scene: "database", caption: "A field is one column — the same fact about every record, like everyone's age." },
  information: { scene: "database", caption: "Information is data organised so it means something — records you can search and actually use." },
  "data item": { scene: "database", caption: "A data item is one piece of data in one field of one record — a single box in the table." },
  search: { scene: "database", caption: "A search asks a question of the data — watch it light up only the records that match." },
  "field first": { scene: "sort", caption: "Sorting by one field first means that field decides the order — everything lines up by it." },
  "ascending order": { scene: "sort", caption: "Ascending order goes smallest to largest — watch the bars swap until they climb left to right." },
  "descending order": { scene: "sort", caption: "Descending order goes largest to smallest — the same sorting, just the other way round." },
  "discrete data": { scene: "datatypes", caption: "Discrete data comes in separate whole amounts you can count — like the columns, not a smooth in-between." },
  "block graph": { scene: "bargraph", caption: "A block graph stacks one block per thing counted — watch each column grow block by block." },
  "bar chart": { scene: "bargraph", caption: "A bar chart shows counts as bars — watch each bar grow as things are counted." },
  "column chart": { scene: "bargraph", caption: "A column chart shows counts as columns standing up — watch them grow as things are counted." },
  "pie chart": { scene: "piechart", caption: "A pie chart is a circle shared out: each colour's slice of the circle is its share of the whole." },
  "data analyst": { scene: "bargraph", caption: "A data analyst turns collected data into charts like this, to find the story in the numbers." },
  spreadsheet: { scene: "spreadsheet", caption: "A spreadsheet holds numbers in cells and recalculates the moment they change — watch the total follow." },
  row: { scene: "gridcells", caption: "A row runs ACROSS the grid — watch one whole row light up together." },
  column: { scene: "gridcells", caption: "A column runs DOWN the grid — watch one whole column light up together." },
  cell: { scene: "gridcells", caption: "A cell is one box in the grid, where a row and a column cross." },
  "cell address": { scene: "gridcells", caption: "A cell address names one cell: its column letter, then its row number — the one lit box." },
  "active cell": { scene: "gridcells", caption: "The active cell is the one selected right now — watch it pulse. Whatever you type goes there." },
  "name box": { scene: "gridcells", caption: "The name box shows the address of the active cell — the pulsing one — so you always know where you are." },
  heading: { scene: "gridcells", caption: "The headings are the dark edge row and column — they name each column and number each row." },
  range: { scene: "gridcells", caption: "A range is a block of cells together — watch a whole rectangle of them light up as one." },
  format: { scene: "datatypes", caption: "A cell's format says what kind of thing it holds — words, a number, a date, money — so it is shown properly." },
  text: { scene: "datatypes", caption: "Text is data made of words and letters — a different kind from numbers, and treated differently." },
  number: { scene: "datatypes", caption: "A number is data you can count and calculate with — the kind the columns on the left are made of." },
  date: { scene: "datatypes", caption: "A date is its own kind of data — the computer knows it is a day in the calendar, not just digits." },
  currency: { scene: "datatypes", caption: "Currency is money data — the computer shows it with the money sign and treats it as an amount." },
  "data type": { scene: "datatypes", caption: "A data type says what kind a piece of data is — a number you measure, or a named group you sort into." },

  // --- the network, servers and the web -------------------------------------
  communicate: { scene: "network", caption: "Devices communicate by sending messages to each other across the network — watch them travel." },
  "internet of things": { scene: "network", caption: "The Internet of Things is everyday things — lights, fridges, watches — joined to the network so they can share." },
  service: { scene: "clientserver", caption: "A service answers requests: you ask for something, it sends it back — request out, response in." },
  server: { scene: "clientserver", caption: "A server is a computer that answers requests: it waits, and serves back what is asked for." },
  client: { scene: "clientserver", caption: "The client is the asking side — your device sends the request, then waits for the response." },
  request: { scene: "clientserver", caption: "A request is the ask: watch it travel from the client to the server." },
  response: { scene: "clientserver", caption: "The response is the answer: watch the server send it back to whoever asked." },
  "file server": { scene: "clientserver", caption: "A file server hands out files on request — ask for one, and it sends it back." },
  "web server": { scene: "clientserver", caption: "A web server hands out web pages on request — every page you visit was served like this." },
  "print server": { scene: "clientserver", caption: "A print server takes printing requests from everyone and passes them to the printer in turn." },
  "mail server": { scene: "clientserver", caption: "A mail server holds and passes on email — your message goes to it, and it sends it onward." },
  "world wide web": { scene: "clientserver", caption: "The World Wide Web is pages served on request: your browser asks, a server answers, again and again." },
  browser: { scene: "clientserver", caption: "A browser asks a server for a page and shows you what comes back — that round trip is every page you visit." },
  website: { scene: "clientserver", caption: "A website is a set of pages kept on a server, sent to your browser whenever you ask for them." },
  hyperlink: { scene: "clientserver", caption: "Click a hyperlink and your browser asks the server for that page — the link is the address of the ask." },
  ethernet: { scene: "wiredwireless", caption: "Ethernet is the wired way in: a cable carrying the data — watch it pulse along the wire." },
  "wired network": { scene: "wiredwireless", caption: "A wired network joins devices with cables — watch the data pulse along the wire on the left." },
  "wireless network": { scene: "wiredwireless", caption: "A wireless network joins devices with radio waves instead of cables — watch the data hop across the air." },
  "radio waves": { scene: "wiredwireless", caption: "Radio waves carry data through the air — invisible ripples, like the ones spreading on the right." },
  wire: { scene: "wiredwireless", caption: "A wire carries data as signals along a cable — watch them pulse along it." },
  online: { scene: "online", caption: "Online means connected: the link is there and data can flow — watch it." },
  offline: { scene: "online", caption: "Offline means not connected: the link is gone and nothing can flow until it comes back." },
  "network failure": { scene: "online", caption: "A network failure is the link breaking — watch everything stop flowing until it is mended." },

  // --- keeping things secret and safe ----------------------------------------
  encryption: { scene: "encryption", caption: "Encryption scrambles a message so only someone with the key can read it — watch the letters shift." },
  encrypt: { scene: "encryption", caption: "To encrypt is to scramble the message — watch the letters slide into their secret positions." },
  decrypt: { scene: "encryption", caption: "To decrypt is to unscramble it again — the key tells you how far to slide the letters back." },
  cipher: { scene: "encryption", caption: "A cipher is the rule for scrambling a message — this one slides every letter along the alphabet." },
  "substitution cipher": { scene: "encryption", caption: "A substitution cipher swaps each letter for another one — watch each letter map to its secret partner." },
  shift: { scene: "encryption", caption: "The shift is how far each letter slides along the alphabet — watch them move together." },
  "plain text": { scene: "encryption", caption: "Plain text is the message before scrambling — the top row anyone could read." },
  ciphertext: { scene: "encryption", caption: "Ciphertext is the message after scrambling — the bottom row, unreadable without the key." },
  encode: { scene: "encryption", caption: "Encoding turns the message into its secret form — watch the letters take their new places." },
  decode: { scene: "encryption", caption: "Decoding turns the secret form back into the message — sliding every letter home again." },
  key: { scene: "encryption", caption: "The key is the secret that unlocks the scramble — with it, the hidden message turns back into the real one." },
  biometric: { scene: "encryption", caption: "A biometric uses your body — a fingerprint, your face — as the key that unlocks your device." },
  hacker: { scene: "encryption", caption: "A hacker tries to get at data that is not theirs — which is exactly why messages are scrambled and locked." },
  cybercrime: { scene: "malware", caption: "Cybercrime is using computers to do harm — like sending malware that stops a device working." },
  virus: { scene: "malware", caption: "A virus is malware that spreads by copying itself — watch the copies multiply until nothing else can run." },
  "barcode reader": { scene: "barcode", caption: "A barcode reader scans the stripes and reads out the number they hold — watch the red line sweep." },
};

// Same lookup ladder as computingWordPicture: the exact term, then the term
// with its bracketed asides stripped — "group (category)", "Move forward
// (number)", "Wi-Fi (little curved lines, like a fan)" — then a
// singular/plural nudge. Unlike the picture map, a pair like "turn left /
// right" is NOT rejected: no single picture is honest about both directions,
// but an animation shows each in turn, so pairs simply have their own keys.
export function computingWordScene(term) {
  const clean = String(term || "").toLowerCase().replace(/’/g, "'").trim();
  if (!clean) return null;
  const candidates = [clean];
  const withoutAside = clean.replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim();
  if (withoutAside) candidates.push(withoutAside);
  for (const base of [...candidates]) {
    if (base.endsWith("s")) candidates.push(base.slice(0, -1));
    else candidates.push(`${base}s`);
  }
  for (const candidate of candidates) {
    const hit = COMPUTING_WORD_SCENES[candidate];
    if (hit) return hit;
  }
  return null;
}

// The word card's figure, on the exact shape computingDiagram() renders so
// initComputingWebGL() finds everything it binds: the [data-computing-figure]
// root, the toggle and reset buttons, and the no-WebGL fallback.
export function computingWordExplainer(term) {
  const entry = computingWordScene(term);
  if (!entry) return "";
  return `<figure class="computing-visual" data-computing-figure="word">
      <div class="geometry-stage"><canvas class="computing-webgl" data-computing-scene="${entry.scene}" role="img" aria-label="Interactive model. ${esc(entry.caption)}"></canvas><p class="geometry-fallback" hidden>This device cannot display the interactive model. Use the meaning and example instead.</p></div>
      <div class="geometry-controls"><button type="button" data-geometry-toggle>Pause animation</button><button type="button" data-geometry-reset>Reset view</button><span>Drag the model to turn it</span></div>
      <figcaption><span class="field-label">See it move:</span> ${esc(entry.caption)}</figcaption>
    </figure>`;
}
