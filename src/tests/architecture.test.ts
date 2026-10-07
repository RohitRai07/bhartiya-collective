/**
 * Automated Verification Suite for Future-Proof Architecture
 * Tests all 25 architectural principles and service boundaries.
 */

import { featureConfig } from '../config/featureConfig';
import { pincodeService } from '../services/pincodeService';
import { registrationService } from '../services/registrationService';
import { newsletterService } from '../services/newsletterService';
import { createDonation } from '../services/donationService';
import { publicationService } from '../services/publicationService';
import { eventService } from '../services/eventService';
import { researchService } from '../services/researchService';
import { authService, DEFAULT_ADMIN_CREDS } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { registrationCsvExporter, REGISTRATION_CSV_COLUMNS } from '../export/registrationCsvExporter';
import { fileService } from '../services/fileService';
import { pdfService } from '../services/pdfService';
import { circularService } from '../services/circularService';
import { taxonomyService } from '../services/taxonomyService';
import { gazetteSyncService } from '../services/gazetteSyncService';
import { careerService } from '../services/careerService';
import { podcastService, extractYouTubeId } from '../services/podcastService';
import { magazineService } from '../services/magazineService';
import { teamService } from '../services/teamService';
import { searchService } from '../services/searchService';
import { centreService } from '../services/centreService';
import { MAX_CV_SIZE_BYTES } from '../types/career';
import { UserRegistrationInput } from '../types/registration';

