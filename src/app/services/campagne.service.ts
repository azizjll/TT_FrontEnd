import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface CampagneRequestDTO {
  libelle: string;
  code?: string;
  dateDebut: string;
  dateFin: string;
  description?: string;
  budget?: number;
  regionIds: number[];
}

export interface Campagne {
  id: number;
  libelle: string;
  code: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
}

@Injectable({
  providedIn: 'root'
})
export class CampagneService {

  private baseUrl = 'http://localhost:8080/api/campagnes';

  private getAuthHeaders(): { headers: HttpHeaders } {
  return { headers: this.authService['authHeaders']() }; // utilise la méthode privée authHeaders()
}

  constructor(private http: HttpClient,private authService: AuthService) {}

  // CREATE
  creerCampagne(dto: CampagneRequestDTO): Observable<Campagne> {
  return this.http.post<Campagne>(this.baseUrl, dto, this.getAuthHeaders());
}

  // READ
  getToutesCampagnes(): Observable<Campagne[]> {
    return this.http.get<Campagne[]>(this.baseUrl, this.getAuthHeaders());
  }

  getCampagneParId(id: number): Observable<Campagne> {
    return this.http.get<Campagne>(`${this.baseUrl}/${id}`);
  }

  getCampagnesActives(): Observable<Campagne[]> {
    return this.http.get<Campagne[]>(`${this.baseUrl}/actives`);
  }

  // UPDATE
  updateCampagne(id: number, dto: CampagneRequestDTO): Observable<Campagne> {
    return this.http.put<Campagne>(`${this.baseUrl}/${id}`, dto);
  }

  // DELETE
  deleteCampagne(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // BUSINESS
  activerCampagne(id: number): Observable<Campagne> {
  return this.http.put<Campagne>(`${this.baseUrl}/${id}/activer`, {}, this.getAuthHeaders());
}

  cloturerCampagne(id: number): Observable<Campagne> {
    return this.http.put<Campagne>(`${this.baseUrl}/${id}/cloturer`, {});
  }
}