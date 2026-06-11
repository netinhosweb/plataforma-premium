import { useState, useCallback } from 'react';
import { useCart } from '../../context/CartContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatCEP(v) {
  return v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
}
function formatPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const LoadingSpinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = ['Dados pessoais', 'Endereço', 'Revisão'];
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done    = idx < current;
        const active  = idx === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors
                  ${done   ? 'bg-emerald-500 text-white'
                  : active ? 'bg-navy-900 text-white'
                           : 'bg-haze-200 text-mute'}`}
              >
                {done ? '✓' : idx}
              </div>
              <span className={`mt-1 text-[10px] font-medium ${active ? 'text-navy-900' : 'text-mute-light'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mb-4 h-px w-12 transition-colors ${done ? 'bg-emerald-300' : 'bg-haze-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Order Summary (sidebar) ─────────────────────────────────────────────────
function OrderSummary({ items, subtotal }) {
  const shipping = subtotal >= 500 ? 0 : 35;
  return (
    <div className="card sticky top-24 p-5">
      <h3 className="mb-4 text-sm font-semibold text-navy-900">Resumo do pedido</h3>
      <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-navy-50 text-[10px] font-bold text-navy-600">
              {item.quantity}x
            </span>
            <div className="flex flex-1 justify-between gap-2">
              <p className="line-clamp-2 text-xs text-navy-900">{item.name}</p>
              <p className="text-xs font-semibold text-navy-900 whitespace-nowrap">
                {formatBRL(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="section-divider mt-4 space-y-2 pt-4 text-xs text-mute">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatBRL(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Frete</span>
          <span className={shipping === 0 ? 'text-emerald-600 font-medium' : ''}>
            {shipping === 0 ? 'Grátis' : formatBRL(shipping)}
          </span>
        </div>
        <div className="flex justify-between pt-2 text-sm font-bold text-navy-900 border-t border-haze-200">
          <span>Total</span>
          <span>{formatBRL(subtotal + shipping)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Personal data ────────────────────────────────────────────────────
function StepPersonal({ data, onChange, onNext }) {
  const valid = data.nome.trim() && data.email.includes('@') && data.telefone.length >= 14;
  return (
    <div className="space-y-5">
      <div>
        <label className="label">Nome completo</label>
        <input
          className="field"
          placeholder="Dr. Ana Beatriz Oliveira"
          value={data.nome}
          onChange={(e) => onChange('nome', e.target.value)}
        />
      </div>
      <div>
        <label className="label">E-mail institucional</label>
        <input
          type="email"
          className="field"
          placeholder="contato@laboratorio.com.br"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
        />
      </div>
      <div>
        <label className="label">Telefone / WhatsApp</label>
        <input
          className="field"
          placeholder="(11) 99999-0000"
          value={data.telefone}
          onChange={(e) => onChange('telefone', formatPhone(e.target.value))}
        />
      </div>
      <div>
        <label className="label">CNPJ / CPF (opcional)</label>
        <input
          className="field"
          placeholder="Para emissão de Nota Fiscal"
          value={data.documento}
          onChange={(e) => onChange('documento', e.target.value)}
        />
      </div>
      <button onClick={onNext} disabled={!valid} className="btn-primary w-full py-3">
        Continuar para endereço
      </button>
    </div>
  );
}

// ─── Step 2: Address with ViaCEP ──────────────────────────────────────────────
function StepAddress({ data, onChange, onNext, onBack }) {
  const [loading, setLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  const handleCEP = useCallback(async (raw) => {
    const cep = formatCEP(raw);
    onChange('cep', cep);
    setCepError('');

    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;

    setLoading(true);
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const json = await res.json();
      if (json.erro) {
        setCepError('CEP não encontrado. Verifique e tente novamente.');
      } else {
        onChange('logradouro', json.logradouro ?? '');
        onChange('bairro',     json.bairro     ?? '');
        onChange('cidade',     json.localidade ?? '');
        onChange('estado',     json.uf         ?? '');
      }
    } catch {
      setCepError('Erro ao consultar CEP. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  const valid = data.cep.replace(/\D/g, '').length === 8
    && data.logradouro && data.cidade && data.numero;

  return (
    <div className="space-y-5">
      {/* CEP */}
      <div>
        <label className="label">CEP</label>
        <div className="relative">
          <input
            className={`field pr-10 ${cepError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''}`}
            placeholder="00000-000"
            value={data.cep}
            onChange={(e) => handleCEP(e.target.value)}
            maxLength={9}
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-mute">
              <LoadingSpinner />
            </span>
          )}
        </div>
        {cepError && <p className="mt-1 text-xs text-red-500">{cepError}</p>}
        {!cepError && data.cidade && (
          <p className="mt-1 text-xs text-emerald-600">
            ✓ {data.cidade} – {data.estado}
          </p>
        )}
      </div>

      {/* Logradouro */}
      <div>
        <label className="label">Logradouro</label>
        <input
          className="field"
          placeholder="Rua, Av., Al…"
          value={data.logradouro}
          onChange={(e) => onChange('logradouro', e.target.value)}
        />
      </div>

      {/* Número + Complemento */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Número</label>
          <input
            className="field"
            placeholder="123"
            value={data.numero}
            onChange={(e) => onChange('numero', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Complemento</label>
          <input
            className="field"
            placeholder="Sala, Bloco…"
            value={data.complemento}
            onChange={(e) => onChange('complemento', e.target.value)}
          />
        </div>
      </div>

      {/* Bairro */}
      <div>
        <label className="label">Bairro</label>
        <input
          className="field"
          value={data.bairro}
          onChange={(e) => onChange('bairro', e.target.value)}
          placeholder="Bairro"
        />
      </div>

      {/* Cidade + Estado */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="label">Cidade</label>
          <input
            className="field"
            value={data.cidade}
            onChange={(e) => onChange('cidade', e.target.value)}
            placeholder="São Paulo"
          />
        </div>
        <div>
          <label className="label">UF</label>
          <input
            className="field"
            value={data.estado}
            onChange={(e) => onChange('estado', e.target.value.toUpperCase().slice(0, 2))}
            placeholder="SP"
            maxLength={2}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="btn-ghost flex-shrink-0 px-4">
          <ChevronLeft />
        </button>
        <button onClick={onNext} disabled={!valid} className="btn-primary flex-1 py-3">
          Revisar pedido
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Review & confirm ────────────────────────────────────────────────
function StepReview({ personal, address, items, subtotal, onConfirm, onBack, loading }) {
  const shipping = subtotal >= 500 ? 0 : 35;
  return (
    <div className="space-y-5">
      {/* Personal review */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-mute">Dados pessoais</p>
        </div>
        <div className="mt-3 space-y-1 text-sm text-navy-900">
          <p className="font-medium">{personal.nome}</p>
          <p className="text-mute">{personal.email}</p>
          <p className="text-mute">{personal.telefone}</p>
          {personal.documento && <p className="text-mute">{personal.documento}</p>}
        </div>
      </div>

      {/* Address review */}
      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-mute">Endereço de entrega</p>
        <div className="mt-3 text-sm text-navy-900">
          <p className="font-medium">
            {address.logradouro}, {address.numero}
            {address.complemento && ` – ${address.complemento}`}
          </p>
          <p className="text-mute">
            {address.bairro} · {address.cidade}/{address.estado} · CEP {address.cep}
          </p>
        </div>
      </div>

      {/* Items review */}
      <div className="card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-mute">Itens do pedido</p>
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-2 text-sm">
              <span className="text-navy-900">
                {item.quantity}× {item.name}
              </span>
              <span className="font-semibold text-navy-900 whitespace-nowrap">
                {formatBRL(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="section-divider mt-3 pt-3 text-sm">
          <div className="flex justify-between font-bold text-navy-900">
            <span>Total c/ frete</span>
            <span>{formatBRL(subtotal + shipping)}</span>
          </div>
        </div>
      </div>

      {/* Payment notice */}
      <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 text-xs text-navy-700">
        <p className="font-semibold">Forma de pagamento</p>
        <p className="mt-1 text-mute">
          Você receberá instruções de pagamento por e-mail após a confirmação.
          Aceitamos PIX, Boleto Bancário e Cartão de Crédito em até 12×.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="btn-ghost flex-shrink-0 px-4">
          <ChevronLeft />
        </button>
        <button onClick={onConfirm} disabled={loading} className="btn-primary flex-1 py-3">
          {loading ? (
            <>
              <LoadingSpinner />
              Processando…
            </>
          ) : (
            'Confirmar pedido'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── CheckoutForm (main) ──────────────────────────────────────────────────────
export default function CheckoutForm({ onSuccess, onBack }) {
  const { items, subtotal, clearCart } = useCart();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [personal, setPersonal] = useState({
    nome: '', email: '', telefone: '', documento: '',
  });
  const [address, setAddress] = useState({
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '',
  });

  const handlePersonal  = (k, v) => setPersonal((p) => ({ ...p, [k]: v }));
  const handleAddress   = (k, v) => setAddress((a)  => ({ ...a, [k]: v }));

  async function handleConfirm() {
    setSubmitting(true);
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 1400));
    const shipping = subtotal >= 500 ? 0 : 35;
    // Snapshot cart BEFORE clearing — OrderSuccess needs the data
    const orderPayload = {
      personal,
      address,
      items:    [...items],
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
    clearCart();
    onSuccess?.(orderPayload);
  }

  return (
    <div className="min-h-screen bg-haze py-10">
      <div className="mx-auto max-w-5xl px-6">
        {/* Back nav */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-1.5 text-sm text-mute transition-colors hover:text-navy-900"
        >
          <ChevronLeft />
          Voltar ao catálogo
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ── Left: form ── */}
          <div className="card p-6 sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-900">Finalizar pedido</h2>
              <StepIndicator current={step} />
            </div>

            {step === 1 && (
              <StepPersonal
                data={personal}
                onChange={handlePersonal}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <StepAddress
                data={address}
                onChange={handleAddress}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <StepReview
                personal={personal}
                address={address}
                items={items}
                subtotal={subtotal}
                onConfirm={handleConfirm}
                onBack={() => setStep(2)}
                loading={submitting}
              />
            )}
          </div>

          {/* ── Right: summary ── */}
          <OrderSummary items={items} subtotal={subtotal} />
        </div>
      </div>
    </div>
  );
}
