import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

export function resolveFromRoot(...segments: string[]): string {
  return path.resolve(ROOT, ...segments);
}

export function ensureDir(dir: string): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function readJson<T = any>(relativePath: string): T {
  const full = resolveFromRoot(relativePath);
  return JSON.parse(fs.readFileSync(full, 'utf-8')) as T;
}

export function writeJson(relativePath: string, data: unknown): string {
  const full = resolveFromRoot(relativePath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf-8');
  return full;
}

export function exists(relativePath: string): boolean {
  return fs.existsSync(resolveFromRoot(relativePath));
}

/** Removes every file in a directory but keeps the directory itself. */
export function cleanDir(relativePath: string): void {
  const full = resolveFromRoot(relativePath);
  if (!fs.existsSync(full)) return;

  for (const entry of fs.readdirSync(full)) {
    fs.rmSync(path.join(full, entry), { recursive: true, force: true });
  }
}
