export interface IWeb3FunctionParameter {
  name: string;
  type: string;
}

export interface IWeb3FunctionDescription {
  type: 'function'|'constructor'|'fallback';
  name?: string;
  inputs: IWeb3FunctionParameter[];
  outputs?: IWeb3FunctionParameter[];
  constant?: boolean;
  payable?: boolean;
}

export interface IWeb3EventParameter {
  name: string;
  type: string;
  indexed: boolean;
}

export interface IWeb3EventDescription {
  type: 'event';
  name: string;
  inputs: IWeb3EventParameter[];
  anonymous: boolean;
}

export type Web3AbiDefinition = IWeb3FunctionDescription | IWeb3EventDescription;

export interface IWeb3Contract<A> {
  abi: Web3AbiDefinition[];
  address: string;
  at(address: string): A;
}
