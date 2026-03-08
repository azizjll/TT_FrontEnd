import { Component, OnInit } from '@angular/core';
import { AuthService, Region } from 'src/app/services/auth.service';
import { CampagneService, CampagneRequestDTO } from 'src/app/services/campagne.service';
import { CandidatureService } from 'src/app/services/candidature.service';

// Interfaces
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
  nom: string; // pour l'affichage
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

@Component({
  selector: 'app-home-admin',
  templateUrl: './home-admin.component.html',
  styleUrls: ['./home-admin.component.scss']
})
export class HomeAdminComponent implements OnInit {

  activeSection: 'campagnes' | 'candidatures' | 'utilisateurs' = 'campagnes';
  showCreateModal = false;
  searchQuery = '';

  pageTitle = 'Pilotage des Campagnes';
  pageSubtitle = 'Gérez et suivez toutes vos campagnes de recrutement';

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

  regions: Region[] = [];
  regionIds: number[] | undefined

  newCampagne: Campagne = {
    id: 0,
    nom: '',
    code: '',
    dateDebut: '',
    dateFin: '',
    statut: 'brouillon',
    statutLabel: 'Brouillon',
    candidatures: 0,
    affectations: 0,
    verrouille: false,
    description: '',
    budget: '',
    regionIds: []
  };

  campagnes: Campagne[] = [];
  candidatures: Candidature[] = [];
  utilisateurs: Utilisateur[] = [];

  constructor(
    private campagneService: CampagneService,
    private authService: AuthService,
    private candidatureService: CandidatureService
  ) {}

  ngOnInit(): void {
    this.updatePageMeta();
    this.loadRegions();
    this.loadCampagnes();
    this.loadCandidatures();
  }

  loadRegions(): void {
    this.authService.getRegions().subscribe({
      next: data => this.regions = data,
      error: err => console.error('Erreur chargement régions', err)
    });
  }
onRegionChange() {

  if (this.newCampagne.regionIds?.includes(0)) {

    // remplacer par tous les ids des régions
    this.newCampagne.regionIds = this.regions.map(r => r.id);

  }

}

  loadCampagnes(): void {
  this.campagneService.getToutesCampagnes().subscribe({
    next: (data) => {
      // Mapper les champs manquants
      this.campagnes = (data as any[]).map(c => ({
        id: c.id,
        nom: c.libelle,           // nom = libelle
        code: c.code,
        dateDebut: c.dateDebut,
        dateFin: c.dateFin,
        statut: c.statut || 'brouillon',   // valeur par défaut si non fournie
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

  loadCandidatures(): void {
    this.candidatureService.getAllCandidatures().subscribe({
      next: data => this.candidatures = data,
      error: err => console.error('Erreur chargement candidatures', err)
    });
  }

  setActive(section: 'campagnes' | 'candidatures' | 'utilisateurs'): void {
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
      }
    };
    this.pageTitle = meta[this.activeSection].title;
    this.pageSubtitle = meta[this.activeSection].subtitle;
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newCampagne = {
      id: 0,
      nom: '',
      code: '',
      dateDebut: '',
      dateFin: '',
      statut: 'brouillon',
      statutLabel: 'Brouillon',
      candidatures: 0,
      affectations: 0,
      verrouille: false,
      description: '',
      budget: '',
      regionIds: []
    };
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
  regionIds: this.newCampagne.regionIds || []  // <-- important
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
}