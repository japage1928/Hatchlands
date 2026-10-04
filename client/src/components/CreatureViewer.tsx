import * as React from 'react';
import { Creature } from '@hatchlands/shared';
import { getAnchorDisplayName } from '../utils/anchors';

interface CreatureViewerProps {
  creature: Creature;
}

/** Maps each anchor species to its PNG sprite in `public/sprites/`. */
const SPRITE_NAME_BY_ANCHOR: Record<Creature['primaryAnchor'], string> = {
  dragon: 'ember',
  serpent: 'tide',
  phoenix: 'bloom',
  griffin: 'gale',
  basilisk: 'stone',
  unicorn: 'frost',
  kraken: 'spark',
  chimera: 'venom',
  hydra: 'metal',
  sphinx: 'shadow',
  pegasus: 'lumen',
  manticore: 'beast',
  leviathan: 'mind',
  roc: 'spirit',
  behemoth: 'behemoth', // no sprite yet -> placeholder is shown
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '400px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(circle at 20% 20%, #1f3f6a 0%, #0f1d32 55%, #0a1224 100%)',
  borderRadius: '14px',
  overflow: 'hidden',
};

/**
 * Simple 2D sprite display. Shows the species PNG; if it is missing or fails
 * to load, a placeholder with the species initial is shown instead.
 */
export const CreatureViewer: React.FC<CreatureViewerProps> = ({ creature }) => {
  const spriteName = SPRITE_NAME_BY_ANCHOR[creature.primaryAnchor];
  const src = `${import.meta.env.BASE_URL}sprites/${spriteName}.png`;
  const label = getAnchorDisplayName(creature.primaryAnchor);

  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const failed = failedSrc === src;

  return (
    <div style={containerStyle}>
      {failed ? (
        <div
          role="img"
          aria-label={`${label} (no sprite yet)`}
          style={{
            width: '60%',
            aspectRatio: '1 / 1',
            maxHeight: '80%',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '2px dashed rgba(255, 255, 255, 0.35)',
            color: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem',
            fontWeight: 700,
          }}
        >
          {label.charAt(0).toUpperCase()}
        </div>
      ) : (
        <img
          src={src}
          alt={label}
          loading="lazy"
          onError={() => setFailedSrc(src)}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      )}
    </div>
  );
};
