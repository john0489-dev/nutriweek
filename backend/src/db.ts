import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  FavoriteRecord,
  MenuHistoryRecord,
  ProfileRecord,
  UserRecord,
} from "./types/domain";

/**
 * Persistência simples em arquivo JSON. Suficiente para desenvolvimento e uso
 * pessoal (poucos usuários, sem concorrência pesada). Para produção real,
 * trocar por um banco de verdade (Postgres/SQLite) mantendo os mesmos
 * métodos exportados aqui — o resto do app não precisa mudar.
 */

interface DbShape {
  users: UserRecord[];
  profiles: ProfileRecord[];
  menuHistory: MenuHistoryRecord[];
  favorites: FavoriteRecord[];
}

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function emptyDb(): DbShape {
  return { users: [], profiles: [], menuHistory: [], favorites: [] };
}

function readDb(): DbShape {
  if (!fs.existsSync(DB_PATH)) {
    return emptyDb();
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    if (!raw.trim()) return emptyDb();
    return { ...emptyDb(), ...JSON.parse(raw) };
  } catch (err) {
    console.error("[db] falha ao ler db.json, iniciando vazio:", err);
    return emptyDb();
  }
}

function writeDb(db: DbShape): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function newId(): string {
  return crypto.randomUUID();
}

export const db = {
  /* -------------------------------- users -------------------------------- */
  findUserByEmail(email: string): UserRecord | undefined {
    return readDb().users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  },
  findUserById(id: string): UserRecord | undefined {
    return readDb().users.find((u) => u.id === id);
  },
  createUser(email: string, passwordHash: string): UserRecord {
    const database = readDb();
    const user: UserRecord = {
      id: newId(),
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    database.users.push(user);
    writeDb(database);
    return user;
  },

  /* ------------------------------- profiles ------------------------------- */
  listProfiles(userId: string): ProfileRecord[] {
    return readDb().profiles.filter((p) => p.userId === userId);
  },
  findProfile(userId: string, profileId: string): ProfileRecord | undefined {
    return readDb().profiles.find(
      (p) => p.userId === userId && p.id === profileId
    );
  },
  createProfile(
    userId: string,
    data: Omit<ProfileRecord, "id" | "userId" | "createdAt">
  ): ProfileRecord {
    const database = readDb();
    const isFirstProfile = !database.profiles.some((p) => p.userId === userId);
    const profile: ProfileRecord = {
      ...data,
      id: newId(),
      userId,
      isPrimary: data.isPrimary || isFirstProfile,
      createdAt: new Date().toISOString(),
    };
    database.profiles.push(profile);
    writeDb(database);
    return profile;
  },
  updateProfile(
    userId: string,
    profileId: string,
    patch: Partial<Omit<ProfileRecord, "id" | "userId" | "createdAt">>
  ): ProfileRecord | undefined {
    const database = readDb();
    const idx = database.profiles.findIndex(
      (p) => p.userId === userId && p.id === profileId
    );
    if (idx === -1) return undefined;
    database.profiles[idx] = { ...database.profiles[idx], ...patch };
    writeDb(database);
    return database.profiles[idx];
  },
  deleteProfile(userId: string, profileId: string): boolean {
    const database = readDb();
    const before = database.profiles.length;
    database.profiles = database.profiles.filter(
      (p) => !(p.userId === userId && p.id === profileId)
    );
    writeDb(database);
    return database.profiles.length < before;
  },

  /* ----------------------------- menu history ----------------------------- */
  addMenuHistory(
    entry: Omit<MenuHistoryRecord, "id" | "createdAt">
  ): MenuHistoryRecord {
    const database = readDb();
    const record: MenuHistoryRecord = {
      ...entry,
      id: newId(),
      createdAt: new Date().toISOString(),
    };
    database.menuHistory.unshift(record);
    // mantém só os 30 mais recentes por usuário pra não crescer sem limite
    const forUser = database.menuHistory.filter(
      (h) => h.userId === entry.userId
    );
    if (forUser.length > 30) {
      const toDrop = new Set(forUser.slice(30).map((h) => h.id));
      database.menuHistory = database.menuHistory.filter(
        (h) => !toDrop.has(h.id)
      );
    }
    writeDb(database);
    return record;
  },
  listMenuHistory(userId: string): MenuHistoryRecord[] {
    return readDb().menuHistory.filter((h) => h.userId === userId);
  },
  findMenuHistory(
    userId: string,
    historyId: string
  ): MenuHistoryRecord | undefined {
    return readDb().menuHistory.find(
      (h) => h.userId === userId && h.id === historyId
    );
  },
  updateMenuHistory(
    userId: string,
    historyId: string,
    response: MenuHistoryRecord["response"]
  ): MenuHistoryRecord | undefined {
    const database = readDb();
    const idx = database.menuHistory.findIndex(
      (h) => h.userId === userId && h.id === historyId
    );
    if (idx === -1) return undefined;
    database.menuHistory[idx] = { ...database.menuHistory[idx], response };
    writeDb(database);
    return database.menuHistory[idx];
  },

  /* -------------------------------- favorites ------------------------------- */
  listFavorites(userId: string): FavoriteRecord[] {
    return readDb().favorites.filter((f) => f.userId === userId);
  },
  addFavorite(
    userId: string,
    meal: FavoriteRecord["meal"]
  ): FavoriteRecord {
    const database = readDb();
    const record: FavoriteRecord = {
      id: newId(),
      userId,
      meal,
      createdAt: new Date().toISOString(),
    };
    database.favorites.unshift(record);
    writeDb(database);
    return record;
  },
  deleteFavorite(userId: string, favoriteId: string): boolean {
    const database = readDb();
    const before = database.favorites.length;
    database.favorites = database.favorites.filter(
      (f) => !(f.userId === userId && f.id === favoriteId)
    );
    writeDb(database);
    return database.favorites.length < before;
  },
};
