import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Conflict } from '@/types';

const DB_NAME = 'DialecticalLensDB';
const DB_VERSION = 1;
const CONFLICT_STORE = 'conflicts';

interface MyDB extends DBSchema {
  [CONFLICT_STORE]: {
    key: number;
    value: Conflict;
    indexes: { 'createdAt': Date };
  };
}

let dbPromise: Promise<IDBPDatabase<MyDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CONFLICT_STORE)) {
            const store = db.createObjectStore(CONFLICT_STORE, {
              keyPath: 'id',
              autoIncrement: true,
            });
            store.createIndex('createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
};

export const addConflict = async (conflict: Omit<Conflict, 'id' | 'personas' | 'chatHistory' | 'synthesisReport'>): Promise<number> => {
  const db = await getDB();
  const fullConflict: Conflict = {
    ...conflict,
    createdAt: new Date()
  };
  return db.add(CONFLICT_STORE, fullConflict as any);
};

export const getConflict = async (id: number): Promise<Conflict | undefined> => {
  const db = await getDB();
  return db.get(CONFLICT_STORE, id);
};

export const getAllConflicts = async (): Promise<Conflict[]> => {
  const db = await getDB();
  return db.getAllFromIndex(CONFLICT_STORE, 'createdAt');
};

export const updateConflict = async (conflict: Conflict): Promise<number> => {
  const db = await getDB();
  if (!conflict.id) throw new Error("Conflict must have an id to be updated");
  return db.put(CONFLICT_STORE, conflict);
};