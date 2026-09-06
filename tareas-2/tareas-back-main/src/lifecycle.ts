import { createServer, type RequestListener } from 'node:http';

export async function iniciarServidor({
  app,
  initialize,
  closeDatabase,
  port,
  host,
  shutdownTimeoutMs = 10000,
}: {
  app: RequestListener;
  initialize: () => Promise<unknown>;
  closeDatabase: () => Promise<void>;
  port: number;
  host?: string;
  shutdownTimeoutMs?: number;
}) {
  const server = createServer(app);
  try {
    await initialize();
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, host, () => {
        server.off('error', reject);
        resolve();
      });
    });
  } catch (error) {
    await closeDatabase();
    throw error;
  }
  let stopping: Promise<void> | undefined;
  function stop(): Promise<void> {
    if (stopping) return stopping;
    stopping = (async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          server.closeAllConnections();
          reject(new Error('Tiempo de cierre agotado'));
        }, shutdownTimeoutMs);
      });
      try {
        await Promise.race([
          (async () => {
            try {
              await new Promise<void>((resolve, reject) =>
                server.close((error) => (error ? reject(error) : resolve()))
              );
            } finally {
              await closeDatabase();
            }
          })(),
          deadline,
        ]);
      } finally {
        clearTimeout(timer);
      }
    })();
    return stopping;
  }
  return { server, stop };
}
