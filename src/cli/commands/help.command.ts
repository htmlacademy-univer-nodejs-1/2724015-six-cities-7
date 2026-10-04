import { Command } from '../interfaces/command.interface.js';

export class HelpCommand implements Command {
  public readonly name = 'help';

  public call(_args: string[]): void {
    console.info(`
Программа для подготовки данных для REST API сервера.

Пример:
    main.cli.js --<command> [--arguments]

Команды:
    --version:                   # выводит номер версии
    --help:                      # печатает этот текст
    --import <path>:             # импортирует данные из TSV
`);
  }
}
