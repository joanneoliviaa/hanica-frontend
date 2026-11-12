"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SesiBerakhir, apiFetch } from "@/lib/api";
import JaringanProduk, { type PilihanJaringan } from "./JaringanProduk";
import { KerangkaFormPola, KerangkaHasilPola } from "@/components/Kerangka";
import DaftarProduk from "@/components/DaftarProduk";

type Aturan = { antecedent: string; consequent: string; support: number; confidence: number; lift: number };
type HasilSegmen = { segmen: string; jumlah_transaksi: number; keterangan: string | null; aturan: Aturan[] };
type Hasil = {
  periode: { mulai: string; selesai: string };
  min_support: number;
  min_confidence: number;
  tersimpan?: boolean;
  rekomendasi_diperbarui?: boolean;
  hasil: HasilSegmen[];
};
type Sensitivitas = {
  min_support_default: number;
  min_confidence_default: number;
  terakhir: { min_support: number; min_confidence: number; period_type: Periode; start: string; end: string } | null;
  tabel: { klaster: number; min_support: number; min_confidence: number; jumlah_aturan: number }[];
};
type Periode = "seluruh" | "12_bulan" | "6_bulan" | "custom";

const PILIHAN_PERIODE: { nilai: Periode; teks: string }[] = [
  { nilai: "seluruh", teks: "Seluruh data" },
  { nilai: "12_bulan", teks: "12 bulan terakhir" },
  { nilai: "6_bulan", teks: "6 bulan terakhir" },
  { nilai: "custom", teks: "Rentang tanggal sendiri" },
];

const persen = (v: number, d = 1) => (v * 100).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";
// 0.07 -> "7" ; 0.025 -> "2,5" (hindari 7.000000000000001)
const kePersen = (v: number) => String(Math.round(v * 10000) / 100).replace(".", ",");
const angka = (v: number) => v.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const tgl = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
const BATAS_AWAL = 15;

type KolomUrut = "lift" | "confidence" | "support";
type ArahUrut = "desc" | "asc";
const KOLOM_URUT: { nilai: KolomUrut; teks: string }[] = [
  { nilai: "lift", teks: "Lift" },
  { nilai: "confidence", teks: "Confidence" },
  { nilai: "support", teks: "Support" },
];

