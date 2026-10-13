// One-off importer: converts the two book-note folders into site posts + series entries.
// Usage: node scripts/import-notes.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = {
	agent: {
		dir: 'E:/Code/dsh_code/学习笔记/深入理解AI-Agent-设计原理与工程实践',
		series: 'ai-agent',
		slug: 'ai-agent',
		cover: '/covers/post-llm.svg',
		pub: '2026-10-05',
		tags: ['AI Agent', '学习笔记', 'LLM', '读书笔记'],
		chapters: [
			['00-导读.md', 'guide', '《深入理解AI Agent》全书导读：这本书解决什么问题、怎么组织、按什么顺序读', 'AI Agent = LLM + 上下文 + 工具：全书结构地图、作者实践背景与三条阅读路径。', 0],
			['01-引言.md', 'intro', '引言：为什么写这本书、核心公式与全书结构', '成书背景、whisper coding 写作方式、Agent = LLM + 上下文 + 工具的强化学习解读与前置知识清单。', 1],
			['02-第1章 AI Agent 入门.md', 'ch01', '第 1 章 AI Agent 入门：环境、上下文与五类工具', '从 ReAct 循环出发，讲清 Agent 与环境的关系、上下文的五个组成部分、五类工具与 harness 工程。', 2],
			['03-第2章 上下文工程.md', 'ch02', '第 2 章 上下文工程：静态前缀、轨迹与缓存', 'Chat Completions 消息结构、Token 序列、KV Cache 与 Prompt Cache：上下文如何组织才既便宜又快。', 3],
			['04-第3章 用户记忆和知识库.md', 'ch03', '第 3 章 用户记忆和知识库：让 Agent 记住用户', '记忆的分层设计、用户画像与知识库检索：Agent 如何在跨会话场景中保持一致性与个性化。', 4],
			['05-第4章 工具.md', 'ch04', '第 4 章 工具：设计、组织与安全执行', '工具定义的 schema 设计、工具列表膨胀的治理、命令行执行工具与危险操作的护栏。', 5],
			['06-第5章 Coding Agent 与通用 Agent.md', 'ch05', '第 5 章 Coding Agent 与通用 Agent：代码生成 + 文件系统', '为什么「代码生成 + 文件系统」成为通用 Agent 的重要架构范式，以及 Coding Agent 的工程要点。', 6],
			['07-第6章 交互-观察与动作空间的扩展.md', 'ch06', '第 6 章 交互：观察与动作空间的扩展', '从文本到图形界面、从单轮到长流程：Agent 感知世界与作用于世界的方式如何扩展。', 7],
			['08-第7章 Agent 的评估.md', 'ch07', '第 7 章 Agent 的评估：从经验判断到可复现度量', '没有评估就无法判断改动是否有效：评估指标、基准设计、轨迹分析与科学迭代方法。', 8],
			['09-第8章 模型后训练.md', 'ch08', '第 8 章 模型后训练：把工具使用内化进参数', 'SFT、RLHF 与智能体强化学习：如何让模型原生具备工具调用与环境交互能力。', 9],
			['10-第9章 Agent 的持续进化.md', 'ch09', '第 9 章 Agent 的持续进化：经验积累与自我改进', '技能库、经验回放与在线学习：Agent 如何在部署后持续变强。', 10],
			['11-第10章 多 Agent 协作.md', 'ch10', '第 10 章 多 Agent 协作：分工、通信与冲突消解', '多 Agent 系统的组织模式、通信协议、任务分解与协作中的常见陷阱。', 11],
			['12-后记-回到 Agent = LLM + 上下文 + 工具.md', 'epilogue', '后记：回到 Agent = LLM + 上下文 + 工具', '全书收束：用这个公式重新审视十章内容，以及 Agent 工程的变与不变。', 12],
		],
	},
	infra: {
		dir: 'E:/Code/dsh_code/学习笔记/深入理解AI-Infra-量化分析与系统设计',
		series: 'ai-infra',
		slug: 'ai-infra',
		cover: '/covers/post-llm.svg',
		pub: '2026-10-10',
		tags: ['AI Infra', '学习笔记', '系统设计', '读书笔记'],
		chapters: [
			['00-导读.md', 'guide', '《深入理解AI Infra》全书导读：量化分析与跨层理解', '先数量级估算、再从约束推导设计：全书方法论、数据搬移主线、结构地图与阅读路径。', 0],
			['01-前言.md', 'preface', '前言：为什么 AI Infra 需要量化分析', '写作动机与作者实践线索：从模型需求到基础设施约束的推导方式。', 1],
			['02-第1章 初识 AI Infra.md', 'ch01', '第 1 章 初识 AI Infra：支撑大模型的那套系统', 'AI Infra 的全景图：训练与推理负载长什么样、系统栈分几层、瓶颈在哪里。', 2],
			['03-第2章 模型架构.md', 'ch02', '第 2 章 模型架构：Transformer 的计算与存储账', '从注意力到 MoE：把主流模型架构翻译成 FLOPs、参数量与显存占用。', 3],
			['04-第3章 推理与训练负载.md', 'ch03', '第 3 章 推理与训练负载：prefill、decode 与反向传播', '推理两阶段与训练三阶段的负载特征：算术强度决定系统该怎么建。', 4],
			['05-第4章 加速器架构.md', 'ch04', '第 4 章 加速器架构：GPU、HBM 与互联', '算力、显存带宽与片间互联的三角约束：加速器硬件如何决定系统上限。', 5],
			['06-第5章 算子与运行时.md', 'ch05', '第 5 章 算子与运行时：Kernel、编译与执行引擎', '算子融合、显存管理与运行时调度：从深度学习框架到硬件之间的那一层。', 6],
			['07-第6章 超节点.md', 'ch06', '第 6 章 超节点：机内互联与 Scale-up', 'NVLink 与超节点：单机多卡如何逼近「一台大机器」的理想。', 7],
			['08-第7章 数据中心网络.md', 'ch07', '第 7 章 数据中心网络：Scale-out 的带宽账', 'RDMA、拥塞控制与网络拓扑：万卡集群的通信底座。', 8],
			['09-第8章 推理优化.md', 'ch08', '第 8 章 推理优化：KV Cache、批处理与量化', 'continuous batching、PagedAttention、投机采样与量化：推理成本怎么降。', 9],
			['10-第9章 分布式推理.md', 'ch09', '第 9 章 分布式推理：切分策略与 PD 分离', '张量并行、流水并行与 prefill/decode 分离：大模型推理如何分布到多卡多机。', 10],
			['11-第10章 训练系统.md', 'ch10', '第 10 章 训练系统：并行策略与容错', '数据/张量/流水/序列并行的组合、显存重计算与大规模训练的容错设计。', 11],
			['12-第11章 资源调度与运行环境.md', 'ch11', '第 11 章 资源调度与运行环境：GPU 集群的利用率', '调度器、隔离与混部：昂贵的 GPU 资源如何被高效利用。', 12],
			['13-第12章 端边云协同.md', 'ch12', '第 12 章 端边云协同：推理的最后一公里', '端侧模型的约束、端边云分工与隐私成本权衡。', 13],
		],
	},
};

