export const siteConfig = {
	title: 'kreiitor · 研究札记',
	tagline: '思考有迹，探索不止',
	description:
		'围绕 AI for Software Engineering、程序分析与实验复现，持续整理研究笔记、项目摘要与技术文章。',
	author: 'kreiitor',
	role: '数据科学硕士 · 偏软件工程',
	location: '武汉，中国',
	siteUrl: 'https://kreiitor.github.io/kreiitorBlog',
	email: 'kreiitor@foxmail.com',
	avatar: '/avatar.svg',
	// 首页编辑推荐：研究实践、阅读方法、系统学习。仅展示已发布的文章。
	homeFeaturedPosts: [
		{ id: 'llm-eval-pipeline', label: '研究与实践' },
		{ id: 'paper-reading-notes', label: '阅读与方法' },
		{ id: 'fods-overview', label: '系统学习' },
	],
	hero: {
		kicker: 'AI for Software Engineering',
		title: '把论文、实验和博客写进同一条长期创作路径',
		description:
			'这里展示我的研究兴趣、项目进展和技术写作。站点以静态内容为基础，但希望在观感和浏览路径上更像一份持续生长的研究作品集。',
		highlights: ['LLM 在软件工程中的应用', '实验设计与复现实践', '技术写作与知识沉淀'],
	},
	socialLinks: [
		{ label: 'GitHub', href: 'https://github.com/kreiitor' },
		{ label: 'Email', href: 'mailto:kreiitor@foxmail.com' },
	],
};

export const navLinks = [
	{ label: '首页', href: '/' },
	{ label: '博客', href: '/blog/' },
	{ label: '学习', href: '/notes/' },
	{ label: '项目', href: '/projects/' },
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
