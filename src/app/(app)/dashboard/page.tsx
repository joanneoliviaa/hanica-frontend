"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SesiBerakhir, ambilPengguna, apiFetch, gayaLencanaSegmen, warnaSegmen } from "@/lib/api";
import { KerangkaDasbor } from "@/components/Kerangka";

type Status = "Aktif" | "Kurang Aktif" | "Tidak Aktif";
type Segmen = { label: string; nomor: number; jumlah: number; status_keaktifan: Record<Status, number> };
type Ringkasan = {
  siap: boolean;
  detail?: string;
  periode_data?: { mulai: string | null; selesai: string | null; acuan: string | null };
  silhouette_optimal?: number | null;
  total_pelanggan?: number;
  status_keaktifan?: Record<string, number>;
  total_transaksi?: number;
  total_nilai_transaksi?: number;
  k_optimal?: number | null;
  pelanggan_per_segmen?: Segmen[];
  omzet_bulanan?: { bulan: string; total: number }[];
  aturan_lift_tertinggi?: { segmen: string; antecedent: string; consequent: string; support: number; confidence: number; lift: number }[];
};

const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");
const rupiahPenuh = (n: number) =>
  "Rp. " + n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Label di atas batang: angka bulat yang dipotong ke bawah (tidak dibulatkan ke atas).
// Nilai miliar tetap 2 desimal (dipotong) supaya tidak jadi "1 M".
const ringkasPotong = (n: number) =>
  n >= 1e9
    ? `${(Math.floor(n / 1e7) / 100).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`
    : `${Math.floor(n / 1e6).toLocaleString("id-ID")} jt`;
const ringkas = (n: number) =>
  n >= 1e9
    ? `${(n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`
    : `${Math.round(n / 1e6).toLocaleString("id-ID")} jt`;
const NAMA_BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const labelBulan = (b: string) => `${NAMA_BULAN[parseInt(b.slice(5, 7)) - 1]} ${b.slice(0, 4)}`;
const tglPendek = (s: string | null | undefined) =>
  s ? `${s.slice(8, 10)} ${NAMA_BULAN[parseInt(s.slice(5, 7)) - 1]} ${s.slice(0, 4)}` : "–";
const persen = (v: number, d = 1) =>
  (v * 100).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";

const WARNA_BATANG = "#8fcb8f";
const WARNA_BATANG_PUNCAK = "#007800";

const garis = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Ikon({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" {...garis}>{children}</svg>
    </span>
  );
}

function KartuTotal({ nilai }: { nilai: number }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-3xl bg-brand-800 p-4 text-white sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-brand-100">Total pelanggan</p>
        <span className="grid size-8 place-items-center rounded-full bg-white/[0.12]">
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" {...garis}>
            <circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" />
          </svg>
        </span>
      </div>
      <p className="text-[1.75rem] font-bold leading-none tracking-tight tabular-nums sm:text-[2.125rem]">{nilai.toLocaleString("id-ID")}</p>
      <p className="text-xs text-brand-200">dari keseluruhan dataset</p>
    </div>
  );
}

function KartuStatus({ judul, rentang, nilai, total, warnaBar, kelasLencana }: {
  judul: string; rentang: string; nilai: number; total: number; warnaBar: string; kelasLencana: string;
}) {
  const bagian = total ? nilai / total : 0;
  return (
    <div className="flex flex-col gap-2.5 rounded-3xl border border-garis bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <p className="text-[13px] font-medium text-teks-2">{judul}</p>
        <span className={`lencana ${kelasLencana}`}>{rentang}</span>
      </div>
      <p className="text-[1.75rem] font-bold leading-none tracking-tight tabular-nums sm:text-[2.125rem]">{nilai.toLocaleString("id-ID")}</p>
      <div className="h-1.5 rounded-full bg-[#eef3ee]" aria-hidden="true">
        <div className="h-1.5 rounded-full" style={{ width: `${bagian * 100}%`, background: warnaBar }} />
      </div>
      <p className="text-xs text-teks-3">{total ? persen(bagian) : "–"} dari total pelanggan</p>
    </div>
  );
}

function KartuRingkas({ judul, nilai, catatan, ikon }: { judul: string; nilai: string; catatan?: string; ikon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-garis bg-white px-5 py-[18px]">
      <Ikon>{ikon}</Ikon>
      <div className="min-w-0">
        <p className="text-[13px] text-teks-2">{judul}</p>
        <p className="break-words text-xl font-bold tabular-nums sm:text-[1.375rem]">
          {nilai}
          {catatan && <span className="ml-1.5 text-[13px] font-medium text-teks-3">· {catatan}</span>}
        </p>
      </div>
    </div>
  );
}

