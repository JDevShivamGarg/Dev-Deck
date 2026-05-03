const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src/db/queries');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (!file.endsWith('.ts')) return;
  const filePath = path.join(dir, file);
  let code = fs.readFileSync(filePath, 'utf8');

  code = code.replace(/export async function (\w+)\(([^)]*)\)(?:\s*:\s*[^{]+)?\s*\{([\s\S]*?)\n\}/g, (match, fnName, args, body) => {
    if (!body.includes('db.') || body.includes('try {')) return match;
    
    const dbMatch = body.match(/\s*const db = await getDatabase\(\);/);
    if (!dbMatch) return match;
    
    const preDb = body.substring(0, dbMatch.index + dbMatch[0].length);
    const postDb = body.substring(dbMatch.index + dbMatch[0].length);
    
    const indentedPostDb = postDb.replace(/\n/g, '\n  ');
    
    const newBody = `${preDb}\n  try {${indentedPostDb}\n  } catch (error) {\n    console.error('Database Error in ${fnName}:', error);\n    throw error;\n  }`;

    const newMatch = match.replace(body, newBody);
    return newMatch;
  });

  fs.writeFileSync(filePath, code);
});
