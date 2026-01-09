import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { CartModalProvider } from "@/hooks/useCartModal";
import Home from "@/pages/Home";
import Category from "@/pages/Category";
import ProductDetail from "@/pages/ProductDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Profile from "@/pages/Profile";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";
import About from "@/pages/About";
import DeliveryTerms from "@/pages/DeliveryTerms";
import DistanceSalesAgreement from "@/pages/DistanceSalesAgreement";
import CancellationPolicy from "@/pages/CancellationPolicy";
import KVKK from "@/pages/KVKK";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/kategori/:slug" component={Category} />
      <Route path="/urun/:slug" component={ProductDetail} />
      <Route path="/giris" component={Login} />
      <Route path="/kayit" component={Register} />
      <Route path="/sifremi-unuttum" component={ForgotPassword} />
      <Route path="/sifre-sifirla" component={ResetPassword} />
      <Route path="/sepet" component={Cart} />
      <Route path="/odeme" component={Checkout} />
      <Route path="/hesabim" component={Profile} />
      <Route path="/hakkimizda" component={About} />
      <Route path="/teslimat-kosullari" component={DeliveryTerms} />
      <Route path="/mesafeli-satis-sozlesmesi" component={DistanceSalesAgreement} />
      <Route path="/iptal-ve-iade" component={CancellationPolicy} />
      <Route path="/kvkk" component={KVKK} />
      <Route path="/toov-admin/login" component={AdminLogin} />
      <Route path="/toov-admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <CartModalProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CartModalProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
