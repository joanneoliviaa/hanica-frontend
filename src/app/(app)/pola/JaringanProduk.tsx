"use client";

import { useMemo, useState } from "react";

type Aturan = { antecedent: string; consequent: string; support: number; confidence: number; lift: number };

const WARNA = ["#c2410c", "#0f766e", "#1d4ed8", "#7c3aed", "#a16207"];
const MAKS_ATURAN = 150;
const MAKS_NODE = 14;
const W = 760;
const H = 400;
const CX = W / 2;
const CY = H / 2;
const R = 135;

const persen = (v: number) =>
  (v * 100).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + "%";

const angka = (v: number) => v.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function singkat(nama: string): string {
  const bagian = nama.split(" / ").map((s) => s.trim());
  const dua = bagian.slice(0, 2).join(" / ");
  return dua.replace(/^CUP\s+/i, "");
}

export default function JaringanProduk({ aturan, nomor }: { aturan: Aturan[]; nomor: number }) {
  const warna = WARNA[(nomor - 1) % WARNA.length];
  const [nodeAktif, setNodeAktif] = useState<string | null>(null);
  const [tepiAktif, setTepiAktif] = useState<string | null>(null);

  const g = useMemo(() => {
    const pasangan = new Map<string, { a: string; b: string; lift: number; support: number; confidence: number; n: number }>();
    for (const r of aturan.slice(0, MAKS_ATURAN)) {
      const A = r.antecedent.split(", ");
      const C = r.consequent.split(", ");
      for (const a of A)
        for (const c of C) {
          if (a === c) continue;
          const [x, y] = a < c ? [a, c] : [c, a];
          const k = x + "||" + y;
          const p = pasangan.get(k);
          if (p) {
            if (r.lift > p.lift || (r.lift === p.lift && r.support > p.support)) {
              p.lift = r.lift;
              p.support = r.support;
              p.confidence = r.confidence;
            }
            p.n += 1;
          } else pasangan.set(k, { a: x, b: y, lift: r.lift, support: r.support, confidence: r.confidence, n: 1 });
        }
    }
    const derajat = new Map<string, number>();
    pasangan.forEach((p) => {
      derajat.set(p.a, (derajat.get(p.a) ?? 0) + p.lift);
      derajat.set(p.b, (derajat.get(p.b) ?? 0) + p.lift);
    });
    const dipilih = [...derajat.entries()].sort((x, y) => y[1] - x[1]).slice(0, MAKS_NODE).map((e) => e[0]).sort();
    const set = new Set(dipilih);
    const tepi = [...pasangan.values()].filter((p) => set.has(p.a) && set.has(p.b));
    const deg = new Map<string, number>();
    tepi.forEach((p) => {
      deg.set(p.a, (deg.get(p.a) ?? 0) + 1);
      deg.set(p.b, (deg.get(p.b) ?? 0) + 1);
    });
    let label = new Map(dipilih.map((n) => [n, singkat(n)]));
    if (new Set(label.values()).size < label.size) label = new Map(dipilih.map((n) => [n, n.replace(/^CUP\s+/i, "")]));
    const pos = new Map<string, { x: number; y: number; cos: number }>();
    dipilih.forEach((n, i) => {
      const t = -Math.PI / 2 + (2 * Math.PI * i) / dipilih.length;
      pos.set(n, { x: CX + R * Math.cos(t), y: CY + R * Math.sin(t), cos: Math.cos(t) });
    });
    const liftMaks = Math.max(...tepi.map((p) => p.lift), 1);
    const liftMin = Math.min(...tepi.map((p) => p.lift), liftMaks);
    return { nodes: dipilih, tepi, deg, label, pos, liftMaks, liftMin, totalNode: derajat.size };
  }, [aturan]);

  if (g.nodes.length < 2 || g.tepi.length === 0) return null;

  const lebar = (lift: number) =>
    g.liftMaks === g.liftMin ? 3 : 1.5 + ((lift - g.liftMin) / (g.liftMaks - g.liftMin)) * 4.5;
  const jari = (n: string) => 5 + Math.min(g.deg.get(n) ?? 0, 6) * 1.2;
  const tetangga = new Set<string>();
  if (nodeAktif) {
    tetangga.add(nodeAktif);
    g.tepi.forEach((p) => {
      if (p.a === nodeAktif) tetangga.add(p.b);
      if (p.b === nodeAktif) tetangga.add(p.a);
    });
  }
  const tepiInfo = g.tepi.find((p) => p.a + "||" + p.b === tepiAktif);
  const redup = (a: string, b: string) => {
    if (tepiAktif) return tepiAktif === a + "||" + b ? 1 : 0.1;
    if (nodeAktif) return a === nodeAktif || b === nodeAktif ? 1 : 0.08;
    return 0.55;
  };

  return (
    <div className="mt-4 rounded-[20px] border border-[#e9f0e8] bg-isian p-4 sm:p-5">
      <h3 className="font-semibold text-brand-900">Jaringan produk yang sering dibeli bersama</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-teks-3">
        Setiap titik adalah produk; garis menghubungkan produk yang muncul bersama dalam aturan. Garis lebih tebal berarti
        lift lebih tinggi. Menampilkan {g.nodes.length} produk dari aturan dengan lift tertinggi
        {g.totalNode > g.nodes.length ? ` (${g.totalNode - g.nodes.length} produk lain tidak ditampilkan)` : ""}. Daftar lengkap ada pada tabel aturan di bawah.
      </p>
      <div className="relative mt-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[600px]"
          role="img"
          aria-label={`Jaringan ${g.nodes.length} produk dengan ${g.tepi.length} hubungan berdasarkan aturan asosiasi`}
          onMouseLeave={() => {
            setNodeAktif(null);
            setTepiAktif(null);
          }}
        >
          {g.tepi.map((p) => {
            const a = g.pos.get(p.a)!;
            const b = g.pos.get(p.b)!;
            const k = p.a + "||" + p.b;
            return (
              <g key={k}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={warna} strokeWidth={lebar(p.lift)} strokeLinecap="round" opacity={redup(p.a, p.b)} />
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="transparent"
                  strokeWidth={12}
                  onMouseEnter={() => {
                    setNodeAktif(null);
                    setTepiAktif(k);
                  }}
                />
              </g>
            );
          })}
          {g.nodes.map((n) => {
            const p = g.pos.get(n)!;
            const kiri = p.cos < -0.2;
            const kanan = p.cos > 0.2;
            const dim = nodeAktif ? !tetangga.has(n) : tepiAktif ? !tepiAktif.split("||").includes(n) : false;
            return (
              <g
                key={n}
                opacity={dim ? 0.25 : 1}
                onMouseEnter={() => {
                  setTepiAktif(null);
                  setNodeAktif(n);
                }}
              >
                <circle cx={p.x} cy={p.y} r={jari(n)} fill={warna} stroke="#f7faf6" strokeWidth={2} />
                <text
                  x={p.x + (kanan ? 1 : kiri ? -1 : 0) * (jari(n) + 6)}
                  y={p.y + (Math.abs(p.cos) <= 0.2 ? (p.y < CY ? -jari(n) - 6 : jari(n) + 12) : 4)}
                  textAnchor={kanan ? "start" : kiri ? "end" : "middle"}
                  fontSize={11}
                  fill="#33463a"
                >
                  {g.label.get(n)}
                </text>
                <title>{n}</title>
              </g>
            );
          })}
        </svg>
        <div className="min-h-[2.5rem] text-sm text-teks-2" aria-live="polite">
          {tepiInfo ? (
            <>
            <b>{tepiInfo.a}</b> ↔ <b>{tepiInfo.b}</b>: support {persen(tepiInfo.support)}, confidence {persen(tepiInfo.confidence)}, lift {angka(tepiInfo.lift)}
            </>
          ) : nodeAktif ? (
            <>
              <b>{nodeAktif}</b> terhubung dengan {Math.max(tetangga.size - 1, 0)} produk lain.
            </>
          ) : (
            "Arahkan kursor ke titik atau garis untuk detail."
          )}
        </div>
      </div>
    </div>
  );
}