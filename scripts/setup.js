#!/usr/bin/env node
import { dirname,join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installRuntime,resolveRuntime } from './managed-runtime.js';
import { findInkscape } from '../src/backend.js';
try{const args=process.argv.slice(2);if(args.some(a=>!['--check','--json'].includes(a)))throw new Error('Usage: setup.js [--check] [--json]');if(Number(process.versions.node.split('.')[0])<22)throw new Error('Node 22+ is required');const source=join(dirname(fileURLToPath(import.meta.url)),'..');const inkscape=findInkscape();const runtime=args.includes('--check')?resolveRuntime(source):installRuntime(source);console.log(JSON.stringify({ok:true,version:runtime.version,fingerprint:runtime.fingerprint,runtimeRoot:runtime.root,cli:runtime.cli,node:process.versions.node,inkscape},null,args.includes('--json')?0:2));}catch(e){console.log(JSON.stringify({ok:false,error:e.message}));process.exitCode=1;}
