import { createReadStream } from 'node:fs';
import { once } from 'node:events';
import { createInterface } from 'node:readline';
import { inspect } from 'node:util';
import { Command } from '../interfaces/command.interface.js';

export class ImportCommand implements Command {
  public readonly name = 'import';

  public async call(args: string[]): Promise<void> {
    const filePath = args[0];

    if (!filePath || args.length !== 1) {
      console.error('Укажите путь к файлу: --import <path>');
      process.exitCode = 1;
      return;
    }

    const stream = createReadStream(filePath, 'utf-8');
    const lines = createInterface({ input: stream, crlfDelay: Infinity });
    let headers: string[] = [];

    try {
      for await (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        if (headers.length === 0) {
          headers = line.split('\t');
          continue;
        }

        const values = line.split('\t');
        const offer: Record<string, string> = {};

        if (values.length !== headers.length) {
          throw new Error('Количество полей не совпадает с заголовком TSV');
        }

        for (let i = 0; i < headers.length; i++) {
          offer[headers[i]] = values[i];
        }

        if (!process.stdout.write(`${inspect(offer)}\n`)) {
          await once(process.stdout, 'drain');
        }
      }
    } catch (error) {
      console.error(`Не удалось импортировать файл ${filePath}:`, (error as Error).message);
      process.exitCode = 1;
    } finally {
      lines.close();
      stream.destroy();
    }
  }
}
