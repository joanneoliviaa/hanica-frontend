import Link from "next/link";

const LANGKAH = [
  {
    judul: "Siapkan data penjualan dari Accurate",
    isi: (
      <>
        <p>
          Ekspor laporan penjualan dari Accurate dalam format Excel (<b>.xlsx</b>) tanpa mengubah nama kolomnya. Berkas
          harus memuat kolom nomor faktur, tanggal, kode dan nama pelanggan, nama barang, kuantitas, satuan, harga, dan
          subtotal. Data tidak perlu diketik ulang atau dirapikan lebih dulu.
        </p>
      </>
    ),
  },
  {
    judul: "Unggah data transaksi",
    isi: (
      <>
        <p>
          Buka menu <Link href="/data" className="tautan">Data Transaksi</Link>, pilih berkas,
          lalu tekan <b>Unggah &amp; Proses Data</b>. Sistem membersihkan data secara otomatis (menghapus baris ganda, 
          menyeragamkan nama barang dan pelanggan) dan menampilkan ringkasannya.
        </p>
        <p className="notif-peringatan mt-2.5">
          Setiap unggahan <b>menggantikan seluruh data sebelumnya</b>. Hasil segmentasi, pola, serta rekomendasi lama
          ikut dihapus. Setelah mengunggah, ulangi langkah 3 sampai 5.
        </p>
      </>
    ),
  },
  {
    judul: "Jalankan segmentasi pelanggan",
    isi: (
      <>
        <p>
          Buka <Link href="/segmentasi" className="tautan">Segmentasi Pelanggan</Link> dan tekan{" "}
          <b>Jalankan segmentasi</b>. Sistem menghitung Recency, Frequency, dan Monetary setiap pelanggan, lalu
          mengelompokkannya dengan Fuzzy C-Means. Jumlah klaster dipilih otomatis berdasarkan nilai Silhouette tertinggi,
          dan tiap klaster diberi label loyalitas (misalnya Loyalitas Rendah atau Loyalitas Tinggi).
        </p>
        <p className="mt-2">
          Klik pelanggan pada tabel atau grafik untuk melihat profilnya. Kolom <b>Keanggotaan</b> menunjukkan seberapa
          cocok pelanggan itu dengan tiap klaster, misalnya 40% Rendah dan 60% Tinggi.
        </p>
      </>
    ),
  },
  {
    judul: "Analisis pola pembelian",
    isi: (
      <>
        <p>
          Buka <Link href="/pola" className="tautan">Analisis Pola Pembelian</Link>. Halaman ini
          langsung menampilkan hasil dengan nilai bawaan minimum support dan minimum confidence yang ditentukan dari uji
          sensitivitas. Anda dapat mengubah kedua nilai itu, lalu menekan <b>Jalankan analisis</b>.
        </p>
        <p className="mt-2">
          Pilihan periode (seluruh data, 12 bulan terakhir, 6 bulan terakhir, atau rentang tanggal sendiri) hanya
          membatasi transaksi yang dianalisis. Segmentasi pelanggan tetap memakai seluruh data. Jika suatu segmen terlalu
          sedikit transaksinya pada periode itu, sistem menampilkan keterangan dan tidak membentuk aturan.
        </p>
      </>
    ),
  },
  {
    judul: "Lihat rekomendasi strategi CRM",
    isi: (
      <>
        <p>
          Buka <Link href="/rekomendasi" className="tautan">Rekomendasi Strategi CRM</Link> dan
          tekan <b>Susun rekomendasi</b>. Pilih tab segmen untuk membaca karakteristik segmen, strategi yang disarankan,
          alasannya, dan pola pembelian yang mendasarinya. Laporan dapat diunduh dalam bentuk PDF untuk satu segmen atau
          seluruh segmen.
        </p>
        <p className="mt-2">
          Pola pendukung diambil dari hasil Analisis Pola Pembelian yang terakhir dijalankan. Jika Anda mengubah
          parameter atau periode di sana, tekan <b>Susun ulang rekomendasi</b>.
        </p>
      </>
    ),
  },
  {
    judul: "Perbarui data secara berkala",
    isi: (
      <p>
        Agar hasil tetap sesuai kondisi terbaru, ekspor data penjualan terbaru dari Accurate secara berkala dan ulangi
        langkah 2 sampai 5. Pastikan berkas yang diunggah mencakup seluruh riwayat penjualan, bukan hanya transaksi baru,
        karena unggahan baru menggantikan data lama.
      </p>
    ),
  },
];

