import { getDatabase } from '../client';

export async function getUserConfig(key: string): Promise<string | null> {
  const db = await getDatabase();
  try {
    const result = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM UserConfig WHERE key = ?`, key);
    return result?.value ?? null;
  } catch (error) {
    console.error('Database Error in getUserConfig:', error);
    throw error;
  }
}

export async function setUserConfig(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO UserConfig (key, value) VALUES (?, ?)`, key, value);
  } catch (error) {
    console.error('Database Error in setUserConfig:', error);
    throw error;
  }
}

export async function deleteUserConfig(key: string): Promise<void> {
  const db = await getDatabase();
  try {
    await db.runAsync(`DELETE FROM UserConfig WHERE key = ?`, key);
  } catch (error) {
    console.error('Database Error in deleteUserConfig:', error);
    throw error;
  }
}
