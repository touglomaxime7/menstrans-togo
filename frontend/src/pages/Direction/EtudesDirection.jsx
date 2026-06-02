import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import api from '../../api/axios';
import { toast } from 'react-toastify';

export default function EtudesDirection() {
  const [etudes,    setEtudes]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [etudeActive, setEtudeActive] = useState(null);
  const [form, setForm] = useState({
    frais_transit:      0,
    frais_manutention:  0,
    frais_portuaires:   0,
    autres_frais:       0,
  });

  const fetchEtudes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transit/etudes/');
      setEtudes(res.data.results || res.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEtudes(); }, []);

  const ouvrirCompletement = (etude) => {
    setEtudeActive(etude);
    setForm({
      frais_transit:     etude.frais_transit     || 0,
      frais_manutention: etude.frais_manutention || 0,
      frais_portuaires:  etude.frais_portuaires  || 0,
      autres_frais:      etude.autres_frais      || 0,
    });
    setShowModal(true);
  };

  const validerCompletement = () => {
    const erreurs = [];
    if (form.frais_transit === '' || form.frais_transit === null)
      erreurs.push('Les frais de transit');
    if (form.frais_manutention === '' || form.frais_manutention === null)
      erreurs.push('Les frais de manutention');
    if (form.frais_portuaires === '' || form.frais_portuaires === null)
      erreurs.push('Les frais portuaires');
    if (form.autres_frais === '' || form.autres_frais === null)
      erreurs.push('Les autres frais');

    if (erreurs.length > 0) {
      toast.error('Champs obligatoires manquants : ' + erreurs.join(', '));
      return false;
    }
    return true;
  };

  const handleCompleter = async (e) => {
    e.preventDefault();
    if (!validerCompletement()) return;
    try {
      await api.post(`/transit/etudes/${etudeActive.id}/completer/`, {
        frais_transit:     parseFloat(form.frais_transit),
        frais_manutention: parseFloat(form.frais_manutention),
        frais_portuaires:  parseFloat(form.frais_portuaires),
        autres_frais:      parseFloat(form.autres_frais),
      });
      toast.success('Étude complétée avec succès !');
      setShowModal(false);
      setEtudeActive(null);
      fetchEtudes();
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur lors de la mise à jour');
    }
  };

  // Calcul du total dans le modal pendant la saisie
  const totalSaisie =
    parseFloat(etudeActive?.droit_taxe_douane || 0) +
    parseFloat(form.frais_transit     || 0) +
    parseFloat(form.frais_manutention || 0) +
    parseFloat(form.frais_portuaires  || 0) +
    parseFloat(form.autres_frais      || 0);

  return (
    <Layout
      title="Direction — Études de valeur"
      subtitle="Complément des frais confidentiels"
    >
      <div className="flex flex-col gap-4">

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800">
          🔒 Cette page est réservée à la Direction. Vous y voyez les études de valeur saisies par le Service Transit (DTD uniquement) et vous pouvez compléter les frais confidentiels (transit, manutention, portuaires, autres).
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-800">Liste complète des études de valeur</span>
            <span className="text-[10px] text-gray-400">{etudes.length} étude(s)</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
          ) : etudes.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucune étude de valeur</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Dossier</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">DTD</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Transit</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Manutention</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Portuaires</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Autres</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Total</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">État</th>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {etudes.map((e) => {
                  const complete = (parseFloat(e.frais_transit || 0) +
                                    parseFloat(e.frais_manutention || 0) +
                                    parseFloat(e.frais_portuaires || 0) +
                                    parseFloat(e.autres_frais || 0)) > 0;
                  return (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-blue-600">{e.dossier_numero || e.dossier}</td>
                      <td className="px-3 py-2 font-medium">{parseFloat(e.droit_taxe_douane).toLocaleString('fr-FR')} F</td>
                      <td className="px-3 py-2">{parseFloat(e.frais_transit || 0).toLocaleString('fr-FR')} F</td>
                      <td className="px-3 py-2">{parseFloat(e.frais_manutention || 0).toLocaleString('fr-FR')} F</td>
                      <td className="px-3 py-2">{parseFloat(e.frais_portuaires || 0).toLocaleString('fr-FR')} F</td>
                      <td className="px-3 py-2">{parseFloat(e.autres_frais || 0).toLocaleString('fr-FR')} F</td>
                      <td className="px-3 py-2 font-medium text-blue-700">
                        {parseFloat(e.total || 0).toLocaleString('fr-FR')} F
                      </td>
                      <td className="px-3 py-2">
                        {complete
                          ? <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">✓ Complété</span>
                          : <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">⏳ À compléter</span>
                        }
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => ouvrirCompletement(e)}
                          className="h-6 px-2 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200 hover:bg-blue-100">
                          {complete ? 'Modifier' : 'Compléter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de complétement */}
      {showModal && etudeActive && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[520px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">
                  Complément des frais — Dossier {etudeActive.dossier_numero || etudeActive.dossier}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  DTD déjà saisi : {parseFloat(etudeActive.droit_taxe_douane).toLocaleString('fr-FR')} F
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-5 pt-3">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-[10px] text-blue-700">
                ℹ️ Renseignez les frais confidentiels. Ces montants ne sont visibles que par la Direction.
              </div>
            </div>
            <form onSubmit={handleCompleter} className="p-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'frais_transit',     label: 'Frais transit (FCFA)' },
                  { key: 'frais_manutention', label: 'Manutention (FCFA)' },
                  { key: 'frais_portuaires',  label: 'Frais portuaires (FCFA)' },
                  { key: 'autres_frais',      label: 'Autres frais (FCFA)' },
                ].map((f) => (
                  <div key={f.key} className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-gray-500 uppercase">
                      {f.label} <span className="text-red-500">*</span>
                    </label>
                    <input type="number" value={form[f.key]}
                      onChange={(ev) => setForm({...form, [f.key]: ev.target.value})}
                      className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                  </div>
                ))}
              </div>

              {/* Total calculé */}
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                <span className="text-[11px] text-blue-700 font-medium">Total étude de valeur</span>
                <span className="text-base font-bold text-blue-800">
                  {totalSaisie.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="h-8 px-4 border border-gray-200 rounded-md text-xs text-gray-500">Annuler</button>
                <button type="submit"
                  className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}