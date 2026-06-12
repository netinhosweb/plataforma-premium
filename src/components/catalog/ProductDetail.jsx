import { useState, useMemo } from 'react';
import { useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { products } from '../../data/products';

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

// ─── Mock data generators ─────────────────────────────────────────────────────
function makeCoA(product) {
  const s  = seededHash(product.sku);
  const yr = 2024 + (s % 2);
  const mo = String(1 + (s % 12)).padStart(2, '0');
  const dy = String(1 + (s % 27)).padStart(2, '0');
  const lot = `LP${yr}${mo}${String(s % 9999).padStart(4, '0')}`;
  return {
    lot,
    manufactured: `${dy}/${mo}/${yr}`,
    expiry: `${dy}/${mo}/${yr + 2}`,
  };
}

function makeSobre(product) {
  const s = seededHash(product.sku);
  const specs = {
    kits: {
      formula: `C${12 + (s % 8)}H${18 + (s % 10)}N${2 + (s % 3)}O${4 + (s % 4)}`,
      cas: `${12000 + (s % 8000)}-${String(10 + (s % 80)).padStart(2,'0')}-${1 + (s % 9)}`,
      grade: 'Grau Analítico (HPLC)',
      storage: '2–8 °C, ao abrigo da luz e umidade',
      solubility: 'Solúvel em metanol e acetonitrila',
      mw: `${280 + (s % 200)},${String(s % 100).padStart(2,'0')} g/mol`,
    },
    reagentes: {
      formula: `C${8 + (s % 6)}H${14 + (s % 8)}O${3 + (s % 3)}`,
      cas: `${5000 + (s % 3000)}-${String(20 + (s % 70)).padStart(2,'0')}-${2 + (s % 8)}`,
      grade: 'Grau Reagente (ACS)',
      storage: 'Temperatura ambiente, local seco e ventilado',
      solubility: 'Solúvel em água e etanol',
      mw: `${80 + (s % 120)},${String(s % 100).padStart(2,'0')} g/mol`,
    },
    equipamentos: {
      formula: 'N/A',
      cas: 'N/A',
      grade: 'Equipamento Laboratorial',
      storage: 'Temperatura ambiente (15–35 °C), longe de vibrações',
      solubility: 'N/A',
      mw: 'N/A',
    },
    consumiveis: {
      formula: 'N/A',
      cas: 'N/A',
      grade: 'Consumível Laboratorial',
      storage: 'Temperatura ambiente, longe de umidade e luz direta',
      solubility: 'N/A',
      mw: 'N/A',
    },
  };
  return specs[product.category] ?? specs.kits;
}

function makeBeneficios(product) {
  const allBeneficios = {
    kits: [
      { icon: '🔬', title: 'Alta Pureza Analítica', desc: 'Pureza ≥ 98% verificada por HPLC, garantindo resultados confiáveis em todos os ensaios.' },
      { icon: '📋', title: 'Laudo por Lote', desc: 'Cada lote acompanha relatório de análise completo com todos os parâmetros testados e aprovados.' },
      { icon: '⚗️', title: 'Rastreabilidade Total', desc: 'Número de lote rastreável desde a síntese até a entrega, conforme ISO 9001:2015.' },
      { icon: '🌡️', title: 'Estabilidade Comprovada', desc: 'Validade de 24 meses em condições adequadas de armazenamento.' },
      { icon: '🚀', title: 'Pronto para Uso', desc: 'Formulado para uso imediato em métodos analíticos, sem necessidade de preparo adicional.' },
      { icon: '🏆', title: 'Compatível com GMP', desc: 'Produzido em instalações certificadas, adequado para pesquisa e controle de qualidade farmacêutico.' },
    ],
    reagentes: [
      { icon: '⚗️', title: 'Grau Reagente ACS', desc: 'Pureza e consistência em conformidade com os padrões da American Chemical Society.' },
      { icon: '🔍', title: 'Baixo Teor de Impurezas', desc: 'Teor de metais pesados < 10 ppm, ideal para análises de alta sensibilidade.' },
      { icon: '📦', title: 'Embalagem Protetora', desc: 'Frasco âmbar com lacre inviolável, protegendo da luz e da umidade durante toda a vida útil.' },
      { icon: '🧪', title: 'Ampla Compatibilidade', desc: 'Compatível com HPLC, GC, espectrofotometria e outros métodos analíticos consagrados.' },
      { icon: '♻️', title: 'Descarte Responsável', desc: 'Produção com mínimo de resíduos; acompanha FISPQ completo para descarte correto e seguro.' },
      { icon: '📊', title: 'Lote Homogêneo', desc: 'Controle rigoroso de processo garante homogeneidade entre amostras do mesmo lote.' },
    ],
    equipamentos: [
      { icon: '⚙️', title: 'Precisão e Durabilidade', desc: 'Fabricado com materiais de alta qualidade para longa vida útil em ambiente laboratorial exigente.' },
      { icon: '🔧', title: 'Fácil Manutenção', desc: 'Design modular que facilita limpeza, calibração e substituição de peças consumíveis.' },
      { icon: '📐', title: 'Alta Precisão', desc: 'Tolerâncias de fabricação dentro dos padrões exigidos por normas internacionais de metrologia.' },
      { icon: '🔒', title: 'Segurança do Operador', desc: 'Dispositivos de segurança integrados protegem o usuário durante todas as etapas de operação.' },
      { icon: '📝', title: 'Manual em Português', desc: 'Documentação completa em PT-BR, incluindo procedimentos de calibração, uso e manutenção.' },
      { icon: '🌐', title: 'Suporte Técnico', desc: 'Assistência técnica disponível via WhatsApp e e-mail para toda a vida útil do equipamento.' },
    ],
    consumiveis: [
      { icon: '✅', title: 'Qualidade Consistente', desc: 'Fabricação em lote com controle rigoroso, garantindo uniformidade dimensional entre todas as unidades.' },
      { icon: '🔬', title: 'Livre de DNase/RNase', desc: 'Testado e certificado como livre de contaminantes enzimáticos que comprometeriam resultados biológicos.' },
      { icon: '📦', title: 'Estéril e Selado', desc: 'Embalagem individual selada a quente, garantindo esterilidade até o momento exato do uso.' },
      { icon: '♻️', title: 'Descarte Facilitado', desc: 'Materiais compatíveis com protocolos padrão de descarte de resíduos laboratoriais.' },
      { icon: '💰', title: 'Custo-Benefício', desc: 'Compra em kit reduz custo por unidade em até 30% comparado à compra avulsa no mercado.' },
      { icon: '🏷️', title: 'Rastreabilidade', desc: 'Código de lote impresso em cada embalagem para rastreabilidade completa dos experimentos.' },
    ],
  };
  return allBeneficios[product.category] ?? allBeneficios.kits;
}

function makeRendimento(product) {
  const s = seededHash(product.sku);
  const tables = {
    kits: {
      header: ['Aplicação', 'Concentração', 'Volume por Ensaio', 'Ensaios por Embalagem'],
      rows: [
        ['HPLC — Curva padrão',         `${(0.1 + (s % 5) * 0.1).toFixed(1)} mg/mL`,  '1,0 mL',  `${(s % 30) + 50} ensaios`],
        ['HPLC — Amostras rotina',       `${(0.5 + (s % 3) * 0.2).toFixed(1)} mg/mL`,  '0,5 mL',  `${(s % 50) + 80} ensaios`],
        ['Espectrofotometria UV',         `${(0.05 + (s % 4) * 0.05).toFixed(2)} mg/mL`, '3,0 mL', `${(s % 20) + 30} ensaios`],
        ['Validação de método',           `${(0.01 + (s % 9) * 0.01).toFixed(2)} mg/mL`, '2,0 mL', `${(s % 15) + 20} ensaios`],
        ['Controle de qualidade in-line', `${(0.2 + (s % 6) * 0.1).toFixed(1)} mg/mL`,  '1,5 mL',  `${(s % 40) + 60} ensaios`],
      ],
      note: `Rendimento estimado para ${product.unit}. Condições: temperatura ambiente, solvente adequado ao produto. Consumo real pode variar conforme protocolo do laboratório.`,
    },
    reagentes: {
      header: ['Aplicação', 'Diluição', 'Volume Preparado', 'Rendimento'],
      rows: [
        ['Solução estoque 1 M',     '1:1 em H₂O grau HPLC', '100 mL',   `${(s % 5) + 8} preparos`],
        ['Tampão de corrida',       '1:10',                  '1.000 mL', `${(s % 3) + 3} preparos`],
        ['Padrão primário',         '1:100',                 '500 mL',   `${(s % 8) + 15} preparos`],
        ['Reagente de trabalho',    '1:50',                  '250 mL',   `${(s % 6) + 10} preparos`],
        ['Lavagem de sistema',      'Puro',                  '50 mL',    `${(s % 10) + 20} lavagens`],
      ],
      note: `Estimativa baseada em uso laboratorial padrão com ${product.unit}. Validade da solução preparada varia conforme pH e temperatura de armazenamento.`,
    },
    equipamentos: {
      header: ['Especificação Técnica', 'Valor', 'Norma de Ref.', 'Observação'],
      rows: [
        ['Capacidade de throughput',  `${100 + (s % 400)} amostras/dia`,  'ASTM E1184', 'Operação contínua'],
        ['Precisão instrumental',     `±${(0.1 + (s % 9) * 0.1).toFixed(1)}%`,           'ISO 8655',   'Verificado na calibração'],
        ['Vida útil estimada',        `${3 + (s % 5)} anos`,              'N/A',        'Com manutenção preventiva'],
        ['Consumo elétrico típico',   `${50 + (s % 150)} W`,              'IEC 61010',  'Em operação normal'],
        ['Faixa de temperatura de uso', `${15 + (s % 5)}–${35 + (s % 5)} °C`, 'ISO 3696', 'Laboratório climatizado'],
      ],
      note: 'Especificações verificadas individualmente antes do despacho. Acompanha certificado de inspeção de qualidade.',
    },
    consumiveis: {
      header: ['Configuração', 'Qtd. por Embalagem', 'Aplicação Típica', 'Observação'],
      rows: [
        ['Unidade padrão',     `${10 + (s % 40)} un.`,   product.unit,   'Experimentos diários'],
        ['Kit econômico',      `${50 + (s % 100)} un.`,  'Pack ×5',      'Análises em série'],
        ['Kit profissional',   `${200 + (s % 300)} un.`, 'Pack ×20',     'Alta demanda'],
      ],
      note: 'Quantidades indicativas. Consumo real varia conforme protocolo experimental e método de manipulação adotado.',
    },
  };
  return tables[product.category] ?? tables.kits;
}

// ─── Category palette ─────────────────────────────────────────────────────────
const CAT_PALETTE = {
  kits        : { from: '#1e3a8a', to: '#3b82f6', accent: '#93c5fd', label: 'Kit de Análise'    },
  reagentes   : { from: '#4c1d95', to: '#8b5cf6', accent: '#c4b5fd', label: 'Reagente Técnico'  },
  equipamentos: { from: '#134e4a', to: '#0d9488', accent: '#5eead4', label: 'Equipamento'        },
  consumiveis : { from: '#78350f', to: '#d97706', accent: '#fcd34d', label: 'Consumível'         },
};

// ─── Media thumbnails ─────────────────────────────────────────────────────────
function ThumbHero({ product, large }) {
  const pal = CAT_PALETTE[product.category] ?? CAT_PALETTE.kits;
  const s   = seededHash(product.sku);
  const dots = Array.from({ length: large ? 30 : 6 }, (_, i) => ({
    cx: 10 + ((s * (i + 3)) % 80), cy: 10 + ((s * (i + 7)) % 80),
    r: 1.5 + ((s * (i + 1)) % 3) * 0.5,
  }));
  const lines = Array.from({ length: large ? 15 : 3 }, (_, i) => ({
    x1: ((s * (i + 1)) % 90) + 5, y1: ((s * (i + 5)) % 90) + 5,
    x2: ((s * (i + 9)) % 90) + 5, y2: ((s * (i + 3)) % 90) + 5,
  }));
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${pal.from} 0%, ${pal.to} 100%)` }}>
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {lines.map((l, i) => <line key={i} {...l} stroke="white" strokeWidth="0.5" />)}
        {dots.map((d, i) => <circle key={i} {...d} fill="white" />)}
      </svg>
      <div className="relative flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
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
  const pur = 98 + (s % 180) / 100;
  const W = 280, H = 120;
  const peaks = [
    { rt: 2.1 + (s % 8) / 10,  height: 8 + (s % 12),  width: 8 },
    { rt: 4.1 + (s % 20) / 10, height: 12 + (s % 15), width: 10 },
    { rt: 7.8 + (s % 15) / 10, height: 18 + (s % 20), width: 12 },
    { rt: 11.2 + (s % 30) / 10, height: 85 + (s % 10), width: 18 },
  ];
  const maxRT = 20;
  function peakPath(rt, h, w) {
    const x = (rt / maxRT) * W;
    const y = H - h;
    const hw = w * 4;
    return `M ${x - hw} ${H} Q ${x} ${y} ${x + hw} ${H}`;
  }
  return (
    <div className="w-full h-full bg-navy-950 flex flex-col p-2 overflow-hidden" style={{ background: '#060f1e' }}>
      {large && <p className="text-[9px] font-mono text-emerald-400/70 mb-1 pl-2">HPLC · UV 254 nm · Purity: {pur.toFixed(1)}%</p>}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full flex-1">
        <line x1="0" y1={H} x2={W} y2={H} stroke="#1e3a5f" strokeWidth="0.5" />
        {[0.2, 0.4, 0.6, 0.8].map(y => (
          <line key={y} x1="0" y1={H * y} x2={W} y2={H * y} stroke="#1e3a5f" strokeWidth="0.3" strokeDasharray="2,4" />
        ))}
        {peaks.map((pk, i) => (
          <path key={i} d={peakPath(pk.rt, pk.height, pk.width)}
            fill={i === 3 ? '#2563eb' : '#64748b'} fillOpacity="0.7"
            stroke={i === 3 ? '#3b82f6' : '#475569'} strokeWidth="0.5" />
        ))}
        {large && (
          <text x={(peaks[3].rt / maxRT) * W} y={H - peaks[3].height - 4}
            fill="#93c5fd" fontSize="6" textAnchor="middle" fontFamily="monospace">
            {pur.toFixed(2)}%
          </text>
        )}
      </svg>
      {large && <p className="text-[8px] font-mono text-slate-600 text-center mt-1">Retention Time (min) →</p>}
    </div>
  );
}

function ThumbMolecule({ product, large }) {
  const s = seededHash(product.sku);
  const W = 200, H = 150;
  const cx = W / 2, cy = H / 2, r = large ? 38 : 28;
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  const chains = [
    { from: hex[0], to: { x: hex[0].x + 22, y: hex[0].y - 14 } },
    { from: hex[2], to: { x: hex[2].x + 18, y: hex[2].y + 18 } },
    { from: hex[4], to: { x: hex[4].x - 20, y: hex[4].y - 8 } },
  ];
  const atoms = [
    { x: chains[0].to.x, y: chains[0].to.y, label: 'OH',   color: '#f87171' },
    { x: chains[1].to.x, y: chains[1].to.y, label: 'NH₂',  color: '#60a5fa' },
    { x: chains[2].to.x, y: chains[2].to.y, label: 'COOH', color: '#34d399' },
  ];
  return (
    <div className="w-full h-full flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg,#0f1729 0%,#0f2244 100%)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full max-w-full">
        {hex.map((_, i) => {
          const a = hex[i], b = hex[(i + 1) % 6];
          const isDouble = i % 2 === 0;
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#3b82f6" strokeWidth="1.5" />
              {isDouble && (
                <line x1={a.x * 0.96 + b.x * 0.04} y1={a.y * 0.96 + b.y * 0.04}
                  x2={a.x * 0.04 + b.x * 0.96} y2={a.y * 0.04 + b.y * 0.96}
                  stroke="#3b82f6" strokeWidth="0.5" opacity="0.5" />
              )}
            </g>
          );
        })}
        {chains.map((c, i) => (
          <line key={i} x1={c.from.x} y1={c.from.y} x2={c.to.x} y2={c.to.y} stroke="#64748b" strokeWidth="1.2" />
        ))}
        {atoms.map((a, i) => (
          <text key={i} x={a.x} y={a.y + 1} fill={a.color} fontSize="7"
            textAnchor="middle" fontFamily="monospace" fontWeight="bold">{a.label}</text>
        ))}
        <circle cx={cx} cy={cy} r={r * 0.45} fill="none" stroke="#1d4ed8" strokeWidth="0.8" strokeDasharray="3,2" />
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
        <div className="h-1 flex-1 rounded" style={{ background: pal.from }} />
        <span className="text-[8px] font-bold tracking-widest uppercase text-navy-900">LabPrime</span>
        <div className="h-1 flex-1 rounded" style={{ background: pal.from }} />
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
      style={{ background: 'linear-gradient(135deg,#111827 0%,#1e2940 100%)' }}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/30"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5 ml-0.5">
            <path d="M6 4l14 8-14 8V4z" />
          </svg>
        </div>
        <span className="text-[8px] text-white/50 font-medium">Vídeo Técnico</span>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
const IconBeaker = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4.26 10.147a60 60 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
  </svg>
);
const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);
const IconTable = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-3.5 w-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V6.375m0 0A1.125 1.125 0 014.5 5.25h15a1.125 1.125 0 011.125 1.125M3.375 6.375h17.25m0 0v12m0 0A1.125 1.125 0 0119.5 19.5h-1.5c-.621 0-1.125-.504-1.125-1.125M20.625 6.375V18.375M6 18.375V9m0 0h12v9.375M6 9h12" />
  </svg>
);

// ─── Tab: Sobre o Produto ─────────────────────────────────────────────────────
function TabSobre({ product }) {
  const specs = useMemo(() => makeSobre(product), [product]);
  return (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <h4 className="label mb-2">Descrição do Produto</h4>
        <p className="text-sm leading-relaxed text-mute">{product.description}</p>
      </div>

      {/* Tech specs grid */}
      <div>
        <h4 className="label mb-3">Especificações Técnicas</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { label: 'Grau / Categoria',     value: specs.grade },
            { label: 'Armazenamento',         value: specs.storage },
            { label: 'Fórmula Molecular',     value: specs.formula,     mono: true },
            { label: 'N.º CAS',               value: specs.cas,         mono: true },
            { label: 'Massa Molar',            value: specs.mw,          mono: true },
            { label: 'Solubilidade',           value: specs.solubility },
          ].filter(s => s.value !== 'N/A').map(spec => (
            <div key={spec.label} className="rounded-xl bg-haze p-4">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-mute mb-1">{spec.label}</p>
              <p className={`text-sm text-navy-900 ${spec.mono ? 'font-mono' : 'font-medium'}`}>{spec.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Safety note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <span className="text-lg">⚠️</span>
        <div>
          <p className="text-xs font-semibold text-amber-800 mb-0.5">Manuseio e Segurança</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Use equipamentos de proteção individual (EPI) adequados. Consulte a FISPQ disponível mediante solicitação
            para informações completas sobre riscos, manuseio seguro e procedimentos de emergência.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Benefícios Comprovados ──────────────────────────────────────────────
function TabBeneficios({ product }) {
  const beneficios = useMemo(() => makeBeneficios(product), [product]);
  return (
    <div className="space-y-4">
      <p className="text-sm text-mute leading-relaxed">
        Desenvolvido para atender às mais exigentes demandas laboratoriais, com qualidade comprovada em cada lote produzido.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {beneficios.map((b, i) => (
          <div key={i} className="flex gap-4 rounded-2xl border border-haze-200 bg-white p-4 transition-shadow hover:shadow-lift">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-haze text-xl">
              {b.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900 mb-1">{b.title}</p>
              <p className="text-xs leading-relaxed text-mute">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quality footer */}
      <div className="rounded-xl bg-brand/5 border border-brand/10 p-4 flex items-center gap-3">
        <IconShield />
        <p className="text-xs text-navy-700 leading-relaxed">
          <span className="font-semibold">Certificação ISO 9001:2015.</span>{' '}
          Todos os produtos LabPrime são fabricados e controlados conforme normas internacionais de qualidade.
          Laudo de análise disponível mediante solicitação.
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Tabela de Rendimento ────────────────────────────────────────────────
function TabRendimento({ product }) {
  const table = useMemo(() => makeRendimento(product), [product]);
  return (
    <div className="space-y-6">
      <p className="text-sm text-mute leading-relaxed">
        Estimativas de rendimento por aplicação, baseadas em condições laboratoriais padrão.
        Os valores abaixo são referências — o consumo real pode variar conforme o protocolo adotado.
      </p>

      {/* Main table */}
      <div className="overflow-x-auto rounded-xl border border-haze-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-haze-200 bg-haze">
              {table.header.map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-semibold text-mute uppercase tracking-wider text-[10px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i} className="border-b border-haze-200 last:border-0 hover:bg-haze/50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-medium text-navy-900' : 'font-mono text-navy-700'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <p className="text-[11px] leading-relaxed text-mute border-t border-haze-200 pt-4">
        📌 {table.note}
      </p>
    </div>
  );
}

// ─── ProductDetail (main export) ─────────────────────────────────────────────
export default function ProductDetail() {
  const navigate  = useNavigate();
  const { sku }   = useParams();
  const { state } = useLocation();
  const product   = state?.product ?? products.find(p => p.sku === sku) ?? null;

  const { addItem } = useCart();

  const [activeThumb, setActiveThumb] = useState(0);
  const [qty,         setQty]         = useState(1);
  const [activeTab,   setActiveTab]   = useState('sobre');
  const [addedAnim,   setAddedAnim]   = useState(false);

  const s      = seededHash(product?.sku ?? '');
  const purity = (98 + (s % 180) / 100).toFixed(1);
  const coa    = useMemo(() => product ? makeCoA(product) : {}, [product]);
  const pal    = CAT_PALETTE[product?.category] ?? CAT_PALETTE.kits;

  // Guard: if product not found, redirect to catalog
  if (!product) return <Navigate to="/" replace />;

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) addItem(product);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1800);
  }

  const thumbs = [
    { label: 'Produto',       render: (large) => <ThumbHero         product={product} large={large} /> },
    { label: 'Estrutura',     render: (large) => <ThumbMolecule     product={product} large={large} /> },
    { label: 'Cromatograma',  render: (large) => <ThumbChromatogram product={product} large={large} /> },
    { label: 'Embalagem',     render: (_)     => <ThumbLabel        product={product}               /> },
    { label: 'Vídeo Técnico', render: (_)     => <ThumbVideo                                        /> },
  ];

  const tabs = [
    { id: 'sobre',      label: 'Sobre o Produto',       icon: <IconInfo />  },
    { id: 'beneficios', label: 'Benefícios Comprovados', icon: <IconStar />  },
    { id: 'rendimento', label: 'Tabela de Rendimento',   icon: <IconTable /> },
  ];

  const badgeColors = { 'Mais vendido': 'chip-brand', 'Novo': 'chip-green', 'Oferta': 'chip-amber', 'Premium': 'chip-navy' };
  const shipping    = product.price * qty >= 500 ? 'Frete Grátis' : `+ R$ 35 frete`;

  return (
    <div className="min-h-screen bg-haze">

      {/* ── Sticky header with prominent back button ── */}
      <div className="sticky top-0 z-40 border-b border-haze-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl border border-haze-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 shadow-sm transition-all hover:border-brand hover:text-brand hover:shadow-lift active:scale-95"
          >
            <ChevronLeft />
            <span>Voltar ao catálogo</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-mute min-w-0">
            <span className="whitespace-nowrap">Catálogo</span>
            <span className="text-haze-300">›</span>
            <span className="text-mute whitespace-nowrap">{pal.label}</span>
            <span className="text-haze-300">›</span>
            <span className="text-navy-900 font-medium truncate">{product.name}</span>
          </div>
          <span className="font-mono text-xs text-mute-light whitespace-nowrap">{product.sku}</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-10">

        {/* ── MAIN GRID: Media + Spec ── */}
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">

          {/* ── LEFT: Media ── */}
          <div className="space-y-3">
            <div className="card overflow-hidden" style={{ height: '420px' }}>
              {thumbs[activeThumb].render(true)}
              {activeThumb === 4 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="chip bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                    Simulação de Vídeo Técnico
                  </span>
                </div>
              )}
            </div>
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
                  {i === 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80">
                        <svg viewBox="0 0 24 24" fill="#0f2244" className="h-3 w-3 ml-0.5">
                          <path d="M6 4l14 8-14 8V4z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {activeThumb === i && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] font-medium text-mute uppercase tracking-wider">
              {thumbs[activeThumb].label}
            </p>
          </div>

          {/* ── RIGHT: Spec & Order ── */}
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="chip text-[10px] font-bold" style={{ background: pal.from + '22', color: pal.to }}>
                {pal.label}
              </span>
              <span className="chip chip-green text-[10px] font-bold">
                <IconShield /> Pureza {purity}% HPLC
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
                { label: 'SKU / Ref.',  value: product.sku,  mono: true  },
                { label: 'Lote',        value: coa.lot,      mono: true  },
                { label: 'Unidade',     value: product.unit, mono: false },
                { label: 'Validade',    value: coa.expiry,   mono: true  },
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
                { icon: '📋', text: 'Laudo por lote' },
                { icon: '🏆', text: 'ISO 9001:2015'  },
                { icon: '🚚', text: 'Entrega expressa' },
              ].map(b => (
                <div key={b.text} className="flex flex-col items-center gap-1 rounded-xl bg-haze p-2.5 text-center">
                  <span className="text-lg">{b.icon}</span>
                  <p className="text-[9px] font-medium text-mute leading-tight">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM: Tabs ── */}
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
            {activeTab === 'sobre'      && <TabSobre      product={product} />}
            {activeTab === 'beneficios' && <TabBeneficios product={product} />}
            {activeTab === 'rendimento' && <TabRendimento product={product} />}
          </div>
        </div>

      </div>
    </div>
  );
}
