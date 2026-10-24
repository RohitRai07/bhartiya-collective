import React, { useState, useEffect, useRef } from 'react';
import { Clock, Check, X, RotateCcw } from 'lucide-react';

export interface ClockTimePickerProps {
  value: string;
  onChange: (timeStr: string) => void;
  label?: string;
  helperText?: string;
}

interface ParsedTime {
  hour: number;        // 1 - 12
  minute: number;      // 0 - 59
  period: 'AM' | 'PM';
  durationMinutes: number; // e.g. 90 min (1.5 hrs), 60 min, 0 for single time
  timezone: string;    // e.g. 'IST'
}

export function parseBroadcastTime(timeStr: string): ParsedTime {
  const defaultTime: ParsedTime = {
    hour: 6,
    minute: 0,
    period: 'PM',
    durationMinutes: 90,
    timezone: 'IST',
  };

  if (!timeStr || !timeStr.trim()) return defaultTime;

  const clean = timeStr.trim();

  // Try matching range: "06:00 PM – 07:30 PM IST" or "06:00 PM - 07:30 PM"
  const rangeMatch = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–—to]+\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*([A-Z]{3,4})?/i);
  if (rangeMatch) {
    let startH = parseInt(rangeMatch[1], 10);
    const startM = parseInt(rangeMatch[2], 10);
    let startP = (rangeMatch[3] || '').toUpperCase() as 'AM' | 'PM';

    let endH = parseInt(rangeMatch[4], 10);
    const endM = parseInt(rangeMatch[5], 10);
    const endP = (rangeMatch[6] || startP || 'PM').toUpperCase() as 'AM' | 'PM';
    const tz = rangeMatch[7] || 'IST';

    if (!startP) {
      startP = endP;
    }

    // Calculate duration in minutes
    let startTotalM = (startH % 12) * 60 + startM + (startP === 'PM' ? 12 * 60 : 0);
    let endTotalM = (endH % 12) * 60 + endM + (endP === 'PM' ? 12 * 60 : 0);
    if (endTotalM < startTotalM) endTotalM += 24 * 60; // Next day
    const dur = endTotalM - startTotalM;

    return {
      hour: startH === 0 ? 12 : startH > 12 ? startH - 12 : startH,
      minute: startM,
      period: startP || 'PM',
      durationMinutes: dur > 0 && dur <= 360 ? dur : 90,
      timezone: tz,
    };
  }

  // Single time match: "06:00 PM IST" or "18:00"
  const singleMatch = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*([A-Z]{3,4})?/i);
  if (singleMatch) {
    let h = parseInt(singleMatch[1], 10);
    const m = parseInt(singleMatch[2], 10);
    let p = (singleMatch[3] || '').toUpperCase() as 'AM' | 'PM';
    const tz = singleMatch[4] || 'IST';

    if (!p) {
      if (h >= 12) {
        p = 'PM';
        if (h > 12) h -= 12;
      } else {
        p = 'AM';
        if (h === 0) h = 12;
      }
    } else {
      if (h === 0) h = 12;
      else if (h > 12) h -= 12;
    }

    return {
      hour: h,
      minute: m,
      period: p,
      durationMinutes: 90, // Default 1.5 hr session
      timezone: tz,
    };
  }

  return defaultTime;
}

export function formatBroadcastTime(parsed: ParsedTime): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const startStr = `${pad(parsed.hour)}:${pad(parsed.minute)} ${parsed.period}`;

  if (!parsed.durationMinutes || parsed.durationMinutes <= 0) {
    return `${startStr} ${parsed.timezone}`.trim();
  }

  // Calculate end time
  const startHour24 = (parsed.hour % 12) + (parsed.period === 'PM' ? 12 : 0);
  const totalStartMinutes = startHour24 * 60 + parsed.minute;
  const totalEndMinutes = (totalStartMinutes + parsed.durationMinutes) % (24 * 60);

  const endHour24 = Math.floor(totalEndMinutes / 60);
  const endMinutes = totalEndMinutes % 60;
  const endPeriod = endHour24 >= 12 ? 'PM' : 'AM';
  let endHour12 = endHour24 % 12;
  if (endHour12 === 0) endHour12 = 12;

  const endStr = `${pad(endHour12)}:${pad(endMinutes)} ${endPeriod}`;
  return `${startStr} – ${endStr} ${parsed.timezone}`.trim();
}

