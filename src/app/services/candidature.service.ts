import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Candidature {
  id: number;
  campagne: any;      // Tu peux créer un interface Campagne plus tard
  commentaire: string | null;
  dateDepot: string;
  documents: any[];   // idem, tu peux typer Document
  saisonnier: any;    // idem pour Saisonier
  statut: string;
}

@Injectable({
  providedIn: 'root'
})
export class CandidatureService {

  private baseUrl = 'http://localhost:8080/api/candidatures';

  constructor(private http: HttpClient) {}

  /**
   * Dépose une candidature sans JWT
   */
  deposerCandidature(formData: FormData): Observable<string> {
    return this.http.post(`${this.baseUrl}/depot`, formData, {
      responseType: 'text'  // réponse texte pour éviter erreur JSON
    });
  }

  /**
   * Récupère les candidatures filtrées par campagne et région
   */
  getCandidaturesByCampagneAndRegion(campagneId: number, regionId: number): Observable<Candidature[]> {
    return this.http.get<Candidature[]>(`${this.baseUrl}/filtrer?campagneId=${campagneId}&regionId=${regionId}`);
  }

  /**
   * Récupère toutes les candidatures
   */
  getAllCandidatures(): Observable<Candidature[]> {
    return this.http.get<Candidature[]>(`${this.baseUrl}/all`); // ← /all pour correspondre à ton endpoint Spring Boot
  }
  updateCandidature(id: number, formData: FormData) {
  return this.http.put(`${this.baseUrl}/update/${id}`, formData);
}
}