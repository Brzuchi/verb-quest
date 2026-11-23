// Verb Quest – game logic. Plain JS, no build step, works on GitHub Pages.
(() => {
  "use strict";

  const CFG = window.VQ_CONFIG;
  const { RULES, ROUNDS, RANKS } = window.VQ_DATA;
  const ONLINE = Boolean(CFG.SUPABASE_URL && CFG.SUPABASE_KEY);
  const STATE_KEY = "vq_state_v1";
  const LOCAL_SCORES_KEY = "vq_scores_v1";
  const LAST_PLAYER_KEY = "vq_last_player_v1";
  const params = new URLSearchParams(location.search);
  const app = document.getElementById("app");

  let S = null;          // game state (persisted in localStorage)
  let keyHandler = null; // keyboard handler for the current screen
  let qStart = 0;        // timestamp when the current question was shown
  const timers = { clock: null, lb: null, speed: null, auto: null };

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  // Normalises typed answers: case, apostrophes, spacing, final punctuation, contractions.
  function norm(s) {
    return String(s)
      .toLowerCase()
      .replace(/[’‘`´]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.!?,;:]+$/g, "")
      .replace(/\bcan't\b/g, "cannot")
      .replace(/\bcan not\b/g, "cannot")
      .replace(/\bwon't\b/g, "will not")
      .replace(/n't\b/g, " not")
      .replace(/'d\b/g, " would")
      .replace(/'m\b/g, " am")
      .replace(/'re\b/g, " are")
      .replace(/\s+/g, " ")
      .trim();
  }
  const wordCount = (s) => (norm(s) ? norm(s).split(" ").length : 0);
  const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: CFG.TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const fmtNum = (n) => Math.round(n).toLocaleString("cs-CZ");
  const capitalize = (s) => s.trim().replace(/\s+/g, " ").split(" ").map((w) => w.split("-").map((p) => p.charAt(0).toLocaleUpperCase("cs") + p.slice(1)).join("-")).join(" ");
  const multiplier = (streak) => (streak >= 8 ? 2 : streak >= 4 ? 1.5 : 1);
  const itemCount = (r) => (r.type === "story" ? r.gaps.length : r.items ? r.items.length : 0);
  const TOTAL_ITEMS = ROUNDS.filter((r) => r.type !== "speed").reduce((n, r) => n + itemCount(r), 0);

  function tok(f) {
    return f === "ing" ? '<span class="tok ing">-ing</span>' : '<span class="tok to">to + inf.</span>';
  }
  function ruleSentence(v) {
    const f = RULES[v];
    if (f === "ing") return `Po <b>${esc(v)}</b> následuje tvar <b>-ing</b>.`;
    if (f === "to") return `Po <b>${esc(v)}</b> následuje <b>to + infinitiv</b>.`;
    return `<b>${esc(v)}</b> může mít obojí (-ing i to + infinitiv).`;
  }
  function clearTimers(...names) {
    for (const n of names) { clearInterval(timers[n]); clearTimeout(timers[n]); timers[n] = null; }
  }
  // Wires a "next" button: runs once, ignores the Enter press that revealed it.
  function armNext(btn, fn) {
    const created = Date.now();
    let used = false;
    btn.onclick = () => {
      if (used || Date.now() - created < 350) return;
      used = true;
      fn();
    };
    setTimeout(() => btn.focus(), 0);
  }
  function setScreen(html) {
    clearTimers("auto");
    keyHandler = null;
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  document.addEventListener("keydown", (e) => {
    if (!keyHandler || e.repeat) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    keyHandler(e);
  });

  // ---------- card markup ----------
  const ART = window.VQ_ART;
  const frameFor = (r) => (r.type === "story" ? "#8E3B3F" : r.type === "speed" ? "var(--gold)" : "var(--mat-line)");
  const elementCost = () => `<i class="ing">${ART.glyphIng()}</i><i class="to">${ART.glyphTo()}</i>`;
  function cardOpen(name, cost = "", frame = "var(--mat-line)", id = "") {
    return `<article class="tcg"${id ? ` id="${id}"` : ""} style="--frame:${frame}"><div class="tcg-body">
      <header class="namebar"><span class="nm">${name}</span><span class="cost">${cost}</span></header>`;
  }
  const cardClose = (left = "", right = "") => `<footer class="collector"><span>${left}</span><span>${right}</span></footer></div></article>`;
  // An element card: -ing (flow) or to (aim).
  function elCard(f, word, foot, tag = "button", attrs = "") {
    const inner = `<span class="in"><span class="top"><b>${f === "ing" ? "-ing" : "to + inf."}</b><i>${f === "ing" ? ART.glyphIng() : ART.glyphTo()}</i></span><span class="word">${esc(word)}</span><span class="foot">${foot}</span></span>`;
    return tag === "button"
      ? `<button class="el-card ${f}" data-f="${f}" ${attrs}>${inner}</button>`
      : `<div class="el-card ${f}">${inner}</div>`;
  }
  // ---------- persistence ----------
  function save() { try { localStorage.setItem(STATE_KEY, JSON.stringify(S)); } catch (_) { /* storage may be blocked */ } }
  function load() { try { return JSON.parse(localStorage.getItem(STATE_KEY) || "null"); } catch (_) { return null; } }
  function clearState() { try { localStorage.removeItem(STATE_KEY); } catch (_) { /* ignore */ } S = null; }

  function newState(player) {
    const seed = Math.floor(Math.random() * 2 ** 31);
    const rng = mulberry32(seed);
    const order = {};
    for (const r of ROUNDS) if (r.items) order[r.id] = shuffle([...r.items.keys()], rng);
    return {
      v: 1, player, seed, order,
      startedAt: Date.now(), finishedAt: null,
      round: 0, item: 0, phase: "rules",
      points: 0, streak: 0, bestStreak: 0, hintsLeft: CFG.HINTS,
      res: {}, speed: null, submitted: false,
      sub: { attempt: 1, hint: false }
    };
  }

  // ---------- backend (Supabase RPC or local) ----------
  async function rpc(name, body) {
    const headers = { "Content-Type": "application/json", apikey: CFG.SUPABASE_KEY };
    if (CFG.SUPABASE_KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${CFG.SUPABASE_KEY}`; // legacy anon JWT
    const res = await fetch(`${CFG.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }
  function localScores() { try { return JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || "[]"); } catch (_) { return []; } }

  async function submitScore(row) {
    if (ONLINE) {
      return rpc("submit_score", {
        p_room: row.room, p_first_name: row.first_name, p_last_name: row.last_name,
        p_points: row.points, p_accuracy: row.accuracy, p_rank_title: row.rank_title,
        p_duration_s: row.duration_s, p_details: row.details
      });
    }
    const all = localScores();
    all.push({ ...row, created_at: new Date().toISOString(), day: today() });
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(all));
    return all.length;
  }
  async function fetchLeaderboard(room, day) {
    if (ONLINE) return rpc("get_leaderboard", { p_room: room, p_day: day });
    return localScores().filter((r) => r.room === room && r.day === day);
  }
  // Best attempt per student, sorted by points.
  function bestPerStudent(rows) {
    const map = new Map();
    for (const r of rows) {
      const key = `${r.first_name.toLocaleLowerCase("cs")}|${r.last_name.toLocaleLowerCase("cs")}`;
      const prev = map.get(key);
      const attempts = (prev ? prev.attempts : 0) + 1;
      if (!prev || r.points > prev.points || (r.points === prev.points && Number(r.accuracy) > Number(prev.accuracy))) {
        map.set(key, { ...r, attempts });
      } else {
        prev.attempts = attempts;
      }
    }
    return [...map.values()].sort((a, b) => b.points - a.points || Number(b.accuracy) - Number(a.accuracy) || a.duration_s - b.duration_s);
  }
  const rankFor = (acc) => RANKS.find((r) => acc >= r.min) || RANKS[RANKS.length - 1];
  const rankByTitle = (t) => RANKS.find((r) => r.title === t);

  // ---------- HUD ----------
  function renderHud() {
    const hud = document.getElementById("hud");
    if (!S || S.phase === "done") { hud.classList.add("hidden"); return; }
    hud.classList.remove("hidden");
    $("#hudPlayer").innerHTML = `${esc(S.player.first)} ${esc(S.player.last)}<small>${esc(S.player.room)}</small>`;
    $("#hudTrack").innerHTML = ROUNDS.map((r, i) =>
      `<li class="${i < S.round || (i === S.round && S.phase === "summary") ? "done" : i === S.round ? "now" : ""}" title="${esc(r.title)}">${i + 1}</li>`).join("");
    const m = multiplier(S.streak);
    const st = $("#hudStreak");
    st.textContent = `🔥 ${S.streak}${m > 1 ? ` ×${m}` : ""}`;
    st.classList.toggle("hot", m > 1);
    $("#hudHints").textContent = `💡 ${S.hintsLeft}`;
    $("#hudPoints").textContent = fmtNum(S.points);
    updateClock();
  }
  function updateClock() {
    if (!S) return;
    const el = $("#hudTime");
    if (el) el.textContent = `⏱ ${fmtTime(((S.finishedAt || Date.now()) - S.startedAt) / 1000)}`;
  }

  // ---------- scoring ----------
  function recordItem({ correct, attempt = 1, hint = false, bonus = 0, index = null }) {
    const r = ROUNDS[S.round];
    const credit = correct ? (attempt === 1 ? 1 : 0.5) * (hint ? 0.5 : 1) : 0;
    if (correct && attempt === 1 && !hint) S.streak++;
    else if (!(correct && attempt === 1 && hint)) S.streak = 0; // a hint keeps the streak, but doesn't grow it
    S.bestStreak = Math.max(S.bestStreak, S.streak);
    const pts = credit > 0 ? Math.round((100 * credit + bonus) * multiplier(S.streak)) : 0;
    S.points += pts;
    (S.res[r.id] = S.res[r.id] || []).push({ c: credit, p: pts, i: index });
    S.sub.recorded = true;
    save();
    renderHud();
    return pts;
  }
  function nextItem() {
    S.item++;
    S.sub = { attempt: 1, hint: false };
    if (S.item >= itemCount(ROUNDS[S.round])) S.phase = "summary";
    save();
    render();
  }
  function currentItem() {
    const r = ROUNDS[S.round];
    const idx = S.order[r.id][S.item];
    return { r, it: r.items[idx], idx };
  }

  // ---------- screens ----------
  function render() {
    renderHud();
    if (!S) return renderStart();
    switch (S.phase) {
      case "rules": return renderRules();
      case "intro": return renderIntro();
      case "play": return renderPlay();
      case "summary": return renderSummary();
      case "done": return renderResults();
    }
  }

  function renderStart() {
    const saved = load();
    const urlRoom = (params.get("room") || "").trim().toUpperCase();
    let last = {};
    try { last = JSON.parse(localStorage.getItem(LAST_PLAYER_KEY) || "{}"); } catch (_) { /* ignore */ }
    const resume = saved && saved.phase !== "done" && saved.player
      ? `${cardOpen("Rozehraná hra", `${saved.round + 1} / ${ROUNDS.length}`)}
          <p>${esc(saved.player.first)} ${esc(saved.player.last)} má rozehrané kolo ${saved.round + 1} a ${fmtNum(saved.points)} bodů.</p>
          <div class="row"><button class="btn" id="resumeBtn">Pokračovat ve hře</button><button class="btn secondary" id="discardBtn">Zahodit a začít znovu</button></div>
        ${cardClose("Uloženo v tomto prohlížeči", esc(saved.player.room))}` : "";
    setScreen(`
      <section class="hero">
        <div>
          <h1>Verb Quest</h1>
          <p>Každé sloveso má svůj element. Po některých jde <b>-ing</b>, po jiných <b>to + infinitiv</b>. Sedm kol, asi 35 minut a na konci si vytáhneš kartu s hodnocením.</p>
        </div>
        <div class="fan" aria-hidden="true">
          ${elCard("ing", "playing", "enjoy, avoid, mind…", "div")}
          ${elCard("to", "to play", "want, hope, decide…", "div")}
          <div class="back-card">${ART.back()}</div>
        </div>
      </section>
      ${!ONLINE ? '<div class="offline-banner">Offline režim: výsledky se ukládají jen v tomto prohlížeči. Učitel doplní Supabase v config.js.</div>' : ""}
      ${resume}
      ${cardOpen("Kdo hraje?", elementCost())}
        <form id="startForm" novalidate>
          <div class="grid-2">
            <label class="field"><span>Jméno</span><input type="text" id="fFirst" autocomplete="given-name" maxlength="40" value="${esc(last.first || "")}" required></label>
            <label class="field"><span>Příjmení</span><input type="text" id="fLast" autocomplete="family-name" maxlength="40" value="${esc(last.last || "")}" required></label>
          </div>
          <label class="field ${urlRoom ? "hidden" : ""}"><span>Kód třídy (řekne ti ho učitel)</span><input type="text" id="fRoom" maxlength="40" value="${esc(urlRoom || last.room || "")}" required></label>
          <p class="error" id="startErr" role="alert"></p>
          <button class="btn" type="submit">Začít hrát</button>
        </form>
      ${cardClose("Verb + -ing / to + infinitive", urlRoom ? esc(urlRoom) : "A2")}`);
    if (resume) {
      $("#resumeBtn").onclick = () => { S = saved; render(); };
      $("#discardBtn").onclick = () => { clearState(); renderStart(); };
    }
    $("#startForm").onsubmit = (e) => {
      e.preventDefault();
      const nameRe = /^[\p{L}][\p{L}' -]{1,39}$/u;
      const first = $("#fFirst").value.trim(), lastN = $("#fLast").value.trim();
      const room = $("#fRoom").value.trim().toUpperCase();
      const err = $("#startErr");
      if (!nameRe.test(first)) { err.textContent = "Napiš své jméno (aspoň 2 písmena)."; return $("#fFirst").focus(); }
      if (!nameRe.test(lastN)) { err.textContent = "Napiš své příjmení (aspoň 2 písmena)."; return $("#fLast").focus(); }
      if (!/^[A-Z0-9_-]{2,40}$/.test(room)) { err.textContent = "Kód třídy může obsahovat jen písmena bez diakritiky, čísla a pomlčky."; return $("#fRoom").focus(); }
      const player = { first: capitalize(first), last: capitalize(lastN), room };
      try { localStorage.setItem(LAST_PLAYER_KEY, JSON.stringify(player)); } catch (_) { /* ignore */ }
      S = newState(player);
      save();
      render();
    };
  }

  function renderRules() {
    setScreen(`
      ${cardOpen("Pravidlo na 1 minutu", elementCost())}
        <p>Když za sebou stojí dvě slovesa, druhé má buď tvar <b>-ing</b>, nebo <b>to + infinitiv</b>. Rozhoduje to první sloveso. Pomůže ti jeho element:</p>
        <div class="rules">
          <div class="rule-card ing"><div class="in">
            <div class="top"><b>Flow: -ing</b><i>${ART.glyphIng()}</i></div>
            <div class="txt">
              <ul>
                <li>pocity a činnosti: <b>enjoy, (don't) mind, can't stand</b></li>
                <li><b>avoid, consider, finish, keep, miss, practise, give up</b></li>
                <li><b>spend time</b> + -ing</li>
              </ul>
              <p class="flavor">I enjoy playing football.</p>
            </div>
          </div></div>
          <div class="rule-card to"><div class="in">
            <div class="top"><b>Aim: to + inf.</b><i>${ART.glyphTo()}</i></div>
            <div class="txt">
              <ul>
                <li>plány a rozhodnutí: <b>want, hope, decide, plan, choose</b></li>
                <li><b>agree, can't afford, manage, need, pretend, refuse, promise, learn</b></li>
                <li><b>would like / would love / would prefer</b></li>
              </ul>
              <p class="flavor">I want to play football.</p>
            </div>
          </div></div>
        </div>
        <p class="note-box"><b>like, love, hate</b> mohou mít obojí (I hate getting up / I hate to get up). Ve hře uznáváme obě možnosti. Ale <b>would like</b> má vždy <b>to</b>.</p>
        <h3>Jak se boduje</h3>
        <ul>
          <li>Správná odpověď = 100 bodů. Ve 2. pokusu nebo s nápovědou jen polovina.</li>
          <li>Streak: 4 správně za sebou = body ×1,5, 8 za sebou = ×2. Chyba streak vynuluje.</li>
          <li>Máš ${CFG.HINTS} nápovědy na celou hru.</li>
          <li>Na konci si vytáhneš kartu s hodnocením (GOAT, Rizzler…) podle úspěšnosti. Pořadí v leaderboardu určují body.</li>
        </ul>
        <div class="row end"><button class="btn" id="goBtn">Jdu na kolo 1</button></div>
      ${cardClose("Pravidla", "VQ 00")}`);
    armNext($("#goBtn"), () => { S.phase = "intro"; save(); render(); });
  }

  function renderIntro() {
    const r = ROUNDS[S.round];
    const n = itemCount(r);
    setScreen(`
      ${cardOpen(esc(r.title), `Kolo ${S.round + 1} / ${ROUNDS.length}`, frameFor(r))}
        <p class="muted">${r.type === "speed" ? `${r.seconds} sekund` : `${n} úloh, asi ${r.minutes} min`}${r.hints ? ", nápovědy povolené" : ""}</p>
        <p style="font-size:20px">${esc(r.intro)}</p>
        <div class="row end"><button class="btn" id="startRound">${r.type === "speed" ? "Spustit odpočet" : "Rozdat karty"}</button></div>
      ${cardClose(`Kolo ${S.round + 1}`, esc(S.player.room))}`);
    armNext($("#startRound"), () => {
      S.phase = "play"; S.item = 0; S.sub = { attempt: 1, hint: false };
      if (r.type === "speed") S.speed = { endsAt: Date.now() + r.seconds * 1000, answered: 0, correct: 0, points: 0 };
      save(); render();
    });
  }

  function renderPlay() {
    const r = ROUNDS[S.round];
    if (S.sub.recorded) return nextItem(); // page was reloaded after answering
    if (r.type === "speed") return renderSpeed(r);
    if (r.type === "story") return renderStory(r);
    if (r.type === "choice" || r.type === "sort") return renderBinary();
    return renderTyped();
  }

  function qOpen(r) {
    const n = itemCount(r);
    return cardOpen(esc(r.title), `<span class="progress" aria-hidden="true"><i style="width:${(S.item / n) * 100}%"></i></span> ${S.item + 1} / ${n}`, frameFor(r), "qCard");
  }
  const qClose = (r) => cardClose(`VQ ${String(S.round + 1)}-${String(S.item + 1).padStart(2, "0")}`, esc(S.player.room));

  function hintBlock(r, it) {
    if (!r.hints) return "";
    return `<div class="tools">
      <button class="hint-btn" id="hintBtn" type="button" ${S.hintsLeft <= 0 || S.sub.hint ? "disabled" : ""}>💡 Nápověda (zbývá ${S.hintsLeft})</button>
      <span class="muted" style="font-size:15px">Nápověda = poloviční body</span>
    </div>
    <div id="hintArea">${S.sub.hint ? hintHtml(it) : ""}</div>`;
  }
  const hintHtml = (it) => `<div class="hint-text">💡 ${ruleSentence(it.v)}${it.tip ? ` ${esc(it.tip)}` : ""}</div>`;
  function wireHint(it) {
    const b = $("#hintBtn");
    if (!b) return;
    b.onclick = () => {
      if (S.hintsLeft <= 0 || S.sub.hint) return;
      S.hintsLeft--; S.sub.hint = true; save(); renderHud();
      $("#hintArea").innerHTML = hintHtml(it);
      b.disabled = true;
      b.textContent = `💡 Nápověda (zbývá ${S.hintsLeft})`;
    };
  }
  const isLastItem = () => S.item + 1 >= itemCount(ROUNDS[S.round]);
  const nextLabel = () => (isLastItem() ? "Vyhodnotit kolo" : "Další");

  // Choice + sort rounds: two element cards (-ing left, to right) or two decks.
  function renderBinary() {
    const { r, it, idx } = currentItem();
    const isSort = r.type === "sort";
    const body = isSort
      ? `<p class="sort-verb">${esc(it.v)}</p><p class="muted" style="text-align:center;margin:0 auto">Do kterého balíčku patří?</p>`
      : `<p class="q-text">${esc(it.s).replace("___", `<span class="gap" id="gap">&nbsp;</span>`)}</p>`;
    setScreen(`
      ${qOpen(r)}
        ${body}
        ${hintBlock(r, it)}
        <div id="fb"></div>
      ${qClose(r)}
      ${isSort ? decks(r) : `<div class="hand">${elCard("ing", it.opts[0], "klávesa 1 nebo ←")}${elCard("to", it.opts[1], "klávesa 2 nebo →")}</div>`}`);
    wireHint(it);
    qStart = Date.now();
    let answered = false, advanced = false;
    const go = () => { if (advanced) return; advanced = true; nextItem(); };
    const answer = (f) => {
      if (answered) return;
      answered = true;
      const correct = f === it.f;
      const secs = (Date.now() - qStart) / 1000;
      const bonus = r.speedBonus && correct && !S.sub.hint ? Math.round(50 * Math.max(0, 1 - secs / 15)) : 0;
      const pts = recordItem({ correct, hint: S.sub.hint, bonus, index: idx });
      app.querySelectorAll("[data-f]").forEach((b) => {
        b.disabled = true;
        if (b.dataset.f === f) b.classList.add("picked");
        if (b.dataset.f === it.f) b.classList.add("right");
        else if (b.dataset.f === f) b.classList.add("wrong");
        else b.classList.add("dim");
      });
      const hb = $("#hintBtn"); if (hb) hb.disabled = true;
      const gap = $("#gap");
      if (gap) { gap.textContent = it.f === "ing" ? it.opts[0] : it.opts[1]; gap.classList.add("ok"); }
      $("#fb").innerHTML = correct
        ? `<div class="feedback ok"><span class="gain">+${pts}</span><strong>Správně!</strong> ${ruleSentence(it.v)}${bonus ? ` Rychlostní bonus +${bonus}.` : ""}</div>`
        : `<div class="feedback bad"><strong>Vedle.</strong> ${ruleSentence(it.v)}<div class="row end" style="margin-top:10px"><button class="btn" id="nextBtn">${nextLabel()}</button></div></div>`;
      if (correct) {
        timers.auto = setTimeout(go, isSort ? 700 : 1100);
      } else {
        $("#qCard").classList.add("shake");
        armNext($("#nextBtn"), go);
        keyHandler = null;
      }
    };
    app.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => answer(b.dataset.f)));
    keyHandler = (e) => {
      if (e.key === "1" || e.key === "ArrowLeft") answer("ing");
      if (e.key === "2" || e.key === "ArrowRight") answer("to");
    };
  }
  function decks(r) {
    const done = S.res[r.id] || [];
    const chips = (f) => done.filter((d) => r.items[d.i].f === f)
      .map((d) => `<span class="chip ${d.c > 0 ? "" : "bad"}">${esc(r.items[d.i].v)}</span>`).join("");
    const deck = (f, label, key) => `<button class="deck ${f}" data-f="${f}"><div class="pile"><div class="pile-in">
        <div class="pile-head"><span>${label}</span><small>${key}</small></div>${chips(f)}</div></div></button>`;
    return `<div class="decks">${deck("ing", "-ing", "1 nebo ←")}${deck("to", "to + infinitiv", "2 nebo →")}</div>`;
  }

  // Typed rounds: gaps, prompts, transformations.
  function renderTyped() {
    const { r, it, idx } = currentItem();
    let body = "";
    if (r.type === "type") {
      body = `<p class="q-text">${esc(it.s).replace("___", `<span class="gap">&nbsp;?&nbsp;</span> <span class="base">(${esc(it.base)})</span>`)}</p>`;
    } else if (r.type === "prompt") {
      body = `<p class="q-text">${esc(it.s).replace("___", `<span class="gap">&nbsp;?&nbsp;</span> <span class="base">(${esc(it.p)})</span>`)}</p>`;
    } else {
      body = `<p class="first-sentence">${esc(it.s1)}</p>
        <p><span class="keyword">${esc(it.key)}</span></p>
        <p class="q-text">${esc(it.before)} <span class="gap">&nbsp;?&nbsp;</span> ${esc(it.after)}</p>`;
    }
    setScreen(`
      ${qOpen(r)}
        ${body}
        <form id="ansForm" autocomplete="off">
          <div class="answer-row">
            <input type="text" id="ans" aria-label="Tvoje odpověď" placeholder="Napiš chybějící slova" spellcheck="false" autocapitalize="off">
            <button class="btn" type="submit" id="checkBtn">Zkontrolovat</button>
          </div>
          ${r.type === "transform" ? '<p class="words" id="words">Slov: 0 / 5 (don\'t = 2 slova)</p>' : ""}
        </form>
        ${hintBlock(r, it)}
        <div id="fb">${S.sub.attempt === 2 ? '<div class="feedback retry"><strong>Ještě jeden pokus.</strong> Za správnou odpověď teď dostaneš polovinu bodů.</div>' : ""}</div>
      ${qClose(r)}`);
    wireHint(it);
    const input = $("#ans");
    input.focus();
    if (r.type === "transform") {
      input.oninput = () => {
        const n = wordCount(input.value);
        const w = $("#words");
        w.textContent = `Slov: ${n} / 5 (don't = 2 slova)`;
        w.classList.toggle("over", n > 5);
      };
    }
    $("#ansForm").onsubmit = (e) => {
      e.preventDefault();
      if (!input.value.trim()) { input.focus(); return; }
      const correct = matches(input.value, it);
      const fb = $("#fb");
      if (!correct && S.sub.attempt === 1) {
        S.sub.attempt = 2; save();
        fb.innerHTML = '<div class="feedback retry"><strong>Skoro.</strong> Zkus to ještě jednou, za správnou odpověď teď dostaneš polovinu bodů.</div>';
        $("#qCard").classList.remove("shake"); void $("#qCard").offsetWidth; $("#qCard").classList.add("shake");
        input.select();
        return;
      }
      const pts = recordItem({ correct, attempt: S.sub.attempt, hint: S.sub.hint, index: idx });
      input.disabled = true; $("#checkBtn").disabled = true;
      const hb = $("#hintBtn"); if (hb) hb.disabled = true;
      const tip = it.tip ? ` ${esc(it.tip)}` : "";
      fb.innerHTML = correct
        ? `<div class="feedback ok"><span class="gain">+${pts}</span><strong>Správně!</strong> ${ruleSentence(it.v)}</div>`
        : `<div class="feedback bad"><strong>Správně je: ${esc(it.acc[0])}</strong><br>${ruleSentence(it.v)}${tip}</div>`;
      fb.insertAdjacentHTML("beforeend", `<div class="row end" style="margin-top:14px"><button class="btn" id="nextBtn">${nextLabel()}</button></div>`);
      armNext($("#nextBtn"), nextItem);
    };
  }
  function matches(raw, it) {
    let a = norm(raw);
    if (it.before) { const b = norm(it.before); if (a.startsWith(b + " ")) a = a.slice(b.length + 1); }
    if (it.after) { const af = norm(it.after); if (a.endsWith(" " + af)) a = a.slice(0, -(af.length + 1)); }
    // like/love/hate accept both forms
    return it.acc.some((x) => norm(x) === a);
  }

  // Story round: all gaps at once, one correction pass.
  function renderStory(r) {
    const st = S.sub.story || (S.sub.story = { pass: 1, first: [], values: Array(r.gaps.length).fill("") });
    const html = esc(r.text).replace(/\{(\d+)\}/g, (_, n) => {
      const i = Number(n) - 1;
      return `<label><sup>${n}</sup><input type="text" data-i="${i}" aria-label="Mezera ${n}" spellcheck="false" autocapitalize="off" value="${esc(st.values[i] || "")}"></label>`;
    });
    setScreen(`
      ${cardOpen(esc(r.title), `${r.gaps.length} mezer`, frameFor(r), "qCard")}
        <div class="box" aria-label="Slovesa k použití">${r.box.map((w) => `<span>${esc(w)}</span>`).join("")}</div>
        <form id="storyForm" autocomplete="off">
          <p class="story">${html}</p>
          <div id="fb"></div>
          <div class="row end" style="margin-top:16px"><button class="btn" type="submit" id="checkBtn">${st.pass === 1 ? "Zkontrolovat" : "Zkontrolovat opravy"}</button></div>
        </form>
      ${cardClose("Kolo 6", esc(S.player.room))}`);
    const inputs = [...app.querySelectorAll(".story input")];
    if (st.pass === 2) {
      inputs.forEach((inp, i) => { if (st.first[i]) { inp.classList.add("ok"); inp.disabled = true; } else inp.classList.add("bad"); });
      $("#fb").innerHTML = `<div class="feedback retry"><strong>Oprav červená políčka.</strong> Opravy jsou za poloviční body.</div>`;
    }
    (inputs.find((i) => !i.disabled) || inputs[0]).focus();
    $("#storyForm").onsubmit = (e) => {
      e.preventDefault();
      st.values = inputs.map((i) => i.value);
      const ok = inputs.map((inp, i) => matches(inp.value, r.gaps[i]));
      if (st.pass === 1) {
        st.first = ok;
        if (ok.every(Boolean)) return finishStory(r, inputs, ok);
        st.pass = 2; save();
        return renderStory(r);
      }
      finishStory(r, inputs, ok);
    };
  }
  function finishStory(r, inputs, okNow) {
    const st = S.sub.story;
    let gained = 0, correctN = 0;
    S.item = r.gaps.length - 1;
    r.gaps.forEach((g, i) => {
      const firstOk = st.first[i];
      const correct = firstOk || okNow[i];
      if (correct) correctN++;
      gained += recordItem({ correct, attempt: firstOk ? 1 : 2, index: i });
      const inp = inputs[i];
      inp.disabled = true;
      inp.classList.remove("bad", "ok");
      inp.classList.add(correct ? "ok" : "bad");
      if (!correct) inp.insertAdjacentHTML("afterend", `<span class="fix">${esc(g.acc[0])}</span>`);
    });
    save();
    $("#checkBtn").remove();
    $("#fb").innerHTML = `<div class="feedback ${correctN >= r.gaps.length * 0.7 ? "ok" : "bad"}"><span class="gain">+${fmtNum(gained)}</span><strong>${correctN} z ${r.gaps.length} správně.</strong> U chyb vidíš zeleně správný tvar.</div>
      <div class="row end" style="margin-top:14px"><button class="btn" type="button" id="nextBtn">Vyhodnotit kolo</button></div>`;
    armNext($("#nextBtn"), nextItem);
  }

  // Speed round: 60 s of random pairs, only points count.
  function renderSpeed(r) {
    const sp = S.speed;
    if (!sp || Date.now() >= sp.endsAt) { S.phase = "summary"; save(); return render(); }
    let cur = null;
    const pick = () => {
      const v = r.verbs[Math.floor(Math.random() * r.verbs.length)];
      const a = r.actions[Math.floor(Math.random() * r.actions.length)];
      cur = { v, base: a[0], ing: a[1], f: RULES[v] };
      $("#spPrompt").innerHTML = `${esc(v)} ___ <span class="base">(${esc(a[0])})</span>`;
      $("#spIng .word").textContent = a[1];
      $("#spTo .word").textContent = `to ${a[0]}`;
    };
    setScreen(`
      ${cardOpen("Speed Run", '<span id="spCount">0 správně</span>', frameFor(r), "qCard")}
        <div class="row between"><span class="speed-clock" id="spClock">60</span><span class="muted">Chyba shodí streak</span></div>
        <p class="speed-prompt" id="spPrompt"></p>
      ${cardClose("Kolo 7", esc(S.player.room))}
      <div class="hand">${elCard("ing", "x", "1 nebo ←", "button", 'id="spIng"')}${elCard("to", "x", "2 nebo →", "button", 'id="spTo"')}</div>`);
    pick();
    const tick = () => {
      const left = Math.max(0, (sp.endsAt - Date.now()) / 1000);
      const c = $("#spClock");
      if (c) { c.textContent = Math.ceil(left); c.classList.toggle("low", left <= 10); }
      if (left <= 0) { clearTimers("speed"); keyHandler = null; S.phase = "summary"; save(); render(); }
    };
    tick();
    clearTimers("speed");
    timers.speed = setInterval(tick, 100);
    let lastAt = 0;
    const answer = (f) => {
      if (Date.now() >= sp.endsAt || Date.now() - lastAt < 250) return;
      lastAt = Date.now();
      const correct = f === cur.f;
      sp.answered++;
      if (correct) {
        sp.correct++; S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak);
        const pts = Math.round(25 * multiplier(S.streak));
        sp.points += pts; S.points += pts;
      } else {
        S.streak = 0;
      }
      save(); renderHud();
      $("#spCount").textContent = `${sp.correct} správně`;
      const card = $("#qCard");
      card.classList.remove("flash-ok", "flash-bad"); void card.offsetWidth;
      card.classList.add(correct ? "flash-ok" : "flash-bad");
      pick();
    };
    $("#spIng").onclick = () => answer("ing");
    $("#spTo").onclick = () => answer("to");
    keyHandler = (e) => {
      if (e.key === "1" || e.key === "ArrowLeft") answer("ing");
      if (e.key === "2" || e.key === "ArrowRight") answer("to");
    };
  }

  function roundStats(r) {
    if (r.type === "speed") {
      const sp = S.speed || { answered: 0, correct: 0, points: 0 };
      return { correct: sp.correct, total: sp.answered, credit: sp.correct, points: sp.points };
    }
    const list = S.res[r.id] || [];
    return {
      correct: list.filter((x) => x.c > 0).length,
      total: itemCount(r),
      credit: list.reduce((n, x) => n + x.c, 0),
      points: list.reduce((n, x) => n + x.p, 0)
    };
  }

  function renderSummary() {
    clearTimers("speed");
    const r = ROUNDS[S.round];
    const st = roundStats(r);
    const last = S.round + 1 >= ROUNDS.length;
    const line = r.type === "speed"
      ? `${st.correct} správně z ${st.total} odpovědí.`
      : `${st.correct} z ${st.total} správně.`;
    setScreen(`
      ${cardOpen(`${esc(r.title)}: hotovo`, `Kolo ${S.round + 1} / ${ROUNDS.length}`, frameFor(r))}
        <p class="q-text" style="color:#157F55">+${fmtNum(st.points)} bodů</p>
        <p>${line} Nejdelší streak zatím: ${S.bestStreak}.</p>
        <div class="row end"><button class="btn" id="nextRound">${last ? "Vytáhnout kartu" : `Pokračovat na kolo ${S.round + 2}`}</button></div>
      ${cardClose(`Kolo ${S.round + 1}`, esc(S.player.room))}`);
    armNext($("#nextRound"), () => {
      if (last) return finishGame();
      S.round++; S.item = 0; S.phase = "intro"; S.sub = { attempt: 1, hint: false };
      save(); render();
    });
  }

  // ---------- finish + leaderboard ----------
  function computeResult() {
    let credit = 0;
    const rounds = {};
    for (const r of ROUNDS) {
      const st = roundStats(r);
      rounds[r.id] = { correct: st.correct, total: st.total, points: st.points };
      if (r.type !== "speed") credit += st.credit;
    }
    const accuracy = Math.round((credit / TOTAL_ITEMS) * 1000) / 10;
    const rank = rankFor(accuracy);
    return {
      room: S.player.room, first_name: S.player.first, last_name: S.player.last,
      points: S.points, accuracy, rank_title: rank.title,
      duration_s: Math.round(((S.finishedAt || Date.now()) - S.startedAt) / 1000),
      details: { rounds, bestStreak: S.bestStreak, hintsUsed: CFG.HINTS - S.hintsLeft, version: 1 }
    };
  }
  function finishGame() {
    S.finishedAt = Date.now();
    S.phase = "done";
    save();
    render();
  }

  async function trySubmit() {
    if (S.submitted) return true;
    const status = $("#submitStatus");
    try {
      if (status) { status.className = "status"; status.textContent = "Ukládám výsledek…"; }
      await submitScore(computeResult());
      S.submitted = true; save();
      if (status) status.textContent = ONLINE ? "Výsledek je uložený v leaderboardu." : "Výsledek je uložený v tomto prohlížeči (offline režim).";
      return true;
    } catch (err) {
      if (status) {
        status.className = "status err";
        status.innerHTML = `Výsledek se nepodařilo uložit (${esc(err.message)}). Zkontroluj připojení a zkus to znovu. <button class="btn secondary" id="retryBtn" style="padding:6px 14px;font-size:16px">Uložit znovu</button>`;
        $("#retryBtn").onclick = async () => { if (await trySubmit()) loadBoard($("#lbBody"), S.player.room, S.player); };
      }
      return false;
    }
  }

  function renderResults() {
    clearTimers("speed");
    const res = computeResult();
    const rank = rankFor(res.accuracy);
    setScreen(`
      <section class="pull">
        <div class="flip" id="flip" aria-label="Tvoje karta: ${esc(rank.title)}">
          <div class="flip-inner">
            <div class="face back-face">${ART.back()}</div>
            <div class="face front">${rankCard(rank, { player: S.player, res })}</div>
          </div>
        </div>
        <div class="pull-side">
          <p class="on-mat" style="margin:0 0 6px">${esc(S.player.first)}, tvoje karta:</p>
          <h2>${esc(rank.title)}</h2>
          <div class="big">${fmtNum(res.points)} bodů</div>
          <p style="margin-top:12px">Úspěšnost ${String(res.accuracy).replace(".", ",")} %, nejdelší streak ${res.details.bestStreak}, čas ${fmtTime(res.duration_s)}.</p>
          <p class="status light" id="submitStatus" role="status"></p>
          <button class="btn secondary" id="againBtn">Hrát znovu</button>
        </div>
      </section>
      <section style="margin-bottom:34px">
        <h3 class="on-mat">Sbírka ranků</h3>
        <div class="collection">${RANKS.map((rk) => `<div class="mini ${rk.title === rank.title ? "mine" : "locked"}">${rankCard(rk, { mini: true })}<b>${esc(rk.title)}</b>od ${rk.min} %</div>`).join("")}</div>
      </section>
      ${cardOpen(`Leaderboard ${esc(S.player.room)}`, '<span class="status" id="lbStatus"></span>', "var(--gold)")}
        <div id="lbBody"><p class="lb-empty muted">Načítám…</p></div>
      ${cardClose(today(), "Nejlepší pokus každého hráče")}
      ${cardOpen("Jak ti šla jednotlivá kola", "")}
        <table>
          <thead><tr><th>Kolo</th><th class="num">Správně</th><th class="num">Body</th></tr></thead>
          <tbody>${ROUNDS.map((r) => { const s = res.details.rounds[r.id]; return `<tr><td>${esc(r.title)}</td><td class="num">${s.correct} / ${s.total}</td><td class="num">${fmtNum(s.points)}</td></tr>`; }).join("")}</tbody>
        </table>
      ${cardClose("Statistiky", esc(S.player.room))}`);
    const flip = $("#flip");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.auto = setTimeout(() => flip.classList.add("revealed"), reduce ? 0 : 600);
    flip.addEventListener("pointermove", (e) => {
      const b = flip.getBoundingClientRect();
      flip.style.setProperty("--mx", `${((e.clientX - b.left) / b.width) * 100}%`);
      flip.style.setProperty("--my", `${((e.clientY - b.top) / b.height) * 100}%`);
    });
    $("#againBtn").onclick = () => { clearTimers("lb"); clearState(); render(); };
    trySubmit().then(() => startBoard($("#lbBody"), S.player.room, S.player));
  }

  const RANK_META = {
    "GOAT": { cls: "r-goat", stars: 5, type: "Legendární karta", foil: true },
    "Rizzler": { cls: "r-rizzler", stars: 4, type: "Epická karta", foil: true },
    "Main Character": { cls: "r-main", stars: 3, type: "Vzácná karta" },
    "NPC": { cls: "r-npc", stars: 2, type: "Běžná karta" },
    "Skill issue": { cls: "r-skull", stars: 1, type: "Prokletá karta" }
  };
  function rankCard(rank, { player = null, res = null, mini = false } = {}) {
    const m = RANK_META[rank.title];
    const art = ART.byRank[rank.title]();
    if (mini) return `<div class="rank-card ${m.cls}"><div class="in"><div class="art">${art}</div></div></div>`;
    const no = RANKS.indexOf(rank) + 1;
    return `<div class="rank-card ${m.cls}"><div class="in">
        <div class="rc-name"><b>${esc(rank.title)}</b><span class="stars" aria-label="${m.stars} z 5">${"★".repeat(m.stars)}${"☆".repeat(5 - m.stars)}</span></div>
        <div class="art">${art}</div>
        <div class="type">${m.type}</div>
        <div class="text">${esc(rank.line)}${player ? `<em>Získal(a): ${esc(player.first)} ${esc(player.last)}</em>` : ""}</div>
        ${res ? `<div class="stats">
          <span>body <b>${fmtNum(res.points)}</b></span><span>úspěšnost <b>${String(res.accuracy).replace(".", ",")} %</b></span>
          <span>streak <b>${res.details.bestStreak}</b></span><span>čas <b>${fmtTime(res.duration_s)}</b></span></div>` : ""}
        <div class="rc-foot"><span>VQ ${no}/${RANKS.length}</span><span>${player ? esc(player.room) : ""} ${today()}</span></div>
      </div>${m.foil ? '<div class="foil"></div>' : ""}</div>`;
  }

  function startBoard(container, room, me) {
    clearTimers("lb");
    loadBoard(container, room, me);
    timers.lb = setInterval(() => loadBoard(container, room, me), CFG.LEADERBOARD_REFRESH_S * 1000);
  }
  let lastBoardRows = [];
  async function loadBoard(container, room, me) {
    const status = $("#lbStatus");
    try {
      const rows = bestPerStudent(await fetchLeaderboard(room, today()));
      lastBoardRows = rows;
      if (!container.isConnected) return clearTimers("lb");
      if (!rows.length) { container.innerHTML = '<p class="lb-empty">Zatím tu nikdo není. Dohraj hru a budeš první.</p>'; return; }
      const isMe = (r) => me && r.first_name === me.first && r.last_name === me.last;
      const myPos = rows.findIndex(isMe);
      container.innerHTML = `
        ${myPos >= 0 ? `<p><b>Jsi na ${myPos + 1}. místě z ${rows.length}.</b></p>` : ""}
        <table class="lb">
          <thead><tr><th>#</th><th>Hráč</th><th>Karta</th><th class="num">Úspěšnost</th><th class="num">Body</th></tr></thead>
          <tbody>${rows.map((r, i) => {
            const art = ART.byRank[r.rank_title];
            return `<tr class="${isMe(r) ? "me" : ""}"><td class="pos">${i + 1}.</td><td>${esc(r.first_name)} ${esc(r.last_name)}</td><td>${art ? `<span class="thumb">${art()}</span>` : ""}${esc(r.rank_title)}</td><td class="num">${String(Number(r.accuracy).toFixed(1)).replace(".", ",")} %</td><td class="num">${fmtNum(r.points)}</td></tr>`;
          }).join("")}</tbody>
        </table>`;
      if (status) { status.className = "status"; status.textContent = `obnova každých ${CFG.LEADERBOARD_REFRESH_S} s`; }
    } catch (err) {
      if (status) { status.className = "status err"; status.textContent = `Leaderboard se nepodařilo načíst: ${err.message}`; }
    }
  }

  // ---------- teacher board (?board=1&room=XYZ) ----------
  function renderBoardView() {
    document.body.classList.add("board");
    const room = (params.get("room") || "").trim().toUpperCase();
    if (!room) {
      app.innerHTML = `${cardOpen("Leaderboard pro projektor", "")}
        <form id="roomForm" class="answer-row"><input type="text" id="roomIn" placeholder="Kód třídy, např. 8A-KOCKA" aria-label="Kód třídy"><button class="btn" type="submit">Zobrazit</button></form>
        ${cardClose("Pohled učitele", "")}`;
      $("#roomForm").onsubmit = (e) => {
        e.preventDefault();
        const v = $("#roomIn").value.trim().toUpperCase();
        if (v) location.search = `?board=1&room=${encodeURIComponent(v)}`;
      };
      return;
    }
    const gameUrl = `${location.origin}${location.pathname}?room=${encodeURIComponent(room)}`;
    app.innerHTML = `
      ${!ONLINE ? '<div class="offline-banner">Offline režim: zobrazují se jen výsledky z tohoto prohlížeče.</div>' : ""}
      ${cardOpen(`Leaderboard ${esc(room)}`, '<span class="status" id="lbStatus"></span>', "var(--gold)")}
        <p class="muted">Odkaz pro studenty: <b>${esc(gameUrl)}</b></p>
        <div id="lbBody"><p class="lb-empty muted">Načítám…</p></div>
        <div class="row end" style="margin-top:20px"><button class="btn" id="exportBtn">Stáhnout leaderboard.txt</button></div>
      ${cardClose(today(), "Pohled učitele")}`;
    startBoard($("#lbBody"), room, null);
    $("#exportBtn").onclick = () => exportTxt(room);
  }

  function exportTxt(room) {
    const rows = lastBoardRows;
    const pad = (s, n) => String(s).padEnd(n);
    const lpad = (s, n) => String(s).padStart(n);
    const now = new Date().toLocaleString("cs-CZ", { timeZone: CFG.TIMEZONE });
    const lines = [
      "VERB QUEST – LEADERBOARD (verb + -ing / to + infinitive)",
      `Kód třídy: ${room}`,
      `Datum hry: ${today()}`,
      `Exportováno: ${now}`,
      "",
      `${pad("Poř.", 6)}${pad("Jméno a příjmení", 30)}${lpad("Body", 7)}  ${lpad("Úspěšnost", 9)}  ${pad("Hodnocení", 16)}${pad("Známka", 8)}${pad("Čas", 8)}Pokusů`,
      "-".repeat(96)
    ];
    rows.forEach((r, i) => {
      const rk = rankByTitle(r.rank_title);
      lines.push(`${pad(i + 1 + ".", 6)}${pad(`${r.first_name} ${r.last_name}`, 30)}${lpad(r.points, 7)}  ${lpad(Number(r.accuracy).toFixed(1) + " %", 9)}  ${pad(r.rank_title, 16)}${pad(rk ? rk.grade : "?", 8)}${pad(fmtTime(r.duration_s), 8)}${r.attempts}`);
    });
    if (!rows.length) lines.push("(zatím žádné výsledky)");
    lines.push("", "Hodnocení podle úspěšnosti: " + RANKS.map((r) => `${r.title} ≥ ${r.min} % (≈ ${r.grade})`).join(", "));
    lines.push("Pořadí podle bodů, u každého studenta jen nejlepší pokus.");
    const blob = new Blob(["﻿" + lines.join("\r\n") + "\r\n"], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leaderboard_${room}_${today()}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- boot ----------
  timers.clock = setInterval(updateClock, 1000);
  if (params.has("board")) {
    renderBoardView();
  } else {
    const saved = load();
    // A finished game reopens on the results screen; an unfinished one is offered on the start screen.
    if (saved && saved.phase === "done") S = saved;
    render();
  }
})();
