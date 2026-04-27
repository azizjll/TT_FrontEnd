import { Component, OnInit, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EtatRHService } from 'src/app/service/etat-rh.service';
import { AuthService, Region } from 'src/app/services/auth.service';
import { CampagneService, CampagneRequestDTO } from 'src/app/services/campagne.service';
import { CandidatureService } from 'src/app/services/candidature.service';
import { DocumentCampagneDTO, DocumentCampagneService } from 'src/app/services/document-campagne.service';
import { DocumentService } from 'src/app/services/document.service';
import { ParentAutoriseService } from 'src/app/services/parent-autorise.service';
import {  StructureImportService } from 'src/app/services/structure-import.service';
import { StructureDTO, StructureService } from 'src/app/structure.service';
import * as XLSX from 'xlsx';

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
  type: 'ESPACE_COMMERCIAL' | 'CENTRE_TECHNOLOGIQUE';
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
activeSection: 'campagnes' | 'candidatures' | 'utilisateurs' | 'memo' | 'structures' | 'presence' | 'etats' = 'campagnes';
  searchQuery = '';
  pageTitle = 'Pilotage des Campagnes';
  pageSubtitle = 'Gérez et suivez toutes vos campagnes de recrutement';

  today: string = new Date().toISOString().split('T')[0];


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
    campagnesCloturee: 0,
    campagnesTotal: 12,
    totalParents : 0,
    joursRestants: 18,
   candidaturesAcceptees: 0,
  candidaturesEnAttente: 0,
  candidaturesRefusees: 0,
  totalCandidatures: 0
  };

  // ── Campagnes ─────────────────────────────────────────────────────
  regions: Region[] = [];
  campagnes: Campagne[] = [];
  newCampagne: Campagne = this.emptyNewCampagne();
  newCampagneAnnee: number = new Date().getFullYear(); // ← ajoute cette ligne
  showActiveCampagneWarning = false;
  activeCampagneNom = '';

  // ── Filtres candidatures ─────────────────────────────────────────
candidatureFilterRegion = '';
candidatureFilterStructure = '';
candidatureFilterStatut = '';
filteredCandidatures: Candidature[] = [];

  // ── Upload parents Excel ─────────────────────────────────────────
parentsExcelFile: File | null = null;
parentsExcelDragOver = false;
isUploadingParents = false;
parentsUploadSuccess = false;

  // ── Nouvelles propriétés pour l'upload Excel campagne ─────────────
campagneExcelFile: File | null = null;
campagneExcelDragOver = false;
regionsDetectees: string[] = [];
isSavingCampagne = false;
isLoading = false;

// ── Documents à uploader lors de la création ──────────────────
documentsPendants: Array<{ file: File; nom: string; type: string }> = [];


candidatureStructureMap = new Map<number, any>();

openAddParentModal() {
  this.isEditParent = false;
  this.parentForm = { id: null, nomPrenom: '', matricule: '' ,utilise: false};
  this.showParentModal = true;
}

editParent(p: any) {
  this.isEditParent = true;
  this.parentForm = { ...p };
  this.showParentModal = true;
}

closeParentModal() {
  this.showParentModal = false;
}

saveParent() {

  if (!this.parentForm.nomPrenom || !this.parentForm.matricule) {
    alert("Champs obligatoires ❌");
    return;
  }

  if (this.isEditParent) {
    if (this.parentForm.id == null) return;

    this.parentService.updateParent(
      this.parentForm.id,
      this.parentForm.nomPrenom,
      this.parentForm.matricule,
      this.parentForm.autorises,  // 🆕 int
      this.parentForm.utilise     // 🆕 int
    ).subscribe({
      next: () => {
        this.loadParents();
        this.closeParentModal();
      },
      error: (err) => alert(err.error)
    });

  } else {

    this.parentService.addParent(
      this.parentForm.nomPrenom,
      this.parentForm.matricule,
      this.parentForm.autorises   // 🆕 int
    ).subscribe({
      next: () => {
        this.loadParents();
        this.closeParentModal();
      },
      error: (err) => alert(err.error)
    });
  }
}

