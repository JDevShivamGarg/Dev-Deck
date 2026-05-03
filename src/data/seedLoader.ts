import { getDatabase } from '../db/client';
import { insertCard } from '../db/queries/cards';
import { getTopicBySlug } from '../db/queries/topics';
import type { RawCard, CardMode } from '../types';

import gitCards from './seed/git.json';
import kubernetesCards from './seed/kubernetes.json';
import kafkaCards from './seed/kafka.json';
import sqlCards from './seed/sql.json';
import mlCards from './seed/ml.json';
import dlCards from './seed/dl.json';
import dockerCards from './seed/docker.json';
import linuxCards from './seed/linux.json';
import systemDesignCards from './seed/system-design.json';

interface SeedCard extends RawCard {
  mode: CardMode;
}

const SEED_DATA: Record<string, SeedCard[]> = {
  git: gitCards as SeedCard[],
  kubernetes: kubernetesCards as SeedCard[],
  kafka: kafkaCards as SeedCard[],
  sql: sqlCards as SeedCard[],
  ml: mlCards as SeedCard[],
  dl: dlCards as SeedCard[],
  docker: dockerCards as SeedCard[],
  linux: linuxCards as SeedCard[],
  'system-design': systemDesignCards as SeedCard[],
};

export async function seedAllCards(): Promise<void> {
  const db = await getDatabase();

  // Check if we've already seeded
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM Card WHERE source = 'static'`
  );

  if (result && result.count > 0) {
    __DEV__ && console.log('Seed data already loaded, skipping...');
    return;
  }

  __DEV__ && console.log('Seeding card data...');

  for (const [slug, cards] of Object.entries(SEED_DATA)) {
    const topic = await getTopicBySlug(slug);
    if (!topic) {
      __DEV__ && console.warn(`Topic ${slug} not found, skipping seed`);
      continue;
    }

    for (const card of cards) {
      await insertCard(topic.id, card.mode, card, 'static');
    }

    __DEV__ && console.log(`Seeded ${cards.length} cards for ${slug}`);
  }

  __DEV__ && console.log('Seed complete');
}
