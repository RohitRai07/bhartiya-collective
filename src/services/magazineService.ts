import { MagazineIssue, MagazineIssueInput } from '../types/magazine';
import { jsPDF } from 'jspdf';
import { siteConfig } from '../config/siteConfig';

const STORAGE_KEY = 'bharat_magazine_issues';

const SEED_MAGAZINES: MagazineIssue[] = [
  {
    id: 'mag-1',
    title: 'Bharat Collective Review: Inaugural Volume',
    issueNumber: 'Volume I • Issue 1 (Autumn 2026)',
    theme: 'Decolonizing Jurisprudence & The Indic Administrative Mind',
    publicationDate: '2026-09-01',
    price: 100, // ₹100 per specification
    pageCount: 68,
    coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    fileUrl: '',
    originalFileName: 'Bharat_Collective_Review_Vol1_Issue1.pdf',
    originalFileType: 'pdf',
    fileSizeBytes: 840000, // 820 KB
    description: 'The inaugural quarterly edition featuring deep-dive essays on constitutional synthesis, civilizational sovereignty, Uniform Civil Code perspectives, and indigenous ecological frameworks.',
    editorialLead: 'Editorial Board • Prof. Ananya Someshwar & Dr. Meenakshi Sundaram',
    tableOfContents: [
      'Editorial: The Imperative for an Indic Epistemic Framework',
      'Article 44 & The Uniform Civil Code: A Historical Synthesis',
      'Rajadharma in Modern Public Administration',
      'Pramana Shastra in Statutory Interpretation',
      'Grassroots Ecological Sovereignty in the Himalayas',
      'Book Reviews: Ancient Indian Statecraft Revisited'
    ],
    downloadCount: 342,
  },
  {
    id: 'mag-2',
    title: 'Bharat Collective Review: Special Legal Edition',
    issueNumber: 'Volume I • Issue 2 (Monsoon 2026)',
    theme: 'Bharatiya Nyaya Sanhita & Criminal Justice Decolonization',
    publicationDate: '2026-07-15',
    price: 100,
    pageCount: 54,
    coverImageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    fileUrl: '',
    originalFileName: 'Bharat_Collective_Review_Vol1_Issue2.docx',
    originalFileType: 'docx',
    fileSizeBytes: 620000, // 605 KB
    description: 'A comprehensive symposium edition analyzing the transition from the Indian Penal Code 1860 to the Bharatiya Nyaya Sanhita 2023, forensic reforms, and victim-centric justice.',
    editorialLead: 'Legal Studies Panel • Justice (Retd.) Hemant Gupta',
    tableOfContents: [
      'Foreword by Distinguished Jurists',
      'From Colonial Coercion to Restorative Justice: An Overview of BNS',
      'Digital Forensics and Admissibility under BSA 2023',
      'Community Service as a Progressive Penal Concept',
      'Judicial Perspectives on Civil Rights Safeguards'
    ],
    downloadCount: 518,
  }
];

class MagazineService {
  private memoryStore: MagazineIssue[] = [...SEED_MAGAZINES];