deleteParent(id: number) {
  if (!confirm("Supprimer ce parent ?")) return;

  this.parentService.deleteParent(id).subscribe(() => {
    this.loadParents();
  });
}

  // ── Candidatures ──────────────────────────────────────────────────
  candidatures: Candidature[] = [];

  isLoadingStructure = false;
  myRegion!: Region;  

  // ── Utilisateurs ──────────────────────────────────────────────────
  utilisateurs: Utilisateur[] = [];


  showDossierModal = false;
selectedCandidature: any = null;
selectedStructureId: number | null = null;
  selectedCandidatureStructure: any = null;  // structure actuelle du candidat


  structuresCommerciaux: StructureDTO[] = [];
structuresTech: StructureDTO[] = [];
structures: StructureDTO[] = [];


closeDossier() {
  this.showDossierModal = false;
  this.selectedCandidature = null;
}


get structuresEC(): StructureDTO[] {
  return this.structures.filter(s => s.type === 'ESPACE_COMMERCIAL');
}

get structuresCT(): StructureDTO[] {
  return this.structures.filter(s => s.type === 'CENTRE_TECHNOLOGIQUE');
}

onStructureChange(): void {
  const found = this.structures.find(s => s.id === this.selectedStructureId);
  this.selectedCandidatureStructure = found ?? null;
}
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

  etatsRH: any[] = [];

  filteredStructures: Structure[] = [];
  structureTypeFilter = 'tous';
  selectedGouvernorat = '';
  gouvernorats: Gouvernorat[] = [];

  structureSelectedFile: File | null = null;
  structureDragOver = false;
  editingStructure: Structure | null = null;

  // ── Memo : document sélectionné pour visualisation ──────────────
memoDocumentSelectionne: DocumentCampagneDTO | null = null;
memoViewerUrl: SafeResourceUrl | null = null;
isLoadingViewerDoc = false;

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

  // ── Memo : campagne sélectionnée et ses documents ──────────────
memoDocumentsCampagne: DocumentCampagneDTO[] = [];
memoSelectedCampagneId: number | null = null;
isLoadingDocsCampagne = false;


  // ── Dans la classe, nouvelles propriétés ──────────────────────────
documentsCampagne: DocumentCampagneDTO[] = [];
documentFile: File | null = null;
documentNom = '';
documentType = 'مذكرة الإنتداب';  // valeur par défaut
isUploadingDoc = false;


parents: any[] = [];

showParentModal = false;
isEditParent = false;

parentForm: any = {
  id: null,
  nomPrenom: '',
  matricule: '',
  autorises: 0,   // 🆕
  utilise: 0      // 🆕
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
    private docCampagneService: DocumentCampagneService,
    private parentService: ParentAutoriseService,
    private etatRHService: EtatRHService
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
      this.loadParents();
        this.loadEtatsRH();


    this.nomUtilisateur = this.authService.getNomComplet();
  this.roleUtilisateur = this.authService.getRole();
  }


  loadEtatsRH(): void {
  this.etatRHService.getAllEtats().subscribe({
    next: (data) => this.etatsRH = data,
    error: () => this.etatsRH = []
  });
}

validerEtat(id: number): void {
  this.etatRHService.changerStatut(id, 'VALIDE').subscribe(() => {
    this.loadEtatsRH();
    this.showToast('✅ État validé');
  });
}

