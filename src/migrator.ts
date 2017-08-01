import * as glob from 'glob';
import * as path from 'path';

import Session from './session';

type Migration = {
  name: string,
  path: string,
  id: number,
  runner: ({ session: Session, migration: Migration }) => Promise<any> | void
};

export default class Migrator {
  private currentIndex: number;
  public migrationsDirectory: string;
  public migrationsPattern: string = '+([0-9])*.js';
  private session: Session;

  constructor(migrationsDirectory: string, migrationsPattern?: string) {
    this.migrationsDirectory = migrationsDirectory;
    if (migrationsPattern) this.migrationsPattern = migrationsPattern;
  }

  getSession(): Session {
    if (!this.session) this.session = new Session();
    return this.session;
  }

  async run(): Promise<any> {
    const migrations = this.getMigrations();
    const session = this.getSession();

    if (migrations.length === 0) throw new Error("No migrations found");

    for (let i = 0; i < migrations.length; i += 1) {
      const migration = migrations[i];
      await migration.runner({ session, migration });
    }
  }

  public getMigrations(): Migration[] {
    const globPattern = path.join(this.migrationsDirectory, this.migrationsPattern);

    const migrations = glob.sync(globPattern).map((migrationPath) => {
      const migrationName = path.basename(migrationPath);

      return {
        id: Number(migrationName.match(/([0-9]+).*/)[1]),
        name: migrationName,
        path: migrationPath,
        runner: require(migrationPath)
      };
    });

    // TODO: check if migration runner is a function or not

    migrations.sort((a, b) => a.id - b.id);

    return migrations;
  }
}
