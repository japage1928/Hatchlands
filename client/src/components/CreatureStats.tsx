import * as React from 'react';
import { Creature } from '@hatchlands/shared';
import { getNextLevelInfo, getCreatureStats, getCreatureRarity } from '../systems/progression';
import './styles/CreatureStats.css';

interface CreatureStatsProps {
  creature: Creature;
  showLevelUp?: boolean;
}

export const CreatureStats: React.FC<CreatureStatsProps> = ({ creature, showLevelUp = false }) => {
  const levelInfo = getNextLevelInfo(creature);
  const stats = getCreatureStats(creature);
  const rarity = getCreatureRarity(creature);

  return (
    <div className="creature-stats">
      {/* Header with name and rarity */}
      <div className="stats-header">
        <div className="stats-title">
          <h3>{creature.nickname || creature.primaryAnchor}</h3>
          <span className="rarity-badge">{rarity}</span>
        </div>
        <div className="level-badge">
          <span className="level-number">Lv. {levelInfo.currentLevel}</span>
          {showLevelUp && <span className="level-up-indicator">+</span>}
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="xp-section">
        <div className="xp-header">
          <span className="xp-label">Experience</span>
          <span className="xp-numbers">
            {levelInfo.xpInCurrentLevel} / {levelInfo.currentLevelXP}
          </span>
        </div>
        <div className="xp-bar-container">
          <div className="xp-bar">
            <div 
              className="xp-fill"
              style={{ width: `${levelInfo.progressPercent}%` }}
            ></div>
          </div>
          {levelInfo.isMaxLevel && (
            <span className="max-level-badge">MAX LEVEL</span>
          )}
        </div>
      </div>

      {/* Base Stats */}
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-icon">❤️</span>
          <span className="stat-label">HP</span>
          <span className="stat-value">{stats.health}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">⚔️</span>
          <span className="stat-label">ATK</span>
          <span className="stat-value">{stats.attack}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🛡️</span>
          <span className="stat-label">DEF</span>
          <span className="stat-value">{stats.defense}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">⚡</span>
          <span className="stat-label">SPD</span>
          <span className="stat-value">{stats.speed}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🔥</span>
          <span className="stat-label">SP.A</span>
          <span className="stat-value">{stats.spAtk}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">❄️</span>
          <span className="stat-label">SP.D</span>
          <span className="stat-value">{stats.spDef}</span>
        </div>
      </div>

      {/* Genetics Info */}
      <div className="genetics-info">
        <div className="genetics-item">
          <span className="label">Generation:</span>
          <span className="value">{creature.genomeSignature.generation}</span>
        </div>
        <div className="genetics-item">
          <span className="label">Seed:</span>
          <span className="value">#{creature.seed.toString(16).toUpperCase().slice(0, 6)}</span>
        </div>
        {creature.secondaryAnchor && (
          <div className="genetics-item">
            <span className="label">Hybrid Species:</span>
            <span className="value">{creature.secondaryAnchor}</span>
          </div>
        )}
      </div>
    </div>
  );
};
