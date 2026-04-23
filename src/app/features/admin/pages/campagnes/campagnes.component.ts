import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService, Region } from 'src/app/services/auth.service';
import { CampagneRequestDTO, CampagneService } from 'src/app/services/campagne.service';
import { Candidature, CandidatureService } from 'src/app/services/candidature.service';
import { DocumentCampagneDTO, DocumentCampagneService } from 'src/app/services/document-campagne.service';
import { DocumentService } from 'src/app/services/document.service';
import { StructureImportService } from 'src/app/services/structure-import.service';
import { StructureService } from 'src/app/structure.service';



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
@Component({
  selector: 'app-campagnes',
  templateUrl: './campagnes.component.html',
  styleUrls: ['./campagnes.component.scss']
})
export class CampagnesComponent {

  /** Liste des régions disponibles (chargées depuis l'API) */
  regions: Region[] = [];
 
  /** Liste complète des campagnes */
  campagnes: Campagne[] = [];
 
  /** Objet campagne en cours de création */
  newCampagne: Campagne = this.emptyNewCampagne();
 
  /** Année saisie lors de la création d'une nouvelle campagne */
  newCampagneAnnee: number = new Date().getFullYear();
 
  /** Fichier Excel des structures lié à la création de campagne */
  campagneExcelFile: File | null = null;
 
  /** Indicateur de survol drag-and-drop (zone Excel) */
  campagneExcelDragOver = false;
 
  /** Régions détectées à partir du fichier Excel (prévisualisation) */
  regionsDetectees: string[] = [];
 
  /** Indicateur de chargement lors de la sauvegarde de la campagne */
  isSavingCampagne = false;
 
  /** Indicateur de chargement général */
  isLoading = false;
 
  /** Affiche l'avertissement si une campagne est déjà active */
  showActiveCampagneWarning = false;
 
  /** Nom de la campagne active existante (pour message d'avertissement) */
  activeCampagneNom = '';
 
  // ── Modales Campagnes ────────────────────────────────────────────
 
  /** Affichage de la modale de création */
  showCreateModal = false;
 
  /** Affichage de la modale de visualisation */
  showViewModal = false;
 
  /** Campagne en cours de visualisation */
  viewingCampagne: Campagne | null = null;
 
  /** Candidatures de la campagne consultée */
  viewingCampagneCandidatures: Candidature[] = [];
 
  /** Affichage de la modale de modification */
  showEditModal = false;
 
  /** Campagne en cours de modification */
  editingCampagne: Campagne | null = null;
 
  // ── Documents liés à la campagne (création) ──────────────────────
 
  /** Documents en attente d'upload lors de la création d'une campagne */
  documentsPendants: Array<{ file: File; nom: string; type: string }> = [];
 
  /** Documents associés à la campagne sélectionnée */
  documentsCampagne: DocumentCampagneDTO[] = [];
 
  /** Fichier document sélectionné pour upload */
  documentFile: File | null = null;
 
  /** Nom du document à uploader */
  documentNom = '';
 
  /** Type du document (valeur par défaut : مذكرة الإنتداب) */
  documentType = 'مذكرة الإنتداب';
 
  /** Indicateur d'upload du document en cours */
  isUploadingDoc = false;

  // ── Upload Excel des parents (pour import saisonniers) ────────────
 
  /** Fichier Excel des parents à importer */
  parentsExcelFile: File | null = null;
 
  /** Indicateur de survol drag-and-drop (zone parents Excel) */
  parentsExcelDragOver = false;
 
  /** Indicateur d'upload en cours */
  isUploadingParents = false;
 
  /** Indicateur de succès de l'upload parents */
  parentsUploadSuccess = false;


   // ──────────────────────────────────────────────────────────────────
  //  TOAST NOTIFICATION
  // ──────────────────────────────────────────────────────────────────
 
  /** Message affiché dans le toast */
  toastMessage = '';
 
  /** Contrôle la visibilité du toast */
  showToastFlag = false;

