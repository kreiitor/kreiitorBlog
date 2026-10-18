export const tagAliases: Record<string,string> = {
 'cpp':'C++',
 'algorithms':'算法',
 'ai-infra':'AI Infra',
 'agent':'AI Agent',
 'career':'职业规划',
 '求职规划':'职业规划',
 'learning-roadmap':'学习路线',
};
export function canonicalTag(tag:string) { return tagAliases[tag] ?? tag; }
