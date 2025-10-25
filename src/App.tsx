import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RoleSelection from "./pages/RoleSelection";
import Engagements from "./pages/auditor/Engagements";
import EngagementDashboard from "./pages/auditor/EngagementDashboard";
import ClientDashboard from "./pages/client/Dashboard";
import ConfirmingPartyConfirmations from "./pages/confirming-party/Confirmations";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/auditor/engagements" element={<Engagements />} />
          <Route path="/auditor/engagement/:id" element={<EngagementDashboard />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/confirming-party/confirmations" element={<ConfirmingPartyConfirmations />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
