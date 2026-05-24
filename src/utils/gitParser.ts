export interface GitHubRepoDetails {
  owner: string;
  repo: string;
  branch: string;
  filePath?: string;
}

export function parseGitHubUrl(url: string): GitHubRepoDetails | null {
  try {
    const trimmed = url.trim().replace(/\/$/, '');
    // Support formats:
    // https://github.com/owner/repo
    // https://github.com/owner/repo/blob/branch/path/to/file.md
    // owner/repo
    
    if (!trimmed.includes('github.com')) {
      const parts = trimmed.split('/');
      if (parts.length >= 2) {
        return {
          owner: parts[0],
          repo: parts[1],
          branch: 'main',
        };
      }
      return null;
    }

    const urlObj = new URL(trimmed);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 2) return null;

    const owner = pathParts[0];
    const repo = pathParts[1];
    let branch = 'main';
    let filePath: string | undefined;

    if (pathParts.length >= 4 && (pathParts[2] === 'blob' || pathParts[2] === 'tree')) {
      branch = pathParts[3];
      filePath = pathParts.slice(4).join('/');
    }

    return { owner, repo, branch, filePath };
  } catch (error) {
    console.error('Failed to parse GitHub URL:', error);
    return null;
  }
}

export async function fetchRawGitHubContent(
  owner: string,
  repo: string,
  path: string = 'README.md',
  branch: string = 'main'
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'text/plain',
    }
  });

  if (!response.ok) {
    // If main fails, try master branch
    if (branch === 'main') {
      return await fetchRawGitHubContent(owner, repo, path, 'master');
    }
    throw new Error(`Failed to fetch file from GitHub (${response.status})`);
  }

  return await response.text();
}