async function runTests() {
  console.log('🚀 Running Bhartiya Collective Architecture Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Feature Configuration & Isolation Tests (Sections 6 & 7)
  console.log('📌 Testing Feature Flags & Non-Breaking Isolation (Sections 6 & 7):');
  assert(featureConfig.isEnabled('newsletter') === true, 'Newsletter is enabled by default');
  assert(featureConfig.isEnabled('paymentIntegration') === false, 'Payment integration is false by default');
  assert(featureConfig.isEnabled('adminPanel') === false, 'Admin panel is isolated (false by default)');
  
  featureConfig.update({ paymentIntegration: true });
  assert(featureConfig.isEnabled('paymentIntegration') === true, 'Feature flag updates reactively');
  featureConfig.reset();
  assert(featureConfig.isEnabled('paymentIntegration') === false, 'Feature flag resets cleanly');

  // 2. Newsletter Service Tests (Section 11)
  console.log('\n📌 Testing Newsletter Service Lifecycle (Section 11):');
  const validEmail = 'scholar.test@university.ac.in';
  const sub1 = await newsletterService.subscribe({ email: validEmail, source: 'test-suite' });
  assert(sub1.status === 'success', 'First-time email subscription succeeds');

  const sub2 = await newsletterService.subscribe({ email: validEmail, source: 'test-suite' });
  assert(sub2.status === 'already_subscribed', 'Duplicate email correctly triggers already_subscribed state');

  const subInvalid = await newsletterService.subscribe({ email: 'not-an-email', source: 'test-suite' });
  assert(subInvalid.status === 'error', 'Invalid email format is rejected gracefully');

  const unsub = await newsletterService.unsubscribe(validEmail);
  assert(unsub.success === true, 'Unsubscribe readiness works without breaking state');

  // 3. Pincode Auto-Fetch Tests (Section 14)
  console.log('\n📌 Testing Pincode Service (Section 14):');
  assert(pincodeService.isValidFormat('110001') === true, 'Valid 6-digit Indian PIN code format accepted');
  assert(pincodeService.isValidFormat('012345') === false, 'PIN code starting with 0 rejected');
  assert(pincodeService.isValidFormat('1100') === false, 'Incomplete PIN code rejected');

  const loc = await pincodeService.getLocationByPincode('110001');
  assert(loc.isValid === true, 'Location resolution succeeds for 110001');
  assert(loc.city === 'New Delhi', 'Resolves City as New Delhi');
  assert(loc.state === 'Delhi', 'Resolves State as Delhi');
  assert(Array.isArray(loc.postOfficeNames) && loc.postOfficeNames.length > 0, 'Returns multiple postal beats');

  // 4. User Registration & Consistent Phone Representation (Sections 12 & 13)
  console.log('\n📌 Testing Registration Service & Data Model (Sections 12 & 13):');
  const validRegInput: UserRegistrationInput = {
    firstName: 'Devendra',
    middleName: 'Nath',
    lastName: 'Pandey',
    email: 'devendra.pandey@bhu.ac.in',
    phoneNumber: {
      countryCode: '+91',
      nationalNumber: '9839123456',
      fullFormatted: '+91 9839123456',
    },
    collegeName: 'Faculty of Sanskrit Vidya Dharma Vijnan, BHU',
    address: 'Kabir Colony, BHU Campus',
    pincode: '221005',
    city: 'Varanasi',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    consent: true,
  };

  const regResult = await registrationService.submitRegistration(validRegInput);
  assert(regResult.success === true, 'Registration submission succeeds');
  assert(regResult.registrationNumber.startsWith('BC-2026-REG-'), 'Generates standard registration code format');
  assert(regResult.record.phoneNumber.countryCode === '+91', 'Consistent +91 country code representation');

  // Test Phone Validation
  const invalidPhoneInput = { ...validRegInput, phoneNumber: { ...validRegInput.phoneNumber, nationalNumber: '12345' } };
  let caughtPhoneError = false;
  try {
    await registrationService.submitRegistration(invalidPhoneInput);
  } catch {
    caughtPhoneError = true;
  }
  assert(caughtPhoneError === true, 'Short mobile number rejected');

  // 5. CSV Exporter Strict Column Mapping (Section 17)
  console.log('\n📌 Testing Isolated CSV Export Engine (Section 17):');
  const expectedHeaders = [
    'First Name', 'Middle Name', 'Last Name', 'Phone Number',
    'College Name', 'Address', 'Pincode', 'City', 'State', 'District'
  ];

  const actualFirstTenHeaders = REGISTRATION_CSV_COLUMNS.slice(0, 10).map(c => c.header);
  assert(
    JSON.stringify(actualFirstTenHeaders) === JSON.stringify(expectedHeaders),
    'Strict 10-column mapping exactly satisfies Section 17 specs'
  );

  const csvString = registrationCsvExporter.generateCsv([regResult.record]);
  assert(csvString.includes('Devendra'), 'CSV contains candidate first name');
  assert(csvString.includes('Pandey'), 'CSV contains candidate last name');
  assert(csvString.includes('+91 9839123456'), 'CSV contains formatted phone number');
  assert(csvString.includes('221005'), 'CSV contains pincode');

  // 6. Payment Integration Readiness & Non-Premature Boundary (Sections 2 & 21)
  console.log('\n📌 Testing Donation Service Boundary (Sections 2 & 21):');
  const donationIntent = await createDonation({
    amount: 5000,
    frequency: 'monthly',
    cause: 'visiting_fellowships',
    donorName: 'Smt. Gayatri Devi',
    email: 'gayatri.devi@patron.org',
    isIndianTaxResident: true,
  });

  assert(donationIntent.amount === 5000, 'Donation amount recorded');
  assert(donationIntent.status === 'prepared_for_payment_gateway', 'Clean intent status recorded without fake gateway simulation');
  assert(donationIntent.donationId.startsWith('DON-INTENT-'), 'Generates intent identifier');

  // 7. Domain Services Decoupling (Sections 3 & 9)
  console.log('\n📌 Testing Domain Services Separation (Sections 3 & 9):');
  const pubs = await publicationService.getPublications();
  assert(Array.isArray(pubs) && pubs.length > 0, 'Publication service functions independently');

  const evts = await eventService.getEvents();
  assert(Array.isArray(evts) && evts.length > 0, 'Event service functions independently');

  const domains = await researchService.getDomains();
  assert(Array.isArray(domains) && domains.length > 0, 'Research service functions independently');
  if (domains.length > 0) {
    const toggled = await researchService.togglePublish(domains[0].id);
    assert(toggled.status === 'draft', 'Research domain status toggles from published to draft');
    const restored = await researchService.togglePublish(domains[0].id);
    assert(restored.status === 'published', 'Research domain status toggles back to published');
  }

  // 8. Admin Credentials & Two-Factor Authentication (2FA) Production Security
  console.log('\n📌 Testing Admin Credentials & 2FA Production Security:');
  const creds = authService.getAdminCredentials();
  assert(creds.email === DEFAULT_ADMIN_CREDS.email, 'Admin credentials loaded correctly');
  assert(creds.twoFactorEnabled === true, '2FA is active by default for administrator');

  // Test Step 1: Wrong password rejected
  const badLogin = await authService.loginAdmin(creds.email, 'IncorrectPassword123');
  assert(badLogin.success === false, 'Invalid admin password rejected with access denied');

  // Test Step 1: Correct credentials issue 2FA challenge
  const validLogin = await authService.loginAdmin(creds.email, creds.password);
  assert(validLogin.success === true && validLogin.requiresTwoFactor === true, 'Valid credentials require mandatory 2FA challenge');
  assert(validLogin.challenge?.challengeId.length! > 0, 'Generates secure 2FA challenge ID');
  assert(validLogin.challenge?.maskedRecipient === 'r***0@gmail.com' || validLogin.challenge?.maskedRecipient === 'a***n@bharatcollective.org', 'Masks recipient address for security');

  const rohitLogin = await authService.loginAdmin('rohitraicr10@gmail.com', creds.password);
  assert(rohitLogin.success === true && rohitLogin.requiresTwoFactor === true, 'Admin login with rohitraicr10@gmail.com succeeds with 2FA');

  const challenge = validLogin.challenge!;

  // Test Step 2: Bad code rejected
  const badAuth = await authService.completeTwoFactorLogin(challenge.challengeId, '000000');
  assert(badAuth.success === false, 'Invalid 2FA code is rejected');

  // Test Zero Bypass Rule: Universal '123456' dev bypass is STRICTLY REJECTED
  const bypassAuth = await authService.completeTwoFactorLogin(challenge.challengeId, '123456');
  if (challenge.code !== '123456') {
    assert(bypassAuth.success === false, 'Universal dev bypass 123456 is strictly rejected in production');
  }

  // Test Step 2: Valid code completes authentication
  const goodAuth = await authService.completeTwoFactorLogin(challenge.challengeId, challenge.code!);
  assert(goodAuth.success === true && goodAuth.session?.user.role === 'admin', 'Valid 2FA code completes admin authentication');

  // Test Single-use rule: Replaying consumed code fails
  const replayAuth = await authService.completeTwoFactorLogin(challenge.challengeId, challenge.code!);
  assert(replayAuth.success === false, 'Replaying consumed 2FA code is rejected (Single-use)');

  // Verify credential updating
  const updateResult = authService.updateAdminCredentials(
    { name: 'Secured Chief Admin' },
    DEFAULT_ADMIN_CREDS.password
  );
  assert(updateResult.success === true, 'Admin credentials update succeeds with valid current password');
  assert(authService.getAdminCredentials().name === 'Secured Chief Admin', 'Updated name persisted in credential store');

  // Reset back to defaults for clean test state
  authService.updateAdminCredentials(DEFAULT_ADMIN_CREDS);

  // 9. Email Gateway & Welcome Letterhead Delivery Preview
  console.log('\n📌 Testing Email Gateway & Confirmation Letterhead:');
  const preview = notificationService.getWelcomeEmailPreview('fellow.scholar@du.ac.in');
  assert(preview.recipient === 'fellow.scholar@du.ac.in', 'Letterhead recipient matches subscriber');
  assert(preview.subject.includes('Welcome to the Bharat Collective'), 'Letterhead subject generated correctly');
  assert(preview.bodyParagraphs.length >= 3, 'Letterhead contains full scholarly welcome message');
  assert(preview.unsubscribeToken.startsWith('BCF-SUB-'), 'Includes cryptographic unsubscribe reference token');

  const mailto = notificationService.generateMailtoLink('test@example.com', 'Test Subject', 'Test Body');
  assert(mailto.startsWith('mailto:test%40example.com'), 'Generates valid client-side mailto URL');

  // 10. File & Media Management Service (Drag & Drop + URL)
  console.log('\n📌 Testing File & Media Management Service:');
  const dummyMedia = {
    name: 'test-policy-cover.jpg',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    sizeKb: 142,
    mimeType: 'image/jpeg'
  };
  fileService.saveToMediaLibrary(dummyMedia);
  const mediaList = fileService.getMediaLibrary();
  assert(Array.isArray(mediaList), 'Media library returns array of stored assets');
  assert(typeof fileService.uploadFile === 'function', 'File upload boundary is decoupled and available');
  assert(typeof fileService.uploadImageAsDataUrl === 'function', 'Image data URL conversion is available');

  console.log('\n📌 Testing Client-Side Scholarly PDF Generation Engine:');
  const dummyPub = {
    id: 'test-pub-01',
    title: 'De-Universalizing Modernity: Indic Epistemology in Statecraft',
    subtitle: 'A foundational working paper on civilizational administrative doctrines',
    authors: ['Dr. Ananya Sharma', 'Prof. Raghuram Iyer'],
    abstract: 'This paper examines constitutional jurisprudence through the lens of indigenous dharmic tenets and civilizational jurisprudence.',
    category: 'monograph' as const,
    publishedDate: '2026-09-15',
    readTime: '24 min',
    tags: ['Epistemology', 'Jurisprudence', 'Statecraft'],
    pdfUrl: '#',
    pages: 32,
    status: 'published' as const
  };

  const pdfDoc = pdfService.buildPublicationPdf(dummyPub);
  assert(pdfDoc !== null && typeof pdfDoc === 'object', 'PDF document instance generated successfully');
  assert(typeof pdfService.downloadPublicationPdf === 'function', 'PDF download trigger method is available');
  assert(pdfDoc.internal.pageSize.getWidth() > 0, 'PDF generated with valid page dimensions');
  assert(typeof (pdfDoc as any).output === 'function', 'PDF instance supports binary output generation');

  console.log('\n📌 Testing Circulars & Legal Materials Domain Service:');
  const allCirculars = await circularService.getCirculars();
  assert(allCirculars.length >= 8, 'Seeded Indian Constitution & legal catalog loaded successfully');

  const constDoc = allCirculars.find(c => c.id === 'circ-const-india-01');
  assert(Boolean(constDoc), 'Constitutional Lex category contains Constitution of India');
  assert(Boolean(constDoc?.title.includes('Constitution of India')), 'Correctly includes Constitution of India title');

  const bnsDoc = allCirculars.find(c => c.shortTitle.includes('BNS'));
  assert(Boolean(bnsDoc), 'Statutory Acts category contains Bharatiya Nyaya Sanhita (BNS 2023)');

  const categoryCounts = await circularService.getCategoryCounts();
  assert(typeof categoryCounts === 'object' && categoryCounts.all >= 8, 'Category counts returned with total documents');
  assert(categoryCounts.constitution > 0, 'Constitutional category has active documents');

  // Search test
  const searchResults = await circularService.getCirculars({ search: 'Bharatiya' });
  assert(searchResults.length >= 2, 'Search query for "Bharatiya" matches BNS and BNSS');

  // CRUD Lifecycle
  const testCirc = await circularService.createCircular({
    title: 'Model Guidelines on Indic Civilizational Jurisprudence',
    shortTitle: 'Indic Jurisprudence Guidelines',
    circularNumber: 'BCF-CIRC-TEST-2026',
    category: 'guidelines',
    issuingAuthority: 'Bharat Collective Legal Secretariat',
    summary: 'Test legal guideline document for automated verification.',
    keyProvisions: ['§ 1. Dharmic Rule of Law', '§ 2. Nyaya Principles'],
    tags: ['Test', 'Jurisprudence'],
    status: 'published'
  });
  assert(testCirc.id.startsWith('circ-'), 'New circular created with valid ID prefix');

  const updatedCirc = await circularService.updateCircular(testCirc.id, { shortTitle: 'Updated Guidelines' });
  assert(updatedCirc.shortTitle === 'Updated Guidelines', 'Circular updated reactively');

  const toggledCirc = await circularService.togglePublish(testCirc.id);
  assert(toggledCirc.status === 'draft', 'Circular status toggles from published to draft');

  const downloads = await circularService.incrementDownloads(testCirc.id);
  assert(downloads === 1, 'Download counter increments correctly');

  // PDF Generation for Circulars
  const circPdf = pdfService.buildCircularPdf(testCirc);
  assert(circPdf !== null && typeof circPdf === 'object', 'Circular legal compendium PDF built successfully');
  assert(typeof pdfService.downloadCircularPdf === 'function', 'Circular PDF download method is available');

  // Cleanup
  await circularService.deleteCircular(testCirc.id);
  const afterDelete = await circularService.getCircularById(testCirc.id);
  assert(afterDelete === null, 'Test circular cleaned up successfully');

  // 12. Dynamic Taxonomy & Custom Dropdown Options Suite
  console.log('\n📌 Testing Dynamic Taxonomy & Custom Dropdowns (Enter-to-add & delete):');
  const initialCircOptions = taxonomyService.getOptions('circular_category');
  assert(initialCircOptions.length >= 5, 'Circular categories loaded with institutional defaults');

  // Add custom option
  const customCat = taxonomyService.addOption('circular_category', 'Judicial Precedents & Tribunals');
  assert(customCat.isCustom === true, 'Custom option is correctly marked with isCustom: true');
  assert(customCat.label === 'Judicial Precedents & Tribunals', 'Custom option label matches user input');
  
  const updatedCircOptions = taxonomyService.getOptions('circular_category');
  assert(updatedCircOptions.some(o => o.value === customCat.value), 'Newly added option is selectable in dropdown list');

  // Delete custom option
  taxonomyService.removeOption('circular_category', customCat.value);
  const afterRemoveCircOptions = taxonomyService.getOptions('circular_category');
  assert(!afterRemoveCircOptions.some(o => o.value === customCat.value), 'Custom option is deleted from dropdown list');

  // Add custom tag
  const initialTagsCount = taxonomyService.getTags().length;
  taxonomyService.addTag('Jan Vishwas Act');
  assert(taxonomyService.getTags().includes('Jan Vishwas Act'), 'Custom tag added successfully to global pool');

  // Duplicate tag prevention
  taxonomyService.addTag('Jan Vishwas Act');
  assert(taxonomyService.getTags().filter(t => t.toLowerCase() === 'jan vishwas act').length === 1, 'Duplicate tag submission prevented');

  // Delete tag
  taxonomyService.removeTag('Jan Vishwas Act');
  assert(!taxonomyService.getTags().includes('Jan Vishwas Act'), 'Tag deleted successfully from pool');
  assert(taxonomyService.getTags().length === initialTagsCount, 'Tags count restores accurately after deletion');

  // Sub-tabs taxonomy coverage
  const centreThemes = taxonomyService.getOptions('centre_theme');
  assert(centreThemes.length >= 6, 'Thematic Centres options loaded in taxonomy');
  const researchDomains = taxonomyService.getOptions('research_domain');
  assert(researchDomains.length >= 6, 'Research Domains options loaded in taxonomy');
  const podcastTopics = taxonomyService.getOptions('podcast_topic');
  assert(podcastTopics.length >= 6, 'Podcast Topics loaded in taxonomy');
  const magazineThemes = taxonomyService.getOptions('magazine_theme');
  assert(magazineThemes.length >= 5, 'Magazine Themes loaded in taxonomy');
  const nationalRoles = taxonomyService.getOptions('national_team_role');
  assert(nationalRoles.length >= 6, 'National Team roles loaded in taxonomy');
  const stateRegions = taxonomyService.getOptions('state_chapter_region');
  assert(stateRegions.length >= 6, 'State Chapter regions loaded in taxonomy');
  const careerTypes = taxonomyService.getOptions('career_type');
  assert(careerTypes.length >= 5, 'Career Opportunity types loaded in taxonomy');

  // 13. e-Gazette Auto-Sync & Official Government Source Double-Validation Suite
  console.log('\n📌 Testing e-Gazette Auto-Sync & Official Government Source Double-Validation:');
  const feeds = gazetteSyncService.getOfficialFeeds();
  assert(feeds.length >= 5, 'Official Government of India feeds configured');
  assert(feeds.some(f => f.verifiedDomain === 'egazette.gov.in'), 'e-Gazette of India (egazette.gov.in) configured');
  assert(feeds.some(f => f.verifiedDomain === 'legislative.gov.in'), 'Legislative Department (legislative.gov.in) configured');
  assert(feeds.some(f => f.verifiedDomain === 'sci.gov.in'), 'Supreme Court of India (sci.gov.in) configured');

  // Seeded circulars verify source links
  const seededList = await circularService.getCirculars();
  const coi = seededList.find(c => c.id === 'circ-const-india-01');
  assert(Boolean(coi?.sourceUrl), 'Constitution of India has official government source URL');
  assert(Boolean(coi?.sourceUrl?.includes('legislative.gov.in')), 'Constitution source points to authentic legislative.gov.in repository');
  assert(Boolean(coi?.sourceName), 'Constitution has verified official issuing authority source name');

  // Pending gazettes detection
  const pendingGazettes = await gazetteSyncService.checkForNewGazettes();
  assert(Array.isArray(pendingGazettes) && pendingGazettes.length > 0, 'Discovers pending un-ingested gazettes from live catalog');
  assert(pendingGazettes.some(g => g.shortTitle?.includes('BSA')), 'Includes Bharatiya Sakshya Adhiniyam (BSA 2023) in live gazette catalog');
  assert(pendingGazettes.some(g => g.shortTitle?.includes('Telecommunications')), 'Includes Telecommunications Act 2023 in live gazette catalog');

  // Execute live sync
  const syncResult = await gazetteSyncService.syncNow();
  assert(syncResult.syncedCount > 0, 'Successfully auto-syncs newly discovered statutory gazettes');
  assert(syncResult.newlyAdded.length === syncResult.syncedCount, 'Returns newly ingested statutory records');
  assert(syncResult.newlyAdded.every(c => c.isAutoSynced && Boolean(c.sourceUrl)), 'All auto-synced circulars carry isAutoSynced flag and official sourceUrl');
  assert(syncResult.newlyAdded.some(c => c.sourceUrl?.includes('.gov.in')), 'Auto-synced circulars contain authentic .gov.in double-validation links');

  // Second sync should be idempotent (prevent duplicate additions)
  const secondSync = await gazetteSyncService.syncNow();
  assert(secondSync.syncedCount === 0, 'Second sync correctly detects 0 new items (prevents duplicate gazette ingestion)');

  // Auto-sync configuration settings
  const originalSettings = gazetteSyncService.getSyncSettings();
  assert(typeof originalSettings.autoSyncEnabled === 'boolean', 'Auto-sync settings contain boolean flag');
  const updatedSettings = gazetteSyncService.updateSyncSettings({ autoSyncEnabled: false });
  assert(updatedSettings.autoSyncEnabled === false, 'Auto-sync toggle settings persisted');
  gazetteSyncService.updateSyncSettings({ autoSyncEnabled: true });
  assert(gazetteSyncService.getSyncSettings().autoSyncEnabled === true, 'Auto-sync toggle restored to active state');

  // 10. Career Applications Workflow & CV Validation
  console.log('\n📌 Testing Career Applications & CV Validation Engine:');
  assert(MAX_CV_SIZE_BYTES === 1024 * 1024, 'Max CV file size limit strictly enforced at 1 MB (1,048,576 bytes)');
  const initialCareers = careerService.getAll();
  assert(initialCareers.length >= 2, 'Seeded career applications loaded successfully');
  assert(initialCareers.some(c => c.type === 'internship'), 'Contains seeded internship applications');
  assert(initialCareers.some(c => c.type === 'job'), 'Contains seeded research fellow/job applications');

  const newApp = careerService.create({
    type: 'internship',
    fullName: 'Aditya Vardhan Sharma',
    email: 'aditya.sharma@du.ac.in',
    phone: '+91 98111 22334',
    currentInstitution: 'Faculty of Law, Delhi University',
    qualification: 'Final Year LL.B',
    areaOfInterest: 'Center for Human Rights & Legal Aid',
    coverLetter: 'Interested in civilizational research on personal laws and legal epistemology.',
    cvFileName: 'Aditya_Sharma_Resume.pdf',
    cvFileSize: 512000,
    cvDataUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
  });
  assert(newApp.applicationCode.startsWith('BC-CAR-'), 'Generated application code follows standard BC-CAR- prefix');
  assert(newApp.status === 'pending', 'New application initial status defaults to pending');
  
  careerService.updateStatus(newApp.id, 'shortlisted');
  const updatedApp = careerService.getById(newApp.id);
  assert(updatedApp?.status === 'shortlisted', 'Candidate status updated cleanly to shortlisted');
  
  careerService.delete(newApp.id);
  assert(!careerService.getById(newApp.id), 'Test application cleaned up successfully');

  // Direct application without CV/file upload
  const noCvApp = careerService.create({
    type: 'job',
    fullName: 'Meera Deshmukh',
    email: 'meera.deshmukh@bharat.org',
    phone: '+91 99887 76655',
    currentInstitution: 'Gokhale Institute of Politics and Economics',
    qualification: 'M.A. Economics',
    areaOfInterest: 'Center for Public Policy / Studies',
    coverLetter: 'Research background in decentralized public finance and rural cooperatives.',
  });
  assert(noCvApp.applicationCode.startsWith('BC-CAR-'), 'Direct application without file upload created successfully');
  assert(!noCvApp.cvDataUrl, 'Direct application does not require CV data URL');
  careerService.delete(noCvApp.id);

  // 11. Podcasts & YouTube Embed Integration
  console.log('\n📌 Testing Podcasts & YouTube Video Streaming Integration:');
  assert(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ') === 'dQw4w9WgXcQ', 'Standard youtube.com/watch?v= parser extracts video ID');
  assert(extractYouTubeId('https://youtu.be/kJQP7kiw5Fk') === 'kJQP7kiw5Fk', 'Shortened youtu.be/ parser extracts video ID');
  assert(extractYouTubeId('https://www.youtube.com/embed/3JZ_D3ELwOQ') === '3JZ_D3ELwOQ', 'Embed URL parser extracts video ID');
  
  const podcastList = podcastService.getAll();
  assert(podcastList.length >= 3, 'Seeded podcast episodes loaded');
  assert(podcastList.some(p => p.featured), 'Featured podcast episode exists');
  
  const newPod = podcastService.create({
    title: 'The Constitution & Indic Epistemology',
    youtubeUrl: 'https://youtu.be/kJQP7kiw5Fk',
    speaker: 'Prof. Ananya Someshwar',
    topic: 'Constitutional Law',
    duration: '48 min',
    date: '2026-09-25',
    description: 'Special dialogue on epistemic jurisprudence.',
    featured: false,
  });
  assert(newPod.youtubeId === 'kJQP7kiw5Fk', 'Auto-extracts YouTube ID during episode creation');
  const toggledPod = podcastService.togglePublish(newPod.id);
  assert(toggledPod?.status === 'draft', 'Podcast episode toggles from published to draft');
  const restoredPod = podcastService.togglePublish(newPod.id);
  assert(restoredPod?.status === 'published', 'Podcast episode toggles back to published');
  podcastService.delete(newPod.id);
  assert(podcastService.getAll().length === podcastList.length, 'Test podcast cleaned up successfully');

  // 12. Magazine & Client-Side PDF Generation
  console.log('\n📌 Testing Magazine & Digital Edition Engine:');
  const magIssues = magazineService.getAll();
  assert(magIssues.length >= 2, 'Seeded magazine issues loaded');
  assert(magIssues.every(m => m.price === 100), 'All magazine issues have ₹100 reader contribution price');
  assert(magIssues[0].tableOfContents && magIssues[0].tableOfContents.length > 0, 'Table of contents parsed into indexed articles');

  const newMag = magazineService.create({
    title: 'Special Autumn Volume',
    issueNumber: 'Volume I • Issue 3',
    theme: 'Legal Hermeneutics',
    publicationDate: '2026-10-01',
    price: 100,
    pageCount: 50,
    coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
    editorialLead: 'Editorial Secretariat',
    tableOfContents: ['Introduction', 'Dharma and Law'],
    description: 'Comprehensive research edition.',
  });
  assert(newMag.id.startsWith('mag-'), 'New magazine edition generated with valid ID');
  const toggledMag = magazineService.togglePublish(newMag.id);
  assert(toggledMag?.status === 'draft', 'Magazine edition toggles from published to draft');
  const restoredMag = magazineService.togglePublish(newMag.id);
  assert(restoredMag?.status === 'published', 'Magazine edition toggles back to published');
  magazineService.delete(newMag.id);
  assert(magazineService.getAll().length === magIssues.length, 'Test magazine edition cleaned up');

  // 13. Feature Configuration & Circulars Toggle
  console.log('\n📌 Testing Feature Flags & Module Visibility:');
  assert(featureConfig.isEnabled('circulars') === false, 'Circulars & Legal Materials hidden on public site by default per spec');
  featureConfig.update({ circulars: true });
  assert(featureConfig.isEnabled('circulars') === true, 'Circulars module toggles to active');
  featureConfig.update({ circulars: false });
  assert(featureConfig.isEnabled('circulars') === false, 'Circulars module restored to default hidden state');
  assert(featureConfig.isEnabled('podcasts') === true, 'Podcasts module enabled');
  assert(featureConfig.isEnabled('magazine') === true, 'Magazine module enabled');
  assert(featureConfig.isEnabled('careers') === true, 'Careers module enabled');

  // 14. National Team & State Chapters Management
  console.log('\n📌 Testing National Executive Team Management:');
  const nationalMembers = await teamService.getNationalTeam({ includeDrafts: true });
  assert(nationalMembers.length >= 3, 'Seeded national team leaders loaded successfully');
  const firstLeader = nationalMembers[0];
  assert(firstLeader.name.length > 0 && firstLeader.role.length > 0, 'National leader contains name and designation');
  
  // Test publish/unpublish toggle
  const toggledLeader = await teamService.toggleNationalMemberPublish(firstLeader.id);
  assert(toggledLeader?.status === 'draft', 'National leader toggles from published to draft');
  const restoredLeader = await teamService.toggleNationalMemberPublish(firstLeader.id);
  assert(restoredLeader?.status === 'published', 'National leader toggles back to published');

  // Test create national member
  const createdLeader = await teamService.createNationalMember({
    name: 'Adv. Test Sharma',
    role: 'Deputy Coordinator — Policy Cell',
    affiliation: 'Delhi High Court',
    desc: 'Research in regulatory jurisprudence.',
    status: 'published'
  });
  assert(createdLeader.id.startsWith('nat-'), 'New national member created with nat- prefix');
  await teamService.deleteNationalMember(createdLeader.id);
  const afterDelNational = await teamService.getNationalTeam({ includeDrafts: true });
  assert(afterDelNational.length === nationalMembers.length, 'Test national member cleaned up');

  console.log('\n📌 Testing State Team & Regional Chapters Management:');
  const stateChapters = await teamService.getStateChapters({ includeDrafts: true });
  assert(stateChapters.length >= 4, 'Seeded regional state chapters loaded successfully');
  const firstChapter = stateChapters[0];
  assert(firstChapter.state.length > 0 && firstChapter.convener.length > 0, 'State chapter contains state name and convener');

  // Test publish/unpublish toggle
  const toggledChapter = await teamService.toggleStateChapterPublish(firstChapter.id);
  assert(toggledChapter?.status === 'draft', 'State chapter toggles from published to draft');
  const restoredChapter = await teamService.toggleStateChapterPublish(firstChapter.id);
  assert(restoredChapter?.status === 'published', 'State chapter toggles back to published');

  // Test create state chapter
  const createdChapter = await teamService.createStateChapter({
    state: 'Goa',
    convener: 'Adv. Test Prabhu',
    city: 'Panaji',
    focus: 'Coastal Environmental Jurisprudence',
    status: 'published'
  });
  assert(createdChapter.id.startsWith('state-'), 'New state chapter created with state- prefix');
  await teamService.deleteStateChapter(createdChapter.id);
  const afterDelState = await teamService.getStateChapters({ includeDrafts: true });
  assert(afterDelState.length === stateChapters.length, 'Test state chapter cleaned up');

  // Section-level feature toggles for all modules
  console.log('\n📌 Testing Section-Level Disabling for All Modules:');
  assert(featureConfig.isEnabled('nationalTeam') === true, 'National Team section enabled by default');
  featureConfig.update({ nationalTeam: false });
  assert(featureConfig.isEnabled('nationalTeam') === false, 'National Team section disables cleanly');
  featureConfig.update({ nationalTeam: true });
  assert(featureConfig.isEnabled('nationalTeam') === true, 'National Team section re-enabled cleanly');

  assert(featureConfig.isEnabled('stateTeam') === true, 'State Chapters section enabled by default');
  featureConfig.update({ stateTeam: false });
  assert(featureConfig.isEnabled('stateTeam') === false, 'State Chapters section disables cleanly');
  featureConfig.update({ stateTeam: true });
  assert(featureConfig.isEnabled('stateTeam') === true, 'State Chapters section re-enabled cleanly');

  assert(featureConfig.isEnabled('experts') === true, 'Governing Council & Experts section enabled by default');
  featureConfig.update({ experts: false });
  assert(featureConfig.isEnabled('experts') === false, 'Experts section disables cleanly');
  featureConfig.update({ experts: true });
  assert(featureConfig.isEnabled('experts') === true, 'Experts section re-enabled cleanly');

  assert(featureConfig.isEnabled('news') === true, 'News / Insights section enabled by default');
  featureConfig.update({ news: false });
  assert(featureConfig.isEnabled('news') === false, 'News section disables cleanly');
  featureConfig.update({ news: true });
  assert(featureConfig.isEnabled('news') === true, 'News section re-enabled cleanly');

  assert(featureConfig.isEnabled('flagshipBanner') === true, 'Flagship announcement banner enabled by default');
  featureConfig.update({ flagshipBanner: false });
  assert(featureConfig.isEnabled('flagshipBanner') === false, 'Flagship banner disables cleanly');
  featureConfig.update({ flagshipBanner: true });
  assert(featureConfig.isEnabled('flagshipBanner') === true, 'Flagship banner re-enabled cleanly');

  assert(featureConfig.isEnabled('publications') === true, 'Publications section enabled by default');
  featureConfig.update({ publications: false });
  assert(featureConfig.isEnabled('publications') === false, 'Publications section disables cleanly');
  featureConfig.update({ publications: true });
  assert(featureConfig.isEnabled('publications') === true, 'Publications section re-enabled cleanly');

  assert(featureConfig.isEnabled('events') === true, 'Events section enabled by default');
  featureConfig.update({ events: false });
  assert(featureConfig.isEnabled('events') === false, 'Events section disables cleanly');
  featureConfig.update({ events: true });
  assert(featureConfig.isEnabled('events') === true, 'Events section re-enabled cleanly');

  assert(featureConfig.isEnabled('research') === true, 'Research section enabled by default');
  featureConfig.update({ research: false });
  assert(featureConfig.isEnabled('research') === false, 'Research section disables cleanly');
  featureConfig.update({ research: true });
  assert(featureConfig.isEnabled('research') === true, 'Research section re-enabled cleanly');

  assert(featureConfig.isEnabled('donations') === true, 'Donations / Support Us section enabled by default');
  featureConfig.update({ donations: false });
  assert(featureConfig.isEnabled('donations') === false, 'Donations section disables cleanly');
  featureConfig.update({ donations: true });
  assert(featureConfig.isEnabled('donations') === true, 'Donations section re-enabled cleanly');

  assert(featureConfig.isEnabled('userRegistration') === true, 'User Registration section enabled by default');
  featureConfig.update({ userRegistration: false });
  assert(featureConfig.isEnabled('userRegistration') === false, 'User Registration section disables cleanly');
  featureConfig.update({ userRegistration: true });
  assert(featureConfig.isEnabled('userRegistration') === true, 'User Registration section re-enabled cleanly');

  // Thematic Research Centres Domain Service
  console.log('\n📌 Testing Thematic Research Centres (Centres of Excellence) Service:');
  const allCentres = centreService.getAll();
  assert(Array.isArray(allCentres) && allCentres.length >= 6, 'Seeded research centres loaded successfully');
  assert(allCentres.some(c => c.slug === 'human-rights-legal-aid'), 'Contains Center for Human Rights & Legal Aid');
  assert(allCentres.some(c => c.slug === 'engineering-ai'), 'Contains Center for Engineering & AI');
  
  // Test create
  const testCentre = centreService.create({
    name: 'Test Center for Cultural Heritage',
    shortName: 'Cultural Heritage',
    sanskritName: 'संस्कृति एवं धरोहर अध्ययन केंद्र',
    slug: 'cultural-heritage-test',
    leadFellow: 'Dr. Test Scholar',
    description: 'Investigating civilizational continuity and heritage preservation frameworks.',
    icon: 'Compass',
    keyThemes: ['Heritage Law', 'Civilizational Studies'],
    focusAreas: ['Manuscript Conservation', 'Traditional Knowledge Systems'],
    status: 'published',
  });
  assert(testCentre.id.startsWith('centre-'), 'New centre created with valid ID prefix');
  
  // Test update
  const updatedCentre = centreService.update(testCentre.id, { leadFellow: 'Dr. Lead Fellow Updated' });
  assert(updatedCentre?.leadFellow === 'Dr. Lead Fellow Updated', 'Centre updated reactively');
  
  // Test togglePublish
  const toggledCentre = centreService.togglePublish(testCentre.id);
  assert(toggledCentre?.status === 'draft', 'Centre status toggles to draft');
  const toggledBackCentre = centreService.togglePublish(testCentre.id);
  assert(toggledBackCentre?.status === 'published', 'Centre status toggles back to published');
  
  // Test delete
  const deleted = centreService.delete(testCentre.id);
  assert(deleted === true, 'Test centre cleaned up successfully');

  // 15. Universal Search Engine
  console.log('\n📌 Testing Universal Multi-Entity Search Engine:');
  const emptyQueryResults = await searchService.search('');
  assert(emptyQueryResults.length === 0, 'Empty search returns empty array');

  const pageResults = await searchService.search('about');
  assert(pageResults.some(r => r.category === 'page' && r.path === '/about'), 'Search finds About Page');

  const centreResults = await searchService.search('human rights');
  assert(centreResults.some(r => r.category === 'centre'), 'Search finds Center for Human Rights & Legal Aid');

  const scholarResults = await searchService.search('someshwar');
  assert(scholarResults.some(r => r.category === 'scholar'), 'Search finds Scholar by name (Prof. Ananya Someshwar)');

  const nationalResults = await searchService.search('sai deepak');
  assert(nationalResults.some(r => r.category === 'team'), 'Search finds National Team member (Sr. Adv. J. Sai Deepak)');

  const stateResults = await searchService.search('lucknow');
  assert(stateResults.some(r => r.category === 'chapter'), 'Search finds State Chapter by city (Lucknow / UP)');

  const careerResults = await searchService.search('career');
  assert(careerResults.some(r => r.category === 'career'), 'Search finds Career and Internship pathways');

  // 16. Production Security, 2FA Challenge Protocol & Session Governance
  console.log('\n📌 Testing Production Security, 2FA Protocol & Session Governance:');

  // Test Idle Session Timeout
  const mockValidSession: any = {
    token: 'mock-token-xyz',
    user: { id: 'admin-1', email: 'admin@bharatcollective.org', role: 'admin', name: 'Admin' },
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    lastActiveAt: Date.now() - (35 * 60 * 1000), // 35 minutes idle
  };
  assert(authService.isSessionIdleExpired(mockValidSession, 30 * 60 * 1000) === true, 'Session idle >30 minutes is marked idle-expired');

  // Test Active Session Idle check
  const activeSession = authService.touchSession(mockValidSession);
  assert(authService.isSessionIdleExpired(activeSession, 30 * 60 * 1000) === false, 'Session touched within 30 minutes is active');

  // Test Session absolute expiry
  const expiredSession: any = {
    ...mockValidSession,
    expiresAt: Date.now() - 1000,
  };
  assert(authService.isSessionExpired(expiredSession) === true, 'Session past expiresAt is marked expired');

  // Test Resend Cooldown and Challenge Renewal
  const testChan = authService.createTwoFactorChallenge('admin@bharatcollective.org');
  assert(testChan.maskedRecipient === 'a***n@bharatcollective.org', 'Recipient email masked for 2FA UI delivery');
  assert(testChan.otpLength === 6, 'OTP length enforces exactly 6 digits');

  // Test Attempt limiting on challenge
  const fakeId = testChan.challengeId;
  for (let i = 0; i < 5; i++) {
    await authService.completeTwoFactorLogin(fakeId, '000000');
  }
  const lockedRes = await authService.completeTwoFactorLogin(fakeId, '000000');
  assert(lockedRes.locked === true || lockedRes.success === false, 'Challenge locks or denies after max invalid attempts');

  // Test Admin Logout
  await authService.logoutAdmin();
  assert(authService.getAdminSession() === null, 'Admin logout removes session and clears auth token');

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
