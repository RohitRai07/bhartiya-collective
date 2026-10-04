import React, { useState, useEffect } from 'react';
import { EventList } from '../components/events/EventList';
import { FlagshipBanner } from '../components/common/FlagshipBanner';
import { featureConfig } from '../config/featureConfig';
import { Calendar } from 'lucide-react';

interface EventsPageProps {
  onNavigate: (path: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onNavigate }) => {
  const [isEventsActive, setIsEventsActive] = useState(featureConfig.isEnabled('events'));

  useEffect(() => {
    const handleUpdate = () => setIsEventsActive(featureConfig.isEnabled('events'));
    window.addEventListener('bhartiya:feature-change', handleUpdate);
    return () => window.removeEventListener('bhartiya:feature-change', handleUpdate);
  }, []);

  if (!isEventsActive) {
    return (
      <div className="py-24 px-4 max-w-xl mx-auto text-center space-y-4">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-slate-800">Conferences & Events Inactive</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The dialogues and conferences section is currently deactivated via administrative configuration (<code className="font-mono">featureConfig.events = false</code>).
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Intro Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          #BharatDialogue: National Symposium
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          National Workshops Leading Constitutional jurists, scholars, & Legal Experts, Sr Advocate's, Criticals, Legals Issues.
        </p>
      </div>

      {/* Flagship Banner Presentation */}
      <FlagshipBanner onRegisterClick={() => onNavigate('/register')} />

      {/* Full Events Calendar */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6">
          Upcoming Schedule & Roundtables
        </h2>
        <EventList onRegisterInterest={() => onNavigate('/register')} />
      </div>

    </div>
  );
};
