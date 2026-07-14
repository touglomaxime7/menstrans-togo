import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function SplashScreen() {
  const navigate    = useNavigate();
  const { isAuthenticated, utilisateur } = useAuth();
  const [pret, setPret] = useState(false);

  // Timeout maximum : après 3 secondes on redirige quoi qu'il arrive
  useEffect(() => {
    const timer = setTimeout(() => { setPret(true); }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Rediriger dès que prêt (timeout atteint ou auth connue)
  useEffect(() => {
    if (!pret && isAuthenticated === undefined) return;
    if (pret || isAuthenticated !== undefined) {
      if (isAuthenticated) {
        if (utilisateur?.role === 'chauffeur') {
          navigate('/mon-camion');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/login');
      }
    }
  }, [pret, isAuthenticated, utilisateur, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C2444] via-[#1F3864] to-[#2E5FA3] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-10 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>

      <div className="flex flex-col items-center gap-6 z-10">
        <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/30 animate-pulse">
          <img src="/logo.jpg" alt="MENSTRANS-TOGO" className="w-40 h-40 object-contain"/>
        </div>
        <div className="text-center mt-4">
          <h1 className="text-5xl font-bold text-white tracking-wide drop-shadow-lg">MENSTRANS</h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="h-0.5 w-12 bg-red-400"></div>
            <p className="text-red-300 text-lg font-medium tracking-[0.4em]">TOGO</p>
            <div className="h-0.5 w-12 bg-red-400"></div>
          </div>
        </div>
        <p className="text-blue-100 text-sm mt-2 italic tracking-wide">
          Gestion du Transit & de la Facturation
        </p>
      </div>

      <div className="absolute bottom-24 flex flex-col items-center gap-3 z-10">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-blue-200 text-[11px] tracking-[0.3em] font-medium">CHARGEMENT...</p>
      </div>

      <div className="absolute bottom-4 text-center z-10">
        <p className="text-blue-300 text-[10px] tracking-wide">
          © 2026 MENSTRANS-TOGO · Tous droits réservés
        </p>
      </div>
    </div>
  );
}