  // ──────────────────────────────────────────────────────────────────
  //  STATISTIQUES GLOBALES
  // ──────────────────────────────────────────────────────────────────
 
  /** Compteurs affichés dans le tableau de bord */
  stats = {
    campagnesActives       : 4,
    campagnesTotal         : 12,
    affectationsVerrouillees: 87,
    joursRestants          : 18,
    totalCandidatures      : 342,
    candidaturesAcceptees  : 128,
    candidaturesEnAttente  : 156,
    candidaturesRefusees   : 58
  };
 

  // ════════════════════════════════════════════════════════════════════
  //  CONSTRUCTOR
  // ════════════════════════════════════════════════════════════════════
 
  constructor(
    private campagneService     : CampagneService,
    private authService         : AuthService,
    private candidatureService  : CandidatureService,
    private sanitizer           : DomSanitizer,
    private documentService     : DocumentService,
    private structureimportService: StructureImportService,
    private structureService    : StructureService,
    private router              : Router,
    private docCampagneService  : DocumentCampagneService,
  ) {}
 
  // ════════════════════════════════════════════════════════════════════
  //  LIFECYCLE
  // ════════════════════════════════════════════════════════════════════
 ngOnInit(): void {
    
    this.loadCampagnes();
    
   
  }
  


  // ── Helpers campagne ─────────────────────────────────────────────
 
  /** Retourne un objet campagne vide avec des valeurs par défaut */
  private emptyNewCampagne(): Campagne {
    const annee   = new Date().getFullYear();
    const codeAuto = `CAM-${annee}-${String(Date.now()).slice(-4)}`;
    return {
      id: 0, nom: `Campagne de recrutement des saisonniers pour ${annee}`,
      code: codeAuto, dateDebut: '', dateFin: '',
      statut: 'brouillon', statutLabel: 'Brouillon',
      candidatures: 0, affectations: 0, verrouille: false,
      description: '', budget: '', regionIds: []
    };
  }
 
  /** Met à jour nom et code quand l'année est modifiée */
  onAnneeChange(): void {
    this.newCampagne.nom  = `Campagne de recrutement des saisonniers pour ${this.newCampagneAnnee}`;
    this.newCampagne.code = `CAM-${this.newCampagneAnnee}-${String(Date.now()).slice(-4)}`;
  }
 
  /** Retourne l'URL publique de candidature (espace saisonnier) */
  getCandidatureUrl(campagne: Campagne): string {
    return `${window.location.origin}/espace-saisonnier`;
  }
 
  /** Copie l'URL de candidature dans le presse-papier */
  copierLien(campagne: Campagne): void {
    const url = this.getCandidatureUrl(campagne);
    navigator.clipboard.writeText(url)
      .then(() => this.showToast('✅ Lien copié dans le presse-papier !'))
      .catch(() => {
        const el = document.createElement('textarea');
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        this.showToast('✅ Lien copié !');
      });
  }
 
  /** Ouvre l'espace saisonnier dans un nouvel onglet */
  ouvrirLien(campagne: Campagne): void {
    window.open(this.getCandidatureUrl(campagne), '_blank');
  }

  // ── Excel structures (création campagne) ─────────────────────────
 
