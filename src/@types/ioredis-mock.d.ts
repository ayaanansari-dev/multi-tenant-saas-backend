// src/@types/ioredis-mock.d.ts
declare module 'ioredis-mock' {
  import { Redis } from 'ioredis';
  
  class RedisMock extends Redis {
    constructor(options?: any);
    flushall(): Promise<void>;
    quit(): Promise<void>;
  }
  
  export default RedisMock;
}