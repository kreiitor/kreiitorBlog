import test from 'node:test';
import assert from 'node:assert/strict';
import {createMarkdownProcessor} from '@astrojs/markdown-remark';
import {fromHtml} from 'hast-util-from-html';
import {markdownOptions} from '../src/utils/markdown.mjs';
import {rankSearchEntries,titleMatchScore} from '../src/utils/search.mjs';
import {estimateReadingTime} from '../src/utils/reading-stats.mjs';

function values(tree,tag) {
 const result=[];
 function visit(node){if(node.type==='element'&&node.tagName===tag)result.push(node);for(const child of node.children??[])visit(child);}
 visit(tree);return result;
}
function text(node){return node.type==='text'?node.value:(node.children??[]).map(text).join('');}
test('Display equation numbers render, and heading-looking code remains code',async()=>{
 const renderer=await createMarkdownProcessor(markdownOptions('/journal/'));
 const source='## 公式\n\n$$\nW_i + K_i \\le C_i. \\tag{6-1}\n$$\n\n<figure><img src="/figures/sample.svg" width="800" height="260" alt="示例"><figcaption>图注</figcaption></figure>\n\n```python\n# This is not a document heading\nprint("$value$")\n```\n\n[继续阅读](/blog/lesson/)';
 const {code}=await renderer.render(source);
 assert.ok(code.includes('katex-display'));
 assert.ok(!code.includes('katex-error'));
 assert.ok(code.includes('/journal/blog/lesson/'));
 assert.ok(code.includes('/journal/figures/sample.svg'));
 assert.equal(values(fromHtml(code,{fragment:true}),'h1').length,0);
 assert.ok(text(values(fromHtml(code,{fragment:true}),'pre')[0]).includes('# This is not a document heading'));
});
test('Duplicate headings keep distinct anchors when the whole article renders as one page',async()=>{
 const renderer=await createMarkdownProcessor(markdownOptions('/'));
 const source=Array.from({length:8},(_,index)=>`## 重复标题\n\n第 ${index} 段真实上下文。`).join('\n\n');
 const {code,metadata}=await renderer.render(source);
 const slugs=metadata.headings.map(heading=>heading.slug);
 assert.equal(slugs.length,8);
 assert.equal(new Set(slugs).size,8);
 const ids=values(fromHtml(code,{fragment:true}),'h2').map(node=>node.properties.id);
 assert.deepEqual(ids,slugs);
});
test('Exact Chinese title matches outrank broad full-text hits without losing C++ symbols',()=>{
 const rows=[{title:'表示学习：降维与分布匹配',tags:['表示学习']},{title:'模型架构：Transformer 的计算与存储账',tags:['Transformer','AI Infra']},{title:'线性模型：从最小二乘到 Lasso',tags:['FODS']}];
 assert.equal(rankSearchEntries(rows,'线性模型')[0].title,rows[2].title);
 assert.equal(rankSearchEntries(rows,'Transformer 计算')[0].title,rows[1].title);
 assert.equal(rankSearchEntries(rows,'AI Infra')[0].title,rows[1].title);
 assert.ok(titleMatchScore('C++ 工程实践','C++')>0);
 assert.equal(titleMatchScore('从代码出发','C++'),0);
 assert.equal(titleMatchScore('AI Infra：系统设计','ai infra'),3);
});

test('Search rejects normalized false positives and retains summary and body-only matches',()=>{
 const rows=[
  {title:'优化误差',description:'梯度下降',content:'对任意 ZZZ，有如下结论'},
  {title:'矩阵分析',description:'分解方法',content:'Courant Fischer theorem'},
  {title:'阅读记录',description:'论文阅读与复盘'},
 ];
 assert.deepEqual(rankSearchEntries(rows,'zzzzzzzz'),[]);
 assert.deepEqual(rankSearchEntries(rows,'Fischer'),[rows[1]]);
 assert.deepEqual(rankSearchEntries(rows,'论文阅读'),[rows[2]]);
 assert.deepEqual(rankSearchEntries(rows,'Courant Fischer'),[rows[1]]);
 assert.deepEqual(rankSearchEntries(rows,' '),[]);
});

test('estimateReadingTime excludes raw LaTeX command noise and weights code and equations sensibly',()=>{
 const mathHeavy='证明。\n\n$$\n\\mathbb{E}_{X\\sim P}\\bigl[\\widehat{\\theta}_L - \\theta^*\\bigr] = \\mathcal{O}(\\sqrt{s\\log d / n})\n$$\n'.repeat(30);
 const bareProse='证明。\n'.repeat(30);
 assert.equal(estimateReadingTime('短句'),1);
 assert.equal(estimateReadingTime(mathHeavy),2);
 assert.ok(estimateReadingTime(mathHeavy)>estimateReadingTime(bareProse));
 const codeHeavy='说明。\n\n```cpp\n'+Array.from({length:60},(_,i)=>`int x_${i} = ${i};`).join('\n')+'\n```';
 assert.equal(estimateReadingTime(codeHeavy),2);
});