  /** Gère la sélection d'un fichier Excel pour les structures */
  onCampagneExcelSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) { this.campagneExcelFile = file; this.lireRegionsExcel(file); }
  }
 
  /** Gère le dépôt drag-and-drop d'un fichier Excel structures */
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
 
  /**
   * Lit le fichier Excel côté frontend (SheetJS) pour extraire
   * les régions et afficher un aperçu avant création.
   */
  lireRegionsExcel(file: File): void {
    this.regionsDetectees = [];
    import('xlsx').then(XLSX => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data     = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
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
    }).catch(() => { this.regionsDetectees = []; });
  }
 
  /** Gère la sélection d'un fichier Excel parents */
  onParentsExcelSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.parentsExcelFile = file;
  }
 
  /** Gère le dépôt drag-and-drop d'un fichier Excel parents */
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
 
  // ── Documents pendants (lors de la création) ─────────────────────
 
  /** Ajoute un document à la liste des documents à uploader lors de la création */
  onDocumentPendantSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.documentsPendants.push({ file, nom: file.name.replace(/\.[^.]+$/, ''), type: 'مذكرة الإنتداب' });
    (event.target as HTMLInputElement).value = '';
  }
 
  /** Supprime un document de la liste des documents pendants */
  supprimerDocumentPendant(index: number): void { this.documentsPendants.splice(index, 1); }
 
  /** Met à jour le nom d'un document pendant */
  updateDocumentPendantNom(index: number, nom: string): void { this.documentsPendants[index].nom = nom; }
 
  /** Met à jour le type d'un document pendant */
  updateDocumentPendantType(index: number, type: string): void { this.documentsPendants[index].type = type; }
 


  /** Ouvre la modale de création (réinitialise tous les champs) */
 
 
  /** Ferme la modale de création */
  
 
  /** Ouvre la modale de modification d'une campagne */
  ouvrirModifierCampagne(campagne: Campagne): void {
    this.editingCampagne = { ...campagne };
    this.showEditModal = true;
  }
 
  /** Ferme la modale de modification */
  fermerEditModal(): void {
    this.showEditModal  = false;
    this.editingCampagne = null;
  }
 
  /** Ferme le bandeau d'avertissement campagne déjà active */
  fermerWarning(): void {
    this.showActiveCampagneWarning = false;
  }
 

    /** Active le premier brouillon ou campagne planifiée trouvée */
  activerCampagne(): void {
    const brouillon = this.campagnes.find(c => c.statut === 'brouillon' || c.statut === 'planifie');
    if (brouillon) {
      brouillon.statut      = 'active';
      brouillon.statutLabel = 'Active';
      this.stats.campagnesActives++;
    }
  }

 

   /** Ouvre la modale de visualisation d'une campagne */
  ouvrirVoirCampagne(campagne: Campagne): void {
    this.viewingCampagne = { ...campagne };
    this.showViewModal = true;
  }
 
  /** Ferme la modale de visualisation */
  fermerVoirModal(): void {
    this.showViewModal = false;
    this.viewingCampagne = null;
    this.viewingCampagneCandidatures = [];
  }
 
  /** Ouvre la modale de création (réinitialise tous les champs) */
  openCreateModal(): void {
    this.showCreateModal = true;
    this.newCampagne        = this.emptyNewCampagne();
    this.campagneExcelFile  = null;
    this.regionsDetectees   = [];
    this.isSavingCampagne   = false;
    this.documentsPendants  = [];
    this.parentsExcelFile   = null;
  }
 
  /** Ferme la modale de création */
  closeModal(): void {
    this.showCreateModal    = false;
    this.campagneExcelFile  = null;
    this.regionsDetectees   = [];
    this.isSavingCampagne   = false;
    this.documentsPendants  = [];
    this.parentsExcelFile   = null;
  }
 
  
 
  

  // ── Création campagne ────────────────────────────────────────────
 
  /**
   * Sauvegarde une nouvelle campagne.
   * - Importe les parents (si fourni) avant de créer la campagne.
   * - Crée la campagne avec le fichier Excel des structures.
   * - Upload les documents pendants puis active si demandé.
   * @param activer Si true, la campagne est activée immédiatement après création.
   */
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
 
    const creerCampagne$ = () => {
      const dto: CampagneRequestDTO = {
        libelle    : this.newCampagne.nom,
        code       : this.newCampagne.code,
        dateDebut  : this.newCampagne.dateDebut,
        dateFin    : this.newCampagne.dateFin,
        description: this.newCampagne.description,
        budget     : this.newCampagne.budget ? Number(this.newCampagne.budget) : undefined,
        regionIds  : []
      };
 
      this.campagneService.creerCampagneAvecExcel(dto, this.campagneExcelFile!).subscribe({
        next : (campagneCreee) => { this.uploaderDocumentsPendants(campagneCreee.id, activer); },
        error: (err) => {
          console.error(err);
          alert('Erreur lors de la création de la campagne');
          this.isSavingCampagne = false;
        }
      });
    };
 
    // Upload parents avant la création si un fichier est fourni
    if (this.parentsExcelFile) {
      this.candidatureService.uploadParentsExcel(this.parentsExcelFile).subscribe({
        next : () => { this.showToast('✅ Parents importés avec succès'); creerCampagne$(); },
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
 
  /**
   * Upload en parallèle (forkJoin) tous les documents attachés lors de la création.
   * Passe à la finalisation même en cas d'erreur sur les documents.
   */
  private uploaderDocumentsPendants(campagneId: number, activer: boolean): void {
    if (this.documentsPendants.length === 0) {
      this.finaliserCreation(campagneId, activer);
      return;
    }
 
    const uploads$ = this.documentsPendants.map(doc =>
      this.docCampagneService.uploadDocument(campagneId, doc.nom, doc.type, doc.file)
    );
 
    forkJoin(uploads$).subscribe({
      next : () => { this.finaliserCreation(campagneId, activer); },
      error: (err) => {
        console.error('Erreur upload documents:', err);
        this.showToast('⚠️ Campagne créée mais erreur sur certains documents');
        this.finaliserCreation(campagneId, activer);
      }
    });
  }
 
  /** Active la campagne si demandé puis ferme la modale et recharge la liste */
  private finaliserCreation(campagneId: number, activer: boolean): void {
    if (activer) {
      this.campagneService.activerCampagne(campagneId).subscribe({
        next : () => { this.loadCampagnes(); this.closeModal(); this.isSavingCampagne = false; this.showToast('✅ Campagne créée et activée avec succès'); },
        error: ()  => { this.loadCampagnes(); this.closeModal(); this.isSavingCampagne = false; }
      });
    } else {
      this.loadCampagnes();
      this.closeModal();
      this.isSavingCampagne = false;
      this.showToast('✅ Campagne créée avec succès');
    }
  }
 
  /**
   * Clôture toutes les campagnes actives puis relance la création.
   * Appelé depuis le bandeau d'avertissement.
   */
  cloturerEtActiver(): void {
    const actives = this.campagnes.filter(c => c.statut === 'active');
    actives.forEach(camp => {
      this.campagneService.cloturerCampagne(camp.id).subscribe({
        next : () => { camp.statut = 'termine'; camp.statutLabel = 'Clôturée'; this.stats.campagnesActives--; },
        error: err => console.error(err)
      });
    });
    this.showActiveCampagneWarning = false;
    setTimeout(() => this.saveCampagne(true), 500);
  }
 
  // ── Modification campagne ────────────────────────────────────────
 
  /**
   * Envoie les modifications d'une campagne au backend.
   * Mappe le statut local vers le statut attendu par l'API.
   */
  sauvegarderModificationCampagne(): void {
    if (!this.editingCampagne) return;
    if (!this.editingCampagne.nom || !this.editingCampagne.dateDebut || !this.editingCampagne.dateFin) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
 
    const statutBackendMap: Record<string, string> = {
      'active'   : 'ACTIVE',
      'brouillon': 'BROUILLON',
      'termine'  : 'CLOTUREE',
    };
 
    const dto: CampagneRequestDTO = {
      libelle    : this.editingCampagne.nom,
      code       : this.editingCampagne.code,
      dateDebut  : this.editingCampagne.dateDebut,
      dateFin    : this.editingCampagne.dateFin,
      description: this.editingCampagne.description,
      regionIds  : this.editingCampagne.regionIds || [],
      statut     : statutBackendMap[this.editingCampagne.statut] || 'BROUILLON'
    };
 
    this.campagneService.updateCampagne(this.editingCampagne.id, dto).subscribe({
      next: () => {
        const idx = this.campagnes.findIndex(c => c.id === this.editingCampagne!.id);
        if (idx !== -1) { this.campagnes[idx] = { ...this.editingCampagne! }; }
        this.fermerEditModal();
        this.loadCampagnes();
      },
      error: (err) => { console.error(err); alert('Erreur lors de la modification'); }
    });
  }
 
  /**
   * Change le statut d'une campagne depuis la modale de modification.
   * Vérifie qu'aucune autre campagne n'est déjà active avant d'activer.
   */
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
      'ACTIVE'   : { statut: 'active',    label: 'Active'    },
      'BROUILLON': { statut: 'brouillon', label: 'Brouillon' },
      'CLOTUREE' : { statut: 'termine',   label: 'Clôturée'  },
    };
 
    const info = statutMap[nouveauStatut];
    if (info) {
      this.editingCampagne.statut      = info.statut;
      this.editingCampagne.statutLabel = info.label;
    }
  }
 
  /** Active le premier brouillon ou campagne planifiée trouvée */
 
 
  /** Bascule le verrouillage des affectations d'une campagne */
  toggleVerrouillage(campagne: Campagne): void {
    campagne.verrouille = !campagne.verrouille;
    if (campagne.verrouille) {
      this.stats.affectationsVerrouillees += campagne.affectations;
    } else {
      this.stats.affectationsVerrouillees -= campagne.affectations;
    }
  }
 


  /**
   * Charge toutes les campagnes de l'utilisateur connecté.
   * Mappe les statuts backend (ACTIVE, BROUILLON, CLOTUREE) vers les statuts locaux.
   * Met à jour automatiquement le nombre de candidatures par campagne.
   */
  loadCampagnes(): void {
    this.campagneService.getMesCampagnes().subscribe({
      next: (data) => {
        this.campagnes = (data as any[]).map(c => {
          const statutMap: Record<string, { statut: Campagne['statut'], label: string }> = {
            'BROUILLON': { statut: 'brouillon', label: 'Brouillon' },
            'ACTIVE'   : { statut: 'active',    label: 'Active'    },
            'CLOTUREE' : { statut: 'termine',   label: 'Clôturée'  },
          };
          const statutKey  = (c.statut || 'BROUILLON').toUpperCase();
          const statutInfo = statutMap[statutKey] ?? { statut: 'brouillon', label: 'Brouillon' };
 
          return {
            id          : c.id,
            nom         : c.libelle,
            code        : c.code,
            dateDebut   : c.dateDebut,
            dateFin     : c.dateFin,
            statut      : statutInfo.statut,
            statutLabel : statutInfo.label,
            candidatures: c.candidatures || 0,
            affectations: c.affectations || 0,
            verrouille  : c.verrouille   || false,
            description : c.description  || '',
            budget      : c.budget       || '',
            regionIds   : c.regionIds    || []
          };
        });
 
        // Définir la campagne par défaut pour la section Présence
        
 
      },
      error: err => console.error('Erreur chargement campagnes', err)
    });
  }
 
  /** Sélectionne "Toutes les régions" quand l'option 0 est choisie */
  onRegionChange(): void {
    if (this.newCampagne.regionIds?.includes(0)) {
      this.newCampagne.regionIds = this.regions.map(r => r.id);
    }
  }
 
  /** Ferme le bandeau d'avertissement campagne déjà active */
 

  // ════════════════════════════════════════════════════════════════════
  //  TOAST NOTIFICATION
  // ════════════════════════════════════════════════════════════════════
 
  /**
   * Affiche un message toast pendant 3 secondes.
   * Utilisé pour les confirmations d'actions (succès / erreur).
   */
  showToast(msg: string): void {
    this.toastMessage   = msg;
    this.showToastFlag  = true;
    setTimeout(() => this.showToastFlag = false, 3000);
  }
  


}
