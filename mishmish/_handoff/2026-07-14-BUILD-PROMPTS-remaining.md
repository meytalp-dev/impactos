# מישמיש · פרומפטי-בנייה מוכנים-להדבקה — מה שנותר (14.7)

> מחליף את חלק א׳ של `2026-07-13-REMAINING-tasks-and-GPT-assets.md` (חלק ב׳ — נכסי-GPT — **הושלם, 54 נכסים + מפת-שכונה**).
> **done עד עכשיו:** F1·F2·F3·F4·F5?·F6 · M1·M2·M3·M4 · P1 · +EPA/flow/MAP/enter/admin.
> **נותר (בטוח במקביל — כל אחד קובץ נפרד):** `F5`(אודיו) · packs `P2 P3 P4 P5 P6 P7 P8` · מכניקות `M5 M6 B1`.

**כל הנכסים כבר קיימים** — כל pack מצביע על תמונות שכבר בדיסק; כל מכניקה נשענת על דמות/רקע קיימים. אף סוכן לא יוצר נכסים ולא מריץ `_build-data.js`.

---

## 🔒 בלוק משותף — הדביקי בראש כל פרומפט

```
תיאום קשיח (מישמיש · impactos/mishmish · ענף feat/lumi-lantern-grove):
- קרא/י קודם: HANDOFF.md · briefs/pack-schema.md · data/pack-class.json (תבנית-הזהב) · src/js/data-loader.js.
- אתה בעל/ת הקובץ/ים שברשימת-המשימה בלבד. אל תיגע/י בשום קובץ אחר, במיוחד לא בקבצים של מכניקות/packs אחרים.
- 🔴 אל תריץ/י node src/js/_build-data.js — רק סוכן-התזמורת בונה את data.js באינטגרציה (כדי שלא תתנגשו בקובץ המיוצר). סיימת דאטה? רק שמור/י את ה-JSON.
- מכניקה=קוד / pack=דאטה. תבנית קוראת מה-pack דרך MishmishData.pick({pack,mechanic}) (data-loader.js). אין תוכן קשיח בקוד — הכל מה-pack.
- שער-עברית: כל טקסט-ילד = טיוטה מנוקדת, לשון-רבים (הַקְשִׁיבוּ/בַּחֲרוּ), ב/כ/פ דגש-קל בראש-הברה (בַּ/כִּ/פִּ). רשום/רשמי אותו ב-asks.meytal לאישור פדגוגי.
- 🔴 שער-עאמייה: כל cognate_ar/audio_amiya = טיוטה עם ar_verified:false, מגודרת (לא מוצגת/מושמעת). רשום/רשמי ב-asks.native ל-tools/arabic-review-tool.html. ה-pack לא עובר done עד בודק/ת ילידי/ת.
- רף-ילד: scene-bg PNG אמיתי (לא gradient) · מישמיש/אמיר = PNG מ-assets/characters/ · שמיעתי-קודם (אריחים נעולים עד סוף ההשמעה) · בלי אדום/ירוק (retry=צהוב, selected=כחול) · יעדי-מגע ≥56px · Heebo · two-tap אם יש אפשרויות-שמע · BKT נכתב ל-localStorage · ניקוד מלא בכל טקסט-ילד.
- אודיו: MishmishAudio.hebrew(text,{key,slow,statusEl}) — key מצביע על assets/audio/<key>.mp3; אין קליפ → Web-Speech fallback חי (מותר עד F5). בלי "יופי" בשבחים — מְצֻיָּן/מְעֻלֶּה.
- דיווח: בסיום עדכן/י את _handoff/mishmish-build-status.json (🔴 קרא/י מחדש ממש לפני העריכה — סוכנים מקבילים כותבים) עם: status(doing/done) · agent · updated · notes(מה נבנה + איך אימתת) · asks{meytal[],native[]} · needs_rebuild. אמת/י בדפדפן לפני done: קונסולה נקייה + סבב מלא.
```

---

