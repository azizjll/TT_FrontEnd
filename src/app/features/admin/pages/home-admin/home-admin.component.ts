import { Component, OnInit, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService, Region } from 'src/app/services/auth.service';
import { CampagneService, CampagneRequestDTO } from 'src/app/services/campagne.service';
import { CandidatureService } from 'src/app/services/candidature.service';
import { DocumentService } from 'src/app/services/document.service';
import { StructureDTO, StructureImportService } from 'src/app/services/structure-import.service';

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
  statut: 'active' | 'termine' | 'brouillon' | 'planifie';
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

// ─── Component ────────────────────────────────────────────────────

@Component({
  selector: 'app-home-admin',
  templateUrl: './home-admin.component.html',
  styleUrls: ['./home-admin.component.scss']
})
export class HomeAdminComponent implements OnInit {

  // ── Navigation ──────────────────────────────────────────────────
  activeSection: 'campagnes' | 'candidatures' | 'utilisateurs' | 'memo' | 'structures' = 'campagnes';
  searchQuery = '';
  pageTitle = 'Pilotage des Campagnes';
  pageSubtitle = 'Gérez et suivez toutes vos campagnes de recrutement';

  // ── Modal flags ──────────────────────────────────────────────────
  showCreateModal = false;
  showMemoUploadModal = false;
  showStructureUploadModal = false;
  showEditStructureModal = false;

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

  // ─── Constructor ──────────────────────────────────────────────────

  constructor(
    private campagneService: CampagneService,
    private authService: AuthService,
    private candidatureService: CandidatureService,
     private sanitizer: DomSanitizer,
      private documentService: DocumentService,
      private structureimportService: StructureImportService,
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────────────

  ngOnInit(): void {
    this.updatePageMeta();
    this.loadRegions();
    this.loadCampagnes();
    this.loadCandidatures();
    this.buildGouvernorats();
    this.applyStructureFilter();
      this.loadCirculaireFromServer(); // ← ajouter
      this.loadStructures();

  }

  loadStructures(): void {
  this.structureimportService.getAll().subscribe({
    next: (data: StructureDTO[]) => {
      this.structures = data.map(s => ({ ...s, isFirstInGov: false }));
      this.buildGouvernorats();
      this.applyStructureFilter();
      this.updateStructuresStats();
    },
    error: err => console.error('Erreur chargement structures', err)
  });
}

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

  // ─── Navigation ───────────────────────────────────────────────────

  setActive(section: 'campagnes' | 'candidatures' | 'utilisateurs' | 'memo' | 'structures'): void {
    this.activeSection = section;
    this.updatePageMeta();
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
    this.campagneService.getToutesCampagnes().subscribe({
      next: (data) => {
        this.campagnes = (data as any[]).map(c => ({
          id: c.id,
          nom: c.libelle,
          code: c.code,
          dateDebut: c.dateDebut,
          dateFin: c.dateFin,
          statut: c.statut || 'brouillon',
          statutLabel: c.statutLabel || 'Brouillon',
          candidatures: c.candidatures || 0,
          affectations: c.affectations || 0,
          verrouille: c.verrouille || false,
          description: c.description || '',
          budget: c.budget || '',
          regionIds: c.regionIds || []
        }));
      },
      error: err => console.error('Erreur chargement campagnes', err)
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newCampagne = this.emptyNewCampagne();
  }

  closeModal(): void {
    this.showCreateModal = false;
  }

  saveCampagne(activer: boolean): void {
    if (!this.newCampagne.nom || !this.newCampagne.dateDebut || !this.newCampagne.dateFin) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    const dto: CampagneRequestDTO = {
      libelle: this.newCampagne.nom,
      code: this.newCampagne.code || `CAM-${Date.now()}`,
      dateDebut: this.newCampagne.dateDebut,
      dateFin: this.newCampagne.dateFin,
      description: this.newCampagne.description,
      regionIds: this.newCampagne.regionIds || []
    };
    this.campagneService.creerCampagne(dto).subscribe({
      next: res => {
        if (activer) {
          this.campagneService.activerCampagne(res.id).subscribe();
        }
        this.loadCampagnes();
        this.closeModal();
      },
      error: err => {
        console.error(err);
        alert('Erreur lors de la création de la campagne');
      }
    });
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
    return {
      id: 0, nom: '', code: '', dateDebut: '', dateFin: '',
      statut: 'brouillon', statutLabel: 'Brouillon',
      candidatures: 0, affectations: 0, verrouille: false,
      description: '', budget: '', regionIds: []
    };
  }

  // ─── Candidatures ─────────────────────────────────────────────────

  loadCandidatures(): void {
    this.candidatureService.getAllCandidatures().subscribe({
      next: data => this.candidatures = data,
      error: err => console.error('Erreur chargement candidatures', err)
    });
  }

  // ─── Memo Intidab ─────────────────────────────────────────────────

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

  // Ajoutez les méthodes zoom :
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

  buildGouvernorats(): void {
    const govMap: Record<string, number> = {};
    this.structures.forEach(s => {
      govMap[s.region] = (govMap[s.region] || 0) + 1;
    });
    this.gouvernorats = Object.entries(govMap).map(([nom, count]) => ({ nom, count }));
  }

applyStructureFilter(): void {
  let list = [...this.structures];

  // Filtre par type
  if (this.structureTypeFilter !== 'tous') {
    list = list.filter(s => s.type === this.structureTypeFilter);
  }

  // Filtre par gouvernorat sélectionné
  if (this.selectedGouvernorat) {
    list = list.filter(s => s.region === this.selectedGouvernorat);
  }

  // ← TRIER par gouvernorat d'abord pour que isFirstInGov soit correct
list.sort((a, b) => (a.region ?? '').localeCompare(b.region ?? ''));

  // Marquer la première occurrence de chaque gouvernorat
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
    // In a real app: call backend to generate XLSX
    // this.structureService.exportXlsx().subscribe(blob => saveAs(blob, 'structures_2025.xlsx'));
    alert('Export XLSX — à connecter au service backend.');
  }

  toggleStructureView(): void {
    // Toggle between grouped / flat view if needed
  }

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
      this.loadStructures();  // ← recharge tableau automatiquement
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
    const idx = this.structures.findIndex(s => s.id === this.editingStructure!.id);
    if (idx !== -1) {
      this.structures[idx] = { ...this.editingStructure };
      this.buildGouvernorats();
      this.applyStructureFilter();
      this.updateStructuresStats();
    }
    this.closeEditStructureModal();
  }

  private updateStructuresStats(): void {
    this.structuresStats.total = this.structures.length;
    this.structuresStats.espacesCommerciaux = this.structures.filter(s => s.type === 'EC').length;
    this.structuresStats.centresTechnologiques = this.structures.filter(s => s.type === 'CT').length;
    this.structuresStats.saisonnersAutorises = this.structures.reduce((sum, s) => sum + s.autorises, 0);
    this.structuresStats.saisonnersRecrutes = this.structures.reduce((sum, s) => sum + s.recrutes, 0);
  }


  
}