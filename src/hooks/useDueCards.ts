import { useState, useEffect, useCallback } from 'react';
import { getCardsDueCount, getAllCardsDueCount } from '../db/queries/cards';

export function useDueCards(topicId?: number) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const c = topicId
        ? await getCardsDueCount(topicId)
        : await getAllCardsDueCount();
      setCount(c);
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { count, loading, refresh };
}
