export interface DiagnosticResult {
  readonly name: string;
  readonly passed: boolean;
  readonly detail: string;
}

export type RunSqliteChecks = () => readonly DiagnosticResult[];

export type RunBackupChecks =
  () => Promise<readonly DiagnosticResult[]>;
  