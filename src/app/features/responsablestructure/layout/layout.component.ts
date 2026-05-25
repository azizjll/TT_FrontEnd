import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule],


  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  navItems = [
    { label: 'Candidatures', icon: 'users', route: 'candidatures', badge: 0 },
   
  ];
}