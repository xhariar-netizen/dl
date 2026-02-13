"use client";
import { getMovieSources, getMovieSubs } from "@/app/actions/movie";
import { getBackdropPath, tmdbClient } from "@/app/lib/tmdb";
import { Source, Subtitle } from "@/app/lib/types";
import { Loading } from "@/components/loading";
import { SourcesUI } from "@/components/sources-ui";
import { useEffect, useState } from "react";
import { MovieDetails } from "tmdb-ts";

export function MoviePage({ movie }: { movie: MovieDetails }) {
  const [isLoading, setIsLoading] = useState(true);
  const [sources, setSources] = useState<Source[]>([]);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);

  const { title, original_title, release_date, backdrop_path } = movie;

  const year = release_date.split("-")[0];
  const yearStr = year ? ` (${year}) ` : "";

  const backdropSrc = getBackdropPath(backdrop_path);

  useEffect(() => {
    (async () => {
      const sources = await getMovieSources(movie.id);
      const subs = await getMovieSubs(movie.id);

      setSources(sources);
      setSubtitles(subs);
      setIsLoading(false);
    })();
  }, []);

  return (
    <section className="relative mb-20">
      {backdropSrc && (
        <img
          className="fixed top-0 left-0 w-full aspect-video -z-10 blur-xs opacity-50 grayscale-50"
          src={backdropSrc}
          loading="lazy"
        />
      )}

      <h1 className="my-10 text-center text-xl md:text-2xl lg:text-3xl xl:text-4xl">
        Download {title || original_title} {yearStr}
      </h1>

      {isLoading ? (
        <Loading />
      ) : (
        <SourcesUI
          title={movie.title + yearStr}
          sources={sources}
          subtitles={subtitles}
        />
      )}
    </section>
  );
}
