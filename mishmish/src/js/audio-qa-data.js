/* מְיֻצָּר אוֹטוֹמָטִית עַל־יְדֵי סוֹכֵן־הַתִּזְמוּרֶת — נְתוּנֵי בְּדִיקַת־אוֹדְיוֹ (QA). מָקוֹר: assets/audio/manifest.json + scripts/mishmish-audio-report.json + packs.
   סְקִירָה: 99 קְלִיפִּים · 99 נִבְדְּקוּ בְּ־Whisper · 36 אַזְהָרוֹת. */
window.MISHMISH_AUDIO_QA = {
 "generated_from": "report+manifest+packs",
 "total": 99,
 "qa_done": 99,
 "warn": 36,
 "clips": [
  {
   "key": "amir/amiya-he",
   "path": "amir/amiya-he.mp3",
   "he": "אמיר לוחש לכם בערבית…",
   "pack": "",
   "kind": "",
   "heard": "אמיר לוחש לכם בערבית",
   "verdict": "ok"
  },
  {
   "key": "amir/encourage-he",
   "path": "amir/encourage-he.mp3",
   "he": "עוד פעם — הקשיבו טוב, אתם קרובים!",
   "pack": "",
   "kind": "",
   "heard": "עוד פעם, הקשיבותו, עתם כאווים",
   "verdict": "WARN"
  },
  {
   "key": "amir/point-he",
   "path": "amir/point-he.mp3",
   "he": "הסתכלו — מישמיש מראה לכם איפה.",
   "pack": "",
   "kind": "",
   "heard": "הסתכלו! מיש מיש מלא לכם איפה",
   "verdict": "WARN"
  },
  {
   "key": "con/abba",
   "path": "con/abba.mp3",
   "he": "אבא",
   "pack": "family",
   "kind": "ניגוד פּ/בּ",
   "heard": "הבא",
   "verdict": "ok"
  },
  {
   "key": "con/balon",
   "path": "con/balon.mp3",
   "he": "בלון",
   "pack": "hobbies",
   "kind": "ניגוד פּ/בּ",
   "heard": "בלון",
   "verdict": "ok"
  },
  {
   "key": "con/banana",
   "path": "con/banana.mp3",
   "he": "בננה",
   "pack": "market",
   "kind": "ניגוד פּ/בּ",
   "heard": "בננה",
   "verdict": "ok"
  },
  {
   "key": "con/barvaz",
   "path": "con/barvaz.mp3",
   "he": "ברוז",
   "pack": "nature",
   "kind": "ניגוד פּ/בּ",
   "heard": "ברוז",
   "verdict": "ok"
  },
  {
   "key": "con/beten",
   "path": "con/beten.mp3",
   "he": "בטן",
   "pack": "body",
   "kind": "ניגוד פּ/בּ",
   "heard": "לדה",
   "verdict": "WARN"
  },
  {
   "key": "con/bevakasha",
   "path": "con/bevakasha.mp3",
   "he": "בבקשה",
   "pack": "class",
   "kind": "ניגוד פּ/בּ",
   "heard": "בווקשה",
   "verdict": "ok"
  },
  {
   "key": "con/panas",
   "path": "con/panas.mp3",
   "he": "פנס",
   "pack": "market",
   "kind": "ניגוד פּ/בּ",
   "heard": "ת nelle Granada FOR College",
   "verdict": "WARN"
  },
  {
   "key": "con/parpar",
   "path": "con/parpar.mp3",
   "he": "פרפר",
   "pack": "nature",
   "kind": "ניגוד פּ/בּ",
   "heard": "בואו-בוא",
   "verdict": "WARN"
  },
  {
   "key": "con/pe",
   "path": "con/pe.mp3",
   "he": "פה",
   "pack": "body",
   "kind": "ניגוד פּ/בּ",
   "heard": "ב",
   "verdict": "WARN"
  },
  {
   "key": "con/perach",
   "path": "con/perach.mp3",
   "he": "פרח",
   "pack": "colors",
   "kind": "ניגוד פּ/בּ",
   "heard": "פרח",
   "verdict": "ok"
  },
  {
   "key": "con/pitchu",
   "path": "con/pitchu.mp3",
   "he": "פתחו",
   "pack": "family",
   "kind": "ניגוד פּ/בּ",
   "heard": "פתרו",
   "verdict": "WARN"
  },
  {
   "key": "lex/apple-he",
   "path": "lex/apple-he.mp3",
   "he": "תפוח",
   "pack": "market",
   "kind": "מילה",
   "heard": "תפוחה",
   "verdict": "ok"
  },
  {
   "key": "lex/apricot-he",
   "path": "lex/apricot-he.mp3",
   "he": "משמש",
   "pack": "market",
   "kind": "מילה",
   "heard": "משמש",
   "verdict": "ok"
  },
  {
   "key": "lex/ball-blue-he",
   "path": "lex/ball-blue-he.mp3",
   "he": "כדור כחל",
   "pack": "colors",
   "kind": "מילה",
   "heard": "כדור ככל",
   "verdict": "WARN"
  },
  {
   "key": "lex/ball-green-he",
   "path": "lex/ball-green-he.mp3",
   "he": "כדור ירק",
   "pack": "colors",
   "kind": "מילה",
   "heard": "קדו ירוק",
   "verdict": "WARN"
  },
  {
   "key": "lex/ball-he",
   "path": "lex/ball-he.mp3",
   "he": "כדורגל",
   "pack": "hobbies",
   "kind": "מילה",
   "heard": "כדורגל",
   "verdict": "ok"
  },
  {
   "key": "lex/ball-red-he",
   "path": "lex/ball-red-he.mp3",
   "he": "כדור אדום",
   "pack": "colors",
   "kind": "מילה",
   "heard": "כדור אדום",
   "verdict": "ok"
  },
  {
   "key": "lex/ball-yellow-he",
   "path": "lex/ball-yellow-he.mp3",
   "he": "כדור צהב",
   "pack": "colors",
   "kind": "מילה",
   "heard": "כדור צהוב",
   "verdict": "ok"
  },
  {
   "key": "lex/banana-he",
   "path": "lex/banana-he.mp3",
   "he": "בננה",
   "pack": "market",
   "kind": "מילה",
   "heard": "בננה",
   "verdict": "ok"
  },
  {
   "key": "lex/bevakasha-he",
   "path": "lex/bevakasha-he.mp3",
   "he": "בבקשה",
   "pack": "class",
   "kind": "מילה",
   "heard": "בווקא שע.",
   "verdict": "WARN"
  },
  {
   "key": "lex/bike-he",
   "path": "lex/bike-he.mp3",
   "he": "אופנים",
   "pack": "hobbies",
   "kind": "מילה",
   "heard": "הופנים",
   "verdict": "ok"
  },
  {
   "key": "lex/bird-he",
   "path": "lex/bird-he.mp3",
   "he": "צפור",
   "pack": "nature",
   "kind": "מילה",
   "heard": "ציפו",
   "verdict": "ok"
  },
  {
   "key": "lex/bread-he",
   "path": "lex/bread-he.mp3",
   "he": "לחם",
   "pack": "market",
   "kind": "מילה",
   "heard": "לכם",
   "verdict": "WARN"
  },
  {
   "key": "lex/brother-he",
   "path": "lex/brother-he.mp3",
   "he": "אח",
   "pack": "family",
   "kind": "מילה",
   "heard": "אך",
   "verdict": "WARN"
  },
  {
   "key": "lex/brush-he",
   "path": "lex/brush-he.mp3",
   "he": "מכחול",
   "pack": "hobbies",
   "kind": "מילה",
   "heard": "מחול",
   "verdict": "WARN"
  },
  {
   "key": "lex/butterfly-he",
   "path": "lex/butterfly-he.mp3",
   "he": "פרפר",
   "pack": "nature",
   "kind": "מילה",
   "heard": "פרפר",
   "verdict": "ok"
  },
  {
   "key": "lex/cat-he",
   "path": "lex/cat-he.mp3",
   "he": "חתול",
   "pack": "nature",
   "kind": "מילה",
   "heard": "חתול",
   "verdict": "ok"
  },
  {
   "key": "lex/cheese-he",
   "path": "lex/cheese-he.mp3",
   "he": "גבינה",
   "pack": "market",
   "kind": "מילה",
   "heard": "גבינה",
   "verdict": "ok"
  },
  {
   "key": "lex/cook-he",
   "path": "lex/cook-he.mp3",
   "he": "טבח",
   "pack": "hobbies",
   "kind": "מילה",
   "heard": "תבח",
   "verdict": "WARN"
  },
  {
   "key": "lex/cucumber-he",
   "path": "lex/cucumber-he.mp3",
   "he": "מלפפון",
   "pack": "market",
   "kind": "מילה",
   "heard": "מלפון",
   "verdict": "WARN"
  },
  {
   "key": "lex/dad-he",
   "path": "lex/dad-he.mp3",
   "he": "אבא",
   "pack": "family",
   "kind": "מילה",
   "heard": "הבא",
   "verdict": "ok"
  },
  {
   "key": "lex/doctor-he",
   "path": "lex/doctor-he.mp3",
   "he": "רופא",
   "pack": "hobbies",
   "kind": "מילה",
   "heard": "אופה",
   "verdict": "ok"
  },
  {
   "key": "lex/dog-he",
   "path": "lex/dog-he.mp3",
   "he": "כלב",
   "pack": "nature",
   "kind": "מילה",
   "heard": "כלב",
   "verdict": "ok"
  },
  {
   "key": "lex/driver-he",
   "path": "lex/driver-he.mp3",
   "he": "נהג",
   "pack": "hobbies",
   "kind": "מילה",
   "heard": "נחג",
   "verdict": "WARN"
  },
  {
   "key": "lex/eye-he",
   "path": "lex/eye-he.mp3",
   "he": "עין",
   "pack": "body",
   "kind": "מילה",
   "heard": "אין",
   "verdict": "ok"
  },
  {
   "key": "lex/fish-he",
   "path": "lex/fish-he.mp3",
   "he": "דג",
   "pack": "nature",
   "kind": "מילה",
   "heard": "דג",
   "verdict": "ok"
  },
  {
   "key": "lex/flower-blue-he",
   "path": "lex/flower-blue-he.mp3",
   "he": "פרח כחל",
   "pack": "colors",
   "kind": "מילה",
   "heard": "פירח ככל.",
   "verdict": "WARN"
  },
  {
   "key": "lex/flower-he",
   "path": "lex/flower-he.mp3",
   "he": "פרח",
   "pack": "nature",
   "kind": "מילה",
   "heard": "ברח",
   "verdict": "WARN"
  },
  {
   "key": "lex/flower-red-he",
   "path": "lex/flower-red-he.mp3",
   "he": "פרח אדום",
   "pack": "colors",
   "kind": "מילה",
   "heard": "פרח הדום",
   "verdict": "ok"
  },
  {
   "key": "lex/foot-he",
   "path": "lex/foot-he.mp3",
   "he": "רגל",
   "pack": "body",
   "kind": "מילה",
   "heard": "רגל",
   "verdict": "ok"
  },
  {
   "key": "lex/grandma-he",
   "path": "lex/grandma-he.mp3",
   "he": "סבתא",
   "pack": "family",
   "kind": "מילה",
   "heard": "סבטה",
   "verdict": "WARN"
  },
  {
   "key": "lex/grandpa-he",
   "path": "lex/grandpa-he.mp3",
   "he": "סבא",
   "pack": "family",
   "kind": "מילה",
   "heard": "סבא",
   "verdict": "ok"
  },
  {
   "key": "lex/grapes-he",
   "path": "lex/grapes-he.mp3",
   "he": "ענבים",
   "pack": "market",
   "kind": "מילה",
   "heard": "ענבים",
   "verdict": "ok"
  },
  {
   "key": "lex/hand-he",
   "path": "lex/hand-he.mp3",
   "he": "יד",
   "pack": "body",
   "kind": "מילה",
   "heard": "יד",
   "verdict": "ok"
  },
  {
   "key": "lex/happy-he",
   "path": "lex/happy-he.mp3",
   "he": "שמח",
   "pack": "body",
   "kind": "מילה",
   "heard": "סמר",
   "verdict": "WARN"
  },
  {
   "key": "lex/head-he",
   "path": "lex/head-he.mp3",
   "he": "ראש",
   "pack": "body",
   "kind": "מילה",
   "heard": "אוש",
   "verdict": "ok"
  },
  {
   "key": "lex/iparon-he",
   "path": "lex/iparon-he.mp3",
   "he": "עפרון",
   "pack": "class",
   "kind": "מילה",
   "heard": "ופרון",
   "verdict": "ok"
  },
  {
   "key": "lex/kise-he",
   "path": "lex/kise-he.mp3",
   "he": "כסא",
   "pack": "class",
   "kind": "מילה",
   "heard": "כי זה",
   "verdict": "WARN"
  },
  {
   "key": "lex/leaf-he",
   "path": "lex/leaf-he.mp3",
   "he": "עלה",
   "pack": "nature",
   "kind": "מילה",
   "heard": "הלא",
   "verdict": "ok"
  },
  {
   "key": "lex/machak-he",
   "path": "lex/machak-he.mp3",
   "he": "מחק",
   "pack": "class",
   "kind": "מילה",
   "heard": "מחק",
   "verdict": "ok"
  },
  {
   "key": "lex/machberet-he",
   "path": "lex/machberet-he.mp3",
   "he": "מחברת",
   "pack": "class",
   "kind": "מילה",
   "heard": "מחברת",
   "verdict": "ok"
  },
  {
   "key": "lex/milk-he",
   "path": "lex/milk-he.mp3",
   "he": "חלב",
   "pack": "market",
   "kind": "מילה",
   "heard": "חלב",
   "verdict": "ok"
  },
  {
   "key": "lex/mom-he",
   "path": "lex/mom-he.mp3",
   "he": "אמא",
   "pack": "family",
   "kind": "מילה",
   "heard": "עכשיו",
   "verdict": "WARN"
  },
  {
   "key": "lex/music-he",
   "path": "lex/music-he.mp3",
   "he": "מוזיקה",
   "pack": "hobbies",
   "kind": "מילה",
   "heard": "מוזיקה",
   "verdict": "ok"
  },
  {
   "key": "lex/orange-he",
   "path": "lex/orange-he.mp3",
   "he": "תפוז",
   "pack": "market",
   "kind": "מילה",
   "heard": "תפוז",
   "verdict": "ok"
  },
  {
   "key": "lex/sad-he",
   "path": "lex/sad-he.mp3",
   "he": "עצוב",
   "pack": "body",
   "kind": "מילה",
   "heard": "עצוב",
   "verdict": "ok"
  },
  {
   "key": "lex/scared-he",
   "path": "lex/scared-he.mp3",
   "he": "מפחד",
   "pack": "body",
   "kind": "מילה",
   "heard": "מפחד",
   "verdict": "ok"
  },
  {
   "key": "lex/sefer-he",
   "path": "lex/sefer-he.mp3",
   "he": "ספר",
   "pack": "class",
   "kind": "מילה",
   "heard": "ספיל",
   "verdict": "WARN"
  },
  {
   "key": "lex/shalom-he",
   "path": "lex/shalom-he.mp3",
   "he": "שלום",
   "pack": "family",
   "kind": "מילה",
   "heard": "שלום",
   "verdict": "ok"
  },
  {
   "key": "lex/sister-he",
   "path": "lex/sister-he.mp3",
   "he": "אחות",
   "pack": "family",
   "kind": "מילה",
   "heard": "אחות",
   "verdict": "ok"
  },
  {
   "key": "lex/teacher-he",
   "path": "lex/teacher-he.mp3",
   "he": "מורה",
   "pack": "hobbies",
   "kind": "מילה",
   "heard": "מורי",
   "verdict": "ok"
  },
  {
   "key": "lex/tired-he",
   "path": "lex/tired-he.mp3",
   "he": "עיף",
   "pack": "body",
   "kind": "מילה",
   "heard": "עייף",
   "verdict": "ok"
  },
  {
   "key": "lex/toda-he",
   "path": "lex/toda-he.mp3",
   "he": "תודה",
   "pack": "family",
   "kind": "מילה",
   "heard": "תודה",
   "verdict": "ok"
  },
  {
   "key": "lex/tomato-he",
   "path": "lex/tomato-he.mp3",
   "he": "עגבניה",
   "pack": "market",
   "kind": "מילה",
   "heard": "אגווניה",
   "verdict": "WARN"
  },
  {
   "key": "lex/tree-he",
   "path": "lex/tree-he.mp3",
   "he": "עץ",
   "pack": "nature",
   "kind": "מילה",
   "heard": "אצ.",
   "verdict": "ok"
  },
  {
   "key": "lex/yalkut-he",
   "path": "lex/yalkut-he.mp3",
   "he": "ילקוט",
   "pack": "class",
   "kind": "מילה",
   "heard": "ילקות",
   "verdict": "WARN"
  },
  {
   "key": "map.banana.01",
   "path": "mapping/map.banana.01.mp3",
   "he": "בננה",
   "pack": "",
   "kind": "",
   "heard": "בננה",
   "verdict": "ok"
  },
  {
   "key": "map.cat.01",
   "path": "mapping/map.cat.01.mp3",
   "he": "חתול",
   "pack": "",
   "kind": "",
   "heard": "חתול",
   "verdict": "ok"
  },
  {
   "key": "map.frame.give_me.01",
   "path": "mapping/map.frame.give_me.01.mp3",
   "he": "תן לי משמש",
   "pack": "",
   "kind": "",
   "heard": "תל לי משמש",
   "verdict": "WARN"
  },
  {
   "key": "map.frame.give_me.02",
   "path": "mapping/map.frame.give_me.02.mp3",
   "he": "תן לי פרח",
   "pack": "",
   "kind": "",
   "heard": "תהלי פרח",
   "verdict": "WARN"
  },
  {
   "key": "map.frame.have.01",
   "path": "mapping/map.frame.have.01.mp3",
   "he": "יש לי כדור",
   "pack": "",
   "kind": "",
   "heard": "יש לי כדור",
   "verdict": "ok"
  },
  {
   "key": "map.frame.have.02",
   "path": "mapping/map.frame.have.02.mp3",
   "he": "יש לי ספר",
   "pack": "",
   "kind": "",
   "heard": "יש לי ספר",
   "verdict": "ok"
  },
  {
   "key": "map.frame.see_hear.01",
   "path": "mapping/map.frame.see_hear.01.mp3",
   "he": "אני רואה צפור",
   "pack": "",
   "kind": "",
   "heard": "אמרוע ציפור",
   "verdict": "WARN"
  },
  {
   "key": "map.frame.see_hear.02",
   "path": "mapping/map.frame.see_hear.02.mp3",
   "he": "אני רואה חתול",
   "pack": "",
   "kind": "",
   "heard": "אני אוהח עטול",
   "verdict": "WARN"
  },
  {
   "key": "map.frame.this_that.01",
   "path": "mapping/map.frame.this_that.01.mp3",
   "he": "זה ספר",
   "pack": "",
   "kind": "",
   "heard": "זה ספר",
   "verdict": "ok"
  },
  {
   "key": "map.frame.this_that.02",
   "path": "mapping/map.frame.this_that.02.mp3",
   "he": "זאת מחברת",
   "pack": "",
   "kind": "",
   "heard": "זאת מחברת",
   "verdict": "ok"
  },
  {
   "key": "map.frame.want.01",
   "path": "mapping/map.frame.want.01.mp3",
   "he": "אני רוצה בננה",
   "pack": "",
   "kind": "",
   "heard": "אני רוצה בננה",
   "verdict": "ok"
  },
  {
   "key": "map.frame.want.02",
   "path": "mapping/map.frame.want.02.mp3",
   "he": "אני רוצה תפוח",
   "pack": "",
   "kind": "",
   "heard": "אני רוצה תפוח",
   "verdict": "ok"
  },
  {
   "key": "map.mishmish.01",
   "path": "mapping/map.mishmish.01.mp3",
   "he": "משמש",
   "pack": "",
   "kind": "",
   "heard": "משמש",
   "verdict": "ok"
  },
  {
   "key": "map.panas.01",
   "path": "mapping/map.panas.01.mp3",
   "he": "פנס",
   "pack": "",
   "kind": "",
   "heard": "פנס",
   "verdict": "ok"
  },
  {
   "key": "map.perach.01",
   "path": "mapping/map.perach.01.mp3",
   "he": "פרח",
   "pack": "",
   "kind": "",
   "heard": "פרח",
   "verdict": "ok"
  },
  {
   "key": "map.tzipor.01",
   "path": "mapping/map.tzipor.01.mp3",
   "he": "צפור",
   "pack": "",
   "kind": "",
   "heard": "ציפור",
   "verdict": "ok"
  },
  {
   "key": "market.food.give.banana.01",
   "path": "market/banana.mp3",
   "he": "תן לי בננה",
   "pack": "",
   "kind": "",
   "heard": "תל אבן נאנה",
   "verdict": "WARN"
  },
  {
   "key": "market.food.give.tapuach.01",
   "path": "market/tapuach.mp3",
   "he": "תן לי תפוח",
   "pack": "",
   "kind": "",
   "heard": "תל לי תפוח",
   "verdict": "WARN"
  },
  {
   "key": "market.food.give.tapuz.01",
   "path": "market/tapuz.mp3",
   "he": "תן לי תפוז",
   "pack": "",
   "kind": "",
   "heard": "תל לי תפוז.",
   "verdict": "WARN"
  },
  {
   "key": "pat/feeling",
   "path": "pat/feeling.mp3",
   "he": "אני ___",
   "pack": "body",
   "kind": "תבנית",
   "heard": "אני",
   "verdict": "ok"
  },
  {
   "key": "pat/give-me",
   "path": "pat/give-me.mp3",
   "he": "תן לי ___",
   "pack": "market",
   "kind": "תבנית",
   "heard": "דנלי",
   "verdict": "WARN"
  },
  {
   "key": "pat/greet",
   "path": "pat/greet.mp3",
   "he": "שלום · מה שלומכם?",
   "pack": "family",
   "kind": "תבנית",
   "heard": "שלום, מה שלומכם?",
   "verdict": "ok"
  },
  {
   "key": "pat/have",
   "path": "pat/have.mp3",
   "he": "יש לי ___",
   "pack": "nature",
   "kind": "תבנית",
   "heard": "יש לי",
   "verdict": "ok"
  },
  {
   "key": "pat/howmuch",
   "path": "pat/howmuch.mp3",
   "he": "כמה זה עולה?",
   "pack": "market",
   "kind": "תבנית",
   "heard": "קמא, זה עולה",
   "verdict": "WARN"
  },
  {
   "key": "pat/like",
   "path": "pat/like.mp3",
   "he": "אני אוהב ___",
   "pack": "hobbies",
   "kind": "תבנית",
   "heard": "ojive",
   "verdict": "ok"
  },
  {
   "key": "pat/open-close",
   "path": "pat/open-close.mp3",
   "he": "פתחו את ה___ · סגרו את ה___",
   "pack": "class",
   "kind": "תבנית",
   "heard": "פתרו את ה? סיגרו את ה",
   "verdict": "WARN"
  },
  {
   "key": "pat/see-hear",
   "path": "pat/see-hear.mp3",
   "he": "אני רואה ב___",
   "pack": "nature",
   "kind": "תבנית",
   "heard": "אני חווה",
   "verdict": "WARN"
  },
  {
   "key": "pat/this-that",
   "path": "pat/this-that.mp3",
   "he": "זה ___",
   "pack": "nature",
   "kind": "תבנית",
   "heard": "זה?",
   "verdict": "ok"
  },
  {
   "key": "pat/want",
   "path": "pat/want.mp3",
   "he": "אני רוצה ___",
   "pack": "market",
   "kind": "תבנית",
   "heard": "אני רוצה",
   "verdict": "ok"
  },
  {
   "key": "pat/what-is",
   "path": "pat/what-is.mp3",
   "he": "מה זה?",
   "pack": "colors",
   "kind": "תבנית",
   "heard": "מה זה?",
   "verdict": "ok"
  }
 ]
};
