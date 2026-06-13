export const meta = {
  name: 'extract-contact-people',
  description: 'For 22 foundations: extract real contact person from the messy contact field, or find one online',
  phases: [{ title: 'Extract' }, { title: 'Collect' }]
}

const targets = [{"id":"r2","name":"Jerusalem Foundation","website":"https://jerusalemfoundation.org","current_contact":"דניאל מימרן (Principal Officer Israel) / ג'וי לויט (CEO US). 11 Rivka St POB 10185 ירושלים 91101. ניו יורק: 17 West 60th Street, 2nd Floor","description":"מ-1966 ע\"י טדי קולק. תומכת בחינוך, אוכלוסיות בסיכון, דיאלוג, אומנות ותרבות, שימור מורשת ופיתוח כלכלי בירושלים"},{"id":"r4","name":"The Friedrich-Ebert-Stiftung","website":"https://israel.fes.de","current_contact":"ראלף מלצר - מנהל; Tuval 40, Sapir Tower, Ramat Gan 5252247","description":"קרן פוליטית גרמנית הקשורה ל-SPD. אחד מ-100+ משרדים בעולם. מקדמת דיאלוג חברתי-דמוקרטי. עוסקת ביחסי ישראל-גרמניה ומורשת השואה"},{"id":"r6","name":"The Haifa Foundation","website":"https://haifafoundation.org","current_contact":"בועז הירש (+972-4-630-5131, boaz.hirsch@haifafoundation.org.il). דרך העצמאות 1, חיפה 3303301","description":"מ-1983. עמותה רשומה לקידום חינוך, תרבות, חיים משותפים, קהילה וסביבה בחיפה. יו\"ר: ראש העיר. תומכת בספריות, מרכזי קהילה, גני שעשועים, מתקנים לאנשים עם מוגבלויות"},{"id":"r11","name":"Weizmann Institute of Science","website":"https://www.weizmann.ac.il","current_contact":"234 Herzl St., PO Box 26, Rehovot 7610001","description":"מ-1934. מוסד מחקר רב-תחומי בתחומי המדעים המדויקים והטבע. תומך במחקרים, תכניות חינוך וקליטת מדענים חוזרים"},{"id":"r16","name":"יד הנדיב","website":"https://www.yadhanadiv.org.il","current_contact":"רח' ג'ורג' וושינגטון 4, ירושלים 9418704","description":"קרן רוטשילד הישראלית. אינה תחרותית - יוזמת פרויקטים"},{"id":"r52","name":"קרן עזריאלי","website":"https://www.azrielifoundation.org.il","current_contact":"מגדל עזריאלי, רחוב מנחם בגין 132 ת\"א","description":"מ-2008. תחומים: חינוך, מחקר מדעי, קהילה, רווחה, אומנות ותרבות. מנהלת תכנית עמיתי עזריאלי"},{"id":"r56","name":"קרן פראט","website":"http://www.theprattfoundation-israel.org","current_contact":"ת.ד. 37052, ירושלים","description":"נוסדה ב-1978 במלבורן ע\"י ריצ'רד ופאני פראט. פועלת בישראל מ-1998. מתמקדת בפריפריה וב\"פרויקטים ראשונים מסוגם\""},{"id":"r66","name":"קרן תקדים - רמת השרון","website":"http://www.takdim-rh.org.il/","current_contact":"ת.ד. 3160, רמת השרון 47131","description":"הקרן תומכת בעמותות באזור רמת השרון שמועילות לציבור"},{"id":"r73","name":"Birthright Israel Foundation","website":"https://birthrightisrael.foundation","current_contact":"PO Box 21615 New York, NY 10087","description":"מ-2004 לגיוס תרומות לתגלית. עד היום נשלחו 900,000+ צעירים יהודים מ-67 מדינות בני 18-26 לחוויה חינוכית בישראל"},{"id":"r79","name":"Conference on Jewish Material Claims Against Germany (Claims Conference)","website":"https://www.claimscon.org","current_contact":"משרד ישראל: רח' הארבעה 8 קומה 1, ת\"א 64739, טל' +972-3-519-4400, infodesk@claimscon.org. ניו יורק: 1359 Broadway Room 2000","description":"מ-1951 ע\"י 23 ארגונים יהודיים. מנהלת מו\"מ ומפיצה פיצויים מגרמניה לניצולי שואה. מתחלקת ע\"י משרדים בניו יורק, ת\"א ופרנקפורט"},{"id":"r83","name":"Emunah of America","website":"https://emunah.org","current_contact":"Careena Parker (נשיאה). 500 Seventh Avenue, 8th floor, New York, NY 10018","description":"ארגון נשים ציוני-דתי. מ-1948 בארה\"ב. תומכת ב-Emunah ישראל - אחד מארגוני המתנדבים הגדולים בישראל עם 250 פרויקטים חברתיים-חינוכיים"},{"id":"r91","name":"Hadassah, the Women's Zionist Organization of America","website":"https://zoa.org","current_contact":"מורטון א. קליין (נשיא). 633 Third Avenue, Suite 31-B, New York, NY 10017","description":"מ-1897. הארגון הפרו-ישראלי הוותיק ביותר בארה\"ב. 25,000 חברים. פעיל בחינוך, יחסי ארה\"ב-ישראל, מאבק באנטישמיות בקמפוסים"},{"id":"r97","name":"JNF UK - Jewish National Fund","website":"https://www.jnf.org","current_contact":"משרד ישראל: WeWork King George 20, ירושלים. טל' +972-2-5635638. National Office: 42 East 69th Street, NY 10021","description":"מ-1901. הזרוע הפילנתרופית של ארה\"ב לישראל. נוטעת עצים, בונה תשתית, מפתחת קהילות בנגב ובגליל"},{"id":"r100","name":"Jewish National Fund (JNF)","website":"https://www.jnf.org","current_contact":"משרד ישראל: WeWork King George 20, ירושלים. טל' +972-2-5635638. National Office: 42 East 69th Street, NY 10021","description":"מ-1901. הזרוע הפילנתרופית של ארה\"ב לישראל. נוטעת עצים, בונה תשתית, מפתחת קהילות בנגב ובגליל"},{"id":"r104","name":"Keren Hayesod","website":"https://www.kh-uia.org.il","current_contact":"המלך ג'ורג' 48, ירושלים 9426218","description":"מ-1920. ארגון גיוס תרומות בינלאומי לישראל, פעיל ב-45 מדינות. אחד מ-3 המוסדות הלאומיים של ישראל. סם גרונדוורג - יו\"ר עולמי"},{"id":"r112","name":"Oak Foundation","website":"https://oakfnd.org","current_contact":"Avenue Louis Casaï 58, 1216 Cointrin, Geneva, Switzerland","description":"מ-1983. נוסדה ע\"י אלן פרקר ממייסדי DFS. הרכבת 8 תכניות גלובליות + תכניות מדינה בדנמרק וזימבבואה. מענקים ב-40 מדינות. תרומות לפי הזמנה"},{"id":"r121","name":"Ruderman Family Foundation","website":"https://rudermanfoundation.org","current_contact":"ג'יי רודרמן (נשיא), שירה רודרמן (מנכ\"לית). 2150 Washington St Ste 225, Newton MA. משרד בישראל - מ-2006","description":"מ-2002. שני תחומים: שילוב אנשים עם מוגבלויות, חיזוק היחסים בין ישראל ליהדות אמריקה. לא מקבלת פניות ישירות"},{"id":"r125","name":"Simons Foundation Autism Research","website":"https://www.simonsfoundation.org","current_contact":"דייוויד ספרגל (President). 160 Fifth Avenue, 7th Floor, NYC 10010. SFARI: sfari@simonsfoundation.org","description":"מ-1994 ע\"י ג'ים ומרילין סימונס. אחת הקרנות הפילנתרופיות הגדולות בארה\"ב לחקר מדעי הטבע, מתמטיקה ואוטיזם. תקציב $350M. SFARI (מ-2003) הוא תחום האוטיזם"},{"id":"r147","name":"The Israel Forever Foundation","website":"https://israelforever.org","current_contact":"ד\"ר אילנה היידמן (מנכ\"לית). 5335 Wisconsin Avenue NW, Suite 440, Washington, DC 20015","description":"מ-2002. ארגון התקשרות יהודית-ישראלית עם תכניות וירטואליות וקהילתיות לחיזוק הקשר האישי עם ישראל"},{"id":"r173","name":"The Simons Foundation","website":"https://www.simonsfoundation.org","current_contact":"דייוויד ספרגל (President). 160 Fifth Avenue, 7th Floor, NYC 10010. SFARI: sfari@simonsfoundation.org","description":"מ-1994 ע\"י ג'ים ומרילין סימונס. אחת הקרנות הפילנתרופיות הגדולות בארה\"ב לחקר מדעי הטבע, מתמטיקה ואוטיזם. תקציב $350M. SFARI (מ-2003) הוא תחום האוטיזם"},{"id":"r179","name":"The Wolfson Foundation","website":"https://www.wolfson.org.uk","current_contact":"8 Queen Anne Street, London W1G 9LD","description":"נוסדה ב-1955. תומכת בעיקר במוסדות בבריטניה. בישראל פועלת דרך Wolfson Family Charitable Trust (WFCT)"},{"id":"r181","name":"Wolfson Family Charitable Trust","website":"https://www.wolfson.org.uk","current_contact":"8 Queen Anne Street, London W1G 9LD","description":"נוסדה ב-1955. תומכת בעיקר במוסדות בבריטניה. בישראל פועלת דרך Wolfson Family Charitable Trust (WFCT)"}];
log(`Processing ${targets.length} foundations...`)

