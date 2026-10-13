import test from 'node:test';
import assert from 'node:assert/strict';
import {createMarkdownProcessor} from '@astrojs/markdown-remark';
import {fromHtml} from 'hast-util-from-html';
import {splitReadingHtml,getReadingParts} from '../src/utils/reading.mjs';
import {markdownOptions} from '../src/utils/markdown.mjs';
import {rankSearchEntries,titleMatchScore} from '../src/utils/search.mjs';

function values(tree,tag) {
 const result=[];
 function visit(node){if(node.type==='element'&&node.tagName===tag)result.push(node);for(const child of node.children??[])visit(child);}
 visit(tree);return result;
}
function text(node){return node.type==='text'?node.value:(node.children??[]).map(text).join('');}
test('Reading parts preserve text, anchors, MathML, code and table structures',()=>{
 const blocks=Array.from({length:12},(_,i)=>`<h2 id="section-${i}">小节 ${i}</h2><p>${'<span>完整论证与上下文。</span>'.repeat(30)}</p><div><math><mi>x</mi><mo>=</mo><mn>${i}</mn></math></div><pre><code>const section = ${i};\n// Keep this line.</code></pre><table><tbody><tr><td>${i}</td><td>结果</td></tr></tbody></table>`).join('');
 const parts=splitReadingHtml(blocks,150,1000);
 assert.ok(parts.length>1);
 const original=fromHtml(blocks,{fragment:true}),joined=fromHtml(parts.map(p=>p.html).join(''),{fragment:true});
 assert.equal(text(joined),text(original));
 for(const tag of ['h2','math','pre','table']) {
  assert.equal(values(joined,tag).length,values(original,tag).length);
  assert.deepEqual(values(joined,tag).map(text),values(original,tag).map(text));
 }
 assert.deepEqual(values(joined,'h2').map(n=>n.properties.id),values(original,'h2').map(n=>n.properties.id));
 assert.ok(parts.every(p=>p.elements>0));
});
test('A large code block stays whole and does not create an empty part',()=>{
 const html=`<h2 id="code">代码</h2><pre><code>${'<span>long line</span>'.repeat(500)}</code></pre><h2 id="next">下一节</h2><p>继续阅读</p>`;
 const parts=splitReadingHtml(html,100);
 assert.equal(parts.flatMap(p=>values(fromHtml(p.html,{fragment:true}),'pre')).length,1);
 assert.ok(parts.every(p=>p.html.trim()));
});
test('Display equation numbers render, and heading-looking code remains code',async()=>{
 const renderer=await createMarkdownProcessor(markdownOptions('/journal/'));
 const source='## 公式\n\n$$\nW_i + K_i \\le C_i. \\tag{6-1}\n$$\n\n```python\n# This is not a document heading\nprint("$value$")\n```\n\n[继续阅读](/blog/lesson/)';
 const {code}=await renderer.render(source);
 assert.ok(code.includes('katex-display'));
 assert.ok(!code.includes('katex-error'));
 assert.ok(code.includes('/journal/blog/lesson/'));
 assert.equal(values(fromHtml(code,{fragment:true}),'h1').length,0);
 assert.ok(text(values(fromHtml(code,{fragment:true}),'pre')[0]).includes('# This is not a document heading'));
});
test('Duplicate heading slugs remain distinct across static reading parts',async()=>{
 const post={id:'test-long-lesson',data:{title:'测试',description:'测试'},body:Array.from({length:8},()=>`## 重复标题\n\n${'真实上下文。'.repeat(700)}\n`).join('\n')};
 const {parts,allHeadings}=await getReadingParts(post,'/journal/');
 assert.ok(parts.length>1);
 assert.equal(new Set(allHeadings.map(h=>h.slug)).size,8);
 assert.ok(allHeadings.every(h=>h.part>=1&&h.part<=parts.length));
});
test('Exact Chinese title matches outrank broad full-text hits without losing C++ symbols',()=>{
 const rows=[{title:'表示学习：降维与分布匹配'},{title:'模型架构：Transformer 的计算与存储账'},{title:'线性模型：从最小二乘到 Lasso'}];
 assert.equal(rankSearchEntries(rows,'线性模型')[0].title,rows[2].title);
 assert.ok(titleMatchScore('C++ 工程实践','C++')>0);
 assert.equal(titleMatchScore('从代码出发','C++'),0);
 assert.equal(titleMatchScore('AI Infra：系统设计','ai infra'),3);
});
test('Editing an article invalidates its cached reading parts',async()=>{
 const post={id:'editable-note',data:{title:'编辑',description:'编辑'},body:'## 小节\n\n最初的内容'};
 await getReadingParts(post);
 post.body='## 小节\n\n更新后的内容';
 const {parts}=await getReadingParts(post);
 assert.ok(parts[0].html.includes('更新后的内容'));
 assert.ok(!parts[0].html.includes('最初的内容'));
});
