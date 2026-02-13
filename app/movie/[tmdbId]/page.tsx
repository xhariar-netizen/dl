import { tmdbClient } from "@/app/lib/tmdb";
import { ErrorPage } from "@/components/error-page";
import { notFound } from "next/navigation";
import { MoviePage } from "./movie-page";

export default async function page({
  params,
}: {
  params: Promise<{ tmdbId: string }>;
}) {
  const tmdbIdRaw = (await params).tmdbId;
  const tmdbId = Number(tmdbIdRaw);

  if (isNaN(tmdbId)) {
    console.log(`Invalid tmdbId: ${tmdbIdRaw}, returning 404`);
    notFound();
  }

  try {
    const movie = await tmdbClient.movies.details(tmdbId);
    return <MoviePage movie={movie}></MoviePage>;
  } catch (err: any) {
    console.log("Error", err);
    if (err.status_code && err.status_code == 34) {
      notFound();
    } else {
      return (
        <ErrorPage msg="Something went wrong | Try Again Later"></ErrorPage>
      );
    }
  }
}

