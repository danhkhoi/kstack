#!/usr/bin/env bun
const [subcommand] = process.argv.slice(2);

switch (subcommand) {
  case 'extract':
    console.log('extract: not yet implemented');
    process.exit(0);
  case 'promote':
    console.log('promote: not yet implemented');
    process.exit(0);
  default:
    console.error('usage: mine-logs <extract|promote>');
    process.exit(1);
}
