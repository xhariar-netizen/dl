import { Source } from "../lib/types";

const PROXY_BASE = "https://proxy2.peachify.top";

export function proxifiedSources(sources: Source[]) {
  const proxiedSources = [];

  for (const src of sources) {
    // ignore other than mp4
    if (src.type !== "mp4") continue;

    if (src.url.startsWith(PROXY_BASE)) {
      proxiedSources.push(src);
    } else {
      const headerStr = src.headers
        ? `headers=${encodeURIComponent(JSON.stringify(src.headers))}`
        : "";

      proxiedSources.push({
        ...src,
        url: `${PROXY_BASE}/mp4-proxy?url=${encodeURIComponent(src.url)}&${headerStr}`,
      });
    }
  }


  return proxiedSources;
}
