/**
 * גְּרַנְטָה · תבנית קובץ הקונפיג
 * =================================
 *
 *  ↓↓↓  זה קובץ תבנית. הוא כן נכנס ל-git.  ↓↓↓
 *
 *  איך משתמשים:
 *    1. העתיקי את הקובץ הזה לשם  granta/assets/granta-config.js
 *       (באותה תיקייה, בלי ה-`.example`)
 *
 *         cp granta/assets/granta-config.example.js granta/assets/granta-config.js
 *
 *    2. מלאי את שני הערכים למטה בערכים האמיתיים מה-Supabase Dashboard.
 *    3. 🔴 אל תעשי commit ל-granta-config.js. הוא כבר מוחרג ב-.gitignore
 *       שבשורש הריפו. אם git מציע אותו — משהו נשבר, עצרי ובדקי.
 *
 *  איך זה נטען במסך (לפני granta.js, כי granta.js קורא אותו באתחול):
 *
 *      <script src="../assets/granta-config.js"></script>
 *      <script type="module">
 *        import { auth, leads, fmt, ui, nav } from '../assets/granta.js';
 *      </script>
 *
 *  אם הקובץ חסר או ריק — כל מסך בגרנטה ייפול עם ההודעה:
 *  «window.GRANTA_CONFIG חסר. יש לטעון את assets/granta-config.js לפני granta.js.»
 *
 *  מקור: granta/SPEC.md §5 · granta/_ops/secrets-hygiene.md
 * ------------------------------------------------------------------ */

/* ══════════════════════════════════════════════════════════════════ *
 *  🔴🔴🔴  אזהרת אבטחה — קראי לפני שאת ממלאת משהו  🔴🔴🔴
 *
 *  לתוך הקובץ הזה נכנס **אך ורק** ה-anon key (הפומבי).
 *  **לעולם לא** ה-service_role key. אף פעם. בשום נסיבות.
 *
 *  למה זה קריטי:
 *  • ה-anon key מוגן על ידי RLS — הוא רואה רק מה שהמדיניות בבסיס
 *    הנתונים מרשה למשתמש המחובר לראות.
 *  • ה-service_role key **עוקף את כל ה-RLS**. הוא שווה-ערך לסיסמת
 *    מנהל של בסיס הנתונים.
 *  • הקובץ הזה נטען בדפדפן. כל מי שפותח את הדף יכול לקרוא אותו
 *    (View Source / Network tab). אם service_role יגיע לכאן —
 *    **כל תיק של כל עמותה במערכת חשוף לכל אדם באינטרנט**, כולל
 *    מחיקה ושינוי.
 *
 *  granta.js מזהה בעצמו מפתח service-role וחוסם את האתחול ברעש,
 *  אבל אל תסמכי על זה — זו רשת ביטחון, לא היתר.
 *
 *  כל סוד אמיתי (refresh token של Google, developer token, מפתחות API)
 *  חי **רק** ב-Supabase Edge Function secrets. ראי:
 *  granta/_ops/secrets-hygiene.md
 * ══════════════════════════════════════════════════════════════════ */

window.GRANTA_CONFIG = {

  /**
   * כתובת הפרויקט ב-Supabase.
   *
   * איפה משיגים:
   *   Supabase Dashboard → הפרויקט שלך → Project Settings → API
   *   → השדה "Project URL"
   *
   * נראה כך:  https://abcdefghijklmnop.supabase.co
   * ללא לוכסן בסוף.
   */
  SUPABASE_URL: 'https://rllbiktbrkzhzsjhahxb.supabase.co',

  /**
   * המפתח הפומבי — anon / publishable.
   *
   * איפה משיגים:
   *   Supabase Dashboard → הפרויקט שלך → Project Settings → API Keys
   *   → המפתח המסומן  anon  public   (בפרויקטים חדשים: "Publishable key",
   *     שמתחיל ב-sb_publishable_)
   *
   * 🔴 באותו מסך, ממש מתחתיו, יושב  service_role  secret.
   *    זה **לא** המפתח. אל תעתיקי אותו. אם העתקת בטעות —
   *    לכי מיד ל-granta/_ops/secrets-hygiene.md ובצעי החלפת מפתח.
   *
   * המפתח הזה פומבי מעצם הגדרתו — הוא נשלח לכל דפדפן. הוא בטוח
   * רק כל עוד ה-RLS על טבלאות granta_* מוגדר ופעיל.
   */
  SUPABASE_ANON_KEY: 'sb_publishable_rb8KDlA3TBSOdAUaxZwYZg_7s1Sxs_p',

  /**
   * אופציונלי. אובייקט options שמועבר כמו-שהוא ל-createClient.
   * ברירת המחדל של granta.js (persistSession + autoRefreshToken +
   * storageKey ייעודי) מתאימה כמעט תמיד — השאירי null אלא אם יש סיבה.
   */
  options: null,
};

/* granta.js מקבל גם את השמות הישנים  url / anonKey / SUPABASE_PUBLISHABLE_KEY
 * כ-aliases, אבל בקוד חדש השתמשי בשמות שלמעלה. */
