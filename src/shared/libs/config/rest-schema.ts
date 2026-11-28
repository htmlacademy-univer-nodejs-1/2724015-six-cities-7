import { Schema } from 'convict';
import { RestSchema } from './rest-schema.type.js';

export const restSchema: Schema<RestSchema> = {
  PORT: {
    format: 'server-port',
    default: null,
    env: 'PORT',
  },
  DB_URI: {
    format: (value: string) => {
      if (typeof value !== 'string' || !/^mongodb(?:\+srv)?:\/\//.test(value)) {
        throw new Error('Укажите строку подключения MongoDB');
      }
    },
    default: null,
    env: 'DB_URI',
    sensitive: true,
  },
  DB_HOST: {
    format: 'ipaddress',
    default: null,
    env: 'DB_HOST',
  },
  SALT: {
    format: (value: string) => {
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Соль должна быть непустой строкой');
      }
    },
    default: null,
    env: 'SALT',
    sensitive: true,
  },
};
