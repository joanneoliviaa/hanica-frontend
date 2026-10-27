"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SesiBerakhir, apiFetch } from "@/lib/api";
import JaringanProduk from "./JaringanProduk";
import { KerangkaFormPola, KerangkaHasilPola } from "@/components/Kerangka";

type Aturan = { antecedent: string; consequent: string; support: number; confidence: number; lift: number };
type HasilSegmen = { segmen: string; jumlah_transaksi: number; keterangan: string | null; aturan: Aturan[] };
type Hasil = {
  periode: { mulai: string; selesai: string };
  min_support: number;
  min_confidence: number;
  hasil: HasilSegmen[];
};
type Sensitivitas = {
  min_support_default: number;
  min_confidence_default: number;
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
const angka = (v: number) => v.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const tgl = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
const BATAS_AWAL = 15;

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
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState("");

  async function analisis(s: string, c: string, p: Periode, m = mulai, e = selesai) {
    setMemproses(true);
    setGalat("");
    try {
      const body: Record<string, unknown> = {
        min_support: parseFloat(s.replace(",", ".")) / 100,
        min_confidence: parseFloat(c.replace(",", ".")) / 100,
        period_type: p,
      };
      if (p === "custom") {
        body.start = m;
        body.end = e;
      }
      const r = await apiFetch<Hasil>("/api/analytics/patterns", { method: "POST", body: JSON.stringify(body) });
      setHasil(r);
      setSemua(false);
      setAktif((i) => Math.min(i, Math.max(r.hasil.length - 1, 0)));
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
        const s = String(r.min_support_default * 100).replace(".", ",");
        const c = String(r.min_confidence_default * 100).replace(".", ",");
        setSupport(s);
        setConfidence(c);
        await analisis(s, c, "seluruh");
      } catch (err) {
        if (err instanceof SesiBerakhir) router.replace("/login");
        else if ((err as Error).message.includes("Segmentasi belum")) setBelumSegmentasi(true);
        else setGalat((err as Error).message);
      }
    })();
  }, []);

  const segmen = hasil?.hasil[aktif];
  const baris = segmen ? (semua ? segmen.aturan : segmen.aturan.slice(0, BATAS_AWAL)) : [];
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
                onClick={() => { setAktif(i); setSemua(false); }}
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
                <JaringanProduk aturan={segmen.aturan} nomor={aktif + 1} />
                  <div className="bingkai-tabel mt-4">
                    <table className="tabel">
                      <thead>
                        <tr>
                          <th>Jika membeli</th>
                          <th>Maka juga membeli</th>
                          <th className="text-right">Support</th>
                          <th className="text-right">Confidence</th>
                          <th className="text-right">Lift</th>
                        </tr>
                      </thead>
                      <tbody>
                        {baris.map((a, i) => (
                          <tr key={i} className="align-top hover:bg-isian">
                            <td>{a.antecedent}</td>
                            <td>{a.consequent}</td>
                            <td className="text-right tabular-nums">{persen(a.support)}</td>
                            <td className="text-right tabular-nums">{persen(a.confidence)}</td>
                            <td className="text-right font-bold text-brand-900 tabular-nums">{angka(a.lift)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {segmen.aturan.length > BATAS_AWAL && (
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