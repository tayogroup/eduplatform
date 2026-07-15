import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = path.join(projectRoot, "src", "prototypes", "ehel-academy", "english");
const extensions = new Set([".json", ".js", ".html", ".vtt"]);
const approvedWomen = ["Sarah", "Hannah", "Sophia", "Nadia", "Amal", "Selma", "Samira"];
const approvedMen = ["Adam", "Noah", "Ibrahim", "Ishmael", "Isaac", "Musa"];

const retiredWomen = [
  "Achieng", "Afi", "Aisha", "Alem", "Ama", "Amani", "Amina", "Aminah", "Amira", "Asha",
  "Esi", "Faduma", "Fadumo", "Faisa", "Fatima", "Fatoumata", "Frehiwot", "Halima", "Hawa",
  "Hodan", "Idil", "Imani", "Jalia", "Jamila", "Joy", "Kemi", "Kiya", "Ladan", "Laila",
  "Bahati", "Jebet", "Khadija", "Layla", "Leila", "Leyla", "Lin", "Lina", "Lisa", "Lydia", "Luma", "Maria", "Mia",
  "Mirembe", "Mwanaidi", "Nadifa", "Nasra", "Neema", "Nia", "Nomusa", "Nura", "Nuru",
  "Nabwire", "Rahma", "Rahmat", "Rani", "Ruth", "Safiya", "Sagal", "Sahra", "Sally", "Salma", "Samia", "Sena",
  "Sumaya", "Tamara", "Tatu", "Yaa", "Yasmin", "Zahra", "Zanele", "Zawadi", "Zinzi"
];

const retiredMen = [
  "Abdi", "Abdirahman", "Ahmed", "Ali", "Amari", "Amin", "Ayo", "Ayele", "Baraka", "Bashir", "Cabdi",
  "Bekele", "Bilal", "Boniface", "Daahir", "Daniel", "David", "Dilov", "Diriye", "Dlamini", "Duma",
  "Faarax", "Farah", "Farhan", "Fara", "Felix", "Gathu", "Girma", "Guled", "Hamza", "Hassan", "Idris", "Jabari",
  "Jabir", "Jamal", "Johannes", "Jonah", "Juma", "Junior", "Kadir", "Kalimani", "Kambazi", "Karim",
  "Kevin", "Khalid", "Kiptoo", "Kito", "Kobi", "Kojo", "Kwame", "Kwesi", "Liban", "Maalim",
  "Mado", "Mahad", "Mahdi", "Mahir", "Malik", "Mosi", "Mussa", "Mwangi", "Ndege", "Nkosi", "Nuradin", "Nuur", "Oloo", "Osman",
  "Obeng", "Omar", "Omari", "Omondi", "Peter", "Rami", "Sizwe", "Tano", "Tendo", "Theo",
  "Timo", "Tunde", "Wafula", "Warsame", "Wekesa", "Yasin", "Yusef", "Yusuf", "Zuko"
];

const replacementMap = new Map();
retiredWomen.forEach((name, index) => replacementMap.set(name, approvedWomen[index % approvedWomen.length]));
retiredMen.forEach((name, index) => replacementMap.set(name, approvedMen[index % approvedMen.length]));

// These uses are explicitly female even though the same source name is used for male characters elsewhere.
const contextualReplacements = [
  {
    pathIncludes: `${path.sep}grade-7${path.sep}data${path.sep}units${path.sep}unit-7.json`,
    replacements: new Map([["Farah", "Samira"]])
  },
  {
    pathIncludes: `${path.sep}grade-7${path.sep}data${path.sep}units${path.sep}unit-3.json`,
    replacements: new Map([["Lomi", "Hannah"]])
  },
  {
    pathIncludes: `${path.sep}grade-7${path.sep}media${path.sep}unit-3${path.sep}`,
    replacements: new Map([["Lomi", "Hannah"]])
  },
  {
    pathIncludes: `${path.sep}grade-8${path.sep}data${path.sep}units${path.sep}unit-7.json`,
    replacements: new Map([["Dalton", "Adam"], ["Kamari", "Sarah"]])
  },
  {
    pathIncludes: `${path.sep}grade-8${path.sep}data${path.sep}games${path.sep}unit-7.json`,
    replacements: new Map([["Dalton", "Adam"], ["Kamari", "Sarah"]])
  }
];

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target, files);
    else if (extensions.has(path.extname(entry.name).toLowerCase())) files.push(target);
  }
  return files;
}

function replaceWholeWord(source, oldName, newName) {
  return source.replace(
    new RegExp(`(^|\\\\n|[^A-Za-z])${oldName}(?=$|\\\\n|[^A-Za-z])`, "g"),
    (_, prefix) => `${prefix}${newName}`
  );
}

