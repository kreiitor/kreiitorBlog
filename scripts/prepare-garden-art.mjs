import { writeFile } from 'node:fs/promises';

// Original vector vocabulary: paper, annotation lines, sage structures, clay focal points.
// 2026-10-14 pass: denser margins (corner ticks, folio numbers, paper grain),
// every element inside a 32px safe area, labels on a shared baseline rule.
const line = '#a3a593', ink = '#33362e', sage = '#55624b', clay = '#b0603c';
const path = (d, color = sage, extra = '') => `<path d="${d}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" ${extra}/>`;
const circle = (x, y, r, fill = '#fbf9f3') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${line}" stroke-width="1.5"/>`;
const box = (x, y, w, h, fill = '#fbf9f3') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${line}" stroke-width="1.5"/>`;
// Label baseline: optical center of a latin glyph ≈ 0.35em above the baseline.
const label = (x, y, text, color = ink, size = 15) => `<text x="${x}" y="${y + size * .35}" font-family="sans-serif" font-size="${size}" fill="${color}" text-anchor="middle">${text.replaceAll('&', '&amp;')}</text>`;
const dots = (x, y) => [0, 1, 2].map(i => circle(x + i * 18, y, 2, sage)).join('');
// Emphasis ring + short ticks around a clay focal node.
const halo = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r + 9}" fill="none" stroke="${clay}" stroke-width="1.5" opacity=".45"/><path d="M${x} ${y - r - 15}v-7M${x} ${y + r + 15}v7M${x - r - 15} ${y}h-7M${x + r + 15} ${y}h7" stroke="${clay}" stroke-width="1.5" stroke-linecap="round" opacity=".45"/>`;
// Ruler ticks along the top margin, folio number at bottom right.
const ticks = () => [0, 1, 2, 3, 4, 5].map(i => `<path d="M${120 + i * 112} 56v${i % 2 ? 4 : 7}" stroke="${line}" stroke-width="1.1" opacity=".5"/>`).join('');
const folio = n => `<text x="760" y="390" font-family="Georgia,serif" font-size="12" font-style="italic" fill="${sage}" text-anchor="end">№ ${String(n).padStart(2, '0')}</text>`;
const grain = id => `<defs><pattern id="${id}" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r=".8" fill="${ink}" opacity=".05"/></pattern></defs><rect width="800" height="420" fill="url(#${id})"/>`;
const compositions = {
 'post-math': { title: 'Structures & intuition', note: 'MATHEMATICS / FROM RELATIONS TO REASONING', bg: '#e6ebdb', art:
  path('M252 287h296M281 297V103', line) + [0, 1, 2, 3].map(i => `<path d="M${281 + (i + 1) * 59.2} 287v-6M281 ${287 - (i + 1) * 46.25}h6" stroke="${line}" stroke-width="1.2" opacity=".6"/>`).join('') +
  path('M289 277C320 275 335 196 370 202S411 125 484 125', clay) +
  path('M315 250 465 156 530 260Z') + path('M465 156 407 295 315 250M407 295l123-35', line) +
  circle(315, 250, 5, sage) + circle(465, 156, 5, clay) + circle(530, 260, 5, sage) +
  label(516, 108, 'f(x)', sage, 23) + label(566, 292, 'x', sage, 18) + label(266, 122, 'y', sage, 18) },
 'series-ai-agent': { title: 'A loop of decisions', note: 'AGENT / CONTEXT · REASONING · ACTION', bg: '#e6ebdb', art:
  path('M312 194h74m88 0h76M430 232v48H280v-44', line) + path('m376 187 7 7-7 7m164-14 7 7-7 7', clay) +
  box(209, 158, 103, 72) + box(386, 143, 90, 98) + box(550, 158, 103, 72) + box(238, 266, 118, 44, '#eee9dc') +
  label(260.5, 194, 'Context') + label(431, 182, 'Reason') + label(431, 206, '& decide', sage, 13) + label(601.5, 194, 'Tools') + label(297, 288, 'Memory') +
  halo(430, 279, 5) + circle(430, 279, 5, clay) + path('M263 158v-34h168v19', sage, 'stroke-dasharray="4 6"') },
 'series-ai-infra': { title: 'The layers beneath', note: 'INFRA / COMPUTE · COMMUNICATION · STORAGE', bg: '#ece7d9', art:
  path('m240 246 133-65 133 65-133 65-133-65Z', line) + path('m240 215 133-65 133 65-133 65-133-65Z', sage) +
  path('m240 184 133-65 133 65-133 65-133-65Z', clay) + path('M373 249v62m-133-65v-62m266 62v-62', line) +
  [0, 1, 2, 3].map(i => box(325 + i % 2 * 48, 153 + Math.floor(i / 2) * 21, 35, 14, '#fbf9f3')).join('') +
  path('M506 184h67M506 215h67M506 246h67', line) + label(616, 180, 'Compute', sage, 13) + label(616, 211, 'Connect', sage, 13) + label(616, 242, 'Store', sage, 13) +
  dots(583, 278) },
 'project-benchmark': { title: 'Make experiments comparable', note: 'PROJECT STUDY / TASKS → RUNS → EVALUATION', bg: '#ece7d9', art:
  box(227, 110, 146, 200) + label(300, 128, 'TASK SET', sage, 12) + path('M245 158h109', line) +
  [0, 1, 2].map(i => box(245, 174 + i * 36, 14, 14) + path(`M249 ${181 + i * 36}l3 3 6-7`, sage) + path(`M274 ${181 + i * 36}h68`, line)).join('') +
  path('M373 210h63', clay) + path('m429 203 7 7-7 7', clay) + box(438, 138, 142, 143) +
  path('M458 259h102M465 259v-30m28 30v-58m28 58v-78m28 78v-45', sage) +
  circle(521, 181, 3.5, clay) + label(509, 152, 'EVALUATE', sage, 12) + dots(480, 305) },
 'project-replication': { title: 'From a paper to a practice', note: 'PROJECT STUDY / READ → REPRODUCE → COMPARE', bg: '#ece7d9', art:
  box(225, 114, 138, 178) + path('M246 145h68m-68 16h95m-95 10h82m-82 29h95m-95 10h73m-73 44h43', line) +
  label(294, 268, '01 / PAPER', sage, 12) + path('M363 199h65', clay) + path('m421 192 7 7-7 7', clay) +
  box(428, 130, 155, 64) + label(505.5, 162, 'Reproduce') + box(428, 223, 155, 64, '#e6ebdb') + label(505.5, 255, 'Compare') + path('M505 194v29', line) +
  dots(620, 300) },
 'post-tools': { title: 'Small tools, lasting habits', note: 'TOOLBOX / SIMPLIFY THE DAILY WORK', bg: '#ece7d9', art:
  box(226, 120, 348, 180) + path('M226 155h348', line) + dots(248, 138) + path('m257 184 15 13-15 13m29 0h50', clay) +
  path('M257 242h225m-225 16h178', line) + box(492, 235, 55, 40, '#e6ebdb') + path('m506 255 9 8 16-18', sage) +
  `<path d="M545 138h20" stroke="${line}" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>` },
 'post-paper': { title: 'Leave room for a question', note: 'READING / OBSERVATION · QUESTION · CONNECTION', bg: '#efecdf', art:
  `<g transform="rotate(7 420 209)">${box(343, 100, 154, 218, '#e6ebdb')}</g>` +
  `<g transform="rotate(-5 372 202)">${box(293, 84, 158, 236)}${path('M314 116h89m-89 23h113m-113 11h96m-96 40h113m-113 11h78', line)}${label(366, 240, 'Why?', clay, 34)}</g>` +
  path('M478 171c44-5 49 64 5 64M483 235l7-11m-7 11 13 4', sage) + circle(253, 273, 4, clay) +
  dots(520, 300) },
 'post-llm': { title: 'Context makes a connection', note: 'LANGUAGE MODELS / REPRESENTATIONS & CONTEXT', bg: '#e6ebdb', art:
  [0, 1, 2].map(i => box(211, 122 + i * 60, 80, 40) + label(251, 142 + i * 60, ['Text', 'Code', 'Context'][i], sage, 13) + path(`M291 ${142 + i * 60} 380 210`, line)).join('') +
  halo(413, 210, 44) + circle(413, 210, 44) + label(413, 210, 'LLM', clay, 22) +
  path('M457 210h55', line) + box(513, 171, 98, 78) + label(562, 210, 'Response', sage, 13) +
  path('M413 166v-40h140v45', sage, 'stroke-dasharray="4 6"') },
 'post-code-algorithm': { title: 'Find the shape of a solution', note: 'ALGORITHMS / LOGIC · STRUCTURE · PROOF', bg: '#e6ebdb', art:
  path('M400 132 302 204m98-72 98 72M302 204l-60 82m60-82 60 82m136-82-60 82m60-82 60 82', line) +
  [[400, 132], [302, 204], [498, 204], [242, 286], [362, 286], [438, 286], [558, 286]].map(([x, y], i) => circle(x, y, i ? 15 : 23, i === 0 ? clay : '#fbf9f3')).join('') +
  path('M400 132 302 204l60 82', clay) + circle(400, 132, 5, '#fbf9f3') +
  dots(600, 330) },
 'post-astro': { title: 'A place for ideas to grow', note: 'WEB / CONTENT · DESIGN · INTERACTION', bg: '#ece7d9', art:
  box(238, 109, 324, 202) + path('M238 141h324', line) + dots(257, 125) + box(256, 158, 122, 131, '#e6ebdb') +
  path('M398 169h142m-142 15h111m-111 19h142m-142 11h127', line) + box(398, 247, 70, 30, '#f3e6d8') +
  path('M500 277v-35m0 10c-16 0-16-15-16-15 16 0 16 15 16 15Zm0 9c16 0 16-15 16-15-16 0-16 15-16 15Z', sage) +
  label(322, 230, 'content', sage, 12) + circle(486, 262, 3, clay) },
 // 2026-10-14 batch 2: four more studies so相邻卡片不再重复封面。
 'post-cli-terminal': { title: 'The command line as a workbench', note: 'TOOLBOX / SHELL · SCRIPTS · REMOTE', bg: '#ece7d9', art:
  box(226, 118, 348, 184) + path('M226 152h348', line) + dots(248, 135) +
  path('m258 188 16 13-16 13m30 0h52', clay) +
  path('M258 244h182m-182 16h140m-140 16h96', line) +
  path('M466 266h64m-64-22h40', sage, 'stroke-dasharray="3 5"') + circle(548, 244, 3, clay) },
 'post-git-graph': { title: 'A history you can draw', note: 'GIT / COMMITS · BRANCHES · MERGES', bg: '#e6ebdb', art:
  path('M268 132v146m0 0c0 34 44 30 78 30m-78-30c0-30 40-34 74-40m88 0c-34 6-74 10-74 40m74-40v-80', line) +
  circle(268, 132, 7, sage) + circle(268, 208, 7, sage) + circle(268, 278, 7, clay) + circle(346, 308, 7, sage) + circle(430, 158, 7, sage) + circle(430, 238, 7, clay) +
  path('M437 158h96m-96 80h96', line, 'stroke-dasharray="4 6"') + label(566, 152, 'main', sage, 13) + label(560, 232, 'topic', clay, 13) +
  halo(430, 238, 7) },
 'post-learning-path': { title: 'A path with switchbacks', note: 'ROADMAP / FOUNDATIONS → PRACTICE → DEPTH', bg: '#efecdf', art:
  path('M252 306h96l48-56h84l52-60h96', clay) +
  circle(252, 306, 6, sage) + circle(396, 250, 6, sage) + circle(532, 190, 6, sage) + circle(628, 130, 7, clay) +
  [0, 1, 2, 3, 4].map(i => `<path d="M${278 + i * 62} 320l10 8" stroke="${line}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`).join('') +
  halo(628, 130, 7) + label(252, 344, 'start', sage, 12) + label(628, 104, 'goal', clay, 12) +
  dots(292, 108) },
 'post-reading-notes': { title: 'Reading is a dialogue', note: 'READING / BOOKS · MARGINS · QUESTIONS', bg: '#ece7d9', art:
  path('M400 118v190M400 118c-30-14-84-14-122 0v190c38-14 92-14 122 0m0-190c30-14 84-14 122 0v190c-38-14-92-14-122 0', sage) +
  path('M296 152h76m-76 22h84m-84 22h70M428 152h76m-76 22h84m-84 22h70', line) +
  path('M548 208c22-4 26 30 4 30m-4-30 8-8m-8 8 10 6', clay) + circle(258, 250, 4, clay) +
  dots(546, 300) },
 'post-code-cpp': { title: 'Memory has a shape', note: 'C++ / TYPES · MEMORY · STL', bg: '#e6ebdb', art:
  [0, 1, 2, 3, 4].map(i => box(242 + i * 64, 172, 48, 68, i === 2 ? '#f3e6d8' : '#fbf9f3')).join('') +
  path('M266 154v-28h256v28M266 258v28h256v-28', line) + path('m370 206 12 10 20-25', clay) +
  label(266, 206, '0', sage, 13) + label(330, 206, '1', sage, 13) + label(394, 206, '2', clay, 13) + label(458, 206, '3', sage, 13) + label(522, 206, '4', sage, 13) +
  dots(566, 316) },
 'post-code-python': { title: 'Readable steps, composable ideas', note: 'PYTHON / ITERATION · COLLECTIONS · CLARITY', bg: '#ece7d9', art:
  box(226, 112, 348, 202) + path('M226 148h348', line) + dots(248, 130) +
  path('M260 180h132m-108 27h182m-158 27h126m-102 27h168', line) +
  path('M260 174v94m24-67v67m24-40v40m24-13v13', sage) + circle(500, 261, 4, clay) },
 'post-code-rust': { title: 'Correctness by construction', note: 'RUST / OWNERSHIP · BORROWING · SAFETY', bg: '#efecdf', art:
  box(246, 142, 114, 72) + box(440, 142, 114, 72, '#e6ebdb') + box(343, 258, 114, 52, '#f3e6d8') +
  label(303, 178, 'owner', sage, 14) + label(497, 178, 'borrow', sage, 14) + label(400, 284, 'valid', clay, 14) +
  path('M360 178h80m-40 36v44m-7-8 7 8 7-8', clay) + path('m431 171 9 7-9 7', sage) + halo(400, 284, 5) },
 'post-code-go': { title: 'Simple parts, concurrent paths', note: 'GO / GOROUTINES · CHANNELS · INTERFACES', bg: '#e6ebdb', art:
  [0, 1, 2].map(i => box(224, 126 + i * 68, 112, 42) + label(280, 147 + i * 68, `task ${i + 1}`, sage, 13)).join('') +
  path('M336 147h92m-92 68h92m-92 68h92', line) + box(428, 129, 146, 170, '#fbf9f3') +
  label(501, 162, 'channel', clay, 15) + path('M454 190h94m-94 22h72m-72 22h94m-94 22h58', sage) + circle(548, 256, 4, clay) }
};
let n = 0;
for (const [name, { title, note, bg, art }] of Object.entries(compositions)) {
 n += 1;
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420" fill="none"><rect width="800" height="420" fill="${bg}"/>${grain('g-' + name)}<path d="M40 56h720M40 364h720" stroke="${line}" opacity=".5"/>${ticks()}<text x="40" y="40" font-family="Georgia,serif" font-size="17" fill="${ink}">${title.replaceAll('&', '&amp;')}</text><text x="40" y="390" font-family="sans-serif" font-size="12" letter-spacing="1" fill="${sage}">${note.replaceAll('&', '&amp;')}</text>${folio(n)}${art}</svg>`;
 await writeFile(`public/covers/${name}.svg`, svg);
}
await writeFile('public/social-card.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f6f3eb"/><rect x="790" y="54" width="350" height="522" rx="16" fill="#e6ebdb"/><text x="78" y="117" font-family="sans-serif" font-size="18" letter-spacing="3" fill="#b0603c">KREIITOR / FIELD NOTES</text><text x="74" y="275" font-family="Georgia,serif" font-size="76" fill="#33362e">Stay curious.</text><text x="74" y="372" font-family="Georgia,serif" font-size="76" font-style="italic" fill="#b0603c">Let it grow.</text><text x="78" y="460" font-family="sans-serif" font-size="20" fill="#5b6154">AI for Software Engineering · Research · Learning</text><path d="M78 530h630" stroke="#d8d6c5"/><text x="78" y="567" font-family="sans-serif" font-size="15" fill="#5b6154">kreiitor.github.io/kreiitorBlog</text><g transform="rotate(-7 965 315)"><rect x="851" y="154" width="228" height="315" rx="5" fill="#fbf9f3" stroke="#a3a593"/><path d="M877 187h176M877 413h176" stroke="#d8d6c5"/><g transform="translate(915 240) scale(3.4)"><path d="M15 23V7.5" stroke="#33362e" stroke-width="1.7" stroke-linecap="round"/><path d="M15 15.2L10.3 19.4M15 15.2L19.7 11" stroke="#33362e" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19.7" cy="11" r="1.9" fill="#b0603c"/><circle cx="10.3" cy="19.4" r="1.15" fill="none" stroke="#55624b" stroke-width=".7"/></g><path d="M902 394c30 0 22-35 56-21s30-34 72-36" stroke="#b0603c" fill="none" stroke-width="2"/></g></svg>`);
console.log(`Prepared ${n} refined garden covers and the social card.`);
