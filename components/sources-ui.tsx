"use client";

import { Source, Subtitle } from "@/app/lib/types";
import { useMemo, useRef, useState, useEffect } from "react";
import { Download, X, Minimize2 } from "lucide-react";

interface Props {
  title: string;
  sources: Source[];
  subtitles: Subtitle[];
}

/* ---------------- UTILITIES ---------------- */

function formatBytes(bytes?: number) {
  if (!bytes) return "N/A";
  if (bytes >= 1_073_741_824) return (bytes / 1_073_741_824).toFixed(2) + " GB";
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + " MB";
  return (bytes / 1024).toFixed(1) + " KB";
}

function getFlagUrl(label: string) {
  const map: Record<string, string> = {
    english: "us",
    eng: "us",
    hindi: "in",
    bangla: "bd",
    bengali: "bd",
    japanese: "jp",
    korean: "kr",
    spanish: "es",
    french: "fr",
    german: "de",
  };

  const code = map[label.toLowerCase()] || label.slice(0, 2).toLowerCase();

  return `https://flagcdn.com/w40/${code}.png`;
}

type DownloadItem = {
  id: string;
  fileName: string;
  progress: number;
  speed: number;
  receivedMB: number;
  totalMB: number;
  abortController: AbortController;
};

/* ---------------- COMPONENT ---------------- */

