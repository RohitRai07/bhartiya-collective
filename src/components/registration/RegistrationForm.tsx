import React, { useState } from 'react';
import { registrationService } from '../../services/registrationService';
import { pincodeService } from '../../services/pincodeService';
import { UserRegistrationInput, UserRegistrationRecord } from '../../types/registration';
import { 
  Mail, 
  School, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Search, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface RegistrationFormProps {
  onSuccess?: (record: UserRegistrationRecord) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    nationalNumber: '', // 10 digits
    profession: 'Student',
    engagementType: 'membership' as 'membership' | 'volunteering' | 'both',
    collegeName: '',
    address: '',
    pincode: '',
    city: '',
    district: '',
    state: '',
    consent: false,
  });

  // Pincode lookup state
  const [pincodeStatus, setPincodeStatus] = useState<{
    loading: boolean;
    error: string | null;
    successMessage: string | null;
    availableOffices: string[];
  }>({
    loading: false,
    error: null,
    successMessage: null,
    availableOffices: [],
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<UserRegistrationRecord | null>(null);

  // Field validation error bag
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle Input Changes
  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error on change
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Pincode Auto-fetch Handler
  const handlePincodeLookup = async (pinValue?: string) => {
    const pin = pinValue !== undefined ? pinValue : formData.pincode;
    const cleanPin = pin.trim();

    if (!cleanPin) {
      setPincodeStatus({
        loading: false,
        error: 'Please enter a 6-digit PIN code.',
        successMessage: null,
        availableOffices: [],
      });
      return;
    }

    if (!pincodeService.isValidFormat(cleanPin)) {
      setPincodeStatus({
        loading: false,
        error: 'PIN code must be a valid 6-digit Indian postal code.',
        successMessage: null,
        availableOffices: [],
      });
      return;
    }

    setPincodeStatus({
      loading: true,
      error: null,
      successMessage: null,
      availableOffices: [],
    });

    try {
      // Delegate to isolated pincode service
      const result = await pincodeService.getLocationByPincode(cleanPin);

      if (result.isValid) {
        setFormData(prev => ({
          ...prev,
          city: result.city || prev.city,
          district: result.district || prev.district,
          state: result.state || prev.state,
        }));

        setPincodeStatus({
          loading: false,
          error: null,
          successMessage: `Located: ${result.district}, ${result.state}`,
          availableOffices: result.postOfficeNames || [],
        });
      } else {
        setPincodeStatus({
          loading: false,
          error: result.error || 'Location could not be found for this PIN code.',
          successMessage: null,
          availableOffices: [],
        });
      }
    } catch (err: any) {
      setPincodeStatus({
        loading: false,
        error: err.message || 'Failed to resolve PIN code.',
        successMessage: null,
        availableOffices: [],
      });
    }
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required.';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required.';

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    // Phone validation (+91 10 digits)
    const cleanPhone = formData.nationalNumber.replace(/\D/g, '');
    if (!cleanPhone) {
      errors.nationalNumber = 'Mobile number is required.';
    } else if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.nationalNumber = 'Please enter a valid 10-digit Indian mobile number.';
    }

    if (!formData.collegeName.trim()) errors.collegeName = 'College / University / Institution name is required.';
    if (!formData.address.trim()) errors.address = 'Residential or institutional address is required.';
    if (!formData.pincode.trim()) errors.pincode = 'PIN code is required.';
    if (!formData.city.trim()) errors.city = 'City is required.';
    if (!formData.district.trim()) errors.district = 'District is required.';
    if (!formData.state.trim()) errors.state = 'State is required.';

    if (!formData.consent) {
      errors.consent = 'You must confirm agreement with the collective charter and research ethics.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanPhoneDigits = formData.nationalNumber.replace(/\D/g, '');

      // Construct clean registration payload matching Section 13 specs
      const payload: UserRegistrationInput = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || undefined,
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: {
          countryCode: '+91',
          nationalNumber: cleanPhoneDigits,
          fullFormatted: `+91 ${cleanPhoneDigits}`,
        },
        profession: formData.profession,
        engagementType: formData.engagementType,
        collegeName: formData.collegeName.trim(),
        address: formData.address.trim(),
        pincode: formData.pincode.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        consent: formData.consent,
      };

      // Call registration service boundary
      const response = await registrationService.submitRegistration(payload);

      setSubmittedRecord(response.record);
      if (onSuccess) onSuccess(response.record);

    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      nationalNumber: '',
      profession: 'Student',
      engagementType: 'membership',
      collegeName: '',
      address: '',
      pincode: '',
      city: '',
      district: '',
      state: '',
      consent: false,
    });
    setSubmittedRecord(null);
    setValidationErrors({});
    setPincodeStatus({ loading: false, error: null, successMessage: null, availableOffices: [] });
  };

  // If successfully submitted, show completion confirmation card
  if (submittedRecord) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-10 border border-amber-900/10 shadow-lg text-center max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle className="w-9 h-9" />
        </div>

        <h3 className="font-serif text-3xl font-bold text-slate-900 mb-2">
          Registration Submitted
        </h3>

        <p className="text-slate-600 mb-6 leading-relaxed">
          Welcome to the Core Bhartiya Collective scholar community. Your application has been logged into our admissions registry.
        </p>

        {/* Registration Card Badge */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-6 mb-8 text-left space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-amber-200/60">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Registration Number</span>
            <span className="font-mono text-base font-bold text-amber-950 bg-amber-200/70 px-2.5 py-0.5 rounded">
              {submittedRecord.registrationNumber}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Candidate Name:</span>
              <span className="font-semibold text-slate-800">
                {submittedRecord.firstName} {submittedRecord.middleName} {submittedRecord.lastName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Contact Phone:</span>
              <span className="font-semibold text-slate-800">{submittedRecord.phoneNumber.fullFormatted}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Institution / College:</span>
              <span className="font-semibold text-slate-800">{submittedRecord.collegeName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Location:</span>
              <span className="font-semibold text-slate-800">
                {submittedRecord.city}, {submittedRecord.state} ({submittedRecord.pincode})
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={handleResetForm}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-10 border border-amber-900/10 shadow-sm max-w-3xl mx-auto">
      <div className="mb-8 border-b border-slate-100 pb-6">
        <div className="flex items-center space-x-2 text-amber-700 font-semibold text-xs uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Membership & Volunteer Form</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
          Bharat Collective Foundation Registration
        </h2>
        <p className="text-slate-600 text-sm mt-1">
          Fill in your details to join our scholarly community. All fields marked <span className="text-amber-600 font-bold">*</span> are required.
        </p>
      </div>

      {submitError && (
        <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Name Fields: First, Middle (Opt), Last */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Full Name <span className="text-amber-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                placeholder="First Name *"
                value={formData.firstName}
                onChange={e => handleChange('firstName', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-slate-50/50 ${
                  validationErrors.firstName ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-amber-600'
                }`}
              />
              {validationErrors.firstName && (
                <p className="text-[11px] text-red-600 mt-1">{validationErrors.firstName}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Middle Name (Optional)"
                value={formData.middleName}
                onChange={e => handleChange('middleName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 bg-slate-50/50 focus:border-amber-600"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Last Name *"
                value={formData.lastName}
                onChange={e => handleChange('lastName', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-slate-50/50 ${
                  validationErrors.lastName ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-amber-600'
                }`}
              />
              {validationErrors.lastName && (
                <p className="text-[11px] text-red-600 mt-1">{validationErrors.lastName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info: Email & Phone (+91 10 digits) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Email Address <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="name@university.ac.in"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-slate-50/50 ${
                  validationErrors.email ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-amber-600'
                }`}
              />
            </div>
            {validationErrors.email && (
              <p className="text-[11px] text-red-600 mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Mobile Number (India) <span className="text-amber-600">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 font-semibold text-xs">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={formData.nationalNumber}
                onChange={e => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  handleChange('nationalNumber', cleaned);
                }}
                className={`w-full rounded-r-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-slate-50/50 ${
                  validationErrors.nationalNumber ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-amber-600'
                }`}
              />
            </div>
            {validationErrors.nationalNumber && (
              <p className="text-[11px] text-red-600 mt-1">{validationErrors.nationalNumber}</p>
            )}
          </div>
        </div>

        {/* Engagement Type & Profession */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Volunteering or Membership <span className="text-amber-600">*</span>
            </label>
            <select
              value={formData.engagementType}
              onChange={e => handleChange('engagementType', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-slate-50/50 focus:border-amber-600 focus:bg-white"
            >
              <option value="membership">Membership</option>
              <option value="volunteering">Volunteering</option>
              <option value="both">Both (Membership & Volunteering)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Profession <span className="text-amber-600">*</span>
            </label>
            <select
              value={formData.profession}
              onChange={e => handleChange('profession', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-slate-50/50 focus:border-amber-600 focus:bg-white"
            >
              <option value="Student">Student</option>
              <option value="Researcher">Researcher</option>
              <option value="Lawyer">Lawyer</option>
              <option value="Academician">Academician</option>
              <option value="Legal Expert">Legal Expert</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Institution / College Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            College / University / Organization <span className="text-amber-600">*</span>
          </label>
          <div className="relative">
            <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="e.g., Banaras Hindu University / IIT Bombay / Delhi University"
              value={formData.collegeName}
              onChange={e => handleChange('collegeName', e.target.value)}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-slate-50/50 ${
                validationErrors.collegeName ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-amber-600'
              }`}
            />
          </div>
          {validationErrors.collegeName && (
            <p className="text-[11px] text-red-600 mt-1">{validationErrors.collegeName}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Residential or Institutional Address <span className="text-amber-600">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <textarea
              rows={2}
              placeholder="Street, Department, Hostel or House No."
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-slate-50/50 ${
                validationErrors.address ? 'border-red-400 bg-red-50/30' : 'border-slate-300 focus:border-amber-600'
              }`}
            />
          </div>
          {validationErrors.address && (
            <p className="text-[11px] text-red-600 mt-1">{validationErrors.address}</p>
          )}
        </div>

        {/* Pincode with Auto-Fetch (Section 14) */}
        <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-800">
              Postal PIN Code (Auto-Detect Location) <span className="text-amber-600">*</span>
            </label>
            <span className="text-[11px] text-amber-800 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Auto-populates City, District & State</span>
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 110001 or 560012"
                value={formData.pincode}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  handleChange('pincode', val);
                  if (val.length === 6) {
                    handlePincodeLookup(val);
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono tracking-wider text-slate-900 bg-white ${
                  validationErrors.pincode ? 'border-red-400' : 'border-slate-300 focus:border-amber-600'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => handlePincodeLookup()}
              disabled={pincodeStatus.loading || !formData.pincode}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-60 transition-colors"
            >
              {pincodeStatus.loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Fetch Location</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback messages for Pincode lookup */}
          {pincodeStatus.error && (
            <p className="text-xs text-amber-800 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
              <span>{pincodeStatus.error}</span>
            </p>
          )}

          {pincodeStatus.successMessage && (
            <p className="text-xs text-emerald-700 flex items-center space-x-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>{pincodeStatus.successMessage}</span>
            </p>
          )}

          {/* If multiple post offices in pincode, display info tag */}
          {pincodeStatus.availableOffices.length > 1 && (
            <div className="text-[11px] text-slate-500 pt-1">
              <span className="font-semibold text-slate-600">Postal delivery beats: </span>
              {pincodeStatus.availableOffices.slice(0, 4).join(', ')}
              {pincodeStatus.availableOffices.length > 4 && ` +${pincodeStatus.availableOffices.length - 4} more`}
            </div>
          )}

          {/* Location Fields: City, District, State (Auto-filled, editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                City / Town <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => handleChange('city', e.target.value)}
                placeholder="City"
                className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 bg-white ${
                  validationErrors.city ? 'border-red-400' : 'border-slate-300'
                }`}
              />
              {validationErrors.city && (
                <p className="text-[10px] text-red-600 mt-0.5">{validationErrors.city}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                District <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={e => handleChange('district', e.target.value)}
                placeholder="District"
                className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 bg-white ${
                  validationErrors.district ? 'border-red-400' : 'border-slate-300'
                }`}
              />
              {validationErrors.district && (
                <p className="text-[10px] text-red-600 mt-0.5">{validationErrors.district}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                State <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={e => handleChange('state', e.target.value)}
                placeholder="State"
                className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 bg-white ${
                  validationErrors.state ? 'border-red-400' : 'border-slate-300'
                }`}
              />
              {validationErrors.state && (
                <p className="text-[10px] text-red-600 mt-0.5">{validationErrors.state}</p>
              )}
            </div>
          </div>
        </div>

        {/* Consent Checkbox */}
        <div className="pt-2">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.consent}
              onChange={e => handleChange('consent', e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              I hereby express my interest in the initiatives of Bharat Collective Foundation, agree to adhere to civil research integrity guidelines, and consent to receive academic communications. <span className="text-amber-600 font-bold">*</span>
            </span>
          </label>
          {validationErrors.consent && (
            <p className="text-[11px] text-red-600 mt-1 pl-7">{validationErrors.consent}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Processing Application...</span>
              </>
            ) : (
              <span>Join Us</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
