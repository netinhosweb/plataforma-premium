import { useState } from 'react';
import {
  CheckCircle, Users, DollarSign, Link2, Share2,
  ArrowRight, Gift, TrendingUp, Shield,
  Copy, Check, LogOut,
} from 'lucide-react';

// ─── Landing data ──────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  { icon: Link2,       step: 1, title: 'Cadastre-se',      desc: 'Preencha o formulário e receba seu código único de afiliado em instantes.' },
  { icon: Share2,      step: 2, title: 'Compartilhe',      desc: 'Divulgue seu link personalizado nas redes sociais, WhatsApp ou blog.' },
  { icon: DollarSign,  step: 3, title: 'Ganhe comissão',   desc: 'A cada compra realizada pelo seu link, você recebe 15% do valor em PIX.' },
  { icon: TrendingUp,  step: 4, title: 'Escale seus ganhos', desc: 'Quanto mais indicações, maior sua comissão. Sem limite de ganhos.' },
];

const BENEFITS = [
  { icon: Gift,      title: '15% de comissão',  desc: 'Sobre cada venda realizada via seu link' },
  { icon: DollarSign, title: 'Pagamento via PIX', desc: 'Direto na sua conta, sem burocracia' },
  { icon: Shield,    title: 'Painel de controle', desc: 'Acompanhe vendas e comissões em tempo real' },
  { icon: Users,     title: 'Suporte dedicado',  desc: 'Canal exclusivo de suporte para afiliados' },
];

// ─── Dashboard data ────────────────────────────────────────────────────────────
const COMMISSIONS = [
  { id: 'COM-001', date: '2024-06-01', client: 'Lab. Clínico Saúde+',    order: 'LP-A3B2C1', value: 348.90,  commission: 52.34,  status: 'pago'        },
  { id: 'COM-002', date: '2024-05-28', client: 'Clínica NovaMed',        order: 'LP-D4E5F6', value: 1890.00, commission: 283.50, status: 'pago'        },
  { id: 'COM-003', date: '2024-05-21', client: 'Unilabs Diagnósticos',   order: 'LP-G7H8I9', value: 412.50,  commission: 61.88,  status: 'pago'        },
  { id: 'COM-004', date: '2024-05-15', client: 'Diagnose Centro Médico', order: 'LP-J1K2L3', value: 645.00,  commission: 96.75,  status: 'pendente'    },
  { id: 'COM-005', date: '2024-05-10', client: 'Laboralpha S/A',         order: 'LP-M4N5O6', value: 289.00,  commission: 43.35,  status: 'pendente'    },
  { id: 'COM-006', date: '2024-04-30', client: 'Centro Analítico Beta',  order: 'LP-P7Q8R9', value: 2340.00, commission: 351.00, status: 'pago'        },
  { id: 'COM-007', date: '2024-04-22', client: 'Hemocenter SP',          order: 'LP-S1T2U3', value: 195.00,  commission: 29.25,  status: 'processando' },
  { id: 'COM-008', date: '2024-04-18', client: 'BioLab Pesquisas',       order: 'LP-V4W5X6', value: 500.60,  commission: 75.09,  status: 'pago'        },
];

const STATUS_MAP = {
  pago:        { label: 'Pago',        className: 'chip-green'  },
  pendente:    { label: 'Pendente',    className: 'chip-amber'  },
  processando: { label: 'Processando', className: 'chip-brand'  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const brl  = (v)   => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');

function generateCode(name) {
  const base = name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${base}${rand}`;
}

// ─── Dashboard: Stat card ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`card p-5 ${accent ? 'bg-navy-900 bg-molecule-grid' : ''}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${accent ? 'text-navy-200' : 'text-mute'}`}>
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${accent ? 'text-white' : 'text-navy-900'}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${accent ? 'text-navy-300' : 'text-mute'}`}>{sub}</p>}
    </div>
  );
}