const ISTILAH: { istilah: string; arti: string }[] = [
  { istilah: "Recency", arti: "Jumlah hari sejak transaksi terakhir pelanggan, dihitung terhadap sehari setelah tanggal transaksi terakhir pada data. Makin kecil berarti makin baru berbelanja." },
  { istilah: "Frequency", arti: "Banyaknya faktur (pemesanan) yang dilakukan pelanggan. Makin besar berarti makin sering memesan." },
  { istilah: "Monetary", arti: "Total nilai pembelian pelanggan dalam rupiah." },
  { istilah: "Status keaktifan", arti: "Kondisi individual pelanggan menurut Recency: Aktif (sampai 30 hari), Kurang Aktif (31–180 hari), dan Tidak Aktif (lebih dari 180 hari)." },
  { istilah: "Label loyalitas", arti: "Nama klaster berdasarkan skor gabungan RFM pada titik pusat klaster (misalnya Loyalitas Rendah atau Loyalitas Tinggi)." },
  { istilah: "Nilai Keanggotaan", arti: "Persentase kecocokan seorang pelanggan dengan tiap klaster. Seorang pelanggan dapat cocok dengan lebih dari satu klaster; segmennya ditentukan oleh persentase tertinggi." },
  { istilah: "Silhouette", arti: "Ukuran kualitas pemisahan klaster. Jumlah klaster dengan nilai Silhouette tertinggi dipilih oleh sistem." },
  { istilah: "Minimum support", arti: "Batas minimum seberapa sering suatu kombinasi produk muncul dalam transaksi segmen (dalam persen) agar dipertimbangkan sebagai pola." },
  { istilah: "Minimum confidence", arti: "Batas minimum peluang produk kedua ikut dibeli jika produk pertama dibeli. Makin tinggi berarti aturan makin dapat diandalkan." },
  { istilah: "Lift", arti: "Seberapa kuat dua produk berkaitan dibandingkan jika dibeli tanpa hubungan. Lift lebih dari 1 berarti kedua produk lebih sering dibeli bersamaan daripada kebetulan; makin besar, makin kuat keterkaitannya." },
];

export default function Panduan() {
  return (
    <div className="max-w-6xl">
      <header>
        <h1 className="judul-halaman">Panduan Penggunaan</h1>
        <p className="deskripsi-halaman">
          Langkah-langkah memakai sistem dan arti istilah yang muncul pada hasil analisis.
        </p>
      </header>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <section>
          <h2 className="judul-kartu">Langkah penggunaan</h2>
          <ol className="mt-3 space-y-3">
            {LANGKAH.map((l, i) => (
              <li key={l.judul} className="flex gap-4 rounded-3xl border border-garis bg-white p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white" aria-hidden>
                  {i + 1}
                </span>
                <div className="text-sm leading-relaxed text-[#33463a]">
                  <h3 className="text-base font-semibold text-brand-900">{l.judul}</h3>
                  <div className="mt-1">{l.isi}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="lg:sticky lg:top-8 lg:flex lg:max-h-[calc(100vh-4rem)] lg:flex-col">
          <h2 className="judul-kartu">Penjelasan istilah</h2>
          <dl className="mt-3 divide-y divide-[#eef3ee] rounded-3xl border border-garis bg-white text-sm lg:min-h-0 lg:overflow-y-auto">
            {ISTILAH.map((t) => (
              <div key={t.istilah} className="px-5 py-3.5">
                <dt className="font-semibold text-brand-900">{t.istilah}</dt>
                <dd className="mt-0.5 leading-relaxed text-[#33463a]">{t.arti}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}