export const ClockTimePicker: React.FC<ClockTimePickerProps> = ({
  value,
  onChange,
  label = 'Broadcast Time (IST)',
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const [parsed, setParsed] = useState<ParsedTime>(() => parseBroadcastTime(value));
  const popoverRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setParsed(parseBroadcastTime(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Clock Hand Geometry
  const cx = 110;
  const cy = 110;
  const radius = 80;

  // Selected angle
  let selectedAngleDeg = 0;
  if (mode === 'hours') {
    selectedAngleDeg = (parsed.hour % 12) * 30;
  } else {
    selectedAngleDeg = (parsed.minute % 60) * 6;
  }

  const selectedRad = ((selectedAngleDeg - 90) * Math.PI) / 180;
  const handTipX = cx + radius * Math.cos(selectedRad);
  const handTipY = cy + radius * Math.sin(selectedRad);

  const handleClockClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left - rect.width / 2;
    const clickY = e.clientY - rect.top - rect.height / 2;

    let deg = (Math.atan2(clickY, clickX) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    if (mode === 'hours') {
      let h = Math.round(deg / 30);
      if (h === 0) h = 12;
      const updated = { ...parsed, hour: h };
      setParsed(updated);
      onChange(formatBroadcastTime(updated));
      // Auto-advance to minutes
      setMode('minutes');
    } else {
      let m = Math.round(deg / 6) % 60;
      // Round to nearest 5 minutes if close
      const remainder = m % 5;
      if (remainder <= 1) m -= remainder;
      else if (remainder >= 4) m += (5 - remainder);
      m = m % 60;

      const updated = { ...parsed, minute: m };
      setParsed(updated);
      onChange(formatBroadcastTime(updated));
    }
  };

  const handlePeriodToggle = (p: 'AM' | 'PM') => {
    const updated = { ...parsed, period: p };
    setParsed(updated);
    onChange(formatBroadcastTime(updated));
  };

  const handleDurationChange = (dur: number) => {
    const updated = { ...parsed, durationMinutes: dur };
    setParsed(updated);
    onChange(formatBroadcastTime(updated));
  };

  const applyPreset = (h: number, m: number, p: 'AM' | 'PM', dur: number = 90) => {
    const updated: ParsedTime = {
      hour: h,
      minute: m,
      period: p,
      durationMinutes: dur,
      timezone: 'IST',
    };
    setParsed(updated);
    onChange(formatBroadcastTime(updated));
  };

  return (
    <div className="relative space-y-1" ref={popoverRef}>
      {label && (
        <label className="block font-semibold text-slate-900 text-xs">
          {label}
        </label>
      )}

      {/* Main Trigger Input */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 hover:border-red-500 focus-within:border-red-600 bg-white cursor-pointer relative flex items-center justify-between text-xs transition-colors shadow-2xs group"
      >
        <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 absolute left-3 top-2.5 transition-colors" />
        <span className="font-mono text-slate-900 font-semibold truncate">
          {value || formatBroadcastTime(parsed)}
        </span>
        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
          Pick Time
        </span>
      </div>

      {helperText && (
        <p className="text-[10px] text-slate-500">{helperText}</p>
      )}

      {/* Interactive Clock Modal / Popover */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 z-50 w-76 sm:w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
          
          {/* Header Display: Digital Readout & AM/PM */}
          <div className="bg-slate-900 text-white rounded-2xl p-3 flex items-center justify-between shadow-inner">
            <div className="flex items-center space-x-1.5 font-mono">
              <button
                type="button"
                onClick={() => setMode('hours')}
                className={`text-2xl font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  mode === 'hours' 
                    ? 'bg-red-600 text-white shadow-sm ring-1 ring-white/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="Select Hours"
              >
                {parsed.hour.toString().padStart(2, '0')}
              </button>
              <span className="text-xl font-bold text-slate-500 animate-pulse">:</span>
              <button
                type="button"
                onClick={() => setMode('minutes')}
                className={`text-2xl font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  mode === 'minutes' 
                    ? 'bg-red-600 text-white shadow-sm ring-1 ring-white/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title="Select Minutes"
              >
                {parsed.minute.toString().padStart(2, '0')}
              </button>
            </div>

            {/* AM / PM Toggle */}
            <div className="flex flex-col space-y-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => handlePeriodToggle('AM')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  parsed.period === 'AM' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handlePeriodToggle('PM')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  parsed.period === 'PM' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-center space-x-2 my-2.5">
            <button
              type="button"
              onClick={() => setMode('hours')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mode === 'hours'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1. Choose Hours (1–12)
            </button>
            <button
              type="button"
              onClick={() => setMode('minutes')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                mode === 'minutes'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              2. Choose Minutes (0–55)
            </button>
          </div>

          {/* SVG Clock Face Dial */}
          <div className="relative flex items-center justify-center py-1">
            <svg
              ref={clockRef}
              viewBox="0 0 220 220"
              className="w-52 h-52 select-none cursor-pointer drop-shadow-sm"
              onClick={handleClockClick}
            >
              {/* Outer Dial Circle */}
              <circle
                cx={cx}
                cy={cy}
                r={98}
                fill="#f8fafc"
                stroke="#e2e8f0"
                strokeWidth="2"
              />

              {/* Minute ticks (60 marks) */}
              {Array.from({ length: 60 }).map((_, i) => {
                const isMajor = i % 5 === 0;
                const angle = (i * 6 * Math.PI) / 180;
                const innerR = isMajor ? 90 : 93;
                const outerR = 96;
                const x1 = cx + innerR * Math.sin(angle);
                const y1 = cy - innerR * Math.cos(angle);
                const x2 = cx + outerR * Math.sin(angle);
                const y2 = cy - outerR * Math.cos(angle);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isMajor ? '#94a3b8' : '#cbd5e1'}
                    strokeWidth={isMajor ? 1.5 : 1}
                  />
                );
              })}

              {/* Clock Hand Pointer */}
              <line
                x1={cx}
                y1={cy}
                x2={handTipX}
                y2={handTipY}
                stroke="#dc2626"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Center Pin */}
              <circle cx={cx} cy={cy} r={4.5} fill="#dc2626" />

              {/* Selected Node Halo */}
              <circle
                cx={handTipX}
                cy={handTipY}
                r={15}
                fill="#dc2626"
                opacity="0.9"
              />

              {/* Dial Numbers: Hours Mode */}
              {mode === 'hours' &&
                [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => {
                  const deg = (h % 12) * 30;
                  const rad = ((deg - 90) * Math.PI) / 180;
                  const numX = cx + radius * Math.cos(rad);
                  const numY = cy + radius * Math.sin(rad);
                  const isSelected = parsed.hour === h;

                  return (
                    <text
                      key={h}
                      x={numX}
                      y={numY + 4}
                      textAnchor="middle"
                      className={`text-[12px] font-mono font-bold transition-colors ${
                        isSelected ? 'fill-white' : 'fill-slate-700'
                      }`}
                    >
                      {h}
                    </text>
                  );
                })}

              {/* Dial Numbers: Minutes Mode */}
              {mode === 'minutes' &&
                [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                  const deg = m * 6;
                  const rad = ((deg - 90) * Math.PI) / 180;
                  const numX = cx + radius * Math.cos(rad);
                  const numY = cy + radius * Math.sin(rad);
                  const isSelected = parsed.minute === m;

                  return (
                    <text
                      key={m}
                      x={numX}
                      y={numY + 4}
                      textAnchor="middle"
                      className={`text-[11px] font-mono font-bold transition-colors ${
                        isSelected ? 'fill-white' : 'fill-slate-700'
                      }`}
                    >
                      {m.toString().padStart(2, '0')}
                    </text>
                  );
                })}
            </svg>
          </div>

          {/* Broadcast Duration Selector */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">Broadcast Duration:</span>
            <select
              value={parsed.durationMinutes}
              onChange={(e) => handleDurationChange(parseInt(e.target.value, 10))}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800 text-[11px]"
            >
              <option value={45}>45 Minutes</option>
              <option value={60}>1 Hour</option>
              <option value={90}>1.5 Hours (Standard)</option>
              <option value={120}>2 Hours</option>
              <option value={150}>2.5 Hours</option>
              <option value={180}>3 Hours</option>
              <option value={0}>Single Time Point</option>
            </select>
          </div>

          {/* Quick Presets */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Quick Schedules:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => applyPreset(10, 0, 'AM', 90)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-medium text-left truncate cursor-pointer"
              >
                10:00 AM (Morning)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(2, 30, 'PM', 90)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-medium text-left truncate cursor-pointer"
              >
                02:30 PM (Afternoon)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(5, 30, 'PM', 120)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-medium text-left truncate cursor-pointer"
              >
                05:30 PM (Evening)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(7, 0, 'PM', 90)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-medium text-left truncate cursor-pointer"
              >
                07:00 PM (Prime Time)
              </button>
            </div>
          </div>

          {/* Close & Confirm Button */}
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[170px]">
              {formatBroadcastTime(parsed)}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
