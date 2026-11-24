export const siteConfig = {
	title: '千羽 · senbazuru',
	tagline: '思考有迹，探索不止',
	description:
		'围绕 AI for Software Engineering、程序分析与实验复现，持续整理研究笔记、项目摘要与技术文章。',
	author: 'kreiitor',
	role: '数据科学硕士 · 偏软件工程',
	location: '武汉，中国',
	siteUrl: 'https://kreiitor.github.io/kreiitorBlog',
	email: 'kreiitor@foxmail.com',
	avatar: '/avatar.svg',
	socialLinks: [
		{ label: 'GitHub', href: 'https://github.com/kreiitor' },
		{ label: 'Email', href: 'mailto:kreiitor@foxmail.com' },
	],
	nowItems: [
		{ label: '正在研究', text: 'Repo-level Issue Localization', tone: 'study' as const, href: '/projects/issue-localization-benchmark/' },
		{ label: '长卷更新', text: 'Transformer 原理 · 8 篇整理完成', tone: 'study' as const, href: '/notes/transformer/' },
		{ label: '手边生活', text: '20 道家常菜顺序 · 两只小猫', tone: 'life' as const, href: '/jottings/' },
	],
};

export const navLinks = [
	{ label: '首页', href: '/' },
	{ label: '札记', href: '/blog/', section: 'knowledge' },
	{ label: '长卷', href: '/notes/', section: 'course' },
	{ label: '闲笔', href: '/jottings/', section: 'writing' },
	{ label: '关于', href: '/about/' },
];

export const aboutSections = [
	{
		title: '个人兴趣',
		items: ['AI 的基础与应用', '数学', '阅读'],
	},
	{
		title: '写作方向',
		items: ['论文阅读', '项目复盘总结', '个人知识库、学习笔记'],
	},
	{
		title: '站点维护原则',
		items: ['Markdown 优先', '静态部署优先', '内容结构先于样式炫技'],
	},
];
