import * as path from 'path';
import Migrator from './migrator';
import * as helios from '../test/runner';

const MIGRATIONS_DIRECTORY = path.resolve(__dirname, '../test/migrations');

it('can load a sorted list of migrations', () => {
  const migrator = new Migrator(helios, MIGRATIONS_DIRECTORY);
  expect(migrator.getMigrations()).toMatchSnapshot();
});

it('runs the migrations in order', async () => {
  const migrator = new Migrator(helios, MIGRATIONS_DIRECTORY);
  await migrator.run();
});
