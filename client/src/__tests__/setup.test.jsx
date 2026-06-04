import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import GhostPanel from '../components/GhostPanel';

describe('GhostPanel Component', () => {
  it('should not render anything if adaptiveData is missing', () => {
    const { container } = render(<GhostPanel adaptiveData={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when in DEV mode and adaptiveData is provided', () => {
    // Mock import.meta.env.DEV
    import.meta.env.DEV = true;
    
    const mockData = {
      changePointScore: 3,
      ucb: 1.5,
      status: 'unlocked',
      timesPlayed: 1,
      attemptCount: 2,
      successCount: 1,
      estimate: 0.5,
      correctnessRecord: [true, false]
    };
    
    const { container } = render(<GhostPanel adaptiveData={mockData} conceptId="test_node" />);
    
    // Ghost panel uses className="ghost-debug-panel"
    const panel = container.querySelector('.ghost-debug-panel');
    expect(panel).not.toBeNull();
  });
});
