#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Read package.json and server.json
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const server = JSON.parse(readFileSync('server.json', 'utf8'));

const errors = [];

// Check 1: package.json must have mcpName field
if (!pkg.mcpName) {
  errors.push('package.json is missing required "mcpName" field');
}

// Check 2: mcpName must match server.json name
if (pkg.mcpName && pkg.mcpName !== server.name) {
  errors.push(`package.json mcpName "${pkg.mcpName}" does not match server.json name "${server.name}"`);
}

// Check 3: package.json version must match server.json version
if (pkg.version !== server.version) {
  errors.push(`package.json version "${pkg.version}" does not match server.json version "${server.version}"`);
}

// Check 4: package.json version must match server.json packages[0].version
if (server.packages?.[0]?.version && pkg.version !== server.packages[0].version) {
  errors.push(`package.json version "${pkg.version}" does not match server.json packages[0].version "${server.packages[0].version}"`);
}

// Check 5: server.json must have required fields
if (!server.$schema) {
  errors.push('server.json is missing "$schema" field');
}
if (!server.name) {
  errors.push('server.json is missing "name" field');
}
if (!server.description) {
  errors.push('server.json is missing "description" field');
}
if (!server.version) {
  errors.push('server.json is missing "version" field');
}
if (!server.packages || server.packages.length === 0) {
  errors.push('server.json is missing "packages" array or it is empty');
}

// Check 6: server.json packages[0] must have required fields
if (server.packages?.[0]) {
  const pkg0 = server.packages[0];
  if (!pkg0.registryType) {
    errors.push('server.json packages[0] is missing "registryType" field');
  }
  if (!pkg0.identifier) {
    errors.push('server.json packages[0] is missing "identifier" field');
  }
  if (!pkg0.version) {
    errors.push('server.json packages[0] is missing "version" field');
  }
  if (!pkg0.transport) {
    errors.push('server.json packages[0] is missing "transport" field');
  }
}

// Report results
if (errors.length > 0) {
  console.error('❌ MCP validation failed:\n');
  for (const error of errors) {
    console.error(`  • ${error}`);
  }
  process.exit(1);
} else {
  console.log('✅ MCP validation passed');
}
