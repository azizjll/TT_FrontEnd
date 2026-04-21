// ================================================================
//  MODIFICATIONS à apporter dans espacesaisonnier.component.ts
//  pour ajouter :
//    1. Popup "candidature" automatique si non connecté
//    2. Popup "connexion requise" sur chaque section de la sidebar
// ================================================================

import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, Region } from 'src/app/services/auth.service';
import { Campagne, CampagneService } from 'src/app/services/campagne.service';
import { CandidatureService } from 'src/app/services/candidature.service';
import { DocumentCampagneDTO, DocumentCampagneService } from 'src/app/services/document-campagne.service';
import { StructureDTO, StructureService } from 'src/app/structure.service';
import Swal from 'sweetalert2';

// ── Interfaces (inchangées) ──────────────────────────────────
export interface Candidature {
  id: number;
  campagne: string;
  entreprise: string;
  localisation: string;
  datePostulation: string;
  dateDebut: string;
  dateFin: string;
  statut: 'ACCEPTEE' | 'EN_ATTENTE' | 'REFUSEE' | 'EN_COURS';
  poste: string;
  salaire?: string;
  logo?: string;
  message?: string;
}

export interface Document {
  id: number;
  nom: string;
  type: string;
  dateAjout: string;
  statut: 'VALIDE' | 'EN_ATTENTE' | 'EXPIRE';
  taille: string;
}

// ── Labels lisibles pour la modal "connexion requise" ────────
const SECTION_LABELS: Record<string, string> = {
  candidatures:  'Mes Candidatures',
  documents:     'Mes Documents',
  notifications: 'Mes Notifications',
  profil:        'Mon Profil',
};

