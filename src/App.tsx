import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Cases from "./pages/Cases";
import Gallery from "./pages/Gallery";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

// Portal pages
import PortalHome from "./pages/portal/Home";
import PortalHistory from "./pages/portal/History";
import PortalJustifications from "./pages/portal/Justifications";

// Admin pages  
import AdminDashboard from "./pages/admin/Dashboard";
import AdminApprovals from "./pages/admin/Approvals";
import AdminReports from "./pages/admin/Reports";
import AdminRegistrations from "./pages/admin/Registrations";
import AdminIntegrations from "./pages/admin/Integrations";
import AdminAudit from "./pages/admin/Audit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/servicos" element={<Services />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/galeria" element={<Gallery />} />
            <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos-uso" element={<TermsOfUse />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Portal Routes */}
            <Route path="/portal" element={<PortalHome />} />
            <Route path="/portal/home" element={<PortalHome />} />
            <Route path="/portal/historico" element={<PortalHistory />} />
            <Route path="/portal/justificativas" element={<PortalJustifications />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/aprovacoes" element={<AdminApprovals />} />
            <Route path="/admin/relatorios" element={<AdminReports />} />
            <Route path="/admin/cadastros" element={<AdminRegistrations />} />
            <Route path="/admin/integracoes" element={<AdminIntegrations />} />
            <Route path="/admin/auditoria" element={<AdminAudit />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
