import { Component, OnInit, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService, Region } from 'src/app/services/auth.service';
import { CampagneService, CampagneRequestDTO } from 'src/app/services/campagne.service';
import { CandidatureService } from 'src/app/services/candidature.service';
import { DocumentService } from 'src/app/services/document.service';
import { StructureDTO, StructureImportService } from 'src/app/services/structure-import.service';
import { StructureService } from 'src/app/structure.service';

// ─── Interfaces ───────────────────────────────────────────────────

interface RegionAPI {
  id: number;
  nom: string;
}

interface Saisonnier {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  cin: number;
  telephone: string;
  rib: string;
  region: RegionAPI;
}

interface CampagneAPI {
  id: number;
  libelle: string;
  code: string;
  dateDebut: string;
  dateFin: string;
}

interface DocumentAPI {
  id: number;
  type: string;
  url: string;
  nomFichier: string;
}

interface Candidature {
  id: number;
  dateDepot: string;
  statut: string;
  commentaire: string | null;
  saisonnier: Saisonnier;
  campagne: CampagneAPI;
  documents: DocumentAPI[];
}

interface Campagne {
  id: number;
  nom: string;
  code: string;
  dateDebut: string;
  dateFin: string;
  statut: 'active' | 'termine' | 'brouillon' | 'planifie'|'cloturee';
  statutLabel: string;
  candidatures: number;
  affectations: number;
  verrouille: boolean;
  description?: string;
  budget?: string;
  regionIds?: number[];
}

interface Utilisateur {
  id: number;
  nom: string;
  initiales: string;
  email: string;
  role: string;
  roleClass: 'dg' | 'admin' | 'evaluateur' | 'candidat';
  departement: string;
  derniereConnexion: string;
  statut: 'active' | 'inactive';
  statutLabel: string;
}

interface Structure {
  id: number;
  nom: string;
  type: 'EC' | 'CT';
  region: string;
  adresse: string;
  autorises: number;
  recrutes: number;
  isFirstInGov?: boolean;
}

interface Gouvernorat {
  nom: string;
  count: number;
}

interface MemoDocument {
  fileName: string;
  year: number;
  statut: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  hasFile: boolean;
  fileUrl?: SafeResourceUrl;
  rawUrl?: string;
}

interface StructuresStats {
  gouvernorats: number;
  total: number;
  espacesCommerciaux: number;
  centresTechnologiques: number;
  saisonnersAutorises: number;
  saisonnersRecrutes: number;
}

// ─── Nouvelles interfaces Présence & Paiement ─────────────────────

export interface PresenceRow {
  id: number;
  nom: string;
  cin: string;
  dateMbacharaa: string;
  dureeContrat: number;
  absences: number;
  montantNet: number;
  rib: string;
  statut: 'paye' | 'impaye';
  campagneId?: number;
}

interface PresenceConfig {
  tauxJournalier: number;
  dureeContrat: number;
  datePriseFonction: string;
  campagneId: number | null;
}

interface PresenceTotals {
  totalJours: number;
  totalAbsences: number;
  totalMontant: number;
}

// ─── Component ────────────────────────────────────────────────────

@Component({
  selector: 'app-home-admin',
  templateUrl: './home-admin.component.html',
  styleUrls: ['./home-admin.component.scss']
})
export class HomeAdminComponent implements OnInit {

  // ── Navigation ──────────────────────────────────────────────────
  activeSection: 'campagnes' | 'candidatures' | 'utilisateurs' | 'memo' | 'structures' | 'presence' = 'campagnes';
  searchQuery = '';
  pageTitle = 'Pilotage des Campagnes';
  pageSubtitle = 'Gérez et suivez toutes vos campagnes de recrutement';

      // ── Modal Voir Campagne ──────────────────────────────────────────
    showViewModal = false;
    viewingCampagne: Campagne | null = null;

    // ── Modal Modifier Campagne ──────────────────────────────────────
    showEditModal = false;
    editingCampagne: Campagne | null = null;

  // ── Modal flags ──────────────────────────────────────────────────
  showCreateModal = false;
  showMemoUploadModal = false;
  showStructureUploadModal = false;
  showEditStructureModal = false;
  showAbsenceModal = false;

  // ── Global Stats ─────────────────────────────────────────────────
  stats = {
    campagnesActives: 4,
    campagnesTotal: 12,
    affectationsVerrouillees: 87,
    joursRestants: 18,
    totalCandidatures: 342,
    candidaturesAcceptees: 128,
    candidaturesEnAttente: 156,
    candidaturesRefusees: 58
  };