// ─── Dashboard: Earnings SVG chart ────────────────────────────────────────────
function EarningsChart() {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const values = [320, 510, 290, 780, 640, 1247];
  const maxVal = Math.max(...values);
  const W = 540; const H = 140; const PAD = 20;
  const pts = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - v / maxVal) * (H - PAD * 2);
    return [x, y];
  });
  const area =
    `M${pts[0][0]},${H - PAD} ` +
    pts.map(([x, y]) => `L${x},${y}`).join(' ') +
    ` L${pts[pts.length - 1][0]},${H - PAD} Z`;

  return (
    <div className="card p-5">
      <p className="mb-4 text-sm font-semibold text-navy-900">Evolução de Comissões (últimos 6 meses)</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1d4ed8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0"    />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#cg)" />
        <polyline fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          points={pts.map(([x, y]) => `${x},${y}`).join(' ')} />
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="white" stroke="#1d4ed8" strokeWidth="2" />
            <text x={x} y={H - 2} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 10 }}>
              {months[i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Dashboard: Commission table ──────────────────────────────────────────────
function CommissionTable() {
  const [filter, setFilter] = useState('todos');
  const rows = filter === 'todos' ? COMMISSIONS : COMMISSIONS.filter((r) => r.status === filter);

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
                ${filter === s ? 'bg-navy-900 text-white' : 'text-mute hover:bg-haze hover:text-navy-900'}`}
            >
              {s === 'todos' ? 'Todos' : STATUS_MAP[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop */}
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
                  <td className="px-6 py-3.5 text-xs text-mute">{date(row.date)}</td>
                  <td className="px-6 py-3.5 font-medium text-navy-900">{row.client}</td>
                  <td className="px-6 py-3.5"><span className="font-mono text-xs text-mute">{row.order}</span></td>
                  <td className="px-6 py-3.5 text-navy-900">{brl(row.value)}</td>
                  <td className="px-6 py-3.5 font-semibold text-emerald-600">+ {brl(row.commission)}</td>
                  <td className="px-6 py-3.5"><span className={st.className}>{st.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="divide-y divide-haze-200 md:hidden">
        {rows.map((row) => {
          const st = STATUS_MAP[row.status] ?? STATUS_MAP.processando;
          return (
            <div key={row.id} className="p-4">
              <div className="flex justify-between">
                <p className="font-medium text-navy-900">{row.client}</p>
                <span className={st.className}>{st.label}</span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-mute">{row.order} · {date(row.date)}</p>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-mute">{brl(row.value)}</span>
                <span className="font-semibold text-emerald-600">+ {brl(row.commission)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {rows.length === 0 && (
        <p className="py-10 text-center text-sm text-mute">Nenhuma comissão com esse filtro.</p>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function PartnerDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [form, setForm]             = useState({ name: '', email: '', phone: '', cpf: '', pix_key: '' });
  const [loading, setLoading]       = useState(false);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [copied, setCopied]         = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setLoading(true);
    setTimeout(() => {
      setAffiliateCode(generateCode(form.name));
      setIsLoggedIn(true);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 800);
  };

  const affiliateLink = `https://labprime.com.br/ref/${affiliateCode || 'SEUCODE'}`;

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── ESTADO 1: LANDING PAGE ─────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-haze">
        {/* Hero */}
        <div className="bg-navy-900 bg-molecule-grid py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 50%, #1d4ed8 0%, transparent 70%)' }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Users className="h-3.5 w-3.5 text-brand" />
              PROGRAMA DE AFILIADOS · LABPRIME
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Ganhe Indicando<br />
              <span className="text-brand">LabPrime</span>
            </h1>
            <p className="text-white/65 text-lg max-w-2xl mx-auto leading-relaxed">
              Compartilhe seu link único e receba{' '}
              <strong className="text-white">15% de comissão</strong> em PIX por cada venda.
              Sem limite de ganhos, sem mensalidades.
            </p>
          </div>
        </div>

        {/* Benefits bar */}
        <div className="bg-brand py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-white/80 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">{title}</p>
                    <p className="text-[10px] text-white/65">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content: How it works + Form */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: How it works */}
            <div>
              <p className="text-xs font-bold text-brand uppercase tracking-widest mb-3">Como Funciona</p>
              <h2 className="text-3xl font-bold text-navy-900 mb-8 tracking-tight">
                Simples, Transparente<br />e Lucrativo
              </h2>
              <div className="space-y-6">
                {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-brand" />
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                        {step}
                      </span>
                    </div>
                    <div className="pt-1">
                      <h3 className="font-bold text-navy-900 mb-1">{title}</h3>
                      <p className="text-sm text-mute leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Earnings example */}
              <div className="mt-8 card p-5">
                <p className="text-xs font-bold text-navy-900 uppercase tracking-wide mb-3">Exemplo de Ganhos</p>
                <div className="space-y-2">
                  {[
                    { sales: 5,  label: '5 vendas/mês'  },
                    { sales: 20, label: '20 vendas/mês' },
                    { sales: 50, label: '50 vendas/mês' },
                  ].map(({ sales, label }) => (
                    <div key={sales} className="flex items-center justify-between py-1.5 border-b border-haze-200 last:border-0">
                      <span className="text-sm text-mute">{label}</span>
                      <span className="font-bold text-brand text-sm">
                        {brl(sales * 1000 * 0.15)}/mês
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-mute mt-2">
                  *Baseado em ticket médio de R$ 1.000. Resultados podem variar.
                </p>
              </div>
            </div>

            {/* Right: Signup form */}
            <div className="card p-8">
              <h3 className="text-xl font-bold text-navy-900 mb-1">Quero ser Afiliado</h3>
              <p className="text-sm text-mute mb-6">Preencha seus dados e receba seu link em minutos.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-navy-900 mb-1.5 block">Nome Completo *</label>
                  <input name="name" value={form.name} onChange={handleChange} required
                    className="input-base w-full" placeholder="Dra. Ana Silva" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy-900 mb-1.5 block">E-mail *</label>
                  <input name="email" value={form.email} onChange={handleChange} required type="email"
                    className="input-base w-full" placeholder="ana@clinica.com.br" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-navy-900 mb-1.5 block">WhatsApp</label>
                    <input name="phone" value={form.phone} onChange={handleChange}
                      className="input-base w-full" placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-navy-900 mb-1.5 block">CPF</label>
                    <input name="cpf" value={form.cpf} onChange={handleChange}
                      className="input-base w-full" placeholder="000.000.000-00" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy-900 mb-1.5 block">Chave PIX para Recebimento</label>
                  <input name="pix_key" value={form.pix_key} onChange={handleChange}
                    className="input-base w-full" placeholder="CPF, e-mail ou telefone" />
                </div>

                <button type="submit" disabled={loading}
                  className="btn-primary w-full h-12 text-base font-bold flex items-center justify-center gap-2">
                  {loading
                    ? 'Cadastrando...'
                    : <><span>Cadastrar como Afiliado</span><ArrowRight className="h-4 w-4" /></>
                  }
                </button>

                <p className="text-[10px] text-mute text-center">
                  Ao cadastrar, você concorda com os{' '}
                  <span className="text-brand cursor-pointer hover:underline">
                    Termos do Programa de Afiliados
                  </span>.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ESTADO 2: DASHBOARD DO PARCEIRO ───────────────────────────────────────
  const firstName = form.name.split(' ')[0];
  const PARTNER_BALANCE = 1_247.50;

  return (
    <div className="min-h-screen bg-haze">
      {/* Hero dashboard */}
      <div className="bg-navy-900 bg-molecule-grid relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 50%, #1d4ed8 0%, transparent 70%)' }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Cadastro realizado com sucesso!
              </p>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Bem-vindo, {firstName}! 🎉
            </h1>
            <p className="mt-1 text-sm text-navy-200">
              Seu link exclusivo foi gerado. Comece a compartilhar agora.
            </p>
          </div>
          <button
            onClick={() => { setIsLoggedIn(false); setAffiliateCode(''); }}
            className="flex items-center gap-1.5 rounded-xl border border-navy-600 bg-navy-800 px-3 py-2 text-xs font-medium text-navy-200 transition hover:bg-navy-700"
          >
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* Referral link banner */}
        <div className="card p-6 bg-navy-900 bg-molecule-grid relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(ellipse 100% 100% at 80% 50%, #1d4ed8 0%, transparent 70%)' }}
          />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-navy-300">
                  Seu link de indicação
                </p>
                <p className="mt-0.5 text-sm font-medium text-white">{form.name}</p>
              </div>
              <span className="chip-brand text-xs">Parceiro Ouro</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-navy-600 bg-navy-800/60 p-3">
              <Link2 className="h-4 w-4 text-navy-400 shrink-0" />
              <span className="flex-1 truncate font-mono text-xs text-navy-200">
                {affiliateLink}
              </span>
              <button
                onClick={copyLink}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all
                  ${copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
              >
                {copied
                  ? <><Check className="h-3.5 w-3.5" /> Copiado!</>
                  : <><Copy className="h-3.5 w-3.5" /> Copiar</>
                }
              </button>
            </div>
            <p className="mt-2 text-[11px] text-navy-400">
              Código: <strong className="font-mono text-navy-200">{affiliateCode}</strong>
              {' · '}Ganhe <strong className="text-white">15% de comissão</strong> em cada pedido aprovado.
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Saldo Disponível para Resgate"
            value={brl(PARTNER_BALANCE)}
            sub="Saque mínimo R$ 100,00"
            accent
          />
          <StatCard
            label="Cliques no Link"
            value="1.284"
            sub="Últimos 30 dias"
          />
          <StatCard
            label="Solicitações Convertidas"
            value="38 pedidos"
            sub="Taxa de conversão: 34%"
          />
        </div>

        {/* Chart + Saque side-by-side */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EarningsChart />
          </div>
          <div className="flex flex-col gap-4">
            {/* Saque CTA */}
            <div className="card flex flex-col justify-between gap-4 p-5 flex-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-mute">Saque disponível</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">{brl(PARTNER_BALANCE)}</p>
                <p className="mt-0.5 text-xs text-mute">Processamento em até 2 dias úteis</p>
              </div>
              <button className="btn-primary w-full bg-emerald-600 py-2.5 text-sm font-semibold hover:bg-emerald-700">
                Solicitar saque
              </button>
            </div>
            {/* Level badge */}
            <div className="card bg-navy-900 bg-molecule-grid p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-300">Nível atual</p>
              <p className="mt-2 text-xl font-bold text-white">Parceiro Ouro</p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-navy-300">
                  <span>38 conversões</span>
                  <span>Próximo: Diamante</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-700">
                  <div className="h-full rounded-full bg-brand" style={{ width: '76%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Withdraw notice */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Você tem {brl(PARTNER_BALANCE)} disponíveis para saque
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
