import * as path from 'path';
import Migrator from './migrator';

const MIGRATIONS_DIRECTORY = path.resolve(__dirname, '../migrations');

it('can load a sorted list of migrations', () => {
  const migrator = new Migrator(MIGRATIONS_DIRECTORY);
  expect(migrator.getMigrations()).toMatchSnapshot();
});

it('runs the migrations in order', async () => {
  const migrator = new Migrator(MIGRATIONS_DIRECTORY);
  await migrator.run();
});
