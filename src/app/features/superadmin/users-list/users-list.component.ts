import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Region { id: number; nom: string; }
interface Utilisateur {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  matricule: number;
  telephone: string;
  role: string;
  enabled: boolean;
  region?: Region;
}
interface ImportResult {
  message: string;
  created: number;
  skipped: number;
  errors: string[];
}

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class UsersListComponent implements OnInit {

  // ── State ──────────────────────────────────────────────────────
  users: Utilisateur[] = [];
  roles: string[] = ['SUPERADMIN', 'ADMIN', 'RH_REGIONAL','SAISONNIER'];

  selectedFile: File | null = null;
  isDragging  = false;
  importing   = false;
  importResult: ImportResult | null = null;

  searchQuery = '';
  filterRole  = '';

  private apiBase = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsersFromBackend();
  }

  // ── Drag & Drop ────────────────────────────────────────────────
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = true;
  }
  onDragLeave(): void { this.isDragging = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  // ── File Input ─────────────────────────────────────────────────
  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setFile(file);
  }

  setFile(file: File): void {
    const valid = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!valid) { alert('Veuillez sélectionner un fichier .xlsx ou .xls'); return; }
    this.selectedFile = file;
    this.importResult = null;
  }

  removeFile(e: MouseEvent): void {
    e.stopPropagation();
    this.selectedFile = null;
    this.importResult = null;
  }

  // ── Import ─────────────────────────────────────────────────────
  importFile(): void {
    if (!this.selectedFile) return;

    this.importing = true;
    this.importResult = null;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.post<ImportResult>(
      `${this.apiBase}/superadmin/import-users`,
      formData,
      { headers }
    ).subscribe({
      next: (result) => {
        this.importResult = result;
        this.importing = false;
        // Recharge les utilisateurs après import
        this.loadUsersFromBackend();
      },
      error: (err) => {
        console.error('Erreur import', err);
        this.importResult = {
          message: 'Erreur serveur',
          created: 0,
          skipped: 0,
          errors: [err.error?.error || 'Une erreur est survenue.']
        };
        this.importing = false;
      }
    });
  }

  

  // ── Load Users ─────────────────────────────────────────────────
  loadUsersFromBackend(): void {
    

    this.http.get<Utilisateur[]>(
      `${this.apiBase}/superadmin/users`,
    ).subscribe({
      next: (data) => { this.users = data; },
      error: (err) => console.error('Erreur chargement users', err)
    });
  }

  // ── Template Download ──────────────────────────────────────────
  downloadTemplate(): void {
    // Télécharger un modèle Excel vide avec les colonnes attendues
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    // Si le backend expose un endpoint template :
    // window.open(`${this.apiBase}/superadmin/template-excel`, '_blank');
    console.log('Télécharger le modèle Excel');
  }

  // ── Helpers ────────────────────────────────────────────────────
  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  }

  getInitials(u: Utilisateur): string {
    return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase();
  }

  getCountByRole(role: string): number {
  return this.users.filter(u => u.role === role).length;
}

  getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPERADMIN:   'Super Admin',
    ADMIN:        'Administrateur RH',
    RH_REGIONAL:  'Responsable RH',
  };
  return map[role] ?? role;
}

getRoleClass(role: string): string {
  const map: Record<string, string> = {
    SUPERADMIN:  'role-super',
    ADMIN:       'role-admin',
    RH_REGIONAL: 'role-rh',
  };
  return map[role] ?? 'role-default';
}

  filteredUsers(): Utilisateur[] {
  return this.users.filter(u => {

    const q = this.searchQuery.toLowerCase();

    const matchSearch =
      !q ||
      u.nom.toLowerCase().includes(q) ||
      u.prenom.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.matricule?.toString().includes(q);

    const matchRole =
      !this.filterRole ||
      u.role === this.filterRole;

    return matchSearch && matchRole;
  });
}
}