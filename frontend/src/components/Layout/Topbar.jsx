import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

export default function Topbar({ title, subtitle }) {
  const { utilisateur } = useAuth();
  const navigate        = useNavigate();
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const wrapperRef = useRef(null);
  const timerRef   = useRef(null);

  const today = new Date().toLocaleDateString('fr-FR', {
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
    <div className="bg-white h-14 px-4 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
      {/* Titre */}
      <div className="flex-shrink-0">
        <div className="text-sm font-medium text-gray-800">{title}</div>
        <div className="text-[10px] text-gray-400">{subtitle || today}</div>
      </div>

      {/* Barre de recherche globale */}
      <div ref={wrapperRef} className="relative flex-1 max-w-lg mx-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results && setShowDrop(true)}
            placeholder="Recherche globale : dossier, client, contrat..."
            className="w-full h-9 pl-8 pr-4 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-gray-50"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">
              ⏳
            </span>
          )}
          {query && !loading && (
            <button
              onClick={() => { setQuery(''); setResults(null); setShowDrop(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
              ✕
            </button>
          )}
        </div>

        {/* Dropdown résultats */}
        {showDrop && results && (
          <div className="absolute top-11 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">

            {totalResultats === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-xs">
                Aucun résultat pour "<strong>{query}</strong>"
              </div>
            ) : (
              <div>
                {/* ── Dossiers ── */}
                {results.dossiers.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                      📁 Dossiers ({results.dossiers.length})
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
                      👥 Clients ({results.clients.length})
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
                          Voir profil →
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Contrats ── */}
                {results.contrats.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                      📝 Contrats ({results.contrats.length})
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
                  {totalResultats} résultat{totalResultats > 1 ? 's' : ''} pour "{query}"
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Droite : date + notif + avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200 hidden sm:block">
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