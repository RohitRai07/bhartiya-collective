/**
 * Universal Search Service for Bharat Collective Foundation
 * 
 * Provides instantaneous fuzzy/sub-string search across all published resources:
 * - Pages & Navigation Sections
 * - Centres & Thematic Wings
 * - Publications, Monographs & Digests
 * - Symposia, Conclaves & Events
 * - Podcasts & YouTube Video Dialogues
 * - Magazine Editions & Articles
 * - Circulars & Legal Materials
 * - Council, Fellows & Scholars
 * - National Team Members & State Chapters
 * - Careers & Fellowships
 */

import { BHARAT_CENTRES } from '../data/centresData';
import { publicationService } from './publicationService';
import { eventService } from './eventService';
import { podcastService } from './podcastService';
import { magazineService } from './magazineService';
import { circularService } from './circularService';
import { expertService } from './expertService';
import { teamService } from './teamService';
import { featureConfig } from '../config/featureConfig';

export type SearchCategory = 
  | 'page'
  | 'centre'
  | 'publication'
  | 'event'
  | 'podcast'
  | 'magazine'
  | 'circular'
  | 'scholar'
  | 'team'
  | 'chapter'
  | 'career';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: SearchCategory;
  categoryLabel: string;
  path: string;
  keywords?: string[];
  badgeColor?: string;
}

