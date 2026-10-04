import { readFileSync } from 'node:fs';
import { Command } from '../interfaces/command.interface.js';

export class ImportCommand implements Command {
  public readonly name = 'import';

  public call(args: string[]): void {
    const filePath = args[0];

    if (!filePath) {
      console.error('Укажите путь к файлу: --import <path>');
      return;
    }

    let fileContent: string;

    try {
      fileContent = readFileSync(filePath, 'utf-8');
    } catch {
      console.error(`Не удалось прочитать файл: ${filePath}`);
      return;
    }

    const lines = fileContent.trim().split('\n');
    const headers = lines[0].split('\t');

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const offer: Record<string, string> = {};

      for (let j = 0; j < headers.length; j++) {
        offer[headers[j]] = values[j];
      }

      console.info(offer);
    }
  }
}