rejeterEtat(id: number): void {
  this.etatRHService.changerStatut(id, 'REJETE').subscribe(() => {
    this.loadEtatsRH();
    this.showToast('❌ État rejeté');
  });
}

 loadParents() {
  this.parentService.getAllParents().subscribe({
    next: (data) => {
      this.parents = data;
      this.updateStats(); // ⭐ important
    },
    error: (err) => console.error(err)
  });
}

  loadDocumentsCampagne(campagneId: number): void {
  this.docCampagneService.getDocumentsByCampagne(campagneId).subscribe({
    next: docs => this.documentsCampagne = docs,
    error: err => console.error('Erreur chargement documents', err)
  });
}
/** Upload un document vers la campagne sélectionnée */
uploadDocumentCampagne(): void {
  if (!this.documentFile || !this.presenceConfig.campagneId) {
    alert('Sélectionnez un fichier et une campagne');
    return;
  }
  this.isUploadingDoc = true;

  this.docCampagneService.uploadDocument(
    this.presenceConfig.campagneId,
    this.documentNom || this.documentFile.name,
    this.documentType,
    this.documentFile
  ).subscribe({
    next: doc => {
      this.documentsCampagne.push(doc);
      this.documentFile = null;
      this.documentNom = '';
      this.isUploadingDoc = false;
      this.showToast('✅ Document ajouté avec succès');
    },
    error: err => {
      console.error(err);
      this.isUploadingDoc = false;
      this.showToast('❌ Erreur lors de l\'upload');
    }
  });
}

/** Supprime un document */
supprimerDocument(doc: DocumentCampagneDTO): void {
  if (!confirm(`Supprimer "${doc.nom}" ?`)) return;
  this.docCampagneService.deleteDocument(doc.id).subscribe({
    next: () => {
      this.documentsCampagne = this.documentsCampagne.filter(d => d.id !== doc.id);
      this.showToast('✅ Document supprimé');
    },
    error: () => this.showToast('❌ Erreur suppression')
  });
}

/** Handler sélection fichier document */
onDocumentFileSelected(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    this.documentFile = file;
    if (!this.documentNom) {
      this.documentNom = file.name.replace(/\.[^.]+$/, '');
    }
  }
}

selectionnerDocumentMemo(doc: DocumentCampagneDTO): void {
  this.memoDocumentSelectionne = doc;
  this.isLoadingViewerDoc = true;
  this.memoViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(doc.url);
  // Simuler un court délai de chargement
  setTimeout(() => this.isLoadingViewerDoc = false, 600);
}

fermerViewerDoc(): void {
  this.memoDocumentSelectionne = null;
  this.memoViewerUrl = null;
}


ouvrirLienDoc(url: string): void {
  window.open(url, '_blank');
}
  // ─── Navigation ───────────────────────────────────────────────────

  setActive(section: 'campagnes' | 'candidatures' | 'utilisateurs' | 'memo' | 'structures' | 'presence' | 'etats'): void {
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
      const campagneActive = this.campagnes.find(c => c.statut === 'active') ?? this.campagnes[0];
  if (campagneActive) {
    this.onMemoCampagneChange(campagneActive.id);
  }
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
      this.updateStats();
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
   this.documentsPendants = [];
   this.parentsExcelFile = null;
  }

  closeModal(): void {
    this.showCreateModal = false;
     this.campagneExcelFile = null;
  this.regionsDetectees = [];
  this.isSavingCampagne = false;
   this.documentsPendants = [];
   this.parentsExcelFile = null; 
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

  if (activer) {
    const campagneActiveExistante = this.campagnes.find(c => c.statut === 'active');
    if (campagneActiveExistante) {
      this.showActiveCampagneWarning = true;
      this.activeCampagneNom = campagneActiveExistante.nom;
      return;
    }
  }

  this.isSavingCampagne = true;

  // ── Étape 0 : upload parents si fichier fourni ─────────────────
  const creerCampagne$ = () => {
    const dto: CampagneRequestDTO = {
      libelle: this.newCampagne.nom,
      code: this.newCampagne.code,
      dateDebut: this.newCampagne.dateDebut,
      dateFin: this.newCampagne.dateFin,
      description: this.newCampagne.description,
      budget: this.newCampagne.budget ? Number(this.newCampagne.budget) : undefined,
      regionIds: []
    };

    this.campagneService.creerCampagneAvecExcel(dto, this.campagneExcelFile!).subscribe({
      next: (campagneCreee) => {
        this.uploaderDocumentsPendants(campagneCreee.id, activer);
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de la création de la campagne');
        this.isSavingCampagne = false;
      }
    });
  };

  if (this.parentsExcelFile) {
    this.candidatureService.uploadParentsExcel(this.parentsExcelFile).subscribe({
      next: () => {
        this.showToast('✅ Parents importés avec succès');
        creerCampagne$();
      },
      error: (err) => {
        console.error(err);
        alert('❌ Erreur lors de l\'import des parents');
        this.isSavingCampagne = false;
      }
    });
  } else {
    creerCampagne$();
  }
}

