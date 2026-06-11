import { useState, useMemo } from 'react';
import { useCart } from '../../context/CartContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function seededHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (Math.imul(h, 16777619)) >>> 0;
  }
  return h;
}

// ─── Mock scientific data generators ─────────────────────────────────────────
function makeHPLC(product) {
  const s    = seededHash(product.sku);
  const pur  = 98 + (s % 180) / 100;
  const i1   = (((s * 7)  % 55) / 100);
  const i2   = (((s * 13) % 35) / 100);
  const i3   = Math.max(0, 100 - pur - i1 - i2);
  return {
    purity: pur.toFixed(1),
    peaks: [
      { id:1, compound:'Composto principal', rt:(11.2+(s%30)/10).toFixed(2), area:((s%5e6)+14e6).toLocaleString('pt-BR'), pct:pur.toFixed(2),  type:'main'    },
      { id:2, compound:'Impureza A',         rt:(4.1 +(s%20)/10).toFixed(2), area:((s*3%2e5)+5e4).toLocaleString('pt-BR'), pct:i1.toFixed(2),   type:'impurity'},
      { id:3, compound:'Impureza B',         rt:(7.8 +(s%15)/10).toFixed(2), area:((s*7%15e4)+3e4).toLocaleString('pt-BR'),pct:i2.toFixed(2),   type:'impurity'},
      { id:4, compound:'Solvente residual',  rt:(2.1 +(s%8) /10).toFixed(2), area:((s*11%8e4)+1e4).toLocaleString('pt-BR'),pct:i3.toFixed(2),   type:'solvent' },
    ],
    conds: {
      'Coluna'      : 'C18 (250×4.6 mm, 5 μm)',
      'Fase A'      : 'H₂O + 0,1% TFA',
      'Fase B'      : 'ACN + 0,1% TFA',
      'Gradiente'   : '5→95% B em 20 min',
      'Fluxo'       : '1,0 mL/min',
      'Detecção'    : `UV ${220+(s%80)} nm`,
      'Injeção'     : '10 μL',
      'Temperatura' : `${30+(s%10)} °C`,
    },
  };
}

function makeCoA(product) {
  const s    = seededHash(product.sku);
  const yr   = 2024 + (s%2);
  const mo   = String(1+(s%12)).padStart(2,'0');
  const dy   = String(1+(s%27)).padStart(2,'0');
  const lot  = `LP${yr}${mo}${String(s%9999).padStart(4,'0')}`;
  const pur  = (98+(s%180)/100).toFixed(1);
  return {
    lot, manufactured:`${dy}/${mo}/${yr}`, expiry:`${dy}/${mo}/${yr+2}`,
    analyst:['Dr. R. Figueiredo','Dra. C. Alves','Dr. M. Santos'][s%3],
    tests:[
      { test:'Aparência',           method:'Visual',        spec:'Pó fino, branco/off-white',  result:'Conforme',                  pass:true },
      { test:'Identidade (FTIR)',   method:'EP 2.2.24',     spec:'Compatível c/ padrão',        result:'Conforme',                  pass:true },
      { test:'Pureza (HPLC)',       method:'LP-HPLC-01',    spec:'≥ 98,0 %',                    result:`${pur} %`,                  pass:true },
      { test:'Teor de água (KF)',   method:'EP 2.5.12',     spec:'≤ 0,5 %',                     result:`${(0.1+(s%30)/100).toFixed(2)} %`, pass:true },
      { test:'Metais pesados',      method:'ICP-MS',        spec:'≤ 10 ppm',                    result:`< ${1+(s%4)} ppm`,          pass:true },
      { test:'Solventes residuais', method:'EP 5.4',        spec:'Limite ICH Q3C',              result:'Conforme',                  pass:true },
      { test:'Contagem microbiana', method:'EP 2.6.12',     spec:'≤ 100 UFC/g',                 result:`< ${10+(s%40)} UFC/g`,      pass:true },
      { test:'Endotoxinas',         method:'LAL',           spec:'< 0,25 EU/mL',                result:'< 0,1 EU/mL',               pass:true },
    ],
  };
}

