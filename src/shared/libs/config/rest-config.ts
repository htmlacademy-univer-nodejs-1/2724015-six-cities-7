import convict from 'convict';
import formats from 'convict-format-with-validator';
import dotenv from 'dotenv';
import { injectable } from 'inversify';
import { Config } from './config.interface.js';
import { RestSchema } from './rest-schema.type.js';
import { restSchema } from './rest-schema.js';

@injectable()
export class RestConfig implements Config {
  private readonly config: convict.Config<RestSchema>;

  constructor() {
    const result = dotenv.config();

    if (result.error) {
      throw new Error('Не удалось прочитать .env-файл');
    }

    convict.addFormats(formats);
    convict.addFormat({
      name: 'server-port',
      coerce: Number,
      validate: (value: number) => {
        if (!Number.isInteger(value) || value < 1 || value > 65535) {
          throw new Error('Порт должен быть целым числом от 1 до 65535');
        }
      },
    });
    this.config = convict(restSchema);
    this.config.validate({ allowed: 'strict' });
  }

  public get<T extends keyof RestSchema>(key: T): RestSchema[T] {
    return this.config.getProperties()[key];
  }
}
