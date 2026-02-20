import * as React from 'react';
import { Spawn } from '@hatchlands/shared';
import { SpawnCard } from './SpawnCard';
import './styles/SpawnList.css';

interface SpawnListProps {
  spawns: Spawn[];
  onSelectSpawn?: (spawn: Spawn) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export const SpawnList: React.FC<SpawnListProps> = ({
  spawns,
  onSelectSpawn,
  loading = false,
  emptyMessage = 'No creatures spawned nearby. Move around to find more!',
}) => {
  if (loading) {
    return (
      <div className="spawn-list loading">
        <div className="spinner">🔍 Scanning for creatures...</div>
      </div>
    );
  }

  if (spawns.length === 0) {
    return (
      <div className="spawn-list empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Sort spawns by expiration time (soonest first)
  const sorted = [...spawns].sort((a, b) => a.expiresAt - b.expiresAt);

  return (
    <div className="spawn-list">
      <div className="spawn-stats">
        <span>🌍 Nearby: {spawns.length} creatures</span>
        <span>📍 Current Region Active</span>
      </div>

      <div className="spawns-grid">
        {sorted.map(spawn => (
          <SpawnCard
            key={spawn.id}
            spawn={spawn}
            onSelect={onSelectSpawn}
          />
        ))}
      </div>
    </div>
  );
};
