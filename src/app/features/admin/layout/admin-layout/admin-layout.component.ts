// admin-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';

type AdminSection = 'campagnes' | 'candidatures' | 'memo' | 'structures' | 'presence';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  campagnes:    { title: 'Pilotage des Campagnes',    subtitle: 'Créez, activez et gérez vos campagnes de recrutement' },
  candidatures: { title: 'Liste des Candidatures',    subtitle: 'Consultez et suivez toutes les candidatures déposées' },
  memo:         { title: 'مذكرة الإنتداب 2025',        subtitle: 'مذكرة حول انتداب أعوان متعاقدين لعمل موسمي' },
  structures:   { title: 'Structures par Région',      subtitle: '17 gouvernorats — 87 structures — Campagne 2025' },
  presence:     { title: 'Présence & Paiement',        subtitle: 'Suivi des absences et calcul automatique des salaires' },
};

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {

  // ── Topbar ──────────────────────────────────────────────────────
  pageTitle    = 'Pilotage des Campagnes';
  pageSubtitle = 'Créez, activez et gérez vos campagnes de recrutement';
  searchQuery  = '';

  // ── Sidebar ─────────────────────────────────────────────────────
  sidebarOpen = false;
  nomUtilisateur  = '';
  roleUtilisateur = '';

  // ── Compteurs transmis à la sidebar ─────────────────────────────
  totalCandidatures = 0;
  totalSaisonniers  = 0;

  // ── Toast ────────────────────────────────────────────────────────
  toastMessage  = '';
  showToastFlag = false;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.nomUtilisateur  = this.authService.getNomComplet();
    this.roleUtilisateur = this.authService.getRole();

    // Mettre à jour le titre selon la route active
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageMetaFromUrl();
    });

    // Initialisation immédiate
    this.updatePageMetaFromUrl();
  }

  private updatePageMetaFromUrl(): void {
    const url = this.router.url;
    // Ex: /admin/campagnes → 'campagnes'
    const segment = url.split('/').pop() ?? 'campagnes';
    const meta = PAGE_META[segment] ?? PAGE_META['campagnes'];
    this.pageTitle    = meta.title;
    this.pageSubtitle = meta.subtitle;
  }

  // ── Navigation depuis la sidebar ─────────────────────────────────
  onSectionChanged(section: AdminSection): void {
    this.router.navigate(['/dash', section]);
    this.closeSidebar();
  }

  // ── Sidebar mobile ───────────────────────────────────────────────
  toggleSidebar(): void  { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar(): void   { this.sidebarOpen = false; }

  // ── Toast ─────────────────────────────────────────────────────────
  showToast(msg: string): void {
    this.toastMessage  = msg;
    this.showToastFlag = true;
    setTimeout(() => this.showToastFlag = false, 3000);
  }

  // ── Logout ───────────────────────────────────────────────────────
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}