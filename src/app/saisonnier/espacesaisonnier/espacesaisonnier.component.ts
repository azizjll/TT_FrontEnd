import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { CandidatureService } from 'src/app/services/candidature.service';


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
@Component({
  selector: 'app-espacesaisonnier',
  templateUrl: './espacesaisonnier.component.html',
  styleUrls: ['./espacesaisonnier.component.scss'],


animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('420ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(80, animate('360ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})


export class EspacesaisonnierComponent implements OnInit {
 
  activeTab: 'candidatures' | 'documents' | 'profil' | 'notifications' = 'candidatures';
  filterStatut: string = 'TOUS';
  searchQuery: string = '';
  showDetailModal: boolean = false;
  selectedCandidature: Candidature | null = null;
  notificationCount: number = 3;
  saisonnier: any = {};
 
  
 
  candidatures: Candidature[] = [
    {
      id: 1,
      campagne: 'Récolte Fraises 2025',
      entreprise: 'Domaine Beaupré',
      localisation: 'Provence-Alpes-Côte d\'Azur',
      datePostulation: '10/03/2025',
      dateDebut: '15/06/2025',
      dateFin: '15/09/2025',
      statut: 'ACCEPTEE',
      poste: 'Cueilleur saisonnier',
      salaire: '1 500 € / mois',
      message: 'Bienvenue ! Votre dossier a été validé. Veuillez confirmer votre disponibilité.'
    },
    {
      id: 2,
      campagne: 'Vendanges Bourgogne 2025',
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
      campagne: 'Maraîchage Bretagne 2024',
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
      campagne: 'Récolte Pommes Normandie',
      entreprise: 'Les Vergers du Val',
      localisation: 'Normandie',
      datePostulation: '20/02/2025',
      dateDebut: '15/08/2025',
      dateFin: '15/11/2025',
      statut: 'REFUSEE',
      poste: 'Récolteur',
      message: 'Votre profil ne correspond pas aux critères requis pour cette campagne.'
    }
  ];
 
  documents: Document[] = [
    { id: 1, nom: 'Passeport', type: 'Identité', dateAjout: '01/02/2025', statut: 'VALIDE', taille: '2.4 MB' },
    { id: 2, nom: 'CV 2025', type: 'Professionnel', dateAjout: '10/01/2025', statut: 'VALIDE', taille: '540 KB' },
    { id: 3, nom: 'Permis de conduire', type: 'Identité', dateAjout: '01/02/2025', statut: 'VALIDE', taille: '1.1 MB' },
    { id: 4, nom: 'Attestation hébergement', type: 'Logement', dateAjout: '15/02/2025', statut: 'EN_ATTENTE', taille: '320 KB' },
    { id: 5, nom: 'Certificat médical', type: 'Santé', dateAjout: '10/11/2024', statut: 'EXPIRE', taille: '890 KB' },
  ];
 
  notifications = [
    { id: 1, message: 'Votre candidature "Récolte Fraises 2025" a été acceptée !', date: 'Il y a 2h', lu: false, type: 'success' },
    { id: 2, message: 'Document "Attestation hébergement" en cours de vérification', date: 'Il y a 1 jour', lu: false, type: 'info' },
    { id: 3, message: 'Rappel : Confirmation requise avant le 20/03/2025', date: 'Il y a 2 jours', lu: false, type: 'warning' },
    { id: 4, message: 'Nouvelle campagne disponible dans votre région', date: 'Il y a 3 jours', lu: true, type: 'info' },
  ];
 
  constructor(private candidatureService: CandidatureService) {}

  ngOnInit(): void {
  const saisonnierId = 4; // ⚠️ remplace par ID réel (login plus tard)

  // 🔹 récupérer profil
  this.candidatureService.getSaisonnierById(saisonnierId)
    .subscribe((data) => {
      this.saisonnier = data;
    });
  this.candidatureService.getDocumentsBySaisonnier(saisonnierId)
    .subscribe((data) => {
      this.documents = data.map(doc => ({
        id: doc.id,
        nom: doc.nomFichier,
        type: doc.type,
        dateAjout: '', // tu peux ajouter côté backend si besoin
        statut: 'VALIDE', // ou logique métier
        taille: '' // optionne
      }));
    });
}
 
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
      total: this.candidatures.length,
      acceptees: this.candidatures.filter(c => c.statut === 'ACCEPTEE').length,
      enAttente: this.candidatures.filter(c => c.statut === 'EN_ATTENTE').length,
      enCours: this.candidatures.filter(c => c.statut === 'EN_COURS').length,
      refusees: this.candidatures.filter(c => c.statut === 'REFUSEE').length,
    };
  }
 
  setTab(tab: 'candidatures' | 'documents' | 'profil' | 'notifications'): void {
    this.activeTab = tab;
  }
 
  setFilter(statut: string): void {
    this.filterStatut = statut;
  }
 
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
      'ACCEPTEE': 'Acceptée',
      'EN_ATTENTE': 'En attente',
      'REFUSEE': 'Refusée',
      'EN_COURS': 'En cours'
    };
    return labels[statut] || statut;
  }
 
  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'ACCEPTEE': 'statut-acceptee',
      'EN_ATTENTE': 'statut-attente',
      'REFUSEE': 'statut-refusee',
      'EN_COURS': 'statut-encours'
    };
    return classes[statut] || '';
  }
 
  getDocStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'VALIDE': 'doc-valide',
      'EN_ATTENTE': 'doc-attente',
      'EXPIRE': 'doc-expire'
    };
    return classes[statut] || '';
  }
 
  markAllRead(): void {
    this.notifications.forEach(n => n.lu = true);
    this.notificationCount = 0;
  }
 
  getInitials(): string {
    return `${this.saisonnier.prenom[0]}${this.saisonnier.nom[0]}`;
  }}
