# Verb Quest: -ing or to?

Gamifikované cvičení z angličtiny (A2): verb + -ing vs. verb + to + infinitive.
Hra má 7 kol, trvá asi 35 minut, třída má společný leaderboard a místo známek si student na konci vytáhne sběratelskou kartu s rankem.

## Soubory

| Soubor / složka | Co v něm je |
|---|---|
| `index.html` | Stránka a vzhled (CSS) |
| `app.js` | Herní logika, body, leaderboard, export do txt |
| `data.js` | Všechna cvičení a hranice ranků. Obsah se upravuje tady |
| `art.js` | Vlastní SVG ilustrace (karty ranků, rub karty, symboly -ing/to) |
| `config.js` | Přístup k Supabase (URL + publishable key) |
| `fonts.css`, `fonts/` | Písma uložená přímo v repu (OFL licence), bez Google Fonts |
| `supabase.sql` | Tabulka a funkce pro databázi |

---

## Tutoriál: nasazení na Supabase a GitHub Pages (asi 20 minut)

### Část A: Supabase (databáze pro leaderboard)

1. Jdi na **supabase.com** → *Start your project* → přihlas se přes GitHub.
2. *New project*:
   - **Name:** `verb-quest`
   - **Database password:** vygeneruj a ulož si ho (hra ho nepotřebuje).
   - **Region:** *Central EU (Frankfurt)*, ať jsou data v EU.
   - Když se zobrazí volba *Enable Data API*, nech ji **zapnutou**.
   - *Create new project* a počkej 1–2 minuty.
3. V levém menu otevři **SQL Editor** → *New query*.
4. Otevři `supabase.sql` v Poznámkovém bloku, zkopíruj celý obsah, vlož ho do editoru a klikni **Run**.
   - Když Supabase upozorní na „destructive operation“ (kvůli příkazu `revoke`), potvrď spuštění.
   - Správný výsledek je *Success. No rows returned*.
5. Jdi do **Project Settings → API Keys** a zkopíruj si:
   - **Project URL** (`https://xxxxxxxx.supabase.co`, najdeš ho i v *Project Settings → Data API*),
   - **Publishable key** (`sb_publishable_…`). Pokud tam je jen záložka *Legacy API keys*, vezmi klíč **anon public** (`eyJ…`).
   - ⚠️ **Nikdy** nepoužij `service_role` ani `secret` klíč. Ten by dal komukoli plný přístup k databázi.
6. Otevři `config.js` a vyplň obě hodnoty:
   ```js
   SUPABASE_URL: "https://xxxxxxxx.supabase.co",
   SUPABASE_KEY: "sb_publishable_xxxxxxxx",
   ```

### Část B: GitHub Pages (hosting hry)

1. Na **github.com** klikni na **+ → New repository**.
   - **Repository name:** `verb-quest`
   - **Public**. GitHub Pages zdarma funguje jen u veřejných repozitářů. Klíč v `config.js` je publishable, takže je to v pořádku.
   - *Create repository*.
2. Na stránce repa klikni na **uploading an existing file**.
3. Rozbal zip a do okna přetáhni **obsah** složky `verb-quest`, ne složku samotnou: všechny soubory **včetně složky `fonts`**.
   - Ve Windows: označ vše `Ctrl+A` a přetáhni to do Chromu nebo Edge.
4. Dole klikni na **Commit changes**.
5. **Settings → Pages**:
   - *Source:* **Deploy from a branch**
   - *Branch:* **main**, složka **/ (root)** → **Save**.
6. Po 1–2 minutách se nahoře objeví adresa `https://<tvuj-ucet>.github.io/verb-quest/`.

Pozdější úpravy (třeba obsahu v `data.js`): otevři soubor na GitHubu → ikona tužky → uprav → *Commit changes*. Stránka se aktualizuje do minuty. V učebně může pomoct `Ctrl+F5`.

### Část C: Kontrola před hodinou

