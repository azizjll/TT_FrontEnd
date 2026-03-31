import { Component, HostListener } from '@angular/core';

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

  @HostListener('window:scroll', [])
  onScroll() {
    this.isScrolled = window.scrollY > 10;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }



}
