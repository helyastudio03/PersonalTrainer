import { useCallback, useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type {
  AppData,
  Program,
  RunSession,
  StrengthSession,
} from '../types';
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

  const deleteStrengthSession = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      strengthSessions: d.strengthSessions.filter((s) => s.id !== id),
    }));
  }, []);

  const addRunSession = useCallback((session: Omit<RunSession, 'id'>) => {
    setData((d) => ({
      ...d,
      runSessions: [...d.runSessions, { ...session, id: uuid() }],
    }));
  }, []);

  const deleteRunSession = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      runSessions: d.runSessions.filter((s) => s.id !== id),
    }));
  }, []);

  return {
    data,
    addProgram,
    updateProgram,
    deleteProgram,
    addStrengthSession,
    deleteStrengthSession,
    addRunSession,
    deleteRunSession,
  };
}

export type UseAppData = ReturnType<typeof useAppData>;
