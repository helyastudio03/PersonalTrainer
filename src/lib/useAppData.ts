import { useCallback, useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { AppData, Program, StrengthSession } from '../types';
import { loadData, saveData } from './storage';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addProgram = useCallback((program: Omit<Program, 'id' | 'createdAt'>) => {
    setData((d) => ({
      ...d,
      programs: [
        ...d.programs,
        { ...program, id: uuid(), createdAt: new Date().toISOString() },
      ],
    }));
  }, []);

  const updateProgram = useCallback((program: Program) => {
    setData((d) => ({
      ...d,
      programs: d.programs.map((p) => (p.id === program.id ? program : p)),
    }));
  }, []);

  const deleteProgram = useCallback((id: string) => {
    setData((d) => ({ ...d, programs: d.programs.filter((p) => p.id !== id) }));
  }, []);

  const addStrengthSession = useCallback((session: Omit<StrengthSession, 'id'>) => {
    setData((d) => ({
      ...d,
      strengthSessions: [...d.strengthSessions, { ...session, id: uuid() }],
    }));
  }, []);

  const updateStrengthSession = useCallback((session: StrengthSession) => {
    setData((d) => ({
      ...d,
      strengthSessions: d.strengthSessions.map((s) => (s.id === session.id ? session : s)),
    }));
  }, []);

  const deleteStrengthSession = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      strengthSessions: d.strengthSessions.filter((s) => s.id !== id),
    }));
  }, []);

  return {
    data,
    addProgram,
    updateProgram,
    deleteProgram,
    addStrengthSession,
    updateStrengthSession,
    deleteStrengthSession,
  };
}

export type UseAppData = ReturnType<typeof useAppData>;
