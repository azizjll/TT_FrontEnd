// saisonnier.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SaisonnierDTO {
  id: number;
  nom: string;
  prenom: string;
  cin: number;
  rib: string;
}

@Injectable({ providedIn: 'root' })
export class SaisonnierService {
  private readonly API = 'https://tt-backend-b7j3.onrender.com/api/saisonniers';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SaisonnierDTO[]> {
    return this.http.get<SaisonnierDTO[]>(this.API);
  }

  getById(id: number): Observable<SaisonnierDTO> {
    return this.http.get<SaisonnierDTO>(`${this.API}/${id}`);
  }

  getByCampagneAndRegion(campagneId: number, regionId: number): Observable<SaisonnierDTO[]> {
    return this.http.get<SaisonnierDTO[]>(
        `${this.API}/by-campagne-region?campagneId=${campagneId}&regionId=${regionId}`
    );
}

getByCampagneAndStructure(campagneId: number, structureId: number): Observable<SaisonnierDTO[]> {
    return this.http.get<SaisonnierDTO[]>(
        `${this.API}/by-campagne-structure?campagneId=${campagneId}&structureId=${structureId}`
    );
}

}