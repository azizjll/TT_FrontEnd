import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class PdfExportService {

  exportCandidatures(
    candidatures: any[],
    rhNom: string,
    rhPrenom: string,
    directionNom: string,
    structureMap: Record<number, string> = {}
  ): void {

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const today = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    const primaryColor: [number, number, number] = [30, 80, 160];
    const lightBlue:    [number, number, number] = [235, 242, 255];
    const darkGray:     [number, number, number] = [45, 45, 55];
    const midGray:      [number, number, number] = [100, 100, 110];
    const white:        [number, number, number] = [255, 255, 255];
    const lineColor:    [number, number, number] = [200, 210, 230];

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const statusLabel = (s: string): string => ({
      'EN_ATTENTE':                  'En attente',
      'ACCEPTEE':                    'Acceptée',
      'REFUSEE':                     'Refusée',
      'EN_ATTENTE_VALIDATION_ADMIN': 'Valid. ADM',
      'A_CORRIGER':                  'À corriger',
    } as Record<string, string>)[s] ?? s;

    // ════════════════════════════════════════════
    // HEADER commun
    // ════════════════════════════════════════════
    const drawHeader = (subtitle: string) => {
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageW, 28, 'F');

      doc.setTextColor(...white);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('ÉTAT DES CANDIDATURES SAISONNIÈRES', pageW / 2, 11, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Direction : ${directionNom}  —  ${subtitle}`, pageW / 2, 20, { align: 'center' });

      doc.setFillColor(...lightBlue);
      doc.rect(0, 28, pageW, 16, 'F');

      doc.setTextColor(...darkGray);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Établi par :', 14, 35);
      doc.setFont('helvetica', 'normal');
      doc.text(`${rhPrenom} ${rhNom}`, 36, 35);

      doc.setFont('helvetica', 'bold');
      doc.text('Direction :', 14, 41);
      doc.setFont('helvetica', 'normal');
      doc.text(directionNom, 36, 41);

      doc.setFont('helvetica', 'bold');
      doc.text("Date d'édition :", pageW - 14, 35, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(today, pageW - 14, 41, { align: 'right' });

      doc.setDrawColor(...lineColor);
      doc.setLineWidth(0.3);
      doc.line(14, 47, pageW - 14, 47);
    };

    // ════════════════════════════════════════════
    // COULEUR STATUT — helper didDrawCell
    // ════════════════════════════════════════════
    const statutColors: Record<string, [number, number, number]> = {
      'EN_ATTENTE':                  [253, 230, 138],
      'ACCEPTEE':                    [187, 247, 208],
      'REFUSEE':                     [254, 202, 202],
      'EN_ATTENTE_VALIDATION_ADMIN': [221, 214, 254],
    };

    const colorStatutCell = (data: any, colIndex: number) => {
      if (data.section === 'body' && data.column.index === colIndex) {
        const statut = candidatures[data.row.index]?.statut;
        const color  = statutColors[statut];
        if (color) {
          doc.setFillColor(...color);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(...darkGray);
          doc.setFontSize(7);
          doc.text(
            statusLabel(statut),
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 2,
            { align: 'center' }
          );
        }
      }
    };

    // ════════════════════════════════════════════
    // PAGE 1 — Identité & Affectation
    // ════════════════════════════════════════════
    drawHeader('Partie 1 : Identité & Affectation');

    doc.setTextColor(...midGray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const intro =
      `Ce document récapitule les ${candidatures.length} candidature(s) saisonnières ` +
      `enregistrées sous la direction de ${directionNom}, établi par ${rhPrenom} ${rhNom} le ${today}.`;
    doc.text(intro, 14, 53, { maxWidth: pageW - 28 });

    // ── stats ──
    const total    = candidatures.length;
    const attente  = candidatures.filter(c => c.statut === 'EN_ATTENTE').length;
    const acceptes = candidatures.filter(c => c.statut === 'ACCEPTEE').length;
    const refuses  = candidatures.filter(c => c.statut === 'REFUSEE').length;
    const adminVal = candidatures.filter(c => c.statut === 'EN_ATTENTE_VALIDATION_ADMIN').length;

    const stats = [
      { label: 'Total',       val: total,    color: primaryColor },
      { label: 'En attente',  val: attente,  color: [234, 179, 8]  as [number,number,number] },
      { label: 'Acceptées',   val: acceptes, color: [22, 163, 74]  as [number,number,number] },
      { label: 'Refusées',    val: refuses,  color: [220, 38, 38]  as [number,number,number] },
      { label: 'Valid. ADM',  val: adminVal, color: [139, 92, 246] as [number,number,number] },
    ];

    const boxW = 34; const boxH = 13;
    const startX = 14; const startY = 59; const gap = 5;

    stats.forEach((s, i) => {
      const x = startX + i * (boxW + gap);
      doc.setFillColor(...s.color);
      doc.roundedRect(x, startY, boxW, boxH, 2, 2, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(String(s.val), x + boxW / 2, startY + 6.5, { align: 'center' });
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(s.label, x + boxW / 2, startY + 11, { align: 'center' });
    });

    // ── tableau page 1 ──
    // colonnes : # | Nom Prénom | CIN | Email | Téléphone | RIB | Direction | Structure | Mois | Date | Statut | Commentaire
    const rows1 = candidatures.map((c, idx) => [
      idx + 1,
      `${c.saisonnier.prenom} ${c.saisonnier.nom}`,
      c.saisonnier.cin         ?? '—',
      c.saisonnier.email       ?? '—',
      c.saisonnier.telephone   ?? '—',
      c.saisonnier.rib         ?? '—',
      c.saisonnier.region?.nom ?? '—',
      structureMap[c.id]       ?? '—',
      c.saisonnier.moisTravail ?? '—',
      c.dateDepot ? new Date(c.dateDepot).toLocaleDateString('fr-FR') : '—',
      statusLabel(c.statut),
      c.commentaire            ?? '—',
    ]);

    autoTable(doc, {
      startY: startY + boxH + 5,
      head: [[
        '#', 'Nom & Prénom', 'CIN', 'Email', 'Téléphone',
        'RIB', 'Direction', 'Structure', 'Mois', 'Date dépôt', 'Statut', 'Commentaire'
      ]],
      body: rows1,
      theme: 'grid',
      styles:      { fontSize: 7, cellPadding: 2.5, font: 'helvetica', textColor: darkGray, lineColor, lineWidth: 0.2 },
      headStyles:  { fillColor: primaryColor, textColor: white, fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
      alternateRowStyles: { fillColor: [248, 250, 255] as [number,number,number] },
      columnStyles: {
        0:  { halign: 'center', cellWidth: 7  },
        1:  { cellWidth: 30 },
        2:  { halign: 'center', cellWidth: 18 },
        3:  { cellWidth: 38 },
        4:  { halign: 'center', cellWidth: 18 },
        5:  { cellWidth: 32 },
        6:  { cellWidth: 25 },
        7:  { cellWidth: 28 },
        8:  { halign: 'center', cellWidth: 16 },
        9:  { halign: 'center', cellWidth: 18 },
        10: { halign: 'center', cellWidth: 22 },
        11: { cellWidth: 'auto' },
      },
      didDrawCell: (data) => colorStatutCell(data, 10),  // colonne 10 = Statut
    });

    // ════════════════════════════════════════════
    // PAGE 2 — Parent & Formation
    // ════════════════════════════════════════════
    doc.addPage();
    drawHeader('Partie 2 : Parent & Formation');

    doc.setTextColor(...midGray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Suite — informations relatives aux parents et à la formation des ${candidatures.length} candidat(s).`,
      14, 53, { maxWidth: pageW - 28 }
    );

    // colonnes : # | Nom Prénom | Nom Parent | Matricule Parent | Niveau étude | Diplôme | Spécialité | Statut
    const rows2 = candidatures.map((c, idx) => [
      idx + 1,
      `${c.saisonnier.prenom} ${c.saisonnier.nom}`,
      c.saisonnier.nomPrenomParent   ?? '—',
      c.saisonnier.matriculeParent   ?? '—',
      c.saisonnier.niveauEtude       ?? '—',
      c.saisonnier.diplome           ?? '—',
      c.saisonnier.specialiteDiplome ?? '—',
      statusLabel(c.statut),
    ]);

    autoTable(doc, {
      startY: 58,
      head: [[
        '#', 'Nom & Prénom',
        'Nom & Prénom Parent', 'Matricule Parent',
        "Niveau d'étude", 'Diplôme', 'Spécialité',
        'Statut'
      ]],
      body: rows2,
      theme: 'grid',
      styles:      { fontSize: 7.5, cellPadding: 3, font: 'helvetica', textColor: darkGray, lineColor, lineWidth: 0.2 },
      headStyles:  { fillColor: primaryColor, textColor: white, fontStyle: 'bold', fontSize: 8, halign: 'center' },
      alternateRowStyles: { fillColor: [248, 250, 255] as [number,number,number] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8  },
        1: { cellWidth: 42 },
        2: { cellWidth: 48 },
        3: { halign: 'center', cellWidth: 32 },
        4: { halign: 'center', cellWidth: 28 },
        5: { halign: 'center', cellWidth: 28 },
        6: { cellWidth: 'auto' },
        7: { halign: 'center', cellWidth: 28 },
      },
      didDrawCell: (data) => colorStatutCell(data, 7),  // colonne 7 = Statut
    });

    // ════════════════════════════════════════════
    // FOOTER sur toutes les pages
    // ════════════════════════════════════════════
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(...lineColor);
      doc.setLineWidth(0.3);
      doc.line(14, pageH - 10, pageW - 14, pageH - 10);

      doc.setTextColor(...midGray);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Document généré automatiquement — ${today} — ${directionNom}`,
        pageW / 2, pageH - 6, { align: 'center' }
      );

      doc.setFontSize(7);
      doc.text(`Page ${i} / ${totalPages}`, pageW - 14, pageH - 6, { align: 'right' });
    }

    doc.save(`etat-candidatures-${directionNom}-${today.replace(/\s/g, '-')}.pdf`);
  }
}