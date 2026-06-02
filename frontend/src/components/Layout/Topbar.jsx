import { useAuth } from '../../hooks/useAuth';

export default function Topbar({ title, subtitle }) {
  const { utilisateur } = useAuth();

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const initiales = utilisateur
    ? `${utilisateur.prenom[0]}${utilisateur.nom[0]}`
    : 'U';

  return (
    <div className="bg-white h-12 px-4 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
      <div>
        <div className="text-sm font-medium text-gray-800">{title}</div>
        <div className="text-[10px] text-gray-400">{subtitle || today}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200">
          {today}
        </div>
        <div className="relative cursor-pointer">
          <span className="text-gray-500 text-sm">🔔</span>
        </div>
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-medium text-blue-800">
          {initiales}
        </div>
      </div>
    </div>
  );
}