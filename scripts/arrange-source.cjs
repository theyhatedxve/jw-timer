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

function exists(file) {
  return fs.existsSync(absolute(file));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  exists('package.json') && exists('src/state/db/appDatabase.ts'),
  'Run this script from the JW-Timer project before this refactor.',
);

const moves = new Map([
  ['src/state/profile/profile.ts', 'src/domain/profile/profile.ts'],
  ['src/state/profile/profileService.ts', 'src/services/profileService.ts'],
  ['src/state/profile/profileRepository.ts', 'src/database/repositories/profileRepository.ts'],
  ['src/state/profile/profileDependencies.ts', 'src/bootstrap/profileDependencies.ts'],
  ['src/state/timer/timer.ts', 'src/domain/timer/timer.ts'],
  ['src/state/db/timerStorage.ts', 'src/database/repositories/timerStorage.ts'],
  ['src/state/db/sqliteDiagnostics.ts', 'src/database/diagnostics/sqliteDiagnostics.ts'],
  ['src/state/diagnostics/diagnostics.types.ts', 'src/services/diagnostics.types.ts'],
  ['src/state/db/appDatabase.ts', 'src/database/appDatabase.ts'],
  ['src/state/meetings/meeting.types.ts', 'src/domain/meetings/meeting.types.ts'],
  ['src/state/meetings/meetingValidation.ts', 'src/domain/meetings/meetingValidation.ts'],
  ['src/state/meetings/meetingService.ts', 'src/services/meetingService.ts'],
  ['src/state/meetings/meetingRepository.ts', 'src/database/repositories/meetingRepository.ts'],
  ['src/state/meetings/meetingDependencies.ts', 'src/bootstrap/meetingDependencies.ts'],
]);

const styleMoves = [
  { source: 'src/components/common/ActionButton.tsx', target: 'src/styles/common/actionButton.styles.ts', name: 'styles' },
  { source: 'src/components/common/ProfileBoundary.tsx', target: 'src/styles/common/profileBoundary.styles.ts', name: 'styles' },
  { source: 'src/components/common/SectionView.tsx', target: 'src/styles/common/section.styles.ts', name: 'styles' },
  { source: 'src/components/profile/ProfileForm.tsx', target: 'src/styles/profile/profileForm.styles.ts', name: 'styles' },
  { source: 'src/components/timer/TimerSessionView.tsx', target: 'src/styles/timer/timerSession.styles.ts', name: 'styles' },
  { source: 'src/components/diagnostics/DiagnosticsView.tsx', target: 'src/styles/diagnostics/diagnostics.styles.ts', name: 'styles' },
  { source: 'src/navigation/TabNavigator.tsx', target: 'src/styles/navigation/tabs.styles.ts', name: 'styles' },
  { source: 'src/components/meetings/MeetingControls.tsx', target: 'src/styles/meetings/meetings.styles.ts', name: 'meetingStyles' },
];

function collect(directory) {
  if (!exists(directory)) return [];
  return fs.readdirSync(absolute(directory), { withFileTypes: true }).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    assert(!entry.isSymbolicLink(), `Linked source paths are not supported: ${file}`);
    if (entry.isDirectory()) return collect(file);
    return /\.tsx?$/.test(entry.name) ? [file] : [];
  });
}

const sourceFiles = [
  ...collect('src'), ...collect('tests'),
  'App.tsx', 'index.ts', 'app.config.ts',
].filter(exists);

const originals = new Map(sourceFiles.map(file => [file, fs.readFileSync(absolute(file), 'utf8')]));

for (const [source, target] of moves) {
  assert(originals.has(source), `Missing source: ${source}`);
  assert(!exists(target), `Destination already exists: ${target}`);
}
for (const move of styleMoves) {
  assert(originals.has(move.source), `Missing UI source: ${move.source}`);
  assert(!exists(move.target), `Style destination already exists: ${move.target}`);
}

const originalPaths = new Set([...originals.keys(), ...styleMoves.map(move => move.target)]);

