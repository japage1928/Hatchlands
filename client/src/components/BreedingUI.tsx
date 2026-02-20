import * as React from 'react';
import { Creature, deriveOffspringSeed, predictOffspringBlueprint } from '@hatchlands/shared';
import { api } from '../api/client';
import { getCreatureStats } from '../systems/progression';
import { getAnchorDisplayName } from '../utils/anchors';
import './styles/BreedingUI.css';

interface BreedingUIProps {
  creatures: Creature[];
  onBreedingStarted?: () => void;
  onClose?: () => void;
  onStartBreeding?: (parentA: Creature, parentB: Creature) => Promise<void> | void;
}

type StatBlock = ReturnType<typeof getCreatureStats>;

export const BreedingUI: React.FC<BreedingUIProps> = ({
  creatures,
  onBreedingStarted,
  onClose,
  onStartBreeding,
}) => {
  const [selectedA, setSelectedA] = React.useState<Creature | null>(null);
  const [selectedB, setSelectedB] = React.useState<Creature | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const availableForA = creatures.filter((creature) => creature.status === 'captured');
  const availableForB = selectedA
    ? creatures.filter((creature) => creature.id !== selectedA.id && creature.status === 'captured')
    : [];

  const canBreed = Boolean(selectedA && selectedB && selectedA.id !== selectedB.id);

  const forecast = React.useMemo(() => {
    if (!selectedA || !selectedB) return null;

    const statKeys: Array<keyof StatBlock> = ['health', 'attack', 'defense', 'speed', 'spAtk', 'spDef'];
    const sampleCount = 24;
    const anchorCounts = new Map<string, number>();
    const statValues = new Map<keyof StatBlock, number[]>();
    const totals = {
      vitality: 0,
      power: 0,
      defense: 0,
      agility: 0,
      intellect: 0,
      spirit: 0,
      scale: 0,
    };

    for (const key of statKeys) {
      statValues.set(key, []);
    }

    for (let i = 0; i < sampleCount; i++) {
      const seed = deriveOffspringSeed(selectedA, selectedB, i + 1);
      const blueprint = predictOffspringBlueprint(selectedA, selectedB, seed);
      const previewCreature: Creature = {
        id: `forecast-${i}`,
        seed: blueprint.seed,
        primaryAnchor: blueprint.primaryAnchor,
        secondaryAnchor: blueprint.secondaryAnchor,
        genomeSignature: blueprint.genomeSignature,
        appearanceParams: blueprint.appearanceParams,
        status: 'captured',
        lineageHistory: [],
        birthTimestamp: Date.now(),
        xp: 0,
        level: 1,
      };

      const stats = getCreatureStats(previewCreature);
      const anchorName = getAnchorDisplayName(blueprint.primaryAnchor);
      anchorCounts.set(anchorName, (anchorCounts.get(anchorName) || 0) + 1);

      for (const key of statKeys) {
        statValues.get(key)?.push(stats[key]);
      }

      totals.vitality += blueprint.geneticStats.vitality;
      totals.power += blueprint.geneticStats.power;
      totals.defense += blueprint.geneticStats.defense;
      totals.agility += blueprint.geneticStats.agility;
      totals.intellect += blueprint.geneticStats.intellect;
      totals.spirit += blueprint.geneticStats.spirit;
      totals.scale += blueprint.appearanceParams.scale;
    }

    const anchorLikelihood = Array.from(anchorCounts.entries())
      .map(([name, count]) => ({ name, chance: Math.round((count / sampleCount) * 100) }))
      .sort((a, b) => b.chance - a.chance);

    const statRanges = statKeys.map((key) => {
      const values = statValues.get(key) || [0];
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
      return { key, min, max, avg };
    });

    return {
      anchorLikelihood,
      statRanges,
      geneAverages: {
        vitality: totals.vitality / sampleCount,
        power: totals.power / sampleCount,
        defense: totals.defense / sampleCount,
        agility: totals.agility / sampleCount,
        intellect: totals.intellect / sampleCount,
        spirit: totals.spirit / sampleCount,
        scale: totals.scale / sampleCount,
      },
    };
  }, [selectedA, selectedB]);

  const handleStartBreeding = async () => {
    if (!selectedA || !selectedB) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (onStartBreeding) {
        await onStartBreeding(selectedA, selectedB);
      } else {
        await api.startBreeding({
          parentAId: selectedA.id,
          parentBId: selectedB.id,
        });
      }

      setSuccess('Breeding started. Come back soon to collect the offspring.');
      setSelectedA(null);
      setSelectedB(null);
      onBreedingStarted?.();
      setTimeout(() => onClose?.(), 2000);
    } catch (err) {
      setError(`Failed to start breeding: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="breeding-ui">
      <div className="breeding-header">
        <h2>Creature Breeding</h2>
        <button className="btn-close" onClick={onClose}>x</button>
      </div>

      <div className="breeding-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="breeding-section">
          <h3>Select Parent A</h3>
          {availableForA.length > 0 ? (
            <div className="creature-selector">
              {availableForA.map((creature) => (
                <div
                  key={creature.id}
                  className={`selector-item ${selectedA?.id === creature.id ? 'selected' : ''}`}
                  onClick={() => setSelectedA(creature)}
                >
                  <div className="selector-name">
                    {creature.nickname || getAnchorDisplayName(creature.primaryAnchor)}
                  </div>
                  <div className="selector-meta">
                    Lvl {creature.level} | Gen {creature.genomeSignature.generation}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-creatures">No creatures available for breeding.</p>
          )}
        </div>

        {selectedA && (
          <div className="breeding-section">
            <h3>Select Parent B</h3>
            {availableForB.length > 0 ? (
              <div className="creature-selector">
                {availableForB.map((creature) => (
                  <div
                    key={creature.id}
                    className={`selector-item ${selectedB?.id === creature.id ? 'selected' : ''}`}
                    onClick={() => setSelectedB(creature)}
                  >
                    <div className="selector-name">
                      {creature.nickname || getAnchorDisplayName(creature.primaryAnchor)}
                    </div>
                    <div className="selector-meta">
                      Lvl {creature.level} | Gen {creature.genomeSignature.generation}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-creatures">No other creatures available.</p>
            )}
          </div>
        )}

        {selectedA && selectedB && (
          <div className="breeding-preview">
            <div className="preview-title">Breeding Preview</div>
            <div className="preview-parents">
              <div className="parent-preview">
                <strong>{getAnchorDisplayName(selectedA.primaryAnchor)}</strong>
                <small>Lvl {selectedA.level}</small>
              </div>
              <div className="preview-arrow">+</div>
              <div className="parent-preview">
                <strong>{getAnchorDisplayName(selectedB.primaryAnchor)}</strong>
                <small>Lvl {selectedB.level}</small>
              </div>
            </div>
            <div className="preview-info">
              <p>Breeding cost: <strong>200 coins</strong></p>
              <p>Approximate completion: <strong>5 minutes</strong></p>
              <p>
                Offspring generation:
                <strong> {Math.max(selectedA.genomeSignature.generation, selectedB.genomeSignature.generation) + 1}</strong>
              </p>
            </div>

            {forecast && (
              <div className="forecast-panel">
                <h4>Genetic Forecast</h4>

                <div className="forecast-block">
                  <div className="forecast-label">Likely Primary Type</div>
                  <div className="forecast-chances">
                    {forecast.anchorLikelihood.map((item) => (
                      <span key={item.name} className="forecast-chip">
                        {item.name}: {item.chance}%
                      </span>
                    ))}
                  </div>
                </div>

                <div className="forecast-block">
                  <div className="forecast-label">Projected Stat Range (Lv.1)</div>
                  <div className="forecast-grid">
                    {forecast.statRanges.map((stat) => (
                      <div key={stat.key} className="forecast-stat">
                        <span className="stat-name">{stat.key}</span>
                        <span className="stat-range">{stat.min}-{stat.max}</span>
                        <span className="stat-avg">avg {stat.avg}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="forecast-block">
                  <div className="forecast-label">Gene Tendencies</div>
                  <div className="forecast-traits">
                    <span>Vit {forecast.geneAverages.vitality.toFixed(2)}</span>
                    <span>Pwr {forecast.geneAverages.power.toFixed(2)}</span>
                    <span>Def {forecast.geneAverages.defense.toFixed(2)}</span>
                    <span>Agi {forecast.geneAverages.agility.toFixed(2)}</span>
                    <span>Int {forecast.geneAverages.intellect.toFixed(2)}</span>
                    <span>Spr {forecast.geneAverages.spirit.toFixed(2)}</span>
                    <span>Scale {forecast.geneAverages.scale.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="breeding-actions">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={handleStartBreeding}
          disabled={!canBreed || loading}
        >
          {loading ? 'Starting...' : 'Start Breeding'}
        </button>
      </div>
    </div>
  );
};
