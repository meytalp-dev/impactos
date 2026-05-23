# storm-game · אסטים אופציונליים

המשחקון `stage-3-storm.html` עובד מלא **בלי** קבצי PNG חיצוניים — האלמוגי-מ׳ הם SVG inline,
ההחשכה היא `filter: brightness()` על תמונת הרקע הקיימת `scene-stage-3-bg.png`, ההבזקים הם CSS.

הקבצים שכאן הם **שדרוגים אופציונליים**:

| קובץ | למה זה משפר | מצב |
|---|---|---|
| `scene-storm-dark.png` | רקע ייעודי לים סוער (עננים, שצף-קצף, אווירה מאיימת) במקום פילטר על הסיני הרגיל | ❌ ממתין |
| `scene-storm-bright.png` | רקע אחרי הסערה — זוהר, צבעוני, פסטלי. fade-in בסיום החגיגה | ❌ ממתין |
| `coral-mem-dark.png` | אלמוג-מ׳ במצב כבוי (עומק שונה מ-SVG) | ❌ אופציונלי |
| `coral-mem-lit.png` | אותו אלמוג זוהר | ❌ אופציונלי |
| `noni-sad.png` | הבעת עצב ייעודית (לא רק noni-thinking) | ❌ אופציונלי |

ראו `_prompts/chatgpt-storm-assets.md` בשורש הריפו של underwater-app להוראות הפקה.

אם מוסיפים PNG-ים — חובה PIL לכל אחד (RGB→RGBA + הסרת רקע) לפי
`feedback_pil_chatgpt_pngs` ב-MEMORY.md, אחרת חוזרים עם ריבוע לבן.

אחרי הוספת אסט — לעדכן את `stage-3-storm.html` במקום ה-SVG הרלוונטי או להוסיף שכבת `<img>`
מעל ה-scene-bg עם class המתאים למצב lit.
