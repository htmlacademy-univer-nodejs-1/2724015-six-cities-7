export interface Command {
  readonly name: string;
  call(args: string[]): void | Promise<void>;
}
