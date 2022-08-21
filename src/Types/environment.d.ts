export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ROOM_TABLE: string;
    }
  }
}
