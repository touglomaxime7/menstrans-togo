import { useState, useEffect } from 'react';
import { getDossiers } from '../api/dossiers';

/**
 * Mini tableau de bord réutilisable pour chaque section (Transit, Logistique, Passation, Finance...).
 * Affiche : dossiers actifs dans cette section, urgents/VIP, temps moyen, total.
 *
 * Usage : <TableauBordSection statuts={['transit']} titre="Transit" />
 */
export default function TableauBordSection({ statuts = [], titre = 'Section' }) {
  const [stats, setStats] = useState({
    total: 0, urgent: 0, vip: 0, contentieux: 0, dureeMoyenne: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const charger = async () => {
      setLoading(true);
      try {
        // Récupère tous les dossiers correspondant aux statuts de cette section
        const resultats = await Promise.all(
          statuts.map(s => getDossiers({ statut: s }))
        );
        const tousLesDossiers = resultats.flatMap(r => r.data.results || r.data);

        const urgent      = tousLesDossiers.filter(d => d.classification === 'urgent').length;
        const vip          = tousLesDossiers.filter(d => d.classification === 'vip').length;
        const contentieux  = tousLesDossiers.filter(d => d.classification === 'contentieux').length;

        // Durée moyenne (en jours) depuis la date d'ouverture du dossier
        const aujourdhui = new Date();
        const durees = tousLesDossiers.map(d => {
          const debut = new Date(d.date_debut);
          return Math.floor((aujourdhui - debut) / (1000 * 60 * 60 * 24));
        });
        const dureeMoyenne = durees.length > 0
          ? Math.round(durees.reduce((a, b) => a + b, 0) / durees.length)
          : 0;

        setStats({
          total: tousLesDossiers.length,
          urgent, vip, contentieux, dureeMoyenne,
        });
      } catch {
        // silencieux : le tableau de bord est secondaire, ne bloque pas la page
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [statuts.join(',')]);

  const CARTES = [
    { label: `Dossiers en ${titre}`, value: stats.total,       bg: 'bg-blue-50',   color: 'text-blue-700',   icon: '📁' },
    { label: 'Urgents',              value: stats.urgent,      bg: 'bg-orange-50', color: 'text-orange-700', icon: '🔥' },
    { label: 'VIP',                  value: stats.vip,         bg: 'bg-yellow-50', color: 'text-yellow-700', icon: '⭐' },
    { label: 'Contentieux',          value: stats.contentieux, bg: 'bg-red-50',    color: 'text-red-700',    icon: '⚠️' },
    { label: 'Durée moyenne',        value: `${stats.dureeMoyenne}j`, bg: 'bg-purple-50', color: 'text-purple-700', icon: '⏱' },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {CARTES.map((c) => (
        <div key={c.label} className={`${c.bg} rounded-lg p-3 border border-gray-200`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400">{c.label}</span>
            <span className="text-sm">{c.icon}</span>
          </div>
          <div className={`text-2xl font-medium ${c.color}`}>
            {loading ? '—' : c.value}
          </div>
        </div>
      ))}
    </div>
  );
}