  // ── Campagnes ─────────────────────────────────────────────────────
  regions: Region[] = [];
  campagnes: Campagne[] = [];
  newCampagne: Campagne = this.emptyNewCampagne();
  newCampagneAnnee: number = new Date().getFullYear(); // ← ajoute cette ligne
  showActiveCampagneWarning = false;
  activeCampagneNom = '';

  // ── Nouvelles propriétés pour l'upload Excel campagne ─────────────
campagneExcelFile: File | null = null;
campagneExcelDragOver = false;
regionsDetectees: string[] = [];
isSavingCampagne = false;
isLoading = false;

  // ── Candidatures ──────────────────────────────────────────────────
  candidatures: Candidature[] = [];

  // ── Utilisateurs ──────────────────────────────────────────────────
  utilisateurs: Utilisateur[] = [];

  // ── Memo Intidab ──────────────────────────────────────────────────
  memoDocument: MemoDocument = {
    fileName: 'مذكرة_إنتداب_موسمي_2025.pdf',
    year: 2025,
    statut: 'actif',
    currentPage: 1,
    totalPages: 3,
    zoom: 67,
    hasFile: false
  };

  memoSelectedFile: File | null = null;
  memoDragOver = false;
  isLoadingPdf = true;
  isUploading = false;
  uploadSuccess = false;
  uploadError = '';

  // ── Structures par Région ─────────────────────────────────────────
  structuresStats: StructuresStats = {
    gouvernorats: 17,
    total: 87,
    espacesCommerciaux: 54,
    centresTechnologiques: 33,
    saisonnersAutorises: 0,
    saisonnersRecrutes: 0
  };

  structures: Structure[] = [];
  filteredStructures: Structure[] = [];
  structureTypeFilter = 'tous';
  selectedGouvernorat = '';
  gouvernorats: Gouvernorat[] = [];

  structureSelectedFile: File | null = null;
  structureDragOver = false;
  editingStructure: Structure | null = null;

  // ── Présence & Paiement ───────────────────────────────────────────
  presenceRows: PresenceRow[] = [];
  filteredPresenceRows: PresenceRow[] = [];
  presenceFilter: 'tous' | 'payes' | 'impayes' = 'tous';
  presenceSearchQuery = '';
  editingPresenceRow: PresenceRow | null = null;

  presenceConfig: PresenceConfig = {
    tauxJournalier: 8,
    dureeContrat: 30,
    datePriseFonction: '2025-07-01',
    campagneId: null
  };

  presenceStats = {
    totalSaisonniers: 0,
    masseSalariale: 0,
    joursAbsence: 0,
    tauxJournalier: 8
  };

  presenceTotals: PresenceTotals = {
    totalJours: 0,
    totalAbsences: 0,
    totalMontant: 0
  };

  // ─── Constructor ──────────────────────────────────────────────────

  constructor(
    private campagneService: CampagneService,
    private authService: AuthService,
    private candidatureService: CandidatureService,
    private sanitizer: DomSanitizer,
    private documentService: DocumentService,
    private structureimportService: StructureImportService,
    private structureService: StructureService,
    private router: Router,
  ) {}

  nomUtilisateur = '';
roleUtilisateur = '';

  // ─── Lifecycle ────────────────────────────────────────────────────

  ngOnInit(): void {
    this.updatePageMeta();
    this.loadRegions();
    this.loadCampagnes();
    this.loadCandidatures();
    this.buildGouvernorats();
    this.applyStructureFilter();
    this.loadCirculaireFromServer();
    this.loadStructures();
    this.loadPresenceRows();
    this.nomUtilisateur = this.authService.getNomComplet();
  this.roleUtilisateur = this.authService.getRole();
  }

  // ─── Navigation ───────────────────────────────────────────────────

  setActive(section: 'campagnes' | 'candidatures' | 'utilisateurs' | 'memo' | 'structures' | 'presence'): void {
  this.activeSection = section;

  if (section === 'campagnes' || section === 'memo' || section === 'structures') {
    this.campagnesOpen = true;
  }

  this.updatePageMeta();

  // 🔄 Rafraîchir les données selon la section
  switch (section) {
    case 'campagnes':
      this.loadCampagnes();
      this.loadCandidatures();
      break;

    case 'candidatures':
      this.loadCandidatures();
      break;

    case 'utilisateurs':
      // this.loadUtilisateurs(); // ← à connecter quand tu as le service
      break;

    case 'memo':
      this.loadCirculaireFromServer();
      break;

    case 'structures':
      this.loadStructures();
      break;

    case 'presence':
      this.loadPresenceRows();
      break;
  }
}

