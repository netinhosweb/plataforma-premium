import { useState, useEffect, useCallback } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Deterministic hash from a string — used to seed the QR pattern */
function strHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** Generate a seeded pseudo-random bool */
function seededBool(seed, x, y) {
  const n = strHash(`${seed}${x}${y}`);
  return n % 3 !== 0;
}

// ─── Mock data generators ────────────────────────────────────────────────────
function generatePixKey(orderId) {
  // Formato: chave aleatória UUID-like (simulado)
  const h = orderId.replace(/\W/g, '');
  const pad = (s, n) => s.padEnd(n, '0').slice(0, n);
  return `${pad(h, 8)}-${pad(h.slice(3), 4)}-4${pad(h.slice(5), 3)}-a${pad(h.slice(7), 3)}-${pad(h.slice(2), 12)}`.toLowerCase();
}

function generateBoletoCode(orderId, total) {
  // Simulated boleto barcode number (47 digits formatted)
  const seed = strHash(orderId + String(total));
  const digits = Array.from({ length: 47 }, (_, i) => (seed * (i + 7)) % 10);
  const raw = digits.join('');
  // Format: XXXXX.XXXXX XXXXX.XXXXXX XXXXX.XXXXXX X XXXXXXXXXXXXXXXX
  return `${raw.slice(0,5)}.${raw.slice(5,10)} ${raw.slice(10,15)}.${raw.slice(15,21)} ${raw.slice(21,26)}.${raw.slice(26,32)} ${raw.slice(32,33)} ${raw.slice(33,47)}`;
}

function getDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Mock QR Code SVG ─────────────────────────────────────────────────────────
function MockQRCode({ seed, size = 200 }) {
  const CELLS = 25;          // grid resolution
  const QUIET = 1;           // quiet zone in cells
  const TOTAL = CELLS + QUIET * 2;
  const cell = size / TOTAL;

  // Finder pattern helper: draws the three corner squares
  function isFinderCell(x, y) {
    const patterns = [
      { ox: 0,          oy: 0          },  // top-left
      { ox: TOTAL-7,    oy: 0          },  // top-right
      { ox: 0,          oy: TOTAL-7    },  // bottom-left
    ];
    for (const { ox, oy } of patterns) {
      const lx = x - ox - QUIET;
      const ly = y - oy - QUIET;
      if (lx >= 0 && lx < 7 && ly >= 0 && ly < 7) {
        // Outer ring
        if (lx === 0 || lx === 6 || ly === 0 || ly === 6) return true;
        // Inner 3×3
        if (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4) return true;
        return false;
      }
    }
    return null; // not in a finder zone
  }

  const rects = [];
  for (let row = 0; row < TOTAL; row++) {
    for (let col = 0; col < TOTAL; col++) {
      const inFinder = isFinderCell(col, row);
      let filled;
      if (inFinder === true)  filled = true;
      else if (inFinder === false) filled = false;
      else {
        // Data module: seeded pseudo-random
        const dc = col - QUIET;
        const dr = row - QUIET;
        // Timing pattern (row/col 6)
        if (dc === 6 || dr === 6) { filled = (dc + dr) % 2 === 0; }
        // Alignment pattern (centre area)
        else if (dc >= 16 && dc <= 20 && dr >= 16 && dr <= 20) {
          const ax = dc - 18, ay = dr - 18;
          filled = ax === 0 && ay === 0
            ? true
            : (Math.abs(ax) === 2 || Math.abs(ay) === 2);
        }
        else { filled = seededBool(seed, dc, dr); }
      }

      if (filled) {
        rects.push(
          <rect
            key={`${row}-${col}`}
            x={col * cell}
            y={row * cell}
            width={cell}
            height={cell}
            rx={cell * 0.12}
            fill="#0f2244"
          />
        );
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className="rounded-xl"
    >
      <rect width={size} height={size} fill="white" />
      {rects}
    </svg>
  );
}

// ─── Mock Barcode SVG ─────────────────────────────────────────────────────────
function MockBarcode({ seed, width = 280, height = 64 }) {
  const h = strHash(seed);
  // Generate 60 bars of varying widths (1–3 units), alternating black/white
  const bars = [];
  let x = 0;
  const totalUnits = 120;
  const unitW = width / totalUnits;

  for (let i = 0; i < 60; i++) {
    const units = 1 + ((strHash(`${h}${i}`) % 3));
    const w = units * unitW;
    if (i % 2 === 0) {
      bars.push(<rect key={i} x={x} y={0} width={w} height={height} fill="#0f2244" />);
    }
    x += w;
    if (x >= width) break;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
    >
      <rect width={width} height={height} fill="white" />
      {bars}
    </svg>
  );
}

// ─── PIX Countdown timer ──────────────────────────────────────────────────────
function PIXTimer({ minutes = 15 }) {
  const [secs, setSecs] = useState(minutes * 60);
  const expired = secs <= 0;

  useEffect(() => {
    if (expired) return;
    const id = setInterval(() => setSecs((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [expired]);

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  if (expired) {
    return (
      <span className="chip-amber text-xs font-semibold">
        ⚠ QR Code expirado — recarregue a página
      </span>
    );
  }

  return (
    <span className={`chip text-xs font-semibold tabular-nums
      ${secs <= 120 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
      ⏱ Expira em {mm}:{ss}
    </span>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ value, label = 'Copiar', className = '' }) {
  const [done, setDone] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className={`btn-primary px-4 py-2 text-xs transition-all flex-shrink-0
        ${done ? 'bg-emerald-600 hover:bg-emerald-600' : ''} ${className}`}
    >
      {done ? '✓ Copiado!' : label}
    </button>
  );
}

// ─── PIX Panel ────────────────────────────────────────────────────────────────
function PIXPanel({ orderId, total }) {
  const pixKey = generatePixKey(orderId);

  return (
    <div className="space-y-5">
      {/* Instructions */}
      <div className="rounded-xl bg-haze p-4">
        <p className="text-xs font-semibold text-navy-900">Como pagar via PIX</p>
        <ol className="mt-2 space-y-1 text-xs text-mute">
          <li className="flex gap-2">
            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">1</span>
            Abra o app do seu banco e escolha <strong>Pagar via PIX</strong>.
          </li>
          <li className="flex gap-2">
            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">2</span>
            Escaneie o QR Code <strong>ou</strong> cole a chave abaixo.
          </li>
          <li className="flex gap-2">
            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">3</span>
            Confirme o valor e finalize o pagamento.
          </li>
        </ol>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-haze-200 bg-white p-6">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-semibold uppercase tracking-wider text-mute">QR Code PIX</span>
          <PIXTimer minutes={15} />
        </div>
        <div className="p-3 rounded-2xl border-2 border-haze-200 bg-white shadow-card">
          <MockQRCode seed={orderId} size={192} />
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-emerald-600 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          <p className="text-xs font-medium text-emerald-700">
            Pagamento de <strong>{formatBRL(total)}</strong> 100% seguro via Banco Central
          </p>
        </div>
      </div>

      {/* Chave PIX copia e cola */}
      <div>
        <label className="label">Chave PIX (copia e cola)</label>
        <div className="flex items-center gap-2 rounded-xl border border-haze-200 bg-haze p-3">
          <span className="flex-1 truncate font-mono text-xs text-navy-700 select-all">
            {pixKey}
          </span>
          <CopyButton value={pixKey} label="Copiar chave" />
        </div>
        <p className="mt-1.5 text-[11px] text-mute-light">
          Selecione o texto ou use o botão para copiar a chave PIX completa.
        </p>
      </div>
    </div>
  );
}

// ─── Boleto Panel ─────────────────────────────────────────────────────────────
function BoletoPanel({ orderId, total }) {
  const boletoCode = generateBoletoCode(orderId, total);
  const dueDate    = getDueDate();

  return (
    <div className="space-y-5">
      {/* Instructions */}
      <div className="rounded-xl bg-haze p-4">
        <p className="text-xs font-semibold text-navy-900">Como pagar via Boleto</p>
        <ol className="mt-2 space-y-1 text-xs text-mute">
          <li className="flex gap-2">
            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-navy-900 text-[9px] font-bold text-white">1</span>
            Copie a linha digitável abaixo.
          </li>
          <li className="flex gap-2">
            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-navy-900 text-[9px] font-bold text-white">2</span>
            Cole no app do seu banco ou internet banking.
          </li>
          <li className="flex gap-2">
            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-navy-900 text-[9px] font-bold text-white">3</span>
            Confirme o pagamento. Prazo: até {dueDate}.
          </li>
        </ol>
      </div>

      {/* Barcode visual */}
      <div className="rounded-2xl border border-haze-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-mute">Boleto Bancário</p>
            <p className="text-sm font-bold text-navy-900 mt-0.5">{formatBRL(total)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-mute uppercase tracking-wider">Vencimento</p>
            <p className="text-sm font-semibold text-navy-900">{dueDate}</p>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-haze-200 py-3 px-4 bg-white">
          <MockBarcode seed={orderId + total} width={280} height={56} />
        </div>
        <p className="mt-2 text-center font-mono text-[10px] text-mute-light tracking-widest">
          {orderId}
        </p>
      </div>

      {/* Linha digitável */}
      <div>
        <label className="label">Linha digitável</label>
        <div className="flex items-start gap-2 rounded-xl border border-haze-200 bg-haze p-3">
          <span className="flex-1 font-mono text-[11px] leading-relaxed text-navy-700 break-all select-all">
            {boletoCode}
          </span>
          <CopyButton value={boletoCode} label="Copiar" className="mt-0.5" />
        </div>
      </div>

      {/* Warning */}
      <div className="flex gap-2 rounded-xl bg-amber-50 px-4 py-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <p className="text-xs text-amber-700">
          O boleto vence em <strong>{dueDate}</strong>. Após o vencimento, o pedido é
          automaticamente cancelado.
        </p>
      </div>
    </div>
  );
}

// ─── OrderSuccess ──────────────────────────────────────────────────────────────
export default function OrderSuccess({ orderData, onBackToShop }) {
  const [payMethod, setPayMethod] = useState('pix');

  const orderId = `LP-${strHash(JSON.stringify(orderData ?? {})).toString(36).toUpperCase().slice(0, 7)}`;
  const { personal, address, total = 0 } = orderData ?? {};

  const tabs = [
    { id: 'pix',    label: 'PIX',    sub: 'Instantâneo · Gratuito'    },
    { id: 'boleto', label: 'Boleto', sub: 'Vence em 2 dias úteis'     },
  ];

  return (
    <div className="min-h-screen bg-haze">
      {/* ── Confirmed header ── */}
      <section className="relative overflow-hidden bg-navy-900 bg-molecule-grid">
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 50%, #059669 0%, transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-2xl px-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lift">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Pedido Confirmado!</h1>
          <p className="mt-1 text-sm text-navy-200">
            Nº{' '}
            <span className="font-mono font-bold text-brand-light">{orderId}</span>
            {personal?.nome && ` · ${personal.nome}`}
          </p>
          {address?.cidade && (
            <p className="mt-1 text-xs text-navy-300">
              {address.logradouro}, {address.numero} · {address.cidade}/{address.estado}
            </p>
          )}
        </div>
      </section>

      {/* ── Payment section ── */}
      <div className="mx-auto max-w-xl px-6 py-10 space-y-6">
        {/* Total callout */}
        <div className="card flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-mute">
              Total a pagar
            </p>
            <p className="text-2xl font-bold text-navy-900">{formatBRL(total)}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6 text-emerald-600">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
          </div>
        </div>

        {/* Payment method tabs */}
        <div className="card overflow-hidden">
          {/* Tab header */}
          <div className="grid grid-cols-2 border-b border-haze-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPayMethod(tab.id)}
                className={`flex flex-col items-center py-4 transition-all
                  ${payMethod === tab.id
                    ? 'bg-white border-b-2 border-brand text-navy-900'
                    : 'bg-haze text-mute hover:text-navy-900'}`}
              >
                <span className="text-sm font-semibold">{tab.label}</span>
                <span className="mt-0.5 text-[10px] font-medium">{tab.sub}</span>
              </button>
            ))}
          </div>

          {/* Tab body */}
          <div className="p-6">
            {payMethod === 'pix'    && <PIXPanel    orderId={orderId} total={total} />}
            {payMethod === 'boleto' && <BoletoPanel orderId={orderId} total={total} />}
          </div>
        </div>

        {/* Next steps */}
        <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
          <p className="text-xs font-semibold text-navy-900">Após o pagamento</p>
          <ul className="mt-2 space-y-1 text-xs text-mute">
            <li>· Confirmação automática em até 5 min (PIX) ou 1 dia útil (Boleto).</li>
            <li>· Você receberá um e-mail com o código de rastreio assim que o pedido for separado.</li>
            <li>· Prazo de entrega: 1–3 dias úteis após confirmação.</li>
          </ul>
        </div>

        {/* Back to shop */}
        <button onClick={onBackToShop} className="btn-ghost w-full py-3">
          Continuar comprando
        </button>

        <p className="text-center text-[11px] text-mute-light pb-6">
          Dúvidas? contato@labprime.com.br · (11) 4000-1234
        </p>
      </div>
    </div>
  );
}
