import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const BADGE = {
  transit:    'bg-blue-100 text-blue-800',
  passation:  'bg-amber-100 text-amber-800',
  logistique: 'bg-green-100 text-green-800',
  cloture:    'bg-gray-100 text-gray-600',
  nouveau:    'bg-purple-100 text-purple-800',
  livraison:  'bg-emerald-100 text-emerald-800',
};

const ROLE_CONFIG = {
  admin: {
    titre: 'Tableau de bord - Administrateur',
    couleur: 'purple',
    icone: '👑',
  },
  direction: {
    titre: 'Tableau de bord - Direction',
    couleur: 'blue',
    icone: '🏢',
  },
  assistant_directeur: {
    titre: 'Tableau de bord - Assistant Directeur',
    couleur: 'purple',
    icone: '📋',
  },
  transit: {
    titre: 'Tableau de bord - Service Transit',
    couleur: 'blue',
    icone: '🕐',
  },
  passation: {
    titre: 'Tableau de bord - Service Passation',
    couleur: 'amber',
    icone: '✅',
  },
  logistique: {
    titre: 'Tableau de bord - Service Logistique',
    couleur: 'green',
    icone: '🚛',
  },
  caisse: {
    titre: 'Tableau de bord - Service Caisse',
    couleur: 'red',
    icone: '💰',
  },
  comptabilite: {
    titre: 'Tableau de bord - Comptabilité',
    couleur: 'indigo',
    icone: '📊',
  },
};

