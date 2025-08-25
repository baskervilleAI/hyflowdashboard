declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

interface ImportMetaEnv {
  VITE_UNSPLASH_ACCESS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

