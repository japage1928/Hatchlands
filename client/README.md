# Hatchlands Client

React + Three.js client for rendering and interacting with the Hatchlands world.

## Features

- **3D Creature Rendering**: Deterministic Three.js rendering from creature parameters
- **Real-time World State**: Live updates of nearby spawns and market
- **Interactive Encounters**: Capture mechanics with visual feedback
- **Breeding Interface**: Lineage visualization and offspring prediction
- **Marketplace**: Browse, list, and purchase creatures

## Tech Stack

- **React 18**: UI framework
- **Three.js**: 3D rendering engine
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for R3F
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety
- **Axios**: HTTP client
- **Zustand**: State management

## Project Structure

```
client/
├── src/
│   ├── engine/
│   │   └── renderer.ts       # 3D creature renderer
│   ├── components/
│   │   └── CreatureViewer.tsx  # 3D viewer component
│   ├── api/
│   │   └── client.ts         # API client
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── index.html
├── vite.config.ts
└── package.json
```

## Development

Install dependencies:
```bash
npm install
```

Start development server:
```bash
npm run dev
```

The client will be available at `http://localhost:5173`

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Environment Variables

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Creature Rendering System

The rendering engine (`src/engine/renderer.ts`) reconstructs creatures deterministically from their appearance parameters:

1. **Body Construction**: Base geometry from anchor species
2. **Part Assembly**: Limbs, wings, tails added procedurally
3. **Material Application**: Colors from anchor palette
4. **Procedural Variation**: Fine-tuning via procedural parameters

### Example Usage

```typescript
import { renderCreature } from './engine/renderer';
import * as THREE from 'three';

const scene = new THREE.Scene();
const creature = { /* creature data */ };

const renderer = renderCreature(scene, creature);

// Later cleanup
renderer.dispose();
```

## Component Architecture

### CreatureViewer
Displays a 3D view of a creature with orbit controls.

```tsx
<CreatureViewer creature={myCreature} />
```

### Features to Implement

The current client is a foundation. Here are suggested next implementations:

1. **World Map**: Interactive map showing nearby spawns
2. **Inventory View**: Grid of owned creatures
3. **Breeding UI**: Parent selection and lineage tree
4. **Market Browser**: Filterable listing grid
5. **Encounter Screen**: Capture mini-game
6. **Profile Page**: Player stats and achievements

## State Management

Consider using Zustand for global state:

```typescript
// stores/worldStore.ts
import create from 'zustand';

interface WorldState {
  player: Player | null;
  nearbyCreatures: Spawn[];
  loadWorld: () => Promise<void>;
}

export const useWorldStore = create<WorldState>((set) => ({
  player: null,
  nearbyCreatures: [],
  loadWorld: async () => {
    const data = await api.getWorld();
    set({ player: data.player, nearbyCreatures: data.nearbyCreatures });
  },
}));
```

## Styling Approach

Current: CSS with gradient background

Recommendations:
- **Tailwind CSS**: Utility-first styling
- **Styled Components**: Component-scoped styles
- **Material-UI**: Pre-built components

## Performance Optimization

1. **Lazy Loading**: Load routes on demand
2. **Memoization**: Cache expensive calculations
3. **Three.js Optimization**:
   - Reuse geometries
   - Instance meshes for repeated parts
   - LOD (Level of Detail) for distant creatures
   - Frustum culling

## Testing

Add testing with:
- **Vitest**: Unit tests
- **React Testing Library**: Component tests
- **Playwright**: E2E tests

## Deployment

### Vercel
```bash
npm run build
vercel deploy
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions

Three.js requires WebGL support.

## Accessibility

Ensure implementation includes:
- Keyboard navigation
- Screen reader labels
- Color contrast compliance
- Focus indicators
- Alternative text for images

## Future Enhancements

1. **PWA Support**: Service worker for offline functionality
2. **WebSocket**: Real-time world updates
3. **AR Mode**: View creatures in real world (WebXR)
4. **Social Features**: Friend lists, trading
5. **Achievements**: Unlock system
6. **Leaderboards**: Top breeders, traders
