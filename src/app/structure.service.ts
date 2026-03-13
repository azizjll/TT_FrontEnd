import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// structure.service.ts
export interface Structure {
  id: number;
  nom: string;
  type: 'ESPACE_COMMERCIAL' | 'CENTRE_TECHNOLOGIQUE';
  regionId: number;
  adresse?: string;
  affectations?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class StructureService {

  private baseUrl = 'http://localhost:8080/api/structures';

  constructor(private http: HttpClient) { }

  // récupérer les structures par région
  getStructuresByRegion(regionId: number): Observable<Structure[]> {
    return this.http.get<Structure[]>(`${this.baseUrl}/region/${regionId}`);
  }
}