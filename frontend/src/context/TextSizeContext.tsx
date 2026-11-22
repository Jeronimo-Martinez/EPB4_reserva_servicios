import React, { createContext, useContext, useState, useEffect } from 'react';

export type TextZoomLevel = 100 | 125 | 150 | 175 | 200;

interface TextSizeContextType {
  zoom: TextZoomLevel;
  setZoom: (level: TextZoomLevel) => void;
  increaseZoom: () => void;
  decreaseZoom: () => void;
  resetZoom: () => void;
}

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined);

const ZOOM_LEVELS: TextZoomLevel[] = [100, 125, 150, 175, 200];

export function TextSizeProvider({ children }: { children: React.ReactNode }) {
  const [zoom, setZoomState] = useState<TextZoomLevel>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('promarket_text_zoom');
      if (saved && ZOOM_LEVELS.includes(Number(saved) as TextZoomLevel)) {
        return Number(saved) as TextZoomLevel;
      }
    }
    return 100;
  });

  const setZoom = (level: TextZoomLevel) => {
    if (ZOOM_LEVELS.includes(level)) {
      setZoomState(level);
    }
  };

  const increaseZoom = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const decreaseZoom = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  const resetZoom = () => {
    setZoom(100);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-text-zoom', String(zoom));
    localStorage.setItem('promarket_text_zoom', String(zoom));
  }, [zoom]);

  return (
    <TextSizeContext.Provider
      value={{
        zoom,
        setZoom,
        increaseZoom,
        decreaseZoom,
        resetZoom,
      }}
    >
      {children}
    </TextSizeContext.Provider>
  );
}

export function useTextSize(): TextSizeContextType {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error('useTextSize must be used within a TextSizeProvider');
  }
  return context;
}