function repairKnownCharacterCollisions(file, source) {
  let repaired = source;

  repaired = repaired
    .replaceAll("old Samira", "old Sarah")
    .replaceAll("Samira sold dates", "Sarah sold dates")
    .replaceAll("said Samira, wiping her eyes", "said Sarah, wiping her eyes")
    .replaceAll("Samira gave everyone fresh dates", "Sarah gave everyone fresh dates")
    .replaceAll("clean Samira's shop", "clean Sarah's shop")
    .replaceAll("help old Samira", "help old Sarah");

  if (file.endsWith(path.join("grade-7", "data", "units", "unit-7.json"))) {
    const replacements = [
      ["when Samira arrived at school", "when Sarah arrived at school"],
      ["But Samira was not thinking", "But Sarah was not thinking"],
      ["Samira told Noah", "Sarah told Noah"],
      ["selected: Samira, Noah, and Samira", "selected: Sarah, Noah, and Nadia"],
      ["Sarah glanced at Samira", "Sarah glanced at Nadia"],
      ["Samira had become distant", "Nadia had become distant"],
      ["\"I am committed to winning,\" Samira said", "\"I am committed to winning,\" Nadia said"],
      ["That evening, Samira worked", "That evening, Sarah worked"],
      ["matter to you, Samira?", "matter to you, Sarah?"],
      ["During lunch, Samira went", "During lunch, Sarah went"],
      ["she heard voices. Samira was speaking", "she heard voices. Nadia was speaking"],
      ["\"Yes, I have it,\" Samira said", "\"Yes, I have it,\" Nadia said"],
      ["Samira froze. Her heart", "Sarah froze. Her heart"],
      ["Sarah looked up and saw her", "Nadia looked up and saw her"],
      ["\"Samira — it is not what you think,\" Samira started", "\"Sarah — it is not what you think,\" Nadia started"],
      ["\"Whose speech did you copy?\" Samira asked", "\"Whose speech did you copy?\" Sarah asked"],
      ["Sarah’s eyes dropped", "Nadia’s eyes dropped"],
      ["\"You could have asked for help,\" Samira said", "\"You could have asked for help,\" Sarah said"],
      ["\"I was afraid of looking weak,\" Samira whispered", "\"I was afraid of looking weak,\" Nadia whispered"],
      ["\"If you give that speech,\" Samira said", "\"If you give that speech,\" Sarah said"],
      ["Sarah was silent for a long time", "Nadia was silent for a long time"],
      ["\"Write your own speech,\" Samira said", "\"Write your own speech,\" Sarah said"],
      ["in Samira’s house", "in Sarah’s house"],
      ["Samira and Samira sat together", "Sarah and Nadia sat together"],
      ["\"Tell me what you are passionate about,\" Samira said", "\"Tell me what you are passionate about,\" Sarah said"],
      ["\"The sea,\" Samira replied", "\"The sea,\" Nadia replied"],
      ["\"Then that is your speech,\" Samira said", "\"Then that is your speech,\" Sarah said"],
      ["Samira wrote and rewrote her speech", "Nadia wrote and rewrote her speech"],
      ["Then Samira took the stage", "Then Nadia took the stage"],
      ["\"My name is Samira, and I am fascinated", "\"My name is Nadia, and I am fascinated"],
      ["Finally, Samira stepped up", "Finally, Sarah stepped up"],
      ["Samira was named the winner", "Sarah was named the winner"],
      ["looked back at Samira and smiled", "looked back at Nadia and smiled"],
      ["\"Samira, you were brave because you told the truth. Samira, you were brave because you helped", "\"Nadia, you were brave because you told the truth. Sarah, you were brave because you helped"],
      ["\"Is that not what mentorship is?\" Samira asked", "\"Is that not what mentorship is?\" Sarah asked"]
      ,["Samira said quietly. \\\"This qualification", "Nadia said quietly. \\\"This qualification"]
      ,["I have it,\\\" Samira said", "I have it,\\\" Nadia said"]
      ,["Samira — it is not what you think,\\\" Samira started", "Sarah — it is not what you think,\\\" Nadia started"]
      ,["speech did you copy?\\\" Samira asked", "speech did you copy?\\\" Sarah asked"]
      ,["asked for help,\\\" Samira said", "asked for help,\\\" Sarah said"]
      ,["looking weak,\\\" Samira whispered", "looking weak,\\\" Nadia whispered"]
      ,["give that speech,\\\" Samira said gently", "give that speech,\\\" Sarah said gently"]
      ,["own speech,\\\" Samira said", "own speech,\\\" Sarah said"]
      ,["passionate about,\\\" Samira said", "passionate about,\\\" Sarah said"]
      ,["The sea,\\\" Samira replied", "The sea,\\\" Nadia replied"]
      ,["your speech,\\\" Samira said", "your speech,\\\" Sarah said"]
      ,["mentorship is?\\\" Samira asked", "mentorship is?\\\" Sarah asked"]
    ];
    for (const [before, after] of replacements) repaired = repaired.replaceAll(before, after);
  }

  return repaired;
}

function normalizeNames() {
  let changedFiles = 0;
  let replacements = 0;

  for (const file of walk(contentRoot)) {
    const original = fs.readFileSync(file, "utf8");
    let updated = original;

    for (const rule of contextualReplacements) {
      if (!file.includes(rule.pathIncludes)) continue;
      for (const [oldName, newName] of rule.replacements) {
        const before = updated;
        updated = replaceWholeWord(updated, oldName, newName);
        replacements += before === updated ? 0 : 1;
      }
    }

    for (const [oldName, newName] of replacementMap) {
      const before = updated;
      updated = replaceWholeWord(updated, oldName, newName);
      replacements += before === updated ? 0 : 1;
    }

    // A named animal is made generic so the naming standard remains about people.
    updated = replaceWholeWord(updated, "Simba", "the rescued dog");
    updated = repairKnownCharacterCollisions(file, updated);

    if (updated !== original) {
      fs.writeFileSync(file, updated, "utf8");
      changedFiles += 1;
    }
  }

  return { changedFiles, replacements };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { changedFiles, replacements } = normalizeNames();
  console.log(`Updated ${changedFiles} files across ${replacements} name/file replacement groups.`);
}

export { approvedMen, approvedWomen, contentRoot, normalizeNames, retiredMen, retiredWomen };
