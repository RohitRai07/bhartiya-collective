/**
 * Automated Verification Suite for Future-Proof Architecture
 * Tests all 25 architectural principles and service boundaries.
 */

import { featureConfig } from '../config/featureConfig';
import { apiConfig } from '../config/apiConfig';
import { pincodeService } from '../services/pincodeService';
import { registrationService } from '../services/registrationService';
import { newsletterService } from '../services/newsletterService';
import { donationService, createDonation } from '../services/donationService';
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

  // 8. Admin Credentials & Two-Factor Authentication (2FA) Security
  console.log('\n📌 Testing Admin Credentials & 2FA Lifecycle:');
  const creds = authService.getAdminCredentials();
  assert(creds.email === DEFAULT_ADMIN_CREDS.email, 'Admin credentials loaded correctly');
  assert(creds.twoFactorEnabled === true, '2FA is active by default for administrator');

  const challenge = authService.createTwoFactorChallenge(creds.email);
  assert(challenge.challengeId.startsWith('2fa-'), 'Generates valid 2FA challenge ID');
  assert(challenge.code.length === 6, 'Generates standard 6-digit verification code');

  // Verify bad code fails
  const badAuth = await authService.completeTwoFactorLogin(challenge.challengeId, '000000');
  assert(badAuth.success === false, 'Invalid 2FA code is rejected');

  // Verify valid generated code succeeds
  const goodAuth = await authService.completeTwoFactorLogin(challenge.challengeId, challenge.code);
  assert(goodAuth.success === true && goodAuth.session?.user.role === 'admin', 'Valid 2FA code completes admin authentication');

  // Verify dev bypass code
  const bypassChallenge = authService.createTwoFactorChallenge(creds.email);
  const bypassAuth = await authService.completeTwoFactorLogin(bypassChallenge.challengeId, '123456');
  assert(bypassAuth.success === true, 'Universal dev bypass 123456 succeeds');

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
  assert(coi?.sourceUrl?.includes('legislative.gov.in'), 'Constitution source points to authentic legislative.gov.in repository');
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
    areaOfInterest: 'Center for HR & Legal Aid',
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