onParentsExcelSelected(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) this.parentsExcelFile = file;
}

onParentsExcelDrop(event: DragEvent): void {
  event.preventDefault();
  this.parentsExcelDragOver = false;
  const file = event.dataTransfer?.files[0];
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    this.parentsExcelFile = file;
  } else {
    alert('Veuillez déposer un fichier Excel (.xlsx ou .xls)');
  }
}

/**
 * Upload séquentiel des documents pendants après création campagne.
 * Utilise forkJoin si plusieurs documents, sinon passe directement.
 */
private uploaderDocumentsPendants(campagneId: number, activer: boolean): void {
  if (this.documentsPendants.length === 0) {
    // Pas de documents → activer si demandé et terminer
    this.finaliserCreation(campagneId, activer);
    return;
  }

  const uploads$ = this.documentsPendants.map(doc =>
    this.docCampagneService.uploadDocument(
      campagneId,
      doc.nom,
      doc.type,
      doc.file
    )
  );

  // Import forkJoin en haut du fichier : import { forkJoin } from 'rxjs';
  forkJoin(uploads$).subscribe({
    next: () => {
      this.finaliserCreation(campagneId, activer);
    },
    error: (err) => {
      console.error('Erreur upload documents:', err);
      // La campagne est créée, on continue malgré l'erreur documents
      this.showToast('⚠️ Campagne créée mais erreur sur certains documents');
      this.finaliserCreation(campagneId, activer);
    }
  });
}

