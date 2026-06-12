import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';

import Navbar           from './components/layout/Navbar';
import CartSidebar      from './components/cart/CartSidebar';
import ProductCatalog   from './components/catalog/ProductCatalog';
import ProductDetail    from './components/catalog/ProductDetail';
import CheckoutForm     from './components/checkout/CheckoutForm';
import OrderSuccess     from './components/checkout/OrderSuccess';
import PartnerDashboard from './components/dashboard/PartnerDashboard';

// Routes: / | /produto/:sku | /checkout | /sucesso | /parceiros

function AppShell() {
  const location = useLocation();
  const hideNav  = location.pathname === '/sucesso';

  return (
    <>
      {!hideNav && <Navbar />}
      <CartSidebar />
      <Routes>
        <Route path="/"             element={<ProductCatalog />}   />
        <Route path="/produto/:sku" element={<ProductDetail />}    />
        <Route path="/checkout"     element={<CheckoutForm />}     />
        <Route path="/sucesso"      element={<OrderSuccess />}     />
        <Route path="/parceiros"    element={<PartnerDashboard />} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <CartProvider>
        <AppShell />
      </CartProvider>
    </HashRouter>
  );
}
