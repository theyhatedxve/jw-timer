'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = fs.realpathSync(process.cwd());

function absolute(file) {
  const result = path.resolve(root, file);
  if (!result.startsWith(root + path.sep)) {
    throw new Error(`Path is outside the project: ${file}`);
  }
  return result;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const folders = new Map([
  ['src/components', 'src/frontend/components'],
  ['src/screens', 'src/frontend/screens'],
  ['src/hooks', 'src/frontend/hooks'],
  ['src/styles', 'src/frontend/styles'],
  ['src/navigation', 'src/frontend/navigation'],
  ['src/context', 'src/frontend/context'],
  ['src/domain', 'src/backend/domain'],
  ['src/services', 'src/backend/services'],
  ['src/database', 'src/backend/database'],
]);

assert(fs.existsSync(absolute('package.json')), 'Run this script from the JW-Timer project directory.');
for (const group of ['src/frontend', 'src/backend']) {
  assert(
    !fs.existsSync(absolute(group)) || fs.readdirSync(absolute(group)).length === 0,
    'Frontend/backend folders already contain files. Stop and inspect the layout.',
  );
}
for (const source of folders.keys()) {
  assert(fs.existsSync(absolute(source)), `Expected folder is missing: ${source}`);
}

function collect(directory) {
  if (!fs.existsSync(absolute(directory))) return [];
  return fs.readdirSync(absolute(directory), { withFileTypes: true }).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    assert(!entry.isSymbolicLink(), `Linked source paths are not supported: ${file}`);
    if (entry.isDirectory()) return collect(file);
    return /\.tsx?$/.test(entry.name) ? [file] : [];
  });
}

const files = [
  ...collect('src'), ...collect('tests'),
  'App.tsx', 'index.ts', 'app.config.ts',
].filter(file => fs.existsSync(absolute(file)));

const originals = new Map(files.map(file => [file, fs.readFileSync(absolute(file), 'utf8')]));

function destination(file) {
  for (const [source, target] of folders) {
    if (file.startsWith(`${source}/`)) return target + file.slice(source.length);
  }
  return file;
}

const originalPaths = new Set(originals.keys());

