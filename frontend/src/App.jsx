import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store                from './store';
import ProtectedRoute       from './components/ProtectedRoute';
import SplashScreen         from './pages/SplashScreen';
import Login                from './pages/Login';
import Dashboard            from './pages/Dashboard';
import ListeDossiers        from './pages/Dossiers/ListeDossiers';
import DetailDossier        from './pages/Dossiers/DetailDossier';
import Transit              from './pages/Transit/Transit';
import Passation            from './pages/Passation/Passation';
import Logistique           from './pages/Logistique/Logistique';
import Finance              from './pages/Finance/Finance';
import Camions              from './pages/Camions/Camions';
import SuiviCamions         from './pages/Camions/SuiviCamions';
import CarteCamions         from './pages/Camions/CarteCamions';
import Archives             from './pages/Archives/Archives';
import Utilisateurs         from './pages/Utilisateurs/Utilisateurs';
import Clients              from './pages/Clients/Clients';
import ProfilClient         from './pages/Clients/ProfilClient';
import Documents            from './pages/Documents/Documents';
import MonCamion            from './pages/Chauffeur/MonCamion';
import MonProfil            from './pages/MonProfil';
import EtudesDirection      from './pages/Direction/EtudesDirection';
// ── Nouvelles pages ───────────────────────────────────────────────────────────
import GestionContrats      from './pages/Contrats/GestionContrats';
import RecettesJournalieres from './pages/Direction/RecettesJournalieres';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/dossiers" element={
            <ProtectedRoute><ListeDossiers /></ProtectedRoute>
          } />
          <Route path="/dossiers/:id" element={
            <ProtectedRoute><DetailDossier /></ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute><Clients /></ProtectedRoute>
          } />
          <Route path="/clients/:id" element={
            <ProtectedRoute><ProfilClient /></ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute><Documents /></ProtectedRoute>
          } />
          <Route path="/contrats" element={
            <ProtectedRoute><GestionContrats /></ProtectedRoute>
          } />
          <Route path="/direction/recettes" element={
            <ProtectedRoute roles={['admin', 'direction', 'assistant_directeur']}>
              <RecettesJournalieres />
            </ProtectedRoute>
          } />
          <Route path="/transit" element={
            <ProtectedRoute roles={['transit']}><Transit /></ProtectedRoute>
          } />
          <Route path="/passation" element={
            <ProtectedRoute roles={['passation']}><Passation /></ProtectedRoute>
          } />
          <Route path="/logistique" element={
            <ProtectedRoute roles={['logistique']}><Logistique /></ProtectedRoute>
          } />
          <Route path="/finance" element={
            <ProtectedRoute roles={['caisse','comptabilite']}><Finance /></ProtectedRoute>
          } />
          <Route path="/camions" element={
            <ProtectedRoute roles={['logistique']}><Camions /></ProtectedRoute>
          } />
          <Route path="/suivi-camions" element={
            <ProtectedRoute roles={['logistique']}><SuiviCamions /></ProtectedRoute>
          } />
          <Route path="/carte-camions" element={
            <ProtectedRoute roles={['logistique']}><CarteCamions /></ProtectedRoute>
          } />
          <Route path="/archives" element={
            <ProtectedRoute><Archives /></ProtectedRoute>
          } />
          <Route path="/utilisateurs" element={
            <ProtectedRoute roles={['admin','direction']}><Utilisateurs /></ProtectedRoute>
          } />
          <Route path="/direction/etudes" element={
            <ProtectedRoute roles={['direction']}><EtudesDirection /></ProtectedRoute>
          } />
          <Route path="/mon-camion" element={
            <ProtectedRoute roles={['chauffeur']}><MonCamion /></ProtectedRoute>
          } />
          <Route path="/mon-profil" element={
            <ProtectedRoute><MonProfil /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} theme="light" />
      </BrowserRouter>
    </Provider>
  );
}