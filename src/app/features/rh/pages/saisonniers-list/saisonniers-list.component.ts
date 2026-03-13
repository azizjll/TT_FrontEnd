import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AffectationService } from 'src/app/services/affectation.service';
import { AuthService, Region } from 'src/app/services/auth.service';
import { CandidatureService } from 'src/app/services/candidature.service';
import { StructureService } from 'src/app/structure.service';

export interface Structure {
  id: number;
  nom: string;
  type: 'ESPACE_COMMERCIAL' | 'CENTRE_TECHNOLOGIQUE';
   regionId: number;
  adresse?: string;
  affectations?: any[];
}

@Component({
  selector: 'app-saisonniers-list',
  templateUrl: './saisonniers-list.component.html',
  styleUrls: ['./saisonniers-list.component.scss']
})
export class SaisonniersListComponent implements OnInit {

  showModal = false;
  activeTab: 'collaborateur' | 'dossier' = 'collaborateur';

  campagneId!: number;

  candidatures: any[] = []; // stocke les candidatures filtrées
  selectedCandidature: any = null; // pour popup dossier
  showDossierModal = false;

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

  regions: Region[] = []; // toutes les régions
  myRegion!: Region;      // région du RH connecté

  structuresCommerciaux: Structure[] = [];
  structuresTech: Structure[] = [];

  selectedCandidatureForAffect: any = null;
  showAffectModal = false;
  structures: Structure[] = [];
  selectedStructureId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private candidatureService: CandidatureService,
    private authService: AuthService,
    private structureService: StructureService,
    private affectationService: AffectationService,
  ) {}

  ngOnInit(): void {
    this.campagneId = Number(this.route.snapshot.queryParamMap.get('campagneId'));

    // Récupérer la région du RH connecté
    this.authService.getMyRegion().subscribe({
      next: region => {
        this.myRegion = region;

        // Récupérer toutes les régions
        this.authService.getRegions().subscribe({
          next: allRegions => {
            // Mettre la région du RH en tête
            this.regions = [
              this.myRegion,
              ...allRegions.filter(r => r.id !== this.myRegion.id)
            ];

            // Pré-remplir le formulaire avec la région du RH
            this.form.regionId = this.myRegion.id;

            // Charger les candidatures filtrées par région du RH
            this.loadCandidatures(this.myRegion.id);
          },
          error: err => console.error("Erreur récupération régions", err)
        });
      },
      error: err => console.error("Erreur récupération région RH", err)
    });
  }

  // Charger candidatures par campagne et région
  loadCandidatures(regionId: number) {
    this.candidatureService.getCandidaturesByCampagneAndRegion(this.campagneId, regionId)
      .subscribe({
        next: (res: any) => {
          this.candidatures = res;
          console.log("Candidatures filtrées par région RH :", this.candidatures);
        },
        error: err => console.error("Erreur chargement candidatures", err)
      });
  }

  loadStructuresByRegion(regionId: number) {
  if (!regionId) return;

  this.structureService.getStructuresByRegion(regionId).subscribe({
    next: (data: Structure[]) => {
      this.structures = data;
    },
    error: err => console.error("Erreur chargement structures", err)
  });
}

  openDossier(cand: any) {
    this.selectedCandidature = cand;
    this.showDossierModal = true;
  }

  closeDossier() {
    this.showDossierModal = false;
    this.selectedCandidature = null;
  }

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

  onFileChange(event: any, type: string) {
    const file = event.target.files[0];
    if (type === 'cin') this.cinFile = file;
    if (type === 'diplome') this.diplome = file;
    if (type === 'contrat') this.contrat = file;
  }

  submit() {
    if (!this.cinFile || !this.diplome || !this.contrat) {
      alert("❌ Tous les fichiers sont obligatoires");
      return;
    }

    const formData = new FormData();
    formData.append('nom', this.form.nom);
    formData.append('prenom', this.form.prenom);
    formData.append('cin', this.form.cin.toString());
    formData.append('rib', this.form.rib);
    formData.append('telephone', this.form.telephone);
    formData.append('email', this.form.email);
    formData.append('regionId', this.form.regionId.toString());
    formData.append('structureId', this.form.structureId.toString());
    formData.append('campagneId', this.campagneId.toString());

    formData.append('cinFile', this.cinFile);
    formData.append('diplome', this.diplome);
    formData.append('contrat', this.contrat);

    this.candidatureService.deposerCandidature(formData).subscribe({
      next: () => {
        console.log("✅ Candidature envoyée avec succès");
        this.closeModal();
      },
      error: err => console.error("❌ Erreur ajout saisonnier", err)
    });
  }

  updateCandidature() {
    const formData = new FormData();
    formData.append("nom", this.selectedCandidature.saisonnier.nom);
    formData.append("prenom", this.selectedCandidature.saisonnier.prenom);
    formData.append("cin", this.selectedCandidature.saisonnier.cin);
    formData.append("rib", this.selectedCandidature.saisonnier.rib);
    formData.append("telephone", this.selectedCandidature.saisonnier.telephone);
    formData.append("email", this.selectedCandidature.saisonnier.email);
    formData.append("regionId", this.selectedCandidature.saisonnier.region.id);
    formData.append("statut", this.selectedCandidature.statut);
    formData.append("commentaire", this.selectedCandidature.commentaire);

    this.candidatureService.updateCandidature(this.selectedCandidature.id, formData)
      .subscribe({
        next: () => {
          alert("✅ Modification enregistrée");
          this.closeDossier();
          this.loadCandidatures(this.myRegion.id);
        },
        error: err => console.error("Erreur modification", err)
      });
  }

  // ==========================
  // Affectation
  // ==========================
  openAffectationModal(cand: any) {
    this.selectedCandidatureForAffect = cand;
    this.showAffectModal = true;
    this.selectedStructureId = null;

this.affectationService.getStructuresByRegion(this.myRegion.id).subscribe({
  next: (data: Structure[]) => {
    this.structuresCommerciaux = data.filter(s => s.type === 'ESPACE_COMMERCIAL');
    this.structuresTech = data.filter(s => s.type === 'CENTRE_TECHNOLOGIQUE');
    this.structures = [...this.structuresCommerciaux, ...this.structuresTech];
  },
  error: err => console.error(err)
});
  }

  affecter() {
    if (!this.selectedStructureId || !this.selectedCandidatureForAffect) return;

    this.affectationService.affecterSaisonnier(
      this.selectedCandidatureForAffect.saisonnier.id,
      this.selectedStructureId,
      this.campagneId
    ).subscribe({
      next: () => {
        alert("✅ Affectation réalisée");
        this.showAffectModal = false;
      },
      error: err => console.error(err)
    });
  }
}