  private updatePageMeta(): void {
    const meta: Record<string, { title: string; subtitle: string }> = {
      campagnes: {
        title: 'Pilotage des Campagnes',
        subtitle: 'Créez, activez et gérez vos campagnes de recrutement'
      },
      candidatures: {
        title: 'Liste des Candidatures',
        subtitle: 'Consultez et suivez toutes les candidatures déposées'
      },
      utilisateurs: {
        title: 'Gestion des Utilisateurs',
        subtitle: 'Consultez la liste complète des utilisateurs du système'
      },
      memo: {
        title: 'مذكرة الإنتداب 2025',
        subtitle: 'Mذكرة حول انتداب أعوان متعاقدين لعمل موسمي'
      },
      structures: {
        title: 'Structures par Région',
        subtitle: '17 gouvernorats — 87 structures — Campagne 2025'
      },
      presence: {
        title: 'Présence & Paiement',
        subtitle: 'Suivi des absences et calcul automatique des salaires — Campagne 2025'
      }
    };
    this.pageTitle = meta[this.activeSection].title;
    this.pageSubtitle = meta[this.activeSection].subtitle;
  }

  // ─── Campagnes ────────────────────────────────────────────────────

  loadRegions(): void {
    this.authService.getRegions().subscribe({
      next: data => this.regions = data,
      error: err => console.error('Erreur chargement régions', err)
    });
  }

  onRegionChange(): void {
    if (this.newCampagne.regionIds?.includes(0)) {
      this.newCampagne.regionIds = this.regions.map(r => r.id);
    }
  }

loadCampagnes(): void {
  this.campagneService.getMesCampagnes().subscribe({   // ← changement ici
    next: (data) => {
      this.campagnes = (data as any[]).map(c => {

        const statutMap: Record<string, { statut: Campagne['statut'], label: string }> = {
          'BROUILLON': { statut: 'brouillon', label: 'Brouillon' },
          'ACTIVE':    { statut: 'active',    label: 'Active'    },
          'CLOTUREE':  { statut: 'termine',   label: 'Clôturée'  },
        };

        const statutKey = (c.statut || 'BROUILLON').toUpperCase();
        const statutInfo = statutMap[statutKey] ?? { statut: 'brouillon', label: 'Brouillon' };

        return {
          id: c.id,
          nom: c.libelle,
          code: c.code,
          dateDebut: c.dateDebut,
          dateFin: c.dateFin,
          statut: statutInfo.statut,
          statutLabel: statutInfo.label,
          candidatures: c.candidatures || 0,
          affectations: c.affectations || 0,
          verrouille: c.verrouille || false,
          description: c.description || '',
          budget: c.budget || '',
          regionIds: c.regionIds || []
        };
      });

      if (this.campagnes.length > 0 && !this.presenceConfig.campagneId) {
        this.presenceConfig.campagneId = this.campagnes[0].id;
      }

      this.updateCandidaturesParCampagne();
    },
    error: err => console.error('Erreur chargement campagnes', err)
  });
}

voirCandidaturesCampagne(campagne: Campagne): void {
  if (campagne.candidatures === 0) return;
  // Navigate vers la section candidatures filtrée par campagne
  this.setActive('candidatures');
  // Optionnel : filtrer automatiquement par campagne
  this.searchQuery = campagne.nom;
}

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newCampagne = this.emptyNewCampagne();
    this.campagneExcelFile = null;
  this.regionsDetectees = [];
  this.isSavingCampagne = false;
  }

  closeModal(): void {
    this.showCreateModal = false;
     this.campagneExcelFile = null;
  this.regionsDetectees = [];
  this.isSavingCampagne = false;
  }

saveCampagne(activer: boolean): void {
  if (!this.newCampagne.nom || !this.newCampagne.dateDebut || !this.newCampagne.dateFin) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }

  if (!this.campagneExcelFile) {
    alert('Veuillez sélectionner le fichier Excel des structures');
    return;
  }

  // Vérification : une seule campagne ACTIVE à la fois
  if (activer) {
    const campagneActiveExistante = this.campagnes.find(c => c.statut === 'active');
    if (campagneActiveExistante) {
      this.showActiveCampagneWarning = true;
      this.activeCampagneNom = campagneActiveExistante.nom;
      return;
    }
  }

  this.isSavingCampagne = true;

  const dto: CampagneRequestDTO = {
    libelle: this.newCampagne.nom,
    code: this.newCampagne.code || `CAM-${Date.now()}`,
    dateDebut: this.newCampagne.dateDebut,
    dateFin: this.newCampagne.dateFin,
    description: this.newCampagne.description,
    regionIds: [] // sera rempli automatiquement depuis l'Excel par le backend
  };

  this.campagneService.creerCampagneAvecExcel(dto, this.campagneExcelFile).subscribe({
    next: (res) => {
      if (activer) {
        this.campagneService.activerCampagne(res.id).subscribe({
          next: () => {
            this.loadCampagnes();
            this.closeModal();
            this.isSavingCampagne = false;
          },
          error: () => {
            this.loadCampagnes();
            this.closeModal();
            this.isSavingCampagne = false;
          }
        });
      } else {
        this.loadCampagnes();
        this.closeModal();
        this.isSavingCampagne = false;
      }
    },
    error: (err) => {
      console.error(err);
      alert('Erreur lors de la création de la campagne');
      this.isSavingCampagne = false;
    }
  });
}

