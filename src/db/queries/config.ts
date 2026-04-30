import { getDatabase } from '../client';

export async function getUserConfig(key: string): Promise<string | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM UserConfig WHERE key = ?`,
    [key]
  );
  return result?.value ?? null;
}

export async function setUserConfig(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO UserConfig (key, value) VALUES (?, ?)`,
    [key, value]
  );
}

export async function deleteUserConfig(key: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM UserConfig WHERE key = ?`, [key]);
}
