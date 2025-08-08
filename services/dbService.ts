
import type { DBSchema, IDBPDatabase } from 'idb';
import type { DebateSession } from '../types';

// These are globals loaded from index.html
declare var idb: {
  openDB: <T extends DBSchema>(name: string, version?: number, options?: any) => Promise<IDBPDatabase<T>>;
};

const DB_NAME = 'ConvolutionDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

interface ConvolutionDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: DebateSession;
    indexes: { 'createdAt': string };
  };
}

let dbPromise: Promise<IDBPDatabase<ConvolutionDB>> | null = null;

const getDb = (): Promise<IDBPDatabase<ConvolutionDB>> => {
  if (!dbPromise) {
    dbPromise = idb.openDB<ConvolutionDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      },
    });
  }
  return dbPromise;
};

export const addSession = async (session: DebateSession): Promise<void> => {
  const db = await getDb();
  await db.put(STORE_NAME, session);
};

export const getAllSessions = async (): Promise<DebateSession[]> => {
  const db = await getDb();
  const sessions = await db.getAllFromIndex(STORE_NAME, 'createdAt');
  return sessions.reverse(); // Show newest first
};

export const getSession = async (id: string): Promise<DebateSession | undefined> => {
    const db = await getDb();
    return db.get(STORE_NAME, id);
};

export const deleteSession = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
};
