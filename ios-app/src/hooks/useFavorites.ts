/**
 * useFavorites Hook
 * Manages favorite pet images with persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';

export interface FavoriteItem {
  url: string;
  type: 'dog' | 'cat';
  addedAt: string;
  breed?: string | null;
}

export interface UseFavoritesReturn {
  favorites: FavoriteItem[];
  isFavorited: (url: string) => boolean;
  addFavorite: (url: string, type: 'dog' | 'cat', breed?: string | null) => void;
  removeFavorite: (url: string) => void;
  toggleFavorite: (url: string, type: 'dog' | 'cat', breed?: string | null) => void;
  clearFavorites: () => void;
  favoriteCount: number;
}

export function useFavorites(): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      const savedFavorites = await storage.get<FavoriteItem[]>('favorites', []);
      setFavorites(savedFavorites);
      setIsLoaded(true);
    };

    loadFavorites();
  }, []);

  // Save favorites whenever they change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      storage.set('favorites', favorites);
    }
  }, [favorites, isLoaded]);

  const isFavorited = useCallback(
    (url: string): boolean => {
      return favorites.some((fav) => fav.url === url);
    },
    [favorites]
  );

  const addFavorite = useCallback(
    (url: string, type: 'dog' | 'cat', breed?: string | null) => {
      setFavorites((prev) => {
        // Don't add if already exists
        if (prev.some((fav) => fav.url === url)) {
          return prev;
        }

        return [
          ...prev,
          {
            url,
            type,
            breed,
            addedAt: new Date().toISOString(),
          },
        ];
      });
    },
    []
  );

  const removeFavorite = useCallback((url: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.url !== url));
  }, []);

  const toggleFavorite = useCallback(
    (url: string, type: 'dog' | 'cat', breed?: string | null) => {
      if (isFavorited(url)) {
        removeFavorite(url);
      } else {
        addFavorite(url, type, breed);
      }
    },
    [isFavorited, removeFavorite, addFavorite]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    isFavorited,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    favoriteCount: favorites.length,
  };
}

export default useFavorites;
