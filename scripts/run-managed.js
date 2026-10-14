#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname,join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveRuntime } from './managed-runtime.js';
try{const runtime=resolveRuntime(join(dirname(fileURLToPath(import.meta.url)),'..'));const child=spawnSync(process.execPath,[runtime.cli,...process.argv.slice(2)],{stdio:'inherit'});if(child.error)throw child.error;process.exitCode=child.status??1;}catch(e){console.error(JSON.stringify({ok:false,error:e.message}));process.exitCode=1;}
