import { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import TableauBordSection from '../../components/TableauBordSection';
import ComboBox from '../../components/ComboBox';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const TYPES_MONTANT = [
  'Banque', 'DFU', 'Manutention', 'Douane', 'Transport',
  'Consignataire', 'Honoraires', 'Frais portuaires', 'Frais transit', 'Autre',
];

const TYPES_MONTANT_MAP = {
  'Banque': 'banque', 'DFU': 'dfu', 'Manutention': 'manutention',
  'Douane': 'douane', 'Transport': 'transport', 'Consignataire': 'consignataire',
  'Honoraires': 'honoraires', 'Frais portuaires': 'frais_portuaires',
  'Frais transit': 'frais_transit', 'Autre': 'autre',
};

const TYPES_FACTURE = ['Émise (vers client)', 'Reçue (du fournisseur)'];
const TYPES_FACTURE_MAP = {
  'Émise (vers client)': 'emise',
  'Reçue (du fournisseur)': 'recue',
};

const MODES_PAIEMENT = ['Espèces', 'Virement', 'Chèque', 'Mobile Money'];
const MODES_PAIEMENT_MAP = {
  'Espèces': 'especes', 'Virement': 'virement',
  'Chèque': 'cheque', 'Mobile Money': 'mobile_money',
};

const STATUTS_PAIEMENT = ['Payé', 'En attente'];
const STATUTS_PAIEMENT_MAP = { 'Payé': 'paye', 'En attente': 'en_attente' };

export default function Finance() {
  const [montants,      setMontants]      = useState([]);
  const [factures,      setFactures]      = useState([]);
  const [bilan,         setBilan]         = useState(null);
  const [dossiers,      setDossiers]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState('montants');
  const [periode,       setPeriode]       = useState('mensuel');
  const [showModal,     setShowModal]     = useState(false);
  const [showFactModal, setShowFactModal] = useState(false);

  const [form, setForm] = useState({
    dossier: '', dossier_label: '',
    type_montant: '', type_montant_label: '',
    libelle: '',
    montant_debours: 0, montant_facture: 0,
    mode_paiement: '', mode_paiement_label: '',
    statut_paiement: '', statut_paiement_label: '',
  });

  const [factForm, setFactForm] = useState({
    dossier: '', dossier_label: '',
    type_facture: '', type_facture_label: '',
    emetteur: '',
    montant_ht: 0, tva: 18,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [monRes, facRes, bilRes, dosRes] = await Promise.all([
        api.get('/finance/montants/', { params: { date_debut: '2020-01-01', date_fin: today } }),
        api.get('/finance/factures/', { params: { date_debut: '2020-01-01', date_fin: today } }),
        api.get('/finance/montants/bilan/', { params: { periode } }),
        api.get('/dossiers/'),
      ]);
      setMontants(monRes.data.results || monRes.data);
      setFactures(facRes.data.results || facRes.data);
      setBilan(bilRes.data);
      setDossiers(dosRes.data.results || dosRes.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [periode]);

  const dossierOptions = dossiers.map(d => `${d.numero_dossier} — ${d.client_nom}`);

  const trouverDossier = (val) =>
    dossiers.find(d =>
      `${d.numero_dossier} — ${d.client_nom}`.toLowerCase().includes(val.toLowerCase())
    );

  const handleCreateMontant = async (e) => {
    e.preventDefault();
    if (!form.dossier) { toast.error('Veuillez sélectionner un dossier'); return; }
    try {
      await api.post('/finance/montants/', {
        dossier:         form.dossier,
        type_montant:    TYPES_MONTANT_MAP[form.type_montant_label] || 'autre',
        libelle:         form.libelle,
        montant_debours: parseFloat(form.montant_debours),
        montant_facture: parseFloat(form.montant_facture),
        mode_paiement:   MODES_PAIEMENT_MAP[form.mode_paiement_label] || 'especes',
        statut_paiement: STATUTS_PAIEMENT_MAP[form.statut_paiement_label] || 'paye',
      });
      toast.success('Montant enregistré !');
      setShowModal(false);
      setForm({ dossier: '', dossier_label: '', type_montant: '', type_montant_label: '', libelle: '', montant_debours: 0, montant_facture: 0, mode_paiement: '', mode_paiement_label: '', statut_paiement: '', statut_paiement_label: '' });
      fetchData();
    } catch { toast.error('Erreur lors de la création'); }
  };

  const handleCreateFacture = async (e) => {
    e.preventDefault();
    if (!factForm.dossier) { toast.error('Veuillez sélectionner un dossier'); return; }
    try {
      await api.post('/finance/factures/', {
        dossier:      factForm.dossier,
        type_facture: TYPES_FACTURE_MAP[factForm.type_facture_label] || 'emise',
        emetteur:     factForm.emetteur,
        montant_ht:   parseFloat(factForm.montant_ht),
        tva:          parseFloat(factForm.tva),
      });
      toast.success('Facture enregistrée !');
      setShowFactModal(false);
      setFactForm({ dossier: '', dossier_label: '', type_facture: '', type_facture_label: '', emetteur: '', montant_ht: 0, tva: 18 });
      fetchData();
    } catch { toast.error('Erreur lors de la création'); }
  };

  const handleMarquerPayee = async (id) => {
    try {
      await api.post(`/finance/factures/${id}/marquer_payee/`);
      toast.success('Facture marquée comme payée !');
      fetchData();
    } catch { toast.error('Erreur'); }
  };

  const montantTTC = parseFloat(factForm.montant_ht || 0) * (1 + parseFloat(factForm.tva || 0) / 100);

  return (
    <Layout title="Caisse & Comptabilité" subtitle="Gestion des montants et factures">
      <div className="flex flex-col gap-4">

        {/* Tableau de bord */}
        <TableauBordSection
          statuts={['transit', 'logistique_initial', 'passation', 'logistique_final', 'livraison']}
          titre="Finance"
        />

        {/* Bilan */}
        {bilan && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-800">Bilan financier</span>
              <div className="flex gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                {['mensuel', 'trimestriel', 'semestriel', 'annuel'].map((p) => (
                  <button key={p} onClick={() => setPeriode(p)}
                    className={`px-3 py-1 rounded-md text-[10px] font-medium capitalize ${
                      periode === p ? 'bg-[#1F3864] text-white' : 'text-gray-500'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Recettes',  value: bilan.total_factures, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Débours',   value: bilan.total_debours,  color: 'text-red-600',   bg: 'bg-red-50' },
                { label: 'Solde net', value: bilan.solde,          color: bilan.solde >= 0 ? 'text-green-700' : 'text-red-700', bg: 'bg-blue-50' },
                { label: 'Paiements', value: bilan.nb_paiements,   color: 'text-gray-700',  bg: 'bg-gray-50', isCount: true },
              ].map((b) => (
                <div key={b.label} className={`${b.bg} rounded-lg p-3 border border-gray-100`}>
                  <div className="text-[10px] text-gray-400 mb-1">{b.label}</div>
                  <div className={`text-lg font-medium ${b.color}`}>
                    {b.isCount ? b.value : `${parseFloat(b.value || 0).toLocaleString('fr-FR')} F`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
            <button onClick={() => setActiveTab('montants')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium ${
                activeTab === 'montants' ? 'bg-[#1F3864] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              Montants & Débours
            </button>
            <button onClick={() => setActiveTab('factures')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium ${
                activeTab === 'factures' ? 'bg-[#1F3864] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              Factures
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFactModal(true)}
              className="h-8 px-3 border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50">
              + Nouvelle facture
            </button>
            <button onClick={() => setShowModal(true)}
              className="h-8 px-4 bg-[#1F3864] text-white rounded-md text-xs font-medium hover:bg-[#2E5FA3]">
              + Nouveau montant
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : activeTab === 'montants' ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-800">Montants enregistrés</span>
              <span className="text-[10px] text-gray-400">{montants.length} montant(s)</span>
            </div>
            {montants.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucun montant enregistré</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Dossier</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Type</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Libellé</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Débours</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Facturé</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Total</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Mode</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {montants.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-blue-600">{m.dossier_numero}</td>
                      <td className="px-3 py-2 text-gray-500">{m.type_label}</td>
                      <td className="px-3 py-2 text-gray-700">{m.libelle}</td>
                      <td className="px-3 py-2 text-red-600 font-medium">{parseFloat(m.montant_debours).toLocaleString('fr-FR')} F</td>
                      <td className="px-3 py-2 text-green-600 font-medium">{parseFloat(m.montant_facture).toLocaleString('fr-FR')} F</td>
                      <td className="px-3 py-2 text-blue-700 font-medium">{parseFloat(m.montant_total).toLocaleString('fr-FR')} F</td>
                      <td className="px-3 py-2 text-gray-400">{m.mode_label}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          m.statut_paiement === 'paye'   ? 'bg-green-100 text-green-700' :
                          m.statut_paiement === 'annule' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{m.statut_label}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-400">{m.date_debut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-800">Factures</span>
              <span className="text-[10px] text-gray-400">{factures.length} facture(s)</span>
            </div>
            {factures.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucune facture</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">N° Facture</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Dossier</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Type</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">HT</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">TVA</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">TTC</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Statut</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-400 font-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {factures.map((f) => (
                    <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-blue-600">{f.numero_facture}</td>
                      <td className="px-3 py-2 text-gray-700">{f.dossier_numero}</td>
                      <td className="px-3 py-2 text-gray-500">{f.type_label}</td>
                      <td className="px-3 py-2">{parseFloat(f.montant_ht).toLocaleString('fr-FR')} F</td>
                      <td className="px-3 py-2 text-gray-400">{f.tva}%</td>
                      <td className="px-3 py-2 font-medium text-blue-700">{parseFloat(f.montant_ttc).toLocaleString('fr-FR')} F</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          f.statut === 'payee'   ? 'bg-green-100 text-green-700' :
                          f.statut === 'annulee' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{f.statut_label}</span>
                      </td>
                      <td className="px-3 py-2">
                        {f.statut === 'en_attente' && (
                          <button onClick={() => handleMarquerPayee(f.id)}
                            className="h-6 px-2 bg-green-50 text-green-700 rounded text-[10px] border border-green-200 hover:bg-green-100">
                            Marquer payée
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal montant */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[500px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Nouveau montant</span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateMontant} className="p-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">

                {/* Dossier */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Dossier *</label>
                  <ComboBox
                    value={form.dossier_label}
                    onChange={(val) => {
                      const found = trouverDossier(val);
                      setForm({ ...form, dossier: found ? String(found.id) : '', dossier_label: val });
                    }}
                    options={dossierOptions}
                    placeholder="Rechercher un dossier ou un client..."
                  />
                </div>

                {/* Type montant */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Type</label>
                  <ComboBox
                    value={form.type_montant_label}
                    onChange={(val) => setForm({ ...form, type_montant_label: val })}
                    options={TYPES_MONTANT}
                    placeholder="Banque, DFU, Douane..."
                  />
                </div>

                {/* Libellé */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Libellé *</label>
                  <input value={form.libelle} onChange={(e) => setForm({...form, libelle: e.target.value})}
                    placeholder="Description du paiement"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>

                {/* Montant débours */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Montant débours (FCFA)</label>
                  <input type="number" value={form.montant_debours}
                    onChange={(e) => setForm({...form, montant_debours: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>

                {/* Montant facturé */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Montant facturé (FCFA)</label>
                  <input type="number" value={form.montant_facture}
                    onChange={(e) => setForm({...form, montant_facture: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>

                {/* Mode paiement */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Mode paiement</label>
                  <ComboBox
                    value={form.mode_paiement_label}
                    onChange={(val) => setForm({ ...form, mode_paiement_label: val })}
                    options={MODES_PAIEMENT}
                    placeholder="Espèces, Virement..."
                  />
                </div>

                {/* Statut */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Statut</label>
                  <ComboBox
                    value={form.statut_paiement_label}
                    onChange={(val) => setForm({ ...form, statut_paiement_label: val })}
                    options={STATUTS_PAIEMENT}
                    placeholder="Payé, En attente..."
                  />
                </div>
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

      {/* Modal facture */}
      {showFactModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[460px] border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">Nouvelle facture</span>
              <button onClick={() => setShowFactModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateFacture} className="p-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">

                {/* Dossier */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Dossier *</label>
                  <ComboBox
                    value={factForm.dossier_label}
                    onChange={(val) => {
                      const found = trouverDossier(val);
                      setFactForm({ ...factForm, dossier: found ? String(found.id) : '', dossier_label: val });
                    }}
                    options={dossierOptions}
                    placeholder="Rechercher un dossier ou un client..."
                  />
                </div>

                {/* Type facture */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Type</label>
                  <ComboBox
                    value={factForm.type_facture_label}
                    onChange={(val) => setFactForm({ ...factForm, type_facture_label: val })}
                    options={TYPES_FACTURE}
                    placeholder="Émise ou Reçue..."
                  />
                </div>

                {/* Émetteur */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Émetteur</label>
                  <input value={factForm.emetteur} onChange={(e) => setFactForm({...factForm, emetteur: e.target.value})}
                    placeholder="Nom de l'émetteur"
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>

                {/* Montant HT */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Montant HT (FCFA)</label>
                  <input type="number" value={factForm.montant_ht}
                    onChange={(e) => setFactForm({...factForm, montant_ht: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>

                {/* TVA */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">TVA (%)</label>
                  <input type="number" value={factForm.tva}
                    onChange={(e) => setFactForm({...factForm, tva: e.target.value})}
                    className="h-9 border border-gray-200 rounded-md px-3 text-xs outline-none focus:border-blue-400"/>
                </div>

                {/* TTC calculé auto */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] font-medium text-gray-500 uppercase">Montant TTC (calculé auto)</label>
                  <div className="h-9 bg-blue-50 border border-blue-200 rounded-md px-3 flex items-center text-xs font-medium text-blue-700">
                    {montantTTC.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowFactModal(false)}
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