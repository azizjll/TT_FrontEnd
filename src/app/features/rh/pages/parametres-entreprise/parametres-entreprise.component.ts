import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Campagne, CampagneService } from 'src/app/services/campagne.service';

@Component({
  selector: 'app-parametres-entreprise',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametres-entreprise.component.html',
  styleUrls: ['./parametres-entreprise.component.scss']
})
export class ParametresEntrepriseComponent implements OnInit {

  campagnes: Campagne[] = [];
  isLoading = true;
  messageSucces = '';
  messageErreur = '';

  constructor(private campagneService: CampagneService) {}

  ngOnInit(): void {
    this.campagneService.getToutesCampagnes().subscribe({
      next: (data) => {
        this.campagnes = data;
        this.isLoading = false;
      },
      error: () => {
        this.messageErreur = 'Impossible de charger les campagnes.';
        this.isLoading = false;
      }
    });
  }

  activer(id: number): void {
    this.messageSucces = '';
    this.messageErreur = '';
    this.campagneService.activerCampagne(id).subscribe({
      next: (updated) => {
        const index = this.campagnes.findIndex(c => c.id === id);
        if (index !== -1) this.campagnes[index] = updated;
        this.messageSucces = 'Campagne activée avec succès.';
      },
      error: () => this.messageErreur = 'Erreur lors de l\'activation.'
    });
  }

  cloturer(id: number): void {
    this.messageSucces = '';
    this.messageErreur = '';
    this.campagneService.cloturerCampagne(id).subscribe({
      next: (updated) => {
        const index = this.campagnes.findIndex(c => c.id === id);
        if (index !== -1) this.campagnes[index] = updated;
        this.messageSucces = 'Campagne clôturée avec succès.';
      },
      error: () => this.messageErreur = 'Erreur lors de la clôture.'
    });
  }

  supprimer(id: number): void {
    this.messageSucces = '';
    this.messageErreur = '';
    this.campagneService.deleteCampagne(id).subscribe({
      next: () => {
        this.campagnes = this.campagnes.filter(c => c.id !== id);
        this.messageSucces = 'Campagne supprimée avec succès.';
      },
      error: () => this.messageErreur = 'Erreur lors de la suppression.'
    });
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ACTIVE':    return 'statut-active';
      case 'BROUILLON': return 'statut-brouillon';
      case 'CLOTUREE':  return 'statut-cloturee';
      default:          return '';
    }
  }
}