import Session from './session';
export interface IMigration {
    name: string;
    path: string;
    id: number;
    runner: ({session: Session, migration: IMigration}) => Promise<any> | void;
}
export interface IMigratorOptions {
    pattern?: string;
}
export default class Migrator {
    static DEFAULT_PATTERN: string;
    path: string;
    pattern: string;
    private currentIndex;
    private session;
    constructor(session: Session, path: string, options?: IMigratorOptions);
    getSession(): Session;
    run(): Promise<any>;
    getMigrations(): IMigration[];
}
