// Verb Quest – hand-made SVG artwork for the trading-card look.
// All illustrations are original. Each function returns an SVG string.
window.VQ_ART = (function () {
  const INK = "#1F2430";
  const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

  // Radiating rays behind a character (cx, cy centre).
  function rays(cx, cy, n, color, opacity) {
    let out = "";
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, w = Math.PI / n / 2.2, r = 260;
      const x1 = cx + Math.cos(a - w) * r, y1 = cy + Math.sin(a - w) * r;
      const x2 = cx + Math.cos(a + w) * r, y2 = cy + Math.sin(a + w) * r;
      out += `<polygon points="${cx},${cy} ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}"/>`;
    }
    return `<g fill="${color}" opacity="${opacity}">${out}</g>`;
  }
  // Four-point sparkle.
  const sparkle = (x, y, s, c = "#FFFFFF") =>
    `<path d="M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z" fill="${c}"/>`;
  const star5 = (cx, cy, r, c) => {
    let p = "";
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + (i * Math.PI) / 5;
      p += `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)} `;
    }
    return `<polygon points="${p}" fill="${c}" ${S}/>`;
  };
  const wrap = (body, label) =>
    `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;

  // GOAT – crowned goat on a golden sunburst.
  function goat() {
    return wrap(`
      <rect width="200" height="150" fill="#F2B33D"/>
      ${rays(100, 92, 18, "#FFE08A", 0.75)}
      <ellipse cx="100" cy="150" rx="120" ry="26" fill="#D9932A"/>
      <path d="M86 62 C74 36 50 34 44 56 C52 46 66 48 74 66" fill="#9A7350" ${S}/>
      <path d="M114 62 C126 36 150 34 156 56 C148 46 134 48 126 66" fill="#9A7350" ${S}/>
      <ellipse cx="62" cy="84" rx="20" ry="8" transform="rotate(-18 62 84)" fill="#E6E2D6" ${S}/>
      <ellipse cx="138" cy="84" rx="20" ry="8" transform="rotate(18 138 84)" fill="#E6E2D6" ${S}/>
      <path d="M92 124 L100 148 L108 124 Z" fill="#DCD8CC" ${S}/>
      <path d="M76 72 Q100 56 124 72 L121 116 Q100 136 79 116 Z" fill="#F7F5EF" ${S}/>
      <ellipse cx="88" cy="90" rx="7" ry="6" fill="#FFF4C2" ${S}/>
      <ellipse cx="112" cy="90" rx="7" ry="6" fill="#FFF4C2" ${S}/>
      <rect x="84" y="88.5" width="8" height="3" rx="1.5" fill="${INK}"/>
      <rect x="108" y="88.5" width="8" height="3" rx="1.5" fill="${INK}"/>
      <ellipse cx="100" cy="114" rx="13" ry="9" fill="#EBC3BB" ${S}/>
      <circle cx="95" cy="114" r="1.8" fill="${INK}"/><circle cx="105" cy="114" r="1.8" fill="${INK}"/>
      <path d="M85 60 L89 44 L97 54 L100 40 L103 54 L111 44 L115 60 Z" fill="#FFD23F" ${S}/>
      <circle cx="100" cy="48" r="2.6" fill="#E8577A"/>
      ${sparkle(34, 30, 9)}${sparkle(166, 26, 7)}${sparkle(170, 112, 6)}`, "GOAT: koza s korunou");
  }

  // Rizzler – smirking fox with sunglasses.
  function rizzler() {
    return wrap(`
      <rect width="200" height="150" fill="#6C4BD6"/>
      <circle cx="100" cy="88" r="70" fill="#8462F0"/>
      <path d="M64 74 L72 32 L96 60 Z" fill="#F08A3C" ${S}/>
      <path d="M136 74 L128 32 L104 60 Z" fill="#F08A3C" ${S}/>
      <path d="M71 64 L75 44 L87 58 Z" fill="#FFD9B8"/>
      <path d="M129 64 L125 44 L113 58 Z" fill="#FFD9B8"/>
      <path d="M58 76 Q100 46 142 76 Q144 106 100 134 Q56 106 58 76 Z" fill="#F08A3C" ${S}/>
      <path d="M64 94 Q84 104 100 134 Q72 120 64 94 Z" fill="#FFF6EC"/>
      <path d="M136 94 Q116 104 100 134 Q128 120 136 94 Z" fill="#FFF6EC"/>
      <path d="M58 76 Q100 46 142 76 Q144 106 100 134 Q56 106 58 76 Z" fill="none" ${S}/>
      <rect x="68" y="80" width="28" height="17" rx="7" fill="${INK}"/>
      <rect x="104" y="80" width="28" height="17" rx="7" fill="${INK}"/>
      <path d="M96 85 H104" ${S}/>
      <path d="M73 84 L80 92 M78 83 L84 90" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".75"/>
      <path d="M109 84 L116 92" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".75"/>
      <path d="M106 74 Q118 66 130 72" fill="none" ${S}/>
      <ellipse cx="100" cy="106" rx="5" ry="3.6" fill="${INK}"/>
      <path d="M90 116 Q104 122 114 110" fill="none" ${S}/>
      ${sparkle(30, 34, 10)}${sparkle(170, 40, 8)}${sparkle(160, 120, 6)}${sparkle(40, 118, 5)}`, "Rizzler: liška se slunečními brýlemi");
  }

  // Main Character – figure in a spotlight on stage.
  function mainCharacter() {
    return wrap(`
      <rect width="200" height="150" fill="#2C3F92"/>
      <polygon points="88,0 112,0 152,140 48,140" fill="#FFF3B0" opacity=".32"/>
      <ellipse cx="100" cy="138" rx="64" ry="12" fill="#FFE38A" ${S}/>
      <path d="M86 102 L66 76" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
      <path d="M86 102 L66 76" stroke="#FFC9A6" stroke-width="5" stroke-linecap="round"/>
      <path d="M114 102 L134 76" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
      <path d="M114 102 L134 76" stroke="#FFC9A6" stroke-width="5" stroke-linecap="round"/>
      <path d="M84 98 Q100 90 116 98 L124 136 L76 136 Z" fill="#E8577A" ${S}/>
      <path d="M92 98 L100 112 L108 98" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <circle cx="100" cy="76" r="15" fill="#FFC9A6" ${S}/>
      <path d="M85 74 Q86 58 100 58 Q116 58 115 74 Q108 66 98 68 Q90 66 85 74 Z" fill="#3B2A22" ${S}/>
      <circle cx="94" cy="78" r="1.8" fill="${INK}"/><circle cx="106" cy="78" r="1.8" fill="${INK}"/>
      <path d="M95 84 Q100 88 105 84" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      ${star5(40, 40, 10, "#FFD23F")}${star5(162, 52, 8, "#FFD23F")}${star5(150, 18, 5, "#FFFFFF")}
      ${sparkle(58, 110, 5)}${sparkle(148, 104, 6)}`, "Main Character: postava v reflektoru");
  }

  // NPC – blocky villager with a "..." speech bubble.
  function npc() {
    return wrap(`
      <rect width="200" height="150" fill="#AEB9B4"/>
      <rect y="122" width="200" height="28" fill="#8C9893"/>
      <path d="M0 122 H200" ${S}/>
      <rect x="76" y="94" width="48" height="40" rx="4" fill="#7D8C9A" ${S}/>
      <rect x="62" y="98" width="14" height="28" rx="3" fill="#7D8C9A" ${S}/>
      <rect x="124" y="98" width="14" height="28" rx="3" fill="#7D8C9A" ${S}/>
      <rect x="82" y="54" width="36" height="36" rx="4" fill="#DED6C8" ${S}/>
      <rect x="82" y="54" width="36" height="9" fill="#6B5A4A" ${S}/>
      <rect x="90" y="70" width="5" height="5" fill="${INK}"/><rect x="105" y="70" width="5" height="5" fill="${INK}"/>
      <path d="M92 82 H108" ${S}/>
      <path d="M128 22 H178 Q184 22 184 28 V48 Q184 54 178 54 H146 L136 64 L138 54 H128 Q122 54 122 48 V28 Q122 22 128 22 Z" fill="#FFFFFF" ${S}/>
      <circle cx="140" cy="38" r="3.2" fill="${INK}"/><circle cx="153" cy="38" r="3.2" fill="${INK}"/><circle cx="166" cy="38" r="3.2" fill="${INK}"/>`, "NPC: hranatá postavička s bublinou");
  }

  // Skill issue – cracked cartoon skull with a plaster.
  function skull() {
    return wrap(`
      <rect width="200" height="150" fill="#5C2A30"/>
      <g stroke="#6E343B" stroke-width="10">${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 30 - 40} 150 L${i * 30 + 40} 0"/>`).join("")}</g>
      <path d="M64 84 Q64 42 100 42 Q136 42 136 84 Q136 102 124 108 L124 126 L76 126 L76 108 Q64 102 64 84 Z" fill="#F2EEE4" ${S}/>
      <ellipse cx="86" cy="86" rx="11" ry="13" fill="${INK}"/>
      <ellipse cx="114" cy="86" rx="11" ry="13" fill="${INK}"/>
      <circle cx="89" cy="82" r="3" fill="#FFFFFF"/><circle cx="117" cy="82" r="3" fill="#FFFFFF"/>
      <path d="M100 98 L95 108 L105 108 Z" fill="${INK}"/>
      <path d="M86 116 V126 M95 116 V126 M105 116 V126 M114 116 V126" stroke="${INK}" stroke-width="2.4"/>
      <path d="M108 43 L101 56 L109 62 L102 72" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
      <g transform="rotate(-28 82 56)"><rect x="66" y="50" width="34" height="12" rx="3" fill="#F5D3A6" ${S}/>
        <circle cx="79" cy="56" r="1.3" fill="${INK}"/><circle cx="83" cy="56" r="1.3" fill="${INK}"/><circle cx="87" cy="56" r="1.3" fill="${INK}"/></g>
      <path d="M146 54 Q152 64 146 70 Q140 64 146 54 Z" fill="#8CC8F0" ${S}/>`, "Skill issue: lebka s náplastí");
  }

  // Element glyphs: -ing = flow (ongoing activity), to = aim (towards a plan).
  const glyphIng = (c = "currentColor") =>
    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 14 C6 8 9 8 12 14 C15 20 18 20 21 14" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round"/><path d="M3 8 C6 4 9 4 12 8" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" opacity=".55"/></svg>`;
  const glyphTo = (c = "currentColor") =>
    `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="17" cy="12" r="4.5" fill="none" stroke="${c}" stroke-width="2.2" opacity=".55"/><path d="M3 12 H17 M12 7 L17 12 L12 17" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  // Card back: tiled flow/aim glyphs around a VQ emblem.
  function back() {
    let tiles = "";
    for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) {
      const px = x * 40 + (y % 2 ? 20 : 0) - 10, py = y * 40 - 6;
      tiles += (x + y) % 2
        ? `<path d="M${px} ${py + 14} c4 -7 8 -7 12 0 s8 7 12 0" fill="none" stroke="#3E6A72" stroke-width="3" stroke-linecap="round"/>`
        : `<path d="M${px} ${py + 14} h20 m-6 -6 l6 6 l-6 6" fill="none" stroke="#3E6A72" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return `<svg viewBox="0 0 220 308" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="220" height="308" fill="#21444B"/>${tiles}
      <rect x="12" y="12" width="196" height="284" rx="14" fill="none" stroke="#E8B931" stroke-width="3"/>
      <circle cx="110" cy="154" r="50" fill="#21444B" stroke="#E8B931" stroke-width="4"/>
      <circle cx="110" cy="154" r="40" fill="none" stroke="#E8B931" stroke-width="1.5" stroke-dasharray="3 5"/>
      <text x="110" y="170" text-anchor="middle" font-family="'Big Shoulders Display', 'Arial Narrow', sans-serif" font-weight="900" font-size="46" fill="#E8B931">VQ</text>
    </svg>`;
  }

  return { goat, rizzler, mainCharacter, npc, skull, back, glyphIng, glyphTo,
    byRank: { "GOAT": goat, "Rizzler": rizzler, "Main Character": mainCharacter, "NPC": npc, "Skill issue": skull } };
})();
