# בריף אמנות · Lumi — T7 · פַּנַּס הַשָּׁלוֹם (Lantern of Hello · Greetings & Friends)
מיועד להעברה ל-GPT (gpt-image / DALL·E). מטרה: נכסי **drop-in** למשחקון הברכות.
**מכניקה:** מפגש (meet) + הפקה (produce) — לא־נמדד בכוונה (נימוסים = שימוש, לא הערכה). בכניסה לחורשה מופיע **חבר**, לומי מנופף ואומר שלום, והילד אומר בחזרה (לולאת הקשבה־עצמית).

> **🔑 העיקרון של הנושא:** אין כאן "תשובה נכונה" למדוד. המשמעות עוברת דרך **אודיו־אנגלי מוקלט + דמות־החבר + מחוות־לומי** בלבד. לכן הנכס המרכזי הוא **דמות־חבר חמימה** בשתי תנוחות (עומד / מנופף), באותו עולם בדיוק כמו לומי והחיות.

---

## 0. עקרונות-על (חלים על כל נכס)
- **סגנון:** soft 3D storybook · עולם דמדומים קסום · תאורה רכה · צורות מעוגלות · מראה פרימיום · **בלי עומס**. זהה לחלוטין לסט Lumi/החיות הקיים (אותו עולם).
- **פלטת החבר:** `#9fe8d8 mint · #78d8d0 aqua · #f6e8a6 warm-glow · שנהב־קרם` — יצור־אור רך של החורשה (כמו לומי), לא חיה מציאותית.
- **פלטת רקע/סצנה (נעשה ב-CSS):** dusk חמים `#3a2c50 → #8a5a7a → #f0955a`. הרקע חם; החבר בהיר וזוהר עליו.
- **אסור:** ניאון צורם · קווי־מתאר שטוחים · אימוג'י · **טקסט כלשהו בתוך התמונה** · הצללת־קרקע צרובה.

## 0.1 דרישות טכניות (חובה, אחרת לא drop-in)
- **PNG עם רקע שקוף** (transparent). לבקש מפורשות: *"transparent background, no ground shadow baked in"*.
- **🔴 rembg חובה:** GPT צובע רקע אטום (לרוב לבן). אחרי ההורדה — להריץ `rembg` (עם `alpha_matting` בגלל הקרם־על־לבן), ואז לתיקייה. **בלי rembg הריבוע הלבן ייראה במשחק.**
- **רזולוציה:** קנבס גדול (~1024×1024), הדמות ממורכזת; הקוד מקטין לגובה ~640px.
- **🔒 עקביות בין שתי התנוחות:** **אותה דמות בדיוק** — אותו צבע, פרצוף, קרניים, גודל, תאורה — רק היד/התנוחה משתנה (עומד ↔ יד מורמת בנפנוף).

## 0.2 מבנה תיקיות + שמות (מדויק — כך הקוד מצפה)
```
lumi/app/assets/greetings/friend/
├── friend-idle.png     ← החבר עומד, מחייך (מסכי פתיחה/סיום)
└── friend-wave.png     ← החבר מנפנף (יד/כף מורמת) — מופיע בכל ברכה
```

---

## 1. דמות־החבר — יצור־אור חמים של החורשה (הנכס המרכזי) — ✅ סופק ע"י מיטל (13/7)
יצור־איילון קטן וחמוד (fawn), רך ותלת־ממדי, פרוותי בגוני mint/aqua/שנהב, עם **קרניים זוהרות** ועלי־אור קטנים, תליון־זוהר עגול על הצוואר, עיניים גדולות וחמות. מרחף/עומד קלות. אותו DNA של לומי.

**Prompt seed ל-GPT (2 תנוחות, אותה דמות):**
> A single adorable soft-3D storybook forest-spirit fawn — fluffy cream-and-mint fur, big warm eyes, gentle glowing antlers with tiny leaf-lights, a small round glowing pendant, premium children's-book lighting. Generate the SAME identical character in TWO poses, only the pose changing: **(1) standing, smiling, both paws down; (2) friendly waving, one front paw raised.** Front view, centered, **plain solid white background, no text, no baked ground shadow**, large ~1024×1024.

**עיבוד אחרי הורדה:**
```
rembg (alpha_matting_foreground_threshold=245, background=15) → crop-to-content → resize גובה ~640px
→ lumi/app/assets/greetings/friend/friend-{idle,wave}.png
```

## 2. (אופציונלי, גל שני) תנוחות־רגש נוספות לחבר — לא חוסם
כדי להעשיר את לולאת ה-produce ואת רגעי הברכה, אפשר להוסיף **אותה דמות** בתנוחות:
- `friend-happy.png` — קופץ משמחה (feedback ל-produce).
- `friend-shy.png` / `friend-sorry.png` — מבט רך (לרגע "sorry").
*(לא נדרש לפיילוט — idle+wave מספיקים כדי לשחק סבב מלא.)*

## ❌ אל תייצרי (נעשה ב-CSS/קוד)
הָלָה/זוהר סביב החבר · נפנוף־היד של לומי · ניצוצות · רצועת־הפנסים · רקע־החורשה (gradient) · פנס־ההתקדמות. אלה תאורה/אפקט.

## ✅ צ'קליסט מסירה
- [x] **friend-idle.png — סופק ע"י מיטל (13/7 22:17), rembg+alpha-matting, ~640px, שובץ.** ✓
- [x] **friend-wave.png — סופק ע"י מיטל (13/7 22:17), rembg+alpha-matting, ~640px, שובץ.** ✓
- [x] אימות headless: הבמה לא ריקה (גובה 666px) · no_read נקי · 0 שגיאות קונסולה · 0 נכסים חסרים. ✓
- [ ] (אופ') friend-happy / friend-sorry לתנוחות־רגש (גל שני, לא חוסם)

---

## 🔊 אודיו (הופק — ElevenLabs, Jessica) — לא איור אבל חלק מהמסירה
כל הברכות הוקלטו בקול Jessica (`eleven_multilingual_v2`) ואומתו ב-Whisper:
`hello · hi · bye · please · thank you · yes · no · sorry` + צירופים (`Hi there! · Bye-bye! · Yes, please! · Thank you so much! · No, thank you. · I'm sorry.`) + הצ'אנק `Hello! My name is…` + `Nice! · Nice to meet you!`. הנחיה/סיום בעברית בקול Noni (`eleven_v3`).

## מצב נוכחי (2026-07-13, לילה) — ✅ המשחקון בר־משחק מלא עם נכסים אמיתיים
דמות־החבר (idle+wave) חיה, האודיו מוקלט, סבב מלא עובר עד מסך־הסיום. אין נכסים חוסרים.