function makeBatch(product) {
  const s    = seededHash(product.sku);
  const base = new Date(2024, s%12, 1+(s%27));
  const add  = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
  const fmt  = (d) => d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
  const lot  = makeCoA(product).lot;
  return [
    { icon:'⚗️', label:'Síntese / Produção',    detail:`Lote ${lot} — ${product.unit}`,         date:fmt(base),        time:`0${8+(s%5)}:${String((s*7)%60).padStart(2,'0')}`, actor:'Prod. Lab A',   done:true  },
    { icon:'🔬', label:'Amostragem QC',          detail:'Alíquota 5g retirada para análise',     date:fmt(add(base,1)), time:'10:30', actor:'QC Team',         done:true  },
    { icon:'📊', label:'Análise HPLC',           detail:'Pureza confirmada por cromatografia',   date:fmt(add(base,2)), time:'14:15', actor:`Dr. ${['R. Figueiredo','C. Alves','M. Santos'][s%3]}`, done:true },
    { icon:'📋', label:'Emissão do CoA',         detail:'Certificado assinado e arquivado',      date:fmt(add(base,3)), time:'09:00', actor:'Gerência QA',     done:true  },
    { icon:'📦', label:'Embalagem primária',     detail:'Frasco âmbar + lacre inviolável',       date:fmt(add(base,3)), time:'15:30', actor:'Embalagem',       done:true  },
    { icon:'✅', label:'Liberação de qualidade', detail:'Aprovado para comercialização',         date:fmt(add(base,4)), time:'11:00', actor:'QA Manager',      done:true  },
    { icon:'🚚', label:'Expedição',              detail:'Enviado ao estoque central',            date:fmt(add(base,5)), time:'08:00', actor:'Logística',       done:true  },
    { icon:'🏪', label:'Entrada em estoque',     detail:`${product.stock} un. disponíveis`,     date:fmt(add(base,6)), time:'13:20', actor:'Armazém SP',      done:false },
  ];
}

// ─── Category palette ─────────────────────────────────────────────────────────
const CAT_PALETTE = {
  kits        : { from:'#1e3a8a', to:'#3b82f6', accent:'#93c5fd', label:'Kit de Análise'   },
  reagentes   : { from:'#4c1d95', to:'#8b5cf6', accent:'#c4b5fd', label:'Reagente Técnico' },
  equipamentos: { from:'#134e4a', to:'#0d9488', accent:'#5eead4', label:'Equipamento'       },
  consumiveis : { from:'#78350f', to:'#d97706', accent:'#fcd34d', label:'Consumível'        },
};

