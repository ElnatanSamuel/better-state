export type Unsubscribe = () => void;

export interface State<T> {
  value: T;
  set(value: T): void;
  subscribe(listener: (val: T) => void): Unsubscribe;
}

export interface Derived<T> {
  readonly value: T;
  subscribe(listener: (val: T) => void): Unsubscribe;
}

export interface ResourceSnapshot<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface Resource<T> extends ResourceSnapshot<T> {
  refresh(): Promise<void>;
  subscribe(listener: (snapshot: ResourceSnapshot<T>) => void): Unsubscribe;
}

// Internal types
export interface StateNode<T> {
  _value: T;
  initial: T;
  subscribers: Set<(v: T) => void>;
  dependents: Set<DerivedNode<any>>;
  eq: (a: T, b: T) => boolean;
}

export interface DerivedNode<T> {
  compute: () => T;
  cached: T | undefined;
  dirty: boolean;
  dependencies: Set<StateNode<any> | DerivedNode<any>>;
  subscribers: Set<(v: T) => void>;
  dependents: Set<DerivedNode<any>>;
}

export interface ResourceNode<T> {
  fetcher: () => Promise<T>;
  data: T | null;
  loading: boolean;
  error: Error | null;
  subscribers: Set<(s: ResourceSnapshot<T>) => void>;
  currentPromiseId: number;
}

export interface Tracker {
  dependencies: Set<StateNode<any> | DerivedNode<any>>;
  dependents?: Set<DerivedNode<any>>;
}