const outPosts = path.resolve('src/content/posts');
const outSeries = path.resolve('src/content/series');

const seriesMeta = {
	agent: `---
title: AI Agent 设计原理与工程实践
englishTitle: Understanding AI Agents
description: 以「Agent = LLM + 上下文 + 工具」为骨架，逐章精读李博杰的《深入理解AI Agent》：从上下文工程、工具与记忆，到评估、后训练与多 Agent 协作。
emblem: A
order: 1
facts: 对应原书 313 页 · 12 篇笔记
sourceNote: 个人学习笔记，基于李博杰《深入理解AI Agent：设计原理与工程实践》（v2.0 · 2026-09）整理，保留原书印刷页码引用，仅作学习交流。
---
`,
	infra: `---
title: AI Infra 量化分析与系统设计
englishTitle: Understanding AI Infrastructure
description: 「先数量级估算、再从约束推导设计」：逐章精读李博杰的《深入理解AI Infra》，从模型架构到加速器、网络、推理优化与训练系统。
emblem: I
order: 2
facts: 对应原书 536 页 · 13 篇笔记
sourceNote: 个人学习笔记，基于李博杰《深入理解AI Infra：量化分析与系统设计》（v1.0 · 2026-10）整理，保留原书印刷页码引用，仅作学习交流。
---
`,
};

function escYaml(s) { return s.replace(/"/g, '\\"'); }

for (const key of Object.keys(SRC)) {
	const cfg = SRC[key];
	await writeFile(path.join(outSeries, `${cfg.series}.md`), seriesMeta[key], 'utf8');
	for (const [file, slugPart, title, desc, order] of cfg.chapters) {
		const body = await readFile(path.join(cfg.dir, file), 'utf8');
		const frontmatter = [
			'---',
			`title: "${escYaml(title)}"`,
			`description: "${escYaml(desc)}"`,
			`pubDate: ${cfg.pub}`,
			'tags:',
			...cfg.tags.map(t => `  - "${t}"`),
			'category: course',
			`series: ${cfg.series}`,
			`order: ${order}`,
			`cover: ${cfg.cover}`,
			'---',
			'',
			'',
		].join('\n');
		await writeFile(path.join(outPosts, `${cfg.slug}-${slugPart}.md`), frontmatter + body, 'utf8');
		console.log(`wrote ${cfg.slug}-${slugPart}.md (${body.length} chars)`);
	}
}
console.log('done');
