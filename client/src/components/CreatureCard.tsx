import * as React from 'react';
import { Creature } from '@hatchlands/shared';
import { CreatureViewer } from './CreatureViewer';
import { getAnchorDisplayName } from '../utils/anchors';
import './styles/CreatureCard.css';

interface CreatureCardProps {
  creature: Creature;
  onSelect?: (creature: Creature) => void;
  compact?: boolean;
}

export const CreatureCard: React.FC<CreatureCardProps> = ({ creature, onSelect, compact }) => {
  const healthPercent = Math.min(100, (creature.xp / (creature.level * 100)) * 100);
  const nextLevelXP = creature.level * 100;
  
  return (
    <div className={`creature-card ${compact ? 'compact' : ''}`} onClick={() => onSelect?.(creature)}>
      {!compact && (
        <div className="creature-viewer-container">
          <CreatureViewer creature={creature} />
        </div>
      )}
      
      <div className="creature-info">
        <div className="creature-header">
          <h3>{creature.nickname || `${getAnchorDisplayName(creature.primaryAnchor)} #${creature.id.slice(0, 8)}`}</h3>
          <span className="creature-level">Level {creature.level}</span>
        </div>

        <div className="creature-meta">
          <div className="meta-item">
            <span className="label">Species:</span>
            <span className="value">{getAnchorDisplayName(creature.primaryAnchor)}</span>
          </div>
          {creature.secondaryAnchor && (
            <div className="meta-item">
              <span className="label">Hybrid:</span>
              <span className="value">{getAnchorDisplayName(creature.secondaryAnchor)}</span>
            </div>
          )}
          <div className="meta-item">
            <span className="label">Status:</span>
            <span className={`value status-${creature.status}`}>{creature.status}</span>
          </div>
        </div>

        <div className="xp-bar">
          <div className="xp-label">
            <span>XP {creature.xp} / {nextLevelXP}</span>
          </div>
          <div className="xp-background">
            <div className="xp-fill" style={{ width: `${healthPercent}%` }}></div>
          </div>
        </div>

        {creature.lineageHistory && creature.lineageHistory.length > 0 && (
          <div className="creature-lineage">
            <span className="lineage-label">Generation {creature.genomeSignature.generation}</span>
            {creature.lineageHistory[0].parentA && (
              <div className="parents">
                <span className="small">Parents: {creature.lineageHistory[0].parentA?.slice(0, 8)} × {creature.lineageHistory[0].parentB?.slice(0, 8)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
