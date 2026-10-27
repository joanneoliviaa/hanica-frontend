"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SesiBerakhir, apiFetch } from "@/lib/api";
import { BarisKerangka } from "@/components/Kerangka";

type Baris = {
  tanggal: string;
  no_faktur: string;
  kode_pelanggan: string;
  pelanggan: string;
  produk: string;
  qty: number;
  satuan: string | null;
  harga: number;
  subtotal: number;
};
type Hasil = {
  jumlah_baris: number;
  jumlah_baris_total: number;
  jumlah_transaksi_total: number;
  halaman: number;
  per_halaman: number;
  jumlah_halaman: number;
  data: Baris[];
};

const angka = (n: number, d = 0) => n.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: d });
const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");
const tgl = (s: string) => s.slice(8, 10) + "-" + s.slice(5, 7) + "-" + s.slice(0, 4);

// Daftar data transaksi bersih yang sudah tersimpan di sistem
export default function DaftarTransaksi({ versi = 0 }: { versi?: number }) {
  const router = useRouter();
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [halaman, setHalaman] = useState(1);
  const [cari, setCari] = useState("");
  const [kataCari, setKataCari] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");
  const urutan = useRef(0);

  // Tunda pencarian 300 ms setelah berhenti mengetik
  useEffect(() => {
    const t = setTimeout(() => {
      setKataCari(cari);
      setHalaman(1);
    }, 300);
    return () => clearTimeout(t);
  }, [cari]);

  const muat = useCallback(async () => {
    const nomor = ++urutan.current;
    setMemuat(true);
    setGalat("");
    try {
      const p = new URLSearchParams({ page: String(halaman), per_page: "5" });
      if (kataCari) p.set("q", kataCari);
      if (dari) p.set("dari", dari);
      if (sampai) p.set("sampai", sampai);
      const r = await apiFetch<Hasil>(`/api/catalog/transactions?${p}`);
      if (nomor === urutan.current) setHasil(r);
    } catch (e) {
      if (e instanceof SesiBerakhir) router.replace("/login");
      else setGalat((e as Error).message);
    } finally {
      if (nomor === urutan.current) setMemuat(false);
    }
  }, [halaman, kataCari, dari, sampai, router]);

  useEffect(() => {
    muat();
  }, [muat, versi]);

  const saring = Boolean(kataCari || dari || sampai);
  const awal = hasil && hasil.jumlah_baris ? (hasil.halaman - 1) * hasil.per_halaman + 1 : 0;
  const akhir = hasil ? awal + hasil.data.length - 1 : 0;

  return (
    <section className="kartu">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="judul-kartu">Data transaksi di sistem</h2>
          {hasil && (
            <p className="mt-1 text-[13px] text-teks-3">
              {angka(hasil.jumlah_baris_total)} baris dari {angka(hasil.jumlah_transaksi_total)} transaksi tersimpan.
              {saring && ` ${angka(hasil.jumlah_baris)} baris cocok dengan penyaringan.`}
            </p>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 text-[13px] lg:w-auto">
          <label className="relative flex w-full items-center sm:w-auto">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 size-4 text-teks-3" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              value={cari} onChange={(e) => setCari(e.target.value)}
              placeholder="Cari faktur, pelanggan, atau produk"
              aria-label="Cari data transaksi"
              className="input w-full bg-isian pl-10 sm:w-72"
            />
          </label>
          <label className="flex items-center gap-2 text-teks-2">Dari
            <input type="date" value={dari} onChange={(e) => { setDari(e.target.value); setHalaman(1); }} className="input" />
          </label>
          <label className="flex items-center gap-2 text-teks-2">Sampai
            <input type="date" value={sampai} onChange={(e) => { setSampai(e.target.value); setHalaman(1); }} className="input" />
          </label>
          {saring && (
            <button onClick={() => { setCari(""); setKataCari(""); setDari(""); setSampai(""); setHalaman(1); }} className="min-h-10 px-2 text-[13px] font-semibold text-brand-700 hover:text-brand-800 hover:underline">
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {galat && <p role="alert" className="notif-galat mt-4">{galat}</p>}

      <div className={`bingkai-tabel mt-4 transition-opacity ${memuat ? "opacity-60" : ""}`}>
        <table className="tabel min-w-[1080px]">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>No. faktur</th>
              <th>Pelanggan</th>
              <th>Produk</th>
              <th className="text-right">Qty</th>
              <th>Satuan</th>
              <th className="text-right">Harga</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {hasil && hasil.data.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-teks-3">
                  {saring ? "Tidak ada data yang cocok." : "Belum ada data transaksi. Unggah berkas penjualan terlebih dahulu."}
                </td>
              </tr>
            )}
            {!hasil && !galat && (
              <BarisKerangka kolom={8} baris={8} />
            )}
            {hasil?.data.map((b, i) => (
              <tr key={i} className="align-top hover:bg-isian">
                <td className="whitespace-nowrap">{tgl(b.tanggal)}</td>
                <td className="whitespace-nowrap">{b.no_faktur}</td>
                <td>
                  {b.pelanggan} <span className="text-xs text-teks-3">{b.kode_pelanggan}</span>
                </td>
                <td>{b.produk}</td>
                <td className="text-right tabular-nums">{angka(b.qty, 2)}</td>
                <td>{b.satuan ?? "–"}</td>
                <td className="whitespace-nowrap text-right tabular-nums">{rupiah(b.harga)}</td>
                <td className="whitespace-nowrap text-right font-semibold tabular-nums">{rupiah(b.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasil && hasil.jumlah_baris > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <p className="text-teks-3">
            Menampilkan {angka(awal)}–{angka(akhir)} dari {angka(hasil.jumlah_baris)} baris
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setHalaman(1)} disabled={halaman <= 1} className="tombol-halaman" aria-label="Halaman pertama">«<span className="hidden sm:inline">&nbsp;Awal</span></button>
            <button onClick={() => setHalaman((h) => h - 1)} disabled={halaman <= 1} className="tombol-halaman" aria-label="Halaman sebelumnya">‹<span className="hidden sm:inline">&nbsp;Sebelumnya</span></button>
            <span className="whitespace-nowrap px-1 tabular-nums text-teks-2 sm:px-2"><span className="hidden sm:inline">Halaman </span>{angka(hasil.halaman)} dari {angka(hasil.jumlah_halaman)}</span>
            <button onClick={() => setHalaman((h) => h + 1)} disabled={halaman >= hasil.jumlah_halaman} className="tombol-halaman" aria-label="Halaman berikutnya"><span className="hidden sm:inline">Berikutnya&nbsp;</span>›</button>
            <button onClick={() => setHalaman(hasil.jumlah_halaman)} disabled={halaman >= hasil.jumlah_halaman} className="tombol-halaman" aria-label="Halaman terakhir"><span className="hidden sm:inline">Akhir&nbsp;</span>»</button>
          </div>
        </div>
      )}
    </section>
  );
}