## 🔴 F5 · אודיו אמיתי (עדיפות — הכאב הגדול, הכל TTS כרגע)
**בעלוּת:** `scripts/generate-mishmish-audio.py` (חדש) + clipMap ב-`src/js/audio.js`
```
משימה: להקשיח את צינור-האודיו הדו-לשוני של מישמיש.
רקע חובה: src/js/audio.js (clipMap → assets/audio/<key>.mp3, סדר קליפ→WebSpeech→שקט; ARABIC_VERIFIED=false נעול). למד/י מצינור-ההפקה של אבני יסוד (scripts/generate-*.py + _eleven_tts.py · PYTHONIOENCODING=utf-8 · QA Whisper) ומ-lumi (ElevenLabs).
מה לבנות:
(א) scripts/generate-mishmish-audio.py — מייצר קליפי-יעד עברית בקול-מישמיש (ElevenLabs) לכל מפתחות-האודיו בכל ה-packs הקיימים ב-data/: item.audio_he (mapping/market), lexeme.audio_he (='lex/*') + pattern.audio_frame (='pat/*') + contrast.audio (='con/*') בכל pack-*.json, ועוד amir_hints.he מ-scaffold.json. clipMap ממפה key→assets/audio/<key>.mp3.
(ב) הפרדת-קול: יעד-עברית = קול-מישמיש; פיגום-עאמייה = קול-אמיר. 🔴 עאמייה נשארת מגודרת (לא מיוצרת/מושמעת) עד אישור רגיסטר+בודק ילידי — הכן/י hook בלבד.
(ג) QA: תמלל/י כל קליפ ב-Whisper ואמת/י מול הטקסט (אתה לא שומע). ניקוד: כתיב-חסר קודם ואז רפה/דגש (KNOWN_WORD_FIXES). בלי "יופי" — מְצֻיָּן/מְעֻלֶּה.
שמור/י על החוזה MishmishAudio.hebrew(text,{key,slow,statusEl}) — אל תשבור/י את measured.js/lantern.js/המכניקות.
[+ הבלוק המשותף]
```

---

## 📦 packs (P2-P8) — כולם על תבנית pack-class.json

**כלל-על לכל pack:** העתק/י את מבנה `data/pack-class.json` 1:1 (meta/lexicon/patterns/contrasts/target/_mechanic_reads). שנה/י רק תוכן. `img` = נתיב מתחת ל-`assets/items/` כולל `.png` (למשל `family/fam-mom.png`). כל lexeme: `he` מנוקד · `gloss` · `img` · `emoji` · `audio_he:"lex/<id>-he"` · `cognate_ar`+`audio_amiya:"lex/<id>-amiya"`+`ar_verified:false` · `gender`/`number` · `sound_tags`. `patterns[].slots` = מזהי-lexeme (מחרוזות). `target` = אותם 6 מפתחות בדיוק.

**5 תבניות-השדרה** (חוזרות בין נושאים — כל pack נושא ≥2 מהן כדי שהמיפוי/BKT יקבל ראיה חוצת-נושא): `this_that`(זֶה/זֹאת) · `have`(יֵשׁ לִי) · `want`(אֲנִי רוֹצֶה) · `give_me`(תֵּן לִי) · `see_hear`(אֲנִי רוֹאֶה/שׁוֹמֵעַ). ראה `src/js/bkt.js` KC_META.

🟣 **החלטת-תזמורת (לאישור מיטל):** אין נכסי-רקע חדשים — כל pack משתמש באחד מ-3 הרקעים הקיימים (`bg-hara-courtyard` / `bg-shared-market` / `bg-shared-park`). ההצבות למטה. `sound_wave` = הצעה לפי התקדמות-השנה (1→4), לאישור.

### P2 · המשפחה והחברים → `data/pack-family.json`
```
בנה/י data/pack-family.json על תבנית pack-class.json.
meta: id="family" · topic="הַמִּשְׁפָּחָה וְהַחֲבֵרִים" · week_range="5-8 · אוקטובר 2026" · setting="hara-courtyard" · bg="bg-hara-courtyard.png" · space="hara" · amir=true · sound_wave=1 · cognate_focus (הצע/י קוגנט-משפחה, למשל אַבָּא↔بابا).
lexicon (6, תמונות קיימות ב-assets/items/family/): fam-mom.png(אִמָּא,f) · fam-dad.png(אַבָּא,m) · fam-grandma.png(סַבְתָּא,f) · fam-grandpa.png(סַבָּא,m) · fam-sister.png(אָחוֹת,f) · fam-brother.png(אָח,m). הוסף/י 1-2 מילות-רגש/ברכה אם צריך ל-roleplay.
patterns (שדרה + נושא): this_that(זֶה אַבָּא/זֹאת אִמָּא — ציר-מין ל-grammar-toggle) · have(יֵשׁ לִי אָח/אָחוֹת) · greet(recurs מ-class). 
contrasts: הצע/י זוג פּ/בּ מהלקסיקון (למשל בּ ב-סַבְתָּא?) גל 1 קליל, wave=1, ar_verified:false.
[+ הבלוק המשותף]
```