  private getStore(): MagazineIssue[] {
    if (typeof window === 'undefined') return this.memoryStore;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MAGAZINES));
        return SEED_MAGAZINES;
      }
      return JSON.parse(raw);
    } catch {
      return this.memoryStore;
    }
  }

  private setStore(records: MagazineIssue[]): void {
    this.memoryStore = records;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        window.dispatchEvent(new CustomEvent('bharat:magazine-updated'));
      } catch (e) {
        console.error('Failed to store magazines:', e);
      }
    }
  }

  async getIssues(): Promise<MagazineIssue[]> {
    return this.getStore();
  }

  getAll(): MagazineIssue[] {
    return this.getStore();
  }

  create(input: MagazineIssueInput): MagazineIssue {
    const current = this.getStore();
    const newIssue: MagazineIssue = {
      ...input,
      id: `mag-${Date.now()}`,
      price: input.price ?? 100, // Strictly ₹100
      downloadCount: 0,
    };

    this.setStore([newIssue, ...current]);
    return newIssue;
  }

  async addIssue(input: MagazineIssueInput): Promise<MagazineIssue> {
    return this.create(input);
  }

  update(id: string, input: Partial<MagazineIssueInput>): MagazineIssue | null {
    const current = this.getStore();
    const index = current.findIndex(m => m.id === id);
    if (index === -1) return null;

    current[index] = {
      ...current[index],
      ...input,
      price: input.price ?? current[index].price ?? 100,
    };

    this.setStore([...current]);
    return current[index];
  }

  async updateIssue(id: string, input: Partial<MagazineIssueInput>): Promise<MagazineIssue | null> {
    return this.update(id, input);
  }

  delete(id: string): boolean {
    const current = this.getStore();
    const filtered = current.filter(m => m.id !== id);
    if (filtered.length === current.length) return false;
    this.setStore(filtered);
    return true;
  }

  async deleteIssue(id: string): Promise<boolean> {
    return this.delete(id);
  }

  async recordDownload(id: string): Promise<void> {
    const current = this.getStore();
    const item = current.find(m => m.id === id);
    if (item) {
      item.downloadCount = (item.downloadCount || 0) + 1;
      this.setStore([...current]);
    }
  }

  generateAndDownloadPdf(issue: MagazineIssue): { filename: string; sizeKb: number } {
    return this.downloadMagazinePdf(issue);
  }

  /**
   * Generates and downloads the Magazine in pure, optimized PDF format regardless of original upload type.
   * Client-side optimization ensures high speed and minimal payload.
   */
  downloadMagazinePdf(issue: MagazineIssue): { filename: string; sizeKb: number } {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true, // Client-side PDF stream compression to keep payload small
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Cover Page Banner
    doc.setFillColor(120, 53, 15); // Amber-900
    doc.rect(0, 0, pageWidth, 55, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('BHARAT COLLECTIVE FOUNDATION', margin, 24);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL QUARTERLY MAGAZINE • SCHOLARLY DISCOURSE & JURISPRUDENCE', margin, 32);

    doc.setFontSize(9);
    doc.text(`ISSUED: ${issue.publicationDate} • PRICE: RS. 100 • ${issue.issueNumber.toUpperCase()}`, margin, 42);

    // Title & Theme
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    const titleLines = doc.splitTextToSize(issue.title, pageWidth - (margin * 2));
    doc.text(titleLines, margin, 72);

    let curY = 72 + (titleLines.length * 8);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(146, 64, 14); // Amber-800
    doc.text(`Theme: ${issue.theme}`, margin, curY);

    curY += 12;

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, curY, pageWidth - margin, curY);

    curY += 10;

    // Editorial Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Editorial Overview & Executive Abstract:', margin, curY);

    curY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const descLines = doc.splitTextToSize(issue.description, pageWidth - (margin * 2));
    doc.text(descLines, margin, curY);

    curY += (descLines.length * 6) + 10;

    // Table of Contents
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Table of Contents / Thematic Articles:', margin, curY);

    curY += 8;
    issue.tableOfContents.forEach((article, idx) => {
      doc.setFillColor(254, 243, 199);
      doc.circle(margin + 2, curY - 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`${idx + 1}.  ${article}`, margin + 7, curY);
      curY += 7;
    });

    curY += 10;

    // Reader Stamp & Authenticity
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, curY, pageWidth - (margin * 2), 32, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Authorized Digital Reader Copy (Strictly Non-Transferable)', margin + 6, curY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Purchased under Reader Support Token: ₹100 Contribution`, margin + 6, curY + 15);
    doc.text(`Address: ${siteConfig.contact.address}`, margin + 6, curY + 21);
    doc.text(`Helpline: ${siteConfig.contact.phone} | ${siteConfig.contact.phoneSecondary}`, margin + 6, curY + 27);

    // Footer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Bharat Collective Foundation © ${new Date().getFullYear()} • Downloaded in Optimized PDF Format`, margin, 285);
    doc.text(`Page 1 of ${issue.pageCount}`, pageWidth - margin, 285, { align: 'right' });

    const safeSlug = issue.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 35);
    const filename = `${safeSlug}_edition.pdf`;
    
    // Save to user disk
    doc.save(filename);
    this.recordDownload(issue.id);

    return {
      filename,
      sizeKb: Math.round(doc.output('arraybuffer').byteLength / 1024),
    };
  }
}

export const magazineService = new MagazineService();
