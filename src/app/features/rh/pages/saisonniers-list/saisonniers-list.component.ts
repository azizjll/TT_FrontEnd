import { Component } from '@angular/core';

@Component({
  selector: 'app-saisonniers-list',
  templateUrl: './saisonniers-list.component.html',
  styleUrls: ['./saisonniers-list.component.scss']
})
export class SaisonniersListComponent {

  showModal = false;
  activeTab: 'collaborateur' | 'dossier' = 'collaborateur';

  openModal() {
    this.showModal = true;
    this.activeTab = 'collaborateur';
  }

  closeModal() {
    this.showModal = false;
  }

  setTab(tab: 'collaborateur' | 'dossier') {
    this.activeTab = tab;
  }
}