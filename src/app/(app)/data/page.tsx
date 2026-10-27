"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SesiBerakhir, apiFetch } from "@/lib/api";
import DaftarTransaksi from "./DaftarTransaksi";

type Riwayat = { nama_berkas: string; tanggal: string; pengunggah: string; status: "berhasil" | "gagal" };
type Ringkasan = Record<string, number>;

const LABEL_RINGKASAN: [string, string][] = [
  ["baris_mentah", "Jumlah Baris Data Mentah"],
  ["baris", "Jumlah Baris Data Bersih"],
  ["transaksi", "Jumlah Transaksi"],
  ["pelanggan", "Jumlah Pelanggan"],
  ["produk", "Jumlah Produk"],
];

const PER_HALAMAN_RIWAYAT = 10;

const waktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

const garis = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export default function DataTransaksi() {
  const router = useRouter();
  const [berkas, setBerkas] = useState<File | null>(null);
  const [diseret, setDiseret] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState("");
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);
  const [versi, setVersi] = useState(0);
  const [halamanRiwayat, setHalamanRiwayat] = useState(1);

  const tanganiGalat = useCallback(
    (e: unknown) => {
      if (e instanceof SesiBerakhir) router.replace("/login");
      else setGalat(e instanceof Error ? e.message : "Terjadi kesalahan.");
    },
    [router]
  );

  const muatRiwayat = useCallback(() => {
    apiFetch<Riwayat[]>("/api/catalog/uploads")
      .then((d) => {
        setRiwayat(d);
        setHalamanRiwayat(1);
      })
      .catch(tanganiGalat);
  }, [tanganiGalat]);

  useEffect(() => {
    muatRiwayat();
  }, [muatRiwayat]);

  async function unggah(e: React.FormEvent) {
    e.preventDefault();
    if (!berkas) return;
    setGalat("");
    setRingkasan(null);
    setMemproses(true);
    try {
      const form = new FormData();
      form.append("file", berkas);
      const hasil = await apiFetch<{ ringkasan: Ringkasan }>("/api/catalog/upload", { method: "POST", body: form });
      setRingkasan(hasil.ringkasan);
      setBerkas(null);
      setVersi((v) => v + 1);
    } catch (err) {
      tanganiGalat(err);
    } finally {
      setMemproses(false);
      muatRiwayat();
    }
  }

  function jatuhkan(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDiseret(false);
    const f = e.dataTransfer.files?.[0];
    if (f && /\.xlsx?$/i.test(f.name)) setBerkas(f);
    else if (f) setGalat("Berkas harus berformat .xlsx atau .xls.");
  }

  const jumlahHalamanRiwayat = Math.max(1, Math.ceil(riwayat.length / PER_HALAMAN_RIWAYAT));
  const awalRiwayat = (halamanRiwayat - 1) * PER_HALAMAN_RIWAYAT;
  const riwayatTampil = riwayat.slice(awalRiwayat, awalRiwayat + PER_HALAMAN_RIWAYAT);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="judul-halaman">Data Transaksi</h1>
        <p className="deskripsi-halaman">Unggah berkas penjualan hasil ekspor Accurate (.xlsx).</p>
      </header>

      <div className={`grid gap-4 ${ringkasan ? "xl:grid-cols-5" : ""}`}>
        <form onSubmit={unggah} className={`kartu flex flex-col gap-4 ${ringkasan ? "xl:col-span-3" : ""}`}>
          <h2 className="judul-kartu">Unggah berkas penjualan</h2>
          <label
            htmlFor="berkas"
            onDragOver={(e) => { e.preventDefault(); setDiseret(true); }}
            onDragLeave={() => setDiseret(false)}
            onDrop={jatuhkan}
            className={`flex cursor-pointer flex-col items-center gap-2.5 rounded-[20px] border-2 border-dashed px-6 py-8 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-700 ${
              diseret ? "border-brand-700 bg-brand-50" : "border-brand-200 bg-isian hover:border-brand-300"
            }`}
          >
            <span className="grid size-12 place-items-center rounded-full bg-brand-100 text-brand-800">
              <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden="true" {...garis}><path d="M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" /></svg>
            </span>
            {berkas ? (
              <>
                <span className="text-[15px] font-semibold text-brand-900">{berkas.name}</span>
                <span className="text-[13px] text-teks-3">{(berkas.size / 1024).toLocaleString("id-ID", { maximumFractionDigits: 0 })} KB · klik untuk mengganti berkas</span>
              </>
            ) : (
              <>
                <span className="text-[15px] font-semibold text-brand-900">Tarik berkas ke sini atau pilih berkas</span>
                <span className="text-[13px] text-teks-3">Format .xlsx atau .xls</span>
              </>
            )}
            <input
              id="berkas" type="file" accept=".xlsx,.xls" className="sr-only"
              onChange={(e) => setBerkas(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="notif-peringatan">
            Mengunggah berkas baru akan menggantikan seluruh data transaksi yang ada. Hasil segmentasi
            perlu dijalankan ulang setelahnya.
          </p>
          <div>
            <button type="submit" disabled={!berkas || memproses} className="tombol-utama">
              {memproses ? "Memproses data…" : "Unggah & Proses Data"}
            </button>
          </div>
          {galat && <p role="alert" className="notif-galat">{galat}</p>}
        </form>

        {ringkasan && (
        <section className="flex flex-col gap-3 rounded-3xl bg-brand-800 p-6 text-white xl:col-span-2">
              <h2 className="text-[17px] font-semibold">Data berhasil diunggah dan dibersihkan</h2>
              <dl className="flex flex-col text-sm">
                {LABEL_RINGKASAN.map(([k, label]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-white/15 py-2 last:border-0">
                    <dt className="text-brand-100">{label}</dt>
                    <dd className="font-semibold tabular-nums">{(ringkasan[k] ?? 0).toLocaleString("id-ID")}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/segmentasi" className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full bg-brand-100 px-5 text-sm font-semibold text-brand-900 hover:bg-white">
                Lanjut ke Segmentasi Pelanggan
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" {...garis} strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
        </section>
        )}
      </div>

      <section className="kartu">
        <h2 className="judul-kartu">Riwayat unggahan</h2>
        <div className="bingkai-tabel mt-4">
          <table className="tabel">
            <thead>
              <tr>
                <th>Nama berkas</th>
                <th>Tanggal unggah</th>
                <th>Pengunggah</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-teks-3">Belum ada unggahan.</td></tr>
              )}
              {riwayatTampil.map((r, i) => (
                <tr key={awalRiwayat + i}>
                  <td>{r.nama_berkas}</td>
                  <td className="whitespace-nowrap">{waktu(r.tanggal)}</td>
                  <td>{r.pengunggah}</td>
                  <td>
                    <span className={`lencana ${r.status === "berhasil" ? "bg-brand-100 text-brand-900" : "bg-red-100 text-red-800"}`}>
                      {r.status === "berhasil" ? "Berhasil" : "Gagal"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {riwayat.length > PER_HALAMAN_RIWAYAT && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <p className="text-teks-3">
              Menampilkan {awalRiwayat + 1}–{awalRiwayat + riwayatTampil.length} dari {riwayat.length} unggahan
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setHalamanRiwayat(1)} disabled={halamanRiwayat <= 1} className="tombol-halaman" aria-label="Halaman pertama">«<span className="hidden sm:inline">&nbsp;Awal</span></button>
              <button onClick={() => setHalamanRiwayat((h) => h - 1)} disabled={halamanRiwayat <= 1} className="tombol-halaman" aria-label="Halaman sebelumnya">‹<span className="hidden sm:inline">&nbsp;Sebelumnya</span></button>
              <span className="whitespace-nowrap px-1 tabular-nums text-teks-2 sm:px-2"><span className="hidden sm:inline">Halaman </span>{halamanRiwayat} dari {jumlahHalamanRiwayat}</span>
              <button onClick={() => setHalamanRiwayat((h) => h + 1)} disabled={halamanRiwayat >= jumlahHalamanRiwayat} className="tombol-halaman" aria-label="Halaman berikutnya"><span className="hidden sm:inline">Berikutnya&nbsp;</span>›</button>
              <button onClick={() => setHalamanRiwayat(jumlahHalamanRiwayat)} disabled={halamanRiwayat >= jumlahHalamanRiwayat} className="tombol-halaman" aria-label="Halaman terakhir"><span className="hidden sm:inline">Akhir&nbsp;</span>»</button>
            </div>
          </div>
        )}
      </section>

      <DaftarTransaksi versi={versi} />
    </div>
  );
}
