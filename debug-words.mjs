import { getCollection } from 'astro:content';

const posts = await getCollection('posts');
const publishedPosts = posts.filter(p => !p.data.draft);

let totalWords = 0;
let details = [];

for (const post of publishedPosts.slice(0, 5)) {
  const body = post.body ?? '';
  const han = (body.match(/\p{Script=Han}/gu)?.length ?? 0);
  const eng = (body.match(/[A-Za-z0-9]+/g)?.length ?? 0);
  const total = han + eng;
  totalWords += total;
  details.push({ slug: post.slug, han, eng, total });
}

const allWords = publishedPosts.reduce((sum, post) => {
  const body = post.body ?? '';
  return sum + (body.match(/\p{Script=Han}/gu)?.length ?? 0) + (body.match(/[A-Za-z0-9]+/g)?.length ?? 0);
}, 0);

console.log('Sample (first 5):', details);
console.log('Total for all posts:', allWords);
console.log('In 万字:', Math.round(allWords / 10000));