export default function SourcesUI({ title, sources, subtitles }: Props) {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [managerOpen, setManagerOpen] = useState(true);

  const originalTitleRef = useRef<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Source[]>();
    sources?.forEach((s) => {
      if (!map.has(s.dub)) map.set(s.dub, []);
      map.get(s.dub)!.push(s);
    });
    return map;
  }, [sources]);

  /* ---------------- TITLE PROGRESS ---------------- */

  const updateDocumentTitle = (percent: number) => {
    if (!originalTitleRef.current) {
      originalTitleRef.current = document.title;
    }
    document.title = `${Math.floor(percent)}% • ${title}`;
  };

  const restoreTitle = () => {
    if (originalTitleRef.current) {
      document.title = originalTitleRef.current;
      originalTitleRef.current = null;
    }
  };

  /* ---------------- DOWNLOAD ---------------- */

  const startDownload = async (src: Source) => {
    const id = crypto.randomUUID();
    const controller = new AbortController();

    const totalBytes = src.sizeBytes || 0;

    const newItem: DownloadItem = {
      id,
      fileName: `${title}-${src.quality}P.mp4`,
      progress: 0,
      speed: 0,
      receivedMB: 0,
      totalMB: totalBytes / 1024 / 1024,
      abortController: controller,
    };

    setDownloads((d) => [...d, newItem]);
    setManagerOpen(true);

    try {
      const res = await fetch(src.url, {
        signal: controller.signal,
        headers: src.headers || undefined,
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const total =
        parseInt(res.headers.get("Content-Length") || "0") || totalBytes;

      let received = 0;
      let lastTime = Date.now();
      let lastBytes = 0;

      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          received += value.length;

          const now = Date.now();
          const diff = (now - lastTime) / 1000;

          if (diff >= 1) {
            const speed = (received - lastBytes) / diff;

            lastTime = now;
            lastBytes = received;

            setDownloads((prev) =>
              prev.map((d) =>
                d.id === id
                  ? {
                      ...d,
                      speed: speed / 1024 / 1024,
                    }
                  : d,
              ),
            );
          }

          const percent = (received / total) * 100;

          updateDocumentTitle(percent);

          setDownloads((prev) =>
            prev.map((d) =>
              d.id === id
                ? {
                    ...d,
                    progress: percent,
                    receivedMB: received / 1024 / 1024,
                  }
                : d,
            ),
          );
        }
      }

      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = newItem.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      document.title = `✓ ${title} - Completed`;

      setTimeout(() => {
        setDownloads((prev) => prev.filter((d) => d.id !== id));
        restoreTitle();
      }, 5000);
    } catch {
      cancelDownload(id);
    }
  };

  const cancelDownload = (id: string) => {
    const item = downloads.find((d) => d.id === id);
    item?.abortController.abort();

    setDownloads((prev) => prev.filter((d) => d.id !== id));

    restoreTitle();
  };

  useEffect(() => {
    if (downloads.length === 0) {
      setManagerOpen(false);
    }
  }, [downloads]);

  /* ---------------- SUB DOWNLOAD ---------------- */

  const downloadSubtitle = async (sub: Subtitle) => {
    const res = await fetch(sub.url);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const name = `${title}-${sub.display || sub.language}.${sub.format}`;

    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  /* ---------------- RENDER ---------------- */

  return (
    <>
      <h2 className="mt-5 text-center text-xl md:text-2xl lg:text-3xl xl:text-4xl">
        Download {title}
      </h2>
      {/* SOURCES */}
      <div className="flex flex-wrap justify-center gap-10">
        {Array.from(grouped.entries()).map(([dub, list]) => (
          <section
            key={dub}
            className="bg-neutral-900/70 p-6 rounded-lg border border-neutral-800 backdrop-blur flex flex-col items-center gap-5"
          >
            <div className="flex items-center gap-3 bg-neutral-800/60 px-4 py-2 rounded-md border border-neutral-700">
              <img
                src={getFlagUrl(dub)}
                className="w-6 h-4 object-cover rounded-sm"
              />
              <span className="font-semibold">DUB: {dub}</span>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {list.map((s) => (
                <div
                  key={s.url}
                  className="w-60 bg-neutral-900/60 p-4 rounded-md border border-neutral-800 flex flex-col gap-3"
                >
                  <div className="flex justify-between">
                    <span>{s.quality}P</span>
                    <span className="text-sm text-neutral-400">
                      {formatBytes(s.sizeBytes)}
                    </span>
                  </div>

                  <button
                    onClick={() => startDownload(s)}
                    className="mt-2 px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded cursor-pointer transition"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <h2 className="mt-5 text-center text-xl md:text-2xl lg:text-3xl xl:text-4xl">
        Download Subtitles for {title}
      </h2>
      {/* SUBTITLES */}
      {subtitles?.length > 0 && (
        <div className="flex flex-wrap justify-center gap-8 mt-12">
          {subtitles.map((s) => (
            <div
              key={s.id}
              className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-lg flex flex-col items-center gap-4 w-52 text-center"
            >
              <img src={s.flagUrl} className="w-8 rounded" />
              <span>{s.display || s.language}</span>
              <button
                onClick={() => downloadSubtitle(s)}
                className="w-full px-3 py-2 bg-teal-700 hover:bg-teal-600 rounded cursor-pointer transition"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FLOATING REOPEN */}
      {downloads.length > 0 && !managerOpen && (
        <button
          onClick={() => setManagerOpen(true)}
          className="fixed bottom-6 right-6 bg-neutral-950 p-3 rounded-full border border-neutral-800 shadow-xl cursor-pointer"
        >
          <Download size={20} />
        </button>
      )}

      {/* DOWNLOAD MANAGER */}
      {managerOpen && downloads.length > 0 && (
        <div className="fixed bottom-6 right-6 w-80 bg-neutral-950 border border-neutral-800 rounded-lg p-5 space-y-5 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Downloads</span>
            <button onClick={() => setManagerOpen(false)}>
              <Minimize2 size={18} />
            </button>
          </div>

          {downloads.map((d) => (
            <div
              key={d.id}
              className="bg-neutral-900/60 p-3 rounded-md border border-neutral-800 space-y-2"
            >
              <div className="text-sm">{d.fileName}</div>

              <div className="w-full bg-neutral-800 h-2 rounded overflow-hidden">
                <div
                  style={{
                    width: `${d.progress}%`,
                  }}
                  className="bg-purple-700 h-2 transition-all"
                />
              </div>

              <div className="flex justify-between text-xs text-neutral-400">
                <span>
                  {d.receivedMB.toFixed(1)} / {d.totalMB.toFixed(1)} MB
                </span>
                <span>{d.speed.toFixed(2)} MB/s</span>
              </div>

              <button
                onClick={() => cancelDownload(d.id)}
                className="text-red-500 text-xs cursor-pointer flex items-center gap-1"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
