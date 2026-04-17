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
  deposerCandidature(formData: FormData) {
  return this.http.post<any>(`${this.baseUrl}/depot`, formData);
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

getDocumentsBySaisonnier(saisonnierId: number) {
  return this.http.get<any[]>(`${this.baseUrl}/documents?saisonnierId=${saisonnierId}`);
}

getSaisonnierById(id: number) {
  return this.http.get<any>(`${this.baseUrl}/saisonnier/${id}`);
}
getMonHistorique(): Observable<any[]> {
  const token = localStorage.getItem('token');

  return this.http.get<any[]>(`${this.baseUrl}/mon-historique`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

}