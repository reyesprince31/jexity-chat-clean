globalThis.__nitro_main__ = import.meta.url; import { u as useNitroApp, s as serve, t as trapUnhandledErrors } from './chunks/_/nitro.mjs';
import 'node:http';
import 'node:stream';
import 'node:https';
import 'node:http2';
import 'avvio';
import 'node:diagnostics_channel';
import 'node:dns';
import 'node:os';
import '@fastify/error';
import 'process-warning';
import 'abstract-logging';
import 'pino';
import 'rfdc';
import 'fast-json-stringify/lib/serializer';
import 'proxy-addr';
import 'node:async_hooks';
import 'toad-cache';
import 'secure-json-parse';
import '@fastify/fast-json-stringify-compiler';
import '@fastify/ajv-compiler';
import 'semver';
import 'node:assert';
import 'find-my-way';
import 'light-my-request';
import 'fs';
import 'path';
import 'os';
import 'crypto';
import 'fastify-plugin';
import '@fastify/busboy';
import 'node:fs';
import 'node:fs/promises';
import 'node:path';
import '@fastify/deepmerge';
import 'node:stream/promises';
import 'node:crypto';
import 'ws';
import 'duplexify';
import 'workflow/api';
import '@supabase/functions-js';
import '@supabase/postgrest-js';
import '@supabase/realtime-js';
import '@supabase/storage-js';
import '@supabase/node-fetch';
import '@supabase/auth-js';
import 'node:url';
import '@prisma/client-runtime-utils';
import 'node:events';
import '@prisma/adapter-pg';
import '@langchain/openai';
import '@langchain/core/messages';
import '@langchain/core/retrievers';
import '@langchain/core/documents';
import '@langchain/textsplitters';
import 'zod';
import 'pdf-parse';
import 'workflow/runtime';

const port = Number.parseInt(process.env.NITRO_PORT || process.env.PORT || "") || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
// const socketPath = process.env.NITRO_UNIX_SOCKET; // TODO
const nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : undefined,
	fetch: nitroApp.fetch
});
trapUnhandledErrors();
const nodeServer = {};

export { nodeServer as default };
