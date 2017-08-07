import * as glob from 'glob';
import { basename, join } from 'path';

import Session from './session';

interface IMigration {
  name: string;
  path: string;
  id: number;
  runner: ({ session: Session, migration: IMigration }) => Promise<any> | void;
}

export interface IMigratorOptions {
  pattern?: string;
}

const DEFAULT_PATTERN = '+([0-9])*.js';

export default class Migrator {
  public path: string;
  public pattern: string;

  private currentIndex: number;
  private session: Session;

  constructor(session: Session, path: string, options: IMigratorOptions = {}) {
    const { pattern } = options;

    this.session = session;
    this.path = path;
    this.pattern = pattern ? pattern : DEFAULT_PATTERN;
  }

  public getSession(): Session {
    return this.session;
  }

  public async run(): Promise<any> {
    const { session } = this;
    await session.promise;

    const migrations = this.getMigrations();

    if (migrations.length === 0) {
      throw new Error('No migrations found');
    }

    for (const migration of migrations) {
      await migration.runner({ session, migration });
    }
  }

  public getMigrations(): IMigration[] {
    const globPattern = join(this.path, this.pattern);

    const migrations = glob.sync(globPattern).map((migrationPath) => {
      const migrationName = basename(migrationPath);

      return {
        id: Number(migrationName.match(/([0-9]+).*/)[1]),
        name: migrationName,
        path: migrationPath,
        runner: require(migrationPath),
      };
    });

    // TODO: check if migration runner is a function or not

    migrations.sort((a, b) => a.id - b.id);

    return migrations;
  }
}
