import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

type AdminSection = 'campagnes' | 'candidatures' | 'memo' | 'structures' | 'presence';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {

  // ── Inputs depuis layout ─────────────────────────────
  @Input() nomUtilisateur = '';
  @Input() roleUtilisateur = '';
  @Input() sidebarOpen = false;
  @Input() totalCandidatures = 0;
  @Input() totalSaisonniers = 0;

  // ── Outputs ──────────────────────────────────────────
  @Output() sectionChanged = new EventEmitter<AdminSection>();
  @Output() sidebarClosed = new EventEmitter<void>();
  @Output() logoutRequested = new EventEmitter<void>();

  // ── State ────────────────────────────────────────────
  campagnesOpen = false;

  constructor(public router: Router) {}

  // ── Navigation active ────────────────────────────────
  get activeRoute(): string {
    return this.router.url.split('/').pop() || '';
  }

  isActive(path: string): boolean {
    return this.router.url.includes(path);
  }

  isCampagnesGroupActive(): boolean {
    return ['campagnes', 'memo', 'structures'].includes(this.activeRoute);
  }

  // ── Actions ──────────────────────────────────────────
  toggleCampagnes(): void {
    this.campagnesOpen = !this.campagnesOpen;
  }

  navigate(section: AdminSection): void {
    this.sectionChanged.emit(section);
  }

  onLogout(): void {
    this.logoutRequested.emit();
  }
}