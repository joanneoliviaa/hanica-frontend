"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SesiBerakhir, apiFetch, LENCANA_STATUS, gayaLencanaSegmen, warnaSegmen } from "@/lib/api";
import { KerangkaSegmentasi } from "@/components/Kerangka";

type Status = "Aktif" | "Kurang Aktif" | "Tidak Aktif";
const STATUS: Status[] = ["Aktif", "Kurang Aktif", "Tidak Aktif"];

type Klaster = {
  cluster_id: number;
  nomor: number;
  label: string;
  skor_loyalitas: number;
  pusat: number[];
  jumlah_pelanggan: number;
  status_keaktifan: Record<Status, number>;
};
type Anggota = {
  customer_id: number;
  nama: string;
  recency: number;
  frequency: number;
  monetary: number;
  recency_norm: number;
  frequency_norm: number;
  monetary_norm: number;
  status_keaktifan: Status;
  segmen: string;
  keanggotaan: Record<string, number>;
  profil: {
    transaksi_pertama: string;
    transaksi_terakhir: string;
    lama_berlangganan_hari: number;
    rata_rata_nilai_faktur: number;
    jumlah_jenis_produk: number;
    produk_favorit: string;
    daftar_produk?: { nama: string; jumlah_faktur: number }[];
  };
};
type Hasil = {
  siap: boolean;
  detail?: string;
  k_optimal?: number;
  silhouette_per_k?: Record<string, number>;
  klaster?: Klaster[];
  anggota?: Anggota[];
};

const rupiah = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");
const desimal = (n: number, d = 4) => n.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
const PER_HALAMAN = 10;

const tanggal = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

// Warna segmen versi terang untuk dipakai di atas panel hijau tua
const WARNA_TERANG = ["#fb923c", "#5eead4", "#93c5fd", "#c4b5fd", "#fcd34d"];

