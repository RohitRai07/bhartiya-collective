export interface BharatCentre {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  sanskritName: string;
  description: string;
  leadFellow: string;
  keyThemes: string[];
  focusAreas: string[];
  icon: string;
  status?: 'published' | 'draft';
}

export const BHARAT_CENTRES: BharatCentre[] = [
  {
    id: 'centre-human-rights-legal-aid',
    slug: 'human-rights-legal-aid',
    name: 'Center for Human Rights & Legal Aid',
    shortName: 'Human Rights & Legal Aid',
    sanskritName: 'मानव अधिकार एवं विधि सहायता केंद्र',
    description: 'Providing pro-bono constitutional advocacy, legal aid clinics for underprivileged citizens, and researching civil rights within indigenous jurisprudence.',
    leadFellow: 'Sr. Adv. J. Sai Deepak & Legal Aid Panel',
    keyThemes: ['Pro-Bono Legal Assistance', 'Fundamental Rights', 'Prisoner Rehabilitation', 'Tribal & Marginalized Legal Defense'],
    focusAreas: ['Access to Justice', 'Statutory Redressal', 'Public Interest Litigation (PIL)', 'Grassroots Legal Clinics'],
    icon: 'Scale',
  },
  {
    id: 'centre-labour-rights',
    slug: 'labour-rights-policy',
    name: 'Center for Labour Rights Policy',
    shortName: 'Labour Rights Policy',
    sanskritName: 'श्रम अधिकार एवं नीति केंद्र',
    description: 'Analyzing labour welfare legislation, unorganized sector social security, gig worker protections, and traditional artisanal guilds (Shreni) models.',
    leadFellow: 'Prof. Ananya Someshwar',
    keyThemes: ['Gig Economy Protections', 'Unorganized Workforce Welfare', 'Shreni Guild Economics', 'Workplace Safety'],
    focusAreas: ['Social Security Code Implementation', 'Occupational Safety Audits', 'Artisanal Livelihood Protection'],
    icon: 'Users',
  },
  {
    id: 'centre-public-policy',
    slug: 'public-policy-studies',
    name: 'Center for Public Policy / Studies',
    shortName: 'Public Policy / Studies',
    sanskritName: 'लोक नीति एवं अध्ययन केंद्र',
    description: 'Formulating evidence-based governance blueprints, regulatory reforms, decentralized district administration, and comparative fiscal federalism.',
    leadFellow: 'Dr. Meenakshi Sundaram',
    keyThemes: ['Decentralized Governance', 'Fiscal Federalism', 'Public Administration Reform', 'Civil Service Capability Building'],
    focusAreas: ['Panchayati Raj Institutional Strength', 'Municipal Finance', 'Participatory Policymaking'],
    icon: 'Landmark',
  },
  {
    id: 'centre-women-rights',
    slug: 'women-rights',
    name: 'Center for Women Rights',
    shortName: 'Women Rights',
    sanskritName: 'स्त्री अधिकार एवं कल्याण केंद्र',
    description: 'Advancing gender justice, economic self-reliance, matrimonial dispute reconciliation, equal succession rights, and leadership representation in public institutions.',
    leadFellow: 'Dr. Rajeshwari Varma',
    keyThemes: ['Gender Justice in Succession Laws', 'Anti-Harassment Enforcement', 'Maternal Health Policies', 'Women in Judiciary'],
    focusAreas: ['Uniform Civil Code Perspectives on Gender', 'Self-Help Group (SHG) Networks', 'Family Welfare Mediation'],
    icon: 'Heart',
  },
  {
    id: 'centre-ipr-studies',
    slug: 'ipr-studies',
    name: 'Center for IPR Studies',
    shortName: 'IPR Studies',
    sanskritName: 'बौद्धिक संपदा अधिकार अध्ययन केंद्र',
    description: 'Safeguarding traditional Indian knowledge systems, Geographical Indications (GI tags), patent litigation safeguards, and bio-piracy prevention.',
    leadFellow: 'Adv. Siddhartha Dave',
    keyThemes: ['Traditional Knowledge Digital Library (TKDL)', 'Geographical Indications (GI)', 'Pharmaceutical Patents', 'Artisanal Copyrights'],
    focusAreas: ['Indigenous Seed Sovereignty', 'Ayurvedic Formulations IP', 'Tech Patent Defense'],
    icon: 'Shield',
  },
  {
    id: 'centre-engineering-ai',
    slug: 'engineering-ai',
    name: 'Center for Engineering & AI',
    shortName: 'Engineering & AI',
    sanskritName: 'अभियांत्रिकी एवं कृत्रिम मेधा केंद्र',
    description: 'Investigating ethical AI governance, sovereign digital infrastructure, Indic language large models, algorithmic transparency, and national cyber defense.',
    leadFellow: 'Dr. Alok Ranjan & AI Working Group',
    keyThemes: ['Indic LLMs & Linguistic Equity', 'Ethical AI Regulations', 'Digital Public Infrastructure (DPI)', 'Cyber Sovereignty'],
    focusAreas: ['Data Protection (DPDP Act)', 'Algorithmic Fairness', 'Critical National Infrastructure Security'],
    icon: 'Compass',
  },
];