private finaliserCreation(campagneId: number, activer: boolean): void {
  if (activer) {
    this.campagneService.activerCampagne(campagneId).subscribe({
      next: () => {
        this.loadCampagnes();
        this.closeModal();
        this.isSavingCampagne = false;
        this.showToast('✅ Campagne créée et activée avec succès');
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
    this.showToast('✅ Campagne créée avec succès');
  }
}

onMemoCampagneChange(campagneId: number): void {
  this.memoSelectedCampagneId = campagneId;
  this.memoDocumentSelectionne = null; // ← reset viewer
  this.memoViewerUrl = null;
  if (!campagneId) { this.memoDocumentsCampagne = []; return; }
  this.isLoadingDocsCampagne = true;
  this.docCampagneService.getDocumentsByCampagne(campagneId).subscribe({
    next: docs => {
      this.memoDocumentsCampagne = docs;
      this.isLoadingDocsCampagne = false;
      // Auto-sélectionner le premier document si disponible
      if (docs.length > 0) {
        this.selectionnerDocumentMemo(docs[0]);
      }
    },
    error: () => { this.memoDocumentsCampagne = []; this.isLoadingDocsCampagne = false; }
  });
}

supprimerDocumentMemo(doc: DocumentCampagneDTO): void {
  if (!confirm(`Supprimer "${doc.nom}" ?`)) return;
  this.docCampagneService.deleteDocument(doc.id).subscribe({
    next: () => {
      this.memoDocumentsCampagne = this.memoDocumentsCampagne.filter(d => d.id !== doc.id);
      this.showToast('✅ Document supprimé');
    },
    error: () => this.showToast('❌ Erreur suppression')
  });
}

// Upload depuis la section memo
onMemoDocumentUpload(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !this.memoSelectedCampagneId) return;

  const nom = file.name.replace(/\.[^.]+$/, '');
  this.docCampagneService.uploadDocument(
    this.memoSelectedCampagneId,
    nom,
    'مذكرة الإنتداب',
    file
  ).subscribe({
    next: doc => {
      this.memoDocumentsCampagne.push(doc);
      this.showToast('✅ Document ajouté');
      (event.target as HTMLInputElement).value = '';
    },
    error: () => this.showToast('❌ Erreur upload')
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
        this.stats.campagnesCloturee--;
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
      this.stats.campagnesCloturee++;
    }
  }

 

  private emptyNewCampagne(): Campagne {
  const annee = new Date().getFullYear();
  const codeAuto = `CAM-${annee}-${String(Date.now()).slice(-4)}`;
  return {
    id: 0,
    nom: `Campagne de recrutement des saisonniers pour ${annee}`,
    code: codeAuto,  // ← généré automatiquement
    dateDebut: '', dateFin: '',
    statut: 'brouillon', statutLabel: 'Brouillon',
    candidatures: 0, affectations: 0, verrouille: false,
    description: '', budget: '', regionIds: []
  };
}

  onAnneeChange(): void {
  this.newCampagne.nom = `Campagne de recrutement des saisonniers pour ${this.newCampagneAnnee}`;
  // Générer le code automatiquement
  this.newCampagne.code = `CAM-${this.newCampagneAnnee}-${String(Date.now()).slice(-4)}`;
}

// Listes dérivées pour les selects
get regionsDisponibles(): string[] {
  const set = new Set(this.candidatures.map(c => c.saisonnier.region.nom));
  return Array.from(set).sort();
}

get structuresDisponibles(): string[] {

  console.log('📍 Région sélectionnée:', this.candidatureFilterRegion);
  console.log('🏢 Toutes les structures:', this.structures);

  if (!this.candidatureFilterRegion) {
    return [];
  }

  const result = this.structures
    .filter(s => {
      console.log('➡️ Structure:', s.nom, 'Region:', s.region);
      return s.region === this.candidatureFilterRegion;
    })
    .map(s => s.nom);

  console.log('🎯 Structures finales dropdown:', result);

  return result;
}


get structuresECDisponibles(): StructureDTO[] {
  if (!this.candidatureFilterRegion) return [];
  return this.structures.filter(s =>
    s.region === this.candidatureFilterRegion &&
    s.type === 'ESPACE_COMMERCIAL'
  );
}

get structuresCTDisponibles(): StructureDTO[] {
  if (!this.candidatureFilterRegion) return [];
  return this.structures.filter(s =>
    s.region === this.candidatureFilterRegion &&
    s.type === 'CENTRE_TECHNOLOGIQUE'
  );
}

filterCandidatures(): void {
  let list = [...this.candidatures];

  if (this.candidatureFilterRegion) {
    list = list.filter(c => c.saisonnier?.region?.nom === this.candidatureFilterRegion);
  }

  if (this.candidatureFilterStructure) {
    list = list.filter(c => {
      const st = this.candidatureStructureMap.get(c.id);
      if (!st?.nom) return false;
      return st.nom.trim().toLowerCase() === 
             this.candidatureFilterStructure.trim().toLowerCase();
    });
  }

  if (this.candidatureFilterStatut) {
    list = list.filter(c => c.statut === this.candidatureFilterStatut);
  }

  this.filteredCandidatures = list;
}
resetFiltresCandidatures(): void {
  this.candidatureFilterRegion = '';
  this.candidatureFilterStructure = '';
  this.candidatureFilterStatut = '';
  this.filterCandidatures();
}

onRegionFilterChange(): void {
  // Réinitialiser la structure quand la région change
  this.candidatureFilterStructure = '';
     // ✅ IMPORTANT

  this.filterCandidatures();
}



updateCandidature() {
  const cand = this.selectedCandidature;

  const formData = new FormData();

  formData.append('nom', cand.saisonnier.nom);
  formData.append('prenom', cand.saisonnier.prenom);
  formData.append('cin', cand.saisonnier.cin);
  formData.append('rib', cand.saisonnier.rib);
  formData.append('telephone', cand.saisonnier.telephone);
  formData.append('email', cand.saisonnier.email);
  formData.append('regionId', cand.saisonnier.region.id);

  formData.append('moisTravail', cand.saisonnier.moisTravail || '');
  formData.append('statut', cand.statut);
  formData.append('commentaire', cand.commentaire || '');

  this.candidatureService.updateCandidature(cand.id, formData)
    .subscribe({
      next: () => {
        alert("Candidature mise à jour ✅");
        this.loadCandidatures();
        this.closeDossier();
      },
      error: err => console.error(err)
    });
}

openDossier(cand: any) {
  this.selectedCandidature = JSON.parse(JSON.stringify(cand));

  console.log('📂 Candidature ouverte:', this.selectedCandidature);

  // ⚠️ CAS ACTUEL (structure inexistante)
  this.selectedStructureId = cand.saisonnier?.structure?.id || null;

  console.log('🏢 Structure sélectionnée (init):', this.selectedStructureId);

  this.showDossierModal = true;
  const regionId = cand.saisonnier?.region?.id || this.myRegion?.id;
  this.structureService.getStructuresByRegion(regionId).subscribe({
    next: (data: StructureDTO[]) => {
      this.structures = data;

      // ── Étape 2 : récupérer la structure actuelle du candidat
      this.candidatureService.getStructureByCandidature(cand.id).subscribe({
        next: (st: any) => {
          if (st?.id) {
            this.selectedCandidatureStructure = st;
            this.selectedStructureId = st.id;  // ← pré-sélectionner dans le select
          }
          this.isLoadingStructure = false;
        },
        error: () => {
          this.selectedStructureId = null;
          this.isLoadingStructure = false;
        }
      });
    },
    error: (err: any) => {
      console.error('Erreur chargement structures:', err);
      this.isLoadingStructure = false;
    }
  });
}

// ── Gestion des documents pendants (lors création campagne) ──────

onDocumentPendantSelected(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  this.documentsPendants.push({
    file,
    nom: file.name.replace(/\.[^.]+$/, ''),
    type: 'مذكرة الإنتداب'
  });
  // Reset input pour permettre re-sélection du même fichier
  (event.target as HTMLInputElement).value = '';
}

supprimerDocumentPendant(index: number): void {
  this.documentsPendants.splice(index, 1);
}

updateDocumentPendantNom(index: number, nom: string): void {
  this.documentsPendants[index].nom = nom;
}

updateDocumentPendantType(index: number, type: string): void {
  this.documentsPendants[index].type = type;
}
  // ─── Candidatures ─────────────────────────────────────────────────

loadCandidatures(): void {
  this.candidatureService.getAllCandidatures().subscribe({
    next: data => {
      this.candidatures = data;

      // ✅ Enrichir la map structure pour chaque candidature
      this.candidatures.forEach(c => {
        this.candidatureService.getStructureByCandidature(c.id).subscribe({
          next: (st: any) => {
            if (st?.id) {
              this.candidatureStructureMap.set(c.id, st);
            }
          },
          error: () => {} // pas de structure = on ignore
        });
      });

      this.updateCandidaturesParCampagne();
      this.filterCandidatures();
      this.loadPresenceRows();
      this.updateStats();
    },
    error: err => console.error('Erreur chargement candidatures', err)
  });
}

updateStats(): void {
  const candidatures = this.candidatures || [];

  // Candidatures
  this.stats.totalCandidatures = candidatures.length;
  this.stats.candidaturesAcceptees =
    candidatures.filter(c => c.statut === 'ACCEPTEE').length;
  this.stats.candidaturesEnAttente =
    candidatures.filter(c => c.statut === 'EN_ATTENTE').length;
  this.stats.candidaturesRefusees =
    candidatures.filter(c => c.statut === 'REFUSEE').length;

  // Parents
  this.stats.totalParents = this.parents?.length || 0;

  // Campagnes actives (si tu les as déjà chargées)
  this.stats.campagnesCloturee =
    this.campagnes?.filter(c => c.statut === 'cloturee').length || 0;
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
        console.log('📥 Structures backend:', data);

      this.structures = data.map(s => ({
        ...s,
        isFirstInGov: false
      }));
        console.log('🏢 Structures après mapping:', this.structures);

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
          this.structures[idx] = {
  ...this.editingStructure!,
  disponible: this.structures[idx].disponible
};
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
    this.structuresStats.espacesCommerciaux = this.structures.filter(s => s.type === 'ESPACE_COMMERCIAL').length;
    this.structuresStats.centresTechnologiques = this.structures.filter(s => s.type === 'CENTRE_TECHNOLOGIQUE').length;
    this.structuresStats.saisonnersAutorises = this.structures.reduce((sum, s) => sum + s.autorises, 0);
    this.structuresStats.saisonnersRecrutes = this.structures.reduce((sum, s) => sum + s.recrutes, 0);
  }

  // ─── Présence & Paiement ──────────────────────────────────────────

  /**
   * Charger les lignes de présence depuis le backend.
   * Adaptez l'appel à votre service réel.
   */
  loadPresenceRows(): void {
  // Filtrer les candidatures de la campagne sélectionnée
  const campagneId = this.presenceConfig.campagneId;
  
  let candidaturesFiltrees = this.candidatures;
  
  if (campagneId) {
    candidaturesFiltrees = this.candidatures.filter(c => c.campagne.id === campagneId);
  }

  // Transformer les candidatures en lignes de présence
  this.presenceRows = candidaturesFiltrees.map((c, index) => ({
    id: c.id,
    nom: `${c.saisonnier.nom} ${c.saisonnier.prenom}`,
    cin: String(c.saisonnier.cin),
    dateMbacharaa: this.presenceConfig.datePriseFonction,
    dureeContrat: this.presenceConfig.dureeContrat,
    absences: 0,
    montantNet: 0,
    rib: c.saisonnier.rib ?? '',
    statut: 'impaye' as 'impaye',
    campagneId: c.campagne.id
  }));

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
  this.loadPresenceRows(); // ← recharge selon la campagne choisie
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
  // 1. Préparer les données
  const data = this.filteredPresenceRows.map((row, index) => ({
  'الحالة': row.statut === 'paye' ? 'مدفوع' : 'غير مدفوع',
  'رقم الحساب (RIB)': row.rib || '',
  'المبلغ الصافي (DT)': row.montantNet.toFixed(3),
  'الأيام المشغولة': row.dureeContrat - row.absences,
  'الغيابات': row.absences,
  'مدة العمل (أيام)': row.dureeContrat,
  'تاريخ المباشرة': row.dateMbacharaa,
  'رقم بطاقة التعريف': row.cin,
  'الاسم واللقب': row.nom,
  'عد': index + 1,
}));

  // 2. Ajouter une ligne de totaux
  data.push({
    'عد': '',
    'الاسم واللقب': 'المجموع الإجمالي',
    'رقم بطاقة التعريف': '',
    'تاريخ المباشرة': '',
    'مدة العمل (أيام)': this.presenceTotals.totalJours,
    'الغيابات': this.presenceTotals.totalAbsences,
    'الأيام المشغولة': this.presenceTotals.totalJours - this.presenceTotals.totalAbsences,
    'المبلغ الصافي (DT)': this.presenceTotals.totalMontant.toFixed(3),
    'رقم الحساب (RIB)': '',
    'الحالة': '',
  } as any);

  // 3. Créer le workbook
  const worksheet = XLSX.utils.json_to_sheet(data);

worksheet['!rtl'] = true;  // 4. Définir la largeur des colonnes
  worksheet['!cols'] = [
    { wch: 5 },   // عد
    { wch: 25 },  // الاسم
    { wch: 15 },  // CIN
    { wch: 15 },  // تاريخ المباشرة
    { wch: 15 },  // مدة العمل
    { wch: 10 },  // الغيابات
    { wch: 15 },  // الأيام المشغولة
    { wch: 18 },  // المبلغ
    { wch: 25 },  // RIB
    { wch: 12 },  // الحالة
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Présence & Paiement');

  // 5. Ajouter une feuille de récapitulatif
  const recapData = [
    { 'Paramètre': 'Campagne', 'Valeur': this.getCampagneNom() },
    { 'Paramètre': 'Taux journalier', 'Valeur': `${this.presenceConfig.tauxJournalier} DT` },
    { 'Paramètre': 'Durée contrat', 'Valeur': `${this.presenceConfig.dureeContrat} jours` },
    { 'Paramètre': 'Total saisonniers', 'Valeur': this.presenceStats.totalSaisonniers },
    { 'Paramètre': 'Masse salariale', 'Valeur': `${this.presenceStats.masseSalariale.toFixed(3)} DT` },
    { 'Paramètre': 'Total absences', 'Valeur': this.presenceTotals.totalAbsences },
    { 'Paramètre': 'Date export', 'Valeur': new Date().toLocaleDateString('fr-TN') },
  ];

  const recapSheet = XLSX.utils.json_to_sheet(recapData);
  recapSheet['!rtl'] = true;
  recapSheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, recapSheet, 'Récapitulatif');

  // 6. Générer et télécharger le fichier
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
const blob = new Blob([excelBuffer], {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `presence_paiement_${Date}.xlsx`;
a.click();
URL.revokeObjectURL(url);
}

// Méthode helper pour récupérer le nom de la campagne sélectionnée
private getCampagneNom(): string {
  const campagne = this.campagnes.find(c => c.id === this.presenceConfig.campagneId);
  return campagne?.nom ?? 'campagne';
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

  // Mapper statut local → statut backend
  const statutBackendMap: Record<string, string> = {
    'active':    'ACTIVE',
    'brouillon': 'BROUILLON',
    'termine':   'CLOTUREE',
  };

  const dto: CampagneRequestDTO = {
    libelle: this.editingCampagne.nom,
    code: this.editingCampagne.code,
    dateDebut: this.editingCampagne.dateDebut,
    dateFin: this.editingCampagne.dateFin,
    description: this.editingCampagne.description,
    regionIds: this.editingCampagne.regionIds || [],
    statut: statutBackendMap[this.editingCampagne.statut] || 'BROUILLON'  // ← AJOUTER
  };

  this.campagneService.updateCampagne(this.editingCampagne.id, dto).subscribe({
    next: () => {
      const idx = this.campagnes.findIndex(c => c.id === this.editingCampagne!.id);
      if (idx !== -1) {
        this.campagnes[idx] = { ...this.editingCampagne! };
      }
      this.fermerEditModal();
      this.loadCampagnes();
    },
    error: (err) => {
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


// ── Lien de candidature ──────────────────────────────────────────

getCandidatureUrl(campagne: Campagne): string {
  const base = window.location.origin; // ex: http://localhost:4200
  return `${base}/espace-saisonnier`;
}

copierLien(campagne: Campagne): void {
  if (this.isCampagneExpiree(campagne)) {
    this.showToast('⛔ Cette campagne est expirée !');
    return;
  }

  const url = this.getCandidatureUrl(campagne);
  navigator.clipboard.writeText(url).then(() => {
    this.showToast('✅ Lien copié !');
  });
}

ouvrirLien(campagne: Campagne): void {
  if (this.isCampagneExpiree(campagne)) {
    this.showToast('⛔ Cette campagne est expirée !');
    return;
  }

  window.open(this.getCandidatureUrl(campagne), '_blank');
}



isCampagneExpiree(campagne: Campagne): boolean {
  const now = new Date();
  const dateFin = new Date(campagne.dateFin);
  return now > dateFin;
}

// ── Toast notification ──────────────────────────────────────────
toastMessage = '';
showToastFlag = false;

showToast(msg: string): void {
  this.toastMessage = msg;
  this.showToastFlag = true;
  setTimeout(() => this.showToastFlag = false, 3000);
}

logout(): void {
  this.authService.logout();
  this.router.navigate(['/admin/login']);


}

sidebarOpen = false;

toggleSidebar(): void {
  this.sidebarOpen = !this.sidebarOpen;
}

closeSidebar(): void {
  this.sidebarOpen = false;
}
}