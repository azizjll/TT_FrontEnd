import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { SaisonniersListComponent } from './features/rh/pages/saisonniers-list/saisonniers-list.component';
import { SaisonnierAddComponent } from './features/rh/pages/saisonnier-add/saisonnier-add.component';
import { SaisonniersValidationComponent } from './features/rh/pages/saisonniers-validation/saisonniers-validation.component';
import { ParametresEntrepriseComponent } from './features/rh/pages/parametres-entreprise/parametres-entreprise.component';
import { RhLayoutComponent } from './features/rh/layout/rh-layout/rh-layout.component';
import { HomeAdminComponent } from './features/admin/pages/home-admin/home-admin.component';
import { HomeGeneralComponent } from './pages/home-general/home-general.component';
import { EspacesaisonnierComponent } from './saisonnier/espacesaisonnier/espacesaisonnier.component';

const routes: Routes = [

  { path: 'login', component: LoginComponent },

        { path: 'home', component: HomeComponent },


  {
    path: 'entreprise',
    component: RhLayoutComponent,
    children: [
      { path: 'saisonniers', component: SaisonniersListComponent },
      { path: 'saisonniers/add', component: SaisonnierAddComponent },
      { path: 'parametres', component: ParametresEntrepriseComponent },
      { path: '', redirectTo: 'saisonniers', pathMatch: 'full' }
    ]
  },
  {path: 'home-ge', component: HomeGeneralComponent},

  
  { path: 'saisonniers/validation', component: SaisonniersValidationComponent },
  {path: 'admin', component: HomeAdminComponent},
  {path: 'espace-saisonnier', component: EspacesaisonnierComponent},

  { path: '', redirectTo: '/home-ge', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
