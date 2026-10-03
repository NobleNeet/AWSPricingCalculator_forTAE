import { cp, mkdir } from 'node:fs/promises';
const root = '.work/site';
await mkdir(root, { recursive: true });
for (const file of ['index.html', 'styles.css', 'src', 'services', 'schemas', 'pricing/generated', 'pricing/limitations.json', 'vendor']) await cp(file, `${root}/${file}`, { recursive: true });
console.log(`Static production artifact: ${root}`);
