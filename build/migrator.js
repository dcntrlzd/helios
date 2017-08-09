"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const glob = require("glob");
const path_1 = require("path");
const DEFAULT_PATTERN = '+([0-9])*.js';
class Migrator {
    constructor(session, path, options = {}) {
        const { pattern } = options;
        this.session = session;
        this.path = path;
        this.pattern = pattern ? pattern : DEFAULT_PATTERN;
    }
    getSession() {
        return this.session;
    }
    async run() {
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
    getMigrations() {
        const globPattern = path_1.join(this.path, this.pattern);
        const migrations = glob.sync(globPattern).map((migrationPath) => {
            const migrationName = path_1.basename(migrationPath);
            return {
                id: Number(migrationName.match(/([0-9]+).*/)[1]),
                name: migrationName,
                path: path_1.relative(this.path, migrationPath),
                runner: require(migrationPath),
            };
        });
        // TODO: check if migration runner is a function or not
        migrations.sort((a, b) => a.id - b.id);
        return migrations;
    }
}
exports.default = Migrator;
