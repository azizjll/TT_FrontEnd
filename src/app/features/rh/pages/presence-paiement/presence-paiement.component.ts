import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { AgentResultat, SaisonnierDTO, SaisonnierService } from 'src/app/services/saisonnier.service';
import { AuthService } from 'src/app/services/auth.service';
import { CampagneService } from 'src/app/services/campagne.service';
import { StructureDTO, StructureService } from 'src/app/structure.service';

export interface SaisonnierPaie {
  id: number;
  // ← depuis le backend
  nom: string;
  prenom: string;
  cin: number;
  rib: string;
  // ← gérés localement
  dateMbacharah: string;
  duree: number;
  absences: number;
  montantNet: number;
  nomTitulaireCompte: string;
  cinTitulaire: string;
  paye: boolean;
  telephone?: string;
}
@Component({
  selector: 'app-presence-paiement',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './presence-paiement.component.html',
  styleUrls: ['./presence-paiement.component.scss']
})
export class PresencePaiementComponent implements OnInit {

  // ── Paramètres ────────────────────────────────────
  tauxJourDT  = 8;          // 240 DT / 30 jours = 8 DT/jour
  dureeContrat = 30;
  dateMbacharah = '2025-07-01';
  campagneId: number | null = null;
  campagnes: any[] = [];    // à charger depuis CampagneService si disponible

  currentYear = new Date().getFullYear();
  regionId: number | null = null;

  structures: StructureDTO[] = [];
selectedStructureId: number | null = null;

budgetCampagne = 0;      // salaire mensuel par saisonnier
campagneNom   = '';      // nom de la campagne active


  // ── UI state ──────────────────────────────────────
  searchQ      = '';
  filterPaye   = 'ALL';
  showDetail   = false;
  selectedSaisonnier: SaisonnierPaie | null = null;

  // ── Données ───────────────────────────────────────
  saisonniers: SaisonnierPaie[] = [];


  // ── Propriétés agent ───────────────────────────
agentLoading   = false;
agentStatus    = '';
agentError     = false;
agentResultats: AgentResultat[] = [];

constructor(
    private saisonnierService: SaisonnierService,
    private authService: AuthService,
    private campagneService: CampagneService,
        private structureService: StructureService

) {}

