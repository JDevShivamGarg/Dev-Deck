export const BUILTIN_TOPICS = [
  { slug: 'git',           display: 'Git Internals',   icon: 'git',           materialIcon: 'source-branch' },
  { slug: 'kubernetes',    display: 'Kubernetes',       icon: 'kubernetes',    materialIcon: 'sail-boat' },
  { slug: 'kafka',         display: 'Kafka Events',     icon: 'apache-kafka',  materialIcon: 'swap-horizontal-bold' },
  { slug: 'sql',           display: 'Advanced SQL',     icon: 'database',      materialIcon: 'database' },
  { slug: 'ml',            display: 'ML Models',        icon: 'robot',         materialIcon: 'memory' },
  { slug: 'dl',            display: 'Deep Learning',    icon: 'brain',         materialIcon: 'brain' },
  { slug: 'docker',        display: 'Docker',           icon: 'docker',        materialIcon: 'package-variant-closed' },
  { slug: 'linux',         display: 'Linux',            icon: 'linux',         materialIcon: 'linux' },
  { slug: 'system-design', display: 'System Design',    icon: 'sitemap',       materialIcon: 'sitemap' },
] as const;

export type BuiltinSlug = (typeof BUILTIN_TOPICS)[number]['slug'];

// Map slugs to MaterialCommunityIcons names
export const TOPIC_ICON_MAP: Record<string, string> = {
  git: 'source-branch',
  kubernetes: 'sail-boat',
  kafka: 'swap-horizontal-bold',
  sql: 'database',
  ml: 'robot',
  dl: 'brain',
  docker: 'docker',
  linux: 'linux',
  'system-design': 'sitemap',
};
