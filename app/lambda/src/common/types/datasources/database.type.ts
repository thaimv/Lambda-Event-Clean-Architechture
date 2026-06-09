/** Opaque database client handle — PrismaClient is only cast inside datasource implementations. */
export type DatabaseClient = object;

/** Opaque transaction session — Prisma.TransactionClient is only cast inside datasource implementations. */
export type DatabaseSession = object;
export type DatabaseSecrets = {
  dbClusterIdentifier: string;
  password: string;
  dbname: string;
  engine: string;
  port: number;
  host: string;
  replicaHost?: string;
  username: string;
  schema?: string;
};