  ngOnInit(): void {
  this.loadFromStorage();

  this.authService.getMyRegion().subscribe({
    next: (region) => {
      this.regionId = region.id;

      this.campagneService.getCampagnesActives().subscribe({
        next: (campagnes) => {
          if (campagnes.length > 0) {
            this.campagneId = campagnes[0].id;

            // ✅ Récupérer le budget de la campagne active
            const budget = Number(campagnes[0].budget);
            this.budgetCampagne = budget;
this.campagneNom    = campagnes[0].libelle ?? '';

            if (budget > 0 && this.dureeContrat > 0) {
              this.tauxJourDT = Math.round((budget / this.dureeContrat) * 1000) / 1000;
            }

            this.loadSaisonniers();

            this.structureService.getStructuresByRegion(region.id, this.campagneId).subscribe({
              next: (data) => { this.structures = data; },
              error: (err) => console.error('Erreur structures:', err)
            });
          }
        },
        error: (err) => console.error('Erreur campagne:', err)
      });
    },
    error: (err) => console.error('Erreur région RH:', err)
  });
}


private buildAbsencesData(): Record<string, number> {
  const map: Record<string, number> = {};
  this.saisonniers.forEach(s => {
    const tel = s.telephone?.trim();
    if (tel && s.absences > 0) {
      map[tel] = s.absences;
    }
  });
  return map;
}

// ── Lancer l'agent ─────────────────────────────
lancerAgent(): void {
  if (!this.campagneId || !this.regionId) {
    this.agentStatus = 'Sélectionne une campagne et une région d\'abord';
    this.agentError  = true;
    return;
  }

  this.agentLoading   = true;
  this.agentStatus    = '';
  this.agentError     = false;
  this.agentResultats = [];

  const absencesData = this.buildAbsencesData();
  // ← ajouter ce log
  console.log('absencesData envoyé:', absencesData);
  console.log('campagneId:', this.campagneId);
  console.log('regionId:', this.regionId);

  if (Object.keys(absencesData).length === 0) {
    this.agentStatus = '⚠️ Aucune absence saisie dans le tableau';
    this.agentError  = true;
    return;
  }

  this.saisonnierService.lancerAgent(
    this.campagneId,
    this.regionId,
    3,              // seuil — change selon ta règle métier
    absencesData
  ).subscribe({
    next: (res) => {
      this.agentLoading   = false;
      this.agentResultats = res.resultats;
      this.agentStatus    = res.message;
    },
    error: () => {
      this.agentLoading = false;
      this.agentError   = true;
      this.agentStatus  = 'Impossible de joindre l\'agent IA (Flask sur :5003)';
    }
  });
}

// ── Couleur badge par action ───────────────────
getActionClass(action: string): string {
  const map: Record<string, string> = {
    'APPELER': 'badge-appele',
    'AVERTIR': 'badge-averti',
    'REJETER': 'badge-rejete'
  };
  return map[action] ?? '';
}


onDureeContratChange(): void {
  if (this.budgetCampagne > 0 && this.dureeContrat > 0) {
    this.tauxJourDT = Math.round((this.budgetCampagne / this.dureeContrat) * 1000) / 1000;
  }
  this.recalcAll();
}



onStructureChange(): void {
    if (!this.campagneId) return;

    if (!this.selectedStructureId) {
        // Pas de structure sélectionnée → charger tous les saisonniers de la région
        this.loadSaisonniers();
        return;
    }

    this.saisonnierService.getByCampagneAndStructure(
        this.campagneId,
        this.selectedStructureId
    ).subscribe({
        next: (dtos) => {
            const localMap = this.buildLocalMap();
            this.saisonniers = dtos.map(dto => {
                const saved = localMap[dto.id] ?? {};
                return {
                    id:                 dto.id,
                    nom:                dto.nom,
                    prenom:             dto.prenom,
                    cin:                dto.cin,
                    rib:                saved.rib ?? dto.rib ?? '',
                    telephone:          dto.telephone ?? '',
                    dateMbacharah:      saved.dateMbacharah ?? this.dateMbacharah,
                    duree:              saved.duree ?? this.dureeContrat,
                    absences:           saved.absences ?? 0,
                    montantNet:         0,
                    nomTitulaireCompte: saved.nomTitulaireCompte ?? '',
                    cinTitulaire:       saved.cinTitulaire ?? '',
                    paye:               saved.paye ?? false,
                };
            });
            this.recalcAll();
        },
        error: (err) => console.error('Erreur filtre structure:', err)
    });
}


  // ── Chargement depuis le backend (ou mock) ────────
  loadSaisonniers(): void {
    if (!this.campagneId || !this.regionId) return;

    this.saisonnierService.getByCampagneAndRegion(this.campagneId, this.regionId).subscribe({
        next: (dtos: SaisonnierDTO[]) => {
            const localMap = this.buildLocalMap();
            this.saisonniers = dtos.map(dto => {
                const saved = localMap[dto.id] ?? {};
                return {
                    id:                 dto.id,
                    nom:                dto.nom,
                    prenom:             dto.prenom,
                    cin:                dto.cin,
                    rib:                saved.rib ?? dto.rib ?? '',
                    telephone:          dto.telephone ?? '',
                    dateMbacharah:      saved.dateMbacharah ?? this.dateMbacharah,
                    duree:              saved.duree ?? this.dureeContrat,
                    absences:           saved.absences ?? 0,
                    montantNet:         0,
                    nomTitulaireCompte: saved.nomTitulaireCompte ?? '',
                    cinTitulaire:       saved.cinTitulaire ?? '',
                    paye:               saved.paye ?? false,
                };
            });
            this.recalcAll();
        },
        error: (err) => {
            console.error('Erreur chargement saisonniers:', err);
            if (this.saisonniers.length === 0) this.loadFromStorage();
        }
    });
}


get structuresEC(): StructureDTO[] {
    return this.structures.filter(s => s.type === 'ESPACE_COMMERCIAL');
}

get structuresCT(): StructureDTO[] {
    return this.structures.filter(s => s.type === 'CENTRE_TECHNOLOGIQUE');
}

