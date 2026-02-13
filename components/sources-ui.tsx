"use client";

import { Source, Subtitle } from "@/app/lib/types";
import { useMemo, useState, useRef } from "react";

interface Props {
  title: string;
  sources: Source[];
  subtitles: Subtitle[];
}

/* ---------------- utils ---------------- */

function formatBytes(bytes: number | undefined | null) {
  if (!bytes && bytes !== 0) return "N/A";
  const b = Math.max(0, Number(bytes));
  if (b >= 1_073_741_824) return (b / 1_073_741_824).toFixed(2) + " GB";
  if (b >= 1_048_576) return (b / 1_048_576).toFixed(1) + " MB";
  if (b >= 1024) return (b / 1024).toFixed(1) + " KB";
  return b + " B";
}

function getFlagUrl(code: string) {
  if (!code) return "";
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

/* ---------------- Component ---------------- */

export function SourcesUI({ title, sources, subtitles }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, Source[]>();
    (sources || []).forEach((s) => {
      const key = s.dub || "original";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });

    for (const [k, arr] of Array.from(map.entries())) {
      arr.sort((a, b) => b.quality - a.quality);
      map.set(k, arr);
    }
    return map;
  }, [sources]);

  /* ---------------- Download State ---------------- */

  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadedMB, setDownloadedMB] = useState(0);
  const [speedMBps, setSpeedMBps] = useState(0);
  const [etaSec, setEtaSec] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  const [currentSource, setCurrentSource] = useState<Source | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const pauseRef = useRef(false);

  /* ---------------- Video Download ---------------- */

  const startDownload = async (src: Source) => {
    setCurrentSource(src);
    setIsOpen(true);
    setProgress(0);
    setDownloadedMB(0);
    setSpeedMBps(0);
    setEtaSec(null);
    setPaused(false);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(src.url, {
        signal: controller.signal,
        headers: src.headers || undefined,
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      const totalBytes =
        parseInt(res.headers.get("Content-Length") || "0", 10) ||
        src.sizeBytes;

      let received = 0;
      let lastTime = Date.now();
      let lastBytes = 0;

      while (true) {
        if (pauseRef.current) {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }

        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          received += value.length;

          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;
          const byteDiff = received - lastBytes;

          if (timeDiff >= 1) {
            const speed = byteDiff / timeDiff; // bytes per sec
            const speedMB = speed / 1024 / 1024;

            setSpeedMBps(speedMB);

            if (totalBytes) {
              const remaining = totalBytes - received;
              setEtaSec(Math.max(0, remaining / speed));
            }

            lastTime = now;
            lastBytes = received;
          }

          setDownloadedMB(received / 1024 / 1024);

          if (totalBytes) {
            setProgress((received / totalBytes) * 100);
          }
        }
      }

      const blob = new Blob(chunks, {
        type: res.headers.get("Content-Type") || "application/octet-stream",
      });

      const blobUrl = URL.createObjectURL(blob);
      const fileName = `${title}-${src.quality}P.mp4`;

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      setProgress(100);
    } catch (err) {
      console.error(err);
    }
  };

  const cancelDownload = () => {
    abortRef.current?.abort();
    setIsOpen(false);
  };

  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setPaused(pauseRef.current);
  };

  /* ---------------- Subtitle Download ---------------- */

  const downloadSubtitle = async (sub: Subtitle) => {
    try {
      const res = await fetch(sub.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const fileName = `${title}-${sub.language}.${sub.format}`;

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error("Subtitle download error:", err);
    }
  };

  /* ---------------- Render ---------------- */

  return (
    <>
      <div className="w-full space-y-8">

        {/* Sources */}
        <div className="flex flex-wrap justify-center gap-6">
          {Array.from(grouped.entries()).map(([dub, srcList]) => (
            <section
              key={dub}
              className="w-fit bg-neutral-900/60 p-4 rounded-md border border-neutral-700 flex flex-col items-center"
            >
              <div className="flex items-center gap-3 mb-4 justify-center">
                {dub.length === 2 && (
                  <img
                    src={getFlagUrl(dub)}
                    className="w-6 h-4 object-cover rounded-sm"
                    alt={dub}
                  />
                )}
                <h4 className="text-lg font-semibold">
                  DUB: <span>{dub}</span>
                </h4>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                {srcList.map((s) => (
                  <div
                    key={s.url}
                    className="flex flex-col w-60 p-4 bg-neutral-800/60 rounded-md border border-neutral-700 items-center text-center"
                  >
                    <div className="flex w-full justify-between">
                      <span className="text-lg font-semibold">
                        {s.quality}P
                      </span>
                      <span className="text-sm text-neutral-300">
                        {formatBytes(s.sizeBytes)}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-400 mt-1">
                      {s.type.toUpperCase()}
                    </div>

                    <button
                      onClick={() => startDownload(s)}
                      className="mt-4 w-full px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Subtitles */}
        {subtitles && subtitles.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            {subtitles.map((s) => (
              <div
                key={s.id}
                className="w-fit flex items-center gap-3 p-3 bg-neutral-800/50 border border-neutral-700 rounded"
              >
                <img
                  src={s.flagUrl}
                  alt={s.language}
                  className="w-8 h-6 object-cover rounded-sm"
                />
                <div className="text-sm">
                  <div className="font-medium">
                    {s.display || s.language}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {s.format.toUpperCase()}
                  </div>
                </div>

                <button
                  onClick={() => downloadSubtitle(s)}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-sm cursor-pointer"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative bg-neutral-900 w-full max-w-md rounded-lg p-6 border border-neutral-700 z-10 space-y-4 text-center">

            <h4 className="text-lg font-semibold">
              Downloading {currentSource?.quality}P
            </h4>

            <div className="w-full bg-neutral-800 rounded h-3 overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="h-3 bg-emerald-500 transition-all"
              />
            </div>

            <div className="text-sm text-neutral-300">
              {progress.toFixed(1)}% • {downloadedMB.toFixed(2)} MB
            </div>

            <div className="text-sm text-neutral-300">
              Speed: {speedMBps.toFixed(2)} MB/s
              {etaSec !== null && (
                <> • ETA: {Math.ceil(etaSec)}s</>
              )}
            </div>

            <div className="text-sm text-yellow-400 bg-yellow-900/30 border border-yellow-500 rounded p-2">
              ⚠️ Don't Close your Browser or tab
            </div>

            <div className="flex justify-center gap-3 mt-3">
              <button
                onClick={togglePause}
                className="px-3 py-2 rounded bg-neutral-700 hover:bg-neutral-600 transition"
              >
                {paused ? "Resume" : "Pause"}
              </button>

              <button
                onClick={cancelDownload}
                className="px-3 py-2 rounded bg-red-600 hover:bg-red-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SourcesUI;