cloturerEtActiver(): void {
  // Clôturer toutes les campagnes actives
  const actives = this.campagnes.filter(c => c.statut === 'active');
  
  actives.forEach(camp => {
    this.campagneService.cloturerCampagne(camp.id).subscribe({
      next: () => {
        camp.statut = 'termine';
        camp.statutLabel = 'Clôturée';
        this.stats.campagnesActives--;
      },
      error: err => console.error(err)
    });
  });

  this.showActiveCampagneWarning = false;
  // Relancer la création avec activation
  setTimeout(() => this.saveCampagne(true), 500);
}

fermerWarning(): void {
  this.showActiveCampagneWarning = false;
}

  activerCampagne(): void {
    const brouillon = this.campagnes.find(c => c.statut === 'brouillon' || c.statut === 'planifie');
    if (brouillon) {
      brouillon.statut = 'active';
      brouillon.statutLabel = 'Active';
      this.stats.campagnesActives++;
    }
  }

  toggleVerrouillage(campagne: Campagne): void {
    campagne.verrouille = !campagne.verrouille;
    if (campagne.verrouille) {
      this.stats.affectationsVerrouillees += campagne.affectations;
    } else {
      this.stats.affectationsVerrouillees -= campagne.affectations;
    }
  }

  private emptyNewCampagne(): Campagne {
    const annee = new Date().getFullYear();
    return {
      id: 0, 
      nom: `Campagne de recrutement des saisonniers pour ${annee}`,
      code: '', dateDebut: '', dateFin: '',
      statut: 'brouillon', statutLabel: 'Brouillon',
      candidatures: 0, affectations: 0, verrouille: false,
      description: '', budget: '', regionIds: []
    };
  }

  onAnneeChange(): void {
  this.newCampagne.nom = `Campagne de recrutement des saisonniers pour ${this.newCampagneAnnee}`;
}
  // ─── Candidatures ─────────────────────────────────────────────────

loadCandidatures(): void {
  this.candidatureService.getAllCandidatures().subscribe({
    next: data => {
      this.candidatures = data;
      this.updateCandidaturesParCampagne(); // ← ajoute ceci
    },
    error: err => console.error('Erreur chargement candidatures', err)
  });
}

