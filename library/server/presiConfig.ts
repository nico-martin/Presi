export interface PresiConfig {
  slidesRoot: string;
  port: number;
  https:
    | {
        key: string | Buffer;
        cert: string | Buffer;
      }
    | false;
}

export default (config: Partial<PresiConfig>): PresiConfig => {
  return {
    slidesRoot: config.slidesRoot || "",
    port: config?.port
      ? config.port
      : process.env.PORT
      ? parseInt(process.env.PORT)
      : 3000,
    https: config?.https || false,
  };
};
