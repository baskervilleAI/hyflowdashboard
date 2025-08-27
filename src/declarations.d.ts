declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export default classes;
}

interface ImportMetaEnv {
  readonly VITE_PIXABAY_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
