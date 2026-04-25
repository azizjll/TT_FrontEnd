import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LoginComponent } from './pages/login/login.component';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './pages/home/home.component';
import { SaisonniersListComponent } from './features/rh/pages/saisonniers-list/saisonniers-list.component';
import { SaisonnierAddComponent } from './features/rh/pages/saisonnier-add/saisonnier-add.component';
import { SaisonniersValidationComponent } from './features/rh/pages/saisonniers-validation/saisonniers-validation.component';
import { HomeAdminComponent } from './features/admin/pages/home-admin/home-admin.component';
import { HomeGeneralComponent } from './pages/home-general/home-general.component';
import { EspacesaisonnierComponent } from './saisonnier/espacesaisonnier/espacesaisonnier.component';
import { HeroSliderComponent } from './shared/hero-slider/hero-slider.component';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DocumentsComponent } from './features/rh/pages/documents/documents.component';
import { PresencePaiementComponent } from './features/rh/pages/presence-paiement/presence-paiement.component';
import { SafePipe } from './shared/safe.pipe';
import { LoginAdminComponent } from './features/admin/pages/login-admin/login-admin.component';
import { LoginSaisonnierComponent } from './features/saisonnier/login-saisonnier/login-saisonnier.component';
import { AdminLayoutComponent } from './features/admin/layout/admin-layout/admin-layout.component';
import { SidebarComponent } from './features/admin/components/sidebar/sidebar.component';
import { CampagnesComponent } from './features/admin/pages/campagnes/campagnes.component';
import { CandidaturesComponent } from './features/admin/pages/candidatures/candidatures.component';
import { PresenceComponent } from './features/admin/pages/presence/presence.component';
import { MemoComponent } from './features/admin/pages/memo/memo.component';
import { StructuresComponent } from './features/admin/pages/structures/structures.component';
import { CampagneExpireeComponent } from './pages/campagne-expiree/campagne-expiree.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    LoginComponent,
    HomeComponent,
    SaisonniersListComponent,
    SaisonnierAddComponent,
    SaisonniersValidationComponent,
    HomeAdminComponent,
    HomeGeneralComponent,
    EspacesaisonnierComponent,
    HeroSliderComponent,
    SafePipe,
    LoginAdminComponent,
    LoginSaisonnierComponent,
    AdminLayoutComponent,
    SidebarComponent,
    CampagnesComponent,
    CandidaturesComponent,
    PresenceComponent,
    MemoComponent,
    StructuresComponent,
    CampagneExpireeComponent,
    
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    CommonModule,
    BrowserAnimationsModule
    
    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
