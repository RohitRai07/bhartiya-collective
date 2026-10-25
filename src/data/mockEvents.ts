import { EventItem } from '../types/event';

export const mockEvents: EventItem[] = [
  {
    id: 'evt-live-ucc-broadcast',
    title: 'A National Dialogue on Article 44 & Uniform Civil Code',
    type: 'Live Stream',
    date: '2026-10-28',
    time: '04:00 PM IST',
    location: 'Constitutional Club / YouTube Live Global Broadcast',
    mode: 'Online Webinar',
    description: 'Bharat Collective Foundation presents a national dialogue on Article 44 and the Uniform Civil Code (UCC), bringing together distinguished legal experts, advocates, policymakers, and social activists to discuss constitutional principles, judicial perspectives, and the way forward for a unified, just, and inclusive Bharat.\n\nThe event will feature expert discussions on the constitutional vision behind the UCC, its progress towards implementation, key challenges, and the role of law and public discourse in shaping its future. Through diverse perspectives and informed deliberations, the dialogue aims to encourage constructive engagement on the legal, social, and constitutional dimensions of the Uniform Civil Code.',
    speakers: [
      { name: 'Justice Sanjay Karol (Retd.)', affiliation: 'Supreme Court of India', role: 'Keynote Speaker' },
      { name: 'Sujeet Kumar', affiliation: 'Member of Parliament, Rajya Sabha', role: 'Keynote Speaker' },
      { name: 'Kirti Uppal', affiliation: 'High Court of Delhi', role: 'Session Chair & Moderator' },
      { name: 'Manoj K. Singh', affiliation: 'Singh & Associates', role: 'Session Chair & Moderator' },
      { name: 'Manu Gaur', affiliation: 'UCC Drafting & Rules Making Committee, Uttarakhand', role: 'Featured Panelist' },
      { name: 'Sridhar Potaraju', affiliation: 'Supreme Court of India', role: 'Featured Panelist' },
      { name: 'Romy Chacko', affiliation: 'Supreme Court of India', role: 'Featured Panelist' },
      { name: 'Firoz Bakht Ahmed', affiliation: 'Maulana Azad National Urdu University', role: 'Featured Panelist' },
      { name: 'Shazia Ilmi', affiliation: 'Social Activist', role: 'Featured Panelist' },
      { name: 'Satya Prakash Rai', affiliation: 'Advocate', role: 'Featured Panelist' },
      { name: 'Raghav Garg', affiliation: 'Policy Labs', role: 'Featured Panelist' },
      { name: 'Md. Tauseef Alam', affiliation: 'Advocate & Social Activist', role: 'Featured Panelist' }
    ],
    registrationOpen: true,
    seatsLeft: 500,
    bannerImage: 'https://img.youtube.com/vi/aNCHEmPi78U/hqdefault.jpg',
    customThumbnailUrl: 'https://img.youtube.com/vi/aNCHEmPi78U/hqdefault.jpg',
    isLive: true,
    youtubeUrl: 'https://www.youtube.com/live/aNCHEmPi78U',
    youtubeId: 'aNCHEmPi78U',
    liveStatus: 'upcoming',
    status: 'published',
    posterUrl: 'https://img.youtube.com/vi/aNCHEmPi78U/hqdefault.jpg'
  },
  {
    id: 'evt-ucc-flagship',
    title: '#BharatDialogue on ARTICLE 44 & UNIFORM CIVIL CODE',
    type: 'Symposium',
    date: 'UPCOMING EVENT',
    time: 'Wednesday, 28 October 2026 || 4:00 PM - 8:00 PM IST',
    location: 'Indian Society of International Law (ISIL), V.K. Krishna Menon Bhawan, 9 Bhagwan Das Road, New Delhi, Delhi 110001',
    mode: 'Hybrid',
    description: 'Bharat Collective Foundation presents a National Dialogue on Article 44 and the Uniform Civil Code, bringing together distinguished members of the judiciary, legal experts, advocates, policymakers, and social activists to deliberate on constitutional values, equality, personal laws, and the future of a unified and inclusive India.\n\nThe dialogue will explore constitutional perspectives, judicial insights, the progress of UCC implementation, and the legal and social challenges ahead. Through informed discussions and diverse viewpoints, the event aims to encourage constructive engagement on the role of Article 44 in shaping India\'s legal and constitutional framework.',
    speakers: [
      { name: 'Eminent Constitutional Jurists', affiliation: 'Supreme Court of India & High Courts', role: 'Keynote Panel' },
      { name: 'Scholars of Comparative Jurisprudence', affiliation: 'National Law Universities', role: 'Plenary Session' },
      { name: 'Civic & Legal Reform Advocates', affiliation: 'Bharat Collective Policy Forum', role: 'Roundtable Chairs' }
    ],
    registrationOpen: true,
    seatsLeft: 150,
    bannerImage: 'uploads/event-poster-ucc.jpg',
    posterUrl: 'uploads/event-poster-ucc.jpg',
    status: 'published',
    isLive: false,
    customThumbnailUrl: 'uploads/event-poster-ucc.jpg'
  }
];
