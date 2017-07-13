import * as fs from 'fs';
import loader from './loader';

export function loadContract(file: string): string {
  return fs.readFileSync(file).toString();
}

type Resolver = (api: any, result: any) => void;
type Rejector = (errors: string[]) => void;

export default function compiler(file: string, version: string) {
  return loader(version).then((engine: any) => new Promise(
    (resolve: Resolver, reject: Rejector) => {
      const source = loadContract(file);
      const result = engine.compile(source);

      if (result.errors) return reject(result.errors);

      const { contracts } = result;

      const API = Object.keys(contracts).reduce((acc, key) => {
        // compiled contract names start with a colon character
        // so we remove it to make it easier to use (thorugh desconstructors especially)
        const contractName = key.replace(/^:/, '');
        return Object.assign(acc, { [contractName]: contracts[key] });
      }, {});

      return resolve(API, result);
    }
  ));
}
