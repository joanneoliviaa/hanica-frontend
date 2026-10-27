"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ambilPengguna, ambilToken, hapusToken } from "@/lib/api";

const garis = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const IKON: Record<string, React.ReactNode> = {
  "/dashboard": (
    <>
      <rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" />
      <rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" />
    </>
  ),
  "/data": <path d="M4 5h16M4 12h16M4 19h10" />,
  "/segmentasi": (
    <>
      <circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
      <circle cx="17" cy="9" r="2.5" /><path d="M17 14.5c2.3 0 4 1.5 4.5 4" />
    </>
  ),
  "/pola": (
    <>
      <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="7" r="2.5" /><circle cx="12" cy="18" r="2.5" />
      <path d="M8.3 7.2l7.3.6M7.2 8.2l3.7 7.6M16.8 9.2l-3.6 6.8" />
    </>
  ),
  "/rekomendasi": (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" />
    </>
  ),
  "/panduan": (
    <>
      <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 016.5 18H20v3H6.5" />
    </>
  ),
};

const MENU = [
  { href: "/dashboard", nama: "Dashboard" },
  { href: "/data", nama: "Data Transaksi" },
  { href: "/segmentasi", nama: "Segmentasi Pelanggan" },
  { href: "/pola", nama: "Analisis Pola Pembelian" },
  { href: "/rekomendasi", nama: "Rekomendasi CRM" },
  { href: "/panduan", nama: "Panduan Pengguna" },
];

export default function TataLetakAplikasi({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const lokasi = usePathname();
  const [pengguna, setPengguna] = useState("");
  const [bukaMenu, setBukaMenu] = useState(false);

  // Tutup menu HP setiap kali pindah halaman
  useEffect(() => setBukaMenu(false), [lokasi]);

  useEffect(() => {
    if (!ambilToken()) router.replace("/login");
    setPengguna(ambilPengguna());
  }, [router]);

  function keluar() {
    hapusToken();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-800 lg:flex-row">
      <aside className="sticky top-0 z-30 shrink-0 bg-brand-800 px-4 py-3 text-white sm:px-6 lg:flex lg:h-screen lg:w-[264px] lg:flex-col lg:gap-7 lg:px-[18px] lg:pb-6 lg:pt-7">
        <div className="flex items-center justify-between gap-3">
          <img src="/hanica-insight-logo-putih.svg" alt="Hanica Insight, PT. Hanica Sukses Makmur" className="ml-1 h-auto w-[150px] sm:w-[170px] lg:ml-1.5 lg:w-[196px]" />
          <button
            type="button"
            onClick={() => setBukaMenu((b) => !b)}
            aria-expanded={bukaMenu}
            aria-controls="menu-aplikasi"
            aria-label={bukaMenu ? "Tutup menu" : "Buka menu"}
            className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-100 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" {...garis} strokeWidth={2}>
              {bukaMenu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        <div id="menu-aplikasi" className={`${bukaMenu ? "flex" : "hidden"} max-h-[calc(100dvh-4.5rem)] flex-col gap-5 overflow-y-auto pb-3 pt-4 lg:flex lg:max-h-none lg:flex-1 lg:gap-7 lg:overflow-visible lg:p-0`}>
        <nav aria-label="Menu utama" className="flex flex-col gap-1">
          <p className="mb-1.5 ml-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-200">Menu</p>
          {MENU.map((m) => {
            const aktif = lokasi.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                aria-current={aktif ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-full px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-100 ${
                  aktif ? "bg-brand-100 font-semibold text-brand-900" : "font-medium text-brand-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" aria-hidden="true" {...garis}>{IKON[m.href]}</svg>
                {m.nama}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 border-t border-white/15 pt-4 lg:mt-auto lg:flex-col lg:items-stretch lg:border-0 lg:pt-0">
          {pengguna && (
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[20px] bg-white/[0.08] px-3 py-2.5 lg:flex-none">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold uppercase text-brand-900">
                {pengguna.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{pengguna}</p>
              </div>
            </div>
          )}
          <button
            onClick={keluar}
            className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/30 px-5 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-100"
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" {...garis}>
              <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h11" />
            </svg>
            Keluar
          </button>
        </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 rounded-t-[28px] bg-latar px-4 pb-12 pt-6 sm:px-8 sm:pt-7 lg:rounded-tr-none lg:rounded-tl-[36px] lg:px-10 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
