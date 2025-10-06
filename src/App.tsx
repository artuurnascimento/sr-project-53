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
import DashboardRedirect from "./components/DashboardRedirect";

// Portal pages
import PortalHome from "./pages/portal/Home";
import PortalHistory from "./pages/portal/History";
import PortalJustifications from "./pages/portal/Justifications";
import PortalProfile from "./pages/portal/Profile";

// Admin pages  
import AdminDashboard from "./pages/admin/Dashboard";
import AdminApprovals from "./pages/admin/Approvals";
import AdminReports from "./pages/admin/Reports";
import AdminRegistrations from "./pages/admin/Registrations";
import AdminIntegrations from "./pages/admin/Integrations";
import FacialAudit from "./pages/admin/FacialAudit";
import WorkLocations from "./pages/admin/WorkLocations";
import FaceRegistration from "./pages/portal/FaceRegistration";
import ProtectedRoute from "./components/ProtectedRoute";

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
            
            {/* Redirect route - handles automatic role-based redirect */}
            <Route path="/dashboard-redirect" element={<DashboardRedirect />} />
            
            {/* Portal Routes - APENAS para employees */}
            <Route path="/portal" element={
              <ProtectedRoute allowedRoles={['employee']} redirectTo="/admin/dashboard">
                <PortalHome />
              </ProtectedRoute>
            } />
            <Route path="/portal/home" element={
              <ProtectedRoute allowedRoles={['employee']} redirectTo="/admin/dashboard">
                <PortalHome />
              </ProtectedRoute>
            } />
            <Route path="/portal/historico" element={
              <ProtectedRoute allowedRoles={['employee']} redirectTo="/admin/dashboard">
                <PortalHistory />
              </ProtectedRoute>
            } />
            <Route path="/portal/justificativas" element={
              <ProtectedRoute allowedRoles={['employee']} redirectTo="/admin/dashboard">
                <PortalJustifications />
              </ProtectedRoute>
            } />
            <Route path="/portal/cadastro-facial" element={
              <ProtectedRoute allowedRoles={['employee']} redirectTo="/admin/dashboard">
                <FaceRegistration />
              </ProtectedRoute>
            } />
            <Route path="/portal/perfil" element={
              <ProtectedRoute allowedRoles={['employee']} redirectTo="/admin/dashboard">
                <PortalProfile />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes - APENAS para admin e manager */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']} redirectTo="/portal">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']} redirectTo="/portal">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/aprovacoes" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']} redirectTo="/portal">
                <AdminApprovals />
              </ProtectedRoute>
            } />
            <Route path="/admin/relatorios" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']} redirectTo="/portal">
                <AdminReports />
              </ProtectedRoute>
            } />
            <Route path="/admin/cadastros" element={
              <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/dashboard">
                <AdminRegistrations />
              </ProtectedRoute>
            } />
            <Route path="/admin/localizacoes" element={
              <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/dashboard">
                <WorkLocations />
              </ProtectedRoute>
            } />
            <Route path="/admin/integracoes" element={
              <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/dashboard">
                <AdminIntegrations />
              </ProtectedRoute>
            } />
            <Route path="/admin/auditoria" element={
              <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin/dashboard">
                <FacialAudit />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;