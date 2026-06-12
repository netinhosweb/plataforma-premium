import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

// ─── Icons ────────────────────────────────────────────────────────────────────
const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75M7.5 14.25 5.106 5.272M7.5 14.25h10.69m0 0 .895-5.272M18.19 14.25 19.085 9H5.106" />
    <circle cx="9.75" cy="19.5" r="1.5" />
    <circle cx="18" cy="19.5" r="1.5" />
  </svg>
);
const LogoIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="h-7 w-7">
    <rect width="28" height="28" rx="8" fill="#0f2244" />
    <path stroke="#3b82f6" strokeWidth="1.75" strokeLinecap="round"
      d="M10 7h8M10 7v6L6 19h16l-4-6V7" />
    <circle cx="14" cy="18" r="1.5" fill="#3b82f6" />
  </svg>
);

const navLinks = [
  { path: '/',          label: 'Catálogo'  },
  { path: '/parceiros', label: 'Parceiros' },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount, toggleCart } = useCart();

  function isActive(path) {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/produto');
    return location.pathname.startsWith(path);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-haze-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <LogoIcon />
          <span className="text-sm font-bold tracking-tight text-navy-900">
            Lab<span className="text-brand">Prime</span>
          </span>
        </button>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 sm:flex">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all
                ${isActive(link.path)
                  ? 'bg-navy-900 text-white'
                  : 'text-mute hover:bg-haze hover:text-navy-900'}`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Cart button */}
        <button
          onClick={toggleCart}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-haze-200 text-navy-900 transition-all hover:bg-haze hover:shadow-card"
          aria-label="Abrir carrinho"
        >
          <CartIcon />
          {itemCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile nav */}
      <div className="flex border-t border-haze-200 sm:hidden">
        {navLinks.map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`flex-1 py-2 text-xs font-medium transition-colors
              ${isActive(link.path)
                ? 'border-b-2 border-brand text-brand'
                : 'text-mute'}`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
}
