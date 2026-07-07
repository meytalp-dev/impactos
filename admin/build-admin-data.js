#!/usr/bin/env node
/**
 * build-admin-data.js — מחלץ את כל הדאטה של אבני יסוד ופולס למבנה יחיד
 * שנטען ב-admin/index.html גם ב-file:// (window.ADMIN_DATA).
 *
 * הרצה:  node admin/build-admin-data.js
 * פלט:   admin/admin-data.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AV = path.join(ROOT, 'avnei-yesod');
const APP = path.join(AV, 'underwater-app');
const CUR = path.join(AV, 'curriculum');
const PULSE = path.join(ROOT, 'pulse-grade1');

const read = (p) => fs.readFileSync(p, 'utf8');
const readJSON = (p) => JSON.parse(read(p));
const exists = (p) => fs.existsSync(p);

// ─────────────────────────────────────────────────────────
// 1) בנק שאלות — היררכיה strand → נושא → תת-נושא → שאלות
// ─────────────────────────────────────────────────────────
function buildQuestionBank() {
  const d = readJSON(path.join(CUR, 'questions-grade1.json'));
  const STRAND_HE = {
    phonology: 'פונולוגיה ופענוח',
    morphology: 'מורפולוגיה ומילות פונקציה',
    oral_language: 'שפה דבורה',
    reading_comprehension: 'הבנת הנקרא',
    writing: 'כתיבה',
  };
  const strands = {};
  for (const q of d.questions) {
    const s = q.strand || 'other';
    strands[s] = strands[s] || { id: s, name: STRAND_HE[s] || s, topics: {}, count: 0 };
    strands[s].count++;
    const topicName = q.sub_topic_topic || '—';
    const t = (strands[s].topics[topicName] = strands[s].topics[topicName] || {
      name: topicName, month: q.month, subtopics: {}, count: 0,
    });
    t.count++;
    const stid = q.sub_topic_id || topicName;
    const st = (t.subtopics[stid] = t.subtopics[stid] || {
      id: stid, day: q.day, week: q.week, questions: [],
    });
    st.questions.push({
      q_id: q.q_id,
      level: q.level,
      task_he: q.task_he,
      stem_he: q.stem_he,
      char_label: q.characteristic_label,
      answer: q.answer,
      options: (q.options || []).map((o) => ({ t: o.label_he, ok: !!o.is_correct })),
    });
  }
  // ל-arrays + מיון
  const out = Object.values(strands).map((s) => ({
    ...s,
    topics: Object.values(s.topics).map((t) => ({
      ...t,
      subtopics: Object.values(t.subtopics),
    })),
  }));
  return { meta: { title: d.title, subtitle: d.subtitle, generated: d.generated, stats: d.stats, epa_axes: d.epa_axes }, strands: out };
}

// ─────────────────────────────────────────────────────────
// 2) מאגר מאפייני רכישה (446 מאפיינים) — מלא, מקושר לשאלות
// ─────────────────────────────────────────────────────────
function buildMastery() {
  const d = readJSON(path.join(CUR, 'mastery-criteria-grade1.json'));
  const STRAND_HE = {
    phonology: 'פונולוגיה ופענוח', morphology: 'מורפולוגיה ומילות פונקציה',
    oral_language: 'שפה דבורה', reading_comprehension: 'קריאה והבנת הנקרא', writing: 'כתיבה',
  };
  // כמה שאלות מכוונות לכל מאפיין (characteristic_id) — לחיווט מאגר↔בנק
  const qByChar = {};
  try {
    const q = readJSON(path.join(CUR, 'questions-grade1.json'));
    for (const item of q.questions) qByChar[item.characteristic_id] = (qByChar[item.characteristic_id] || 0) + 1;
  } catch (e) {}

  let total = 0;
  const byStrand = {};
  const subs = (d.sub_topics || []).map((s) => {
    const chars = (s.characteristics || []).map((c) => {
      total++;
      const st = c.strand || s.primary_strand;
      byStrand[st] = (byStrand[st] || 0) + 1;
      return {
        id: c.id,
        teacher_label: c.teacher_label,
        strand: st,
        observable: c.observable_evidence,
        success: c.success_behavior,
        task_type: c.difficulty && c.difficulty.task_type,
        unit: c.difficulty && c.difficulty.unit,
        level: c.difficulty && c.difficulty.level,
        dims: c.mastery_dims || {},
        bkt: !(c.measurement && c.measurement.bkt_trackable === false),
        engine_label: c.engine_label,
        epa: (c.common_errors_epa || []).map((e) => ({ what: e.what, where: e.where, task: e.task, detail: e.detail })),
        q_count: qByChar[c.id] || 0,
      };
    });
    return {
      id: s.sub_topic_id, month: s.month, week: s.week, day: s.day,
      topic: s.topic, strand: s.primary_strand, chars,
    };
  });
  return {
    meta: { title: d.title, generated: d.generated, subtopic_count: subs.length, char_count: total, by_strand: byStrand, strand_he: STRAND_HE, legend: d.strand_legend },
    sub_topics: subs,
  };
}

// ─────────────────────────────────────────────────────────
// 3) איים — סדר + סטטוס-בנוי מ-map.html, העשרה מ-22-islands.json
// ─────────────────────────────────────────────────────────
function buildIslands(minigamesByIsland) {
  const map = read(path.join(APP, 'map.html'));
  const bp = readJSON(path.join(CUR, 'blueprint', '22-islands.json'));
  const bpById = {};
  for (const isl of bp.islands || []) bpById[isl.id] = isl;

  // out-of-scope מוגדרים ב-meta
  const oos = {};
  for (const o of (bp.meta && bp.meta.out_of_scope_islands && bp.meta.out_of_scope_islands.islands) || []) {
    oos[o.id] = o;
  }

  const nodes = [];
  const re = /<a\b([^>]*?)class="map-node"([^>]*)>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(map))) {
    const attrs = m[1] + ' ' + m[2];
    const inner = m[3];
    const idM = attrs.match(/data-island-id="(\d+)"/);
    if (!idM) continue;
    const id = +idM[1];
    const hrefM = attrs.match(/href="([^"]+)"/);
    const labelM = inner.match(/node-label">([^<]+)</);
    const built = /data-vs-open/.test(attrs) && !!hrefM;
    nodes.push({
      id,
      name: labelM ? labelM[1].trim() : (bpById[id] && bpById[id].name_visual) || ('אי ' + id),
      href: hrefM ? hrefM[1] : null,
      built,
    });
  }
  // מיון לפי מספר אי + הסרת כפילויות
  const seen = new Set();
  const ordered = nodes
    .filter((n) => (seen.has(n.id) ? false : seen.add(n.id)))
    .sort((a, b) => a.id - b.id);

  return ordered.map((n) => {
    const bpI = bpById[n.id] || {};
    const games = minigamesByIsland[n.id] || [];
    const bpGames = (bpI.mini_games || []).map((g) => ({ name: g.name, envelope: g.envelope, objective: g.primary_objective }));
    return {
      id: n.id,
      name_visual: n.name,
      name_pedagogical: bpI.name_pedagogical || null,
      pedagogical_skill: bpI.pedagogical_skill || null,
      child_goal: bpI.child_goal_one_line || null,
      teacher_axis: bpI.teacher_axis || null,
      month: (bpI.available_at_arrival && bpI.available_at_arrival.month_in_curriculum) || null,
      built: n.built,
      out_of_scope: oos[n.id] ? oos[n.id].reason : null,
      hub_href: n.href,
      // משחקונים שתוכננו ב-blueprint
      planned_games: bpGames,
      planned_game_count: bpGames.length,
      // משחקונים שקיימים בפועל בקוד (stage-N-*.html)
      built_games: games,
      built_game_count: games.length,
    };
  });
}

// ─────────────────────────────────────────────────────────
// 4) משחקונים — סריקת stage-*.html + QA אוטומטי (נכסים חסרים)
// ─────────────────────────────────────────────────────────
function buildMinigames() {
  const files = fs.readdirSync(APP).filter((f) => /^stage-.*\.html$/.test(f));
  const list = [];
  const byIsland = {};

  for (const f of files) {
    const full = path.join(APP, f);
    const html = read(full);
    const dir = path.dirname(full);

    const titleM = html.match(/<title>([^<]*)<\/title>/);
    const h1M = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const title = (titleM && titleM[1].trim()) || (h1M && h1M[1].replace(/<[^>]+>/g, '').trim()) || f;

    // איזה אי — לפי stage-N-...
    const numM = f.match(/^stage-(\d+)-/);
    const islandId = numM ? +numM[1] : null;
    const isHub = /^stage-\d+-island\.html$/.test(f);
    const kind = isHub ? 'hub' : islandId ? 'minigame' : 'tool';

    // מכניקות שנטענות
    const mechanics = [...html.matchAll(/templates\/(mechanic-[a-z0-9-]+)\.js/g)].map((x) => x[1]);
    const uniqMech = [...new Set(mechanics)];

    // האם טוען אודיו
    const usesAudio = /shared\/audio\.js/.test(html) || /\.mp3/.test(html);

    // ── זיהוי הקול: נוני מוקלט (audio.js/mp3) מול הקראת-דפדפן (speechSynthesis) ──
    const hasNoni = /shared\/audio\.js/.test(html) || /\.mp3/.test(html);
    const hasTTS = /speechSynthesis|SpeechSynthesisUtterance/.test(html);
    const voice = hasTTS && hasNoni ? 'mixed' : hasTTS ? 'tts' : hasNoni ? 'noni' : 'none';

    // ── חיווט מנוע: BKT / EPA / adapter / בנק-שאלות (יורש EPA) ──
    const engine = {
      bkt: /shared\/bkt\.js/.test(html),
      epa: /shared\/epa\.js/.test(html),
      adapter: /adapter|oral-skill/.test(html),
      bank: /questions-grade1|mechanic-mcq|stage-bank-play|question-bank/.test(html),
    };

    // ── DNA ויזואלי (מזוהה מהקוד) — רק לדפי-משחקון/אי, לא לכלים ──
    const referencesNoni = /noni/i.test(html);
    const noniAsSvg = /<svg[^>]*>[\s\S]{0,400}?(noni|תמנון)/i.test(html) && !/noni-\w+\.(png|webp)/i.test(html);
    const dna = {
      scene_bg: /-bg\.(png|webp|jpg)|scene[-\w]*\.(png|webp|jpg)|class="(scene|bay|reef)-bg"/i.test(html), // רקע-סצנה PNG (scene-bg/bay-bg/scene-storm וכו', לא gradient)
      noni_png: /noni-\w+\.(png|webp)/i.test(html),                          // נוני כ-PNG
      noni_not_svg: !noniAsSvg,                                              // נוני לא כ-SVG
      tokens: /tokens\.css/.test(html),                                      // מערכת טוקנים
      heebo: /Heebo/.test(html),                                            // פונט Heebo
      shim: /file-protocol-shim/.test(html),                               // עובד file://
      no_forbidden_color: !/#2E7D8C/i.test(html),                          // אסור הצבע הישן
      plural_ok: !/\b(נְגַע\b|הַקְשֵׁב\b|בְּחַר\b|גַּע\b)(?!\.י|ו)/.test(html), // פנייה לילד בלשון רבים (זיהוי גס)
    };

    // ── תקינות אודיו: קבצי MP3 מקומיים ריקים (0 בייט) / נתיב-קול-ישן ──
    const mp3refs = [...html.matchAll(/(?:src|["'(])\s*([\w./-]+\.mp3)/gi)].map((x) => x[1]);
    const brokenAudio = [];
    for (const r of [...new Set(mp3refs)]) {
      if (/^https?:/.test(r)) continue;
      const abs = path.resolve(dir, r);
      try { if (exists(abs) && fs.statSync(abs).size === 0) brokenAudio.push(r); } catch (e) {}
    }
    const usesOldVoice = /_old-hila|hila-backup/i.test(html);

    // ── מסך-סיום: מסגור-ביצועים לילד (אחוזים / ניקוד X מתוך Y) — פדגוגית לא רצוי ──
    // מדויק: רק כשהאחוז/שבר מוצג בהודעה לילד. "ניקוד" (=vowel niqqud) לא נספר.
    const scorePercent = /(עֲנִיתֶם עַל|נָכוֹן עַל|מֵהַשְּׁאֵלוֹת|הִצְלַחְתֶּם בְּ| עַל )['"]?\s*\+\s*pct|pct\s*\+\s*['"]%|['"][^'"]*'\s*\+\s*pct\s*\+\s*['"]%/.test(html);
    const scoreFraction = /\bcorrect\b\s*\+\s*['"]\s*\/\s*['"]|score\.textContent\s*=\s*[^;]*\btotal\b/.test(html);
    const completion = {
      showsScore: scorePercent || scoreFraction,
      percent: scorePercent,
      fraction: scoreFraction,
    };

    // ── QA אוטומטי: איתור נכסים מקומיים חסרים ──
    const refs = [];
    // src="..." ו-href לסקריפטים/תמונות מקומיים
    for (const mm of html.matchAll(/(?:src|href)="([^"#?]+\.(?:js|png|jpg|jpeg|svg|mp3|json))(?:\?[^"]*)?"/g)) {
      refs.push(mm[1]);
    }
    const missing = { js: [], img: [], audio: [] };
    for (const r of refs) {
      if (/^(https?:)?\/\//.test(r)) continue; // חיצוני
      const abs = path.resolve(dir, r);
      if (exists(abs)) continue;
      const ext = r.split('.').pop().toLowerCase();
      if (ext === 'js' || ext === 'json') missing.js.push(r);
      else if (ext === 'mp3') missing.audio.push(r);
      else missing.img.push(r);
    }
    // הערכה: audio.js לרוב מפיק MP3 דינמית מ-manifest → נבדוק ברמת הקובץ הישיר בלבד
    const qa = {
      loading: missing.js.length === 0 ? 'ok' : 'fail',
      images: missing.img.length === 0 ? 'ok' : 'fail',
      audio: !usesAudio ? 'na' : missing.audio.length === 0 ? 'ok' : 'fail',
      missing,
    };

    const entry = {
      file: f,
      title,
      island: islandId,
      kind,
      mechanics: uniqMech,
      usesAudio,
      voice,
      engine,
      dna,
      brokenAudio,
      usesOldVoice,
      completion,
      href: 'avnei-yesod/underwater-app/' + f,
      qa,
    };
    list.push(entry);
    if (islandId && kind === 'minigame') {
      (byIsland[islandId] = byIsland[islandId] || []).push({ file: f, title, mechanics: uniqMech });
    }
  }
  list.sort((a, b) => (a.island || 99) - (b.island || 99) || a.file.localeCompare(b.file));

  // ── מיזוג תוצאות בדיקת-הריצה (admin/qa-runtime.json) אם קיימות ──
  let runtimeMeta = null;
  try {
    const rt = readJSON(path.join(__dirname, 'qa-runtime.json'));
    runtimeMeta = { generatedAt: rt.generatedAt, checked: rt.checked };
    for (const g of list) {
      const r = rt.results[g.file];
      if (r) g.runtime = { ok: r.ok, loadError: r.loadError, jsErrors: r.jsErrors || [], failedAssets: r.failedAssets || [] };
    }
  } catch (e) { /* טרם הורץ — עמודת הריצה תציג "טרם נבדק" */ }

  // ── בריאות מאגר האודיו הגלובלי (כולל קבצים שנטענים דינמית ע"י audio.js) ──
  const audioHealth = { total: 0, broken: [], oldVoiceFolder: false };
  try {
    const adir = path.join(APP, 'assets', 'audio');
    for (const af of fs.readdirSync(adir)) {
      const full = path.join(adir, af);
      const st = fs.statSync(full);
      if (st.isDirectory()) { if (/hila|_old/i.test(af)) audioHealth.oldVoiceFolder = true; continue; }
      if (!/\.mp3$/i.test(af)) continue;
      audioHealth.total++;
      if (st.size === 0) audioHealth.broken.push(af);
    }
  } catch (e) {}

  return { list, byIsland, audioHealth, runtimeMeta };
}

