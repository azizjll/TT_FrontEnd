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
  telephone?: string; 
}

export interface AgentResultat {
  nom:     string;
  action:  'APPELER' | 'AVERTIR' | 'REJETER';
  statut:  string;
  call_id: string;
}

export interface AgentResponse {
  status:    string;
  message:   string;
  resultats: AgentResultat[];
}

@Injectable({ providedIn: 'root' })
export class SaisonnierService {
  private readonly API = 'http://localhost:8080/api/saisonniers';
    private readonly AGENT_URL = 'http://localhost:5003';   // ← ajouter


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

 lancerAgent(
    campagneId:   number,
    regionId:     number,
    seuil:        number,
    absencesData: Record<string, number>   // { "0612345678": 5, ... }
  ): Observable<AgentResponse> {
    return this.http.post<AgentResponse>(`${this.AGENT_URL}/lancer`, {
      campagne_id:   campagneId,
      region_id:     regionId,
      seuil:         seuil,
      absences_data: absencesData
    });
  }

}