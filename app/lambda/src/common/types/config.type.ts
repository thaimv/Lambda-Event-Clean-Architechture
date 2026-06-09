export type TDatabaseConfig = {
  dbUrl: string;
  dbUrlReplica: string;
  proxyEndpoint: string;
  proxyEndpointReplica: string;
  maxRetries: number;
  backOffMs: number;
  connectionLimit: number;
};
