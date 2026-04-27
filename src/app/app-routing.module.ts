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
import { DocumentsComponent } from './features/rh/pages/documents/documents.component';
import { PresencePaiementComponent } from './features/rh/pages/presence-paiement/presence-paiement.component';
import { LoginAdminComponent } from './features/admin/pages/login-admin/login-admin.component';
import { AuthGuard } from './security/auth.guard';
import { RhGuard } from './security/rh.guard';
import { LoginSaisonnierComponent } from './features/saisonnier/login-saisonnier/login-saisonnier.component';
import { AdminLayoutComponent } from './features/admin/layout/admin-layout/admin-layout.component';
import { CampagnesComponent } from './features/admin/pages/campagnes/campagnes.component';
import { CandidaturesComponent } from './features/admin/pages/candidatures/candidatures.component';
import { PresenceComponent } from './features/admin/pages/presence/presence.component';
import { MemoComponent } from './features/admin/pages/memo/memo.component';
import { StructuresComponent } from './features/admin/pages/structures/structures.component';
import { CampagneGuard } from './guards/campagne.guard';
import { CampagneExpireeComponent } from './pages/campagne-expiree/campagne-expiree.component';
import { IltizamComponent } from './pages/iltizam/iltizam.component';

const routes: Routes = [

  { path: 'login', component: LoginComponent },

        { path: 'home', component: HomeComponent },


  {
    path: 'entreprise',
    component: RhLayoutComponent,canActivate: [RhGuard],
    children: [
      { path: 'saisonniers', component: SaisonniersListComponent },
      { path: 'saisonniers/add', component: SaisonnierAddComponent },
      { path: 'parametres', component: ParametresEntrepriseComponent },
      { path: 'documents', component: DocumentsComponent },
      {path: 'Presence&paiement', component: PresencePaiementComponent},
      { path: '', redirectTo: 'saisonniers', pathMatch: 'full' }
    ]
  },
  {path: 'home-ge', component: HomeGeneralComponent},

  { path: 'saisonnier/login', component: LoginSaisonnierComponent },
{ path: 'saisonnier/reset-password', component: LoginSaisonnierComponent },

  
  { path: 'saisonniers/validation', component: SaisonniersValidationComponent },
  {path: 'admin', component: HomeAdminComponent,canActivate: [AuthGuard]},

  {
  path: 'saisonnier/iltizam',
  component: IltizamComponent,
 
},
{ 
  path: 'espace-saisonnier', 
  component: EspacesaisonnierComponent,
  canActivate: [CampagneGuard]
}, 
 { path: 'admin/login', component: LoginAdminComponent },
 { path: 'campagne-expiree', component: CampagneExpireeComponent },

  { path: '', redirectTo: '/home-ge', pathMatch: 'full' },
  {
    path: 'dash',
    component: AdminLayoutComponent,
    children: [
      { path: '',             redirectTo: 'campagnes', pathMatch: 'full' },
      { path: 'campagnes',    component: CampagnesComponent },
      { path: 'candidatures', component: CandidaturesComponent },
      { path: 'presence',     component: PresenceComponent },
      { path: 'memo',         component: MemoComponent },
      { path: 'structures',   component: StructuresComponent },
    ]
  }


  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
