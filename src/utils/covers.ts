const groups: Record<string, string> = {
 'post-math': 'math', 'post-probability': 'math', 'post-optimization': 'math', 'series-mathematics': 'math',
 'post-paper': 'reading', 'post-reading-notes': 'reading', 'post-learning-path': 'reading', 'series-research': 'reading', 'project-replication': 'reading',
 'post-llm': 'research', 'post-evaluation': 'research', 'post-neural-network': 'research', 'post-retrieval': 'research', 'series-ai-agent': 'research', 'series-deep-learning': 'research', 'project-benchmark': 'research',
 'post-astro': 'systems', 'post-cli-terminal': 'systems', 'post-data-pipeline': 'systems', 'post-database': 'systems', 'post-distributed-systems': 'systems', 'series-ai-infra': 'systems', 'series-systems': 'systems',
 'post-tools': 'algorithm', 'post-code-algorithm': 'algorithm', 'post-code-cpp': 'algorithm', 'post-code-python': 'algorithm', 'post-code-rust': 'algorithm', 'post-code-go': 'algorithm', 'post-git-graph': 'algorithm',
};

/** Migrate the built-in cover library without rewriting article frontmatter. */
export function resolveCover(cover: string): string {
 const match = /^\/covers\/([a-z0-9-]+)\.svg$/.exec(cover);
 const group = match && groups[match[1]];
 return group ? `/covers/research/${group}.webp` : cover;
}
