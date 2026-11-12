"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SesiBerakhir, apiFetch, apiUnduh } from "@/lib/api";
import { KerangkaRekomendasi } from "@/components/Kerangka";
import DaftarProduk from "@/components/DaftarProduk";

type Bukti = { antecedent: string; consequent: string; support: number; confidence: number; lift: number };
type Rekomendasi = {
  segmen: string;
  skor_loyalitas: number;
  karakteristik: string;
  strategi: string;
  alasan: string;
  bukti: Bukti[];
};
type Unduhan = { berkas: string; waktu: string };

const persen = (v: number) => (v * 100).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
const angka = (v: number, d = 2) => v.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });

const garis = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Bagian({ judul, teks, ikon, sorot = false }: { judul: string; teks: string; ikon: React.ReactNode; sorot?: boolean }) {
  return (
    <div className={`flex gap-4 ${sorot ? "rounded-2xl bg-brand-50 p-5" : "px-5 py-5"}`}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${sorot ? "bg-brand-900 text-white" : "bg-brand-50 text-brand-700"}`}>
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" {...garis}>{ikon}</svg>
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-brand-900">{judul}</h3>
        <p className={`mt-1.5 whitespace-pre-line text-sm leading-relaxed ${sorot ? "font-medium text-brand-900" : "text-[#33463a]"}`}>{teks}</p>
      </div>
    </div>
  );
}

export default function HalamanRekomendasi() {
  const router = useRouter();
  const [data, setData] = useState<Rekomendasi[] | null>(null);
  const [aktif, setAktif] = useState(0);
  const [galat, setGalat] = useState("");
  const [menyusun, setMenyusun] = useState(false);
  const [mengunduh, setMengunduh] = useState(false);
  const [riwayat, setRiwayat] = useState<Unduhan[]>([]);

  const tangani = useCallback(
    (e: unknown) => {
      if (e instanceof SesiBerakhir) router.replace("/login");
      else setGalat((e as Error).message);
    },
    [router]
  );

  useEffect(() => {
    apiFetch<Rekomendasi[]>("/api/analytics/recommendations").then(setData).catch(tangani);
  }, [tangani]);

  async function susun() {
    setMenyusun(true);
    setGalat("");
    try {
      const r = await apiFetch<Rekomendasi[]>("/api/analytics/recommendations/generate", { method: "POST" });
      setData(r);
      setAktif(0);
    } catch (e) {
      tangani(e);
    } finally {
      setMenyusun(false);
    }
  }

  async function unduh(segmen?: string) {
    setMengunduh(true);
    setGalat("");
    try {
      const blob = await apiUnduh("/api/analytics/report/pdf" + (segmen ? `?segment=${encodeURIComponent(segmen)}` : ""));
      const nama = segmen ? `laporan-${segmen.toLowerCase().replace(/\s+/g, "-")}.pdf` : "laporan-rekomendasi-crm.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nama;
      a.click();
      URL.revokeObjectURL(url);
      setRiwayat((r) => [{ berkas: nama, waktu: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) }, ...r]);
    } catch (e) {
      tangani(e);
    } finally {
      setMengunduh(false);
    }
  }

  const r = data?.[aktif];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="judul-halaman">Rekomendasi Strategi CRM</h1>
          <p className="deskripsi-halaman">
            Strategi pemasaran tiap segmen, dilengkapi alasan dan pola pembelian yang mendasarinya.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={susun} disabled={menyusun} className="tombol-sekunder">
            {menyusun ? "Menyusun…" : data && data.length > 0 ? "Susun ulang rekomendasi" : "Susun rekomendasi"}
          </button>
          {data && data.length > 0 && (
            <button onClick={() => unduh()} disabled={mengunduh} className="tombol-utama">
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" {...garis} strokeWidth={2}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
              {mengunduh ? "Menyiapkan PDF…" : "Unduh laporan PDF (semua segmen)"}
            </button>
          )}
        </div>
      </header>

      {galat && <p role="alert" className="notif-galat">{galat}</p>}
      {!data && !galat && <KerangkaRekomendasi />}

      {data && data.length === 0 && (
        <p className="kosong">
          Rekomendasi belum disusun. Pastikan{" "}
          <Link href="/segmentasi" className="tautan">segmentasi</Link> sudah dijalankan, lalu tekan{" "}
          <b>Susun rekomendasi</b>.
        </p>
      )}

      {data && data.length > 0 && r && (
        <>
          <div role="tablist" aria-label="Segmen" className="grup-tab self-start">
            {data.map((d, i) => (
              <button
                key={d.segmen}
                role="tab"
                aria-selected={i === aktif}
                onClick={() => setAktif(i)}
                className="tab"
              >
                {d.segmen}
              </button>
            ))}
          </div>

          <section className="kartu p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef3ee] px-5 pb-4 pt-3">
              <div>
                <h2 className="judul-kartu">{r.segmen}</h2>
                <p className="mt-0.5 text-sm text-teks-2">
                  Skor loyalitas <b className="tabular-nums text-brand-900">{angka(r.skor_loyalitas, 4)}</b>
                </p>
              </div>
              <button onClick={() => unduh(r.segmen)} disabled={mengunduh} className="tombol-sekunder min-h-10">
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" {...garis} strokeWidth={2}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
                Unduh PDF segmen ini
              </button>
            </div>
             <div className="py-1">
                <Bagian judul="Strategi CRM yang disarankan" teks={r.strategi} sorot
                  ikon={<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" /></>} />
              </div>
            <div className="divide-y divide-[#eef3ee]">
              <Bagian judul="Karakteristik segmen" teks={r.karakteristik}
                ikon={<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14.5c2.3 0 4 1.5 4.5 4" /></>} />
              <Bagian judul="Alasan rekomendasi" teks={r.alasan}
                ikon={<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>} />
            </div>
          </section>

          <section className="kartu">
            <h3 className="judul-kartu">Pola pembelian pendukung</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-teks-3">
              Memakai hasil Analisis Pola Pembelian yang terakhir dijalankan. Setelah mengubah parameter atau periode di sana, tekan “Susun ulang rekomendasi”.
            </p>
            {r.bukti.length === 0 ? (
              <p className="mt-3 text-sm text-teks-2">Tidak ada aturan asosiasi pada segmen ini untuk periode yang dianalisis.</p>
            ) : (
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
                    {r.bukti.map((b, i) => (
                      <tr key={i} className="align-top hover:bg-isian">
                        <td><DaftarProduk teks={b.antecedent} /></td>
                        <td><DaftarProduk teks={b.consequent} /></td>
                        <td className="text-right tabular-nums">{persen(b.support)}</td>
                        <td className="text-right tabular-nums">{persen(b.confidence)}</td>
                        <td className="text-right font-bold text-brand-900 tabular-nums">{angka(b.lift)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {riwayat.length > 0 && (
        <section className="kartu">
          <h3 className="judul-kartu">Unduhan pada sesi ini</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-teks-2">
            {riwayat.map((u, i) => (
              <li key={i} className="flex justify-between"><span>{u.berkas}</span><span className="tabular-nums">{u.waktu}</span></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}