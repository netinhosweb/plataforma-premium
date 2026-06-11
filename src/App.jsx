import { useState } from 'react';
import { CartProvider } from './context/CartContext';

import Navbar            from './components/layout/Navbar';
import CartSidebar       from './components/cart/CartSidebar';
import ProductCatalog    from './components/catalog/ProductCatalog';
import CheckoutForm      from './components/checkout/CheckoutForm';
import OrderSuccess      from './components/checkout/OrderSuccess';
import PartnerDashboard  from './components/dashboard/PartnerDashboard';

// Views: 'catalog' | 'checkout' | 'success' | 'dashboard'

function AppContent() {
  const [view, setView]       = useState('catalog');
  const [orderData, setOrder] = useState(null);

  function handleCheckoutSuccess(data) {
    setOrder(data);
    setView('success');
  }

  function navigate(to) {
    setView(to);
  }

  return (
    <>
      {/* Persistent navbar (hidden during checkout/success flows) */}
      {view !== 'success' && (
        <Navbar currentView={view} onNavigate={navigate} />
      )}

      {/* Cart sidebar (always available) */}
      <CartSidebar onCheckout={() => setView('checkout')} />

      {/* View router */}
      {view === 'catalog'   && <ProductCatalog />}
      {view === 'dashboard' && <PartnerDashboard />}
      {view === 'checkout'  && (
        <CheckoutForm
          onSuccess={handleCheckoutSuccess}
          onBack={() => setView('catalog')}
        />
      )}
      {view === 'success' && (
        <OrderSuccess
          orderData={orderData}
          onBackToShop={() => { setOrder(null); setView('catalog'); }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
