import { useState } from 'react';
import { useCart } from '../../context/CartContext';

// ─── Icons ────────────────────────────────────────────────────────────────────
const FlaskIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 3h6M9 3v6L5.5 15A3 3 0 0 0 8 20h8a3 3 0 0 0 2.5-5L15 9V3M9 3H6m9 0h3" />
  </svg>
);
const BeakerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4.26 10.147a60 60 0 0 0-.491 6.347A48.6 48.6 0 0 1 12 20.904a48.6 48.6 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.64 50.64 0 0 0-2.658-.813A59.9 59.9 0 0 1 12 3.493a59.9 59.9 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.7 50.7 0 0 1 12 13.489a50.7 50.7 0 0 1 7.74-3.342" />
  </svg>
);
const MicroscopeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.93 14.93 0 0 1-5.867 6.246M8.42 8.42a14.96 14.96 0 0 0-.742 2.022m.742-2.022a14.98 14.98 0 0 0-3.388-.875 14.98 14.98 0 0 0 5.68 11.87m-2.292-9.8a3 3 0 0 0-2.121 5.196" />
  </svg>
);
const TubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.3 24.3 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 0 1 0 3.182M5 14.5a2.25 2.25 0 0 0 0 3.182m14.8-3.182A2.25 2.25 0 0 0 17.25 18H6.75a2.25 2.25 0 0 1-2.25-2.25" />
  </svg>
);

const categoryIcons = {
  kits:         <FlaskIcon />,
  reagentes:    <BeakerIcon />,
  equipamentos: <MicroscopeIcon />,
  consumiveis:  <TubeIcon />,
};
const categoryBg = {
  kits:         'bg-blue-50  text-blue-600',
  reagentes:    'bg-violet-50 text-violet-600',
  equipamentos: 'bg-teal-50  text-teal-600',
  consumiveis:  'bg-amber-50  text-amber-600',
};

const badgeColors = {
  'Mais vendido': 'chip-brand',
  'Novo':         'chip-green',
  'Oferta':       'chip-amber',
  'Premium':      'chip-navy',
};

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
export default function ProductCard({ product, onView }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd(e) {
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  function handleCardClick() {
    if (onView) onView(product);
  }

  const iconBg = categoryBg[product.category] ?? 'bg-navy-50 text-navy-400';

  return (
    <article
      className="card-hover flex flex-col overflow-hidden cursor-pointer"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      aria-label={`Ver detalhes de ${product.name}`}
    >
      {/* Colored icon header */}
      <div className="relative flex items-center justify-center bg-haze-100 py-8">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconBg}`}>
          {categoryIcons[product.category] ?? <FlaskIcon />}
        </div>
        {product.badge && (
          <span className={`${badgeColors[product.badge] ?? 'chip-navy'} absolute right-3 top-3 text-[10px]`}>
            {product.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* SKU */}
        <span className="text-[10px] font-mono uppercase tracking-wider text-mute-light">
          {product.sku}
        </span>

        {/* Name */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-navy-900">
          {product.name}
        </h3>

        {/* Description */}
        <p className="line-clamp-2 text-xs leading-relaxed text-mute">
          {product.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-mute-light">
          <span className="chip-navy">{product.unit}</span>
          <span className={`chip ${product.stock > 10 ? 'chip-green' : 'chip-amber'}`}>
            {product.stock > 10
              ? 'Em estoque'
              : `Apenas ${product.stock} restantes`}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price + CTA */}
        <div className="flex items-end justify-between pt-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-mute-light">Preço unit.</p>
            <p className="text-lg font-bold text-navy-900">{formatBRL(product.price)}</p>
          </div>
          <button
            onClick={handleAdd}
            disabled={added}
            className={`btn-primary px-4 py-2 text-xs transition-all ${
              added ? 'bg-emerald-600 hover:bg-emerald-600' : ''
            }`}
          >
            {added ? '✓ Adicionado' : '+ Adicionar'}
          </button>
        </div>
      </div>
    </article>
  );
}
