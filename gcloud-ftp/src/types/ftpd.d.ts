declare module 'ftpd' {
  interface FtpServerOptions {
    getInitialCwd?: (connection: any, callback?: (err: Error | null, path: string) => void) => string | void;
    getRoot?: (connection: any, callback?: (err: Error | null, path: string) => void) => string | void;
    useWriteFile?: boolean;
    useReadFile?: boolean;
    pasvPortRangeStart?: number;
    pasvPortRangeEnd?: number;
    tlsOptions?: Record<string, unknown>;
    tlsOnly?: boolean;
    allowUnauthorizedTls?: boolean;
  }

  class FtpServer {
    constructor(host: string, options?: FtpServerOptions);
    listen(port: number): void;
    close(): void;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export = { FtpServer };
}
