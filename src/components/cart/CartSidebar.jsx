import { useCart } from '../../context/CartContext';

// ─── Icons (inline SVG, zero deps) ────────────────────────────────────────────
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </svg>
);
const FlaskIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 3h6m-6 0v6L5.5 15A3 3 0 0 0 8 20h8a3 3 0 0 0 2.5-5L15 9V3M9 3H6M15 3h3" />
  </svg>
);
const CartEmptyIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-16 w-16 text-haze-200">
    <circle cx="26" cy="54" r="3" />
    <circle cx="46" cy="54" r="3" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2 6h8l8 34h28l6-22H16" />
  </svg>
);

// ─── Quantity Stepper ─────────────────────────────────────────────────────────
function QuantityStepper({ value, onChange }) {
  return (
    <div className="flex items-center rounded-lg border border-haze-200 bg-haze">
      <button
        onClick={() => onChange(value - 1)}
        className="flex h-7 w-7 items-center justify-center text-mute transition-colors hover:text-navy-900"
        aria-label="Diminuir"
      >
        <span className="text-base font-medium leading-none">−</span>
      </button>
      <span className="min-w-[28px] text-center text-sm font-semibold text-navy-900">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="flex h-7 w-7 items-center justify-center text-mute transition-colors hover:text-navy-900"
        aria-label="Aumentar"
      >
        <span className="text-base font-medium leading-none">+</span>
      </button>
    </div>
  );
}

// ─── Cart Line Item ────────────────────────────────────────────────────────────
function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-3 py-4">
      {/* Product icon placeholder */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-400">
        <FlaskIcon />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-navy-900">
            {item.name}
          </p>
          <button
            onClick={() => removeItem(item.id)}
            className="ml-1 flex-shrink-0 text-mute-light transition-colors hover:text-red-500"
            aria-label="Remover item"
          >
            <TrashIcon />
          </button>
        </div>

        <span className="chip-navy self-start text-[10px]">{item.category}</span>

        <div className="flex items-center justify-between">
          <QuantityStepper
            value={item.quantity}
            onChange={(q) => updateQuantity(item.id, q)}
          />
          <span className="text-sm font-semibold text-navy-900">
            {formatBRL(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── CartSidebar ──────────────────────────────────────────────────────────────
export default function CartSidebar({ onCheckout }) {
  const { items, isOpen, closeCart, subtotal, itemCount, clearCart } = useCart();

  const shipping = subtotal >= 500 ? 0 : 35;
  const total = subtotal + shipping;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm animate-fade-in"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-white shadow-lift-lg
                    transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-haze-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white">
              <FlaskIcon />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-navy-900">Carrinho</h2>
              <p className="text-xs text-mute">
                {itemCount === 0
                  ? 'Nenhum item'
                  : `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-mute-light transition-colors hover:text-red-500"
              >
                Limpar
              </button>
            )}
            <button
              onClick={closeCart}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-mute transition-colors hover:bg-haze hover:text-navy-900"
              aria-label="Fechar carrinho"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CartEmptyIcon />
              <p className="mt-4 text-sm font-medium text-navy-900">
                Seu carrinho está vazio
              </p>
              <p className="mt-1 text-xs text-mute">
                Explore nosso catálogo e adicione produtos.
              </p>
              <button onClick={closeCart} className="btn-ghost mt-6 text-xs">
                Ver catálogo
              </button>
            </div>
          ) : (
            /* Item list */
            <div className="divide-y divide-haze-200">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer / Summary ── */}
        {items.length > 0 && (
          <div className="border-t border-haze-200 bg-white px-6 pb-6 pt-4">
            {/* Shipping notice */}
            {shipping > 0 ? (
              <div className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5">
                <p className="text-xs text-amber-700">
                  Frete gratuito em pedidos acima de{' '}
                  <strong>{formatBRL(500)}</strong>. Faltam{' '}
                  <strong>{formatBRL(500 - subtotal)}</strong>.
                </p>
              </div>
            ) : (
              <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-2.5">
                <p className="text-xs font-medium text-emerald-700">
                  ✓ Frete grátis aplicado neste pedido
                </p>
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-mute">
                <span>Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between text-mute">
                <span>Frete</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-emerald-600 font-medium">Grátis</span>
                  ) : (
                    formatBRL(shipping)
                  )}
                </span>
              </div>
              <div className="section-divider pt-2">
                <div className="flex justify-between pt-2 font-semibold text-navy-900">
                  <span>Total</span>
                  <span className="text-base">{formatBRL(total)}</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                closeCart();
                onCheckout?.();
              }}
              className="btn-primary mt-4 w-full py-3 text-sm"
            >
              Ir para o checkout
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <p className="mt-3 text-center text-[11px] text-mute-light">
              Pagamento 100% seguro · NF eletrônica inclusa
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
