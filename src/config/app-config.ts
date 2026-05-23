import * as Joi from 'joi';

export type StorageDriver = 'memory' | 'sqlite';

export interface AppConfig {
  PORT: number;
  NODE_ENV: 'development' | 'test' | 'production';
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  MAX_GRAPHS: number;
  STORAGE_DRIVER: StorageDriver;
  SQLITE_PATH: string;
  API_KEY: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_TTL_MS: number;
  RATE_LIMIT_MAX: number;
  BODY_LIMIT_BYTES: number;
  DIJKSTRA_TIMEOUT_MS: number;
}

export const appConfigSchema = Joi.object<AppConfig, true>({
  PORT: Joi.number().integer().min(0).max(65_535).default(3000),
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
  MAX_GRAPHS: Joi.number().integer().min(1).max(10_000).default(5),
  STORAGE_DRIVER: Joi.string().valid('memory', 'sqlite').default('memory'),
  SQLITE_PATH: Joi.string().default('./data/graphs.db'),
  API_KEY: Joi.string().allow('').default(''),
  CORS_ORIGIN: Joi.string().default('*'),
  RATE_LIMIT_TTL_MS: Joi.number().integer().min(100).default(60_000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(120),
  BODY_LIMIT_BYTES: Joi.number().integer().min(1024).default(1_048_576),
  DIJKSTRA_TIMEOUT_MS: Joi.number().integer().min(10).default(500),
}).unknown(true);
