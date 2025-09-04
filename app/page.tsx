"use client";

import { useState } from "react";

export default function Home() {
  const [inputUrl, setInputUrl] = useState("https://rush-player.vercel.app/player/pankaj");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setImgUrl(null);
    setLoading(true);
    try {
      const res = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl, fullPage: true, imageType: "png" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setImgUrl(data.url);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">URL → Screenshot → Cloudinary</h1>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="url"
          required
          placeholder="https://…"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
        >
          {loading ? "Processing…" : "Capture"}
        </button>
      </form>
      {err && <p className="text-red-600">{err}</p>}
      {imgUrl && (
        <div className="space-y-2">
          <a className="text-blue-600 underline break-all" href={imgUrl} target="_blank">
            {imgUrl}
          </a>
          <div className="border rounded overflow-hidden">
            <img src={imgUrl} alt="Screenshot" className="w-full" />
          </div>
        </div>
      )}
    </main>
  );
}