function parse(file, source) {
  const parsed = ts.createSourceFile(
    file, source, ts.ScriptTarget.Latest, true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  assert(parsed.parseDiagnostics.length === 0, `Cannot arrange a file containing syntax errors: ${file}`);
  return parsed;
}

function applyEdits(source, edits) {
  for (const edit of edits.sort((left, right) => right.start - left.start)) {
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  }
  return source;
}

function relativeModule(from, to) {
  let result = path.posix.relative(path.posix.dirname(from), to).replace(/\.tsx?$/, '');
  if (!result.startsWith('.')) result = `./${result}`;
  return result;
}

function resolveModule(file, specifier, available) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`];
  const found = candidates.find(candidate => available.has(candidate));
  assert(found, `Cannot resolve ${specifier} from ${file}. No changes applied.`);
  return found;
}

function importText(node, elements) {
  assert(!node.importClause.name, 'Unexpected default import in a style-related import.');
  if (elements.length === 0) return '';
  const keyword = node.importClause.isTypeOnly ? 'import type' : 'import';
  return `${keyword} { ${elements.join(', ')} } from ${node.moduleSpecifier.getText()};`;
}

function pruneStyleImports(file, source) {
  const parsed = parse(file, source);
  const used = new Set();
  function visit(node) {
    if (ts.isImportDeclaration(node)) return;
    if (ts.isIdentifier(node)) used.add(node.text);
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  const edits = [];
  for (const node of parsed.statements) {
    if (!ts.isImportDeclaration(node)) continue;
    const bindings = node.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    const moduleName = node.moduleSpecifier.text;
    let retained = [...bindings.elements];
    if (moduleName === 'react-native') {
      assert(!used.has('StyleSheet'), `StyleSheet is still used outside the extracted block: ${file}`);
      retained = retained.filter(element => (element.propertyName?.text ?? element.name.text) !== 'StyleSheet');
    } else if (moduleName.endsWith('/constants/theme')) {
      retained = retained.filter(element => used.has(element.name.text));
    } else {
      continue;
    }
    if (retained.length === bindings.elements.length) continue;
    edits.push({
      start: node.getStart(parsed), end: node.end,
      text: importText(node, retained.map(element => element.getText(parsed))),
    });
  }
  return applyEdits(source, edits);
}

const output = new Map();

function extractStyle(file, source, move) {
  const parsed = parse(file, source);
  let found = null;
  for (const statement of parsed.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) && declaration.name.text === move.name &&
        declaration.initializer && ts.isCallExpression(declaration.initializer) &&
        declaration.initializer.expression.getText(parsed) === 'StyleSheet.create'
      ) {
        assert(!found && statement.declarationList.declarations.length === 1, `Unexpected style declaration structure: ${file}`);
        found = { statement, initializer: declaration.initializer.getText(parsed) };
      }
    }
  }
  assert(found, `Expected style declaration not found: ${file}`);
  const tokens = ['colors', 'dimensions', 'spacing', 'typography'].filter(name =>
    new RegExp(`\\b${name}\\s*\\.`).test(found.initializer),
  );
  const imports = ["import { StyleSheet } from 'react-native';"];
  if (tokens.length > 0) {
    imports.push(`import { ${tokens.join(', ')} } from '${relativeModule(move.target, 'src/constants/theme.ts')}';`);
  }
  output.set(move.target, `${imports.join('\n')}\n\nexport const ${move.name} = ${found.initializer};\n`);
  source = applyEdits(source, [{ start: found.statement.getStart(parsed), end: found.statement.end, text: '' }]);
  source = `import { ${move.name} } from '${relativeModule(file, move.target)}';\n${source}`;
  return pruneStyleImports(file, source);
}

function separateMeetingStyleImport(file, source) {
  const parsed = parse(file, source);
  const edits = [];
  for (const node of parsed.statements) {
    if (!ts.isImportDeclaration(node) || !node.moduleSpecifier.text.startsWith('.')) continue;
    const target = resolveModule(file, node.moduleSpecifier.text, originalPaths);
    if (target !== 'src/components/meetings/MeetingControls.tsx') continue;
    const bindings = node.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    const styles = bindings.elements.filter(element =>
      (element.propertyName?.text ?? element.name.text) === 'meetingStyles',
    );
    if (styles.length === 0) continue;
    const controls = bindings.elements.filter(element => !styles.includes(element));
    const replacement = [
      importText(node, controls.map(element => element.getText(parsed))),
      `import { ${styles.map(element => element.getText(parsed)).join(', ')} } from '${relativeModule(file, 'src/styles/meetings/meetings.styles.ts')}';`,
    ].filter(Boolean).join('\n');
    edits.push({ start: node.getStart(parsed), end: node.end, text: replacement });
  }
  return applyEdits(source, edits);
}

function rebaseImports(oldFile, newFile, source) {
  const parsed = parse(oldFile, source);
  const edits = [];
  for (const node of parsed.statements) {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue;
    const moduleNode = node.moduleSpecifier;
    if (!moduleNode || !ts.isStringLiteral(moduleNode) || !moduleNode.text.startsWith('.')) continue;
    const originalTarget = resolveModule(oldFile, moduleNode.text, originalPaths);
    const newTarget = moves.get(originalTarget) ?? originalTarget;
    edits.push({
      start: moduleNode.getStart(parsed) + 1, end: moduleNode.end - 1,
      text: relativeModule(newFile, newTarget),
    });
  }
  return applyEdits(source, edits);
}

for (const [file, original] of originals) {
  let source = original;
  const styleMove = styleMoves.find(move => move.source === file);
  if (styleMove) source = extractStyle(file, source, styleMove);
  source = separateMeetingStyleImport(file, source);
  const destination = moves.get(file) ?? file;
  source = rebaseImports(file, destination, source);
  assert(!output.has(destination), `Duplicate destination: ${destination}`);
  output.set(destination, source);
}

function withoutImports(file, source) {
  const parsed = parse(file, source);
  return applyEdits(source, parsed.statements.filter(node => ts.isImportDeclaration(node)).map(node => ({
    start: node.getStart(parsed), end: node.end, text: '',
  })));
}

// Business/database modules may change imports only.
// This also preserves the exact migration SQL and checksum logic.
for (const [source, target] of moves) {
  assert(
    withoutImports(source, originals.get(source)) === withoutImports(target, output.get(target)),
    `Non-import content changed unexpectedly: ${source}`,
  );
}

const futurePaths = new Set(output.keys());
for (const [file, source] of output) {
  const parsed = parse(file, source);
  for (const node of parsed.statements) {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue;
    const moduleNode = node.moduleSpecifier;
    if (moduleNode && ts.isStringLiteral(moduleNode) && moduleNode.text.startsWith('.')) {
      resolveModule(file, moduleNode.text, futurePaths);
    }
  }
}

console.log('Source moves:');
for (const [source, target] of moves) console.log(`  ${source} -> ${target}`);
console.log('Style extraction:');
for (const move of styleMoves) console.log(`  ${move.source} -> ${move.target}`);

if (!process.argv.includes('--apply')) {
  console.log('\nPreview only. No files changed.');
  console.log('Apply with: node scripts/arrange-source.cjs --apply');
  process.exit(0);
}

const backup = `.refactor-backups/source-layout-${Date.now()}`;
assert(!exists(backup), 'Backup destination already exists.');
for (const file of originals.keys()) {
  const destination = absolute(`${backup}/${file}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(absolute(file), destination);
}
if (exists('docs/DIRECTORY_STRUCTURE.md')) {
  const destination = absolute(`${backup}/docs/DIRECTORY_STRUCTURE.md`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(absolute('docs/DIRECTORY_STRUCTURE.md'), destination);
}
fs.writeFileSync(absolute(`${backup}/moves.json`), JSON.stringify({ moves: [...moves], styles: styleMoves }, null, 2));

for (const [file, source] of output) {
  if (originals.has(file) && originals.get(file) === source) continue;
  const destination = absolute(file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, source, 'utf8');
}

// Remove only original files that were moved and backed up.
for (const source of moves.keys()) fs.unlinkSync(absolute(source));

// Remove only empty former state directories, deepest first.
const formerDirectories = new Set();
for (const source of moves.keys()) {
  let directory = path.posix.dirname(source);
  while (directory === 'src/state' || directory.startsWith('src/state/')) {
    formerDirectories.add(directory);
    directory = path.posix.dirname(directory);
  }
}
for (const directory of [...formerDirectories].sort((left, right) => right.length - left.length)) {
  if (exists(directory) && fs.readdirSync(absolute(directory)).length === 0) {
    fs.rmdirSync(absolute(directory));
  }
}

console.log(`\nApplied. Source backup: ${backup}`);
console.log('No database, tests, builds, or app were executed.');