@Component({
  selector: 'app-espacesaisonnier',
  templateUrl: './espacesaisonnier.component.html',
  styleUrls: ['./espacesaisonnier.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('420ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('listStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(80, animate('360ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))),
        ], { optional: true }),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('260ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('160ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class EspacesaisonnierComponent implements OnInit {

activeTab: 'candidatures' | 'documents' | 'profil' | 'notifications' | '' = '';
  filterStatut = 'TOUS';
  searchQuery = '';
  showDetailModal = false;
  selectedCandidature: Candidature | null = null;
  notificationCount = 3;
  saisonnier: any = {};
  campagneIdSelectionnee!: number;
  activeCampagne: Campagne | null = null;
  showCandidatureModal = false;
  campagnes: Campagne[] = [];
  regions: Region[] = [];
  structures: any[] = [];
  formSubmitted = false;

  documentsCampagne: DocumentCampagneDTO[] = [];
loadingDocsCampagne = false;

  form: any = {
    nom: '', prenom: '', cin: '', rib: '',
    telephone: '', email: '', regionId: '',
     moisTravail: '',
  };

  cinFile!: File;
  diplome!: File;
  contrat!: File;
  cinFileName = '';
  diplomeFileName = '';
  contratFileName = '';
  ribFile!: File;
ribFileName = '';

documents: any[] = [];
isLoadingDocuments = false;



isLoadingProfil = false;


  iltizamDoc: DocumentCampagneDTO | null = null;


  // ── ✅ NOUVEAU : modal "connexion requise" ────────────────
  showLoginRequired = false;
  lockedSectionLabel = '';

  // ── ✅ NOUVEAU : est-ce que l'utilisateur est connecté ? ──
  get isLoggedIn(): boolean {
    return !!this.authService.getToken();
  }

  // ─────────────────────────────────────────────────────────
  // Données mock (inchangées)
  // ─────────────────────────────────────────────────────────
  candidatures: Candidature[] = [
    {
      id: 1,
      campagne: 'Campagne de recrutement des saisonniers pour 2026',
      entreprise: 'Domaine Beaupré',
      localisation: "Provence-Alpes-Côte d'Azur",
      datePostulation: '10/03/2025',
      dateDebut: '15/06/2025',
      dateFin: '15/09/2025',
      statut: 'ACCEPTEE',
      poste: 'Cueilleur saisonnier',
      salaire: '1 500 € / mois',
      message: 'Bienvenue ! Votre dossier a été validé. Veuillez confirmer votre disponibilité.',
    },
    {
      id: 2,
      campagne: 'Campagne de recrutement des saisonniers pour 2026',
      entreprise: 'Château Montrachet',
      localisation: 'Bourgogne-Franche-Comté',
      datePostulation: '05/03/2025',
      dateDebut: '01/09/2025',
      dateFin: '30/10/2025',
      statut: 'EN_ATTENTE',
      poste: 'Vendangeur',
      salaire: '1 400 € / mois',
    },
    {
      id: 3,
      campagne: 'Campagne de recrutement des saisonniers pour 2026',
      entreprise: 'Coopérative Agri-Ouest',
      localisation: 'Bretagne',
      datePostulation: '12/01/2024',
      dateDebut: '01/04/2024',
      dateFin: '30/06/2024',
      statut: 'EN_COURS',
      poste: 'Agent maraîchage',
      salaire: '1 350 € / mois',
    },
    {
      id: 4,
      campagne: 'Campagne de recrutement des saisonniers pour 2026',
      entreprise: 'Les Vergers du Val',
      localisation: 'Normandie',
      datePostulation: '20/02/2025',
      dateDebut: '15/08/2025',
      dateFin: '15/11/2025',
      statut: 'REFUSEE',
      poste: 'Récolteur',
      message: 'Votre profil ne correspond pas aux critères requis pour cette campagne.',
    },
  ];

 

  notifications = [
    { id: 1, message: 'Votre candidature "Récolte Fraises 2025" a été acceptée !', date: 'Il y a 2h', lu: false, type: 'success' },
    { id: 2, message: 'Document "Attestation hébergement" en cours de vérification', date: 'Il y a 1 jour', lu: false, type: 'info' },
    { id: 3, message: 'Rappel : Confirmation requise avant le 20/03/2025', date: 'Il y a 2 jours', lu: false, type: 'warning' },
    { id: 4, message: 'Nouvelle campagne disponible dans votre région', date: 'Il y a 3 jours', lu: true, type: 'info' },
  ];

  constructor(
    private candidatureService: CandidatureService,
    private campagneService: CampagneService,
    private authService: AuthService,
    private structureService: StructureService,
    private router: Router,                      // ← ✅ NOUVEAU : injecter Router
    private documentCampagneService: DocumentCampagneService,
  ) {}

  ngOnInit(): void {
  if (!this.isLoggedIn) {
    this.showCandidatureModal = true;
  } else {
    this.activeTab = 'candidatures'; // ← ICI
    this.loadSaisonnierProfile();
    this.loadMesCandidatures(); 
    this.loadMesDocuments();
    this.loadMonProfil();
  }

  this.campagneService.getCampagnesActives().subscribe(data => {
    if (data && data.length > 0) {
      this.activeCampagne = data[0];
      this.campagneIdSelectionnee = data[0].id;
      this.loadStructuresCampagneActive();
      this.loadDocumentsCampagne(data[0].id)
    }
  });

  this.loadRegions();
}

// ── Nouvelle méthode ────────────────────────────────────────
loadMesDocuments(): void {
  this.isLoadingDocuments = true;
  this.candidatureService.getDocumentsByToken().subscribe({
    next: (data) => {
      this.documents = data.map(doc => ({
        id:       doc.id,
        nom:      doc.nomFichier,
        type:     doc.type,         // CIN, DIPLOME, CONTRAT, RIB
        url:      doc.url,
        dateAjout: doc.dateDepot ?? '—',
        statut:   'VALIDE',
        taille:   '—'
      }));
      this.isLoadingDocuments = false;
    },
    error: (err) => {
      console.error('Erreur chargement documents:', err);
      this.isLoadingDocuments = false;
    }
  });
}



loadDocumentsCampagne(campagneId: number): void {
  this.loadingDocsCampagne = true;
  this.documentCampagneService.getDocumentsByCampagne(campagneId).subscribe({
    next: (data) => {
      this.documentsCampagne = data;
      this.loadingDocsCampagne = false;

      // ✅ Extraire le doc إلتزام pour la sidebar
      this.iltizamDoc = data.find(d => 
        d.type === 'إلتزام' || d.nom.includes('إلتزام')
      ) ?? null;
    },
    error: (err) => {
      console.error('Erreur docs campagne:', err);
      this.loadingDocsCampagne = false;
    }
  });
}

// Méthode à ajouter
telechargerIltizam(): void {
  if (this.iltizamDoc) {
    window.open(this.iltizamDoc.url, '_blank');
  }
}

telechargerDocument(doc: DocumentCampagneDTO): void {
  window.open(doc.url, '_blank');
}

getDocTypIcon(type: string): string {
  const icons: Record<string, string> = {
    'CONTRAT':     'M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    'NOTICE':      'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
    'FORMULAIRE':  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2',
  };
  return icons[type] ?? 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6';
}

  // ─────────────────────────────────────────────────────────
  // ✅ NOUVEAU : Charger le profil depuis le token JWT
  // ─────────────────────────────────────────────────────────
 loadSaisonnierProfile(): void {
  // Garde juste les initiales depuis le token en attendant l'API
  const nomComplet = this.authService.getNomComplet().split(' ');
  this.saisonnier = {
    prenom: nomComplet[0] || '',
    nom: nomComplet.slice(1).join(' ') || '',
  };
}
// ── Nouvelle méthode ─────────────────────────────────────────
loadMonProfil(): void {
  this.isLoadingProfil = true;
  this.candidatureService.getMonProfil().subscribe({
    next: (data) => {
      this.saisonnier = {
        ...data,
        // helpers d'affichage
        nomComplet:  `${data.prenom} ${data.nom}`,
        regionNom:   data.region?.nom ?? '—',
      };
      this.isLoadingProfil = false;
    },
    error: (err) => {
      console.error('Erreur chargement profil:', err);
      this.isLoadingProfil = false;
    }
  });
}

  // ─────────────────────────────────────────────────────────
  // ✅ NOUVEAU : setTab avec guard d'authentification
  // ─────────────────────────────────────────────────────────
  setTab(tab: 'candidatures' | 'documents' | 'profil' | 'notifications'): void {
    if (!this.isLoggedIn) {
      this.lockedSectionLabel = SECTION_LABELS[tab] || tab;
      this.showLoginRequired = true;
      return;
    }
    this.activeTab = tab;
  }

  // ─────────────────────────────────────────────────────────
  // ✅ NOUVEAU : actions modal "connexion requise"
  // ─────────────────────────────────────────────────────────
  closeLoginRequired(): void {
    this.showLoginRequired = false;
  }

  goToLogin(): void {
    this.closeLoginRequired();
    this.router.navigate(['/saisonnier/login']);
  }

  // ─────────────────────────────────────────────────────────
  // Structures / Régions (inchangé)
  // ─────────────────────────────────────────────────────────
  loadStructuresCampagneActive(): void {
    this.structureService.getStructuresCampagneActivePublique().subscribe({
      next: (data) => { this.structures = data; },
      error: (err) => console.error('Erreur structures:', err),
    });
  }

  loadStructuresByRegion(regionId: number): void {
    this.structureService.getStructuresCampagneActivePublique().subscribe({
      next: (data) => {
        this.structures = data.filter(s =>
          s.region === this.regions.find(r => r.id == regionId)?.nom
        );
      },
      error: (err) => console.error('Erreur:', err),
    });
  }

  loadCampagnes(): void {
    this.campagneService.getToutesCampagnes().subscribe({
      next: (data) => this.campagnes = data,
      error: (err) => console.error('Erreur campagnes', err),
    });
  }

  loadRegions(): void {
    this.authService.getRegions().subscribe({
      next: (data) => { this.regions = data; },
      error: (err) => console.error('Erreur régions', err),
    });
  }

  // ─────────────────────────────────────────────────────────
  // Candidature
  // ─────────────────────────────────────────────────────────
  deposerCandidature(campagneId: number): void {
    this.campagneIdSelectionnee = campagneId;
    this.showCandidatureModal = true;
  }

  // ─────────────────────────────────────────────────────────
  // Getters (inchangés)
  // ─────────────────────────────────────────────────────────
  get filteredCandidatures(): Candidature[] {
    return this.candidatures.filter(c => {
      const matchStatut = this.filterStatut === 'TOUS' || c.statut === this.filterStatut;
      const matchSearch = !this.searchQuery ||
        c.campagne.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.entreprise.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchStatut && matchSearch;
    });
  }

  get statsData() {
    return {
      total:     this.candidatures.length,
      acceptees: this.candidatures.filter(c => c.statut === 'ACCEPTEE').length,
      enAttente: this.candidatures.filter(c => c.statut === 'EN_ATTENTE').length,
      enCours:   this.candidatures.filter(c => c.statut === 'EN_COURS').length,
      refusees:  this.candidatures.filter(c => c.statut === 'REFUSEE').length,
    };
  }

  get structuresEC(): StructureDTO[] {
    return this.structures.filter(s => s.type === 'ESPACE_COMMERCIAL');
  }

  get structuresCT(): StructureDTO[] {
    return this.structures.filter(s => s.type === 'CENTRE_TECHNOLOGIQUE');
  }

  get toutesCompletes(): boolean {
    return this.structures.length > 0 && this.structures.every(s => !s.disponible);
  }

  // ─────────────────────────────────────────────────────────
  // Helpers (inchangés)
  // ─────────────────────────────────────────────────────────
  setFilter(statut: string): void { this.filterStatut = statut; }

  openDetail(candidature: Candidature): void {
    this.selectedCandidature = candidature;
    this.showDetailModal = true;
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.selectedCandidature = null;
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      ACCEPTEE: 'Acceptée',
      EN_ATTENTE: 'En attente',
      REFUSEE: 'Refusée',
      EN_COURS: 'En cours',
    };
    return labels[statut] || statut;
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      ACCEPTEE: 'statut-acceptee',
      EN_ATTENTE: 'statut-attente',
      REFUSEE: 'statut-refusee',
      EN_COURS: 'statut-encours',
    };
    return classes[statut] || '';
  }

  getDocStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      VALIDE: 'doc-valide',
      EN_ATTENTE: 'doc-attente',
      EXPIRE: 'doc-expire',
    };
    return classes[statut] || '';
  }

  markAllRead(): void {
    this.notifications.forEach(n => (n.lu = true));
    this.notificationCount = 0;
  }

  getInitials(): string {
  const p = this.saisonnier?.prenom ?? '';
  const n = this.saisonnier?.nom ?? '';
  if (!p && !n) return '?';
  return `${p[0] ?? ''}${n[0] ?? ''}`.toUpperCase();
}

  closeModal(): void {
    this.showCandidatureModal = false;
  }

  onFileChange(event: any, type: string): void {
    const file = event.target.files[0];
    if (!file) return;
    if (type === 'cin')     { this.cinFile = file;    this.cinFileName = file.name; }
    if (type === 'diplome') { this.diplome = file;    this.diplomeFileName = file.name; }
    if (type === 'contrat') { this.contrat = file;    this.contratFileName = file.name; }
    if (type === 'rib') { this.ribFile = file; this.ribFileName = file.name; }

  }

  submitCandidature(candidatureForm: NgForm): void {
  this.formSubmitted = true;
  candidatureForm.form.markAllAsTouched();

  if (candidatureForm.invalid) {
    Swal.fire({
      icon: 'warning',
      title: 'Formulaire incomplet',
      text: 'Veuillez corriger les erreurs.'
    });
    return;
  }

  if (!this.cinFile || !this.diplome || !this.contrat || !this.ribFile) {
    Swal.fire({
      icon: 'warning',
      title: 'Documents manquants',
      text: 'Joignez tous les fichiers PDF (CIN, Diplôme, Contrat, RIB).'
    });
    return;
  }

  const formData = new FormData();
  Object.entries(this.form).forEach(([k, v]) => formData.append(k, v as string));
  formData.append('campagneId', this.campagneIdSelectionnee.toString());
  formData.append('cinFile', this.cinFile);
  formData.append('diplome', this.diplome);
  formData.append('contrat', this.contrat);
  formData.append('ribFile', this.ribFile);


  Swal.fire({
    title: 'Envoi en cours...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  this.candidatureService.deposerCandidature(formData).subscribe({

    next: (res) => {
      Swal.fire({
        icon: 'success',
        title: '✅ Candidature envoyée !',
        html: res.message,
        confirmButtonText: 'Compris !',
        confirmButtonColor: '#3b82f6',
      });
      this.closeModal();
    },

    error: (err) => {
      console.error(err);

      let message = "Erreur lors de l'envoi.";

      // 🔥 CAS 1 : message backend
      if (err.error && err.error.message) {
        message = err.error.message;
      }

      // 🔥 CAS 2 : 403
      else if (err.status === 403) {
        message = "Accès refusé (403)";
      }

      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: message
      });
    }
  });
}

  loadMesCandidatures(): void {
  this.candidatureService.getMonHistorique().subscribe({
    next: (data) => {
      this.candidatures = data.map(c => ({
        id:              c.id,
        campagne:        c.campagne?.libelle ?? 'Campagne inconnue',
        entreprise:      c.campagne?.libelle ?? '—',
        localisation:    c.saisonnier?.region?.nom ?? '—',
        datePostulation: c.dateDepot,
        dateDebut:       c.campagne?.dateDebut ?? '—',
        dateFin:         c.campagne?.dateFin ?? '—',
        statut:          c.statut,
        poste:           c.saisonnier?.diplome ?? '—',
        message:         c.commentaire ?? undefined,
      }));
    },
    error: (err) => console.error('Erreur historique:', err)
  });
}

// ── Helper pour icône selon type de document ────────────────
getDocIcon(type: string): string {
  const icons: Record<string, string> = {
    'CIN':     'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1',
    'DIPLOME': 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    'CONTRAT': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    'RIB':     'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  };
  return icons[type] ?? 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6';
}

// ── Téléchargement direct ────────────────────────────────────
telechargerDoc(url: string, nom: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.download = nom;
  a.click();
}
}