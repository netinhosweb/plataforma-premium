import { useState } from 'react';

// ─── Mock data ─────────────────────────────────────────────────────────────────
const PARTNER = {
  name:           'Dra. Marina Fonseca',
  referralCode:   'MARINA2024',
  referralLink:   'https://labprime.com.br/ref/MARINA2024',
  balance:        1_247.50,
  linkClicks:     1_284,
  conversions:    38,
  conversionRate: '34%',
  level:          'Parceiro Ouro',
};

const COMMISSIONS = [
  { id: 'COM-001', date: '2024-06-01', client: 'Lab. Clínico Saúde+',     order: 'LP-A3B2C1', value: 348.90, commission: 52.34, status: 'pago'       },
  { id: 'COM-002', date: '2024-05-28', client: 'Clínica NovaMed',         order: 'LP-D4E5F6', value: 1890.00, commission: 283.50, status: 'pago'      },
  { id: 'COM-003', date: '2024-05-21', client: 'Unilabs Diagnósticos',    order: 'LP-G7H8I9', value: 412.50, commission: 61.88, status: 'pago'        },
  { id: 'COM-004', date: '2024-05-15', client: 'Diagnose Centro Médico',  order: 'LP-J1K2L3', value: 645.00, commission: 96.75, status: 'pendente'    },
  { id: 'COM-005', date: '2024-05-10', client: 'Laboralpha S/A',          order: 'LP-M4N5O6', value: 289.00, commission: 43.35, status: 'pendente'    },
  { id: 'COM-006', date: '2024-04-30', client: 'Centro Analítico Beta',   order: 'LP-P7Q8R9', value: 2340.00, commission: 351.00, status: 'pago'      },
  { id: 'COM-007', date: '2024-04-22', client: 'Hemocenter SP',           order: 'LP-S1T2U3', value: 195.00, commission: 29.25, status: 'processando' },
  { id: 'COM-008', date: '2024-04-18', client: 'BioLab Pesquisas',        order: 'LP-V4W5X6', value: 500.60, commission: 75.09, status: 'pago'        },
];

const STATUS_MAP = {
  pago:         { label: 'Pago',         className: 'chip-green'  },
  pendente:     { label: 'Pendente',     className: 'chip-amber'  },
  processando:  { label: 'Processando',  className: 'chip-brand'  },
};

