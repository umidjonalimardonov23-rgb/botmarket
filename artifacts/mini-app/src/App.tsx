import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initTelegramApp } from "@/lib/telegram";

import Home from "@/pages/home";
import Catalog from "@/pages/catalog";
import OrderForm from "@/pages/order-form";
import MyOrders from "@/pages/my-orders";
import Referral from "@/pages/referral";
import Payment from "@/pages/payment";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/order/:id" component={OrderForm} />
      <Route path="/my-orders" component={MyOrders} />
      <Route path="/referral" component={Referral} />
      <Route path="/payment" component={Payment} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize Telegram Web App SDK on mount
  useEffect(() => {
    initTelegramApp();
    // Force dark theme class since we designed for dark mode
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
