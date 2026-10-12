// Отдача файлов хранилища окнам по протоколу sg-asset. Поддерживает запросы диапазона (Range):
// без них плеер не может перематывать музыку.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';

const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
};

export function serveFile(file: string, request: Request): Response {
  let size: number;
  try {
    const st = fs.statSync(file);
    if (!st.isFile()) return new Response('Not found', { status: 404 });
    size = st.size;
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const headers: Record<string, string> = {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes',
  };

  // Range: bytes=<начало>-[<конец>]
  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '');
  if (m && (m[1] || m[2])) {
    let start: number, end: number;
    if (m[1]) {
      start = Number(m[1]);
      end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    } else {
      // bytes=-500: последние 500 байт
      start = Math.max(0, size - Number(m[2]));
      end = size - 1;
    }
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    const body = Readable.toWeb(fs.createReadStream(file, { start, end })) as ReadableStream;
    return new Response(body, {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) },
    });
  }

  const body = Readable.toWeb(fs.createReadStream(file)) as ReadableStream;
  return new Response(body, { status: 200, headers: { ...headers, 'Content-Length': String(size) } });
}
