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



  // Dans candidature.service.ts
analyserCandidature(id: number): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}/${id}/analyser`, {});
}

getAnalyse(id: number): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/${id}/analyse`);
}

  /**
   * Dépose une candidature sans JWT
   */
  deposerCandidature(formData: FormData): Observable<any> {
  const token = localStorage.getItem('token');
  return this.http.post<any>(`${this.baseUrl}/depot`, formData, {
    headers: {
      Authorization: `Bearer ${token}`   // 🆕
    }
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

envoyerDemandeJuilletAout(payload: {
  candidatureId: number;
  commentaire: string;
  directionNom: string;
}): Observable<any> {
  return this.http.post(`${this.baseUrl}/demande-autorisation`, payload);
}

getParentByMatricule(matricule: string): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/parent-by-matricule?matricule=${matricule}`);
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

uploadParentsExcel(file: File): Observable<string> {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post(`${this.baseUrl}/upload-parents`, formData, { responseType: 'text' });
}

getDocumentsByToken(): Observable<any[]> {
  const token = localStorage.getItem('token');
  return this.http.get<any[]>(`${this.baseUrl}/mes-documents`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

getMonProfil(): Observable<any> {
  const token = localStorage.getItem('token');
  return this.http.get<any>(`${this.baseUrl}/mon-profil`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

getStructureByCandidature(candidatureId: number): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/${candidatureId}/structure`);
}

}