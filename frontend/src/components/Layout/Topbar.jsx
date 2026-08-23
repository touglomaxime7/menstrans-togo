import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../i18n/LanguageContext';
import { useUI } from '../../context/UIContext';
import api from '../../api/axios';
import { Search, X, FolderOpen, Users, FileSignature, Bell } from 'lucide-react';

export default function Topbar({ title, subtitle }) {
  const { utilisateur } = useAuth();
  const navigate        = useNavigate();
  const { t, lang, toggleLang } = useLanguage();
  const { toggleSidebar } = useUI();
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const wrapperRef = useRef(null);
  const timerRef   = useRef(null);

  const today = new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const initiales = utilisateur
    ? `${utilisateur.prenom?.[0] || ''}${utilisateur.nom?.[0] || ''}`
    : 'U';

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Recherche avec debounce 400ms
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      setShowDrop(false);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { rechercherTout(query.trim()); }, 400);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const rechercherTout = async (q) => {
    setLoading(true);
    setShowDrop(true);
    try {
      const [resDossiers, resClients, resContrats] = await Promise.allSettled([
        api.get('/dossiers/',  { params: { search: q } }),
        api.get('/clients/',   { params: { search: q } }),
        api.get('/contrats/',  { params: { search: q } }),
      ]);

      const dossiers = resDossiers.status === 'fulfilled'
        ? (resDossiers.value.data.results || resDossiers.value.data).slice(0, 4) : [];
      const clients  = resClients.status === 'fulfilled'
        ? (resClients.value.data.results || resClients.value.data).slice(0, 4) : [];
      const contrats = resContrats.status === 'fulfilled'
        ? (resContrats.value.data.results || resContrats.value.data).slice(0, 3) : [];

      setResults({ dossiers, clients, contrats });
    } catch {
      setResults({ dossiers: [], clients: [], contrats: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (type, item) => {
    setQuery('');
    setShowDrop(false);
    setResults(null);
    if (type === 'dossier') navigate(`/dossiers/${item.id}`);
    if (type === 'client')  navigate(`/clients/${item.id}`);
    if (type === 'contrat') navigate(`/contrats`);
  };

  const totalResultats = results
    ? (results.dossiers.length + results.clients.length + results.contrats.length)
    : 0;

  const CLASSIF_COLORS = {
    urgent:      'bg-orange-100 text-orange-700',
    vip:         'bg-yellow-100 text-yellow-800',
    contentieux: 'bg-red-100 text-red-700',
    standard:    'bg-gray-100 text-gray-500',
  };

  return (
    <div className="bg-white h-16 px-5 flex items-center justify-between border-b border-ink-100 flex-shrink-0">
      {/* Bouton menu (hamburger) + Titre */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          title={t('etendre_menu')}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1 rounded-md hover:bg-ink-50 transition-colors flex-shrink-0"
        >
          <span className="block w-5 h-0.5 bg-ink-500 rounded transition-all"></span>
          <span className="block w-5 h-0.5 bg-ink-500 rounded transition-all"></span>
          <span className="block w-5 h-0.5 bg-ink-500 rounded transition-all"></span>
        </button>
        <div>
          <div className="text-[15px] font-semibold text-ink-800 font-display tracking-tight">{title}</div>
          <div className="text-[11px] text-ink-400 mt-0.5">{subtitle || today}</div>
        </div>
      </div>

      {/* Barre de recherche globale */}
      <div ref={wrapperRef} className="relative flex-1 max-w-lg mx-6">
        <div className="relative">
          <Search size={13} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results && setShowDrop(true)}
            placeholder={t('recherche_globale')}
            className="w-full h-9 pl-8 pr-4 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-gray-50"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          )}
          {query && !loading && (
            <button
              onClick={() => { setQuery(''); setResults(null); setShowDrop(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Dropdown résultats */}
        <AnimatePresence>
        {showDrop && results && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute top-11 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto"
          >

            {totalResultats === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-xs">
                {t('aucun_resultat')} "<strong>{query}</strong>"
              </div>
            ) : (
              <div>
                {/* ── Dossiers ── */}
                {results.dossiers.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                      <span className="inline-flex items-center gap-1.5"><FolderOpen size={12} strokeWidth={2} />{t('dossiers_label')} ({results.dossiers.length})</span>
                    </div>
                    {results.dossiers.map(d => (
                      <button key={d.id}
                        onClick={() => handleSelect('dossier', d)}
                        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-blue-50 border-b border-gray-50 transition text-left">
                        <div>
                          <div className="text-xs font-semibold text-blue-700">
                            {d.numero_dossier}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {d.client_nom} · {d.type_transport}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {d.classification && d.classification !== 'standard' && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${CLASSIF_COLORS[d.classification]}`}>
                              {d.classification.toUpperCase()}
                            </span>
                          )}
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                            {d.statut_label || d.statut}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Clients ── */}
                {results.clients.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                      <span className="inline-flex items-center gap-1.5"><Users size={12} strokeWidth={2} />{t('clients_label')} ({results.clients.length})</span>
                    </div>
                    {results.clients.map(c => (
                      <button key={c.id}
                        onClick={() => handleSelect('client', c)}
                        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-blue-50 border-b border-gray-50 transition text-left">
                        <div>
                          <div className="text-xs font-semibold text-gray-700">{c.nom}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {c.telephone || '—'} · {c.ville || '—'}
                          </div>
                        </div>
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                          {t('voir_profil')} →
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Contrats ── */}
                {results.contrats.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                      <span className="inline-flex items-center gap-1.5"><FileSignature size={12} strokeWidth={2} />{t('contrats_label')} ({results.contrats.length})</span>
                    </div>
                    {results.contrats.map(c => (
                      <button key={c.id}
                        onClick={() => handleSelect('contrat', c)}
                        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-blue-50 border-b border-gray-50 transition text-left">
                        <div>
                          <div className="text-xs font-semibold text-gray-700">
                            {c.numero_contrat}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {c.dossier_numero} · {c.client_nom}
                          </div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                          c.statut === 'valide'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {c.statut}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 py-2 text-[10px] text-gray-400 text-center bg-gray-50 border-t border-gray-100">
                  {totalResultats} {t('resultat')}{totalResultats > 1 ? 's' : ''} {lang === 'fr' ? 'pour' : 'for'} "{query}"
                </div>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Droite : langue + date + notif + avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <motion.button
          onClick={toggleLang}
          whileTap={{ scale: 0.9 }}
          title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-[11px] font-semibold text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
          </svg>
          {lang.toUpperCase()}
        </motion.button>
        <div className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200 hidden sm:block">
          {today}
        </div>
        <div className="relative cursor-pointer transition-transform hover:scale-110">
          <Bell size={16} strokeWidth={2} className="text-gray-500" />
        </div>
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-medium text-blue-800 transition-transform hover:scale-110 ring-2 ring-transparent hover:ring-blue-200">
          {initiales}
        </div>
      </div>
    </div>
  );
}