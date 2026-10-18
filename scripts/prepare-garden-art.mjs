import { readFile, rename, writeFile } from 'node:fs/promises';
import { brandSymbol } from './brand-art.mjs';

// Geometric field notes: large cut-paper silhouettes carry the subject at card size.
// Keep the same semantic palette in both themes; PNG exports bake the light tokens.
const palette = {
 paper: ['#eef2f8', '#222e47'], surface: ['#f9faf7', '#30405e'],
 blue: ['#2647d7', '#8ba3ff'], yellow: ['#ffe04b', '#f0cd42'],
 soft: ['#d8e1f2', '#364969'], ink: ['#202735', '#eef3ff'],
 onBlue: ['#f9faf7', '#222e47'], onYellow: ['#202735', '#222e47'],
};
const c = name => `var(--cover-${name})`;
const rect = (x,y,w,h,fill='blue',r=0,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c(fill)}" ${extra}/>`;
const disk = (x,y,r,fill='yellow',extra='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c(fill)}" ${extra}/>`;
const shape = (d,fill='blue',extra='') => `<path d="${d}" fill="${c(fill)}" ${extra}/>`;
const stroke = (d,color='blue',width=4,extra='') => `<path d="${d}" fill="none" stroke="${c(color)}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const ring = (x,y,r,color='blue',width=4,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c(color)}" stroke-width="${width}" ${extra}/>`;
const text = (x,y,value,size=32,color='ink',extra='') => `<text x="${x}" y="${y}" font-family="Georgia,serif" font-size="${size}" fill="${c(color)}" ${extra}>${value}</text>`;
const group = (transform,art) => `<g transform="${transform}">${art}</g>`;
const repeat = (n,draw) => Array.from({length:n},(_,i)=>draw(i)).join('');
const star = (x,y,r=24,color='yellow') => group(`translate(${x} ${y})`,shape(`M0 ${-r} 7 -7 ${r} 0 7 7 0 ${r} -7 7 ${-r} 0 -7 -7Z`,color));
const sheet = (x,y,w,h,color='surface') => rect(x,y,w,h,color,3) + shape(`M${x+w-42} ${y}h42v42Z`,'soft');
const bars = (x,y,width=100,color='blue') => repeat(3,i=>rect(x,y+i*23,width-[0,16,36][i],6,color,3));
const contour = (x,y) => repeat(5,i=>`<ellipse cx="${x}" cy="${y}" rx="${46+i*35}" ry="${24+i*20}" fill="none" stroke="${c('blue')}" stroke-width="${i===4?3:1.5}"/>`);

const art = {
 'post-math': disk(480,187,137,'yellow') + shape('M196 310 353 72 510 310Z') + ring(353,218,91,'surface',2) + stroke('M196 310H606M353 72V330','ink',1.5) + disk(353,218,9,'surface') + stroke('M353 218 548 122','ink',2) + disk(548,122,7,'ink'),
 'series-ai-agent': ring(398,203,116,'soft',64) + stroke('M289 242A116 116 0 1 1 493 270','blue',64) + shape('m457 258 92-29-22 93Z','blue') + disk(304,255,35) + disk(398,203,30,'ink') + star(587,104,28) + stroke('M379 203h38m-13-13 13 13-13 13','surface',4),
 'series-ai-infra': shape('m189 246 211-94 211 94-211 95Z','blue') + shape('m189 198 211-94 211 94-211 95Z','soft') + shape('m189 150 211-94 211 94-211 95Z','blue') + shape('m316 150 84-38 84 38-84 38Z','yellow') + stroke('M189 150v96m211-1v96m211-191v96','ink',2) + repeat(3,i=>disk(400+i*22,281-i*10,3,'surface')),
 'project-benchmark': disk(510,146,100,'yellow') + rect(192,226,91,106,'blue') + rect(307,162,91,170,'blue') + rect(422,94,91,238,'blue') + stroke('M163 332H622M551 96h44v236h-44','ink',2) + stroke('m565 132 12 12 25-31','ink',5) + repeat(4,i=>stroke(`M583 ${185+i*34}h12`,'ink',2)) + disk(467,94,8,'surface'),
 'project-replication': disk(550,211,119,'yellow') + group('rotate(-12 353 207)',rect(221,67,244,282,'blue',3) + bars(250,101,152,'onBlue') + stroke('M250 254h149M250 276h98','onBlue',5)) + group('rotate(9 444 209)',sheet(330,78,206,270) + bars(358,112,115) + stroke('M365 278v-55l34 21 33-65 61 24','blue',9) + disk(432,179,9,'yellow')) + stroke('M198 308v27h49','ink',2),
 'post-tools': disk(517,218,119) + group('rotate(38 364 210)',shape('M331 60h66v67l33 32v67l-34 31v85h-65v-85l-34-31v-67l34-32Z') + rect(338,52,52,93,'paper',7) + disk(364,299,10,'paper')) + group('rotate(-36 522 210)',rect(506,81,32,229,'ink',8) + rect(493,200,58,129,'blue',18) + stroke('M522 227v69','surface',4)),
 'post-paper': disk(292,228,125,'yellow') + group('rotate(-9 425 207)',rect(310,64,239,283,'blue',3)) + group('rotate(7 460 205)',sheet(349,71,225,282) + bars(377,108,137) + text(408,273,'?',136,'blue') + rect(378,302,90,7,'yellow',3)) + star(602,104,25,'blue'),
 'post-llm': group('rotate(-7 328 174)',rect(152,77,337,195,'blue',38) + shape('M190 241v64l72-45Z','blue') + text(191,205,'LLM',83,'onBlue')) + group('rotate(7 527 248)',rect(369,167,287,158,'yellow',35) + shape('M606 298v57l-65-44Z','yellow') + stroke('M414 216h180m-180 31h132m-132 31h156','onYellow',9)) + star(597,97,30,'blue'),
 'post-code-algorithm': stroke('M399 92v62M257 218v-52h284v52M257 218v58h-70m70-58v58h70m214-58v58h-70m70-58v58h70','soft',17) + disk(399,90,39,'blue') + disk(257,216,42,'blue') + disk(541,216,42) + [187,327,471,611].map((x,i)=>disk(x,303,23,i===2?'yellow':'blue')).join('') + stroke('M399 90v76h142v137','ink',5) + disk(471,303,8,'ink'),
 'post-astro': disk(531,143,94) + group('rotate(-5 397 220)',rect(164,106,459,233,'blue',12) + rect(184,125,419,28,'onBlue',4) + rect(184,171,157,146,'yellow',3) + rect(363,181,204,16,'onBlue',3) + bars(363,225,187,'onBlue') + rect(363,298,75,9,'onBlue',4)) + stroke('m615 282 29 22-17 3-4 20Z','ink',3),
 'post-cli-terminal': group('rotate(-5 400 212)',rect(165,81,470,264,'blue',15) + stroke('m225 155 59 51-59 51','onBlue',17) + rect(329,244,118,16,'yellow',3) + repeat(3,i=>disk(197+i*19,108,4,'onBlue'))) + disk(628,103,33) + stroke('M628 88v30m-15-15h30','ink',4),
 'post-git-graph': stroke('M286 79v254M286 145c0-41 223-69 223 0v89c0 75-223 29-223 99','blue',22) + [91,165,245,325].map((y,i)=>disk(286,y,19,i===3?'yellow':'blue')).join('') + disk(509,145,26,'yellow') + disk(509,234,26,'yellow') + [91,165,245,325].map(y=>disk(286,y,6,'paper')).join('') + stroke('M509 145v89','ink',3) + ring(286,325,34,'ink',2),
 'post-learning-path': shape('M172 331v-62h99v-63h100v-63h101V80h140v251Z','blue') + shape('M172 331h440V80L172 331Z','soft') + stroke('M205 285h66v-65h100v-63h101v-63h90','ink',4) + disk(563,94,39) + star(563,94,21,'ink') + disk(205,285,8,'ink'),
 'post-reading-notes': disk(514,183,121,'yellow') + shape('M400 120C331 74 235 81 175 116v207c68-36 157-35 225 8Z','blue') + shape('M400 120c69-46 165-39 225-4v207c-68-36-157-35-225 8Z','surface') + stroke('M400 120v211','ink',3) + stroke('M211 155c45-15 88-14 137 2m-137 31c45-15 88-14 137 2m-137 31c45-15 77-14 107-5','onBlue',5) + stroke('M443 157c49-17 92-18 145-2m-145 33c49-17 92-18 145-2m-145 33c49-17 80-18 111-11','blue',5) + shape('M531 100h27v165l-14-15-13 15Z','yellow'),
 'post-code-cpp': disk(318,207,133,'blue') + text(225,255,'C',155,'onBlue') + group('translate(434 150)',rect(0,37,103,25,'yellow',3) + rect(39,0,25,103,'yellow',3)) + group('translate(559 212)',rect(0,27,74,20,'blue',3) + rect(27,0,20,74,'blue',3)) + repeat(4,i=>rect(221+i*62,309,47,22,i===2?'yellow':'soft',2)),
 'post-code-python': group('rotate(-6 382 199)',shape('M214 98h194a46 46 0 0 1 46 46v62H302v100H198v-96h-39v-57h55Z','blue') + shape('M586 310H392a46 46 0 0 1-46-46v-62h152V102h104v96h39v57h-55Z','yellow') + disk(261,127,9,'onBlue') + disk(542,279,9,'onYellow')),
 'post-code-rust': disk(396,207,129,'yellow') + shape('M396 56 526 109v100c0 69-67 114-130 143-63-29-130-74-130-143V109Z','blue') + stroke('M396 92 493 131v78c0 49-47 86-97 112','onBlue',2) + stroke('m339 205 42 42 78-90','onBlue',20) + ring(579,106,28,'ink',3),
 'post-code-go': stroke('M174 113h212c76 0 70 192 148 192h82M174 209h442M174 305h212c76 0 70-192 148-192h82','blue',31) + disk(230,113,27) + disk(340,209,27) + disk(560,305,27) + stroke('m594 81 34 32-34 32m0 32 34 32-34 32m0 32 34 32-34 32','ink',5),
 'post-probability': '<defs><clipPath id="probability-interval"><rect x="310" width="180" height="420"/></clipPath></defs>' + disk(531,139,77,'yellow') + shape('M142 321c127 0 124-232 258-232s131 232 258 232Z','soft') + shape('M142 321c127 0 124-232 258-232s131 232 258 232Z','blue','clip-path="url(#probability-interval)"') + stroke('M142 321c127 0 124-232 258-232s131 232 258 232','blue',5) + stroke('M142 321h516M400 71v268','ink',2) + text(415,167,'μ',48,'onBlue'),
 'post-optimization': group('rotate(-18 400 211)',contour(400,211)) + stroke('M598 106 476 292 438 160 410 247 401 211','ink',7) + disk(598,106,12,'blue') + disk(476,292,10,'blue') + disk(438,160,8,'blue') + disk(401,211,27) + disk(401,211,7,'ink'),
 'post-neural-network': repeat(4,i=>stroke(`M${218+i*91} 83v242`,'soft',32)) + stroke('M217 274 309 130 400 243 491 163 582 214','blue',17) + [[217,274],[309,130],[400,243],[491,163],[582,214]].map(([x,y],i)=>disk(x,y,i===2?39:25,i===2?'yellow':'blue')).join('') + ring(400,243,68,'ink',2) + disk(400,243,8,'ink'),
 'post-retrieval': group('rotate(-7 330 205)',rect(191,88,265,239,'blue',4) + bars(220,122,175,'onBlue') + bars(220,218,151,'onBlue')) + disk(492,186,92,'yellow') + ring(492,186,77,'ink',9) + stroke('m549 246 84 85','ink',27) + stroke('M453 169h78m-78 30h56','onYellow',8),
 'post-data-pipeline': repeat(4,i=>rect(165+i*47,90,33,80+i%2*22,i===1?'yellow':'blue',3)) + shape('M365 75h264L518 221v90l-50 29V221Z','blue') + stroke('M394 105h177l-80 104','onBlue',3) + repeat(3,i=>disk(220+i*52,263,16,i===1?'yellow':'blue')) + stroke('M273 211v-10h92','ink',3) + disk(492,329,14,'yellow'),
 'post-database': rect(250,111,300,193,'blue') + `<ellipse cx="400" cy="111" rx="150" ry="48" fill="${c('yellow')}"/>` + shape('M250 304c0 64 300 64 300 0Z','blue') + repeat(2,i=>stroke(`M250 ${174+i*65}c0 64 300 64 300 0`,'onBlue',3)) + disk(400,111,12,'ink') + repeat(3,i=>disk(493,175+i*65,6,'yellow')),
 'post-distributed-systems': stroke('M260 133 546 133 402 300Z','ink',5) + [[260,133],[546,133],[402,300]].map(([x,y],i)=>rect(x-49,y-49,98,98,i===2?'yellow':'blue',15) + rect(x-24,y-24,48,48,i===2?'ink':'onBlue',4)).join('') + disk(402,133,14,'yellow') + disk(474,217,14,'blue') + disk(330,217,14,'blue'),
 'post-evaluation': disk(400,198,137,'yellow') + stroke('M400 87v235M282 322h236M229 141h342','ink',7) + stroke('M229 141 160 260h138ZM571 141 502 260h138Z','blue',4) + shape('M159 260h140a70 53 0 0 1-140 0M501 260h140a70 53 0 0 1-140 0','blue') + disk(400,141,23,'blue') + stroke('m388 140 9 10 16-19','onBlue',4),
 'series-mathematics': disk(327,198,127,'blue') + shape('M418 73 610 328H226Z','yellow') + ring(327,198,127,'ink',2) + stroke('M183 328h445M418 73v255','ink',2) + stroke('M327 198 418 73','surface',3) + disk(418,73,7,'ink') + disk(327,198,8,'surface'),
 'series-deep-learning': repeat(4,i=>group(`translate(${198+i*85} ${106-i*12})`,shape('M0 25 99 0v221l-99 25Z',i===3?'yellow':i%2?'soft':'blue') + stroke('m18 43 62-16m-62 43 62-16m-62 43 62-16m-62 43 62-16m-62 43 62-16',i===3?'ink':i%2?'blue':'onBlue',2))) + disk(627,198,29,'blue') + stroke('M589 198h38','ink',3),
 'series-systems': rect(247,67,305,275,'blue',12) + rect(316,120,168,168,'yellow',3) + rect(352,156,96,96,'ink',2) + repeat(5,i=>stroke(`M${330+i*35} 90v30m0 168v30M276 ${135+i*35}h40m168 0h40`,'onBlue',8)) + stroke('M372 179v49h39m-18-49v28h19','yellow',5),
 'series-research': disk(284,207,116,'yellow') + group('rotate(-8 392 200)',rect(275,64,221,282,'blue',3) + text(334,264,'?',165,'onBlue')) + ring(513,209,75,'ink',8) + stroke('m566 265 59 65','ink',24) + stroke('M481 213 502 234 540 189','yellow',10),
};
const catalog = JSON.parse(await readFile('src/data/cover-catalog.json','utf8'));
const themeStyle = `<style>:root{${Object.entries(palette).map(([name,[light]])=>`--cover-${name}:${light}`).join(';')}}@media(prefers-color-scheme:dark){:root{${Object.entries(palette).map(([name,[,dark]])=>`--cover-${name}:${dark}`).join(';')}}}</style>`;
if (Object.keys(art).length !== catalog.length) throw new Error('Cover drawings and catalog must agree.');
for (const {id,label} of catalog) {
 if (!art[id]) throw new Error(`Missing composition: ${id}`);
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420" role="img" aria-labelledby="cover-title"><title id="cover-title">${label}</title>${themeStyle}${rect(0,0,800,420,'paper')}${art[id]}</svg>`;
 const target = `public/covers/${id}.svg`;
 await writeFile(`${target}.tmp`,svg);
 await rename(`${target}.tmp`,target);
}
const socialCard = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f9faf7"/><path d="M790 0h410v630H790Z" fill="#2647d7"/><circle cx="1020" cy="319" r="173" fill="#ffe04b"/><text x="78" y="116" font-family="sans-serif" font-size="20" fill="#2647d7">Kreiitor / 研究与实践</text><text x="74" y="275" font-family="Georgia,serif" font-size="76" fill="#202735">Read. Build.</text><text x="74" y="372" font-family="Georgia,serif" font-size="76" fill="#2647d7">Then verify.</text><text x="78" y="460" font-family="sans-serif" font-size="20" fill="#596176">AI for Software Engineering · Research · Learning</text><path d="M78 530h630" stroke="#d8d9e6"/><text x="78" y="567" font-family="sans-serif" font-size="15" fill="#596176">kreiitor.github.io/kreiitorBlog</text><g transform="translate(896 195) scale(3.9)">${brandSymbol}</g></svg>`;
await writeFile('public/social-card.svg',socialCard);
console.log(`Prepared ${catalog.length} geometric field-note covers and the social card.`);
