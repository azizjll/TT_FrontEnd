import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({ name: 'safe' })
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string): SafeResourceUrl | null {
    if (!url) return null;

    // ✅ Validation — URLs autorisées uniquement
    const urlAutorisee =
      url.startsWith('blob:') ||
      url.startsWith('/files/') ||
      url.startsWith('http://172.20.80.148') ||
      url.startsWith('http://172.20.36.132') ||
      url.startsWith('http://localhost:8080');

    if (!urlAutorisee) {
      console.warn('SafePipe: URL non autorisée bloquée :', url);
      return null;
    }

    // ✅ bypass justifié : URL validée contre les origines autorisées
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}