1. Otevři `https://<tvuj-ucet>.github.io/verb-quest/?room=TEST` a zahraj si hru až do konce.
   - Pokud se nahoře zobrazí žlutý pruh **Offline režim**, `config.js` není vyplněný nebo se nenahrál.
2. Otevři `https://<tvuj-ucet>.github.io/verb-quest/?board=1&room=TEST`. Tvůj výsledek tam musí být.
3. Testovací výsledek smažeš v Supabase: *Table Editor → scores* → označ řádek → *Delete*.

**Časté chyby**

| Co vidíš | Příčina | Oprava |
|---|---|---|
| „Výsledek se nepodařilo uložit (404…)“ | SQL se nespustilo nebo je vypnuté Data API | Spusť znovu `supabase.sql`, zapni *Project Settings → Data API* |
| „… (401…)“ | Špatný klíč v `config.js` | Zkopíruj znovu publishable / anon klíč |
| „… invalid duration“ | Hra byla dohrána za méně než 3 minuty | Ochrana proti podvodu, v hodině to nenastane |
| Stránka bez vzhledu nebo grafiky | Nenahrála se složka `fonts` nebo `art.js` | Nahraj chybějící soubory |
| Supabase nereaguje | Free projekt se po týdnu nečinnosti uspí | V dashboardu klikni *Restore project* |

---

## Použití v hodině

- **Odkaz pro studenty:** `…/verb-quest/?room=8A-KOCKA`. Kód třídy si vymysli a ber ho jako heslo: kdo ho nezná, výsledky nevidí. Bez `?room=` se hra na kód zeptá sama.
- **Leaderboard na projektor:** `…/verb-quest/?board=1&room=8A-KOCKA`. Obnovuje se každých 10 s, tlačítko **Stáhnout leaderboard.txt** uloží výsledky dne (UTF-8, se známkou 1–5 jako orientační převod).
- Když student zavře okno, po otevření stejného odkazu na stejném PC může pokračovat. Čas Speed Runu přitom běží dál.
- Student může hrát znovu. Počítá se jeho nejlepší pokus, txt ukazuje počet pokusů.

## Kola

| # | Kolo | Typ | Úloh | Čas |
|---|---|---|---|---|
| 1 | Warm-up | výběr ze dvou karet, rychlostní bonus | 15 | 4 min |
| 2 | Verb Sort | třídění sloves do dvou balíčků | 20 | 3 min |
| 3 | Fill the Gap | psaní tvaru slovesa | 16 | 7 min |
| 4 | Build It | věta ze zadaných slov, úprava času | 8 | 6 min |
| 5 | Same Meaning | transformace s klíčovým slovem, max. 5 slov | 8 | 7 min |
| 6 | Boss Level | příběh s rámečkem sloves | 10 | 6 min |
| 7 | Speed Run | 60 s bleskovka, jen body | – | 1 min |

## Bodování a karty

- 100 bodů za správnou odpověď. Ve 2. pokusu nebo s nápovědou je to polovina. Od 4 správných za sebou ×1,5, od 8 ×2.
- **Karta (rank) podle úspěšnosti** v kolech 1–6 (77 úloh): GOAT ≥ 90 % (legendární, holo), Rizzler ≥ 75 % (epická, holo), Main Character ≥ 60 %, NPC ≥ 40 %, Skill issue pod 40 %. Hranice jsou v `data.js` → `RANKS`.
- **Pořadí v leaderboardu podle bodů**: kromě znalostí se do něj promítá i rychlost a streak.

## Bezpečnost a data

- Tabulka je zamčená (RLS bez policy). Číst a zapisovat jde jen přes funkce `submit_score` (kontrola rozsahů, max. 3 odeslání za 10 min) a `get_leaderboard` (vyžaduje kód třídy).
- Body počítá prohlížeč. Zdatný student by si přes DevTools mohl poslat vymyšlené, ale uvěřitelné skóre.
- Ukládají se jména žáků. Domluv to s pověřencem pro GDPR. Staré výsledky smažeš příkazem na konci `supabase.sql`.
