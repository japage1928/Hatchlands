import * as React from 'react';
import { Spawn } from '@hatchlands/shared';
import { CreatureViewer } from './CreatureViewer';
import { getAnchorDisplayName } from '../utils/anchors';
import './styles/EncounterView.css';

export interface CaptureOutcome {
  success: boolean;
  message: string;
}

interface EncounterViewProps {
  spawn: Spawn;
  /** Capture chance 0-1 from the game rules. */
  captureChance: number;
  captureCost: number;
  currency: number;
  onCapture: () => Promise<CaptureOutcome>;
  onCaptured?: () => void;
  onFled?: () => void;
  onClose?: () => void;
}

type EncounterPhase = 'action' | 'result' | 'captured';

export const EncounterView: React.FC<EncounterViewProps> = ({
  spawn,
  captureChance,
  captureCost,
  currency,
  onCapture,
  onCaptured,
  onFled,
  onClose,
}) => {
  const [phase, setPhase] = React.useState<EncounterPhase>('action');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CaptureOutcome | null>(null);
  const pct = Math.round(captureChance * 100);
  const canAfford = currency >= captureCost;

  const handleCapture = async () => {
    setLoading(true);
    setPhase('result');
    try {
      const response = await onCapture();
      setResult(response);
      if (response.success) {
        setPhase('captured');
        setTimeout(() => onCaptured?.(), 1500);
      }
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFlee = () => onFled?.();

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
              <h3>{getAnchorDisplayName(spawn.creature.primaryAnchor)}</h3>
              {spawn.creature.secondaryAnchor && (
                <span className="hybrid">Hybrid: {getAnchorDisplayName(spawn.creature.secondaryAnchor)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action phase */}
        {phase === 'action' && (
          <div className="encounter-actions">
            <div className="action-info">
              <p>A wild <strong>{getAnchorDisplayName(spawn.creature.primaryAnchor)}</strong> (Lvl {spawn.creature.level}) appeared!</p>
              <div className="capture-info">
                <div className="info-item">
                  <span className="label">Capture Difficulty:</span>
                  <span className="value">{pct > 70 ? 'Easy' : pct > 45 ? 'Medium' : 'Hard'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Catch Rate:</span>
                  <span className="value">{pct}%</span>
                </div>
                <div className="info-item">
                  <span className="label">Cost per try:</span>
                  <span className="value">{captureCost} coins (you have {currency})</span>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="btn-capture"
                onClick={handleCapture}
                disabled={loading || !canAfford}
              >
                {loading ? '⏳ Attempting...' : canAfford ? `🎯 Capture (${captureCost})` : 'Not enough coins'}
              </button>
              <button
                className="btn-flee"
                onClick={handleFlee}
                disabled={loading}
              >
                💨 Flee
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
                  disabled={loading || !canAfford}
                >
                  {canAfford ? `🎯 Try Again (${captureCost})` : 'Not enough coins'}
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
