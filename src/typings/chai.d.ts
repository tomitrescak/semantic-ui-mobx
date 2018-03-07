declare type MatchOptions = {
  serializer?: (source: string) => string;
};

declare namespace Chai {
  interface Assertion {
    matchSnapshot(name?: string, options?: MatchOptions): Assertion
  }
}