### P3 · צבעים, מספרים וכמויות → `data/pack-colors.json`
```
בנה/י data/pack-colors.json על תבנית pack-class.json.
meta: id="colors" · topic="צְבָעִים, מִסְפָּרִים וּכְמֻיּוֹת" · week_range="9-12 · נוב'–דצמ' 2026" · setting="shared-park" · bg="bg-shared-park.png" · space="shared" · amir=true · sound_wave=2.
lexicon (6, תמונות ב-assets/items/colors/): color-ball-red.png(כַּדּוּר אָדוֹם) · color-ball-blue.png(כַּדּוּר כָּחֹל) · color-ball-green.png(כַּדּוּר יָרֹק) · color-ball-yellow.png(כַּדּוּר צָהֹב) · color-flower-red.png(פֶּרַח אָדוֹם) · color-flower-blue.png(פֶּרַח כָּחֹל). שים/י את שם-הצבע כתואר עם gender (אָדוֹם/אֲדֻמָּה) — נושא-הליבה של grammar-toggle (התאמת-מין: כַּדּוּר אָדוֹם מול…).
patterns: this_that(זֶה כַּדּוּר) · what_is(מַה זֶּה?) · have(יֵשׁ לִי כַּדּוּר אָדוֹם). 🔴 הצֵר את הצבעים כתארים ב-lexicon כדי ש-grammar-toggle יעבוד (adj:{m,f}).
contrasts: זוג פּ/בּ גל 2 (למשל פֶּרַח מול בּ-מילה), wave=2, ar_verified:false.
[+ הבלוק המשותף]
```

### P4 · הגוף והרגשות → `data/pack-body.json`
```
בנה/י data/pack-body.json על תבנית pack-class.json.
meta: id="body" · topic="הַגּוּף וְהָרְגָשׁוֹת" · week_range="13-16 · ינואר 2027" · setting="hara-courtyard" · bg="bg-hara-courtyard.png" · space="hara" · amir=true · sound_wave=2.
lexicon (8, תמונות ב-assets/items/body/): body-hand.png(יָד,f) · body-head.png(רֹאשׁ,m) · body-eye.png(עַיִן,f) · body-foot.png(רֶגֶל,f) · emo-happy.png(שָׂמֵחַ) · emo-sad.png(עָצוּב) · emo-tired.png(עָיֵף) · emo-scared.png(מְפַחֵד). הרגשות = מצבים (adj) ל-'אֲנִי שָׂמֵחַ/שְׂמֵחָה' (התאמת-מין).
patterns: have(יֵשׁ לִי — 'יֵשׁ לִי שְׁתֵּי יָדַיִם'?) · see_hear(אֲנִי רוֹאֶה בְּעֵינַיִם) · feeling(אֲנִי ___ — רגש, ציר-מין ל-grammar-toggle) · this_that.
contrasts: זוג פּ/בּ גל 2, wave=2, ar_verified:false.
[+ הבלוק המשותף]
```

### P5 · אוכל וקניות (השלמה — קיים חלקית) → `data/pack-market.json`
```
השלם/י את data/pack-market.json הקיים לרמת pack-class.json (כרגע בו רק 3 פריטי give_me + אודיו banana/tapuz/tapuach; חסר lexicon עשיר/contrasts/patterns מלאים).
meta: id="market" · topic="אֹכֶל וּקְנִיּוֹת" · week_range="17-21 · פבר'–מרץ 2027" · setting="shared-market" · bg="bg-shared-market.png" · space="shared" · amir=true · sound_wave=3.
lexicon: כל 9 מאכלים ב-assets/items/food/ (item-apple/banana/orange/bread/cheese/tomato/cucumber/grapes/milk .png) + מִשְׁמֵשׁ(apricot). מנוקד + gender/number + sound_tags (בָּנָנָה=b_initial).
patterns (שדרה): want(אֲנִי רוֹצֶה ___) · give_me(תֵּן לִי ___) · howmuch(כַּמָּה זֶה עוֹלֶה?) · this_that.
contrasts: 🔴 זוג פּ/בּ הרשמי של השוק גל 3 — בָּנָנָה↔פָּנָס (הברִיף). wave=3, ar_verified:false. (פָּנָס דורש נכס-תמונה אם רוצים ויזואל — אחרת שמיעתי בלבד; רשום ב-asks.meytal.)
🔴 שמור/י תאימות-לאחור: אל תשבור/י את פריטי-give_me הקיימים ש-lantern.js/play.js כבר קוראים.
[+ הבלוק המשותף]
```

