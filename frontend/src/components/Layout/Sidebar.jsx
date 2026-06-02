import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const menuItems = [
  { path: '/dashboard',    label: 'Tableau de bord', icon: '⊞',  roles: [], end: true },
  { path: '/documents',    label: 'Documents',       icon: '📄', roles: [], end: false },
  { path: '/clients',      label: 'Clients',         icon: '👥', roles: [], end: false },
  { path: '/dossiers',     label: 'Dossiers',        icon: '📁', roles: [], end: false },
  { path: '/transit',      label: 'Transit',         icon: '🕐', roles: ['transit'], end: false },
  { path: '/passation',    label: 'Passation',       icon: '✅', roles: ['passation'], end: false },
  { path: '/logistique',   label: 'Logistique',      icon: '🚛', roles: ['logistique'], end: false },
  { path: '/camions',      label: 'Camions',         icon: '🚚', roles: ['logistique'], end: false },
  { path: '/suivi-camions',label: 'Suivi Camions',   icon: '📍', roles: ['logistique'], end: false },
  { path: '/carte-camions',label: 'Carte GPS',       icon: '🗺️', roles: ['logistique'], end: false },
  { path: '/finance',      label: 'Caisse & Compta', icon: '💰', roles: ['caisse', 'comptabilite'], end: false },
  { path: '/archives',     label: 'Archives',        icon: '🗄️', roles: [], end: false },
  { path: '/utilisateurs', label: 'Utilisateurs',    icon: '👤', roles: ['admin', 'direction'], end: false },
  { path: '/mon-profil',   label: 'Mon Profil',      icon: '⚙️', roles: [], end: false },
     { path: '/direction/etudes', label: 'Études (Direction)', icon: '🔒', roles: ['direction'], end: false },
];

export default function Sidebar() {
  const { utilisateur, aAcces, estAdmin, handleLogout } = useAuth();

  const initiales = utilisateur
    ? `${utilisateur.prenom[0]}${utilisateur.nom[0]}`
    : 'U';

  return (
    <div className="w-64 bg-[#1F3864] flex flex-col min-h-screen flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-[#2A4A7A] flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md ring-1 ring-white/20 p-1 flex-shrink-0">
          <img
            src="/logo.jpg"
            alt="MENSTRANS-TOGO"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="text-white text-base font-semibold tracking-wide">MENSTRANS</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-px w-3 bg-red-400"></div>
            <div className="text-red-300 text-[10px] font-medium tracking-[0.2em]">TOGO</div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-3">
        <div className="px-4 py-2 text-[#5A7FA0] text-[11px] font-medium uppercase tracking-wider">
          Principal
        </div>
        {menuItems.map((item) => {
          if (item.roles.length > 0 && !estAdmin() && !aAcces(item.roles)) {
            return null;
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 px-4 py-3 rounded-md text-sm cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#2E5FA3] text-white'
                    : 'text-[#C5DCF0] hover:bg-white/10'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer utilisateur */}
      <div className="p-4 border-t border-[#2A4A7A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2E5FA3] flex items-center justify-center text-white text-xs font-medium">
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[#C5DCF0] text-sm font-medium truncate">
              {utilisateur?.prenom} {utilisateur?.nom}
            </div>
            <div className="text-[#5A7FA0] text-xs truncate">
              {utilisateur?.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-[#5A7FA0] hover:text-white text-base"
            title="Déconnexion"
          >
            ⏻
          </button>
        </div>
      </div>
    </div>
  );
}