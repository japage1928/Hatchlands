import * as React from 'react';
import { Creature } from '@hatchlands/shared';
import { api } from '../api/client';
import { getAnchorDisplayName } from '../utils/anchors';
import './styles/BreedingUI.css';

interface BreedingUIProps {
  creatures: Creature[];
  onBreedingStarted?: () => void;
  onClose?: () => void;
  onStartBreeding?: (parentA: Creature, parentB: Creature) => Promise<void> | void;
}

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

  // Filter available creatures (can't breed with self, must be compatible)
  const availableForA = creatures.filter(c => c.status === 'captured');
  const availableForB = selectedA ? creatures.filter(c => c.id !== selectedA.id && c.status === 'captured') : [];

  const canBreed = selectedA && selectedB && selectedA.id !== selectedB.id;

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

      setSuccess('🥚 Breeding started! Check back soon to collect your offspring.');
      setSelectedA(null);
      setSelectedB(null);
      onBreedingStarted?.();

      // Auto-close after 2 seconds
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
        <h2>🥚 Creature Breeding</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <div className="breeding-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="breeding-section">
          <h3>Select Parent A</h3>
          {availableForA.length > 0 ? (
            <div className="creature-selector">
              {availableForA.map(creature => (
                <div
                  key={creature.id}
                  className={`selector-item ${selectedA?.id === creature.id ? 'selected' : ''}`}
                  onClick={() => setSelectedA(creature)}
                >
                  <div className="selector-name">
                    {creature.nickname || getAnchorDisplayName(creature.primaryAnchor)}
                  </div>
                  <div className="selector-meta">
                    Lvl {creature.level} • Gen {creature.genomeSignature.generation}
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
                {availableForB.map(creature => (
                  <div
                    key={creature.id}
                    className={`selector-item ${selectedB?.id === creature.id ? 'selected' : ''}`}
                    onClick={() => setSelectedB(creature)}
                  >
                    <div className="selector-name">
                      {creature.nickname || getAnchorDisplayName(creature.primaryAnchor)}
                    </div>
                    <div className="selector-meta">
                      Lvl {creature.level} • Gen {creature.genomeSignature.generation}
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
              <div className="preview-arrow">♡</div>
              <div className="parent-preview">
                <strong>{getAnchorDisplayName(selectedB.primaryAnchor)}</strong>
                <small>Lvl {selectedB.level}</small>
              </div>
            </div>
            <div className="preview-info">
              <p>✓ Breeding will cost <strong>200 coins</strong></p>
              <p>✓ Takes ~5 minutes to complete</p>
              <p>✓ Offspring will be generation <strong>{Math.max(selectedA.genomeSignature.generation, selectedB.genomeSignature.generation) + 1}</strong></p>
            </div>
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
          {loading ? 'Starting...' : '🥚 Start Breeding'}
        </button>
      </div>
    </div>
  );
};
