import React, { useState, useMemo } from 'react';
import { 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Trash2, 
  RotateCcw, 
  Copy, 
  ShieldCheck, 
  MessageSquare, 
  Smartphone, 
  Send, 
  Layers, 
  Info,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';
import { 
  parseEmailList, 
  parsePhoneList, 
  organizeCleanLines, 
  deduplicateLines, 
  removeInvalidLines,
  ContactValidationSummary,
  ParsedContactItem
} from '../../services/contactValidation';
import { NotificationRecipient, NotificationChannel } from '../../types/notification';

interface ContactDetailsSectionProps {
  onValidatedContactsChange?: (summary: {
    emails: ContactValidationSummary;
    phones: ContactValidationSummary;
    allValid: boolean;
    recipients: NotificationRecipient[];
    channels: { email: boolean; sms: boolean; whatsapp: boolean };
  }) => void;
  onDispatch?: (data: {
    recipients: NotificationRecipient[];
    channels: { email: boolean; sms: boolean; whatsapp: boolean };
    channel: NotificationChannel;
  }) => Promise<void>;
  isDispatching?: boolean;
  initialEmails?: string;
  initialPhones?: string;
  embedded?: boolean; // When rendered inside another modal
}

export const ContactDetailsSection: React.FC<ContactDetailsSectionProps> = ({
  onValidatedContactsChange,
  onDispatch,
  isDispatching = false,
  initialEmails = '',
  initialPhones = '',
  embedded = false,
}) => {
  const [emailText, setEmailText] = useState(initialEmails);
  const [phoneText, setPhoneText] = useState(initialPhones);

  // Communication channels
  const [channels, setChannels] = useState({
    email: true,
    sms: false,
    whatsapp: true,
  });

  // Active inspector tab
  const [activeInspector, setActiveInspector] = useState<'emails' | 'phones'>('emails');

  // Real-time parsed summaries
  const emailSummary = useMemo(() => parseEmailList(emailText), [emailText]);
  const phoneSummary = useMemo(() => parsePhoneList(phoneText), [phoneText]);

  // Overall validation status
  const hasEmails = emailSummary.totalCount > 0;
  const hasPhones = phoneSummary.totalCount > 0;
  const hasAnyContacts = hasEmails || hasPhones;

  const emailsValid = !emailSummary.hasErrors && emailSummary.validCount > 0;
  const phonesValid = !phoneSummary.hasErrors && phoneSummary.validCount > 0;

  // Rule: "Enable sending only when all entered contacts are valid."
  // If email field has entries, every single email entry must be valid (no errors, no duplicates).
  // If phone field has entries, every single phone entry must be valid (no errors, no duplicates).
  const hasSyntaxErrors = emailSummary.invalidCount > 0 || phoneSummary.invalidCount > 0;
  const hasDuplicates = emailSummary.duplicateCount > 0 || phoneSummary.duplicateCount > 0;
  const allEnteredValid = hasAnyContacts && !hasSyntaxErrors && !hasDuplicates;

  // Selected channels compatibility
  const emailChannelActive = channels.email;
  const phoneChannelActive = channels.sms || channels.whatsapp;
  const atLeastOneChannelSelected = channels.email || channels.sms || channels.whatsapp;

  // Channel readiness requirements
  const channelRequirementsMet = 
    (!emailChannelActive || emailSummary.validCount > 0) &&
    (!phoneChannelActive || phoneSummary.validCount > 0) &&
    atLeastOneChannelSelected;

  const canDispatch = allEnteredValid && channelRequirementsMet && !isDispatching;

  // Construct unified NotificationRecipient objects
  const combinedRecipients = useMemo<NotificationRecipient[]>(() => {
    const list: NotificationRecipient[] = [];

    // Pair by index where possible, or add individually
    const maxLen = Math.max(emailSummary.validItems.length, phoneSummary.validItems.length);
    for (let i = 0; i < maxLen; i++) {
      const emailItem = emailSummary.validItems[i];
      const phoneItem = phoneSummary.validItems[i];
      const id = `contact-${i + 1}`;
      const email = emailItem ? emailItem.formatted : '';
      const phone = phoneItem ? phoneItem.formatted : '';
      const name = email ? email.split('@')[0] : `Recipient ${i + 1}`;

      list.push({
        id,
        name,
        email,
        phone,
        category: 'custom',
        sourceModule: 'general',
        isSubscribed: true,
      });
    }

    return list;
  }, [emailSummary.validItems, phoneSummary.validItems]);

  // Notify parent component on changes
  React.useEffect(() => {
    if (onValidatedContactsChange) {
      onValidatedContactsChange({
        emails: emailSummary,
        phones: phoneSummary,
        allValid: canDispatch,
        recipients: combinedRecipients,
        channels,
      });
    }
  }, [emailSummary, phoneSummary, canDispatch, combinedRecipients, channels, onValidatedContactsChange]);

  // Format and organize line by line
  const handleOrganizeEmails = () => {
    const clean = organizeCleanLines(emailText, 'email');
    setEmailText(clean);
  };

  const handleOrganizePhones = () => {
    const clean = organizeCleanLines(phoneText, 'phone');
    setPhoneText(clean);
  };

  // Deduplicate
  const handleDeduplicateEmails = () => {
    const deduped = deduplicateLines(emailText, 'email');
    setEmailText(deduped);
  };

  const handleDeduplicatePhones = () => {
    const deduped = deduplicateLines(phoneText, 'phone');
    setPhoneText(deduped);
  };

  // Strip invalid
  const handleClearInvalidEmails = () => {
    const validOnly = removeInvalidLines(emailText, 'email');
    setEmailText(validOnly);
  };

  const handleClearInvalidPhones = () => {
    const validOnly = removeInvalidLines(phoneText, 'phone');
    setPhoneText(validOnly);
  };

  // Insert realistic sample data for testing & rapid administrative broadcasting
  const handleLoadSampleContacts = () => {
    setEmailText(
      'dr.sharma@bhu.ac.in\n' +
      'prof.pandey@sampurnanand.ac.in\n' +
      'research.fellow@jnu.ac.in\n' +
      'editorial.desk@bharatcollective.org'
    );
    setPhoneText(
      '9839123456\n' +
      '+91 94150 99887\n' +
      '9811234567\n' +
      '+91 97118 76543'
    );
  };

  const activeSummary = activeInspector === 'emails' ? emailSummary : phoneSummary;

  return (
    <div className={`space-y-5 ${embedded ? '' : 'bg-white rounded-2xl p-5 border border-slate-200 shadow-xs'}`}>
      
      {/* Header / Intro banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-serif font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-700" />
            <span>Contact Details (Separate Emails & Phone Numbers)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Paste multiple emails and phones line-by-line. Automatic <strong>+91 India country code</strong> applied only when country code is missing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSampleContacts}
            className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
            title="Load valid institutional sample contacts for testing"
          >
            <Sparkles className="w-3 h-3 text-amber-700" />
            <span>Load Sample Contacts</span>
          </button>
        </div>
      </div>

      {/* Split Textareas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* FIELD 1: EMAIL ADDRESSES */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Email Addresses</span>
              <span className="text-[10px] text-slate-400 font-normal">(One per line)</span>
            </label>

            {/* Quick Status Pill */}
            <div className="flex items-center space-x-1 text-[10px]">
              <span className="px-2 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-700">
                {emailSummary.totalCount} lines
              </span>
              {emailSummary.validCount > 0 && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  {emailSummary.validCount} valid
                </span>
              )}
              {emailSummary.invalidCount > 0 && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800">
                  {emailSummary.invalidCount} invalid
                </span>
              )}
              {emailSummary.duplicateCount > 0 && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                  {emailSummary.duplicateCount} dup
                </span>
              )}
            </div>
          </div>

          <div className="relative flex-1">
            <textarea
              rows={7}
              value={emailText}
              onChange={e => setEmailText(e.target.value)}
              placeholder="Paste or type email addresses line by line...&#10;scholar.fellow@du.ac.in&#10;research.lead@jnu.ac.in&#10;advocate.sharma@nlu.ac.in"
              className={`w-full p-3 font-mono text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 transition-all resize-y ${
                emailSummary.invalidCount > 0
                  ? 'border-red-300 focus:ring-red-400'
                  : emailSummary.duplicateCount > 0
                  ? 'border-amber-300 focus:ring-amber-400'
                  : emailSummary.validCount > 0
                  ? 'border-emerald-300 focus:ring-emerald-400'
                  : 'border-slate-200 focus:ring-amber-500'
              }`}
            />
          </div>

          {/* Email Utility Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleOrganizeEmails}
                disabled={emailSummary.totalCount === 0}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors disabled:opacity-40 cursor-pointer"
                title="Format and clean up empty spacing"
              >
                Organize Lines
              </button>
              {emailSummary.duplicateCount > 0 && (
                <button
                  type="button"
                  onClick={handleDeduplicateEmails}
                  className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-colors cursor-pointer"
                  title="Remove duplicate email entries"
                >
                  Deduplicate ({emailSummary.duplicateCount})
                </button>
              )}
              {emailSummary.invalidCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearInvalidEmails}
                  className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-900 font-bold transition-colors cursor-pointer"
                  title="Remove invalid email entries"
                >
                  Clear Invalid ({emailSummary.invalidCount})
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveInspector('emails')}
              className={`px-2 py-1 rounded font-semibold text-[10px] cursor-pointer transition-colors ${
                activeInspector === 'emails' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Inspect Diagnostics
            </button>
          </div>
        </div>

        {/* FIELD 2: PHONE NUMBERS (WITH DEFAULT +91 INDIA CODE) */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phone Numbers (+91 Default)</span>
              <span className="text-[10px] text-slate-400 font-normal">(One per line)</span>
            </label>

            {/* Quick Status Pill */}
            <div className="flex items-center space-x-1 text-[10px]">
              <span className="px-2 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-700">
                {phoneSummary.totalCount} lines
              </span>
              {phoneSummary.validCount > 0 && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  {phoneSummary.validCount} valid
                </span>
              )}
              {phoneSummary.invalidCount > 0 && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800">
                  {phoneSummary.invalidCount} invalid
                </span>
              )}
              {phoneSummary.duplicateCount > 0 && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                  {phoneSummary.duplicateCount} dup
                </span>
              )}
            </div>
          </div>

          <div className="relative flex-1">
            <textarea
              rows={7}
              value={phoneText}
              onChange={e => setPhoneText(e.target.value)}
              placeholder="Paste mobile numbers line by line...&#10;9876543210 (Default +91 applied)&#10;+91 98112 34567 (Preserved)&#10;+1 202 555 0199 (Intl preserved)"
              className={`w-full p-3 font-mono text-xs rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 transition-all resize-y ${
                phoneSummary.invalidCount > 0
                  ? 'border-red-300 focus:ring-red-400'
                  : phoneSummary.duplicateCount > 0
                  ? 'border-amber-300 focus:ring-amber-400'
                  : phoneSummary.validCount > 0
                  ? 'border-emerald-300 focus:ring-emerald-400'
                  : 'border-slate-200 focus:ring-amber-500'
              }`}
            />
          </div>

          {/* Phone Utility Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleOrganizePhones}
                disabled={phoneSummary.totalCount === 0}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors disabled:opacity-40 cursor-pointer"
                title="Format with default +91 and clean up lines"
              >
                Apply +91 & Organize
              </button>
              {phoneSummary.duplicateCount > 0 && (
                <button
                  type="button"
                  onClick={handleDeduplicatePhones}
                  className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-colors cursor-pointer"
                  title="Remove duplicate phone entries"
                >
                  Deduplicate ({phoneSummary.duplicateCount})
                </button>
              )}
              {phoneSummary.invalidCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearInvalidPhones}
                  className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-900 font-bold transition-colors cursor-pointer"
                  title="Remove invalid phone entries"
                >
                  Clear Invalid ({phoneSummary.invalidCount})
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveInspector('phones')}
              className={`px-2 py-1 rounded font-semibold text-[10px] cursor-pointer transition-colors ${
                activeInspector === 'phones' ? 'bg-emerald-700 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Inspect Diagnostics
            </button>
          </div>
        </div>

      </div>

      {/* Live Line-by-Line Diagnostics Drawer */}
      {activeSummary.totalCount > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800">
                Line-by-Line Diagnostics: {activeInspector === 'emails' ? 'Email Addresses' : 'Phone Numbers'}
              </span>
              <span className="text-[11px] text-slate-500">
                ({activeSummary.validCount} valid, {activeSummary.invalidCount} invalid, {activeSummary.duplicateCount} duplicates)
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setActiveInspector('emails')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  activeInspector === 'emails' ? 'bg-blue-100 text-blue-900 font-bold' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Emails ({emailSummary.totalCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveInspector('phones')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  activeInspector === 'phones' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Phones ({phoneSummary.totalCount})
              </button>
            </div>
          </div>

          <div className="max-h-44 overflow-y-auto divide-y divide-slate-200/60 font-mono text-[11px]">
            {activeSummary.items.map((item) => (
              <div key={item.id} className="py-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-slate-400 w-6 text-right shrink-0">{item.lineNumber}.</span>
                  <span className={`font-semibold ${item.isValid ? 'text-slate-900' : 'text-red-700 line-through'}`}>
                    {item.formatted || item.raw}
                  </span>
                  {item.raw !== item.formatted && item.isValid && (
                    <span className="text-[10px] text-slate-400 font-sans">
                      (from: {item.raw})
                    </span>
                  )}
                </div>

                <div className="shrink-0">
                  {item.isValid ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Valid</span>
                    </span>
                  ) : item.isDuplicate ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800" title={item.error}>
                      <AlertCircle className="w-3 h-3" />
                      <span>Duplicate (Line {item.duplicateOfLine})</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800" title={item.error}>
                      <AlertCircle className="w-3 h-3" />
                      <span>{item.error || 'Invalid'}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Communication Channels Selector */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
            <Send className="w-3.5 h-3.5 text-amber-800" />
            <span>Select Notification Channels</span>
          </label>
          <span className="text-[10px] text-slate-500 font-medium">
            Channels automatically validate against entered emails & phone numbers
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* EMAIL CHANNEL */}
          <label className={`p-3 rounded-xl border flex items-center space-x-3 transition-all cursor-pointer ${
            channels.email 
              ? 'bg-blue-50/70 border-blue-300 text-blue-950 shadow-2xs' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          } ${emailSummary.validCount === 0 ? 'opacity-70' : ''}`}>
            <input
              type="checkbox"
              checked={channels.email}
              onChange={e => setChannels({ ...channels, email: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-2">
              <Mail className={`w-4 h-4 ${channels.email ? 'text-blue-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-xs font-bold block">Email Dispatch</span>
                <span className="text-[10px] text-slate-500 block">
                  {emailSummary.validCount > 0 ? `${emailSummary.validCount} valid address(es)` : 'Requires valid email'}
                </span>
              </div>
            </div>
          </label>

          {/* SMS CHANNEL */}
          <label className={`p-3 rounded-xl border flex items-center space-x-3 transition-all cursor-pointer ${
            channels.sms 
              ? 'bg-purple-50/70 border-purple-300 text-purple-950 shadow-2xs' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          } ${phoneSummary.validCount === 0 ? 'opacity-70' : ''}`}>
            <input
              type="checkbox"
              checked={channels.sms}
              onChange={e => setChannels({ ...channels, sms: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
            <div className="flex items-center space-x-2">
              <Smartphone className={`w-4 h-4 ${channels.sms ? 'text-purple-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-xs font-bold block">SMS Text (DLT)</span>
                <span className="text-[10px] text-slate-500 block">
                  {phoneSummary.validCount > 0 ? `${phoneSummary.validCount} valid phone(s)` : 'Requires valid phone'}
                </span>
              </div>
            </div>
          </label>

          {/* WHATSAPP CHANNEL */}
          <label className={`p-3 rounded-xl border flex items-center space-x-3 transition-all cursor-pointer ${
            channels.whatsapp 
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          } ${phoneSummary.validCount === 0 ? 'opacity-70' : ''}`}>
            <input
              type="checkbox"
              checked={channels.whatsapp}
              onChange={e => setChannels({ ...channels, whatsapp: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <div className="flex items-center space-x-2">
              <MessageSquare className={`w-4 h-4 ${channels.whatsapp ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-xs font-bold block">WhatsApp Cloud</span>
                <span className="text-[10px] text-slate-500 block">
                  {phoneSummary.validCount > 0 ? `${phoneSummary.validCount} valid phone(s)` : 'Requires valid phone'}
                </span>
              </div>
            </div>
          </label>

        </div>
      </div>

      {/* Validation Enforcement Banner */}
      <div>
        {!hasAnyContacts ? (
          <div className="p-3 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs flex items-center space-x-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Enter or paste email addresses or phone numbers above to enable notification dispatch.</span>
          </div>
        ) : hasSyntaxErrors || hasDuplicates ? (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs space-y-1.5">
            <div className="font-bold text-red-900 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Sending Disabled: Invalid or Duplicate Contacts Detected</span>
            </div>
            <p className="text-red-700 text-[11px] leading-relaxed">
              Every contact must be completely valid before sending is permitted. 
              {emailSummary.invalidCount > 0 && ` • ${emailSummary.invalidCount} invalid email(s)`}
              {phoneSummary.invalidCount > 0 && ` • ${phoneSummary.invalidCount} invalid phone(s)`}
              {emailSummary.duplicateCount > 0 && ` • ${emailSummary.duplicateCount} duplicate email(s)`}
              {phoneSummary.duplicateCount > 0 && ` • ${phoneSummary.duplicateCount} duplicate phone(s)`}
              . Please fix the highlighted lines or click &ldquo;Deduplicate&rdquo; / &ldquo;Clear Invalid&rdquo; above.
            </p>
          </div>
        ) : !channelRequirementsMet ? (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              {emailChannelActive && emailSummary.validCount === 0
                ? 'Email channel is selected, but no valid email addresses have been entered.'
                : phoneChannelActive && phoneSummary.validCount === 0
                ? 'SMS/WhatsApp channel is selected, but no valid phone numbers have been entered.'
                : 'Please select at least one notification delivery channel.'}
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-emerald-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                All {combinedRecipients.length} entered contact(s) are strictly valid. Ready to dispatch.
              </span>
            </div>
            <div className="text-[11px] text-emerald-800 font-bold">
              {emailSummary.validCount} Email(s) • {phoneSummary.validCount} Phone(s)
            </div>
          </div>
        )}
      </div>

      {onDispatch && (
        <div className="pt-2 flex flex-col sm:flex-row justify-end">
          <button
            type="button"
            disabled={!canDispatch || isDispatching}
            onClick={() => {
              if (!canDispatch) return;
              const ch: NotificationChannel = 
                channels.email && (channels.sms || channels.whatsapp) ? 'all' :
                channels.email ? 'email' :
                channels.whatsapp ? 'whatsapp' : 'sms';
              onDispatch({
                recipients: combinedRecipients,
                channels,
                channel: ch,
              });
            }}
            className="w-full sm:w-auto justify-center px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-all text-xs text-center"
          >
            <Send className="w-4 h-4" />
            <span>{isDispatching ? 'Dispatching...' : `Dispatch to ${combinedRecipients.length} Valid Contact(s)`}</span>
          </button>
        </div>
      )}

    </div>
  );
};
