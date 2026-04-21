import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StructureDTO {
  id: number;
  nom: string;
  type: 'EC' | 'CT';
  region: string;
  adresse: string;
  autorises: number;
  recrutes: number;
}

@Injectable({ providedIn: 'root' })
export class StructureImportService {
  private base = 'https://tt-backend-b7j3.onrender.com/structures';

  constructor(private http: HttpClient) {}

  getAll(): Observable<StructureDTO[]> {
    return this.http.get<StructureDTO[]>(this.base);
  }

  importExcel(file: File): Observable<{ message: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ message: string }>(`${this.base}/import-excel`, form);
  }
}