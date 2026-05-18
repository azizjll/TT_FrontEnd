import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout-superadmin',
  templateUrl: './layout-superadmin.component.html',
  styleUrls: ['./layout-superadmin.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class LayoutSuperadminComponent {
  sidebarCollapsed = false;

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}