private updateCandidaturesParCampagne(): void {
  // Compter les candidatures par campagne id
  const compteur: Record<number, number> = {};
  this.candidatures.forEach(c => {
    const id = c.campagne.id;
    compteur[id] = (compteur[id] || 0) + 1;
  });

  // Mettre à jour chaque campagne avec son vrai nombre
  this.campagnes = this.campagnes.map(camp => ({
    ...camp,
    candidatures: compteur[camp.id] || 0
  }));

  // Mettre à jour le total dans les stats
  this.stats.totalCandidatures = this.candidatures.length;
}

  // ─── Memo Intidab ─────────────────────────────────────────────────

  loadCirculaireFromServer(): void {
    this.isLoadingPdf = true;
    this.documentService.getDocumentByType('CIRCULAIRE_2025').subscribe({
      next: (doc) => {
        if (doc?.url) {
          this.memoDocument.rawUrl = doc.url;
          this.memoDocument.fileName = doc.url.split('/').pop() || 'مذكرة_إنتداب_موسمي_2025.pdf';
          this.memoDocument.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(doc.url);
          this.memoDocument.hasFile = true;
        } else {
          this.memoDocument.hasFile = false;
        }
        this.isLoadingPdf = false;
      },
      error: () => {
        this.memoDocument.hasFile = false;
        this.isLoadingPdf = false;
      }
    });
  }

  private handlePdfUpload(file: File): void {
    const localUrl = URL.createObjectURL(file);
    this.memoDocument.rawUrl = localUrl;
    this.memoDocument.fileName = file.name;
    this.memoDocument.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(localUrl);
    this.memoDocument.hasFile = true;

    this.isUploading = true;
    this.uploadSuccess = false;
    this.uploadError = '';

    this.documentService.uploadDocument(file, 'CIRCULAIRE_2025').subscribe({
      next: (res) => {
        this.memoDocument.rawUrl = res.url;
        this.memoDocument.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(res.url);
        this.isUploading = false;
        this.uploadSuccess = true;
        setTimeout(() => this.uploadSuccess = false, 4000);
      },
      error: (err) => {
        console.error('Erreur upload PDF :', err);
        this.uploadError = "Erreur upload. L'aperçu local reste disponible.";
        this.isUploading = false;
      }
    });
  }

  openMemoUploadModal(): void {
    this.memoSelectedFile = null;
    this.showMemoUploadModal = true;
  }

  closeMemoModal(): void {
    this.showMemoUploadModal = false;
    this.memoSelectedFile = null;
  }

  onMemoFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file?.type === 'application/pdf') {
      this.memoSelectedFile = file;
      this.handlePdfUpload(file);
      this.closeMemoModal();
    }
  }

  onMemoDrop(event: DragEvent): void {
    event.preventDefault();
    this.memoDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file?.type === 'application/pdf') {
      this.handlePdfUpload(file);
      this.closeMemoModal();
    } else {
      alert('Veuillez déposer un fichier PDF.');
    }
  }

  saveMemoDocument(): void {
    if (!this.memoSelectedFile) return;
    this.handlePdfUpload(this.memoSelectedFile);
    this.closeMemoModal();
  }

  downloadMemo(): void {
    if (this.memoDocument.rawUrl) {
      const a = document.createElement('a');
      a.href = this.memoDocument.rawUrl;
      a.download = this.memoDocument.fileName;
      a.click();
    } else {
      alert('Aucun document disponible.');
    }
  }

  zoomIn(): void {
    if (this.memoDocument.zoom < 200) this.memoDocument.zoom += 10;
  }

  zoomOut(): void {
    if (this.memoDocument.zoom > 30) this.memoDocument.zoom -= 10;
  }

  printMemo(): void {
    if (this.memoDocument.rawUrl) {
      window.open(this.memoDocument.rawUrl)?.print();
    }
  }

  // ─── Structures par Région ────────────────────────────────────────

