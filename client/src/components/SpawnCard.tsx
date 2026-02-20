import * as React from 'react';
import { Spawn } from '@hatchlands/shared';
import { CreatureViewer } from './CreatureViewer';
import { getAnchorDisplayName } from '../utils/anchors';
import './styles/SpawnCard.css';

interface SpawnCardProps {
  spawn: Spawn;
  onSelect?: (spawn: Spawn) => void;
  distance?: number; // Distance in km for display
}

export const SpawnCard: React.FC<SpawnCardProps> = ({ spawn, onSelect, distance }) => {
  const timeUntilExpire = Math.max(0, spawn.expiresAt - Date.now());
  const expiresInMinutes = Math.ceil(timeUntilExpire / 60000);
  const isExpiringSoon = expiresInMinutes < 2;

  return (
    <div className="spawn-card" onClick={() => onSelect?.(spawn)}>
      <div className="spawn-viewer-container">
        <CreatureViewer creature={spawn.creature} />
      </div>

      <div className="spawn-info">
        <div className="spawn-header">
          <h3>{getAnchorDisplayName(spawn.creature.primaryAnchor)}</h3>
          {spawn.creature.secondaryAnchor && (
            <span className="hybrid-badge">{getAnchorDisplayName(spawn.creature.secondaryAnchor)}</span>
          )}
        </div>

        <div className="spawn-meta">
          <div className="meta-item">
            <span className="icon">🧬</span>
            <span className="label">Generation {spawn.creature.genomeSignature.generation}</span>
          </div>
          
          {distance !== undefined && (
            <div className="meta-item">
              <span className="icon">📍</span>
              <span className="label">{distance.toFixed(2)} km away</span>
            </div>
          )}

          <div className={`meta-item ${isExpiringSoon ? 'expiring-soon' : ''}`}>
            <span className="icon">⏱️</span>
            <span className="label">
              {expiresInMinutes < 1 ? 'Expires in seconds' : `${expiresInMinutes} min left`}
            </span>
          </div>
        </div>

        <div className="spawn-status">
          {spawn.locked && spawn.lockedBy ? (
            <div className="status-locked">
              🔒 Claimed by another trainer
            </div>
          ) : (
            <button 
              className="btn-encounter"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(spawn);
              }}
            >
              ⚡ Start Encounter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
