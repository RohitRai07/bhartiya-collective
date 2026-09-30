/**
 * User Registration Data Models
 * 
 * Strict specifications as outlined in Section 13:
 * - firstName (Required)
 * - middleName (Optional)
 * - lastName (Required)
 * - email (Required)
 * - phoneNumber (Required: Country Code +91, 10-digit mobile, unified consistent format)
 * - collegeName (Required)
 * - address (Required)
 * - pincode (Required: 6 digits)
 * - city (Required)
 * - district (Required)
 * - state (Required)
 * - consent (Required: boolean true)
 */

export interface FormattedPhoneNumber {
  countryCode: '+91';
  nationalNumber: string; // 10 digits exactly e.g. "9876543210"
  fullFormatted: string;  // e.g. "+91 9876543210"
}

export type EngagementType = 'membership' | 'volunteering' | 'both';

export interface UserRegistrationInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: FormattedPhoneNumber;
  profession?: string;
  engagementType?: EngagementType;
  collegeName: string;
  address: string;
  pincode: string;
  city: string;
  district: string;
  state: string;
  consent: boolean;
}

export interface UserRegistrationRecord extends UserRegistrationInput {
  id: string;
  registrationNumber: string; // e.g. "BC-2026-REG-0142"
  status: 'pending' | 'verified' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface PincodeLookupResult {
  pincode: string;
  city: string;
  district: string;
  state: string;
  postOfficeNames?: string[];
  isValid: boolean;
  error?: string;
}
