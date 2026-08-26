import { Pool } from "pg";
import crypto from "crypto";
import type {
  FavoriteRecord,
  MenuHistoryRecord,
  ProfileRecord,
  UserRecord,
} from "./types/domain";

/**
 * Persistência em Postgres. Mantém os mesmos métodos exportados que a versão
 * anterior (baseada em JSON), agora todos assíncronos — o resto do app só
 * precisou trocar chamadas `db.metodo(...)` por `await db.metodo(...)`.
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Muitos provedores gerenciados (Render, Railway, etc.) exigem SSL mas usam
  // certificado auto-assinado — desabilita a validação estrita nesse caso.
  ssl:
    process.env.DATABASE_URL && process.env.PGSSL !== "disable"
      ? { rejectUnauthorized: false }
      : undefined,
});

function newId(): string {
  return crypto.randomUUID();
}

let schemaReady: Promise<void> | null = null;

/** Cria as tabelas se ainda não existirem. Idempotente — seguro rodar a cada start. */
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        goal TEXT NOT NULL,
        restrictions JSONB NOT NULL DEFAULT '[]',
        allergies JSONB NOT NULL DEFAULT '[]',
        disliked_foods JSONB NOT NULL DEFAULT '[]',
        household_size INTEGER NOT NULL DEFAULT 1,
        daily_calorie_target INTEGER,
        weekly_budget_brl DOUBLE PRECISION,
        is_primary BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

      CREATE TABLE IF NOT EXISTS menu_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        profile_id TEXT NOT NULL,
        profile_name TEXT NOT NULL,
        response JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_menu_history_user_id ON menu_history(user_id);

      CREATE TABLE IF NOT EXISTS favorites (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        meal JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
    `).then(() => undefined);
  }
  return schemaReady;
}

async function ready(): Promise<void> {
  await ensureSchema();
}

/* ------------------------------ row mappers ------------------------------ */

function rowToUser(row: any): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at.toISOString(),
  };
}

function rowToProfile(row: any): ProfileRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    goal: row.goal,
    restrictions: row.restrictions,
    allergies: row.allergies,
    dislikedFoods: row.disliked_foods,
    householdSize: row.household_size,
    dailyCalorieTarget: row.daily_calorie_target ?? undefined,
    weeklyBudgetBRL: row.weekly_budget_brl ?? undefined,
    isPrimary: row.is_primary,
    createdAt: row.created_at.toISOString(),
  };
}

function rowToMenuHistory(row: any): MenuHistoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    profileName: row.profile_name,
    response: row.response,
    createdAt: row.created_at.toISOString(),
  };
}

function rowToFavorite(row: any): FavoriteRecord {
  return {
    id: row.id,
    userId: row.user_id,
    meal: row.meal,
    createdAt: row.created_at.toISOString(),
  };
}

export const db = {
  /* -------------------------------- users -------------------------------- */
  async findUserByEmail(email: string): Promise<UserRecord | undefined> {
    await ready();
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE lower(email) = lower($1)",
      [email]
    );
    return rows[0] ? rowToUser(rows[0]) : undefined;
  },
  async findUserById(id: string): Promise<UserRecord | undefined> {
    await ready();
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] ? rowToUser(rows[0]) : undefined;
  },
  async createUser(email: string, passwordHash: string): Promise<UserRecord> {
    await ready();
    const id = newId();
    const { rows } = await pool.query(
      `INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING *`,
      [id, email, passwordHash]
    );
    return rowToUser(rows[0]);
  },

  /* ------------------------------- profiles ------------------------------- */
  async listProfiles(userId: string): Promise<ProfileRecord[]> {
    await ready();
    const { rows } = await pool.query(
      "SELECT * FROM profiles WHERE user_id = $1 ORDER BY created_at ASC",
      [userId]
    );
    return rows.map(rowToProfile);
  },
  async findProfile(
    userId: string,
    profileId: string
  ): Promise<ProfileRecord | undefined> {
    await ready();
    const { rows } = await pool.query(
      "SELECT * FROM profiles WHERE user_id = $1 AND id = $2",
      [userId, profileId]
    );
    return rows[0] ? rowToProfile(rows[0]) : undefined;
  },
  async createProfile(
    userId: string,
    data: Omit<ProfileRecord, "id" | "userId" | "createdAt">
  ): Promise<ProfileRecord> {
    await ready();
    const { rows: existing } = await pool.query(
      "SELECT 1 FROM profiles WHERE user_id = $1 LIMIT 1",
      [userId]
    );
    const isFirstProfile = existing.length === 0;
    const id = newId();
    const { rows } = await pool.query(
      `INSERT INTO profiles
        (id, user_id, name, goal, restrictions, allergies, disliked_foods,
         household_size, daily_calorie_target, weekly_budget_brl, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        userId,
        data.name,
        data.goal,
        JSON.stringify(data.restrictions ?? []),
        JSON.stringify(data.allergies ?? []),
        JSON.stringify(data.dislikedFoods ?? []),
        data.householdSize,
        data.dailyCalorieTarget ?? null,
        data.weeklyBudgetBRL ?? null,
        data.isPrimary || isFirstProfile,
      ]
    );
    return rowToProfile(rows[0]);
  },
  async updateProfile(
    userId: string,
    profileId: string,
    patch: Partial<Omit<ProfileRecord, "id" | "userId" | "createdAt">>
  ): Promise<ProfileRecord | undefined> {
    await ready();
    const current = await this.findProfile(userId, profileId);
    if (!current) return undefined;
    const merged = { ...current, ...patch };
    const { rows } = await pool.query(
      `UPDATE profiles SET
        name = $3, goal = $4, restrictions = $5, allergies = $6,
        disliked_foods = $7, household_size = $8, daily_calorie_target = $9,
        weekly_budget_brl = $10, is_primary = $11
       WHERE user_id = $1 AND id = $2
       RETURNING *`,
      [
        userId,
        profileId,
        merged.name,
        merged.goal,
        JSON.stringify(merged.restrictions ?? []),
        JSON.stringify(merged.allergies ?? []),
        JSON.stringify(merged.dislikedFoods ?? []),
        merged.householdSize,
        merged.dailyCalorieTarget ?? null,
        merged.weeklyBudgetBRL ?? null,
        merged.isPrimary,
      ]
    );
    return rows[0] ? rowToProfile(rows[0]) : undefined;
  },
  async deleteProfile(userId: string, profileId: string): Promise<boolean> {
    await ready();
    const { rowCount } = await pool.query(
      "DELETE FROM profiles WHERE user_id = $1 AND id = $2",
      [userId, profileId]
    );
    return (rowCount ?? 0) > 0;
  },

  /* ----------------------------- menu history ----------------------------- */
  async addMenuHistory(
    entry: Omit<MenuHistoryRecord, "id" | "createdAt">
  ): Promise<MenuHistoryRecord> {
    await ready();
    const id = newId();
    const { rows } = await pool.query(
      `INSERT INTO menu_history (id, user_id, profile_id, profile_name, response)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        id,
        entry.userId,
        entry.profileId,
        entry.profileName,
        JSON.stringify(entry.response),
      ]
    );
    // mantém só os 30 mais recentes por usuário pra não crescer sem limite
    await pool.query(
      `DELETE FROM menu_history
       WHERE user_id = $1 AND id NOT IN (
         SELECT id FROM menu_history WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 30
       )`,
      [entry.userId]
    );
    return rowToMenuHistory(rows[0]);
  },
  async listMenuHistory(userId: string): Promise<MenuHistoryRecord[]> {
    await ready();
    const { rows } = await pool.query(
      "SELECT * FROM menu_history WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return rows.map(rowToMenuHistory);
  },
  async findMenuHistory(
    userId: string,
    historyId: string
  ): Promise<MenuHistoryRecord | undefined> {
    await ready();
    const { rows } = await pool.query(
      "SELECT * FROM menu_history WHERE user_id = $1 AND id = $2",
      [userId, historyId]
    );
    return rows[0] ? rowToMenuHistory(rows[0]) : undefined;
  },
  async updateMenuHistory(
    userId: string,
    historyId: string,
    response: MenuHistoryRecord["response"]
  ): Promise<MenuHistoryRecord | undefined> {
    await ready();
    const { rows } = await pool.query(
      `UPDATE menu_history SET response = $3
       WHERE user_id = $1 AND id = $2
       RETURNING *`,
      [userId, historyId, JSON.stringify(response)]
    );
    return rows[0] ? rowToMenuHistory(rows[0]) : undefined;
  },

  /* -------------------------------- favorites ------------------------------- */
  async listFavorites(userId: string): Promise<FavoriteRecord[]> {
    await ready();
    const { rows } = await pool.query(
      "SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return rows.map(rowToFavorite);
  },
  async addFavorite(
    userId: string,
    meal: FavoriteRecord["meal"]
  ): Promise<FavoriteRecord> {
    await ready();
    const id = newId();
    const { rows } = await pool.query(
      `INSERT INTO favorites (id, user_id, meal) VALUES ($1, $2, $3) RETURNING *`,
      [id, userId, JSON.stringify(meal)]
    );
    return rowToFavorite(rows[0]);
  },
  async deleteFavorite(userId: string, favoriteId: string): Promise<boolean> {
    await ready();
    const { rowCount } = await pool.query(
      "DELETE FROM favorites WHERE user_id = $1 AND id = $2",
      [userId, favoriteId]
    );
    return (rowCount ?? 0) > 0;
  },
};
