import type { PostEntry } from '../utils/content';

type Category = PostEntry['data']['category'];

/** 三个栏目按文字形态划分：属于系列的进长卷，可复用的知识进札记，其余是闲笔。 */
export const sections = {
	knowledge: { label: '札记', href: '/blog/', description: '零散的知识与教训，靠标签彼此串联。' },
	course: { label: '长卷', href: '/notes/', description: '成体系的学习笔记，沿章节一路读下去。' },
	writing: { label: '闲笔', href: '/jottings/', description: '日常的片刻，几句话或一张照片。' },
} satisfies Record<Category, { label: string; href: string; description: string }>;

export type SectionKey = keyof typeof sections;

export const sectionOf = (post: PostEntry): SectionKey => post.data.category;