### P6 · הבית, הזמן ומזג האוויר → `data/pack-home.json`
```
בנה/י data/pack-home.json על תבנית pack-class.json.
meta: id="home" · topic="הַבַּיִת, הַזְּמַן וּמֶזֶג הָאֲוִיר" · week_range="22-26 · מרץ–אפריל 2027" · setting="hara-courtyard" · bg="bg-hara-courtyard.png" · space="hara" · amir=true · sound_wave=3.
lexicon (8, תמונות ב-assets/items/home/): home-bed.png(מִטָּה,f) · home-door.png(דֶּלֶת,f) · home-window.png(חַלּוֹן,m) · home-table.png(שֻׁלְחָן,m) · weather-sun.png(שֶׁמֶשׁ,f) · weather-cloud.png(עָנָן,m) · weather-rain.png(גֶּשֶׁם,m) · weather-wind.png(רוּחַ,f).
patterns: this_that · follow-instr עם מילות-יחס (עַל/מִתַּחַת/לְיַד — מזין follow-instr M5) · see_hear(אֲנִי רוֹאֶה שֶׁמֶשׁ). 🔴 home-door.png פותר את פער-הדלת של P1.
contrasts: זוג פּ/בּ גל 3, wave=3, ar_verified:false.
[+ הבלוק המשותף]
```

### P7 · בעלי חיים וטבע → `data/pack-nature.json`
```
בנה/י data/pack-nature.json על תבנית pack-class.json.
meta: id="nature" · topic="בַּעֲלֵי חַיִּים וְטֶבַע" · week_range="27-30 · אפריל–מאי 2027" · setting="shared-park" · bg="bg-shared-park.png" · space="shared" · amir=true · sound_wave=4.
lexicon (8, תמונות ב-assets/items/nature/): animal-cat.png(חָתוּל,m) · animal-dog.png(כֶּלֶב,m) · animal-bird.png(צִפּוֹר,f) · animal-fish.png(דָּג,m) · animal-butterfly.png(פַּרְפַּר,m) · plant-tree.png(עֵץ,m) · plant-flower.png(פֶּרַח,m) · plant-leaf.png(עָלֶה,m).
patterns (שדרה): see_hear(אֲנִי רוֹאֶה חָתוּל/צִפּוֹר — הליבה) · have(יֵשׁ לִי כֶּלֶב) · this_that.
contrasts: זוג פּ/בּ גל 4 (פַּרְפַּר/פֶּרַח נושאים פַּ; זוג מול בּ), wave=4, ar_verified:false.
[+ הבלוק המשותף]
```

### P8 · תחביבים, מקצועות ואירועים (חזרה ל-A1) → `data/pack-hobbies.json`
```
בנה/י data/pack-hobbies.json על תבנית pack-class.json.
meta: id="hobbies" · topic="תַּחְבִּיבִים, מִקְצוֹעוֹת וְאֵרוּעִים" · week_range="31-34 · מאי–יוני 2027" · setting="shared-park" · bg="bg-shared-park.png" · space="shared" · amir=true · sound_wave=4.
lexicon (8, תמונות ב-assets/items/hobbies/): hobby-ball.png(כַּדּוּרֶגֶל,m) · hobby-bike.png(אוֹפַנַּיִם,pl) · hobby-paint.png(מִכְחוֹל,m) · hobby-music.png(מוּזִיקָה,f) · job-doctor.png(רוֹפֵא/רוֹפְאָה) · job-teacher.png(מוֹרֶה/מוֹרָה) · job-cook.png(טַבָּח/טַבָּחִית) · job-driver.png(נֶהָג/נַהֶגֶת). המקצועות = ציר-מין (m/f) ל-grammar-toggle.
patterns (שדרה, חזרה ל-A1): want(אֲנִי רוֹצֶה) · like(אֲנִי אוֹהֵב/אוֹהֶבֶת ___) · this_that · give_me.
contrasts: זוג פּ/בּ גל 4, wave=4, ar_verified:false.
[+ הבלוק המשותף]
```

---

## 🎮 מכניקות — כל אחת 2 קבצים (js/templates/mechanic-*.js + src/*.html), data-driven טהור

**כלל-על:** חקה 1:1 את החוזה של M2/M3/M4 (`src/js/templates/mechanic-*.js` + `src/*.html`): קריאה מ-pack דרך MishmishData.pick, דרייבר measured.js, שמיעתי-קודם, בלי אדום/ירוק, מדרג-רמז השמעה→חזותי→אמיר, שורת-הישרדות MishmishScaffold.bind, אמיר MishmishAmir (עאמייה מגודרת), BKT.ingest. דמות: `../assets/characters/mishmish/mishmish-{idle,listening,hint,confused-soft,happy,celebrate}.png`. חוט/י script-tags בסדר: data.js→data-loader→bkt→scaffold→amir→epa→flow→<המכניקה>. אל תריץ/י build.