  private buildLocalMap(): Record<number, Partial<SaisonnierPaie>> {
    const raw = localStorage.getItem('tt_paie_data');
    if (!raw) return {};
    try {
      const arr: SaisonnierPaie[] = JSON.parse(raw);
      return Object.fromEntries(arr.map(s => [s.id, s]));
    } catch { return {}; }
  }

  // ── Calculs ───────────────────────────────────────
  recalcRow(s: SaisonnierPaie): void {
  s.duree = Math.max(0, this.dureeContrat - s.absences);
  s.montantNet = s.duree * this.tauxJourDT;
}
  recalcAll(): void {
    for (const s of this.saisonniers) {
      s.duree = this.dureeContrat;
      s.dateMbacharah = this.dateMbacharah;
      this.recalcRow(s);
    }
    this.save();
  }

  // ── Totaux ────────────────────────────────────────
  getTotalMontant():   number { return this.saisonniers.reduce((s, x) => s + x.montantNet, 0); }
  getTotalAbsences():  number { return this.saisonniers.reduce((s, x) => s + x.absences, 0); }
  getTotalJours():     number { return this.saisonniers.reduce((s, x) => s + x.duree, 0); }

  // ── Filtre / recherche ────────────────────────────
  get filteredSaisonniers(): SaisonnierPaie[] {
    const q = this.searchQ.toLowerCase().trim();
    return this.saisonniers.filter(s => {
      const matchSearch = !q ||
        s.nom.toLowerCase().includes(q) ||
        s.prenom.toLowerCase().includes(q) ||
        s.cin.toString().includes(q);
      const matchFilter =
        this.filterPaye === 'ALL' ||
        (this.filterPaye === 'PAYE'   &&  s.paye) ||
        (this.filterPaye === 'IMPAYE' && !s.paye);
      return matchSearch && matchFilter;
    });
  }

  // ── Actions ───────────────────────────────────────
  togglePaye(s: SaisonnierPaie): void {
    s.paye = !s.paye;
    this.save();
  }

  openDetail(s: SaisonnierPaie): void {
    this.selectedSaisonnier = s;
    this.showDetail = true;
  }

  // ── Persistance locale ────────────────────────────
  save(): void {
    localStorage.setItem('tt_paie_data', JSON.stringify(this.saisonniers));
    localStorage.setItem('tt_paie_params', JSON.stringify({
      tauxJourDT: this.tauxJourDT,
      dureeContrat: this.dureeContrat,
      dateMbacharah: this.dateMbacharah,
    }));
  }

  loadFromStorage(): void {
    const data   = localStorage.getItem('tt_paie_data');
    const params = localStorage.getItem('tt_paie_params');
    if (data)   { try { this.saisonniers = JSON.parse(data); } catch {} }
    if (params) {
      try {
        const p = JSON.parse(params);
        this.tauxJourDT    = p.tauxJourDT    ?? 8;
        this.dureeContrat  = p.dureeContrat  ?? 30;
        this.dateMbacharah = p.dateMbacharah ?? '2025-07-01';
      } catch {}
    }
  }

