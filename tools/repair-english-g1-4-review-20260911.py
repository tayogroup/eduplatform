# -*- coding: utf-8 -*-
"""Apply the content review of English Grades 1-4 (2026-09-11).

WHAT THIS IS. Four reviewers read every learner-facing item of Grades 1-4 -
readings, comprehension, quizzes, fluency, grammar practice keys, writing,
speaking and activities - checking each answer against its text, each key
against its options, and the English itself. Every finding below was then
checked against the file before it was accepted: the old text is asserted
here, so an edit whose target has moved is refused rather than guessed.

The classes of defect, roughly by count:
  - a practice question with two right options (a distractor that also shows
    the pattern, or a synonym of the answer), and questions that give their
    own answer away ("Which word means: This word means ...")
  - comprehension questions and explanations that point at a line the text
    does not have ("the last sentence says ..."), mostly where a reading was
    lengthened after its questions were written
  - answer keys that capitalise a word going mid-sentence, and keys with a
    second correct answer
  - facts: a STOP sign is not a circle, Tanzania has regions not counties,
    frost does not lie at 22 degrees, a sea turtle cannot pull its head in,
    the moon is not a dot to the naked eye
  - story continuity: Grade 1's Adam is Amal's big brother in five units and
    a boy she has never met in Units 1 and 7; Grade 1 Unit 3's story is told
    as "Amal did throw the ball"
  - writing frames that do not fit their task (a tracing task whose example
    reads "It is ___."), and word-list titles that describe another list
    ("Words: places in the city" over confused, disappointed, embarrassed)

What is NOT here, and is done elsewhere the same day: the picture-book text
(shell/subjects/english.js) and pages for the stories changed here, and the
recordings of every clip whose text changed.

    python tools/repair-english-g1-4-review-20260911.py          # dry run
    python tools/repair-english-g1-4-review-20260911.py --write

Idempotent: an edit already applied is reported and skipped.
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = os.path.join(ROOT, "src", "prototypes", "ehel-academy", "english")
LQ, RQ = "“", "”"      # curly double quotes, as the content writes them
LS, RS = "‘", "’"      # curly single quotes

EDITS = []


def S(g, n, path, old, new):      # substring at path
    EDITS.append(("S", g, n, path, old, new))


def W(g, n, path, contains, new):  # whole value at path, where it still contains `contains`
    EDITS.append(("W", g, n, path, contains, new))


def K(g, n, qid, old, new):       # substring in the answer-key row(s) for this contentId
    EDITS.append(("K", g, n, qid, old, new))


def U(g, n, old, new):            # substring in every string of the unit
    EDITS.append(("U", g, n, None, old, new))


TITLES = []                        # (grade, group id, old title, new title)
DROP_LINKS = []                    # (grade, unit, vocabularyId, master-dictionary entry id)


def lc_key(g, n, path, old, new):
    S(g, n, path, old, new)


# ============================================================== GRADE 1
# Unit 1: the new friend is Leo (already her classmate in the Grade 1 books, and
# the boy Grade 2 opens with); Adam is her big brother in Units 3, 4, 5, 8 and 9.
S(1, 1, "readings[0].passageScript", "my name is Adam,", "my name is Leo,")
S(1, 1, "readings[0].passageScript", "her new friend Adam.", "her new friend Leo.")
W(1, 1, "comprehension[3].correctAnswer", "Her teacher and Adam", "Her teacher and Leo")
S(1, 1, "comprehension[3].explanation", "and Adam, the boy", "and Leo, the boy")
W(1, 1, "comprehension[4].correctAnswer", "Adam", "Leo")
S(1, 1, "comprehension[4].explanation", "my name is Adam.", "my name is Leo.")
S(1, 1, "comprehension[9].question", "when Adam asked", "when Leo asked")
S(1, 1, "comprehension[9].explanation", "'Yes!' to Adam", "'Yes!' to Leo")
K(1, 1, "eng-g01-t01-u01-cq01", "Answer: Adam. The boy says, 'Hello, my name is Adam.'", "Answer: Leo. The boy says, 'Hello, my name is Leo.'")
K(1, 1, "eng-g01-t01-u01-cq06", "'Yes!' to Adam", "'Yes!' to Leo")
K(1, 1, "eng-g01-t01-u01-cq16", "Her teacher and Adam. The pictures show the kind teacher at the door and Adam,", "Her teacher and Leo. The pictures show the kind teacher at the door and Leo,")
# Unit 7: the boy on the bicycle is her brother, as he is in every other unit
S(1, 7, "readings[0].passageScript", "A boy on a bicycle!" + RQ + " said Amal. The boy waved. His name was Adam.",
  "Adam is on his bicycle!" + RQ + " said Amal. Her big brother Adam waved.")
S(1, 7, "comprehension[4].explanation", "Amal sees a boy on a bicycle who waves, and his name was Adam.", "Amal sees her big brother Adam on his bicycle, and he waves.")
K(1, 7, "eng-g01-t03-u07-cq05", "Amal sees a boy on a bicycle who waves, and his name was Adam.", "Amal sees her big brother Adam on his bicycle, and he waves.")
# Unit 3: the story in plain past tense, not "did throw"
for old, new in (("Amal did throw the ball. Samira did catch it.", "Amal threw the ball. Samira caught it."),
                 ("Amal did roll the ball to Leo.", "Amal rolled the ball to Leo."),
                 ("Leo did throw the ball.", "Leo threw the ball."),
                 ("They all did jump.", "They all jumped."),
                 ("Adam did shake the branch.", "Adam shook the branch."),
                 ("Amal did catch it.", "Amal caught it."),
                 ("They did bounce and roll and catch.", "They bounced and rolled and caught the ball.")):
    U(1, 3, old, new)
# fluency: six items whose key was a fragment or which named their answer
W(1, 6, "fluency[0].question", "I can see with my eyes", "Which sentence tells what you do with your eyes?")
W(1, 6, "fluency[0].options", "a window, a book, a friend.", "I can see with my eyes. | It is cold. | These are my ears. | This is softer than that.")
W(1, 6, "fluency[0].correctAnswer", "a window, a book, a friend.", "I can see with my eyes.")
W(1, 6, "fluency[1].question", "I can hear with my ears", "Which sentence tells what you do with your ears?")
W(1, 6, "fluency[1].options", "a bird, a door, a car.", "It is cold. | I can hear with my ears. | This is softer than that. | These are my eyes.")
W(1, 6, "fluency[1].correctAnswer", "a bird, a door, a car.", "I can hear with my ears.")
W(1, 6, "fluency[5].question", "Which sense do I use?", "Which one is a question about the senses?")
W(1, 6, "fluency[5].options", "Smelling bread, my nose.", "It is cold. | Which sense do I use? | These are my eyes. | This is softer than that.")
W(1, 6, "fluency[5].correctAnswer", "Smelling bread, my nose.", "Which sense do I use?")
W(1, 8, "fluency[4].question", "We must not waste water.", "Which sentence is a rule about saving water?")
W(1, 8, "fluency[4].options", "Turn off the tap. | Ducks live in water.", "We must not waste water. | Ducks live in water. | I use water to drink. | It is cloudy.")
W(1, 8, "fluency[4].correctAnswer", "Turn off the tap.", "We must not waste water.")
W(1, 8, "fluency[1].question", "It is rainy.", "Which sentence tells us about the weather?")
W(1, 9, "fluency[3].question", "Stop. / Go.", "The light is red. Which road word do you say?")
W(1, 9, "fluency[3].options", "Red, Stop.", "Go. | Stop. | Thank you. | I go to the shop.")
W(1, 9, "fluency[3].correctAnswer", "Red, Stop.", "Stop.")
W(1, 1, "fluency[13].options", "it | is | in | i", "it | is | in | I")
for n, i, old, new in ((1, 14, "This word means the person I am talking to.", "the person I am talking to."),
                       (2, 13, "This word means me and the people with me.", "me and the people with me."),
                       (3, 14, "This word means those people or those things.", "those people or those things."),
                       (5, 12, "This word means a boy or a man.", "a boy or a man."),
                       (7, 11, "This word means belonging to you.", "belonging to you."),
                       (7, 12, "This word means belonging to us.", "belonging to us."),
                       (7, 13, "This word means a girl or a woman.", "a girl or a woman.")):
    S(1, n, "fluency[%d].question" % i, old, new)
W(1, 7, "fluency[10].question", "This word points to more than one thing further away.", "Which word points to more than one thing further away?")
W(1, 8, "fluency[14].question", "This word asks about a person.", "Which word asks about a person?")
S(1, 2, "quizzes[1].explanation", "A sister is a girl your own age.", "A sister is a girl in your family.")
S(1, 10, "quizzes[4].explanation", "a place, the sky and a thing.", "a place, a thing in the sky and a thing.")
W(1, 10, "comprehension[12].correctAnswer", "Labels and short patterns", "A label and a short pattern sentence")
W(1, 10, "comprehension[12].explanation", "Add labels and short patterns", "The steps say to add a label and a short pattern sentence to each page.")
K(1, 10, "eng-g01-t03-u10-cq09", "Answer: Labels and short patterns. The steps say, 'Add labels and short patterns.'", "Answer: A label and a short pattern sentence. The steps say to add a label and a short pattern sentence to each page.")
S(1, 3, "writing[3].promptAndInstructions", "Draw a box with a ball beside it.", "Draw a box with a ball on top of it.")
S(1, 7, "activities[5].instructionsAndItems", "1. Cut out a circle.", "1. Cut out a shape with eight sides, like a real STOP sign.")
S(1, 7, "activities[1].answerSummary", "completed with walk, car, bus or bicycle.", "completed with car, bus or bicycle, or 'I walk to school'.")
S(1, 8, "activities[1].instructionsAndItems", "Choose drinking, washing or giving the plants a drink.", "Choose drink, wash or water the plants.")
S(1, 9, "writing[5].promptAndInstructions", "'Please may I have a ___.'", "'Please may I have a ___?'")
# writing frames that did not fit their task: the example now shows the task
for n, i, old, new in ((1, 1, "It is ___.", "school school book book"), (1, 2, "My name is ___.", "pencil, chair, bag"),
                       (1, 3, "I am ___ years old.", "door, desk"), (2, 1, "He is my ___.", "mother mother father father"),
                       (2, 3, "Do you like ___?", "Mum, Dad"), (3, 1, "Can you ___?", "run, jump, clap"),
                       (4, 1, "It is a ___ ___.", "circle, square"), (4, 2, "I am cutting ___.", "scissors, glue, paper"),
                       (5, 3, "It has ___.", "egg, field"), (6, 3, "This is ___ than that.", "nose, mouth"),
                       (7, 1, "It goes on the ___.", "bus, car"), (7, 3, "The ___ is fast.", "road, bus stop"),
                       (8, 3, "The ___ floats.", "tap, cup. I must turn off the tap."),
                       (9, 1, "The ___ is next to the ___.", "shop shop library library")):
    W(1, n, "writing[%d].modelText" % i, old, new)

# ============================================================== GRADE 2
W(2, 1, "grammar[0].memoryTip", "same s sound", "She and sister begin with the same letter, s. If the person is a girl or a woman, choose the word that starts with s.")
W(2, 1, "comprehension[1].question", "The last line of the text", "Near the end of the text, Leo tells Nora why words matter. What does he say that words do?")
W(2, 1, "comprehension[0].explanation", "four middle sentences", "Leo names the four places one at a time: " + LQ + "I can see words in books" + RQ + ", " + LQ + "on tablets" + RQ + ", " + LQ + "on signs" + RQ + " and " + LQ + "at home" + RQ + ".")
W(2, 1, "fluency[12].options", "then | aunt | people | next", "about | aunt | people | next")
W(2, 2, "comprehension[6].question", "Which four words are repeated", "Which three words are repeated in the poem, and what new line could you add about your own street?")
W(2, 2, "comprehension[1].explanation", "from the feet upwards", "Leila shows the boots first, then the helmet and the mask, and last of all the gloves.")
W(2, 2, "fluency[1].options", "What is the police officer doing?", "Who drives the bus? | He is driving the bus. | What is your job? | Who is your neighbour?")
W(2, 2, "fluency[8].options", "doctor | nurse | driver | police", "doctor | farmer | driver | police")
S(2, 2, "grammar[2].practice", "Check yourself: 1. Is helping 2. Are climbing 3. Is cleaning 4. Are learning 5. Is growing.", "Check yourself: 1. is helping 2. are climbing 3. is cleaning 4. are learning 5. is growing.")
W(2, 3, "comprehension[8].correctAnswer", "Any three of: jumping, hopping, waving their hands, nodding their heads.", "Any three of: jumping, hopping, waving (flags or hands), nodding their heads, clapping their hands.")
W(2, 3, "comprehension[8].explanation", "four movements", "The text names five movements, so any three of them answer fully.")
K(2, 3, "eng-g02-t01-u03-cq009", "Any three of jumping, hopping, waving hands and nodding heads.", "Any three of jumping, hopping, waving flags or hands, nodding heads and clapping hands.")
W(2, 3, "writing[3].completedExample.items[4]", "rematch tomorrow, it will", "Let's have a rematch tomorrow. It will be even better.")
W(2, 4, "comprehension[6].explanation", "The first two sentences give the likeness", "Grandma Hana gives the likeness when she says a sundial " + LQ + "is like a clock" + RQ + ", and the difference when she says a clock uses hands but a sundial uses a moving shadow and only works in sunshine. A good answer gives both halves.")
W(2, 4, "comprehension[10].explanation", "The second sentence says Earth turns", "Adam says it is Earth that turns, and then explains that as Earth turns our part of the world towards the sun and away from it, the sun only seems to rise and set.")
W(2, 4, "fluency[1].options", "The sun is high at midday.", "Last night I looked at the stars. | I see the moon. | We watched the sun set. | Yesterday I played in the sunshine.")
W(2, 5, "comprehension[2].question", "knowing shapes helps us", "Teacher Yasmin asks the class to do two things with the shapes they find. What are they?")
W(2, 5, "comprehension[2].correctAnswer", "describe the things we see", "Describe each shape, and make a pattern with the shapes.")
W(2, 5, "comprehension[2].explanation", "Two sentences at the end", "She tells them to " + LQ + "be ready to describe it" + RQ + ", and later says, " + LQ + "Now let's make a pattern using what we found." + RQ)
K(2, 5, "eng-g02-t02-u05-cq003", "One mark for describing the things we see, and one mark for making patterns with shapes.", "One mark for describing each shape, and one mark for making a pattern with the shapes.")
W(2, 5, "comprehension[3].explanation", "ends with the word fingers", "Every line of the song names fingers, so fingers are what the singer is counting.")
W(2, 5, "comprehension[7].question", "How far did Leo jump?", "How far did Leo jump the first time, and how far the second time?")
W(2, 5, "comprehension[7].correctAnswer", "He jumped 45 centimetres.", "45 centimetres the first time, and 50 centimetres the second.")
K(2, 5, "eng-g02-t02-u05-cq008", "Forty-five centimetres. The unit must be given, not just the number.", "Forty-five centimetres the first time and fifty the second. The unit must be given, not just the number.")
W(2, 5, "comprehension[8].question", "The last sentence gives three ways", "Teacher Yasmin names three ways we use numbers. What are they?")
W(2, 6, "comprehension[2].explanation", "after the word because", "Teacher Yasmin gives each reason: a spider has eight legs and a worm has no legs at all, but insects have six legs.")
W(2, 6, "comprehension[8].explanation", "last speech is a short list", "Grandpa explains the needs one at a time: keep the cricket warm, give it small pieces of fruit and vegetables, and give it a small, shallow dish of water. He also adds soft grass so it can hide, so accept that too.")
W(2, 6, "fluency[8].options", "towards | upon | neck | toward", "towards | upon | neck | among")
W(2, 6, "fluency[8].correctAnswer", "toward", "towards")
W(2, 6, "fluency[8].explanation", "toward: Toward means", "towards: Towards means in the direction of someone or something.")
W(2, 6, "fluency[1].options", "They eat leaves and seeds.", "The worm crawled under the rock. | Insects have six legs. | Where do spiders live? | Look at the ant.")
S(2, 6, "grammar[0].practice", "Check yourself: 1. On 2. Under 3. In 4. Between 5. Above.", "Check yourself: 1. on 2. under 3. in 4. between 5. above.")
S(2, 6, "grammar[2].practice", "Check yourself: 1. Fly 2. Spins 3. Live 4. Makes 5. Help.", "Check yourself: 1. fly 2. spins 3. live 4. makes 5. help.")
W(2, 7, "comprehension[4].question", "Use the last sentence", "Can Earth Day be only one day a year? Use what Teacher Yasmin says at the end of the day to explain your answer.")
W(2, 7, "comprehension[4].correctAnswer", "The last sentence says", "No. Teacher Yasmin says that every day can be Earth Day if we remember to care for our planet.")
W(2, 7, "fluency[11].options", "under | over | below | behind", "inside | over | below | behind")
W(2, 8, "comprehension[4].question", "many people in cities live in flats", "Leo says he lives in a flat. What exactly is a flat?")
W(2, 8, "comprehension[8].explanation", "you climb a ladder", "Theo explains, " + LQ + "To get up, I climb a wooden ladder." + RQ + ", so a ladder is the way up.")
W(2, 8, "fluency[0].options", "There is a bed in the bedroom.", "The bed is in the bedroom. | There are four chairs. | I will tidy my room after lunch. | I will sweep the floor.")
S(2, 8, "grammar[0].practice", "Check yourself: 1. On 2. In 3. Under 4. Above 5. Between.", "Check yourself: 1. on 2. in 3. under 4. above 5. between.")
S(2, 8, "grammar[2].practice", "Check yourself: 1. Is 2. Are 3. Is 4. Are 5. Is.", "Check yourself: 1. is 2. are 3. is 4. are 5. is.")
S(2, 8, "grammar[4].practice", "Check yourself: 1. Will sweep 2. Will wash 3. Will set 4. Will build.", "Check yourself: 1. will sweep 2. will wash 3. will set 4. will build.")
W(2, 8, "writing[4].modelText", "I would rather live in a cave house", "An adobe house and a cave house are both cool inside. An adobe house is built from mud and dry grass, but a cave house is dug into rock. An adobe house stands on open ground, but a cave house is inside a hill. An adobe house has thick walls, so the hot sun cannot warm the rooms. A cave house is surrounded by rock, so it stays cool in summer and warm in winter.")
W(2, 9, "writing[3].modelText", "People borrow books and read quietly there.", "Our library sits beside the market on Green Road, and people borrow books there. The market opens early, and families buy fruit and fish. The bakery sells warm bread every morning. The bus station carries people to every part of the town. The hospital helps anybody who is hurt or ill. The park has a huge Ferris wheel that turns all evening.")
W(2, 9, "writing[4].completedExample.items[4]", "hide its whole head", "A turtle swims up to the surface to breathe air.")
S(2, 10, "quizzes[6].explanation", "past from Unit 7.", "past from Unit 4.")
W(2, 10, "fluency[0].options", "Leo and Sami wait their turn.", "Grandma Hana likes the shadow drawing. | Who cleans the high windows? | Look at page one first. | The sky is bright.")
W(2, 10, "fluency[0].correctAnswer", "Leo and Sami wait their turn.", "Grandma Hana likes the shadow drawing.")
W(2, 10, "fluency[4].options", "The pencil pot sits between", "There are three pictures beside the booklet. | Amal likes her bug page. | She finds out the news. | Look at page one first.")
W(2, 10, "fluency[4].correctAnswer", "The pencil pot sits between", "There are three pictures beside the booklet.")
W(2, 10, "fluency[14].options", "tired | thankyou | afraid | sorry", "tired | angry | afraid | sorry")
W(2, 10, "speaking[2].instructionsAndModelLines", "the other reads Nora and Leo.", "Read the dialogue Showcase Day with a partner. One of you reads Amal and Teacher Yasmin; the other reads Nora, Theo and Leo. Pause at every full stop and lift your voice at every question mark. Then swap parts and read it again.")
W(2, 10, "writing[5].successCriteria", "-ing for now", "I used a past verb for the past, a present verb for now and will for the future; I named one hard thing; I set one clear goal.")
S(2, 10, "readings[0].passageScript", "Page one told the reader her name and her class.", "Page one showed a butterfly with its wings and antennae.")
S(2, 10, "readings[0].passageScript", "Page five showed her house.", "Page five showed the trees she helped to plant.")
TITLES.append((2, "g2-u6-core-topic", "Words: small creatures and where they are", "More words for this unit"))
TITLES.append((2, "g2-u9-core-topic", "Words: places in the city", "More words for this unit"))

# ============================================================== GRADE 3
W(3, 1, "comprehension[9].explanation", "at the gate", "The sentence beginning Amal ran over at once shows what she did straight after the bag fell.")
W(3, 1, "quizzes[5].options", "likes | like | liking | liked", "likes | like | liking | are liking")
W(3, 1, "fluency[0].options", "She is learning about health.", "I am learning English. | Who is your best friend? | Listen to your teacher. | He runs fast.")
W(3, 1, "fluency[3].options", "I am learning English. | When do you have lunch?", "Who is your best friend? | My family is kind. | Don't be rude. | She is learning about health.")
W(3, 1, "fluency[8].question", "doing something to or for you", "Which word fills the gap: I tied my shoes all by ___.")
W(3, 2, "comprehension[9].explanation", "when the teacher asks", "Amal gives both reasons herself when Daniel asks why the group won.")
W(3, 2, "fluency[0].options", "Did you eat?", "The student studied for the grammar contest. | They play. | I like the library because it is quiet. | This topic is from our grammar book.")
W(3, 2, "activities[1].answerSummary", "teacher and author", "c, a, d, b " + "—" + " teacher is the only person word, so check that the learner does not pair it with the place, library.")
DROP_LINKS.append((3, 3, "g3-u3-g5-76-vacation", "ehel-dict-en-vacation-noun-02"))   # a US word; holiday is taught
W(3, 3, "fluency[1].options", "She saw the calendar.", "He watches the clock. | I didn" + RS + "t see the calendar. | She marks the calendar. | Clean your room.")
W(3, 3, "writing[3].completedExample.items[3]", "Thursday is my busiest day", "Thursday is busier than Tuesday because I have football and a spelling test.")
W(3, 3, "activities[4].answerSummary", "two comparing adverbs", "Five month names, six time words (calendar, hour, century, holiday, future and soon) and one word that compares time (sooner), each group explained in the learner" + RS + "s own sentence.")
S(3, 3, "speaking[5].instructionsAndModelLines", "Plan and record one-minute talk", "Plan and record a one-minute talk")
# Unit 4 moves to Kenya, which has counties; Tanzania has regions
for old, new in (("near Mount Meru in northern Tanzania", "near Mount Kenya in central Kenya"),
                 ("Court " + "—" + " County of Arusha.", "Court " + "—" + " Nyeri County."),
                 ("between Arusha and Kilimanjaro counties", "between Nyeri and Laikipia counties"),
                 ("Amal lives in a small village near Mount Meru,", "Amal lives in a small village near Mount Kenya,"),
                 ("Arusha and Kilimanjaro counties meet there.", "Nyeri and Laikipia counties meet there."),
                 ("Arusha and Kilimanjaro are two different counties.", "Nyeri and Laikipia are two different counties.")):
    U(3, 4, old, new)
# the sentence above is the example for the word "northern", so it must keep the word
W(3, 4, "dictionaryLinks[63].exampleSentence", "Amal's village lies in", "Amal's cousin lives in northern Kenya.")
W(3, 4, "fluency[1].options", "Does she work at the hospital?", "Exit the court quietly. | They play football. | Please wash your hands. | We can see the mountains.")
W(3, 4, "writing[1].successCriteria", "lines two and four rhyme", "I kept the four lines of the poem; I changed the places to my own; I made lines one and two rhyme, and lines three and four rhyme; I read it aloud; I drew a matching picture.")
W(3, 5, "fluency[0].options", "He removed the rubbish because it smelled. | First", "I escaped because I was scared. | Where did you travel? | I think travelling is fun. | First, they searched for smooth stones.")
W(3, 5, "fluency[2].options", "She was happy since she got good news.", "I think travelling is fun. | Why did the wall shake? | He removed the rubbish because it smelled. | Finally, they celebrated together.")
S(3, 5, "grammar[1].practice", "(because can also work in 1 and 2, since both give a reason)", "(because, since and as all give a reason, so any of the three is right in 1, 2 and 3)")
S(3, 6, "readings[4].passageScript", "the most popular pupil in our class.", "the most popular pupil in the class.")
W(3, 6, "comprehension[7].correctAnswer", "helped her", "Nora stayed calm and helped the speaker look for the lost pencil under every desk.")
W(3, 6, "comprehension[8].question", "Which two words ending in -er", "Which three words ending in -er does Leo use to describe his brother in " + LS + "Who Is Kinder?" + RS)
W(3, 6, "comprehension[8].correctAnswer", "kinder and friendlier", "kinder, friendlier and stronger")
W(3, 6, "fluency[0].options", "When I was five, I could swim.", "She was kind to her classmate. | Could you lend me your pencil, please? | Who is your best friend? | My dog is bigger than my cat.")
S(3, 6, "grammar[2].practice", "do you like the story? (How / Why)", "do you like the story? (Who / Why)")
S(3, 6, "writing[1].modelText", "Nora is kinder than she believes.", "Nora is kinder than Leo.")
S(3, 6, "writing[1].modelText", "I chose kind and busy because they are short adjectives that simply take -er.", "I chose kind because it simply takes -er, and busy because its y changes to i before -er.")
W(3, 6, "writing[1].completedExample.items[0]", "kinder than she thinks she is", "My grandmother Hana is kinder than my grandfather.")
W(3, 6, "writing[1].completedExample.items[2]", "simply take", "I chose kind because it simply takes -er, and busy because its y changes to i before -er.")
W(3, 7, "fluency[2].options", "Have you explored a forest? | Don't drop litter.", "I have explored the coast. | Have you ever visited the beach? | Yes, I have. | Don't drop litter.")
W(3, 7, "fluency[2].correctAnswer", "Have you explored a forest?", "Yes, I have.")
W(3, 7, "fluency[0].options", "Have you explored a forest? | Explore nature carefully.", "I have explored the coast. | Where is the coast? | Wear a hat. | Explore nature carefully.")
W(3, 7, "fluency[10].question", "A hard, shiny material used to make things.", "Which word means: A hard, shiny material, such as iron or gold, that can be melted and shaped into coins, pans and tools.")
S(3, 7, "grammar[1].practice", "______ you ever ____ (go) to a mountain?", "______ you ever ____ (climb) a mountain?")
S(3, 7, "grammar[1].practice", "1) Have you ever gone to a mountain?", "1) Have you ever climbed a mountain?")
# the frost moves up to the cold mountain viewpoint; the forest is cooler for its shade
S(3, 7, "readings[4].passageScript", "more shade and less wind.", "more shade from the tall trees.")
S(3, 7, "readings[4].passageScript",
  "Suddenly they saw something white and soft in the dirt, like snow.\n" + LQ + "Is that ice?" + RQ + " asked Leo.\n" + LQ + "It is frost," + RQ + " said the teacher. " + LQ + "Water here froze one very cold night." + RQ + "\n" + LQ + "Frozen water, so near our warm coast?" + RQ + " asked Amal, surprised.\n" + LQ + "Yes," + RQ + " the teacher smiled. " + LQ + "Even here, the weather can surprise us." + RQ + "\nThey climbed higher and reached the mountain viewpoint.\n",
  "They climbed higher and reached the mountain viewpoint. The air up here was cold.\nSuddenly they saw something white and soft on the rocks, like snow.\n" + LQ + "Is that ice?" + RQ + " asked Leo.\n" + LQ + "It is frost," + RQ + " said the teacher. " + LQ + "Up here, the water froze one very cold night." + RQ + "\n" + LQ + "Frozen water, so near our warm coast?" + RQ + " asked Amal, surprised.\n" + LQ + "Yes," + RQ + " the teacher smiled. " + LQ + "High on a mountain, the nights are much colder." + RQ + "\n")
W(3, 7, "comprehension[10].correctAnswer", "more shade and less wind", "The tall trees give more shade, so the forest is cooler than the sunny beach.")
W(3, 7, "comprehension[10].explanation", "shade", "Teacher Yasmin says the climate is different in the forest because the tall trees give more shade.")
S(3, 8, "readings[3].passageScript", "the biggest number of all.", "the biggest number in our list.")
W(3, 8, "comprehension[2].question", "on the way home", "Name two things that Amal measures or checks at home or on the walk to her cousins' house.")
W(3, 8, "comprehension[4].question", "in every line of the pattern poem", "What repeats in the first three lines of the pattern poem?")
W(3, 8, "comprehension[4].correctAnswer", "Two counting numbers begin the line", "Two counting numbers begin each line, and a word that rhymes with the second number ends it.")
W(3, 8, "comprehension[3].explanation", "Each line of the poem opens", "Each of the first three lines opens with the next pair of counting numbers.")
W(3, 8, "comprehension[5].explanation", "Today we will measure three things", "The speaker says, " + LQ + "There are three things I want each team to measure before break time," + RQ + " before listing them.")
S(3, 8, "activities[2].instructionsAndItems", "1. The ______ of the tree is very tall.", "1. The ______ of the tree is ten metres.")
W(3, 9, "comprehension[6].explanation", "Sami speaks as I can imagine", "Sami says " + LQ + "I imagine that I can fly" + RQ + ", and Amal reports " + LQ + "Sami said he could imagine flying" + RQ + ", so I becomes he and can moves back to could.")
W(3, 9, "fluency[3].options", "His kindness made a difference.", "Allow others to speak. | We will share more ideas tomorrow. | Please listen carefully. | I like thinking and dreaming.")
S(3, 9, "grammar[3].practice", "(a reason / some reasons)", "(many reasons / much reasons)")
S(3, 9, "grammar[3].practice", "Answer key: 1. a reason,", "Answer key: 1. many reasons,")
W(3, 9, "writing[3].completedExample.items[1]", "imagine something braver", "Sami felt unsure, but Amal told him to imagine something better.")
W(3, 9, "writing[3].completedExample.items[2]", "crossing the sea in a small boat", "He wrote about flying over the sea, and the whole class smiled.")
W(3, 10, "fluency[0].options", "Where did you find that fact?", "We did not build the stand on Monday. | They listen carefully. | I am building my display table. | Read every page aloud.")
S(3, 10, "grammar[3].ruleAndExamples", "Two adjectives take a comma between them: " + LQ + "the large, quiet library" + RQ + ".",
  "Two describing words of the same kind take a comma between them: " + LQ + "the calm, quiet library" + RQ + ". Different kinds, such as size and colour, need no comma: " + LQ + "a small grey cat" + RQ + ".")
W(3, 10, "grammar[3].memoryTip", "One or two beats usually take -er", "Clap the beats in the adjective. One beat takes -er; two beats ending in -y change y to i and take -er (busy becomes busier); most other adjectives of two or more beats take the word more.")
TITLES.append((3, "g3-u6-core-topic-g2", "Words: small creatures and where they are", "Words: directions and finding things"))
TITLES.append((3, "g3-u9-core-topic", "Words: thinking it through", "Words: better and best"))

# ============================================================== GRADE 4
W(4, 1, "fluency[1].options", "He checks the mail.", "They enjoy playing football. | He always checks the mail. | She has got the skills she needs. | Close the window.")
W(4, 1, "fluency[1].correctAnswer", "He checks the mail.", "He always checks the mail.")
W(4, 2, "fluency[1].options", "Prepositions of place show", "The storm is coming. | Birds fly south. | I cannot (can't) swim. | The leaves are rustling in the rain.")
W(4, 2, "quizzes[2].explanation", "Nora had just run to the hall", "Nora had just hurried to the hall, so she sat down catching her breath.")
S(4, 2, "writing[0].promptAndInstructions", "Choose one kind of powerful weather:", "Choose one kind of powerful natural event:")
S(4, 2, "speaking[4].instructionsAndModelLines", "as Nora does at the science fair.", "as " + LS + "Weather Around the World" + RS + " does.")
W(4, 3, "comprehension[2].correctAnswer", "Eat, Wash, Drink", "Any two of these command verbs: Eat, Choose, Wash, Drink, Gather.")
W(4, 3, "comprehension[2].explanation", "Each line of the poster opens", "Most lines of the poster open with a base verb, which is what makes them imperatives.")
W(4, 3, "quizzes[9].options", "We bought rice, lamb, and dates.", "We bought rice lamb and dates. | We bought, rice lamb and dates. | We bought rice, lamb and dates. | We, bought rice, lamb and dates.")
W(4, 3, "quizzes[9].correctAnswer", "We bought rice, lamb, and dates.", "We bought rice, lamb and dates.")
W(4, 3, "quizzes[9].explanation", "", "Commas separate the items in a list, " + LQ + "and" + RQ + " comes before the last item, and no comma belongs after the verb bought.")
S(4, 3, "activities[7].instructionsAndItems", "4. Omar works alone, but ______ a neighbour helps him.", "4. Omar ______ works alone, but sometimes a neighbour helps him.")
W(4, 4, "fluency[1].options", "There are many books.", "They deliver letters. | There is a library. | I read books. | The book is read by the teacher.")
W(4, 4, "fluency[2].options", "I need some water.", "Please erase your mistakes neatly. | The letters were delivered yesterday. | They deliver letters. | Close the door.")
W(4, 4, "fluency[7].options", "besides | furthermore | energy | notice", "besides | payment | energy | notice")
W(4, 4, "fluency[8].question", "to see or hear something for the first time", "Which word fills the gap: To ___ means to see or become aware of something.")
S(4, 4, "activities[8].instructionsAndItems", LQ + "Endings that make nouns: -less and -ment" + RQ, LQ + "Word endings: -less and -ment" + RQ)
W(4, 4, "activities[4].answerSummary", "", "Things we share: service, information, knowledge, thought. Words that describe: circular, plain. Things we do: deliver, discover, erase, tease. Quality and quantity are naming words, so accept them in a group the learner names and explains, such as Things we measure.")
W(4, 4, "writing[3].modelText", "I trust the noticeboard because its words never change on the way.", "Our community shares news in three different ways. The market seller repeats whatever he hears, but the noticeboard keeps the message the same for everybody. The class newspaper goes home with every child, and parents read it at the weekend. I trust the noticeboard because its words never change on the way. The market seller is quicker, but his stories sometimes grow as they travel. The newspaper is my favourite because children write it for their own town.")
W(4, 5, "fluency[0].options", "She ran quickly.", "We found a cave last Saturday. | Peek inside. | Proceed carefully. | First, move slowly so you do not frighten the animal.")
W(4, 5, "fluency[2].options", "Finally, carry the animal to a helper.", "Did she rescue the bird? | He plays football well. | Proceed carefully. | We found a cave last Saturday.")
W(4, 5, "quizzes[0].explanation", "but the car does not", "Only an animal with four legs can gallop, which is why the horse beside the race field gallops.")
W(4, 5, "quizzes[6].question", "A snail moves slowly in a _____ shape.", "Choose the missing word from " + LS + "How Animals Move" + RS + ": A snail moves slowly and steadily, tracing a _____ shape into its shell as it grows.")
S(4, 5, "writing[3].modelText", "2. A snail travels slowly in a spiral.", "2. A snail moves slowly and steadily, and its shell grows in a spiral.")
S(4, 5, "grammar[5].practice", "Amal peeked inside, then she proceeded down the spiral.", "Amal peeked inside, and then she proceeded down the spiral.")
W(4, 5, "activities[4].instructionsAndItems", "Sort all twenty Word Wall words", "Sort these twenty story words into four groups (Moving and Going, Looking and Watching, Using Your Hands and Body, Helping and Doing the Right Thing): gallop, accelerate, proceed, spiral, rate, peek, gaze, check, signal, describe, squeeze, whistle, pressure, suffer, excite, rescue, defend, prevent, admit, greedy.\nThen write one sentence for each group explaining what its words have in common.")
S(4, 6, "comprehension[1].explanation", "moving him along it", "moving her along it")
W(4, 6, "activities[4].instructionsAndItems", "Sort all twenty unit words", "Sort these twenty words into four groups (Community Helpers and Workers; Leaders and the Law; People Who Share Stories and News; People and Where They Belong): caretaker, carpenter, labourer, engineer, merchant, governor, senator, lawyer, military, artist, photographer, messenger, article, hero, refugee, immigrant, tenant, consumer, bachelor, personal.\nThen write one sentence explaining the rule for each group.")
W(4, 7, "quizzes[1].question", "before her spelling test", "Amal" + RS + "s hands shook behind the curtain before the school play. Which word describes her best?")
S(4, 7, "grammar[5].practice", "4. I had __________ (anxious / happy) thoughts before the exam.", "4. I had __________ (anxious / fierce) thoughts before the exam.")
S(4, 7, "grammar[5].practice", "5. The class had one __________ (fierce / soft) debate", "5. The class had a __________ (fierce / soft) debate")
S(4, 7, "grammar[5].practice", "6. She gave me one __________ (sad / proud) smile", "6. She gave me a __________ (proud / loud) smile")
S(4, 7, "activities[3].answerSummary", "gentle drops its final e, so gentlely is wrong.", "gentle ends in -le, so the final e changes to y (gentle becomes gently); gentlely is wrong.")
S(4, 7, "writing[3].modelText", "She smiled at last, and she has joined us every break time since. Being generous with your time costs nothing at all.", "She smiled at last, and after that she joined us every break time. Being generous with my time cost me nothing at all.")
S(4, 8, "readings[1].passageScript", "so the moon and the planets stayed small, pale dots that nobody could study closely.", "so the planets stayed small, pale dots, and nobody could study the moon closely.")
S(4, 8, "readings[2].passageScript", "in a bowl or a plate that is safe for the microwave", "in a bowl or on a plate that is safe for the microwave")
W(4, 8, "fluency[3].options", "I do not have to go.", "The crew that worked hard finished early. | A machine that heats food is a microwave. | Wash your hands before you eat. | She baked biscuits.")
W(4, 8, "fluency[8].options", "concerning | regarding", "national | regarding | comfortable | Africa")
S(4, 8, "writing[3].modelText", "They found an old box, but they waited for their teacher because the attic clue was for everyone.", "Under an old curtain they found a table of tools and a briefcase, and inside it was a note for the student who will build the future.")
W(4, 9, "comprehension[4].correctAnswer", "The factories make goods for the whole nation.", "The factories make goods such as cloth, shoes and tools for the farm, and the goods are for the whole nation.")
W(4, 10, "comprehension[10].question", "on the evening before the Exhibition", "Name the three things Amal did at the kitchen table that evening, after she had written her title.")
W(4, 10, "fluency[1].options", "Did Sami deliver the invitations?", "Omar usually sorts the mail first. | Leo was measuring the wall when the bell rang. | I will bring the folder tomorrow. | Where does Omar sort the mail?")
W(4, 10, "fluency[5].options", "Join ideas with and, but, so", "The caretaker opens the hall at seven. | We finished the board, so we rehearsed our talk. | We did not finish the board on Tuesday. | You mustn't run in the hall.")
W(4, 10, "fluency[5].correctAnswer", "Join ideas with and, but, so", "We finished the board, so we rehearsed our talk.")
W(4, 10, "writing[1].modelText", "for eleven years", "Omar sorts the mail and weighs the parcels at the post counter every morning. " + LQ + "Not everyone owns a phone," + RQ + " he told me, " + LQ + "so one letter can still bring peace." + RQ)
TITLES.append((4, "g4-u1-core-topic-g2", "Words: time and family", "Words: honesty, trust and respect"))
TITLES.append((4, "g4-u4-core-topic-g2", "Words: light, sky and weather", "Words: finding out and describing"))
TITLES.append((4, "g4-u4-core-spelling", "Endings that make nouns: -less and -ment", "Word endings: -less and -ment"))
TITLES.append((4, "g4-u6-core-topic-g2", "Words: small creatures and where they are", "Words: how we feel"))
TITLES.append((4, "g4-u7-core-joining", "Words that say how often, and where beside", "Words that say how often, and alongside"))
TITLES.append((4, "g4-u9-core-topic-g2", "Words: places in the city", "Words: how we feel"))


# ============================================================== engine
def load(g, n):
    p = os.path.join(E, "grade-%d" % g, "data", "units", "unit-%d.json" % n)
    raw = io.open(p, encoding="utf-8", newline="").read()
    nl = "\r\n" if "\r\n" in raw else "\n"
    d = json.loads(raw)
    if json.dumps(d, ensure_ascii=False, indent=2) + "\n" != raw.replace("\r\n", "\n"):
        sys.exit("REFUSED: %s does not round-trip" % p)
    return p, nl, d


def parts(path):
    return [int(x[1:-1]) if x.startswith("[") else x for x in re.findall(r"[^.\[\]]+|\[\d+\]", path)]


def getp(d, path):
    o = d
    for k in parts(path):
        o = o[k]
    return o


def setp(d, path, v):
    ps = parts(path)
    o = d
    for k in ps[:-1]:
        o = o[k]
    o[ps[-1]] = v


def main():
    write = "--write" in sys.argv
    for a in sys.argv[1:]:
        if a != "--write":
            sys.exit("REFUSED: unrecognised argument %r" % a)
    docs, done, skipped, problems = {}, 0, 0, []

    def doc(g, n):
        if (g, n) not in docs:
            docs[(g, n)] = list(load(g, n)) + [False]
        return docs[(g, n)]

    for op, g, n, path, old, new in EDITS:
        entry = doc(g, n)
        d = entry[2]
        if op == "S":
            cur = getp(d, path)
            if old in cur:
                if cur.count(old) != 1:
                    problems.append("G%d U%d %s: %r occurs %d times" % (g, n, path, old[:40], cur.count(old)))
                    continue
                setp(d, path, cur.replace(old, new)); done += 1; entry[3] = True
            elif new in cur:
                skipped += 1
            else:
                problems.append("G%d U%d %s: old text not found: %r" % (g, n, path, old[:60]))
        elif op == "W":
            cur = getp(d, path)
            if cur == new:
                skipped += 1
            elif old in cur:
                setp(d, path, new); done += 1; entry[3] = True
            else:
                problems.append("G%d U%d %s: expected fragment not found: %r (now %r)" % (g, n, path, old[:50], str(cur)[:60]))
        elif op == "K":
            rows = [a for a in d["answerKey"] if a.get("contentId") == path]
            changed = already = False
            for a in rows:
                if old in a["answerOrGuidance"]:
                    a["answerOrGuidance"] = a["answerOrGuidance"].replace(old, new); changed = True
                elif new in a["answerOrGuidance"]:
                    already = True
            if changed:
                done += 1; entry[3] = True
            elif already:
                skipped += 1
            else:
                problems.append("G%d U%d key %s: old text not found" % (g, n, path))
        elif op == "U":
            count = [0]

            def walk(o):
                if isinstance(o, dict):
                    for k, v in list(o.items()):
                        if isinstance(v, str) and old in v:
                            o[k] = v.replace(old, new); count[0] += 1
                        else:
                            walk(v)
                elif isinstance(o, list):
                    for i, v in enumerate(o):
                        if isinstance(v, str) and old in v:
                            o[i] = v.replace(old, new); count[0] += 1
                        else:
                            walk(v)
            walk(d)
            if count[0]:
                done += 1; entry[3] = True
            elif new in json.dumps(d, ensure_ascii=False):
                skipped += 1
            else:
                problems.append("G%d U%d unit-wide: %r not found" % (g, n, old[:60]))

    side_files = {}                # path -> new text, for the manifest and the master dictionary
    for g, n, vid, dict_id in DROP_LINKS:
        entry = doc(g, n)
        d = entry[2]
        before = len(d["dictionaryLinks"])
        d["dictionaryLinks"] = [l for l in d["dictionaryLinks"] if l.get("vocabularyId") != vid]
        for grp in d["vocabularyGroups"]:
            if vid in grp.get("vocabularyIds", []):
                grp["vocabularyIds"] = [x for x in grp["vocabularyIds"] if x != vid]
        if len(d["dictionaryLinks"]) != before:
            done += 1; entry[3] = True
        else:
            skipped += 1
        # the manifest counts the unit's words, and the grade dictionary held the entry the link pointed at
        data = os.path.join(E, "grade-%d" % g, "data")
        mp = os.path.join(data, "course-manifest.json")
        mraw = io.open(mp, encoding="utf-8", newline="").read()
        man = json.loads(mraw)
        row = next(u for u in man["units"] if u.get("number") == n)
        if row.get("vocabularyCount") != len(d["dictionaryLinks"]):
            row["vocabularyCount"] = len(d["dictionaryLinks"])
            side_files[mp] = json.dumps(man, ensure_ascii=False, indent=2) + "\n"
        dp = os.path.join(data, "master-dictionary.grade%d.json" % g)
        draw = io.open(dp, encoding="utf-8", newline="").read()
        md = json.loads(draw)
        linked = any(dict_id in json.dumps(doc(g, k)[2]) for k in range(1, 11))
        kept = [e for e in md["entries"] if e.get("dictionaryEntryId") != dict_id]
        if len(kept) != len(md["entries"]) and not linked:
            md["entries"] = kept
            md["entryCount"] = len(kept)
            side_files[dp] = json.dumps(md, ensure_ascii=False, indent=1) + "\n"

    core_changes = {}
    for g, gid, old, new in TITLES:
        n = int(re.search(r"-u(\d+)-", gid).group(1))
        entry = doc(g, n)
        grp = next((x for x in entry[2]["vocabularyGroups"] if x.get("id") == gid), None)
        if grp is None:
            problems.append("G%d: no vocabulary group %s" % (g, gid)); continue
        if grp["title"] == new:
            skipped += 1
        elif grp["title"] == old:
            grp["title"] = new; done += 1; entry[3] = True
        else:
            problems.append("G%d %s: title is %r" % (g, gid, grp["title"])); continue
        core_changes.setdefault(g, []).append((gid, old, new))

    for (g, n), (p, nl, d, changed) in sorted(docs.items()):
        if changed and write:
            io.open(p, "w", encoding="utf-8", newline="").write((json.dumps(d, ensure_ascii=False, indent=2) + "\n").replace("\n", nl))
    for path, text in side_files.items():
        print("    side file: %s" % os.path.relpath(path, ROOT))
        if write:
            io.open(path, "w", encoding="utf-8", newline="").write(text)
    for g, changes in core_changes.items():
        cp = os.path.join(E, "grade-%d" % g, "data", "core-words.json")
        raw = io.open(cp, encoding="utf-8", newline="").read()
        out = raw
        for gid, old, new in changes:
            pat = re.compile(r'("id":\s*"%s",\s*"title":\s*")%s(")' % (re.escape(gid), re.escape(old)))
            if pat.search(out):
                out = pat.sub(lambda m: m.group(1) + new + m.group(2), out)
            elif not re.search(r'"id":\s*"%s",\s*"title":\s*"%s"' % (re.escape(gid), re.escape(new)), out):
                problems.append("G%d core-words.json: group %s title not found" % (g, gid))
        if out != raw and write:
            io.open(cp, "w", encoding="utf-8", newline="").write(out)

    print("\n  English Grades 1-4 review repairs (%s)" % ("WRITING" if write else "dry run - add --write"))
    print("    applied: %d | already applied: %d | refused: %d" % (done, skipped, len(problems)))
    for pr in problems:
        print("    REFUSED " + pr)
    print("    units touched: %s" % ", ".join("g%du%d" % k for k, v in sorted(docs.items()) if v[3]))
    if problems:
        sys.exit(1)


if __name__ == "__main__":
    main()
