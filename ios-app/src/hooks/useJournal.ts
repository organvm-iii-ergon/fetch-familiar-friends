/**
 * useJournal Hook
 * Manages journal entries with persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';

export interface JournalEntry {
  date: string; // ISO date string (YYYY-MM-DD)
  content: string;
  updatedAt: string;
  imageUrl?: string;
  petType?: 'dog' | 'cat';
}

export interface UseJournalReturn {
  entries: Record<string, JournalEntry>;
  getEntry: (date: Date) => JournalEntry | null;
  saveEntry: (date: Date, content: string, imageUrl?: string, petType?: 'dog' | 'cat') => void;
  deleteEntry: (date: Date) => void;
  hasEntry: (date: Date) => boolean;
  entryCount: number;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function useJournal(): UseJournalReturn {
  const [entries, setEntries] = useState<Record<string, JournalEntry>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load entries on mount
  useEffect(() => {
    const loadEntries = async () => {
      const savedEntries = await storage.get<Record<string, JournalEntry>>(
        'journal',
        {}
      );
      setEntries(savedEntries);
      setIsLoaded(true);
    };

    loadEntries();
  }, []);

  // Save entries whenever they change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      storage.set('journal', entries);
    }
  }, [entries, isLoaded]);

  const getEntry = useCallback(
    (date: Date): JournalEntry | null => {
      const key = formatDateKey(date);
      return entries[key] || null;
    },
    [entries]
  );

  const saveEntry = useCallback(
    (
      date: Date,
      content: string,
      imageUrl?: string,
      petType?: 'dog' | 'cat'
    ) => {
      const key = formatDateKey(date);
      const trimmedContent = content.trim();

      if (!trimmedContent) {
        // If content is empty, delete the entry
        setEntries((prev) => {
          const newEntries = { ...prev };
          delete newEntries[key];
          return newEntries;
        });
        return;
      }

      setEntries((prev) => ({
        ...prev,
        [key]: {
          date: key,
          content: trimmedContent,
          updatedAt: new Date().toISOString(),
          imageUrl,
          petType,
        },
      }));
    },
    []
  );

  const deleteEntry = useCallback((date: Date) => {
    const key = formatDateKey(date);
    setEntries((prev) => {
      const newEntries = { ...prev };
      delete newEntries[key];
      return newEntries;
    });
  }, []);

  const hasEntry = useCallback(
    (date: Date): boolean => {
      const key = formatDateKey(date);
      return !!entries[key]?.content;
    },
    [entries]
  );

  return {
    entries,
    getEntry,
    saveEntry,
    deleteEntry,
    hasEntry,
    entryCount: Object.keys(entries).length,
  };
}

export default useJournal;
