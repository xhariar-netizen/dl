import { BackdropSize, TMDB } from "tmdb-ts";

const tmdbClient = new TMDB(process.env.TMDB_ACCESS_TOKEN!);

export function getBackdropPath(shortPath: string) {
  if (!shortPath) return "";

  const base = "https://image.tmdb.org/t/p";
  return `${base}/${BackdropSize.W500}/${shortPath}`;
  // if (window.outerWidth > 1280)
  //   return `${base}/${BackdropSize.ORIGINAL}/${shortPath}`;

  // else if (window.outerWidth > 780)
  //   return `${base}/${BackdropSize.W1280}/${shortPath}`;

  // else if (window.outerWidth > 500)
  //   return `${base}/${BackdropSize.W780}/${shortPath}`;

  // else return `${base}/${BackdropSize.W500}/${shortPath}`;
}

export { tmdbClient };
