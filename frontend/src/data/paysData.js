// Liste des pays avec code ISO et indicatif téléphonique
export const PAYS_DATA = [
  { nom: 'Togo',                 iso: 'TG', indicatif: '+228' },
  { nom: 'Bénin',                iso: 'BJ', indicatif: '+229' },
  { nom: 'Burkina Faso',         iso: 'BF', indicatif: '+226' },
  { nom: "Côte d'Ivoire",        iso: 'CI', indicatif: '+225' },
  { nom: 'Ghana',                iso: 'GH', indicatif: '+233' },
  { nom: 'Mali',                 iso: 'ML', indicatif: '+223' },
  { nom: 'Niger',                iso: 'NE', indicatif: '+227' },
  { nom: 'Nigeria',              iso: 'NG', indicatif: '+234' },
  { nom: 'Sénégal',              iso: 'SN', indicatif: '+221' },
  { nom: 'Guinée',               iso: 'GN', indicatif: '+224' },
  { nom: 'Guinée-Bissau',        iso: 'GW', indicatif: '+245' },
  { nom: 'Liberia',              iso: 'LR', indicatif: '+231' },
  { nom: 'Sierra Leone',         iso: 'SL', indicatif: '+232' },
  { nom: 'Gambie',               iso: 'GM', indicatif: '+220' },
  { nom: 'Mauritanie',           iso: 'MR', indicatif: '+222' },
  { nom: 'Cap-Vert',             iso: 'CV', indicatif: '+238' },
  { nom: 'Cameroun',             iso: 'CM', indicatif: '+237' },
  { nom: 'Gabon',                iso: 'GA', indicatif: '+241' },
  { nom: 'Congo',                iso: 'CG', indicatif: '+242' },
  { nom: 'RD Congo',             iso: 'CD', indicatif: '+243' },
  { nom: 'Tchad',                iso: 'TD', indicatif: '+235' },
  { nom: 'Centrafrique',         iso: 'CF', indicatif: '+236' },
  { nom: 'Afrique du Sud',       iso: 'ZA', indicatif: '+27'  },
  { nom: 'Maroc',                iso: 'MA', indicatif: '+212' },
  { nom: 'Algérie',              iso: 'DZ', indicatif: '+213' },
  { nom: 'Tunisie',              iso: 'TN', indicatif: '+216' },
  { nom: 'Égypte',               iso: 'EG', indicatif: '+20'  },
  { nom: 'Kenya',                iso: 'KE', indicatif: '+254' },
  { nom: 'Éthiopie',             iso: 'ET', indicatif: '+251' },
  { nom: 'France',               iso: 'FR', indicatif: '+33'  },
  { nom: 'Belgique',             iso: 'BE', indicatif: '+32'  },
  { nom: 'Allemagne',            iso: 'DE', indicatif: '+49'  },
  { nom: 'Espagne',              iso: 'ES', indicatif: '+34'  },
  { nom: 'Italie',               iso: 'IT', indicatif: '+39'  },
  { nom: 'Royaume-Uni',          iso: 'GB', indicatif: '+44'  },
  { nom: 'Pays-Bas',             iso: 'NL', indicatif: '+31'  },
  { nom: 'États-Unis',           iso: 'US', indicatif: '+1'   },
  { nom: 'Canada',               iso: 'CA', indicatif: '+1'   },
  { nom: 'Chine',                iso: 'CN', indicatif: '+86'  },
  { nom: 'Inde',                 iso: 'IN', indicatif: '+91'  },
  { nom: 'Émirats Arabes Unis',  iso: 'AE', indicatif: '+971' },
  { nom: 'Turquie',              iso: 'TR', indicatif: '+90'  },
  { nom: 'Liban',                iso: 'LB', indicatif: '+961' },
  { nom: 'Autre',                iso: '—',  indicatif: ''     },
];

// Fonction utilitaire : trouver un pays par son nom
export const getPaysParNom = (nom) =>
  PAYS_DATA.find(p => p.nom === nom);

// Liste simple des noms (pour les <select>)
export const NOMS_PAYS = PAYS_DATA.map(p => p.nom);