loadStructures(): void {
  this.structureService.getStructuresCampagneActive().subscribe({
    next: (data) => {
      this.structures = data.map(s => ({
        ...s,
        type: s.type === 'ESPACE_COMMERCIAL' ? 'EC' : 'CT' as 'EC' | 'CT', // ← conversion
        isFirstInGov: false
      }));
      this.buildGouvernorats();
      this.applyStructureFilter();
      this.updateStructuresStats();
    },
    error: () => {
      this.structures = [];
      this.buildGouvernorats();
      this.applyStructureFilter();
      this.updateStructuresStats();
    }
  });
}

  buildGouvernorats(): void {
    const govMap: Record<string, number> = {};
    this.structures.forEach(s => {
      govMap[s.region] = (govMap[s.region] || 0) + 1;
    });
    this.gouvernorats = Object.entries(govMap).map(([nom, count]) => ({ nom, count }));
  }

  applyStructureFilter(): void {
    let list = [...this.structures];

    if (this.structureTypeFilter !== 'tous') {
      list = list.filter(s => s.type === this.structureTypeFilter);
    }

    if (this.selectedGouvernorat) {
      list = list.filter(s => s.region === this.selectedGouvernorat);
    }

    list.sort((a, b) => (a.region ?? '').localeCompare(b.region ?? ''));

    const seenGovs = new Set<string>();
    this.filteredStructures = list.map(s => {
      const isFirstInGov = !seenGovs.has(s.region);
      seenGovs.add(s.region);
      return { ...s, isFirstInGov };
    });
  }

  setStructureFilter(type: string): void {
    this.structureTypeFilter = type;
    this.applyStructureFilter();
  }

  filterByGouvernorat(nom: string): void {
    this.selectedGouvernorat = this.selectedGouvernorat === nom ? '' : nom;
    this.applyStructureFilter();
  }

  exportStructures(): void {
    alert('Export XLSX — à connecter au service backend.');
  }

  toggleStructureView(): void {}

  openStructureUploadModal(): void {
    this.structureSelectedFile = null;
    this.showStructureUploadModal = true;
  }

  closeStructureModal(): void {
    this.showStructureUploadModal = false;
    this.structureSelectedFile = null;
  }

  onStructureFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.structureSelectedFile = input.files[0];
    }
  }

  onStructureDrop(event: DragEvent): void {
    event.preventDefault();
    this.structureDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.structureSelectedFile = files[0];
    }
  }

  saveStructureFile(): void {
    if (!this.structureSelectedFile) return;

    this.structureimportService.importExcel(this.structureSelectedFile).subscribe({
      next: () => {
        this.closeStructureModal();
        this.loadStructures();
        alert('✅ Structures mises à jour avec succès !');
      },
      error: (err) => {
        console.error(err);
        alert('❌ Erreur lors de l\'import Excel.');
      }
    });
  }

  editStructure(structure: Structure): void {
    this.editingStructure = { ...structure };
    this.showEditStructureModal = true;
  }

  closeEditStructureModal(): void {
    this.showEditStructureModal = false;
    this.editingStructure = null;
  }

  saveEditStructure(): void {
    if (!this.editingStructure) return;

    this.structureService.updateStructure(this.editingStructure.id, {
      nom: this.editingStructure.nom,
      adresse: this.editingStructure.adresse,
      autorises: this.editingStructure.autorises
    }).subscribe({
      next: () => {
        const idx = this.structures.findIndex(s => s.id === this.editingStructure!.id);
        if (idx !== -1) {
          this.structures[idx] = { ...this.editingStructure! };
          this.buildGouvernorats();
          this.applyStructureFilter();
          this.updateStructuresStats();
        }
        this.closeEditStructureModal();
        alert('✅ Structure mise à jour avec succès');
      },
      error: (err) => {
        console.error(err);
        alert('❌ Erreur lors de la mise à jour');
      }
    });
  }

  private updateStructuresStats(): void {
    this.structuresStats.total = this.structures.length;
    this.structuresStats.espacesCommerciaux = this.structures.filter(s => s.type === 'EC').length;
    this.structuresStats.centresTechnologiques = this.structures.filter(s => s.type === 'CT').length;
    this.structuresStats.saisonnersAutorises = this.structures.reduce((sum, s) => sum + s.autorises, 0);
    this.structuresStats.saisonnersRecrutes = this.structures.reduce((sum, s) => sum + s.recrutes, 0);
  }

  // ─── Présence & Paiement ──────────────────────────────────────────

  /**
   * Charger les lignes de présence depuis le backend.
   * Adaptez l'appel à votre service réel.
   */
  loadPresenceRows(): void {
    // TODO: Remplacer par un vrai appel service, ex:
    // this.presenceService.getAll().subscribe(data => { this.presenceRows = data; ... });

    // Données de démonstration basées sur la capture d'écran
    this.presenceRows = [
      { id: 1,  nom: 'jellali aziz',      cin: '11642584',         dateMbacharaa: '2025-07-01', dureeContrat: 30, absences: 3, montantNet: 0, rib: '',                    statut: 'paye'    },
      { id: 2,  nom: 'aziz king',         cin: '11642852',         dateMbacharaa: '2025-07-01', dureeContrat: 30, absences: 0, montantNet: 0, rib: '',                    statut: 'paye'    },
      { id: 3,  nom: 'ssssssss ssssss',   cin: '55998854',         dateMbacharaa: '2025-07-01', dureeContrat: 30, absences: 0, montantNet: 0, rib: '',                    statut: 'paye'    },
      { id: 4,  nom: 'Hadil lfaoui',      cin: '66145255',         dateMbacharaa: '2025-07-01', dureeContrat: 30, absences: 1, montantNet: 0, rib: '11642584555555566',   statut: 'impaye'  },
      { id: 5,  nom: 'safwen jellali',    cin: '55889966',         dateMbacharaa: '2025-07-01', dureeContrat: 30, absences: 0, montantNet: 0, rib: '2145588745693332',    statut: 'paye'    },
      { id: 6,  nom: 'zozou aziz',        cin: '88997744',         dateMbacharaa: '2025-07-01', dureeContrat: 30, absences: 2, montantNet: 0, rib: '4589654578555',       statut: 'paye'    },
      { id: 7,  nom: 'zozou aziz',        cin: '11458752',         dateMbacharaa: '2025-07-01', dureeContrat: 30, absences: 0, montantNet: 0, rib: '4589654578555',       statut: 'impaye'  },
      { id: 8,  nom: 'fih abdo',          cin: '1023034',          dateMbacharaa: '2025-07-01', dureeContrat: 30, absences: 0, montantNet: 0, rib: '4587411125654789',    statut: 'impaye'  },
      { id: 9,  nom: 'skander skander',   cin: '55447712',         dateMbacharaa: '2025-07-01', dureeContrat: 30, absences: 0, montantNet: 0, rib: '1236547894123',       statut: 'impaye'  },
      { id: 10, nom: 'foul foul',         cin: '11685245',         dateMbacharaa: '2025-07-01', dureeContrat: 30, absences: 0, montantNet: 0, rib: '125412541254125',     statut: 'impaye'  },
      { id: 11, nom: 'ben arous jellali', cin: '45874141',         dateMbacharaa: '2025-07-01', dureeContrat: 30, absences: 0, montantNet: 0, rib: '1256352446635',       statut: 'impaye'  },
    ];

    this.recalculerPresence();
    this.filterPresence();
  }

  /**
   * Recalcule tous les montants nets selon la config actuelle.
   */
  recalculerPresence(): void {
    const { tauxJournalier, dureeContrat } = this.presenceConfig;

    this.presenceRows = this.presenceRows.map(row => ({
      ...row,
      dureeContrat,
      montantNet: (dureeContrat - row.absences) * tauxJournalier
    }));

    this.updatePresenceStats();
    this.filterPresence();
  }

  private updatePresenceStats(): void {
    const { tauxJournalier } = this.presenceConfig;
    const totalAbsences = this.presenceRows.reduce((s, r) => s + r.absences, 0);
    const masseSalariale = this.presenceRows.reduce((s, r) => s + r.montantNet, 0);

    this.presenceStats = {
      totalSaisonniers: this.presenceRows.length,
      masseSalariale,
      joursAbsence: totalAbsences,
      tauxJournalier
    };

    this.presenceTotals = {
      totalJours:    this.presenceRows.reduce((s, r) => s + r.dureeContrat, 0),
      totalAbsences,
      totalMontant:  masseSalariale
    };
  }

  filterPresence(): void {
    let list = [...this.presenceRows];

    if (this.presenceFilter === 'payes') {
      list = list.filter(r => r.statut === 'paye');
    } else if (this.presenceFilter === 'impayes') {
      list = list.filter(r => r.statut === 'impaye');
    }

    if (this.presenceSearchQuery.trim()) {
      const q = this.presenceSearchQuery.toLowerCase();
      list = list.filter(r =>
        r.nom.toLowerCase().includes(q) ||
        r.cin.toLowerCase().includes(q)
      );
    }

    this.filteredPresenceRows = list;
  }

  setPresenceFilter(filter: 'tous' | 'payes' | 'impayes'): void {
    this.presenceFilter = filter;
    this.filterPresence();
  }

  onPresenceCampagneChange(): void {
    // Recharger les saisonniers liés à la campagne sélectionnée si nécessaire
  }

  onPresenceRowChange(row: PresenceRow): void {
    row.montantNet = (row.dureeContrat - row.absences) * this.presenceConfig.tauxJournalier;
    this.updatePresenceStats();
  }

  recalculerLigne(row: PresenceRow): void {
    row.montantNet = (row.dureeContrat - row.absences) * this.presenceConfig.tauxJournalier;
    this.updatePresenceStats();
  }

  togglePaiementStatut(row: PresenceRow): void {
    row.statut = row.statut === 'paye' ? 'impaye' : 'paye';
    this.filterPresence();
    this.updatePresenceStats();
  }

  marquerPaye(row: PresenceRow): void {
    row.statut = 'paye';
    this.filterPresence();
    this.updatePresenceStats();
  }

  marquerImpaye(row: PresenceRow): void {
    row.statut = 'impaye';
    this.filterPresence();
    this.updatePresenceStats();
  }

  // ── Modal Absences ───────────────────────────────────────────────

  openAbsenceModal(row: PresenceRow): void {
    this.editingPresenceRow = { ...row };
    this.showAbsenceModal = true;
  }

  closeAbsenceModal(): void {
    this.showAbsenceModal = false;
    this.editingPresenceRow = null;
  }

  incrementAbsence(): void {
    if (this.editingPresenceRow && this.editingPresenceRow.absences < this.editingPresenceRow.dureeContrat) {
      this.editingPresenceRow.absences++;
      this.recalculerLigne(this.editingPresenceRow);
    }
  }

  decrementAbsence(): void {
    if (this.editingPresenceRow && this.editingPresenceRow.absences > 0) {
      this.editingPresenceRow.absences--;
      this.recalculerLigne(this.editingPresenceRow);
    }
  }

  saveAbsence(): void {
    if (!this.editingPresenceRow) return;
    const idx = this.presenceRows.findIndex(r => r.id === this.editingPresenceRow!.id);
    if (idx !== -1) {
      this.presenceRows[idx] = { ...this.editingPresenceRow };
      this.recalculerLigne(this.presenceRows[idx]);
      this.filterPresence();
    }
    this.closeAbsenceModal();
  }

  // ── Exports Présence ─────────────────────────────────────────────

  exportPresencePDF(): void {
    // TODO: Appeler service backend pour générer PDF
    alert('Export PDF — à connecter au service backend.');
  }

  exportPresenceExcel(): void {
    // TODO: Appeler service backend pour générer Excel
    alert('Export Excel — à connecter au service backend.');
  }

  voirDetailSaisonnier(row: PresenceRow): void {
    // TODO: Naviguer vers le détail ou ouvrir un modal
    console.log('Détail saisonnier:', row);
  }

  // ── Méthodes Voir ────────────────────────────────────────────────