### M5 · follow-instr (בצע-הוראה) → `mechanic-follow-instr.js` + `src/follow-instr.html`
```
בנה/י מכניקת follow-instr: מישמיש נותן הוראה מדוברת ("שִׂימוּ אֶת הַסֵּפֶר עַל הַשֻּׁלְחָן") והילד גורר/מקיש פריט ליעד-מיקום נכון. target="lexeme + preposition".
קורא/ת מה-pack: lexicon (פריטים) + מילות-יחס (עַל/מִתַּחַת/לְיַד) מ-patterns follow-instr (ראה pack-home/pack-class open_close). יעדי-מיקום = assets/items/locations/ (loc-table.png/loc-basket.png/loc-shelf.png — כבר קיימים).
מדידה: BKT.ingest pattern='follow_instr' (probe, spine:false — כמו contrast/grammar) · dimension='recognize' · target=מזהה-פריט · errorAxis='pattern'.
פועל עם ?pack=class (open_close) ו-?pack=home (מילות-יחס). fixture-טיוטה בדף עד שה-pack מספק. אמת/י בדפדפן: phone 414 + tablet 1024, קונסולה נקייה, אפס אדום/ירוק, ≥56px.
[+ הבלוק המשותף]
```

### M6 · roleplay (turn עם אמיר) → `mechanic-roleplay.js` + `src/roleplay.html`
```
בנה/י מכניקת roleplay: turn דו-כיווני עם אמיר. אמיר "מבקש" בתבנית (מַה זֶּה? / תֵּן לִי ___) והילד מפיק את התבנית (בחירה-בין-2 מדידה, לא מיקרופון — ראה pack-schema §4 הכרעה נטויה ל-#1). target="pattern.frame produced to Amir".
קורא/ת מה-pack: patterns (what_is+this_that, give_me) + amir (MishmishAmir). 🔴 M6 היא היחידה בלי קונכיית-מקור באבני-יסוד — נטו-חדש; שמור/י על אותו חוזה-מדידה.
מדידה: BKT.ingest pattern=<pattern.id של השדרה, למשל give_me/this_that> · dimension='produce_supported' (רמה 2) · target=מזהה-מילה · pb_context='sentence'.
🔴 אמיר-כדמות: he=יעד (מוצג) · עאמייה מגודרת (ar_verified:false, לא מושמעת). מדרג-רמז השמעה→חזותי→אמיר.
אמת/י בדפדפן: ריצה מלאה, קונסולה נקייה, BKT נכתב, אפס אדום/ירוק.
🟣 ASK מיטל בדיווח: לאשר את מודל-ההפקה (בחירה-בין-2) מול חלופת-מיקרופון, ואת ניסוח ה-turns.
[+ הבלוק המשותף]
```

### B1 · בוס-מעבר (הַמַּעֲבָר לַשְּׁכוּנָה הַמְּשֻׁתֶּפֶת) → `mechanic-passage.js` + `src/passage.html`
```
בנה/י את בוס-הנושא: מעבר מ"הַחָצֵר שֶׁלִּי / حارتي" (space=hara) אל "הַמֶּרְחָב הַמְּשֻׁתָּף" (space=shared) דרך שערים. השראה מ-cave-codex של אבני יסוד (ראה pack-schema §3). רקע: assets/backgrounds/bg-passage.png (קיים) — journey-track שמתמלא בתחתית, שומר-שער=אמיר שנפתח רק בשימוש נכון.
כל שער = ציר אחד (שער-צליל→שער-תבנית→שער-אינטראקציה) שמרכיב מכניקות שכבר קיימות (same-different / missing-slot / roleplay) כשלבים. מַרְכִּיב, לא בונה-מחדש: הפעל/י את המכניקות הקיימות כתת-שלבים.
תלוי: ≥2 מכניקות (M2/M3 ✓) + F3(amir ✓) + F4(BKT ✓). מדידה מצטברת דרך אותם KC של המכניקות המורכבות.
אמת/י בדפדפן: מעבר מלא בין שני המרחבים, journey-track מתמלא, קונסולה נקייה, אפס אדום/ירוק, ≥56px.
🟣 ASK מיטל: מבנה-הבוס (3 שערים? אילו צירים?) לפני השקעה מלאה.
[+ הבלוק המשותף]
```

---
*עודכן ע"י סוכן-התזמורת 14.7. עאמייה → PENDING-native-arabic-review.md. ניקוד/רגיסטר → אישור מיטל async.*
