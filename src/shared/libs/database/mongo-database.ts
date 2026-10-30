import mongoose from 'mongoose';
import { inject, injectable } from 'inversify';
import { Component } from '../../container/component.js';
import { Logger } from '../logger/logger.interface.js';
import { Database } from './database.interface.js';

@injectable()
export class MongoDatabase implements Database {
  constructor(@inject(Component.Logger) private readonly logger: Logger) {}

  public async connect(uri: string): Promise<void> {
    this.logger.info('Попытка подключения к MongoDB');
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      this.logger.info('Соединение с MongoDB установлено');
    } catch {
      this.logger.error('Не удалось подключиться к MongoDB');
      throw new Error('Проверьте адрес MongoDB и доступность сервера');
    }
  }

  public async disconnect(): Promise<void> {
    await mongoose.disconnect();
    this.logger.info('Соединение с MongoDB закрыто');
  }
}
