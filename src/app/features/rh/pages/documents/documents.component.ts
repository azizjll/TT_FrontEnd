import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as XLSX from 'xlsx';
import { DocumentService } from 'src/app/services/document.service';
import { DocumentCampagneDTO, DocumentCampagneService } from 'src/app/services/document-campagne.service';

export interface Structure {
  name: string;
  type: 'ESPACE_COMMERCIAL' | 'CENTRE_TECHNOLOGIQUE';
  adresse: string;
}

export interface Region {
  name: string;
  structures: Structure[];
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss']
})
export class DocumentsComponent implements OnInit {

  activeTab: 'campagne' | 'excel' | 'campagne' = 'campagne';
  circulairePdfUrl: string = '';
  zoomLevel = 100;
  selectedRegion = '';
  filterType: 'ALL' | 'ESPACE_COMMERCIAL' | 'CENTRE_TECHNOLOGIQUE' = 'ALL';
  structureData: Record<string, any> = {};

  safePdfUrl: SafeResourceUrl | null = null;
  isLoadingPdf = true;  // indicateur de chargement du PDF

  selectedDoc: DocumentCampagneDTO | null = null;
safeDocUrl: SafeResourceUrl | null = null;

  // ── Upload state ──────────────────────────────────────
  isUploading = false;
  uploadSuccess = false;
  uploadError = '';

  documentsCampagne: DocumentCampagneDTO[] = [];
loadingDocs = false;

