// Menampilkan kombinasi produk pada aturan asosiasi sebagai kartu hijau lembut per produk
// (selaras dengan gaya .lencana di tema), supaya itemset berisi lebih dari satu produk
// mudah dibedakan — sebelumnya hanya dipisah koma.
export default function DaftarProduk({ teks, sorot }: { teks: string; sorot?: string[] }) {
  const produk = teks.split(", ");
  return (
    <div className="flex flex-wrap gap-1.5">
      {produk.map((p, i) => (
        <span
          key={i}
          className={
            "inline-block rounded-[10px] px-2.5 py-1 text-[13px] font-medium leading-snug text-brand-900 ring-1 ring-inset " +
            (sorot?.includes(p) ? "bg-brand-100 ring-brand-400" : "bg-brand-50 ring-brand-100")
          }
        >
          {p}
        </span>
      ))}
    </div>
  );
}
