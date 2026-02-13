"use server";

import { SourceResponse, Subtitle } from "../lib/types";
import { proxifiedSources } from "./proxy";

const PEACH_BASE = "https://alpha.peachify.top";

export async function getMovieSources(tmdbId: number) {
  const url = `${PEACH_BASE}/moviebox/movie/${tmdbId}`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok)
      throw new Error(
        "Failed to fetch response code " + res.status + " " + res.statusText,
      );

    const json: SourceResponse = await res.json();
    return proxifiedSources(json.sources);
  } catch (err) {
    console.log("Error", err);
    return [];
  }
}

export async function getMovieSubs(tmdbId: number) {
  const url = `https://sub.wyzie.ru/search?id=${tmdbId}`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`response code ${res} ${res.statusText}`);

    const subs: Subtitle[] = await res.json();
    return subs;
  } catch (err) {
    console.log("ERROR Fetching Subtitles for", tmdbId, err);
    return [];
  }
}
