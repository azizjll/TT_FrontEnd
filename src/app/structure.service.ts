import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Une seule interface — plus de Structure
export interface StructureDTO {
  id: number;
  nom: string;
  type: 'ESPACE_COMMERCIAL' | 'CENTRE_TECHNOLOGIQUE';
  region: string;
  adresse: string;
  autorises: number;
  recrutes: number;
  disponible: boolean;
}

@Injectable({ providedIn: 'root' })
export class StructureService {
  private baseUrl = 'http://localhost:8080/api/structures';

  constructor(private http: HttpClient) {}

   // ── helper privé ─────────────────────────────────────────────
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // même clé que authService.setToken()
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getStructuresByRegion(regionId: number, campagneId?: number): Observable<StructureDTO[]> {
    const params = campagneId ? `?campagneId=${campagneId}` : '';
    return this.http.get<StructureDTO[]>(`${this.baseUrl}/region/${regionId}${params}`);
}

  updateStructure(id: number, dto: Partial<StructureDTO>): Observable<any> {
  return this.http.put(`${this.baseUrl}/${id}`, dto, { responseType: 'text' });
}
 getStructuresCampagneActive(): Observable<StructureDTO[]> {
    return this.http.get<StructureDTO[]>(
      `${this.baseUrl}/campagne-active`,
      { headers: this.getHeaders() }
    );
  }

  // Structures de la campagne active — sans JWT (public)
getStructuresCampagneActivePublique(): Observable<StructureDTO[]> {
  return this.http.get<StructureDTO[]>(
    `${this.baseUrl}/campagne-active/publique`
  );
}


}