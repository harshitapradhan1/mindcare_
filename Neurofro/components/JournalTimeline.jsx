import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Clock, CalendarIcon } from 'lucide-react';

const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const isYesterday = (dateString) => {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
};

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const EntryCard = ({ entry, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = entry.text.length > 150;
  
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap items-center gap-2 text-slate-400 text-sm font-medium">
          <Clock size={14} />
          {formatTime(entry.timestamp)}
          {entry._savedOnDevice && (
            <span className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
              This device only
            </span>
          )}
        </div>
        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this reflection?')) {
              onDelete(entry.entry_id);
            }
          }}
          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className={`text-slate-700 leading-relaxed ${!expanded && isLong ? 'line-clamp-3' : ''} whitespace-pre-wrap`}>
        {entry.text}
      </div>
      
      {isLong && (
        <button 
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 font-medium"
        >
          {expanded ? (
            <><ChevronUp size={16} /> Show Less</>
          ) : (
            <><ChevronDown size={16} /> Read More</>
          )}
        </button>
      )}
    </div>
  );
};

export default function JournalTimeline({ entries, onDelete }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          📓
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Reflections Yet</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Start your mental health journey by writing your first journal entry today.
        </p>
      </div>
    );
  }

  // Group entries
  const todayEntries = entries.filter(e => isToday(e.timestamp));
  const yesterdayEntries = entries.filter(e => isYesterday(e.timestamp));
  const olderEntries = entries.filter(e => !isToday(e.timestamp) && !isYesterday(e.timestamp));

  const renderSection = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4 ml-1">
          <CalendarIcon size={18} className="text-slate-400" />
          {title}
        </h2>
        <div className="space-y-4">
          {items.map(entry => (
            <EntryCard key={entry.entry_id} entry={entry} onDelete={onDelete} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-10">
      {renderSection("Today", todayEntries)}
      {renderSection("Yesterday", yesterdayEntries)}
      
      {olderEntries.length > 0 && (
        <div className="mt-8 border-t border-slate-200 pt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-6 ml-1">
            <CalendarIcon size={18} className="text-slate-400" />
            Older Reflections
          </h2>
          <div className="space-y-4">
            {olderEntries.map((entry, idx) => {
              // Add date headers for older entries if date changes
              const currDate = formatDate(entry.timestamp);
              const prevDate = idx > 0 ? formatDate(olderEntries[idx - 1].timestamp) : null;
              
              return (
                <div key={entry.entry_id}>
                  {currDate !== prevDate && (
                    <div className="text-sm font-semibold text-slate-400 mb-3 mt-6 ml-2 uppercase tracking-wide">
                      {currDate}
                    </div>
                  )}
                  <EntryCard entry={entry} onDelete={onDelete} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
