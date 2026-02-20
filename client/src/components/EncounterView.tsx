import * as React from 'react';
import { Spawn, Encounter } from '@hatchlands/shared';
import { api } from '../api/client';
import { CreatureViewer } from './CreatureViewer';
import './styles/EncounterView.css';

interface EncounterViewProps {
  spawn: Spawn;
  encounter?: Encounter;
  onCaptured?: (creatureId: string) => void;
  onFled?: () => void;
  onClose?: () => void;
}

type EncounterPhase = 'start' | 'action' | 'result' | 'captured';

export const EncounterView: React.FC<EncounterViewProps> = ({
  spawn,
  encounter,
  onCaptured,
  onFled,
  onClose,
}) => {
  const [phase, setPhase] = React.useState<EncounterPhase>('action');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [captureChance] = React.useState(Math.random() * 100); // Random 0-100% base chance
  const isDemoEncounter = Boolean(encounter?.id?.startsWith('demo-enc-'));

  const handleCapture = async () => {
    if (!encounter) return;

    setLoading(true);
    setPhase('result');

    try {
      if (isDemoEncounter) {
        const success = Math.random() * 100 < captureChance;
        if (success) {
          setResult({ success: true, message: 'You caught the creature!' });
          setPhase('captured');
          setTimeout(() => {
            onCaptured?.(spawn.creature.id);
          }, 1200);
        } else {
          setResult({
            success: false,
            message: 'The creature escaped! Try again or flee.',
          });
        }
        return;
      }

      const response = await api.captureCreature({
        encounterId: encounter.id,
        spawnId: spawn.id,
      });

      if (response.success) {
        setResult({ success: true, message: '🎉 You caught the creature!' });
        setPhase('captured');
        setTimeout(() => {
          onCaptured?.(response.creatureId);
        }, 2000);
      } else {
        setResult({
          success: false,
          message: '😢 The creature escaped! Try again or flee.',
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFlee = async () => {
    if (!encounter) return;

    if (isDemoEncounter) {
      onFled?.();
      return;
    }

    setLoading(true);
    try {
      await api.fleeEncounter(encounter.id, spawn.id);
      onFled?.();
    } catch (err) {
      console.error('Failed to flee:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="encounter-view">
      <div className="encounter-header">
        <h2>⚡ Wild Encounter!</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <div className="encounter-container">
        {/* Creature display */}
        <div className="creature-display">
          <div className="wild-creature">
            <CreatureViewer creature={spawn.creature} />
            <div className="creature-label">
              <h3>{spawn.creature.primaryAnchor}</h3>
              {spawn.creature.secondaryAnchor && (
                <span className="hybrid">Hybrid: {spawn.creature.secondaryAnchor}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action phase */}
        {phase === 'action' && (
          <div className="encounter-actions">
            <div className="action-info">
              <p>A wild <strong>{spawn.creature.primaryAnchor}</strong> appeared!</p>
              <div className="capture-info">
                <div className="info-item">
                  <span className="label">Capture Difficulty:</span>
                  <span className="value">{captureChance > 70 ? 'Easy' : captureChance > 40 ? 'Medium' : 'Hard'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Base Catch Rate:</span>
                  <span className="value">{Math.round(captureChance)}%</span>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="btn-capture"
                onClick={handleCapture}
                disabled={loading}
              >
                {loading ? '⏳ Attempting...' : '🎯 Capture'}
              </button>
              <button
                className="btn-flee"
                onClick={handleFlee}
                disabled={loading}
              >
                {loading ? '⏳ Fleeing...' : '💨 Flee'}
              </button>
            </div>
          </div>
        )}

        {/* Result phase */}
        {phase === 'result' && result && (
          <div className={`encounter-result ${result.success ? 'success' : 'failure'}`}>
            <div className="result-animation">
              {result.success ? <span className="success-icon">✨</span> : <span className="failure-icon">💨</span>}
            </div>
            <p className="result-message">{result.message}</p>

            {!result.success && (
              <div className="retry-prompt">
                <p>What will you do?</p>
                <button
                  className="btn-capture"
                  onClick={handleCapture}
                  disabled={loading}
                >
                  🎯 Try Again
                </button>
                <button
                  className="btn-flee"
                  onClick={handleFlee}
                  disabled={loading}
                >
                  💨 Flee
                </button>
              </div>
            )}
          </div>
        )}

        {/* Captured phase */}
        {phase === 'captured' && (
          <div className="encounter-result success">
            <div className="result-animation captured">
              <span>🎉</span>
            </div>
            <p className="result-message">Creature successfully added to your collection!</p>
            <p className="small-text">Redirecting to your creatures...</p>
          </div>
        )}
      </div>
    </div>
  );
};