  // ── Export Excel ─────────────────────────────────
  exportExcel(): void {
    const rows: any[][] = [
      ['Tunisie Telecom — Présence & Paiement — Campagne 2025'],
      [`Taux journalier: ${this.tauxJourDT} DT | Durée contrat: ${this.dureeContrat} jours`],
      [],
      ['عدد','الاسم و اللقب','رقم بطاقة التعريف','تاريخ المباشرة','مدة العمل','الغيابات',
       'المبلغ الصافي (DT)','صاحب الحساب','CIN صاحب الحساب','رقم الحساب','الحالة']
    ];

    this.saisonniers.forEach((s, i) => {
      rows.push([
        i + 1,
        `${s.prenom} ${s.nom}`,
        s.cin,
        s.dateMbacharah,
        s.duree,
        s.absences,
        s.montantNet,
        s.nomTitulaireCompte || '',
        s.cinTitulaire || '',
        s.rib || '',
        s.paye ? 'Payé' : 'Impayé'
      ]);
    });

    rows.push([]);
    rows.push(['', '', '', '', this.getTotalJours(), this.getTotalAbsences(),
               this.getTotalMontant(), '', '', '', '']);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      {wch:6},{wch:25},{wch:14},{wch:14},{wch:10},{wch:10},{wch:16},{wch:25},{wch:14},{wch:22},{wch:10}
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Paiement 2025');
    XLSX.writeFile(wb, `paie_saisonniers_${new Date().getFullYear()}.xlsx`);
  }

  // ── Export PDF (print) ────────────────────────────
  exportPdf(): void {
    window.print();
  }

  // ── Imprimer fiche individuelle ───────────────────
  printFiche(s: SaisonnierPaie): void {
    const html = `
      <html><head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; padding: 32px; }
          h2 { text-align: center; color: #1e3a5f; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          td { padding: 10px 14px; border: 1px solid #ddd; font-size: 14px; }
          td:first-child { font-weight: bold; background: #f8fafc; width: 40%; }
          .total { background: #1e3a5f; color: white; font-size: 16px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h3 { color: #2563eb; }
        </style>
      </head><body>
        <div class="header">
          <strong>تونس تيليكوم — Tunisie Telecom</strong>
          <h2>بطاقة أجرة عون متعاقد موسمي — ${this.currentYear}</h2>
        </div>
        <table>
          <tr><td>الاسم و اللقب</td><td>${s.prenom} ${s.nom}</td></tr>
          <tr><td>رقم بطاقة التعريف</td><td>${s.cin}</td></tr>
          <tr><td>تاريخ المباشرة</td><td>${s.dateMbacharah}</td></tr>
          <tr><td>مدة العمل</td><td>${s.duree} يوم</td></tr>
          <tr><td>الغيابات</td><td>${s.absences} يوم</td></tr>
          <tr><td>أيام العمل الفعلية</td><td>${s.duree - s.absences} يوم</td></tr>
          <tr><td>المبلغ الصافي</td><td class="total"><strong>${s.montantNet.toFixed(3)} DT</strong></td></tr>
          <tr><td>الاسم و اللقب صاحب الحساب</td><td>${s.nomTitulaireCompte || '—'}</td></tr>
          <tr><td>رقم بطاقة تعريف صاحب الحساب</td><td>${s.cinTitulaire || '—'}</td></tr>
          <tr><td>رقم الحساب</td><td>${s.rib || '—'}</td></tr>
        </table>
        <br>
        <table>
          <tr><td>الأجر الإجمالي</td><td>${s.duree} × ${this.tauxJourDT} = ${(s.duree * this.tauxJourDT).toFixed(3)} DT</td></tr>
          <tr><td>خصم الغيابات</td><td>${s.absences} × ${this.tauxJourDT} = ${(s.absences * this.tauxJourDT).toFixed(3)} DT</td></tr>
          <tr><td><strong>الصافي للصرف</strong></td><td><strong>${s.montantNet.toFixed(3)} DT</strong></td></tr>
        </table>
      </body></html>
    `;
    const w = window.open('', '_blank');
    w?.document.write(html);
    w?.document.close();
    w?.print();
  }
}