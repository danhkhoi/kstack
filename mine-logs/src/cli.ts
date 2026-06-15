#!/usr/bin/env bun
import { runExtract } from './extract';

const [subcommand] = process.argv.slice(2);

switch (subcommand) {
  case 'extract':
    await runExtract();
    break;
  case 'promote':
    console.log('promote: not yet implemented');
    process.exit(0);
    break;
  default:
    console.error('usage: mine-logs <extract|promote>');
    process.exit(1);
}
