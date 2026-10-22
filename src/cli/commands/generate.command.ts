import axios from 'axios';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Command } from '../interfaces/command.interface.js';
import { MockData } from '../../shared/types/mock-data.type.js';
import { generateOffers } from '../../shared/generators/offer-generator.js';

export class GenerateCommand implements Command {
  public readonly name = 'generate';

  public async call(args: string[]): Promise<void> {
    const [amount, filePath, url] = args;
    const count = Number(amount);

    if (args.length !== 3 || !Number.isSafeInteger(count) || count < 1) {
      console.error('Укажите количество, путь к файлу и URL: --generate <n> <filepath> <url>');
      process.exitCode = 1;
      return;
    }

    try {
      const response = await axios.get<MockData>(url, { timeout: 10000 });
      const data = response.data;

      if (!Array.isArray(data.offers) || data.offers.length === 0) {
        throw new Error('Сервис должен вернуть объект с непустым массивом offers');
      }

      await pipeline(Readable.from(generateOffers(count, data)), createWriteStream(filePath));
      console.info(`Создано предложений: ${count}. Файл: ${filePath}`);
    } catch (error) {
      console.error('Не удалось сгенерировать данные:', (error as Error).message);
      process.exitCode = 1;
    }
  }
}
