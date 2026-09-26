/**
 * Pincode Service
 * 
 * Isolated service for Indian Postal PIN code resolution.
 * UI components call getLocationByPincode(pincode) without knowing
 * the underlying API endpoint or external postal provider.
 * 
 * Handles:
 * - 6-digit format validation (non-zero leading digit)
 * - Multiple post office locations in a pincode
 * - No results found
 * - Provider API failure / offline fallback
 */

import { PincodeLookupResult } from '../types/registration';
import { apiConfig } from '../config/apiConfig';

// Known offline fallback cache for key academic and institutional centres
const PINCODE_OFFLINE_CACHE: Record<string, { city: string; district: string; state: string; postOffices: string[] }> = {
  '110001': { city: 'New Delhi', district: 'Central Delhi', state: 'Delhi', postOffices: ['Connaught Place', 'Parliament House', 'Barakhamba Road'] },
  '110016': { city: 'New Delhi', district: 'South Delhi', state: 'Delhi', postOffices: ['Hauz Khas', 'IIT Delhi', 'Mehrauli'] },
  '560012': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', postOffices: ['Malleswaram', 'IISc Campus'] },
  '400032': { city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', postOffices: ['Fort', 'Nariman Point', 'Mantralaya'] },
  '600036': { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', postOffices: ['IIT Madras', 'Guindy'] },
  '221005': { city: 'Varanasi', district: 'Varanasi', state: 'Uttar Pradesh', postOffices: ['Banaras Hindu University', 'Lanka'] },
  '700073': { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', postOffices: ['College Street', 'Calcutta University'] },
  '380009': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', postOffices: ['Navrangpura', 'Gujarat University'] },
  '500007': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', postOffices: ['Osmania University', 'Tarnaka'] },
  '302004': { city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', postOffices: ['Rajasthan University', 'Tilak Nagar'] },
  '411004': { city: 'Pune', district: 'Pune', state: 'Maharashtra', postOffices: ['Deccan Gymkhana', 'Fergusson College'] },
};

export const pincodeService = {
  /**
   * Validate Indian 6-digit postal code syntax
   */
  isValidFormat(pincode: string): boolean {
    const clean = (pincode || '').trim();
    return /^[1-9][0-9]{5}$/.test(clean);
  },

  /**
   * Query location details (City, District, State, Offices) for a given PIN code.
   * Isolates external provider details from the registration form.
   */
  async getLocationByPincode(pincode: string): Promise<PincodeLookupResult> {
    const cleanPin = (pincode || '').trim();

    // 1. Format validation
    if (!this.isValidFormat(cleanPin)) {
      return {
        pincode: cleanPin,
        city: '',
        district: '',
        state: '',
        isValid: false,
        error: cleanPin.length !== 6 
          ? 'PIN code must be exactly 6 digits.' 
          : 'Invalid Indian PIN code format (cannot begin with 0).'
      };
    }

    // 2. Check offline cache first for instant response if available
    if (PINCODE_OFFLINE_CACHE[cleanPin]) {
      const cached = PINCODE_OFFLINE_CACHE[cleanPin];
      return {
        pincode: cleanPin,
        city: cached.city,
        district: cached.district,
        state: cached.state,
        postOfficeNames: cached.postOffices,
        isValid: true,
      };
    }

    // 3. Attempt external India Post API lookup with graceful fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

      const response = await fetch(`${apiConfig.endpoints.pincode.indiaPost}/${cleanPin}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Postal service returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice) && data[0].PostOffice.length > 0) {
        const postOffices = data[0].PostOffice;
        const first = postOffices[0];

        // Gather unique office names
        const names = Array.from(new Set(postOffices.map((po: any) => po.Name))) as string[];

        return {
          pincode: cleanPin,
          city: first.Block && first.Block !== 'NA' ? first.Block : (first.Division || first.District),
          district: first.District,
          state: first.State,
          postOfficeNames: names,
          isValid: true,
        };
      }

      // No results found for this pincode in India Post registry
      return {
        pincode: cleanPin,
        city: '',
        district: '',
        state: '',
        isValid: false,
        error: `No postal records found for PIN code ${cleanPin}. Please verify or enter location manually.`
      };

    } catch (err: any) {
      console.warn(`Pincode API lookup failed for ${cleanPin}, falling back:`, err.message);

      // In case the public postal API is blocked by CORS or down, return a polite fallback
      // so the user is never blocked from filling the form
      return {
        pincode: cleanPin,
        city: '',
        district: '',
        state: '',
        isValid: false,
        error: 'Unable to auto-reach postal directory. You may type your City and State directly.'
      };
    }
  }
};
