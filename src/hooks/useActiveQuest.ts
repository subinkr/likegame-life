import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Quest {
  id: string;
  title: string;
  description: string;
  status: string;
  creatorId: string;
  acceptedBy?: string;
  chatRoomId?: string;
}

export function useActiveQuest() {
  const { user } = useAuth();
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [hasActiveQuest, setHasActiveQuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActiveQuest();
    } else {
      setActiveQuest(null);
      setHasActiveQuest(false);
      setLoading(false);
    }
  }, [user]);

  const fetchActiveQuest = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quests/active');
      
      if (response.ok) {
        const data = await response.json();
        if (data.quest) {
          setActiveQuest(data.quest);
          setHasActiveQuest(true);
        } else {
          setActiveQuest(null);
          setHasActiveQuest(false);
        }
      } else {
        setActiveQuest(null);
        setHasActiveQuest(false);
      }
    } catch (error) {
      console.error('활성 퀘스트 조회 실패:', error);
      setActiveQuest(null);
      setHasActiveQuest(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    activeQuest,
    hasActiveQuest,
    loading,
    refetch: fetchActiveQuest
  };
} 