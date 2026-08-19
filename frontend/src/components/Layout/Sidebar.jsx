import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../i18n/LanguageContext';
import { useUI } from '../../context/UIContext';

const menuItems = [
  { path: '/dashboard',    labelKey: 'nav_dashboard', icon: '⊞',  roles: [], end: true },
  { path: '/documents',    labelKey: 'nav_documents', icon: '📄', roles: [], end: false },
  { path: '/clients',      labelKey: 'nav_clients',   icon: '👥', roles: [], end: false },
  { path: '/dossiers',     labelKey: 'nav_dossiers',  icon: '📁', roles: [], end: false },
  { path: '/contrats',          labelKey: 'nav_contrats', icon: '📝', roles: [], end: false },
  { path: '/direction/recettes',labelKey: 'nav_recettes', icon: '💵', roles: ['admin', 'direction', 'assistant_directeur'], end: false },
  { path: '/historique', labelKey: 'nav_historique', icon: '🕐', roles: ['admin', 'direction'], end: false },
  { path: '/transit',      labelKey: 'nav_transit',      icon: '🕐', roles: ['transit'], end: false },
  { path: '/passation',    labelKey: 'nav_passation',    icon: '✅', roles: ['passation'], end: false },
  { path: '/logistique',   labelKey: 'nav_logistique',   icon: '🚛', roles: ['logistique'], end: false },
  { path: '/camions',      labelKey: 'nav_camions',      icon: '🚚', roles: ['logistique'], end: false },
  { path: '/suivi-camions',labelKey: 'nav_suivi_camions',icon: '📍', roles: ['logistique'], end: false },
  { path: '/carte-camions',labelKey: 'nav_carte_gps',    icon: '🗺️', roles: ['logistique'], end: false },
  { path: '/finance',      labelKey: 'nav_finance',      icon: '💰', roles: ['caisse', 'comptabilite'], end: false },
  { path: '/archives',     labelKey: 'nav_archives',     icon: '🗄️', roles: [], end: false },
  { path: '/utilisateurs', labelKey: 'nav_utilisateurs', icon: '👤', roles: ['admin', 'direction'], end: false },
  { path: '/mon-profil',   labelKey: 'nav_mon_profil',   icon: '⚙️', roles: [], end: false },
  { path: '/direction/etudes', labelKey: 'nav_etudes', icon: '🔒', roles: ['direction'], end: false },
];

export default function Sidebar() {
  const { utilisateur, aAcces, estAdmin, handleLogout } = useAuth();
  const { t } = useLanguage();
  const { collapsed, mobileOpen, closeMobileMenu } = useUI();

  const initiales = utilisateur
    ? `${utilisateur.prenom[0]}${utilisateur.nom[0]}`
    : 'U';

  const content = (
    <>
      {/* Halo décoratif discret */}
      <div className="absolute -top-16 -left-16 w-52 h-52 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className={`relative p-5 border-b border-[#2A4A7A] flex items-center gap-3 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="relative w-12 h-12 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-blue-300/20 blur-lg animate-pulseGlow" />
          <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md ring-1 ring-white/20 p-1">
            <img
              src="/logo.jpg"
              alt="e-Trans"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-white text-base font-semibold tracking-wide">e-Trans</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="h-px w-3 bg-red-400"></div>
              <div className="text-red-300 text-[10px] font-medium tracking-[0.2em]">TOGO</div>
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="relative flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <div className="px-4 py-2 text-[#5A7FA0] text-[11px] font-medium uppercase tracking-wider">
            {t('menu_principal')}
          </div>
        )}
        {menuItems.map((item, index) => {
          if (item.roles.length > 0 && !estAdmin() && !aAcces(item.roles)) {
            return null;
          }
          return (
            <motion.div
              key={item.path}
              initial={{ x: -12, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.03 * index }}
            >
              <NavLink
                to={item.path}
                end={item.end}
                onClick={closeMobileMenu}
                title={collapsed ? t(item.labelKey) : undefined}
                className={({ isActive }) =>
                  `group flex items-center gap-3 mx-2 px-4 py-3 rounded-md text-sm cursor-pointer transition-all duration-200 ${
                    collapsed ? 'justify-center px-0' : ''
                  } ${
                    isActive
                      ? 'bg-[#2E5FA3] text-white shadow-md translate-x-0.5'
                      : 'text-[#C5DCF0] hover:bg-white/10 hover:translate-x-0.5'
                  }`
                }
              >
                <span className="text-lg transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer utilisateur */}
      <div className="relative p-4 border-t border-[#2A4A7A]">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-[#2E5FA3] flex items-center justify-center text-white text-xs font-medium ring-2 ring-white/10 flex-shrink-0">
            {initiales}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[#C5DCF0] text-sm font-medium truncate">
                {utilisateur?.prenom} {utilisateur?.nom}
              </div>
              <div className="text-[#5A7FA0] text-xs truncate">
                {utilisateur?.role}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-[#5A7FA0] hover:text-white text-base transition-transform hover:scale-110 flex-shrink-0"
            title={t('deconnexion')}
          >
            ⏻
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Sidebar desktop (repliable) */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: collapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="hidden md:flex bg-gradient-to-b from-[#1F3864] to-[#173257] flex-col min-h-screen flex-shrink-0 relative overflow-hidden"
      >
        {content}
      </motion.div>

      {/* Sidebar mobile (panneau glissant + overlay) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="md:hidden fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#1F3864] to-[#173257] flex flex-col z-50 relative overflow-hidden"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