// ─────────────────────────────────────────────────────────
// 5) פולס — שאלות פר פרסונה (תלמיד / מורה / הורה)
// ─────────────────────────────────────────────────────────
function buildPulse() {
  const DIM_HE = {
    adjust: 'הסתגלות', friend: 'חברות', emotion: 'שפה רגשית', joy: 'שמחה ללמוד',
  };

  // תלמיד — DIMENSIONS מ-pulse-questionnaire.html
  const qHtml = read(path.join(PULSE, 'pulse-questionnaire.html'));
  const student = [];
  const dimRe = /id:\s*'(adjust|friend|emotion|joy)'[\s\S]*?questionSpeak:\s*'([^']+)'/g;
  let dm;
  while ((dm = dimRe.exec(qHtml))) {
    student.push({ dim: dm[1], dimName: DIM_HE[dm[1]], text: dm[2] });
  }

  // מורה — QUESTIONS מ-pulse-teacher-form-mockup.html
  const tHtml = read(path.join(PULSE, 'pulse-teacher-form-mockup.html'));
  const teacher = [];
  const tRe = /\{\s*id:\s*\d+,\s*dim:\s*'(\w+)',\s*dimName:\s*'([^']+)',\s*text:\s*'([^']+)'\s*\}/g;
  let tm;
  while ((tm = tRe.exec(tHtml))) {
    teacher.push({ dim: tm[1], dimName: tm[2], text: tm[3] });
  }

  // הורה — item-question מ-pulse-parent-monthly.html
  const pHtml = read(path.join(PULSE, 'pulse-parent-monthly.html'));
  const parent = [];
  for (const pm of pHtml.matchAll(/item-question[^>]*>([\s\S]*?)<\/(?:span|label)>/g)) {
    const text = pm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text && text.length > 8) parent.push({ text });
  }

  // רשימת כלי-הפולס הקיימים
  const files = [
    ['pulse-questionnaire.html', 'שאלון תלמיד.ה (3 פנים, נרטיב נוני)', 'student'],
    ['pulse-teacher-form-mockup.html', 'טופס מורה (דו-שבועי, 8 פריטים)', 'teacher'],
    ['pulse-parent-monthly.html', 'שאלון הורה (חודשי)', 'parent'],
    ['pulse-dashboard.html', 'דשבורד מורה', 'dashboard'],
    ['pulse-principal-dashboard.html', 'דשבורד מנהלת', 'dashboard'],
    ['pulse-summary.html', 'סיכום פולס', 'dashboard'],
    ['pulse-parent-monthly.html', 'סיכום הורה חודשי', 'parent'],
    ['intervention-catalog.html', 'קטלוג התערבויות', 'tool'],
    ['pulse-admin-mockup.html', 'ניהול פולס (mockup)', 'tool'],
  ].filter(([f]) => exists(path.join(PULSE, f)))
    .map(([f, label, role]) => ({ file: f, label, role, href: 'pulse-grade1/' + f }));

  const dims = Object.entries(DIM_HE).map(([id, name]) => ({ id, name }));

  return {
    dimensions: dims,
    personas: { student, teacher, parent },
    tools: files,
    responseKey: 'pulse-demo-responses', // אותו מפתח שהשאלון החי כותב אליו
  };
}

