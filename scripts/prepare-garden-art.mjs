import { writeFile } from 'node:fs/promises';
import { brandSymbol } from './brand-art.mjs';

// Vector studies share warm paper, ultramarine and restrained vermilion accents.
// The source drawing colors below are mapped to semantic light/dark tokens
// at export, keeping illustration geometry independent of the site palette.
// Header and drawing use separate safe areas so narrow cards retain breathing room.
const paper = "#f6f3eb";
const line = '#87917c', ink = '#33362e', sage = '#55624b', clay = '#9e5130';
const path = (d, color = sage, extra = '') => {
 const weight = extra.match(/stroke-width="([^"]+)"/)?.[1] ?? '2.4';
 return `<path d="${d}" stroke="${color}" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round" fill="none" ${extra.replace(/stroke-width="[^"]*"/, '')}/>`;
};
const circle = (x, y, r, fill = '#fbf9f3') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${line}" stroke-width="1.5"/>`;
const box = (x, y, w, h, fill = '#fbf9f3') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${line}" stroke-width="1.5"/>`;
// Label baseline: optical center of a latin glyph ≈ 0.35em above the baseline.
const label = (x, y, text, color = ink, size = 17) => `<text x="${x}" y="${y + Math.max(size, 17) * .35}" font-family="sans-serif" font-size="${Math.max(size, 17)}" fill="${color}" text-anchor="middle">${text.replaceAll('&', '&amp;')}</text>`;
const dots = (x, y) => [0, 1, 2].map(i => circle(x + i * 18, y, 2, sage)).join('');
// Construction lines stay subordinate to the subject, like pencil on a study sheet.
const guide = d => `<path d="${d}" stroke="${line}" stroke-width="1.1" stroke-dasharray="4 7" stroke-linecap="round" fill="none" opacity=".6"/>`;
const ellipse = (x, y, rx, ry, extra = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" stroke="${line}" stroke-width="1.4" fill="none" ${extra}/>`;
// Emphasis ring + short ticks around a clay focal node.
const halo = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r + 9}" fill="none" stroke="${clay}" stroke-width="1.5" opacity=".45"/><path d="M${x} ${y - r - 15}v-7M${x} ${y + r + 15}v7M${x - r - 15} ${y}h-7M${x + r + 15} ${y}h7" stroke="${clay}" stroke-width="1.5" stroke-linecap="round" opacity=".45"/>`;
const grain = id => `<defs><pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r=".55" fill="${ink}" opacity=".025"/></pattern></defs><rect width="800" height="420" fill="url(#${id})"/>`;
const compositions = {
 'post-math': { title: 'Structures & intuition', note: 'MATHEMATICS / FROM RELATIONS TO REASONING', art:
  path('M252 287h296M281 297V103', line) + [0, 1, 2, 3].map(i => `<path d="M${281 + (i + 1) * 59.2} 287v-6M281 ${287 - (i + 1) * 46.25}h6" stroke="${line}" stroke-width="1.2" opacity=".6"/>`).join('') +
  path('M289 277C320 275 335 196 370 202S411 125 484 125', clay) +
  path('M315 250 465 156 530 260Z') + path('M465 156 407 295 315 250M407 295l123-35', line) +
  circle(315, 250, 5, sage) + circle(465, 156, 5, clay) + circle(530, 260, 5, sage) +
  label(516, 108, 'f(x)', sage, 23) + label(566, 292, 'x', sage, 18) + label(266, 122, 'y', sage, 18) },
 'series-ai-agent': { title: 'A loop of decisions', note: 'AGENT / CONTEXT · REASONING · ACTION', art:
  path('M312 194h74m88 0h76M430 232v48H280v-44', line) + path('m376 187 7 7-7 7m164-14 7 7-7 7', clay) +
  box(209, 158, 103, 72) + box(386, 143, 90, 98) + box(550, 158, 103, 72) + box(238, 266, 118, 44, '#f0eee6') +
  label(260.5, 194, 'Context') + label(431, 182, 'Reason') + label(431, 206, '& decide', sage, 13) + label(601.5, 194, 'Tools') + label(297, 288, 'Memory') +
  halo(430, 279, 5) + circle(430, 279, 5, clay) + path('M263 158v-34h168v19', sage, 'stroke-dasharray="4 6"') },
 'series-ai-infra': { title: 'The layers beneath', note: 'INFRA / COMPUTE · COMMUNICATION · STORAGE', art:
  path('m240 246 133-65 133 65-133 65-133-65Z', line) + path('m240 215 133-65 133 65-133 65-133-65Z', sage) +
  path('m240 184 133-65 133 65-133 65-133-65Z', sage) + path('M373 249v62m-133-65v-62m266 62v-62', line) +
  [0, 1, 2, 3].map(i => box(325 + i % 2 * 48, 153 + Math.floor(i / 2) * 21, 35, 14, '#fbf9f3')).join('') +
  path('M506 184h67M506 215h67M506 246h67', line) + label(616, 180, 'Compute', sage, 13) + label(616, 211, 'Connect', sage, 13) + label(616, 242, 'Store', sage, 13) +
  circle(373, 184, 3.5, clay) + dots(583, 278) },
 'project-benchmark': { title: 'Make experiments comparable', note: 'PROJECT STUDY / TASKS → RUNS → EVALUATION', art:
  box(227, 110, 146, 200) + label(300, 128, 'TASK SET', sage, 12) + path('M245 158h109', line) +
  [0, 1, 2].map(i => box(245, 174 + i * 36, 14, 14) + path(`M249 ${181 + i * 36}l3 3 6-7`, sage) + path(`M274 ${181 + i * 36}h68`, line)).join('') +
  path('M373 210h63', clay) + path('m429 203 7 7-7 7', clay) + box(438, 138, 142, 143) +
  path('M458 259h102M465 259v-30m28 30v-58m28 58v-78m28 78v-45', sage) +
  circle(521, 181, 3.5, clay) + label(509, 152, 'EVALUATE', sage, 12) + dots(480, 305) },
 'project-replication': { title: 'From a paper to a practice', note: 'PROJECT STUDY / READ → REPRODUCE → COMPARE', art:
  box(225, 114, 138, 178) + path('M246 145h68m-68 16h95m-95 10h82m-82 29h95m-95 10h73m-73 44h43', line) +
  label(294, 268, '01 / PAPER', sage, 12) + path('M363 199h65', clay) + path('m421 192 7 7-7 7', clay) +
  box(428, 130, 155, 64) + label(505.5, 162, 'Reproduce') + box(428, 223, 155, 64, '#f0eee6') + label(505.5, 255, 'Compare') + path('M505 194v29', line) +
  dots(620, 300) },
 'post-tools': { title: 'Small tools, lasting habits', note: 'TOOLBOX / SIMPLIFY THE DAILY WORK', art:
  box(226, 120, 348, 180) + path('M226 155h348', line) + dots(248, 138) + path('m257 184 15 13-15 13m29 0h50', clay) +
  path('M257 242h225m-225 16h178', line) + box(492, 235, 55, 40, '#f0eee6') + path('m506 255 9 8 16-18', sage) +
  `<path d="M545 138h20" stroke="${line}" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>` },
 'post-paper': { title: 'Leave room for a question', note: 'READING / OBSERVATION · QUESTION · CONNECTION', art:
  `<g transform="rotate(7 420 209)">${box(343, 100, 154, 218, '#f0eee6')}</g>` +
  `<g transform="rotate(-5 372 202)">${box(293, 84, 158, 236)}${path('M314 116h89m-89 23h113m-113 11h96m-96 40h113m-113 11h78', line)}${label(366, 240, 'Why?', clay, 34)}</g>` +
  path('M478 171c44-5 49 64 5 64M483 235l7-11m-7 11 13 4', sage) + circle(253, 273, 4, clay) +
  dots(520, 300) },
 'post-llm': { title: 'Context makes a connection', note: 'LANGUAGE MODELS / REPRESENTATIONS & CONTEXT', art:
  [0, 1, 2].map(i => box(211, 122 + i * 60, 80, 40) + label(251, 142 + i * 60, ['Text', 'Code', 'Context'][i], sage, 13) + path(`M291 ${142 + i * 60} 380 210`, line)).join('') +
  halo(413, 210, 44) + circle(413, 210, 44) + label(413, 210, 'LLM', clay, 22) +
  path('M457 210h55', line) + box(513, 171, 98, 78) + label(562, 210, 'Response', sage, 13) +
  path('M413 166v-40h140v45', sage, 'stroke-dasharray="4 6"') },
 'post-code-algorithm': { title: 'Find the shape of a solution', note: 'ALGORITHMS / LOGIC · STRUCTURE · PROOF', art:
  path('M400 132 302 204m98-72 98 72M302 204l-60 82m60-82 60 82m136-82-60 82m60-82 60 82', line) +
  [[400, 132], [302, 204], [498, 204], [242, 286], [362, 286], [438, 286], [558, 286]].map(([x, y], i) => circle(x, y, i ? 15 : 23, i === 0 ? clay : '#fbf9f3')).join('') +
  path('M400 132 302 204l60 82', sage) + circle(400, 132, 5, '#fbf9f3') +
  dots(600, 330) },
 'post-astro': { title: 'A place for ideas to grow', note: 'WEB / CONTENT · DESIGN · INTERACTION', art:
  box(238, 109, 324, 202) + path('M238 141h324', line) + dots(257, 125) + box(256, 158, 122, 131, '#f0eee6') +
  path('M398 169h142m-142 15h111m-111 19h142m-142 11h127', line) + box(398, 247, 70, 30, '#f0eee6') +
  path('M500 277v-35m0 10c-16 0-16-15-16-15 16 0 16 15 16 15Zm0 9c16 0 16-15 16-15-16 0-16 15-16 15Z', sage) +
  label(322, 230, 'content', sage, 12) + circle(486, 262, 3, clay) },
 // 2026-10-14 batch 2: four more studies so相邻卡片不再重复封面。
 'post-cli-terminal': { title: 'The command line as a workbench', note: 'TOOLBOX / SHELL · SCRIPTS · REMOTE', art:
  box(226, 118, 348, 184) + path('M226 152h348', line) + dots(248, 135) +
  path('m258 188 16 13-16 13m30 0h52', clay) +
  path('M258 244h182m-182 16h140m-140 16h96', line) +
  path('M466 266h64m-64-22h40', sage, 'stroke-dasharray="3 5"') + circle(548, 244, 3, clay) },
 'post-git-graph': { title: 'A history you can draw', note: 'GIT / COMMITS · BRANCHES · MERGES', art:
  path('M268 126v174M268 186C268 154 430 154 430 186v52c0 40-162 22-162 62', line) +
  circle(268, 126, 7, sage) + circle(268, 186, 7, sage) + circle(268, 244, 7, sage) + circle(268, 300, 7, clay) + circle(430, 186, 7, sage) + circle(430, 238, 7, clay) +
  path('M275 126h258M437 238h96', line, 'stroke-dasharray="4 6"') + label(566, 126, 'main', sage, 17) + label(566, 238, 'topic', clay, 17) +
  halo(430, 238, 7) },
 'post-learning-path': { title: 'A path with switchbacks', note: 'ROADMAP / FOUNDATIONS → PRACTICE → DEPTH', art:
  path('M252 306h96l48-56h84l52-60h48l48-60', sage) +
  circle(252, 306, 6, sage) + circle(396, 250, 6, sage) + circle(532, 190, 6, sage) + circle(628, 130, 7, clay) +
  [0, 1, 2, 3, 4].map(i => `<path d="M${278 + i * 62} 320l10 8" stroke="${line}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`).join('') +
  halo(628, 130, 7) + label(252, 344, 'start', sage, 17) + label(680, 130, 'goal', clay, 17) +
  dots(292, 108) },
 'post-reading-notes': { title: 'Reading is a dialogue', note: 'READING / BOOKS · MARGINS · QUESTIONS', art:
  path('M400 118v190M400 118c-30-14-84-14-122 0v190c38-14 92-14 122 0m0-190c30-14 84-14 122 0v190c-38-14-92-14-122 0', sage) +
  path('M296 152h76m-76 22h84m-84 22h70M428 152h76m-76 22h84m-84 22h70', line) +
  path('M548 208c22-4 26 30 4 30m-4-30 8-8m-8 8 10 6', clay) + circle(258, 250, 4, clay) +
  dots(546, 300) },
 'post-code-cpp': { title: 'Memory has a shape', note: 'C++ / TYPES · MEMORY · STL', art:
  [0, 1, 2, 3, 4].map(i => box(242 + i * 64, 172, 48, 68, i === 2 ? '#f0eee6' : '#fbf9f3')).join('') +
  path('M266 154v-28h256v28M266 258v28h256v-28', line) + path('m382 153 8 7 15-18', clay) +
  label(266, 206, '0', sage, 13) + label(330, 206, '1', sage, 13) + label(394, 206, '2', clay, 13) + label(458, 206, '3', sage, 13) + label(522, 206, '4', sage, 13) +
  dots(566, 316) },
 'post-code-python': { title: 'Readable steps, composable ideas', note: 'PYTHON / ITERATION · COLLECTIONS · CLARITY', art:
  box(226, 112, 348, 202) + path('M226 148h348', line) + dots(248, 130) +
  path('M260 180h132m-108 27h182m-158 27h126m-102 27h168', line) +
  path('M260 174v94m24-67v67m24-40v40m24-13v13', sage) + circle(500, 261, 4, clay) },
 'post-code-rust': { title: 'Correctness by construction', note: 'RUST / OWNERSHIP · BORROWING · SAFETY', art:
  box(246, 142, 114, 72) + box(440, 142, 114, 72, '#f0eee6') + box(343, 258, 114, 52, '#f0eee6') +
  label(303, 178, 'owner', sage, 14) + label(497, 178, 'borrow', sage, 14) + label(400, 284, 'valid', clay, 14) +
  path('M360 178h80m-40 36v44m-7-8 7 8 7-8', sage) + path('m431 171 9 7-9 7', sage) },
 'post-code-go': { title: 'Simple parts, concurrent paths', note: 'GO / GOROUTINES · CHANNELS · INTERFACES', art:
  [0, 1, 2].map(i => box(224, 126 + i * 68, 112, 42) + label(280, 147 + i * 68, `task ${i + 1}`, sage, 13)).join('') +
  path('M336 147h92m-92 68h92m-92 68h92', line) + box(428, 129, 146, 170, '#fbf9f3') +
  label(501, 162, 'channel', clay, 15) + path('M454 190h94m-94 22h72m-72 22h94m-94 22h58', sage) + circle(548, 256, 4, clay) },
 // Reserve studies: each subject has its own visual metaphor and reading direction.
 'post-probability': { title: 'An interval of possibilities', art:
  guide('M238 215h370M400 123v177') +
  `<path d="M240 300c78 0 90-152 160-152s82 152 160 152Z" fill="#f0eee6"/>` +
  path('M230 300h350M250 310V128', line) + path('M240 300c78 0 90-152 160-152s82 152 160 152') +
  [280, 320, 360, 400, 440, 480, 520, 560].map(x => path(`M${x} 300v7`, line, 'stroke-width="1.2"')).join('') +
  guide('M340 267v33M460 267v33') + circle(400, 148, 4, clay) + label(400, 326, 'μ', sage, 20) },
 'post-optimization': { title: 'Follow the shape of a minimum', art:
  guide('M228 218h390M420 111v218') +
  `<g transform="rotate(-16 420 218)">${ellipse(420, 218, 154, 92)}${ellipse(420, 218, 113, 65)}${ellipse(420, 218, 71, 39)}${ellipse(420, 218, 29, 15)}</g>` +
  path('M551 148 491 192 466 178 439 216 425 208 420 218') +
  [[551, 148], [491, 192], [466, 178], [439, 216]].map(([x,y]) => circle(x,y,3.5)).join('') +
  circle(420, 218, 5, clay) + path('m548 137 10 4-2 10', sage) },
 'post-neural-network': { title: 'Learn a representation, layer by layer', art:
  [154, 214, 274].flatMap(y => [130, 186, 242, 298].map(next => guide(`M276 ${y} 400 ${next}`))).join('') +
  [130, 186, 242, 298].flatMap(y => [154, 214, 274].map(next => guide(`M400 ${y} 524 ${next}`))).join('') +
  path('M276 214 400 186 524 214', sage) +
  [154, 214, 274].map(y => circle(276, y, 13)).join('') +
  [130, 186, 242, 298].map(y => circle(400, y, 13, y === 186 ? '#f0eee6' : '#fbf9f3')).join('') +
  [154, 214, 274].map(y => circle(524, y, 13)).join('') + circle(400, 186, 4, clay) +
  label(276, 328, 'input', sage) + label(400, 328, 'hidden', sage) + label(524, 328, 'output', sage) },
 'post-retrieval': { title: 'Find the passage that matters', art:
  [0,1,2].map(i => box(225, 119 + i*67, 126, 49) + path(`M243 ${136+i*67}h72m-72 13h91`, line)).join('') +
  guide('M351 143h61v139M351 210h61M351 277h61M412 210h82') +
  `<g transform="rotate(5 555 208)">${box(503, 139, 102, 146, '#f0eee6')}${path('M520 164h66m-66 18h66m-66 18h49m-49 42h66', line)}</g>` +
  `<circle cx="542" cy="205" r="43" fill="#fbf9f3" fill-opacity=".8" stroke="${sage}" stroke-width="2.4"/>` +
  path('m573 237 37 37') + path('M520 195h44m-44 18h33', sage) + circle(566, 195, 3, clay) },
 'post-data-pipeline': { title: 'Turn records into a useful signal', art:
  box(213, 143, 105, 140) + path('M231 169h69m-69 26h69m-69 26h69m-69 26h69', line) +
  [181,207,233,259].map(y => path(`M253 ${y-12}v13m26-13v13`, line, 'stroke-width="1.2"')).join('') +
  path('M318 213h49m-8-7 8 7-8 7') +
  `<path d="m370 169 91 0-35 45v42l-21 13v-55Z" fill="#f0eee6" stroke="${sage}" stroke-width="2.4" stroke-linejoin="round"/>` +
  guide('M415 124v34M415 282v26') + path('M461 213h43m-8-7 8 7-8 7') +
  [0,1,2].map(i => box(509, 146+i*48, 109, 34) + path(`M527 ${163+i*48}h69`, line)).join('') + circle(589, 259, 4, clay) },
 'post-database': { title: 'Keep the structure, ask a question', art:
  `<path d="M270 144v144c0 29 208 29 208 0V144" fill="#fbf9f3" stroke="${sage}" stroke-width="2.4"/>` +
  ellipse(374, 144, 104, 25, `style="fill:#f0eee6;stroke:${sage};stroke-width:2.4"`) +
  path('M270 192c0 29 208 29 208 0M270 240c0 29 208 29 208 0', line) +
  guide('M289 160v123M460 160v123') + box(530, 175, 97, 77) +
  path('M478 213h52m-8-7 8 7-8 7', sage) + label(578.5, 213, 'SQL', sage, 22) + circle(374, 144, 4, clay) },
 'post-distributed-systems': { title: 'Independent parts, a shared state', art:
  guide('M281 169 400 269 519 169 281 169') +
  path('M309 169h182M298 190l80 64M422 254l80-64', line) +
  [[253,125],[372,225],[491,125]].map(([x,y]) => box(x,y,56,88) + path(`M${x+11} ${y+25}h34m-34 22h34`, sage) + circle(x+14,y+67,2.5,sage) + circle(x+28,y+67,2.5,sage)).join('') +
  path('m478 162 10 7-10 7m-85 57-5 11-12-1', sage) +
  circle(400, 292, 3.5, clay) + label(281, 326, 'replica', sage) + label(519, 326, 'replica', sage) },
 'post-evaluation': { title: 'Measure the tradeoff, not just a score', art:
  box(236, 114, 162, 194, '#f0eee6') + path('M257 147h120m-120 37h120m-120 37h120m-120 37h120M294 147v139M337 147v139', line) +
  path('m266 168 5 5 9-11m-14 43 5 5 9-11m-14 43 5 5 9-11', sage) +
  `<g transform="rotate(3 508 225)">${box(418, 146, 176, 162)}${path('M443 281h126M443 281V173', line)}${guide('M443 210h126M484 281V173M528 281V173')}${path('M452 271c8-37 24-59 51-66s42-8 61-21', sage)}${circle(503,205,4,clay)}</g>` },
 'series-mathematics': { title: 'A notebook of mathematical connections', art:
  `<g transform="rotate(5 435 210)">${box(345, 105, 162, 214, '#f0eee6')}</g>` +
  box(284, 105, 168, 214) + path('M306 105v214M322 139h110', line) +
  path('M330 276h101M338 276V169', line) + guide('M338 215h93M385 174v102') +
  path('M343 265c28 0 21-76 81-76') + circle(385, 215, 3.5, clay) +
  path('M484 147 549 183 484 220 419 183Z', sage) + guide('M484 147v73M419 183h130') +
  circle(484,147,3.5) + circle(549,183,3.5) + circle(484,220,3.5) + path('M516 274h61m-61 12h44', line) },
 'series-deep-learning': { title: 'From a signal to an abstraction', art:
  path('M235 164v106m0-106 108-24v106l-108 24Zm108-24 20 13v106l-128 24v-13', line) +
  [0,1,2,3].map(i => path(`M${251+i*23} ${161-i*5}v76`, line, 'stroke-width="1.1"') + path(`M246 ${181+i*20}l84-19`, line, 'stroke-width="1.1"')).join('') +
  path('M363 209h33m-8-7 8 7-8 7', sage) +
  [0,1,2].map(i => box(408+i*26, 143-i*10, 83, 130, i ? '#fbf9f3' : '#f0eee6')).join('') +
  path('M481 152h40m-40 22h40m-40 22h40m-40 22h27', line) +
  path('M543 198h37m-8-7 8 7-8 7', sage) + circle(607, 198, 22) + circle(607, 198, 5, clay) +
  guide('M252 311h356') },
 'series-systems': { title: 'A field guide to the machine beneath', art:
  box(246, 119, 308, 192) + path('M246 154h308', line) + dots(268, 136) +
  box(271, 176, 101, 109, '#f0eee6') + box(406, 176, 123, 39) + box(406, 242, 123, 43) +
  `<rect x="294" y="200" width="55" height="56" rx="4" stroke="${sage}" stroke-width="2.4" fill="#fbf9f3"/>` +
  [0,1,2,3].map(i => path(`M${300+i*14} 190v10m0 56v10M284 ${207+i*14}h10m55 0h10`, line, 'stroke-width="1.2"')).join('') +
  path('M372 228h18v-32h16m-16 32v35h16', sage) + path('M424 190h87m-87 11h59M424 263h67', line) + circle(510,263,3.5,clay) },
 'series-research': { title: 'Question, evidence, and the next experiment', art:
  `<g transform="rotate(-5 307 210)">${box(229, 119, 151, 194, '#f0eee6')}${path('M249 149h110m-110 19h94m-94 12h110m-110 74h73', line)}${label(303,217,'?',sage,37)}</g>` +
  path('M397 138v-19h176v194H397v-37', line) +
  box(432, 147, 109, 50) + label(486,172,'Observe',sage) +
  path('M486 197v28m-7-8 7 8 7-8', sage) + box(432,225,109,50) +
  path('M453 257h66m-55 0v-11m20 11v-18m20 18v-29', sage) +
  path('M432 250h-51m8-7-8 7 8 7', sage) + circle(397,138,4,clay) + guide('M263 331h262') }
};
const topics = {
 'post-math': 'Mathematics', 'series-ai-agent': 'AI Agents', 'series-ai-infra': 'AI Infrastructure',
 'project-benchmark': 'Benchmarks', 'project-replication': 'Paper to Practice', 'post-tools': 'Everyday Tools',
 'post-paper': 'Research Notes', 'post-llm': 'Language Models', 'post-code-algorithm': 'Algorithms',
 'post-astro': 'Building the Web', 'post-cli-terminal': 'The Command Line', 'post-git-graph': 'Git & Branches',
 'post-learning-path': 'Learning Paths', 'post-reading-notes': 'Reading Notes', 'post-code-cpp': 'C++ & Memory',
 'post-code-python': 'Python', 'post-code-rust': 'Rust & Ownership', 'post-code-go': 'Go & Concurrency',
 'post-probability': 'Probability', 'post-optimization': 'Optimization', 'post-neural-network': 'Neural Networks',
 'post-retrieval': 'Retrieval', 'post-data-pipeline': 'Data Pipelines', 'post-database': 'Databases',
 'post-distributed-systems': 'Distributed Systems', 'post-evaluation': 'Evaluation',
 'series-mathematics': 'Mathematics · A Study', 'series-deep-learning': 'Deep Learning · A Study',
 'series-systems': 'Systems · A Study', 'series-research': 'Research · A Study'
};
let n = 0;
// Embedded SVG media queries inherit the embedding element's color-scheme.
// Manual theme switches and no-JS system preferences therefore share one asset.
const coverColors = {
 '#f6f3eb': ['paper', '#e9ecf8', '#242940'],
 '#fbf9f3': ['surface', '#fffdf8', '#303854'],
 '#f0eee6': ['soft', '#f6b18f', '#514047'],
 '#87917c': ['line', '#9ca6c9', '#98a6d0'],
 '#33362e': ['ink', '#232739', '#f3f1fb'],
 '#55624b': ['sage', '#5969a4', '#c2caff'],
 '#9e5130': ['clay', '#b8432c', '#f5aa84'],
};
const themeStyle = `<style>:root{${Object.values(coverColors).map(([name, light]) => `--cover-${name}:${light}`).join(';')}}@media(prefers-color-scheme:dark){:root{${Object.values(coverColors).map(([name, , dark]) => `--cover-${name}:${dark}`).join(';')}}}</style>`;
for (const [name, { title, art }] of Object.entries(compositions)) {
 n += 1;
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420" fill="none" role="img" aria-labelledby="cover-title"><title id="cover-title">${title.replaceAll('&', '&amp;')}</title><rect width="800" height="420" fill="${paper}"/>${grain('g-' + name)}<text x="40" y="66" font-family="Georgia,serif" font-size="30" fill="${ink}">${topics[name].replaceAll('&', '&amp;')}</text><path d="M40 88h720" stroke="${line}" opacity=".45"/><g transform="translate(-16 24) scale(1.04)">${art}</g></svg>`;
 const themed = svg.replace(/#[0-9a-f]{6}/gi, color => coverColors[color] ? `var(--cover-${coverColors[color][0]})` : color).replace('</title>', `</title>${themeStyle}`);
 await writeFile(`public/covers/${name}.svg`, themed);
}
const socialCard = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f6f3eb"/><rect x="790" y="54" width="350" height="522" rx="16" fill="#f0eee6"/><text x="78" y="117" font-family="sans-serif" font-size="18" letter-spacing="3" fill="#9e5130">KREIITOR / FIELD NOTES</text><text x="74" y="275" font-family="Georgia,serif" font-size="76" fill="#33362e">Read. Build.</text><text x="74" y="372" font-family="Georgia,serif" font-size="76" font-style="italic" fill="#55624b">Then verify.</text><text x="78" y="460" font-family="sans-serif" font-size="20" fill="#5b6154">AI for Software Engineering · Research · Learning</text><path d="M78 530h630" stroke="#d8d6c5"/><text x="78" y="567" font-family="sans-serif" font-size="15" fill="#5b6154">kreiitor.github.io/kreiitorBlog</text><g transform="rotate(-7 965 315)"><rect x="851" y="154" width="228" height="315" rx="5" fill="#fbf9f3" stroke="#a3a593"/><path d="M877 187h176M877 413h176" stroke="#d8d6c5"/><g transform="translate(917 244) scale(1.5)">${brandSymbol}</g><path d="M902 394c30 0 22-35 56-21s30-34 72-36" stroke="#9e5130" fill="none" stroke-width="2"/></g></svg>`;
await writeFile('public/social-card.svg', socialCard.replace(/#[0-9a-f]{6}/gi, color => ({'#f6f3eb':'#f7f3eb','#d8d6c5':'#d8d9e6','#a3a593':'#9ca6c9','#5b6154':'#596176'}[color] ?? coverColors[color]?.[1] ?? color)));
console.log(`Prepared ${n} refined garden covers and the social card.`);
