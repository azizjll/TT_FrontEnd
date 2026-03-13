import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, Region } from 'src/app/services/auth.service';
import { Campagne, CampagneService } from 'src/app/services/campagne.service';
import { CandidatureService } from 'src/app/services/candidature.service';
import { StructureService } from 'src/app/structure.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  campagnes: Campagne[] = [];
  regions: Region[] = [];
  structures: any[] = [];

  showCandidatureModal = false;
  campagneIdSelectionnee!: number;

  form: any = {
    nom: '',
    prenom: '',
    cin: '',
    rib: '',
    telephone: '',
    email: '',
    regionId: ''
  };

  cinFile!: File;
  diplome!: File;
  contrat!: File;

  constructor(
    private campagneService: CampagneService,
    private candidatureService: CandidatureService,
      private authService: AuthService,
       private structureService: StructureService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCampagnes();
      this.loadRegions();
  }

  loadCampagnes(): void {
    this.campagneService.getToutesCampagnes().subscribe({
      next: (data) => this.campagnes = data,
      error: (err) => console.error('Erreur lors du chargement des campagnes', err)
    });
  }

loadStructuresByRegion(regionId: number) {
  this.structureService.getStructuresByRegion(regionId).subscribe({
    next: (data) => this.structures = data,
    error: (err) => console.error("Erreur chargement structures", err)
  });
}

  loadRegions() {

  this.authService.getRegions().subscribe({
    next: (data) => {
      this.regions = data;
    },
    error: (err) => {
      console.error("Erreur chargement régions", err);
    }
  });

}

  deposerCandidature(campagneId: number) {
    this.campagneIdSelectionnee = campagneId;
    this.showCandidatureModal = true;
  }

  closeModal() {
    this.showCandidatureModal = false;
  }

  onFileChange(event: any, type: string) {

    const file = event.target.files[0];

    if (type === 'cin') this.cinFile = file;
    if (type === 'diplome') this.diplome = file;
    if (type === 'contrat') this.contrat = file;

  }

  submitCandidature() {

    if (!this.cinFile || !this.diplome || !this.contrat) {
      alert("Tous les fichiers sont obligatoires");
      return;
    }

    const formData = new FormData();

    formData.append('nom', this.form.nom);
    formData.append('prenom', this.form.prenom);
    formData.append('cin', this.form.cin);
    formData.append('rib', this.form.rib);
    formData.append('telephone', this.form.telephone);
    formData.append('email', this.form.email);
    formData.append('regionId', this.form.regionId);
    formData.append('structureId', this.form.structureId); // obligatoire
    formData.append('campagneId', this.campagneIdSelectionnee.toString());

    formData.append('cinFile', this.cinFile);
    formData.append('diplome', this.diplome);
    formData.append('contrat', this.contrat);

    this.candidatureService.deposerCandidature(formData).subscribe({
      next: () => {
        alert("Candidature envoyée avec succès");
        this.closeModal();
      },
      error: err => {
        console.error(err);
        alert("Erreur lors de l'envoi");
      }
    });
  }

  ouvrirPageSaisonniers(campagneId: number) {
    this.router.navigate(['/entreprise/saisonniers'], { queryParams: { campagneId } });
  }

  isRH(): boolean {

    const token = localStorage.getItem('token');

    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles?.includes('ROLE_RH_REGIONAL');
    } catch (e) {
      return false;
    }

  }

}