ouvrirVoirCampagne(campagne: Campagne): void {
  this.viewingCampagne = { ...campagne };
  // Compter les candidatures de cette campagne
  this.viewingCampagneCandidatures = this.candidatures.filter(
    c => c.campagne.id === campagne.id
  );
  this.showViewModal = true;
}

fermerVoirModal(): void {
  this.showViewModal = false;
  this.viewingCampagne = null;
  this.viewingCampagneCandidatures = [];
}

viewingCampagneCandidatures: Candidature[] = [];

// ── Méthodes Modifier ────────────────────────────────────────────
ouvrirModifierCampagne(campagne: Campagne): void {
  this.editingCampagne = { ...campagne };
  this.showEditModal = true;
}

fermerEditModal(): void {
  this.showEditModal = false;
  this.editingCampagne = null;
}

sauvegarderModificationCampagne(): void {
  if (!this.editingCampagne) return;

  if (!this.editingCampagne.nom || !this.editingCampagne.dateDebut || !this.editingCampagne.dateFin) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }

  const dto: CampagneRequestDTO = {
    libelle: this.editingCampagne.nom,
    code: this.editingCampagne.code,
    dateDebut: this.editingCampagne.dateDebut,
    dateFin: this.editingCampagne.dateFin,
    description: this.editingCampagne.description,
    regionIds: this.editingCampagne.regionIds || []
  };

  this.campagneService.updateCampagne(this.editingCampagne.id, dto).subscribe({
    next: () => {
      // Mettre à jour localement
      const idx = this.campagnes.findIndex(c => c.id === this.editingCampagne!.id);
      if (idx !== -1) {
        this.campagnes[idx] = { ...this.editingCampagne! };
      }
      this.fermerEditModal();
      this.loadCampagnes();
    },
    error: err => {
      console.error(err);
      alert('Erreur lors de la modification');
    }
  });
}

