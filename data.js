// Verb Quest – exercise content (A2).
// Edit this file to change the exercises. All sentences are original.
// f: 'ing' = verb + -ing, 'to' = verb + to + infinitive

window.VQ_DATA = (function () {
  // Verb -> pattern. Used for hints and feedback explanations.
  const RULES = {
    "enjoy": "ing", "avoid": "ing", "finish": "ing", "keep": "ing", "mind": "ing",
    "don't mind": "ing", "can't stand": "ing", "consider": "ing", "miss": "ing",
    "practise": "ing", "spend time": "ing", "give up": "ing", "imagine": "ing", "suggest": "ing",
    "want": "to", "hope": "to", "decide": "to", "agree": "to", "manage": "to", "refuse": "to",
    "promise": "to", "need": "to", "would like": "to", "would love": "to", "plan": "to",
    "learn": "to", "can't afford": "to", "choose": "to", "pretend": "to", "offer": "to",
    // like / love / hate take both forms in real English – we accept both.
    "hate": "both", "like": "both", "love": "both"
  };

  const ROUNDS = [
    {
      id: "warmup",
      type: "choice",
      title: "Warm-up",
      minutes: 4,
      intro: "Vyber správný tvar. Čím rychleji odpovíš, tím větší bonus (až +50 bodů).",
      speedBonus: true,
      hints: true,
      items: [
        { s: "I enjoy ___ in the sea.", opts: ["swimming", "to swim"], f: "ing", v: "enjoy" },
        { s: "We want ___ a pizza tonight.", opts: ["ordering", "to order"], f: "to", v: "want" },
        { s: "My brother keeps ___ my phone.", opts: ["taking", "to take"], f: "ing", v: "keep" },
        { s: "She decided ___ a new bike.", opts: ["buying", "to buy"], f: "to", v: "decide" },
        { s: "Do you mind ___ the window?", opts: ["opening", "to open"], f: "ing", v: "mind" },
        { s: "They can't afford ___ a new car.", opts: ["buying", "to buy"], f: "to", v: "can't afford" },
        { s: "I finished ___ my homework at nine.", opts: ["doing", "to do"], f: "ing", v: "finish" },
        { s: "He promised ___ me with maths.", opts: ["helping", "to help"], f: "to", v: "promise" },
        { s: "Tom avoids ___ fast food.", opts: ["eating", "to eat"], f: "ing", v: "avoid" },
        { s: "I need ___ to the shop.", opts: ["going", "to go"], f: "to", v: "need" },
        { s: "We spent the afternoon ___ video games.", opts: ["playing", "to play"], f: "ing", v: "spend time" },
        { s: "Would you like ___ some tea?", opts: ["having", "to have"], f: "to", v: "would like" },
        { s: "Anna is considering ___ to Prague.", opts: ["moving", "to move"], f: "ing", v: "consider" },
        { s: "The dog refused ___ the car.", opts: ["leaving", "to leave"], f: "to", v: "refuse" },
        { s: "I miss ___ my grandma every weekend.", opts: ["seeing", "to see"], f: "ing", v: "miss" }
      ]
    },
    {
      id: "sort",
      type: "sort",
      title: "Verb Sort",
      minutes: 3,
      intro: "Roztřiď slovesa: patří k nim tvar -ing, nebo to + infinitiv? Klávesy ← a → fungují taky.",
      hints: false,
      items: [
        { v: "enjoy", f: "ing" }, { v: "want", f: "to" }, { v: "avoid", f: "ing" },
        { v: "hope", f: "to" }, { v: "finish", f: "ing" }, { v: "decide", f: "to" },
        { v: "can't stand", f: "ing" }, { v: "agree", f: "to" }, { v: "consider", f: "ing" },
        { v: "manage", f: "to" }, { v: "keep", f: "ing" }, { v: "refuse", f: "to" },
        { v: "don't mind", f: "ing" }, { v: "pretend", f: "to" }, { v: "miss", f: "ing" },
        { v: "can't afford", f: "to" }, { v: "practise", f: "ing" }, { v: "would like", f: "to" },
        { v: "give up", f: "ing" }, { v: "promise", f: "to" }
      ]
    },
    {
      id: "gaps",
      type: "type",
      title: "Fill the Gap",
      minutes: 7,
      intro: "Napiš správný tvar slovesa v závorce. Máš dva pokusy, druhý je za poloviční body. Pozor na pravopis (swim → swimming).",
      hints: true,
      items: [
        { s: "I don't mind ___ to school.", base: "walk", acc: ["walking"], v: "don't mind" },
        { s: "My sister hopes ___ a doctor.", base: "become", acc: ["to become"], v: "hope" },
        { s: "I can't stand ___ in long queues.", base: "wait", acc: ["waiting"], v: "can't stand" },
        { s: "We agreed ___ at six o'clock.", base: "meet", acc: ["to meet"], v: "agree" },
        { s: "Jack spends hours ___ videos online.", base: "watch", acc: ["watching"], v: "spend time" },
        { s: "She pretended ___ ill.", base: "be", acc: ["to be"], v: "pretend" },
        { s: "I finally managed ___ my keys.", base: "find", acc: ["to find"], v: "manage" },
        { s: "Do you enjoy ___ in the lake?", base: "swim", acc: ["swimming"], v: "enjoy", tip: "swim → zdvoj m." },
        { s: "They chose ___ at home.", base: "stay", acc: ["to stay"], v: "choose" },
        { s: "Dad gave up ___ sweets.", base: "eat", acc: ["eating"], v: "give up" },
        { s: "We are planning ___ London.", base: "visit", acc: ["to visit"], v: "plan" },
        { s: "I keep ___ my password.", base: "forget", acc: ["forgetting"], v: "keep", tip: "forget → zdvoj t." },
        { s: "I would love ___ around the world.", base: "travel", acc: ["to travel"], v: "would love" },
        { s: "He avoided ___ my question.", base: "answer", acc: ["answering"], v: "avoid" },
        { s: "Lucy learned ___ a bike when she was five.", base: "ride", acc: ["to ride"], v: "learn" },
        { s: "My cousin practises ___ the guitar every day.", base: "play", acc: ["playing"], v: "practise" }
      ]
    },
    {
      id: "prompts",
      type: "prompt",
      title: "Build It",
      minutes: 6,
      intro: "Doplň větu pomocí slov v závorce. Nepřehazuj pořadí, ale uprav tvary a čas (yesterday → minulý čas).",
      hints: true,
      items: [
        { s: "I ___ comics.", p: "enjoy / read", acc: ["enjoy reading"], v: "enjoy" },
        { s: "Yesterday Mia ___ Spanish.", p: "decide / learn", acc: ["decided to learn"], v: "decide", tip: "Yesterday → minulý čas." },
        { s: "My parents ___ me to school.", p: "not / mind / drive", acc: ["don't mind driving", "do not mind driving"], v: "don't mind" },
        { s: "Last weekend we ___ football in the park.", p: "spend / time / play", acc: ["spent time playing"], v: "spend time", tip: "Last weekend → minulý čas: spend → spent." },
        { s: "Ben ___ the race tomorrow.", p: "hope / win", acc: ["hopes to win"], v: "hope", tip: "Ben = he → přidej -s." },
        { s: "I ___ new trainers.", p: "can't / afford / buy", acc: ["can't afford to buy", "cannot afford to buy"], v: "can't afford" },
        { s: "When she was little, she ___ vegetables.", p: "refuse / eat", acc: ["refused to eat"], v: "refuse", tip: "When she was little → minulý čas." },
        { s: "Every time we meet, we ___ about school.", p: "avoid / talk", acc: ["avoid talking"], v: "avoid" }
      ]
    },
    {
      id: "transform",
      type: "transform",
      title: "Same Meaning",
      minutes: 7,
      intro: "Doplň druhou větu tak, aby znamenala totéž co první. Použij slovo VELKÝMI PÍSMENY a maximálně 5 slov.",
      hints: true,
      items: [
        { s1: "I don't want to clean my room.", key: "REFUSE", before: "I", after: "my room.", acc: ["refuse to clean"], v: "refuse" },
        { s1: "Waiting for the bus is no problem for me.", key: "MIND", before: "I", after: "for the bus.", acc: ["don't mind waiting", "do not mind waiting"], v: "don't mind" },
        { s1: "Playing tennis is really fun for me.", key: "ENJOY", before: "I", after: "tennis.", acc: ["enjoy playing", "really enjoy playing"], v: "enjoy" },
        { s1: "Tom said: \"OK, I will help you.\"", key: "AGREED", before: "Tom", after: "me.", acc: ["agreed to help"], v: "agree" },
        { s1: "I want to drink some water, please.", key: "WOULD", before: "I", after: "some water, please.", acc: ["would like to drink", "would love to drink"], v: "would like", tip: "WOULD + like + to…" },
        { s1: "Jana thinks rap music is terrible.", key: "HATES", before: "Jana", after: "to rap music.", acc: ["hates listening", "hates to listen", "really hates listening", "really hates to listen"], v: "hate" },
        { s1: "I stayed at home because I didn't want to meet Petr.", key: "AVOID", before: "I stayed at home to", after: "Petr.", acc: ["avoid meeting", "avoid seeing"], v: "avoid" },
        { s1: "It was difficult, but in the end I did my homework.", key: "MANAGED", before: "In the end I", after: "my homework.", acc: ["managed to do", "managed to finish"], v: "manage" }
      ]
    },
    {
      id: "story",
      type: "story",
      title: "Boss Level",
      minutes: 6,
      intro: "Doplň příběh. Každé sloveso z rámečku použij jednou a ve správném tvaru. Po kontrole můžeš chyby jednou opravit.",
      hints: false,
      box: ["buy", "get", "join", "make", "pay", "practise", "reach", "spend", "start", "use"],
      // {n} marks a gap; gaps[n-1] holds the accepted answers.
      text: "Last week my best friend Leo decided {1} a YouTube channel. He really enjoys {2} videos, and he doesn't mind {3} hours on editing. At first, his parents refused {4} him a new camera. They can't afford {5} so much money. So Leo chose {6} his old phone. He spends his evenings {7} in front of the mirror. Yesterday he managed {8} 100 subscribers! Now he hopes {9} 1,000. I'm considering {10} his channel too.",
      gaps: [
        { acc: ["to start"], v: "decide" },
        { acc: ["making"], v: "enjoy" },
        { acc: ["spending"], v: "don't mind" },
        { acc: ["to buy"], v: "refuse" },
        { acc: ["to pay"], v: "can't afford" },
        { acc: ["to use"], v: "choose" },
        { acc: ["practising", "practicing"], v: "spend time" },
        { acc: ["to get"], v: "manage" },
        { acc: ["to reach"], v: "hope" },
        { acc: ["joining"], v: "consider" }
      ]
    },
    {
      id: "speed",
      type: "speed",
      title: "Speed Run",
      minutes: 1,
      seconds: 60,
      intro: "60 sekund. Odpověz na co nejvíc dvojic. Chyba ti jen shodí streak. Toto kolo počítá body, ne hodnocení.",
      hints: false,
      verbs: ["enjoy", "avoid", "finish", "keep", "don't mind", "can't stand", "consider", "miss", "practise", "give up", "imagine", "suggest",
              "want", "hope", "decide", "agree", "manage", "refuse", "promise", "need", "would like", "plan", "learn", "can't afford", "choose", "pretend", "offer"],
      actions: [
        ["dance", "dancing"], ["swim", "swimming"], ["read", "reading"], ["cook", "cooking"], ["run", "running"],
        ["travel", "travelling"], ["sing", "singing"], ["write", "writing"], ["shop", "shopping"], ["study", "studying"],
        ["sleep", "sleeping"], ["drive", "driving"], ["sit", "sitting"], ["paint", "painting"], ["relax", "relaxing"]
      ]
    }
  ];

  // Rank titles instead of grades 1–5 (min = minimum accuracy in %).
  const RANKS = [
    { min: 90, title: "GOAT", emoji: "🐐", grade: 1, line: "Slovesa ti jdou jak nikomu. Absolutní legenda." },
    { min: 75, title: "Rizzler", emoji: "😎", grade: 2, line: "Slovesa tě poslouchají na slovo. Kousek od GOATa." },
    { min: 60, title: "Main Character", emoji: "✨", grade: 3, line: "Solidní výkon. Ještě pár vzorců a jsi Rizzler." },
    { min: 40, title: "NPC", emoji: "🤖", grade: 4, line: "Základ máš, ale jedeš na autopilota. Projdi si pravidla znovu." },
    { min: 0, title: "Skill issue", emoji: "💀", grade: 5, line: "Tohle kolo nevyšlo. Zopakuj si pravidla a dej comeback." }
  ];

  return { RULES, ROUNDS, RANKS };
})();
