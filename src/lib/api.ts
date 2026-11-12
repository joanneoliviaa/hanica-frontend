export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const KUNCI_AKSES = "hanica_access";
const KUNCI_PENGGUNA = "hanica_user";
const KUNCI_REFRESH = "hanica_refresh";

export function ambilToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(KUNCI_AKSES);
}

export function simpanToken(akses: string, refresh: string) {
  localStorage.setItem(KUNCI_AKSES, akses);
  localStorage.setItem(KUNCI_REFRESH, refresh);
}

export function hapusToken() {
  localStorage.removeItem(KUNCI_AKSES);
  localStorage.removeItem(KUNCI_REFRESH);
  localStorage.removeItem(KUNCI_PENGGUNA);
}

export function ambilPengguna(): string {
  return typeof window === "undefined" ? "" : localStorage.getItem(KUNCI_PENGGUNA) ?? "";
}

export async function masuk(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error(
      res.status === 401 ? "Nama pengguna atau kata sandi salah." : "Tidak dapat terhubung ke server."
    );
  }
  const data = await res.json();
  simpanToken(data.access, data.refresh);
  localStorage.setItem(KUNCI_PENGGUNA, username);
}

async function segarkanToken(): Promise<boolean> {
  const refresh = localStorage.getItem(KUNCI_REFRESH);
  if (!refresh) return false;
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  simpanToken(data.access, data.refresh ?? refresh);
  return true;
}

export class SesiBerakhir extends Error {}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const kirim = () => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${ambilToken()}`);
    if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(`${API_URL}${path}`, { ...init, headers });
  };

  let res = await kirim();
  if (res.status === 401 && (await segarkanToken())) res = await kirim();
  if (res.status === 401) {
    hapusToken();
    throw new SesiBerakhir("Sesi berakhir, silakan masuk kembali.");
  }
  if (!res.ok) {
    const isi = await res.json().catch(() => null);
    throw new Error(isi?.detail ?? `Permintaan gagal (${res.status}).`);
  }
  return res.json() as Promise<T>;
}

export async function apiUnduh(path: string) : Promise<Blob> {
  const kirim = () => fetch (`${API_URL}${path}`,  { headers: { "Authorization": `Bearer ${ambilToken()}` } });
  let res = await kirim();
  if (res.status === 401 && (await segarkanToken())) res = await kirim();
  if (res.status === 401) {
    hapusToken();
    throw new SesiBerakhir("Sesi berakhir, silakan masuk kembali.");
  }
  if (!res.ok) {
    const isi = await res.json().catch(() => null);
    throw new Error(isi?.detail ?? `Unduhan gagal (${res.status}).`);
  }
  return res.blob();
}

// ---------- Tema warna halaman aplikasi ----------
// Warna bersama halaman aplikasi. Urutan segmen: klaster 1 = loyalitas terendah.
export const WARNA_SEGMEN = ["#c2410c", "#0f766e", "#1d4ed8", "#7c3aed", "#a16207"];
const LATAR_SEGMEN = ["#fdeee6", "#e3f4f1", "#eaf3ff", "#f3edff", "#fbf3e0"];
const TEKS_SEGMEN = ["#8a2e07", "#0b5a54", "#1d3f9e", "#5b21b6", "#6b4100"];

const indeks = (nomor: number) => (Math.max(nomor, 1) - 1) % WARNA_SEGMEN.length;
export const warnaSegmen = (nomor: number) => WARNA_SEGMEN[indeks(nomor)];
export const gayaLencanaSegmen = (nomor: number) => ({ background: LATAR_SEGMEN[indeks(nomor)], color: TEKS_SEGMEN[indeks(nomor)] });

// Lencana status keaktifan
export const LENCANA_STATUS: Record<string, string> = {
  Aktif: "bg-brand-100 text-brand-900",
  "Kurang Aktif": "bg-amber-100/70 text-amber-900",
  "Tidak Aktif": "bg-slate-100 text-slate-700",
};
