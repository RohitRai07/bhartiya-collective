/**
 * PDF Generation Service for Bharat Collective Publications
 * 
 * Generates branded, peer-reviewed, open-access scholarly PDFs on the client-side
 * using jsPDF with authentic Indic typography, metadata, and Creative Commons licensing.
 */

import { jsPDF } from 'jspdf';
import { Publication } from '../types/publication';
import { Circular } from '../types/circular';
import { siteConfig } from '../config/siteConfig';

export const pdfService = {
  /**
   * Build the complete jsPDF document instance with academic styling
   */
  buildPublicationPdf(publication: Publication): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // --- 1. Institutional Top Decorative Header ---
    doc.setFillColor(154, 52, 18); // Deep Amber-800
    doc.rect(0, 0, pageWidth, 18, 'F');

    doc.setFillColor(217, 119, 6); // Warm Amber-600
    doc.rect(0, 18, pageWidth, 2.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('BHARAT COLLECTIVE FOUNDATION • OPEN ACCESS SCHOLARLY REPOSITORY', margin, 11);

    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text('ESTD. 2024 • NEW DELHI, BHARAT', pageWidth - margin, 11, { align: 'right' });

    let currentY = 32;

    // --- 2. Category Pill & Metadata Tag ---
    doc.setFillColor(254, 243, 199); // Amber-100
    doc.roundedRect(margin, currentY, 48, 7, 2, 2, 'F');
    doc.setDrawColor(245, 158, 11); // Amber-500
    doc.roundedRect(margin, currentY, 48, 7, 2, 2, 'S');

    doc.setTextColor(146, 64, 14); // Amber-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const categoryText = (publication.category || 'POLICY MONOGRAPH').toUpperCase();
    doc.text(categoryText, margin + 4, currentY + 4.8);

    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const refCode = publication.isbn ? `ISBN: ${publication.isbn}` : `REF: BCF-PUB-${publication.id.replace('pub-', '')}`;
    doc.text(refCode, pageWidth - margin, currentY + 5, { align: 'right' });

    currentY += 15;

    // --- 3. Title & Subtitle ---
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont('times', 'bold');
    doc.setFontSize(20);

    const titleLines = doc.splitTextToSize(publication.title, contentWidth);
    doc.text(titleLines, margin, currentY);
    currentY += titleLines.length * 8 + 3;

    if (publication.subtitle) {
      doc.setTextColor(120, 53, 15); // Amber-900
      doc.setFont('times', 'italic');
      doc.setFontSize(12);
      const subLines = doc.splitTextToSize(publication.subtitle, contentWidth);
      doc.text(subLines, margin, currentY);
      currentY += subLines.length * 6 + 6;
    } else {
      currentY += 4;
    }

    // --- 4. Authors and Date Bar ---
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 7;

    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    const authorsText = `Authors: ${publication.authors.join(', ')}`;
    doc.text(authorsText, margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Published: ${publication.publishedDate || '2026'} • Pages: ${publication.pages || 48}`, pageWidth - margin, currentY, { align: 'right' });

    currentY += 5;
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 12;

    // --- 5. Executive Summary / Abstract Block ---
    doc.setFillColor(250, 248, 245); // Warm cream paper background
    doc.roundedRect(margin, currentY, contentWidth, 54, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 54, 3, 3, 'S');

    doc.setTextColor(180, 83, 9); // Amber-700
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('EXECUTIVE ABSTRACT & EPISTEMIC SCOPE', margin + 6, currentY + 8);

    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const abstractLines = doc.splitTextToSize(publication.abstract, contentWidth - 12);
    doc.text(abstractLines, margin + 6, currentY + 16);

    currentY += 62;

    // --- 6. Core Methodology & Thematic Pillars ---
    doc.setTextColor(15, 23, 42);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Epistemic Pillars & Thematic Coverage', margin, currentY);
    currentY += 7;

    const pillars = [
      {
        title: '1. Primary Source Exegesis (Pramana Shastra)',
        desc: 'Direct engagement with classical Indian administrative, ecological, and jurisprudential manuscripts free from derivative colonial frameworks.',
      },
      {
        title: '2. Empirical Fieldwork & Ground-Truthing',
        desc: 'Field verification across districts, stepwells, governance councils, and academic case repositories.',
      },
      {
        title: '3. Actionable Policy Formulation',
        desc: 'Translating civilizational insights into concrete legislative models, policy briefs, and institutional guidelines.',
      },
    ];

    pillars.forEach(p => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(120, 53, 15); // Amber-900
      doc.text(p.title, margin + 2, currentY);
      currentY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // Slate-600
      const descLines = doc.splitTextToSize(p.desc, contentWidth - 4);
      doc.text(descLines, margin + 2, currentY);
      currentY += descLines.length * 4.5 + 3;
    });

    currentY += 4;

    // --- 7. Keyword Index ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Index Terms & Keywords:', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(publication.tags.join(' • '), margin + 42, currentY);

    // --- 8. Bottom Institutional Footer ---
    const footerY = pageHeight - 22;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Licensed under Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0).', margin, footerY + 5);
    doc.text('Bharat Collective Foundation • Constitution Club Area, Rafi Marg, New Delhi 110001 • secretariat@bharatcollective.org', margin, footerY + 9);
    doc.text(`Page 1 of 1 • Official Electronic Release • ${siteConfig.name}`, pageWidth - margin, footerY + 5, { align: 'right' });

    return doc;
  },

  /**
   * Generate and trigger instant browser download of a Publication PDF
   */
  async downloadPublicationPdf(publication: Publication): Promise<void> {
    const doc = this.buildPublicationPdf(publication);
    const sanitizedTitle = publication.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');
    const filename = `BharatCollective_${sanitizedTitle}.pdf`;

    doc.save(filename);
  },

  /**
   * Build the complete jsPDF document instance for Circulars & Legal Materials
   */
  buildCircularPdf(circular: Circular): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // --- 1. Institutional Top Decorative Header ---
    doc.setFillColor(15, 23, 42); // Deep Slate-900 / Judicial Navy
    doc.rect(0, 0, pageWidth, 18, 'F');

    doc.setFillColor(217, 119, 6); // Warm Gold / Amber-600
    doc.rect(0, 18, pageWidth, 2.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('BHARAT COLLECTIVE LEGAL ARCHIVES • OFFICIAL STATUTORY COMPENDIUM', margin, 11);

    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text('CONSTITUTIONAL & STATUTORY REPOSITORY', pageWidth - margin, 11, { align: 'right' });

    let currentY = 30;

    // --- 2. Gazette & Category Pill ---
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.roundedRect(margin, currentY, 55, 7, 2, 2, 'F');
    doc.setDrawColor(148, 163, 184); // Slate-400
    doc.roundedRect(margin, currentY, 55, 7, 2, 2, 'S');

    doc.setTextColor(15, 23, 42); // Slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const categoryName = (circular.category || 'guidelines').replace(/_/g, ' ').toUpperCase();
    doc.text(categoryName, margin + 4, currentY + 4.8);

    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Ref: ${circular.circularNumber}`, margin + 60, currentY + 4.8);

    currentY += 13;

    // --- 3. Document Title & Authority ---
    doc.setTextColor(15, 23, 42);
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(circular.title, contentWidth);
    doc.text(titleLines, margin, currentY);
    currentY += titleLines.length * 7 + 2;

    // Authority and Date Bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(146, 64, 14); // Amber-800
    doc.text(`Issuing Authority: ${circular.issuingAuthority}`, margin, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Enacted / Released: ${circular.releaseDate} • Effective: ${circular.effectiveDate || circular.releaseDate} • Language: ${circular.language}`, margin, currentY);
    currentY += 8;

    // Decorative separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    // --- 4. Legislative Summary / Scope Box ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('STATEMENT OF OBJECTS & LEGISLATIVE SCOPE', margin, currentY);
    currentY += 4.5;

    const summaryLines = doc.splitTextToSize(circular.summary, contentWidth - 8);
    const boxHeight = summaryLines.length * 4.5 + 8;

    doc.setFillColor(248, 250, 252); // Slate-50
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, 'S');

    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text(summaryLines, margin + 4, currentY + 6);
    currentY += boxHeight + 8;

    // --- 5. Key Statutory Provisions ---
    if (circular.keyProvisions && circular.keyProvisions.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('KEY STATUTORY PROVISIONS & STATUTORY ARTICLES', margin, currentY);
      currentY += 5;

      circular.keyProvisions.slice(0, 5).forEach((prov, idx) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(180, 83, 9); // Amber-700
        doc.text(`§ ${idx + 1}.`, margin + 2, currentY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105); // Slate-600
        const provLines = doc.splitTextToSize(prov, contentWidth - 14);
        doc.text(provLines, margin + 10, currentY);
        currentY += provLines.length * 4.2 + 2.5;
      });
      currentY += 4;
    }

    // --- 6. Keyword Index ---
    if (circular.tags && circular.tags.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Subject Taxonomy & Citation Tags:', margin, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(circular.tags.join(' • '), margin + 55, currentY);
    }

    // --- 7. Bottom Institutional Footer ---
    const footerY = pageHeight - 22;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Public Interest Legal Archive • Preserving Constitutional Jurisprudence & Open Law Access.', margin, footerY + 5);
    doc.text('Bharat Collective Foundation • Constitution Club Area, Rafi Marg, New Delhi 110001 • legal@bharatcollective.org', margin, footerY + 9);
    doc.text(`Official Document Archive • ${siteConfig.name}`, pageWidth - margin, footerY + 5, { align: 'right' });

    return doc;
  },

  /**
   * Download a circular or legal document PDF
   */
  async downloadCircularPdf(circular: Circular): Promise<void> {
    // 1. If user uploaded a real PDF via drag & drop (Data URL)
    if (circular.pdfDataUrl && circular.pdfDataUrl.startsWith('data:application/pdf')) {
      const link = document.createElement('a');
      link.href = circular.pdfDataUrl;
      link.download = circular.fileName || `${circular.shortTitle || 'Circular'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 2. Otherwise generate branded institutional legal compendium PDF
    const doc = this.buildCircularPdf(circular);
    const sanitizedTitle = (circular.shortTitle || circular.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');
    const filename = `BharatCollective_Legal_${sanitizedTitle}.pdf`;

    doc.save(filename);
  }
};