// ─── Media thumbnail types ─────────────────────────────────────────────────────
function ThumbHero({ product, large }) {
  const pal = CAT_PALETTE[product.category] ?? CAT_PALETTE.kits;
  const s   = seededHash(product.sku);
  const sz  = large ? 400 : 80;
  // SVG molecule grid dots — deterministic per product
  const dots = Array.from({length: large?30:6}, (_,i) => ({
    cx: 10 + ((s*(i+3))%80), cy: 10 + ((s*(i+7))%80),
    r: 1.5 + ((s*(i+1))%3)*0.5,
  }));
  const lines = Array.from({length: large?15:3}, (_,i) => ({
    x1:((s*(i+1))%90)+5, y1:((s*(i+5))%90)+5,
    x2:((s*(i+9))%90)+5, y2:((s*(i+3))%90)+5,
  }));

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${pal.from} 0%, ${pal.to} 100%)` }}>
      {/* Molecule grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {lines.map((l,i) => <line key={i} {...l} stroke="white" strokeWidth="0.5"/>)}
        {dots.map((d,i) => <circle key={i} {...d} fill="white"/>)}
      </svg>
      {/* Center icon */}
      <div className="relative flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="h-8 w-8">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 3h6M9 3v6L5.5 15A3 3 0 008 20h8a3 3 0 002.5-5L15 9V3" />
          </svg>
        </div>
        {large && (
          <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">
            {pal.label}
          </span>
        )}
      </div>
    </div>
  );
}

function ThumbChromatogram({ product, large }) {
  const s   = seededHash(product.sku);
  const pur = 98 + (s%180)/100;
  // Build SVG chromatogram peaks
  const W = 280, H = 120;
  const peaks = [
    { rt: 2.1+(s%8)/10,  height: 8  + (s%12),     width: 8 },
    { rt: 4.1+(s%20)/10, height: 12 + (s%15),      width: 10 },
    { rt: 7.8+(s%15)/10, height: 18 + (s%20),      width: 12 },
    { rt: 11.2+(s%30)/10,height: 85 + (s%10),      width: 18 },  // main peak
  ];
  const maxRT = 20;
  function peakPath(rt, h, w) {
    const x = (rt/maxRT)*W;
    const y = H - h;
    const hw = w * 4;
    return `M ${x-hw} ${H} Q ${x} ${y} ${x+hw} ${H}`;
  }
  return (
    <div className="w-full h-full bg-navy-950 flex flex-col p-2 overflow-hidden"
      style={{background:'#060f1e'}}>
      {large && (
        <p className="text-[9px] font-mono text-emerald-400/70 mb-1 pl-2">HPLC · UV 254 nm · Purity: {pur.toFixed(1)}%</p>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full flex-1">
        {/* Baseline */}
        <line x1="0" y1={H} x2={W} y2={H} stroke="#1e3a5f" strokeWidth="0.5"/>
        {/* Grid lines */}
        {[0.2,0.4,0.6,0.8].map(y => (
          <line key={y} x1="0" y1={H*y} x2={W} y2={H*y} stroke="#1e3a5f" strokeWidth="0.3" strokeDasharray="2,4"/>
        ))}
        {/* Peaks */}
        {peaks.map((pk,i) => (
          <path key={i} d={peakPath(pk.rt, pk.height, pk.width)}
            fill={i===3 ? '#2563eb' : '#64748b'} fillOpacity="0.7"
            stroke={i===3 ? '#3b82f6' : '#475569'} strokeWidth="0.5"/>
        ))}
        {/* Main peak label */}
        {large && (
          <text x={(peaks[3].rt/maxRT)*W} y={H-peaks[3].height-4}
            fill="#93c5fd" fontSize="6" textAnchor="middle" fontFamily="monospace">
            {pur.toFixed(2)}%
          </text>
        )}
      </svg>
      {large && (
        <p className="text-[8px] font-mono text-slate-600 text-center mt-1">Retention Time (min) →</p>
      )}
    </div>
  );
}

function ThumbMolecule({ product, large }) {
  const s = seededHash(product.sku);
  const W = 200, H = 150;
  // Generate simple hexagonal ring structure
  const cx = W/2, cy = H/2, r = large ? 38 : 28;
  const hex = Array.from({length:6}, (_,i) => {
    const a = (i*60 - 30) * Math.PI/180;
    return { x: cx + r*Math.cos(a), y: cy + r*Math.sin(a) };
  });
  // Side chains
  const chains = [
    { from: hex[0], to: { x: hex[0].x + 22, y: hex[0].y - 14 } },
    { from: hex[2], to: { x: hex[2].x + 18, y: hex[2].y + 18 } },
    { from: hex[4], to: { x: hex[4].x - 20, y: hex[4].y - 8  } },
  ];
  const atoms = [
    { x: chains[0].to.x, y: chains[0].to.y, label:'OH', color:'#f87171' },
    { x: chains[1].to.x, y: chains[1].to.y, label:'NH₂',color:'#60a5fa' },
    { x: chains[2].to.x, y: chains[2].to.y, label:'COOH',color:'#34d399'},
  ];

  return (
    <div className="w-full h-full flex items-center justify-center"
      style={{background:'linear-gradient(135deg,#0f1729 0%,#0f2244 100%)'}}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full max-w-full">
        {/* Benzene ring double bonds (alternating) */}
        {hex.map((_,i) => {
          const a = hex[i], b = hex[(i+1)%6];
          const isDouble = i%2===0;
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#3b82f6" strokeWidth="1.5"/>
              {isDouble && (
                <line x1={a.x*0.96+b.x*0.04} y1={a.y*0.96+b.y*0.04}
                  x2={a.x*0.04+b.x*0.96} y2={a.y*0.04+b.y*0.96}
                  stroke="#3b82f6" strokeWidth="0.5" opacity="0.5"/>
              )}
            </g>
          );
        })}
        {/* Side chains */}
        {chains.map((c,i) => (
          <line key={i} x1={c.from.x} y1={c.from.y} x2={c.to.x} y2={c.to.y}
            stroke="#64748b" strokeWidth="1.2"/>
        ))}
        {/* Atom labels */}
        {atoms.map((a,i) => (
          <text key={i} x={a.x} y={a.y+1} fill={a.color} fontSize="7"
            textAnchor="middle" fontFamily="monospace" fontWeight="bold">{a.label}</text>
        ))}
        {/* Center aromatic indicator */}
        <circle cx={cx} cy={cy} r={r*0.45} fill="none" stroke="#1d4ed8" strokeWidth="0.8" strokeDasharray="3,2"/>
      </svg>
    </div>
  );
}

function ThumbLabel({ product }) {
  const pal = CAT_PALETTE[product.category] ?? CAT_PALETTE.kits;
  const coa = makeCoA(product);
  return (
    <div className="w-full h-full bg-white flex flex-col p-3 border border-haze-200">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="h-1 flex-1 rounded" style={{background:pal.from}}/>
        <span className="text-[8px] font-bold tracking-widest uppercase text-navy-900">LabPrime</span>
        <div className="h-1 flex-1 rounded" style={{background:pal.from}}/>
      </div>
      <p className="text-[7px] font-mono text-navy-900 font-bold leading-tight line-clamp-2">{product.name}</p>
      <p className="text-[6px] font-mono text-mute mt-0.5">SKU: {product.sku}</p>
      <p className="text-[6px] font-mono text-mute">Lote: {coa.lot}</p>
      <div className="mt-auto border-t border-haze-200 pt-1">
        <p className="text-[6px] font-mono text-mute">Validade: {coa.expiry}</p>
        <p className="text-[6px] text-emerald-600 font-bold">ISO 9001:2015 ✓</p>
      </div>
    </div>
  );
}

function ThumbVideo() {
  return (
    <div className="w-full h-full flex items-center justify-center"
      style={{background:'linear-gradient(135deg,#111827 0%,#1e2940 100%)'}}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/30"
          style={{background:'rgba(255,255,255,0.1)'}}>
          <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5 ml-0.5">
            <path d="M6 4l14 8-14 8V4z"/>
          </svg>
        </div>
        <span className="text-[8px] text-white/50 font-medium">Vídeo Técnico</span>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
  </svg>
);
const IconBeaker = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4.26 10.147a60 60 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342"/>
  </svg>
);
const IconDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
  </svg>
);
const IconTrace = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/>
  </svg>
);

// ─── HPLC Tab ─────────────────────────────────────────────────────────────────
function TabHPLC({ product }) {
  const data = useMemo(() => makeHPLC(product), [product]);
  const typeColor = { main:'text-brand bg-brand/10', impurity:'text-amber-700 bg-amber-50', solvent:'text-slate-600 bg-slate-100' };
  const typeLabel = { main:'Principal', impurity:'Impureza', solvent:'Solvente' };

  return (
    <div className="space-y-6">
      {/* Chromatogram visual */}
      <div className="rounded-2xl overflow-hidden border border-haze-200" style={{height:'140px'}}>
        <ThumbChromatogram product={product} large />
      </div>

      {/* Peaks table */}
      <div>
        <h4 className="label mb-3">Tabela de Picos</h4>
        <div className="overflow-x-auto rounded-xl border border-haze-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-haze-200 bg-haze">
                <th className="px-4 py-3 text-left font-semibold text-mute uppercase tracking-wider text-[10px]">Pico</th>
                <th className="px-4 py-3 text-left font-semibold text-mute uppercase tracking-wider text-[10px]">Composto</th>
                <th className="px-4 py-3 text-right font-semibold text-mute uppercase tracking-wider text-[10px]">TR (min)</th>
                <th className="px-4 py-3 text-right font-semibold text-mute uppercase tracking-wider text-[10px]">Área</th>
                <th className="px-4 py-3 text-right font-semibold text-mute uppercase tracking-wider text-[10px]">Área %</th>
                <th className="px-4 py-3 text-center font-semibold text-mute uppercase tracking-wider text-[10px]">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {data.peaks.map((row) => (
                <tr key={row.id} className="border-b border-haze-200 last:border-0 hover:bg-haze/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-navy-900">{row.id}</td>
                  <td className="px-4 py-3 text-navy-900">{row.compound}</td>
                  <td className="px-4 py-3 text-right font-mono text-navy-700">{row.rt}</td>
                  <td className="px-4 py-3 text-right font-mono text-mute">{row.area}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${row.type==='main' ? 'text-brand' : 'text-mute'}`}>
                    {row.pct}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`chip text-[9px] font-semibold ${typeColor[row.type]}`}>
                      {typeLabel[row.type]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-brand/5 border-t-2 border-brand/20">
                <td colSpan={4} className="px-4 py-3 text-xs font-bold text-navy-900">Pureza Total (HPLC)</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-brand text-sm">{data.purity}%</td>
                <td className="px-4 py-3 text-center">
                  <span className="chip chip-green text-[9px] font-bold">PASS</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Conditions */}
      <div>
        <h4 className="label mb-3">Condições Cromatográficas</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(data.conds).map(([k,v]) => (
            <div key={k} className="rounded-xl bg-haze p-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-mute mb-0.5">{k}</p>
              <p className="text-xs font-mono text-navy-900">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CoA Tab ──────────────────────────────────────────────────────────────────
function TabCoA({ product }) {
  const coa = useMemo(() => makeCoA(product), [product]);
  return (
    <div className="space-y-6">
      {/* Document header */}
      <div className="rounded-2xl border-2 border-brand/20 bg-brand/5 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1">Certificate of Analysis</p>
            <h3 className="text-lg font-bold text-navy-900 leading-snug max-w-sm">{product.name}</h3>
            <p className="text-xs font-mono text-mute mt-1">{product.sku}</p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-1.5 justify-end">
              <IconShield />
              <span className="text-xs font-bold text-emerald-700">ISO 9001:2015 Certified</span>
            </div>
            <p className="text-[10px] text-mute">Lote: <span className="font-mono font-bold text-navy-900">{coa.lot}</span></p>
            <p className="text-[10px] text-mute">Fabricação: <span className="font-semibold text-navy-900">{coa.manufactured}</span></p>
            <p className="text-[10px] text-mute">Validade: <span className="font-semibold text-navy-900">{coa.expiry}</span></p>
            <p className="text-[10px] text-mute">Analista: <span className="font-semibold text-navy-900">{coa.analyst}</span></p>
          </div>
        </div>
      </div>

      {/* Test results */}
      <div>
        <h4 className="label mb-3">Resultados de Testes</h4>
        <div className="overflow-x-auto rounded-xl border border-haze-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-haze-200 bg-haze">
                {['Parâmetro','Método','Especificação','Resultado','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-mute uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coa.tests.map((row,i) => (
                <tr key={i} className="border-b border-haze-200 last:border-0 hover:bg-haze/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-navy-900">{row.test}</td>
                  <td className="px-4 py-3 font-mono text-mute text-[10px]">{row.method}</td>
                  <td className="px-4 py-3 text-mute">{row.spec}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-navy-900">{row.result}</td>
                  <td className="px-4 py-3">
                    <span className={`chip font-bold text-[9px] ${row.pass ? 'chip-green' : 'bg-red-50 text-red-700'}`}>
                      {row.pass ? '✓ PASS' : '✗ FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-mute leading-relaxed border-t border-haze-200 pt-4">
        Este Certificado de Análise foi emitido conforme os procedimentos internos do Sistema de Gestão da Qualidade da LabPrime.
        Os resultados se referem exclusivamente ao lote mencionado. Documento válido sem rasuras.
        Conservar em local seco, ao abrigo da luz e entre 2–8 °C.
      </p>
    </div>
  );
}

// ─── Batch Tab ────────────────────────────────────────────────────────────────
function TabBatch({ product }) {
  const steps = useMemo(() => makeBatch(product), [product]);
  const coa   = useMemo(() => makeCoA(product), [product]);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-haze-200 bg-haze p-4 flex flex-wrap gap-4">
        <div><p className="text-[9px] font-semibold uppercase tracking-wider text-mute mb-0.5">Lote</p>
          <p className="font-mono font-bold text-navy-900 text-sm">{coa.lot}</p></div>
        <div><p className="text-[9px] font-semibold uppercase tracking-wider text-mute mb-0.5">SKU</p>
          <p className="font-mono text-navy-900 text-sm">{product.sku}</p></div>
        <div><p className="text-[9px] font-semibold uppercase tracking-wider text-mute mb-0.5">Unidade</p>
          <p className="font-mono text-navy-900 text-sm">{product.unit}</p></div>
        <div><p className="text-[9px] font-semibold uppercase tracking-wider text-mute mb-0.5">Validade</p>
          <p className="font-mono text-navy-900 text-sm">{coa.expiry}</p></div>
        <div className="ml-auto">
          <span className="chip chip-green font-bold text-[10px]">✓ Rastreabilidade completa</span>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h4 className="label mb-4">Cadeia de Custódia</h4>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-5 bottom-5 w-px bg-haze-200"/>
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="relative flex gap-4 pb-0">
                {/* Node */}
                <div className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 text-base
                  ${step.done
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-brand/30 bg-brand/10 ring-4 ring-brand/10'
                  }`}>
                  {step.icon}
                </div>
                {/* Content */}
                <div className={`flex-1 pb-6 ${i === steps.length-1 ? 'pb-0' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-1">
                    <p className={`text-sm font-semibold ${step.done ? 'text-navy-900' : 'text-brand'}`}>
                      {step.label}
                      {!step.done && <span className="ml-2 chip chip-brand text-[9px]">Atual</span>}
                    </p>
                    <span className="text-[10px] font-mono text-mute whitespace-nowrap">
                      {step.date} · {step.time}
                    </span>
                  </div>
                  <p className="text-xs text-mute mt-0.5">{step.detail}</p>
                  <p className="text-[10px] text-mute-light mt-0.5">Responsável: <span className="font-medium text-mute">{step.actor}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ProductDetail (main export) ─────────────────────────────────────────────
export default function ProductDetail({ product, onBack }) {
  const { addItem } = useCart();

  const [activeThumb, setActiveThumb] = useState(0);
  const [qty,         setQty]         = useState(1);
  const [activeTab,   setActiveTab]   = useState('hplc');
  const [addedAnim,   setAddedAnim]   = useState(false);

  const hplc = useMemo(() => makeHPLC(product),  [product]);
  const coa  = useMemo(() => makeCoA(product),   [product]);
  const pal  = CAT_PALETTE[product.category] ?? CAT_PALETTE.kits;

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) addItem(product);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1800);
  }

  const thumbs = [
    { label:'Produto',        render:(large) => <ThumbHero          product={product} large={large} /> },
    { label:'Estrutura',      render:(large) => <ThumbMolecule       product={product} large={large} /> },
    { label:'Cromatograma',   render:(large) => <ThumbChromatogram   product={product} large={large} /> },
    { label:'Embalagem',      render:(_)     => <ThumbLabel          product={product}               /> },
    { label:'Vídeo Técnico',  render:(_)     => <ThumbVideo                                           /> },
  ];

  const tabs = [
    { id:'hplc',  label:'Purity Analytics (HPLC)', icon:<IconBeaker /> },
    { id:'coa',   label:'Certificate of Analysis', icon:<IconDoc />    },
    { id:'batch', label:'Batch Traceability',       icon:<IconTrace />  },
  ];

  const badgeColors = { 'Mais vendido':'chip-brand','Novo':'chip-green','Oferta':'chip-amber','Premium':'chip-navy' };
  const shipping = product.price * qty >= 500 ? 'Frete Grátis' : `+ R$ 35 frete`;

  return (
    <div className="min-h-screen bg-haze">

      {/* ── Sticky breadcrumb bar ── */}
      <div className="sticky top-0 z-40 border-b border-haze-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-mute transition-colors hover:text-navy-900">
            <ChevronLeft /> Voltar ao catálogo
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-mute">
            <span>Catálogo</span>
            <span className="text-haze-200">›</span>
            <span className="text-mute">{pal.label}</span>
            <span className="text-haze-200">›</span>
            <span className="text-navy-900 font-medium truncate max-w-xs">{product.name}</span>
          </div>
          <span className="font-mono text-xs text-mute-light">{product.sku}</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">

        {/* ── MAIN GRID: Media + Spec ── */}
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">

          {/* ── LEFT: Advanced Media Canvas ── */}
          <div className="space-y-3">
            {/* Main display */}
            <div className="card overflow-hidden" style={{ height: '420px' }}>
              {thumbs[activeThumb].render(true)}
              {/* Thumb 4 = video: overlay play badge */}
              {activeThumb === 4 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="chip bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                    Simulação de Vídeo Técnico
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            <div className="grid grid-cols-5 gap-2">
              {thumbs.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setActiveThumb(i)}
                  className={`relative overflow-hidden rounded-xl border-2 transition-all
                    ${activeThumb === i
                      ? 'border-brand shadow-lift scale-[1.03]'
                      : 'border-haze-200 hover:border-brand/40 hover:scale-[1.02]'
                    }`}
                  style={{ height: '68px' }}
                >
                  {t.render(false)}
                  {/* Video play overlay */}
                  {i === 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80">
                        <svg viewBox="0 0 24 24" fill="#0f2244" className="h-3 w-3 ml-0.5">
                          <path d="M6 4l14 8-14 8V4z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                  {/* Active indicator */}
                  {activeThumb === i && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"/>
                  )}
                </button>
              ))}
            </div>

            {/* View label */}
            <p className="text-center text-[10px] font-medium text-mute uppercase tracking-wider">
              {thumbs[activeThumb].label}
            </p>
          </div>

          {/* ── RIGHT: Order & Spec Matrix ── */}
          <div className="space-y-5">
            {/* Top badges */}
            <div className="flex flex-wrap gap-2">
              <span className="chip text-[10px] font-bold" style={{background:pal.from+'22', color:pal.to}}>
                {pal.label}
              </span>
              <span className="chip chip-green text-[10px] font-bold">
                <IconShield /> Pureza {hplc.purity}% HPLC
              </span>
              {product.badge && (
                <span className={`${badgeColors[product.badge] ?? 'chip-navy'} chip text-[10px]`}>
                  {product.badge}
                </span>
              )}
              <span className={`chip text-[10px] ${product.stock <= 5 ? 'chip-amber' : 'chip-navy'}`}>
                {product.stock <= 5 ? `⚠ Apenas ${product.stock} em estoque` : `✓ ${product.stock} em estoque`}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold leading-tight text-navy-900">{product.name}</h1>
              <p className="mt-1 text-sm leading-relaxed text-mute">{product.description}</p>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label:'SKU / Ref.',    value: product.sku,      mono: true  },
                { label:'Lote',          value: coa.lot,          mono: true  },
                { label:'Unidade',       value: product.unit,     mono: false },
                { label:'Validade',      value: coa.expiry,       mono: true  },
              ].map(spec => (
                <div key={spec.label} className="rounded-xl bg-haze p-3">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-mute mb-0.5">{spec.label}</p>
                  <p className={`text-xs font-semibold text-navy-900 ${spec.mono ? 'font-mono' : ''}`}>{spec.value}</p>
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="rounded-2xl border border-haze-200 bg-white p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-mute">Preço unitário</p>
                  <p className="text-3xl font-bold text-navy-900 leading-none mt-1">{formatBRL(product.price)}</p>
                  <p className="text-xs text-mute mt-1">por {product.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-mute uppercase tracking-wider">Subtotal</p>
                  <p className="text-lg font-bold text-brand">{formatBRL(product.price * qty)}</p>
                  <p className={`text-xs font-medium mt-0.5 ${product.price * qty >= 500 ? 'text-emerald-600' : 'text-mute'}`}>
                    {shipping}
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity counter */}
            <div>
              <label className="label">Quantidade</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-haze-200 bg-white overflow-hidden">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="px-4 py-3 text-navy-900 hover:bg-haze transition-colors text-lg font-light"
                  >−</button>
                  <span className="min-w-[3rem] text-center text-sm font-bold text-navy-900 tabular-nums">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="px-4 py-3 text-navy-900 hover:bg-haze transition-colors text-lg font-light"
                  >+</button>
                </div>
                <span className="text-xs text-mute">máx. {product.stock} un.</span>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleAddToCart}
                disabled={addedAnim}
                className={`btn-primary w-full py-4 text-sm gap-2.5 transition-all
                  ${addedAnim ? '!bg-emerald-600 hover:!bg-emerald-600' : ''}`}
              >
                {addedAnim
                  ? <><span>✓</span> Adicionado à Lista Técnica!</>
                  : <><IconBeaker /> Adicionar à Lista Técnica — {formatBRL(product.price * qty)}</>
                }
              </button>
              <p className="text-center text-[10px] text-mute">
                {product.price * qty >= 500
                  ? '✓ Frete grátis para este pedido'
                  : `Frete grátis acima de R$ 500 · Faltam ${formatBRL(500 - product.price * qty)}`
                }
              </p>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { icon:'🔬', text:'Laudo HPLC incluso' },
                { icon:'🏆', text:'ISO 9001:2015' },
                { icon:'🚚', text:'Entrega expressa' },
              ].map(b => (
                <div key={b.text} className="flex flex-col items-center gap-1 rounded-xl bg-haze p-2.5 text-center">
                  <span className="text-lg">{b.icon}</span>
                  <p className="text-[9px] font-medium text-mute leading-tight">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM: Scientific Tabs ── */}
        <div className="card overflow-hidden">
          {/* Tab header */}
          <div className="flex border-b border-haze-200 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-shrink-0 items-center gap-2 px-6 py-4 text-xs font-semibold transition-all
                  ${activeTab === tab.id
                    ? 'border-b-2 border-brand text-brand bg-brand/5'
                    : 'text-mute hover:text-navy-900 hover:bg-haze'
                  }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Tab body */}
          <div className="p-6 sm:p-8">
            {activeTab === 'hplc'  && <TabHPLC  product={product} />}
            {activeTab === 'coa'   && <TabCoA   product={product} />}
            {activeTab === 'batch' && <TabBatch product={product} />}
          </div>
        </div>

      </div>
    </div>
  );
}
