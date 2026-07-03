import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'assets');
const target = resolve(root, 'dist', 'assets');

await mkdir(resolve(root, 'dist'), { recursive: true });
await cp(source, target, { recursive: true, force: true });
