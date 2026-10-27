"use client";

// Skeleton (kerangka) yang tampil selama data dimuat dari server.
import { useEffect, useState } from "react";

/** Balok abu-hijau berdenyut — bahan dasar semua skeleton. */
export function Tulang({ className = "" }: { className?: string }) {
  const sudut = className.includes("rounded-") ? "" : "rounded-full";
  return <span aria-hidden="true" className={`block bg-brand-100/70 motion-safe:animate-pulse ${sudut} ${className}`} />;
}

/** true setelah `ms` milidetik sejak komponen tampil — dipakai untuk pesan server lambat. */
function useLama(ms = 8000) {
  const [lama, setLama] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLama(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return lama;
}

/** Muncul kalau server belum menjawab setelah beberapa detik (server gratis sedang "bangun"). */
export function PesanServerBangun({ terang = false }: { terang?: boolean }) {
  const lama = useLama();
  if (!lama) return null;
  return (
    <p role="status" className={terang ? "mt-4 text-sm leading-relaxed text-brand-100/80" : "notif-peringatan"}>
      Server sedang dinyalakan. Jika aplikasi belum dibuka beberapa saat, proses ini bisa memakan waktu hingga 1 menit.
    </p>
  );
}

function Pembungkus({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">Memuat…</span>
      {children}
    </div>
  );
}

/** Baris-baris tabel palsu, ditaruh di dalam <tbody>. */
export function BarisKerangka({ kolom, baris = 6 }: { kolom: number; baris?: number }) {
  return (
    <>
      {Array.from({ length: baris }, (_, i) => (
        <tr key={i} aria-hidden="true">
          {Array.from({ length: kolom }, (_, j) => (
            <td key={j}><Tulang className={`h-3.5 ${j % 3 === 0 ? "w-24" : j % 3 === 1 ? "w-36" : "w-16"}`} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

function TabelKerangka({ kolom, baris = 5 }: { kolom: number; baris?: number }) {
  return (
    <div className="bingkai-tabel">
      <table className="tabel">
        <thead><tr>{Array.from({ length: kolom }, (_, j) => <th key={j}><Tulang className="h-3 w-16 bg-brand-200/60" /></th>)}</tr></thead>
        <tbody><BarisKerangka kolom={kolom} baris={baris} /></tbody>
      </table>
    </div>
  );
}

function KartuAngka({ tinggi = false }: { tinggi?: boolean }) {
  return (
    <div className="kartu flex flex-col gap-3">
      <Tulang className="h-3.5 w-24" />
      <Tulang className="h-7 w-20" />
      {tinggi && <Tulang className="h-2 w-full" />}
    </div>
  );
}

export function KerangkaDasbor() {
  return (
    <Pembungkus className="mt-6 flex flex-col gap-6">
      <PesanServerBangun />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <KartuAngka key={i} tinggi={i > 0} />)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => <KartuAngka key={i} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="kartu">
          <Tulang className="h-4 w-40" />
          <div className="mt-6 flex h-52 items-end gap-3">
            {[55, 80, 45, 95, 70, 60].map((t, i) => (
              <span key={i} aria-hidden="true" className="flex-1 rounded-t-xl bg-brand-100/70 motion-safe:animate-pulse" style={{ height: `${t}%` }} />
            ))}
          </div>
        </div>
        <div className="kartu">
          <Tulang className="h-4 w-44" />
          <div className="mt-6 flex items-center gap-6">
            <span aria-hidden="true" className="size-40 shrink-0 rounded-full border-[22px] border-brand-100/70 motion-safe:animate-pulse" />
            <div className="flex flex-1 flex-col gap-3">
              {Array.from({ length: 4 }, (_, i) => <Tulang key={i} className="h-3.5 w-full max-w-40" />)}
            </div>
          </div>
        </div>
      </div>
      <div className="kartu">
        <Tulang className="mb-4 h-4 w-56" />
        <TabelKerangka kolom={6} />
      </div>
    </Pembungkus>
  );
}

export function KerangkaSegmentasi() {
  return (
    <Pembungkus className="flex flex-col gap-5">
      <PesanServerBangun />
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="kartu flex flex-col gap-3">
          <Tulang className="h-4 w-44" />
          <Tulang className="h-3 w-32" />
          <Tulang className="mt-2 h-32 w-full rounded-2xl" />
        </div>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="kartu flex flex-col gap-3">
            <Tulang className="h-6 w-24" />
            <Tulang className="h-5 w-36" />
            <Tulang className="h-8 w-28" />
            <div className="flex flex-col gap-2 border-t border-[#eef3ee] pt-3">
              {Array.from({ length: 3 }, (_, j) => <Tulang key={j} className="h-3 w-full" />)}
            </div>
          </div>
        ))}
      </div>
      <div className="kartu">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tulang className="h-4 w-40" />
          <Tulang className="h-9 w-56" />
        </div>
        <Tulang className="mt-5 h-72 w-full rounded-2xl" />
      </div>
      <div className="kartu">
        <Tulang className="mb-4 h-4 w-48" />
        <TabelKerangka kolom={6} baris={6} />
      </div>
    </Pembungkus>
  );
}

export function KerangkaRekomendasi() {
  return (
    <Pembungkus className="flex flex-col gap-5">
      <PesanServerBangun />
      <div className="grup-tab self-start">
        {["w-28", "w-36", "w-32"].map((l) => <Tulang key={l} className={`h-10 bg-brand-200/50 ${l}`} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="kartu flex flex-col gap-3 xl:col-span-2">
          <Tulang className="h-5 w-60" />
          <Tulang className="h-3.5 w-full" />
          <Tulang className="h-3.5 w-11/12" />
          <Tulang className="h-3.5 w-4/5" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => <Tulang key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        </div>
        <div className="kartu flex flex-col gap-3">
          <Tulang className="h-4 w-36" />
          {Array.from({ length: 5 }, (_, i) => <Tulang key={i} className="h-3.5 w-full" />)}
        </div>
      </div>
    </Pembungkus>
  );
}

export function KerangkaFormPola() {
  return (
    <Pembungkus className="kartu">
      <Tulang className="h-4 w-40" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            {i < 3 && <Tulang className="ml-4 h-3 w-28" />}
            <Tulang className={`h-11 w-full ${i === 3 ? "mt-auto bg-brand-200/60" : ""}`} />
          </div>
        ))}
      </div>
    </Pembungkus>
  );
}

export function KerangkaHasilPola() {
  return (
    <Pembungkus className="kartu flex flex-col gap-4">
      <PesanServerBangun />
      <Tulang className="h-3.5 w-full max-w-md" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }, (_, i) => <Tulang key={i} className="h-10 w-28" />)}
      </div>
      <TabelKerangka kolom={5} baris={6} />
    </Pembungkus>
  );
}
