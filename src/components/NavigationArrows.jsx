import React, { forwardRef } from 'react';
import './NavigationArrows.css';

const NavigationArrows = forwardRef(function NavigationArrows(
  { onUp, onDown, disableUp, disableDown },
  ref
) {
  return (
    <div className="nav-arrows" ref={ref}>
      <button
        className="nav-arrow"
        onClick={onUp}
        disabled={disableUp}
        aria-label="Previous game"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      <button
        className="nav-arrow"
        onClick={onDown}
        disabled={disableDown}
        aria-label="Next game"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
});

export default NavigationArrows;
