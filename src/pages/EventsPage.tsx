import React from 'react';
import { EventList } from '../components/events/EventList';
import { FlagshipBanner } from '../components/common/FlagshipBanner';
import { Calendar } from 'lucide-react';

interface EventsPageProps {
  onNavigate: (path: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Intro Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3.5 py-1 rounded-full">
          National Dialogues & Convenings
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          #BharatDialogue Series & Symposia
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          National dialogues convening leading constitutional jurists, scholars, and scientists to address critical national questions.
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
