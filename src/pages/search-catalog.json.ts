import { getCollection } from 'astro:content';
import { getPublishedPosts, getProjects } from '../utils/content';
import { withBase } from '../utils/url';
export async function GET() {
 const posts = getPublishedPosts(await getCollection('posts')).map(post => ({ slug:post.id, title:post.data.title, description:post.data.description, type:post.data.category === 'course' ? '学习笔记' : '博客文章', url:withBase(`/blog/${post.id}/`) }));
 const projects = getProjects(await getCollection('projects')).map(project => ({ slug:`project:${project.id}`, title:project.data.title, description:project.data.summary, type:'研究项目', url:withBase(`/projects/${project.id}/`) }));
 return new Response(JSON.stringify([...posts,...projects]), { headers:{ 'Content-Type':'application/json; charset=utf-8' } });
}
