export type Source = {
  type: "hls" | "mp4";
  url: string;
  dub: string;
  quality: number;
  sizeBytes: number;
  headers: any;
};

export type SourceResponse = {
  type: "movie" | "tv";
  tmdbId: number;
  season?: number;
  episode?: number;
  providerName: string;
  tookMs: number;
  sources: Source[];
};

export type Subtitle = {
  url: string;
  flagUrl: string;
  id: number;
  format: "srt" | "vtt";
  encoding: string;
  display: string;
  language: string;
  isHearingImpaired: boolean;
  source: string;
  fileName: string;
};
