import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {

  isScrolled = false;
  isMenuOpen = false;

  navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Espace Saisonnier', path: '/espace-saisonnier' },
    { name: 'Contact', path: '/contact' },
    { name: 'About', path: '/about' },
  ];

  constructor(private authService: AuthService, private router: Router) {}

  @HostListener('window:scroll', [])
  onScroll() {
    this.isScrolled = window.scrollY > 10;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // ── Vérifie si connecté ──
  get isLoggedIn(): boolean {
    return !!this.authService.getToken();
  }

  // ── Nom + prénom depuis le JWT ──
  get nomUtilisateur(): string {
    return this.authService.getNomComplet();
  }

  // ── Déconnexion ──
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}