export default function Dashboard() {
  const { utilisateur, estAdmin } = useAuth();
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [camions, setCamions] = useState([]);
  const [loading, setLoading] = useState(true);

  const config = ROLE_CONFIG[utilisateur?.role] || ROLE_CONFIG.admin;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [api.get('/dossiers/')];
        
        // Chargements spécifiques selon le rôle
        if (['admin', 'direction', 'assistant_directeur', 'transit', 'passation', 'logistique'].includes(utilisateur?.role)) {
          promises.push(api.get('/documents/'));
        }
        if (['admin', 'direction', 'logistique'].includes(utilisateur?.role)) {
          promises.push(api.get('/camions/'));
        }

        const results = await Promise.all(promises);
        setDossiers(results[0].data.results || results[0].data);
        if (results[1]) setDocuments(results[1].data.results || results[1].data);
        if (results[2]) setCamions(results[2].data.results || results[2].data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [utilisateur]);

  // Stats par rôle
  const getStats = () => {
    const role = utilisateur?.role;
    
    if (role === 'admin' || role === 'direction') {
      return [
        { label: 'Total dossiers',     value: dossiers.length, bg: 'bg-blue-50', color: 'text-blue-700', icon: '📁' },
        { label: 'En cours',           value: dossiers.filter(d => d.statut !== 'cloture').length, bg: 'bg-amber-50', color: 'text-amber-700', icon: '⏳' },
        { label: 'Clôturés',           value: dossiers.filter(d => d.statut === 'cloture').length, bg: 'bg-green-50', color: 'text-green-700', icon: '✓' },
        { label: 'Documents',          value: documents.length, bg: 'bg-purple-50', color: 'text-purple-700', icon: '📄' },
      ];
    }
    
    if (role === 'assistant_directeur') {
      return [
        { label: 'Dossiers créés',     value: dossiers.length, bg: 'bg-blue-50', color: 'text-blue-700', icon: '📁' },
        { label: 'Documents scannés',  value: documents.length, bg: 'bg-purple-50', color: 'text-purple-700', icon: '📄' },
        { label: 'Nouveaux',           value: dossiers.filter(d => d.statut === 'nouveau').length, bg: 'bg-purple-50', color: 'text-purple-700', icon: '🆕' },
        { label: 'En transit',         value: dossiers.filter(d => d.statut === 'transit').length, bg: 'bg-blue-50', color: 'text-blue-700', icon: '🕐' },
      ];
    }
    
    if (role === 'transit') {
      return [
        { label: 'À traiter',          value: dossiers.filter(d => d.statut === 'transit').length, bg: 'bg-blue-50', color: 'text-blue-700', icon: '🕐' },
        { label: 'Traités',            value: dossiers.filter(d => ['passation','logistique','livraison','cloture'].includes(d.statut)).length, bg: 'bg-green-50', color: 'text-green-700', icon: '✓' },
        { label: 'Documents',          value: documents.length, bg: 'bg-purple-50', color: 'text-purple-700', icon: '📄' },
        { label: 'Total dossiers',     value: dossiers.length, bg: 'bg-gray-50', color: 'text-gray-700', icon: '📊' },
      ];
    }
    
    if (role === 'passation') {
      return [
        { label: 'À valider',          value: dossiers.filter(d => d.statut === 'passation').length, bg: 'bg-amber-50', color: 'text-amber-700', icon: '✅' },
        { label: 'Validés',            value: dossiers.filter(d => ['logistique','livraison','cloture'].includes(d.statut)).length, bg: 'bg-green-50', color: 'text-green-700', icon: '✓' },
        { label: 'Documents',          value: documents.length, bg: 'bg-purple-50', color: 'text-purple-700', icon: '📄' },
        { label: 'Total dossiers',     value: dossiers.length, bg: 'bg-gray-50', color: 'text-gray-700', icon: '📊' },
      ];
    }
    
    if (role === 'logistique') {
      return [
        { label: 'À expédier',         value: dossiers.filter(d => d.statut === 'logistique').length, bg: 'bg-green-50', color: 'text-green-700', icon: '🚛' },
        { label: 'En livraison',       value: dossiers.filter(d => d.statut === 'livraison').length, bg: 'bg-emerald-50', color: 'text-emerald-700', icon: '📦' },
        { label: 'Camions en mission', value: camions.filter(c => c.statut === 'en_mission').length, bg: 'bg-blue-50', color: 'text-blue-700', icon: '🚚' },
        { label: 'Camions disponibles', value: camions.filter(c => c.statut === 'disponible').length, bg: 'bg-amber-50', color: 'text-amber-700', icon: '🅿️' },
      ];
    }
    
    if (role === 'caisse' || role === 'comptabilite') {
      return [
        { label: 'Total dossiers',     value: dossiers.length, bg: 'bg-blue-50', color: 'text-blue-700', icon: '📁' },
        { label: 'À facturer',         value: dossiers.filter(d => d.statut === 'cloture').length, bg: 'bg-red-50', color: 'text-red-700', icon: '💰' },
        { label: 'En cours',           value: dossiers.filter(d => d.statut !== 'cloture').length, bg: 'bg-amber-50', color: 'text-amber-700', icon: '⏳' },
        { label: 'Clôturés',           value: dossiers.filter(d => d.statut === 'cloture').length, bg: 'bg-green-50', color: 'text-green-700', icon: '✓' },
      ];
    }
    
    return [];
  };

  // Dossiers qui me concernent
  const getDossiersAction = () => {
    const role = utilisateur?.role;
    
    if (role === 'transit') {
      return dossiers.filter(d => d.statut === 'transit');
    }
    if (role === 'passation') {
      return dossiers.filter(d => d.statut === 'passation');
    }
    if (role === 'logistique') {
      return dossiers.filter(d => ['logistique', 'livraison'].includes(d.statut));
    }
    if (role === 'assistant_directeur') {
      return dossiers.filter(d => d.statut === 'nouveau');
    }
    return dossiers.slice(0, 5);
  };

  const actionsRapides = () => {
    const role = utilisateur?.role;
    
    if (role === 'admin' || role === 'direction') {
      return [
        { label: 'Voir tous les dossiers', icon: '📁', color: 'bg-blue-50 text-blue-700', path: '/dossiers' },
        { label: 'Gestion documents',      icon: '📄', color: 'bg-purple-50 text-purple-700', path: '/documents' },
        { label: 'Gestion utilisateurs',   icon: '👤', color: 'bg-amber-50 text-amber-700', path: '/utilisateurs' },
        { label: 'Caisse & Comptabilité',  icon: '💰', color: 'bg-red-50 text-red-700', path: '/finance' },
      ];
    }
    if (role === 'assistant_directeur') {
      return [
        { label: 'Nouveau dossier',        icon: '➕', color: 'bg-blue-50 text-blue-700', path: '/dossiers' },
        { label: 'Nouveau client',         icon: '👥', color: 'bg-green-50 text-green-700', path: '/clients' },
        { label: 'Scanner document',       icon: '📄', color: 'bg-purple-50 text-purple-700', path: '/documents' },
      ];
    }
    if (role === 'transit') {
      return [
        { label: 'Mes dossiers',           icon: '📁', color: 'bg-blue-50 text-blue-700', path: '/dossiers' },
        { label: 'Déclarations',           icon: '🕐', color: 'bg-amber-50 text-amber-700', path: '/transit' },
        { label: 'Documents',              icon: '📄', color: 'bg-purple-50 text-purple-700', path: '/documents' },
      ];
    }
    if (role === 'passation') {
      return [
        { label: 'Mes dossiers',           icon: '📁', color: 'bg-blue-50 text-blue-700', path: '/dossiers' },
        { label: 'Passations',             icon: '✅', color: 'bg-amber-50 text-amber-700', path: '/passation' },
        { label: 'Documents',              icon: '📄', color: 'bg-purple-50 text-purple-700', path: '/documents' },
      ];
    }
    if (role === 'logistique') {
      return [
        { label: 'Missions',               icon: '🚛', color: 'bg-green-50 text-green-700', path: '/logistique' },
        { label: 'Suivi camions',          icon: '📍', color: 'bg-blue-50 text-blue-700', path: '/suivi-camions' },
        { label: 'Carte GPS',              icon: '🗺️', color: 'bg-purple-50 text-purple-700', path: '/carte-camions' },
        { label: 'Gestion camions',        icon: '🚚', color: 'bg-amber-50 text-amber-700', path: '/camions' },
      ];
    }
    if (role === 'caisse' || role === 'comptabilite') {
      return [
        { label: 'Facturation',            icon: '💰', color: 'bg-red-50 text-red-700', path: '/finance' },
        { label: 'Dossiers',               icon: '📁', color: 'bg-blue-50 text-blue-700', path: '/dossiers' },
      ];
    }
    return [];
  };

  const stats = getStats();
  const dossiersAction = getDossiersAction();
  const actions = actionsRapides();

  return (
    <Layout title={config.titre}>
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          Chargement...
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          {/* Carte de bienvenue */}
          <div className="bg-gradient-to-r from-[#1F3864] to-[#2E5FA3] rounded-lg p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{config.icone}</div>
              <div>
                <div className="text-lg font-medium">
                  Bonjour {utilisateur?.prenom} {utilisateur?.nom} !
                </div>
                <div className="text-sm text-blue-100 mt-1">
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className={`${s.bg} rounded-lg p-4 border border-gray-200`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-[10px] text-gray-500">{s.label}</div>
                  <div className="text-xl">{s.icon}</div>
                </div>
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Actions rapides */}
          {actions.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-800">⚡ Actions rapides</span>
              </div>
              <div className="p-4 grid grid-cols-4 gap-3">
                {actions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => navigate(a.path)}
                    className={`${a.color} h-20 rounded-lg flex flex-col items-center justify-center gap-1 hover:opacity-80 transition-opacity border border-gray-200`}
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <span className="text-xs font-medium">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dossiers nécessitant une action */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                {utilisateur?.role === 'admin' || utilisateur?.role === 'direction' 
                  ? '📁 Derniers dossiers' 
                  : '⚠️ Dossiers à traiter'}
              </span>
              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {dossiersAction.length} dossier{dossiersAction.length > 1 ? 's' : ''}
              </span>
            </div>
            {dossiersAction.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                ✓ Aucun dossier en attente — Tout est à jour !
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">N° Dossier</th>
                    <th className="px-4 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Client</th>
                    <th className="px-4 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut</th>
                    <th className="px-4 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiersAction.slice(0, 10).map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/dossiers/${d.id}`)}>
                      <td className="px-4 py-2 font-medium text-blue-600">{d.numero_dossier}</td>
                      <td className="px-4 py-2 text-gray-700">{d.client_nom}</td>
                      <td className="px-4 py-2 text-gray-500 capitalize">{d.type_transport}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${BADGE[d.statut] || 'bg-gray-100'}`}>
                          {d.statut}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-400">{d.date_debut}</td>
                      <td className="px-4 py-2">
                        <button className="h-6 px-2 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200 hover:bg-blue-100">
                          Ouvrir →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}
    </Layout>
  );
}