function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`card p-5 ${accent ? 'bg-navy-900 bg-molecule-grid text-white' : ''}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${accent ? 'text-navy-200' : 'text-mute'}`}>
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${accent ? 'text-white' : 'text-navy-900'}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${accent ? 'text-navy-300' : 'text-mute'}`}>{sub}</p>}
    </div>
  );
}

// ─── Referral link widget ─────────────────────────────────────────────────────
function ReferralCard() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(PARTNER.referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="card overflow-hidden">
      <div className="relative overflow-hidden bg-navy-900 bg-molecule-grid px-6 py-5">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 100% 100% at 80% 50%, #1d4ed8 0%, transparent 70%)',
          }}
        />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-200">
                Seu link de indicação
              </p>
              <p className="mt-0.5 text-sm font-medium text-white">{PARTNER.name}</p>
            </div>
            <span className="chip-brand text-xs">{PARTNER.level}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 rounded-xl border border-haze-200 bg-haze p-3">
          <span className="flex-1 truncate font-mono text-xs text-navy-700">
            {PARTNER.referralLink}
          </span>
          <button
            onClick={handleCopy}
            className={`btn-primary flex-shrink-0 px-3 py-1.5 text-xs transition-all ${
              copied ? 'bg-emerald-600 hover:bg-emerald-600' : ''
            }`}
          >
            {copied ? '✓ Copiado!' : 'Copiar'}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-mute-light">
          Compartilhe e ganhe{' '}
          <strong className="text-mute">15% de comissão</strong> em cada pedido
          indicado aprovado.
        </p>
      </div>
    </div>
  );
}

// ─── Commission table ─────────────────────────────────────────────────────────
function CommissionTable() {
  const [filter, setFilter] = useState('todos');

  const rows = filter === 'todos'
    ? COMMISSIONS
    : COMMISSIONS.filter((r) => r.status === filter);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-haze-200 px-6 py-4">
        <h3 className="text-sm font-semibold text-navy-900">Histórico de comissões</h3>
        <div className="flex gap-1.5">
          {['todos', 'pago', 'pendente', 'processando'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-all
                ${filter === s
                  ? 'bg-navy-900 text-white'
                  : 'text-mute hover:bg-haze hover:text-navy-900'}`}
            >
              {s === 'todos' ? 'Todos' : STATUS_MAP[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-haze-200 bg-haze">
              {['Data', 'Cliente', 'Pedido', 'Valor pedido', 'Comissão (15%)', 'Status'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-mute">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-haze-200">
            {rows.map((row) => {
              const st = STATUS_MAP[row.status] ?? STATUS_MAP.processando;
              return (
                <tr key={row.id} className="transition-colors hover:bg-haze/50">
                  <td className="px-6 py-3.5 text-xs text-mute">{formatDate(row.date)}</td>
                  <td className="px-6 py-3.5 font-medium text-navy-900">{row.client}</td>
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-xs text-mute">{row.order}</span>
                  </td>
                  <td className="px-6 py-3.5 text-navy-900">{formatBRL(row.value)}</td>
                  <td className="px-6 py-3.5 font-semibold text-emerald-600">
                    + {formatBRL(row.commission)}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={st.className}>{st.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-haze-200 md:hidden">
        {rows.map((row) => {
          const st = STATUS_MAP[row.status] ?? STATUS_MAP.processando;
          return (
            <div key={row.id} className="p-4">
              <div className="flex justify-between">
                <p className="font-medium text-navy-900">{row.client}</p>
                <span className={st.className}>{st.label}</span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-mute">{row.order} · {formatDate(row.date)}</p>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-mute">{formatBRL(row.value)}</span>
                <span className="font-semibold text-emerald-600">+ {formatBRL(row.commission)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {rows.length === 0 && (
        <p className="py-10 text-center text-sm text-mute">
          Nenhuma comissão com esse filtro.
        </p>
      )}
    </div>
  );
}

// ─── PartnerDashboard (main) ──────────────────────────────────────────────────
export default function PartnerDashboard() {
  return (
    <div className="min-h-screen bg-haze">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900 bg-molecule-grid">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 20% 50%, #1d4ed8 0%, transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-300">
            Painel do Parceiro
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            Olá, {PARTNER.name.split(' ')[1]} 👋
          </h1>
          <p className="mt-1 text-sm text-navy-200">
            Aqui está um resumo do seu desempenho como parceiro LabPrime.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        {/* Stats grid — 3 metric cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Saldo Disponível para Resgate"
            value={formatBRL(PARTNER.balance)}
            sub="Saque mínimo R$ 100,00"
            accent
          />
          <StatCard
            label="Cliques no Link"
            value={PARTNER.linkClicks.toLocaleString('pt-BR')}
            sub="Últimos 30 dias"
          />
          <StatCard
            label="Solicitações Convertidas"
            value={`${PARTNER.conversions} pedidos`}
            sub={`Taxa de conversão: ${PARTNER.conversionRate}`}
          />
        </div>

        {/* Referral link */}
        <ReferralCard />

        {/* Withdraw CTA */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Você tem {formatBRL(PARTNER.balance)} disponíveis para saque
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Saque mínimo de R$ 100,00 · Processamento em até 2 dias úteis
            </p>
          </div>
          <button className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-sm px-6">
            Solicitar saque
          </button>
        </div>

        {/* Commission table */}
        <CommissionTable />
      </div>
    </div>
  );
}