export default function Pola() {
  const router = useRouter();
  const [sens, setSens] = useState<Sensitivitas | null>(null);
  const [belumSegmentasi, setBelumSegmentasi] = useState(false);
  const [support, setSupport] = useState("");
  const [confidence, setConfidence] = useState("");
  const [periode, setPeriode] = useState<Periode>("seluruh");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [aktif, setAktif] = useState(0);
  const [semua, setSemua] = useState(false);
  const [filter, setFilter] = useState<PilihanJaringan | null>(null);
  const [kolomUrut, setKolomUrut] = useState<KolomUrut>("lift");
  const [arahUrut, setArahUrut] = useState<ArahUrut>("desc");
  const refTabel = useRef<HTMLDivElement>(null);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState("");
  const [info, setInfo] = useState("");

  // simpan=false saat halaman dibuka: hanya menampilkan aturan tersimpan, tidak menimpanya.
  async function analisis(s: string, c: string, p: Periode, m = mulai, e = selesai, simpan = true) {
    setGalat("");
    setInfo("");
    const nilaiS = Number(s.trim().replace(",", "."));
    const nilaiC = Number(c.trim().replace(",", "."));
    if (!s.trim() || !c.trim() || !Number.isFinite(nilaiS) || !Number.isFinite(nilaiC)) {
      setGalat("Minimum support dan minimum confidence harus berupa angka, misalnya 2 atau 2,5.");
      return;
    }
    if (nilaiS <= 0 || nilaiS > 100 || nilaiC <= 0 || nilaiC > 100) {
      setGalat("Minimum support dan minimum confidence harus lebih dari 0% dan paling besar 100%.");
      return;
    }
    setMemproses(true);
    try {
      const body: Record<string, unknown> = {
        min_support: nilaiS / 100,
        min_confidence: nilaiC / 100,
        period_type: p,
        simpan,
      };
      if (p === "custom") {
        body.start = m;
        body.end = e;
      }
      const r = await apiFetch<Hasil>("/api/analytics/patterns", { method: "POST", body: JSON.stringify(body) });
      setHasil(r);
      setSemua(false);
      setFilter(null);
      setAktif((i) => Math.min(i, Math.max(r.hasil.length - 1, 0)));
      if (r.tersimpan)
        setInfo(
          r.rekomendasi_diperbarui
            ? "Aturan asosiasi disimpan. Dashboard dan Rekomendasi CRM ikut diperbarui sesuai parameter ini."
            : "Aturan asosiasi disimpan dan dipakai di Dashboard serta Rekomendasi CRM."
        );
    } catch (err) {
      if (err instanceof SesiBerakhir) router.replace("/login");
      else setGalat((err as Error).message);
    } finally {
      setMemproses(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch<Sensitivitas>("/api/analytics/patterns/sensitivity");
        setSens(r);
        // Tampilkan parameter yang dipakai aturan tersimpan; bila belum ada, pakai nilai bawaan.
        const t = r.terakhir;
        const s = kePersen(t?.min_support ?? r.min_support_default);
        const c = kePersen(t?.min_confidence ?? r.min_confidence_default);
        const p: Periode = t?.period_type ?? "seluruh";
        const m = p === "custom" && t ? t.start : "";
        const e = p === "custom" && t ? t.end : "";
        setSupport(s);
        setConfidence(c);
        setPeriode(p);
        setMulai(m);
        setSelesai(e);
        await analisis(s, c, p, m, e, false);
      } catch (err) {
        if (err instanceof SesiBerakhir) router.replace("/login");
        else if ((err as Error).message.includes("Segmentasi belum")) setBelumSegmentasi(true);
        else setGalat((err as Error).message);
      }
    })();
  }, []);

  const segmen = hasil?.hasil[aktif];
  const cocok = (r: Aturan) => {
    if (!filter) return true;
    const A = r.antecedent.split(", ");
    const C = r.consequent.split(", ");
    if (!filter.b) return A.includes(filter.a) || C.includes(filter.a);
    return (A.includes(filter.a) && C.includes(filter.b)) || (A.includes(filter.b) && C.includes(filter.a));
  };
  const barisCocok = (segmen ? segmen.aturan.filter(cocok) : []).sort((x, y) =>
    arahUrut === "desc" ? y[kolomUrut] - x[kolomUrut] : x[kolomUrut] - y[kolomUrut],
  );

  function klikJudul(k: KolomUrut) {
    if (k === kolomUrut) setArahUrut(arahUrut === "desc" ? "asc" : "desc");
    else {
      setKolomUrut(k);
      setArahUrut("desc");
    }
  }

  const judulUrut = (k: KolomUrut, teks: string) => (
    <th className="text-right" aria-sort={kolomUrut === k ? (arahUrut === "desc" ? "descending" : "ascending") : "none"}>
      <button
        type="button"
        onClick={() => klikJudul(k)}
        className={"inline-flex items-center gap-1 font-semibold hover:text-brand-900 " + (kolomUrut === k ? "text-brand-900" : "")}
        title={`Urutkan berdasarkan ${teks}`}
      >
        {teks}
        <svg viewBox="0 0 24 24" className={"size-3.5 transition-transform " + (kolomUrut === k ? "" : "opacity-30") + (kolomUrut === k && arahUrut === "asc" ? " rotate-180" : "")} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </button>
    </th>
  );
  const baris = filter || semua ? barisCocok : barisCocok.slice(0, BATAS_AWAL);
  const sorot = filter ? [filter.a, ...(filter.b ? [filter.b] : [])] : undefined;

  function pilihDariJaringan(p: PilihanJaringan) {
    setFilter(p);
    requestAnimationFrame(() => refTabel.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  const dapatDijalankan = support !== "" && confidence !== "" && (periode !== "custom" || (mulai && selesai));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="judul-halaman">Analisis Pola Pembelian</h1>
        <p className="deskripsi-halaman">
          Aturan asosiasi produk yang sering dibeli bersamaan dengan algoritma FP-Growth.
        </p>
      </header>

      {belumSegmentasi && (
        <p className="kosong">
          Segmentasi belum dijalankan. Jalankan dulu di halaman{" "}
          <Link href="/segmentasi" className="tautan">Segmentasi Pelanggan</Link>.
        </p>
      )}
      {galat && <p role="alert" className="notif-galat">{galat}</p>}
      {info && <p role="status" className="notif-sukses">{info}</p>}

      {!sens && !galat && !belumSegmentasi && <KerangkaFormPola />}
      {!hasil && !galat && !belumSegmentasi && (!sens || memproses) && <KerangkaHasilPola />}

      {sens && (
        <form
          className="kartu"
          onSubmit={(e) => {
            e.preventDefault();
            analisis(support, confidence, periode);
          }}
        >
          <h2 className="judul-kartu">Parameter analisis</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm">
              <span className="label-input">Periode analisis</span>
              <select value={periode} onChange={(e) => setPeriode(e.target.value as Periode)} className="input mt-1.5 min-h-11 w-full">
                {PILIHAN_PERIODE.map((p) => <option key={p.nilai} value={p.nilai}>{p.teks}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="label-input">Minimum support (%)</span>
              <input id="support" inputMode="decimal" value={support} onChange={(e) => setSupport(e.target.value)} className="input mt-1.5 min-h-11 w-full" />
            </label>
            <label className="text-sm">
              <span className="label-input">Minimum confidence (%)</span>
              <input id="confidence" inputMode="decimal" value={confidence} onChange={(e) => setConfidence(e.target.value)} className="input mt-1.5 min-h-11 w-full" />
            </label>
            <div className="flex items-end">
              <button type="submit" disabled={memproses || !dapatDijalankan} className="tombol-utama w-full">
                {memproses ? "Memproses…" : "Jalankan analisis"}
              </button>
            </div>
          </div>
          {periode === "custom" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm">
                <span className="label-input">Dari tanggal</span>
                <input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} className="input mt-1.5 min-h-11 w-full" />
              </label>
              <label className="text-sm">
                <span className="label-input">Sampai tanggal</span>
                <input type="date" value={selesai} onChange={(e) => setSelesai(e.target.value)} className="input mt-1.5 min-h-11 w-full" />
              </label>
            </div>
          )}
          <p className="mt-4 text-xs text-teks-3">
            Periode hanya menyaring transaksi untuk FP-Growth; segmentasi tetap memakai seluruh data.
          </p>
        </form>
      )}

      {hasil && (
        <section className="kartu">
          <p className="text-sm text-teks-2">
            Periode transaksi: {tgl(hasil.periode.mulai)} – {tgl(hasil.periode.selesai)} · support ≥ {persen(hasil.min_support)} · confidence ≥ {persen(hasil.min_confidence)}
          </p>

          <div role="tablist" aria-label="Segmen" className="grup-tab mt-4">
            {hasil.hasil.map((h, i) => (
              <button
                key={h.segmen}
                role="tab"
                aria-selected={i === aktif}
                onClick={() => { setAktif(i); setSemua(false); setFilter(null); }}
                className="tab"
              >
                {h.segmen} <span className="font-normal opacity-75">· {h.aturan.length} aturan</span>
              </button>
            ))}
          </div>

          {segmen && (
            <div className="mt-4">
              <p className="text-sm text-teks-2">
                {segmen.jumlah_transaksi.toLocaleString("id-ID")} transaksi pada segmen ini dalam periode terpilih.
              </p>
              {segmen.keterangan && (
                <p className="notif-peringatan mt-3">{segmen.keterangan}</p>
              )}
              {segmen.aturan.length > 0 && (
                <>
                <JaringanProduk aturan={segmen.aturan} nomor={aktif + 1} onPilih={pilihDariJaringan} />
                  <div ref={refTabel} className="scroll-mt-6" />
                  {filter && (
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-900 ring-1 ring-inset ring-brand-100" aria-live="polite">
                      <span>
                        Menampilkan <b>{barisCocok.length}</b> aturan yang memuat{" "}
                        <b>{filter.a}</b>
                        {filter.b && <> dan <b>{filter.b}</b></>}
                      </span>
                      <button onClick={() => setFilter(null)} className="tombol-halaman ml-auto">Hapus filter</button>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <label htmlFor="urut-aturan" className="text-sm font-medium text-teks-2">Urutkan berdasarkan</label>
                    <select
                      id="urut-aturan"
                      className="input min-h-9"
                      value={kolomUrut}
                      onChange={(e) => setKolomUrut(e.target.value as KolomUrut)}
                    >
                      {KOLOM_URUT.map((k) => <option key={k.nilai} value={k.nilai}>{k.teks}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setArahUrut(arahUrut === "desc" ? "asc" : "desc")}
                      className="inline-flex size-9 items-center justify-center rounded-full border border-garis-input bg-white text-brand-800 transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                      aria-label={arahUrut === "desc" ? "Urutan menurun (tertinggi dulu). Klik untuk membalik." : "Urutan menaik (terendah dulu). Klik untuk membalik."}
                      title={arahUrut === "desc" ? "Menurun: tertinggi dulu" : "Menaik: terendah dulu"}
                    >
                      <svg viewBox="0 0 24 24" className={"size-4 transition-transform " + (arahUrut === "asc" ? "rotate-180" : "")} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 5v14M6 13l6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                  <div className="bingkai-tabel mt-3">
                    <table className="tabel">
                      <thead>
                        <tr>
                          <th>Jika membeli</th>
                          <th>Maka juga membeli</th>
                          {judulUrut("support", "Support")}
                          {judulUrut("confidence", "Confidence")}
                          {judulUrut("lift", "Lift")}
                        </tr>
                      </thead>
                      <tbody>
                        {baris.map((a, i) => (
                          <tr key={i} className="align-top hover:bg-isian">
                            <td><DaftarProduk teks={a.antecedent} sorot={sorot} /></td>
                            <td><DaftarProduk teks={a.consequent} sorot={sorot} /></td>
                            <td className="text-right tabular-nums">{persen(a.support)}</td>
                            <td className="text-right tabular-nums">{persen(a.confidence)}</td>
                            <td className="text-right font-bold text-brand-900 tabular-nums">{angka(a.lift)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!filter && segmen.aturan.length > BATAS_AWAL && (
                    <button onClick={() => setSemua(!semua)} className="tombol-sekunder mt-4 min-h-10">
                      {semua ? "Tampilkan lebih sedikit" : `Tampilkan semua ${segmen.aturan.length} aturan`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}