// ── Changer statut depuis modifier ──────────────────────────────
changerStatutCampagne(nouveauStatut: string): void {
  if (!this.editingCampagne) return;

  if (nouveauStatut === 'ACTIVE') {
    const campagneActiveExistante = this.campagnes.find(
      c => c.statut === 'active' && c.id !== this.editingCampagne!.id
    );
    if (campagneActiveExistante) {
      alert(`Impossible : la campagne "${campagneActiveExistante.nom}" est déjà active. Clôturez-la d'abord.`);
      return;
    }
  }

  const statutMap: Record<string, { statut: Campagne['statut'], label: string }> = {
    'ACTIVE':    { statut: 'active',    label: 'Active'    },
    'BROUILLON': { statut: 'brouillon', label: 'Brouillon' },
    'CLOTUREE':  { statut: 'termine',   label: 'Clôturée'  },
  };

  const info = statutMap[nouveauStatut];
  if (info && this.editingCampagne) {
    this.editingCampagne.statut = info.statut;
    this.editingCampagne.statutLabel = info.label;
  }
}


// ── Handler sélection fichier ─────────────────────────────────────
onCampagneExcelSelected(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    this.campagneExcelFile = file;
    this.lireRegionsExcel(file);
  }
}

// ── Handler drag & drop ───────────────────────────────────────────
onCampagneExcelDrop(event: DragEvent): void {
  event.preventDefault();
  this.campagneExcelDragOver = false;
  const file = event.dataTransfer?.files[0];
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    this.campagneExcelFile = file;
    this.lireRegionsExcel(file);
  } else {
    alert('Veuillez déposer un fichier Excel (.xlsx ou .xls)');
  }
}

// ── Lire les régions depuis l'Excel (prévisualisation) ────────────
lireRegionsExcel(file: File): void {
  // Lecture côté frontend pour afficher un aperçu des régions
  // On utilise FileReader + SheetJS si disponible, sinon on laisse le backend gérer
  this.regionsDetectees = [];

  import('xlsx').then(XLSX => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const regionsSet = new Set<string>();
      rows.slice(1).forEach((row: any[]) => {
        if (row[0] && String(row[0]).trim()) {
          regionsSet.add(String(row[0]).trim());
        }
      });
      this.regionsDetectees = Array.from(regionsSet);
    };
    reader.readAsArrayBuffer(file);
  }).catch(() => {
    // SheetJS pas disponible, on ignore la prévisualisation
    this.regionsDetectees = [];
  });
}


campagnesOpen = false;

toggleCampagnes(): void {
  this.campagnesOpen = !this.campagnesOpen;
}

logout(): void {
  this.authService.logout();
  this.router.navigate(['/admin/login']);
}
}