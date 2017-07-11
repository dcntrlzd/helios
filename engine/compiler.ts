import * as fs from 'fs';

export default function compiler(file: string, engine: any) {
  return new Promise(
    (resolve: (api: any, result: any) => void, reject: (errors: string[]) => void) => {
      const source = fs.readFileSync(`${__dirname}/../src/${file}`).toString();
      const result = engine.compile(source);

      if (result.errors) return reject(result.errors);

      const { contracts } = result;

      const API = Object.keys(contracts).reduce((acc, key) => {
        // compiled contract names start with a colon character
        // so we remove it to make it easier to use (thorugh desconstructors especially)
        const contractName = key.replace(/^:/, '');
        console.log(contractName);
        return Object.assign(acc, { [contractName]: contracts[key] });
      }, {});

      return resolve(API, result);
    }
  );
}
