import { Component, OnInit } from '@angular/core';
import { AuthService, Region } from 'src/app/services/auth.service';
import { CampagneRequestDTO, CampagneService } from 'src/app/services/campagne.service';

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
}

interface Candidature {
  id: number;
  nom: string;
  initiales: string;
  email: string;
  campagne: string;
  poste: string;
  dateDepot: string;
  score: number;
  statut: 'accepte' | 'en-attente' | 'refuse';
  statutLabel: string;
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
export class HomeAdminComponent implements OnInit{

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

newCampagne = {
  nom: '',
  code: '',
  dateDebut: '',
  dateFin: '',
  description: '',
  budget:'',
  regionIds: [] as number[]
};

  campagnes: Campagne[] = [
    {
      id: 1,
      nom: 'Recrutement Cadres Supérieurs',
      code: 'RCS-2025-01',
      dateDebut: '01/01/2025',
      dateFin: '31/03/2025',
      statut: 'active',
      statutLabel: 'Active',
      candidatures: 145,
      affectations: 32,
      verrouille: true
    },
    {
      id: 2,
      nom: 'Concours Ingénieurs État',
      code: 'CIE-2025-02',
      dateDebut: '15/02/2025',
      dateFin: '15/05/2025',
      statut: 'active',
      statutLabel: 'Active',
      candidatures: 89,
      affectations: 15,
      verrouille: false
    },
    {
      id: 3,
      nom: 'Recrutement Techniciens',
      code: 'RT-2024-04',
      dateDebut: '01/09/2024',
      dateFin: '30/11/2024',
      statut: 'termine',
      statutLabel: 'Terminée',
      candidatures: 203,
      affectations: 60,
      verrouille: true
    },
    {
      id: 4,
      nom: 'Concours Administratif 2025',
      code: 'CA-2025-03',
      dateDebut: '01/04/2025',
      dateFin: '30/06/2025',
      statut: 'planifie',
      statutLabel: 'Planifiée',
      candidatures: 0,
      affectations: 0,
      verrouille: false
    },
    {
      id: 5,
      nom: 'Recrutement Juristes',
      code: 'RJ-2025-DRAFT',
      dateDebut: '',
      dateFin: '',
      statut: 'brouillon',
      statutLabel: 'Brouillon',
      candidatures: 0,
      affectations: 0,
      verrouille: false
    }
  ];

  candidatures: Candidature[] = [
    {
      id: 1,
      nom: 'Ahmed Ben Salem',
      initiales: 'AB',
      email: 'a.bensalem@email.tn',
      campagne: 'RCS-2025-01',
      poste: 'Directeur Financier',
      dateDepot: '12/01/2025',
      score: 87,
      statut: 'accepte',
      statutLabel: 'Acceptée'
    },
    {
      id: 2,
      nom: 'Fatma Gharbi',
      initiales: 'FG',
      email: 'f.gharbi@email.tn',
      campagne: 'CIE-2025-02',
      poste: 'Ingénieur Informatique',
      dateDepot: '20/02/2025',
      score: 74,
      statut: 'en-attente',
      statutLabel: 'En attente'
    },
    {
      id: 3,
      nom: 'Mohamed Trabelsi',
      initiales: 'MT',
      email: 'm.trabelsi@email.tn',
      campagne: 'RCS-2025-01',
      poste: 'Chef de Projet',
      dateDepot: '08/01/2025',
      score: 61,
      statut: 'en-attente',
      statutLabel: 'En attente'
    },
    {
      id: 4,
      nom: 'Sonia Khelifi',
      initiales: 'SK',
      email: 's.khelifi@email.tn',
      campagne: 'RT-2024-04',
      poste: 'Technicien Supérieur',
      dateDepot: '15/09/2024',
      score: 45,
      statut: 'refuse',
      statutLabel: 'Refusée'
    },
    {
      id: 5,
      nom: 'Karim Bouazizi',
      initiales: 'KB',
      email: 'k.bouazizi@email.tn',
      campagne: 'CIE-2025-02',
      poste: 'Ingénieur Électrique',
      dateDepot: '25/02/2025',
      score: 91,
      statut: 'accepte',
      statutLabel: 'Acceptée'
    }
  ];

  utilisateurs: Utilisateur[] = [
    {
      id: 1,
      nom: 'Mansour Brahmi',
      initiales: 'MB',
      email: 'm.brahmi@gov.tn',
      role: 'Directeur Général',
      roleClass: 'dg',
      departement: 'Direction Générale',
      derniereConnexion: 'Aujourd\'hui 09:15',
      statut: 'active',
      statutLabel: 'Actif'
    },
    {
      id: 2,
      nom: 'Leila Hamrouni',
      initiales: 'LH',
      email: 'l.hamrouni@gov.tn',
      role: 'Administrateur',
      roleClass: 'admin',
      departement: 'DSI',
      derniereConnexion: 'Hier 16:42',
      statut: 'active',
      statutLabel: 'Actif'
    },
    {
      id: 3,
      nom: 'Tarek Oueslati',
      initiales: 'TO',
      email: 't.oueslati@gov.tn',
      role: 'Évaluateur',
      roleClass: 'evaluateur',
      departement: 'RH',
      derniereConnexion: '22/02/2025',
      statut: 'active',
      statutLabel: 'Actif'
    },
    {
      id: 4,
      nom: 'Ines Mejri',
      initiales: 'IM',
      email: 'i.mejri@gov.tn',
      role: 'Évaluateur',
      roleClass: 'evaluateur',
      departement: 'Finances',
      derniereConnexion: '20/02/2025',
      statut: 'active',
      statutLabel: 'Actif'
    },
    {
      id: 5,
      nom: 'Ahmed Ben Salem',
      initiales: 'AB',
      email: 'a.bensalem@email.tn',
      role: 'Candidat',
      roleClass: 'candidat',
      departement: 'Externe',
      derniereConnexion: '12/01/2025',
      statut: 'active',
      statutLabel: 'Actif'
    },
    {
      id: 6,
      nom: 'Hamdi Cherni',
      initiales: 'HC',
      email: 'h.cherni@gov.tn',
      role: 'Administrateur',
      roleClass: 'admin',
      departement: 'Communication',
      derniereConnexion: '10/01/2025',
      statut: 'inactive',
      statutLabel: 'Inactif'
    }
  ];

  constructor(
  private campagneService: CampagneService,
  private authService: AuthService
) {}

  ngOnInit(): void {
  this.updatePageMeta();
  this.loadRegions();
  this.loadCampagnes();
}


  loadRegions(): void {
  this.authService.getRegions().subscribe({
    next: data => this.regions = data,
    error: err => console.error('Erreur chargement régions', err)
  });
}

loadCampagnes(): void {
  this.campagneService.getToutesCampagnes().subscribe({
    next: data => this.campagnes = data as any,
    error: err => console.error('Erreur chargement campagnes', err)
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
    this.pageTitle    = meta[this.activeSection].title;
    this.pageSubtitle = meta[this.activeSection].subtitle;
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.newCampagne = { nom: '', code: '', dateDebut: '', dateFin: '', description: '',budget:'', regionIds: [] };
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
    code: this.newCampagne.code|| `CAM-${Date.now()}`,
    dateDebut: this.newCampagne.dateDebut,
    dateFin: this.newCampagne.dateFin,
    description: this.newCampagne.description,
    regionIds: this.newCampagne.regionIds
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