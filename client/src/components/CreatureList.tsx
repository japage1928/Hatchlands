import * as React from 'react';
import { Creature } from '@hatchlands/shared';
import { CreatureCard } from './CreatureCard';
import './styles/CreatureList.css';

interface CreatureListProps {
  creatures: Creature[];
  onSelectCreature?: (creature: Creature) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export const CreatureList: React.FC<CreatureListProps> = ({ 
  creatures, 
  onSelectCreature, 
  emptyMessage = 'No creatures yet. Explore to find some!',
  loading = false
}) => {
  if (loading) {
    return (
      <div className="creature-list loading">
        <div className="spinner">⏳ Loading creatures...</div>
      </div>
    );
  }

  if (creatures.length === 0) {
    return (
      <div className="creature-list empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Sort by level descending, then by captured date
  const sorted = [...creatures].sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    return (b.capturedAt || 0) - (a.capturedAt || 0);
  });

  return (
    <div className="creature-list">
      <div className="library-stats">
        <span>📚 Total: {creatures.length} creatures</span>
        <span>⭐ Highest Level: {Math.max(...creatures.map(c => c.level), 1)}</span>
      </div>
      
      <div className="creatures-grid">
        {sorted.map(creature => (
          <CreatureCard
            key={creature.id}
            creature={creature}
            onSelect={onSelectCreature}
          />
        ))}
      </div>
    </div>
  );
};