function Panel({ judul, children, aksi }: { judul: string; children: React.ReactNode; aksi?: React.ReactNode }) {
  return (
    <section className="kartu flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="judul-kartu">{judul}</h2>
        {aksi}
      </div>
      <div className="mt-4 flex min-w-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

function TrenBatang({ data }: { data: { bulan: string; total: number }[] }) {
  const [tabel, setTabel] = useState(false);
  const [aktif, setAktif] = useState<number | null>(null);
  const W = 520, H = 250, kiri = 50, kanan = 10, atas = 28, bawah = 32;
  const maks = Math.max(...data.map((d) => d.total), 1);
  const dasar = Math.pow(10, Math.floor(Math.log10(maks / 4)));
  const langkah = [1, 2, 5, 10].map((f) => f * dasar).find((s) => maks / s <= 4) ?? dasar * 10;
  const puncak = Math.ceil(maks / langkah) * langkah;
  const tik: number[] = [];
  for (let v = 0; v <= puncak + 1; v += langkah) tik.push(v);
  const y = (v: number) => H - bawah - (v / puncak) * (H - bawah - atas);
  const slot = (W - kiri - kanan) / Math.max(data.length, 1);
  const tebal = Math.min(26, slot * 0.5);
  const iPuncak = data.reduce((m, d, i) => (d.total > data[m].total ? i : m), 0);

  const aksi = data.length > 0 && (
    <div role="group" aria-label="Bentuk tampilan" className="grup-tab">
      <button type="button" aria-pressed={!tabel} onClick={() => setTabel(false)} className="tab min-h-8 px-3.5 text-xs">Grafik</button>
      <button type="button" aria-pressed={tabel} onClick={() => setTabel(true)} className="tab min-h-8 px-3.5 text-xs">Tabel</button>
    </div>
  );

  return (
    <Panel judul="Tren penjualan 6 bulan terakhir" aksi={aksi}>
      {data.length === 0 ? (
        <p className="text-sm text-teks-3">Belum ada data penjualan.</p>
      ) : tabel ? (
        <div className="bingkai-tabel">
          <table className="tabel min-w-0">
            <thead><tr><th>Bulan</th><th className="border-l border-[#e1ebe0] text-right">Nilai penjualan</th></tr></thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.bulan}>
                  <td>{labelBulan(d.bulan)}</td>
                  <td className="border-l border-[#eef3ee] text-right tabular-nums">{rupiah(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[440px]" role="img" aria-label="Diagram batang nilai penjualan enam bulan terakhir" onPointerLeave={() => setAktif(null)}>
            {tik.map((t) => (
              <g key={t}>
                <line x1={kiri} x2={W - kanan} y1={y(t)} y2={y(t)} stroke="#e7efe6" />
                <text x={kiri - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5b6675">{t === 0 ? "0" : ringkas(t)}</text>
              </g>
            ))}
            {data.map((d, i) => {
              const cx = kiri + slot * i + slot / 2;
              const tinggi = H - bawah - y(d.total);
              const r = Math.min(8, tinggi / 2);
              const x0 = cx - tebal / 2, x1 = cx + tebal / 2, yTop = y(d.total), yBase = H - bawah;
              const jalur = `M${x0} ${yBase} V${yTop + r} Q${x0} ${yTop} ${x0 + r} ${yTop} H${x1 - r} Q${x1} ${yTop} ${x1} ${yTop + r} V${yBase} Z`;
              const puncakIni = i === iPuncak;
              return (
                <g key={d.bulan} onPointerEnter={() => setAktif(i)}>
                  <rect x={cx - slot / 2} y={atas} width={slot} height={H - bawah - atas} fill="transparent" />
                  <path d={jalur} fill={puncakIni || aktif === i ? WARNA_BATANG_PUNCAK : WARNA_BATANG} opacity={aktif === null || aktif === i ? 1 : 0.6} />
                  <text x={cx} y={yTop - 6} textAnchor="middle" fontSize="11" fontWeight={puncakIni ? 700 : 400} fill={puncakIni ? "#004a00" : "#33463a"}>{ringkasPotong(d.total)}</text>
                  <text x={cx} y={H - 12} textAnchor="middle" fontSize="11" fill="#5b6675">{labelBulan(d.bulan)}</text>
                </g>
              );
            })}
          </svg>
          {aktif !== null && (
            <div className="pointer-events-none absolute top-0 rounded-2xl border border-garis bg-white px-3.5 py-2 text-xs shadow-md shadow-brand-900/5"
              style={{ left: `${((kiri + slot * aktif + slot / 2) / W) * 100}%`, transform: aktif > data.length / 2 ? "translateX(-110%)" : "translateX(10%)" }}>
              <p className="text-teks-3">{labelBulan(data[aktif].bulan)}</p>
              <p className="mt-0.5 flex items-center gap-2 text-sm font-semibold tabular-nums">
                <span className="inline-block size-2.5 rounded-full" style={{ background: WARNA_BATANG_PUNCAK }} />
                {rupiah(data[aktif].total)}
              </p>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function DonatSegmen({ segmen }: { segmen: Segmen[] }) {
  const [aktif, setAktif] = useState<number | null>(null);
  const total = segmen.reduce((a, s) => a + s.jumlah, 0);
  const R = 56, C = 2 * Math.PI * R, celah = segmen.length > 1 ? 2 : 0;
  let mulai = 0;

  return (
    <Panel judul="Pelanggan per segmen & status keaktifan">
      {segmen.length === 0 || total === 0 ? (
        <p className="text-sm text-teks-2">
          Segmentasi belum dijalankan. <Link href="/segmentasi" className="tautan">Jalankan di sini</Link>.
        </p>
      ) : (
        <div className="flex flex-1 flex-wrap content-center items-center gap-7">
          <svg viewBox="0 0 160 160" className="size-44 shrink-0" role="img" aria-label="Diagram donat distribusi pelanggan per segmen">
            <g transform="rotate(-90 80 80)">
              {segmen.map((s, i) => {
                const panjang = (s.jumlah / total) * C;
                const el = (
                  <circle key={s.label} cx="80" cy="80" r={R} fill="none" stroke={warnaSegmen(s.nomor)} strokeWidth={aktif === i ? 26 : 22}
                    strokeDasharray={`${Math.max(panjang - celah, 0)} ${C - Math.max(panjang - celah, 0)}`} strokeDashoffset={-mulai}
                    onPointerEnter={() => setAktif(i)} onPointerLeave={() => setAktif(null)}>
                    <title>{`${s.label}: ${s.jumlah} pelanggan`}</title>
                  </circle>
                );
                mulai += panjang;
                return el;
              })}
            </g>
            <text x="80" y="80" textAnchor="middle" fontSize="26" fontWeight="700" fill="#004a00">{total}</text>
            <text x="80" y="97" textAnchor="middle" fontSize="11" fill="#5b6675">pelanggan</text>
          </svg>
          <ul className="flex min-w-[14rem] flex-1 flex-col gap-2.5 text-sm">
            {segmen.map((s, i) => (
              <li key={s.label} className={`rounded-2xl px-3.5 py-3 transition-colors ${aktif === i ? "bg-brand-50" : "bg-isian"}`}
                onPointerEnter={() => setAktif(i)} onPointerLeave={() => setAktif(null)}>
                <p className="flex items-center justify-between gap-3 font-semibold">
                  <span className="flex items-center gap-2">
                    <span className="inline-block size-2.5 rounded-full" style={{ background: warnaSegmen(s.nomor) }} />
                    {s.label}
                  </span>
                  <span className="tabular-nums">{s.jumlah} <span className="font-normal text-teks-3">({persen(s.jumlah / total)})</span></span>
                </p>
                <p className="mt-1 pl-[18px] text-xs text-teks-3">
                  Aktif {s.status_keaktifan["Aktif"]} · Kurang Aktif {s.status_keaktifan["Kurang Aktif"]} · Tidak Aktif {s.status_keaktifan["Tidak Aktif"]}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function Kepala({ periode }: { periode?: Ringkasan["periode_data"] }) {
  const [pengguna, setPengguna] = useState("");
  useEffect(() => setPengguna(ambilPengguna()), []);
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
      <div>
        {pengguna && <p className="mb-1.5 text-sm text-[#3f6b3f]">Halo, {pengguna}</p>}
        <h1 className="judul-halaman">Dashboard</h1>
      </div>
      {periode && (
        <p className="flex min-h-11 items-center gap-2.5 rounded-full border border-brand-100 bg-white px-[18px] text-sm text-[#33463a]">
          <svg viewBox="0 0 24 24" className="size-4 text-brand-700" aria-hidden="true" {...garis}>
            <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          Periode data <b className="font-semibold text-brand-900">{tglPendek(periode.mulai)} – {tglPendek(periode.selesai)}</b>
        </p>
      )}
    </header>
  );
}

export default function Dasbor() {
  const router = useRouter();
  const [data, setData] = useState<Ringkasan | null>(null);
  const [galat, setGalat] = useState("");

  useEffect(() => {
    apiFetch<Ringkasan>("/api/analytics/dashboard")
      .then(setData)
      .catch((e) => {
        if (e instanceof SesiBerakhir) router.replace("/login");
        else setGalat(e.message);
      });
  }, [router]);

  if (galat) return (<><Kepala /><p role="alert" className="notif-galat mt-6">{galat}</p></>);
  if (!data) return (<><Kepala /><KerangkaDasbor /></>);
  if (!data.siap) return (
    <>
      <Kepala />
      <p className="kosong mt-6">{data.detail} <Link href="/data" className="tautan">Unggah data</Link>.</p>
    </>
  );

  const total = data.total_pelanggan ?? 0;
  const s = data.status_keaktifan ?? {};
  const nomorSegmen = Object.fromEntries((data.pelanggan_per_segmen ?? []).map((g) => [g.label, g.nomor]));

  return (
    <div className="flex flex-col gap-6">
      <Kepala periode={data.periode_data} />

      <section aria-label="Ringkasan pelanggan" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KartuTotal nilai={total} />
        <KartuStatus judul="Pelanggan Aktif" rentang="≤ 30 hari" nilai={s["Aktif"] ?? 0} total={total} warnaBar="#007800" kelasLencana="bg-brand-100 text-brand-900" />
        <KartuStatus judul="Kurang Aktif" rentang="31–180 hari" nilai={s["Kurang Aktif"] ?? 0} total={total} warnaBar="#b7791f" kelasLencana="bg-amber-100/70 text-amber-900" />
        <KartuStatus judul="Tidak Aktif" rentang="> 180 hari" nilai={s["Tidak Aktif"] ?? 0} total={total} warnaBar="#64748b" kelasLencana="bg-slate-100 text-slate-700" />
      </section>

      <section aria-label="Ringkasan transaksi" className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        <KartuRingkas judul="Total transaksi" nilai={(data.total_transaksi ?? 0).toLocaleString("id-ID")}
          ikon={<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>} />
        <KartuRingkas judul="Total nilai transaksi" nilai={rupiahPenuh(data.total_nilai_transaksi ?? 0)}
          ikon={<><rect x="3" y="6" width="18" height="13" rx="3" /><circle cx="12" cy="12.5" r="2.5" /><path d="M7 3h10" /></>} />
        <KartuRingkas
          judul="Jumlah segmen optimal"
          nilai={data.k_optimal ? String(data.k_optimal) : "–"}
          catatan={data.silhouette_optimal != null ? `Silhouette ${data.silhouette_optimal.toLocaleString("id-ID", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}` : undefined}
          ikon={<><circle cx="8" cy="9" r="4" /><circle cx="16" cy="9" r="4" /><circle cx="12" cy="16" r="4" /></>}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <TrenBatang data={(data.omzet_bulanan ?? []).slice(-6)} />
        <DonatSegmen segmen={data.pelanggan_per_segmen ?? []} />
      </div>

      <Panel
        judul="Aturan asosiasi dengan lift tertinggi"
        aksi={data.aturan_lift_tertinggi?.length ? (
          <Link href="/pola" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700 hover:text-brand-800">
            Lihat semua pola
            <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true" {...garis} strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        ) : undefined}
      >
        {data.aturan_lift_tertinggi?.length ? (
          <div className="bingkai-tabel">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Jika membeli</th>
                  <th>Maka juga membeli</th>
                  <th>Segmen</th>
                  <th className="text-right">Support</th>
                  <th className="text-right">Confidence</th>
                  <th className="text-right">Lift</th>
                </tr>
              </thead>
              <tbody>
                {data.aturan_lift_tertinggi.map((a, i) => (
                  <tr key={i} className="align-top">
                    <td>{a.antecedent}</td>
                    <td>{a.consequent}</td>
                    <td>
                      <span className="lencana" style={gayaLencanaSegmen(nomorSegmen[a.segmen] ?? 1)}>
                        <span className="size-2 rounded-full" style={{ background: warnaSegmen(nomorSegmen[a.segmen] ?? 1) }} />
                        {a.segmen}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">{persen(a.support)}</td>
                    <td className="text-right tabular-nums">{persen(a.confidence, 0)}</td>
                    <td className="text-right font-bold text-brand-900 tabular-nums">{a.lift.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-teks-2">
            Belum ada aturan asosiasi. Jalankan <Link href="/pola" className="tautan">Analisis Pola Pembelian</Link>.
          </p>
        )}
      </Panel>
    </div>
  );
}