// ─────────────────────────────────────────────────────────
// 6) הגייה — השוואת תמלול-Whisper לטקסט-היעד (מניפסט)
// ─────────────────────────────────────────────────────────
function stripNiqqud(s) {
  return (s || '').normalize('NFD').replace(/[֑-ׇ]/g, '').replace(/[^א-ת0-9]/g, '');
}
function simRatio(a, b) {
  a = stripNiqqud(a); b = stripNiqqud(b);
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const la = a.length, lb = b.length;
  const d = Array.from({ length: lb + 1 }, (_, i) => i);
  for (let i = 1; i <= la; i++) {
    let prev = d[0]; d[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cur = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] !== b[j - 1] ? 1 : 0));
      prev = cur;
    }
  }
  return 1 - d[lb] / Math.max(la, lb);
}
function buildPronunciation() {
  let manifest = {}, trans = null;
  try { manifest = readJSON(path.join(__dirname, 'audio-manifest.json')); } catch (e) {}
  try { trans = readJSON(path.join(__dirname, 'qa-transcriptions.json')); } catch (e) {}
  if (!trans) return { meta: { ran: false, manifestCount: Object.keys(manifest).length }, clips: [] };

  const clips = [];
  for (const [key, rec] of Object.entries(trans.results || {})) {
    const heard = rec.heard || '';
    const intended = manifest[key] || null;
    let sim = null, suspect = false;
    if (intended) {
      sim = Math.round(simRatio(intended, heard) * 100) / 100;
      suspect = sim < 0.6 || !stripNiqqud(heard);
    } else {
      suspect = !stripNiqqud(heard); // בלי טקסט-יעד: ריק/לא-עברי = חשוד
    }
    clips.push({ key, heard, intended, sim, suspect, hasIntended: !!intended });
  }
  // חשודים קודם, אז לפי דמיון עולה
  clips.sort((a, b) => (b.suspect - a.suspect) || ((a.sim ?? 2) - (b.sim ?? 2)) || a.key.localeCompare(b.key));
  return {
    meta: {
      ran: true, model: trans.model, generatedAt: trans.generatedAt || null,
      checked: clips.length, manifestCount: Object.keys(manifest).length,
      withIntended: clips.filter((c) => c.hasIntended).length,
      suspects: clips.filter((c) => c.suspect).length,
    },
    clips,
  };
}

