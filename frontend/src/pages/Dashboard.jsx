import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import api from '../api/axios';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import {
  Crown, Building2, ClipboardList, Clock, CheckSquare, Truck, Wallet, BarChart3,
  FolderOpen, CheckCircle2, FileText, Sparkles, Package, ParkingCircle,
  Plus, Users, MapPin, Map, Zap, AlertTriangle, UserCog, ArrowRight,
} from 'lucide-react';

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
    titreKey: 'titre_admin',
    couleur: 'purple',
    icone: Crown,
  },
  direction: {
    titreKey: 'titre_direction',
    couleur: 'blue',
    icone: Building2,
  },
  assistant_directeur: {
    titreKey: 'titre_assistant_directeur',
    couleur: 'purple',
    icone: ClipboardList,
  },
  transit: {
    titreKey: 'titre_transit',
    couleur: 'blue',
    icone: Clock,
  },
  passation: {
    titreKey: 'titre_passation',
    couleur: 'amber',
    icone: CheckSquare,
  },
  logistique: {
    titreKey: 'titre_logistique',
    couleur: 'green',
    icone: Truck,
  },
  caisse: {
    titreKey: 'titre_caisse',
    couleur: 'red',
    icone: Wallet,
  },
  comptabilite: {
    titreKey: 'titre_comptabilite',
    couleur: 'indigo',
    icone: BarChart3,
  },
};

