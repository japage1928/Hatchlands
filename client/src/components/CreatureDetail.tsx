import * as React from 'react';
import { Creature } from '@hatchlands/shared';
import { CreatureViewer } from './CreatureViewer';
import { CreatureStats } from './CreatureStats';
import './styles/CreatureDetail.css';

interface CreatureDetailProps {
  creature: Creature;
  onClose?: () => void;
  onSelectAction?: (action: 'breed' | 'release' | 'nickname') => void;
}

export const CreatureDetail: React.FC<CreatureDetailProps> = ({ creature, onClose, onSelectAction }) => {
  const [nicknameEdit, setNicknameEdit] = React.useState<string>(creature.nickname || '');
  const [isEditing, setIsEditing] = React.useState(false);

  const handleSaveNickname = () => {
    // TODO: Call API to save nickname
    setIsEditing(false);
  };

  return (
    <div className="creature-detail">
      <div className="detail-header">
        <h2>{creature.nickname || creature.primaryAnchor}</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <div className="detail-container">
        {/* Main viewer and stats */}
        <div className="detail-main">
          <div className="viewer-section">
            <CreatureViewer creature={creature} />
          </div>

          <CreatureStats creature={creature} />
        </div>

        {/* Sidebar with actions and details */}
        <div className="detail-sidebar">
          {/* Nickname editor */}
          <div className="nickname-section">
            <label>Nickname</label>
            {isEditing ? (
              <div className="nickname-edit">
                <input
                  type="text"
                  value={nicknameEdit}
                  onChange={(e) => setNicknameEdit(e.target.value)}
                  placeholder={creature.primaryAnchor}
                  maxLength={20}
                />
                <button onClick={handleSaveNickname} className="btn-small">Save</button>
                <button onClick={() => setIsEditing(false)} className="btn-small secondary">Cancel</button>
              </div>
            ) : (
              <div className="nickname-display">
                <p className="current-nickname">{creature.nickname || creature.primaryAnchor}</p>
                <button onClick={() => setIsEditing(true)} className="btn-small">Edit</button>
              </div>
            )}
          </div>

          {/* Lineage */}
          {creature.lineageHistory && creature.lineageHistory.length > 0 && (
            <div className="lineage-section">
              <h3>📜 Lineage</h3>
              <div className="lineage-chain">
                {creature.lineageHistory.slice(0, 3).map((node, idx) => (
                  <div key={idx} className="lineage-node">
                    <span className="generation">Gen {node.generation}</span>
                    {node.parentA && node.parentB ? (
                      <span className="parents">
                        {node.parentA.slice(0, 6)} × {node.parentB.slice(0, 6)}
                      </span>
                    ) : (
                      <span className="parents">Wild Caught</span>
                    )}
                    <span className="timestamp">
                      {new Date(node.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Species info */}
          <div className="species-section">
            <h3>🧬 Species</h3>
            <div className="species-info">
              <div className="species-item">
                <span className="label">Primary:</span>
                <span className="value">{creature.primaryAnchor}</span>
              </div>
              {creature.secondaryAnchor && (
                <div className="species-item">
                  <span className="label">Secondary:</span>
                  <span className="value">{creature.secondaryAnchor}</span>
                </div>
              )}
              <div className="species-item">
                <span className="label">Status:</span>
                <span className={`value status-${creature.status}`}>{creature.status}</span>
              </div>
              {creature.capturedAt && (
                <div className="species-item">
                  <span className="label">Caught:</span>
                  <span className="value">{new Date(creature.capturedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="actions-section">
            <h3>Actions</h3>
            <div className="action-buttons">
              <button 
                className="action-btn breed"
                onClick={() => onSelectAction?.('breed')}
              >
                🥚 Breed
              </button>
              <button 
                className="action-btn nickname"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Rename
              </button>
              <button 
                className="action-btn release"
                onClick={() => onSelectAction?.('release')}
              >
                🚀 Release
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
