"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { masuk } from "@/lib/api";
import { IlustrasiDashboard, IlustrasiPola, IlustrasiRekomendasi, IlustrasiSegmentasi } from "./Ilustrasi";

const SLIDE = [
  {
    Gambar: IlustrasiDashboard,
    judul: "Data transaksi jadi ringkasan",
    teks: "Omzet, jumlah transaksi, dan keaktifan pelanggan terbaca dalam satu dashboard.",
  },
  {
    Gambar: IlustrasiSegmentasi,
    judul: "Pelanggan dikelompokkan otomatis",
    teks: "RFM dan Fuzzy C-Means memetakan setiap pelanggan ke segmen sesuai pola belanjanya.",
  },
  {
    Gambar: IlustrasiPola,
    judul: "Produk yang sering dibeli bersama",
    teks: "FP-Growth menemukan kombinasi produk yang berulang muncul di tiap segmen.",
  },
  {
    Gambar: IlustrasiRekomendasi,
    judul: "Rekomendasi tindakan per segmen",
    teks: "Strategi CRM disusun sesuai karakteristik masing-masing segmen pelanggan.",
  },
];

const JEDA_MS = 3000;

function Carousel() {
  const [aktif, setAktif] = useState(0);
  const [ditahan, setDitahan] = useState(false); // hover / fokus
  const [dijeda, setDijeda] = useState(false); // tombol jeda

  useEffect(() => {
    if (ditahan || dijeda) return;
    const t = setTimeout(() => setAktif((i) => (i + 1) % SLIDE.length), JEDA_MS);
    return () => clearTimeout(t);
  }, [aktif, ditahan, dijeda]);

  const berhenti = ditahan || dijeda;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Fitur sistem"
      className="relative mx-auto flex h-full max-w-[680px] flex-col px-12 pb-14 pt-12 xl:px-16"
      onMouseEnter={() => setDitahan(true)}
      onMouseLeave={() => setDitahan(false)}
      onFocus={() => setDitahan(true)}
      onBlur={() => setDitahan(false)}
    >
      <img
        src="/hanica-insight-logo.svg"
        alt="Hanica Insight, PT. Hanica Sukses Makmur"
        className="-ml-1 h-[76px] w-auto self-start"
      />

      <div className="relative mt-4 min-h-0 flex-1 overflow-hidden">
        <div
          className="flex h-full motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-[cubic-bezier(.65,0,.35,1)]"
          style={{ transform: `translateX(-${aktif * 100}%)` }}
        >
          {SLIDE.map(({ Gambar, judul, teks }, i) => (
            <div
              key={judul}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${SLIDE.length}`}
              aria-hidden={i !== aktif}
              className="flex h-full w-full shrink-0 flex-col pr-8"
            >
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <div className="aspect-[440/320] w-full max-w-[540px]">
                  <Gambar />
                </div>
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-brand-900">{judul}</h2>
              <p className="mt-2 max-w-[36ch] text-[15px] leading-relaxed text-slate-600">{teks}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex items-center gap-3">
        <div className="flex items-center gap-2">
          {SLIDE.map((s, i) => (
            <button
              key={s.judul}
              type="button"
              onClick={() => setAktif(i)}
              aria-label={`Tampilkan slide ${i + 1}: ${s.judul}`}
              aria-current={i === aktif}
              className="relative h-2 overflow-hidden rounded-full bg-brand-200 transition-[width] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              style={{ width: i === aktif ? 40 : 8 }}
            >
              {i === aktif && (
                <span
                  key={`${aktif}-${berhenti}`}
                  className={`absolute inset-y-0 left-0 rounded-full bg-brand-700 ${berhenti ? "w-full" : "progres-slide"}`}
                  style={{ animationDuration: `${JEDA_MS}ms` }}
                />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDijeda((p) => !p)}
          aria-label={dijeda ? "Putar slide otomatis" : "Jeda slide otomatis"}
          className="ml-1 grid size-7 place-items-center rounded-full text-brand-800 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-brand-700"
        >
          {dijeda ? (
            <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" /></svg>
          ) : (
            <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1" /><rect x="9.5" y="2.5" width="3" height="11" rx="1" /></svg>
          )}
        </button>
      </div>
    </section>
  );
}

export default function HalamanLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [galat, setGalat] = useState("");
  const [memuat, setMemuat] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setGalat("");
    setMemuat(true);
    try {
      await masuk(username, password);
      router.replace("/dashboard");
    } catch (err) {
      // fetch melempar TypeError bila server backend tidak bisa dihubungi
      setGalat(
        err instanceof TypeError
          ? "Tidak dapat terhubung ke server. Pastikan backend sudah berjalan, lalu coba lagi."
          : err instanceof Error
            ? err.message
            : "Terjadi kesalahan."
      );
    } finally {
      setMemuat(false);
    }
  }

  const kelasInput =
    "mt-2 block w-full rounded-full border border-white/25 bg-white/[0.06] px-5 py-3 text-[15px] text-white placeholder:text-white/40 outline-none transition-colors hover:border-white/40 focus:border-brand-200 focus:bg-white/10 focus:ring-4 focus:ring-brand-200/15";

  return (
    <main className="min-h-screen bg-brand-800">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        {/* Panel ilustrasi */}
        <div className="relative hidden bg-brand-50 lg:block">
          <Carousel />
          {/* Lengkung pemisah ke panel form */}
          <svg
            className="pointer-events-none absolute inset-y-0 -right-px h-full w-28"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M100 0 H58 C30 14 30 26 52 40 C78 56 78 70 50 84 C36 91 34 96 40 100 H100 Z" fill="#005f00" />
          </svg>
        </div>

        {/* Panel form */}
        <div className="flex items-center justify-center px-7 py-12 text-white sm:px-12 lg:px-16">
          <div className="w-full max-w-[440px]">
          <img
            src="/hanica-insight-logo-putih.svg"
            alt="Hanica Insight, PT. Hanica Sukses Makmur"
            className="-ml-1 mb-10 h-[76px] w-auto lg:hidden"
          />

          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight">Selamat datang kembali!</h1>
          <p className="mt-2 max-w-[34ch] text-[15px] leading-relaxed text-brand-100/80">
            Masuk untuk melihat segmentasi pelanggan, pola pembelian, dan rekomendasi CRM.
          </p>

          <form onSubmit={kirim} className="mt-9">
            <label className="block pl-5 text-sm font-medium text-brand-100" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              placeholder="Masukkan username"
              className={kelasInput}
            />

            <label className="mt-5 block pl-5 text-sm font-medium text-brand-100" htmlFor="password">
              Kata sandi
            </label>
            <div className="relative">
              <input
                id="password"
                type={lihatSandi ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
                className={`${kelasInput} pr-14`}
              />
              <button
                type="button"
                onClick={() => setLihatSandi((v) => !v)}
                aria-label={lihatSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                aria-pressed={lihatSandi}
                className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-brand-100/70 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-200"
              >
                {lihatSandi ? (
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9 4.5 10 7a13 13 0 01-3.2 4.2M6.6 6.6C4.3 8 2.7 10.2 2 12c1 2.5 5 7 10 7a9.7 9.7 0 004.4-1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {galat && (
              <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-5 py-3 text-sm text-red-700">
                {galat}
              </p>
            )}

            <button
              type="submit"
              disabled={memuat}
              className="mt-8 w-full rounded-full bg-brand-100 px-6 py-3.5 text-[15px] font-semibold text-brand-900 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-100 disabled:cursor-wait disabled:opacity-70"
            >
              {memuat ? "Memeriksa…" : "Masuk"}
            </button>
          </form>

          <p className="mt-8 max-w-[40ch] text-sm leading-relaxed text-brand-100/70">
            Lupa kata sandi atau belum punya akun? Hubungi administrator sistem.
          </p>
          </div>
        </div>
      </div>
    </main>
  );
}
