const fs = require('fs');
const path = require('path');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? walk(res) : res;
  });
}

const files = walk('src').filter((f) => /\.(js|jsx)$/.test(f));
let issues = 0;

function report(kind, file, detail) {
  console.log(`[${kind}]: ${path.relative(process.cwd(), file)}${detail}`);
}

// --- collect every imported binding across the project (for dead-code check) ---
const projectSources = files.map((f) => ({ file: f, src: fs.readFileSync(f, 'utf8') }));
const importedByProject = new Set();

for (const { src } of projectSources) {
  const importRe = /import\s+(?:([\w$]+)\s*,\s*)?(?:\{([^}]*)\}|([\w$]+)\s+from)?/g;
  let m;
  while ((m = importRe.exec(src)) !== null) {
    if (m[1]) importedByProject.add(m[1]);
    if (m[3]) importedByProject.add(m[3]);
    if (m[2]) {
      for (const part of m[2].split(',')) {
        const name = part.split(/\s+as\s+/).pop().trim();
        if (name) importedByProject.add(name);
      }
    }
  }
}

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(process.cwd(), f);

  // 1. residual console.log / console.debug
  const logs = src.match(/console\.(log|debug)\b/g) || [];
  if (logs.length > 0) {
    report('CONSOLE.LOG FOUND', f, ` (${logs.length})`);
    issues += logs.length;
  }

  // 2. debugger statements
  const dbg = src.match(/\bdebugger\b/g) || [];
  if (dbg.length > 0) {
    report('DEBUGGER FOUND', f, ` (${dbg.length})`);
    issues += dbg.length;
  }

  // 3. unused imports (binding never referenced again in the same file)
  const importStmtRe = /^[ \t]*import\s+(?:[\w$]+\s*,\s*)?(?:\{[^}]*\}|[\w$]+)(?:\s*,\s*\{[^}]*\})?\s+from\s*['"][^'"]+['"];?[ \t]*$/gm;
  const statements = src.match(importStmtRe) || [];
  for (const stmt of statements) {
    const names = [];
    const defaultPart = stmt.match(/import\s+([\w$]+)\s*(?:,|\s+from)/);
    if (defaultPart) names.push(defaultPart[1]);
    const bracePart = stmt.match(/\{([^}]*)\}/);
    if (bracePart) {
      for (const part of bracePart[1].split(',')) {
        const name = part.split(/\s+as\s+/).pop().trim();
        if (name) names.push(name);
      }
    }
    const body = src.replace(stmt, '');
    for (const name of names) {
      const uses = body.match(new RegExp(`\\b${name}\\b`, 'g')) || [];
      if (uses.length === 0) {
        report('UNUSED IMPORT', f, ` -> ${name}`);
        issues += 1;
      }
    }
  }

  // 4. dead code: default export never imported anywhere in the project
  //    (static `import X from` or dynamic `import('./X.jsx')` via React.lazy)
  if (f.endsWith('.jsx') && /export\s+default\s+/.test(src)) {
    const base = path.basename(f, path.extname(f));
    const staticImport = new RegExp(`import\\s+${base}\\b`);
    const dynamicImport = new RegExp(`import\\(\\s*['"][^'"]*${base}(?:\\.(?:jsx|js))?['"]`);
    const isImported = projectSources.some(
      ({ file, src: s }) => file !== f && (staticImport.test(s) || dynamicImport.test(s))
    );
    if (!isImported) {
      report('DEAD COMPONENT', f, ` -> default export "${base}" never imported`);
      issues += 1;
    }
  }

  // 5. dead code: named export never imported anywhere in the project
  const exportRe = /export\s+(?:function|const|let|class)\s+([\w$]+)/g;
  let em;
  while ((em = exportRe.exec(src)) !== null) {
    const name = em[1];
    if (importedByProject.has(name)) continue;
    const usedLocally = new RegExp(`\\b${name}\\b`).test(src.slice(em.index + em[0].length));
    if (!usedLocally) {
      report('DEAD EXPORT', f, ` -> "${name}" never imported or used`);
      issues += 1;
    }
  }

  // 6. empty catch blocks (swallowed errors)
  const emptyCatch = src.match(/catch\s*(?:\([^)]*\))?\s*\{\s*\}/g) || [];
  if (emptyCatch.length > 0) {
    report('EMPTY CATCH', f, ` (${emptyCatch.length})`);
    issues += emptyCatch.length;
  }

  void rel;
}

console.log('');
console.log(issues === 0 ? 'AUDIT CLEAN: No issues found.' : `AUDIT FAILED: ${issues} issue(s) found.`);
process.exit(issues === 0 ? 0 : 1);
