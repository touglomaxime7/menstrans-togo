import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);
  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const userData = await handleLogin(email, password);
      toast.success('Connexion réussie !');
      if (userData.utilisateur.role === 'chauffeur') {
        navigate('/mon-camion');
      } else {
        navigate('/dashboard');
      }
    } catch {
      toast.error('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center p-4 font-sans">

      <div className="w-full max-w-md">

        {/* Logo en haut */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-100 mb-4 p-3">
            <img
              src="/logo.jpg"
              alt="MENSTRANS-TOGO"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-[#1F3864] tracking-wide">MENSTRANS</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-0.5 w-6 bg-red-400"></div>
            <p className="text-xs text-red-600 font-medium tracking-[0.3em]">TOGO</p>
            <div className="h-0.5 w-6 bg-red-400"></div>
          </div>
        </div>

        {/* Carte de connexion */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          <div className="mb-6">
            <h2 className="text-xl font-medium text-gray-800 mb-1">Connexion</h2>
            <p className="text-xs text-gray-400">
              Entrez vos identifiants pour accéder à votre espace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@menstrans.tg"
                className="h-10 border border-gray-200 rounded-md px-3 text-sm outline-none focus:border-[#2E5FA3] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 border border-gray-200 rounded-md px-3 pr-10 text-sm outline-none focus:border-[#2E5FA3] focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-10 bg-[#1F3864] text-white rounded-md text-sm font-medium hover:bg-[#2E5FA3] transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="flex items-center gap-2 mt-4 p-2 bg-blue-50 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-blue-700">
              Système opérationnel · Connexion sécurisée JWT
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[10px] text-gray-400">
            © 2026 MENSTRANS-TOGO · Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}