// ─────────────────────────────────────────────────────────
function main() {
  const minigames = buildMinigames();
  const data = {
    generatedAt: new Date().toISOString(),
    avnei: {
      questionBank: buildQuestionBank(),
      mastery: buildMastery(),
      islands: buildIslands(minigames.byIsland),
      minigames: minigames.list,
      audioHealth: minigames.audioHealth,
      runtimeMeta: minigames.runtimeMeta,
      pronunciation: buildPronunciation(),
    },
    pulse: buildPulse(),
  };

  const out = '/* AUTO-GENERATED by admin/build-admin-data.js — do not edit by hand */\n' +
    'window.ADMIN_DATA = ' + JSON.stringify(data) + ';\n';
  fs.writeFileSync(path.join(__dirname, 'admin-data.js'), out, 'utf8');

  // סיכום לקונסול
  const a = data.avnei;
  console.log('✓ admin-data.js נכתב');
  console.log('  בנק שאלות:', a.questionBank.meta.stats.questions, 'שאלות ·', a.questionBank.strands.length, 'strands');
  console.log('  מאגר מאפיינים:', a.mastery.meta.char_count, 'מאפיינים ·', a.mastery.meta.subtopic_count, 'תתי-נושא');
  console.log('  איים:', a.islands.length, '(' + a.islands.filter((i) => i.built).length + ' בנויים)');
  console.log('  משחקונים:', a.minigames.length);
  const qaFail = a.minigames.filter((g) => g.qa.loading === 'fail' || g.qa.images === 'fail' || g.qa.audio === 'fail');
  console.log('  QA — משחקונים עם נכס חסר:', qaFail.length);
  const mg = a.minigames.filter((g) => g.kind === 'minigame');
  const ttsFlag = mg.filter((g) => g.voice === 'tts' || g.voice === 'mixed');
  console.log('  קול — נוני:', mg.filter((g) => g.voice === 'noni').length,
    '· הקראת-דפדפן/מעורב:', ttsFlag.length, '(' + ttsFlag.map((g) => g.file).join(', ') + ')',
    '· ללא:', mg.filter((g) => g.voice === 'none').length);
  console.log('  מנוע — מזין BKT:', mg.filter((g) => g.engine.bkt).length, '/ ', mg.length, 'משחקונים');
  const dnaFail = mg.filter((g) => !g.dna.scene_bg || !g.dna.noni_png || !g.dna.tokens || !g.dna.heebo || !g.dna.shim || !g.dna.no_forbidden_color);
  console.log('  DNA — משחקונים עם ליקוי:', dnaFail.length, '/ ', mg.length);
  const ah = a.audioHealth;
  console.log('  אודיו — מאגר:', ah.total, 'קבצים · שבורים(0B):', ah.broken.length, ah.broken.length ? '(' + ah.broken.join(', ') + ')' : '', '· תיקיית-קול-ישן:', ah.oldVoiceFolder ? 'קיימת' : 'אין');
  qaFail.slice(0, 12).forEach((g) => console.log('    ⚠', g.file, JSON.stringify(g.qa.missing)));
  console.log('  פולס: תלמיד', data.pulse.personas.student.length, '· מורה', data.pulse.personas.teacher.length, '· הורה', data.pulse.personas.parent.length);
}

main();
