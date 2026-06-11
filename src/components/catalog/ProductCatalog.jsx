import { useState, useMemo } from 'react';
import { products, CATEGORIES } from '../../data/products';
import ProductCard from './ProductCard';

// ─── Search icon ──────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-mute-light">
    <circle cx="11" cy="11" r="8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
  </svg>
);

// ─── ProductCatalog ───────────────────────────────────────────────────────────
export default function ProductCatalog({ onViewProduct }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const matchQ   = query === '' ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [activeCategory, query]);

  return (
    <main className="min-h-screen bg-haze">
      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden bg-navy-900 bg-molecule-grid">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 60% 50%, #1d4ed8 0%, transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <span className="chip-brand mb-4 inline-flex">
              Catálogo 2024 · Suprimentos Profissionais
            </span>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
              Equipamentos e Reagentes<br />
              <span className="text-brand-light">para Laboratório de Precisão</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-navy-200">
              Linha completa de suprimentos laboratoriais com rastreabilidade,
              laudos técnicos e entrega expressa para todo o Brasil.
            </p>
          </div>
        </div>
      </section>

      {/* ── Filters & search ── */}
      <div className="sticky top-0 z-30 border-b border-haze-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all
                    ${activeCategory === cat.id
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'text-mute hover:bg-haze hover:text-navy-900'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3"><SearchIcon /></span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar produto ou SKU…"
                className="field w-64 pl-9 py-2 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="text-sm font-medium text-navy-900">Nenhum produto encontrado</p>
            <p className="mt-1 text-xs text-mute">Tente outro termo ou categoria.</p>
            <button
              onClick={() => { setQuery(''); setActiveCategory('all'); }}
              className="btn-ghost mt-4 text-xs"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            <p className="mb-6 text-xs text-mute">
              {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onView={onViewProduct} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
