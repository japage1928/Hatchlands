# Mobile UI Components for Hatchlands

## Touch-Optimized Components

### Bottom Navigation
```tsx
// src/components/BottomNav.tsx
import React from 'react';
import './BottomNav.css';

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: '🗺️', label: 'World', path: '/world' },
  { icon: '🎒', label: 'Creatures', path: '/inventory' },
  { icon: '🏪', label: 'Market', path: '/market' },
  { icon: '👤', label: 'Profile', path: '/profile' },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button key={item.path} className="nav-item">
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
```

### Swipeable Card
```tsx
// src/components/SwipeCard.tsx
import React, { useRef, useState } from 'react';
import './SwipeCard.css';

interface SwipeCardProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  children: React.ReactNode;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onTap,
  children,
}) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX - startX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;
    if (Math.abs(currentX) < 10) {
      // Tap
      onTap?.();
    } else if (currentX > threshold) {
      // Swipe right
      onSwipeRight?.();
    } else if (currentX < -threshold) {
      // Swipe left
      onSwipeLeft?.();
    }

    setCurrentX(0);
  };

  return (
    <div
      ref={cardRef}
      className="swipe-card"
      style={{ transform: `translateX(${currentX}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};
```

### Pull to Refresh
```tsx
// src/components/PullToRefresh.tsx
import React, { useState, useRef } from 'react';
import './PullToRefresh.css';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, 150));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 80 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      className="pull-to-refresh"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="refresh-indicator"
        style={{ height: `${pullDistance}px` }}
      >
        {isRefreshing ? '⏳ Refreshing...' : pullDistance > 80 ? '👆 Release to refresh' : '👇 Pull down'}
      </div>
      {children}
    </div>
  );
};
```

### Haptic Feedback
```tsx
// src/utils/haptics.ts
export const haptics = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },
  
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  },
};

// Usage in components:
// import { haptics } from '@/utils/haptics';
// 
// <button onClick={() => {
//   haptics.light();
//   // perform action
// }}>
//   Tap me
// </button>
```

### Touch Gesture Handler
```tsx
// src/hooks/useGestures.ts
import { useRef, useCallback } from 'react';

interface GestureHandlers {
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
}

export function useGestures(handlers: GestureHandlers) {
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const lastTap = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Long press detection
    longPressTimer.current = setTimeout(() => {
      handlers.onLongPress?.();
    }, 500);
  }, [handlers]);

  const handleTouchMove = useCallback(() => {
    // Cancel long press if finger moves
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const deltaTime = Date.now() - touchStart.current.time;

    const threshold = 50;
    const swipeSpeed = 300;

    // Swipe detection
    if (deltaTime < swipeSpeed) {
      if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
        return;
      }
      
      if (Math.abs(deltaY) > threshold && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
        return;
      }
    }

    // Tap/Double tap detection
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        handlers.onDoubleTap?.();
        lastTap.current = 0;
      } else {
        handlers.onTap?.();
        lastTap.current = now;
      }
    }
  }, [handlers]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}
```

## CSS Styles for Components

```css
/* src/components/BottomNav.css */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: env(safe-area-inset-bottom, 0.5rem) 0 0.5rem;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  border: none;
  background: none;
  color: #fff;
  padding: 0.75rem 1rem;
  cursor: pointer;
  touch-action: manipulation;
  min-width: 60px;
  transition: transform 0.2s;
}

.nav-item:active {
  transform: scale(0.9);
}

.nav-icon {
  font-size: 1.5rem;
}

.nav-label {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* src/components/SwipeCard.css */
.swipe-card {
  touch-action: pan-y;
  transition: transform 0.3s ease-out;
  will-change: transform;
}

/* src/components/PullToRefresh.css */
.pull-to-refresh {
  position: relative;
  overflow: hidden;
}

.refresh-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: height 0.3s;
  overflow: hidden;
  color: #fff;
  font-size: 0.9rem;
}
```

## Usage Example

```tsx
// Example: Creature Card List
import { SwipeCard } from './components/SwipeCard';
import { PullToRefresh } from './components/PullToRefresh';
import { BottomNav } from './components/BottomNav';
import { haptics } from './utils/haptics';

function CreatureList() {
  const handleRefresh = async () => {
    haptics.light();
    await fetchCreatures();
    haptics.success();
  };

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="creature-list">
          {creatures.map(creature => (
            <SwipeCard
              key={creature.id}
              onSwipeLeft={() => {
                haptics.medium();
                deleteCreature(creature.id);
              }}
              onSwipeRight={() => {
                haptics.medium();
                favoriteCreature(creature.id);
              }}
              onTap={() => {
                haptics.light();
                viewCreature(creature.id);
              }}
            >
              <CreatureCard creature={creature} />
            </SwipeCard>
          ))}
        </div>
      </PullToRefresh>
      
      <BottomNav />
    </>
  );
}
```

These components provide a native-feeling mobile experience with smooth touch interactions!
