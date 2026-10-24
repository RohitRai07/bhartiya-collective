/**
 * ClockTimePicker (Legacy Alias -> BroadcastTimeInput)
 * 
 * Replaced clock dial UI with manual time entry in HH:MM AM/PM format.
 * Retains backward compatibility for existing imports and tests.
 */

import React from 'react';
import { BroadcastTimeInput, BroadcastTimeInputProps } from './BroadcastTimeInput';
export { parseBroadcastTime, formatBroadcastTime } from '../../utils/timeValidation';

export type ClockTimePickerProps = BroadcastTimeInputProps;

export const ClockTimePicker: React.FC<ClockTimePickerProps> = (props) => {
  return <BroadcastTimeInput {...props} />;
};
