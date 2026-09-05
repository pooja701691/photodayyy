import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown } from 'lucide-react';

export const TopHeader = () => {
  const navigate = useNavigate();

  const handleNewEvent = () => {
    navigate('/photographer/events?create=true');
  };

  return (
    <header className="app-top-header">
      <div className="top-header-left">
        <span className="workspace-eyebrow">ORGANIZER WORKSPACE</span>
        <div className="workspace-selector">
          <span className="workspace-name">PhotoDey</span>
          <ChevronDown size={14} className="chevron-icon" />
        </div>
      </div>

      <div className="top-header-right">
        <button
          type="button"
          className="btn-new-event-pill"
          onClick={handleNewEvent}
        >
          <Plus size={16} />
          <span>New event</span>
        </button>
      </div>
    </header>
  );
};

export default TopHeader;