function parse(file, source) {
  const parsed = ts.createSourceFile(
    file, source, ts.ScriptTarget.Latest, true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  assert(parsed.parseDiagnostics.length === 0, `Fix syntax errors before moving this file: ${file}`);
  return parsed;
}

function resolveModule(file, specifier, available) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`];
  const found = candidates.find(candidate => available.has(candidate));
  assert(found, `Cannot resolve ${specifier} from ${file}`);
  return found;
}

function relativeModule(from, to) {
  let result = path.posix.relative(path.posix.dirname(from), to).replace(/\.tsx?$/, '');
  if (!result.startsWith('.')) result = `./${result}`;
  return result;
}

function moduleNodes(parsed) {
  return parsed.statements.flatMap(node => {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) return [];
    const moduleNode = node.moduleSpecifier;
    return moduleNode && ts.isStringLiteral(moduleNode) ? [moduleNode] : [];
  });
}

function applyEdits(source, edits) {
  for (const edit of edits.sort((left, right) => right.start - left.start)) {
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  }
  return source;
}

function withoutModulePaths(file, source) {
  const parsed = parse(file, source);
  return applyEdits(source, moduleNodes(parsed).map(node => ({
    start: node.getStart(parsed) + 1, end: node.end - 1, text: '__module_path__',
  })));
}

const output = new Map();
for (const [file, source] of originals) {
  const targetFile = destination(file);
  const parsed = parse(file, source);
  const edits = [];
  for (const node of moduleNodes(parsed)) {
    if (!node.text.startsWith('.')) continue;
    const originalTarget = resolveModule(file, node.text, originalPaths);
    edits.push({
      start: node.getStart(parsed) + 1, end: node.end - 1,
      text: relativeModule(targetFile, destination(originalTarget)),
    });
  }
  const rewritten = applyEdits(source, edits);
  assert(
    withoutModulePaths(file, source) === withoutModulePaths(targetFile, rewritten),
    `Unexpected non-import change: ${file}`,
  );
  assert(!output.has(targetFile), `Duplicate destination: ${targetFile}`);
  output.set(targetFile, rewritten);
}

const futurePaths = new Set(output.keys());
for (const [file, source] of output) {
  const parsed = parse(file, source);
  for (const node of moduleNodes(parsed)) {
    if (node.text.startsWith('.')) resolveModule(file, node.text, futurePaths);
  }
}

console.log('Folder moves:');
for (const [source, target] of folders) console.log(`  ${source} -> ${target}`);

if (!process.argv.includes('--apply')) {
  console.log('\nPreview only. No files changed.');
  console.log('Apply with: node scripts/separate-frontend-backend.cjs --apply');
  process.exit(0);
}

const backup = `.refactor-backups/frontend-backend-${Date.now()}`;
assert(!fs.existsSync(absolute(backup)), 'Backup destination already exists.');

// Back up the complete source tree, including non-TypeScript files.
fs.mkdirSync(absolute(backup), { recursive: true });
fs.cpSync(absolute('src'), absolute(`${backup}/src`), {
  recursive: true, errorOnExist: true, force: false,
});

// Back up root files and test sources whose imports may change.
for (const file of originals.keys()) {
  if (file.startsWith('src/')) continue;
  const backupFile = absolute(`${backup}/${file}`);
  fs.mkdirSync(path.dirname(backupFile), { recursive: true });
  fs.copyFileSync(absolute(file), backupFile);
}

const documentation = 'docs/DIRECTORY_STRUCTURE.md';
if (fs.existsSync(absolute(documentation))) {
  const backupFile = absolute(`${backup}/${documentation}`);
  fs.mkdirSync(path.dirname(backupFile), { recursive: true });
  fs.copyFileSync(absolute(documentation), backupFile);
}
fs.writeFileSync(absolute(`${backup}/moves.json`), JSON.stringify([...folders], null, 2));

// Windows watchers may prevent renaming a directory. Copy first instead.
// Both source and destination paths are checked inside the project.
for (const [source, target] of folders) {
  const sourcePath = absolute(source);
  const targetPath = absolute(target);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.cpSync(sourcePath, targetPath, {
    recursive: true, errorOnExist: true, force: false,
  });
}

for (const [file, source] of originals) {
  const targetFile = destination(file);
  const rewritten = output.get(targetFile);
  if (rewritten === source) continue;
  fs.writeFileSync(absolute(targetFile), rewritten, 'utf8');
}

// Verify copied source bytes before removing any backed-up original.
function allFiles(directory) {
  return fs.readdirSync(absolute(directory), { withFileTypes: true }).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    assert(!entry.isSymbolicLink(), `Linked source paths are not supported: ${file}`);
    return entry.isDirectory() ? allFiles(file) : [file];
  });
}
const copiedFiles = [...folders.keys()].flatMap(allFiles);
for (const file of copiedFiles) {
  const original = fs.readFileSync(absolute(file));
  const backedUp = fs.readFileSync(absolute(`${backup}/${file}`));
  assert(original.equals(backedUp), `Source changed during the move; keep both copies: ${file}`);
  const target = destination(file);
  const expected = output.has(target) ? Buffer.from(output.get(target), 'utf8') : original;
  assert(fs.readFileSync(absolute(target)).equals(expected), `Destination differs; keep both copies: ${target}`);
}
for (const file of copiedFiles) fs.unlinkSync(absolute(file));

// Remove empty original directories only. A locked empty directory may remain.
function removeEmpty(directory) {
  for (const entry of fs.readdirSync(absolute(directory), { withFileTypes: true })) {
    if (entry.isDirectory()) removeEmpty(`${directory}/${entry.name}`);
  }
  if (fs.readdirSync(absolute(directory)).length === 0) {
    try {
      fs.rmdirSync(absolute(directory));
    } catch (error) {
      if (error.code !== 'EPERM' && error.code !== 'EBUSY') throw error;
      console.warn(`Windows retained an empty folder: ${directory}`);
    }
  }
}
for (const source of folders.keys()) removeEmpty(source);

console.log(`\nApplied. Source backup: ${backup}`);
console.log('Only folder locations and import paths changed.');
console.log('No database, tests, builds, or app were executed.');
