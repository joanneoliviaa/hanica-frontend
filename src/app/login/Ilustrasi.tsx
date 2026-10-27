// Ilustrasi flat minimalis untuk carousel halaman login.
// Warna mengikuti token brand di globals.css dan warna segmen di halaman Dashboard/Segmentasi.

const W = {
  g900: "#004a00",
  g800: "#005f00",
  g700: "#007800",
  g400: "#4fa94f",
  g300: "#8fcb8f",
  g200: "#bde0bd",
  g100: "#dcefdc",
  g50: "#f0f8f0",
  putih: "#ffffff",
  kulit: "#f1c6a2",
  rambut: "#26303b",
  celana: "#1b2430",
  abu: "#cbd5e1",
  abuMuda: "#e2e8f0",
  seg1: "#c2410c",
  seg2: "#0f766e",
  seg3: "#1d4ed8",
};

type PropsOrang = {
  x: number;
  y: number;
  baju: string;
  tunjuk?: boolean;
  balik?: boolean;
  bawa?: "papan" | "tablet";
};

/** Figur orang sederhana; (x, y) = titik pijak kaki. */
function Orang({ x, y, baju, tunjuk, balik, bawa }: PropsOrang) {
  return (
    <g transform={`translate(${x} ${y}) scale(${balik ? -1 : 1} 1)`}>
      <rect x={-11} y={-62} width={9} height={60} rx={4} fill={W.celana} />
      <rect x={2} y={-62} width={9} height={60} rx={4} fill={W.celana} />
      <ellipse cx={-8} cy={-1} rx={8} ry={3.5} fill={W.rambut} />
      <ellipse cx={9} cy={-1} rx={8} ry={3.5} fill={W.rambut} />
      <rect x={-18} y={-116} width={36} height={62} rx={14} fill={baju} />
      {/* lengan kiri (sisi belakang) */}
      <path d="M-14 -104 Q-24 -80 -18 -60" stroke={baju} strokeWidth={9} strokeLinecap="round" fill="none" />
      <circle cx={-18} cy={-58} r={4.5} fill={W.kulit} />
      {/* lengan kanan */}
      {tunjuk ? (
        <>
          <path d="M14 -104 L34 -122 L48 -142" stroke={baju} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx={50} cy={-145} r={4.5} fill={W.kulit} />
        </>
      ) : bawa ? (
        <>
          <path d="M14 -104 Q26 -90 20 -78" stroke={baju} strokeWidth={9} strokeLinecap="round" fill="none" />
          {bawa === "papan" ? (
            <g>
              <rect x={10} y={-104} width={26} height={34} rx={3} fill={W.g800} />
              <rect x={13} y={-100} width={20} height={27} rx={2} fill={W.putih} />
              <rect x={17} y={-106} width={12} height={5} rx={2} fill={W.g400} />
              <path d="M16 -93 h14 M16 -87 h10 M16 -81 h13" stroke={W.abu} strokeWidth={2} strokeLinecap="round" />
            </g>
          ) : (
            <g>
              <rect x={8} y={-102} width={30} height={22} rx={3} fill={W.celana} />
              <rect x={10} y={-100} width={26} height={18} rx={2} fill={W.g100} />
              <path d="M13 -86 l5 -5 l5 3 l7 -8" stroke={W.g700} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
          <circle cx={20} cy={-78} r={4.5} fill={W.kulit} />
        </>
      ) : (
        <>
          <path d="M14 -104 Q24 -80 18 -60" stroke={baju} strokeWidth={9} strokeLinecap="round" fill="none" />
          <circle cx={18} cy={-58} r={4.5} fill={W.kulit} />
        </>
      )}
      <rect x={-4} y={-124} width={8} height={10} fill={W.kulit} />
      <circle cx={0} cy={-133} r={13} fill={W.kulit} />
      <path d="M-13 -134 A13 13 0 0 1 13 -136 Q6 -140 -2 -138 Q-8 -133 -13 -128 Z" fill={W.rambut} />
    </g>
  );
}

function Tanaman({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 -30 Q-18 -52 -14 -72 Q2 -56 0 -30" fill={W.g400} />
      <path d="M0 -30 Q16 -58 8 -84 Q-6 -60 0 -30" fill={W.g700} />
      <path d="M0 -30 Q20 -42 26 -60 Q8 -54 0 -30" fill={W.g300} />
      <path d="M-13 -30 h26 l-4 30 h-18 Z" fill={W.g800} />
    </g>
  );
}

function Lantai() {
  return <ellipse cx={220} cy={302} rx={200} ry={10} fill={W.g100} />;
}

const svgProps = {
  viewBox: "0 0 440 320",
  className: "h-full w-full",
  role: "img" as const,
};

/** 1 — Dashboard ringkasan transaksi */
export function IlustrasiDashboard() {
  const batang = [38, 56, 44, 70, 62, 84, 96];
  return (
    <svg {...svgProps} aria-label="Ilustrasi dashboard ringkasan transaksi">
      <circle cx={330} cy={70} r={60} fill={W.g100} />
      <Lantai />
      <rect x={146} y={44} width={258} height={190} rx={16} fill={W.g200} transform="translate(8 8)" />
      <rect x={146} y={44} width={258} height={190} rx={16} fill={W.putih} />
      <circle cx={164} cy={62} r={4} fill={W.seg1} />
      <circle cx={177} cy={62} r={4} fill={W.g300} />
      <circle cx={190} cy={62} r={4} fill={W.g700} />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${162 + i * 80} 80)`}>
          <rect width={70} height={38} rx={8} fill={W.g50} />
          <rect x={10} y={10} width={28} height={5} rx={2.5} fill={W.abu} />
          <rect x={10} y={22} width={i === 1 ? 44 : 36} height={8} rx={4} fill={i === 0 ? W.g700 : W.g800} />
        </g>
      ))}
      {batang.map((h, i) => (
        <rect key={i} x={168 + i * 30} y={218 - h} width={18} height={h} rx={4} fill={i === batang.length - 1 ? W.g700 : W.g300} />
      ))}
      <path d="M177 172 L207 160 L237 166 L267 140 L297 148 L327 126 L357 112" stroke={W.g900} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={357} cy={112} r={5} fill={W.putih} stroke={W.g900} strokeWidth={2.5} />
      <Orang x={96} y={300} baju={W.g700} tunjuk />
      <Tanaman x={404} y={300} />
    </svg>
  );
}

/** 2 — Segmentasi pelanggan RFM + Fuzzy C-Means */
export function IlustrasiSegmentasi() {
  const klaster = [
    { cx: 150, cy: 168, r: 50, warna: W.seg1, titik: [[132, 150], [160, 176], [140, 190], [168, 150], [120, 172]] },
    { cx: 236, cy: 104, r: 46, warna: W.seg2, titik: [[222, 92], [248, 112], [232, 122], [256, 90], [214, 112]] },
    { cx: 296, cy: 190, r: 54, warna: W.seg3, titik: [[288, 176], [312, 204], [280, 206], [318, 172], [300, 222]] },
  ];
  return (
    <svg {...svgProps} aria-label="Ilustrasi pengelompokan pelanggan ke dalam segmen">
      <Lantai />
      <rect x={70} y={30} width={300} height={240} rx={18} fill={W.putih} />
      <path d="M100 56 V244 H346" stroke={W.abu} strokeWidth={2} fill="none" strokeLinecap="round" />
      {klaster.map((k, i) => (
        <g key={i}>
          <circle cx={k.cx} cy={k.cy} r={k.r} fill={k.warna} opacity={0.1} />
          <circle cx={k.cx} cy={k.cy} r={k.r} fill="none" stroke={k.warna} strokeWidth={1.5} strokeDasharray="4 5" opacity={0.6} />
          {k.titik.map(([x, y], j) => (
            <circle key={j} cx={x} cy={y} r={6} fill={k.warna} />
          ))}
          <circle cx={k.cx} cy={k.cy} r={4} fill={W.putih} stroke={k.warna} strokeWidth={3} />
        </g>
      ))}
      {/* titik dengan keanggotaan ganda (fuzzy) */}
      <g>
        <path d="M196 136 a7 7 0 0 1 0 14 Z" fill={W.seg2} />
        <path d="M196 136 a7 7 0 0 0 0 14 Z" fill={W.seg1} />
        <path d="M236 172 a7 7 0 0 1 0 14 Z" fill={W.seg3} />
        <path d="M236 172 a7 7 0 0 0 0 14 Z" fill={W.seg1} />
      </g>
      <Orang x={394} y={300} baju={W.g800} bawa="tablet" balik />
    </svg>
  );
}

/** 3 — Pola pembelian (FP-Growth): produk plastik yang sering dibeli bersama */
export function IlustrasiPola() {
  const simpul = [
    { x: 120, y: 92, ikon: "botol" },
    { x: 330, y: 84, ikon: "gelas" },
    { x: 100, y: 214, ikon: "wadah" },
    { x: 344, y: 210, ikon: "kantong" },
  ] as const;
  const pusat = { x: 222, y: 152 };
  return (
    <svg {...svgProps} aria-label="Ilustrasi jaringan produk yang sering dibeli bersama">
      <circle cx={222} cy={152} r={118} fill={W.g100} opacity={0.6} />
      <Lantai />
      {simpul.map((s, i) => (
        <line key={i} x1={pusat.x} y1={pusat.y} x2={s.x} y2={s.y} stroke={W.g700} strokeWidth={[6, 3, 4, 2.5][i]} strokeLinecap="round" opacity={0.8} />
      ))}
      <line x1={120} y1={92} x2={330} y2={84} stroke={W.g400} strokeWidth={2} strokeDasharray="5 6" />
      <line x1={100} y1={214} x2={344} y2={210} stroke={W.g400} strokeWidth={2} strokeDasharray="5 6" />
      {simpul.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y})`}>
          <circle r={30} fill={W.putih} stroke={W.g200} strokeWidth={3} />
          {s.ikon === "botol" && (
            <g>
              <rect x={-6} y={-20} width={12} height={7} rx={2} fill={W.g800} />
              <path d="M-11 -10 Q-11 -14 -5 -14 H5 Q11 -14 11 -10 V16 Q11 20 7 20 H-7 Q-11 20 -11 16 Z" fill={W.g300} />
              <rect x={-11} y={-2} width={22} height={9} fill={W.g700} />
            </g>
          )}
          {s.ikon === "gelas" && (
            <g>
              <path d="M-14 -16 H14 L10 18 H-10 Z" fill={W.g200} stroke={W.g700} strokeWidth={2.5} strokeLinejoin="round" />
              <path d="M-12 -4 H12" stroke={W.g700} strokeWidth={2} />
            </g>
          )}
          {s.ikon === "wadah" && (
            <g>
              <rect x={-17} y={-14} width={34} height={7} rx={3} fill={W.g700} />
              <path d="M-15 -6 H15 L12 16 H-12 Z" fill={W.g300} />
            </g>
          )}
          {s.ikon === "kantong" && (
            <g>
              <path d="M-7 -12 Q-7 -22 0 -22 Q7 -22 7 -12" stroke={W.g800} strokeWidth={2.5} fill="none" />
              <path d="M-15 -12 H15 L13 18 H-13 Z" fill={W.g700} />
              <path d="M-6 0 h12" stroke={W.g200} strokeWidth={2.5} strokeLinecap="round" />
            </g>
          )}
        </g>
      ))}
      <g transform={`translate(${pusat.x} ${pusat.y})`}>
        <circle r={40} fill={W.g800} />
        <path d="M-20 -10 H22 L16 14 H-14 Z" fill="none" stroke={W.putih} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M-26 -18 H-18 L-14 14" fill="none" stroke={W.putih} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={-10} cy={22} r={3.5} fill={W.putih} />
        <circle cx={12} cy={22} r={3.5} fill={W.putih} />
        <path d="M-8 2 h20" stroke={W.g300} strokeWidth={3} strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** 4 — Rekomendasi strategi CRM per segmen */
