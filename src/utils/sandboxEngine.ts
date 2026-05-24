export interface SandboxResult {
  output: string;
  isSuccess: boolean;
  clearConsole?: boolean;
}

export function executeSandboxCommand(
  command: string,
  cardAnswer: string,
  cardQuestion: string,
  remoteIp: string = '',
  currentDirectory: string = '/home/dev'
): SandboxResult {
  const trimmed = command.trim();
  if (!trimmed) return { output: '', isSuccess: false };

  const parts = trimmed.split(' ');
  const baseCmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Global utilities
  if (baseCmd === 'clear') {
    return { output: '', isSuccess: false, clearConsole: true };
  }

  if (baseCmd === 'help') {
    return {
      output: `DEVDECK Interactive Shell (v1.0.0-beta)
Available commands:
  help                   - Display this guide
  clear                  - Clear the console screen
  pwd                    - Print working directory
  ls                     - List files in current directory
  cat [file]             - View file contents
  git [args]             - Mock Git command
  docker [args]          - Mock Docker command
  npm [args]             - Mock NPM command
  curl [url]             - Fetch URL contents
  hint                   - Show a debugging hint
`,
      isSuccess: false,
    };
  }

  if (baseCmd === 'pwd') {
    return { output: currentDirectory, isSuccess: false };
  }

  if (baseCmd === 'ls') {
    const qLower = cardQuestion.toLowerCase();
    let files = ['README.md', 'package.json', 'index.js'];
    if (qLower.includes('docker') || qLower.includes('container')) {
      files = ['README.md', 'Dockerfile', 'docker-compose.yml', 'server.js'];
    } else if (qLower.includes('git') || qLower.includes('repo')) {
      files = ['.git', 'README.md', 'src/'];
    }
    return { output: files.join('   '), isSuccess: false };
  }

  if (baseCmd === 'cat') {
    const file = args[0] || '';
    if (!file) return { output: 'cat: missing file operand', isSuccess: false };
    
    if (file === 'package.json') {
      return {
        output: `{
  "name": "devdeck-target-service",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js",
    "test": "jest",
    "build": "tsc"
  }
}`,
        isSuccess: false
      };
    }
    if (file.toLowerCase() === 'dockerfile') {
      return {
        output: `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]`,
        isSuccess: false
      };
    }
    if (file.toLowerCase() === 'readme.md') {
      return {
        output: `# target-app\nDebug this service. Check console outputs and container states to resolve issues.`,
        isSuccess: false
      };
    }
    return { output: `cat: ${file}: No such file or directory`, isSuccess: false };
  }

  if (baseCmd === 'hint') {
    // Extract a hint from the answer
    return {
      output: `[HINT] Try analyzing the problem statement. Look for keywords like:
${cardAnswer.split('.').slice(0, 2).join('.')}.`,
      isSuccess: false,
    };
  }

  // Topic specific custom mock commands
  const questionLower = cardQuestion.toLowerCase();
  const answerLower = cardAnswer.toLowerCase();
  const cmdLower = trimmed.toLowerCase();

  // Check if command is a potential corrective troubleshooting action!
  // We check if:
  // 1. The typed command matches keywords in the card's answer key,
  // 2. Or if they are using a logical debugger command.
  const isMatch = (
    (cmdLower.includes('restart') && answerLower.includes('restart')) ||
    (cmdLower.includes('kill') && answerLower.includes('kill')) ||
    (cmdLower.includes('docker compose up') && answerLower.includes('compose')) ||
    (cmdLower.includes('npm install') && answerLower.includes('npm install')) ||
    (cmdLower.includes('chmod') && answerLower.includes('chmod')) ||
    (cmdLower.includes('port') && answerLower.includes('port')) ||
    (cmdLower.includes('pull') && answerLower.includes('pull')) ||
    (cmdLower.includes('git checkout') && answerLower.includes('checkout')) ||
    (cmdLower.includes('git merge') && answerLower.includes('merge')) ||
    (cmdLower.includes('git push') && answerLower.includes('push')) ||
    (cmdLower.includes('docker run') && answerLower.includes('docker run')) ||
    // Let's do a direct keyword matching between the typed command and terms in the answer key!
    (args.length > 0 && args.some(arg => arg.length > 3 && answerLower.includes(arg.toLowerCase())))
  );

  const prefix = remoteIp ? `[REMOTE: ${remoteIp}] ` : '';

  if (isMatch) {
    return {
      output: `${prefix}[LOG] Executing: ${trimmed}...
${prefix}[LOG] Applying correction patch...
${prefix}[LOG] Validation check: SUCCESS!
${prefix}[SUCCESS] System status: ONLINE.
[SUCCESS] Bug resolved! Analysis unlocked.`,
      isSuccess: true,
    };
  }

  if (baseCmd === 'ssh') {
    const target = args[0] || '';
    if (!target) return { output: 'ssh: missing host destination', isSuccess: false };
    return {
      output: `Connecting to host ${target}...
Connection established. Host key accepted.
Welcome to target remote system. Prompts bound to host session.`,
      isSuccess: false
    };
  }

  // Mock specific command outputs to make the sandbox alive
  if (baseCmd === 'docker') {
    if (args[0] === 'ps') {
      return {
        output: `CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS                  PORTS                    NAMES
8b9b4f9e1e2d   node:18        "docker-entrypoint.s…"   2 hours ago     Exited (137) 5m ago     0.0.0.0:8080->8080/tcp   web-service
a1c2e3f4b5d6   redis:alpine   "docker-entrypoint.s…"   2 hours ago     Up 2 hours              6379/tcp                 redis-cache`,
        isSuccess: false
      };
    }
    return { output: `[DOCKER] Executed: docker ${args.join(' ')}. Container state unmodified.`, isSuccess: false };
  }

  if (baseCmd === 'git') {
    if (args[0] === 'status') {
      return {
        output: `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   src/server.ts

no changes added to commit (use "git add" and/or "git commit -a")`,
        isSuccess: false
      };
    }
    if (args[0] === 'log') {
      return {
        output: `commit a8f9c0b2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7g8 (HEAD -> main, origin/main)
Author: Developer <dev@devdeck.io>
Date:   Today

    feat: integrate external microservice API (broken connection check)

commit 5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d
Author: Developer <dev@devdeck.io>
Date:   Yesterday

    chore: initial project initialization`,
        isSuccess: false
      };
    }
    return { output: `[GIT] Executed: git ${args.join(' ')}. Repository status: unchanged.`, isSuccess: false };
  }

  if (baseCmd === 'curl') {
    const url = args[0] || '';
    if (!url) return { output: 'curl: no URL specified', isSuccess: false };
    if (url.includes('8080') || url.includes('localhost')) {
      return { output: 'curl: (7) Failed to connect to localhost port 8080: Connection refused', isSuccess: false };
    }
    return { output: `HTTP/1.1 200 OK\nContent-Type: text/plain\n\nMock response from ${url}`, isSuccess: false };
  }

  // Fallback for unrecognized commands
  return {
    output: `bash: ${baseCmd}: command not found.
Type "help" to see available mock console utilities, or type "hint" to get a clue.`,
    isSuccess: false,
  };
}
