import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <div className="relative min-h-screen overflow-hidden bg-[#0C2444] flex items-center justify-center p-4 font-sans">

      {/* Fond dégradé animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0C2444] via-[#1F3864] to-[#0C2444] bg-200 animate-gradientShift" />

      {/* Halos lumineux flottants */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#2E5FA3]/30 blur-3xl animate-floatSlow" />
      <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-red-500/10 blur-3xl animate-floatSlower" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl animate-floatSlow" />

      {/* Grille subtile en fond */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >

        {/* Logo en haut */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-blue-400/30 blur-xl animate-pulseGlow" />
            <div className="relative w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/10 p-3">
              <img
                src="/logo.jpg"
                alt="e-Trans"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">e-Trans</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-0.5 w-6 bg-red-400"></div>
            <p className="text-xs text-red-300 font-medium tracking-[0.3em]">TOGO</p>
            <div className="h-0.5 w-6 bg-red-400"></div>
          </div>
        </motion.div>

        {/* Carte de connexion */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/20 p-8"
        >

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
                className="h-10 border border-gray-200 rounded-md px-3 text-sm outline-none transition-all duration-200 focus:border-[#2E5FA3] focus:ring-2 focus:ring-blue-100 focus:shadow-md"
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
                  className="w-full h-10 border border-gray-200 rounded-md px-3 pr-10 text-sm outline-none transition-all duration-200 focus:border-[#2E5FA3] focus:ring-2 focus:ring-blue-100 focus:shadow-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs transition-transform hover:scale-110"
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ y: -2, boxShadow: '0 10px 20px -6px rgba(31,56,100,0.5)' }}
              whileTap={{ scale: 0.97 }}
              className="h-10 bg-gradient-to-r from-[#1F3864] to-[#2E5FA3] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-60 mt-2 shadow-md"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </motion.button>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 mt-4 p-2 bg-blue-50 rounded-md"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-blue-700">
              Système opérationnel · Connexion sécurisée JWT
            </span>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <p className="text-[10px] text-white/50">
            © 2026 e-Trans · Tous droits réservés
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