  regions: Region[] = [
    { name: 'Gouvernorat de Tunis', structures: [
      { name: 'Espace Commercial Habib Bourguiba', type: 'ESPACE_COMMERCIAL', adresse: 'Avenue Habib Bourguiba' },
      { name: 'Espace Commercial Berges du Lac',   type: 'ESPACE_COMMERCIAL', adresse: 'Berges du Lac II' },
      { name: 'Espace Commercial Montplaisir',      type: 'ESPACE_COMMERCIAL', adresse: 'Montplaisir' },
      { name: 'Espace Commercial El Khadra',        type: 'ESPACE_COMMERCIAL', adresse: 'Cité El Khadra' },
      { name: 'Siège Social',                       type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Jardins du Lac II' },
      { name: 'Data Center National',               type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Data Center National' },
    ]},
    { name: "Gouvernorat de l'Ariana", structures: [
      { name: 'Espace Commercial Ariana Ville',       type: 'ESPACE_COMMERCIAL',    adresse: 'Ariana Ville' },
      { name: 'Espace Commercial Ennasr II',          type: 'ESPACE_COMMERCIAL',    adresse: 'Ennasr II' },
      { name: 'Espace Commercial La Soukra',          type: 'ESPACE_COMMERCIAL',    adresse: 'La Soukra' },
      { name: 'Espace Commercial Menzah VI',          type: 'ESPACE_COMMERCIAL',    adresse: 'Menzah VI' },
      { name: 'Pôle de Compétitivité El Ghazala',     type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Pôle de Compétitivité El Ghazala' },
      { name: 'Centre Technique Régional',            type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Centre Technique Regional' },
    ]},
    { name: 'Gouvernorat de Ben Arous', structures: [
      { name: 'Espace Commercial Ben Arous',  type: 'ESPACE_COMMERCIAL',    adresse: 'Ben Arous Centre' },
      { name: 'Espace Commercial Megrine',    type: 'ESPACE_COMMERCIAL',    adresse: 'Megrine' },
      { name: 'Espace Commercial Hammam Lif', type: 'ESPACE_COMMERCIAL',    adresse: 'Hammam Lif' },
      { name: 'Espace Commercial Azur City',  type: 'ESPACE_COMMERCIAL',    adresse: 'Azur City' },
      { name: 'Zone Industrielle Megrine',    type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Zone Industrielle Megrine' },
      { name: 'Fibre Optique High-Tech',      type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Fibre Optique High-Tech' },
    ]},
    { name: 'Gouvernorat de Manouba', structures: [
      { name: 'Espace Commercial Manouba Ville',  type: 'ESPACE_COMMERCIAL',    adresse: 'Manouba Ville' },
      { name: 'Espace Commercial Denden',         type: 'ESPACE_COMMERCIAL',    adresse: 'Denden' },
      { name: 'Espace Commercial Mornaguia',      type: 'ESPACE_COMMERCIAL',    adresse: 'Mornaguia' },
      { name: 'Campus Universitaire Manouba',     type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Campus Universitaire Manouba' },
      { name: 'Connectivité Fibre Universitaire', type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Connectivité Fibre Universitaire' },
    ]},
    { name: 'Gouvernorat de Nabeul', structures: [
      { name: 'Espace Commercial Nabeul Centre',        type: 'ESPACE_COMMERCIAL',    adresse: 'Nabeul Centre' },
      { name: 'Espace Commercial Hammamet',             type: 'ESPACE_COMMERCIAL',    adresse: 'Hammamet' },
      { name: 'Espace Commercial Yasmine Hammamet',     type: 'ESPACE_COMMERCIAL',    adresse: 'Yasmine Hammamet' },
      { name: 'Espace Commercial Korba',                type: 'ESPACE_COMMERCIAL',    adresse: 'Korba' },
      { name: 'Cyberparc Nabeul',                       type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Cyberparc Nabeul' },
      { name: 'Nœuds de raccordement fibre FTTH',       type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Nœuds de raccordement fibre FTTH' },
    ]},
    { name: 'Gouvernorat de Bizerte', structures: [
      { name: 'Espace Commercial Bizerte Ville',    type: 'ESPACE_COMMERCIAL',    adresse: 'Bizerte Ville' },
      { name: 'Espace Commercial Menzel Bourguiba', type: 'ESPACE_COMMERCIAL',    adresse: 'Menzel Bourguiba' },
      { name: 'Espace Commercial Zarzouna',         type: 'ESPACE_COMMERCIAL',    adresse: 'Zarzouna' },
      { name: 'Cyberparc Bizerte',                  type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Cyberparc Bizerte' },
      { name: 'Stations sous-marines de câbles',    type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Stations sous-marines de câbles' },
    ]},
    { name: 'Gouvernorat de Sousse', structures: [
      { name: 'Espace Commercial Sousse Médina', type: 'ESPACE_COMMERCIAL',    adresse: 'Sousse Médina' },
      { name: 'Espace Commercial Kantaoui',      type: 'ESPACE_COMMERCIAL',    adresse: 'Kantaoui' },
      { name: 'Espace Commercial Sahloul',       type: 'ESPACE_COMMERCIAL',    adresse: 'Sahloul' },
      { name: 'Espace Commercial Akouda',        type: 'ESPACE_COMMERCIAL',    adresse: 'Akouda' },
      { name: 'Technopole de Sousse',            type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Technopole de Sousse' },
      { name: 'Centre de Support Régional',      type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Centre de Support Régional' },
    ]},
    { name: 'Gouvernorat de Monastir', structures: [
      { name: 'Espace Commercial Monastir Centre',  type: 'ESPACE_COMMERCIAL',    adresse: 'Monastir Centre' },
      { name: 'Espace Commercial Jemmel',           type: 'ESPACE_COMMERCIAL',    adresse: 'Jemmel' },
      { name: 'Espace Commercial Ksar Hellal',      type: 'ESPACE_COMMERCIAL',    adresse: 'Ksar Hellal' },
      { name: 'Cyberparc Monastir',                 type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Cyberparc Monastir' },
      { name: 'Infrastructure de Cloud régional',   type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Infrastructure de Cloud régional' },
    ]},
    { name: 'Gouvernorat de Mahdia', structures: [
      { name: 'Espace Commercial Mahdia Ville',  type: 'ESPACE_COMMERCIAL',    adresse: 'Mahdia Ville' },
      { name: 'Espace Commercial Ksour Essef',   type: 'ESPACE_COMMERCIAL',    adresse: 'Ksour Essef' },
      { name: 'Espace Commercial El Jem',        type: 'ESPACE_COMMERCIAL',    adresse: 'El Jem' },
      { name: 'Direction Régionale Technique',   type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Direction Régionale Technique' },
    ]},
    { name: 'Gouvernorat de Sfax', structures: [
      { name: 'Espace Commercial Sfax El Médina', type: 'ESPACE_COMMERCIAL',    adresse: 'Sfax El Médina' },
      { name: 'Espace Commercial Sakiet Ezzit',   type: 'ESPACE_COMMERCIAL',    adresse: 'Sakiet Ezzit' },
      { name: 'Espace Commercial Sfax Jdid',      type: 'ESPACE_COMMERCIAL',    adresse: 'Sfax Jdid' },
      { name: 'Technopole de Sfax',               type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Technopole de Sfax' },
      { name: 'Data Center Régional Sfax',        type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Data Center Régional' },
    ]},
    { name: 'Gouvernorat de Kairouan', structures: [
      { name: 'Espace Commercial Kairouan Ville', type: 'ESPACE_COMMERCIAL',    adresse: 'Kairouan Ville' },
      { name: 'Espace Commercial Bouhajla',       type: 'ESPACE_COMMERCIAL',    adresse: 'Bouhajla' },
      { name: 'Espace Commercial Nasrallah',      type: 'ESPACE_COMMERCIAL',    adresse: 'Nasrallah' },
      { name: 'Cyberparc Kairouan',               type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Cyberparc Kairouan' },
      { name: 'Relais de transmission Centre',    type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Relais de transmission Centre' },
    ]},
    { name: 'Gouvernorat de Kasserine', structures: [
      { name: 'Espace Commercial Kasserine Ville', type: 'ESPACE_COMMERCIAL',    adresse: 'Kasserine Ville' },
      { name: 'Espace Commercial Thala',           type: 'ESPACE_COMMERCIAL',    adresse: 'Thala' },
      { name: 'Espace Commercial Sbeitla',         type: 'ESPACE_COMMERCIAL',    adresse: 'Sbeitla' },
      { name: 'Cyberparc Kasserine',               type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Cyberparc Kasserine' },
      { name: 'Infrastructures MobiRif',           type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Infrastructures MobiRif' },
    ]},
    { name: 'Gouvernorat de Sidi Bouzid', structures: [
      { name: 'Espace Commercial Sidi Bouzid', type: 'ESPACE_COMMERCIAL',    adresse: 'Sidi Bouzid Centre' },
      { name: 'Espace Commercial Regueb',      type: 'ESPACE_COMMERCIAL',    adresse: 'Regueb' },
      { name: 'Espace Commercial Jilma',       type: 'ESPACE_COMMERCIAL',    adresse: 'Jilma' },
      { name: 'Cyberparc Sidi Bouzid',         type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Cyberparc Sidi Bouzid' },
      { name: 'Extension Réseau 4G/5G',        type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Extension Réseau 4G/5G' },
    ]},
    { name: 'Gouvernorat de Gafsa', structures: [
      { name: 'Espace Commercial Gafsa Ville',       type: 'ESPACE_COMMERCIAL',    adresse: 'Gafsa Ville' },
      { name: 'Espace Commercial Metlaoui',          type: 'ESPACE_COMMERCIAL',    adresse: 'Metlaoui' },
      { name: 'Espace Commercial El Ksar',           type: 'ESPACE_COMMERCIAL',    adresse: 'El Ksar' },
      { name: 'Cyberparc Gafsa',                     type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Cyberparc Gafsa' },
      { name: 'Hub Maintenance Technique Sud-Ouest', type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Hub maintenance technique Sud-Ouest' },
    ]},
    { name: 'Gouvernorat de Tozeur', structures: [
      { name: 'Espace Commercial Tozeur Centre',  type: 'ESPACE_COMMERCIAL',    adresse: 'Tozeur Centre' },
      { name: 'Espace Commercial Nefta',          type: 'ESPACE_COMMERCIAL',    adresse: 'Nefta' },
      { name: 'Station Transmission Satellite',   type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Station transmission satellite' },
      { name: 'Faisceaux Hertziens',              type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Faisceaux hertziens' },
    ]},
    { name: 'Gouvernorat de Kébili', structures: [
      { name: 'Espace Commercial Kébili Ville',    type: 'ESPACE_COMMERCIAL',    adresse: 'Kébili Ville' },
      { name: 'Espace Commercial Douz',            type: 'ESPACE_COMMERCIAL',    adresse: 'Douz' },
      { name: 'Infrastructure Réseau Désertique',  type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Infrastructure réseau désertique' },
      { name: 'MobiRif Kébili',                    type: 'CENTRE_TECHNOLOGIQUE', adresse: 'MobiRif' },
    ]},
    { name: 'Gouvernorat de Gabès', structures: [
      { name: 'Espace Commercial Gabès Centre', type: 'ESPACE_COMMERCIAL',    adresse: 'Gabès Centre' },
      { name: 'Espace Commercial Mareth',       type: 'ESPACE_COMMERCIAL',    adresse: 'Mareth' },
      { name: 'Espace Commercial El Hamma',     type: 'ESPACE_COMMERCIAL',    adresse: 'El Hamma' },
      { name: 'Cyberparc Gabès',                type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Cyberparc Gabès' },
      { name: 'Centre Technique Portuaire',     type: 'CENTRE_TECHNOLOGIQUE', adresse: 'Centre Technique Portuaire' },
    ]},
  ];

  // ── Constructor : injection DocumentService ───────────
  constructor(
    private sanitizer: DomSanitizer,
    private documentService: DocumentService,
      private documentCampagneService: DocumentCampagneService 

  ) {}

  ngOnInit(): void {
    this.initStructureData();
    this.loadFromStorage();
    this.loadCirculaireFromServer();
     this.loadDocumentsCampagne(); 
  }



  loadDocumentsCampagne(): void {
  this.loadingDocs = true;
  // Adapter l'id campagne active selon votre logique
  const campagneId = 1;
  this.documentCampagneService.getDocumentsByCampagne(campagneId).subscribe({
    next: (data) => {
      this.documentsCampagne = data;
      this.loadingDocs = false;
    },
    error: () => { this.loadingDocs = false; }
  });
}

getDocIcon(type: string): string {
  const icons: Record<string, string> = {
    'CONTRAT':    'M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    'NOTICE':     'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
    'FORMULAIRE': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2',
  };
  return icons[type] ?? 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6';
}

selectDoc(doc: DocumentCampagneDTO): void {
  this.selectedDoc = doc;
  this.safeDocUrl = this.sanitizer.bypassSecurityTrustResourceUrl(doc.url);
}

closeDocViewer(): void {
  this.selectedDoc = null;
  this.safeDocUrl = null;
}

  // ══════════════════════════════════════════════════════
  //  PDF — Upload + chargement depuis serveur
  // ══════════════════════════════════════════════════════

  /** Charge le dernier PDF CIRCULAIRE_2025 depuis le serveur */
loadCirculaireFromServer(): void {
  this.isLoadingPdf = true;

  this.documentService.getDocumentByType('CIRCULAIRE_2025').subscribe({
    next: (doc) => {
      if (doc?.url) {
        this.circulairePdfUrl = doc.url;
        this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(doc.url);
      } else {
        // pas de doc → safePdfUrl reste null → zone upload s'affiche
        this.safePdfUrl = null;
        this.circulairePdfUrl = '';
      }
      this.isLoadingPdf = false;  // ← toujours false à la fin
    },
    error: () => {
      this.safePdfUrl = null;
      this.circulairePdfUrl = '';
      this.isLoadingPdf = false;  // ← toujours false même en erreur
    }
  });
}

  /** Méthode privée partagée : aperçu local + upload Cloudinary */
private handlePdfUpload(file: File): void {
  const localUrl = URL.createObjectURL(file);
  this.circulairePdfUrl = localUrl;
  this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(localUrl); // ← ajouter

  this.isUploading  = true;
  this.uploadSuccess = false;
  this.uploadError  = '';

  this.documentService.uploadDocument(file, 'CIRCULAIRE_2025').subscribe({
    next: (res) => {
      this.circulairePdfUrl = res.url;
      this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(res.url); // ← ajouter
      this.isUploading  = false;
      this.uploadSuccess = true;
      setTimeout(() => this.uploadSuccess = false, 4000);
    },
    error: (err) => {
      console.error('Erreur upload PDF :', err);
      this.uploadError = "Erreur lors de l'upload. L'aperçu local reste disponible.";
      this.isUploading = false;
    }
  });
}



  onPdfSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file?.type === 'application/pdf') this.handlePdfUpload(file);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); }

  onDropPdf(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file?.type === 'application/pdf') this.handlePdfUpload(file);
  }

  zoomIn():   void { if (this.zoomLevel < 200) this.zoomLevel += 10; }
  zoomOut():  void { if (this.zoomLevel > 50)  this.zoomLevel -= 10; }
  printPdf(): void { window.open(this.circulairePdfUrl)?.print(); }

  // ══════════════════════════════════════════════════════
  //  Getters stats
  // ══════════════════════════════════════════════════════
  get totalRegions():    number { return this.regions.length; }
  get totalStructures(): number { return this.regions.reduce((s, r) => s + r.structures.length, 0); }
  get totalEC(): number { return this.regions.reduce((s, r) => s + r.structures.filter(st => st.type === 'ESPACE_COMMERCIAL').length, 0); }
  get totalCT(): number { return this.regions.reduce((s, r) => s + r.structures.filter(st => st.type === 'CENTRE_TECHNOLOGIQUE').length, 0); }

  // ══════════════════════════════════════════════════════
  //  Tableau / LocalStorage
  // ══════════════════════════════════════════════════════
  initStructureData(): void {
    for (const r of this.regions)
      for (const s of r.structures) {
        const base = `${r.name}|${s.name}`;
        if (!(base + '|auth' in this.structureData)) {
          this.structureData[base + '|auth'] = 0;
          this.structureData[base + '|rec']  = 0;
          this.structureData[base + '|resp'] = '';
          this.structureData[base + '|obs']  = '';
        }
      }
  }

  loadFromStorage(): void {
    const saved = localStorage.getItem('tt_structure_data_v2');
    if (saved) { try { Object.assign(this.structureData, JSON.parse(saved)); } catch {} }
  }

  updateStats(): void {
    localStorage.setItem('tt_structure_data_v2', JSON.stringify(this.structureData));
  }

  selectRegion(name: string): void {
    this.selectedRegion = this.selectedRegion === name ? '' : name;
  }

  getCurrentStructures(): Structure[] {
    const all = this.regions.find(r => r.name === this.selectedRegion)?.structures ?? [];
    return this.filterType === 'ALL' ? all : all.filter(s => s.type === this.filterType);
  }

  getRest(region: string, struct: string): number {
    const auth = +this.structureData[`${region}|${struct}|auth`] || 0;
    const rec  = +this.structureData[`${region}|${struct}|rec`]  || 0;
    return Math.max(0, auth - rec);
  }

  getRegionTotal(region: string, type: 'auth' | 'rec'): number {
    return (this.regions.find(r => r.name === region)?.structures ?? [])
      .reduce((sum, s) => sum + (+this.structureData[`${region}|${s.name}|${type}`] || 0), 0);
  }

  getTotalAuth(): number { return this.regions.reduce((s, r) => s + this.getRegionTotal(r.name, 'auth'), 0); }
  getTotalRec():  number { return this.regions.reduce((s, r) => s + this.getRegionTotal(r.name, 'rec'),  0); }

  getGlobalIndex(ri: number, si: number): number {
    let idx = 1;
    for (let i = 0; i < ri; i++) idx += this.regions[i].structures.length;
    return idx + si;
  }

  typeLabel(type: string): string {
    return type === 'ESPACE_COMMERCIAL' ? 'Espace Commercial' : 'Centre Technologique';
  }

  typeBadgeClass(type: string): string {
    return type === 'ESPACE_COMMERCIAL' ? 'badge-ec' : 'badge-ct';
  }

  // ══════════════════════════════════════════════════════
  //  Export Excel
  // ══════════════════════════════════════════════════════
  exportToExcel(): void {
    const wb = XLSX.utils.book_new();
    const recapData: any[][] = [
      ['Tunisie Telecom — Structures par Région — Campagne 2025'], [],
      ['#', 'Gouvernorat', 'Structure', 'Type', 'Adresse', 'Autorisés', 'Recrutés', 'Restants', 'Statut']
    ];
    let idx = 1;
    for (const r of this.regions) {
      for (let si = 0; si < r.structures.length; si++) {
        const s = r.structures[si];
        const auth = +this.structureData[`${r.name}|${s.name}|auth`] || 0;
        const rec  = +this.structureData[`${r.name}|${s.name}|rec`]  || 0;
        recapData.push([idx++, si === 0 ? r.name : '', s.name, this.typeLabel(s.type), s.adresse,
                        auth, rec, auth - rec, auth - rec > 0 ? 'En cours' : 'Complet']);
      }
    }
    recapData.push(['', '', 'TOTAL', '', '', this.getTotalAuth(), this.getTotalRec(),
                    this.getTotalAuth() - this.getTotalRec(), '']);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(recapData), 'Récapitulatif');

    for (const r of this.regions) {
      const rows: any[][] = [[`${r.name} — Saisonniers 2025`], [],
        ['#', 'Structure', 'Type', 'Adresse', 'Autorisés', 'Recrutés', 'Restants', 'Responsable', 'Observations']
      ];
      for (let i = 0; i < r.structures.length; i++) {
        const s = r.structures[i]; const base = `${r.name}|${s.name}`;
        const auth = +this.structureData[base + '|auth'] || 0;
        const rec  = +this.structureData[base + '|rec']  || 0;
        rows.push([i+1, s.name, this.typeLabel(s.type), s.adresse, auth, rec, auth - rec,
                   this.structureData[base + '|resp'] || '', this.structureData[base + '|obs'] || '']);
      }
      rows.push(['', 'TOTAL', '', '', this.getRegionTotal(r.name,'auth'), this.getRegionTotal(r.name,'rec'),
                 this.getRegionTotal(r.name,'auth') - this.getRegionTotal(r.name,'rec'), '', '']);
      const sheet = r.name.replace("Gouvernorat de l'", '').replace('Gouvernorat de ', '').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheet);
    }
    XLSX.writeFile(wb, `structures_TT_${new Date().getFullYear()}.xlsx`);
  }
}