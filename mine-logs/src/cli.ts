#!/usr/bin/env bun
import { runExtract } from './extract';
import { runPromote } from './promote';

const [subcommand] = process.argv.slice(2);

switch (subcommand) {
  case 'extract':
    await runExtract();
    break;
  case 'promote':
    await runPromote();
    break;
  default:
    console.error('usage: mine-logs <extract|promote>');
    process.exit(1);
}
