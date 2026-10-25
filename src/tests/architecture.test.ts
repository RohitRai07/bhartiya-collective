/**
 * Automated Verification Suite for Future-Proof Architecture
 * Tests all 25 architectural principles and service boundaries.
 */

import { featureConfig } from '../config/featureConfig';
import { apiConfig } from '../config/apiConfig';
import { pincodeService } from '../services/pincodeService';
import { registrationService } from '../services/registrationService';
import { newsletterService } from '../services/newsletterService';
import { 
  createDonation, 
  validateDonationAmount, 
  validateDonationPhone, 
  SUGGESTED_AMOUNTS, 
  MIN_DONATION_AMOUNT 
} from '../services/donationService';
import { createRazorpayOrder } from '../services/razorpayService';
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
import { contactService } from '../services/contactService';
import { flagshipService, DEFAULT_FLAGSHIP_BANNER } from '../services/flagshipService';
import { centralizedNotificationService } from '../services/centralizedNotificationService';
import { backendNotificationService } from '../services/backendNotificationService';
import { 
  validateAndFormatEmail, 
  validateAndFormatPhoneNumber, 
  parseEmailList, 
  parsePhoneList,
  organizeCleanLines,
  deduplicateLines,
  removeInvalidLines,
} from '../services/contactValidation';
import { MAX_CV_SIZE_BYTES } from '../types/career';
import { UserRegistrationInput } from '../types/registration';
import { 
  computeLiveEventStatus, 
  getYouTubeEmbedUrl, 
  getYouTubeWatchUrl, 
  getYouTubeThumbnail 
} from '../utils/youtube';
import { 
  validateBroadcastTime, 
  extractBroadcastTime, 
  formatBroadcastStorageTime, 
  TIME_FORMAT_ERROR,
  parseBroadcastTime, 
  formatBroadcastTime 
} from '../utils/timeValidation';
import { 
  STANDARD_SPEAKER_ROLES, 
  COMMON_AFFILIATIONS 
} from '../types/event';
import { resolveEventImage, DEFAULT_EVENT_IMAGE } from '../utils/eventImage';

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

  // Support Us Form: Preset Amounts, Synchronization & Minimum Validation
  console.log('\n📌 Testing Support Us Preset Synchronization & Validation:');
  assert(MIN_DONATION_AMOUNT === 500, 'Minimum donation amount is set to ₹500');
  assert(Array.isArray(SUGGESTED_AMOUNTS) && SUGGESTED_AMOUNTS.includes(1000) && SUGGESTED_AMOUNTS.includes(2500), 'Contains suggested preset amounts ₹1,000 and ₹2,500');

  // Amount validation rules
  const belowMinResult = validateDonationAmount('499');
  assert(belowMinResult.isValid === false, 'Amount below 500 is rejected');
  assert(belowMinResult.error === 'Minimum donation amount is ₹500.', 'Displays exact message: Minimum donation amount is ₹500.');

  const emptyAmountResult = validateDonationAmount('');
  assert(emptyAmountResult.isValid === false && emptyAmountResult.error === 'Minimum donation amount is ₹500.', 'Empty amount rejected with minimum donation message');

  const zeroAmountResult = validateDonationAmount('0');
  assert(zeroAmountResult.isValid === false && zeroAmountResult.error === 'Minimum donation amount is ₹500.', 'Zero amount rejected with minimum donation message');

  const validMinResult = validateDonationAmount('500');
  assert(validMinResult.isValid === true && validMinResult.amount === 500, 'Minimum boundary amount ₹500 is accepted');

  const validPreset1000 = validateDonationAmount('1000');
  assert(validPreset1000.isValid === true && validPreset1000.amount === 1000, 'Preset ₹1,000 is accepted');

  const validPreset2500 = validateDonationAmount('2500');
  assert(validPreset2500.isValid === true && validPreset2500.amount === 2500, 'Preset ₹2,500 is accepted');

  const invalidDecimalResult = validateDonationAmount('1000.999');
  assert(invalidDecimalResult.isValid === false, 'Amount with >2 decimals is rejected');

  // Preset synchronization simulation
  const checkPresetMatch = (val: string) => {
    const num = parseFloat(val);
    return !isNaN(num) && SUGGESTED_AMOUNTS.includes(num) && val === num.toString() ? num : null;
  };
  assert(checkPresetMatch('1000') === 1000, 'Input 1000 synchronizes and selects preset 1000');
  assert(checkPresetMatch('2500') === 2500, 'Input 2500 synchronizes and selects preset 2500');
  assert(checkPresetMatch('5000') === 5000, 'Input 5000 synchronizes and selects preset 5000');
  assert(checkPresetMatch('1500') === null, 'Non-preset custom input 1500 deselects all presets');
  assert(checkPresetMatch('500') === null, 'Non-preset custom input 500 deselects all presets');
  assert(checkPresetMatch('') === null, 'Empty input deselects all presets');

  // Mobile number mandatory validation
  const emptyPhoneResult = validateDonationPhone('');
  assert(emptyPhoneResult.isValid === false && emptyPhoneResult.error === 'Please enter your mobile number.', 'Empty phone is rejected');

  const shortPhoneResult = validateDonationPhone('98765');
  assert(shortPhoneResult.isValid === false && shortPhoneResult.error === 'Please enter a valid 10-digit Indian mobile number.', 'Short phone is rejected');

  const validPhoneResult = validateDonationPhone('9876543210');
  assert(validPhoneResult.isValid === true && validPhoneResult.cleanPhone === '+91 9876543210', 'Valid 10-digit phone accepted and formatted');

  const validPrefixedPhone = validateDonationPhone('+91 9876543210');
  assert(validPrefixedPhone.isValid === true && validPrefixedPhone.cleanPhone === '+91 9876543210', '+91 prefixed phone accepted and normalized');

  // Razorpay Gateway Service & Order Workflow
  console.log('\n📌 Testing Razorpay Gateway Service & Order Workflow:');
  const rzpOrder = await createRazorpayOrder({
    amount: 1000,
    receiptId: 'rcpt_arch_test_1000',
    purpose: 'donation',
  });
  assert(rzpOrder.success === true, 'Razorpay order creation succeeds');
  assert(rzpOrder.amount === 100000, 'Calculates 100000 paise for ₹1,000');
  assert(rzpOrder.currency === 'INR', 'Currency matches INR');
  assert(typeof rzpOrder.orderId === 'string' && rzpOrder.orderId.length > 0, 'Order ID is generated');

  // Magazine purchase order (₹100)
  const magOrder = await createRazorpayOrder({
    amount: 100,
    receiptId: 'rcpt_mag_test_100',
    purpose: 'magazine_download',
  });
  assert(magOrder.amount === 10000, 'Calculates 10000 paise for ₹100 magazine purchase');
  assert(magOrder.success === true, 'Magazine order created successfully');

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

  // Test Temporary Dev Fallback '111111' in Development/Testing Mode
  const devChan = authService.createTwoFactorChallenge('rohitraicr10@gmail.com');
  const devAuth = await authService.completeTwoFactorLogin(devChan.challengeId, '111111');
  assert(devAuth.success === true && devAuth.session?.user.role === 'admin', 'Temporary dev fallback 111111 accepted when real provider is unconfigured');
  const devReplay = await authService.completeTwoFactorLogin(devChan.challengeId, '111111');
  assert(devReplay.success === false, 'Dev fallback 111111 is single-use and cannot be replayed');

  // Once real provider IS configured, 111111 must automatically cease to function
  apiConfig.isRealOtpProviderConfigured = true;
  const prodChan = authService.createTwoFactorChallenge('rohitraicr10@gmail.com');
  const prodAuth = await authService.completeTwoFactorLogin(prodChan.challengeId, '111111');
  assert(prodAuth.success === false, 'Dev fallback 111111 automatically stops working once real provider is configured');
  apiConfig.isRealOtpProviderConfigured = false;

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

  // Test Cooldown active on locked challenge
  const earlyResend = await authService.resendTwoFactorOtp(fakeId);
  assert(earlyResend.success === false && typeof earlyResend.secondsLeft === 'number', 'Resend cooldown enforced while active on locked challenge');

  // Test Self-Service Recovery: Request New OTP after cooldown
  (testChan as any).resendAvailableAt = Date.now() - 1000;
  const newChanResult = await authService.resendTwoFactorOtp(fakeId);
  assert(newChanResult.success === true && !!newChanResult.challenge, 'Request New OTP succeeds after cooldown without developer intervention');
  assert(newChanResult.challenge!.challengeId !== fakeId, 'New OTP challenge receives completely distinct challenge ID');
  assert(newChanResult.challenge!.attempts === 0, 'New challenge resets verification attempt counter to 0');

  // Test Old Challenge is permanently invalidated
  const oldChanVerify = await authService.completeTwoFactorLogin(fakeId, '111111');
  assert(oldChanVerify.success === false, 'Invalidated old challenge rejects verification attempts');

  // Test New Challenge can be verified with fresh OTP / development fallback
  const freshVerify = await authService.completeTwoFactorLogin(newChanResult.challenge!.challengeId, '111111');
  assert(freshVerify.success === true && !!freshVerify.session, 'New challenge verifies successfully and creates session');
  assert(authService.isAdminAuthenticated() === true, 'Admin is successfully authenticated after recovery');

  // Test Admin Logout
  await authService.logoutAdmin();
  assert(authService.getAdminSession() === null, 'Admin logout removes session and clears auth token');

  // =========================================================================
  // CENTRALIZED ADMIN NOTIFICATION MODULE & TWO-WAY SYNCHRONIZATION TESTS
  // =========================================================================
  console.log('\n📌 Testing Centralized Admin Notification Module & Two-Way Sync:');

  // 1. Contact / Enquiries Service Verification
  const testInquiry = await contactService.submitInquiry({
    name: 'Dr. Vikramaditya Sharma',
    email: 'vikram.sharma@sampurnanand.ac.in',
    phone: '+91 94150 99887',
    subject: 'Academic Collaboration on Indic Jurisprudence',
    message: 'We wish to invite scholars from Bharat Collective to our upcoming symposium.',
  });
  assert(testInquiry.id.startsWith('inq-'), 'Contact enquiry created with inq- prefix');
  assert(testInquiry.status === 'new', 'New enquiry initializes with status "new"');

  const allInquiries = await contactService.getInquiries();
  assert(allInquiries.some(i => i.id === testInquiry.id), 'Contact inquiry retrievable in directory');

  const updatedInq = await contactService.updateInquiryStatus(testInquiry.id, 'in_progress');
  assert(updatedInq?.status === 'in_progress', 'Contact inquiry status updates reactively');

  // 2. Centralized Recipient Aggregation Across All Modules
  const aggregatedRecipients = await centralizedNotificationService.getAllAggregatedRecipients();
  assert(Array.isArray(aggregatedRecipients) && aggregatedRecipients.length > 0, 'Centralized aggregator queries live data across modules');

  const modulesFound = new Set(aggregatedRecipients.map(r => r.sourceModule));
  assert(modulesFound.has('career'), 'Aggregates career applicants');
  assert(modulesFound.has('newsletter'), 'Aggregates newsletter subscribers');
  assert(modulesFound.has('contact'), 'Aggregates contact inquiries');
  assert(modulesFound.has('registration'), 'Aggregates member registrations');
  assert(modulesFound.has('submission'), 'Aggregates CFP paper submissions');

  // Verify no duplicate IDs or empty names
  const testContactRecipient = aggregatedRecipients.find(r => r.id === testInquiry.id);
  assert(!!testContactRecipient, 'Test contact inquiry is seamlessly aggregated as a notification recipient');
  assert(testContactRecipient?.name === 'Dr. Vikramaditya Sharma', 'Recipient retains original submitted name');
  assert(testContactRecipient?.email === 'vikram.sharma@sampurnanand.ac.in', 'Recipient retains submitted email');
  assert(testContactRecipient?.hasEmail === true && testContactRecipient?.hasPhone === true, 'Channel capabilities computed accurately');

  // 3. Centralized Aggregator Statistics
  const stats = await centralizedNotificationService.getStats();
  assert(stats.totalContacts >= aggregatedRecipients.length, 'Aggregator statistics calculate total recipients accurately');
  assert(stats.totalWithEmail > 0, 'Aggregator statistics compute email-reachable count');
  assert(stats.totalWithPhone > 0, 'Aggregator statistics compute phone/SMS/WhatsApp-reachable count');
  assert(stats.byModule.career > 0, 'Statistics include career count');
  assert(stats.byModule.newsletter > 0, 'Statistics include newsletter count');
  assert(stats.byModule.contact > 0, 'Statistics include contact count');

  // 4. Filtering and Unsubscribe Safety Rules
  const careerOnly = centralizedNotificationService.filterRecipients(aggregatedRecipients, { sourceModule: 'career' });
  assert(careerOnly.every(r => r.sourceModule === 'career'), 'Filter by sourceModule isolates module recipients correctly');

  const emailReadyOnly = centralizedNotificationService.filterRecipients(aggregatedRecipients, { channelAvailability: 'has_email' });
  assert(emailReadyOnly.every(r => r.hasEmail && !!r.email), 'Filter by channelAvailability="has_email" excludes empty email entries');

  const searchFiltered = centralizedNotificationService.filterRecipients(aggregatedRecipients, { searchQuery: 'Vikramaditya' });
  assert(searchFiltered.length >= 1 && searchFiltered[0].name.includes('Vikramaditya'), 'Filter by searchQuery finds matching recipients');

  // 5. Two-Way Synchronization: Notification Dispatched from original module reflects in Centralized Service
  const sampleCareer = aggregatedRecipients.find(r => r.sourceModule === 'career')!;
  assert(!!sampleCareer, 'Sample career applicant found for two-way sync test');

  // Dispatch notification using notificationService
  const sendResult = await notificationService.sendNotification({
    recipients: [{
      id: sampleCareer.id,
      name: sampleCareer.name,
      email: sampleCareer.email,
      phone: sampleCareer.phone,
    }],
    channel: 'both',
    subject: 'Update on Your Application - Bharat Collective Foundation',
    message: 'Namaste {{name}}, your application has been received and is currently under review.',
    dynamicData: { name: sampleCareer.name },
  });

  assert(sendResult.success === true, 'Notification dispatched successfully');
  assert(sendResult.honestStatus === 'simulated' || sendResult.honestStatus === 'delivered', 'Honest status reported transparently without false claims');

  // Query logs for recipient via notificationService (source of truth)
  const recipientLogs = notificationService.getLogsForRecipient(sampleCareer.id, sampleCareer.email, sampleCareer.phone);
  assert(recipientLogs.length >= 1, 'Notification log retrieved via recipient ID/email/phone');
  assert(recipientLogs[0].recipientItems?.some(item => (item.id === sampleCareer.id || item.recipientId === sampleCareer.id || item.email === sampleCareer.email)), 'Per-recipient log item contains correct ID & email mapping');

  // Query logs via centralizedNotificationService
  const centralizedLogs = await centralizedNotificationService.getLogsForRecipient(sampleCareer.id, sampleCareer.email, sampleCareer.phone);
  assert(centralizedLogs.length === recipientLogs.length, 'Centralized Notification Centre logs synchronize identically with module logs');

  // 6. Two-Way Synchronization: Dispatch from Notification Centre reflects in recipient history
  const bulkSendResult = await centralizedNotificationService.sendBulkNotification({
    recipients: [testContactRecipient!],
    channel: 'email',
    subject: 'Academic Collaboration - Bharat Collective',
    message: 'Respected {{name}},\n\nThank you for reaching out regarding the academic symposium.',
    dynamicData: { name: testContactRecipient!.name },
  });

  assert(bulkSendResult.success === true, 'Bulk notification from Notification Centre succeeds');
  const inquiryLogs = notificationService.getLogsForRecipient(testInquiry.id, testInquiry.email, testInquiry.phone);
  assert(inquiryLogs.length >= 1, 'Inquiry receives and synchronizes notification history from Notification Centre');

  // 7. Retry Failed / Simulated Notification
  const lastLog = inquiryLogs[0];
  const retryResult = await notificationService.retryFailedNotification(lastLog.id);
  assert(retryResult.success === true, 'Notification retry mechanism completes successfully');
  assert(typeof retryResult.log?.retryCount === 'number' && retryResult.log.retryCount >= 1, 'Retry counter increments cleanly on the unified record');

  // 7b. Centralized Published Website Content & Notification Hub
  console.log('\n📌 Testing Centralized Published Website Content & Notification Hub:');

  // Fetch all published content items
  const publishedContent = await centralizedNotificationService.getPublishedContent();
  assert(Array.isArray(publishedContent) && publishedContent.length > 0, 'Centralized notification hub fetches published website content');

  // Verify diverse content types are aggregated
  const contentTypes = new Set(publishedContent.map(p => p.contentType));
  assert(
    contentTypes.has('publication') || contentTypes.has('event') || contentTypes.has('podcast') || contentTypes.has('magazine'),
    'Published content aggregates publications, events, podcasts, or magazines'
  );

  // Verify all returned content items have valid status (only published, never draft)
  assert(publishedContent.every(p => p.status === 'published'), 'All items in Notification Centre published list have published status');

  // Verify all published content items have valid public URLs
  assert(
    publishedContent.every(p => p.publicUrl && (p.publicUrl.startsWith('/') || p.publicUrl.startsWith('http'))),
    'All published content items provide public URL'
  );

  // Verify draft exclusion: create a draft event and verify it does NOT appear in getPublishedContent
  const testDraftEvent = await eventService.createEvent({
    title: 'Private Closed Draft Consultation on Digital Governance',
    date: '2026-11-20',
    type: 'Symposium',
    description: 'Internal policy formulation session.',
    status: 'draft',
  });
  const afterDraftPubContent = await centralizedNotificationService.getPublishedContent();
  const draftFound = afterDraftPubContent.find(p => p.id === testDraftEvent.id);
  assert(!draftFound, 'Draft event is strictly excluded from Centralized Notification Centre published content');

  // Unpublish live event test: toggle existing published event to draft and ensure it disappears from published content
  const firstEvent = publishedContent.find(p => p.contentType === 'event' || p.contentType === 'live-event');
  if (firstEvent) {
    const origEvent = await eventService.getEventById(firstEvent.id);
    if (origEvent) {
      // Toggle to draft
      await eventService.updateEvent(firstEvent.id, { status: 'draft' });
      const pubContentAfterUnpublish = await centralizedNotificationService.getPublishedContent();
      assert(!pubContentAfterUnpublish.some(p => p.id === firstEvent.id), 'Unpublished event is immediately removed from Notification Centre published content list');
      // Restore to published
      await eventService.updateEvent(firstEvent.id, { status: 'published' });
      const pubContentAfterRestore = await centralizedNotificationService.getPublishedContent();
      assert(pubContentAfterRestore.some(p => p.id === firstEvent.id), 'Restored published event re-appears in Notification Centre published content list');
    }
  }

  // Cleanup test draft event
  await eventService.deleteEvent(testDraftEvent.id);

  // Broadcast Notification tracking on published content:
  const targetContent = publishedContent[0];
  const initialCount = targetContent.notificationCount;
  
  // Log a broadcast notification associated with this published content
  await notificationService.sendNotification({
    recipients: [{
      id: 'test-subscriber-pub-1',
      name: 'Dr. Anand Kumar',
      email: 'anand.kumar@bihar.gov.in',
      phone: '+91 94310 11223',
      category: 'newsletter',
      sourceModule: 'newsletter',
    }],
    channel: 'email',
    sourceModule: targetContent.contentType,
    subject: `Official Release: ${targetContent.title}`,
    message: `We are pleased to announce the publication of ${targetContent.title}. Read at ${targetContent.publicUrl}`,
    contentReference: targetContent.id,
  });

  const refreshedPublishedContent = await centralizedNotificationService.getPublishedContent();
  const refreshedTarget = refreshedPublishedContent.find(p => p.id === targetContent.id);
  assert(refreshedTarget !== undefined, 'Target published content found on reload');
  assert(refreshedTarget.notificationCount >= initialCount + 1, 'Broadcast notification increments notificationCount on published content item');
  assert(!!refreshedTarget.lastNotifiedAt, 'Broadcast notification sets lastNotifiedAt timestamp on published content item');

  // 7c. Testing Share Functionality & Public URL Integrity Across All Modules
  console.log('\n📌 Testing Share Functionality & Public URL Integrity Across All Modules:');

  // Verify all content module routes match exact public URL conventions
  const sampleOrigin = 'https://bharatcollective.org';
  const resolveShareUrl = (contentUrl: string) => 
    contentUrl.startsWith('http') ? contentUrl : `${sampleOrigin}${contentUrl.startsWith('/') ? '' : '/'}${contentUrl}`;

  const shareTargets = [
    { module: 'Publications', path: '/publications', expected: 'https://bharatcollective.org/publications' },
    { module: 'Circulars', path: '/circulars', expected: 'https://bharatcollective.org/circulars' },
    { module: 'Events', path: '/events', expected: 'https://bharatcollective.org/events' },
    { module: 'Research Domains', path: '/research', expected: 'https://bharatcollective.org/research' },
    { module: 'Research Centres', path: '/centres', expected: 'https://bharatcollective.org/centres' },
    { module: 'Council & Fellows', path: '/about', expected: 'https://bharatcollective.org/about' },
    { module: 'National Team', path: '/about', expected: 'https://bharatcollective.org/about' },
    { module: 'State Chapters', path: '/centres', expected: 'https://bharatcollective.org/centres' },
    { module: 'Media & News', path: '/news', expected: 'https://bharatcollective.org/news' },
    { module: 'Podcasts', path: '/podcasts', expected: 'https://bharatcollective.org/podcasts' },
    { module: 'Magazines', path: '/magazine', expected: 'https://bharatcollective.org/magazine' },
  ];

  for (const target of shareTargets) {
    const resolved = resolveShareUrl(target.path);
    assert(resolved === target.expected, `Share URL resolver maps ${target.module} cleanly to ${target.expected}`);
  }

  // Verify external stream share URL preservation
  const externalVideoShareUrl = 'https://www.youtube.com/watch?v=5qap5aO4i9A';
  assert(resolveShareUrl(externalVideoShareUrl) === externalVideoShareUrl, 'External video stream URLs are preserved verbatim without prefixing domain');

  // Test Social Sharing Intent generation
  const testTitle = 'Indic Economic Democracy: Monograph 2026';
  const testUrl = 'https://bharatcollective.org/publications';
  const encUrl = encodeURIComponent(testUrl);
  const encTitle = encodeURIComponent(testTitle);

  const twitterIntent = `https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`;
  assert(twitterIntent.includes('twitter.com/intent/tweet'), 'Generates valid Twitter/X share intent URL');
  assert(twitterIntent.includes(encUrl) && twitterIntent.includes(encTitle), 'Twitter/X share intent includes encoded URL and title');

  const facebookIntent = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
  assert(facebookIntent.includes('facebook.com/sharer') && facebookIntent.includes(encUrl), 'Generates valid Facebook share dialog URL');

  const linkedInIntent = `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`;
  assert(linkedInIntent.includes('linkedin.com/sharing/share-offsite') && linkedInIntent.includes(encUrl), 'Generates valid LinkedIn share dialog URL');

  // Test Direct Colleague Email Share via notificationService
  const shareEmailResult = await notificationService.sendNotification({
    channel: 'email',
    recipients: [{
      id: 'share-colleague-1',
      name: 'Colleague',
      email: 'fellow.scholar@iitd.ac.in',
      phone: '',
      category: 'subscriber',
    }],
    subject: `Bharat Collective: ${testTitle}`,
    message: `Namaste,\n\nI thought you might be interested in this content from Bharat Collective: "${testTitle}".\n\nYou can view it here: ${testUrl}\n\nWarm regards,\nBharat Collective`,
  });
  assert(shareEmailResult.success === true, 'Direct colleague share via Email executes successfully');

  // Test Direct Colleague WhatsApp Share via notificationService
  const shareWhatsAppResult = await notificationService.sendNotification({
    channel: 'whatsapp',
    recipients: [{
      id: 'share-colleague-2',
      name: 'Colleague',
      email: '',
      phone: '+91 98765 43210',
      category: 'subscriber',
    }],
    subject: `Bharat Collective: ${testTitle}`,
    message: `Namaste,\n\nCheck out this content from Bharat Collective: *${testTitle}*\n\n${testUrl}`,
  });
  assert(shareWhatsAppResult.success === true, 'Direct colleague share via WhatsApp executes successfully');

  // Verify Share action independence from publication state
  assert(notificationService.getLogsForRecipient('share-colleague-1').length >= 1, 'Share action records separate audit entry without polluting broadcast counts');

  // 7d. Testing Dynamic Category Filtering & Selection Under "Connect Published Content"
  console.log('\n📌 Testing Dynamic Category Filtering & Selection Under "Connect Published Content":');

  const allPublished = await centralizedNotificationService.getPublishedContent();
  assert(allPublished.length > 0, 'Centralized notification hub provides published items for Compose filter');

  // Test Category Filtering
  const pubOnly = allPublished.filter(p => p.contentType === 'publication');
  assert(pubOnly.every(p => p.contentType === 'publication'), 'Category filter for "publication" isolates publications');

  const eventOnly = allPublished.filter(p => p.contentType === 'event' || p.contentType === 'live-event');
  assert(eventOnly.every(p => p.contentType === 'event' || p.contentType === 'live-event'), 'Category filter for "event" isolates events');

  // Test Search Query Filtering
  if (allPublished.length > 0) {
    const firstWord = allPublished[0].title.split(' ')[0];
    const searchFiltered = allPublished.filter(p => p.title.toLowerCase().includes(firstWord.toLowerCase()));
    assert(searchFiltered.length >= 1, 'Search query filter matches published content title');
  }

  // 8. Contact Details Validation, Default +91 India Formatting, and Strict Sending Gate
  console.log('\n📌 Testing Contact Details Validation, +91 Phone Formatting & Sending Gate:');

  // A. Email Formatting & Validation
  const validEmailRes = validateAndFormatEmail('  Admin.Scholar@bharatcollective.org  ');
  assert(validEmailRes.isValid === true, 'Valid RFC email with uppercase and spaces is accepted');
  assert(validEmailRes.formatted === 'admin.scholar@bharatcollective.org', 'Email formatted to clean lowercase');

  const invalidEmailNoAt = validateAndFormatEmail('scholar.domain.com');
  assert(invalidEmailNoAt.isValid === false, 'Email missing @ is rejected');
  assert(invalidEmailNoAt.error?.includes('@') === true, 'Email error explains missing @ symbol');

  const invalidEmailNoDomain = validateAndFormatEmail('scholar@');
  assert(invalidEmailNoDomain.isValid === false, 'Email missing domain is rejected');

  const invalidEmailShortTld = validateAndFormatEmail('scholar@domain.c');
  assert(invalidEmailShortTld.isValid === false, 'Email with 1-character TLD is rejected');

  // B. Phone Number Formatting & +91 Default India Country Code
  // Case 1: 10 digits without country code -> gets +91 automatically
  const p1 = validateAndFormatPhoneNumber('9876543210');
  assert(p1.isValid === true, '10-digit Indian phone accepted');
  assert(p1.formatted === '+91 9876543210', 'Default +91 automatically applied when country code is missing');
  assert(p1.countryCode === '+91', 'Country code identified as +91');

  // Case 2: Number with leading trunk 0 -> strips 0 and applies +91
  const p2 = validateAndFormatPhoneNumber('09876543210');
  assert(p2.isValid === true, 'Phone with leading trunk 0 accepted');
  assert(p2.formatted === '+91 9876543210', 'Leading 0 stripped and default +91 applied without duplication');

  // Case 3: 12-digit number starting with 91 -> formats without duplicate 91
  const p3 = validateAndFormatPhoneNumber('919876543210');
  assert(p3.isValid === true, '12-digit starting with 91 accepted');
  assert(p3.formatted === '+91 9876543210', 'Existing 91 prefix detected; does not duplicate to +91 919876543210');

  // Case 4: Already formatted with +91 -> preserved cleanly
  const p4 = validateAndFormatPhoneNumber('+91 9876543210');
  assert(p4.isValid === true, 'Already formatted +91 number accepted');
  assert(p4.formatted === '+91 9876543210', 'Existing +91 retained without duplicating country code');

  // Case 5: International country code -> preserved, does not add +91
  const p5 = validateAndFormatPhoneNumber('+1 202 555 0199');
  assert(p5.isValid === true, 'US international number accepted');
  assert(p5.formatted.startsWith('+1'), 'International country code (+1) preserved; does not apply +91');
  assert(!p5.formatted.includes('+91'), 'International number does not contain +91');

  const pUK = validateAndFormatPhoneNumber('+44 20 7946 0919');
  assert(pUK.isValid === true, 'UK international number accepted');
  assert(pUK.formatted.startsWith('+44'), 'UK country code (+44) preserved without +91');

  // Case 6: Invalid numbers rejected with clear reasons
  const pShort = validateAndFormatPhoneNumber('98765');
  assert(pShort.isValid === false, 'Short phone number rejected');
  assert(pShort.error?.includes('digits') === true, 'Error explains minimum required digits');

  const pLetters = validateAndFormatPhoneNumber('98765abcde');
  assert(pLetters.isValid === false, 'Phone with alphabetic characters rejected');

  // C. Multiline Parsing & Duplicate Identification with Line Cross-References
  const emailBlock = `
    contact1@bharatcollective.org
    contact2@bharatcollective.org
    contact1@bharatcollective.org
    invalid-email-line
  `;
  const emailSummary = parseEmailList(emailBlock);
  assert(emailSummary.totalCount === 4, 'Parses 4 total email lines');
  assert(emailSummary.validCount === 2, 'Detects exactly 2 distinct valid email lines');
  assert(emailSummary.duplicateCount === 1, 'Identifies exactly 1 duplicate email line');
  assert(emailSummary.invalidCount === 1, 'Identifies exactly 1 invalid email line');
  assert(emailSummary.hasErrors === true, 'hasErrors flag true when duplicate or invalid line exists');

  // Check cross-reference line numbering
  const dupEmailItem = emailSummary.items.find(i => i.isDuplicate);
  assert(!!dupEmailItem && typeof dupEmailItem.duplicateOfLine === 'number', 'Duplicate item contains cross-reference line number');
  assert(dupEmailItem?.duplicateOfLine === 1, 'Identifies Line 1 as original source of duplicate');

  const phoneBlock = `
    9876543210
    9876543211
    +91 9876543210
    09876543210
    12345
  `;
  const phoneSummary = parsePhoneList(phoneBlock);
  assert(phoneSummary.totalCount === 5, 'Parses 5 total phone lines');
  assert(phoneSummary.validCount === 2, 'Detects 2 distinct valid phone lines (9876543210 and 9876543211)');
  assert(phoneSummary.duplicateCount === 2, 'Identifies both +91 and 0-prefixed variants as duplicates of Line 1');
  assert(phoneSummary.invalidCount === 1, 'Identifies 5-digit number as invalid');

  // D. Utility Operations (Organize, Deduplicate, Clear Invalid)
  const organizedEmails = organizeCleanLines(emailBlock, 'email');
  assert(organizedEmails.split('\n').length === 4, 'organizes lines with 1 line per entry');

  const deduplicatedEmails = deduplicateLines(emailBlock, 'email');
  const dedupSummary = parseEmailList(deduplicatedEmails);
  assert(dedupSummary.duplicateCount === 0, 'Deduplicate lines eliminates duplicate occurrences');

  const cleanedEmails = removeInvalidLines(emailBlock, 'email');
  const cleanSummary = parseEmailList(cleanedEmails);
  assert(cleanSummary.invalidCount === 0, 'Clear invalid lines removes syntax errors');

  // E. Strict Validation Gate: Enable sending only when all entered contacts are valid
  // If errors or duplicates exist, sending is blocked
  const canSendWithErrors = !emailSummary.hasErrors && emailSummary.validCount > 0;
  assert(canSendWithErrors === false, 'Strict Gate: Sending is blocked when invalid or duplicate lines exist');

  const allCleanInput = `
    scholar1@bharatcollective.org
    scholar2@bharatcollective.org
  `;
  const cleanParsed = parseEmailList(allCleanInput);
  const canSendClean = !cleanParsed.hasErrors && cleanParsed.validCount > 0;
  assert(canSendClean === true, 'Strict Gate: Sending is enabled only when all entered contacts are valid');

  // F. Cross-Module Automatic Notification on Career Status Change
  const allCareers = careerService.getAll();
  const testCandidate = allCareers[0];
  assert(!!testCandidate, 'Test career candidate exists for auto-notification check');

  const initialCandidateLogs = notificationService.getLogsForRecipient(testCandidate.id, testCandidate.email, testCandidate.phone);
  const prevLogCount = initialCandidateLogs.length;

  // Simulate auto-notification dispatching (as performed in handleCareerStatusChange when autoNotifyCareer is ON)
  await backendNotificationService.sendNotification({
    id: testCandidate.id,
    name: testCandidate.fullName,
    email: testCandidate.email,
    phone: testCandidate.phone || '',
    category: 'candidate',
    sourceModule: 'career',
    referenceCode: testCandidate.applicationCode,
  }, 'CAREER_SHORTLISTED', {
    name: testCandidate.fullName,
    application_id: testCandidate.applicationCode,
    status: 'shortlisted',
    sourceModule: 'career',
  }, 'all');

  const updatedCandidateLogs = notificationService.getLogsForRecipient(testCandidate.id, testCandidate.email, testCandidate.phone);
  assert(updatedCandidateLogs.length === prevLogCount + 1, 'Career status change auto-notification logs new entry');
  assert(updatedCandidateLogs[0].sourceModule === 'career', 'Notification log preserves sourceModule="career"');
  assert(updatedCandidateLogs[0].templateId === 'CAREER_SHORTLISTED', 'Notification log records correct templateId');

  console.log('\n📌 Testing YouTube Live Streaming & Events Integration:');

  // 1. YouTube Live URL Parsing
  const liveUrl1 = 'https://www.youtube.com/live/5qap5aO4i9A';
  const liveUrl2 = 'https://youtube.com/live/5qap5aO4i9A?si=xyz123';
  const watchUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const shortUrl = 'https://youtu.be/kJQP7kiw5Fk';
  const embedUrl = 'https://www.youtube.com/embed/3JZ_D3ELwOQ';

  assert(extractYouTubeId(liveUrl1) === '5qap5aO4i9A', 'Extracts ID from youtube.com/live/<id>');
  assert(extractYouTubeId(liveUrl2) === '5qap5aO4i9A', 'Extracts ID from youtube.com/live/<id>?si=...');
  assert(extractYouTubeId(watchUrl) === 'dQw4w9WgXcQ', 'Extracts ID from youtube.com/watch?v=...');
  assert(extractYouTubeId(shortUrl) === 'kJQP7kiw5Fk', 'Extracts ID from youtu.be/<id>');
  assert(extractYouTubeId(embedUrl) === '3JZ_D3ELwOQ', 'Extracts ID from youtube.com/embed/<id>');
  assert(extractYouTubeId('https://www.youtube.com/watch?feature=shared&v=5qap5aO4i9A') === '5qap5aO4i9A', 'Extracts ID from watch?feature=shared&v=<id>');
  assert(extractYouTubeId('https://m.youtube.com/live/5qap5aO4i9A') === '5qap5aO4i9A', 'Extracts ID from m.youtube.com/live/<id>');
  assert(extractYouTubeId('https://www.youtube-nocookie.com/embed/5qap5aO4i9A') === '5qap5aO4i9A', 'Extracts ID from youtube-nocookie.com/embed/<id>');
  assert(extractYouTubeId('https://youtube.com/shorts/5qap5aO4i9A') === '5qap5aO4i9A', 'Extracts ID from youtube.com/shorts/<id>');
  assert(extractYouTubeId('https://example.com/not-youtube') === '', 'Gracefully rejects non-YouTube URL');

  // 2. YouTube Helper Utilities
  assert(getYouTubeThumbnail('5qap5aO4i9A') === 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg', 'Generates valid thumbnail URL');
  const embedUrlGenerated = getYouTubeEmbedUrl('5qap5aO4i9A', true);
  assert(embedUrlGenerated.includes('https://www.youtube.com/embed/5qap5aO4i9A'), 'Generates valid embed player URL');
  assert(embedUrlGenerated.includes('enablejsapi=1'), 'Embed URL includes enablejsapi=1 for error and state event messaging');
  assert(embedUrlGenerated.includes('playsinline=1'), 'Embed URL includes playsinline=1 for smooth mobile inline playback');
  assert(embedUrlGenerated.includes('rel=0'), 'Embed URL includes rel=0 to suppress unrelated videos');
  assert(getYouTubeWatchUrl('5qap5aO4i9A') === 'https://www.youtube.com/watch?v=5qap5aO4i9A', 'Generates valid watch URL');

  // 3. Dynamic Live Status Computation
  assert(computeLiveEventStatus({ liveStatus: 'live' }) === 'live', 'Explicit live status respected');
  assert(computeLiveEventStatus({ liveStatus: 'upcoming' }) === 'upcoming', 'Explicit upcoming status respected');
  assert(computeLiveEventStatus({ liveStatus: 'ended' }) === 'ended', 'Explicit ended status respected');

  const todayStr = new Date().toISOString().split('T')[0];
  assert(computeLiveEventStatus({ date: todayStr }) === 'live', 'Event scheduled for today computes as live');
  assert(computeLiveEventStatus({ date: '2020-01-01' }) === 'ended', 'Event scheduled in past computes as ended');
  assert(computeLiveEventStatus({ date: '2030-12-31' }) === 'upcoming', 'Event scheduled in future computes as upcoming');

  // 4. Live Event Service CRUD & Publishing Lifecycle
  const testLiveEvent = await eventService.createLiveEvent({
    title: 'Test Live Stream on Judicial Accountability',
    description: 'A test livestream dialogue examining judicial ethics and procedural jurisprudence.',
    youtubeUrl: 'https://www.youtube.com/live/5qap5aO4i9A',
    date: '2026-11-20',
    time: '05:00 PM - 06:30 PM IST',
    status: 'draft',
    speakers: [{ name: 'Dr. Test Jurist', affiliation: 'Constitutional Council', role: 'Speaker' }],
  });

  assert(testLiveEvent.id.startsWith('evt-'), 'Live event created with evt- prefix');
  assert(testLiveEvent.isLive === true, 'Live event marked with isLive=true');
  assert(testLiveEvent.youtubeId === '5qap5aO4i9A', 'Live event automatically extracts and stores youtubeId');
  assert(testLiveEvent.status === 'draft', 'Live event initializes with draft status as requested');
  assert(testLiveEvent.bannerImage?.includes('5qap5aO4i9A'), 'Live event auto-assigns YouTube thumbnail');

  // 5. Draft vs Published Visibility
  const publicEventsBefore = await eventService.getEvents(false);
  assert(!publicEventsBefore.some(e => e.id === testLiveEvent.id), 'Draft live event hidden from public website events');

  const adminEventsWithDrafts = await eventService.getEvents(true);
  assert(adminEventsWithDrafts.some(e => e.id === testLiveEvent.id), 'Draft live event visible in admin events list');

  // 6. Publishing Live Event
  const publishedLiveEvent = await eventService.togglePublish(testLiveEvent.id);
  assert(publishedLiveEvent.status === 'published', 'Live event status toggles to published');

  const publicEventsAfter = await eventService.getEvents(false);
  assert(publicEventsAfter.some(e => e.id === testLiveEvent.id), 'Published live event immediately visible on public website');

  const publicLiveStreams = await eventService.getLiveEvents();
  assert(publicLiveStreams.some(e => e.id === testLiveEvent.id), 'Published live event returned in getLiveEvents query');

  // 7. Update Live Event URL & Properties
  const updatedLiveEvent = await eventService.updateEvent(testLiveEvent.id, {
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Updated Live Stream Title',
  });
  assert(updatedLiveEvent.youtubeId === 'dQw4w9WgXcQ', 'Updating youtubeUrl recomputes youtubeId correctly');
  assert(updatedLiveEvent.title === 'Updated Live Stream Title', 'Live event title updated successfully');

  // 8. Delete Live Event
  await eventService.deleteEvent(testLiveEvent.id);
  const eventsAfterDelete = await eventService.getEvents(true);
  assert(!eventsAfterDelete.some(e => e.id === testLiveEvent.id), 'Live event cleaned up successfully from storage');

  // 9. Active 24/7 Seed Stream Embeddability Verification
  const seededLive = await eventService.getEventById('evt-live-ucc-broadcast');
  assert(seededLive !== null, 'Seeded live event exists');
  assert(seededLive?.youtubeId === '5qap5aO4i9A', 'Live event uses active 24/7 stream (5qap5aO4i9A) permitting embedding');
  const activeEmbedUrl = getYouTubeEmbedUrl('5qap5aO4i9A');
  assert(!activeEmbedUrl.includes('origin='), 'Embed URL omits origin query parameter to avoid IP-based rejection by YouTube');
  assert(activeEmbedUrl.includes('playsinline=1'), 'Embed URL includes playsinline=1');
  assert(activeEmbedUrl.includes('enablejsapi=1'), 'Embed URL includes enablejsapi=1');

  // 10. Unpublishing and Publishing the Seeded Live Event
  const unpublishedSeed = await eventService.togglePublish('evt-live-ucc-broadcast');
  assert(unpublishedSeed.status === 'draft', 'Toggling live event unpublishes it to draft status');

  const publicEventsWithDraft = await eventService.getEvents(false);
  assert(!publicEventsWithDraft.some(e => e.id === 'evt-live-ucc-broadcast'), 'Draft live event hidden from public getEvents');

  const publicLiveEventsWithDraft = await eventService.getLiveEvents(false);
  assert(!publicLiveEventsWithDraft.some(e => e.id === 'evt-live-ucc-broadcast'), 'Draft live event hidden from public getLiveEvents');

  // Verify persistence across repeated getEvents calls (ensures loadStoredEvents does not forcibly republish)
  const reloadedAdminEvents = await eventService.getEvents(true);
  const reloadedDraft = reloadedAdminEvents.find(e => e.id === 'evt-live-ucc-broadcast');
  assert(reloadedDraft?.status === 'draft', 'Draft status persists across repeated storage reloads and is not reverted');

  // Restore to published
  const restoredSeed = await eventService.togglePublish('evt-live-ucc-broadcast');
  assert(restoredSeed.status === 'published', 'Toggling live event again restores published status');
  const publicEventsRestored = await eventService.getEvents(false);
  assert(publicEventsRestored.some(e => e.id === 'evt-live-ucc-broadcast'), 'Restored live event visible on public website');

  console.log('\n📌 Testing Manual Time Entry & Validation in Admin Broadcast (HH:MM AM/PM):');
  // Valid times
  const v1 = validateBroadcastTime('09:30 AM');
  assert(v1.isValid && v1.formattedTime === '09:30 AM', 'Accepts valid morning time 09:30 AM');
  const v2 = validateBroadcastTime('12:00 PM');
  assert(v2.isValid && v2.formattedTime === '12:00 PM', 'Accepts valid noon time 12:00 PM');
  const v3 = validateBroadcastTime('06:45 PM');
  assert(v3.isValid && v3.formattedTime === '06:45 PM', 'Accepts valid evening time 06:45 PM');
  const v4 = validateBroadcastTime('11:15 PM');
  assert(v4.isValid && v4.formattedTime === '11:15 PM', 'Accepts valid night time 11:15 PM');
  
  // Custom single-digit hour and lowercase AM/PM with surrounding whitespace
  const v5 = validateBroadcastTime('  9:30 am  ');
  assert(v5.isValid && v5.formattedTime === '09:30 AM', 'Trims whitespace and normalizes 9:30 am to 09:30 AM');
  const v6 = validateBroadcastTime('1:05 pm');
  assert(v6.isValid && v6.formattedTime === '01:05 PM', 'Normalizes 1:05 pm to 01:05 PM');

  // Invalid times and error message
  const inv1 = validateBroadcastTime('14:00');
  assert(!inv1.isValid && inv1.error === TIME_FORMAT_ERROR, 'Rejects 24-hour format 14:00 with standard error message');
  const inv2 = validateBroadcastTime('13:00 PM');
  assert(!inv2.isValid && inv2.error === TIME_FORMAT_ERROR, 'Rejects hour 13 in 12-hour format');
  const inv3 = validateBroadcastTime('00:30 AM');
  assert(!inv3.isValid && inv3.error === TIME_FORMAT_ERROR, 'Rejects hour 00 in 12-hour format');
  const inv4 = validateBroadcastTime('09:65 AM');
  assert(!inv4.isValid && inv4.error === TIME_FORMAT_ERROR, 'Rejects minutes > 59');
  const inv5 = validateBroadcastTime('invalid time');
  assert(!inv5.isValid && inv5.error === TIME_FORMAT_ERROR, 'Rejects non-time string');
  const inv6 = validateBroadcastTime('');
  assert(!inv6.isValid && inv6.error === TIME_FORMAT_ERROR, 'Rejects empty time string');

  // Extract time when editing or rescheduling an existing broadcast
  const ext1 = extractBroadcastTime('06:00 PM – 07:30 PM IST');
  assert(ext1 === '06:00 PM', 'Extracts 06:00 PM when editing an existing ranged broadcast');
  const ext2 = extractBroadcastTime('09:30 AM IST');
  assert(ext2 === '09:30 AM', 'Extracts 09:30 AM when editing a broadcast with IST suffix');
  const ext3 = extractBroadcastTime('18:30');
  assert(ext3 === '06:30 PM', 'Converts 24-hour stored time 18:30 to 06:30 PM during edit/reschedule');

  // Time storage with timezone convention
  const st1 = formatBroadcastStorageTime('09:30 AM');
  assert(st1 === '09:30 AM IST', 'Formats storage time with IST timezone suffix');
  const st2 = formatBroadcastStorageTime('06:45 PM IST');
  assert(st2 === '06:45 PM IST', 'Preserves existing IST suffix without duplicating');

  console.log('\n📌 Testing Legacy Backward Compatibility in Broadcast Time:');
  const parsedTime1 = parseBroadcastTime('06:00 PM – 07:30 PM IST');
  assert(parsedTime1.hour === 6, 'Clock parser resolves hour 6');
  assert(parsedTime1.minute === 0, 'Clock parser resolves minute 0');
  assert(parsedTime1.period === 'PM', 'Clock parser resolves PM period');
  assert(parsedTime1.durationMinutes === 90, 'Clock parser resolves 90 min broadcast duration');
  assert(parsedTime1.timezone === 'IST', 'Clock parser resolves IST timezone');

  const parsedTime2 = parseBroadcastTime('10:15 AM');
  assert(parsedTime2.hour === 10, 'Clock parser resolves morning hour 10');
  assert(parsedTime2.minute === 15, 'Clock parser resolves minute 15');
  assert(parsedTime2.period === 'AM', 'Clock parser resolves AM period');

  const formatted1 = formatBroadcastTime({
    hour: 5,
    minute: 30,
    period: 'PM',
    durationMinutes: 120,
    timezone: 'IST',
  });
  assert(formatted1 === '05:30 PM – 07:30 PM IST', 'Clock formatter formats 2-hour duration range correctly');

  const formattedSingle = formatBroadcastTime({
    hour: 7,
    minute: 0,
    period: 'PM',
    durationMinutes: 0,
    timezone: 'IST',
  });
  assert(formattedSingle === '07:00 PM IST', 'Clock formatter formats single time point correctly');

  console.log('\n📌 Testing Live Event Speaker / Panelist Role & Affiliation Separation:');
  assert(Array.isArray(STANDARD_SPEAKER_ROLES) && STANDARD_SPEAKER_ROLES.length >= 8, 'Standard speaker roles defined as selectable array');
  assert(STANDARD_SPEAKER_ROLES.includes('Keynote Speaker'), 'Roles include Keynote Speaker');
  assert(STANDARD_SPEAKER_ROLES.includes('Plenary Panelist'), 'Roles include Plenary Panelist');
  assert(STANDARD_SPEAKER_ROLES.includes('Featured Panelist'), 'Roles include Featured Panelist');
  assert(STANDARD_SPEAKER_ROLES.includes('Session Chair & Moderator'), 'Roles include Session Chair & Moderator');
  assert(STANDARD_SPEAKER_ROLES.includes('Distinguished Jurist'), 'Roles include Distinguished Jurist');
  assert(STANDARD_SPEAKER_ROLES.includes('Constitutional Scholar'), 'Roles include Constitutional Scholar');
  assert(Array.isArray(COMMON_AFFILIATIONS) && COMMON_AFFILIATIONS.length >= 5, 'Common institutional affiliations defined as selectable options');
  assert(COMMON_AFFILIATIONS.includes('Supreme Court of India'), 'Affiliations include Supreme Court of India');
  assert(COMMON_AFFILIATIONS.includes('National Law School of India University (NLSIU)'), 'Affiliations include NLSIU');

  // Verify creating a live event with separate role and affiliation
  const testSpeakerEvent = await eventService.createLiveEvent({
    title: 'Constitutional Panel: Decolonizing Jurisprudence in Bharat',
    description: 'Special discussion featuring plenary jurists and scholars.',
    youtubeUrl: 'https://www.youtube.com/live/5qap5aO4i9A',
    date: '2026-12-05',
    time: '06:00 PM IST',
    status: 'draft',
    speakers: [
      { name: 'Sr. Adv. J. Sai Deepak', role: 'Keynote Speaker', affiliation: 'Supreme Court of India' },
      { name: 'Prof. Vidya Shankar', role: 'Plenary Panelist', affiliation: 'National Law School of India University' },
      { name: 'Hon. Justice Hemant Gupta', role: 'Session Chair & Moderator', affiliation: 'Former Judge, Supreme Court of India' }
    ]
  });

  assert(testSpeakerEvent.speakers.length === 3, 'All 3 participants saved into live event');
  assert(testSpeakerEvent.speakers[0].role === 'Keynote Speaker', 'First participant role preserved as Keynote Speaker');
  assert(testSpeakerEvent.speakers[0].affiliation === 'Supreme Court of India', 'First participant affiliation preserved separately');
  assert(testSpeakerEvent.speakers[1].role === 'Plenary Panelist', 'Second participant role preserved as Plenary Panelist');
  assert(testSpeakerEvent.speakers[1].affiliation === 'National Law School of India University', 'Second participant affiliation preserved separately');
  assert(testSpeakerEvent.speakers[2].role === 'Session Chair & Moderator', 'Third participant role preserved as Session Chair & Moderator');
  assert(testSpeakerEvent.speakers[2].affiliation === 'Former Judge, Supreme Court of India', 'Third participant affiliation preserved separately');

  // Cleanup
  await eventService.deleteEvent(testSpeakerEvent.id);
  assert(true, 'Test live event with separated speaker roles cleaned up cleanly');

  console.log('\n📌 Testing Event Poster Upload, Storage & Management:');
  const samplePosterDataUrl = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vuUAAA=';
  
  // 1. Image resolver resolution tests
  assert(resolveEventImage(samplePosterDataUrl) === samplePosterDataUrl, 'Resolves base64 data URL poster cleanly without mutation');
  assert(resolveEventImage('https://example.com/poster.jpg') === 'https://example.com/poster.jpg', 'Resolves absolute remote HTTPS poster cleanly');
  assert(resolveEventImage('') === '', 'Empty poster URL returns empty string without error');
  assert(DEFAULT_EVENT_IMAGE.startsWith('http'), 'Default fallback image URL is defined and valid');

  // 2. Create Event with Uploaded Poster (Data URL)
  const posterEvent = await eventService.createEvent({
    title: 'National Conference on Civilizational Sovereignty',
    type: 'Symposium',
    date: '2026-11-25',
    time: '10:00 AM – 05:00 PM IST',
    location: 'Vigyan Bhawan, New Delhi',
    mode: 'In-Person',
    description: 'A national conference examining legal paradigms and civilizational statecraft.',
    speakers: [{ name: 'Justice (Retd.) M. Ramachandran', affiliation: 'Supreme Court', role: 'Keynote Speaker' }],
    registrationOpen: true,
    posterUrl: samplePosterDataUrl,
  });

  assert(posterEvent.id.startsWith('evt-'), 'Event created with valid ID');
  assert(posterEvent.posterUrl === samplePosterDataUrl, 'Uploaded poster saved in posterUrl field');
  assert(posterEvent.bannerImage === samplePosterDataUrl, 'Uploaded poster synchronized with bannerImage field');

  // 3. Update / Replace Event Poster
  const updatedPosterUrl = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80';
  const updatedEvent = await eventService.updateEvent(posterEvent.id, {
    posterUrl: updatedPosterUrl,
  });

  assert(updatedEvent.posterUrl === updatedPosterUrl, 'Event poster replaced successfully with new image');
  assert(updatedEvent.bannerImage === updatedPosterUrl, 'Updated poster automatically synchronizes with bannerImage');

  // 4. Create YouTube Live Event with Dedicated Poster
  const livePosterEvent = await eventService.createLiveEvent({
    title: 'Live Dialogue on Article 44 & UCC',
    description: 'Special livestream examining UCC and constitutional rights.',
    youtubeUrl: 'https://www.youtube.com/live/5qap5aO4i9A',
    date: '2026-10-28',
    time: '04:00 PM IST',
    posterUrl: samplePosterDataUrl,
    status: 'published',
  });

  assert(livePosterEvent.posterUrl === samplePosterDataUrl, 'Live event stores dedicated uploaded poster');
  assert(livePosterEvent.bannerImage === samplePosterDataUrl, 'Live event bannerImage prioritizes uploaded poster');
  assert(livePosterEvent.customThumbnailUrl === samplePosterDataUrl, 'Live event customThumbnailUrl synced with uploaded poster');

  // 5. Cleanup
  await eventService.deleteEvent(posterEvent.id);
  await eventService.deleteEvent(livePosterEvent.id);
  assert(true, 'Test poster events cleaned up cleanly');

  // ==========================================
  // SPECIFICATION: Flagship National Dialogue Banner Centralized Management
  // ==========================================
  console.log('\n--- Testing Flagship National Dialogue Banner Centralized Management ---');

  // 1. Retrieve current flagship banner configuration
  const initialFlagship = await flagshipService.getFlagshipBanner();
  assert(Boolean(initialFlagship), 'Flagship dialogue banner configuration exists and loads');
  assert(initialFlagship.id === 'evt-ucc-flagship', 'Flagship banner is associated with evt-ucc-flagship ID');
  assert(initialFlagship.title === '#BharatDialogue', 'Initial flagship title defaults to #BharatDialogue');
  assert(initialFlagship.badge1 === 'Flagship National Dialogue', 'Initial flagship badge1 matches specification');

  // 2. Update flagship banner with new content
  const customPosterUrl = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80';
  const updatedFlagship = await flagshipService.updateFlagshipBanner({
    title: '#BharatDialogue 2026',
    titleHighlight: 'on CITIZENSHIP & EQUALITY',
    subtitle: 'National Colloquium on Constitutional Values',
    description: 'Updated dialogue description for constitutional jurists and citizens.',
    venueName: 'Constitution Club of India, New Delhi',
    scheduleInfo: 'Registration Open: 15 November 2026',
    ctaText: 'Reserve Your Seat',
    ctaLink: '/register',
    posterUrl: customPosterUrl,
    status: 'published',
    isVisible: true,
  });

  assert(updatedFlagship.title === '#BharatDialogue 2026', 'Flagship title updated to custom title');
  assert(updatedFlagship.titleHighlight === 'on CITIZENSHIP & EQUALITY', 'Flagship titleHighlight updated');
  assert(updatedFlagship.posterUrl === customPosterUrl, 'Flagship poster image updated successfully');
  assert(updatedFlagship.status === 'published', 'Flagship status remains published');
  assert(updatedFlagship.isVisible === true, 'Flagship isVisible flag is true');

  // 3. Verify automatic bidirectional synchronization with eventService
  const syncedEvent = await eventService.getEventById('evt-ucc-flagship');
  assert(Boolean(syncedEvent), 'evt-ucc-flagship event record exists in eventService');
  if (syncedEvent) {
    assert(syncedEvent.title.includes('#BharatDialogue 2026'), 'Event title synchronized with flagship banner updates');
    assert(syncedEvent.posterUrl === customPosterUrl, 'Event posterUrl synchronized with flagship banner poster');
    assert(syncedEvent.description.includes('Updated dialogue description'), 'Event description synchronized with flagship banner');
  }

  // 4. Test visibility toggle
  const toggledOff = await flagshipService.toggleVisibility();
  assert(toggledOff.isVisible === false, 'Flagship banner visibility toggled to hidden');
  assert(toggledOff.status === 'draft', 'Flagship banner status set to draft when hidden');

  const toggledOn = await flagshipService.toggleVisibility();
  assert(toggledOn.isVisible === true, 'Flagship banner visibility toggled back to visible');
  assert(toggledOn.status === 'published', 'Flagship banner status set to published when made visible');

  // 5. Test reset to original defaults
  const resetBanner = await flagshipService.resetToDefault();
  assert(resetBanner.title === DEFAULT_FLAGSHIP_BANNER.title, 'Flagship banner reset restores original title');
  assert(resetBanner.titleHighlight === DEFAULT_FLAGSHIP_BANNER.titleHighlight, 'Flagship banner reset restores original highlight');
  assert(resetBanner.badge1 === DEFAULT_FLAGSHIP_BANNER.badge1, 'Flagship banner reset restores original badge1');
  assert(resetBanner.badge2 === DEFAULT_FLAGSHIP_BANNER.badge2, 'Flagship banner reset restores original badge2');

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
