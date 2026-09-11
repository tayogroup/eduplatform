
  /* ---- shared by the new Asking, Sorting and Chance slides (2026-09-11 validation: grow the thinnest lessons; name local people) ---- */
  const nsDeal = (list, last) => { let i; do { i = rnd(0, list.length - 1); } while (list.length > 1 && i === last); return i; };

  /* ---- 1: choose the representation for the job (4Ss.02 choose and explain which representation to use) ---- */
  const NS_JOBS = [
    { q: "Amina wants to sort the numbers 1 to 20 by two questions at once: is it even, and is it more than 10?",
      o: ["A Carroll diagram", "A bar chart", "A dot plot"], why: "A Carroll diagram has a box for each pair of answers, so it sorts by two questions at once." },
    { q: "Musa is counting the cars that pass the school gate, one at a time, for ten minutes.",
      o: ["A tally chart", "A Venn diagram", "A pictogram"], why: "A tally chart lets you make one mark for each car as it passes, then count the marks at the end." },
    { q: "Hodan wants the class to see at a glance which fruit was chosen most.",
      o: ["A bar chart", "A Venn diagram", "A Carroll diagram"], why: "In a bar chart the tallest bar stands out straight away, so the most popular fruit is easy to see." },
    { q: "Omar asked 40 children how they come to school, and wants a picture where one symbol stands for 5 children.",
      o: ["A pictogram", "A dot plot", "A Carroll diagram"], why: "A pictogram uses a key, so one symbol can stand for 5 children and 40 answers still fit." },
    { q: "Zara wrote down how many brothers and sisters each child has: 0, 1, 2, 3 or 4.",
      o: ["A dot plot", "A Venn diagram", "A Carroll diagram"], why: "A dot plot puts one dot above each number for every child, which suits counted answers like these." },
    { q: "Yusuf wants to show which children have a cat, which have a dog, and which have both.",
      o: ["A Venn diagram", "A bar chart", "A dot plot"], why: "In a Venn diagram the two hoops overlap, and the overlap is where the children with both go." },
  ];
  let ns1 = -1, ns1right = 0, ns1asked = 0, ns1lock = false;
  function nsPaint1() {
    const it = NS_JOBS[ns1];
    $("nsq1").textContent = it.q + " Which should they use?";
    $("nspick1").innerHTML = shuffle(it.o.slice()).map((o) => '<button type="button" class="choice word" data-v="' + o + '">' + o + "</button>").join("");
    $("nsfb1").textContent = ""; $("nsfb1").className = "fb";
    $("nstask1").textContent = "Answered " + ns1asked + " · " + ns1right + " right";
  }
  $("nspick1").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || ns1lock) return;
    ns1lock = true; ns1asked++;
    const it = NS_JOBS[ns1], ok = b.dataset.v === it.o[0];
    if (ok) ns1right++;
    b.classList.add(ok ? "right" : "wrong");
    $("nsfb1").textContent = (ok ? cheer() + " " : it.o[0] + ". ") + it.why;
    $("nsfb1").className = "fb " + (ok ? "good" : "bad");
    say($("nsfb1").textContent);
    if (ns1right >= 4) finish(0, "You can choose the right chart!");
    setTimeout(() => { ns1 = nsDeal(NS_JOBS, ns1); ns1lock = false; nsPaint1(); }, 3000);
  });
  ns1 = nsDeal(NS_JOBS, -1); nsPaint1();

  /* ---- 2: the language of chance for familiar events (4Sp.01 maybe, likely, certain, impossible) ---- */
  const NS_WORDS = ["impossible", "maybe", "likely", "certain"];
  const NS_EVENTS = [
    { q: "The sun will rise tomorrow morning.", a: "certain", why: "The sun rises every single morning, so it is certain." },
    { q: "Musa rolls an ordinary dice and gets a 7.", a: "impossible", why: "An ordinary dice only has 1 to 6, so a 7 can never happen." },
    { q: "In April, the month of the long rains, it rains in Nairobi on at least one day.", a: "likely", why: "April is in the long rains, so rain on at least one day is very likely." },
    { q: "Hodan tosses a coin and it lands on heads.", a: "maybe", why: "It might land on heads or on tails, so it is maybe." },
    { q: "A cow flies over the school.", a: "impossible", why: "Cows cannot fly, so it is impossible." },
    { q: "Amina picks a sock without looking from a drawer of 9 red socks and 1 blue sock. It is red.", a: "likely", why: "Nearly all the socks are red, so a red one is likely, though not certain." },
    { q: "Next week will have 7 days.", a: "certain", why: "Every week has 7 days, so it is certain." },
    { q: "Zara spins a spinner that is half red and half blue, and it lands on blue.", a: "maybe", why: "Blue and red are the same size, so it might be blue and might be red." },
  ];
  let ns2 = -1, ns2right = 0, ns2asked = 0, ns2lock = false;
  function nsPaint2() {
    $("nsq2").textContent = NS_EVENTS[ns2].q;
    $("nspick2").innerHTML = NS_WORDS.map((w) => '<button type="button" class="choice word" data-v="' + w + '">' + w + "</button>").join("");
    $("nsfb2").textContent = ""; $("nsfb2").className = "fb";
    $("nstask2").textContent = "Answered " + ns2asked + " · " + ns2right + " right";
  }
  $("nspick2").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b || ns2lock) return;
    ns2lock = true; ns2asked++;
    const it = NS_EVENTS[ns2], ok = b.dataset.v === it.a;
    if (ok) ns2right++;
    b.classList.add(ok ? "right" : "wrong");
    $("nsfb2").textContent = (ok ? cheer() + " " : "It is " + it.a + ". ") + it.why;
    $("nsfb2").className = "fb " + (ok ? "good" : "bad");
    say($("nsfb2").textContent);
    if (ns2right >= 4) finish(1, "You can say how likely something is!");
    setTimeout(() => { ns2 = nsDeal(NS_EVENTS, ns2); ns2lock = false; nsPaint2(); }, 3000);
  });
  ns2 = nsDeal(NS_EVENTS, -1); nsPaint2();
