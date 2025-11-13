import { TestEnvironment } from 'jest-environment-node';

export default class NodeEnvironmentWithoutLocalStorage extends TestEnvironment {
  constructor(...args) {
    super(...args);
    // Override localStorage to prevent initialization issues
    this.global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    };
  }
}