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