const garis = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function GrafikSilhouette({ data, kOptimal }: { data: Record<string, number>; kOptimal: number }) {
  const ks = Object.keys(data).map(Number).sort((a, b) => a - b);
  const W = 420, H = 220, kiri = 40, bawah = 32, atas = 16;
  const maks = Math.max(...Object.values(data), 0.1) * 1.15;
  const lebar = (W - kiri - 10) / ks.length;
  const y = (v: number) => H - bawah - (v / maks) * (H - bawah - atas);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Grafik nilai Silhouette untuk setiap jumlah klaster">
      {[0, 0.25, 0.5, 0.75].filter((t) => t <= maks).map((t) => (
        <g key={t}>
          <line x1={kiri} x2={W - 10} y1={y(t)} y2={y(t)} stroke="#e7efe6" />
          <text x={kiri - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5b6675">{t.toLocaleString("id-ID")}</text>
        </g>
      ))}
      {ks.map((k, i) => {
        const v = data[String(k)];
        const x = kiri + i * lebar + lebar * 0.2;
        const terpilih = k === kOptimal;
        return (
          <g key={k}>
            <rect x={x} y={y(v)} width={lebar * 0.6} height={H - bawah - y(v)} rx="6" fill={terpilih ? "#007800" : "#d5e4d4"} />
            <text x={x + lebar * 0.3} y={y(v) - 5} textAnchor="middle" fontSize="11" fontWeight={terpilih ? 700 : 400} fill={terpilih ? "#004a00" : "#33463a"}>
              {desimal(v)}
            </text>
            <text x={x + lebar * 0.3} y={H - 12} textAnchor="middle" fontSize="12" fontWeight={terpilih ? 700 : 400} fill={terpilih ? "#004a00" : "#4b5a52"}>k = {k}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Sebar({
  anggota, klaster, sumbuX, sumbuY, pilihan, setPilihan,
}: {
  anggota: Anggota[]; klaster: Klaster[]; sumbuX: "recency" | "frequency" | "monetary"; sumbuY: "recency" | "frequency" | "monetary";
  pilihan: number | null; setPilihan: (id: number | null) => void;
}) {
  const W = 560, H = 320, p = { k: 52, b: 42, a: 12, r: 14 };
  const nilai = (a: Anggota, s: string) => (a as unknown as Record<string, number>)[`${s}_norm`];
  const nomor = Object.fromEntries(klaster.map((k) => [k.label, k.nomor]));
  const x = (v: number) => p.k + v * (W - p.k - p.r);
  const y = (v: number) => H - p.b - v * (H - p.b - p.a);
  const nama = { recency: "Recency", frequency: "Frequency", monetary: "Monetary" };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]" role="img" aria-label="Sebaran pelanggan menurut nilai RFM ternormalisasi">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={p.a} y2={H - p.b} stroke="#eef3ee" />
          <line x1={p.k} x2={W - p.r} y1={y(t)} y2={y(t)} stroke="#eef3ee" />
          <text x={x(t)} y={H - p.b + 15} textAnchor="middle" fontSize="11" fill="#5b6675">{t.toLocaleString("id-ID")}</text>
          <text x={p.k - 7} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5b6675">{t.toLocaleString("id-ID")}</text>
        </g>
      ))}
      <text x={(W + p.k) / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="#33463a">{nama[sumbuX]} (ternormalisasi)</text>
      <text transform={`translate(13 ${(H - p.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="#33463a">{nama[sumbuY]} (ternormalisasi)</text>
      {anggota.map((a) => {
        const n = nomor[a.segmen] ?? 1;
        const dipilih = pilihan === a.customer_id;
        return (
          <circle
            key={a.customer_id}
            cx={x(nilai(a, sumbuX))} cy={y(nilai(a, sumbuY))} r={dipilih ? 7.5 : 4.5}
            fill={warnaSegmen(n)} fillOpacity={dipilih ? 1 : 0.6}
            stroke={dipilih ? "#0f172a" : "#fff"} strokeWidth={dipilih ? 2.5 : 1}
            className="cursor-pointer" onClick={() => setPilihan(dipilih ? null : a.customer_id)}
          >
            <title>{`${a.nama} — ${a.segmen}`}</title>
          </circle>
        );
      })}
      {klaster.map((k) => {
        const idx = { recency: 0, frequency: 1, monetary: 2 };
        return (
          <g key={k.cluster_id} pointerEvents="none">
            <rect x={x(k.pusat[idx[sumbuX]]) - 6} y={y(k.pusat[idx[sumbuY]]) - 6} width="12" height="12"
              fill={warnaSegmen(k.nomor)} stroke="#0f172a" strokeWidth="2" transform={`rotate(45 ${x(k.pusat[idx[sumbuX]])} ${y(k.pusat[idx[sumbuY]])})`}>
              <title>{`Pusat klaster: ${k.label}`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

function PanelProfil({ terpilih, klaster, tutup }: { terpilih: Anggota; klaster: Klaster[]; tutup: () => void }) {
  const [bukaProduk, setBukaProduk] = useState(false);
  useEffect(() => setBukaProduk(false), [terpilih.customer_id]);
  const daftarProduk = terpilih.profil.daftar_produk ?? [];
  const urutan = Object.fromEntries(klaster.map((k) => [k.label, k.nomor]));
  const keanggotaan = Object.entries(terpilih.keanggotaan).sort((a, b) => (urutan[a[0]] ?? 0) - (urutan[b[0]] ?? 0));
  return (
    <aside id="profil-pelanggan" aria-label="Profil pelanggan" className="flex scroll-mt-6 flex-col gap-4 rounded-3xl bg-brand-800 p-6 text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-200">Profil pelanggan</p>
          <h2 className="mt-1.5 text-xl font-semibold leading-snug">{terpilih.nama}</h2>
          <p className="mt-2 flex flex-wrap gap-1.5">
            <span className="lencana bg-brand-100 text-brand-900">{terpilih.segmen}</span>
            <span className="lencana bg-white/[0.14] text-white">{terpilih.status_keaktifan}</span>
          </p>
        </div>
        <button onClick={tutup} aria-label="Tutup profil" className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-brand-100">
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" {...garis} strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-[13px]">
        {[
          ["Transaksi pertama", tanggal(terpilih.profil.transaksi_pertama)],
          ["Transaksi terakhir", tanggal(terpilih.profil.transaksi_terakhir)],
          ["Lama berlangganan", `${terpilih.profil.lama_berlangganan_hari.toLocaleString("id-ID")} hari`],
          ["Rata-rata nilai faktur", rupiah(terpilih.profil.rata_rata_nilai_faktur)],
          ["Produk favorit", terpilih.profil.produk_favorit],
        ].map(([a, b]) => (
          <div key={a} className="min-w-0"><dt className="text-brand-200">{a}</dt><dd className="mt-0.5 break-words font-semibold">{b}</dd></div>
        ))}
      </dl>
      <div className="border-t border-white/15 pt-3.5 text-[13px]">
        <button
          type="button"
          onClick={() => setBukaProduk((b) => !b)}
          disabled={daftarProduk.length === 0}
          aria-expanded={bukaProduk}
          className="flex w-full items-center justify-between gap-3 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-100 disabled:cursor-default"
        >
          <span>
            <span className="block text-brand-200">Jumlah jenis produk</span>
            <span className="mt-0.5 block font-semibold">{terpilih.profil.jumlah_jenis_produk} produk</span>
          </span>
          {daftarProduk.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">
              {bukaProduk ? "Sembunyikan" : "Lihat produk"}
              <svg viewBox="0 0 24 24" className={`size-3.5 transition-transform ${bukaProduk ? "rotate-180" : ""}`} aria-hidden="true" {...garis} strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
            </span>
          )}
        </button>
        {bukaProduk && (
          <ul className="mt-2.5 flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
            {daftarProduk.map((p) => (
              <li key={p.nama} className="flex items-start justify-between gap-3 rounded-lg bg-white/[0.07] px-3 py-2">
                <span className="min-w-0 break-words">{p.nama}</span>
                <span className="shrink-0 tabular-nums text-brand-200">{p.jumlah_faktur} faktur</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-white/15 pt-3.5">
        <p className="text-[13px] text-brand-200">Derajat keanggotaan</p>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-white/[0.12]" aria-hidden="true">
          {keanggotaan.map(([l, v]) => (
            <div key={l} style={{ width: `${v}%`, background: WARNA_TERANG[((urutan[l] ?? 1) - 1) % WARNA_TERANG.length] }} />
          ))}
        </div>
        <ul className="flex flex-col gap-1 text-xs text-brand-100">
          {keanggotaan.map(([l, v]) => (
            <li key={l} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: WARNA_TERANG[((urutan[l] ?? 1) - 1) % WARNA_TERANG.length] }} />
                {l}
              </span>
              <span className="tabular-nums">{v.toLocaleString("id-ID")}%</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default function Segmentasi() {
  const router = useRouter();
  const [data, setData] = useState<Hasil | null>(null);
  const [galat, setGalat] = useState("");
  const [berjalan, setBerjalan] = useState(false);
  const [pesan, setPesan] = useState("");
  const [saring, setSaring] = useState<"Semua" | Status>("Semua");
  const [saringSegmen, setSaringSegmen] = useState("Semua");
  const [cari, setCari] = useState("");
  const [pilihan, setPilihan] = useState<number | null>(null);
  const [halaman, setHalaman] = useState(1);
  const refDaftar = useRef<HTMLElement>(null);
  const [sumbuX, setSumbuX] = useState<"recency" | "frequency" | "monetary">("recency");
  const [sumbuY, setSumbuY] = useState<"recency" | "frequency" | "monetary">("monetary");

  const muat = useCallback(async () => {
    try {
      setData(await apiFetch<Hasil>("/api/analytics/segmentation"));
    } catch (e) {
      if (e instanceof SesiBerakhir) router.replace("/login");
      else setGalat((e as Error).message);
    }
  }, [router]);

  useEffect(() => {
    muat();
  }, [muat]);

  async function jalankan() {
    setBerjalan(true);
    setGalat("");
    setPesan("");
    try {
      const r = await apiFetch<{ detail: string; k_optimal: number }>("/api/analytics/segmentation/run", { method: "POST" });
      setPesan(`${r.detail} Jumlah klaster optimal: k = ${r.k_optimal}.`);
      setPilihan(null);
      await muat();
    } catch (e) {
      if (e instanceof SesiBerakhir) router.replace("/login");
      else setGalat((e as Error).message);
    } finally {
      setBerjalan(false);
    }
  }

  const tampil = useMemo(() => {
    const a = data?.anggota ?? [];
    return a.filter(
      (m) =>
        (saring === "Semua" || m.status_keaktifan === saring) &&
        (saringSegmen === "Semua" || m.segmen === saringSegmen) &&
        m.nama.toLowerCase().includes(cari.trim().toLowerCase())
    );
  }, [data, saring, saringSegmen, cari]);

  // Kembali ke halaman 1 setiap kali penyaringan berubah
  useEffect(() => setHalaman(1), [saring, saringSegmen, cari]);

  const jumlahHalaman = Math.max(1, Math.ceil(tampil.length / PER_HALAMAN));
  const halamanAman = Math.min(halaman, jumlahHalaman);
  const awal = (halamanAman - 1) * PER_HALAMAN;
  const barisTampil = tampil.slice(awal, awal + PER_HALAMAN);

  function lihatSegmen(label: string) {
    setSaringSegmen(label);
    setSaring("Semua");
    setCari("");
    setHalaman(1);
    requestAnimationFrame(() => refDaftar.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function pilihDariTabel(id: number) {
    setPilihan(id);
    requestAnimationFrame(() => document.getElementById("profil-pelanggan")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const terpilih = data?.anggota?.find((m) => m.customer_id === pilihan) ?? null;
  const nomorSegmen = Object.fromEntries((data?.klaster ?? []).map((k) => [k.label, k.nomor]));

  // Tata letak kartu klaster menyesuaikan jumlah klaster (k).
  // k ≤ 3: grafik Silhouette di kiri, kartu klaster di kanan.
  // k ≥ 4: grafik Silhouette satu baris penuh, kartu klaster berjajar di bawahnya.
  const banyakKlaster = data?.klaster?.length ?? 0;
  const klasterBanyak = banyakKlaster >= 4;
  const kelasBagianKlaster = klasterBanyak ? "grid gap-4" : "grid gap-4 xl:grid-cols-5";
  const kelasKartuSilhouette = klasterBanyak ? "kartu lg:flex lg:items-start lg:gap-10" : "kartu xl:col-span-2";
  const kelasGridKlaster =
    banyakKlaster >= 5
      ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      : banyakKlaster === 4
        ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        : "grid gap-4 sm:grid-cols-3 xl:col-span-3";
  // Samakan tinggi judul kartu (2 baris) bila kartunya sempit sehingga judul panjang bisa turun baris
  const kelasJudulKlaster = banyakKlaster === 4
    ? "text-lg font-semibold leading-snug"
    : "text-lg font-semibold leading-snug sm:min-h-[3.1rem]";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="judul-halaman">Segmentasi Pelanggan</h1>
          <p className="deskripsi-halaman">
            Pengelompokan pelanggan berdasarkan Recency, Frequency, dan Monetary dengan Fuzzy C-Means.
          </p>
        </div>
        <button onClick={jalankan} disabled={berjalan} className="tombol-utama">
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" {...garis} strokeWidth={2}><path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" /></svg>
          {berjalan ? "Memproses…" : data?.siap ? "Jalankan ulang segmentasi" : "Jalankan segmentasi"}
        </button>
      </header>

      {galat && <p role="alert" className="notif-galat">{galat}</p>}
      {pesan && <p role="status" className="notif-sukses">{pesan}</p>}
      {!data && !galat && <KerangkaSegmentasi />}
      {data && !data.siap && (
        <p className="kosong">
          {data.detail} Tekan tombol <b>Jalankan segmentasi</b> untuk menghitung RFM dan mengelompokkan pelanggan
          (pastikan data transaksi sudah diunggah).
        </p>
      )}

      {data?.siap && data.klaster && data.anggota && data.silhouette_per_k && (
        <>
          <section className={kelasBagianKlaster}>
            <div className={kelasKartuSilhouette}>
              <div className={klasterBanyak ? "lg:w-64 lg:shrink-0" : ""}>
              <h2 className="judul-kartu">Penentuan jumlah klaster</h2>
              <p className="mt-1 text-[13px] text-teks-3">
                Nilai Silhouette tertinggi dipilih: k = {data.k_optimal}.
              </p>
              </div>
              <div className={`mt-3 ${klasterBanyak ? "mx-auto w-full max-w-xl lg:mx-0 lg:mt-0 lg:flex-1" : ""}`}>
                <GrafikSilhouette data={data.silhouette_per_k} kOptimal={data.k_optimal!} />
              </div>
            </div>

            <div className={kelasGridKlaster}>
              {data.klaster.map((k) => (
                <button
                  key={k.cluster_id}
                  type="button"
                  onClick={() => lihatSegmen(k.label)}
                  aria-label={`Lihat daftar pelanggan ${k.label}`}
                  className={`group flex flex-col gap-3 rounded-3xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                    saringSegmen === k.label ? "border-brand-700 ring-2 ring-brand-700/15" : "border-garis"
                  }`}
                >
                  <span className="lencana self-start" style={gayaLencanaSegmen(k.nomor)}>
                    <span className="size-2 rounded-full" style={{ background: warnaSegmen(k.nomor) }} />
                    Klaster {k.nomor}
                  </span>
                  <h3 className={kelasJudulKlaster}>{k.label}</h3>
                  <p className="text-[1.875rem] font-bold leading-none tracking-tight tabular-nums">
                    {k.jumlah_pelanggan} <span className="text-[13px] font-medium tracking-normal text-teks-3">pelanggan</span>
                  </p>
                  <ul className="flex flex-col gap-1.5 border-t border-[#eef3ee] pt-3 text-[13px]">
                    {STATUS.map((s) => (
                      <li key={s} className="flex justify-between">
                        <span className="text-teks-2">{s}</span>
                        <b className="tabular-nums">{k.status_keaktifan[s]}</b>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto text-xs leading-relaxed text-teks-3">
                    <p>Skor loyalitas {desimal(k.skor_loyalitas)}</p>
                    <p>Pusat (R, F, M): {k.pusat.map((v) => desimal(v)).join(" · ")}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700 group-hover:text-brand-800">
                    Lihat daftar pelanggan
                    <svg viewBox="0 0 24 24" className="size-3.5 transition-transform group-hover:translate-y-0.5" aria-hidden="true" {...garis} strokeWidth={2}><path d="M12 5v14M6 13l6 6 6-6" /></svg>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className={`grid gap-4 ${terpilih ? "xl:grid-cols-3" : ""}`}>
            <div className={`kartu min-w-0 ${terpilih ? "xl:col-span-2" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="judul-kartu">Sebaran pelanggan</h2>
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-teks-2">
                  <label className="flex items-center gap-2">Sumbu X
                    <select value={sumbuX} onChange={(e) => setSumbuX(e.target.value as typeof sumbuX)} className="input min-h-9 text-[13px]">
                      <option value="recency">Recency</option><option value="frequency">Frequency</option><option value="monetary">Monetary</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2">Sumbu Y
                    <select value={sumbuY} onChange={(e) => setSumbuY(e.target.value as typeof sumbuY)} className="input min-h-9 text-[13px]">
                      <option value="recency">Recency</option><option value="frequency">Frequency</option><option value="monetary">Monetary</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className={`mx-auto mt-3 overflow-x-auto ${terpilih ? "max-w-3xl" : "max-w-4xl"}`}>
                <Sebar anggota={data.anggota} klaster={data.klaster} sumbuX={sumbuX} sumbuY={sumbuY} pilihan={pilihan} setPilihan={setPilihan} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#33463a]">
                {data.klaster.map((k) => (
                  <span key={k.cluster_id} className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-full" style={{ background: warnaSegmen(k.nomor) }} />
                    {k.label}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5"><span className="inline-block size-2.5 rotate-45 border-2 border-slate-900 bg-slate-300" />Pusat klaster</span>
                <span className="text-teks-3">Klik titik untuk melihat profil pelanggan.</span>
              </div>
            </div>

            {terpilih && <PanelProfil terpilih={terpilih} klaster={data.klaster} tutup={() => setPilihan(null)} />}
          </section>

          <section ref={refDaftar} id="daftar-pelanggan" className="kartu scroll-mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="judul-kartu">
                Daftar pelanggan <span className="text-[13px] font-medium text-teks-3">({tampil.length} dari {data.anggota.length})</span>
              </h2>
              <div className="flex w-full flex-wrap gap-2 lg:w-auto">
                <label className="relative flex w-full items-center sm:w-auto">
                  <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 size-4 text-teks-3" aria-hidden="true" {...garis} strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
                  </svg>
                  <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama pelanggan" aria-label="Cari nama pelanggan" className="input w-full bg-isian pl-10 sm:w-60" />
                </label>
                <select value={saring} onChange={(e) => setSaring(e.target.value as typeof saring)} className="input flex-1 sm:flex-none" aria-label="Saring status keaktifan">
                  <option value="Semua">Semua status</option>{STATUS.map((s) => <option key={s}>{s}</option>)}
                </select>
                <select value={saringSegmen} onChange={(e) => setSaringSegmen(e.target.value)} className="input flex-1 sm:flex-none" aria-label="Saring segmen">
                  <option value="Semua">Semua segmen</option>{data.klaster.map((k) => <option key={k.cluster_id}>{k.label}</option>)}
                </select>
              </div>
            </div>
            <div className="bingkai-tabel mt-4">
              <table className="tabel min-w-[860px]">
                <thead>
                  <tr>
                    <th>Pelanggan</th>
                    <th className="text-right">Recency (hari)</th>
                    <th className="text-right">Frequency</th>
                    <th className="text-right">Monetary</th>
                    <th>Status</th>
                    <th>Segmen</th>
                    <th>Keanggotaan</th>
                  </tr>
                </thead>
                <tbody>
                  {barisTampil.map((m) => (
                    <tr key={m.customer_id} onClick={() => pilihDariTabel(m.customer_id)}
                      className={`cursor-pointer transition-colors hover:bg-isian ${pilihan === m.customer_id ? "bg-brand-50 font-medium" : ""}`}>
                      <td>{m.nama}</td>
                      <td className="text-right tabular-nums">{m.recency.toLocaleString("id-ID")}</td>
                      <td className="text-right tabular-nums">{m.frequency}</td>
                      <td className="text-right tabular-nums">{rupiah(m.monetary)}</td>
                      <td><span className={`lencana ${LENCANA_STATUS[m.status_keaktifan]}`}>{m.status_keaktifan}</span></td>
                      <td>
                        <span className="lencana" style={gayaLencanaSegmen(nomorSegmen[m.segmen] ?? 1)}>
                          <span className="size-2 rounded-full" style={{ background: warnaSegmen(nomorSegmen[m.segmen] ?? 1) }} />
                          {m.segmen.replace("Loyalitas ", "")}
                        </span>
                      </td>
                      <td className="text-xs font-normal text-teks-2">
                        {Object.entries(m.keanggotaan).map(([l, v]) => `${v.toLocaleString("id-ID")}% ${l.replace("Loyalitas ", "")}`).join(" · ")}
                      </td>
                    </tr>
                  ))}
                  {tampil.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-teks-3">Tidak ada pelanggan yang cocok dengan penyaringan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {tampil.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px]">
                <p className="text-teks-3">
                  Menampilkan {awal + 1}–{awal + barisTampil.length} dari {tampil.length} pelanggan
                  {saringSegmen !== "Semua" && (
                    <> · segmen <b className="font-semibold text-brand-900">{saringSegmen}</b>{" "}
                      <button onClick={() => setSaringSegmen("Semua")} className="font-semibold text-brand-700 hover:underline">(hapus saringan)</button>
                    </>
                  )}
                </p>
                {jumlahHalaman > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setHalaman(1)} disabled={halamanAman <= 1} className="tombol-halaman" aria-label="Halaman pertama">«<span className="hidden sm:inline">&nbsp;Awal</span></button>
                    <button onClick={() => setHalaman(halamanAman - 1)} disabled={halamanAman <= 1} className="tombol-halaman" aria-label="Halaman sebelumnya">‹<span className="hidden sm:inline">&nbsp;Sebelumnya</span></button>
                    <span className="whitespace-nowrap px-1 tabular-nums text-teks-2 sm:px-2"><span className="hidden sm:inline">Halaman </span>{halamanAman} dari {jumlahHalaman}</span>
                    <button onClick={() => setHalaman(halamanAman + 1)} disabled={halamanAman >= jumlahHalaman} className="tombol-halaman" aria-label="Halaman berikutnya"><span className="hidden sm:inline">Berikutnya&nbsp;</span>›</button>
                    <button onClick={() => setHalaman(jumlahHalaman)} disabled={halamanAman >= jumlahHalaman} className="tombol-halaman" aria-label="Halaman terakhir"><span className="hidden sm:inline">Akhir&nbsp;</span>»</button>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