export const searchService = {
  /**
   * Search across all public resources
   */
  async search(query: string): Promise<SearchResultItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];

    // 1. Static Pages & Key Anchors
    const staticPages: SearchResultItem[] = [
      { id: 'p-home', title: 'Home', subtitle: 'Empowering Citizens. Advancing Policy. Transforming Bharat.', category: 'page', categoryLabel: 'Page', path: '/' },
      { id: 'p-about', title: 'About Bharat Collective Foundation', subtitle: 'Charter, Epistemology & Mission', category: 'page', categoryLabel: 'Page', path: '/about' },
      { id: 'p-who-is-who', title: 'Who is Who: Governing Council & Advisory Board', subtitle: 'Academic integrity and institutional guidance', category: 'page', categoryLabel: 'Section', path: '/about#who-is-who' },
      { id: 'p-national-team', title: 'National Executive Team', subtitle: 'Central leadership orchestrating research programs and dialogues', category: 'team', categoryLabel: 'Team', path: '/about#national-team' },
      { id: 'p-state-team', title: 'State Team & Regional Chapters', subtitle: 'State chapter coordinators and grassroots legal aid clinics', category: 'chapter', categoryLabel: 'Chapter', path: '/about#state-team' },
      { id: 'p-ethics', title: 'Code of Academic & Ethical Conduct', subtitle: 'Scholarly Integrity & Non-Partisan Charter', category: 'page', categoryLabel: 'Section', path: '/about#ethics' },
      { id: 'p-centres', title: 'Bharat Collective Centres', subtitle: '6 Frontier Research Institutes & Policy Wings', category: 'centre', categoryLabel: 'Hub', path: '/centres' },
      { id: 'p-events', title: 'Upcoming Events & #BharatDialogue Conclaves', subtitle: 'National workshops, roundtables and symposia', category: 'event', categoryLabel: 'Hub', path: '/events' },
      { id: 'p-publications', title: 'Research Publications & Monographs', subtitle: 'Open-access occasional papers and policy digests', category: 'publication', categoryLabel: 'Hub', path: '/publications' },
      { id: 'p-podcasts', title: 'Podcasts & YouTube Video Dialogues', subtitle: 'In-depth interviews and discussions with distinguished jurists', category: 'podcast', categoryLabel: 'Hub', path: '/podcasts' },
      { id: 'p-magazine', title: 'Magazine & Digital Editions', subtitle: 'Curated quarterly digest and articles', category: 'magazine', categoryLabel: 'Hub', path: '/magazine' },
      { id: 'p-career', title: 'Careers, Fellowships & Internships', subtitle: 'Join as Visiting Fellow, Research Associate, or Student Intern', category: 'career', categoryLabel: 'Career', path: '/career' },
      { id: 'p-support', title: 'Support Us & Contributions', subtitle: 'Pro bono legal assistance, research and dialogues funding', category: 'page', categoryLabel: 'Support', path: '/support-us' },
      { id: 'p-register', title: 'Membership & Volunteer Registration', subtitle: 'Open to students, researchers, lawyers and academics', category: 'page', categoryLabel: 'Register', path: '/register' },
      { id: 'p-circulars', title: 'Circulars, Statutory Acts & Legal Materials', subtitle: 'Indian legal gazettes, model policies and acts repository', category: 'circular', categoryLabel: 'Legal', path: '/circulars' },
    ];

    for (const page of staticPages) {
      if (
        page.title.toLowerCase().includes(q) ||
        page.subtitle.toLowerCase().includes(q) ||
        page.path.toLowerCase().includes(q)
      ) {
        results.push(page);
      }
    }

    // 2. Bharat Centres
    for (const centre of BHARAT_CENTRES) {
      if (
        centre.name.toLowerCase().includes(q) ||
        centre.shortName.toLowerCase().includes(q) ||
        centre.sanskritName.toLowerCase().includes(q) ||
        centre.description.toLowerCase().includes(q) ||
        centre.leadFellow.toLowerCase().includes(q) ||
        centre.keyThemes.some(t => t.toLowerCase().includes(q))
      ) {
        results.push({
          id: `centre-${centre.id}`,
          title: centre.name,
          subtitle: `${centre.sanskritName} • ${centre.leadFellow}`,
          category: 'centre',
          categoryLabel: 'Centre',
          path: `/centres#${centre.slug}`,
          keywords: centre.keyThemes,
        });
      }
    }

    // 3. Publications
    try {
      const pubs = await publicationService.getPublications();
      for (const pub of pubs) {
        if (
          pub.title.toLowerCase().includes(q) ||
          pub.abstract.toLowerCase().includes(q) ||
          pub.authors.some(a => a.toLowerCase().includes(q)) ||
          pub.category.toLowerCase().includes(q) ||
          (pub.tags && pub.tags.some(t => t.toLowerCase().includes(q)))
        ) {
          results.push({
            id: `pub-${pub.id}`,
            title: pub.title,
            subtitle: `By ${pub.authors.join(', ')} • ${pub.category.toUpperCase()}`,
            category: 'publication',
            categoryLabel: 'Publication',
            path: `/publications#${pub.id}`,
          });
        }
      }
    } catch {}

    // 4. Events
    try {
      const events = await eventService.getEvents();
      for (const evt of events) {
        if (
          evt.title.toLowerCase().includes(q) ||
          (evt.description && evt.description.toLowerCase().includes(q)) ||
          (evt.location && evt.location.toLowerCase().includes(q)) ||
          (evt.speakers && evt.speakers.some(s => s.name?.toLowerCase().includes(q) || s.affiliation?.toLowerCase().includes(q)))
        ) {
          results.push({
            id: `evt-${evt.id}`,
            title: evt.title,
            subtitle: `${evt.date} • ${evt.location || 'New Delhi'}`,
            category: 'event',
            categoryLabel: 'Event',
            path: `/events#${evt.id}`,
          });
        }
      }
    } catch {}

    // 5. Podcasts
    try {
      const pods = await podcastService.getPodcasts();
      for (const pod of pods) {
        if (
          pod.title.toLowerCase().includes(q) ||
          (pod.description && pod.description.toLowerCase().includes(q)) ||
          (pod.speaker && pod.speaker.toLowerCase().includes(q)) ||
          (pod.topic && pod.topic.toLowerCase().includes(q))
        ) {
          results.push({
            id: `pod-${pod.id}`,
            title: pod.title,
            subtitle: pod.speaker ? `With ${pod.speaker} • ${pod.duration}` : pod.duration,
            category: 'podcast',
            categoryLabel: 'Podcast',
            path: `/podcasts#${pod.id}`,
          });
        }
      }
    } catch {}

    // 6. Magazine
    try {
      const mags = await magazineService.getIssues();
      for (const mag of mags) {
        if (
          mag.title.toLowerCase().includes(q) ||
          mag.theme.toLowerCase().includes(q) ||
          (mag.description && mag.description.toLowerCase().includes(q)) ||
          (mag.tableOfContents && mag.tableOfContents.some(t => t.toLowerCase().includes(q)))
        ) {
          results.push({
            id: `mag-${mag.id}`,
            title: mag.title,
            subtitle: `${mag.issueNumber} • Theme: ${mag.theme}`,
            category: 'magazine',
            categoryLabel: 'Magazine',
            path: `/magazine#${mag.id}`,
          });
        }
      }
    } catch {}

    // 7. Circulars (if circulars module enabled)
    try {
      const circs = await circularService.getCirculars();
      for (const c of circs) {
        if (
          c.title.toLowerCase().includes(q) ||
          (c.summary && c.summary.toLowerCase().includes(q)) ||
          (c.issuingAuthority && c.issuingAuthority.toLowerCase().includes(q)) ||
          (c.tags && c.tags.some(t => t.toLowerCase().includes(q)))
        ) {
          results.push({
            id: `circ-${c.id}`,
            title: c.title,
            subtitle: `${c.issuingAuthority} • ${c.category.toUpperCase()}`,
            category: 'circular',
            categoryLabel: 'Circular',
            path: `/circulars#${c.id}`,
          });
        }
      }
    } catch {}

    // 8. Scholars & Council
    try {
      const scholars = await expertService.getExperts();
      for (const s of scholars) {
        if (
          s.name.toLowerCase().includes(q) ||
          s.designation.toLowerCase().includes(q) ||
          s.institution.toLowerCase().includes(q) ||
          s.biography.toLowerCase().includes(q) ||
          s.focusAreas.some(f => f.toLowerCase().includes(q))
        ) {
          results.push({
            id: `sch-${s.id}`,
            title: s.name,
            subtitle: `${s.designation} • ${s.institution}`,
            category: 'scholar',
            categoryLabel: 'Scholar',
            path: `/about#who-is-who`,
          });
        }
      }
    } catch {}

    // 9. National Team
    try {
      if (featureConfig.isEnabled('nationalTeam')) {
        const team = await teamService.getNationalTeam();
        for (const m of team) {
          if (
            m.name.toLowerCase().includes(q) ||
            m.role.toLowerCase().includes(q) ||
            m.affiliation.toLowerCase().includes(q) ||
            m.desc.toLowerCase().includes(q)
          ) {
            results.push({
              id: `nat-${m.id}`,
              title: m.name,
              subtitle: `${m.role} • ${m.affiliation}`,
              category: 'team',
              categoryLabel: 'National Team',
              path: `/about#national-team`,
            });
          }
        }
      }
    } catch {}

    // 10. State Chapters
    try {
      if (featureConfig.isEnabled('stateTeam')) {
        const chapters = await teamService.getStateChapters();
        for (const c of chapters) {
          if (
            c.state.toLowerCase().includes(q) ||
            c.convener.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q) ||
            c.focus.toLowerCase().includes(q)
          ) {
            results.push({
              id: `sc-${c.id}`,
              title: c.state,
              subtitle: `Convener: ${c.convener} (${c.city}) • Focus: ${c.focus}`,
              category: 'chapter',
              categoryLabel: 'State Chapter',
              path: `/about#state-team`,
            });
          }
        }
      }
    } catch {}

    return results;
  }
};
