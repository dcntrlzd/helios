import * as glob from 'glob';
import * as path from 'path';

import Session from './session';

interface IMigration {
  name: string;
  path: string;
  id: number;
  runner: ({ session: Session, migration: IMigration }) => Promise<any> | void;
}

export default class Migrator {
  public migrationsDirectory: string;
  public migrationsPattern: string = '+([0-9])*.js';

  private currentIndex: number;
  private session: Session;

  constructor(migrationsDirectory: string, migrationsPattern?: string) {
    this.migrationsDirectory = migrationsDirectory;
    this.migrationsPattern = migrationsPattern ? migrationsPattern : this.migrationsPattern;
  }

  public getSession(): Session {
    if (!this.session) {
      this.session = new Session();
    }
    return this.session;
  }

  public async run(): Promise<any> {
    const migrations = this.getMigrations();
    const session = this.getSession();

    if (migrations.length === 0) {
      throw new Error('No migrations found');
    }

    for (const migration of migrations) {
      await migration.runner({ session, migration });
    }
  }

  public getMigrations(): IMigration[] {
    const globPattern = path.join(this.migrationsDirectory, this.migrationsPattern);

    const migrations = glob.sync(globPattern).map((migrationPath) => {
      const migrationName = path.basename(migrationPath);

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