export function IlustrasiRekomendasi() {
  const butir = [W.seg1, W.seg2, W.seg3];
  return (
    <svg {...svgProps} aria-label="Ilustrasi daftar rekomendasi strategi CRM">
      <Lantai />
      <rect x={166} y={40} width={200} height={206} rx={16} fill={W.g200} transform="translate(8 8)" />
      <rect x={166} y={40} width={200} height={206} rx={16} fill={W.putih} />
      <rect x={186} y={60} width={92} height={10} rx={5} fill={W.g800} />
      <rect x={186} y={78} width={60} height={7} rx={3.5} fill={W.abu} />
      {butir.map((warna, i) => (
        <g key={i} transform={`translate(186 ${104 + i * 44})`}>
          <rect width={160} height={34} rx={10} fill={W.g50} />
          <rect x={0} y={0} width={5} height={34} rx={2.5} fill={warna} />
          <circle cx={22} cy={17} r={9} fill={i < 2 ? W.g700 : W.putih} stroke={W.g700} strokeWidth={2} />
          {i < 2 && <path d="M18 17 l3 3 l6 -6" stroke={W.putih} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          <rect x={40} y={10} width={i === 1 ? 92 : 104} height={6} rx={3} fill={W.abu} />
          <rect x={40} y={21} width={58} height={5} rx={2.5} fill={W.abuMuda} />
        </g>
      ))}
      {/* target */}
      <g transform="translate(382 66)">
        <circle r={30} fill={W.putih} stroke={W.g200} strokeWidth={3} />
        <circle r={20} fill={W.g100} />
        <circle r={10} fill={W.g700} />
        <path d="M30 -30 L2 -2" stroke={W.g900} strokeWidth={3.5} strokeLinecap="round" />
        <path d="M26 -38 L38 -26 L30 -26 L30 -34 Z" fill={W.g900} />
      </g>
      <Orang x={110} y={300} baju={W.g800} bawa="papan" />
      <Tanaman x={50} y={300} />
    </svg>
  );
}
