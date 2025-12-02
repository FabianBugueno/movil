import { Injectable } from '@angular/core';
import { Api } from './api';
import { Db } from './db';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExerciseCacheService {
  private isPreloaded = false;
  private memoryMap: Map<number, any> = new Map();
  private memoryLoaded = false;
  private memoryList: any[] = [];
  // TTL in ms (default 12 hours)
  private readonly TTL_MS = 1000 * 60 * 60 * 12;

  constructor(private api: Api, private db: Db) {}

  /**
   * Preload exercises from remote API and save locally. Safe to call multiple times.
   */
  async preloadExercises(): Promise<void> {
    if (this.isPreloaded) return;
    try {
      console.time('ExerciseCache: preloadExercises');
      // First load whatever is in DB to memory (fast path for UI)
      const localList = await this.db.getAllExercises();
      if (Array.isArray(localList) && localList.length > 0) {
        this.loadMemoryFromList(localList);
      }

      // Now try to refresh from API in background if needed
      if (this.shouldRefresh()) {
        // don't await here so UI is not blocked
        this.refreshCache().catch(e => console.warn('ExerciseCache: background refresh failed', e));
      } else {
        // If no refresh needed but memory empty, try a quick fetch (but await so we have some data)
        if (!this.memoryLoaded) {
          try {
            const obs = this.api.obtenerEjerciciosInfo('4', 1000);
            const res: any = await firstValueFrom(obs);
            const list = Array.isArray(res) ? res : (res?.results ?? res?.data ?? []);
            if (Array.isArray(list) && list.length > 0) {
              await this.db.saveExercises(list);
              this.loadMemoryFromList(list);
            }
          } catch (e) {
            // ignore network failure, memory may still have DB data
          }
        }
      }
      this.isPreloaded = true;
      console.timeEnd('ExerciseCache: preloadExercises');
    } catch (e) {
      console.warn('ExerciseCache: preload failed, will keep using local cache if any.', e);
    }
  }

  async getAllCachedExercises(): Promise<any[]> {
    // Prefer in-memory list if loaded
    if (this.memoryLoaded) {
      return this.memoryList.slice();
    }
    const list = await this.db.getAllExercises();
    this.loadMemoryFromList(list);
    return this.memoryList.slice();
  }

  /**
   * Synchronous getter for UI paths that must not await I/O.
   * Returns an empty array if memory not yet loaded.
   */
  getAllCachedExercisesSync(): any[] {
    return this.memoryLoaded ? this.memoryList : [];
  }

  async getExercise(id: number | string): Promise<any | null> {
    // Try in-memory first
    if (this.memoryLoaded) {
      const m = this.memoryMap.get(Number(id));
      if (m) return m;
    }
    // Try local DB
    const local = await this.db.getExerciseById(id);
    if (local) {
      // ensure memory map has it
      if (this.memoryLoaded) this.memoryMap.set(Number(id), local);
      return local;
    }
    // Fallback to API
    try {
      const obs = this.api.obtenerEjercicioInfoPorId(id);
      const res: any = await firstValueFrom(obs);
      if (res && res.id) {
        if (this.memoryLoaded) this.memoryMap.set(Number(res.id), res);
        // Also persist to DB for future
        try { await this.db.saveExercises([res]); } catch(e) { /* ignore */ }
      }
      return res;
    } catch (e) {
      console.error('ExerciseCache: error fetching exercise from API', e);
      return null;
    }
  }

  /**
   * Force refresh from API and update local cache
   */
  async refreshCache(): Promise<void> {
    try {
      console.time('ExerciseCache: refreshCache');
      const obs = this.api.obtenerEjerciciosInfo('4', 1000);
      const res: any = await firstValueFrom(obs);
      const list = Array.isArray(res) ? res : (res?.results ?? res?.data ?? []);
      if (Array.isArray(list)) {
        await this.db.saveExercises(list);
        this.loadMemoryFromList(list);
      }
      this.isPreloaded = true;
      try { localStorage.setItem('exercises_cache_ts', String(Date.now())); } catch(e) {}
      console.timeEnd('ExerciseCache: refreshCache');
    } catch (e) {
      console.error('ExerciseCache: refresh failed', e);
      throw e;
    }
  }

  private loadMemoryFromList(list: any[]) {
    try {
      this.memoryMap.clear();
      this.memoryList = [];
      for (const item of list) {
        if (item && item.id != null) {
          this.memoryMap.set(Number(item.id), item);
          this.memoryList.push(item);
        }
      }
      this.memoryLoaded = true;
    } catch (e) {
      console.warn('ExerciseCache: failed loading memory map', e);
    }
  }

  shouldRefresh(): boolean {
    try {
      const ts = Number(localStorage.getItem('exercises_cache_ts') || '0');
      if (!ts) return true; // no timestamp => refresh
      return (Date.now() - ts) > this.TTL_MS;
    } catch (e) {
      return true;
    }
  }
}
