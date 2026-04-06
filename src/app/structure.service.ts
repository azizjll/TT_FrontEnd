import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getStructuresByRegion(regionId: number): Observable<StructureDTO[]> {
    return this.http.get<StructureDTO[]>(`${this.baseUrl}/region/${regionId}`);
  }

  updateStructure(id: number, dto: Partial<StructureDTO>): Observable<any> {
  return this.http.put(`${this.baseUrl}/${id}`, dto, { responseType: 'text' });
}
}