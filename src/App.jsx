import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ClientAuthProvider } from './context/ClientAuthContext';
import ToastContainer from './components/Toast';
import PageLayout from './components/PageLayout';

// Pages publiques
import Accueil      from './pages/Accueil';
import Services     from './pages/Services';
import Galerie      from './pages/Galerie';
import Reservation  from './pages/Reservation';
import Paiement     from './pages/Paiement';
import Confirmation from './pages/Confirmation';
import Contact      from './pages/Contact';
import Inscription  from './pages/Inscription';
import Connexion    from './pages/Connexion';
import MonEspace    from './pages/MonEspace';

// Pages admin
import LoginAdmin          from './pages/admin/LoginAdmin';
import AdminLayout         from './pages/admin/AdminLayout';
import Dashboard           from './pages/admin/Dashboard';
import RendezVousAdmin     from './pages/admin/RendezVousAdmin';
import PaiementsAdmin      from './pages/admin/PaiementsAdmin';
import ServicesAdmin       from './pages/admin/ServicesAdmin';
import GalerieAdmin        from './pages/admin/GalerieAdmin';
import DisponibilitesAdmin from './pages/admin/DisponibilitesAdmin';
import InfosSalonAdmin     from './pages/admin/InfosSalonAdmin';
import MessagesAdmin       from './pages/admin/MessagesAdmin';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ClientAuthProvider>
            <AppProvider>
            <Routes>
            {/* ── Pages publiques ── */}
            <Route
              path="/"
              element={
                <PageLayout>
                  <Accueil />
                </PageLayout>
              }
            />
            <Route
              path="/services"
              element={
                <PageLayout>
                  <Services />
                </PageLayout>
              }
            />
            <Route
              path="/galerie"
              element={
                <PageLayout>
                  <Galerie />
                </PageLayout>
              }
            />
            <Route
              path="/reserver"
              element={
                <PageLayout>
                  <Reservation />
                </PageLayout>
              }
            />
            <Route
              path="/paiement"
              element={
                <PageLayout>
                  <Paiement />
                </PageLayout>
              }
            />
            <Route
              path="/confirmation"
              element={
                <PageLayout>
                  <Confirmation />
                </PageLayout>
              }
            />
            <Route
              path="/contact"
              element={
                <PageLayout>
                  <Contact />
                </PageLayout>
              }
            />
            <Route
              path="/inscription"
              element={
                <PageLayout>
                  <Inscription />
                </PageLayout>
              }
            />
            <Route
              path="/connexion"
              element={
                <PageLayout>
                  <Connexion />
                </PageLayout>
              }
            />
            <Route
              path="/mon-espace"
              element={
                <PageLayout>
                  <MonEspace />
                </PageLayout>
              }
            />

            {/* ── Espace admin ── */}
            <Route path="/admin/login" element={<LoginAdmin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard"      element={<Dashboard />} />
              <Route path="rendez-vous"    element={<RendezVousAdmin />} />
              <Route path="paiements"      element={<PaiementsAdmin />} />
              <Route path="services"       element={<ServicesAdmin />} />
              <Route path="galerie"        element={<GalerieAdmin />} />
              <Route path="disponibilites" element={<DisponibilitesAdmin />} />
              <Route path="infos-salon"    element={<InfosSalonAdmin />} />
              <Route path="messages"       element={<MessagesAdmin />} />
            </Route>

            {/* ── 404 ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </AppProvider>
      </ClientAuthProvider>
    </AuthProvider>
  </ToastProvider>
</BrowserRouter>
  );
}
