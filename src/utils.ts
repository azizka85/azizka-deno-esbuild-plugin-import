import { 
  resolve, join,
  createHash 
} from '../deps.ts';

export function hash(url: URL) {
  const formatted = `${url.pathname}${url.search ? '?' + url.search : ''}`;

  return createHash('sha256').update(formatted).toString();
}

export function path(url: URL, cachePath: string) {  
  return resolve(
    join(cachePath, url.protocol.slice(0, -1), url.hostname, hash(url))
  );
}