export default function Dashboard() {
  const { utilisateur, estAdmin } = useAuth();
  const { t, lang } = useLanguage();
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
        { label: 'Total dossiers',     value: dossiers.length, bg: 'bg-blue-50', color: 'text-blue-700', icon: FolderOpen },
        { label: 'En cours',           value: dossiers.filter(d => d.statut !== 'cloture').length, bg: 'bg-amber-50', color: 'text-amber-700', icon: Clock },
        { label: 'Clôturés',           value: dossiers.filter(d => d.statut === 'cloture').length, bg: 'bg-green-50', color: 'text-green-700', icon: CheckCircle2 },
        { label: 'Documents',          value: documents.length, bg: 'bg-purple-50', color: 'text-purple-700', icon: FileText },
      ];
    }
    
    if (role === 'assistant_directeur') {
      return [
        { label: 'Dossiers créés',     value: dossiers.length, bg: 'bg-blue-50', color: 'text-blue-700', icon: FolderOpen },
        { label: 'Documents scannés',  value: documents.length, bg: 'bg-purple-50', color: 'text-purple-700', icon: FileText },
        { label: 'Nouveaux',           value: dossiers.filter(d => d.statut === 'nouveau').length, bg: 'bg-purple-50', color: 'text-purple-700', icon: Sparkles },
        { label: 'En transit',         value: dossiers.filter(d => d.statut === 'transit').length, bg: 'bg-blue-50', color: 'text-blue-700', icon: Clock },
      ];
    }
    
    if (role === 'transit') {
      return [
        { label: 'À traiter',          value: dossiers.filter(d => d.statut === 'transit').length, bg: 'bg-blue-50', color: 'text-blue-700', icon: Clock },
        { label: 'Traités',            value: dossiers.filter(d => ['passation','logistique','livraison','cloture'].includes(d.statut)).length, bg: 'bg-green-50', color: 'text-green-700', icon: CheckCircle2 },
        { label: 'Documents',          value: documents.length, bg: 'bg-purple-50', color: 'text-purple-700', icon: FileText },
        { label: 'Total dossiers',     value: dossiers.length, bg: 'bg-gray-50', color: 'text-gray-700', icon: BarChart3 },
      ];
    }
    
    if (role === 'passation') {
      return [
        { label: 'À valider',          value: dossiers.filter(d => d.statut === 'passation').length, bg: 'bg-amber-50', color: 'text-amber-700', icon: CheckSquare },
        { label: 'Validés',            value: dossiers.filter(d => ['logistique','livraison','cloture'].includes(d.statut)).length, bg: 'bg-green-50', color: 'text-green-700', icon: CheckCircle2 },
        { label: 'Documents',          value: documents.length, bg: 'bg-purple-50', color: 'text-purple-700', icon: FileText },
        { label: 'Total dossiers',     value: dossiers.length, bg: 'bg-gray-50', color: 'text-gray-700', icon: BarChart3 },
      ];
    }
    
    if (role === 'logistique') {
      return [
        { label: 'À expédier',         value: dossiers.filter(d => d.statut === 'logistique').length, bg: 'bg-green-50', color: 'text-green-700', icon: Truck },
        { label: 'En livraison',       value: dossiers.filter(d => d.statut === 'livraison').length, bg: 'bg-emerald-50', color: 'text-emerald-700', icon: Package },
        { label: 'Camions en mission', value: camions.filter(c => c.statut === 'en_mission').length, bg: 'bg-blue-50', color: 'text-blue-700', icon: Truck },
        { label: 'Camions disponibles', value: camions.filter(c => c.statut === 'disponible').length, bg: 'bg-amber-50', color: 'text-amber-700', icon: ParkingCircle },
      ];
    }
    
    if (role === 'caisse' || role === 'comptabilite') {
      return [
        { label: 'Total dossiers',     value: dossiers.length, bg: 'bg-blue-50', color: 'text-blue-700', icon: FolderOpen },
        { label: 'À facturer',         value: dossiers.filter(d => d.statut === 'cloture').length, bg: 'bg-red-50', color: 'text-red-700', icon: Wallet },
        { label: 'En cours',           value: dossiers.filter(d => d.statut !== 'cloture').length, bg: 'bg-amber-50', color: 'text-amber-700', icon: Clock },
        { label: 'Clôturés',           value: dossiers.filter(d => d.statut === 'cloture').length, bg: 'bg-green-50', color: 'text-green-700', icon: CheckCircle2 },
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
        { label: 'Voir tous les dossiers', icon: FolderOpen, color: 'bg-blue-50 text-blue-700', path: '/dossiers' },
        { label: 'Gestion documents',      icon: FileText, color: 'bg-purple-50 text-purple-700', path: '/documents' },
        { label: 'Gestion utilisateurs',   icon: UserCog, color: 'bg-amber-50 text-amber-700', path: '/utilisateurs' },
        { label: 'Caisse & Comptabilité',  icon: Wallet, color: 'bg-red-50 text-red-700', path: '/finance' },
      ];
    }
    if (role === 'assistant_directeur') {
      return [
        { label: 'Nouveau dossier',        icon: Plus, color: 'bg-blue-50 text-blue-700', path: '/dossiers' },
        { label: 'Nouveau client',         icon: Users, color: 'bg-green-50 text-green-700', path: '/clients' },
        { label: 'Scanner document',       icon: FileText, color: 'bg-purple-50 text-purple-700', path: '/documents' },
      ];
    }
    if (role === 'transit') {
      return [
        { label: 'Mes dossiers',           icon: FolderOpen, color: 'bg-blue-50 text-blue-700', path: '/dossiers' },
        { label: 'Déclarations',           icon: Clock, color: 'bg-amber-50 text-amber-700', path: '/transit' },
        { label: 'Documents',              icon: FileText, color: 'bg-purple-50 text-purple-700', path: '/documents' },
      ];
    }
    if (role === 'passation') {
      return [
        { label: 'Mes dossiers',           icon: FolderOpen, color: 'bg-blue-50 text-blue-700', path: '/dossiers' },
        { label: 'Passations',             icon: CheckSquare, color: 'bg-amber-50 text-amber-700', path: '/passation' },
        { label: 'Documents',              icon: FileText, color: 'bg-purple-50 text-purple-700', path: '/documents' },
      ];
    }
    if (role === 'logistique') {
      return [
        { label: 'Missions',               icon: Truck, color: 'bg-green-50 text-green-700', path: '/logistique' },
        { label: 'Suivi camions',          icon: MapPin, color: 'bg-blue-50 text-blue-700', path: '/suivi-camions' },
        { label: 'Carte GPS',              icon: Map, color: 'bg-purple-50 text-purple-700', path: '/carte-camions' },
        { label: 'Gestion camions',        icon: Truck, color: 'bg-amber-50 text-amber-700', path: '/camions' },
      ];
    }
    if (role === 'caisse' || role === 'comptabilite') {
      return [
        { label: 'Facturation',            icon: Wallet, color: 'bg-red-50 text-red-700', path: '/finance' },
        { label: 'Dossiers',               icon: FolderOpen, color: 'bg-blue-50 text-blue-700', path: '/dossiers' },
      ];
    }
    return [];
  };

  const stats = getStats();
  const dossiersAction = getDossiersAction();
  const actions = actionsRapides();

  return (
    <Layout title={t(config.titreKey)}>
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          Chargement...
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          {/* Carte de bienvenue */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden bg-gradient-to-r from-[#1F3864] to-[#2E5FA3] bg-200 animate-gradientShift rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-floatSlow pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <config.icone size={22} strokeWidth={2} />
              </div>
              <div>
                <div className="text-lg font-semibold font-display">
                  {t('bonjour')} {utilisateur?.prenom} {utilisateur?.nom} !
                </div>
                <div className="text-sm text-blue-100 mt-1">
                  {new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 * i }}
                className={`${s.bg} card-hover elegant-card p-4`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-[10px] text-ink-400 uppercase tracking-wide font-medium">{s.label}</div>
                  <s.icon size={18} strokeWidth={2} className={s.color} />
                </div>
                <div className={`text-3xl font-bold font-display ${s.color}`}>{s.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Actions rapides */}
          {actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="elegant-card overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-ink-100 flex items-center gap-2">
                <Zap size={16} strokeWidth={2} className="text-gold-500" />
                <span className="text-sm font-semibold text-ink-800">{t('actions_rapides')}</span>
              </div>
              <div className="p-4 grid grid-cols-4 gap-3">
                {actions.map((a, i) => (
                  <motion.button
                    key={a.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.05 * i }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(a.path)}
                    className={`${a.color} h-20 rounded-lg flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md transition-shadow border border-gray-200`}
                  >
                    <a.icon size={22} strokeWidth={2} />
                    <span className="text-xs font-medium">{a.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Dossiers nécessitant une action */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="elegant-card overflow-hidden"
          >
            <div className="px-4 py-3 border-ink-100 border-b flex items-center justify-between">
              <span className="text-sm font-semibold text-ink-800 flex items-center gap-2">
                {utilisateur?.role === 'admin' || utilisateur?.role === 'direction' 
                  ? <FolderOpen size={16} strokeWidth={2} className="text-gold-500" />
                  : <AlertTriangle size={16} strokeWidth={2} className="text-amber-500" />}
                {utilisateur?.role === 'admin' || utilisateur?.role === 'direction' 
                  ? t('derniers_dossiers')
                  : t('dossiers_a_traiter')}
              </span>
              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {dossiersAction.length} dossier{dossiersAction.length > 1 ? 's' : ''}
              </span>
            </div>
            {dossiersAction.length === 0 ? (
              <div className="p-10 text-center text-ink-400 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 size={28} strokeWidth={1.5} className="text-green-400" />
                {t('aucun_dossier_attente')}
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-ink-50 border-b border-ink-100">
                    <th className="elegant-th">N° {t('nav_dossiers')}</th>
                    <th className="elegant-th">{t('client')}</th>
                    <th className="elegant-th">{t('type')}</th>
                    <th className="elegant-th">{t('statut')}</th>
                    <th className="elegant-th">{t('date')}</th>
                    <th className="elegant-th">{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiersAction.slice(0, 10).map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-ink-50 cursor-pointer"
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
                        <button className="h-6 px-2 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200 hover:bg-blue-100 inline-flex items-center gap-1">
                          {t('ouvrir')} <ArrowRight size={11} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>

        </div>
      )}
    </Layout>
  );
}