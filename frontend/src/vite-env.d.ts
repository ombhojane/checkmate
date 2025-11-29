/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // add other env variables here as needed
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
