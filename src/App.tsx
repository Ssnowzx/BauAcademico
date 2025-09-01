import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DocumentsPage from "./pages/DocumentsPage";
import AvisosPage from "./pages/AvisosPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import NoticiasPage from "./pages/NoticiasPage";
import AdminNoticiasPage from "./pages/AdminNoticiasPage";

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
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents/:category" element={<DocumentsPage />} />
            <Route path="/avisos" element={<AvisosPage />} />
            <Route path="/noticias" element={<NoticiasPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/noticias" element={<AdminNoticiasPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
