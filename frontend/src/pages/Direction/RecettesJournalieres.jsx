import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getRecettesJournalieres } from '../../api/contrats';

function formatFCFA(n) {
  return new Intl.NumberFormat('fr-TG', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(n);
}

const today = () => new Date().toISOString().split('T')[0];

export default function RecettesJournalieres() {
  const [date, setDate]       = useState(today());
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  const charger = async () => {
    setLoading(true);
    try {
      const res = await getRecettesJournalieres(date);
      setData(res.data);
    } catch {
      toast.error('Erreur de chargement des recettes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, [date]);

  const soldeColor = (n) => n >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recettes journalières</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tableau de bord — Direction</p>
        </div>
        <input
          type="date"
          value={date}
          max={today()}
          onChange={e => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Chargement...</div>
      ) : data ? (
        <>
          {/* Cartes résumé */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total recettes</p>
              <p className="text-2xl font-bold text-green-600">{formatFCFA(data.total_recettes)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total débours</p>
              <p className="text-2xl font-bold text-red-500">{formatFCFA(data.total_debours)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Solde journalier</p>
              <p className={`text-2xl font-bold ${soldeColor(data.solde_journalier)}`}>
                {formatFCFA(data.solde_journalier)}
              </p>
            </div>
          </div>

          {/* Sous-titre */}
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-700">
              Détail — {data.nb_operations} opération{data.nb_operations !== 1 ? 's' : ''}
            </h2>
          </div>

          {/* Tableau détail */}
          {data.detail.length === 0 ? (
            <div className="text-center text-gray-400 py-10 bg-white rounded-xl border border-gray-200">
              Aucune opération enregistrée pour cette date
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <th className="px-4 py-3 text-left">Dossier</th>
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left">Libellé</th>
                    <th className="px-4 py-3 text-left">Mode paiement</th>
                    <th className="px-4 py-3 text-right">Débours</th>
                    <th className="px-4 py-3 text-right">Facturé</th>
                    <th className="px-4 py-3 text-left">Enregistré par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.detail.map((ligne, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-blue-700">{ligne.dossier}</td>
                      <td className="px-4 py-3 text-gray-700">{ligne.client}</td>
                      <td className="px-4 py-3 text-gray-600">{ligne.libelle}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {ligne.mode_paiement}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">
                        {formatFCFA(ligne.montant_debours)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">
                        {formatFCFA(ligne.montant_facture)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{ligne.enregistre_par}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold text-sm border-t border-gray-200">
                    <td colSpan={4} className="px-4 py-3 text-gray-600">Total</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatFCFA(data.total_debours)}</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatFCFA(data.total_recettes)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}