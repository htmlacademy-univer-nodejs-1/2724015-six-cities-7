import { readFileSync } from 'node:fs';
import { Command } from '../interfaces/command.interface.js';

export class VersionCommand implements Command {
  public readonly name = 'version';

  public call(_args: string[]): void {
    const fileContent = readFileSync('./package.json', 'utf-8');
    const packageJson = JSON.parse(fileContent);
    console.info(packageJson.version);
  }
}