const SCHEMA = {
  type: 'object',
  required: ['id', 'has_real_person'],
  properties: {
    id: { type: 'string' },
    has_real_person: { type: 'boolean', description: 'true if a real human contact person is identified (existing data or found online)' },
    person_name: { type: 'string', description: 'The real contact person name (Hebrew or English) — empty if none' },
    person_role: { type: 'string', description: 'Their role/title if known — empty if none' },
    person_email: { type: 'string', description: 'Their direct email if found — empty otherwise' },
    person_phone: { type: 'string', description: 'Their direct phone if found — empty otherwise' },
    source: { type: 'string', enum: ['existing', 'web', 'none'], description: 'existing = parsed from current_contact; web = found online; none = not found' },
    notes: { type: 'string', description: 'One short Hebrew sentence — what you found or why nothing' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
  }
}

const results = await pipeline(
  targets,
  (t) => agent(
    `אתה מחפש/ת את איש הקשר האמיתי של קרן פילנתרופית. בשדה "איש קשר" שלי יש כרגע כתובת רחוב או טקסט ארוך במקום שם של אדם — אני רוצה לדעת אם יש שם אדם אמיתי שמסתתר שם, או שצריך לחפש באינטרנט.

**פרטי הקרן:**
- שם: ${t.name}
- אתר: ${t.website || '(אין)'}
- תיאור: ${t.description || '(אין)'}

**שדה איש קשר נוכחי (מבולגן):**
"${t.current_contact}"

**משימה:**
1. בדוק/י אם יש שם של בן אדם בתוך השדה הקיים (כמו "דניאל מימרן", "Naomi Adler", "ראלף מלצר - מנהל"). אם כן — חלץ/י אותו בשם person_name ו־source=existing.
2. אם אין שם אדם, או שלא ברור — היכנס/י לאתר הקרן והסתכל/י בדף "צרו קשר" / "About Us" / "צוות". חפש/י מנכ"ל/ית, מנהל/ת קרן, או איש קשר רשמי. אם מצאת — source=web.
3. אם לאחר חיפוש לא מצאת אף שם — has_real_person=false, source=none.

**חשוב:**
- person_name = רק שם מלא של אדם. לא ארגון, לא תפקיד, לא כתובת.
- אם יש person_name, אבל בשדה הקיים יש גם טלפון או אימייל ספציפי שלו/ה — שים/י גם בperson_phone / person_email.
- מקסימום שני חיפושים באינטרנט.

תחזיר/י StructuredOutput. id חייב להיות: "${t.id}".`,
    {
      label: `${t.name.substring(0, 32)}`,
      phase: 'Extract',
      schema: SCHEMA,
      agentType: 'Explore'
    }
  )
)

phase('Collect')
const ok = results.filter(Boolean)
log(`Got ${ok.length}/${targets.length} results`)
const byId = {}
for (const r of ok) if (r && r.id) byId[r.id] = r
return { results: byId, count: Object.keys(byId).length, total: targets.length }
