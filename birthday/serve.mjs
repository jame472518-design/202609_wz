// 零依賴的本機預覽伺服器。ES modules 不能用 file:// 開，所以需要它。
// 用法：node serve.mjs  然後瀏覽器開 http://localhost:8080
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const rel = normalize(path === '/' ? 'index.html' : path.slice(1));
  if (rel.startsWith('..')) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const body = await readFile(join(ROOT, rel));
    res.writeHead(200, { 'Content-Type': TYPES[extname(rel)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('找不到這個檔案');
  }
}).listen(PORT, () => {
  console.log(`預覽網址 http://localhost:${PORT}`);
});
