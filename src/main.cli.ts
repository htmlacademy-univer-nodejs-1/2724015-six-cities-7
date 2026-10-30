#!/usr/bin/env node
import 'reflect-metadata';
import { createRestContainer } from './shared/container/rest-container.js';
import { program } from 'commander';
import { Command } from './cli/interfaces/command.interface.js';
import { HelpCommand } from './cli/commands/help.command.js';
import { VersionCommand } from './cli/commands/version.command.js';
import { GenerateCommand } from './cli/commands/generate.command.js';
import { ImportCommand } from './cli/commands/import.command.js';

const container = createRestContainer();

const commands: Command[] = [
  new HelpCommand(),
  new VersionCommand(),
  container.resolve(ImportCommand),
  new GenerateCommand(),
];

program.helpOption(false);

for (const command of commands) {
  program.option(`--${command.name} [args...]`);
}

program.parse();
const options = program.opts();

let isCommandCalled = false;

for (const command of commands) {
  const value = options[command.name];

  if (value) {
    const args = Array.isArray(value) ? value : [];
    await command.call(args);
    isCommandCalled = true;
    break;
  }
}

if (!isCommandCalled) {
  new HelpCommand().call([]);
}
