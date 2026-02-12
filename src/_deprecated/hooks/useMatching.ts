import { useState, useEffect, useCallback } from 'react';
import { MatchScore, MatchingCriteria } from '../types';
import {
  getMatchingEvents,
  getMatchingSparringPartners,
  getRecommendedGyms,
} from '../services/matching';

interface UseMatchingOptions {
  fighterId: string;
  criteria?: Partial<MatchingCriteria>;
  limit?: number;
  autoFetch?: boolean;
}

interface UseMatchingResult {
  events: MatchScore[];
  partners: MatchScore[];
  gyms: MatchScore[];
  loading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
  refreshPartners: () => Promise<void>;
  refreshGyms: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export function useMatching({
  fighterId,
  criteria,
  limit = 10,
  autoFetch = true,
}: UseMatchingOptions): UseMatchingResult {
  const [events, setEvents] = useState<MatchScore[]>([]);
  const [partners, setPartners] = useState<MatchScore[]>([]);
  const [gyms, setGyms] = useState<MatchScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshEvents = useCallback(async () => {
    if (!fighterId) return;
    try {
      const results = await getMatchingEvents(fighterId, criteria, limit);
      setEvents(results);
    } catch (err) {
      console.error('Error fetching matching events:', err);
      setError('Failed to load event recommendations');
    }
  }, [fighterId, criteria, limit]);

  const refreshPartners = useCallback(async () => {
    if (!fighterId) return;
    try {
      const results = await getMatchingSparringPartners(fighterId, criteria, limit);
      setPartners(results);
    } catch (err) {
      console.error('Error fetching matching partners:', err);
      setError('Failed to load partner recommendations');
    }
  }, [fighterId, criteria, limit]);

  const refreshGyms = useCallback(async () => {
    if (!fighterId) return;
    try {
      const results = await getRecommendedGyms(fighterId, criteria, limit);
      setGyms(results);
    } catch (err) {
      console.error('Error fetching matching gyms:', err);
      setError('Failed to load gym recommendations');
    }
  }, [fighterId, criteria, limit]);

  const refreshAll = useCallback(async () => {
    if (!fighterId) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all([refreshEvents(), refreshPartners(), refreshGyms()]);
    } catch (err) {
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [refreshEvents, refreshPartners, refreshGyms, fighterId]);

  useEffect(() => {
    if (autoFetch && fighterId) {
      refreshAll();
    }
  }, [fighterId, autoFetch]);

  return {
    events,
    partners,
    gyms,
    loading,
    error,
    refreshEvents,
    refreshPartners,
    refreshGyms,
    refreshAll,
  };
}