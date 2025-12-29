import require$$0, { IncomingMessage, ServerResponse } from 'node:http';
import require$$0$6, { Readable, Duplex } from 'node:stream';
import nodeHTTPS from 'node:https';
import nodeHTTP2 from 'node:http2';
import require$$0$b from 'avvio';
import require$$1 from 'node:diagnostics_channel';
import require$$2 from 'node:dns';
import require$$3 from 'node:os';
import require$$0$1 from '@fastify/error';
import require$$0$2 from 'process-warning';
import require$$1$1 from 'abstract-logging';
import require$$0$3 from 'pino';
import require$$0$4 from 'rfdc';
import require$$0$5 from 'fast-json-stringify/lib/serializer';
import require$$0$7 from 'proxy-addr';
import require$$0$8 from 'node:async_hooks';
import require$$1$2 from 'toad-cache';
import require$$2$1 from 'secure-json-parse';
import require$$1$3 from '@fastify/fast-json-stringify-compiler';
import require$$2$2 from '@fastify/ajv-compiler';
import require$$0$9 from 'semver';
import require$$1$4 from 'node:assert';
import require$$0$a from 'find-my-way';
import require$$22 from 'light-my-request';
import require$$0$c from 'fs';
import require$$1$5 from 'path';
import require$$2$3 from 'os';
import require$$1$6, { createHash } from 'crypto';
import require$$0$d from 'fastify-plugin';
import require$$0$e from '@fastify/busboy';
import require$$3$1, { promises } from 'node:fs';
import require$$4$1 from 'node:fs/promises';
import * as require$$5 from 'node:path';
import require$$5__default, { dirname, resolve } from 'node:path';
import require$$9 from '@fastify/deepmerge';
import require$$11 from 'node:stream/promises';
import require$$0$f from 'node:crypto';
import require$$4$2 from 'ws';
import require$$5$1 from 'duplexify';
import { start, resumeWebhook } from 'workflow/api';
import require$$0$i from '@supabase/functions-js';
import require$$1$7 from '@supabase/postgrest-js';
import require$$2$4 from '@supabase/realtime-js';
import require$$3$2 from '@supabase/storage-js';
import require$$0$g from '@supabase/node-fetch';
import require$$0$h from '@supabase/auth-js';
import { fileURLToPath } from 'node:url';
import require$$1$8 from '@prisma/client-runtime-utils';
import require$$5$2 from 'node:events';
import { PrismaPg } from '@prisma/adapter-pg';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { BaseRetriever } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { z } from 'zod';
import { PDFParse } from 'pdf-parse';
import { stepEntrypoint, workflowEntrypoint } from 'workflow/runtime';

//#region src/_inherit.ts
function lazyInherit(target, source, sourceKey) {
	for (const key of [...Object.getOwnPropertyNames(source), ...Object.getOwnPropertySymbols(source)]) {
		if (key === "constructor") continue;
		const targetDesc = Object.getOwnPropertyDescriptor(target, key);
		const desc = Object.getOwnPropertyDescriptor(source, key);
		let modified = false;
		if (desc.get) {
			modified = true;
			desc.get = targetDesc?.get || function() {
				return this[sourceKey][key];
			};
		}
		if (desc.set) {
			modified = true;
			desc.set = targetDesc?.set || function(value) {
				this[sourceKey][key] = value;
			};
		}
		if (!targetDesc?.value && typeof desc.value === "function") {
			modified = true;
			desc.value = function(...args) {
				return this[sourceKey][key](...args);
			};
		}
		if (modified) Object.defineProperty(target, key, desc);
	}
}

//#region src/_url.ts
/**
* URL wrapper with fast paths to access to the following props:
*
*  - `url.pathname`
*  - `url.search`
*  - `url.searchParams`
*  - `url.protocol`
*
* **NOTES:**
*
* - It is assumed that the input URL is **already encoded** and formatted from an HTTP request and contains no hash.
* - Triggering the setters or getters on other props will deoptimize to full URL parsing.
* - Changes to `searchParams` will be discarded as we don't track them.
*/
const FastURL = /* @__PURE__ */ (() => {
	const NativeURL = globalThis.URL;
	const FastURL$1 = class URL {
		#url;
		#href;
		#protocol;
		#host;
		#pathname;
		#search;
		#searchParams;
		#pos;
		constructor(url) {
			if (typeof url === "string") this.#href = url;
			else {
				this.#protocol = url.protocol;
				this.#host = url.host;
				this.#pathname = url.pathname;
				this.#search = url.search;
			}
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeURL;
		}
		get _url() {
			if (this.#url) return this.#url;
			this.#url = new NativeURL(this.href);
			this.#href = void 0;
			this.#protocol = void 0;
			this.#host = void 0;
			this.#pathname = void 0;
			this.#search = void 0;
			this.#searchParams = void 0;
			this.#pos = void 0;
			return this.#url;
		}
		get href() {
			if (this.#url) return this.#url.href;
			if (!this.#href) this.#href = `${this.#protocol || "http:"}//${this.#host || "localhost"}${this.#pathname || "/"}${this.#search || ""}`;
			return this.#href;
		}
		#getPos() {
			if (!this.#pos) {
				const url = this.href;
				const protoIndex = url.indexOf("://");
				const pathnameIndex = protoIndex === -1 ? -1 : url.indexOf("/", protoIndex + 4);
				this.#pos = [
					protoIndex,
					pathnameIndex,
					pathnameIndex === -1 ? -1 : url.indexOf("?", pathnameIndex)
				];
			}
			return this.#pos;
		}
		get pathname() {
			if (this.#url) return this.#url.pathname;
			if (this.#pathname === void 0) {
				const [, pathnameIndex, queryIndex] = this.#getPos();
				if (pathnameIndex === -1) return this._url.pathname;
				this.#pathname = this.href.slice(pathnameIndex, queryIndex === -1 ? void 0 : queryIndex);
			}
			return this.#pathname;
		}
		get search() {
			if (this.#url) return this.#url.search;
			if (this.#search === void 0) {
				const [, pathnameIndex, queryIndex] = this.#getPos();
				if (pathnameIndex === -1) return this._url.search;
				const url = this.href;
				this.#search = queryIndex === -1 || queryIndex === url.length - 1 ? "" : url.slice(queryIndex);
			}
			return this.#search;
		}
		get searchParams() {
			if (this.#url) return this.#url.searchParams;
			if (!this.#searchParams) this.#searchParams = new URLSearchParams(this.search);
			return this.#searchParams;
		}
		get protocol() {
			if (this.#url) return this.#url.protocol;
			if (this.#protocol === void 0) {
				const [protocolIndex] = this.#getPos();
				if (protocolIndex === -1) return this._url.protocol;
				this.#protocol = this.href.slice(0, protocolIndex + 1);
			}
			return this.#protocol;
		}
		toString() {
			return this.href;
		}
		toJSON() {
			return this.href;
		}
	};
	lazyInherit(FastURL$1.prototype, NativeURL.prototype, "_url");
	Object.setPrototypeOf(FastURL$1.prototype, NativeURL.prototype);
	Object.setPrototypeOf(FastURL$1, NativeURL);
	return FastURL$1;
})();

//#region src/_utils.ts
function resolvePortAndHost(opts) {
	const _port = opts.port ?? globalThis.process?.env.PORT ?? 3e3;
	const port = typeof _port === "number" ? _port : Number.parseInt(_port, 10);
	if (port < 0 || port > 65535) throw new RangeError(`Port must be between 0 and 65535 (got "${port}").`);
	return {
		port,
		hostname: opts.hostname ?? globalThis.process?.env.HOST
	};
}
function fmtURL(host, port, secure) {
	if (!host || !port) return;
	if (host.includes(":")) host = `[${host}]`;
	return `http${secure ? "s" : ""}://${host}:${port}/`;
}
function printListening(opts, url) {
	if (!url || (opts.silent ?? globalThis.process?.env?.TEST)) return;
	const _url = new URL(url);
	const allInterfaces = _url.hostname === "[::]" || _url.hostname === "0.0.0.0";
	if (allInterfaces) {
		_url.hostname = "localhost";
		url = _url.href;
	}
	let listeningOn = `➜ Listening on:`;
	let additionalInfo = allInterfaces ? " (all interfaces)" : "";
	if (globalThis.process.stdout?.isTTY) {
		listeningOn = `\u001B[32m${listeningOn}\u001B[0m`;
		url = `\u001B[36m${url}\u001B[0m`;
		additionalInfo = `\u001B[2m${additionalInfo}\u001B[0m`;
	}
	console.log(`${listeningOn} ${url}${additionalInfo}`);
}
function resolveTLSOptions(opts) {
	if (!opts.tls || opts.protocol === "http") return;
	const cert = resolveCertOrKey(opts.tls.cert);
	const key = resolveCertOrKey(opts.tls.key);
	if (!cert && !key) {
		if (opts.protocol === "https") throw new TypeError("TLS `cert` and `key` must be provided for `https` protocol.");
		return;
	}
	if (!cert || !key) throw new TypeError("TLS `cert` and `key` must be provided together.");
	return {
		cert,
		key,
		passphrase: opts.tls.passphrase
	};
}
function resolveCertOrKey(value) {
	if (!value) return;
	if (typeof value !== "string") throw new TypeError("TLS certificate and key must be strings in PEM format or file paths.");
	if (value.startsWith("-----BEGIN ")) return value;
	const { readFileSync } = process.getBuiltinModule("node:fs");
	return readFileSync(value, "utf8");
}
function createWaitUntil() {
	const promises = /* @__PURE__ */ new Set();
	return {
		waitUntil: (promise) => {
			if (typeof promise?.then !== "function") return;
			promises.add(Promise.resolve(promise).catch(console.error).finally(() => {
				promises.delete(promise);
			}));
		},
		wait: () => {
			return Promise.all(promises);
		}
	};
}

//#region src/_color.ts
const noColor = /* @__PURE__ */ (() => {
	const env = globalThis.process?.env ?? {};
	return env.NO_COLOR === "1" || env.TERM === "dumb";
})();
const _c = (c, r = 39) => (t) => noColor ? t : `\u001B[${c}m${t}\u001B[${r}m`;
const red = /* @__PURE__ */ _c(31);
const gray = /* @__PURE__ */ _c(90);

//#region src/_middleware.ts
function wrapFetch(server) {
	const fetchHandler = server.options.fetch;
	const middleware = server.options.middleware || [];
	return middleware.length === 0 ? fetchHandler : (request) => callMiddleware$1(request, fetchHandler, middleware, 0);
}
function callMiddleware$1(request, fetchHandler, middleware, index) {
	if (index === middleware.length) return fetchHandler(request);
	return middleware[index](request, () => callMiddleware$1(request, fetchHandler, middleware, index + 1));
}

//#endregion
//#region src/_plugins.ts
const errorPlugin = (server) => {
	const errorHandler = server.options.error;
	if (!errorHandler) return;
	server.options.middleware.unshift((_req, next) => {
		try {
			const res = next();
			return res instanceof Promise ? res.catch((error) => errorHandler(error)) : res;
		} catch (error) {
			return errorHandler(error);
		}
	});
};
const gracefulShutdownPlugin = (server) => {
	const config = server.options?.gracefulShutdown;
	if (!globalThis.process?.on || config === false || config === void 0 && (process.env.CI || process.env.TEST)) return;
	const gracefulShutdown = config === true || !config?.gracefulTimeout ? Number.parseInt(process.env.SERVER_SHUTDOWN_TIMEOUT || "") || 3 : config.gracefulTimeout;
	const forceShutdown = config === true || !config?.forceTimeout ? Number.parseInt(process.env.SERVER_FORCE_SHUTDOWN_TIMEOUT || "") || 5 : config.forceTimeout;
	let isShuttingDown = false;
	const shutdown = async () => {
		if (isShuttingDown) return;
		isShuttingDown = true;
		const w = process.stderr.write.bind(process.stderr);
		w(gray(`\nShutting down server in ${gracefulShutdown}s...`));
		let timeout;
		await Promise.race([server.close().finally(() => {
			clearTimeout(timeout);
			w(gray(" Server closed.\n"));
		}), new Promise((resolve) => {
			timeout = setTimeout(() => {
				w(gray(`\nForce closing connections in ${forceShutdown}s...`));
				timeout = setTimeout(() => {
					w(red("\nCould not close connections in time, force exiting."));
					resolve();
				}, forceShutdown * 1e3);
				return server.close(true);
			}, gracefulShutdown * 1e3);
		})]);
		globalThis.process.exit(0);
	};
	for (const sig of ["SIGINT", "SIGTERM"]) globalThis.process.on(sig, shutdown);
};

//#region src/adapters/_node/response.ts
/**
* Fast Response for Node.js runtime
*
* It is faster because in most cases it doesn't create a full Response instance.
*/
const NodeResponse = /* @__PURE__ */ (() => {
	const NativeResponse = globalThis.Response;
	const STATUS_CODES = globalThis.process?.getBuiltinModule?.("node:http")?.STATUS_CODES || {};
	class NodeResponse$1 {
		#body;
		#init;
		#headers;
		#response;
		constructor(body, init) {
			this.#body = body;
			this.#init = init;
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeResponse;
		}
		get status() {
			return this.#response?.status || this.#init?.status || 200;
		}
		get statusText() {
			return this.#response?.statusText || this.#init?.statusText || STATUS_CODES[this.status] || "";
		}
		get headers() {
			if (this.#response) return this.#response.headers;
			if (this.#headers) return this.#headers;
			const initHeaders = this.#init?.headers;
			return this.#headers = initHeaders instanceof Headers ? initHeaders : new Headers(initHeaders);
		}
		get ok() {
			if (this.#response) return this.#response.ok;
			const status = this.status;
			return status >= 200 && status < 300;
		}
		get _response() {
			if (this.#response) return this.#response;
			this.#response = new NativeResponse(this.#body, this.#headers ? {
				...this.#init,
				headers: this.#headers
			} : this.#init);
			this.#init = void 0;
			this.#headers = void 0;
			this.#body = void 0;
			return this.#response;
		}
		_toNodeResponse() {
			const status = this.status;
			const statusText = this.statusText;
			let body;
			let contentType;
			let contentLength;
			if (this.#response) body = this.#response.body;
			else if (this.#body) if (this.#body instanceof ReadableStream) body = this.#body;
			else if (typeof this.#body === "string") {
				body = this.#body;
				contentType = "text/plain; charset=UTF-8";
				contentLength = Buffer.byteLength(this.#body);
			} else if (this.#body instanceof ArrayBuffer) {
				body = Buffer.from(this.#body);
				contentLength = this.#body.byteLength;
			} else if (this.#body instanceof Uint8Array) {
				body = this.#body;
				contentLength = this.#body.byteLength;
			} else if (this.#body instanceof DataView) {
				body = Buffer.from(this.#body.buffer);
				contentLength = this.#body.byteLength;
			} else if (this.#body instanceof Blob) {
				body = this.#body.stream();
				contentType = this.#body.type;
				contentLength = this.#body.size;
			} else if (typeof this.#body.pipe === "function") body = this.#body;
			else body = this._response.body;
			const headers = [];
			const initHeaders = this.#init?.headers;
			const headerEntries = this.#response?.headers || this.#headers || (initHeaders ? Array.isArray(initHeaders) ? initHeaders : initHeaders?.entries ? initHeaders.entries() : Object.entries(initHeaders).map(([k, v]) => [k.toLowerCase(), v]) : void 0);
			let hasContentTypeHeader;
			let hasContentLength;
			if (headerEntries) for (const [key, value] of headerEntries) {
				if (Array.isArray(value)) for (const v of value) headers.push([key, v]);
				else headers.push([key, value]);
				if (key === "content-type") hasContentTypeHeader = true;
				else if (key === "content-length") hasContentLength = true;
			}
			if (contentType && !hasContentTypeHeader) headers.push(["content-type", contentType]);
			if (contentLength && !hasContentLength) headers.push(["content-length", String(contentLength)]);
			this.#init = void 0;
			this.#headers = void 0;
			this.#response = void 0;
			this.#body = void 0;
			return {
				status,
				statusText,
				headers,
				body
			};
		}
	}
	lazyInherit(NodeResponse$1.prototype, NativeResponse.prototype, "_response");
	Object.setPrototypeOf(NodeResponse$1, NativeResponse);
	Object.setPrototypeOf(NodeResponse$1.prototype, NativeResponse.prototype);
	return NodeResponse$1;
})();

//#endregion
//#region src/adapters/_node/call.ts
function callNodeHandler(handler, req) {
	const isMiddleware = handler.length > 2;
	const nodeCtx = req.runtime?.node;
	if (!nodeCtx || !nodeCtx.req || !nodeCtx.res) throw new Error("Node.js runtime context is not available.");
	const { req: nodeReq, res: nodeRes } = nodeCtx;
	let _headers;
	const webRes = new NodeResponse(void 0, {
		get status() {
			return nodeRes.statusCode;
		},
		get statusText() {
			return nodeRes.statusMessage;
		},
		get headers() {
			if (!_headers) {
				const headerEntries = [];
				const rawHeaders = nodeRes.getHeaders();
				for (const [name, value] of Object.entries(rawHeaders)) if (Array.isArray(value)) for (const v of value) headerEntries.push([name, v]);
				else if (value) headerEntries.push([name, String(value)]);
				_headers = new Headers(headerEntries);
			}
			return _headers;
		}
	});
	return new Promise((resolve, reject) => {
		nodeRes.once("close", () => resolve(webRes));
		nodeRes.once("finish", () => resolve(webRes));
		nodeRes.once("error", (error) => reject(error));
		let streamPromise;
		nodeRes.once("pipe", (stream) => {
			streamPromise = new Promise((resolve$1) => {
				stream.once("end", () => resolve$1(webRes));
				stream.once("error", (error) => reject(error));
			});
		});
		try {
			if (isMiddleware) Promise.resolve(handler(nodeReq, nodeRes, (error) => error ? reject(error) : streamPromise || resolve(webRes))).catch((error) => reject(error));
			else Promise.resolve(handler(nodeReq, nodeRes)).then(() => streamPromise || webRes);
		} catch (error) {
			reject(error);
		}
	});
}

//#region src/adapters/_node/send.ts
async function sendNodeResponse(nodeRes, webRes) {
	if (!webRes) {
		nodeRes.statusCode = 500;
		return endNodeResponse(nodeRes);
	}
	if (webRes._toNodeResponse) {
		const res = webRes._toNodeResponse();
		writeHead(nodeRes, res.status, res.statusText, res.headers);
		if (res.body) {
			if (res.body instanceof ReadableStream) return streamBody(res.body, nodeRes);
			else if (typeof res.body?.pipe === "function") {
				res.body.pipe(nodeRes);
				return new Promise((resolve) => nodeRes.on("close", resolve));
			}
			nodeRes.write(res.body);
		}
		return endNodeResponse(nodeRes);
	}
	const rawHeaders = [...webRes.headers];
	writeHead(nodeRes, webRes.status, webRes.statusText, rawHeaders);
	return webRes.body ? streamBody(webRes.body, nodeRes) : endNodeResponse(nodeRes);
}
function writeHead(nodeRes, status, statusText, rawHeaders) {
	const writeHeaders = globalThis.Deno ? rawHeaders : rawHeaders.flat();
	if (!nodeRes.headersSent) if (nodeRes.req?.httpVersion === "2.0") nodeRes.writeHead(status, writeHeaders);
	else nodeRes.writeHead(status, statusText, writeHeaders);
}
function endNodeResponse(nodeRes) {
	return new Promise((resolve) => nodeRes.end(resolve));
}
function streamBody(stream, nodeRes) {
	if (nodeRes.destroyed) {
		stream.cancel();
		return;
	}
	const reader = stream.getReader();
	function streamCancel(error) {
		reader.cancel(error).catch(() => {});
		if (error) nodeRes.destroy(error);
	}
	function streamHandle({ done, value }) {
		try {
			if (done) nodeRes.end();
			else if (nodeRes.write(value)) reader.read().then(streamHandle, streamCancel);
			else nodeRes.once("drain", () => reader.read().then(streamHandle, streamCancel));
		} catch (error) {
			streamCancel(error instanceof Error ? error : void 0);
		}
	}
	nodeRes.on("close", streamCancel);
	nodeRes.on("error", streamCancel);
	reader.read().then(streamHandle, streamCancel);
	return reader.closed.catch(streamCancel).finally(() => {
		nodeRes.off("close", streamCancel);
		nodeRes.off("error", streamCancel);
	});
}

//#endregion
//#region src/adapters/_node/url.ts
var NodeRequestURL = class extends FastURL {
	#req;
	constructor({ req }) {
		const path = req.url || "/";
		if (path[0] === "/") {
			const qIndex = path.indexOf("?");
			const pathname = qIndex === -1 ? path : path?.slice(0, qIndex) || "/";
			const search = qIndex === -1 ? "" : path?.slice(qIndex) || "";
			const host = req.headers.host || req.headers[":authority"] || `${req.socket.localFamily === "IPv6" ? "[" + req.socket.localAddress + "]" : req.socket.localAddress}:${req.socket?.localPort || "80"}`;
			const protocol = req.socket?.encrypted || req.headers["x-forwarded-proto"] === "https" || req.headers[":scheme"] === "https" ? "https:" : "http:";
			super({
				protocol,
				host,
				pathname,
				search
			});
		} else super(path);
		this.#req = req;
	}
	get pathname() {
		return super.pathname;
	}
	set pathname(value) {
		this._url.pathname = value;
		this.#req.url = this._url.pathname + this._url.search;
	}
};

//#endregion
//#region src/adapters/_node/headers.ts
const NodeRequestHeaders = /* @__PURE__ */ (() => {
	const NativeHeaders = globalThis.Headers;
	class Headers {
		#req;
		#headers;
		constructor(req) {
			this.#req = req;
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeHeaders;
		}
		get _headers() {
			if (!this.#headers) {
				const headers = new NativeHeaders();
				const rawHeaders = this.#req.rawHeaders;
				const len = rawHeaders.length;
				for (let i = 0; i < len; i += 2) {
					const key = rawHeaders[i];
					if (key.charCodeAt(0) === 58) continue;
					const value = rawHeaders[i + 1];
					headers.append(key, value);
				}
				this.#headers = headers;
			}
			return this.#headers;
		}
		get(name) {
			if (this.#headers) return this.#headers.get(name);
			const value = this.#req.headers[name.toLowerCase()];
			return Array.isArray(value) ? value.join(", ") : value || null;
		}
		has(name) {
			if (this.#headers) return this.#headers.has(name);
			return name.toLowerCase() in this.#req.headers;
		}
		getSetCookie() {
			if (this.#headers) return this.#headers.getSetCookie();
			const value = this.#req.headers["set-cookie"];
			return Array.isArray(value) ? value : value ? [value] : [];
		}
		*_entries() {
			const rawHeaders = this.#req.rawHeaders;
			const len = rawHeaders.length;
			for (let i = 0; i < len; i += 2) {
				const key = rawHeaders[i];
				if (key.charCodeAt(0) === 58) continue;
				yield [key.toLowerCase(), rawHeaders[i + 1]];
			}
		}
		entries() {
			return this.#headers ? this.#headers.entries() : this._entries();
		}
		[Symbol.iterator]() {
			return this.entries();
		}
	}
	lazyInherit(Headers.prototype, NativeHeaders.prototype, "_headers");
	Object.setPrototypeOf(Headers, NativeHeaders);
	Object.setPrototypeOf(Headers.prototype, NativeHeaders.prototype);
	return Headers;
})();

//#endregion
//#region src/adapters/_node/request.ts
const NodeRequest = /* @__PURE__ */ (() => {
	const NativeRequest = globalThis[Symbol.for("srvx.nativeRequest")] ??= globalThis.Request;
	const PatchedRequest = class Request$1 extends NativeRequest {
		static _srvx = true;
		static [Symbol.hasInstance](instance) {
			if (this === PatchedRequest) return instance instanceof NativeRequest;
			else return Object.prototype.isPrototypeOf.call(this.prototype, instance);
		}
		constructor(input, options) {
			if (typeof input === "object" && "_request" in input) input = input._request;
			if ((options?.body)?.getReader !== void 0) options.duplex ??= "half";
			super(input, options);
		}
	};
	if (!globalThis.Request._srvx) globalThis.Request = PatchedRequest;
	class Request {
		runtime;
		#req;
		#url;
		#bodyStream;
		#request;
		#headers;
		#abortController;
		constructor(ctx) {
			this.#req = ctx.req;
			this.runtime = {
				name: "node",
				node: ctx
			};
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeRequest;
		}
		get ip() {
			return this.#req.socket?.remoteAddress;
		}
		get method() {
			if (this.#request) return this.#request.method;
			return this.#req.method || "GET";
		}
		get _url() {
			return this.#url ||= new NodeRequestURL({ req: this.#req });
		}
		set _url(url) {
			this.#url = url;
		}
		get url() {
			if (this.#request) return this.#request.url;
			return this._url.href;
		}
		get headers() {
			if (this.#request) return this.#request.headers;
			return this.#headers ||= new NodeRequestHeaders(this.#req);
		}
		get _abortController() {
			if (!this.#abortController) {
				this.#abortController = new AbortController();
				const { req, res } = this.runtime.node;
				const abortController = this.#abortController;
				const abort = (err) => abortController.abort?.(err);
				req.once("error", abort);
				if (res) res.once("close", () => {
					const reqError = req.errored;
					if (reqError) abort(reqError);
					else if (!res.writableEnded) abort();
				});
				else req.once("close", () => {
					if (!req.complete) abort();
				});
			}
			return this.#abortController;
		}
		get signal() {
			return this.#request ? this.#request.signal : this._abortController.signal;
		}
		get body() {
			if (this.#request) return this.#request.body;
			if (this.#bodyStream === void 0) {
				const method = this.method;
				this.#bodyStream = !(method === "GET" || method === "HEAD") ? Readable.toWeb(this.#req) : null;
			}
			return this.#bodyStream;
		}
		text() {
			if (this.#request) return this.#request.text();
			if (this.#bodyStream !== void 0) return this.#bodyStream ? new Response(this.#bodyStream).text() : Promise.resolve("");
			return readBody(this.#req).then((buf) => buf.toString());
		}
		json() {
			if (this.#request) return this.#request.json();
			return this.text().then((text) => JSON.parse(text));
		}
		get _request() {
			if (!this.#request) {
				this.#request = new PatchedRequest(this.url, {
					method: this.method,
					headers: this.headers,
					body: this.body,
					signal: this._abortController.signal
				});
				this.#headers = void 0;
				this.#bodyStream = void 0;
			}
			return this.#request;
		}
	}
	lazyInherit(Request.prototype, NativeRequest.prototype, "_request");
	Object.setPrototypeOf(Request.prototype, NativeRequest.prototype);
	return Request;
})();
function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		const onData = (chunk) => {
			chunks.push(chunk);
		};
		const onError = (err) => {
			reject(err);
		};
		const onEnd = () => {
			req.off("error", onError);
			req.off("data", onData);
			resolve(Buffer.concat(chunks));
		};
		req.on("data", onData).once("end", onEnd).once("error", onError);
	});
}

//#endregion
//#region src/adapters/_node/web/incoming.ts
var WebIncomingMessage = class extends IncomingMessage {
	constructor(req, socket) {
		super(socket);
		this.method = req.method;
		const url = req._url ??= new FastURL(req.url);
		this.url = url.pathname + url.search;
		for (const [key, value] of req.headers.entries()) this.headers[key.toLowerCase()] = value;
		if (req.method !== "GET" && req.method !== "HEAD" && !this.headers["content-length"] && !this.headers["transfer-encoding"]) this.headers["transfer-encoding"] = "chunked";
		const onData = (chunk) => {
			this.push(chunk);
		};
		socket.on("data", onData);
		socket.once("end", () => {
			this.emit("end");
			this.off("data", onData);
		});
	}
};

//#endregion
//#region src/adapters/_node/web/socket.ts
/**
* Events:
* - Readable (req from client): readable => data => end (push(null)) => error => close
* - Writable (res to client): pipe => unpipe => drain => finish (end called) => error => close
*/
var WebRequestSocket = class extends Duplex {
	_httpMessage;
	autoSelectFamilyAttemptedAddresses = [];
	bufferSize = 0;
	bytesRead = 0;
	bytesWritten = 0;
	connecting = false;
	pending = false;
	readyState = "open";
	remoteAddress = "";
	remoteFamily = "";
	remotePort = 0;
	#request;
	#timeoutTimer;
	#reqReader;
	#headersWritten;
	#_writeBody;
	_webResBody;
	constructor(request) {
		super({
			signal: request.signal,
			allowHalfOpen: true
		});
		this.#request = request;
		this._webResBody = new ReadableStream({ start: (controller) => {
			this.#_writeBody = controller.enqueue.bind(controller);
			this.once("finish", () => {
				this.readyState = "closed";
				controller.close();
			});
		} });
	}
	setTimeout(ms, cb) {
		if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return this;
		if (cb) this.on("timeout", cb);
		if (this.#timeoutTimer) clearTimeout(this.#timeoutTimer);
		if (ms > 0) this.#timeoutTimer = setTimeout(() => this.emit("timeout"), ms);
		return this;
	}
	setNoDelay() {
		return this;
	}
	setKeepAlive() {
		return this;
	}
	ref() {
		return this;
	}
	unref() {
		return this;
	}
	destroySoon() {
		this.destroy();
	}
	connect() {
		return this;
	}
	resetAndDestroy() {
		this.destroy();
		return this;
	}
	address() {
		return {
			address: "",
			family: "",
			port: 0
		};
	}
	_read(_size) {
		const reader = this.#reqReader ??= this.#request.body?.getReader();
		if (!reader) {
			this.push(null);
			return;
		}
		reader.read().then((res) => this._onRead(res)).catch((error) => {
			this.emit("error", error);
		});
	}
	_onRead(res) {
		if (res.done) {
			this.push(null);
			return;
		}
		if (res.value) {
			this.bytesRead += res.value.byteLength;
			this.push(res.value);
		}
	}
	_write(chunk, encoding, callback) {
		if (this.#headersWritten) this.#_writeBody(typeof chunk === "string" ? Buffer.from(chunk, encoding) : chunk);
		else if (chunk?.length > 0) {
			this.#headersWritten = true;
			const headerEnd = chunk.lastIndexOf("\r\n\r\n");
			if (headerEnd === -1) throw new Error("Invalid HTTP headers chunk!");
			if (headerEnd < chunk.length - 4) {
				this._write(chunk.slice(headerEnd + 4), encoding, () => {
					callback(null);
				});
				return;
			}
		}
		callback(null);
	}
	_final(callback) {
		callback(null);
	}
	_destroy(err, cb) {
		if (this.#timeoutTimer) clearTimeout(this.#timeoutTimer);
		if (this.#reqReader) this.#reqReader.cancel().catch((error) => {
			console.error(error);
		});
		this.readyState = "closed";
		cb(err ?? void 0);
	}
};

//#endregion
//#region src/adapters/_node/web/response.ts
var WebServerResponse = class extends ServerResponse {
	#socket;
	constructor(req, socket) {
		super(req);
		this.assignSocket(socket);
		this.once("finish", () => {
			socket.end();
		});
		this.#socket = socket;
		this.waitToFinish = this.waitToFinish.bind(this);
		this.toWebResponse = this.toWebResponse.bind(this);
	}
	waitToFinish() {
		if (this.writableEnded) return Promise.resolve();
		return new Promise((resolve, reject) => {
			this.on("finish", () => resolve());
			this.on("error", (err) => reject(err));
		});
	}
	async toWebResponse() {
		await this.waitToFinish();
		const headers = [];
		const httpHeader = this._header?.split("\r\n");
		for (let i = 1; httpHeader && i < httpHeader.length; i++) {
			const sepIndex = httpHeader[i].indexOf(": ");
			if (sepIndex === -1) continue;
			const key = httpHeader[i].slice(0, Math.max(0, sepIndex));
			const value = httpHeader[i].slice(Math.max(0, sepIndex + 2));
			if (!key) continue;
			headers.push([key, value]);
		}
		return new Response(this.#socket._webResBody, {
			status: this.statusCode,
			statusText: this.statusMessage,
			headers
		});
	}
};

//#endregion
//#region src/adapters/_node/web/fetch.ts
/**
* Calls a Node.js HTTP Request handler with a Fetch API Request object and returns a Response object.
*
* If the web Request contains an existing Node.js req/res pair (indicating it originated from a Node.js server from srvx/node), it will be called directly.
*
* Otherwise, new Node.js IncomingMessage and ServerResponse objects are created and linked to a custom Duplex stream that bridges the Fetch API streams with Node.js streams.
*
* The handler is invoked with these objects, and the response is constructed from the ServerResponse once it is finished.
*
* @experimental Behavior might be unstable.
*/
async function fetchNodeHandler(handler, req) {
	const nodeRuntime = req.runtime?.node;
	if (nodeRuntime && nodeRuntime.req && nodeRuntime.res) return await callNodeHandler(handler, req);
	const socket = new WebRequestSocket(req);
	const nodeReq = new WebIncomingMessage(req, socket);
	const nodeRes = new WebServerResponse(nodeReq, socket);
	try {
		await handler(nodeReq, nodeRes);
		return await nodeRes.toWebResponse();
	} catch (error) {
		console.error(error, { cause: {
			req,
			handler
		} });
		return new Response(null, {
			status: 500,
			statusText: "Internal Server Error"
		});
	}
}
/**
* Converts a Node.js HTTP handler into a Fetch API handler.
*
* @experimental Behavior might be unstable and won't work in Bun and Deno currently (tracker: https://github.com/h3js/srvx/issues/132)
*/
function toFetchHandler(handler) {
	if (handler.__fetchHandler) return handler.__fetchHandler;
	function convertedNodeHandler(req) {
		return fetchNodeHandler(handler, req);
	}
	convertedNodeHandler.__nodeHandler = handler;
	assignFnName(convertedNodeHandler, handler, " (converted to Web handler)");
	return convertedNodeHandler;
}
function assignFnName(target, source, suffix) {
	if (source.name) try {
		Object.defineProperty(target, "name", { value: `${source.name}${suffix}` });
	} catch {}
}

//#endregion
//#region src/adapters/node.ts
function serve(options) {
	return new NodeServer(options);
}
var NodeServer = class {
	runtime = "node";
	options;
	node;
	serveOptions;
	fetch;
	#isSecure;
	#listeningPromise;
	#wait;
	constructor(options) {
		this.options = {
			...options,
			middleware: [...options.middleware || []]
		};
		for (const plugin of options.plugins || []) plugin(this);
		errorPlugin(this);
		gracefulShutdownPlugin(this);
		const fetchHandler = this.fetch = wrapFetch(this);
		this.#wait = createWaitUntil();
		const handler = (nodeReq, nodeRes) => {
			const request = new NodeRequest({
				req: nodeReq,
				res: nodeRes
			});
			request.waitUntil = this.#wait.waitUntil;
			const res = fetchHandler(request);
			return res instanceof Promise ? res.then((resolvedRes) => sendNodeResponse(nodeRes, resolvedRes)) : sendNodeResponse(nodeRes, res);
		};
		const tls = resolveTLSOptions(this.options);
		const { port, hostname: host } = resolvePortAndHost(this.options);
		this.serveOptions = {
			port,
			host,
			exclusive: !this.options.reusePort,
			...tls ? {
				cert: tls.cert,
				key: tls.key,
				passphrase: tls.passphrase
			} : {},
			...this.options.node
		};
		let server;
		this.#isSecure = !!this.serveOptions.cert && this.options.protocol !== "http";
		if (this.options.node?.http2 ?? this.#isSecure) if (this.#isSecure) server = nodeHTTP2.createSecureServer({
			allowHTTP1: true,
			...this.serveOptions
		}, handler);
		else throw new Error("node.http2 option requires tls certificate!");
		else if (this.#isSecure) server = nodeHTTPS.createServer(this.serveOptions, handler);
		else server = require$$0.createServer(this.serveOptions, handler);
		this.node = {
			server,
			handler
		};
		if (!options.manual) this.serve();
	}
	serve() {
		if (this.#listeningPromise) return Promise.resolve(this.#listeningPromise).then(() => this);
		this.#listeningPromise = new Promise((resolve) => {
			this.node.server.listen(this.serveOptions, () => {
				printListening(this.options, this.url);
				resolve();
			});
		});
	}
	get url() {
		const addr = this.node?.server?.address();
		if (!addr) return;
		return typeof addr === "string" ? addr : fmtURL(addr.address, addr.port, this.#isSecure);
	}
	ready() {
		return Promise.resolve(this.#listeningPromise).then(() => this);
	}
	async close(closeAll) {
		await Promise.all([this.#wait.wait(), new Promise((resolve, reject) => {
			const server = this.node?.server;
			if (!server) return resolve();
			if (closeAll && "closeAllConnections" in server) server.closeAllConnections();
			server.close((error) => error ? reject(error) : resolve());
		})]);
	}
};

const NullProtoObj = /* @__PURE__ */ (() => {
	const e = function() {};
	return e.prototype = Object.create(null), Object.freeze(e.prototype), e;
})();

const kEventNS = "h3.internal.event.";
const kEventRes = /* @__PURE__ */ Symbol.for(`${kEventNS}res`);
const kEventResHeaders = /* @__PURE__ */ Symbol.for(`${kEventNS}res.headers`);
var H3Event = class {
	
	app;
	
	req;
	
	url;
	
	context;
	
	static __is_event__ = true;
	constructor(req, context, app) {
		this.context = context || req.context || new NullProtoObj();
		this.req = req;
		this.app = app;
		const _url = req._url;
		this.url = _url && _url instanceof URL ? _url : new FastURL(req.url);
	}
	
	get res() {
		return this[kEventRes] ||= new H3EventResponse();
	}
	
	get runtime() {
		return this.req.runtime;
	}
	
	waitUntil(promise) {
		this.req.waitUntil?.(promise);
	}
	toString() {
		return `[${this.req.method}] ${this.req.url}`;
	}
	toJSON() {
		return this.toString();
	}
	
	get node() {
		return this.req.runtime?.node;
	}
	
	get headers() {
		return this.req.headers;
	}
	
	get path() {
		return this.url.pathname + this.url.search;
	}
	
	get method() {
		return this.req.method;
	}
};
var H3EventResponse = class {
	status;
	statusText;
	get headers() {
		return this[kEventResHeaders] ||= new Headers();
	}
};

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;

function sanitizeStatusMessage(statusMessage = "") {
	return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}

function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
	if (!statusCode) return defaultStatusCode;
	if (typeof statusCode === "string") statusCode = +statusCode;
	if (statusCode < 100 || statusCode > 599) return defaultStatusCode;
	return statusCode;
}


var HTTPError = class HTTPError extends Error {
	get name() {
		return "HTTPError";
	}
	
	status;
	
	statusText;
	
	headers;
	
	cause;
	
	data;
	
	body;
	
	unhandled;
	
	static isError(input) {
		return input instanceof Error && input?.name === "HTTPError";
	}
	
	static status(status, statusText, details) {
		return new HTTPError({
			...details,
			statusText,
			status
		});
	}
	constructor(arg1, arg2) {
		let messageInput;
		let details;
		if (typeof arg1 === "string") {
			messageInput = arg1;
			details = arg2;
		} else details = arg1;
		const status = sanitizeStatusCode(details?.status || (details?.cause)?.status || details?.status || details?.statusCode, 500);
		const statusText = sanitizeStatusMessage(details?.statusText || (details?.cause)?.statusText || details?.statusText || details?.statusMessage);
		const message = messageInput || details?.message || (details?.cause)?.message || details?.statusText || details?.statusMessage || [
			"HTTPError",
			status,
			statusText
		].filter(Boolean).join(" ");
		super(message, { cause: details });
		this.cause = details;
		Error.captureStackTrace?.(this, this.constructor);
		this.status = status;
		this.statusText = statusText || void 0;
		const rawHeaders = details?.headers || (details?.cause)?.headers;
		this.headers = rawHeaders ? new Headers(rawHeaders) : void 0;
		this.unhandled = details?.unhandled ?? (details?.cause)?.unhandled ?? void 0;
		this.data = details?.data;
		this.body = details?.body;
	}
	
	get statusCode() {
		return this.status;
	}
	
	get statusMessage() {
		return this.statusText;
	}
	toJSON() {
		const unhandled = this.unhandled;
		return {
			status: this.status,
			statusText: this.statusText,
			unhandled,
			message: unhandled ? "HTTPError" : this.message,
			data: unhandled ? void 0 : this.data,
			...unhandled ? void 0 : this.body
		};
	}
};
function isJSONSerializable(value, _type) {
	if (value === null || value === void 0) return true;
	if (_type !== "object") return _type === "boolean" || _type === "number" || _type === "string";
	if (typeof value.toJSON === "function") return true;
	if (Array.isArray(value)) return true;
	if (typeof value.pipe === "function" || typeof value.pipeTo === "function") return false;
	if (value instanceof NullProtoObj) return true;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

const kNotFound = /* @__PURE__ */ Symbol.for("h3.notFound");
const kHandled = /* @__PURE__ */ Symbol.for("h3.handled");
function toResponse(val, event, config = {}) {
	if (typeof val?.then === "function") return (val.catch?.((error) => error) || Promise.resolve(val)).then((resolvedVal) => toResponse(resolvedVal, event, config));
	const response = prepareResponse(val, event, config);
	if (typeof response?.then === "function") return toResponse(response, event, config);
	const { onResponse: onResponse$1 } = config;
	return onResponse$1 ? Promise.resolve(onResponse$1(response, event)).then(() => response) : response;
}
var HTTPResponse = class {
	#headers;
	#init;
	body;
	constructor(body, init) {
		this.body = body;
		this.#init = init;
	}
	get status() {
		return this.#init?.status || 200;
	}
	get statusText() {
		return this.#init?.statusText || "OK";
	}
	get headers() {
		return this.#headers ||= new Headers(this.#init?.headers);
	}
};
function prepareResponse(val, event, config, nested) {
	if (val === kHandled) return new NodeResponse(null);
	if (val === kNotFound) val = new HTTPError({
		status: 404,
		message: `Cannot find any route matching [${event.req.method}] ${event.url}`
	});
	if (val && val instanceof Error) {
		const isHTTPError = HTTPError.isError(val);
		const error = isHTTPError ? val : new HTTPError(val);
		if (!isHTTPError) {
			error.unhandled = true;
			if (val?.stack) error.stack = val.stack;
		}
		if (error.unhandled && !config.silent) console.error(error);
		const { onError: onError$1 } = config;
		return onError$1 && !nested ? Promise.resolve(onError$1(error, event)).catch((error$1) => error$1).then((newVal) => prepareResponse(newVal ?? val, event, config, true)) : errorResponse(error, config.debug);
	}
	const preparedRes = event[kEventRes];
	const preparedHeaders = preparedRes?.[kEventResHeaders];
	if (!(val instanceof Response)) {
		const res = prepareResponseBody(val, event, config);
		const status = res.status || preparedRes?.status;
		return new NodeResponse(nullBody(event.req.method, status) ? null : res.body, {
			status,
			statusText: res.statusText || preparedRes?.statusText,
			headers: res.headers && preparedHeaders ? mergeHeaders$1(res.headers, preparedHeaders) : res.headers || preparedHeaders
		});
	}
	if (!preparedHeaders || nested || !val.ok) return val;
	try {
		mergeHeaders$1(val.headers, preparedHeaders, val.headers);
		return val;
	} catch {
		return new NodeResponse(nullBody(event.req.method, val.status) ? null : val.body, {
			status: val.status,
			statusText: val.statusText,
			headers: mergeHeaders$1(val.headers, preparedHeaders)
		});
	}
}
function mergeHeaders$1(base, overrides, target = new Headers(base)) {
	for (const [name, value] of overrides) if (name === "set-cookie") target.append(name, value);
	else target.set(name, value);
	return target;
}
const frozenHeaders = () => {
	throw new Error("Headers are frozen");
};
var FrozenHeaders = class extends Headers {
	constructor(init) {
		super(init);
		this.set = this.append = this.delete = frozenHeaders;
	}
};
const emptyHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-length": "0" });
const jsonHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-type": "application/json;charset=UTF-8" });
function prepareResponseBody(val, event, config) {
	if (val === null || val === void 0) return {
		body: "",
		headers: emptyHeaders
	};
	const valType = typeof val;
	if (valType === "string") return { body: val };
	if (val instanceof Uint8Array) {
		event.res.headers.set("content-length", val.byteLength.toString());
		return { body: val };
	}
	if (val instanceof HTTPResponse || val?.constructor?.name === "HTTPResponse") return val;
	if (isJSONSerializable(val, valType)) return {
		body: JSON.stringify(val, void 0, config.debug ? 2 : void 0),
		headers: jsonHeaders
	};
	if (valType === "bigint") return {
		body: val.toString(),
		headers: jsonHeaders
	};
	if (val instanceof Blob) {
		const headers = new Headers({
			"content-type": val.type,
			"content-length": val.size.toString()
		});
		let filename = val.name;
		if (filename) {
			filename = encodeURIComponent(filename);
			headers.set("content-disposition", `filename="${filename}"; filename*=UTF-8''${filename}`);
		}
		return {
			body: val.stream(),
			headers
		};
	}
	if (valType === "symbol") return { body: val.toString() };
	if (valType === "function") return { body: `${val.name}()` };
	return { body: val };
}
function nullBody(method, status) {
	return method === "HEAD" || status === 100 || status === 101 || status === 102 || status === 204 || status === 205 || status === 304;
}
function errorResponse(error, debug) {
	return new NodeResponse(JSON.stringify({
		...error.toJSON(),
		stack: debug && error.stack ? error.stack.split("\n").map((l) => l.trim()) : void 0
	}, void 0, debug ? 2 : void 0), {
		status: error.status,
		statusText: error.statusText,
		headers: error.headers ? mergeHeaders$1(jsonHeaders, error.headers) : new Headers(jsonHeaders)
	});
}
function callMiddleware(event, middleware, handler, index = 0) {
	if (index === middleware.length) return handler(event);
	const fn = middleware[index];
	let nextCalled;
	let nextResult;
	const next = () => {
		if (nextCalled) return nextResult;
		nextCalled = true;
		nextResult = callMiddleware(event, middleware, handler, index + 1);
		return nextResult;
	};
	const ret = fn(event, next);
	return isUnhandledResponse(ret) ? next() : typeof ret?.then === "function" ? ret.then((resolved) => isUnhandledResponse(resolved) ? next() : resolved) : ret;
}
function isUnhandledResponse(val) {
	return val === void 0 || val === kNotFound;
}

function defineHandler(input) {
	if (typeof input === "function") return handlerWithFetch(input);
	const handler = input.handler || (input.fetch ? function _fetchHandler(event) {
		return input.fetch(event.req);
	} : NoHandler);
	return Object.assign(handlerWithFetch(input.middleware?.length ? function _handlerMiddleware(event) {
		return callMiddleware(event, input.middleware, handler);
	} : handler), input);
}
function handlerWithFetch(handler) {
	if ("fetch" in handler) return handler;
	return Object.assign(handler, { fetch: (req) => {
		if (typeof req === "string") req = new URL(req, "http://_");
		if (req instanceof URL) req = new Request(req);
		const event = new H3Event(req);
		try {
			return Promise.resolve(toResponse(handler(event), event));
		} catch (error) {
			return Promise.resolve(toResponse(error, event));
		}
	} });
}
function toEventHandler(handler) {
	if (typeof handler === "function") return handler;
	if (typeof handler?.handler === "function") return handler.handler;
	if (typeof handler?.fetch === "function") return function _fetchHandler(event) {
		return handler.fetch(event.req);
	};
}

const NoHandler = () => kNotFound;
var H3Core = class {
	config;
	"~middleware";
	"~routes" = [];
	constructor(config = {}) {
		this["~middleware"] = [];
		this.config = config;
		this.fetch = this.fetch.bind(this);
		this.handler = this.handler.bind(this);
	}
	fetch(request) {
		return this["~request"](request);
	}
	handler(event) {
		const route = this["~findRoute"](event);
		if (route) {
			event.context.params = route.params;
			event.context.matchedRoute = route.data;
		}
		const routeHandler = route?.data.handler || NoHandler;
		const middleware = this["~getMiddleware"](event, route);
		return middleware.length > 0 ? callMiddleware(event, middleware, routeHandler) : routeHandler(event);
	}
	"~request"(request, context) {
		const event = new H3Event(request, context, this);
		let handlerRes;
		try {
			if (this.config.onRequest) {
				const hookRes = this.config.onRequest(event);
				handlerRes = typeof hookRes?.then === "function" ? hookRes.then(() => this.handler(event)) : this.handler(event);
			} else handlerRes = this.handler(event);
		} catch (error) {
			handlerRes = Promise.reject(error);
		}
		return toResponse(handlerRes, event, this.config);
	}
	"~findRoute"(_event) {}
	"~addRoute"(_route) {
		this["~routes"].push(_route);
	}
	"~getMiddleware"(_event, route) {
		const routeMiddleware = route?.data.middleware;
		const globalMiddleware = this["~middleware"];
		return routeMiddleware ? [...globalMiddleware, ...routeMiddleware] : globalMiddleware;
	}
};

const errorHandler$2 = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event, opts) {
	const isSensitive = error.unhandled;
	const status = error.status || 500;
	const url = event.url || new URL(event.req.url);
	if (status === 404) {
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
			const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
			return {
				status: 302,
				statusText: "Found",
				headers: { location: redirectTo },
				body: `Redirecting...`
			};
		}
	}
	// Console output
	if (isSensitive && !opts?.silent) {
		// prettier-ignore
		const tags = [error.unhandled && "[unhandled]"].filter(Boolean).join(" ");
		console.error(`[request error] ${tags} [${event.req.method}] ${url}\n`, error);
	}
	// Send response
	const headers = {
		"content-type": "application/json",
		"x-content-type-options": "nosniff",
		"x-frame-options": "DENY",
		"referrer-policy": "no-referrer",
		"content-security-policy": "script-src 'none'; frame-ancestors 'none';"
	};
	if (status === 404 || !event.res.headers.has("cache-control")) {
		headers["cache-control"] = "no-cache";
	}
	const body = {
		error: true,
		url: url.href,
		status,
		statusText: error.statusText,
		message: isSensitive ? "Server Error" : error.message,
		data: isSensitive ? undefined : error.data
	};
	return {
		status,
		statusText: error.statusText,
		headers,
		body
	};
}

const errorHandlers = [errorHandler$2];

async function errorHandler$1(error, event) {
  for (const handler of errorHandlers) {
    try {
      const response = await handler(error, event, { defaultHandler });
      if (response) {
        return response;
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

const ENC_SLASH_RE = /%2f/gi;
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode(text.replace(ENC_SLASH_RE, "%252F"));
}
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/");
  }
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/") ? input : input + "/";
  }
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}

var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}

var fastify$1 = {exports: {}};

var symbols;
var hasRequiredSymbols;

function requireSymbols () {
	if (hasRequiredSymbols) return symbols;
	hasRequiredSymbols = 1;

	const keys = {
	  kAvvioBoot: Symbol('fastify.avvioBoot'),
	  kChildren: Symbol('fastify.children'),
	  kServerBindings: Symbol('fastify.serverBindings'),
	  kBodyLimit: Symbol('fastify.bodyLimit'),
	  kSupportedHTTPMethods: Symbol('fastify.acceptedHTTPMethods'),
	  kRoutePrefix: Symbol('fastify.routePrefix'),
	  kLogLevel: Symbol('fastify.logLevel'),
	  kLogSerializers: Symbol('fastify.logSerializers'),
	  kHooks: Symbol('fastify.hooks'),
	  kContentTypeParser: Symbol('fastify.contentTypeParser'),
	  kState: Symbol('fastify.state'),
	  kOptions: Symbol('fastify.options'),
	  kDisableRequestLogging: Symbol('fastify.disableRequestLogging'),
	  kPluginNameChain: Symbol('fastify.pluginNameChain'),
	  kRouteContext: Symbol('fastify.context'),
	  kGenReqId: Symbol('fastify.genReqId'),
	  // Schema
	  kSchemaController: Symbol('fastify.schemaController'),
	  kSchemaHeaders: Symbol('headers-schema'),
	  kSchemaParams: Symbol('params-schema'),
	  kSchemaQuerystring: Symbol('querystring-schema'),
	  kSchemaBody: Symbol('body-schema'),
	  kSchemaResponse: Symbol('response-schema'),
	  kSchemaErrorFormatter: Symbol('fastify.schemaErrorFormatter'),
	  kSchemaVisited: Symbol('fastify.schemas.visited'),
	  // Request
	  kRequest: Symbol('fastify.Request'),
	  kRequestPayloadStream: Symbol('fastify.RequestPayloadStream'),
	  kRequestAcceptVersion: Symbol('fastify.RequestAcceptVersion'),
	  kRequestCacheValidateFns: Symbol('fastify.request.cache.validateFns'),
	  kRequestOriginalUrl: Symbol('fastify.request.originalUrl'),
	  // 404
	  kFourOhFour: Symbol('fastify.404'),
	  kCanSetNotFoundHandler: Symbol('fastify.canSetNotFoundHandler'),
	  kFourOhFourLevelInstance: Symbol('fastify.404LogLevelInstance'),
	  kFourOhFourContext: Symbol('fastify.404ContextKey'),
	  kDefaultJsonParse: Symbol('fastify.defaultJSONParse'),
	  // Reply
	  kReply: Symbol('fastify.Reply'),
	  kReplySerializer: Symbol('fastify.reply.serializer'),
	  kReplyIsError: Symbol('fastify.reply.isError'),
	  kReplyHeaders: Symbol('fastify.reply.headers'),
	  kReplyTrailers: Symbol('fastify.reply.trailers'),
	  kReplyHasStatusCode: Symbol('fastify.reply.hasStatusCode'),
	  kReplyHijacked: Symbol('fastify.reply.hijacked'),
	  kReplyStartTime: Symbol('fastify.reply.startTime'),
	  kReplyNextErrorHandler: Symbol('fastify.reply.nextErrorHandler'),
	  kReplyEndTime: Symbol('fastify.reply.endTime'),
	  kReplyErrorHandlerCalled: Symbol('fastify.reply.errorHandlerCalled'),
	  kReplyIsRunningOnErrorHook: Symbol('fastify.reply.isRunningOnErrorHook'),
	  kReplySerializerDefault: Symbol('fastify.replySerializerDefault'),
	  kReplyCacheSerializeFns: Symbol('fastify.reply.cache.serializeFns'),
	  // This symbol is only meant to be used for fastify tests and should not be used for any other purpose
	  kTestInternals: Symbol('fastify.testInternals'),
	  kErrorHandler: Symbol('fastify.errorHandler'),
	  kChildLoggerFactory: Symbol('fastify.childLoggerFactory'),
	  kHasBeenDecorated: Symbol('fastify.hasBeenDecorated'),
	  kKeepAliveConnections: Symbol('fastify.keepAliveConnections'),
	  kRouteByFastify: Symbol('fastify.routeByFastify')
	};

	symbols = keys;
	return symbols;
}

var server = {};

var errors = {exports: {}};

var hasRequiredErrors;

function requireErrors () {
	if (hasRequiredErrors) return errors.exports;
	hasRequiredErrors = 1;

	const createError = require$$0$1;

	const codes = {
	  /**
	   * Basic
	   */
	  FST_ERR_NOT_FOUND: createError(
	    'FST_ERR_NOT_FOUND',
	    'Not Found',
	    404
	  ),
	  FST_ERR_OPTIONS_NOT_OBJ: createError(
	    'FST_ERR_OPTIONS_NOT_OBJ',
	    'Options must be an object',
	    500,
	    TypeError
	  ),
	  FST_ERR_QSP_NOT_FN: createError(
	    'FST_ERR_QSP_NOT_FN',
	    "querystringParser option should be a function, instead got '%s'",
	    500,
	    TypeError
	  ),
	  FST_ERR_SCHEMA_CONTROLLER_BUCKET_OPT_NOT_FN: createError(
	    'FST_ERR_SCHEMA_CONTROLLER_BUCKET_OPT_NOT_FN',
	    "schemaController.bucket option should be a function, instead got '%s'",
	    500,
	    TypeError
	  ),
	  FST_ERR_SCHEMA_ERROR_FORMATTER_NOT_FN: createError(
	    'FST_ERR_SCHEMA_ERROR_FORMATTER_NOT_FN',
	    "schemaErrorFormatter option should be a non async function. Instead got '%s'.",
	    500,
	    TypeError
	  ),
	  FST_ERR_AJV_CUSTOM_OPTIONS_OPT_NOT_OBJ: createError(
	    'FST_ERR_AJV_CUSTOM_OPTIONS_OPT_NOT_OBJ',
	    "ajv.customOptions option should be an object, instead got '%s'",
	    500,
	    TypeError
	  ),
	  FST_ERR_AJV_CUSTOM_OPTIONS_OPT_NOT_ARR: createError(
	    'FST_ERR_AJV_CUSTOM_OPTIONS_OPT_NOT_ARR',
	    "ajv.plugins option should be an array, instead got '%s'",
	    500,
	    TypeError
	  ),
	  FST_ERR_VALIDATION: createError(
	    'FST_ERR_VALIDATION',
	    '%s',
	    400
	  ),
	  FST_ERR_LISTEN_OPTIONS_INVALID: createError(
	    'FST_ERR_LISTEN_OPTIONS_INVALID',
	    "Invalid listen options: '%s'",
	    500,
	    TypeError
	  ),
	  FST_ERR_ERROR_HANDLER_NOT_FN: createError(
	    'FST_ERR_ERROR_HANDLER_NOT_FN',
	    'Error Handler must be a function',
	    500,
	    TypeError
	  ),

	  /**
	   * ContentTypeParser
	  */
	  FST_ERR_CTP_ALREADY_PRESENT: createError(
	    'FST_ERR_CTP_ALREADY_PRESENT',
	    "Content type parser '%s' already present."
	  ),
	  FST_ERR_CTP_INVALID_TYPE: createError(
	    'FST_ERR_CTP_INVALID_TYPE',
	    'The content type should be a string or a RegExp',
	    500,
	    TypeError
	  ),
	  FST_ERR_CTP_EMPTY_TYPE: createError(
	    'FST_ERR_CTP_EMPTY_TYPE',
	    'The content type cannot be an empty string',
	    500,
	    TypeError
	  ),
	  FST_ERR_CTP_INVALID_HANDLER: createError(
	    'FST_ERR_CTP_INVALID_HANDLER',
	    'The content type handler should be a function',
	    500,
	    TypeError
	  ),
	  FST_ERR_CTP_INVALID_PARSE_TYPE: createError(
	    'FST_ERR_CTP_INVALID_PARSE_TYPE',
	    "The body parser can only parse your data as 'string' or 'buffer', you asked '%s' which is not supported.",
	    500,
	    TypeError
	  ),
	  FST_ERR_CTP_BODY_TOO_LARGE: createError(
	    'FST_ERR_CTP_BODY_TOO_LARGE',
	    'Request body is too large',
	    413,
	    RangeError
	  ),
	  FST_ERR_CTP_INVALID_MEDIA_TYPE: createError(
	    'FST_ERR_CTP_INVALID_MEDIA_TYPE',
	    'Unsupported Media Type: %s',
	    415
	  ),
	  FST_ERR_CTP_INVALID_CONTENT_LENGTH: createError(
	    'FST_ERR_CTP_INVALID_CONTENT_LENGTH',
	    'Request body size did not match Content-Length',
	    400,
	    RangeError
	  ),
	  FST_ERR_CTP_EMPTY_JSON_BODY: createError(
	    'FST_ERR_CTP_EMPTY_JSON_BODY',
	    "Body cannot be empty when content-type is set to 'application/json'",
	    400
	  ),
	  FST_ERR_CTP_INSTANCE_ALREADY_STARTED: createError(
	    'FST_ERR_CTP_INSTANCE_ALREADY_STARTED',
	    'Cannot call "%s" when fastify instance is already started!',
	    400
	  ),

	  /**
	   * decorate
	  */
	  FST_ERR_DEC_ALREADY_PRESENT: createError(
	    'FST_ERR_DEC_ALREADY_PRESENT',
	    "The decorator '%s' has already been added!"
	  ),
	  FST_ERR_DEC_DEPENDENCY_INVALID_TYPE: createError(
	    'FST_ERR_DEC_DEPENDENCY_INVALID_TYPE',
	    "The dependencies of decorator '%s' must be of type Array.",
	    500,
	    TypeError
	  ),
	  FST_ERR_DEC_MISSING_DEPENDENCY: createError(
	    'FST_ERR_DEC_MISSING_DEPENDENCY',
	    "The decorator is missing dependency '%s'."
	  ),
	  FST_ERR_DEC_AFTER_START: createError(
	    'FST_ERR_DEC_AFTER_START',
	    "The decorator '%s' has been added after start!"
	  ),
	  FST_ERR_DEC_REFERENCE_TYPE: createError(
	    'FST_ERR_DEC_REFERENCE_TYPE',
	    "The decorator '%s' of type '%s' is a reference type. Use the { getter, setter } interface instead."
	  ),

	  /**
	   * hooks
	  */
	  FST_ERR_HOOK_INVALID_TYPE: createError(
	    'FST_ERR_HOOK_INVALID_TYPE',
	    'The hook name must be a string',
	    500,
	    TypeError
	  ),
	  FST_ERR_HOOK_INVALID_HANDLER: createError(
	    'FST_ERR_HOOK_INVALID_HANDLER',
	    '%s hook should be a function, instead got %s',
	    500,
	    TypeError
	  ),
	  FST_ERR_HOOK_INVALID_ASYNC_HANDLER: createError(
	    'FST_ERR_HOOK_INVALID_ASYNC_HANDLER',
	    'Async function has too many arguments. Async hooks should not use the \'done\' argument.',
	    500,
	    TypeError
	  ),
	  FST_ERR_HOOK_NOT_SUPPORTED: createError(
	    'FST_ERR_HOOK_NOT_SUPPORTED',
	    '%s hook not supported!',
	    500,
	    TypeError
	  ),

	  /**
	   * Middlewares
	   */
	  FST_ERR_MISSING_MIDDLEWARE: createError(
	    'FST_ERR_MISSING_MIDDLEWARE',
	    'You must register a plugin for handling middlewares, visit fastify.dev/docs/latest/Reference/Middleware/ for more info.',
	    500
	  ),

	  FST_ERR_HOOK_TIMEOUT: createError(
	    'FST_ERR_HOOK_TIMEOUT',
	    "A callback for '%s' hook%s timed out. You may have forgotten to call 'done' function or to resolve a Promise"
	  ),

	  /**
	   * logger
	  */
	  FST_ERR_LOG_INVALID_DESTINATION: createError(
	    'FST_ERR_LOG_INVALID_DESTINATION',
	    'Cannot specify both logger.stream and logger.file options'
	  ),

	  FST_ERR_LOG_INVALID_LOGGER: createError(
	    'FST_ERR_LOG_INVALID_LOGGER',
	    "Invalid logger object provided. The logger instance should have these functions(s): '%s'.",
	    500,
	    TypeError
	  ),

	  FST_ERR_LOG_INVALID_LOGGER_INSTANCE: createError(
	    'FST_ERR_LOG_INVALID_LOGGER_INSTANCE',
	    'loggerInstance only accepts a logger instance.',
	    500,
	    TypeError
	  ),

	  FST_ERR_LOG_INVALID_LOGGER_CONFIG: createError(
	    'FST_ERR_LOG_INVALID_LOGGER_CONFIG',
	    'logger options only accepts a configuration object.',
	    500,
	    TypeError
	  ),

	  FST_ERR_LOG_LOGGER_AND_LOGGER_INSTANCE_PROVIDED: createError(
	    'FST_ERR_LOG_LOGGER_AND_LOGGER_INSTANCE_PROVIDED',
	    'You cannot provide both logger and loggerInstance. Please provide only one.',
	    500,
	    TypeError
	  ),

	  /**
	   * reply
	  */
	  FST_ERR_REP_INVALID_PAYLOAD_TYPE: createError(
	    'FST_ERR_REP_INVALID_PAYLOAD_TYPE',
	    "Attempted to send payload of invalid type '%s'. Expected a string or Buffer.",
	    500,
	    TypeError
	  ),
	  FST_ERR_REP_RESPONSE_BODY_CONSUMED: createError(
	    'FST_ERR_REP_RESPONSE_BODY_CONSUMED',
	    'Response.body is already consumed.'
	  ),
	  FST_ERR_REP_ALREADY_SENT: createError(
	    'FST_ERR_REP_ALREADY_SENT',
	    'Reply was already sent, did you forget to "return reply" in "%s" (%s)?'
	  ),
	  FST_ERR_REP_SENT_VALUE: createError(
	    'FST_ERR_REP_SENT_VALUE',
	    'The only possible value for reply.sent is true.',
	    500,
	    TypeError
	  ),
	  FST_ERR_SEND_INSIDE_ONERR: createError(
	    'FST_ERR_SEND_INSIDE_ONERR',
	    'You cannot use `send` inside the `onError` hook'
	  ),
	  FST_ERR_SEND_UNDEFINED_ERR: createError(
	    'FST_ERR_SEND_UNDEFINED_ERR',
	    'Undefined error has occurred'
	  ),
	  FST_ERR_BAD_STATUS_CODE: createError(
	    'FST_ERR_BAD_STATUS_CODE',
	    'Called reply with an invalid status code: %s'
	  ),
	  FST_ERR_BAD_TRAILER_NAME: createError(
	    'FST_ERR_BAD_TRAILER_NAME',
	    'Called reply.trailer with an invalid header name: %s'
	  ),
	  FST_ERR_BAD_TRAILER_VALUE: createError(
	    'FST_ERR_BAD_TRAILER_VALUE',
	    "Called reply.trailer('%s', fn) with an invalid type: %s. Expected a function."
	  ),
	  FST_ERR_FAILED_ERROR_SERIALIZATION: createError(
	    'FST_ERR_FAILED_ERROR_SERIALIZATION',
	    'Failed to serialize an error. Error: %s. Original error: %s'
	  ),
	  FST_ERR_MISSING_SERIALIZATION_FN: createError(
	    'FST_ERR_MISSING_SERIALIZATION_FN',
	    'Missing serialization function. Key "%s"'
	  ),
	  FST_ERR_MISSING_CONTENTTYPE_SERIALIZATION_FN: createError(
	    'FST_ERR_MISSING_CONTENTTYPE_SERIALIZATION_FN',
	    'Missing serialization function. Key "%s:%s"'
	  ),
	  FST_ERR_REQ_INVALID_VALIDATION_INVOCATION: createError(
	    'FST_ERR_REQ_INVALID_VALIDATION_INVOCATION',
	    'Invalid validation invocation. Missing validation function for HTTP part "%s" nor schema provided.'
	  ),

	  /**
	   * schemas
	  */
	  FST_ERR_SCH_MISSING_ID: createError(
	    'FST_ERR_SCH_MISSING_ID',
	    'Missing schema $id property'
	  ),
	  FST_ERR_SCH_ALREADY_PRESENT: createError(
	    'FST_ERR_SCH_ALREADY_PRESENT',
	    "Schema with id '%s' already declared!"
	  ),
	  FST_ERR_SCH_CONTENT_MISSING_SCHEMA: createError(
	    'FST_ERR_SCH_CONTENT_MISSING_SCHEMA',
	    "Schema is missing for the content type '%s'"
	  ),
	  FST_ERR_SCH_DUPLICATE: createError(
	    'FST_ERR_SCH_DUPLICATE',
	    "Schema with '%s' already present!"
	  ),
	  FST_ERR_SCH_VALIDATION_BUILD: createError(
	    'FST_ERR_SCH_VALIDATION_BUILD',
	    'Failed building the validation schema for %s: %s, due to error %s'
	  ),
	  FST_ERR_SCH_SERIALIZATION_BUILD: createError(
	    'FST_ERR_SCH_SERIALIZATION_BUILD',
	    'Failed building the serialization schema for %s: %s, due to error %s'
	  ),
	  FST_ERR_SCH_RESPONSE_SCHEMA_NOT_NESTED_2XX: createError(
	    'FST_ERR_SCH_RESPONSE_SCHEMA_NOT_NESTED_2XX',
	    'response schemas should be nested under a valid status code, e.g { 2xx: { type: "object" } }'
	  ),

	  /**
	   * http2
	   */
	  FST_ERR_HTTP2_INVALID_VERSION: createError(
	    'FST_ERR_HTTP2_INVALID_VERSION',
	    'HTTP2 is available only from node >= 8.8.1'
	  ),

	  /**
	   * initialConfig
	   */
	  FST_ERR_INIT_OPTS_INVALID: createError(
	    'FST_ERR_INIT_OPTS_INVALID',
	    "Invalid initialization options: '%s'"
	  ),
	  FST_ERR_FORCE_CLOSE_CONNECTIONS_IDLE_NOT_AVAILABLE: createError(
	    'FST_ERR_FORCE_CLOSE_CONNECTIONS_IDLE_NOT_AVAILABLE',
	    "Cannot set forceCloseConnections to 'idle' as your HTTP server does not support closeIdleConnections method"
	  ),

	  /**
	   * router
	   */
	  FST_ERR_DUPLICATED_ROUTE: createError(
	    'FST_ERR_DUPLICATED_ROUTE',
	    "Method '%s' already declared for route '%s'"
	  ),
	  FST_ERR_BAD_URL: createError(
	    'FST_ERR_BAD_URL',
	    "'%s' is not a valid url component",
	    400,
	    URIError
	  ),
	  FST_ERR_ASYNC_CONSTRAINT: createError(
	    'FST_ERR_ASYNC_CONSTRAINT',
	    'Unexpected error from async constraint',
	    500
	  ),
	  FST_ERR_INVALID_URL: createError(
	    'FST_ERR_INVALID_URL',
	    "URL must be a string. Received '%s'",
	    400,
	    TypeError
	  ),
	  FST_ERR_ROUTE_OPTIONS_NOT_OBJ: createError(
	    'FST_ERR_ROUTE_OPTIONS_NOT_OBJ',
	    'Options for "%s:%s" route must be an object',
	    500,
	    TypeError
	  ),
	  FST_ERR_ROUTE_DUPLICATED_HANDLER: createError(
	    'FST_ERR_ROUTE_DUPLICATED_HANDLER',
	    'Duplicate handler for "%s:%s" route is not allowed!',
	    500
	  ),
	  FST_ERR_ROUTE_HANDLER_NOT_FN: createError(
	    'FST_ERR_ROUTE_HANDLER_NOT_FN',
	    'Error Handler for %s:%s route, if defined, must be a function',
	    500,
	    TypeError
	  ),
	  FST_ERR_ROUTE_MISSING_HANDLER: createError(
	    'FST_ERR_ROUTE_MISSING_HANDLER',
	    'Missing handler function for "%s:%s" route.',
	    500
	  ),
	  FST_ERR_ROUTE_METHOD_INVALID: createError(
	    'FST_ERR_ROUTE_METHOD_INVALID',
	    'Provided method is invalid!',
	    500,
	    TypeError
	  ),
	  FST_ERR_ROUTE_METHOD_NOT_SUPPORTED: createError(
	    'FST_ERR_ROUTE_METHOD_NOT_SUPPORTED',
	    '%s method is not supported.',
	    500
	  ),
	  FST_ERR_ROUTE_BODY_VALIDATION_SCHEMA_NOT_SUPPORTED: createError(
	    'FST_ERR_ROUTE_BODY_VALIDATION_SCHEMA_NOT_SUPPORTED',
	    'Body validation schema for %s:%s route is not supported!',
	    500
	  ),
	  FST_ERR_ROUTE_BODY_LIMIT_OPTION_NOT_INT: createError(
	    'FST_ERR_ROUTE_BODY_LIMIT_OPTION_NOT_INT',
	    "'bodyLimit' option must be an integer > 0. Got '%s'",
	    500,
	    TypeError
	  ),
	  FST_ERR_ROUTE_REWRITE_NOT_STR: createError(
	    'FST_ERR_ROUTE_REWRITE_NOT_STR',
	    'Rewrite url for "%s" needs to be of type "string" but received "%s"',
	    500,
	    TypeError
	  ),

	  /**
	   *  again listen when close server
	   */
	  FST_ERR_REOPENED_CLOSE_SERVER: createError(
	    'FST_ERR_REOPENED_CLOSE_SERVER',
	    'Fastify has already been closed and cannot be reopened'
	  ),
	  FST_ERR_REOPENED_SERVER: createError(
	    'FST_ERR_REOPENED_SERVER',
	    'Fastify is already listening'
	  ),
	  FST_ERR_INSTANCE_ALREADY_LISTENING: createError(
	    'FST_ERR_INSTANCE_ALREADY_LISTENING',
	    'Fastify instance is already listening. %s'
	  ),

	  /**
	   * plugin
	   */
	  FST_ERR_PLUGIN_VERSION_MISMATCH: createError(
	    'FST_ERR_PLUGIN_VERSION_MISMATCH',
	    "fastify-plugin: %s - expected '%s' fastify version, '%s' is installed"
	  ),
	  FST_ERR_PLUGIN_NOT_PRESENT_IN_INSTANCE: createError(
	    'FST_ERR_PLUGIN_NOT_PRESENT_IN_INSTANCE',
	    "The decorator '%s'%s is not present in %s"
	  ),
	  FST_ERR_PLUGIN_INVALID_ASYNC_HANDLER: createError(
	    'FST_ERR_PLUGIN_INVALID_ASYNC_HANDLER',
	    'The %s plugin being registered mixes async and callback styles. Async plugin should not mix async and callback style.',
	    500,
	    TypeError
	  ),

	  /**
	   *  Avvio Errors
	   */
	  FST_ERR_PLUGIN_CALLBACK_NOT_FN: createError(
	    'FST_ERR_PLUGIN_CALLBACK_NOT_FN',
	    'fastify-plugin: %s',
	    500,
	    TypeError
	  ),
	  FST_ERR_PLUGIN_NOT_VALID: createError(
	    'FST_ERR_PLUGIN_NOT_VALID',
	    'fastify-plugin: %s'
	  ),
	  FST_ERR_ROOT_PLG_BOOTED: createError(
	    'FST_ERR_ROOT_PLG_BOOTED',
	    'fastify-plugin: %s'
	  ),
	  FST_ERR_PARENT_PLUGIN_BOOTED: createError(
	    'FST_ERR_PARENT_PLUGIN_BOOTED',
	    'fastify-plugin: %s'
	  ),
	  FST_ERR_PLUGIN_TIMEOUT: createError(
	    'FST_ERR_PLUGIN_TIMEOUT',
	    'fastify-plugin: %s'
	  )
	};

	function appendStackTrace (oldErr, newErr) {
	  newErr.cause = oldErr;

	  return newErr
	}

	errors.exports = codes;
	errors.exports.appendStackTrace = appendStackTrace;
	errors.exports.AVVIO_ERRORS_MAP = {
	  AVV_ERR_CALLBACK_NOT_FN: codes.FST_ERR_PLUGIN_CALLBACK_NOT_FN,
	  AVV_ERR_PLUGIN_NOT_VALID: codes.FST_ERR_PLUGIN_NOT_VALID,
	  AVV_ERR_ROOT_PLG_BOOTED: codes.FST_ERR_ROOT_PLG_BOOTED,
	  AVV_ERR_PARENT_PLG_LOADED: codes.FST_ERR_PARENT_PLUGIN_BOOTED,
	  AVV_ERR_READY_TIMEOUT: codes.FST_ERR_PLUGIN_TIMEOUT,
	  AVV_ERR_PLUGIN_EXEC_TIMEOUT: codes.FST_ERR_PLUGIN_TIMEOUT
	};
	return errors.exports;
}

var hooks;
var hasRequiredHooks;

function requireHooks () {
	if (hasRequiredHooks) return hooks;
	hasRequiredHooks = 1;

	const applicationHooks = [
	  'onRoute',
	  'onRegister',
	  'onReady',
	  'onListen',
	  'preClose',
	  'onClose'
	];
	const lifecycleHooks = [
	  'onTimeout',
	  'onRequest',
	  'preParsing',
	  'preValidation',
	  'preSerialization',
	  'preHandler',
	  'onSend',
	  'onResponse',
	  'onError',
	  'onRequestAbort'
	];
	const supportedHooks = lifecycleHooks.concat(applicationHooks);
	const {
	  FST_ERR_HOOK_INVALID_TYPE,
	  FST_ERR_HOOK_INVALID_HANDLER,
	  FST_ERR_SEND_UNDEFINED_ERR,
	  FST_ERR_HOOK_TIMEOUT,
	  FST_ERR_HOOK_NOT_SUPPORTED,
	  AVVIO_ERRORS_MAP,
	  appendStackTrace
	} = /*@__PURE__*/ requireErrors();

	const {
	  kChildren,
	  kHooks,
	  kRequestPayloadStream
	} = /*@__PURE__*/ requireSymbols();

	function Hooks () {
	  this.onRequest = [];
	  this.preParsing = [];
	  this.preValidation = [];
	  this.preSerialization = [];
	  this.preHandler = [];
	  this.onResponse = [];
	  this.onSend = [];
	  this.onError = [];
	  this.onRoute = [];
	  this.onRegister = [];
	  this.onReady = [];
	  this.onListen = [];
	  this.onTimeout = [];
	  this.onRequestAbort = [];
	  this.preClose = [];
	}

	Hooks.prototype = Object.create(null);

	Hooks.prototype.validate = function (hook, fn) {
	  if (typeof hook !== 'string') throw new FST_ERR_HOOK_INVALID_TYPE()
	  if (Array.isArray(this[hook]) === false) {
	    throw new FST_ERR_HOOK_NOT_SUPPORTED(hook)
	  }
	  if (typeof fn !== 'function') throw new FST_ERR_HOOK_INVALID_HANDLER(hook, Object.prototype.toString.call(fn))
	};

	Hooks.prototype.add = function (hook, fn) {
	  this.validate(hook, fn);
	  this[hook].push(fn);
	};

	function buildHooks (h) {
	  const hooks = new Hooks();
	  hooks.onRequest = h.onRequest.slice();
	  hooks.preParsing = h.preParsing.slice();
	  hooks.preValidation = h.preValidation.slice();
	  hooks.preSerialization = h.preSerialization.slice();
	  hooks.preHandler = h.preHandler.slice();
	  hooks.onSend = h.onSend.slice();
	  hooks.onResponse = h.onResponse.slice();
	  hooks.onError = h.onError.slice();
	  hooks.onRoute = h.onRoute.slice();
	  hooks.onRegister = h.onRegister.slice();
	  hooks.onTimeout = h.onTimeout.slice();
	  hooks.onRequestAbort = h.onRequestAbort.slice();
	  hooks.onReady = [];
	  hooks.onListen = [];
	  hooks.preClose = [];
	  return hooks
	}

	function hookRunnerApplication (hookName, boot, server, cb) {
	  const hooks = server[kHooks][hookName];
	  let i = 0;
	  let c = 0;

	  next();

	  function exit (err) {
	    const hookFnName = hooks[i - 1]?.name;
	    const hookFnFragment = hookFnName ? ` "${hookFnName}"` : '';

	    if (err) {
	      if (err.code === 'AVV_ERR_READY_TIMEOUT') {
	        err = appendStackTrace(err, new FST_ERR_HOOK_TIMEOUT(hookName, hookFnFragment));
	      } else {
	        err = AVVIO_ERRORS_MAP[err.code] != null
	          ? appendStackTrace(err, new AVVIO_ERRORS_MAP[err.code](err.message))
	          : err;
	      }

	      cb(err);
	      return
	    }
	    cb();
	  }

	  function next (err) {
	    if (err) {
	      exit(err);
	      return
	    }

	    if (i === hooks.length && c === server[kChildren].length) {
	      if (i === 0 && c === 0) { // speed up start
	        exit();
	      } else {
	        // This is the last function executed for every fastify instance
	        boot(function manageTimeout (err, done) {
	          // this callback is needed by fastify to provide an hook interface without the error
	          // as first parameter and managing it on behalf the user
	          exit(err);

	          // this callback is needed by avvio to continue the loading of the next `register` plugins
	          done(err);
	        });
	      }
	      return
	    }

	    if (i === hooks.length && c < server[kChildren].length) {
	      const child = server[kChildren][c++];
	      hookRunnerApplication(hookName, boot, child, next);
	      return
	    }

	    boot(wrap(hooks[i++], server));
	    next();
	  }

	  function wrap (fn, server) {
	    return function (err, done) {
	      if (err) {
	        done(err);
	        return
	      }

	      if (fn.length === 1) {
	        try {
	          fn.call(server, done);
	        } catch (error) {
	          done(error);
	        }
	        return
	      }

	      try {
	        const ret = fn.call(server);
	        if (ret && typeof ret.then === 'function') {
	          ret.then(done, done);
	          return
	        }
	      } catch (error) {
	        err = error;
	      }

	      done(err); // auto done
	    }
	  }
	}

	function onListenHookRunner (server) {
	  const hooks = server[kHooks].onListen;
	  const hooksLen = hooks.length;

	  let i = 0;
	  let c = 0;

	  next();

	  function next (err) {
	    err && server.log.error(err);

	    if (
	      i === hooksLen
	    ) {
	      while (c < server[kChildren].length) {
	        const child = server[kChildren][c++];
	        onListenHookRunner(child);
	      }
	      return
	    }

	    wrap(hooks[i++], server, next);
	  }

	  async function wrap (fn, server, done) {
	    if (fn.length === 1) {
	      try {
	        fn.call(server, done);
	      } catch (e) {
	        done(e);
	      }
	      return
	    }
	    try {
	      const ret = fn.call(server);
	      if (ret && typeof ret.then === 'function') {
	        ret.then(done, done);
	        return
	      }
	      done();
	    } catch (error) {
	      done(error);
	    }
	  }
	}

	function hookRunnerGenerator (iterator) {
	  return function hookRunner (functions, request, reply, cb) {
	    let i = 0;

	    function next (err) {
	      if (err || i === functions.length) {
	        cb(err, request, reply);
	        return
	      }

	      let result;
	      try {
	        result = iterator(functions[i++], request, reply, next);
	      } catch (error) {
	        cb(error, request, reply);
	        return
	      }
	      if (result && typeof result.then === 'function') {
	        result.then(handleResolve, handleReject);
	      }
	    }

	    function handleResolve () {
	      next();
	    }

	    function handleReject (err) {
	      if (!err) {
	        err = new FST_ERR_SEND_UNDEFINED_ERR();
	      }

	      cb(err, request, reply);
	    }

	    next();
	  }
	}

	function onResponseHookIterator (fn, request, reply, next) {
	  return fn(request, reply, next)
	}

	const onResponseHookRunner = hookRunnerGenerator(onResponseHookIterator);
	const preValidationHookRunner = hookRunnerGenerator(hookIterator);
	const preHandlerHookRunner = hookRunnerGenerator(hookIterator);
	const onTimeoutHookRunner = hookRunnerGenerator(hookIterator);
	const onRequestHookRunner = hookRunnerGenerator(hookIterator);

	function onSendHookRunner (functions, request, reply, payload, cb) {
	  let i = 0;

	  function next (err, newPayload) {
	    if (err) {
	      cb(err, request, reply, payload);
	      return
	    }

	    if (newPayload !== undefined) {
	      payload = newPayload;
	    }

	    if (i === functions.length) {
	      cb(null, request, reply, payload);
	      return
	    }

	    let result;
	    try {
	      result = functions[i++](request, reply, payload, next);
	    } catch (error) {
	      cb(error, request, reply);
	      return
	    }
	    if (result && typeof result.then === 'function') {
	      result.then(handleResolve, handleReject);
	    }
	  }

	  function handleResolve (newPayload) {
	    next(null, newPayload);
	  }

	  function handleReject (err) {
	    if (!err) {
	      err = new FST_ERR_SEND_UNDEFINED_ERR();
	    }

	    cb(err, request, reply, payload);
	  }

	  next();
	}

	const preSerializationHookRunner = onSendHookRunner;

	function preParsingHookRunner (functions, request, reply, cb) {
	  let i = 0;

	  function next (err, newPayload) {
	    if (reply.sent) {
	      return
	    }

	    if (newPayload !== undefined) {
	      request[kRequestPayloadStream] = newPayload;
	    }

	    if (err || i === functions.length) {
	      cb(err, request, reply);
	      return
	    }

	    let result;
	    try {
	      result = functions[i++](request, reply, request[kRequestPayloadStream], next);
	    } catch (error) {
	      cb(error, request, reply);
	      return
	    }

	    if (result && typeof result.then === 'function') {
	      result.then(handleResolve, handleReject);
	    }
	  }

	  function handleResolve (newPayload) {
	    next(null, newPayload);
	  }

	  function handleReject (err) {
	    if (!err) {
	      err = new FST_ERR_SEND_UNDEFINED_ERR();
	    }

	    cb(err, request, reply);
	  }

	  next();
	}

	function onRequestAbortHookRunner (functions, request, cb) {
	  let i = 0;

	  function next (err) {
	    if (err || i === functions.length) {
	      cb(err, request);
	      return
	    }

	    let result;
	    try {
	      result = functions[i++](request, next);
	    } catch (error) {
	      cb(error, request);
	      return
	    }
	    if (result && typeof result.then === 'function') {
	      result.then(handleResolve, handleReject);
	    }
	  }

	  function handleResolve () {
	    next();
	  }

	  function handleReject (err) {
	    if (!err) {
	      err = new FST_ERR_SEND_UNDEFINED_ERR();
	    }

	    cb(err, request);
	  }

	  next();
	}

	function hookIterator (fn, request, reply, next) {
	  if (reply.sent === true) return undefined
	  return fn(request, reply, next)
	}

	hooks = {
	  Hooks,
	  buildHooks,
	  hookRunnerGenerator,
	  preParsingHookRunner,
	  onResponseHookRunner,
	  onSendHookRunner,
	  preSerializationHookRunner,
	  onRequestAbortHookRunner,
	  hookIterator,
	  hookRunnerApplication,
	  onListenHookRunner,
	  preHandlerHookRunner,
	  preValidationHookRunner,
	  onRequestHookRunner,
	  onTimeoutHookRunner,
	  lifecycleHooks,
	  supportedHooks
	};
	return hooks;
}

var hasRequiredServer;

function requireServer () {
	if (hasRequiredServer) return server;
	hasRequiredServer = 1;

	const http = require$$0;
	const https = nodeHTTPS;
	const dns = require$$2;
	const os = require$$3;

	const { kState, kOptions, kServerBindings } = /*@__PURE__*/ requireSymbols();
	const { onListenHookRunner } = /*@__PURE__*/ requireHooks();
	const {
	  FST_ERR_HTTP2_INVALID_VERSION,
	  FST_ERR_REOPENED_CLOSE_SERVER,
	  FST_ERR_REOPENED_SERVER,
	  FST_ERR_LISTEN_OPTIONS_INVALID
	} = /*@__PURE__*/ requireErrors();

	server.createServer = createServer;

	function defaultResolveServerListeningText (address) {
	  return `Server listening at ${address}`
	}

	function createServer (options, httpHandler) {
	  const server = getServerInstance(options, httpHandler);

	  // `this` is the Fastify object
	  function listen (
	    listenOptions = { port: 0, host: 'localhost' },
	    cb = undefined
	  ) {
	    if (typeof cb === 'function') {
	      listenOptions.cb = cb;
	    }
	    if (listenOptions.signal) {
	      if (typeof listenOptions.signal.on !== 'function' && typeof listenOptions.signal.addEventListener !== 'function') {
	        throw new FST_ERR_LISTEN_OPTIONS_INVALID('Invalid options.signal')
	      }

	      if (listenOptions.signal.aborted) {
	        this.close();
	      } else {
	        const onAborted = () => {
	          this.close();
	        };
	        listenOptions.signal.addEventListener('abort', onAborted, { once: true });
	      }
	    }

	    // If we have a path specified, don't default host to 'localhost' so we don't end up listening
	    // on both path and host
	    // See https://github.com/fastify/fastify/issues/4007
	    let host;
	    if (listenOptions.path == null) {
	      host = listenOptions.host ?? 'localhost';
	    } else {
	      host = listenOptions.host;
	    }
	    if (!Object.hasOwn(listenOptions, 'host') ||
	      listenOptions.host == null) {
	      listenOptions.host = host;
	    }
	    if (host === 'localhost') {
	      listenOptions.cb = (err, address) => {
	        if (err) {
	          // the server did not start
	          cb(err, address);
	          return
	        }

	        multipleBindings.call(this, server, httpHandler, options, listenOptions, () => {
	          this[kState].listening = true;
	          cb(null, address);
	          onListenHookRunner(this);
	        });
	      };
	    } else {
	      listenOptions.cb = (err, address) => {
	        // the server did not start
	        if (err) {
	          cb(err, address);
	          return
	        }
	        this[kState].listening = true;
	        cb(null, address);
	        onListenHookRunner(this);
	      };
	    }

	    // https://github.com/nodejs/node/issues/9390
	    // If listening to 'localhost', listen to both 127.0.0.1 or ::1 if they are available.
	    // If listening to 127.0.0.1, only listen to 127.0.0.1.
	    // If listening to ::1, only listen to ::1.

	    if (cb === undefined) {
	      const listening = listenPromise.call(this, server, listenOptions);
	      /* istanbul ignore else */
	      return listening.then(address => {
	        return new Promise((resolve, reject) => {
	          if (host === 'localhost') {
	            multipleBindings.call(this, server, httpHandler, options, listenOptions, () => {
	              this[kState].listening = true;
	              resolve(address);
	              onListenHookRunner(this);
	            });
	          } else {
	            resolve(address);
	            onListenHookRunner(this);
	          }
	        })
	      })
	    }

	    this.ready(listenCallback.call(this, server, listenOptions));
	  }

	  return { server, listen }
	}

	function multipleBindings (mainServer, httpHandler, serverOpts, listenOptions, onListen) {
	  // the main server is started, we need to start the secondary servers
	  this[kState].listening = false;

	  // let's check if we need to bind additional addresses
	  dns.lookup(listenOptions.host, { all: true }, (dnsErr, addresses) => {
	    if (dnsErr) {
	      // not blocking the main server listening
	      // this.log.warn('dns.lookup error:', dnsErr)
	      onListen();
	      return
	    }

	    const isMainServerListening = mainServer.listening && serverOpts.serverFactory;

	    let binding = 0;
	    let bound = 0;
	    if (!isMainServerListening) {
	      const primaryAddress = mainServer.address();
	      for (const adr of addresses) {
	        if (adr.address !== primaryAddress.address) {
	          binding++;
	          const secondaryOpts = Object.assign({}, listenOptions, {
	            host: adr.address,
	            port: primaryAddress.port,
	            cb: (_ignoreErr) => {
	              bound++;

	              if (!_ignoreErr) {
	                this[kServerBindings].push(secondaryServer);
	              }

	              if (bound === binding) {
	                // regardless of the error, we are done
	                onListen();
	              }
	            }
	          });

	          const secondaryServer = getServerInstance(serverOpts, httpHandler);
	          const closeSecondary = () => {
	            // To avoid falling into situations where the close of the
	            // secondary server is triggered before the preClose hook
	            // is done running, we better wait until the main server is closed.
	            // No new TCP connections are accepted
	            // We swallow any error from the secondary server
	            secondaryServer.close(() => {});
	            if (typeof secondaryServer.closeAllConnections === 'function' && serverOpts.forceCloseConnections === true) {
	              secondaryServer.closeAllConnections();
	            }
	          };

	          secondaryServer.on('upgrade', mainServer.emit.bind(mainServer, 'upgrade'));
	          mainServer.on('unref', closeSecondary);
	          mainServer.on('close', closeSecondary);
	          mainServer.on('error', closeSecondary);
	          this[kState].listening = false;
	          listenCallback.call(this, secondaryServer, secondaryOpts)();
	        }
	      }
	    }
	    // no extra bindings are necessary
	    if (binding === 0) {
	      onListen();
	      return
	    }

	    // in test files we are using unref so we need to propagate the unref event
	    // to the secondary servers. It is valid only when the user is
	    // listening on localhost
	    const originUnref = mainServer.unref;
	    /* c8 ignore next 4 */
	    mainServer.unref = function () {
	      originUnref.call(mainServer);
	      mainServer.emit('unref');
	    };
	  });
	}

	function listenCallback (server, listenOptions) {
	  const wrap = (err) => {
	    server.removeListener('error', wrap);
	    server.removeListener('listening', wrap);
	    if (!err) {
	      const address = logServerAddress.call(this, server, listenOptions.listenTextResolver || defaultResolveServerListeningText);
	      listenOptions.cb(null, address);
	    } else {
	      this[kState].listening = false;
	      listenOptions.cb(err, null);
	    }
	  };

	  return (err) => {
	    if (err != null) return listenOptions.cb(err)

	    if (this[kState].listening && this[kState].closing) {
	      return listenOptions.cb(new FST_ERR_REOPENED_CLOSE_SERVER(), null)
	    } else if (this[kState].listening) {
	      return listenOptions.cb(new FST_ERR_REOPENED_SERVER(), null)
	    }

	    server.once('error', wrap);
	    if (!this[kState].closing) {
	      server.once('listening', wrap);
	      server.listen(listenOptions);
	      this[kState].listening = true;
	    }
	  }
	}

	function listenPromise (server, listenOptions) {
	  if (this[kState].listening && this[kState].closing) {
	    return Promise.reject(new FST_ERR_REOPENED_CLOSE_SERVER())
	  } else if (this[kState].listening) {
	    return Promise.reject(new FST_ERR_REOPENED_SERVER())
	  }

	  return this.ready().then(() => {
	    let errEventHandler;
	    let listeningEventHandler;
	    function cleanup () {
	      server.removeListener('error', errEventHandler);
	      server.removeListener('listening', listeningEventHandler);
	    }
	    const errEvent = new Promise((resolve, reject) => {
	      errEventHandler = (err) => {
	        cleanup();
	        this[kState].listening = false;
	        reject(err);
	      };
	      server.once('error', errEventHandler);
	    });
	    const listeningEvent = new Promise((resolve, reject) => {
	      listeningEventHandler = () => {
	        cleanup();
	        this[kState].listening = true;
	        resolve(logServerAddress.call(this, server, listenOptions.listenTextResolver || defaultResolveServerListeningText));
	      };
	      server.once('listening', listeningEventHandler);
	    });

	    server.listen(listenOptions);

	    return Promise.race([
	      errEvent, // e.g invalid port range error is always emitted before the server listening
	      listeningEvent
	    ])
	  })
	}

	function getServerInstance (options, httpHandler) {
	  let server = null;
	  // node@20 do not accepts options as boolean
	  // we need to provide proper https option
	  const httpsOptions = options.https === true ? {} : options.https;
	  if (options.serverFactory) {
	    server = options.serverFactory(httpHandler, options);
	  } else if (options.http2) {
	    if (typeof httpsOptions === 'object') {
	      server = http2().createSecureServer(httpsOptions, httpHandler);
	    } else {
	      server = http2().createServer(httpHandler);
	    }
	    server.on('session', sessionTimeout(options.http2SessionTimeout));
	  } else {
	    // this is http1
	    if (httpsOptions) {
	      server = https.createServer(httpsOptions, httpHandler);
	    } else {
	      server = http.createServer(options.http, httpHandler);
	    }
	    server.keepAliveTimeout = options.keepAliveTimeout;
	    server.requestTimeout = options.requestTimeout;
	    // we treat zero as null
	    // and null is the default setting from nodejs
	    // so we do not pass the option to server
	    if (options.maxRequestsPerSocket > 0) {
	      server.maxRequestsPerSocket = options.maxRequestsPerSocket;
	    }
	  }

	  if (!options.serverFactory) {
	    server.setTimeout(options.connectionTimeout);
	  }
	  return server
	}
	/**
	 * Inspects the provided `server.address` object and returns a
	 * normalized list of IP address strings. Normalization in this
	 * case refers to mapping wildcard `0.0.0.0` to the list of IP
	 * addresses the wildcard refers to.
	 *
	 * @see https://nodejs.org/docs/latest/api/net.html#serveraddress
	 *
	 * @param {object} A server address object as described in the
	 * linked docs.
	 *
	 * @returns {string[]}
	 */
	function getAddresses (address) {
	  if (address.address === '0.0.0.0') {
	    return Object.values(os.networkInterfaces()).flatMap((iface) => {
	      return iface.filter((iface) => iface.family === 'IPv4')
	    }).sort((iface) => {
	      /* c8 ignore next 2 */
	      // Order the interfaces so that internal ones come first
	      return iface.internal ? -1 : 1
	    }).map((iface) => { return iface.address })
	  }
	  return [address.address]
	}

	function logServerAddress (server, listenTextResolver) {
	  let addresses;
	  const isUnixSocket = typeof server.address() === 'string';
	  if (!isUnixSocket) {
	    if (server.address().address.indexOf(':') === -1) {
	      // IPv4
	      addresses = getAddresses(server.address()).map((address) => address + ':' + server.address().port);
	    } else {
	      // IPv6
	      addresses = ['[' + server.address().address + ']:' + server.address().port];
	    }

	    addresses = addresses.map((address) => ('http' + (this[kOptions].https ? 's' : '') + '://') + address);
	  } else {
	    addresses = [server.address()];
	  }

	  for (const address of addresses) {
	    this.log.info(listenTextResolver(address));
	  }
	  return addresses[0]
	}

	function http2 () {
	  try {
	    return require('node:http2')
	  } catch (err) {
	    throw new FST_ERR_HTTP2_INVALID_VERSION()
	  }
	}

	function sessionTimeout (timeout) {
	  return function (session) {
	    session.setTimeout(timeout, close);
	  }
	}

	function close () {
	  this.close();
	}
	return server;
}

var reply = {exports: {}};

var handleRequest = {exports: {}};

var warnings;
var hasRequiredWarnings;

function requireWarnings () {
	if (hasRequiredWarnings) return warnings;
	hasRequiredWarnings = 1;

	const { createWarning } = require$$0$2;

	/**
	 * Deprecation codes:
	 *   - FSTWRN001
	 *   - FSTSEC001
	 *
	 * Deprecation Codes FSTDEP001 - FSTDEP021 were used by v4 and MUST NOT not be reused.
	 */

	const FSTWRN001 = createWarning({
	  name: 'FastifyWarning',
	  code: 'FSTWRN001',
	  message: 'The %s schema for %s: %s is missing. This may indicate the schema is not well specified.',
	  unlimited: true
	});

	const FSTSEC001 = createWarning({
	  name: 'FastifySecurity',
	  code: 'FSTSEC001',
	  message: 'You are using /%s/ Content-Type which may be vulnerable to CORS attack. Please make sure your RegExp start with "^" or include ";?" to proper detection of the essence MIME type.',
	  unlimited: true
	});

	warnings = {
	  FSTWRN001,
	  FSTSEC001
	};
	return warnings;
}

var validation;
var hasRequiredValidation;

function requireValidation () {
	if (hasRequiredValidation) return validation;
	hasRequiredValidation = 1;

	const {
	  kSchemaHeaders: headersSchema,
	  kSchemaParams: paramsSchema,
	  kSchemaQuerystring: querystringSchema,
	  kSchemaBody: bodySchema,
	  kSchemaResponse: responseSchema
	} = /*@__PURE__*/ requireSymbols();
	const scChecker = /^[1-5](?:\d{2}|xx)$|^default$/;

	const {
	  FST_ERR_SCH_RESPONSE_SCHEMA_NOT_NESTED_2XX
	} = /*@__PURE__*/ requireErrors();

	const { FSTWRN001 } = /*@__PURE__*/ requireWarnings();

	function compileSchemasForSerialization (context, compile) {
	  if (!context.schema || !context.schema.response) {
	    return
	  }
	  const { method, url } = context.config || {};
	  context[responseSchema] = Object.keys(context.schema.response)
	    .reduce(function (acc, statusCode) {
	      const schema = context.schema.response[statusCode];
	      statusCode = statusCode.toLowerCase();
	      if (!scChecker.test(statusCode)) {
	        throw new FST_ERR_SCH_RESPONSE_SCHEMA_NOT_NESTED_2XX()
	      }

	      if (schema.content) {
	        const contentTypesSchemas = {};
	        for (const mediaName of Object.keys(schema.content)) {
	          const contentSchema = schema.content[mediaName].schema;
	          contentTypesSchemas[mediaName] = compile({
	            schema: contentSchema,
	            url,
	            method,
	            httpStatus: statusCode,
	            contentType: mediaName
	          });
	        }
	        acc[statusCode] = contentTypesSchemas;
	      } else {
	        acc[statusCode] = compile({
	          schema,
	          url,
	          method,
	          httpStatus: statusCode
	        });
	      }

	      return acc
	    }, {});
	}

	function compileSchemasForValidation (context, compile, isCustom) {
	  const { schema } = context;
	  if (!schema) {
	    return
	  }

	  const { method, url } = context.config || {};

	  const headers = schema.headers;
	  // the or part is used for backward compatibility
	  if (headers && (isCustom || Object.getPrototypeOf(headers) !== Object.prototype)) {
	    // do not mess with schema when custom validator applied, e.g. Joi, Typebox
	    context[headersSchema] = compile({ schema: headers, method, url, httpPart: 'headers' });
	  } else if (headers) {
	    // The header keys are case insensitive
	    //  https://datatracker.ietf.org/doc/html/rfc2616#section-4.2
	    const headersSchemaLowerCase = {};
	    Object.keys(headers).forEach(k => { headersSchemaLowerCase[k] = headers[k]; });
	    if (headersSchemaLowerCase.required instanceof Array) {
	      headersSchemaLowerCase.required = headersSchemaLowerCase.required.map(h => h.toLowerCase());
	    }
	    if (headers.properties) {
	      headersSchemaLowerCase.properties = {};
	      Object.keys(headers.properties).forEach(k => {
	        headersSchemaLowerCase.properties[k.toLowerCase()] = headers.properties[k];
	      });
	    }
	    context[headersSchema] = compile({ schema: headersSchemaLowerCase, method, url, httpPart: 'headers' });
	  } else if (Object.hasOwn(schema, 'headers')) {
	    FSTWRN001('headers', method, url);
	  }

	  if (schema.body) {
	    const contentProperty = schema.body.content;
	    if (contentProperty) {
	      const contentTypeSchemas = {};
	      for (const contentType of Object.keys(contentProperty)) {
	        const contentSchema = contentProperty[contentType].schema;
	        contentTypeSchemas[contentType] = compile({ schema: contentSchema, method, url, httpPart: 'body', contentType });
	      }
	      context[bodySchema] = contentTypeSchemas;
	    } else {
	      context[bodySchema] = compile({ schema: schema.body, method, url, httpPart: 'body' });
	    }
	  } else if (Object.hasOwn(schema, 'body')) {
	    FSTWRN001('body', method, url);
	  }

	  if (schema.querystring) {
	    context[querystringSchema] = compile({ schema: schema.querystring, method, url, httpPart: 'querystring' });
	  } else if (Object.hasOwn(schema, 'querystring')) {
	    FSTWRN001('querystring', method, url);
	  }

	  if (schema.params) {
	    context[paramsSchema] = compile({ schema: schema.params, method, url, httpPart: 'params' });
	  } else if (Object.hasOwn(schema, 'params')) {
	    FSTWRN001('params', method, url);
	  }
	}

	function validateParam (validatorFunction, request, paramName) {
	  const isUndefined = request[paramName] === undefined;
	  const ret = validatorFunction && validatorFunction(isUndefined ? null : request[paramName]);

	  if (ret?.then) {
	    return ret
	      .then((res) => { return answer(res) })
	      .catch(err => { return err }) // return as simple error (not throw)
	  }

	  return answer(ret)

	  function answer (ret) {
	    if (ret === false) return validatorFunction.errors
	    if (ret && ret.error) return ret.error
	    if (ret && ret.value) request[paramName] = ret.value;
	    return false
	  }
	}

	function validate (context, request, execution) {
	  const runExecution = execution === undefined;

	  if (runExecution || !execution.skipParams) {
	    const params = validateParam(context[paramsSchema], request, 'params');
	    if (params) {
	      if (typeof params.then !== 'function') {
	        return wrapValidationError(params, 'params', context.schemaErrorFormatter)
	      } else {
	        return validateAsyncParams(params, context, request)
	      }
	    }
	  }

	  if (runExecution || !execution.skipBody) {
	    let validatorFunction = null;
	    if (typeof context[bodySchema] === 'function') {
	      validatorFunction = context[bodySchema];
	    } else if (context[bodySchema]) {
	      // TODO: add request.contentType and reuse it here
	      const contentType = request.headers['content-type']?.split(';', 1)[0];
	      const contentSchema = context[bodySchema][contentType];
	      if (contentSchema) {
	        validatorFunction = contentSchema;
	      }
	    }
	    const body = validateParam(validatorFunction, request, 'body');
	    if (body) {
	      if (typeof body.then !== 'function') {
	        return wrapValidationError(body, 'body', context.schemaErrorFormatter)
	      } else {
	        return validateAsyncBody(body, context, request)
	      }
	    }
	  }

	  if (runExecution || !execution.skipQuery) {
	    const query = validateParam(context[querystringSchema], request, 'query');
	    if (query) {
	      if (typeof query.then !== 'function') {
	        return wrapValidationError(query, 'querystring', context.schemaErrorFormatter)
	      } else {
	        return validateAsyncQuery(query, context, request)
	      }
	    }
	  }

	  const headers = validateParam(context[headersSchema], request, 'headers');
	  if (headers) {
	    if (typeof headers.then !== 'function') {
	      return wrapValidationError(headers, 'headers', context.schemaErrorFormatter)
	    } else {
	      return validateAsyncHeaders(headers, context)
	    }
	  }

	  return false
	}

	function validateAsyncParams (validatePromise, context, request) {
	  return validatePromise
	    .then((paramsResult) => {
	      if (paramsResult) {
	        return wrapValidationError(paramsResult, 'params', context.schemaErrorFormatter)
	      }

	      return validate(context, request, { skipParams: true })
	    })
	}

	function validateAsyncBody (validatePromise, context, request) {
	  return validatePromise
	    .then((bodyResult) => {
	      if (bodyResult) {
	        return wrapValidationError(bodyResult, 'body', context.schemaErrorFormatter)
	      }

	      return validate(context, request, { skipParams: true, skipBody: true })
	    })
	}

	function validateAsyncQuery (validatePromise, context, request) {
	  return validatePromise
	    .then((queryResult) => {
	      if (queryResult) {
	        return wrapValidationError(queryResult, 'querystring', context.schemaErrorFormatter)
	      }

	      return validate(context, request, { skipParams: true, skipBody: true, skipQuery: true })
	    })
	}

	function validateAsyncHeaders (validatePromise, context, request) {
	  return validatePromise
	    .then((headersResult) => {
	      if (headersResult) {
	        return wrapValidationError(headersResult, 'headers', context.schemaErrorFormatter)
	      }

	      return false
	    })
	}

	function wrapValidationError (result, dataVar, schemaErrorFormatter) {
	  if (result instanceof Error) {
	    result.statusCode = result.statusCode || 400;
	    result.code = result.code || 'FST_ERR_VALIDATION';
	    result.validationContext = result.validationContext || dataVar;
	    return result
	  }

	  const error = schemaErrorFormatter(result, dataVar);
	  error.statusCode = error.statusCode || 400;
	  error.code = error.code || 'FST_ERR_VALIDATION';
	  error.validation = result;
	  error.validationContext = dataVar;
	  return error
	}

	validation = {
	  symbols: { bodySchema, querystringSchema, responseSchema, paramsSchema, headersSchema },
	  compileSchemasForValidation,
	  compileSchemasForSerialization,
	  validate
	};
	return validation;
}

var wrapThenable_1;
var hasRequiredWrapThenable;

function requireWrapThenable () {
	if (hasRequiredWrapThenable) return wrapThenable_1;
	hasRequiredWrapThenable = 1;

	const {
	  kReplyIsError,
	  kReplyHijacked
	} = /*@__PURE__*/ requireSymbols();

	const diagnostics = require$$1;
	const channels = diagnostics.tracingChannel('fastify.request.handler');

	function wrapThenable (thenable, reply, store) {
	  if (store) store.async = true;
	  thenable.then(function (payload) {
	    if (reply[kReplyHijacked] === true) {
	      return
	    }

	    if (store) {
	      channels.asyncStart.publish(store);
	    }

	    try {
	      // this is for async functions that are using reply.send directly
	      //
	      // since wrap-thenable will be called when using reply.send directly
	      // without actual return. the response can be sent already or
	      // the request may be terminated during the reply. in this situation,
	      // it require an extra checking of request.aborted to see whether
	      // the request is killed by client.
	      if (payload !== undefined || (reply.sent === false && reply.raw.headersSent === false && reply.request.raw.aborted === false)) {
	        // we use a try-catch internally to avoid adding a catch to another
	        // promise, increase promise perf by 10%
	        try {
	          reply.send(payload);
	        } catch (err) {
	          reply[kReplyIsError] = true;
	          reply.send(err);
	        }
	      }
	    } finally {
	      if (store) {
	        channels.asyncEnd.publish(store);
	      }
	    }
	  }, function (err) {
	    if (store) {
	      store.error = err;
	      channels.error.publish(store); // note that error happens before asyncStart
	      channels.asyncStart.publish(store);
	    }

	    try {
	      if (reply.sent === true) {
	        reply.log.error({ err }, 'Promise errored, but reply.sent = true was set');
	        return
	      }

	      reply[kReplyIsError] = true;

	      reply.send(err);
	      // The following should not happen
	      /* c8 ignore next 3 */
	    } catch (err) {
	      // try-catch allow to re-throw error in error handler for async handler
	      reply.send(err);
	    } finally {
	      if (store) {
	        channels.asyncEnd.publish(store);
	      }
	    }
	  });
	}

	wrapThenable_1 = wrapThenable;
	return wrapThenable_1;
}

var hasRequiredHandleRequest;

function requireHandleRequest () {
	if (hasRequiredHandleRequest) return handleRequest.exports;
	hasRequiredHandleRequest = 1;
	(function (module) {

		const diagnostics = require$$1;
		const { validate: validateSchema } = /*@__PURE__*/ requireValidation();
		const { preValidationHookRunner, preHandlerHookRunner } = /*@__PURE__*/ requireHooks();
		const wrapThenable = /*@__PURE__*/ requireWrapThenable();
		const {
		  kReplyIsError,
		  kRouteContext,
		  kFourOhFourContext,
		  kSupportedHTTPMethods
		} = /*@__PURE__*/ requireSymbols();

		const channels = diagnostics.tracingChannel('fastify.request.handler');

		function handleRequest (err, request, reply) {
		  if (reply.sent === true) return
		  if (err != null) {
		    reply[kReplyIsError] = true;
		    reply.send(err);
		    return
		  }

		  const method = request.raw.method;
		  const headers = request.headers;
		  const context = request[kRouteContext];

		  if (this[kSupportedHTTPMethods].bodyless.has(method)) {
		    handler(request, reply);
		    return
		  }

		  if (this[kSupportedHTTPMethods].bodywith.has(method)) {
		    const contentType = headers['content-type'];
		    const contentLength = headers['content-length'];
		    const transferEncoding = headers['transfer-encoding'];

		    if (contentType === undefined) {
		      if (
		        (contentLength === undefined || contentLength === '0') &&
		        transferEncoding === undefined
		      ) {
		        // Request has no body to parse
		        handler(request, reply);
		      } else {
		        context.contentTypeParser.run('', handler, request, reply);
		      }
		    } else {
		      if (contentLength === undefined && transferEncoding === undefined && method === 'OPTIONS') {
		        // OPTIONS can have a Content-Type header without a body
		        handler(request, reply);
		        return
		      }
		      context.contentTypeParser.run(contentType, handler, request, reply);
		    }
		    return
		  }

		  // Return 404 instead of 405 see https://github.com/fastify/fastify/pull/862 for discussion
		  handler(request, reply);
		}

		function handler (request, reply) {
		  try {
		    if (request[kRouteContext].preValidation !== null) {
		      preValidationHookRunner(
		        request[kRouteContext].preValidation,
		        request,
		        reply,
		        preValidationCallback
		      );
		    } else {
		      preValidationCallback(null, request, reply);
		    }
		  } catch (err) {
		    preValidationCallback(err, request, reply);
		  }
		}

		function preValidationCallback (err, request, reply) {
		  if (reply.sent === true) return

		  if (err != null) {
		    reply[kReplyIsError] = true;
		    reply.send(err);
		    return
		  }

		  const validationErr = validateSchema(reply[kRouteContext], request);
		  const isAsync = (validationErr && typeof validationErr.then === 'function') || false;

		  if (isAsync) {
		    const cb = validationCompleted.bind(null, request, reply);
		    validationErr.then(cb, cb);
		  } else {
		    validationCompleted(request, reply, validationErr);
		  }
		}

		function validationCompleted (request, reply, validationErr) {
		  if (validationErr) {
		    if (reply[kRouteContext].attachValidation === false) {
		      reply.send(validationErr);
		      return
		    }

		    reply.request.validationError = validationErr;
		  }

		  // preHandler hook
		  if (request[kRouteContext].preHandler !== null) {
		    preHandlerHookRunner(
		      request[kRouteContext].preHandler,
		      request,
		      reply,
		      preHandlerCallback
		    );
		  } else {
		    preHandlerCallback(null, request, reply);
		  }
		}

		function preHandlerCallback (err, request, reply) {
		  if (reply.sent) return

		  const context = request[kRouteContext];

		  if (!channels.hasSubscribers || context[kFourOhFourContext] === null) {
		    preHandlerCallbackInner(err, request, reply);
		  } else {
		    const store = {
		      request,
		      reply,
		      async: false,
		      route: {
		        url: context.config.url,
		        method: context.config.method
		      }
		    };
		    channels.start.runStores(store, preHandlerCallbackInner, undefined, err, request, reply, store);
		  }
		}

		function preHandlerCallbackInner (err, request, reply, store) {
		  const context = request[kRouteContext];

		  try {
		    if (err != null) {
		      reply[kReplyIsError] = true;
		      reply.send(err);
		      if (store) {
		        store.error = err;
		        channels.error.publish(store);
		      }
		      return
		    }

		    let result;

		    try {
		      result = context.handler(request, reply);
		    } catch (err) {
		      if (store) {
		        store.error = err;
		        channels.error.publish(store);
		      }

		      reply[kReplyIsError] = true;
		      reply.send(err);
		      return
		    }

		    if (result !== undefined) {
		      if (result !== null && typeof result.then === 'function') {
		        wrapThenable(result, reply, store);
		      } else {
		        reply.send(result);
		      }
		    }
		  } finally {
		    if (store) channels.end.publish(store);
		  }
		}

		module.exports = handleRequest;
		module.exports[Symbol.for('internals')] = { handler, preHandlerCallback }; 
	} (handleRequest));
	return handleRequest.exports;
}

var loggerPino;
var hasRequiredLoggerPino;

function requireLoggerPino () {
	if (hasRequiredLoggerPino) return loggerPino;
	hasRequiredLoggerPino = 1;

	/**
	 * Code imported from `pino-http`
	 * Repo: https://github.com/pinojs/pino-http
	 * License: MIT (https://raw.githubusercontent.com/pinojs/pino-http/master/LICENSE)
	 */

	const pino = require$$0$3;
	const { serializersSym } = pino.symbols;
	const {
	  FST_ERR_LOG_INVALID_DESTINATION,
	} = /*@__PURE__*/ requireErrors();

	function createPinoLogger (opts) {
	  if (opts.stream && opts.file) {
	    throw new FST_ERR_LOG_INVALID_DESTINATION()
	  } else if (opts.file) {
	    // we do not have stream
	    opts.stream = pino.destination(opts.file);
	    delete opts.file;
	  }

	  const prevLogger = opts.logger;
	  const prevGenReqId = opts.genReqId;
	  let logger = null;

	  if (prevLogger) {
	    opts.logger = undefined;
	    opts.genReqId = undefined;
	    // we need to tap into pino internals because in v5 it supports
	    // adding serializers in child loggers
	    if (prevLogger[serializersSym]) {
	      opts.serializers = Object.assign({}, opts.serializers, prevLogger[serializersSym]);
	    }
	    logger = prevLogger.child({}, opts);
	    opts.logger = prevLogger;
	    opts.genReqId = prevGenReqId;
	  } else {
	    logger = pino(opts, opts.stream);
	  }

	  return logger
	}

	const serializers = {
	  req: function asReqValue (req) {
	    return {
	      method: req.method,
	      url: req.url,
	      version: req.headers && req.headers['accept-version'],
	      host: req.host,
	      remoteAddress: req.ip,
	      remotePort: req.socket ? req.socket.remotePort : undefined
	    }
	  },
	  err: pino.stdSerializers.err,
	  res: function asResValue (reply) {
	    return {
	      statusCode: reply.statusCode
	    }
	  }
	};

	loggerPino = {
	  serializers,
	  createPinoLogger,
	};
	return loggerPino;
}

var loggerFactory;
var hasRequiredLoggerFactory;

function requireLoggerFactory () {
	if (hasRequiredLoggerFactory) return loggerFactory;
	hasRequiredLoggerFactory = 1;

	const {
	  FST_ERR_LOG_LOGGER_AND_LOGGER_INSTANCE_PROVIDED,
	  FST_ERR_LOG_INVALID_LOGGER_CONFIG,
	  FST_ERR_LOG_INVALID_LOGGER_INSTANCE,
	  FST_ERR_LOG_INVALID_LOGGER
	} = /*@__PURE__*/ requireErrors();

	/**
	 * Utility for creating a child logger with the appropriate bindings, logger factory
	 * and validation.
	 * @param {object} context
	 * @param {import('../fastify').FastifyBaseLogger} logger
	 * @param {import('../fastify').RawRequestDefaultExpression<any>} req
	 * @param {string} reqId
	 * @param {import('../types/logger.js').ChildLoggerOptions?} loggerOpts
	 *
	 * @returns {object} New logger instance, inheriting all parent bindings,
	 * with child bindings added.
	 */
	function createChildLogger (context, logger, req, reqId, loggerOpts) {
	  const loggerBindings = {
	    [context.requestIdLogLabel]: reqId
	  };
	  const child = context.childLoggerFactory.call(context.server, logger, loggerBindings, loggerOpts || {}, req);

	  // Optimization: bypass validation if the factory is our own default factory
	  if (context.childLoggerFactory !== defaultChildLoggerFactory) {
	    validateLogger(child, true); // throw if the child is not a valid logger
	  }

	  return child
	}

	/** Default factory to create child logger instance
	 *
	 * @param {import('../fastify.js').FastifyBaseLogger} logger
	 * @param {import('../types/logger.js').Bindings} bindings
	 * @param {import('../types/logger.js').ChildLoggerOptions} opts
	 *
	 * @returns {import('../types/logger.js').FastifyBaseLogger}
	 */
	function defaultChildLoggerFactory (logger, bindings, opts) {
	  return logger.child(bindings, opts)
	}

	/**
	 * Determines if a provided logger object meets the requirements
	 * of a Fastify compatible logger.
	 *
	 * @param {object} logger Object to validate.
	 * @param {boolean?} strict `true` if the object must be a logger (always throw if any methods missing)
	 *
	 * @returns {boolean} `true` when the logger meets the requirements.
	 *
	 * @throws {FST_ERR_LOG_INVALID_LOGGER} When the logger object is
	 * missing required methods.
	 */
	function validateLogger (logger, strict) {
	  const methods = ['info', 'error', 'debug', 'fatal', 'warn', 'trace', 'child'];
	  const missingMethods = logger
	    ? methods.filter(method => !logger[method] || typeof logger[method] !== 'function')
	    : methods;

	  if (!missingMethods.length) {
	    return true
	  } else if ((missingMethods.length === methods.length) && !strict) {
	    return false
	  } else {
	    throw FST_ERR_LOG_INVALID_LOGGER(missingMethods.join(','))
	  }
	}

	function createLogger (options) {
	  if (options.logger && options.loggerInstance) {
	    throw new FST_ERR_LOG_LOGGER_AND_LOGGER_INSTANCE_PROVIDED()
	  }

	  if (!options.loggerInstance && !options.logger) {
	    const nullLogger = require$$1$1;
	    const logger = nullLogger;
	    logger.child = () => logger;
	    return { logger, hasLogger: false }
	  }

	  const { createPinoLogger, serializers } = /*@__PURE__*/ requireLoggerPino();

	  // check if the logger instance has all required properties
	  if (validateLogger(options.loggerInstance)) {
	    const logger = createPinoLogger({
	      logger: options.loggerInstance,
	      serializers: Object.assign({}, serializers, options.loggerInstance.serializers)
	    });
	    return { logger, hasLogger: true }
	  }

	  // if a logger instance is passed to logger, throw an exception
	  if (validateLogger(options.logger)) {
	    throw FST_ERR_LOG_INVALID_LOGGER_CONFIG()
	  }

	  if (options.loggerInstance) {
	    throw FST_ERR_LOG_INVALID_LOGGER_INSTANCE()
	  }

	  const localLoggerOptions = {};
	  if (Object.prototype.toString.call(options.logger) === '[object Object]') {
	    Reflect.ownKeys(options.logger).forEach(prop => {
	      Object.defineProperty(localLoggerOptions, prop, {
	        value: options.logger[prop],
	        writable: true,
	        enumerable: true,
	        configurable: true
	      });
	    });
	  }
	  localLoggerOptions.level = localLoggerOptions.level || 'info';
	  localLoggerOptions.serializers = Object.assign({}, serializers, localLoggerOptions.serializers);
	  options.logger = localLoggerOptions;
	  const logger = createPinoLogger(options.logger);
	  return { logger, hasLogger: true }
	}

	function now () {
	  const ts = process.hrtime();
	  return (ts[0] * 1e3) + (ts[1] / 1e6)
	}

	loggerFactory = {
	  createChildLogger,
	  defaultChildLoggerFactory,
	  createLogger,
	  validateLogger,
	  now,
	};
	return loggerFactory;
}

var schemas;
var hasRequiredSchemas;

function requireSchemas () {
	if (hasRequiredSchemas) return schemas;
	hasRequiredSchemas = 1;

	const fastClone = require$$0$4({ circles: false, proto: true });
	const { kSchemaVisited, kSchemaResponse } = /*@__PURE__*/ requireSymbols();
	const kFluentSchema = Symbol.for('fluent-schema-object');

	const {
	  FST_ERR_SCH_MISSING_ID,
	  FST_ERR_SCH_ALREADY_PRESENT,
	  FST_ERR_SCH_DUPLICATE,
	  FST_ERR_SCH_CONTENT_MISSING_SCHEMA
	} = /*@__PURE__*/ requireErrors();

	const SCHEMAS_SOURCE = ['params', 'body', 'querystring', 'query', 'headers'];

	function Schemas (initStore) {
	  this.store = initStore || {};
	}

	Schemas.prototype.add = function (inputSchema) {
	  const schema = fastClone((inputSchema.isFluentSchema || inputSchema.isFluentJSONSchema || inputSchema[kFluentSchema])
	    ? inputSchema.valueOf()
	    : inputSchema
	  );

	  // developers can add schemas without $id, but with $def instead
	  const id = schema.$id;
	  if (!id) {
	    throw new FST_ERR_SCH_MISSING_ID()
	  }

	  if (this.store[id]) {
	    throw new FST_ERR_SCH_ALREADY_PRESENT(id)
	  }

	  this.store[id] = schema;
	};

	Schemas.prototype.getSchemas = function () {
	  return Object.assign({}, this.store)
	};

	Schemas.prototype.getSchema = function (schemaId) {
	  return this.store[schemaId]
	};

	/**
	 * Checks whether a schema is a non-plain object.
	 *
	 * @param {*} schema the schema to check
	 * @returns {boolean} true if schema has a custom prototype
	 */
	function isCustomSchemaPrototype (schema) {
	  return typeof schema === 'object' && Object.getPrototypeOf(schema) !== Object.prototype
	}

	function normalizeSchema (routeSchemas, serverOptions) {
	  if (routeSchemas[kSchemaVisited]) {
	    return routeSchemas
	  }

	  // alias query to querystring schema
	  if (routeSchemas.query) {
	    // check if our schema has both querystring and query
	    if (routeSchemas.querystring) {
	      throw new FST_ERR_SCH_DUPLICATE('querystring')
	    }
	    routeSchemas.querystring = routeSchemas.query;
	  }

	  generateFluentSchema(routeSchemas);

	  for (const key of SCHEMAS_SOURCE) {
	    const schema = routeSchemas[key];
	    if (schema && !isCustomSchemaPrototype(schema)) {
	      if (key === 'body' && schema.content) {
	        const contentProperty = schema.content;
	        const keys = Object.keys(contentProperty);
	        for (let i = 0; i < keys.length; i++) {
	          const contentType = keys[i];
	          const contentSchema = contentProperty[contentType].schema;
	          if (!contentSchema) {
	            throw new FST_ERR_SCH_CONTENT_MISSING_SCHEMA(contentType)
	          }
	        }
	        continue
	      }
	    }
	  }

	  if (routeSchemas.response) {
	    const httpCodes = Object.keys(routeSchemas.response);
	    for (const code of httpCodes) {
	      if (isCustomSchemaPrototype(routeSchemas.response[code])) {
	        continue
	      }

	      const contentProperty = routeSchemas.response[code].content;

	      if (contentProperty) {
	        const keys = Object.keys(contentProperty);
	        for (let i = 0; i < keys.length; i++) {
	          const mediaName = keys[i];
	          if (!contentProperty[mediaName].schema) {
	            throw new FST_ERR_SCH_CONTENT_MISSING_SCHEMA(mediaName)
	          }
	        }
	      }
	    }
	  }

	  routeSchemas[kSchemaVisited] = true;
	  return routeSchemas
	}

	function generateFluentSchema (schema) {
	  for (const key of SCHEMAS_SOURCE) {
	    if (schema[key] && (schema[key].isFluentSchema || schema[key][kFluentSchema])) {
	      schema[key] = schema[key].valueOf();
	    }
	  }

	  if (schema.response) {
	    const httpCodes = Object.keys(schema.response);
	    for (const code of httpCodes) {
	      if (schema.response[code].isFluentSchema || schema.response[code][kFluentSchema]) {
	        schema.response[code] = schema.response[code].valueOf();
	      }
	    }
	  }
	}

	/**
	 * Search for the right JSON schema compiled function in the request context
	 * setup by the route configuration `schema.response`.
	 * It will look for the exact match (eg 200) or generic (eg 2xx)
	 *
	 * @param {object} context the request context
	 * @param {number} statusCode the http status code
	 * @param {string} [contentType] the reply content type
	 * @returns {function|false} the right JSON Schema function to serialize
	 * the reply or false if it is not set
	 */
	function getSchemaSerializer (context, statusCode, contentType) {
	  const responseSchemaDef = context[kSchemaResponse];
	  if (!responseSchemaDef) {
	    return false
	  }
	  if (responseSchemaDef[statusCode]) {
	    if (responseSchemaDef[statusCode].constructor === Object && contentType) {
	      const mediaName = contentType.split(';', 1)[0];
	      if (responseSchemaDef[statusCode][mediaName]) {
	        return responseSchemaDef[statusCode][mediaName]
	      }

	      // fallback to match all media-type
	      if (responseSchemaDef[statusCode]['*/*']) {
	        return responseSchemaDef[statusCode]['*/*']
	      }

	      return false
	    }
	    return responseSchemaDef[statusCode]
	  }
	  const fallbackStatusCode = (statusCode + '')[0] + 'xx';
	  if (responseSchemaDef[fallbackStatusCode]) {
	    if (responseSchemaDef[fallbackStatusCode].constructor === Object && contentType) {
	      const mediaName = contentType.split(';', 1)[0];
	      if (responseSchemaDef[fallbackStatusCode][mediaName]) {
	        return responseSchemaDef[fallbackStatusCode][mediaName]
	      }

	      // fallback to match all media-type
	      if (responseSchemaDef[fallbackStatusCode]['*/*']) {
	        return responseSchemaDef[fallbackStatusCode]['*/*']
	      }

	      return false
	    }

	    return responseSchemaDef[fallbackStatusCode]
	  }
	  if (responseSchemaDef.default) {
	    if (responseSchemaDef.default.constructor === Object && contentType) {
	      const mediaName = contentType.split(';', 1)[0];
	      if (responseSchemaDef.default[mediaName]) {
	        return responseSchemaDef.default[mediaName]
	      }

	      // fallback to match all media-type
	      if (responseSchemaDef.default['*/*']) {
	        return responseSchemaDef.default['*/*']
	      }

	      return false
	    }

	    return responseSchemaDef.default
	  }
	  return false
	}

	schemas = {
	  buildSchemas (initStore) { return new Schemas(initStore) },
	  getSchemaSerializer,
	  normalizeSchema
	};
	return schemas;
}

var errorSerializer;
var hasRequiredErrorSerializer;

function requireErrorSerializer () {
	if (hasRequiredErrorSerializer) return errorSerializer;
	hasRequiredErrorSerializer = 1;

	  const Serializer = require$$0$5;
	  const serializerState = {"mode":"standalone"};
	  const serializer = Serializer.restoreFromState(serializerState);

	  const validator = null;


	  errorSerializer = function anonymous(validator,serializer
	) {

	    const JSON_STR_BEGIN_OBJECT = '{';
	    const JSON_STR_END_OBJECT = '}';
	    const JSON_STR_COMMA = ',';
	    const JSON_STR_QUOTE = '"';
	    const JSON_STR_EMPTY_OBJECT = JSON_STR_BEGIN_OBJECT + JSON_STR_END_OBJECT;
	    const JSON_STR_EMPTY_STRING = JSON_STR_QUOTE + JSON_STR_QUOTE;
	  
	    
	  
	    // #
	    function anonymous0 (input) {
	      const obj = (input && typeof input.toJSON === 'function')
	    ? input.toJSON()
	    : input;
	  
	      if (obj === null) return JSON_STR_EMPTY_OBJECT

	      let value;
	let json = JSON_STR_BEGIN_OBJECT;
	let addComma = false;

	      value = obj["statusCode"];
	      if (value !== undefined) {
	        !addComma && (addComma = true) || (json += JSON_STR_COMMA);
	        json += "\"statusCode\":";
	        json += serializer.asNumber(value);
	      }

	      value = obj["code"];
	      if (value !== undefined) {
	        !addComma && (addComma = true) || (json += JSON_STR_COMMA);
	        json += "\"code\":";
	        
	        if (typeof value !== 'string') {
	          if (value === null) {
	            json += JSON_STR_EMPTY_STRING;
	          } else if (value instanceof Date) {
	            json += JSON_STR_QUOTE + value.toISOString() + JSON_STR_QUOTE;
	          } else if (value instanceof RegExp) {
	            json += serializer.asString(value.source);
	          } else {
	            json += serializer.asString(value.toString());
	          }
	        } else {
	          json += serializer.asString(value);
	        }
	        
	      }

	      value = obj["error"];
	      if (value !== undefined) {
	        !addComma && (addComma = true) || (json += JSON_STR_COMMA);
	        json += "\"error\":";
	        
	        if (typeof value !== 'string') {
	          if (value === null) {
	            json += JSON_STR_EMPTY_STRING;
	          } else if (value instanceof Date) {
	            json += JSON_STR_QUOTE + value.toISOString() + JSON_STR_QUOTE;
	          } else if (value instanceof RegExp) {
	            json += serializer.asString(value.source);
	          } else {
	            json += serializer.asString(value.toString());
	          }
	        } else {
	          json += serializer.asString(value);
	        }
	        
	      }

	      value = obj["message"];
	      if (value !== undefined) {
	        !addComma && (addComma = true) || (json += JSON_STR_COMMA);
	        json += "\"message\":";
	        
	        if (typeof value !== 'string') {
	          if (value === null) {
	            json += JSON_STR_EMPTY_STRING;
	          } else if (value instanceof Date) {
	            json += JSON_STR_QUOTE + value.toISOString() + JSON_STR_QUOTE;
	          } else if (value instanceof RegExp) {
	            json += serializer.asString(value.source);
	          } else {
	            json += serializer.asString(value.toString());
	          }
	        } else {
	          json += serializer.asString(value);
	        }
	        
	      }

	    return json + JSON_STR_END_OBJECT
	  
	    }
	  
	    const main = anonymous0;
	    return main
	    
	}(validator, serializer);
	/* c8 ignore stop */
	return errorSerializer;
}

var errorHandler;
var hasRequiredErrorHandler;

function requireErrorHandler () {
	if (hasRequiredErrorHandler) return errorHandler;
	hasRequiredErrorHandler = 1;

	const statusCodes = require$$0.STATUS_CODES;
	const wrapThenable = /*@__PURE__*/ requireWrapThenable();
	const {
	  kReplyHeaders,
	  kReplyNextErrorHandler,
	  kReplyIsRunningOnErrorHook,
	  kReplyHasStatusCode,
	  kRouteContext,
	  kDisableRequestLogging
	} = /*@__PURE__*/ requireSymbols();

	const {
	  FST_ERR_REP_INVALID_PAYLOAD_TYPE,
	  FST_ERR_FAILED_ERROR_SERIALIZATION
	} = /*@__PURE__*/ requireErrors();

	const { getSchemaSerializer } = /*@__PURE__*/ requireSchemas();

	const serializeError = /*@__PURE__*/ requireErrorSerializer();

	const rootErrorHandler = {
	  func: defaultErrorHandler,
	  toJSON () {
	    return this.func.name.toString() + '()'
	  }
	};

	function handleError (reply, error, cb) {
	  reply[kReplyIsRunningOnErrorHook] = false;

	  const context = reply[kRouteContext];
	  if (reply[kReplyNextErrorHandler] === false) {
	    fallbackErrorHandler(error, reply, function (reply, payload) {
	      try {
	        reply.raw.writeHead(reply.raw.statusCode, reply[kReplyHeaders]);
	      } catch (error) {
	        if (!reply.log[kDisableRequestLogging]) {
	          reply.log.warn(
	            { req: reply.request, res: reply, err: error },
	            error && error.message
	          );
	        }
	        reply.raw.writeHead(reply.raw.statusCode);
	      }
	      reply.raw.end(payload);
	    });
	    return
	  }
	  const errorHandler = reply[kReplyNextErrorHandler] || context.errorHandler;

	  // In case the error handler throws, we set the next errorHandler so we can error again
	  reply[kReplyNextErrorHandler] = Object.getPrototypeOf(errorHandler);

	  // we need to remove content-type to allow content-type guessing for serialization
	  delete reply[kReplyHeaders]['content-type'];
	  delete reply[kReplyHeaders]['content-length'];

	  const func = errorHandler.func;

	  if (!func) {
	    reply[kReplyNextErrorHandler] = false;
	    fallbackErrorHandler(error, reply, cb);
	    return
	  }

	  try {
	    const result = func(error, reply.request, reply);
	    if (result !== undefined) {
	      if (result !== null && typeof result.then === 'function') {
	        wrapThenable(result, reply);
	      } else {
	        reply.send(result);
	      }
	    }
	  } catch (err) {
	    reply.send(err);
	  }
	}

	function defaultErrorHandler (error, request, reply) {
	  setErrorHeaders(error, reply);
	  if (!reply[kReplyHasStatusCode] || reply.statusCode === 200) {
	    const statusCode = error.statusCode || error.status;
	    reply.code(statusCode >= 400 ? statusCode : 500);
	  }
	  if (reply.statusCode < 500) {
	    if (!reply.log[kDisableRequestLogging]) {
	      reply.log.info(
	        { res: reply, err: error },
	        error && error.message
	      );
	    }
	  } else {
	    if (!reply.log[kDisableRequestLogging]) {
	      reply.log.error(
	        { req: request, res: reply, err: error },
	        error && error.message
	      );
	    }
	  }
	  reply.send(error);
	}

	function fallbackErrorHandler (error, reply, cb) {
	  const res = reply.raw;
	  const statusCode = reply.statusCode;
	  reply[kReplyHeaders]['content-type'] = reply[kReplyHeaders]['content-type'] ?? 'application/json; charset=utf-8';
	  let payload;
	  try {
	    const serializerFn = getSchemaSerializer(reply[kRouteContext], statusCode, reply[kReplyHeaders]['content-type']);
	    payload = (serializerFn === false)
	      ? serializeError({
	          error: statusCodes[statusCode + ''],
	          code: error.code,
	          message: error.message,
	          statusCode
	        })
	      : serializerFn(Object.create(error, {
	          error: { value: statusCodes[statusCode + ''] },
	          message: { value: error.message },
	          statusCode: { value: statusCode }
	        }));
	  } catch (err) {
	    if (!reply.log[kDisableRequestLogging]) {
	      // error is always FST_ERR_SCH_SERIALIZATION_BUILD because this is called from route/compileSchemasForSerialization
	      reply.log.error({ err, statusCode: res.statusCode }, 'The serializer for the given status code failed');
	    }
	    reply.code(500);
	    payload = serializeError(new FST_ERR_FAILED_ERROR_SERIALIZATION(err.message, error.message));
	  }

	  if (typeof payload !== 'string' && !Buffer.isBuffer(payload)) {
	    payload = serializeError(new FST_ERR_REP_INVALID_PAYLOAD_TYPE(typeof payload));
	  }

	  reply[kReplyHeaders]['content-length'] = '' + Buffer.byteLength(payload);

	  cb(reply, payload);
	}

	function buildErrorHandler (parent = rootErrorHandler, func) {
	  if (!func) {
	    return parent
	  }

	  const errorHandler = Object.create(parent);
	  errorHandler.func = func;
	  return errorHandler
	}

	function setErrorHeaders (error, reply) {
	  const res = reply.raw;
	  let statusCode = res.statusCode;
	  statusCode = (statusCode >= 400) ? statusCode : 500;
	  // treat undefined and null as same
	  if (error != null) {
	    if (error.headers !== undefined) {
	      reply.headers(error.headers);
	    }
	    if (error.status >= 400) {
	      statusCode = error.status;
	    } else if (error.statusCode >= 400) {
	      statusCode = error.statusCode;
	    }
	  }
	  res.statusCode = statusCode;
	}

	errorHandler = {
	  buildErrorHandler,
	  handleError
	};
	return errorHandler;
}

var hasRequiredReply;

function requireReply () {
	if (hasRequiredReply) return reply.exports;
	hasRequiredReply = 1;

	const eos = require$$0$6.finished;
	const Readable = require$$0$6.Readable;

	const {
	  kFourOhFourContext,
	  kReplyErrorHandlerCalled,
	  kReplyHijacked,
	  kReplyStartTime,
	  kReplyEndTime,
	  kReplySerializer,
	  kReplySerializerDefault,
	  kReplyIsError,
	  kReplyHeaders,
	  kReplyTrailers,
	  kReplyHasStatusCode,
	  kReplyIsRunningOnErrorHook,
	  kReplyNextErrorHandler,
	  kDisableRequestLogging,
	  kSchemaResponse,
	  kReplyCacheSerializeFns,
	  kSchemaController,
	  kOptions,
	  kRouteContext
	} = /*@__PURE__*/ requireSymbols();
	const {
	  onSendHookRunner,
	  onResponseHookRunner,
	  preHandlerHookRunner,
	  preSerializationHookRunner
	} = /*@__PURE__*/ requireHooks();

	const internals = /*@__PURE__*/ requireHandleRequest()[Symbol.for('internals')];
	const loggerUtils = /*@__PURE__*/ requireLoggerFactory();
	const now = loggerUtils.now;
	const { handleError } = /*@__PURE__*/ requireErrorHandler();
	const { getSchemaSerializer } = /*@__PURE__*/ requireSchemas();

	const CONTENT_TYPE = {
	  JSON: 'application/json; charset=utf-8',
	  PLAIN: 'text/plain; charset=utf-8',
	  OCTET: 'application/octet-stream'
	};
	const {
	  FST_ERR_REP_INVALID_PAYLOAD_TYPE,
	  FST_ERR_REP_RESPONSE_BODY_CONSUMED,
	  FST_ERR_REP_ALREADY_SENT,
	  FST_ERR_SEND_INSIDE_ONERR,
	  FST_ERR_BAD_STATUS_CODE,
	  FST_ERR_BAD_TRAILER_NAME,
	  FST_ERR_BAD_TRAILER_VALUE,
	  FST_ERR_MISSING_SERIALIZATION_FN,
	  FST_ERR_MISSING_CONTENTTYPE_SERIALIZATION_FN
	} = /*@__PURE__*/ requireErrors();

	const toString = Object.prototype.toString;

	function Reply (res, request, log) {
	  this.raw = res;
	  this[kReplySerializer] = null;
	  this[kReplyErrorHandlerCalled] = false;
	  this[kReplyIsError] = false;
	  this[kReplyIsRunningOnErrorHook] = false;
	  this.request = request;
	  this[kReplyHeaders] = {};
	  this[kReplyTrailers] = null;
	  this[kReplyHasStatusCode] = false;
	  this[kReplyStartTime] = undefined;
	  this.log = log;
	}
	Reply.props = [];

	Object.defineProperties(Reply.prototype, {
	  [kRouteContext]: {
	    get () {
	      return this.request[kRouteContext]
	    }
	  },
	  elapsedTime: {
	    get () {
	      if (this[kReplyStartTime] === undefined) {
	        return 0
	      }
	      return (this[kReplyEndTime] || now()) - this[kReplyStartTime]
	    }
	  },
	  server: {
	    get () {
	      return this.request[kRouteContext].server
	    }
	  },
	  sent: {
	    enumerable: true,
	    get () {
	      // We are checking whether reply was hijacked or the response has ended.
	      return (this[kReplyHijacked] || this.raw.writableEnded) === true
	    }
	  },
	  statusCode: {
	    get () {
	      return this.raw.statusCode
	    },
	    set (value) {
	      this.code(value);
	    }
	  },
	  routeOptions: {
	    get () {
	      return this.request.routeOptions
	    }
	  }
	});

	Reply.prototype.writeEarlyHints = function (hints, callback) {
	  this.raw.writeEarlyHints(hints, callback);
	  return this
	};

	Reply.prototype.hijack = function () {
	  this[kReplyHijacked] = true;
	  return this
	};

	Reply.prototype.send = function (payload) {
	  if (this[kReplyIsRunningOnErrorHook] === true) {
	    throw new FST_ERR_SEND_INSIDE_ONERR()
	  }

	  if (this.sent) {
	    this.log.warn({ err: new FST_ERR_REP_ALREADY_SENT(this.request.url, this.request.method) });
	    return this
	  }

	  if (payload instanceof Error || this[kReplyIsError] === true) {
	    this[kReplyIsError] = false;
	    onErrorHook(this, payload, onSendHook);
	    return this
	  }

	  if (payload === undefined) {
	    onSendHook(this, payload);
	    return this
	  }

	  const contentType = this.getHeader('content-type');
	  const hasContentType = contentType !== undefined;

	  if (payload !== null) {
	    if (
	      // node:stream
	      typeof payload.pipe === 'function' ||
	      // node:stream/web
	      typeof payload.getReader === 'function' ||
	      // Response
	      toString.call(payload) === '[object Response]'
	    ) {
	      onSendHook(this, payload);
	      return this
	    }

	    if (payload?.buffer instanceof ArrayBuffer) {
	      if (hasContentType === false) {
	        this[kReplyHeaders]['content-type'] = CONTENT_TYPE.OCTET;
	      }
	      const payloadToSend = Buffer.isBuffer(payload) ? payload : Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength);
	      onSendHook(this, payloadToSend);
	      return this
	    }

	    if (hasContentType === false && typeof payload === 'string') {
	      this[kReplyHeaders]['content-type'] = CONTENT_TYPE.PLAIN;
	      onSendHook(this, payload);
	      return this
	    }
	  }

	  if (this[kReplySerializer] !== null) {
	    if (typeof payload !== 'string') {
	      preSerializationHook(this, payload);
	      return this
	    } else {
	      payload = this[kReplySerializer](payload);
	    }

	    // The indexOf below also matches custom json mimetypes such as 'application/hal+json' or 'application/ld+json'
	  } else if (hasContentType === false || contentType.indexOf('json') > -1) {
	    if (hasContentType === false) {
	      this[kReplyHeaders]['content-type'] = CONTENT_TYPE.JSON;
	    } else {
	      // If user doesn't set charset, we will set charset to utf-8
	      if (contentType.indexOf('charset') === -1) {
	        const customContentType = contentType.trim();
	        if (customContentType.endsWith(';')) {
	          // custom content-type is ended with ';'
	          this[kReplyHeaders]['content-type'] = `${customContentType} charset=utf-8`;
	        } else {
	          this[kReplyHeaders]['content-type'] = `${customContentType}; charset=utf-8`;
	        }
	      }
	    }
	    if (typeof payload !== 'string') {
	      preSerializationHook(this, payload);
	      return this
	    }
	  }

	  onSendHook(this, payload);

	  return this
	};

	Reply.prototype.getHeader = function (key) {
	  key = key.toLowerCase();
	  const res = this.raw;
	  let value = this[kReplyHeaders][key];
	  if (value === undefined && res.hasHeader(key)) {
	    value = res.getHeader(key);
	  }
	  return value
	};

	Reply.prototype.getHeaders = function () {
	  return {
	    ...this.raw.getHeaders(),
	    ...this[kReplyHeaders]
	  }
	};

	Reply.prototype.hasHeader = function (key) {
	  key = key.toLowerCase();

	  return this[kReplyHeaders][key] !== undefined || this.raw.hasHeader(key)
	};

	Reply.prototype.removeHeader = function (key) {
	  // Node.js does not like headers with keys set to undefined,
	  // so we have to delete the key.
	  delete this[kReplyHeaders][key.toLowerCase()];
	  return this
	};

	Reply.prototype.header = function (key, value = '') {
	  key = key.toLowerCase();

	  if (this[kReplyHeaders][key] && key === 'set-cookie') {
	    // https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.2
	    if (typeof this[kReplyHeaders][key] === 'string') {
	      this[kReplyHeaders][key] = [this[kReplyHeaders][key]];
	    }

	    if (Array.isArray(value)) {
	      Array.prototype.push.apply(this[kReplyHeaders][key], value);
	    } else {
	      this[kReplyHeaders][key].push(value);
	    }
	  } else {
	    this[kReplyHeaders][key] = value;
	  }

	  return this
	};

	Reply.prototype.headers = function (headers) {
	  const keys = Object.keys(headers);
	  for (let i = 0; i !== keys.length; ++i) {
	    const key = keys[i];
	    this.header(key, headers[key]);
	  }

	  return this
	};

	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Trailer#directives
	// https://datatracker.ietf.org/doc/html/rfc7230.html#chunked.trailer.part
	const INVALID_TRAILERS = new Set([
	  'transfer-encoding',
	  'content-length',
	  'host',
	  'cache-control',
	  'max-forwards',
	  'te',
	  'authorization',
	  'set-cookie',
	  'content-encoding',
	  'content-type',
	  'content-range',
	  'trailer'
	]);

	Reply.prototype.trailer = function (key, fn) {
	  key = key.toLowerCase();
	  if (INVALID_TRAILERS.has(key)) {
	    throw new FST_ERR_BAD_TRAILER_NAME(key)
	  }
	  if (typeof fn !== 'function') {
	    throw new FST_ERR_BAD_TRAILER_VALUE(key, typeof fn)
	  }
	  if (this[kReplyTrailers] === null) this[kReplyTrailers] = {};
	  this[kReplyTrailers][key] = fn;
	  return this
	};

	Reply.prototype.hasTrailer = function (key) {
	  return this[kReplyTrailers]?.[key.toLowerCase()] !== undefined
	};

	Reply.prototype.removeTrailer = function (key) {
	  if (this[kReplyTrailers] === null) return this
	  this[kReplyTrailers][key.toLowerCase()] = undefined;
	  return this
	};

	Reply.prototype.code = function (code) {
	  const intValue = Number(code);
	  if (isNaN(intValue) || intValue < 100 || intValue > 599) {
	    throw new FST_ERR_BAD_STATUS_CODE(code || String(code))
	  }

	  this.raw.statusCode = intValue;
	  this[kReplyHasStatusCode] = true;
	  return this
	};

	Reply.prototype.status = Reply.prototype.code;

	Reply.prototype.getSerializationFunction = function (schemaOrStatus, contentType) {
	  let serialize;

	  if (typeof schemaOrStatus === 'string' || typeof schemaOrStatus === 'number') {
	    if (typeof contentType === 'string') {
	      serialize = this[kRouteContext][kSchemaResponse]?.[schemaOrStatus]?.[contentType];
	    } else {
	      serialize = this[kRouteContext][kSchemaResponse]?.[schemaOrStatus];
	    }
	  } else if (typeof schemaOrStatus === 'object') {
	    serialize = this[kRouteContext][kReplyCacheSerializeFns]?.get(schemaOrStatus);
	  }

	  return serialize
	};

	Reply.prototype.compileSerializationSchema = function (schema, httpStatus = null, contentType = null) {
	  const { request } = this;
	  const { method, url } = request;

	  // Check if serialize function already compiled
	  if (this[kRouteContext][kReplyCacheSerializeFns]?.has(schema)) {
	    return this[kRouteContext][kReplyCacheSerializeFns].get(schema)
	  }

	  const serializerCompiler = this[kRouteContext].serializerCompiler ||
	    this.server[kSchemaController].serializerCompiler ||
	    (
	      // We compile the schemas if no custom serializerCompiler is provided
	      // nor set
	      this.server[kSchemaController].setupSerializer(this.server[kOptions]) ||
	      this.server[kSchemaController].serializerCompiler
	    );

	  const serializeFn = serializerCompiler({
	    schema,
	    method,
	    url,
	    httpStatus,
	    contentType
	  });

	  // We create a WeakMap to compile the schema only once
	  // Its done lazily to avoid add overhead by creating the WeakMap
	  // if it is not used
	  // TODO: Explore a central cache for all the schemas shared across
	  // encapsulated contexts
	  if (this[kRouteContext][kReplyCacheSerializeFns] == null) {
	    this[kRouteContext][kReplyCacheSerializeFns] = new WeakMap();
	  }

	  this[kRouteContext][kReplyCacheSerializeFns].set(schema, serializeFn);

	  return serializeFn
	};

	Reply.prototype.serializeInput = function (input, schema, httpStatus, contentType) {
	  const possibleContentType = httpStatus;
	  let serialize;
	  httpStatus = typeof schema === 'string' || typeof schema === 'number'
	    ? schema
	    : httpStatus;

	  contentType = httpStatus && possibleContentType !== httpStatus
	    ? possibleContentType
	    : contentType;

	  if (httpStatus != null) {
	    if (contentType != null) {
	      serialize = this[kRouteContext][kSchemaResponse]?.[httpStatus]?.[contentType];
	    } else {
	      serialize = this[kRouteContext][kSchemaResponse]?.[httpStatus];
	    }

	    if (serialize == null) {
	      if (contentType) throw new FST_ERR_MISSING_CONTENTTYPE_SERIALIZATION_FN(httpStatus, contentType)
	      throw new FST_ERR_MISSING_SERIALIZATION_FN(httpStatus)
	    }
	  } else {
	    // Check if serialize function already compiled
	    if (this[kRouteContext][kReplyCacheSerializeFns]?.has(schema)) {
	      serialize = this[kRouteContext][kReplyCacheSerializeFns].get(schema);
	    } else {
	      serialize = this.compileSerializationSchema(schema, httpStatus, contentType);
	    }
	  }

	  return serialize(input)
	};

	Reply.prototype.serialize = function (payload) {
	  if (this[kReplySerializer] !== null) {
	    return this[kReplySerializer](payload)
	  } else {
	    if (this[kRouteContext] && this[kRouteContext][kReplySerializerDefault]) {
	      return this[kRouteContext][kReplySerializerDefault](payload, this.raw.statusCode)
	    } else {
	      return serialize(this[kRouteContext], payload, this.raw.statusCode)
	    }
	  }
	};

	Reply.prototype.serializer = function (fn) {
	  this[kReplySerializer] = fn;
	  return this
	};

	Reply.prototype.type = function (type) {
	  this[kReplyHeaders]['content-type'] = type;
	  return this
	};

	Reply.prototype.redirect = function (url, code) {
	  if (!code) {
	    code = this[kReplyHasStatusCode] ? this.raw.statusCode : 302;
	  }

	  return this.header('location', url).code(code).send()
	};

	Reply.prototype.callNotFound = function () {
	  notFound(this);
	  return this
	};

	// Make reply a thenable, so it could be used with async/await.
	// See
	// - https://github.com/fastify/fastify/issues/1864 for the discussions
	// - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then for the signature
	Reply.prototype.then = function (fulfilled, rejected) {
	  if (this.sent) {
	    fulfilled();
	    return
	  }

	  eos(this.raw, (err) => {
	    // We must not treat ERR_STREAM_PREMATURE_CLOSE as
	    // an error because it is created by eos, not by the stream.
	    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
	      if (rejected) {
	        rejected(err);
	      } else {
	        this.log && this.log.warn('unhandled rejection on reply.then');
	      }
	    } else {
	      fulfilled();
	    }
	  });
	};

	function preSerializationHook (reply, payload) {
	  if (reply[kRouteContext].preSerialization !== null) {
	    preSerializationHookRunner(
	      reply[kRouteContext].preSerialization,
	      reply.request,
	      reply,
	      payload,
	      preSerializationHookEnd
	    );
	  } else {
	    preSerializationHookEnd(null, reply.request, reply, payload);
	  }
	}

	function preSerializationHookEnd (err, request, reply, payload) {
	  if (err != null) {
	    onErrorHook(reply, err);
	    return
	  }

	  try {
	    if (reply[kReplySerializer] !== null) {
	      payload = reply[kReplySerializer](payload);
	    } else if (reply[kRouteContext] && reply[kRouteContext][kReplySerializerDefault]) {
	      payload = reply[kRouteContext][kReplySerializerDefault](payload, reply.raw.statusCode);
	    } else {
	      payload = serialize(reply[kRouteContext], payload, reply.raw.statusCode, reply[kReplyHeaders]['content-type']);
	    }
	  } catch (e) {
	    wrapSerializationError(e, reply);
	    onErrorHook(reply, e);
	    return
	  }

	  onSendHook(reply, payload);
	}

	function wrapSerializationError (error, reply) {
	  error.serialization = reply[kRouteContext].config;
	}

	function onSendHook (reply, payload) {
	  if (reply[kRouteContext].onSend !== null) {
	    onSendHookRunner(
	      reply[kRouteContext].onSend,
	      reply.request,
	      reply,
	      payload,
	      wrapOnSendEnd
	    );
	  } else {
	    onSendEnd(reply, payload);
	  }
	}

	function wrapOnSendEnd (err, request, reply, payload) {
	  if (err != null) {
	    onErrorHook(reply, err);
	  } else {
	    onSendEnd(reply, payload);
	  }
	}

	function safeWriteHead (reply, statusCode) {
	  const res = reply.raw;
	  try {
	    res.writeHead(statusCode, reply[kReplyHeaders]);
	  } catch (err) {
	    if (err.code === 'ERR_HTTP_HEADERS_SENT') {
	      reply.log.warn(`Reply was already sent, did you forget to "return reply" in the "${reply.request.raw.url}" (${reply.request.raw.method}) route?`);
	    }
	    throw err
	  }
	}

	function onSendEnd (reply, payload) {
	  const res = reply.raw;
	  const req = reply.request;

	  // we check if we need to update the trailers header and set it
	  if (reply[kReplyTrailers] !== null) {
	    const trailerHeaders = Object.keys(reply[kReplyTrailers]);
	    let header = '';
	    for (const trailerName of trailerHeaders) {
	      if (typeof reply[kReplyTrailers][trailerName] !== 'function') continue
	      header += ' ';
	      header += trailerName;
	    }
	    // it must be chunked for trailer to work
	    reply.header('Transfer-Encoding', 'chunked');
	    reply.header('Trailer', header.trim());
	  }

	  // since Response contain status code, headers and body,
	  // we need to update the status, add the headers and use it's body as payload
	  // before continuing
	  if (toString.call(payload) === '[object Response]') {
	    // https://developer.mozilla.org/en-US/docs/Web/API/Response/status
	    if (typeof payload.status === 'number') {
	      reply.code(payload.status);
	    }

	    // https://developer.mozilla.org/en-US/docs/Web/API/Response/headers
	    if (typeof payload.headers === 'object' && typeof payload.headers.forEach === 'function') {
	      for (const [headerName, headerValue] of payload.headers) {
	        reply.header(headerName, headerValue);
	      }
	    }

	    // https://developer.mozilla.org/en-US/docs/Web/API/Response/body
	    if (payload.body !== null) {
	      if (payload.bodyUsed) {
	        throw new FST_ERR_REP_RESPONSE_BODY_CONSUMED()
	      }
	    }
	    // Keep going, body is either null or ReadableStream
	    payload = payload.body;
	  }
	  const statusCode = res.statusCode;

	  if (payload === undefined || payload === null) {
	    // according to https://datatracker.ietf.org/doc/html/rfc7230#section-3.3.2
	    // we cannot send a content-length for 304 and 204, and all status code
	    // < 200
	    // A sender MUST NOT send a Content-Length header field in any message
	    // that contains a Transfer-Encoding header field.
	    // For HEAD we don't overwrite the `content-length`
	    if (statusCode >= 200 && statusCode !== 204 && statusCode !== 304 && req.method !== 'HEAD' && reply[kReplyTrailers] === null) {
	      reply[kReplyHeaders]['content-length'] = '0';
	    }

	    safeWriteHead(reply, statusCode);
	    sendTrailer(payload, res, reply);
	    return
	  }

	  if ((statusCode >= 100 && statusCode < 200) || statusCode === 204) {
	    // Responses without a content body must not send content-type
	    // or content-length headers.
	    // See https://www.rfc-editor.org/rfc/rfc9110.html#section-8.6.
	    reply.removeHeader('content-type');
	    reply.removeHeader('content-length');
	    safeWriteHead(reply, statusCode);
	    sendTrailer(undefined, res, reply);
	    if (typeof payload.resume === 'function') {
	      payload.on('error', noop);
	      payload.resume();
	    }
	    return
	  }

	  // node:stream
	  if (typeof payload.pipe === 'function') {
	    sendStream(payload, res, reply);
	    return
	  }

	  // node:stream/web
	  if (typeof payload.getReader === 'function') {
	    sendWebStream(payload, res, reply);
	    return
	  }

	  if (typeof payload !== 'string' && !Buffer.isBuffer(payload)) {
	    throw new FST_ERR_REP_INVALID_PAYLOAD_TYPE(typeof payload)
	  }

	  if (reply[kReplyTrailers] === null) {
	    const contentLength = reply[kReplyHeaders]['content-length'];
	    if (!contentLength ||
	      (req.raw.method !== 'HEAD' &&
	        Number(contentLength) !== Buffer.byteLength(payload)
	      )
	    ) {
	      reply[kReplyHeaders]['content-length'] = '' + Buffer.byteLength(payload);
	    }
	  }

	  safeWriteHead(reply, statusCode);
	  // write payload first
	  res.write(payload);
	  // then send trailers
	  sendTrailer(payload, res, reply);
	}

	function logStreamError (logger, err, res) {
	  if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
	    if (!logger[kDisableRequestLogging]) {
	      logger.info({ res }, 'stream closed prematurely');
	    }
	  } else {
	    logger.warn({ err }, 'response terminated with an error with headers already sent');
	  }
	}

	function sendWebStream (payload, res, reply) {
	  const nodeStream = Readable.fromWeb(payload);
	  sendStream(nodeStream, res, reply);
	}

	function sendStream (payload, res, reply) {
	  let sourceOpen = true;
	  let errorLogged = false;

	  // set trailer when stream ended
	  sendStreamTrailer(payload, res, reply);

	  eos(payload, { readable: true, writable: false }, function (err) {
	    sourceOpen = false;
	    if (err != null) {
	      if (res.headersSent || reply.request.raw.aborted === true) {
	        if (!errorLogged) {
	          errorLogged = true;
	          logStreamError(reply.log, err, reply);
	        }
	        res.destroy();
	      } else {
	        onErrorHook(reply, err);
	      }
	    }
	    // there is nothing to do if there is not an error
	  });

	  eos(res, function (err) {
	    if (sourceOpen) {
	      if (err != null && res.headersSent && !errorLogged) {
	        errorLogged = true;
	        logStreamError(reply.log, err, res);
	      }
	      if (typeof payload.destroy === 'function') {
	        payload.destroy();
	      } else if (typeof payload.close === 'function') {
	        payload.close(noop);
	      } else if (typeof payload.abort === 'function') {
	        payload.abort();
	      } else {
	        reply.log.warn('stream payload does not end properly');
	      }
	    }
	  });

	  // streams will error asynchronously, and we want to handle that error
	  // appropriately, e.g. a 404 for a missing file. So we cannot use
	  // writeHead, and we need to resort to setHeader, which will trigger
	  // a writeHead when there is data to send.
	  if (!res.headersSent) {
	    for (const key in reply[kReplyHeaders]) {
	      res.setHeader(key, reply[kReplyHeaders][key]);
	    }
	  } else {
	    reply.log.warn('response will send, but you shouldn\'t use res.writeHead in stream mode');
	  }
	  payload.pipe(res);
	}

	function sendTrailer (payload, res, reply) {
	  if (reply[kReplyTrailers] === null) {
	    // when no trailer, we close the stream
	    res.end(null, null, null); // avoid ArgumentsAdaptorTrampoline from V8
	    return
	  }
	  const trailerHeaders = Object.keys(reply[kReplyTrailers]);
	  const trailers = {};
	  let handled = 0;
	  let skipped = true;
	  function send () {
	    // add trailers when all handler handled
	    /* istanbul ignore else */
	    if (handled === 0) {
	      res.addTrailers(trailers);
	      // we need to properly close the stream
	      // after trailers sent
	      res.end(null, null, null); // avoid ArgumentsAdaptorTrampoline from V8
	    }
	  }

	  for (const trailerName of trailerHeaders) {
	    if (typeof reply[kReplyTrailers][trailerName] !== 'function') continue
	    skipped = false;
	    handled--;

	    function cb (err, value) {
	      // TODO: we may protect multiple callback calls
	      //       or mixing async-await with callback
	      handled++;

	      // we can safely ignore error for trailer
	      // since it does affect the client
	      // we log in here only for debug usage
	      if (err) reply.log.debug(err);
	      else trailers[trailerName] = value;

	      // we push the check to the end of event
	      // loop, so the registration continue to
	      // process.
	      process.nextTick(send);
	    }

	    const result = reply[kReplyTrailers][trailerName](reply, payload, cb);
	    if (typeof result === 'object' && typeof result.then === 'function') {
	      result.then((v) => cb(null, v), cb);
	    }
	  }

	  // when all trailers are skipped
	  // we need to close the stream
	  if (skipped) res.end(null, null, null); // avoid ArgumentsAdaptorTrampoline from V8
	}

	function sendStreamTrailer (payload, res, reply) {
	  if (reply[kReplyTrailers] === null) return
	  payload.on('end', () => sendTrailer(null, res, reply));
	}

	function onErrorHook (reply, error, cb) {
	  if (reply[kRouteContext].onError !== null && !reply[kReplyNextErrorHandler]) {
	    reply[kReplyIsRunningOnErrorHook] = true;
	    onSendHookRunner(
	      reply[kRouteContext].onError,
	      reply.request,
	      reply,
	      error,
	      () => handleError(reply, error, cb)
	    );
	  } else {
	    handleError(reply, error, cb);
	  }
	}

	function setupResponseListeners (reply) {
	  reply[kReplyStartTime] = now();

	  const onResFinished = err => {
	    reply[kReplyEndTime] = now();
	    reply.raw.removeListener('finish', onResFinished);
	    reply.raw.removeListener('error', onResFinished);

	    const ctx = reply[kRouteContext];

	    if (ctx && ctx.onResponse !== null) {
	      onResponseHookRunner(
	        ctx.onResponse,
	        reply.request,
	        reply,
	        onResponseCallback
	      );
	    } else {
	      onResponseCallback(err, reply.request, reply);
	    }
	  };

	  reply.raw.on('finish', onResFinished);
	  reply.raw.on('error', onResFinished);
	}

	function onResponseCallback (err, request, reply) {
	  if (reply.log[kDisableRequestLogging]) {
	    return
	  }

	  const responseTime = reply.elapsedTime;

	  if (err != null) {
	    reply.log.error({
	      res: reply,
	      err,
	      responseTime
	    }, 'request errored');
	    return
	  }

	  reply.log.info({
	    res: reply,
	    responseTime
	  }, 'request completed');
	}

	function buildReply (R) {
	  const props = R.props.slice();

	  function _Reply (res, request, log) {
	    this.raw = res;
	    this[kReplyIsError] = false;
	    this[kReplyErrorHandlerCalled] = false;
	    this[kReplyHijacked] = false;
	    this[kReplySerializer] = null;
	    this.request = request;
	    this[kReplyHeaders] = {};
	    this[kReplyTrailers] = null;
	    this[kReplyStartTime] = undefined;
	    this[kReplyEndTime] = undefined;
	    this.log = log;

	    let prop;

	    for (let i = 0; i < props.length; i++) {
	      prop = props[i];
	      this[prop.key] = prop.value;
	    }
	  }
	  Object.setPrototypeOf(_Reply.prototype, R.prototype);
	  Object.setPrototypeOf(_Reply, R);
	  _Reply.parent = R;
	  _Reply.props = props;
	  return _Reply
	}

	function notFound (reply) {
	  if (reply[kRouteContext][kFourOhFourContext] === null) {
	    reply.log.warn('Trying to send a NotFound error inside a 404 handler. Sending basic 404 response.');
	    reply.code(404).send('404 Not Found');
	    return
	  }

	  reply.request[kRouteContext] = reply[kRouteContext][kFourOhFourContext];

	  // preHandler hook
	  if (reply[kRouteContext].preHandler !== null) {
	    preHandlerHookRunner(
	      reply[kRouteContext].preHandler,
	      reply.request,
	      reply,
	      internals.preHandlerCallback
	    );
	  } else {
	    internals.preHandlerCallback(null, reply.request, reply);
	  }
	}

	/**
	 * This function runs when a payload that is not a string|buffer|stream or null
	 * should be serialized to be streamed to the response.
	 * This is the default serializer that can be customized by the user using the replySerializer
	 *
	 * @param {object} context the request context
	 * @param {object} data the JSON payload to serialize
	 * @param {number} statusCode the http status code
	 * @param {string} [contentType] the reply content type
	 * @returns {string} the serialized payload
	 */
	function serialize (context, data, statusCode, contentType) {
	  const fnSerialize = getSchemaSerializer(context, statusCode, contentType);
	  if (fnSerialize) {
	    return fnSerialize(data)
	  }
	  return JSON.stringify(data)
	}

	function noop () { }

	reply.exports = Reply;
	reply.exports.buildReply = buildReply;
	reply.exports.setupResponseListeners = setupResponseListeners;
	return reply.exports;
}

var request = {exports: {}};

var hasRequiredRequest;

function requireRequest () {
	if (hasRequiredRequest) return request.exports;
	hasRequiredRequest = 1;

	const proxyAddr = require$$0$7;
	const {
	  kHasBeenDecorated,
	  kSchemaBody,
	  kSchemaHeaders,
	  kSchemaParams,
	  kSchemaQuerystring,
	  kSchemaController,
	  kOptions,
	  kRequestCacheValidateFns,
	  kRouteContext,
	  kRequestOriginalUrl
	} = /*@__PURE__*/ requireSymbols();
	const { FST_ERR_REQ_INVALID_VALIDATION_INVOCATION } = /*@__PURE__*/ requireErrors();

	const HTTP_PART_SYMBOL_MAP = {
	  body: kSchemaBody,
	  headers: kSchemaHeaders,
	  params: kSchemaParams,
	  querystring: kSchemaQuerystring,
	  query: kSchemaQuerystring
	};

	function Request (id, params, req, query, log, context) {
	  this.id = id;
	  this[kRouteContext] = context;
	  this.params = params;
	  this.raw = req;
	  this.query = query;
	  this.log = log;
	  this.body = undefined;
	}
	Request.props = [];

	function getTrustProxyFn (tp) {
	  if (typeof tp === 'function') {
	    return tp
	  }
	  if (tp === true) {
	    // Support trusting everything
	    return null
	  }
	  if (typeof tp === 'number') {
	    // Support trusting hop count
	    return function (a, i) { return i < tp }
	  }
	  if (typeof tp === 'string') {
	    // Support comma-separated tps
	    const values = tp.split(',').map(it => it.trim());
	    return proxyAddr.compile(values)
	  }
	  return proxyAddr.compile(tp)
	}

	function buildRequest (R, trustProxy) {
	  if (trustProxy) {
	    return buildRequestWithTrustProxy(R, trustProxy)
	  }

	  return buildRegularRequest(R)
	}

	function buildRegularRequest (R) {
	  const props = R.props.slice();
	  function _Request (id, params, req, query, log, context) {
	    this.id = id;
	    this[kRouteContext] = context;
	    this.params = params;
	    this.raw = req;
	    this.query = query;
	    this.log = log;
	    this.body = undefined;

	    let prop;
	    for (let i = 0; i < props.length; i++) {
	      prop = props[i];
	      this[prop.key] = prop.value;
	    }
	  }
	  Object.setPrototypeOf(_Request.prototype, R.prototype);
	  Object.setPrototypeOf(_Request, R);
	  _Request.props = props;
	  _Request.parent = R;

	  return _Request
	}

	function getLastEntryInMultiHeaderValue (headerValue) {
	  // we use the last one if the header is set more than once
	  const lastIndex = headerValue.lastIndexOf(',');
	  return lastIndex === -1 ? headerValue.trim() : headerValue.slice(lastIndex + 1).trim()
	}

	function buildRequestWithTrustProxy (R, trustProxy) {
	  const _Request = buildRegularRequest(R);
	  const proxyFn = getTrustProxyFn(trustProxy);

	  // This is a more optimized version of decoration
	  _Request[kHasBeenDecorated] = true;

	  Object.defineProperties(_Request.prototype, {
	    ip: {
	      get () {
	        const addrs = proxyAddr.all(this.raw, proxyFn);
	        return addrs[addrs.length - 1]
	      }
	    },
	    ips: {
	      get () {
	        return proxyAddr.all(this.raw, proxyFn)
	      }
	    },
	    host: {
	      get () {
	        if (this.ip !== undefined && this.headers['x-forwarded-host']) {
	          return getLastEntryInMultiHeaderValue(this.headers['x-forwarded-host'])
	        }
	        // the last fallback is used to support the following cases:
	        // 1. support http.requireHostHeader === false
	        // 2. support HTTP/1.0 without Host Header
	        // 3. support headers schema which may remove the Host Header
	        return this.headers.host ?? this.headers[':authority'] ?? ''
	      }
	    },
	    protocol: {
	      get () {
	        if (this.headers['x-forwarded-proto']) {
	          return getLastEntryInMultiHeaderValue(this.headers['x-forwarded-proto'])
	        }
	        if (this.socket) {
	          return this.socket.encrypted ? 'https' : 'http'
	        }
	      }
	    }
	  });

	  return _Request
	}

	Object.defineProperties(Request.prototype, {
	  server: {
	    get () {
	      return this[kRouteContext].server
	    }
	  },
	  url: {
	    get () {
	      return this.raw.url
	    }
	  },
	  originalUrl: {
	    get () {
	      /* istanbul ignore else */
	      if (!this[kRequestOriginalUrl]) {
	        this[kRequestOriginalUrl] = this.raw.originalUrl || this.raw.url;
	      }
	      return this[kRequestOriginalUrl]
	    }
	  },
	  method: {
	    get () {
	      return this.raw.method
	    }
	  },
	  routeOptions: {
	    get () {
	      const context = this[kRouteContext];
	      const routeLimit = context._parserOptions.limit;
	      const serverLimit = context.server.initialConfig.bodyLimit;
	      const version = context.server.hasConstraintStrategy('version') ? this.raw.headers['accept-version'] : undefined;
	      const options = {
	        method: context.config?.method,
	        url: context.config?.url,
	        bodyLimit: (routeLimit || serverLimit),
	        attachValidation: context.attachValidation,
	        logLevel: context.logLevel,
	        exposeHeadRoute: context.exposeHeadRoute,
	        prefixTrailingSlash: context.prefixTrailingSlash,
	        handler: context.handler,
	        version
	      };

	      Object.defineProperties(options, {
	        config: {
	          get: () => context.config
	        },
	        schema: {
	          get: () => context.schema
	        }
	      });

	      return Object.freeze(options)
	    }
	  },
	  is404: {
	    get () {
	      return this[kRouteContext].config?.url === undefined
	    }
	  },
	  socket: {
	    get () {
	      return this.raw.socket
	    }
	  },
	  ip: {
	    get () {
	      if (this.socket) {
	        return this.socket.remoteAddress
	      }
	    }
	  },
	  host: {
	    get () {
	      // the last fallback is used to support the following cases:
	      // 1. support http.requireHostHeader === false
	      // 2. support HTTP/1.0 without Host Header
	      // 3. support headers schema which may remove the Host Header
	      return this.raw.headers.host ?? this.raw.headers[':authority'] ?? ''
	    }
	  },
	  hostname: {
	    get () {
	      return this.host.split(':', 1)[0]
	    }
	  },
	  port: {
	    get () {
	      // first try taking port from host
	      const portFromHost = parseInt(this.host.split(':').slice(-1)[0]);
	      if (!isNaN(portFromHost)) {
	        return portFromHost
	      }
	      // now fall back to port from host/:authority header
	      const host = (this.headers.host ?? this.headers[':authority'] ?? '');
	      const portFromHeader = parseInt(host.split(':').slice(-1)[0]);
	      if (!isNaN(portFromHeader)) {
	        return portFromHeader
	      }
	      // fall back to null
	      return null
	    }
	  },
	  protocol: {
	    get () {
	      if (this.socket) {
	        return this.socket.encrypted ? 'https' : 'http'
	      }
	    }
	  },
	  headers: {
	    get () {
	      if (this.additionalHeaders) {
	        return Object.assign({}, this.raw.headers, this.additionalHeaders)
	      }
	      return this.raw.headers
	    },
	    set (headers) {
	      this.additionalHeaders = headers;
	    }
	  },
	  getValidationFunction: {
	    value: function (httpPartOrSchema) {
	      if (typeof httpPartOrSchema === 'string') {
	        const symbol = HTTP_PART_SYMBOL_MAP[httpPartOrSchema];
	        return this[kRouteContext][symbol]
	      } else if (typeof httpPartOrSchema === 'object') {
	        return this[kRouteContext][kRequestCacheValidateFns]?.get(httpPartOrSchema)
	      }
	    }
	  },
	  compileValidationSchema: {
	    value: function (schema, httpPart = null) {
	      const { method, url } = this;

	      if (this[kRouteContext][kRequestCacheValidateFns]?.has(schema)) {
	        return this[kRouteContext][kRequestCacheValidateFns].get(schema)
	      }

	      const validatorCompiler = this[kRouteContext].validatorCompiler ||
	        this.server[kSchemaController].validatorCompiler ||
	        (
	          // We compile the schemas if no custom validatorCompiler is provided
	          // nor set
	          this.server[kSchemaController].setupValidator(this.server[kOptions]) ||
	          this.server[kSchemaController].validatorCompiler
	        );

	      const validateFn = validatorCompiler({
	        schema,
	        method,
	        url,
	        httpPart
	      });

	      // We create a WeakMap to compile the schema only once
	      // Its done lazily to avoid add overhead by creating the WeakMap
	      // if it is not used
	      // TODO: Explore a central cache for all the schemas shared across
	      // encapsulated contexts
	      if (this[kRouteContext][kRequestCacheValidateFns] == null) {
	        this[kRouteContext][kRequestCacheValidateFns] = new WeakMap();
	      }

	      this[kRouteContext][kRequestCacheValidateFns].set(schema, validateFn);

	      return validateFn
	    }
	  },
	  validateInput: {
	    value: function (input, schema, httpPart) {
	      httpPart = typeof schema === 'string' ? schema : httpPart;

	      const symbol = (httpPart != null && typeof httpPart === 'string') && HTTP_PART_SYMBOL_MAP[httpPart];
	      let validate;

	      if (symbol) {
	        // Validate using the HTTP Request Part schema
	        validate = this[kRouteContext][symbol];
	      }

	      // We cannot compile if the schema is missed
	      if (validate == null && (schema == null ||
	        typeof schema !== 'object' ||
	        Array.isArray(schema))
	      ) {
	        throw new FST_ERR_REQ_INVALID_VALIDATION_INVOCATION(httpPart)
	      }

	      if (validate == null) {
	        if (this[kRouteContext][kRequestCacheValidateFns]?.has(schema)) {
	          validate = this[kRouteContext][kRequestCacheValidateFns].get(schema);
	        } else {
	          // We proceed to compile if there's no validate function yet
	          validate = this.compileValidationSchema(schema, httpPart);
	        }
	      }

	      return validate(input)
	    }
	  }
	});

	request.exports = Request;
	request.exports.buildRequest = buildRequest;
	return request.exports;
}

var context;
var hasRequiredContext;

function requireContext () {
	if (hasRequiredContext) return context;
	hasRequiredContext = 1;

	const {
	  kFourOhFourContext,
	  kReplySerializerDefault,
	  kSchemaErrorFormatter,
	  kErrorHandler,
	  kChildLoggerFactory,
	  kOptions,
	  kReply,
	  kRequest,
	  kBodyLimit,
	  kLogLevel,
	  kContentTypeParser,
	  kRouteByFastify,
	  kRequestCacheValidateFns,
	  kReplyCacheSerializeFns
	} = /*@__PURE__*/ requireSymbols();

	// Object that holds the context of every request
	// Every route holds an instance of this object.
	function Context ({
	  schema,
	  handler,
	  config,
	  requestIdLogLabel,
	  childLoggerFactory,
	  errorHandler,
	  bodyLimit,
	  logLevel,
	  logSerializers,
	  attachValidation,
	  validatorCompiler,
	  serializerCompiler,
	  replySerializer,
	  schemaErrorFormatter,
	  exposeHeadRoute,
	  prefixTrailingSlash,
	  server,
	  isFastify
	}) {
	  this.schema = schema;
	  this.handler = handler;
	  this.Reply = server[kReply];
	  this.Request = server[kRequest];
	  this.contentTypeParser = server[kContentTypeParser];
	  this.onRequest = null;
	  this.onSend = null;
	  this.onError = null;
	  this.onTimeout = null;
	  this.preHandler = null;
	  this.onResponse = null;
	  this.preSerialization = null;
	  this.onRequestAbort = null;
	  this.config = config;
	  this.errorHandler = errorHandler || server[kErrorHandler];
	  this.requestIdLogLabel = requestIdLogLabel || server[kOptions].requestIdLogLabel;
	  this.childLoggerFactory = childLoggerFactory || server[kChildLoggerFactory];
	  this._middie = null;
	  this._parserOptions = {
	    limit: bodyLimit || server[kBodyLimit]
	  };
	  this.exposeHeadRoute = exposeHeadRoute;
	  this.prefixTrailingSlash = prefixTrailingSlash;
	  this.logLevel = logLevel || server[kLogLevel];
	  this.logSerializers = logSerializers;
	  this[kFourOhFourContext] = null;
	  this.attachValidation = attachValidation;
	  this[kReplySerializerDefault] = replySerializer;
	  this.schemaErrorFormatter =
	    schemaErrorFormatter ||
	    server[kSchemaErrorFormatter] ||
	    defaultSchemaErrorFormatter;
	  this[kRouteByFastify] = isFastify;

	  this[kRequestCacheValidateFns] = null;
	  this[kReplyCacheSerializeFns] = null;
	  this.validatorCompiler = validatorCompiler || null;
	  this.serializerCompiler = serializerCompiler || null;

	  this.server = server;
	}

	function defaultSchemaErrorFormatter (errors, dataVar) {
	  let text = '';
	  const separator = ', ';

	  for (let i = 0; i !== errors.length; ++i) {
	    const e = errors[i];
	    text += dataVar + (e.instancePath || '') + ' ' + e.message + separator;
	  }
	  return new Error(text.slice(0, -separator.length))
	}

	context = Context;
	return context;
}

var decorate_1;
var hasRequiredDecorate;

function requireDecorate () {
	if (hasRequiredDecorate) return decorate_1;
	hasRequiredDecorate = 1;

	const {
	  kReply,
	  kRequest,
	  kState,
	  kHasBeenDecorated
	} = /*@__PURE__*/ requireSymbols();

	const {
	  FST_ERR_DEC_ALREADY_PRESENT,
	  FST_ERR_DEC_MISSING_DEPENDENCY,
	  FST_ERR_DEC_AFTER_START,
	  FST_ERR_DEC_REFERENCE_TYPE,
	  FST_ERR_DEC_DEPENDENCY_INVALID_TYPE
	} = /*@__PURE__*/ requireErrors();

	function decorate (instance, name, fn, dependencies) {
	  if (Object.hasOwn(instance, name)) {
	    throw new FST_ERR_DEC_ALREADY_PRESENT(name)
	  }

	  checkDependencies(instance, name, dependencies);

	  if (fn && (typeof fn.getter === 'function' || typeof fn.setter === 'function')) {
	    Object.defineProperty(instance, name, {
	      get: fn.getter,
	      set: fn.setter
	    });
	  } else {
	    instance[name] = fn;
	  }
	}

	function decorateConstructor (konstructor, name, fn, dependencies) {
	  const instance = konstructor.prototype;
	  if (Object.hasOwn(instance, name) || hasKey(konstructor, name)) {
	    throw new FST_ERR_DEC_ALREADY_PRESENT(name)
	  }

	  konstructor[kHasBeenDecorated] = true;
	  checkDependencies(konstructor, name, dependencies);

	  if (fn && (typeof fn.getter === 'function' || typeof fn.setter === 'function')) {
	    Object.defineProperty(instance, name, {
	      get: fn.getter,
	      set: fn.setter
	    });
	  } else if (typeof fn === 'function') {
	    instance[name] = fn;
	  } else {
	    konstructor.props.push({ key: name, value: fn });
	  }
	}

	function checkReferenceType (name, fn) {
	  if (typeof fn === 'object' && fn && !(typeof fn.getter === 'function' || typeof fn.setter === 'function')) {
	    throw new FST_ERR_DEC_REFERENCE_TYPE(name, typeof fn)
	  }
	}

	function decorateFastify (name, fn, dependencies) {
	  assertNotStarted(this, name);
	  decorate(this, name, fn, dependencies);
	  return this
	}

	function checkExistence (instance, name) {
	  if (name) {
	    return name in instance || (instance.prototype && name in instance.prototype) || hasKey(instance, name)
	  }

	  return instance in this
	}

	function hasKey (fn, name) {
	  if (fn.props) {
	    return fn.props.find(({ key }) => key === name)
	  }
	  return false
	}

	function checkRequestExistence (name) {
	  if (name && hasKey(this[kRequest], name)) return true
	  return checkExistence(this[kRequest].prototype, name)
	}

	function checkReplyExistence (name) {
	  if (name && hasKey(this[kReply], name)) return true
	  return checkExistence(this[kReply].prototype, name)
	}

	function checkDependencies (instance, name, deps) {
	  if (deps === undefined || deps === null) {
	    return
	  }

	  if (!Array.isArray(deps)) {
	    throw new FST_ERR_DEC_DEPENDENCY_INVALID_TYPE(name)
	  }

	  for (let i = 0; i !== deps.length; ++i) {
	    if (!checkExistence(instance, deps[i])) {
	      throw new FST_ERR_DEC_MISSING_DEPENDENCY(deps[i])
	    }
	  }
	}

	function decorateReply (name, fn, dependencies) {
	  assertNotStarted(this, name);
	  checkReferenceType(name, fn);
	  decorateConstructor(this[kReply], name, fn, dependencies);
	  return this
	}

	function decorateRequest (name, fn, dependencies) {
	  assertNotStarted(this, name);
	  checkReferenceType(name, fn);
	  decorateConstructor(this[kRequest], name, fn, dependencies);
	  return this
	}

	function assertNotStarted (instance, name) {
	  if (instance[kState].started) {
	    throw new FST_ERR_DEC_AFTER_START(name)
	  }
	}

	decorate_1 = {
	  add: decorateFastify,
	  exist: checkExistence,
	  existRequest: checkRequestExistence,
	  existReply: checkReplyExistence,
	  dependencies: checkDependencies,
	  decorateReply,
	  decorateRequest
	};
	return decorate_1;
}

var contentTypeParser = {exports: {}};

var hasRequiredContentTypeParser;

function requireContentTypeParser () {
	if (hasRequiredContentTypeParser) return contentTypeParser.exports;
	hasRequiredContentTypeParser = 1;
	(function (module) {

		const { AsyncResource } = require$$0$8;
		const { FifoMap: Fifo } = require$$1$2;
		const secureJson = require$$2$1;
		const {
		  kDefaultJsonParse,
		  kContentTypeParser,
		  kBodyLimit,
		  kRequestPayloadStream,
		  kState,
		  kTestInternals,
		  kReplyIsError,
		  kRouteContext
		} = /*@__PURE__*/ requireSymbols();

		const {
		  FST_ERR_CTP_INVALID_TYPE,
		  FST_ERR_CTP_EMPTY_TYPE,
		  FST_ERR_CTP_ALREADY_PRESENT,
		  FST_ERR_CTP_INVALID_HANDLER,
		  FST_ERR_CTP_INVALID_PARSE_TYPE,
		  FST_ERR_CTP_BODY_TOO_LARGE,
		  FST_ERR_CTP_INVALID_MEDIA_TYPE,
		  FST_ERR_CTP_INVALID_CONTENT_LENGTH,
		  FST_ERR_CTP_EMPTY_JSON_BODY,
		  FST_ERR_CTP_INSTANCE_ALREADY_STARTED
		} = /*@__PURE__*/ requireErrors();
		const { FSTSEC001 } = /*@__PURE__*/ requireWarnings();

		function ContentTypeParser (bodyLimit, onProtoPoisoning, onConstructorPoisoning) {
		  this[kDefaultJsonParse] = getDefaultJsonParser(onProtoPoisoning, onConstructorPoisoning);
		  // using a map instead of a plain object to avoid prototype hijack attacks
		  this.customParsers = new Map();
		  this.customParsers.set('application/json', new Parser(true, false, bodyLimit, this[kDefaultJsonParse]));
		  this.customParsers.set('text/plain', new Parser(true, false, bodyLimit, defaultPlainTextParser));
		  this.parserList = ['application/json', 'text/plain'];
		  this.parserRegExpList = [];
		  this.cache = new Fifo(100);
		}

		ContentTypeParser.prototype.add = function (contentType, opts, parserFn) {
		  const contentTypeIsString = typeof contentType === 'string';

		  if (contentTypeIsString) {
		    contentType = contentType.trim().toLowerCase();
		    if (contentType.length === 0) throw new FST_ERR_CTP_EMPTY_TYPE()
		  } else if (!(contentType instanceof RegExp)) {
		    throw new FST_ERR_CTP_INVALID_TYPE()
		  }

		  if (typeof parserFn !== 'function') {
		    throw new FST_ERR_CTP_INVALID_HANDLER()
		  }

		  if (this.existingParser(contentType)) {
		    throw new FST_ERR_CTP_ALREADY_PRESENT(contentType)
		  }

		  if (opts.parseAs !== undefined) {
		    if (opts.parseAs !== 'string' && opts.parseAs !== 'buffer') {
		      throw new FST_ERR_CTP_INVALID_PARSE_TYPE(opts.parseAs)
		    }
		  }

		  const parser = new Parser(
		    opts.parseAs === 'string',
		    opts.parseAs === 'buffer',
		    opts.bodyLimit,
		    parserFn
		  );

		  if (contentType === '*') {
		    this.customParsers.set('', parser);
		  } else {
		    if (contentTypeIsString) {
		      this.parserList.unshift(contentType);
		      this.customParsers.set(contentType, parser);
		    } else {
		      validateRegExp(contentType);
		      this.parserRegExpList.unshift(contentType);
		      this.customParsers.set(contentType.toString(), parser);
		    }
		  }
		};

		ContentTypeParser.prototype.hasParser = function (contentType) {
		  if (typeof contentType === 'string') {
		    contentType = contentType.trim().toLowerCase();
		  } else {
		    if (!(contentType instanceof RegExp)) throw new FST_ERR_CTP_INVALID_TYPE()
		    contentType = contentType.toString();
		  }

		  return this.customParsers.has(contentType)
		};

		ContentTypeParser.prototype.existingParser = function (contentType) {
		  if (contentType === 'application/json' && this.customParsers.has(contentType)) {
		    return this.customParsers.get(contentType).fn !== this[kDefaultJsonParse]
		  }
		  if (contentType === 'text/plain' && this.customParsers.has(contentType)) {
		    return this.customParsers.get(contentType).fn !== defaultPlainTextParser
		  }

		  return this.hasParser(contentType)
		};

		ContentTypeParser.prototype.getParser = function (contentType) {
		  let parser = this.customParsers.get(contentType);
		  if (parser !== undefined) return parser
		  parser = this.cache.get(contentType);
		  if (parser !== undefined) return parser

		  const caseInsensitiveContentType = contentType.toLowerCase();
		  for (let i = 0; i !== this.parserList.length; ++i) {
		    const parserListItem = this.parserList[i];
		    if (
		      caseInsensitiveContentType.slice(0, parserListItem.length) === parserListItem &&
		      (
		        caseInsensitiveContentType.length === parserListItem.length ||
		        caseInsensitiveContentType.charCodeAt(parserListItem.length) === 59 /* `;` */ ||
		        caseInsensitiveContentType.charCodeAt(parserListItem.length) === 32 /* ` ` */
		      )
		    ) {
		      parser = this.customParsers.get(parserListItem);
		      this.cache.set(contentType, parser);
		      return parser
		    }
		  }

		  for (let j = 0; j !== this.parserRegExpList.length; ++j) {
		    const parserRegExp = this.parserRegExpList[j];
		    if (parserRegExp.test(contentType)) {
		      parser = this.customParsers.get(parserRegExp.toString());
		      this.cache.set(contentType, parser);
		      return parser
		    }
		  }

		  return this.customParsers.get('')
		};

		ContentTypeParser.prototype.removeAll = function () {
		  this.customParsers = new Map();
		  this.parserRegExpList = [];
		  this.parserList = [];
		  this.cache = new Fifo(100);
		};

		ContentTypeParser.prototype.remove = function (contentType) {
		  let parsers;

		  if (typeof contentType === 'string') {
		    contentType = contentType.trim().toLowerCase();
		    parsers = this.parserList;
		  } else {
		    if (!(contentType instanceof RegExp)) throw new FST_ERR_CTP_INVALID_TYPE()
		    contentType = contentType.toString();
		    parsers = this.parserRegExpList;
		  }

		  const removed = this.customParsers.delete(contentType);
		  const idx = parsers.findIndex(ct => ct.toString() === contentType);

		  if (idx > -1) {
		    parsers.splice(idx, 1);
		  }

		  return removed || idx > -1
		};

		ContentTypeParser.prototype.run = function (contentType, handler, request, reply) {
		  const parser = this.getParser(contentType);

		  if (parser === undefined) {
		    if (request.is404) {
		      handler(request, reply);
		    } else {
		      reply.send(new FST_ERR_CTP_INVALID_MEDIA_TYPE(contentType || undefined));
		    }

		    // Early return to avoid allocating an AsyncResource if it's not needed
		    return
		  }

		  const resource = new AsyncResource('content-type-parser:run', request);

		  if (parser.asString === true || parser.asBuffer === true) {
		    rawBody(
		      request,
		      reply,
		      reply[kRouteContext]._parserOptions,
		      parser,
		      done
		    );
		  } else {
		    const result = parser.fn(request, request[kRequestPayloadStream], done);

		    if (typeof result?.then === 'function') {
		      result.then(body => done(null, body), done);
		    }
		  }

		  function done (error, body) {
		    // We cannot use resource.bind() because it is broken in node v12 and v14
		    resource.runInAsyncScope(() => {
		      resource.emitDestroy();
		      if (error) {
		        reply[kReplyIsError] = true;
		        reply.send(error);
		      } else {
		        request.body = body;
		        handler(request, reply);
		      }
		    });
		  }
		};

		function rawBody (request, reply, options, parser, done) {
		  const asString = parser.asString;
		  const limit = options.limit === null ? parser.bodyLimit : options.limit;
		  const contentLength = Number(request.headers['content-length']);

		  if (contentLength > limit) {
		    // We must close the connection as the client is going
		    // to send this data anyway
		    reply.header('connection', 'close');
		    reply.send(new FST_ERR_CTP_BODY_TOO_LARGE());
		    return
		  }

		  let receivedLength = 0;
		  let body = asString === true ? '' : [];

		  const payload = request[kRequestPayloadStream] || request.raw;

		  if (asString === true) {
		    payload.setEncoding('utf8');
		  }

		  payload.on('data', onData);
		  payload.on('end', onEnd);
		  payload.on('error', onEnd);
		  payload.resume();

		  function onData (chunk) {
		    receivedLength += chunk.length;
		    const { receivedEncodedLength = 0 } = payload;
		    // The resulting body length must not exceed bodyLimit (see "zip bomb").
		    // The case when encoded length is larger than received length is rather theoretical,
		    // unless the stream returned by preParsing hook is broken and reports wrong value.
		    if (receivedLength > limit || receivedEncodedLength > limit) {
		      payload.removeListener('data', onData);
		      payload.removeListener('end', onEnd);
		      payload.removeListener('error', onEnd);
		      reply.send(new FST_ERR_CTP_BODY_TOO_LARGE());
		      return
		    }

		    if (asString === true) {
		      body += chunk;
		    } else {
		      body.push(chunk);
		    }
		  }

		  function onEnd (err) {
		    payload.removeListener('data', onData);
		    payload.removeListener('end', onEnd);
		    payload.removeListener('error', onEnd);

		    if (err !== undefined) {
		      if (!(typeof err.statusCode === 'number' && err.statusCode >= 400)) {
		        err.statusCode = 400;
		      }
		      reply[kReplyIsError] = true;
		      reply.code(err.statusCode).send(err);
		      return
		    }

		    if (asString === true) {
		      receivedLength = Buffer.byteLength(body);
		    }

		    if (!Number.isNaN(contentLength) && (payload.receivedEncodedLength || receivedLength) !== contentLength) {
		      reply.header('connection', 'close');
		      reply.send(new FST_ERR_CTP_INVALID_CONTENT_LENGTH());
		      return
		    }

		    if (asString === false) {
		      body = Buffer.concat(body);
		    }

		    const result = parser.fn(request, body, done);
		    if (result && typeof result.then === 'function') {
		      result.then(body => done(null, body), done);
		    }
		  }
		}

		function getDefaultJsonParser (onProtoPoisoning, onConstructorPoisoning) {
		  return defaultJsonParser

		  function defaultJsonParser (req, body, done) {
		    if (body === '' || body == null || (Buffer.isBuffer(body) && body.length === 0)) {
		      return done(new FST_ERR_CTP_EMPTY_JSON_BODY(), undefined)
		    }
		    let json;
		    try {
		      json = secureJson.parse(body, { protoAction: onProtoPoisoning, constructorAction: onConstructorPoisoning });
		    } catch (err) {
		      err.statusCode = 400;
		      return done(err, undefined)
		    }
		    done(null, json);
		  }
		}

		function defaultPlainTextParser (req, body, done) {
		  done(null, body);
		}

		function Parser (asString, asBuffer, bodyLimit, fn) {
		  this.asString = asString;
		  this.asBuffer = asBuffer;
		  this.bodyLimit = bodyLimit;
		  this.fn = fn;
		}

		function buildContentTypeParser (c) {
		  const contentTypeParser = new ContentTypeParser();
		  contentTypeParser[kDefaultJsonParse] = c[kDefaultJsonParse];
		  contentTypeParser.customParsers = new Map(c.customParsers.entries());
		  contentTypeParser.parserList = c.parserList.slice();
		  contentTypeParser.parserRegExpList = c.parserRegExpList.slice();
		  return contentTypeParser
		}

		function addContentTypeParser (contentType, opts, parser) {
		  if (this[kState].started) {
		    throw new FST_ERR_CTP_INSTANCE_ALREADY_STARTED('addContentTypeParser')
		  }

		  if (typeof opts === 'function') {
		    parser = opts;
		    opts = {};
		  }

		  if (!opts) opts = {};
		  if (!opts.bodyLimit) opts.bodyLimit = this[kBodyLimit];

		  if (Array.isArray(contentType)) {
		    contentType.forEach((type) => this[kContentTypeParser].add(type, opts, parser));
		  } else {
		    this[kContentTypeParser].add(contentType, opts, parser);
		  }

		  return this
		}

		function hasContentTypeParser (contentType) {
		  return this[kContentTypeParser].hasParser(contentType)
		}

		function removeContentTypeParser (contentType) {
		  if (this[kState].started) {
		    throw new FST_ERR_CTP_INSTANCE_ALREADY_STARTED('removeContentTypeParser')
		  }

		  if (Array.isArray(contentType)) {
		    for (const type of contentType) {
		      this[kContentTypeParser].remove(type);
		    }
		  } else {
		    this[kContentTypeParser].remove(contentType);
		  }
		}

		function removeAllContentTypeParsers () {
		  if (this[kState].started) {
		    throw new FST_ERR_CTP_INSTANCE_ALREADY_STARTED('removeAllContentTypeParsers')
		  }

		  this[kContentTypeParser].removeAll();
		}

		function validateRegExp (regexp) {
		  // RegExp should either start with ^ or include ;?
		  // It can ensure the user is properly detect the essence
		  // MIME types.
		  if (regexp.source[0] !== '^' && regexp.source.includes(';?') === false) {
		    FSTSEC001(regexp.source);
		  }
		}

		module.exports = ContentTypeParser;
		module.exports.helpers = {
		  buildContentTypeParser,
		  addContentTypeParser,
		  hasContentTypeParser,
		  removeContentTypeParser,
		  removeAllContentTypeParsers
		};
		module.exports.defaultParsers = {
		  getDefaultJsonParser,
		  defaultTextParser: defaultPlainTextParser
		};
		module.exports[kTestInternals] = { rawBody }; 
	} (contentTypeParser));
	return contentTypeParser.exports;
}

var schemaController;
var hasRequiredSchemaController;

function requireSchemaController () {
	if (hasRequiredSchemaController) return schemaController;
	hasRequiredSchemaController = 1;

	const { buildSchemas } = /*@__PURE__*/ requireSchemas();
	const SerializerSelector = require$$1$3;
	const ValidatorSelector = require$$2$2;

	/**
	 * Called at every fastify context that is being created.
	 * @param {object} parentSchemaCtrl: the SchemaController instance of the Fastify parent context
	 * @param {object} opts: the `schemaController` server option. It can be undefined when a parentSchemaCtrl is set
	 * @return {object}:a new SchemaController
	 */
	function buildSchemaController (parentSchemaCtrl, opts) {
	  if (parentSchemaCtrl) {
	    return new SchemaController(parentSchemaCtrl, opts)
	  }

	  const compilersFactory = Object.assign({
	    buildValidator: null,
	    buildSerializer: null
	  }, opts?.compilersFactory);

	  if (!compilersFactory.buildValidator) {
	    compilersFactory.buildValidator = ValidatorSelector();
	  }
	  if (!compilersFactory.buildSerializer) {
	    compilersFactory.buildSerializer = SerializerSelector();
	  }

	  const option = {
	    bucket: (opts && opts.bucket) || buildSchemas,
	    compilersFactory,
	    isCustomValidatorCompiler: typeof opts?.compilersFactory?.buildValidator === 'function',
	    isCustomSerializerCompiler: typeof opts?.compilersFactory?.buildValidator === 'function'
	  };

	  return new SchemaController(undefined, option)
	}

	class SchemaController {
	  constructor (parent, options) {
	    this.opts = options || parent?.opts;
	    this.addedSchemas = false;

	    this.compilersFactory = this.opts.compilersFactory;

	    if (parent) {
	      this.schemaBucket = this.opts.bucket(parent.getSchemas());
	      this.validatorCompiler = parent.getValidatorCompiler();
	      this.serializerCompiler = parent.getSerializerCompiler();
	      this.isCustomValidatorCompiler = parent.isCustomValidatorCompiler;
	      this.isCustomSerializerCompiler = parent.isCustomSerializerCompiler;
	      this.parent = parent;
	    } else {
	      this.schemaBucket = this.opts.bucket();
	      this.isCustomValidatorCompiler = this.opts.isCustomValidatorCompiler || false;
	      this.isCustomSerializerCompiler = this.opts.isCustomSerializerCompiler || false;
	    }
	  }

	  // Bucket interface
	  add (schema) {
	    this.addedSchemas = true;
	    return this.schemaBucket.add(schema)
	  }

	  getSchema (schemaId) {
	    return this.schemaBucket.getSchema(schemaId)
	  }

	  getSchemas () {
	    return this.schemaBucket.getSchemas()
	  }

	  setValidatorCompiler (validatorCompiler) {
	    // Set up as if the fixed validator compiler had been provided
	    // by a custom 'options.compilersFactory.buildValidator' that
	    // always returns the same compiler object. This is required because:
	    //
	    // - setValidatorCompiler must immediately install a compiler to preserve
	    //   legacy behavior
	    // - setupValidator will recreate compilers from builders in some
	    //   circumstances, so we have to install this adapter to make it
	    //   behave the same if the legacy API is used
	    //
	    // The cloning of the compilersFactory object is necessary because
	    // we are aliasing the parent compilersFactory if none was provided
	    // to us (see constructor.)
	    this.compilersFactory = Object.assign(
	      {},
	      this.compilersFactory,
	      { buildValidator: () => validatorCompiler });
	    this.validatorCompiler = validatorCompiler;
	    this.isCustomValidatorCompiler = true;
	  }

	  setSerializerCompiler (serializerCompiler) {
	    // Set up as if the fixed serializer compiler had been provided
	    // by a custom 'options.compilersFactory.buildSerializer' that
	    // always returns the same compiler object. This is required because:
	    //
	    // - setSerializerCompiler must immediately install a compiler to preserve
	    //   legacy behavior
	    // - setupSerializer will recreate compilers from builders in some
	    //   circumstances, so we have to install this adapter to make it
	    //   behave the same if the legacy API is used
	    //
	    // The cloning of the compilersFactory object is necessary because
	    // we are aliasing the parent compilersFactory if none was provided
	    // to us (see constructor.)
	    this.compilersFactory = Object.assign(
	      {},
	      this.compilersFactory,
	      { buildSerializer: () => serializerCompiler });
	    this.serializerCompiler = serializerCompiler;
	    this.isCustomSerializerCompiler = true;
	  }

	  getValidatorCompiler () {
	    return this.validatorCompiler || (this.parent && this.parent.getValidatorCompiler())
	  }

	  getSerializerCompiler () {
	    return this.serializerCompiler || (this.parent && this.parent.getSerializerCompiler())
	  }

	  getSerializerBuilder () {
	    return this.compilersFactory.buildSerializer || (this.parent && this.parent.getSerializerBuilder())
	  }

	  getValidatorBuilder () {
	    return this.compilersFactory.buildValidator || (this.parent && this.parent.getValidatorBuilder())
	  }

	  /**
	   * This method will be called when a validator must be setup.
	   * Do not setup the compiler more than once
	   * @param {object} serverOptions the fastify server options
	   */
	  setupValidator (serverOptions) {
	    const isReady = this.validatorCompiler !== undefined && !this.addedSchemas;
	    if (isReady) {
	      return
	    }
	    this.validatorCompiler = this.getValidatorBuilder()(this.schemaBucket.getSchemas(), serverOptions.ajv);
	  }

	  /**
	   * This method will be called when a serializer must be setup.
	   * Do not setup the compiler more than once
	   * @param {object} serverOptions the fastify server options
	   */
	  setupSerializer (serverOptions) {
	    const isReady = this.serializerCompiler !== undefined && !this.addedSchemas;
	    if (isReady) {
	      return
	    }

	    this.serializerCompiler = this.getSerializerBuilder()(this.schemaBucket.getSchemas(), serverOptions.serializerOpts);
	  }
	}

	SchemaController.buildSchemaController = buildSchemaController;
	schemaController = SchemaController;
	return schemaController;
}

var pluginUtils = {exports: {}};

var hasRequiredPluginUtils;

function requirePluginUtils () {
	if (hasRequiredPluginUtils) return pluginUtils.exports;
	hasRequiredPluginUtils = 1;
	(function (module) {

		const semver = require$$0$9;
		const assert = require$$1$4;
		const kRegisteredPlugins = Symbol.for('registered-plugin');
		const {
		  kTestInternals
		} = /*@__PURE__*/ requireSymbols();
		const { exist, existReply, existRequest } = /*@__PURE__*/ requireDecorate();
		const {
		  FST_ERR_PLUGIN_VERSION_MISMATCH,
		  FST_ERR_PLUGIN_NOT_PRESENT_IN_INSTANCE,
		  FST_ERR_PLUGIN_INVALID_ASYNC_HANDLER
		} = /*@__PURE__*/ requireErrors();

		function getMeta (fn) {
		  return fn[Symbol.for('plugin-meta')]
		}

		function getPluginName (func) {
		  const display = getDisplayName(func);
		  if (display) {
		    return display
		  }

		  // let's see if this is a file, and in that case use that
		  // this is common for plugins
		  const cache = require.cache;
		  // cache is undefined inside SEA
		  if (cache) {
		    const keys = Object.keys(cache);

		    for (let i = 0; i < keys.length; i++) {
		      const key = keys[i];
		      if (cache[key].exports === func) {
		        return key
		      }
		    }
		  }

		  // if not maybe it's a named function, so use that
		  if (func.name) {
		    return func.name
		  }

		  return null
		}

		function getFuncPreview (func) {
		  // takes the first two lines of the function if nothing else works
		  return func.toString().split('\n', 2).map(s => s.trim()).join(' -- ')
		}

		function getDisplayName (fn) {
		  return fn[Symbol.for('fastify.display-name')]
		}

		function shouldSkipOverride (fn) {
		  return !!fn[Symbol.for('skip-override')]
		}

		function checkDependencies (fn) {
		  const meta = getMeta(fn);
		  if (!meta) return

		  const dependencies = meta.dependencies;
		  if (!dependencies) return
		  assert(Array.isArray(dependencies), 'The dependencies should be an array of strings');

		  dependencies.forEach(dependency => {
		    assert(
		      this[kRegisteredPlugins].indexOf(dependency) > -1,
		      `The dependency '${dependency}' of plugin '${meta.name}' is not registered`
		    );
		  });
		}

		function checkDecorators (fn) {
		  const meta = getMeta(fn);
		  if (!meta) return

		  const { decorators, name } = meta;
		  if (!decorators) return

		  if (decorators.fastify) _checkDecorators(this, 'Fastify', decorators.fastify, name);
		  if (decorators.reply) _checkDecorators(this, 'Reply', decorators.reply, name);
		  if (decorators.request) _checkDecorators(this, 'Request', decorators.request, name);
		}

		const checks = {
		  Fastify: exist,
		  Request: existRequest,
		  Reply: existReply
		};

		function _checkDecorators (that, instance, decorators, name) {
		  assert(Array.isArray(decorators), 'The decorators should be an array of strings');

		  decorators.forEach(decorator => {
		    const withPluginName = typeof name === 'string' ? ` required by '${name}'` : '';
		    if (!checks[instance].call(that, decorator)) {
		      throw new FST_ERR_PLUGIN_NOT_PRESENT_IN_INSTANCE(decorator, withPluginName, instance)
		    }
		  });
		}

		function checkVersion (fn) {
		  const meta = getMeta(fn);
		  if (meta == null || meta?.fastify == null) return

		  const requiredVersion = meta.fastify;

		  const fastifyRc = /-(?:rc|pre|alpha).+$/.test(this.version);
		  if (fastifyRc === true && semver.gt(this.version, semver.coerce(requiredVersion)) === true) {
		    // A Fastify release candidate phase is taking place. In order to reduce
		    // the effort needed to test plugins with the RC, we allow plugins targeting
		    // the prior Fastify release to be loaded.
		    return
		  }
		  if (requiredVersion && semver.satisfies(this.version, requiredVersion, { includePrerelease: fastifyRc }) === false) {
		    // We are not in a release candidate phase. Thus, we must honor the semver
		    // ranges defined by the plugin's metadata. Which is to say, if the plugin
		    // expects an older version of Fastify than the _current_ version, we will
		    // throw an error.
		    throw new FST_ERR_PLUGIN_VERSION_MISMATCH(meta.name, requiredVersion, this.version)
		  }
		}

		function registerPluginName (fn) {
		  const meta = getMeta(fn);
		  if (!meta) return

		  const name = meta.name;
		  if (!name) return
		  this[kRegisteredPlugins].push(name);
		  return name
		}

		function checkPluginHealthiness (fn, pluginName) {
		  if (fn.constructor.name === 'AsyncFunction' && fn.length === 3) {
		    throw new FST_ERR_PLUGIN_INVALID_ASYNC_HANDLER(pluginName)
		  }
		}

		function registerPlugin (fn) {
		  const pluginName = registerPluginName.call(this, fn) || getPluginName(fn);
		  checkPluginHealthiness.call(this, fn, pluginName);
		  checkVersion.call(this, fn);
		  checkDecorators.call(this, fn);
		  checkDependencies.call(this, fn);
		  return shouldSkipOverride(fn)
		}

		module.exports = {
		  getPluginName,
		  getFuncPreview,
		  kRegisteredPlugins,
		  getDisplayName,
		  registerPlugin
		};

		module.exports[kTestInternals] = {
		  shouldSkipOverride,
		  getMeta,
		  checkDecorators,
		  checkDependencies
		}; 
	} (pluginUtils));
	return pluginUtils.exports;
}

var reqIdGenFactory_1;
var hasRequiredReqIdGenFactory;

function requireReqIdGenFactory () {
	if (hasRequiredReqIdGenFactory) return reqIdGenFactory_1;
	hasRequiredReqIdGenFactory = 1;

	/**
	 * @callback GenerateRequestId
	 * @param {Object} req
	 * @returns {string}
	 */

	/**
	 * @param {string} [requestIdHeader]
	 * @param {GenerateRequestId} [optGenReqId]
	 * @returns {GenerateRequestId}
	 */
	function reqIdGenFactory (requestIdHeader, optGenReqId) {
	  const genReqId = optGenReqId || buildDefaultGenReqId();

	  if (requestIdHeader) {
	    return buildOptionalHeaderReqId(requestIdHeader, genReqId)
	  }

	  return genReqId
	}

	function getGenReqId (contextServer, req) {
	  return contextServer.genReqId(req)
	}

	function buildDefaultGenReqId () {
	  // 2,147,483,647 (2^31 − 1) stands for max SMI value (an internal optimization of V8).
	  // With this upper bound, if you'll be generating 1k ids/sec, you're going to hit it in ~25 days.
	  // This is very likely to happen in real-world applications, hence the limit is enforced.
	  // Growing beyond this value will make the id generation slower and cause a deopt.
	  // In the worst cases, it will become a float, losing accuracy.
	  const maxInt = 2147483647;

	  let nextReqId = 0;
	  return function defaultGenReqId () {
	    nextReqId = (nextReqId + 1) & maxInt;
	    return `req-${nextReqId.toString(36)}`
	  }
	}

	function buildOptionalHeaderReqId (requestIdHeader, genReqId) {
	  return function (req) {
	    return req.headers[requestIdHeader] || genReqId(req)
	  }
	}

	reqIdGenFactory_1 = {
	  getGenReqId,
	  reqIdGenFactory
	};
	return reqIdGenFactory_1;
}

var headRoute;
var hasRequiredHeadRoute;

function requireHeadRoute () {
	if (hasRequiredHeadRoute) return headRoute;
	hasRequiredHeadRoute = 1;
	function headRouteOnSendHandler (req, reply, payload, done) {
	  // If payload is undefined
	  if (payload === undefined) {
	    reply.header('content-length', '0');
	    return done(null, null)
	  }

	  if (typeof payload.resume === 'function') {
	    payload.on('error', (err) => {
	      reply.log.error({ err }, 'Error on Stream found for HEAD route');
	    });
	    payload.resume();
	    return done(null, null)
	  }

	  const size = '' + Buffer.byteLength(payload);

	  reply.header('content-length', size);

	  done(null, null);
	}

	function parseHeadOnSendHandlers (onSendHandlers) {
	  if (onSendHandlers == null) return headRouteOnSendHandler
	  return Array.isArray(onSendHandlers) ? [...onSendHandlers, headRouteOnSendHandler] : [onSendHandlers, headRouteOnSendHandler]
	}

	headRoute = {
	  parseHeadOnSendHandlers
	};
	return headRoute;
}

var route;
var hasRequiredRoute;

function requireRoute () {
	if (hasRequiredRoute) return route;
	hasRequiredRoute = 1;

	const FindMyWay = require$$0$a;
	const Context = /*@__PURE__*/ requireContext();
	const handleRequest = /*@__PURE__*/ requireHandleRequest();
	const { onRequestAbortHookRunner, lifecycleHooks, preParsingHookRunner, onTimeoutHookRunner, onRequestHookRunner } = /*@__PURE__*/ requireHooks();
	const { normalizeSchema } = /*@__PURE__*/ requireSchemas();
	const { parseHeadOnSendHandlers } = /*@__PURE__*/ requireHeadRoute();

	const {
	  compileSchemasForValidation,
	  compileSchemasForSerialization
	} = /*@__PURE__*/ requireValidation();

	const {
	  FST_ERR_SCH_VALIDATION_BUILD,
	  FST_ERR_SCH_SERIALIZATION_BUILD,
	  FST_ERR_DUPLICATED_ROUTE,
	  FST_ERR_INVALID_URL,
	  FST_ERR_HOOK_INVALID_HANDLER,
	  FST_ERR_ROUTE_OPTIONS_NOT_OBJ,
	  FST_ERR_ROUTE_DUPLICATED_HANDLER,
	  FST_ERR_ROUTE_HANDLER_NOT_FN,
	  FST_ERR_ROUTE_MISSING_HANDLER,
	  FST_ERR_ROUTE_METHOD_NOT_SUPPORTED,
	  FST_ERR_ROUTE_METHOD_INVALID,
	  FST_ERR_ROUTE_BODY_VALIDATION_SCHEMA_NOT_SUPPORTED,
	  FST_ERR_ROUTE_BODY_LIMIT_OPTION_NOT_INT,
	  FST_ERR_HOOK_INVALID_ASYNC_HANDLER
	} = /*@__PURE__*/ requireErrors();

	const {
	  kRoutePrefix,
	  kSupportedHTTPMethods,
	  kLogLevel,
	  kLogSerializers,
	  kHooks,
	  kSchemaController,
	  kOptions,
	  kReplySerializerDefault,
	  kReplyIsError,
	  kRequestPayloadStream,
	  kDisableRequestLogging,
	  kSchemaErrorFormatter,
	  kErrorHandler,
	  kHasBeenDecorated,
	  kRequestAcceptVersion,
	  kRouteByFastify,
	  kRouteContext
	} = /*@__PURE__*/ requireSymbols();
	const { buildErrorHandler } = /*@__PURE__*/ requireErrorHandler();
	const { createChildLogger } = /*@__PURE__*/ requireLoggerFactory();
	const { getGenReqId } = /*@__PURE__*/ requireReqIdGenFactory();

	function buildRouting (options) {
	  const router = FindMyWay(options.config);

	  let avvio;
	  let fourOhFour;
	  let logger;
	  let hasLogger;
	  let setupResponseListeners;
	  let throwIfAlreadyStarted;
	  let disableRequestLogging;
	  let ignoreTrailingSlash;
	  let ignoreDuplicateSlashes;
	  let return503OnClosing;
	  let globalExposeHeadRoutes;
	  let keepAliveConnections;

	  let closing = false;

	  return {
	    /**
	     * @param {import('../fastify').FastifyServerOptions} options
	     * @param {*} fastifyArgs
	     */
	    setup (options, fastifyArgs) {
	      avvio = fastifyArgs.avvio;
	      fourOhFour = fastifyArgs.fourOhFour;
	      logger = fastifyArgs.logger;
	      hasLogger = fastifyArgs.hasLogger;
	      setupResponseListeners = fastifyArgs.setupResponseListeners;
	      throwIfAlreadyStarted = fastifyArgs.throwIfAlreadyStarted;

	      globalExposeHeadRoutes = options.exposeHeadRoutes;
	      disableRequestLogging = options.disableRequestLogging;
	      ignoreTrailingSlash = options.ignoreTrailingSlash;
	      ignoreDuplicateSlashes = options.ignoreDuplicateSlashes;
	      return503OnClosing = Object.hasOwn(options, 'return503OnClosing') ? options.return503OnClosing : true;
	      keepAliveConnections = fastifyArgs.keepAliveConnections;
	    },
	    routing: router.lookup.bind(router), // router func to find the right handler to call
	    route, // configure a route in the fastify instance
	    hasRoute,
	    prepareRoute,
	    routeHandler,
	    closeRoutes: () => { closing = true; },
	    printRoutes: router.prettyPrint.bind(router),
	    addConstraintStrategy,
	    hasConstraintStrategy,
	    isAsyncConstraint,
	    findRoute
	  }

	  function addConstraintStrategy (strategy) {
	    throwIfAlreadyStarted('Cannot add constraint strategy!');
	    return router.addConstraintStrategy(strategy)
	  }

	  function hasConstraintStrategy (strategyName) {
	    return router.hasConstraintStrategy(strategyName)
	  }

	  function isAsyncConstraint () {
	    return router.constrainer.asyncStrategiesInUse.size > 0
	  }

	  // Convert shorthand to extended route declaration
	  function prepareRoute ({ method, url, options, handler, isFastify }) {
	    if (typeof url !== 'string') {
	      throw new FST_ERR_INVALID_URL(typeof url)
	    }

	    if (!handler && typeof options === 'function') {
	      handler = options; // for support over direct function calls such as fastify.get() options are reused as the handler
	      options = {};
	    } else if (handler && typeof handler === 'function') {
	      if (Object.prototype.toString.call(options) !== '[object Object]') {
	        throw new FST_ERR_ROUTE_OPTIONS_NOT_OBJ(method, url)
	      } else if (options.handler) {
	        if (typeof options.handler === 'function') {
	          throw new FST_ERR_ROUTE_DUPLICATED_HANDLER(method, url)
	        } else {
	          throw new FST_ERR_ROUTE_HANDLER_NOT_FN(method, url)
	        }
	      }
	    }

	    options = Object.assign({}, options, {
	      method,
	      url,
	      path: url,
	      handler: handler || (options && options.handler)
	    });

	    return route.call(this, { options, isFastify })
	  }

	  function hasRoute ({ options }) {
	    const normalizedMethod = options.method?.toUpperCase() ?? '';
	    return router.hasRoute(
	      normalizedMethod,
	      options.url || '',
	      options.constraints
	    )
	  }

	  function findRoute (options) {
	    const route = router.find(
	      options.method,
	      options.url || '',
	      options.constraints
	    );
	    if (route) {
	      // we must reduce the expose surface, otherwise
	      // we provide the ability for the user to modify
	      // all the route and server information in runtime
	      return {
	        handler: route.handler,
	        params: route.params,
	        searchParams: route.searchParams
	      }
	    } else {
	      return null
	    }
	  }

	  /**
	   * Route management
	   * @param {{ options: import('../fastify').RouteOptions, isFastify: boolean }}
	   */
	  function route ({ options, isFastify }) {
	    throwIfAlreadyStarted('Cannot add route!');

	    // Since we are mutating/assigning only top level props, it is fine to have a shallow copy using the spread operator
	    const opts = { ...options };

	    const path = opts.url || opts.path || '';

	    if (!opts.handler) {
	      throw new FST_ERR_ROUTE_MISSING_HANDLER(opts.method, path)
	    }

	    if (opts.errorHandler !== undefined && typeof opts.errorHandler !== 'function') {
	      throw new FST_ERR_ROUTE_HANDLER_NOT_FN(opts.method, path)
	    }

	    validateBodyLimitOption(opts.bodyLimit);

	    const shouldExposeHead = opts.exposeHeadRoute ?? globalExposeHeadRoutes;

	    let isGetRoute = false;
	    let isHeadRoute = false;

	    if (Array.isArray(opts.method)) {
	      for (let i = 0; i < opts.method.length; ++i) {
	        opts.method[i] = normalizeAndValidateMethod.call(this, opts.method[i]);
	        validateSchemaBodyOption.call(this, opts.method[i], path, opts.schema);

	        isGetRoute = opts.method.includes('GET');
	        isHeadRoute = opts.method.includes('HEAD');
	      }
	    } else {
	      opts.method = normalizeAndValidateMethod.call(this, opts.method);
	      validateSchemaBodyOption.call(this, opts.method, path, opts.schema);

	      isGetRoute = opts.method === 'GET';
	      isHeadRoute = opts.method === 'HEAD';
	    }

	    // we need to clone a set of initial options for HEAD route
	    const headOpts = shouldExposeHead && isGetRoute ? { ...options } : null;

	    const prefix = this[kRoutePrefix];

	    if (path === '/' && prefix.length > 0 && opts.method !== 'HEAD') {
	      switch (opts.prefixTrailingSlash) {
	        case 'slash':
	          addNewRoute.call(this, { path, isFastify });
	          break
	        case 'no-slash':
	          addNewRoute.call(this, { path: '', isFastify });
	          break
	        case 'both':
	        default:
	          addNewRoute.call(this, { path: '', isFastify });
	          // If ignoreTrailingSlash is set to true we need to add only the '' route to prevent adding an incomplete one.
	          if (ignoreTrailingSlash !== true && (ignoreDuplicateSlashes !== true || !prefix.endsWith('/'))) {
	            addNewRoute.call(this, { path, prefixing: true, isFastify });
	          }
	      }
	    } else if (path[0] === '/' && prefix.endsWith('/')) {
	      // Ensure that '/prefix/' + '/route' gets registered as '/prefix/route'
	      addNewRoute.call(this, { path: path.slice(1), isFastify });
	    } else {
	      addNewRoute.call(this, { path, isFastify });
	    }

	    // chainable api
	    return this

	    function addNewRoute ({ path, prefixing = false, isFastify = false }) {
	      const url = prefix + path;

	      opts.url = url;
	      opts.path = url;
	      opts.routePath = path;
	      opts.prefix = prefix;
	      opts.logLevel = opts.logLevel || this[kLogLevel];

	      if (this[kLogSerializers] || opts.logSerializers) {
	        opts.logSerializers = Object.assign(Object.create(this[kLogSerializers]), opts.logSerializers);
	      }

	      if (opts.attachValidation == null) {
	        opts.attachValidation = false;
	      }

	      if (prefixing === false) {
	        // run 'onRoute' hooks
	        for (const hook of this[kHooks].onRoute) {
	          hook.call(this, opts);
	        }
	      }

	      for (const hook of lifecycleHooks) {
	        if (opts && hook in opts) {
	          if (Array.isArray(opts[hook])) {
	            for (const func of opts[hook]) {
	              if (typeof func !== 'function') {
	                throw new FST_ERR_HOOK_INVALID_HANDLER(hook, Object.prototype.toString.call(func))
	              }

	              if (hook === 'onSend' || hook === 'preSerialization' || hook === 'onError' || hook === 'preParsing') {
	                if (func.constructor.name === 'AsyncFunction' && func.length === 4) {
	                  throw new FST_ERR_HOOK_INVALID_ASYNC_HANDLER()
	                }
	              } else if (hook === 'onRequestAbort') {
	                if (func.constructor.name === 'AsyncFunction' && func.length !== 1) {
	                  throw new FST_ERR_HOOK_INVALID_ASYNC_HANDLER()
	                }
	              } else {
	                if (func.constructor.name === 'AsyncFunction' && func.length === 3) {
	                  throw new FST_ERR_HOOK_INVALID_ASYNC_HANDLER()
	                }
	              }
	            }
	          } else if (opts[hook] !== undefined && typeof opts[hook] !== 'function') {
	            throw new FST_ERR_HOOK_INVALID_HANDLER(hook, Object.prototype.toString.call(opts[hook]))
	          }
	        }
	      }

	      const constraints = opts.constraints || {};
	      const config = {
	        ...opts.config,
	        url,
	        method: opts.method
	      };

	      const context = new Context({
	        schema: opts.schema,
	        handler: opts.handler.bind(this),
	        config,
	        errorHandler: opts.errorHandler,
	        childLoggerFactory: opts.childLoggerFactory,
	        bodyLimit: opts.bodyLimit,
	        logLevel: opts.logLevel,
	        logSerializers: opts.logSerializers,
	        attachValidation: opts.attachValidation,
	        schemaErrorFormatter: opts.schemaErrorFormatter,
	        replySerializer: this[kReplySerializerDefault],
	        validatorCompiler: opts.validatorCompiler,
	        serializerCompiler: opts.serializerCompiler,
	        exposeHeadRoute: shouldExposeHead,
	        prefixTrailingSlash: (opts.prefixTrailingSlash || 'both'),
	        server: this,
	        isFastify
	      });

	      const headHandler = router.findRoute('HEAD', opts.url, constraints);
	      const hasHEADHandler = headHandler !== null;

	      try {
	        router.on(opts.method, opts.url, { constraints }, routeHandler, context);
	      } catch (error) {
	        // any route insertion error created by fastify can be safely ignore
	        // because it only duplicate route for head
	        if (!context[kRouteByFastify]) {
	          const isDuplicatedRoute = error.message.includes(`Method '${opts.method}' already declared for route`);
	          if (isDuplicatedRoute) {
	            throw new FST_ERR_DUPLICATED_ROUTE(opts.method, opts.url)
	          }

	          throw error
	        }
	      }

	      this.after((notHandledErr, done) => {
	        // Send context async
	        context.errorHandler = opts.errorHandler ? buildErrorHandler(this[kErrorHandler], opts.errorHandler) : this[kErrorHandler];
	        context._parserOptions.limit = opts.bodyLimit || null;
	        context.logLevel = opts.logLevel;
	        context.logSerializers = opts.logSerializers;
	        context.attachValidation = opts.attachValidation;
	        context[kReplySerializerDefault] = this[kReplySerializerDefault];
	        context.schemaErrorFormatter = opts.schemaErrorFormatter || this[kSchemaErrorFormatter] || context.schemaErrorFormatter;

	        // Run hooks and more
	        avvio.once('preReady', () => {
	          for (const hook of lifecycleHooks) {
	            const toSet = this[kHooks][hook]
	              .concat(opts[hook] || [])
	              .map(h => h.bind(this));
	            context[hook] = toSet.length ? toSet : null;
	          }

	          // Optimization: avoid encapsulation if no decoration has been done.
	          while (!context.Request[kHasBeenDecorated] && context.Request.parent) {
	            context.Request = context.Request.parent;
	          }
	          while (!context.Reply[kHasBeenDecorated] && context.Reply.parent) {
	            context.Reply = context.Reply.parent;
	          }

	          // Must store the 404 Context in 'preReady' because it is only guaranteed to
	          // be available after all of the plugins and routes have been loaded.
	          fourOhFour.setContext(this, context);

	          if (opts.schema) {
	            context.schema = normalizeSchema(context.schema, this.initialConfig);

	            const schemaController = this[kSchemaController];
	            if (!opts.validatorCompiler && (opts.schema.body || opts.schema.headers || opts.schema.querystring || opts.schema.params)) {
	              schemaController.setupValidator(this[kOptions]);
	            }
	            try {
	              const isCustom = typeof opts?.validatorCompiler === 'function' || schemaController.isCustomValidatorCompiler;
	              compileSchemasForValidation(context, opts.validatorCompiler || schemaController.validatorCompiler, isCustom);
	            } catch (error) {
	              throw new FST_ERR_SCH_VALIDATION_BUILD(opts.method, url, error.message)
	            }

	            if (opts.schema.response && !opts.serializerCompiler) {
	              schemaController.setupSerializer(this[kOptions]);
	            }
	            try {
	              compileSchemasForSerialization(context, opts.serializerCompiler || schemaController.serializerCompiler);
	            } catch (error) {
	              throw new FST_ERR_SCH_SERIALIZATION_BUILD(opts.method, url, error.message)
	            }
	          }
	        });

	        done(notHandledErr);
	      });

	      // register head route in sync
	      // we must place it after the `this.after`

	      if (shouldExposeHead && isGetRoute && !isHeadRoute && !hasHEADHandler) {
	        const onSendHandlers = parseHeadOnSendHandlers(headOpts.onSend);
	        prepareRoute.call(this, { method: 'HEAD', url: path, options: { ...headOpts, onSend: onSendHandlers }, isFastify: true });
	      }
	    }
	  }

	  // HTTP request entry point, the routing has already been executed
	  function routeHandler (req, res, params, context, query) {
	    const id = getGenReqId(context.server, req);

	    const loggerOpts = {
	      level: context.logLevel
	    };

	    if (context.logSerializers) {
	      loggerOpts.serializers = context.logSerializers;
	    }
	    const childLogger = createChildLogger(context, logger, req, id, loggerOpts);
	    childLogger[kDisableRequestLogging] = disableRequestLogging;

	    if (closing === true) {
	      /* istanbul ignore next mac, windows */
	      if (req.httpVersionMajor !== 2) {
	        res.setHeader('Connection', 'close');
	      }

	      // TODO remove return503OnClosing after Node v18 goes EOL
	      /* istanbul ignore else */
	      if (return503OnClosing) {
	        // On Node v19 we cannot test this behavior as it won't be necessary
	        // anymore. It will close all the idle connections before they reach this
	        // stage.
	        const headers = {
	          'Content-Type': 'application/json',
	          'Content-Length': '80'
	        };
	        res.writeHead(503, headers);
	        res.end('{"error":"Service Unavailable","message":"Service Unavailable","statusCode":503}');
	        childLogger.info({ res: { statusCode: 503 } }, 'request aborted - refusing to accept new requests as server is closing');
	        return
	      }
	    }

	    // When server.forceCloseConnections is true, we will collect any requests
	    // that have indicated they want persistence so that they can be reaped
	    // on server close. Otherwise, the container is a noop container.
	    const connHeader = String.prototype.toLowerCase.call(req.headers.connection || '');
	    if (connHeader === 'keep-alive') {
	      if (keepAliveConnections.has(req.socket) === false) {
	        keepAliveConnections.add(req.socket);
	        req.socket.on('close', removeTrackedSocket.bind({ keepAliveConnections, socket: req.socket }));
	      }
	    }

	    // we revert the changes in defaultRoute
	    if (req.headers[kRequestAcceptVersion] !== undefined) {
	      req.headers['accept-version'] = req.headers[kRequestAcceptVersion];
	      req.headers[kRequestAcceptVersion] = undefined;
	    }

	    const request = new context.Request(id, params, req, query, childLogger, context);
	    const reply = new context.Reply(res, request, childLogger);
	    if (disableRequestLogging === false) {
	      childLogger.info({ req: request }, 'incoming request');
	    }

	    if (hasLogger === true || context.onResponse !== null) {
	      setupResponseListeners(reply);
	    }

	    if (context.onRequest !== null) {
	      onRequestHookRunner(
	        context.onRequest,
	        request,
	        reply,
	        runPreParsing
	      );
	    } else {
	      runPreParsing(null, request, reply);
	    }

	    if (context.onRequestAbort !== null) {
	      req.on('close', () => {
	        /* istanbul ignore else */
	        if (req.aborted) {
	          onRequestAbortHookRunner(
	            context.onRequestAbort,
	            request,
	            handleOnRequestAbortHooksErrors.bind(null, reply)
	          );
	        }
	      });
	    }

	    if (context.onTimeout !== null) {
	      if (!request.raw.socket._meta) {
	        request.raw.socket.on('timeout', handleTimeout);
	      }
	      request.raw.socket._meta = { context, request, reply };
	    }
	  }
	}

	function handleOnRequestAbortHooksErrors (reply, err) {
	  if (err) {
	    reply.log.error({ err }, 'onRequestAborted hook failed');
	  }
	}

	function handleTimeout () {
	  const { context, request, reply } = this._meta;
	  onTimeoutHookRunner(
	    context.onTimeout,
	    request,
	    reply,
	    noop
	  );
	}

	function normalizeAndValidateMethod (method) {
	  if (typeof method !== 'string') {
	    throw new FST_ERR_ROUTE_METHOD_INVALID()
	  }
	  method = method.toUpperCase();
	  if (!this[kSupportedHTTPMethods].bodyless.has(method) &&
	    !this[kSupportedHTTPMethods].bodywith.has(method)) {
	    throw new FST_ERR_ROUTE_METHOD_NOT_SUPPORTED(method)
	  }

	  return method
	}

	function validateSchemaBodyOption (method, path, schema) {
	  if (this[kSupportedHTTPMethods].bodyless.has(method) && schema?.body) {
	    throw new FST_ERR_ROUTE_BODY_VALIDATION_SCHEMA_NOT_SUPPORTED(method, path)
	  }
	}

	function validateBodyLimitOption (bodyLimit) {
	  if (bodyLimit === undefined) return
	  if (!Number.isInteger(bodyLimit) || bodyLimit <= 0) {
	    throw new FST_ERR_ROUTE_BODY_LIMIT_OPTION_NOT_INT(bodyLimit)
	  }
	}

	function runPreParsing (err, request, reply) {
	  if (reply.sent === true) return
	  if (err != null) {
	    reply[kReplyIsError] = true;
	    reply.send(err);
	    return
	  }

	  request[kRequestPayloadStream] = request.raw;

	  if (request[kRouteContext].preParsing !== null) {
	    preParsingHookRunner(request[kRouteContext].preParsing, request, reply, handleRequest.bind(request.server));
	  } else {
	    handleRequest.call(request.server, null, request, reply);
	  }
	}

	/**
	 * Used within the route handler as a `net.Socket.close` event handler.
	 * The purpose is to remove a socket from the tracked sockets collection when
	 * the socket has naturally timed out.
	 */
	function removeTrackedSocket () {
	  this.keepAliveConnections.delete(this.socket);
	}

	function noop () { }

	route = { buildRouting, validateBodyLimitOption };
	return route;
}

var fourOhFour_1;
var hasRequiredFourOhFour;

function requireFourOhFour () {
	if (hasRequiredFourOhFour) return fourOhFour_1;
	hasRequiredFourOhFour = 1;

	const FindMyWay = require$$0$a;

	const Reply = /*@__PURE__*/ requireReply();
	const Request = /*@__PURE__*/ requireRequest();
	const Context = /*@__PURE__*/ requireContext();
	const {
	  kRoutePrefix,
	  kCanSetNotFoundHandler,
	  kFourOhFourLevelInstance,
	  kFourOhFourContext,
	  kHooks,
	  kErrorHandler
	} = /*@__PURE__*/ requireSymbols();
	const { lifecycleHooks } = /*@__PURE__*/ requireHooks();
	const { buildErrorHandler } = /*@__PURE__*/ requireErrorHandler();
	const {
	  FST_ERR_NOT_FOUND
	} = /*@__PURE__*/ requireErrors();
	const { createChildLogger } = /*@__PURE__*/ requireLoggerFactory();
	const { getGenReqId } = /*@__PURE__*/ requireReqIdGenFactory();

	/**
	 * Each fastify instance have a:
	 * kFourOhFourLevelInstance: point to a fastify instance that has the 404 handler set
	 * kCanSetNotFoundHandler: bool to track if the 404 handler has already been set
	 * kFourOhFour: the singleton instance of this 404 module
	 * kFourOhFourContext: the context in the reply object where the handler will be executed
	 */
	function fourOhFour (options) {
	  const { logger, disableRequestLogging } = options;

	  // 404 router, used for handling encapsulated 404 handlers
	  const router = FindMyWay({ onBadUrl: createOnBadUrl(), defaultRoute: fourOhFourFallBack });
	  let _onBadUrlHandler = null;

	  return { router, setNotFoundHandler, setContext, arrange404 }

	  function arrange404 (instance) {
	    // Change the pointer of the fastify instance to itself, so register + prefix can add new 404 handler
	    instance[kFourOhFourLevelInstance] = instance;
	    instance[kCanSetNotFoundHandler] = true;
	    // we need to bind instance for the context
	    router.onBadUrl = router.onBadUrl.bind(instance);
	    router.defaultRoute = router.defaultRoute.bind(instance);
	  }

	  function basic404 (request, reply) {
	    const { url, method } = request.raw;
	    const message = `Route ${method}:${url} not found`;
	    if (!disableRequestLogging) {
	      request.log.info(message);
	    }
	    reply.code(404).send({
	      message,
	      error: 'Not Found',
	      statusCode: 404
	    });
	  }

	  function createOnBadUrl () {
	    return function onBadUrl (path, req, res) {
	      const fourOhFourContext = this[kFourOhFourLevelInstance][kFourOhFourContext];
	      const id = getGenReqId(fourOhFourContext.server, req);
	      const childLogger = createChildLogger(fourOhFourContext, logger, req, id);
	      const request = new Request(id, null, req, null, childLogger, fourOhFourContext);
	      const reply = new Reply(res, request, childLogger);

	      _onBadUrlHandler(request, reply);
	    }
	  }

	  function setContext (instance, context) {
	    const _404Context = Object.assign({}, instance[kFourOhFourContext]);
	    _404Context.onSend = context.onSend;
	    context[kFourOhFourContext] = _404Context;
	  }

	  function setNotFoundHandler (opts, handler, avvio, routeHandler) {
	    // First initialization of the fastify root instance
	    if (this[kCanSetNotFoundHandler] === undefined) {
	      this[kCanSetNotFoundHandler] = true;
	    }
	    if (this[kFourOhFourContext] === undefined) {
	      this[kFourOhFourContext] = null;
	    }

	    const _fastify = this;
	    const prefix = this[kRoutePrefix] || '/';

	    if (this[kCanSetNotFoundHandler] === false) {
	      throw new Error(`Not found handler already set for Fastify instance with prefix: '${prefix}'`)
	    }

	    if (typeof opts === 'object') {
	      if (opts.preHandler) {
	        if (Array.isArray(opts.preHandler)) {
	          opts.preHandler = opts.preHandler.map(hook => hook.bind(_fastify));
	        } else {
	          opts.preHandler = opts.preHandler.bind(_fastify);
	        }
	      }

	      if (opts.preValidation) {
	        if (Array.isArray(opts.preValidation)) {
	          opts.preValidation = opts.preValidation.map(hook => hook.bind(_fastify));
	        } else {
	          opts.preValidation = opts.preValidation.bind(_fastify);
	        }
	      }
	    }

	    if (typeof opts === 'function') {
	      handler = opts;
	      opts = undefined;
	    }
	    opts = opts || {};

	    if (handler) {
	      this[kFourOhFourLevelInstance][kCanSetNotFoundHandler] = false;
	      handler = handler.bind(this);
	      // update onBadUrl handler
	      _onBadUrlHandler = handler;
	    } else {
	      handler = basic404;
	      // update onBadUrl handler
	      _onBadUrlHandler = basic404;
	    }

	    this.after((notHandledErr, done) => {
	      _setNotFoundHandler.call(this, prefix, opts, handler, avvio, routeHandler);
	      done(notHandledErr);
	    });
	  }

	  function _setNotFoundHandler (prefix, opts, handler, avvio, routeHandler) {
	    const context = new Context({
	      schema: opts.schema,
	      handler,
	      config: opts.config || {},
	      server: this
	    });

	    avvio.once('preReady', () => {
	      const context = this[kFourOhFourContext];
	      for (const hook of lifecycleHooks) {
	        const toSet = this[kHooks][hook]
	          .concat(opts[hook] || [])
	          .map(h => h.bind(this));
	        context[hook] = toSet.length ? toSet : null;
	      }
	      context.errorHandler = opts.errorHandler ? buildErrorHandler(this[kErrorHandler], opts.errorHandler) : this[kErrorHandler];
	    });

	    if (this[kFourOhFourContext] !== null && prefix === '/') {
	      Object.assign(this[kFourOhFourContext], context); // Replace the default 404 handler
	      return
	    }

	    this[kFourOhFourLevelInstance][kFourOhFourContext] = context;

	    router.all(prefix + (prefix.endsWith('/') ? '*' : '/*'), routeHandler, context);
	    router.all(prefix, routeHandler, context);
	  }

	  function fourOhFourFallBack (req, res) {
	    // if this happen, we have a very bad bug
	    // we might want to do some hard debugging
	    // here, let's print out as much info as
	    // we can
	    const fourOhFourContext = this[kFourOhFourLevelInstance][kFourOhFourContext];
	    const id = getGenReqId(fourOhFourContext.server, req);
	    const childLogger = createChildLogger(fourOhFourContext, logger, req, id);

	    childLogger.info({ req }, 'incoming request');

	    const request = new Request(id, null, req, null, childLogger, fourOhFourContext);
	    const reply = new Reply(res, request, childLogger);

	    request.log.warn('the default handler for 404 did not catch this, this is likely a fastify bug, please report it');
	    request.log.warn(router.prettyPrint());
	    reply.code(404).send(new FST_ERR_NOT_FOUND());
	  }
	}

	fourOhFour_1 = fourOhFour;
	return fourOhFour_1;
}

var initialConfigValidation = {exports: {}};

var configValidator = {exports: {}};

var hasRequiredConfigValidator;

function requireConfigValidator () {
	if (hasRequiredConfigValidator) return configValidator.exports;
	hasRequiredConfigValidator = 1;
	configValidator.exports = validate10;
	configValidator.exports.default = validate10;
	const schema11 = {"properties":{"connectionTimeout":{"type":"integer","default":0},"keepAliveTimeout":{"type":"integer","default":72000},"forceCloseConnections":{"oneOf":[{"type":"string","pattern":"idle"},{"type":"boolean"}]},"maxRequestsPerSocket":{"type":"integer","default":0,"nullable":true},"requestTimeout":{"type":"integer","default":0},"bodyLimit":{"type":"integer","default":1048576},"caseSensitive":{"type":"boolean","default":true},"allowUnsafeRegex":{"type":"boolean","default":false},"http2":{"type":"boolean"},"https":{"if":{"not":{"oneOf":[{"type":"boolean"},{"type":"null"},{"type":"object","additionalProperties":false,"required":["allowHTTP1"],"properties":{"allowHTTP1":{"type":"boolean"}}}]}},"then":{"setDefaultValue":true}},"ignoreTrailingSlash":{"type":"boolean","default":false},"ignoreDuplicateSlashes":{"type":"boolean","default":false},"disableRequestLogging":{"type":"boolean","default":false},"maxParamLength":{"type":"integer","default":100},"onProtoPoisoning":{"type":"string","default":"error"},"onConstructorPoisoning":{"type":"string","default":"error"},"pluginTimeout":{"type":"integer","default":10000},"requestIdHeader":{"anyOf":[{"type":"boolean"},{"type":"string"}],"default":false},"requestIdLogLabel":{"type":"string","default":"reqId"},"http2SessionTimeout":{"type":"integer","default":72000},"exposeHeadRoutes":{"type":"boolean","default":true},"useSemicolonDelimiter":{"type":"boolean","default":false},"constraints":{"type":"object","additionalProperties":{"type":"object","required":["name","storage","validate","deriveConstraint"],"additionalProperties":true,"properties":{"name":{"type":"string"},"storage":{},"validate":{},"deriveConstraint":{}}}}}};
	const func2 = Object.prototype.hasOwnProperty;
	const pattern0 = new RegExp("idle", "u");

	function validate10(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
	let vErrors = null;
	let errors = 0;
	if(errors === 0){
	if(data && typeof data == "object" && !Array.isArray(data)){
	if(data.connectionTimeout === undefined){
	data.connectionTimeout = 0;
	}
	if(data.keepAliveTimeout === undefined){
	data.keepAliveTimeout = 72000;
	}
	if(data.maxRequestsPerSocket === undefined){
	data.maxRequestsPerSocket = 0;
	}
	if(data.requestTimeout === undefined){
	data.requestTimeout = 0;
	}
	if(data.bodyLimit === undefined){
	data.bodyLimit = 1048576;
	}
	if(data.caseSensitive === undefined){
	data.caseSensitive = true;
	}
	if(data.allowUnsafeRegex === undefined){
	data.allowUnsafeRegex = false;
	}
	if(data.ignoreTrailingSlash === undefined){
	data.ignoreTrailingSlash = false;
	}
	if(data.ignoreDuplicateSlashes === undefined){
	data.ignoreDuplicateSlashes = false;
	}
	if(data.disableRequestLogging === undefined){
	data.disableRequestLogging = false;
	}
	if(data.maxParamLength === undefined){
	data.maxParamLength = 100;
	}
	if(data.onProtoPoisoning === undefined){
	data.onProtoPoisoning = "error";
	}
	if(data.onConstructorPoisoning === undefined){
	data.onConstructorPoisoning = "error";
	}
	if(data.pluginTimeout === undefined){
	data.pluginTimeout = 10000;
	}
	if(data.requestIdHeader === undefined){
	data.requestIdHeader = false;
	}
	if(data.requestIdLogLabel === undefined){
	data.requestIdLogLabel = "reqId";
	}
	if(data.http2SessionTimeout === undefined){
	data.http2SessionTimeout = 72000;
	}
	if(data.exposeHeadRoutes === undefined){
	data.exposeHeadRoutes = true;
	}
	if(data.useSemicolonDelimiter === undefined){
	data.useSemicolonDelimiter = false;
	}
	const _errs1 = errors;
	for(const key0 in data){
	if(!(func2.call(schema11.properties, key0))){
	delete data[key0];
	}
	}
	if(_errs1 === errors){
	let data0 = data.connectionTimeout;
	const _errs2 = errors;
	if(!(((typeof data0 == "number") && (!(data0 % 1) && !isNaN(data0))) && (isFinite(data0)))){
	let dataType0 = typeof data0;
	let coerced0 = undefined;
	if(!(coerced0 !== undefined)){
	if(dataType0 === "boolean" || data0 === null
	              || (dataType0 === "string" && data0 && data0 == +data0 && !(data0 % 1))){
	coerced0 = +data0;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/connectionTimeout",schemaPath:"#/properties/connectionTimeout/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
	return false;
	}
	}
	if(coerced0 !== undefined){
	data0 = coerced0;
	if(data !== undefined){
	data["connectionTimeout"] = coerced0;
	}
	}
	}
	var valid0 = _errs2 === errors;
	if(valid0){
	let data1 = data.keepAliveTimeout;
	const _errs4 = errors;
	if(!(((typeof data1 == "number") && (!(data1 % 1) && !isNaN(data1))) && (isFinite(data1)))){
	let dataType1 = typeof data1;
	let coerced1 = undefined;
	if(!(coerced1 !== undefined)){
	if(dataType1 === "boolean" || data1 === null
	              || (dataType1 === "string" && data1 && data1 == +data1 && !(data1 % 1))){
	coerced1 = +data1;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/keepAliveTimeout",schemaPath:"#/properties/keepAliveTimeout/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
	return false;
	}
	}
	if(coerced1 !== undefined){
	data1 = coerced1;
	if(data !== undefined){
	data["keepAliveTimeout"] = coerced1;
	}
	}
	}
	var valid0 = _errs4 === errors;
	if(valid0){
	if(data.forceCloseConnections !== undefined){
	let data2 = data.forceCloseConnections;
	const _errs6 = errors;
	const _errs7 = errors;
	let valid1 = false;
	let passing0 = null;
	const _errs8 = errors;
	if(typeof data2 !== "string"){
	let dataType2 = typeof data2;
	let coerced2 = undefined;
	if(!(coerced2 !== undefined)){
	if(dataType2 == "number" || dataType2 == "boolean"){
	coerced2 = "" + data2;
	}
	else if(data2 === null){
	coerced2 = "";
	}
	else {
	const err0 = {instancePath:instancePath+"/forceCloseConnections",schemaPath:"#/properties/forceCloseConnections/oneOf/0/type",keyword:"type",params:{type: "string"},message:"must be string"};
	if(vErrors === null){
	vErrors = [err0];
	}
	else {
	vErrors.push(err0);
	}
	errors++;
	}
	}
	if(coerced2 !== undefined){
	data2 = coerced2;
	if(data !== undefined){
	data["forceCloseConnections"] = coerced2;
	}
	}
	}
	if(errors === _errs8){
	if(typeof data2 === "string"){
	if(!pattern0.test(data2)){
	const err1 = {instancePath:instancePath+"/forceCloseConnections",schemaPath:"#/properties/forceCloseConnections/oneOf/0/pattern",keyword:"pattern",params:{pattern: "idle"},message:"must match pattern \""+"idle"+"\""};
	if(vErrors === null){
	vErrors = [err1];
	}
	else {
	vErrors.push(err1);
	}
	errors++;
	}
	}
	}
	var _valid0 = _errs8 === errors;
	if(_valid0){
	valid1 = true;
	passing0 = 0;
	}
	const _errs10 = errors;
	if(typeof data2 !== "boolean"){
	let coerced3 = undefined;
	if(!(coerced3 !== undefined)){
	if(data2 === "false" || data2 === 0 || data2 === null){
	coerced3 = false;
	}
	else if(data2 === "true" || data2 === 1){
	coerced3 = true;
	}
	else {
	const err2 = {instancePath:instancePath+"/forceCloseConnections",schemaPath:"#/properties/forceCloseConnections/oneOf/1/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
	if(vErrors === null){
	vErrors = [err2];
	}
	else {
	vErrors.push(err2);
	}
	errors++;
	}
	}
	if(coerced3 !== undefined){
	data2 = coerced3;
	if(data !== undefined){
	data["forceCloseConnections"] = coerced3;
	}
	}
	}
	var _valid0 = _errs10 === errors;
	if(_valid0 && valid1){
	valid1 = false;
	passing0 = [passing0, 1];
	}
	else {
	if(_valid0){
	valid1 = true;
	passing0 = 1;
	}
	}
	if(!valid1){
	const err3 = {instancePath:instancePath+"/forceCloseConnections",schemaPath:"#/properties/forceCloseConnections/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf"};
	if(vErrors === null){
	vErrors = [err3];
	}
	else {
	vErrors.push(err3);
	}
	errors++;
	validate10.errors = vErrors;
	return false;
	}
	else {
	errors = _errs7;
	if(vErrors !== null){
	if(_errs7){
	vErrors.length = _errs7;
	}
	else {
	vErrors = null;
	}
	}
	}
	var valid0 = _errs6 === errors;
	}
	else {
	var valid0 = true;
	}
	if(valid0){
	let data3 = data.maxRequestsPerSocket;
	const _errs12 = errors;
	if((!(((typeof data3 == "number") && (!(data3 % 1) && !isNaN(data3))) && (isFinite(data3)))) && (data3 !== null)){
	let dataType4 = typeof data3;
	let coerced4 = undefined;
	if(!(coerced4 !== undefined)){
	if(dataType4 === "boolean" || data3 === null
	              || (dataType4 === "string" && data3 && data3 == +data3 && !(data3 % 1))){
	coerced4 = +data3;
	}
	else if(data3 === "" || data3 === 0 || data3 === false){
	coerced4 = null;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/maxRequestsPerSocket",schemaPath:"#/properties/maxRequestsPerSocket/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
	return false;
	}
	}
	if(coerced4 !== undefined){
	data3 = coerced4;
	if(data !== undefined){
	data["maxRequestsPerSocket"] = coerced4;
	}
	}
	}
	var valid0 = _errs12 === errors;
	if(valid0){
	let data4 = data.requestTimeout;
	const _errs15 = errors;
	if(!(((typeof data4 == "number") && (!(data4 % 1) && !isNaN(data4))) && (isFinite(data4)))){
	let dataType5 = typeof data4;
	let coerced5 = undefined;
	if(!(coerced5 !== undefined)){
	if(dataType5 === "boolean" || data4 === null
	              || (dataType5 === "string" && data4 && data4 == +data4 && !(data4 % 1))){
	coerced5 = +data4;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/requestTimeout",schemaPath:"#/properties/requestTimeout/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
	return false;
	}
	}
	if(coerced5 !== undefined){
	data4 = coerced5;
	if(data !== undefined){
	data["requestTimeout"] = coerced5;
	}
	}
	}
	var valid0 = _errs15 === errors;
	if(valid0){
	let data5 = data.bodyLimit;
	const _errs17 = errors;
	if(!(((typeof data5 == "number") && (!(data5 % 1) && !isNaN(data5))) && (isFinite(data5)))){
	let dataType6 = typeof data5;
	let coerced6 = undefined;
	if(!(coerced6 !== undefined)){
	if(dataType6 === "boolean" || data5 === null
	              || (dataType6 === "string" && data5 && data5 == +data5 && !(data5 % 1))){
	coerced6 = +data5;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/bodyLimit",schemaPath:"#/properties/bodyLimit/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
	return false;
	}
	}
	if(coerced6 !== undefined){
	data5 = coerced6;
	if(data !== undefined){
	data["bodyLimit"] = coerced6;
	}
	}
	}
	var valid0 = _errs17 === errors;
	if(valid0){
	let data6 = data.caseSensitive;
	const _errs19 = errors;
	if(typeof data6 !== "boolean"){
	let coerced7 = undefined;
	if(!(coerced7 !== undefined)){
	if(data6 === "false" || data6 === 0 || data6 === null){
	coerced7 = false;
	}
	else if(data6 === "true" || data6 === 1){
	coerced7 = true;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/caseSensitive",schemaPath:"#/properties/caseSensitive/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
	return false;
	}
	}
	if(coerced7 !== undefined){
	data6 = coerced7;
	if(data !== undefined){
	data["caseSensitive"] = coerced7;
	}
	}
	}
	var valid0 = _errs19 === errors;
	if(valid0){
	let data7 = data.allowUnsafeRegex;
	const _errs21 = errors;
	if(typeof data7 !== "boolean"){
	let coerced8 = undefined;
	if(!(coerced8 !== undefined)){
	if(data7 === "false" || data7 === 0 || data7 === null){
	coerced8 = false;
	}
	else if(data7 === "true" || data7 === 1){
	coerced8 = true;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/allowUnsafeRegex",schemaPath:"#/properties/allowUnsafeRegex/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
	return false;
	}
	}
	if(coerced8 !== undefined){
	data7 = coerced8;
	if(data !== undefined){
	data["allowUnsafeRegex"] = coerced8;
	}
	}
	}
	var valid0 = _errs21 === errors;
	if(valid0){
	if(data.http2 !== undefined){
	let data8 = data.http2;
	const _errs23 = errors;
	if(typeof data8 !== "boolean"){
	let coerced9 = undefined;
	if(!(coerced9 !== undefined)){
	if(data8 === "false" || data8 === 0 || data8 === null){
	coerced9 = false;
	}
	else if(data8 === "true" || data8 === 1){
	coerced9 = true;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/http2",schemaPath:"#/properties/http2/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
	return false;
	}
	}
	if(coerced9 !== undefined){
	data8 = coerced9;
	if(data !== undefined){
	data["http2"] = coerced9;
	}
	}
	}
	var valid0 = _errs23 === errors;
	}
	else {
	var valid0 = true;
	}
	if(valid0){
	if(data.https !== undefined){
	let data9 = data.https;
	const _errs25 = errors;
	const _errs26 = errors;
	let valid2 = true;
	const _errs27 = errors;
	const _errs28 = errors;
	const _errs29 = errors;
	const _errs30 = errors;
	let valid4 = false;
	const _errs31 = errors;
	if(typeof data9 !== "boolean"){
	let coerced10 = undefined;
	if(!(coerced10 !== undefined)){
	if(data9 === "false" || data9 === 0 || data9 === null){
	coerced10 = false;
	}
	else if(data9 === "true" || data9 === 1){
	coerced10 = true;
	}
	else {
	const err4 = {};
	if(vErrors === null){
	vErrors = [err4];
	}
	else {
	vErrors.push(err4);
	}
	errors++;
	}
	}
	if(coerced10 !== undefined){
	data9 = coerced10;
	if(data !== undefined){
	data["https"] = coerced10;
	}
	}
	}
	var _valid2 = _errs31 === errors;
	if(_valid2){
	valid4 = true;
	}
	const _errs33 = errors;
	if(data9 !== null){
	let coerced11 = undefined;
	if(!(coerced11 !== undefined)){
	if(data9 === "" || data9 === 0 || data9 === false){
	coerced11 = null;
	}
	else {
	const err5 = {};
	if(vErrors === null){
	vErrors = [err5];
	}
	else {
	vErrors.push(err5);
	}
	errors++;
	}
	}
	if(coerced11 !== undefined){
	data9 = coerced11;
	if(data !== undefined){
	data["https"] = coerced11;
	}
	}
	}
	var _valid2 = _errs33 === errors;
	if(_valid2 && valid4){
	valid4 = false;
	}
	else {
	if(_valid2){
	valid4 = true;
	}
	const _errs35 = errors;
	if(errors === _errs35){
	if(data9 && typeof data9 == "object" && !Array.isArray(data9)){
	if((data9.allowHTTP1 === undefined) && ("allowHTTP1")){
	const err6 = {};
	if(vErrors === null){
	vErrors = [err6];
	}
	else {
	vErrors.push(err6);
	}
	errors++;
	}
	else {
	const _errs37 = errors;
	for(const key1 in data9){
	if(!(key1 === "allowHTTP1")){
	delete data9[key1];
	}
	}
	if(_errs37 === errors){
	if(data9.allowHTTP1 !== undefined){
	let data10 = data9.allowHTTP1;
	if(typeof data10 !== "boolean"){
	let coerced12 = undefined;
	if(!(coerced12 !== undefined)){
	if(data10 === "false" || data10 === 0 || data10 === null){
	coerced12 = false;
	}
	else if(data10 === "true" || data10 === 1){
	coerced12 = true;
	}
	else {
	const err7 = {};
	if(vErrors === null){
	vErrors = [err7];
	}
	else {
	vErrors.push(err7);
	}
	errors++;
	}
	}
	if(coerced12 !== undefined){
	data10 = coerced12;
	if(data9 !== undefined){
	data9["allowHTTP1"] = coerced12;
	}
	}
	}
	}
	}
	}
	}
	else {
	const err8 = {};
	if(vErrors === null){
	vErrors = [err8];
	}
	else {
	vErrors.push(err8);
	}
	errors++;
	}
	}
	var _valid2 = _errs35 === errors;
	if(_valid2 && valid4){
	valid4 = false;
	}
	else {
	if(_valid2){
	valid4 = true;
	}
	}
	}
	if(!valid4){
	const err9 = {};
	if(vErrors === null){
	vErrors = [err9];
	}
	else {
	vErrors.push(err9);
	}
	errors++;
	}
	else {
	errors = _errs30;
	if(vErrors !== null){
	if(_errs30){
	vErrors.length = _errs30;
	}
	else {
	vErrors = null;
	}
	}
	}
	var valid3 = _errs29 === errors;
	if(valid3){
	const err10 = {};
	if(vErrors === null){
	vErrors = [err10];
	}
	else {
	vErrors.push(err10);
	}
	errors++;
	}
	else {
	errors = _errs28;
	if(vErrors !== null){
	if(_errs28){
	vErrors.length = _errs28;
	}
	else {
	vErrors = null;
	}
	}
	}
	var _valid1 = _errs27 === errors;
	errors = _errs26;
	if(vErrors !== null){
	if(_errs26){
	vErrors.length = _errs26;
	}
	else {
	vErrors = null;
	}
	}
	if(_valid1){
	const _errs40 = errors;
	data["https"] = true;
	var _valid1 = _errs40 === errors;
	valid2 = _valid1;
	}
	if(!valid2){
	const err11 = {instancePath:instancePath+"/https",schemaPath:"#/properties/https/if",keyword:"if",params:{failingKeyword: "then"},message:"must match \"then\" schema"};
	if(vErrors === null){
	vErrors = [err11];
	}
	else {
	vErrors.push(err11);
	}
	errors++;
	validate10.errors = vErrors;
	return false;
	}
	var valid0 = _errs25 === errors;
	}
	else {
	var valid0 = true;
	}
	if(valid0){
	let data11 = data.ignoreTrailingSlash;
	const _errs41 = errors;
	if(typeof data11 !== "boolean"){
	let coerced13 = undefined;
	if(!(coerced13 !== undefined)){
	if(data11 === "false" || data11 === 0 || data11 === null){
	coerced13 = false;
	}
	else if(data11 === "true" || data11 === 1){
	coerced13 = true;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/ignoreTrailingSlash",schemaPath:"#/properties/ignoreTrailingSlash/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
	return false;
	}
	}
	if(coerced13 !== undefined){
	data11 = coerced13;
	if(data !== undefined){
	data["ignoreTrailingSlash"] = coerced13;
	}
	}
	}
	var valid0 = _errs41 === errors;
	if(valid0){
	let data12 = data.ignoreDuplicateSlashes;
	const _errs43 = errors;
	if(typeof data12 !== "boolean"){
	let coerced14 = undefined;
	if(!(coerced14 !== undefined)){
	if(data12 === "false" || data12 === 0 || data12 === null){
	coerced14 = false;
	}
	else if(data12 === "true" || data12 === 1){
	coerced14 = true;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/ignoreDuplicateSlashes",schemaPath:"#/properties/ignoreDuplicateSlashes/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
	return false;
	}
	}
	if(coerced14 !== undefined){
	data12 = coerced14;
	if(data !== undefined){
	data["ignoreDuplicateSlashes"] = coerced14;
	}
	}
	}
	var valid0 = _errs43 === errors;
	if(valid0){
	let data13 = data.disableRequestLogging;
	const _errs45 = errors;
	if(typeof data13 !== "boolean"){
	let coerced15 = undefined;
	if(!(coerced15 !== undefined)){
	if(data13 === "false" || data13 === 0 || data13 === null){
	coerced15 = false;
	}
	else if(data13 === "true" || data13 === 1){
	coerced15 = true;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/disableRequestLogging",schemaPath:"#/properties/disableRequestLogging/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
	return false;
	}
	}
	if(coerced15 !== undefined){
	data13 = coerced15;
	if(data !== undefined){
	data["disableRequestLogging"] = coerced15;
	}
	}
	}
	var valid0 = _errs45 === errors;
	if(valid0){
	let data14 = data.maxParamLength;
	const _errs47 = errors;
	if(!(((typeof data14 == "number") && (!(data14 % 1) && !isNaN(data14))) && (isFinite(data14)))){
	let dataType16 = typeof data14;
	let coerced16 = undefined;
	if(!(coerced16 !== undefined)){
	if(dataType16 === "boolean" || data14 === null
	              || (dataType16 === "string" && data14 && data14 == +data14 && !(data14 % 1))){
	coerced16 = +data14;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/maxParamLength",schemaPath:"#/properties/maxParamLength/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
	return false;
	}
	}
	if(coerced16 !== undefined){
	data14 = coerced16;
	if(data !== undefined){
	data["maxParamLength"] = coerced16;
	}
	}
	}
	var valid0 = _errs47 === errors;
	if(valid0){
	let data15 = data.onProtoPoisoning;
	const _errs49 = errors;
	if(typeof data15 !== "string"){
	let dataType17 = typeof data15;
	let coerced17 = undefined;
	if(!(coerced17 !== undefined)){
	if(dataType17 == "number" || dataType17 == "boolean"){
	coerced17 = "" + data15;
	}
	else if(data15 === null){
	coerced17 = "";
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/onProtoPoisoning",schemaPath:"#/properties/onProtoPoisoning/type",keyword:"type",params:{type: "string"},message:"must be string"}];
	return false;
	}
	}
	if(coerced17 !== undefined){
	data15 = coerced17;
	if(data !== undefined){
	data["onProtoPoisoning"] = coerced17;
	}
	}
	}
	var valid0 = _errs49 === errors;
	if(valid0){
	let data16 = data.onConstructorPoisoning;
	const _errs51 = errors;
	if(typeof data16 !== "string"){
	let dataType18 = typeof data16;
	let coerced18 = undefined;
	if(!(coerced18 !== undefined)){
	if(dataType18 == "number" || dataType18 == "boolean"){
	coerced18 = "" + data16;
	}
	else if(data16 === null){
	coerced18 = "";
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/onConstructorPoisoning",schemaPath:"#/properties/onConstructorPoisoning/type",keyword:"type",params:{type: "string"},message:"must be string"}];
	return false;
	}
	}
	if(coerced18 !== undefined){
	data16 = coerced18;
	if(data !== undefined){
	data["onConstructorPoisoning"] = coerced18;
	}
	}
	}
	var valid0 = _errs51 === errors;
	if(valid0){
	let data17 = data.pluginTimeout;
	const _errs53 = errors;
	if(!(((typeof data17 == "number") && (!(data17 % 1) && !isNaN(data17))) && (isFinite(data17)))){
	let dataType19 = typeof data17;
	let coerced19 = undefined;
	if(!(coerced19 !== undefined)){
	if(dataType19 === "boolean" || data17 === null
	              || (dataType19 === "string" && data17 && data17 == +data17 && !(data17 % 1))){
	coerced19 = +data17;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/pluginTimeout",schemaPath:"#/properties/pluginTimeout/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
	return false;
	}
	}
	if(coerced19 !== undefined){
	data17 = coerced19;
	if(data !== undefined){
	data["pluginTimeout"] = coerced19;
	}
	}
	}
	var valid0 = _errs53 === errors;
	if(valid0){
	let data18 = data.requestIdHeader;
	const _errs55 = errors;
	const _errs56 = errors;
	let valid6 = false;
	const _errs57 = errors;
	if(typeof data18 !== "boolean"){
	let coerced20 = undefined;
	if(!(coerced20 !== undefined)){
	if(data18 === "false" || data18 === 0 || data18 === null){
	coerced20 = false;
	}
	else if(data18 === "true" || data18 === 1){
	coerced20 = true;
	}
	else {
	const err12 = {instancePath:instancePath+"/requestIdHeader",schemaPath:"#/properties/requestIdHeader/anyOf/0/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"};
	if(vErrors === null){
	vErrors = [err12];
	}
	else {
	vErrors.push(err12);
	}
	errors++;
	}
	}
	if(coerced20 !== undefined){
	data18 = coerced20;
	if(data !== undefined){
	data["requestIdHeader"] = coerced20;
	}
	}
	}
	var _valid3 = _errs57 === errors;
	valid6 = valid6 || _valid3;
	if(!valid6){
	const _errs59 = errors;
	if(typeof data18 !== "string"){
	let dataType21 = typeof data18;
	let coerced21 = undefined;
	if(!(coerced21 !== undefined)){
	if(dataType21 == "number" || dataType21 == "boolean"){
	coerced21 = "" + data18;
	}
	else if(data18 === null){
	coerced21 = "";
	}
	else {
	const err13 = {instancePath:instancePath+"/requestIdHeader",schemaPath:"#/properties/requestIdHeader/anyOf/1/type",keyword:"type",params:{type: "string"},message:"must be string"};
	if(vErrors === null){
	vErrors = [err13];
	}
	else {
	vErrors.push(err13);
	}
	errors++;
	}
	}
	if(coerced21 !== undefined){
	data18 = coerced21;
	if(data !== undefined){
	data["requestIdHeader"] = coerced21;
	}
	}
	}
	var _valid3 = _errs59 === errors;
	valid6 = valid6 || _valid3;
	}
	if(!valid6){
	const err14 = {instancePath:instancePath+"/requestIdHeader",schemaPath:"#/properties/requestIdHeader/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};
	if(vErrors === null){
	vErrors = [err14];
	}
	else {
	vErrors.push(err14);
	}
	errors++;
	validate10.errors = vErrors;
	return false;
	}
	else {
	errors = _errs56;
	if(vErrors !== null){
	if(_errs56){
	vErrors.length = _errs56;
	}
	else {
	vErrors = null;
	}
	}
	}
	var valid0 = _errs55 === errors;
	if(valid0){
	let data19 = data.requestIdLogLabel;
	const _errs61 = errors;
	if(typeof data19 !== "string"){
	let dataType22 = typeof data19;
	let coerced22 = undefined;
	if(!(coerced22 !== undefined)){
	if(dataType22 == "number" || dataType22 == "boolean"){
	coerced22 = "" + data19;
	}
	else if(data19 === null){
	coerced22 = "";
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/requestIdLogLabel",schemaPath:"#/properties/requestIdLogLabel/type",keyword:"type",params:{type: "string"},message:"must be string"}];
	return false;
	}
	}
	if(coerced22 !== undefined){
	data19 = coerced22;
	if(data !== undefined){
	data["requestIdLogLabel"] = coerced22;
	}
	}
	}
	var valid0 = _errs61 === errors;
	if(valid0){
	let data20 = data.http2SessionTimeout;
	const _errs63 = errors;
	if(!(((typeof data20 == "number") && (!(data20 % 1) && !isNaN(data20))) && (isFinite(data20)))){
	let dataType23 = typeof data20;
	let coerced23 = undefined;
	if(!(coerced23 !== undefined)){
	if(dataType23 === "boolean" || data20 === null
	              || (dataType23 === "string" && data20 && data20 == +data20 && !(data20 % 1))){
	coerced23 = +data20;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/http2SessionTimeout",schemaPath:"#/properties/http2SessionTimeout/type",keyword:"type",params:{type: "integer"},message:"must be integer"}];
	return false;
	}
	}
	if(coerced23 !== undefined){
	data20 = coerced23;
	if(data !== undefined){
	data["http2SessionTimeout"] = coerced23;
	}
	}
	}
	var valid0 = _errs63 === errors;
	if(valid0){
	let data21 = data.exposeHeadRoutes;
	const _errs65 = errors;
	if(typeof data21 !== "boolean"){
	let coerced24 = undefined;
	if(!(coerced24 !== undefined)){
	if(data21 === "false" || data21 === 0 || data21 === null){
	coerced24 = false;
	}
	else if(data21 === "true" || data21 === 1){
	coerced24 = true;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/exposeHeadRoutes",schemaPath:"#/properties/exposeHeadRoutes/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
	return false;
	}
	}
	if(coerced24 !== undefined){
	data21 = coerced24;
	if(data !== undefined){
	data["exposeHeadRoutes"] = coerced24;
	}
	}
	}
	var valid0 = _errs65 === errors;
	if(valid0){
	let data22 = data.useSemicolonDelimiter;
	const _errs67 = errors;
	if(typeof data22 !== "boolean"){
	let coerced25 = undefined;
	if(!(coerced25 !== undefined)){
	if(data22 === "false" || data22 === 0 || data22 === null){
	coerced25 = false;
	}
	else if(data22 === "true" || data22 === 1){
	coerced25 = true;
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/useSemicolonDelimiter",schemaPath:"#/properties/useSemicolonDelimiter/type",keyword:"type",params:{type: "boolean"},message:"must be boolean"}];
	return false;
	}
	}
	if(coerced25 !== undefined){
	data22 = coerced25;
	if(data !== undefined){
	data["useSemicolonDelimiter"] = coerced25;
	}
	}
	}
	var valid0 = _errs67 === errors;
	if(valid0){
	if(data.constraints !== undefined){
	let data23 = data.constraints;
	const _errs69 = errors;
	if(errors === _errs69){
	if(data23 && typeof data23 == "object" && !Array.isArray(data23)){
	for(const key2 in data23){
	let data24 = data23[key2];
	const _errs72 = errors;
	if(errors === _errs72){
	if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
	let missing1;
	if(((((data24.name === undefined) && (missing1 = "name")) || ((data24.storage === undefined) && (missing1 = "storage"))) || ((data24.validate === undefined) && (missing1 = "validate"))) || ((data24.deriveConstraint === undefined) && (missing1 = "deriveConstraint"))){
	validate10.errors = [{instancePath:instancePath+"/constraints/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/constraints/additionalProperties/required",keyword:"required",params:{missingProperty: missing1},message:"must have required property '"+missing1+"'"}];
	return false;
	}
	else {
	if(data24.name !== undefined){
	let data25 = data24.name;
	if(typeof data25 !== "string"){
	let dataType26 = typeof data25;
	let coerced26 = undefined;
	if(!(coerced26 !== undefined)){
	if(dataType26 == "number" || dataType26 == "boolean"){
	coerced26 = "" + data25;
	}
	else if(data25 === null){
	coerced26 = "";
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/constraints/" + key2.replace(/~/g, "~0").replace(/\//g, "~1")+"/name",schemaPath:"#/properties/constraints/additionalProperties/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string"}];
	return false;
	}
	}
	if(coerced26 !== undefined){
	data25 = coerced26;
	if(data24 !== undefined){
	data24["name"] = coerced26;
	}
	}
	}
	}
	}
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/constraints/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"),schemaPath:"#/properties/constraints/additionalProperties/type",keyword:"type",params:{type: "object"},message:"must be object"}];
	return false;
	}
	}
	var valid7 = _errs72 === errors;
	if(!valid7){
	break;
	}
	}
	}
	else {
	validate10.errors = [{instancePath:instancePath+"/constraints",schemaPath:"#/properties/constraints/type",keyword:"type",params:{type: "object"},message:"must be object"}];
	return false;
	}
	}
	var valid0 = _errs69 === errors;
	}
	else {
	var valid0 = true;
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	}
	else {
	validate10.errors = [{instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object"}];
	return false;
	}
	}
	validate10.errors = vErrors;
	return errors === 0;
	}


	configValidator.exports.defaultInitOptions = {"connectionTimeout":0,"keepAliveTimeout":72000,"maxRequestsPerSocket":0,"requestTimeout":0,"bodyLimit":1048576,"caseSensitive":true,"allowUnsafeRegex":false,"disableRequestLogging":false,"ignoreTrailingSlash":false,"ignoreDuplicateSlashes":false,"maxParamLength":100,"onProtoPoisoning":"error","onConstructorPoisoning":"error","pluginTimeout":10000,"requestIdHeader":false,"requestIdLogLabel":"reqId","http2SessionTimeout":72000,"exposeHeadRoutes":true,"useSemicolonDelimiter":false};
	/* c8 ignore stop */
	return configValidator.exports;
}

var hasRequiredInitialConfigValidation;

function requireInitialConfigValidation () {
	if (hasRequiredInitialConfigValidation) return initialConfigValidation.exports;
	hasRequiredInitialConfigValidation = 1;

	const validate = /*@__PURE__*/ requireConfigValidator();
	const deepClone = require$$0$4({ circles: true, proto: false });
	const { FST_ERR_INIT_OPTS_INVALID } = /*@__PURE__*/ requireErrors();

	function validateInitialConfig (options) {
	  const opts = deepClone(options);

	  if (!validate(opts)) {
	    const error = new FST_ERR_INIT_OPTS_INVALID(JSON.stringify(validate.errors.map(e => e.message)));
	    error.errors = validate.errors;
	    throw error
	  }

	  return deepFreezeObject(opts)
	}

	function deepFreezeObject (object) {
	  const properties = Object.getOwnPropertyNames(object);

	  for (const name of properties) {
	    const value = object[name];

	    if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
	      continue
	    }

	    object[name] = value && typeof value === 'object' ? deepFreezeObject(value) : value;
	  }

	  return Object.freeze(object)
	}

	initialConfigValidation.exports = validateInitialConfig;
	initialConfigValidation.exports.defaultInitOptions = validate.defaultInitOptions;
	initialConfigValidation.exports.utils = { deepFreezeObject };
	return initialConfigValidation.exports;
}

var pluginOverride;
var hasRequiredPluginOverride;

function requirePluginOverride () {
	if (hasRequiredPluginOverride) return pluginOverride;
	hasRequiredPluginOverride = 1;

	const {
	  kAvvioBoot,
	  kChildren,
	  kRoutePrefix,
	  kLogLevel,
	  kLogSerializers,
	  kHooks,
	  kSchemaController,
	  kContentTypeParser,
	  kReply,
	  kRequest,
	  kFourOhFour,
	  kPluginNameChain
	} = /*@__PURE__*/ requireSymbols();

	const Reply = /*@__PURE__*/ requireReply();
	const Request = /*@__PURE__*/ requireRequest();
	const SchemaController = /*@__PURE__*/ requireSchemaController();
	const ContentTypeParser = /*@__PURE__*/ requireContentTypeParser();
	const { buildHooks } = /*@__PURE__*/ requireHooks();
	const pluginUtils = /*@__PURE__*/ requirePluginUtils();

	// Function that runs the encapsulation magic.
	// Everything that need to be encapsulated must be handled in this function.
	pluginOverride = function override (old, fn, opts) {
	  const shouldSkipOverride = pluginUtils.registerPlugin.call(old, fn);

	  const fnName = pluginUtils.getPluginName(fn) || pluginUtils.getFuncPreview(fn);
	  if (shouldSkipOverride) {
	    // after every plugin registration we will enter a new name
	    old[kPluginNameChain].push(fnName);
	    return old
	  }

	  const instance = Object.create(old);
	  old[kChildren].push(instance);
	  instance.ready = old[kAvvioBoot].bind(instance);
	  instance[kChildren] = [];

	  instance[kReply] = Reply.buildReply(instance[kReply]);
	  instance[kRequest] = Request.buildRequest(instance[kRequest]);

	  instance[kContentTypeParser] = ContentTypeParser.helpers.buildContentTypeParser(instance[kContentTypeParser]);
	  instance[kHooks] = buildHooks(instance[kHooks]);
	  instance[kRoutePrefix] = buildRoutePrefix(instance[kRoutePrefix], opts.prefix);
	  instance[kLogLevel] = opts.logLevel || instance[kLogLevel];
	  instance[kSchemaController] = SchemaController.buildSchemaController(old[kSchemaController]);
	  instance.getSchema = instance[kSchemaController].getSchema.bind(instance[kSchemaController]);
	  instance.getSchemas = instance[kSchemaController].getSchemas.bind(instance[kSchemaController]);

	  // Track the registered and loaded plugins since the root instance.
	  // It does not track the current encapsulated plugin.
	  instance[pluginUtils.kRegisteredPlugins] = Object.create(instance[pluginUtils.kRegisteredPlugins]);

	  // Track the plugin chain since the root instance.
	  // When an non-encapsulated plugin is added, the chain will be updated.
	  instance[kPluginNameChain] = [fnName];

	  if (instance[kLogSerializers] || opts.logSerializers) {
	    instance[kLogSerializers] = Object.assign(Object.create(instance[kLogSerializers]), opts.logSerializers);
	  }

	  if (opts.prefix) {
	    instance[kFourOhFour].arrange404(instance);
	  }

	  for (const hook of instance[kHooks].onRegister) hook.call(old, instance, opts);

	  return instance
	};

	function buildRoutePrefix (instancePrefix, pluginPrefix) {
	  if (!pluginPrefix) {
	    return instancePrefix
	  }

	  // Ensure that there is a '/' between the prefixes
	  if (instancePrefix.endsWith('/') && pluginPrefix[0] === '/') {
	    // Remove the extra '/' to avoid: '/first//second'
	    pluginPrefix = pluginPrefix.slice(1);
	  } else if (pluginPrefix[0] !== '/') {
	    pluginPrefix = '/' + pluginPrefix;
	  }

	  return instancePrefix + pluginPrefix
	}
	return pluginOverride;
}

var noopSet;
var hasRequiredNoopSet;

function requireNoopSet () {
	if (hasRequiredNoopSet) return noopSet;
	hasRequiredNoopSet = 1;

	noopSet = function noopSet () {
	  return {
	    [Symbol.iterator]: function * () {},
	    add () {},
	    delete () {},
	    has () { return true }
	  }
	};
	return noopSet;
}

var hasRequiredFastify;

function requireFastify () {
	if (hasRequiredFastify) return fastify$1.exports;
	hasRequiredFastify = 1;

	const VERSION = '5.2.0';

	const Avvio = require$$0$b;
	const http = require$$0;
	const diagnostics = require$$1;
	let lightMyRequest;

	const {
	  kAvvioBoot,
	  kChildren,
	  kServerBindings,
	  kBodyLimit,
	  kSupportedHTTPMethods,
	  kRoutePrefix,
	  kLogLevel,
	  kLogSerializers,
	  kHooks,
	  kSchemaController,
	  kRequestAcceptVersion,
	  kReplySerializerDefault,
	  kContentTypeParser,
	  kReply,
	  kRequest,
	  kFourOhFour,
	  kState,
	  kOptions,
	  kPluginNameChain,
	  kSchemaErrorFormatter,
	  kErrorHandler,
	  kKeepAliveConnections,
	  kChildLoggerFactory,
	  kGenReqId
	} = /*@__PURE__*/ requireSymbols();

	const { createServer } = /*@__PURE__*/ requireServer();
	const Reply = /*@__PURE__*/ requireReply();
	const Request = /*@__PURE__*/ requireRequest();
	const Context = /*@__PURE__*/ requireContext();
	const decorator = /*@__PURE__*/ requireDecorate();
	const ContentTypeParser = /*@__PURE__*/ requireContentTypeParser();
	const SchemaController = /*@__PURE__*/ requireSchemaController();
	const { Hooks, hookRunnerApplication, supportedHooks } = /*@__PURE__*/ requireHooks();
	const { createChildLogger, defaultChildLoggerFactory, createLogger } = /*@__PURE__*/ requireLoggerFactory();
	const pluginUtils = /*@__PURE__*/ requirePluginUtils();
	const { getGenReqId, reqIdGenFactory } = /*@__PURE__*/ requireReqIdGenFactory();
	const { buildRouting, validateBodyLimitOption } = /*@__PURE__*/ requireRoute();
	const build404 = /*@__PURE__*/ requireFourOhFour();
	const getSecuredInitialConfig = /*@__PURE__*/ requireInitialConfigValidation();
	const override = /*@__PURE__*/ requirePluginOverride();
	const noopSet = /*@__PURE__*/ requireNoopSet();
	const {
	  appendStackTrace,
	  AVVIO_ERRORS_MAP,
	  ...errorCodes
	} = /*@__PURE__*/ requireErrors();

	const { defaultInitOptions } = getSecuredInitialConfig;

	const {
	  FST_ERR_ASYNC_CONSTRAINT,
	  FST_ERR_BAD_URL,
	  FST_ERR_FORCE_CLOSE_CONNECTIONS_IDLE_NOT_AVAILABLE,
	  FST_ERR_OPTIONS_NOT_OBJ,
	  FST_ERR_QSP_NOT_FN,
	  FST_ERR_SCHEMA_CONTROLLER_BUCKET_OPT_NOT_FN,
	  FST_ERR_AJV_CUSTOM_OPTIONS_OPT_NOT_OBJ,
	  FST_ERR_AJV_CUSTOM_OPTIONS_OPT_NOT_ARR,
	  FST_ERR_INSTANCE_ALREADY_LISTENING,
	  FST_ERR_REOPENED_CLOSE_SERVER,
	  FST_ERR_ROUTE_REWRITE_NOT_STR,
	  FST_ERR_SCHEMA_ERROR_FORMATTER_NOT_FN,
	  FST_ERR_ERROR_HANDLER_NOT_FN,
	  FST_ERR_ROUTE_METHOD_INVALID
	} = errorCodes;

	const { buildErrorHandler } = /*@__PURE__*/ requireErrorHandler();

	const initChannel = diagnostics.channel('fastify.initialization');

	function defaultBuildPrettyMeta (route) {
	  // return a shallow copy of route's sanitized context

	  const cleanKeys = {};
	  const allowedProps = ['errorHandler', 'logLevel', 'logSerializers'];

	  allowedProps.concat(supportedHooks).forEach(k => {
	    cleanKeys[k] = route.store[k];
	  });

	  return Object.assign({}, cleanKeys)
	}

	/**
	 * @param {import('./fastify.js').FastifyServerOptions} options
	 */
	function fastify (options) {
	  // Options validations
	  if (options && typeof options !== 'object') {
	    throw new FST_ERR_OPTIONS_NOT_OBJ()
	  } else {
	    // Shallow copy options object to prevent mutations outside of this function
	    options = Object.assign({}, options);
	  }

	  if (options.querystringParser && typeof options.querystringParser !== 'function') {
	    throw new FST_ERR_QSP_NOT_FN(typeof options.querystringParser)
	  }

	  if (options.schemaController && options.schemaController.bucket && typeof options.schemaController.bucket !== 'function') {
	    throw new FST_ERR_SCHEMA_CONTROLLER_BUCKET_OPT_NOT_FN(typeof options.schemaController.bucket)
	  }

	  validateBodyLimitOption(options.bodyLimit);

	  const requestIdHeader = typeof options.requestIdHeader === 'string' && options.requestIdHeader.length !== 0 ? options.requestIdHeader.toLowerCase() : (options.requestIdHeader === true && 'request-id');
	  const genReqId = reqIdGenFactory(requestIdHeader, options.genReqId);
	  const requestIdLogLabel = options.requestIdLogLabel || 'reqId';
	  const bodyLimit = options.bodyLimit || defaultInitOptions.bodyLimit;
	  const disableRequestLogging = options.disableRequestLogging || false;

	  const ajvOptions = Object.assign({
	    customOptions: {},
	    plugins: []
	  }, options.ajv);
	  const frameworkErrors = options.frameworkErrors;

	  // Ajv options
	  if (!ajvOptions.customOptions || Object.prototype.toString.call(ajvOptions.customOptions) !== '[object Object]') {
	    throw new FST_ERR_AJV_CUSTOM_OPTIONS_OPT_NOT_OBJ(typeof ajvOptions.customOptions)
	  }
	  if (!ajvOptions.plugins || !Array.isArray(ajvOptions.plugins)) {
	    throw new FST_ERR_AJV_CUSTOM_OPTIONS_OPT_NOT_ARR(typeof ajvOptions.plugins)
	  }

	  // Instance Fastify components

	  const { logger, hasLogger } = createLogger(options);

	  // Update the options with the fixed values
	  options.connectionTimeout = options.connectionTimeout || defaultInitOptions.connectionTimeout;
	  options.keepAliveTimeout = options.keepAliveTimeout || defaultInitOptions.keepAliveTimeout;
	  options.maxRequestsPerSocket = options.maxRequestsPerSocket || defaultInitOptions.maxRequestsPerSocket;
	  options.requestTimeout = options.requestTimeout || defaultInitOptions.requestTimeout;
	  options.logger = logger;
	  options.requestIdHeader = requestIdHeader;
	  options.requestIdLogLabel = requestIdLogLabel;
	  options.disableRequestLogging = disableRequestLogging;
	  options.ajv = ajvOptions;
	  options.clientErrorHandler = options.clientErrorHandler || defaultClientErrorHandler;

	  const initialConfig = getSecuredInitialConfig(options);

	  // exposeHeadRoutes have its default set from the validator
	  options.exposeHeadRoutes = initialConfig.exposeHeadRoutes;

	  // Default router
	  const router = buildRouting({
	    config: {
	      defaultRoute,
	      onBadUrl,
	      constraints: options.constraints,
	      ignoreTrailingSlash: options.ignoreTrailingSlash || defaultInitOptions.ignoreTrailingSlash,
	      ignoreDuplicateSlashes: options.ignoreDuplicateSlashes || defaultInitOptions.ignoreDuplicateSlashes,
	      maxParamLength: options.maxParamLength || defaultInitOptions.maxParamLength,
	      caseSensitive: options.caseSensitive,
	      allowUnsafeRegex: options.allowUnsafeRegex || defaultInitOptions.allowUnsafeRegex,
	      buildPrettyMeta: defaultBuildPrettyMeta,
	      querystringParser: options.querystringParser,
	      useSemicolonDelimiter: options.useSemicolonDelimiter ?? defaultInitOptions.useSemicolonDelimiter
	    }
	  });

	  // 404 router, used for handling encapsulated 404 handlers
	  const fourOhFour = build404(options);

	  // HTTP server and its handler
	  const httpHandler = wrapRouting(router, options);

	  // we need to set this before calling createServer
	  options.http2SessionTimeout = initialConfig.http2SessionTimeout;
	  const { server, listen } = createServer(options, httpHandler);

	  const serverHasCloseAllConnections = typeof server.closeAllConnections === 'function';
	  const serverHasCloseIdleConnections = typeof server.closeIdleConnections === 'function';

	  let forceCloseConnections = options.forceCloseConnections;
	  if (forceCloseConnections === 'idle' && !serverHasCloseIdleConnections) {
	    throw new FST_ERR_FORCE_CLOSE_CONNECTIONS_IDLE_NOT_AVAILABLE()
	  } else if (typeof forceCloseConnections !== 'boolean') {
	    /* istanbul ignore next: only one branch can be valid in a given Node.js version */
	    forceCloseConnections = serverHasCloseIdleConnections ? 'idle' : false;
	  }

	  const keepAliveConnections = !serverHasCloseAllConnections && forceCloseConnections === true ? new Set() : noopSet();

	  const setupResponseListeners = Reply.setupResponseListeners;
	  const schemaController = SchemaController.buildSchemaController(null, options.schemaController);

	  // Public API
	  const fastify = {
	    // Fastify internals
	    [kState]: {
	      listening: false,
	      closing: false,
	      started: false,
	      ready: false,
	      booting: false,
	      readyPromise: null
	    },
	    [kKeepAliveConnections]: keepAliveConnections,
	    [kSupportedHTTPMethods]: {
	      bodyless: new Set([
	        // Standard
	        'GET',
	        'HEAD',
	        'TRACE'
	      ]),
	      bodywith: new Set([
	        // Standard
	        'DELETE',
	        'OPTIONS',
	        'PATCH',
	        'PUT',
	        'POST'
	      ])
	    },
	    [kOptions]: options,
	    [kChildren]: [],
	    [kServerBindings]: [],
	    [kBodyLimit]: bodyLimit,
	    [kRoutePrefix]: '',
	    [kLogLevel]: '',
	    [kLogSerializers]: null,
	    [kHooks]: new Hooks(),
	    [kSchemaController]: schemaController,
	    [kSchemaErrorFormatter]: null,
	    [kErrorHandler]: buildErrorHandler(),
	    [kChildLoggerFactory]: defaultChildLoggerFactory,
	    [kReplySerializerDefault]: null,
	    [kContentTypeParser]: new ContentTypeParser(
	      bodyLimit,
	      (options.onProtoPoisoning || defaultInitOptions.onProtoPoisoning),
	      (options.onConstructorPoisoning || defaultInitOptions.onConstructorPoisoning)
	    ),
	    [kReply]: Reply.buildReply(Reply),
	    [kRequest]: Request.buildRequest(Request, options.trustProxy),
	    [kFourOhFour]: fourOhFour,
	    [pluginUtils.kRegisteredPlugins]: [],
	    [kPluginNameChain]: ['fastify'],
	    [kAvvioBoot]: null,
	    [kGenReqId]: genReqId,
	    // routing method
	    routing: httpHandler,
	    // routes shorthand methods
	    delete: function _delete (url, options, handler) {
	      return router.prepareRoute.call(this, { method: 'DELETE', url, options, handler })
	    },
	    get: function _get (url, options, handler) {
	      return router.prepareRoute.call(this, { method: 'GET', url, options, handler })
	    },
	    head: function _head (url, options, handler) {
	      return router.prepareRoute.call(this, { method: 'HEAD', url, options, handler })
	    },
	    trace: function _trace (url, options, handler) {
	      return router.prepareRoute.call(this, { method: 'TRACE', url, options, handler })
	    },
	    patch: function _patch (url, options, handler) {
	      return router.prepareRoute.call(this, { method: 'PATCH', url, options, handler })
	    },
	    post: function _post (url, options, handler) {
	      return router.prepareRoute.call(this, { method: 'POST', url, options, handler })
	    },
	    put: function _put (url, options, handler) {
	      return router.prepareRoute.call(this, { method: 'PUT', url, options, handler })
	    },
	    options: function _options (url, options, handler) {
	      return router.prepareRoute.call(this, { method: 'OPTIONS', url, options, handler })
	    },
	    all: function _all (url, options, handler) {
	      return router.prepareRoute.call(this, { method: this.supportedMethods, url, options, handler })
	    },
	    // extended route
	    route: function _route (options) {
	      // we need the fastify object that we are producing so we apply a lazy loading of the function,
	      // otherwise we should bind it after the declaration
	      return router.route.call(this, { options })
	    },
	    hasRoute: function _route (options) {
	      return router.hasRoute.call(this, { options })
	    },
	    findRoute: function _findRoute (options) {
	      return router.findRoute(options)
	    },
	    // expose logger instance
	    log: logger,
	    // type provider
	    withTypeProvider,
	    // hooks
	    addHook,
	    // schemas
	    addSchema,
	    getSchema: schemaController.getSchema.bind(schemaController),
	    getSchemas: schemaController.getSchemas.bind(schemaController),
	    setValidatorCompiler,
	    setSerializerCompiler,
	    setSchemaController,
	    setReplySerializer,
	    setSchemaErrorFormatter,
	    // set generated request id
	    setGenReqId,
	    // custom parsers
	    addContentTypeParser: ContentTypeParser.helpers.addContentTypeParser,
	    hasContentTypeParser: ContentTypeParser.helpers.hasContentTypeParser,
	    getDefaultJsonParser: ContentTypeParser.defaultParsers.getDefaultJsonParser,
	    defaultTextParser: ContentTypeParser.defaultParsers.defaultTextParser,
	    removeContentTypeParser: ContentTypeParser.helpers.removeContentTypeParser,
	    removeAllContentTypeParsers: ContentTypeParser.helpers.removeAllContentTypeParsers,
	    // Fastify architecture methods (initialized by Avvio)
	    register: null,
	    after: null,
	    ready: null,
	    onClose: null,
	    close: null,
	    printPlugins: null,
	    hasPlugin: function (name) {
	      return this[pluginUtils.kRegisteredPlugins].includes(name) || this[kPluginNameChain].includes(name)
	    },
	    // http server
	    listen,
	    server,
	    addresses: function () {
	      /* istanbul ignore next */
	      const binded = this[kServerBindings].map(b => b.address());
	      binded.push(this.server.address());
	      return binded.filter(adr => adr)
	    },
	    // extend fastify objects
	    decorate: decorator.add,
	    hasDecorator: decorator.exist,
	    decorateReply: decorator.decorateReply,
	    decorateRequest: decorator.decorateRequest,
	    hasRequestDecorator: decorator.existRequest,
	    hasReplyDecorator: decorator.existReply,
	    addHttpMethod,
	    // fake http injection
	    inject,
	    // pretty print of the registered routes
	    printRoutes,
	    // custom error handling
	    setNotFoundHandler,
	    setErrorHandler,
	    // child logger
	    setChildLoggerFactory,
	    // Set fastify initial configuration options read-only object
	    initialConfig,
	    // constraint strategies
	    addConstraintStrategy: router.addConstraintStrategy.bind(router),
	    hasConstraintStrategy: router.hasConstraintStrategy.bind(router)
	  };

	  Object.defineProperties(fastify, {
	    listeningOrigin: {
	      get () {
	        const address = this.addresses().slice(-1).pop();
	        /* ignore if windows: unix socket is not testable on Windows platform */
	        /* c8 ignore next 3 */
	        if (typeof address === 'string') {
	          return address
	        }
	        const host = address.family === 'IPv6' ? `[${address.address}]` : address.address;
	        return `${this[kOptions].https ? 'https' : 'http'}://${host}:${address.port}`
	      }
	    },
	    pluginName: {
	      configurable: true,
	      get () {
	        if (this[kPluginNameChain].length > 1) {
	          return this[kPluginNameChain].join(' -> ')
	        }
	        return this[kPluginNameChain][0]
	      }
	    },
	    prefix: {
	      configurable: true,
	      get () { return this[kRoutePrefix] }
	    },
	    validatorCompiler: {
	      configurable: true,
	      get () { return this[kSchemaController].getValidatorCompiler() }
	    },
	    serializerCompiler: {
	      configurable: true,
	      get () { return this[kSchemaController].getSerializerCompiler() }
	    },
	    childLoggerFactory: {
	      configurable: true,
	      get () { return this[kChildLoggerFactory] }
	    },
	    version: {
	      configurable: true,
	      get () { return VERSION }
	    },
	    errorHandler: {
	      configurable: true,
	      get () {
	        return this[kErrorHandler].func
	      }
	    },
	    genReqId: {
	      configurable: true,
	      get () { return this[kGenReqId] }
	    },
	    supportedMethods: {
	      configurable: false,
	      get () {
	        return [
	          ...this[kSupportedHTTPMethods].bodyless,
	          ...this[kSupportedHTTPMethods].bodywith
	        ]
	      }
	    }
	  });

	  if (options.schemaErrorFormatter) {
	    validateSchemaErrorFormatter(options.schemaErrorFormatter);
	    fastify[kSchemaErrorFormatter] = options.schemaErrorFormatter.bind(fastify);
	  }

	  // Install and configure Avvio
	  // Avvio will update the following Fastify methods:
	  // - register
	  // - after
	  // - ready
	  // - onClose
	  // - close

	  const avvioPluginTimeout = Number(options.pluginTimeout);
	  const avvio = Avvio(fastify, {
	    autostart: false,
	    timeout: isNaN(avvioPluginTimeout) === false ? avvioPluginTimeout : defaultInitOptions.pluginTimeout,
	    expose: {
	      use: 'register'
	    }
	  });
	  // Override to allow the plugin encapsulation
	  avvio.override = override;
	  avvio.on('start', () => (fastify[kState].started = true));
	  fastify[kAvvioBoot] = fastify.ready; // the avvio ready function
	  fastify.ready = ready; // overwrite the avvio ready function
	  fastify.printPlugins = avvio.prettyPrint.bind(avvio);

	  // cache the closing value, since we are checking it in an hot path
	  avvio.once('preReady', () => {
	    fastify.onClose((instance, done) => {
	      fastify[kState].closing = true;
	      router.closeRoutes();

	      hookRunnerApplication('preClose', fastify[kAvvioBoot], fastify, function () {
	        if (fastify[kState].listening) {
	          /* istanbul ignore next: Cannot test this without Node.js core support */
	          if (forceCloseConnections === 'idle') {
	            // Not needed in Node 19
	            instance.server.closeIdleConnections();
	            /* istanbul ignore next: Cannot test this without Node.js core support */
	          } else if (serverHasCloseAllConnections && forceCloseConnections) {
	            instance.server.closeAllConnections();
	          } else if (forceCloseConnections === true) {
	            for (const conn of fastify[kKeepAliveConnections]) {
	              // We must invoke the destroy method instead of merely unreffing
	              // the sockets. If we only unref, then the callback passed to
	              // `fastify.close` will never be invoked; nor will any of the
	              // registered `onClose` hooks.
	              conn.destroy();
	              fastify[kKeepAliveConnections].delete(conn);
	            }
	          }
	        }

	        // No new TCP connections are accepted.
	        // We must call close on the server even if we are not listening
	        // otherwise memory will be leaked.
	        // https://github.com/nodejs/node/issues/48604
	        if (!options.serverFactory || fastify[kState].listening) {
	          instance.server.close(function (err) {
	            /* c8 ignore next 6 */
	            if (err && err.code !== 'ERR_SERVER_NOT_RUNNING') {
	              done(null);
	            } else {
	              done();
	            }
	          });
	        } else {
	          process.nextTick(done, null);
	        }
	      });
	    });
	  });

	  // Create bad URL context
	  const onBadUrlContext = new Context({
	    server: fastify,
	    config: {}
	  });

	  // Set the default 404 handler
	  fastify.setNotFoundHandler();
	  fourOhFour.arrange404(fastify);

	  router.setup(options, {
	    avvio,
	    fourOhFour,
	    logger,
	    hasLogger,
	    setupResponseListeners,
	    throwIfAlreadyStarted,
	    keepAliveConnections
	  });

	  // Delay configuring clientError handler so that it can access fastify state.
	  server.on('clientError', options.clientErrorHandler.bind(fastify));

	  if (initChannel.hasSubscribers) {
	    initChannel.publish({ fastify });
	  }

	  // Older nodejs versions may not have asyncDispose
	  if ('asyncDispose' in Symbol) {
	    fastify[Symbol.asyncDispose] = function dispose () {
	      return fastify.close()
	    };
	  }

	  return fastify

	  function throwIfAlreadyStarted (msg) {
	    if (fastify[kState].started) throw new FST_ERR_INSTANCE_ALREADY_LISTENING(msg)
	  }

	  // HTTP injection handling
	  // If the server is not ready yet, this
	  // utility will automatically force it.
	  function inject (opts, cb) {
	    // lightMyRequest is dynamically loaded as it seems very expensive
	    // because of Ajv
	    if (lightMyRequest === undefined) {
	      lightMyRequest = require$$22;
	    }

	    if (fastify[kState].started) {
	      if (fastify[kState].closing) {
	        // Force to return an error
	        const error = new FST_ERR_REOPENED_CLOSE_SERVER();
	        if (cb) {
	          cb(error);
	          return
	        } else {
	          return Promise.reject(error)
	        }
	      }
	      return lightMyRequest(httpHandler, opts, cb)
	    }

	    if (cb) {
	      this.ready(err => {
	        if (err) cb(err, null);
	        else lightMyRequest(httpHandler, opts, cb);
	      });
	    } else {
	      return lightMyRequest((req, res) => {
	        this.ready(function (err) {
	          if (err) {
	            res.emit('error', err);
	            return
	          }
	          httpHandler(req, res);
	        });
	      }, opts)
	    }
	  }

	  function ready (cb) {
	    if (this[kState].readyPromise !== null) {
	      if (cb != null) {
	        this[kState].readyPromise.then(() => cb(null, fastify), cb);
	        return
	      }

	      return this[kState].readyPromise
	    }

	    let resolveReady;
	    let rejectReady;

	    // run the hooks after returning the promise
	    process.nextTick(runHooks);

	    // Create a promise no matter what
	    // It will work as a barrier for all the .ready() calls (ensuring single hook execution)
	    // as well as a flow control mechanism to chain cbs and further
	    // promises
	    this[kState].readyPromise = new Promise(function (resolve, reject) {
	      resolveReady = resolve;
	      rejectReady = reject;
	    });

	    if (!cb) {
	      return this[kState].readyPromise
	    } else {
	      this[kState].readyPromise.then(() => cb(null, fastify), cb);
	    }

	    function runHooks () {
	      // start loading
	      fastify[kAvvioBoot]((err, done) => {
	        if (err || fastify[kState].started || fastify[kState].ready || fastify[kState].booting) {
	          manageErr(err);
	        } else {
	          fastify[kState].booting = true;
	          hookRunnerApplication('onReady', fastify[kAvvioBoot], fastify, manageErr);
	        }
	        done();
	      });
	    }

	    function manageErr (err) {
	      // If the error comes out of Avvio's Error codes
	      // We create a make and preserve the previous error
	      // as cause
	      err = err != null && AVVIO_ERRORS_MAP[err.code] != null
	        ? appendStackTrace(err, new AVVIO_ERRORS_MAP[err.code](err.message))
	        : err;

	      if (err) {
	        return rejectReady(err)
	      }

	      resolveReady(fastify);
	      fastify[kState].booting = false;
	      fastify[kState].ready = true;
	      fastify[kState].promise = null;
	    }
	  }

	  // Used exclusively in TypeScript contexts to enable auto type inference from JSON schema.
	  function withTypeProvider () {
	    return this
	  }

	  // wrapper that we expose to the user for hooks handling
	  function addHook (name, fn) {
	    throwIfAlreadyStarted('Cannot call "addHook"!');

	    if (fn == null) {
	      throw new errorCodes.FST_ERR_HOOK_INVALID_HANDLER(name, fn)
	    }

	    if (name === 'onSend' || name === 'preSerialization' || name === 'onError' || name === 'preParsing') {
	      if (fn.constructor.name === 'AsyncFunction' && fn.length === 4) {
	        throw new errorCodes.FST_ERR_HOOK_INVALID_ASYNC_HANDLER()
	      }
	    } else if (name === 'onReady' || name === 'onListen') {
	      if (fn.constructor.name === 'AsyncFunction' && fn.length !== 0) {
	        throw new errorCodes.FST_ERR_HOOK_INVALID_ASYNC_HANDLER()
	      }
	    } else if (name === 'onRequestAbort') {
	      if (fn.constructor.name === 'AsyncFunction' && fn.length !== 1) {
	        throw new errorCodes.FST_ERR_HOOK_INVALID_ASYNC_HANDLER()
	      }
	    } else {
	      if (fn.constructor.name === 'AsyncFunction' && fn.length === 3) {
	        throw new errorCodes.FST_ERR_HOOK_INVALID_ASYNC_HANDLER()
	      }
	    }

	    if (name === 'onClose') {
	      this.onClose(fn.bind(this));
	    } else if (name === 'onReady' || name === 'onListen' || name === 'onRoute') {
	      this[kHooks].add(name, fn);
	    } else {
	      this.after((err, done) => {
	        _addHook.call(this, name, fn);
	        done(err);
	      });
	    }
	    return this

	    function _addHook (name, fn) {
	      this[kHooks].add(name, fn);
	      this[kChildren].forEach(child => _addHook.call(child, name, fn));
	    }
	  }

	  // wrapper that we expose to the user for schemas handling
	  function addSchema (schema) {
	    throwIfAlreadyStarted('Cannot call "addSchema"!');
	    this[kSchemaController].add(schema);
	    this[kChildren].forEach(child => child.addSchema(schema));
	    return this
	  }

	  function defaultClientErrorHandler (err, socket) {
	    // In case of a connection reset, the socket has been destroyed and there is nothing that needs to be done.
	    // https://nodejs.org/api/http.html#http_event_clienterror
	    if (err.code === 'ECONNRESET' || socket.destroyed) {
	      return
	    }

	    let body, errorCode, errorStatus, errorLabel;

	    if (err.code === 'ERR_HTTP_REQUEST_TIMEOUT') {
	      errorCode = '408';
	      errorStatus = http.STATUS_CODES[errorCode];
	      body = `{"error":"${errorStatus}","message":"Client Timeout","statusCode":408}`;
	      errorLabel = 'timeout';
	    } else if (err.code === 'HPE_HEADER_OVERFLOW') {
	      errorCode = '431';
	      errorStatus = http.STATUS_CODES[errorCode];
	      body = `{"error":"${errorStatus}","message":"Exceeded maximum allowed HTTP header size","statusCode":431}`;
	      errorLabel = 'header_overflow';
	    } else {
	      errorCode = '400';
	      errorStatus = http.STATUS_CODES[errorCode];
	      body = `{"error":"${errorStatus}","message":"Client Error","statusCode":400}`;
	      errorLabel = 'error';
	    }

	    // Most devs do not know what to do with this error.
	    // In the vast majority of cases, it's a network error and/or some
	    // config issue on the load balancer side.
	    this.log.trace({ err }, `client ${errorLabel}`);
	    // Copying standard node behavior
	    // https://github.com/nodejs/node/blob/6ca23d7846cb47e84fd344543e394e50938540be/lib/_http_server.js#L666

	    // If the socket is not writable, there is no reason to try to send data.
	    if (socket.writable) {
	      socket.write(`HTTP/1.1 ${errorCode} ${errorStatus}\r\nContent-Length: ${body.length}\r\nContent-Type: application/json\r\n\r\n${body}`);
	    }
	    socket.destroy(err);
	  }

	  // If the router does not match any route, every request will land here
	  // req and res are Node.js core objects
	  function defaultRoute (req, res) {
	    if (req.headers['accept-version'] !== undefined) {
	      // we remove the accept-version header for performance result
	      // because we do not want to go through the constraint checking
	      // the usage of symbol here to prevent any collision on custom header name
	      req.headers[kRequestAcceptVersion] = req.headers['accept-version'];
	      req.headers['accept-version'] = undefined;
	    }
	    fourOhFour.router.lookup(req, res);
	  }

	  function onBadUrl (path, req, res) {
	    if (frameworkErrors) {
	      const id = getGenReqId(onBadUrlContext.server, req);
	      const childLogger = createChildLogger(onBadUrlContext, logger, req, id);

	      const request = new Request(id, null, req, null, childLogger, onBadUrlContext);
	      const reply = new Reply(res, request, childLogger);

	      if (disableRequestLogging === false) {
	        childLogger.info({ req: request }, 'incoming request');
	      }

	      return frameworkErrors(new FST_ERR_BAD_URL(path), request, reply)
	    }
	    const body = `{"error":"Bad Request","code":"FST_ERR_BAD_URL","message":"'${path}' is not a valid url component","statusCode":400}`;
	    res.writeHead(400, {
	      'Content-Type': 'application/json',
	      'Content-Length': body.length
	    });
	    res.end(body);
	  }

	  function buildAsyncConstraintCallback (isAsync, req, res) {
	    if (isAsync === false) return undefined
	    return function onAsyncConstraintError (err) {
	      if (err) {
	        if (frameworkErrors) {
	          const id = getGenReqId(onBadUrlContext.server, req);
	          const childLogger = createChildLogger(onBadUrlContext, logger, req, id);

	          const request = new Request(id, null, req, null, childLogger, onBadUrlContext);
	          const reply = new Reply(res, request, childLogger);

	          if (disableRequestLogging === false) {
	            childLogger.info({ req: request }, 'incoming request');
	          }

	          return frameworkErrors(new FST_ERR_ASYNC_CONSTRAINT(), request, reply)
	        }
	        const body = '{"error":"Internal Server Error","message":"Unexpected error from async constraint","statusCode":500}';
	        res.writeHead(500, {
	          'Content-Type': 'application/json',
	          'Content-Length': body.length
	        });
	        res.end(body);
	      }
	    }
	  }

	  function setNotFoundHandler (opts, handler) {
	    throwIfAlreadyStarted('Cannot call "setNotFoundHandler"!');

	    fourOhFour.setNotFoundHandler.call(this, opts, handler, avvio, router.routeHandler);
	    return this
	  }

	  function setValidatorCompiler (validatorCompiler) {
	    throwIfAlreadyStarted('Cannot call "setValidatorCompiler"!');
	    this[kSchemaController].setValidatorCompiler(validatorCompiler);
	    return this
	  }

	  function setSchemaErrorFormatter (errorFormatter) {
	    throwIfAlreadyStarted('Cannot call "setSchemaErrorFormatter"!');
	    validateSchemaErrorFormatter(errorFormatter);
	    this[kSchemaErrorFormatter] = errorFormatter.bind(this);
	    return this
	  }

	  function setSerializerCompiler (serializerCompiler) {
	    throwIfAlreadyStarted('Cannot call "setSerializerCompiler"!');
	    this[kSchemaController].setSerializerCompiler(serializerCompiler);
	    return this
	  }

	  function setSchemaController (schemaControllerOpts) {
	    throwIfAlreadyStarted('Cannot call "setSchemaController"!');
	    const old = this[kSchemaController];
	    const schemaController = SchemaController.buildSchemaController(old, Object.assign({}, old.opts, schemaControllerOpts));
	    this[kSchemaController] = schemaController;
	    this.getSchema = schemaController.getSchema.bind(schemaController);
	    this.getSchemas = schemaController.getSchemas.bind(schemaController);
	    return this
	  }

	  function setReplySerializer (replySerializer) {
	    throwIfAlreadyStarted('Cannot call "setReplySerializer"!');

	    this[kReplySerializerDefault] = replySerializer;
	    return this
	  }

	  // wrapper that we expose to the user for configure the custom error handler
	  function setErrorHandler (func) {
	    throwIfAlreadyStarted('Cannot call "setErrorHandler"!');

	    if (typeof func !== 'function') {
	      throw new FST_ERR_ERROR_HANDLER_NOT_FN()
	    }

	    this[kErrorHandler] = buildErrorHandler(this[kErrorHandler], func.bind(this));
	    return this
	  }

	  function setChildLoggerFactory (factory) {
	    throwIfAlreadyStarted('Cannot call "setChildLoggerFactory"!');

	    this[kChildLoggerFactory] = factory;
	    return this
	  }

	  function printRoutes (opts = {}) {
	    // includeHooks:true - shortcut to include all supported hooks exported by fastify.Hooks
	    opts.includeMeta = opts.includeHooks ? opts.includeMeta ? supportedHooks.concat(opts.includeMeta) : supportedHooks : opts.includeMeta;
	    return router.printRoutes(opts)
	  }

	  function wrapRouting (router, { rewriteUrl, logger }) {
	    let isAsync;
	    return function preRouting (req, res) {
	      // only call isAsyncConstraint once
	      if (isAsync === undefined) isAsync = router.isAsyncConstraint();
	      if (rewriteUrl) {
	        req.originalUrl = req.url;
	        const url = rewriteUrl.call(fastify, req);
	        if (typeof url === 'string') {
	          req.url = url;
	        } else {
	          const err = new FST_ERR_ROUTE_REWRITE_NOT_STR(req.url, typeof url);
	          req.destroy(err);
	        }
	      }
	      router.routing(req, res, buildAsyncConstraintCallback(isAsync, req, res));
	    }
	  }

	  function setGenReqId (func) {
	    throwIfAlreadyStarted('Cannot call "setGenReqId"!');

	    this[kGenReqId] = reqIdGenFactory(this[kOptions].requestIdHeader, func);
	    return this
	  }

	  function addHttpMethod (method, { hasBody = false } = {}) {
	    if (typeof method !== 'string' || http.METHODS.indexOf(method) === -1) {
	      throw new FST_ERR_ROUTE_METHOD_INVALID()
	    }

	    if (hasBody === true) {
	      this[kSupportedHTTPMethods].bodywith.add(method);
	      this[kSupportedHTTPMethods].bodyless.delete(method);
	    } else {
	      this[kSupportedHTTPMethods].bodywith.delete(method);
	      this[kSupportedHTTPMethods].bodyless.add(method);
	    }

	    const _method = method.toLowerCase();
	    if (!this.hasDecorator(_method)) {
	      this.decorate(_method, function (url, options, handler) {
	        return router.prepareRoute.call(this, { method, url, options, handler })
	      });
	    }

	    return this
	  }
	}

	function validateSchemaErrorFormatter (schemaErrorFormatter) {
	  if (typeof schemaErrorFormatter !== 'function') {
	    throw new FST_ERR_SCHEMA_ERROR_FORMATTER_NOT_FN(typeof schemaErrorFormatter)
	  } else if (schemaErrorFormatter.constructor.name === 'AsyncFunction') {
	    throw new FST_ERR_SCHEMA_ERROR_FORMATTER_NOT_FN('AsyncFunction')
	  }
	}

	/**
	 * These export configurations enable JS and TS developers
	 * to consume fastify in whatever way best suits their needs.
	 * Some examples of supported import syntax includes:
	 * - `const fastify = require('fastify')`
	 * - `const { fastify } = require('fastify')`
	 * - `import * as Fastify from 'fastify'`
	 * - `import { fastify, TSC_definition } from 'fastify'`
	 * - `import fastify from 'fastify'`
	 * - `import fastify, { TSC_definition } from 'fastify'`
	 */
	fastify$1.exports = fastify;
	fastify$1.exports.errorCodes = errorCodes;
	fastify$1.exports.fastify = fastify;
	fastify$1.exports.default = fastify;
	return fastify$1.exports;
}

var fastifyExports = /*@__PURE__*/ requireFastify();
const Fastify = /*@__PURE__*/getDefaultExportFromCjs(fastifyExports);

var main$1 = {exports: {}};

var version$1 = "17.2.2";
const require$$4 = {
	version: version$1};

var hasRequiredMain$1;

function requireMain$1 () {
	if (hasRequiredMain$1) return main$1.exports;
	hasRequiredMain$1 = 1;
	const fs = require$$0$c;
	const path = require$$1$5;
	const os = require$$2$3;
	const crypto = require$$1$6;
	const packageJson = require$$4;

	const version = packageJson.version;

	// Array of tips to display randomly
	const TIPS = [
	  '🔐 encrypt with Dotenvx: https://dotenvx.com',
	  '🔐 prevent committing .env to code: https://dotenvx.com/precommit',
	  '🔐 prevent building .env in docker: https://dotenvx.com/prebuild',
	  '📡 observe env with Radar: https://dotenvx.com/radar',
	  '📡 auto-backup env with Radar: https://dotenvx.com/radar',
	  '📡 version env with Radar: https://dotenvx.com/radar',
	  '🛠️  run anywhere with `dotenvx run -- yourcommand`',
	  '⚙️  specify custom .env file path with { path: \'/custom/path/.env\' }',
	  '⚙️  enable debug logging with { debug: true }',
	  '⚙️  override existing env vars with { override: true }',
	  '⚙️  suppress all logs with { quiet: true }',
	  '⚙️  write to custom object with { processEnv: myObject }',
	  '⚙️  load multiple .env files with { path: [\'.env.local\', \'.env\'] }'
	];

	// Get a random tip from the tips array
	function _getRandomTip () {
	  return TIPS[Math.floor(Math.random() * TIPS.length)]
	}

	function parseBoolean (value) {
	  if (typeof value === 'string') {
	    return !['false', '0', 'no', 'off', ''].includes(value.toLowerCase())
	  }
	  return Boolean(value)
	}

	function supportsAnsi () {
	  return process.stdout.isTTY // && process.env.TERM !== 'dumb'
	}

	function dim (text) {
	  return supportsAnsi() ? `\x1b[2m${text}\x1b[0m` : text
	}

	const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;

	// Parse src into an Object
	function parse (src) {
	  const obj = {};

	  // Convert buffer to string
	  let lines = src.toString();

	  // Convert line breaks to same format
	  lines = lines.replace(/\r\n?/mg, '\n');

	  let match;
	  while ((match = LINE.exec(lines)) != null) {
	    const key = match[1];

	    // Default undefined or null to empty string
	    let value = (match[2] || '');

	    // Remove whitespace
	    value = value.trim();

	    // Check if double quoted
	    const maybeQuote = value[0];

	    // Remove surrounding quotes
	    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2');

	    // Expand newlines if double quoted
	    if (maybeQuote === '"') {
	      value = value.replace(/\\n/g, '\n');
	      value = value.replace(/\\r/g, '\r');
	    }

	    // Add to object
	    obj[key] = value;
	  }

	  return obj
	}

	function _parseVault (options) {
	  options = options || {};

	  const vaultPath = _vaultPath(options);
	  options.path = vaultPath; // parse .env.vault
	  const result = DotenvModule.configDotenv(options);
	  if (!result.parsed) {
	    const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
	    err.code = 'MISSING_DATA';
	    throw err
	  }

	  // handle scenario for comma separated keys - for use with key rotation
	  // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
	  const keys = _dotenvKey(options).split(',');
	  const length = keys.length;

	  let decrypted;
	  for (let i = 0; i < length; i++) {
	    try {
	      // Get full key
	      const key = keys[i].trim();

	      // Get instructions for decrypt
	      const attrs = _instructions(result, key);

	      // Decrypt
	      decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);

	      break
	    } catch (error) {
	      // last key
	      if (i + 1 >= length) {
	        throw error
	      }
	      // try next key
	    }
	  }

	  // Parse decrypted .env string
	  return DotenvModule.parse(decrypted)
	}

	function _warn (message) {
	  console.error(`[dotenv@${version}][WARN] ${message}`);
	}

	function _debug (message) {
	  console.log(`[dotenv@${version}][DEBUG] ${message}`);
	}

	function _log (message) {
	  console.log(`[dotenv@${version}] ${message}`);
	}

	function _dotenvKey (options) {
	  // prioritize developer directly setting options.DOTENV_KEY
	  if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
	    return options.DOTENV_KEY
	  }

	  // secondary infra already contains a DOTENV_KEY environment variable
	  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
	    return process.env.DOTENV_KEY
	  }

	  // fallback to empty string
	  return ''
	}

	function _instructions (result, dotenvKey) {
	  // Parse DOTENV_KEY. Format is a URI
	  let uri;
	  try {
	    uri = new URL(dotenvKey);
	  } catch (error) {
	    if (error.code === 'ERR_INVALID_URL') {
	      const err = new Error('INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development');
	      err.code = 'INVALID_DOTENV_KEY';
	      throw err
	    }

	    throw error
	  }

	  // Get decrypt key
	  const key = uri.password;
	  if (!key) {
	    const err = new Error('INVALID_DOTENV_KEY: Missing key part');
	    err.code = 'INVALID_DOTENV_KEY';
	    throw err
	  }

	  // Get environment
	  const environment = uri.searchParams.get('environment');
	  if (!environment) {
	    const err = new Error('INVALID_DOTENV_KEY: Missing environment part');
	    err.code = 'INVALID_DOTENV_KEY';
	    throw err
	  }

	  // Get ciphertext payload
	  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
	  const ciphertext = result.parsed[environmentKey]; // DOTENV_VAULT_PRODUCTION
	  if (!ciphertext) {
	    const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
	    err.code = 'NOT_FOUND_DOTENV_ENVIRONMENT';
	    throw err
	  }

	  return { ciphertext, key }
	}

	function _vaultPath (options) {
	  let possibleVaultPath = null;

	  if (options && options.path && options.path.length > 0) {
	    if (Array.isArray(options.path)) {
	      for (const filepath of options.path) {
	        if (fs.existsSync(filepath)) {
	          possibleVaultPath = filepath.endsWith('.vault') ? filepath : `${filepath}.vault`;
	        }
	      }
	    } else {
	      possibleVaultPath = options.path.endsWith('.vault') ? options.path : `${options.path}.vault`;
	    }
	  } else {
	    possibleVaultPath = path.resolve(process.cwd(), '.env.vault');
	  }

	  if (fs.existsSync(possibleVaultPath)) {
	    return possibleVaultPath
	  }

	  return null
	}

	function _resolveHome (envPath) {
	  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
	}

	function _configVault (options) {
	  const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || (options && options.debug));
	  const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || (options && options.quiet));

	  if (debug || !quiet) {
	    _log('Loading env from encrypted .env.vault');
	  }

	  const parsed = DotenvModule._parseVault(options);

	  let processEnv = process.env;
	  if (options && options.processEnv != null) {
	    processEnv = options.processEnv;
	  }

	  DotenvModule.populate(processEnv, parsed, options);

	  return { parsed }
	}

	function configDotenv (options) {
	  const dotenvPath = path.resolve(process.cwd(), '.env');
	  let encoding = 'utf8';
	  let processEnv = process.env;
	  if (options && options.processEnv != null) {
	    processEnv = options.processEnv;
	  }
	  let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || (options && options.debug));
	  let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || (options && options.quiet));

	  if (options && options.encoding) {
	    encoding = options.encoding;
	  } else {
	    if (debug) {
	      _debug('No encoding is specified. UTF-8 is used by default');
	    }
	  }

	  let optionPaths = [dotenvPath]; // default, look for .env
	  if (options && options.path) {
	    if (!Array.isArray(options.path)) {
	      optionPaths = [_resolveHome(options.path)];
	    } else {
	      optionPaths = []; // reset default
	      for (const filepath of options.path) {
	        optionPaths.push(_resolveHome(filepath));
	      }
	    }
	  }

	  // Build the parsed data in a temporary object (because we need to return it).  Once we have the final
	  // parsed data, we will combine it with process.env (or options.processEnv if provided).
	  let lastError;
	  const parsedAll = {};
	  for (const path of optionPaths) {
	    try {
	      // Specifying an encoding returns a string instead of a buffer
	      const parsed = DotenvModule.parse(fs.readFileSync(path, { encoding }));

	      DotenvModule.populate(parsedAll, parsed, options);
	    } catch (e) {
	      if (debug) {
	        _debug(`Failed to load ${path} ${e.message}`);
	      }
	      lastError = e;
	    }
	  }

	  const populated = DotenvModule.populate(processEnv, parsedAll, options);

	  // handle user settings DOTENV_CONFIG_ options inside .env file(s)
	  debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
	  quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);

	  if (debug || !quiet) {
	    const keysCount = Object.keys(populated).length;
	    const shortPaths = [];
	    for (const filePath of optionPaths) {
	      try {
	        const relative = path.relative(process.cwd(), filePath);
	        shortPaths.push(relative);
	      } catch (e) {
	        if (debug) {
	          _debug(`Failed to load ${filePath} ${e.message}`);
	        }
	        lastError = e;
	      }
	    }

	    _log(`injecting env (${keysCount}) from ${shortPaths.join(',')} ${dim(`-- tip: ${_getRandomTip()}`)}`);
	  }

	  if (lastError) {
	    return { parsed: parsedAll, error: lastError }
	  } else {
	    return { parsed: parsedAll }
	  }
	}

	// Populates process.env from .env file
	function config (options) {
	  // fallback to original dotenv if DOTENV_KEY is not set
	  if (_dotenvKey(options).length === 0) {
	    return DotenvModule.configDotenv(options)
	  }

	  const vaultPath = _vaultPath(options);

	  // dotenvKey exists but .env.vault file does not exist
	  if (!vaultPath) {
	    _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);

	    return DotenvModule.configDotenv(options)
	  }

	  return DotenvModule._configVault(options)
	}

	function decrypt (encrypted, keyStr) {
	  const key = Buffer.from(keyStr.slice(-64), 'hex');
	  let ciphertext = Buffer.from(encrypted, 'base64');

	  const nonce = ciphertext.subarray(0, 12);
	  const authTag = ciphertext.subarray(-16);
	  ciphertext = ciphertext.subarray(12, -16);

	  try {
	    const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce);
	    aesgcm.setAuthTag(authTag);
	    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`
	  } catch (error) {
	    const isRange = error instanceof RangeError;
	    const invalidKeyLength = error.message === 'Invalid key length';
	    const decryptionFailed = error.message === 'Unsupported state or unable to authenticate data';

	    if (isRange || invalidKeyLength) {
	      const err = new Error('INVALID_DOTENV_KEY: It must be 64 characters long (or more)');
	      err.code = 'INVALID_DOTENV_KEY';
	      throw err
	    } else if (decryptionFailed) {
	      const err = new Error('DECRYPTION_FAILED: Please check your DOTENV_KEY');
	      err.code = 'DECRYPTION_FAILED';
	      throw err
	    } else {
	      throw error
	    }
	  }
	}

	// Populate process.env with parsed values
	function populate (processEnv, parsed, options = {}) {
	  const debug = Boolean(options && options.debug);
	  const override = Boolean(options && options.override);
	  const populated = {};

	  if (typeof parsed !== 'object') {
	    const err = new Error('OBJECT_REQUIRED: Please check the processEnv argument being passed to populate');
	    err.code = 'OBJECT_REQUIRED';
	    throw err
	  }

	  // Set process.env
	  for (const key of Object.keys(parsed)) {
	    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
	      if (override === true) {
	        processEnv[key] = parsed[key];
	        populated[key] = parsed[key];
	      }

	      if (debug) {
	        if (override === true) {
	          _debug(`"${key}" is already defined and WAS overwritten`);
	        } else {
	          _debug(`"${key}" is already defined and was NOT overwritten`);
	        }
	      }
	    } else {
	      processEnv[key] = parsed[key];
	      populated[key] = parsed[key];
	    }
	  }

	  return populated
	}

	const DotenvModule = {
	  configDotenv,
	  _configVault,
	  _parseVault,
	  config,
	  decrypt,
	  parse,
	  populate
	};

	main$1.exports.configDotenv = DotenvModule.configDotenv;
	main$1.exports._configVault = DotenvModule._configVault;
	main$1.exports._parseVault = DotenvModule._parseVault;
	main$1.exports.config = DotenvModule.config;
	main$1.exports.decrypt = DotenvModule.decrypt;
	main$1.exports.parse = DotenvModule.parse;
	main$1.exports.populate = DotenvModule.populate;

	main$1.exports = DotenvModule;
	return main$1.exports;
}

var mainExports$1 = /*@__PURE__*/ requireMain$1();
const dotenv = /*@__PURE__*/getDefaultExportFromCjs(mainExports$1);

var cors$1 = {exports: {}};

var vary = {};

var hasRequiredVary;

function requireVary () {
	if (hasRequiredVary) return vary;
	hasRequiredVary = 1;

	const { FifoMap: FifoCache } = require$$1$2;

	/**
	 * Field Value Components
	 * Most HTTP header field values are defined using common syntax
	 * components (token, quoted-string, and comment) separated by
	 * whitespace or specific delimiting characters.  Delimiters are chosen
	 * from the set of US-ASCII visual characters not allowed in a token
	 * (DQUOTE and "(),/:;<=>?@[\]{}").
	 *
	 * field-name    = token
	 * token         = 1*tchar
	 * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
	 *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
	 *               / DIGIT / ALPHA
	 *               ; any VCHAR, except delimiters
	 *
	 * @see https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.6
	 */

	const validFieldnameRE = /^[!#$%&'*+\-.^\w`|~]+$/u;
	function validateFieldname (fieldname) {
	  if (validFieldnameRE.test(fieldname) === false) {
	    throw new TypeError('Fieldname contains invalid characters.')
	  }
	}

	function parse (header) {
	  header = header.trim().toLowerCase();
	  const result = [];

	  if (header.length === 0) ; else if (header.indexOf(',') === -1) {
	    result.push(header);
	  } else {
	    const il = header.length;
	    let i = 0;
	    let pos = 0;
	    let char;

	    // tokenize the header
	    for (i; i < il; ++i) {
	      char = header[i];
	      // when we have whitespace set the pos to the next position
	      if (char === ' ') {
	        pos = i + 1;
	      // `,` is the separator of vary-values
	      } else if (char === ',') {
	        // if pos and current position are not the same we have a valid token
	        if (pos !== i) {
	          result.push(header.slice(pos, i));
	        }
	        // reset the positions
	        pos = i + 1;
	      }
	    }

	    if (pos !== i) {
	      result.push(header.slice(pos, i));
	    }
	  }

	  return result
	}

	function createAddFieldnameToVary (fieldname) {
	  const headerCache = new FifoCache(1000);

	  validateFieldname(fieldname);

	  return function (reply) {
	    let header = reply.getHeader('Vary');

	    if (!header) {
	      reply.header('Vary', fieldname);
	      return
	    }

	    if (header === '*') {
	      return
	    }

	    if (fieldname === '*') {
	      reply.header('Vary', '*');
	      return
	    }

	    if (Array.isArray(header)) {
	      header = header.join(', ');
	    }

	    if (headerCache.get(header) === undefined) {
	      const vals = parse(header);

	      if (vals.indexOf('*') !== -1) {
	        headerCache.set(header, '*');
	      } else if (vals.indexOf(fieldname.toLowerCase()) === -1) {
	        headerCache.set(header, header + ', ' + fieldname);
	      } else {
	        headerCache.set(header, null);
	      }
	    }
	    const cached = headerCache.get(header);
	    if (cached !== null) {
	      reply.header('Vary', cached);
	    }
	  }
	}

	vary.createAddFieldnameToVary = createAddFieldnameToVary;
	vary.addOriginToVaryHeader = createAddFieldnameToVary('Origin');
	vary.addAccessControlRequestHeadersToVaryHeader = createAddFieldnameToVary('Access-Control-Request-Headers');
	vary.parse = parse;
	return vary;
}

var hasRequiredCors;

function requireCors () {
	if (hasRequiredCors) return cors$1.exports;
	hasRequiredCors = 1;

	const fp = require$$0$d;
	const {
	  addAccessControlRequestHeadersToVaryHeader,
	  addOriginToVaryHeader
	} = /*@__PURE__*/ requireVary();

	const defaultOptions = {
	  origin: '*',
	  methods: 'GET,HEAD,POST',
	  hook: 'onRequest',
	  preflightContinue: false,
	  optionsSuccessStatus: 204,
	  credentials: false,
	  exposedHeaders: null,
	  allowedHeaders: null,
	  maxAge: null,
	  preflight: true,
	  strictPreflight: true
	};

	const validHooks = [
	  'onRequest',
	  'preParsing',
	  'preValidation',
	  'preHandler',
	  'preSerialization',
	  'onSend'
	];

	const hookWithPayload = [
	  'preSerialization',
	  'preParsing',
	  'onSend'
	];

	function validateHook (value, next) {
	  if (validHooks.indexOf(value) !== -1) {
	    return
	  }
	  next(new TypeError('@fastify/cors: Invalid hook option provided.'));
	}

	function fastifyCors (fastify, opts, next) {
	  fastify.decorateRequest('corsPreflightEnabled', false);

	  let hideOptionsRoute = true;
	  let logLevel;

	  if (typeof opts === 'function') {
	    handleCorsOptionsDelegator(opts, fastify, { hook: defaultOptions.hook }, next);
	  } else if (opts.delegator) {
	    const { delegator, ...options } = opts;
	    handleCorsOptionsDelegator(delegator, fastify, options, next);
	  } else {
	    const corsOptions = normalizeCorsOptions(opts);
	    validateHook(corsOptions.hook, next);
	    if (hookWithPayload.indexOf(corsOptions.hook) !== -1) {
	      fastify.addHook(corsOptions.hook, function handleCors (req, reply, _payload, next) {
	        addCorsHeadersHandler(fastify, corsOptions, req, reply, next);
	      });
	    } else {
	      fastify.addHook(corsOptions.hook, function handleCors (req, reply, next) {
	        addCorsHeadersHandler(fastify, corsOptions, req, reply, next);
	      });
	    }
	  }
	  if (opts.logLevel !== undefined) logLevel = opts.logLevel;
	  if (opts.hideOptionsRoute !== undefined) hideOptionsRoute = opts.hideOptionsRoute;

	  // The preflight reply must occur in the hook. This allows fastify-cors to reply to
	  // preflight requests BEFORE possible authentication plugins. If the preflight reply
	  // occurred in this handler, other plugins may deny the request since the browser will
	  // remove most headers (such as the Authentication header).
	  //
	  // This route simply enables fastify to accept preflight requests.

	  fastify.options('*', { schema: { hide: hideOptionsRoute }, logLevel }, (req, reply) => {
	    if (!req.corsPreflightEnabled) {
	      // Do not handle preflight requests if the origin option disabled CORS
	      reply.callNotFound();
	      return
	    }

	    reply.send();
	  });

	  next();
	}

	function handleCorsOptionsDelegator (optionsResolver, fastify, opts, next) {
	  const hook = opts?.hook || defaultOptions.hook;
	  validateHook(hook, next);
	  if (optionsResolver.length === 2) {
	    if (hookWithPayload.indexOf(hook) !== -1) {
	      fastify.addHook(hook, function handleCors (req, reply, _payload, next) {
	        handleCorsOptionsCallbackDelegator(optionsResolver, fastify, req, reply, next);
	      });
	    } else {
	      fastify.addHook(hook, function handleCors (req, reply, next) {
	        handleCorsOptionsCallbackDelegator(optionsResolver, fastify, req, reply, next);
	      });
	    }
	  } else {
	    if (hookWithPayload.indexOf(hook) !== -1) {
	      // handle delegator based on Promise
	      fastify.addHook(hook, function handleCors (req, reply, _payload, next) {
	        const ret = optionsResolver(req);
	        if (ret && typeof ret.then === 'function') {
	          ret.then(options => addCorsHeadersHandler(fastify, normalizeCorsOptions(options, true), req, reply, next)).catch(next);
	          return
	        }
	        next(new Error('Invalid CORS origin option'));
	      });
	    } else {
	      // handle delegator based on Promise
	      fastify.addHook(hook, function handleCors (req, reply, next) {
	        const ret = optionsResolver(req);
	        if (ret && typeof ret.then === 'function') {
	          ret.then(options => addCorsHeadersHandler(fastify, normalizeCorsOptions(options, true), req, reply, next)).catch(next);
	          return
	        }
	        next(new Error('Invalid CORS origin option'));
	      });
	    }
	  }
	}

	function handleCorsOptionsCallbackDelegator (optionsResolver, fastify, req, reply, next) {
	  optionsResolver(req, (err, options) => {
	    if (err) {
	      next(err);
	    } else {
	      addCorsHeadersHandler(fastify, normalizeCorsOptions(options, true), req, reply, next);
	    }
	  });
	}

	/**
	 * @param {import('./types').FastifyCorsOptions} opts
	 */
	function normalizeCorsOptions (opts, dynamic) {
	  const corsOptions = { ...defaultOptions, ...opts };
	  if (Array.isArray(opts.origin) && opts.origin.indexOf('*') !== -1) {
	    corsOptions.origin = '*';
	  }
	  if (Number.isInteger(corsOptions.cacheControl)) {
	    // integer numbers are formatted this way
	    corsOptions.cacheControl = `max-age=${corsOptions.cacheControl}`;
	  } else if (typeof corsOptions.cacheControl !== 'string') {
	    // strings are applied directly and any other value is ignored
	    corsOptions.cacheControl = null;
	  }
	  corsOptions.dynamic = dynamic || false;
	  return corsOptions
	}

	function addCorsHeadersHandler (fastify, options, req, reply, next) {
	  if ((typeof options.origin !== 'string' && options.origin !== false) || options.dynamic) {
	    // Always set Vary header for non-static origin option
	    // https://fetch.spec.whatwg.org/#cors-protocol-and-http-caches
	    addOriginToVaryHeader(reply);
	  }

	  const resolveOriginOption = typeof options.origin === 'function' ? resolveOriginWrapper(fastify, options.origin) : (_, cb) => cb(null, options.origin);

	  resolveOriginOption(req, (error, resolvedOriginOption) => {
	    if (error !== null) {
	      return next(error)
	    }

	    // Disable CORS and preflight if false
	    if (resolvedOriginOption === false) {
	      return next()
	    }

	    // Allow routes to disable CORS individually
	    if (req.routeOptions.config?.cors === false) {
	      return next()
	    }

	    // Falsy values are invalid
	    if (!resolvedOriginOption) {
	      return next(new Error('Invalid CORS origin option'))
	    }

	    addCorsHeaders(req, reply, resolvedOriginOption, options);

	    if (req.raw.method === 'OPTIONS' && options.preflight === true) {
	      // Strict mode enforces the required headers for preflight
	      if (options.strictPreflight === true && (!req.headers.origin || !req.headers['access-control-request-method'])) {
	        reply.status(400).type('text/plain').send('Invalid Preflight Request');
	        return
	      }

	      req.corsPreflightEnabled = true;

	      addPreflightHeaders(req, reply, options);

	      if (!options.preflightContinue) {
	        // Do not call the hook callback and terminate the request
	        // Safari (and potentially other browsers) need content-length 0,
	        // for 204 or they just hang waiting for a body
	        reply
	          .code(options.optionsSuccessStatus)
	          .header('Content-Length', '0')
	          .send();
	        return
	      }
	    }

	    return next()
	  });
	}

	function addCorsHeaders (req, reply, originOption, corsOptions) {
	  const origin = getAccessControlAllowOriginHeader(req.headers.origin, originOption);
	  // In the case of origin not allowed the header is not
	  // written in the response.
	  // https://github.com/fastify/fastify-cors/issues/127
	  if (origin) {
	    reply.header('Access-Control-Allow-Origin', origin);
	  }

	  if (corsOptions.credentials) {
	    reply.header('Access-Control-Allow-Credentials', 'true');
	  }

	  if (corsOptions.exposedHeaders !== null) {
	    reply.header(
	      'Access-Control-Expose-Headers',
	      Array.isArray(corsOptions.exposedHeaders) ? corsOptions.exposedHeaders.join(', ') : corsOptions.exposedHeaders
	    );
	  }
	}

	function addPreflightHeaders (req, reply, corsOptions) {
	  reply.header(
	    'Access-Control-Allow-Methods',
	    Array.isArray(corsOptions.methods) ? corsOptions.methods.join(', ') : corsOptions.methods
	  );

	  if (corsOptions.allowedHeaders === null) {
	    addAccessControlRequestHeadersToVaryHeader(reply);
	    const reqAllowedHeaders = req.headers['access-control-request-headers'];
	    if (reqAllowedHeaders !== undefined) {
	      reply.header('Access-Control-Allow-Headers', reqAllowedHeaders);
	    }
	  } else {
	    reply.header(
	      'Access-Control-Allow-Headers',
	      Array.isArray(corsOptions.allowedHeaders) ? corsOptions.allowedHeaders.join(', ') : corsOptions.allowedHeaders
	    );
	  }

	  if (corsOptions.maxAge !== null) {
	    reply.header('Access-Control-Max-Age', String(corsOptions.maxAge));
	  }

	  if (corsOptions.cacheControl) {
	    reply.header('Cache-Control', corsOptions.cacheControl);
	  }
	}

	function resolveOriginWrapper (fastify, origin) {
	  return function (req, cb) {
	    const result = origin.call(fastify, req.headers.origin, cb);

	    // Allow for promises
	    if (result && typeof result.then === 'function') {
	      result.then(res => cb(null, res), cb);
	    }
	  }
	}

	function getAccessControlAllowOriginHeader (reqOrigin, originOption) {
	  if (typeof originOption === 'string') {
	    // fixed or any origin ('*')
	    return originOption
	  }

	  // reflect origin
	  return isRequestOriginAllowed(reqOrigin, originOption) ? reqOrigin : false
	}

	function isRequestOriginAllowed (reqOrigin, allowedOrigin) {
	  if (Array.isArray(allowedOrigin)) {
	    for (let i = 0; i < allowedOrigin.length; ++i) {
	      if (isRequestOriginAllowed(reqOrigin, allowedOrigin[i])) {
	        return true
	      }
	    }
	    return false
	  } else if (typeof allowedOrigin === 'string') {
	    return reqOrigin === allowedOrigin
	  } else if (allowedOrigin instanceof RegExp) {
	    allowedOrigin.lastIndex = 0;
	    return allowedOrigin.test(reqOrigin)
	  } else {
	    return !!allowedOrigin
	  }
	}

	const _fastifyCors = fp(fastifyCors, {
	  fastify: '5.x',
	  name: '@fastify/cors'
	});

	/**
	 * These export configurations enable JS and TS developers
	 * to consumer fastify in whatever way best suits their needs.
	 */
	cors$1.exports = _fastifyCors;
	cors$1.exports.fastifyCors = _fastifyCors;
	cors$1.exports.default = _fastifyCors;
	return cors$1.exports;
}

var corsExports = /*@__PURE__*/ requireCors();
const cors = /*@__PURE__*/getDefaultExportFromCjs(corsExports);

var multipart$1 = {exports: {}};

var generateId = {};

var hasRequiredGenerateId;

function requireGenerateId () {
	if (hasRequiredGenerateId) return generateId;
	hasRequiredGenerateId = 1;

	const HEX = [
	  '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0a', '0b', '0c', '0d', '0e', '0f',
	  '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '1a', '1b', '1c', '1d', '1e', '1f',
	  '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '2a', '2b', '2c', '2d', '2e', '2f',
	  '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '3a', '3b', '3c', '3d', '3e', '3f',
	  '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '4a', '4b', '4c', '4d', '4e', '4f',
	  '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '5a', '5b', '5c', '5d', '5e', '5f',
	  '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '6a', '6b', '6c', '6d', '6e', '6f',
	  '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '7a', '7b', '7c', '7d', '7e', '7f',
	  '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '8a', '8b', '8c', '8d', '8e', '8f',
	  '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '9a', '9b', '9c', '9d', '9e', '9f',
	  'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'aa', 'ab', 'ac', 'ad', 'ae', 'af',
	  'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'ba', 'bb', 'bc', 'bd', 'be', 'bf',
	  'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'ca', 'cb', 'cc', 'cd', 'ce', 'cf',
	  'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'da', 'db', 'dc', 'dd', 'de', 'df',
	  'e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'ea', 'eb', 'ec', 'ed', 'ee', 'ef',
	  'f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'fa', 'fb', 'fc', 'fd', 'fe', 'ff'
	];

	const random = Math.random;

	function seed () {
	  return (
	    HEX[0xff * random() | 0] +
	    HEX[0xff * random() | 0] +
	    HEX[0xff * random() | 0] +
	    HEX[0xff * random() | 0] +
	    HEX[0xff * random() | 0] +
	    HEX[0xff * random() | 0] +
	    HEX[0xff * random() | 0]
	  )
	}

	generateId.generateId = (function generateIdFn () {
	  let num = 0;
	  let str = seed();
	  return function generateId () {
	    return (num === 255) // eslint-disable-line no-return-assign
	      ? (str = seed()) + HEX[num = 0]
	      : str + HEX[++num]
	  }
	})();
	return generateId;
}

var streamConsumer;
var hasRequiredStreamConsumer;

function requireStreamConsumer () {
	if (hasRequiredStreamConsumer) return streamConsumer;
	hasRequiredStreamConsumer = 1;

	streamConsumer = function streamToNull (stream) {
	  return new Promise((resolve, reject) => {
	    stream.on('data', () => {
	      /* The stream needs a data reader or else it will never end. */
	    });
	    stream.on('close', () => {
	      resolve();
	    });
	    stream.on('end', () => {
	      resolve();
	    });
	    stream.on('error', (error) => {
	      reject(error);
	    });
	  })
	};
	return streamConsumer;
}

var hasRequiredMultipart;

function requireMultipart () {
	if (hasRequiredMultipart) return multipart$1.exports;
	hasRequiredMultipart = 1;

	const Busboy = require$$0$e;
	const os = require$$3;
	const fp = require$$0$d;
	const { createWriteStream } = require$$3$1;
	const { unlink } = require$$4$1;
	const path = require$$5__default;
	const { generateId } = /*@__PURE__*/ requireGenerateId();
	const createError = require$$0$1;
	const streamToNull = /*@__PURE__*/ requireStreamConsumer();
	const deepmergeAll = require$$9({ all: true });
	const { PassThrough, Readable } = require$$0$6;
	const { pipeline: pump } = require$$11;
	const secureJSON = require$$2$1;

	const kMultipart = Symbol('multipart');
	const kMultipartHandler = Symbol('multipartHandler');

	const PartsLimitError = createError('FST_PARTS_LIMIT', 'reach parts limit', 413);
	const FilesLimitError = createError('FST_FILES_LIMIT', 'reach files limit', 413);
	const FieldsLimitError = createError('FST_FIELDS_LIMIT', 'reach fields limit', 413);
	const RequestFileTooLargeError = createError('FST_REQ_FILE_TOO_LARGE', 'request file too large', 413);
	const PrototypeViolationError = createError('FST_PROTO_VIOLATION', 'prototype property is not allowed as field name', 400);
	const InvalidMultipartContentTypeError = createError('FST_INVALID_MULTIPART_CONTENT_TYPE', 'the request is not multipart', 406);
	const InvalidJSONFieldError = createError('FST_INVALID_JSON_FIELD_ERROR', 'a request field is not a valid JSON as declared by its Content-Type', 406);
	const FileBufferNotFoundError = createError('FST_FILE_BUFFER_NOT_FOUND', 'the file buffer was not found', 500);
	const NoFormData = createError('FST_NO_FORM_DATA', 'FormData is not available', 500);

	function setMultipart (req, _payload, done) {
	  req[kMultipart] = true;
	  done();
	}

	function busboy (options) {
	  try {
	    return new Busboy(options)
	  } catch (error) {
	    const errorEmitter = new PassThrough();
	    process.nextTick(function () {
	      errorEmitter.emit('error', error);
	    });
	    return errorEmitter
	  }
	}

	function fastifyMultipart (fastify, options, done) {
	  options.limits = {
	    ...options.limits,
	    parts: options.limits?.parts || 1000,
	    fileSize: options.limits?.fileSize || fastify.initialConfig.bodyLimit
	  };

	  const attachFieldsToBody = options.attachFieldsToBody;

	  if (attachFieldsToBody === true || attachFieldsToBody === 'keyValues') {
	    if (typeof options.sharedSchemaId === 'string' && attachFieldsToBody === true) {
	      fastify.addSchema({
	        $id: options.sharedSchemaId,
	        type: 'object',
	        properties: {
	          fieldname: { type: 'string' },
	          encoding: { type: 'string' },
	          filename: { type: 'string' },
	          mimetype: { type: 'string' }
	        }
	      });
	    }

	    fastify.addHook('preValidation', async function (req) {
	      if (!req.isMultipart()) {
	        return
	      }

	      for await (const part of req.parts()) {
	        req.body = part.fields;

	        if (part.file) {
	          if (options.onFile) {
	            await options.onFile.call(req, part);
	          } else {
	            await part.toBuffer();
	          }
	        }
	      }

	      if (attachFieldsToBody === 'keyValues') {
	        const body = {};

	        if (req.body) {
	          const reqBodyKeys = Object.keys(req.body);

	          for (let i = 0; i < reqBodyKeys.length; ++i) {
	            const key = reqBodyKeys[i];
	            const field = req.body[key];

	            /* Don't modify the body if a field doesn't have a value or an attached buffer */
	            if (field.value !== undefined) {
	              body[key] = field.value;
	            } else if (field._buf) {
	              body[key] = field._buf;
	            } else if (Array.isArray(field)) {
	              const items = [];

	              for (let i = 0; i < field.length; ++i) {
	                const item = field[i];

	                if (item.value !== undefined) {
	                  items.push(item.value);
	                } else if (item._buf) {
	                  items.push(item._buf);
	                }
	              }

	              if (items.length) {
	                body[key] = items;
	              }
	            }
	          }
	        }

	        req.body = body;
	      }
	    });

	    // The following is not available on old Node.js versions
	    // so we must skip it in the test coverage
	    /* istanbul ignore next */
	    if (globalThis.FormData && !fastify.hasRequestDecorator('formData')) {
	      fastify.decorateRequest('formData', async function () {
	        const formData = new FormData();
	        for (const key in this.body) {
	          const value = this.body[key];
	          if (Array.isArray(value)) {
	            for (const item of value) {
	              await append(key, item);
	            }
	          } else {
	            await append(key, value);
	          }
	        }

	        async function append (key, entry) {
	          /* c8 ignore next: Buffer.isBuffer is not covered and causing `npm test` to fail */
	          if (entry.type === 'file' || (attachFieldsToBody === 'keyValues' && Buffer.isBuffer(entry))) {
	            // TODO use File constructor with fs.openAsBlob()
	            // if attachFieldsToBody is not set
	            // https://nodejs.org/api/fs.html#fsopenasblobpath-options
	            formData.append(key, new Blob([await entry.toBuffer()], {
	              type: entry.mimetype
	            }), entry.filename);
	          } else {
	            formData.append(key, entry.value);
	          }
	        }

	        return formData
	      });
	    }
	  }

	  /* istanbul ignore next */
	  if (!fastify.hasRequestDecorator('formData')) {
	    fastify.decorateRequest('formData', async function () {
	      /* c8 ignore next: Next line is not covered and causing `npm test` to fail */
	      throw new NoFormData()
	    });
	  }

	  const defaultThrowFileSizeLimit = typeof options.throwFileSizeLimit === 'boolean'
	    ? options.throwFileSizeLimit
	    : true;

	  fastify.decorate('multipartErrors', {
	    PartsLimitError,
	    FilesLimitError,
	    FieldsLimitError,
	    PrototypeViolationError,
	    InvalidMultipartContentTypeError,
	    RequestFileTooLargeError,
	    FileBufferNotFoundError
	  });

	  fastify.addContentTypeParser('multipart/form-data', setMultipart);
	  fastify.decorateRequest(kMultipart, false);
	  fastify.decorateRequest(kMultipartHandler, handleMultipart);

	  fastify.decorateRequest('parts', getMultipartIterator);

	  fastify.decorateRequest('isMultipart', isMultipart);
	  fastify.decorateRequest('tmpUploads', null);
	  fastify.decorateRequest('savedRequestFiles', null);

	  // Stream mode
	  fastify.decorateRequest('file', getMultipartFile);
	  fastify.decorateRequest('files', getMultipartFiles);

	  // Disk mode
	  fastify.decorateRequest('saveRequestFiles', saveRequestFiles);
	  fastify.decorateRequest('cleanRequestFiles', cleanRequestFiles);

	  fastify.addHook('onResponse', async (request) => {
	    await request.cleanRequestFiles();
	  });

	  function isMultipart () {
	    return this[kMultipart]
	  }

	  function handleMultipart (opts = {}) {
	    if (!this.isMultipart()) {
	      throw new InvalidMultipartContentTypeError()
	    }

	    this.log.debug('starting multipart parsing');

	    let values = [];
	    let pendingHandler = null;

	    // only one file / field can be processed at a time
	    // "null" will close the consumer side
	    const ch = (val) => {
	      if (pendingHandler) {
	        pendingHandler(val);
	        pendingHandler = null;
	      } else {
	        values.push(val);
	      }
	    };

	    const handle = (handler) => {
	      if (values.length > 0) {
	        const value = values[0];
	        values = values.slice(1);
	        handler(value);
	      } else {
	        pendingHandler = handler;
	      }
	    };

	    const parts = () => {
	      return new Promise((resolve, reject) => {
	        handle((val) => {
	          if (val instanceof Error) {
	            if (val.message === 'Unexpected end of multipart data') {
	              // Stop parsing without throwing an error
	              resolve(null);
	            } else {
	              reject(val);
	            }
	          } else {
	            resolve(val);
	          }
	        });
	      })
	    };

	    const body = {};
	    let lastError = null;
	    let currentFile = null;
	    const request = this.raw;
	    const busboyOptions = deepmergeAll(
	      { headers: request.headers },
	      options,
	      opts
	    );

	    this.log.trace({ busboyOptions }, 'Providing options to busboy');
	    const bb = busboy(busboyOptions);

	    request.on('close', cleanup);
	    request.on('error', cleanup);

	    bb
	      .on('field', onField)
	      .on('file', onFile)
	      .on('end', cleanup)
	      .on('finish', cleanup)
	      .on('close', cleanup)
	      .on('error', cleanup);

	    bb.on('partsLimit', function () {
	      const err = new PartsLimitError();
	      onError(err);
	      process.nextTick(() => cleanup(err));
	    });

	    bb.on('filesLimit', function () {
	      const err = new FilesLimitError();
	      onError(err);
	      process.nextTick(() => cleanup(err));
	    });

	    bb.on('fieldsLimit', function () {
	      const err = new FieldsLimitError();
	      onError(err);
	      process.nextTick(() => cleanup(err));
	    });

	    request.pipe(bb);

	    function onField (name, fieldValue, fieldnameTruncated, valueTruncated, encoding, contentType) {
	      // don't overwrite prototypes
	      if (name in Object.prototype) {
	        onError(new PrototypeViolationError());
	        return
	      }

	      // If it is a JSON field, parse it
	      if (contentType.startsWith('application/json')) {
	        // If the value was truncated, it can never be a valid JSON. Don't even try to parse
	        if (valueTruncated) {
	          onError(new InvalidJSONFieldError());
	          return
	        }

	        try {
	          fieldValue = secureJSON.parse(fieldValue);
	          contentType = 'application/json';
	        } catch {
	          onError(new InvalidJSONFieldError());
	          return
	        }
	      }

	      const value = {
	        type: 'field',
	        fieldname: name,
	        mimetype: contentType,
	        encoding,
	        value: fieldValue,
	        fieldnameTruncated,
	        valueTruncated,
	        fields: body
	      };

	      if (body[name] === undefined) {
	        body[name] = value;
	      } else if (Array.isArray(body[name])) {
	        body[name].push(value);
	      } else {
	        body[name] = [body[name], value];
	      }

	      ch(value);
	    }

	    function onFile (name, file, filename, encoding, mimetype) {
	      // don't overwrite prototypes
	      if (name in Object.prototype) {
	        // ensure that stream is consumed, any error is suppressed
	        streamToNull(file).catch(() => {});
	        onError(new PrototypeViolationError());
	        return
	      }

	      const throwFileSizeLimit = typeof opts.throwFileSizeLimit === 'boolean'
	        ? opts.throwFileSizeLimit
	        : defaultThrowFileSizeLimit;

	      const value = {
	        type: 'file',
	        fieldname: name,
	        filename,
	        encoding,
	        mimetype,
	        file,
	        fields: body,
	        _buf: null,
	        async toBuffer () {
	          if (this._buf) {
	            return this._buf
	          }
	          const fileChunks = [];
	          let err;
	          for await (const chunk of this.file) {
	            fileChunks.push(chunk);

	            if (throwFileSizeLimit && this.file.truncated) {
	              err = new RequestFileTooLargeError();
	              err.part = this;

	              onError(err);
	              fileChunks.length = 0;
	            }
	          }
	          if (err) {
	            // throwing in the async iterator will
	            // cause the file.destroy() to be called
	            // The stream has already been managed by
	            // busboy instead
	            throw err
	          }
	          this._buf = Buffer.concat(fileChunks);
	          return this._buf
	        }
	      };

	      if (throwFileSizeLimit) {
	        file.on('limit', function () {
	          const err = new RequestFileTooLargeError();
	          err.part = value;
	          onError(err);
	        });
	      }

	      if (body[name] === undefined) {
	        body[name] = value;
	      } else if (Array.isArray(body[name])) {
	        body[name].push(value);
	      } else {
	        body[name] = [body[name], value];
	      }
	      currentFile = file;
	      ch(value);
	    }

	    function onError (err) {
	      lastError = err;
	      currentFile = null;
	    }

	    function cleanup (err) {
	      request.unpipe(bb);

	      if ((err || request.aborted) && currentFile) {
	        currentFile.destroy();
	        currentFile = null;
	      }

	      ch(err || lastError || null);
	    }

	    return parts
	  }

	  async function saveRequestFiles (options) {
	    // Checks if this has already been run
	    if (this.savedRequestFiles) {
	      return this.savedRequestFiles
	    }
	    let files;
	    if (attachFieldsToBody === true) {
	      // Skip the whole process if the body is empty
	      if (!this.body) {
	        return []
	      }
	      files = filesFromFields.call(this, this.body);
	    } else {
	      files = await this.files(options);
	    }
	    this.savedRequestFiles = [];
	    const tmpdir = options?.tmpdir || os.tmpdir();
	    this.tmpUploads = [];
	    let i = 0;
	    for await (const file of files) {
	      const filepath = path.join(tmpdir, generateId() + path.extname(file.filename || ('file' + i++)));
	      const target = createWriteStream(filepath);
	      try {
	        this.tmpUploads.push(filepath);
	        await pump(file.file, target);
	        this.savedRequestFiles.push({ ...file, filepath });
	      } catch (err) {
	        this.log.error({ err }, 'save request file');
	        throw err
	      }
	    }

	    return this.savedRequestFiles
	  }

	  function * filesFromFields (container) {
	    try {
	      const fields = Array.isArray(container) ? container : Object.values(container);
	      for (let i = 0; i < fields.length; ++i) {
	        const field = fields[i];
	        if (Array.isArray(field)) {
	          for (const subField of filesFromFields.call(this, field)) {
	            yield subField;
	          }
	        }
	        if (!field.file) {
	          continue
	        }
	        if (!field._buf) {
	          throw new FileBufferNotFoundError()
	        }
	        field.file = Readable.from(field._buf);
	        yield field;
	      }
	    } catch (err) {
	      this.log.error({ err }, 'save request file failed');
	      throw err
	    }
	  }

	  async function cleanRequestFiles () {
	    if (!this.tmpUploads) {
	      return
	    }
	    for (let i = 0; i < this.tmpUploads.length; ++i) {
	      const filepath = this.tmpUploads[i];
	      try {
	        await unlink(filepath);
	      } /* c8 ignore start */ catch (error) {
	        this.log.error(error, 'Could not delete file');
	      }
	      /* c8 ignore stop */
	    }
	  }

	  async function getMultipartFile (options) {
	    const parts = this[kMultipartHandler](options);
	    let part;
	    while ((part = await parts()) != null) {
	      /* Only return a part if the file property exists */
	      if (part.file) {
	        return part
	      }
	    }
	  }

	  async function * getMultipartFiles (options) {
	    const parts = this[kMultipartHandler](options);

	    let part;
	    while ((part = await parts()) != null) {
	      if (part.file) {
	        yield part;
	      }
	    }
	  }

	  async function * getMultipartIterator (options) {
	    const parts = this[kMultipartHandler](options);

	    let part;
	    while ((part = await parts()) != null) {
	      yield part;
	    }
	  }

	  done();
	}

	/**
	 * Adds a new type `isFile` to help @fastify/swagger generate the correct schema.
	 */
	function ajvFilePlugin (ajv) {
	  return ajv.addKeyword({
	    keyword: 'isFile',
	    compile: (_schema, parent) => {
	      // Updates the schema to match the file type
	      parent.type = 'string';
	      parent.format = 'binary';
	      delete parent.isFile;

	      return (field /* MultipartFile */) => !!field.file
	    },
	    error: {
	      message: 'should be a file'
	    }
	  })
	}

	/**
	 * These export configurations enable JS and TS developers
	 * to consumer fastify in whatever way best suits their needs.
	 */
	multipart$1.exports = fp(fastifyMultipart, {
	  fastify: '5.x',
	  name: '@fastify/multipart'
	});
	multipart$1.exports.default = fastifyMultipart;
	multipart$1.exports.fastifyMultipart = fastifyMultipart;
	multipart$1.exports.ajvFilePlugin = ajvFilePlugin;
	return multipart$1.exports;
}

var multipartExports = /*@__PURE__*/ requireMultipart();
const multipart = /*@__PURE__*/getDefaultExportFromCjs(multipartExports);

var websocket$1 = {exports: {}};

var hasRequiredWebsocket;

function requireWebsocket () {
	if (hasRequiredWebsocket) return websocket$1.exports;
	hasRequiredWebsocket = 1;

	const { ServerResponse } = require$$0;
	const { PassThrough } = require$$0$6;
	const { randomBytes } = require$$0$f;
	const fp = require$$0$d;
	const WebSocket = require$$4$2;
	const Duplexify = require$$5$1;

	const kWs = Symbol('ws-socket');
	const kWsHead = Symbol('ws-head');
	const statusCodeReg = /HTTP\/1.1 (\d+)/u;

	function fastifyWebsocket (fastify, opts, next) {
	  fastify.decorateRequest('ws', null);

	  let errorHandler = defaultErrorHandler;
	  if (opts.errorHandler) {
	    if (typeof opts.errorHandler !== 'function') {
	      return next(new Error('invalid errorHandler function'))
	    }

	    errorHandler = opts.errorHandler;
	  }

	  let preClose = defaultPreClose;
	  if (opts?.preClose) {
	    if (typeof opts.preClose !== 'function') {
	      return next(new Error('invalid preClose function'))
	    }

	    preClose = opts.preClose;
	  }

	  if (opts.options?.noServer) {
	    return next(new Error("fastify-websocket doesn't support the ws noServer option. If you want to create a websocket server detatched from fastify, use the ws library directly."))
	  }

	  const wssOptions = Object.assign({ noServer: true }, opts.options);

	  if (wssOptions.path) {
	    fastify.log.warn('ws server path option shouldn\'t be provided, use a route instead');
	  }

	  // We always handle upgrading ourselves in this library so that we can dispatch through the fastify stack before actually upgrading
	  // For this reason, we run the WebSocket.Server in noServer mode, and prevent the user from passing in a http.Server instance for it to attach to.
	  // Usually, we listen to the upgrade event of the `fastify.server`, but we do still support this server option by just listening to upgrades on it if passed.
	  const websocketListenServer = wssOptions.server || fastify.server;
	  delete wssOptions.server;

	  const wss = new WebSocket.Server(wssOptions);
	  fastify.decorate('websocketServer', wss);

	  // TODO: place upgrade context as options
	  async function injectWS (path = '/', upgradeContext = {}, options = {}) {
	    const server2Client = new PassThrough();
	    const client2Server = new PassThrough();

	    const serverStream = new Duplexify(server2Client, client2Server);
	    const clientStream = new Duplexify(client2Server, server2Client);

	    const ws = new WebSocket(null, undefined, { isServer: false });
	    const head = Buffer.from([]);

	    let resolve, reject;
	    const promise = new Promise((_resolve, _reject) => { resolve = _resolve; reject = _reject; });

	    typeof options.onInit === 'function' && options.onInit(ws);

	    ws.on('open', () => {
	      typeof options.onOpen === 'function' && options.onOpen(ws);
	      clientStream.removeListener('data', onData);
	      resolve(ws);
	    });

	    const onData = (chunk) => {
	      if (chunk.toString().includes('HTTP/1.1 101 Switching Protocols')) {
	        ws._isServer = false;
	        ws.setSocket(clientStream, head, { maxPayload: 0 });
	      } else {
	        clientStream.removeListener('data', onData);
	        const statusCode = Number(statusCodeReg.exec(chunk.toString())[1]);
	        reject(new Error('Unexpected server response: ' + statusCode));
	      }
	    };

	    clientStream.on('data', onData);

	    const req = {
	      ...upgradeContext,
	      method: 'GET',
	      headers: {
	        ...upgradeContext.headers,
	        connection: 'upgrade',
	        upgrade: 'websocket',
	        'sec-websocket-version': 13,
	        'sec-websocket-key': randomBytes(16).toString('base64')
	      },
	      httpVersion: '1.1',
	      url: path,
	      [kWs]: serverStream,
	      [kWsHead]: head
	    };

	    websocketListenServer.emit('upgrade', req, req[kWs], req[kWsHead]);

	    return promise
	  }

	  fastify.decorate('injectWS', injectWS);

	  function onUpgrade (rawRequest, socket, head) {
	    // Save a reference to the socket and then dispatch the request through the normal fastify router so that it will invoke hooks and then eventually a route handler that might upgrade the socket.
	    rawRequest[kWs] = socket;
	    rawRequest[kWsHead] = head;
	    const rawResponse = new ServerResponse(rawRequest);
	    try {
	      rawResponse.assignSocket(socket);
	      fastify.routing(rawRequest, rawResponse);
	    } catch (err) {
	      fastify.log.warn({ err }, 'websocket upgrade failed');
	    }
	  }
	  websocketListenServer.on('upgrade', onUpgrade);

	  const handleUpgrade = (rawRequest, callback) => {
	    wss.handleUpgrade(rawRequest, rawRequest[kWs], rawRequest[kWsHead], (socket) => {
	      wss.emit('connection', socket, rawRequest);

	      socket.on('error', (error) => {
	        fastify.log.error(error);
	      });

	      callback(socket);
	    });
	  };

	  fastify.addHook('onRequest', (request, _reply, done) => { // this adds req.ws to the Request object
	    if (request.raw[kWs]) {
	      request.ws = true;
	    } else {
	      request.ws = false;
	    }
	    done();
	  });

	  fastify.addHook('onResponse', (request, _reply, done) => {
	    if (request.ws) {
	      request.raw[kWs].destroy();
	    }
	    done();
	  });

	  fastify.addHook('onRoute', routeOptions => {
	    let isWebsocketRoute = false;
	    let wsHandler = routeOptions.wsHandler;
	    let handler = routeOptions.handler;

	    if (routeOptions.websocket || routeOptions.wsHandler) {
	      if (routeOptions.method === 'HEAD') {
	        return
	      } else if (routeOptions.method !== 'GET') {
	        throw new Error('websocket handler can only be declared in GET method')
	      }

	      isWebsocketRoute = true;

	      if (routeOptions.websocket) {
	        if (!routeOptions.schema) {
	          routeOptions.schema = {};
	        }
	        routeOptions.schema.hide = true;

	        wsHandler = routeOptions.handler;
	        handler = function (_, reply) {
	          reply.code(404).send();
	        };
	      }

	      if (typeof wsHandler !== 'function') {
	        throw new TypeError('invalid wsHandler function')
	      }
	    }

	    // we always override the route handler so we can close websocket connections to routes to handlers that don't support websocket connections
	    // This is not an arrow function to fetch the encapsulated this
	    routeOptions.handler = function (request, reply) {
	      // within the route handler, we check if there has been a connection upgrade by looking at request.raw[kWs]. we need to dispatch the normal HTTP handler if not, and hijack to dispatch the websocket handler if so
	      if (request.raw[kWs]) {
	        reply.hijack();
	        handleUpgrade(request.raw, socket => {
	          let result;
	          try {
	            if (isWebsocketRoute) {
	              result = wsHandler.call(this, socket, request);
	            } else {
	              result = noHandle.call(this, socket, request);
	            }
	          } catch (err) {
	            return errorHandler.call(this, err, socket, request, reply)
	          }

	          if (result && typeof result.catch === 'function') {
	            result.catch(err => errorHandler.call(this, err, socket, request, reply));
	          }
	        });
	      } else {
	        return handler.call(this, request, reply)
	      }
	    };
	  });

	  // Fastify is missing a pre-close event, or the ability to
	  // add a hook before the server.close call. We need to resort
	  // to monkeypatching for now.
	  fastify.addHook('preClose', preClose);

	  function defaultPreClose (done) {
	    const server = this.websocketServer;
	    if (server.clients) {
	      for (const client of server.clients) {
	        client.close();
	      }
	    }

	    fastify.server.removeListener('upgrade', onUpgrade);

	    server.close(done);

	    done();
	  }

	  function noHandle (socket, rawRequest) {
	    this.log.info({ path: rawRequest.url }, 'closed incoming websocket connection for path with no websocket handler');
	    socket.close();
	  }

	  function defaultErrorHandler (error, socket, request) {
	    request.log.error(error);
	    socket.terminate();
	  }

	  next();
	}

	websocket$1.exports = fp(fastifyWebsocket, {
	  fastify: '5.x',
	  name: '@fastify/websocket'
	});
	websocket$1.exports.default = fastifyWebsocket;
	websocket$1.exports.fastifyWebsocket = fastifyWebsocket;
	return websocket$1.exports;
}

var websocketExports = /*@__PURE__*/ requireWebsocket();
const websocket = /*@__PURE__*/getDefaultExportFromCjs(websocketExports);

async function processDocument(documentId) {
    throw new Error("You attempted to execute workflow processDocument function directly. To start a workflow, use start(processDocument) from workflow/api");
}
processDocument.workflowId = "workflow//src/workflows/processDocument.ts//processDocument";

var main = {};

var SupabaseClient = {};

var constants = {};

var version = {};

var hasRequiredVersion;

function requireVersion () {
	if (hasRequiredVersion) return version;
	hasRequiredVersion = 1;
	Object.defineProperty(version, "__esModule", { value: true });
	version.version = void 0;
	// Generated automatically during releases by scripts/update-version-files.ts
	// This file provides runtime access to the package version for:
	// - HTTP request headers (e.g., X-Client-Info header for API requests)
	// - Debugging and support (identifying which version is running)
	// - Telemetry and logging (version reporting in errors/analytics)
	// - Ensuring build artifacts match the published package version
	version.version = '2.76.1';
	
	return version;
}

var hasRequiredConstants;

function requireConstants () {
	if (hasRequiredConstants) return constants;
	hasRequiredConstants = 1;
	(function (exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.DEFAULT_REALTIME_OPTIONS = exports$1.DEFAULT_AUTH_OPTIONS = exports$1.DEFAULT_DB_OPTIONS = exports$1.DEFAULT_GLOBAL_OPTIONS = exports$1.DEFAULT_HEADERS = void 0;
		const version_1 = /*@__PURE__*/ requireVersion();
		let JS_ENV = '';
		// @ts-ignore
		if (typeof Deno !== 'undefined') {
		    JS_ENV = 'deno';
		}
		else if (typeof document !== 'undefined') {
		    JS_ENV = 'web';
		}
		else if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
		    JS_ENV = 'react-native';
		}
		else {
		    JS_ENV = 'node';
		}
		exports$1.DEFAULT_HEADERS = { 'X-Client-Info': `supabase-js-${JS_ENV}/${version_1.version}` };
		exports$1.DEFAULT_GLOBAL_OPTIONS = {
		    headers: exports$1.DEFAULT_HEADERS,
		};
		exports$1.DEFAULT_DB_OPTIONS = {
		    schema: 'public',
		};
		exports$1.DEFAULT_AUTH_OPTIONS = {
		    autoRefreshToken: true,
		    persistSession: true,
		    detectSessionInUrl: true,
		    flowType: 'implicit',
		};
		exports$1.DEFAULT_REALTIME_OPTIONS = {};
		
	} (constants));
	return constants;
}

var fetch$1 = {};

var hasRequiredFetch;

function requireFetch () {
	if (hasRequiredFetch) return fetch$1;
	hasRequiredFetch = 1;
	(function (exports$1) {
		var __createBinding = (fetch$1 && fetch$1.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    var desc = Object.getOwnPropertyDescriptor(m, k);
		    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		      desc = { enumerable: true, get: function() { return m[k]; } };
		    }
		    Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __setModuleDefault = (fetch$1 && fetch$1.__setModuleDefault) || (Object.create ? (function(o, v) {
		    Object.defineProperty(o, "default", { enumerable: true, value: v });
		}) : function(o, v) {
		    o["default"] = v;
		});
		var __importStar = (fetch$1 && fetch$1.__importStar) || (function () {
		    var ownKeys = function(o) {
		        ownKeys = Object.getOwnPropertyNames || function (o) {
		            var ar = [];
		            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
		            return ar;
		        };
		        return ownKeys(o);
		    };
		    return function (mod) {
		        if (mod && mod.__esModule) return mod;
		        var result = {};
		        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
		        __setModuleDefault(result, mod);
		        return result;
		    };
		})();
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.fetchWithAuth = exports$1.resolveHeadersConstructor = exports$1.resolveFetch = void 0;
		// @ts-ignore
		const node_fetch_1 = __importStar(require$$0$g);
		const resolveFetch = (customFetch) => {
		    let _fetch;
		    if (customFetch) {
		        _fetch = customFetch;
		    }
		    else if (typeof fetch === 'undefined') {
		        _fetch = node_fetch_1.default;
		    }
		    else {
		        _fetch = fetch;
		    }
		    return (...args) => _fetch(...args);
		};
		exports$1.resolveFetch = resolveFetch;
		const resolveHeadersConstructor = () => {
		    if (typeof Headers === 'undefined') {
		        return node_fetch_1.Headers;
		    }
		    return Headers;
		};
		exports$1.resolveHeadersConstructor = resolveHeadersConstructor;
		const fetchWithAuth = (supabaseKey, getAccessToken, customFetch) => {
		    const fetch = (0, exports$1.resolveFetch)(customFetch);
		    const HeadersConstructor = (0, exports$1.resolveHeadersConstructor)();
		    return async (input, init) => {
		        var _a;
		        const accessToken = (_a = (await getAccessToken())) !== null && _a !== void 0 ? _a : supabaseKey;
		        let headers = new HeadersConstructor(init === null || init === void 0 ? void 0 : init.headers);
		        if (!headers.has('apikey')) {
		            headers.set('apikey', supabaseKey);
		        }
		        if (!headers.has('Authorization')) {
		            headers.set('Authorization', `Bearer ${accessToken}`);
		        }
		        return fetch(input, Object.assign(Object.assign({}, init), { headers }));
		    };
		};
		exports$1.fetchWithAuth = fetchWithAuth;
		
	} (fetch$1));
	return fetch$1;
}

var helpers = {};

var hasRequiredHelpers;

function requireHelpers () {
	if (hasRequiredHelpers) return helpers;
	hasRequiredHelpers = 1;
	Object.defineProperty(helpers, "__esModule", { value: true });
	helpers.isBrowser = void 0;
	helpers.uuid = uuid;
	helpers.ensureTrailingSlash = ensureTrailingSlash;
	helpers.applySettingDefaults = applySettingDefaults;
	helpers.validateSupabaseUrl = validateSupabaseUrl;
	function uuid() {
	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
	        var r = (Math.random() * 16) | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
	        return v.toString(16);
	    });
	}
	function ensureTrailingSlash(url) {
	    return url.endsWith('/') ? url : url + '/';
	}
	const isBrowser = () => typeof window !== 'undefined';
	helpers.isBrowser = isBrowser;
	function applySettingDefaults(options, defaults) {
	    var _a, _b;
	    const { db: dbOptions, auth: authOptions, realtime: realtimeOptions, global: globalOptions, } = options;
	    const { db: DEFAULT_DB_OPTIONS, auth: DEFAULT_AUTH_OPTIONS, realtime: DEFAULT_REALTIME_OPTIONS, global: DEFAULT_GLOBAL_OPTIONS, } = defaults;
	    const result = {
	        db: Object.assign(Object.assign({}, DEFAULT_DB_OPTIONS), dbOptions),
	        auth: Object.assign(Object.assign({}, DEFAULT_AUTH_OPTIONS), authOptions),
	        realtime: Object.assign(Object.assign({}, DEFAULT_REALTIME_OPTIONS), realtimeOptions),
	        storage: {},
	        global: Object.assign(Object.assign(Object.assign({}, DEFAULT_GLOBAL_OPTIONS), globalOptions), { headers: Object.assign(Object.assign({}, ((_a = DEFAULT_GLOBAL_OPTIONS === null || DEFAULT_GLOBAL_OPTIONS === void 0 ? void 0 : DEFAULT_GLOBAL_OPTIONS.headers) !== null && _a !== void 0 ? _a : {})), ((_b = globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.headers) !== null && _b !== void 0 ? _b : {})) }),
	        accessToken: async () => '',
	    };
	    if (options.accessToken) {
	        result.accessToken = options.accessToken;
	    }
	    else {
	        // hack around Required<>
	        delete result.accessToken;
	    }
	    return result;
	}
	/**
	 * Validates a Supabase client URL
	 *
	 * @param {string} supabaseUrl - The Supabase client URL string.
	 * @returns {URL} - The validated base URL.
	 * @throws {Error}
	 */
	function validateSupabaseUrl(supabaseUrl) {
	    const trimmedUrl = supabaseUrl === null || supabaseUrl === void 0 ? void 0 : supabaseUrl.trim();
	    if (!trimmedUrl) {
	        throw new Error('supabaseUrl is required.');
	    }
	    if (!trimmedUrl.match(/^https?:\/\//i)) {
	        throw new Error('Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.');
	    }
	    try {
	        return new URL(ensureTrailingSlash(trimmedUrl));
	    }
	    catch (_a) {
	        throw Error('Invalid supabaseUrl: Provided URL is malformed.');
	    }
	}
	
	return helpers;
}

var SupabaseAuthClient = {};

var hasRequiredSupabaseAuthClient;

function requireSupabaseAuthClient () {
	if (hasRequiredSupabaseAuthClient) return SupabaseAuthClient;
	hasRequiredSupabaseAuthClient = 1;
	Object.defineProperty(SupabaseAuthClient, "__esModule", { value: true });
	SupabaseAuthClient.SupabaseAuthClient = void 0;
	const auth_js_1 = require$$0$h;
	let SupabaseAuthClient$1 = class SupabaseAuthClient extends auth_js_1.AuthClient {
	    constructor(options) {
	        super(options);
	    }
	};
	SupabaseAuthClient.SupabaseAuthClient = SupabaseAuthClient$1;
	
	return SupabaseAuthClient;
}

var hasRequiredSupabaseClient;

function requireSupabaseClient () {
	if (hasRequiredSupabaseClient) return SupabaseClient;
	hasRequiredSupabaseClient = 1;
	Object.defineProperty(SupabaseClient, "__esModule", { value: true });
	const functions_js_1 = require$$0$i;
	const postgrest_js_1 = require$$1$7;
	const realtime_js_1 = require$$2$4;
	const storage_js_1 = require$$3$2;
	const constants_1 = /*@__PURE__*/ requireConstants();
	const fetch_1 = /*@__PURE__*/ requireFetch();
	const helpers_1 = /*@__PURE__*/ requireHelpers();
	const SupabaseAuthClient_1 = /*@__PURE__*/ requireSupabaseAuthClient();
	/**
	 * Supabase Client.
	 *
	 * An isomorphic Javascript client for interacting with Postgres.
	 */
	let SupabaseClient$1 = class SupabaseClient {
	    /**
	     * Create a new client for use in the browser.
	     * @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
	     * @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
	     * @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
	     * @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
	     * @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
	     * @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
	     * @param options.realtime Options passed along to realtime-js constructor.
	     * @param options.storage Options passed along to the storage-js constructor.
	     * @param options.global.fetch A custom fetch implementation.
	     * @param options.global.headers Any additional headers to send with each network request.
	     */
	    constructor(supabaseUrl, supabaseKey, options) {
	        var _a, _b, _c;
	        this.supabaseUrl = supabaseUrl;
	        this.supabaseKey = supabaseKey;
	        const baseUrl = (0, helpers_1.validateSupabaseUrl)(supabaseUrl);
	        if (!supabaseKey)
	            throw new Error('supabaseKey is required.');
	        this.realtimeUrl = new URL('realtime/v1', baseUrl);
	        this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace('http', 'ws');
	        this.authUrl = new URL('auth/v1', baseUrl);
	        this.storageUrl = new URL('storage/v1', baseUrl);
	        this.functionsUrl = new URL('functions/v1', baseUrl);
	        // default storage key uses the supabase project ref as a namespace
	        const defaultStorageKey = `sb-${baseUrl.hostname.split('.')[0]}-auth-token`;
	        const DEFAULTS = {
	            db: constants_1.DEFAULT_DB_OPTIONS,
	            realtime: constants_1.DEFAULT_REALTIME_OPTIONS,
	            auth: Object.assign(Object.assign({}, constants_1.DEFAULT_AUTH_OPTIONS), { storageKey: defaultStorageKey }),
	            global: constants_1.DEFAULT_GLOBAL_OPTIONS,
	        };
	        const settings = (0, helpers_1.applySettingDefaults)(options !== null && options !== void 0 ? options : {}, DEFAULTS);
	        this.storageKey = (_a = settings.auth.storageKey) !== null && _a !== void 0 ? _a : '';
	        this.headers = (_b = settings.global.headers) !== null && _b !== void 0 ? _b : {};
	        if (!settings.accessToken) {
	            this.auth = this._initSupabaseAuthClient((_c = settings.auth) !== null && _c !== void 0 ? _c : {}, this.headers, settings.global.fetch);
	        }
	        else {
	            this.accessToken = settings.accessToken;
	            this.auth = new Proxy({}, {
	                get: (_, prop) => {
	                    throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(prop)} is not possible`);
	                },
	            });
	        }
	        this.fetch = (0, fetch_1.fetchWithAuth)(supabaseKey, this._getAccessToken.bind(this), settings.global.fetch);
	        this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, settings.realtime));
	        this.rest = new postgrest_js_1.PostgrestClient(new URL('rest/v1', baseUrl).href, {
	            headers: this.headers,
	            schema: settings.db.schema,
	            fetch: this.fetch,
	        });
	        this.storage = new storage_js_1.StorageClient(this.storageUrl.href, this.headers, this.fetch, options === null || options === void 0 ? void 0 : options.storage);
	        if (!settings.accessToken) {
	            this._listenForAuthEvents();
	        }
	    }
	    /**
	     * Supabase Functions allows you to deploy and invoke edge functions.
	     */
	    get functions() {
	        return new functions_js_1.FunctionsClient(this.functionsUrl.href, {
	            headers: this.headers,
	            customFetch: this.fetch,
	        });
	    }
	    /**
	     * Perform a query on a table or a view.
	     *
	     * @param relation - The table or view name to query
	     */
	    from(relation) {
	        return this.rest.from(relation);
	    }
	    // NOTE: signatures must be kept in sync with PostgrestClient.schema
	    /**
	     * Select a schema to query or perform an function (rpc) call.
	     *
	     * The schema needs to be on the list of exposed schemas inside Supabase.
	     *
	     * @param schema - The schema to query
	     */
	    schema(schema) {
	        return this.rest.schema(schema);
	    }
	    // NOTE: signatures must be kept in sync with PostgrestClient.rpc
	    /**
	     * Perform a function call.
	     *
	     * @param fn - The function name to call
	     * @param args - The arguments to pass to the function call
	     * @param options - Named parameters
	     * @param options.head - When set to `true`, `data` will not be returned.
	     * Useful if you only need the count.
	     * @param options.get - When set to `true`, the function will be called with
	     * read-only access mode.
	     * @param options.count - Count algorithm to use to count rows returned by the
	     * function. Only applicable for [set-returning
	     * functions](https://www.postgresql.org/docs/current/functions-srf.html).
	     *
	     * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
	     * hood.
	     *
	     * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
	     * statistics under the hood.
	     *
	     * `"estimated"`: Uses exact count for low numbers and planned count for high
	     * numbers.
	     */
	    rpc(fn, args = {}, options = {
	        head: false,
	        get: false,
	        count: undefined,
	    }) {
	        return this.rest.rpc(fn, args, options);
	    }
	    /**
	     * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
	     *
	     * @param {string} name - The name of the Realtime channel.
	     * @param {Object} opts - The options to pass to the Realtime channel.
	     *
	     */
	    channel(name, opts = { config: {} }) {
	        return this.realtime.channel(name, opts);
	    }
	    /**
	     * Returns all Realtime channels.
	     */
	    getChannels() {
	        return this.realtime.getChannels();
	    }
	    /**
	     * Unsubscribes and removes Realtime channel from Realtime client.
	     *
	     * @param {RealtimeChannel} channel - The name of the Realtime channel.
	     *
	     */
	    removeChannel(channel) {
	        return this.realtime.removeChannel(channel);
	    }
	    /**
	     * Unsubscribes and removes all Realtime channels from Realtime client.
	     */
	    removeAllChannels() {
	        return this.realtime.removeAllChannels();
	    }
	    async _getAccessToken() {
	        var _a, _b;
	        if (this.accessToken) {
	            return await this.accessToken();
	        }
	        const { data } = await this.auth.getSession();
	        return (_b = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : this.supabaseKey;
	    }
	    _initSupabaseAuthClient({ autoRefreshToken, persistSession, detectSessionInUrl, storage, userStorage, storageKey, flowType, lock, debug, }, headers, fetch) {
	        const authHeaders = {
	            Authorization: `Bearer ${this.supabaseKey}`,
	            apikey: `${this.supabaseKey}`,
	        };
	        return new SupabaseAuthClient_1.SupabaseAuthClient({
	            url: this.authUrl.href,
	            headers: Object.assign(Object.assign({}, authHeaders), headers),
	            storageKey: storageKey,
	            autoRefreshToken,
	            persistSession,
	            detectSessionInUrl,
	            storage,
	            userStorage,
	            flowType,
	            lock,
	            debug,
	            fetch,
	            // auth checks if there is a custom authorizaiton header using this flag
	            // so it knows whether to return an error when getUser is called with no session
	            hasCustomAuthorizationHeader: Object.keys(this.headers).some((key) => key.toLowerCase() === 'authorization'),
	        });
	    }
	    _initRealtimeClient(options) {
	        return new realtime_js_1.RealtimeClient(this.realtimeUrl.href, Object.assign(Object.assign({}, options), { params: Object.assign({ apikey: this.supabaseKey }, options === null || options === void 0 ? void 0 : options.params) }));
	    }
	    _listenForAuthEvents() {
	        const data = this.auth.onAuthStateChange((event, session) => {
	            this._handleTokenChanged(event, 'CLIENT', session === null || session === void 0 ? void 0 : session.access_token);
	        });
	        return data;
	    }
	    _handleTokenChanged(event, source, token) {
	        if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') &&
	            this.changedAccessToken !== token) {
	            this.changedAccessToken = token;
	            this.realtime.setAuth(token);
	        }
	        else if (event === 'SIGNED_OUT') {
	            this.realtime.setAuth();
	            if (source == 'STORAGE')
	                this.auth.signOut();
	            this.changedAccessToken = undefined;
	        }
	    }
	};
	SupabaseClient.default = SupabaseClient$1;
	
	return SupabaseClient;
}

var hasRequiredMain;

function requireMain () {
	if (hasRequiredMain) return main;
	hasRequiredMain = 1;
	(function (exports$1) {
		var __createBinding = (main && main.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    var desc = Object.getOwnPropertyDescriptor(m, k);
		    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		      desc = { enumerable: true, get: function() { return m[k]; } };
		    }
		    Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __exportStar = (main && main.__exportStar) || function(m, exports$1) {
		    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
		};
		var __importDefault = (main && main.__importDefault) || function (mod) {
		    return (mod && mod.__esModule) ? mod : { "default": mod };
		};
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.createClient = exports$1.SupabaseClient = exports$1.FunctionRegion = exports$1.FunctionsError = exports$1.FunctionsRelayError = exports$1.FunctionsFetchError = exports$1.FunctionsHttpError = exports$1.PostgrestError = void 0;
		const SupabaseClient_1 = __importDefault(/*@__PURE__*/ requireSupabaseClient());
		__exportStar(require$$0$h, exports$1);
		var postgrest_js_1 = require$$1$7;
		Object.defineProperty(exports$1, "PostgrestError", { enumerable: true, get: function () { return postgrest_js_1.PostgrestError; } });
		var functions_js_1 = require$$0$i;
		Object.defineProperty(exports$1, "FunctionsHttpError", { enumerable: true, get: function () { return functions_js_1.FunctionsHttpError; } });
		Object.defineProperty(exports$1, "FunctionsFetchError", { enumerable: true, get: function () { return functions_js_1.FunctionsFetchError; } });
		Object.defineProperty(exports$1, "FunctionsRelayError", { enumerable: true, get: function () { return functions_js_1.FunctionsRelayError; } });
		Object.defineProperty(exports$1, "FunctionsError", { enumerable: true, get: function () { return functions_js_1.FunctionsError; } });
		Object.defineProperty(exports$1, "FunctionRegion", { enumerable: true, get: function () { return functions_js_1.FunctionRegion; } });
		__exportStar(require$$2$4, exports$1);
		var SupabaseClient_2 = /*@__PURE__*/ requireSupabaseClient();
		Object.defineProperty(exports$1, "SupabaseClient", { enumerable: true, get: function () { return __importDefault(SupabaseClient_2).default; } });
		/**
		 * Creates a new Supabase Client.
		 */
		const createClient = (supabaseUrl, supabaseKey, options) => {
		    return new SupabaseClient_1.default(supabaseUrl, supabaseKey, options);
		};
		exports$1.createClient = createClient;
		// Check for Node.js <= 18 deprecation
		function shouldShowDeprecationWarning() {
		    // Skip in browser environments
		    if (typeof window !== 'undefined') {
		        return false;
		    }
		    // Skip if process is not available (e.g., Edge Runtime)
		    if (typeof process === 'undefined') {
		        return false;
		    }
		    // Use dynamic property access to avoid Next.js Edge Runtime static analysis warnings
		    const processVersion = process['version'];
		    if (processVersion === undefined || processVersion === null) {
		        return false;
		    }
		    const versionMatch = processVersion.match(/^v(\d+)\./);
		    if (!versionMatch) {
		        return false;
		    }
		    const majorVersion = parseInt(versionMatch[1], 10);
		    return majorVersion <= 18;
		}
		if (shouldShowDeprecationWarning()) {
		    console.warn(`⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. ` +
		        `Please upgrade to Node.js 20 or later. ` +
		        `For more information, visit: https://github.com/orgs/supabase/discussions/37217`);
		}
		
	} (main));
	return main;
}

var mainExports = /*@__PURE__*/ requireMain();

let supabaseInstance = null;
function getSupabaseClient() {
	if (supabaseInstance) {
		return supabaseInstance;
	}
	const supabaseUrl = process.env.SUPABASE_URL;
	const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseUrl || !supabaseServiceRoleKey) {
		throw new Error("Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
	}
	// Use service role key for server-side operations (bypasses RLS)
	supabaseInstance = mainExports.createClient(supabaseUrl, supabaseServiceRoleKey, { auth: {
		autoRefreshToken: false,
		persistSession: false
	} });
	return supabaseInstance;
}
function getStorageBucket() {
	const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;
	if (!storageBucket) {
		throw new Error("SUPABASE_STORAGE_BUCKET is not defined in .env");
	}
	return storageBucket;
}
/**
* Upload a file buffer to Supabase Storage
* @param buffer - The file buffer to upload
* @param filename - The name of the file
* @param mimetype - The MIME type of the file
* @returns Object containing the file path and public URL
*/
async function uploadFileToStorage(buffer, filename, mimetype) {
	// TODO: research about S3 implementation
	const client = getSupabaseClient();
	const storageBucket = getStorageBucket();
	const timestamp = Date.now();
	const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
	const filePath = `${timestamp}-${sanitizedFilename}`;
	const { data, error } = await client.storage.from(storageBucket).upload(filePath, buffer, {
		contentType: mimetype,
		cacheControl: "3600",
		upsert: false
	});
	if (error) {
		throw new Error(`Failed to upload file to Supabase: ${error.message}`);
	}
	// Get public URL for the uploaded file
	const { data: { publicUrl } } = client.storage.from(storageBucket).getPublicUrl(filePath);
	return {
		path: data.path,
		publicUrl,
		bucket: storageBucket
	};
}
/**
* Download a file from Supabase Storage
* @param filePath - The path of the file to download
* @returns The file buffer
*/
async function downloadFileFromStorage(filePath) {
	const client = getSupabaseClient();
	const storageBucket = getStorageBucket();
	const { data, error } = await client.storage.from(storageBucket).download(filePath);
	if (error) {
		throw new Error(`Failed to download file from Supabase: ${error.message}`);
	}
	// Convert Blob to Buffer
	const arrayBuffer = await data.arrayBuffer();
	return Buffer.from(arrayBuffer);
}

var client;
var hasRequiredClient;

function requireClient () {
	if (hasRequiredClient) return client;
	hasRequiredClient = 1;
var El=Object.create;var $t=Object.defineProperty;var Tl=Object.getOwnPropertyDescriptor;var Pl=Object.getOwnPropertyNames;var Al=Object.getPrototypeOf,Sl=Object.prototype.hasOwnProperty;var oi=(e,t)=>()=>(e&&(t=e(e=0)),t);var L=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports),Ae=(e,t)=>{for(var r in t)$t(e,r,{get:t[r],enumerable:true});},si=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of Pl(t))!Sl.call(e,i)&&i!==r&&$t(e,i,{get:()=>t[i],enumerable:!(n=Tl(t,i))||n.enumerable});return e};var V=(e,t,r)=>(r=e!=null?El(Al(e)):{},si(t||!e||!e.__esModule?$t(r,"default",{value:e,enumerable:true}):r,e)),vl=e=>si($t({},"__esModule",{value:true}),e);var Ei=L((Pm,Gl)=>{Gl.exports={name:"@prisma/engines-version",version:"7.1.0-6.ab635e6b9d606fa5c8fb8b1a7f909c3c3c1c98ba",main:"index.js",types:"index.d.ts",license:"Apache-2.0",author:"Tim Suchanek <suchanek@prisma.io>",prisma:{enginesVersion:"ab635e6b9d606fa5c8fb8b1a7f909c3c3c1c98ba"},repository:{type:"git",url:"https://github.com/prisma/engines-wrapper.git",directory:"packages/engines-version"},devDependencies:{"@types/node":"18.19.76",typescript:"4.9.5"},files:["index.js","index.d.ts"],scripts:{build:"tsc -d"}};});var Ti=L(Vt=>{Object.defineProperty(Vt,"__esModule",{value:true});Vt.enginesVersion=void 0;Vt.enginesVersion=Ei().prisma.enginesVersion;});var Ai=L((Sm,Pi)=>{Pi.exports=e=>{let t=e.match(/^[ \t]*(?=\S)/gm);return t?t.reduce((r,n)=>Math.min(r,n.length),1/0):0};});var ki=L((Rm,Ri)=>{Ri.exports=(e,t=1,r)=>{if(r={indent:" ",includeEmptyLines:false,...r},typeof e!="string")throw new TypeError(`Expected \`input\` to be a \`string\`, got \`${typeof e}\``);if(typeof t!="number")throw new TypeError(`Expected \`count\` to be a \`number\`, got \`${typeof t}\``);if(typeof r.indent!="string")throw new TypeError(`Expected \`options.indent\` to be a \`string\`, got \`${typeof r.indent}\``);if(t===0)return e;let n=r.includeEmptyLines?/^/gm:/^(?!\s*$)/gm;return e.replace(n,r.indent.repeat(t))};});var Ii=L((Nm,jt)=>{jt.exports=(e={})=>{let t;if(e.repoUrl)t=e.repoUrl;else if(e.user&&e.repo)t=`https://github.com/${e.user}/${e.repo}`;else throw new Error("You need to specify either the `repoUrl` option or both the `user` and `repo` options");let r=new URL(`${t}/issues/new`),n=["body","title","labels","template","milestone","assignee","projects"];for(let i of n){let o=e[i];if(o!==void 0){if(i==="labels"||i==="projects"){if(!Array.isArray(o))throw new TypeError(`The \`${i}\` option should be an array`);o=o.join(",");}r.searchParams.set(i,o);}}return r.toString()};jt.exports.default=jt.exports;});var en=L((Cf,qi)=>{qi.exports=function(){function e(t,r,n,i,o){return t<r||n<r?t>n?n+1:t+1:i===o?r:r+1}return function(t,r){if(t===r)return 0;if(t.length>r.length){var n=t;t=r,r=n;}for(var i=t.length,o=r.length;i>0&&t.charCodeAt(i-1)===r.charCodeAt(o-1);)i--,o--;for(var s=0;s<i&&t.charCodeAt(s)===r.charCodeAt(s);)s++;if(i-=s,o-=s,i===0||o<3)return o;var a=0,l,c,u,p,y,h,g,E,C,re,R,P,q=[];for(l=0;l<i;l++)q.push(l+1),q.push(t.charCodeAt(s+l));for(var Pe=q.length-1;a<o-3;)for(C=r.charCodeAt(s+(c=a)),re=r.charCodeAt(s+(u=a+1)),R=r.charCodeAt(s+(p=a+2)),P=r.charCodeAt(s+(y=a+3)),h=a+=4,l=0;l<Pe;l+=2)g=q[l],E=q[l+1],c=e(g,c,u,C,E),u=e(c,u,p,re,E),p=e(u,p,y,R,E),h=e(p,y,h,P,E),q[l]=h,y=p,p=u,u=c,c=g;for(;a<o;)for(C=r.charCodeAt(s+(c=a)),h=++a,l=0;l<Pe;l+=2)g=q[l],q[l]=h=e(g,c,h,C,q[l+1]),c=g;return h}}();});var Qi=oi(()=>{});var Hi=oi(()=>{});var Tn=L(he=>{Object.defineProperty(he,"__esModule",{value:true});he.anumber=En;he.abytes=ss;he.ahash=Ju;he.aexists=Wu;he.aoutput=Gu;function En(e){if(!Number.isSafeInteger(e)||e<0)throw new Error("positive integer expected, got "+e)}function Hu(e){return e instanceof Uint8Array||ArrayBuffer.isView(e)&&e.constructor.name==="Uint8Array"}function ss(e,...t){if(!Hu(e))throw new Error("Uint8Array expected");if(t.length>0&&!t.includes(e.length))throw new Error("Uint8Array expected of length "+t+", got length="+e.length)}function Ju(e){if(typeof e!="function"||typeof e.create!="function")throw new Error("Hash should be wrapped by utils.wrapConstructor");En(e.outputLen),En(e.blockLen);}function Wu(e,t=true){if(e.destroyed)throw new Error("Hash instance has been destroyed");if(t&&e.finished)throw new Error("Hash#digest() has already been called")}function Gu(e,t){ss(e);let r=t.outputLen;if(e.length<r)throw new Error("digestInto() expects output buffer of length at least "+r)}});var Rs=L(m=>{Object.defineProperty(m,"__esModule",{value:true});m.add5L=m.add5H=m.add4H=m.add4L=m.add3H=m.add3L=m.rotlBL=m.rotlBH=m.rotlSL=m.rotlSH=m.rotr32L=m.rotr32H=m.rotrBL=m.rotrBH=m.rotrSL=m.rotrSH=m.shrSL=m.shrSH=m.toBig=void 0;m.fromBig=An;m.split=as;m.add=Es;var yr=BigInt(2**32-1),Pn=BigInt(32);function An(e,t=false){return t?{h:Number(e&yr),l:Number(e>>Pn&yr)}:{h:Number(e>>Pn&yr)|0,l:Number(e&yr)|0}}function as(e,t=false){let r=new Uint32Array(e.length),n=new Uint32Array(e.length);for(let i=0;i<e.length;i++){let{h:o,l:s}=An(e[i],t);[r[i],n[i]]=[o,s];}return [r,n]}var ls=(e,t)=>BigInt(e>>>0)<<Pn|BigInt(t>>>0);m.toBig=ls;var cs=(e,t,r)=>e>>>r;m.shrSH=cs;var us=(e,t,r)=>e<<32-r|t>>>r;m.shrSL=us;var ps=(e,t,r)=>e>>>r|t<<32-r;m.rotrSH=ps;var ds=(e,t,r)=>e<<32-r|t>>>r;m.rotrSL=ds;var ms=(e,t,r)=>e<<64-r|t>>>r-32;m.rotrBH=ms;var fs=(e,t,r)=>e>>>r-32|t<<64-r;m.rotrBL=fs;var gs=(e,t)=>t;m.rotr32H=gs;var ys=(e,t)=>e;m.rotr32L=ys;var hs=(e,t,r)=>e<<r|t>>>32-r;m.rotlSH=hs;var ws=(e,t,r)=>t<<r|e>>>32-r;m.rotlSL=ws;var xs=(e,t,r)=>t<<r-32|e>>>64-r;m.rotlBH=xs;var bs=(e,t,r)=>e<<r-32|t>>>64-r;m.rotlBL=bs;function Es(e,t,r,n){let i=(t>>>0)+(n>>>0);return {h:e+r+(i/2**32|0)|0,l:i|0}}var Ts=(e,t,r)=>(e>>>0)+(t>>>0)+(r>>>0);m.add3L=Ts;var Ps=(e,t,r,n)=>t+r+n+(e/2**32|0)|0;m.add3H=Ps;var As=(e,t,r,n)=>(e>>>0)+(t>>>0)+(r>>>0)+(n>>>0);m.add4L=As;var Ss=(e,t,r,n,i)=>t+r+n+i+(e/2**32|0)|0;m.add4H=Ss;var vs=(e,t,r,n,i)=>(e>>>0)+(t>>>0)+(r>>>0)+(n>>>0)+(i>>>0);m.add5L=vs;var Cs=(e,t,r,n,i,o)=>t+r+n+i+o+(e/2**32|0)|0;m.add5H=Cs;var Ku={fromBig:An,split:as,toBig:ls,shrSH:cs,shrSL:us,rotrSH:ps,rotrSL:ds,rotrBH:ms,rotrBL:fs,rotr32H:gs,rotr32L:ys,rotlSH:hs,rotlSL:ws,rotlBH:xs,rotlBL:bs,add:Es,add3L:Ts,add3H:Ps,add4L:As,add4H:Ss,add5H:Cs,add5L:vs};m.default=Ku;});var ks=L(hr=>{Object.defineProperty(hr,"__esModule",{value:true});hr.crypto=void 0;var ce=require$$0$f;hr.crypto=ce&&typeof ce=="object"&&"webcrypto"in ce?ce.webcrypto:ce&&typeof ce=="object"&&"randomBytes"in ce?ce:void 0;});var Fs=L(x=>{Object.defineProperty(x,"__esModule",{value:true});x.Hash=x.nextTick=x.byteSwapIfBE=x.isLE=void 0;x.isBytes=zu;x.u8=Zu;x.u32=Yu;x.createView=Xu;x.rotr=ep;x.rotl=tp;x.byteSwap=Cn;x.byteSwap32=rp;x.bytesToHex=ip;x.hexToBytes=op;x.asyncLoop=ap;x.utf8ToBytes=Is;x.toBytes=wr;x.concatBytes=lp;x.checkOpts=cp;x.wrapConstructor=up;x.wrapConstructorWithOpts=pp;x.wrapXOFConstructorWithOpts=dp;x.randomBytes=mp;var Ue=ks(),vn=Tn();function zu(e){return e instanceof Uint8Array||ArrayBuffer.isView(e)&&e.constructor.name==="Uint8Array"}function Zu(e){return new Uint8Array(e.buffer,e.byteOffset,e.byteLength)}function Yu(e){return new Uint32Array(e.buffer,e.byteOffset,Math.floor(e.byteLength/4))}function Xu(e){return new DataView(e.buffer,e.byteOffset,e.byteLength)}function ep(e,t){return e<<32-t|e>>>t}function tp(e,t){return e<<t|e>>>32-t>>>0}x.isLE=new Uint8Array(new Uint32Array([287454020]).buffer)[0]===68;function Cn(e){return e<<24&4278190080|e<<8&16711680|e>>>8&65280|e>>>24&255}x.byteSwapIfBE=x.isLE?e=>e:e=>Cn(e);function rp(e){for(let t=0;t<e.length;t++)e[t]=Cn(e[t]);}var np=Array.from({length:256},(e,t)=>t.toString(16).padStart(2,"0"));function ip(e){(0, vn.abytes)(e);let t="";for(let r=0;r<e.length;r++)t+=np[e[r]];return t}var ee={_0:48,_9:57,A:65,F:70,a:97,f:102};function Os(e){if(e>=ee._0&&e<=ee._9)return e-ee._0;if(e>=ee.A&&e<=ee.F)return e-(ee.A-10);if(e>=ee.a&&e<=ee.f)return e-(ee.a-10)}function op(e){if(typeof e!="string")throw new Error("hex string expected, got "+typeof e);let t=e.length,r=t/2;if(t%2)throw new Error("hex string expected, got unpadded hex of length "+t);let n=new Uint8Array(r);for(let i=0,o=0;i<r;i++,o+=2){let s=Os(e.charCodeAt(o)),a=Os(e.charCodeAt(o+1));if(s===void 0||a===void 0){let l=e[o]+e[o+1];throw new Error('hex string expected, got non-hex character "'+l+'" at index '+o)}n[i]=s*16+a;}return n}var sp=async()=>{};x.nextTick=sp;async function ap(e,t,r){let n=Date.now();for(let i=0;i<e;i++){r(i);let o=Date.now()-n;o>=0&&o<t||(await(0, x.nextTick)(),n+=o);}}function Is(e){if(typeof e!="string")throw new Error("utf8ToBytes expected string, got "+typeof e);return new Uint8Array(new TextEncoder().encode(e))}function wr(e){return typeof e=="string"&&(e=Is(e)),(0, vn.abytes)(e),e}function lp(...e){let t=0;for(let n=0;n<e.length;n++){let i=e[n];(0, vn.abytes)(i),t+=i.length;}let r=new Uint8Array(t);for(let n=0,i=0;n<e.length;n++){let o=e[n];r.set(o,i),i+=o.length;}return r}var Sn=class{clone(){return this._cloneInto()}};x.Hash=Sn;function cp(e,t){if(t!==void 0&&{}.toString.call(t)!=="[object Object]")throw new Error("Options should be object or undefined");return Object.assign(e,t)}function up(e){let t=n=>e().update(wr(n)).digest(),r=e();return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=()=>e(),t}function pp(e){let t=(n,i)=>e(i).update(wr(n)).digest(),r=e({});return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=n=>e(n),t}function dp(e){let t=(n,i)=>e(i).update(wr(n)).digest(),r=e({});return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=n=>e(n),t}function mp(e=32){if(Ue.crypto&&typeof Ue.crypto.getRandomValues=="function")return Ue.crypto.getRandomValues(new Uint8Array(e));if(Ue.crypto&&typeof Ue.crypto.randomBytes=="function")return Ue.crypto.randomBytes(e);throw new Error("crypto.getRandomValues must be defined")}});var Vs=L(S=>{Object.defineProperty(S,"__esModule",{value:true});S.shake256=S.shake128=S.keccak_512=S.keccak_384=S.keccak_256=S.keccak_224=S.sha3_512=S.sha3_384=S.sha3_256=S.sha3_224=S.Keccak=void 0;S.keccakP=$s;var je=Tn(),Pt=Rs(),te=Fs(),Ns=[],_s=[],Ls=[],fp=BigInt(0),Tt=BigInt(1),gp=BigInt(2),yp=BigInt(7),hp=BigInt(256),wp=BigInt(113);for(let e=0,t=Tt,r=1,n=0;e<24;e++){[r,n]=[n,(2*r+3*n)%5],Ns.push(2*(5*n+r)),_s.push((e+1)*(e+2)/2%64);let i=fp;for(let o=0;o<7;o++)t=(t<<Tt^(t>>yp)*wp)%hp,t&gp&&(i^=Tt<<(Tt<<BigInt(o))-Tt);Ls.push(i);}var[xp,bp]=(0, Pt.split)(Ls,true),Ms=(e,t,r)=>r>32?(0, Pt.rotlBH)(e,t,r):(0, Pt.rotlSH)(e,t,r),Ds=(e,t,r)=>r>32?(0, Pt.rotlBL)(e,t,r):(0, Pt.rotlSL)(e,t,r);function $s(e,t=24){let r=new Uint32Array(10);for(let n=24-t;n<24;n++){for(let s=0;s<10;s++)r[s]=e[s]^e[s+10]^e[s+20]^e[s+30]^e[s+40];for(let s=0;s<10;s+=2){let a=(s+8)%10,l=(s+2)%10,c=r[l],u=r[l+1],p=Ms(c,u,1)^r[a],y=Ds(c,u,1)^r[a+1];for(let h=0;h<50;h+=10)e[s+h]^=p,e[s+h+1]^=y;}let i=e[2],o=e[3];for(let s=0;s<24;s++){let a=_s[s],l=Ms(i,o,a),c=Ds(i,o,a),u=Ns[s];i=e[u],o=e[u+1],e[u]=l,e[u+1]=c;}for(let s=0;s<50;s+=10){for(let a=0;a<10;a++)r[a]=e[s+a];for(let a=0;a<10;a++)e[s+a]^=~r[(a+2)%10]&r[(a+4)%10];}e[0]^=xp[n],e[1]^=bp[n];}r.fill(0);}var At=class e extends te.Hash{constructor(t,r,n,i=false,o=24){if(super(),this.blockLen=t,this.suffix=r,this.outputLen=n,this.enableXOF=i,this.rounds=o,this.pos=0,this.posOut=0,this.finished=false,this.destroyed=false,(0, je.anumber)(n),0>=this.blockLen||this.blockLen>=200)throw new Error("Sha3 supports only keccak-f1600 function");this.state=new Uint8Array(200),this.state32=(0, te.u32)(this.state);}keccak(){te.isLE||(0, te.byteSwap32)(this.state32),$s(this.state32,this.rounds),te.isLE||(0, te.byteSwap32)(this.state32),this.posOut=0,this.pos=0;}update(t){(0, je.aexists)(this);let{blockLen:r,state:n}=this;t=(0, te.toBytes)(t);let i=t.length;for(let o=0;o<i;){let s=Math.min(r-this.pos,i-o);for(let a=0;a<s;a++)n[this.pos++]^=t[o++];this.pos===r&&this.keccak();}return this}finish(){if(this.finished)return;this.finished=true;let{state:t,suffix:r,pos:n,blockLen:i}=this;t[n]^=r,(r&128)!==0&&n===i-1&&this.keccak(),t[i-1]^=128,this.keccak();}writeInto(t){(0, je.aexists)(this,false),(0, je.abytes)(t),this.finish();let r=this.state,{blockLen:n}=this;for(let i=0,o=t.length;i<o;){this.posOut>=n&&this.keccak();let s=Math.min(n-this.posOut,o-i);t.set(r.subarray(this.posOut,this.posOut+s),i),this.posOut+=s,i+=s;}return t}xofInto(t){if(!this.enableXOF)throw new Error("XOF is not possible for this instance");return this.writeInto(t)}xof(t){return (0, je.anumber)(t),this.xofInto(new Uint8Array(t))}digestInto(t){if((0, je.aoutput)(t,this),this.finished)throw new Error("digest() was already called");return this.writeInto(t),this.destroy(),t}digest(){return this.digestInto(new Uint8Array(this.outputLen))}destroy(){this.destroyed=true,this.state.fill(0);}_cloneInto(t){let{blockLen:r,suffix:n,outputLen:i,rounds:o,enableXOF:s}=this;return t||(t=new e(r,n,i,s,o)),t.state32.set(this.state32),t.pos=this.pos,t.posOut=this.posOut,t.finished=this.finished,t.rounds=o,t.suffix=n,t.outputLen=i,t.enableXOF=s,t.destroyed=this.destroyed,t}};S.Keccak=At;var ue=(e,t,r)=>(0, te.wrapConstructor)(()=>new At(t,e,r));S.sha3_224=ue(6,144,224/8);S.sha3_256=ue(6,136,256/8);S.sha3_384=ue(6,104,384/8);S.sha3_512=ue(6,72,512/8);S.keccak_224=ue(1,144,224/8);S.keccak_256=ue(1,136,256/8);S.keccak_384=ue(1,104,384/8);S.keccak_512=ue(1,72,512/8);var qs=(e,t,r)=>(0, te.wrapXOFConstructorWithOpts)((n={})=>new At(t,e,n.dkLen===void 0?r:n.dkLen,true));S.shake128=qs(31,168,128/8);S.shake256=qs(31,136,256/8);});var Gs=L((px,pe)=>{var{sha3_512:Ep}=Vs(),js=24,St=32,Rn=(e=4,t=Math.random)=>{let r="";for(;r.length<e;)r=r+Math.floor(t()*36).toString(36);return r};function Bs(e){let t=8n,r=0n;for(let n of e.values()){let i=BigInt(n);r=(r<<t)+i;}return r}var Qs=(e="")=>Bs(Ep(e)).toString(36).slice(1),Us=Array.from({length:26},(e,t)=>String.fromCharCode(t+97)),Tp=e=>Us[Math.floor(e()*Us.length)],Hs=({globalObj:e=typeof commonjsGlobal<"u"?commonjsGlobal:typeof window<"u"?window:{},random:t=Math.random}={})=>{let r=Object.keys(e).toString(),n=r.length?r+Rn(St,t):Rn(St,t);return Qs(n).substring(0,St)},Js=e=>()=>e++,Pp=476782367,Ws=({random:e=Math.random,counter:t=Js(Math.floor(e()*Pp)),length:r=js,fingerprint:n=Hs({random:e})}={})=>function(){let o=Tp(e),s=Date.now().toString(36),a=t().toString(36),l=Rn(r,e),c=`${s+l+a+n}`;return `${o+Qs(c).substring(1,r)}`},Ap=Ws(),Sp=(e,{minLength:t=2,maxLength:r=St}={})=>{let n=e.length,i=/^[0-9a-z]+$/;try{if(typeof e=="string"&&n>=t&&n<=r&&i.test(e))return !0}finally{}return  false};pe.exports.getConstants=()=>({defaultLength:js,bigLength:St});pe.exports.init=Ws;pe.exports.createId=Ap;pe.exports.bufToBigInt=Bs;pe.exports.createCounter=Js;pe.exports.createFingerprint=Hs;pe.exports.isCuid=Sp;});var Ks=L((dx,vt)=>{var{createId:vp,init:Cp,getConstants:Rp,isCuid:kp}=Gs();vt.exports.createId=vp;vt.exports.init=Cp;vt.exports.getConstants=Rp;vt.exports.isCuid=kp;});var Jd={};Ae(Jd,{AnyNull:()=>M.AnyNull,DMMF:()=>lt,DbNull:()=>M.DbNull,Debug:()=>F,Decimal:()=>hl.Decimal,Extensions:()=>Ur,JsonNull:()=>M.JsonNull,NullTypes:()=>M.NullTypes,ObjectEnumValue:()=>M.ObjectEnumValue,PrismaClientInitializationError:()=>w.PrismaClientInitializationError,PrismaClientKnownRequestError:()=>w.PrismaClientKnownRequestError,PrismaClientRustPanicError:()=>w.PrismaClientRustPanicError,PrismaClientUnknownRequestError:()=>w.PrismaClientUnknownRequestError,PrismaClientValidationError:()=>w.PrismaClientValidationError,Public:()=>jr,Sql:()=>Z.Sql,createParam:()=>co,defineDmmfProperty:()=>go,deserializeJsonResponse:()=>le,deserializeRawResult:()=>$r,dmmfToRuntimeDataModel:()=>pi,empty:()=>Z.empty,getPrismaClient:()=>fl,getRuntime:()=>yl,isAnyNull:()=>M.isAnyNull,isDbNull:()=>M.isDbNull,isJsonNull:()=>M.isJsonNull,join:()=>Z.join,makeStrictEnum:()=>gl,makeTypedQueryFactory:()=>yo,raw:()=>Z.raw,serializeJsonQuery:()=>or,skip:()=>ir,sqltag:()=>Z.sql,warnOnce:()=>Xr});client=vl(Jd);var Ur={};Ae(Ur,{defineExtension:()=>ai,getExtensionContext:()=>li});function ai(e){return typeof e=="function"?e:t=>t.$extends(e)}function li(e){return e}var jr={};Ae(jr,{validator:()=>ci});function ci(...e){return t=>t}var J=class{_map=new Map;get(t){return this._map.get(t)?.value}set(t,r){this._map.set(t,{value:r});}getOrCreate(t,r){let n=this._map.get(t);if(n)return n.value;let i=r();return this.set(t,i),i}};function ie(e){return e.substring(0,1).toLowerCase()+e.substring(1)}function ui(e,t){let r={};for(let n of e){let i=n[t];r[i]=n;}return r}function ze(e){let t;return {get(){return t||(t={value:e()}),t.value}}}function pi(e){return {models:Br(e.models),enums:Br(e.enums),types:Br(e.types)}}function Br(e){let t={};for(let{name:r,...n}of e)t[r]=n;return t}var se=require$$1$8;var qt={};Ae(qt,{$:()=>yi,bgBlack:()=>_l,bgBlue:()=>Vl,bgCyan:()=>jl,bgGreen:()=>$l,bgMagenta:()=>Ul,bgRed:()=>Ll,bgWhite:()=>Bl,bgYellow:()=>ql,black:()=>Fl,blue:()=>me,bold:()=>j,cyan:()=>Y,dim:()=>Ze,gray:()=>tt,green:()=>Xe,grey:()=>Nl,hidden:()=>Ol,inverse:()=>kl,italic:()=>Rl,magenta:()=>Ml,red:()=>de,reset:()=>Cl,strikethrough:()=>Il,underline:()=>Ye,white:()=>Dl,yellow:()=>et});var Qr,di,mi,fi,gi=true;typeof process<"u"&&({FORCE_COLOR:Qr,NODE_DISABLE_COLORS:di,NO_COLOR:mi,TERM:fi}=process.env||{},gi=process.stdout&&process.stdout.isTTY);var yi={enabled:!di&&mi==null&&fi!=="dumb"&&(Qr!=null&&Qr!=="0"||gi)};function T(e,t){let r=new RegExp(`\\x1b\\[${t}m`,"g"),n=`\x1B[${e}m`,i=`\x1B[${t}m`;return function(o){return !yi.enabled||o==null?o:n+(~(""+o).indexOf(i)?o.replace(r,i+n):o)+i}}var Cl=T(0,0),j=T(1,22),Ze=T(2,22),Rl=T(3,23),Ye=T(4,24),kl=T(7,27),Ol=T(8,28),Il=T(9,29),Fl=T(30,39),de=T(31,39),Xe=T(32,39),et=T(33,39),me=T(34,39),Ml=T(35,39),Y=T(36,39),Dl=T(37,39),tt=T(90,39),Nl=T(90,39),_l=T(40,49),Ll=T(41,49),$l=T(42,49),ql=T(43,49),Vl=T(44,49),Ul=T(45,49),jl=T(46,49),Bl=T(47,49);var Ql=100,hi=["green","yellow","blue","magenta","cyan","red"],rt=[],wi=Date.now(),Hl=0,Hr=typeof process<"u"?process.env:{};globalThis.DEBUG??=Hr.DEBUG??"";globalThis.DEBUG_COLORS??=Hr.DEBUG_COLORS?Hr.DEBUG_COLORS==="true":true;var nt={enable(e){typeof e=="string"&&(globalThis.DEBUG=e);},disable(){let e=globalThis.DEBUG;return globalThis.DEBUG="",e},enabled(e){let t=globalThis.DEBUG.split(",").map(i=>i.replace(/[.+?^${}()|[\]\\]/g,"\\$&")),r=t.some(i=>i===""||i[0]==="-"?false:e.match(RegExp(i.split("*").join(".*")+"$"))),n=t.some(i=>i===""||i[0]!=="-"?false:e.match(RegExp(i.slice(1).split("*").join(".*")+"$")));return r&&!n},log:(...e)=>{let[t,r,...n]=e;(console.warn??console.log)(`${t} ${r}`,...n);},formatters:{}};function Jl(e){let t={color:hi[Hl++%hi.length],enabled:nt.enabled(e),namespace:e,log:nt.log,extend:()=>{}},r=(...n)=>{let{enabled:i,namespace:o,color:s,log:a}=t;if(n.length!==0&&rt.push([o,...n]),rt.length>Ql&&rt.shift(),nt.enabled(o)||i){let l=n.map(u=>typeof u=="string"?u:Wl(u)),c=`+${Date.now()-wi}ms`;wi=Date.now(),globalThis.DEBUG_COLORS?a(qt[s](j(o)),...l,qt[s](c)):a(o,...l,c);}};return new Proxy(r,{get:(n,i)=>t[i],set:(n,i,o)=>t[i]=o})}var F=new Proxy(Jl,{get:(e,t)=>nt[t],set:(e,t,r)=>nt[t]=r});function Wl(e,t=2){let r=new Set;return JSON.stringify(e,(n,i)=>{if(typeof i=="object"&&i!==null){if(r.has(i))return "[Circular *]";r.add(i);}else if(typeof i=="bigint")return i.toString();return i},t)}function xi(e=7500){let t=rt.map(([r,...n])=>`${r} ${n.map(i=>typeof i=="string"?i:JSON.stringify(i)).join(" ")}`).join(`
`);return t.length<e?t:t.slice(-e)}function bi(){rt.length=0;}var Si=V(Ai(),1);function Jr(e){let t=(0, Si.default)(e);if(t===0)return e;let r=new RegExp(`^[ \\t]{${t}}`,"gm");return e.replace(r,"")}var vi="prisma+postgres",Ut=`${vi}:`;function Ci(e){return e?.toString().startsWith(`${Ut}//`)??false}function Wr(e){if(!Ci(e))return  false;let{host:t}=new URL(e);return t.includes("localhost")||t.includes("127.0.0.1")||t.includes("[::1]")}var ot={};Ae(ot,{error:()=>Zl,info:()=>zl,log:()=>Kl,query:()=>Yl,should:()=>Oi,tags:()=>it,warn:()=>Gr});var it={error:de("prisma:error"),warn:et("prisma:warn"),info:Y("prisma:info"),query:me("prisma:query")},Oi={warn:()=>!process.env.PRISMA_DISABLE_WARNINGS};function Kl(...e){console.log(...e);}function Gr(e,...t){Oi.warn()&&console.warn(`${it.warn} ${e}`,...t);}function zl(e,...t){console.info(`${it.info} ${e}`,...t);}function Zl(e,...t){console.error(`${it.error} ${e}`,...t);}function Yl(e,...t){console.log(`${it.query} ${e}`,...t);}function X(e,t){throw new Error(t)}function Kr({onlyFirst:e=false}={}){let r=["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?(?:\\u0007|\\u001B\\u005C|\\u009C))","(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"].join("|");return new RegExp(r,e?void 0:"g")}var Xl=Kr();function Se(e){if(typeof e!="string")throw new TypeError(`Expected a \`string\`, got \`${typeof e}\``);return e.replace(Xl,"")}var st=V(require$$5__default);function zr(e){return st.default.sep===st.default.posix.sep?e:e.split(st.default.sep).join(st.default.posix.sep)}function Zr(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function Bt(e,t){let r={};for(let n of Object.keys(e))r[n]=t(e[n],n);return r}function Yr(e,t){if(e.length===0)return;let r=e[0];for(let n=1;n<e.length;n++)t(r,e[n])<0&&(r=e[n]);return r}function at(e,t){Object.defineProperty(e,"name",{value:t,configurable:true});}var Fi=new Set,Xr=(e,t,...r)=>{Fi.has(e)||(Fi.add(e),Gr(t,...r));};function ve(e){return e instanceof Date||Object.prototype.toString.call(e)==="[object Date]"}function Qt(e){return e.toString()!=="Invalid Date"}var Mi=require$$1$8;function Ce(e){return Mi.Decimal.isDecimal(e)?true:e!==null&&typeof e=="object"&&typeof e.s=="number"&&typeof e.e=="number"&&typeof e.toFixed=="function"&&Array.isArray(e.d)}var no=require$$1$8;var lt={};Ae(lt,{ModelAction:()=>Re,datamodelEnumToSchemaEnum:()=>ec,datamodelSchemaEnumToSchemaEnum:()=>tc});function ec(e){return {name:e.name,data:e.values.map(t=>({key:t.name,value:t.dbName??t.name}))}}function tc(e){return {name:e.name,data:e.values.map(t=>({key:t,value:t}))}}var Re=(P=>(P.findUnique="findUnique",P.findUniqueOrThrow="findUniqueOrThrow",P.findFirst="findFirst",P.findFirstOrThrow="findFirstOrThrow",P.findMany="findMany",P.create="create",P.createMany="createMany",P.createManyAndReturn="createManyAndReturn",P.update="update",P.updateMany="updateMany",P.updateManyAndReturn="updateManyAndReturn",P.upsert="upsert",P.delete="delete",P.deleteMany="deleteMany",P.groupBy="groupBy",P.count="count",P.aggregate="aggregate",P.findRaw="findRaw",P.aggregateRaw="aggregateRaw",P))(Re||{});var $i=V(ki());var Li=V(require$$3$1);var Di={keyword:Y,entity:Y,value:e=>j(me(e)),punctuation:me,directive:Y,function:Y,variable:e=>j(me(e)),string:e=>j(Xe(e)),boolean:et,number:Y,comment:tt};var rc=e=>e,Ht={},nc=0,f={manual:Ht.Prism&&Ht.Prism.manual,disableWorkerMessageHandler:Ht.Prism&&Ht.Prism.disableWorkerMessageHandler,util:{encode:function(e){if(e instanceof B){let t=e;return new B(t.type,f.util.encode(t.content),t.alias)}else return Array.isArray(e)?e.map(f.util.encode):e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).slice(8,-1)},objId:function(e){return e.__id||Object.defineProperty(e,"__id",{value:++nc}),e.__id},clone:function e(t,r){let n,i,o=f.util.type(t);switch(r=r||{},o){case "Object":if(i=f.util.objId(t),r[i])return r[i];n={},r[i]=n;for(let s in t)t.hasOwnProperty(s)&&(n[s]=e(t[s],r));return n;case "Array":return i=f.util.objId(t),r[i]?r[i]:(n=[],r[i]=n,t.forEach(function(s,a){n[a]=e(s,r);}),n);default:return t}}},languages:{extend:function(e,t){let r=f.util.clone(f.languages[e]);for(let n in t)r[n]=t[n];return r},insertBefore:function(e,t,r,n){n=n||f.languages;let i=n[e],o={};for(let a in i)if(i.hasOwnProperty(a)){if(a==t)for(let l in r)r.hasOwnProperty(l)&&(o[l]=r[l]);r.hasOwnProperty(a)||(o[a]=i[a]);}let s=n[e];return n[e]=o,f.languages.DFS(f.languages,function(a,l){l===s&&a!=e&&(this[a]=o);}),o},DFS:function e(t,r,n,i){i=i||{};let o=f.util.objId;for(let s in t)if(t.hasOwnProperty(s)){r.call(t,s,t[s],n||s);let a=t[s],l=f.util.type(a);l==="Object"&&!i[o(a)]?(i[o(a)]=true,e(a,r,null,i)):l==="Array"&&!i[o(a)]&&(i[o(a)]=true,e(a,r,s,i));}}},plugins:{},highlight:function(e,t,r){let n={code:e,grammar:t,language:r};return f.hooks.run("before-tokenize",n),n.tokens=f.tokenize(n.code,n.grammar),f.hooks.run("after-tokenize",n),B.stringify(f.util.encode(n.tokens),n.language)},matchGrammar:function(e,t,r,n,i,o,s){for(let E in r){if(!r.hasOwnProperty(E)||!r[E])continue;if(E==s)return;let C=r[E];C=f.util.type(C)==="Array"?C:[C];for(let re=0;re<C.length;++re){let R=C[re],P=R.inside,q=!!R.lookbehind,Pe=!!R.greedy,Vr=0,wl=R.alias;if(Pe&&!R.pattern.global){let _=R.pattern.toString().match(/[imuy]*$/)[0];R.pattern=RegExp(R.pattern.source,_+"g");}R=R.pattern||R;for(let _=n,ne=i;_<t.length;ne+=t[_].length,++_){let Ke=t[_];if(t.length>e.length)return;if(Ke instanceof B)continue;if(Pe&&_!=t.length-1){R.lastIndex=ne;var p=R.exec(e);if(!p)break;var u=p.index+(q?p[1].length:0),y=p.index+p[0].length,a=_,l=ne;for(let bl=t.length;a<bl&&(l<y||!t[a].type&&!t[a-1].greedy);++a)l+=t[a].length,u>=l&&(++_,ne=l);if(t[_]instanceof B)continue;c=a-_,Ke=e.slice(ne,l),p.index-=ne;}else {R.lastIndex=0;var p=R.exec(Ke),c=1;}if(!p){if(o)break;continue}q&&(Vr=p[1]?p[1].length:0);var u=p.index+Vr,p=p[0].slice(Vr),y=u+p.length,h=Ke.slice(0,u),g=Ke.slice(y);let Lt=[_,c];h&&(++_,ne+=h.length,Lt.push(h));let xl=new B(E,P?f.tokenize(p,P):p,wl,p,Pe);if(Lt.push(xl),g&&Lt.push(g),Array.prototype.splice.apply(t,Lt),c!=1&&f.matchGrammar(e,t,r,_,ne,true,E),o)break}}}},tokenize:function(e,t){let r=[e],n=t.rest;if(n){for(let i in n)t[i]=n[i];delete t.rest;}return f.matchGrammar(e,r,t,0,0,false),r},hooks:{all:{},add:function(e,t){let r=f.hooks.all;r[e]=r[e]||[],r[e].push(t);},run:function(e,t){let r=f.hooks.all[e];if(!(!r||!r.length))for(var n=0,i;i=r[n++];)i(t);}},Token:B};f.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,lookbehind:true},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:true,greedy:true}],string:{pattern:/(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:true},"class-name":{pattern:/((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,lookbehind:true,inside:{punctuation:/[.\\]/}},keyword:/\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,boolean:/\b(?:true|false)\b/,function:/\w+(?=\()/,number:/\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,operator:/--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,punctuation:/[{}[\];(),.:]/};f.languages.javascript=f.languages.extend("clike",{"class-name":[f.languages.clike["class-name"],{pattern:/(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,lookbehind:true}],keyword:[{pattern:/((?:^|})\s*)(?:catch|finally)\b/,lookbehind:true},{pattern:/(^|[^.])\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,lookbehind:true}],number:/\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,function:/[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,operator:/-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/});f.languages.javascript["class-name"][0].pattern=/(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/;f.languages.insertBefore("javascript","keyword",{regex:{pattern:/((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyus]{0,6}(?=\s*($|[\r\n,.;})\]]))/,lookbehind:true,greedy:true},"function-variable":{pattern:/[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,alias:"function"},parameter:[{pattern:/(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,lookbehind:true,inside:f.languages.javascript},{pattern:/[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,inside:f.languages.javascript},{pattern:/(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,lookbehind:true,inside:f.languages.javascript},{pattern:/((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,lookbehind:true,inside:f.languages.javascript}],constant:/\b[A-Z](?:[A-Z_]|\dx?)*\b/});f.languages.markup&&f.languages.markup.tag.addInlined("script","javascript");f.languages.js=f.languages.javascript;f.languages.typescript=f.languages.extend("javascript",{keyword:/\b(?:abstract|as|async|await|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|is|keyof|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|require|set|static|super|switch|this|throw|try|type|typeof|var|void|while|with|yield)\b/,builtin:/\b(?:string|Function|any|number|boolean|Array|symbol|console|Promise|unknown|never)\b/});f.languages.ts=f.languages.typescript;function B(e,t,r,n,i){this.type=e,this.content=t,this.alias=r,this.length=(n||"").length|0,this.greedy=!!i;}B.stringify=function(e,t){return typeof e=="string"?e:Array.isArray(e)?e.map(function(r){return B.stringify(r,t)}).join(""):ic(e.type)(e.content)};function ic(e){return Di[e]||rc}function Ni(e){return oc(e,f.languages.javascript)}function oc(e,t){return f.tokenize(e,t).map(n=>B.stringify(n)).join("")}function _i(e){return Jr(e)}var Jt=class e{firstLineNumber;lines;static read(t){let r;try{r=Li.default.readFileSync(t,"utf-8");}catch{return null}return e.fromContent(r)}static fromContent(t){let r=t.split(/\r?\n/);return new e(1,r)}constructor(t,r){this.firstLineNumber=t,this.lines=r;}get lastLineNumber(){return this.firstLineNumber+this.lines.length-1}mapLineAt(t,r){if(t<this.firstLineNumber||t>this.lines.length+this.firstLineNumber)return this;let n=t-this.firstLineNumber,i=[...this.lines];return i[n]=r(i[n]),new e(this.firstLineNumber,i)}mapLines(t){return new e(this.firstLineNumber,this.lines.map((r,n)=>t(r,this.firstLineNumber+n)))}lineAt(t){return this.lines[t-this.firstLineNumber]}prependSymbolAt(t,r){return this.mapLines((n,i)=>i===t?`${r} ${n}`:`  ${n}`)}slice(t,r){let n=this.lines.slice(t-1,r).join(`
`);return new e(t,_i(n).split(`
`))}highlight(){let t=Ni(this.toString());return new e(this.firstLineNumber,t.split(`
`))}toString(){return this.lines.join(`
`)}};var sc={red:de,gray:tt,dim:Ze,bold:j,underline:Ye,highlightSource:e=>e.highlight()},ac={red:e=>e,gray:e=>e,dim:e=>e,bold:e=>e,underline:e=>e,highlightSource:e=>e};function lc({message:e,originalMethod:t,isPanic:r,callArguments:n}){return {functionName:`prisma.${t}()`,message:e,isPanic:r??false,callArguments:n}}function cc({callsite:e,message:t,originalMethod:r,isPanic:n,callArguments:i},o){let s=lc({message:t,originalMethod:r,isPanic:n,callArguments:i});if(!e||typeof window<"u"||process.env.NODE_ENV==="production")return s;let a=e.getLocation();if(!a||!a.lineNumber||!a.columnNumber)return s;let l=Math.max(1,a.lineNumber-3),c=Jt.read(a.fileName)?.slice(l,a.lineNumber),u=c?.lineAt(a.lineNumber);if(c&&u){let p=pc(u),y=uc(u);if(!y)return s;s.functionName=`${y.code})`,s.location=a,n||(c=c.mapLineAt(a.lineNumber,g=>g.slice(0,y.openingBraceIndex))),c=o.highlightSource(c);let h=String(c.lastLineNumber).length;if(s.contextLines=c.mapLines((g,E)=>o.gray(String(E).padStart(h))+" "+g).mapLines(g=>o.dim(g)).prependSymbolAt(a.lineNumber,o.bold(o.red("\u2192"))),i){let g=p+h+1;g+=2,s.callArguments=(0, $i.default)(i,g).slice(g);}}return s}function uc(e){let t=Object.keys(Re).join("|"),n=new RegExp(String.raw`\.(${t})\(`).exec(e);if(n){let i=n.index+n[0].length,o=e.lastIndexOf(" ",n.index)+1;return {code:e.slice(o,i),openingBraceIndex:i}}return null}function pc(e){let t=0;for(let r=0;r<e.length;r++){if(e.charAt(r)!==" ")return t;t++;}return t}function dc({functionName:e,location:t,message:r,isPanic:n,contextLines:i,callArguments:o},s){let a=[""],l=t?" in":":";if(n?(a.push(s.red(`Oops, an unknown error occurred! This is ${s.bold("on us")}, you did nothing wrong.`)),a.push(s.red(`It occurred in the ${s.bold(`\`${e}\``)} invocation${l}`))):a.push(s.red(`Invalid ${s.bold(`\`${e}\``)} invocation${l}`)),t&&a.push(s.underline(mc(t))),i){a.push("");let c=[i.toString()];o&&(c.push(o),c.push(s.dim(")"))),a.push(c.join("")),o&&a.push("");}else a.push(""),o&&a.push(o),a.push("");return a.push(r),a.join(`
`)}function mc(e){let t=[e.fileName];return e.lineNumber&&t.push(String(e.lineNumber)),e.columnNumber&&t.push(String(e.columnNumber)),t.join(":")}function Wt(e){let t=e.showColors?sc:ac,r;return r=cc(e,t),dc(r,t)}var Wi=V(en());function ji(e,t,r){let n=Bi(e),i=fc(n),o=yc(i);o?Gt(o,t,r):t.addErrorMessage(()=>"Unknown error");}function Bi(e){return e.errors.flatMap(t=>t.kind==="Union"?Bi(t):[t])}function fc(e){let t=new Map,r=[];for(let n of e){if(n.kind!=="InvalidArgumentType"){r.push(n);continue}let i=`${n.selectionPath.join(".")}:${n.argumentPath.join(".")}`,o=t.get(i);o?t.set(i,{...n,argument:{...n.argument,typeNames:gc(o.argument.typeNames,n.argument.typeNames)}}):t.set(i,n);}return r.push(...t.values()),r}function gc(e,t){return [...new Set(e.concat(t))]}function yc(e){return Yr(e,(t,r)=>{let n=Vi(t),i=Vi(r);return n!==i?n-i:Ui(t)-Ui(r)})}function Vi(e){let t=0;return Array.isArray(e.selectionPath)&&(t+=e.selectionPath.length),Array.isArray(e.argumentPath)&&(t+=e.argumentPath.length),t}function Ui(e){switch(e.kind){case "InvalidArgumentValue":case "ValueTooLarge":return 20;case "InvalidArgumentType":return 10;case "RequiredArgumentMissing":return  -10;default:return 0}}var $=class{constructor(t,r){this.name=t;this.value=r;}isRequired=false;makeRequired(){return this.isRequired=true,this}write(t){let{colors:{green:r}}=t.context;t.addMarginSymbol(r(this.isRequired?"+":"?")),t.write(r(this.name)),this.isRequired||t.write(r("?")),t.write(r(": ")),typeof this.value=="string"?t.write(r(this.value)):t.write(this.value);}};Hi();var ke=class{constructor(t=0,r){this.context=r;this.currentIndent=t;}lines=[];currentLine="";currentIndent=0;marginSymbol;afterNextNewLineCallback;write(t){return typeof t=="string"?this.currentLine+=t:t.write(this),this}writeJoined(t,r,n=(i,o)=>o.write(i)){let i=r.length-1;for(let o=0;o<r.length;o++)n(r[o],this),o!==i&&this.write(t);return this}writeLine(t){return this.write(t).newLine()}newLine(){this.lines.push(this.indentedCurrentLine()),this.currentLine="",this.marginSymbol=void 0;let t=this.afterNextNewLineCallback;return this.afterNextNewLineCallback=void 0,t?.(),this}withIndent(t){return this.indent(),t(this),this.unindent(),this}afterNextNewline(t){return this.afterNextNewLineCallback=t,this}indent(){return this.currentIndent++,this}unindent(){return this.currentIndent>0&&this.currentIndent--,this}addMarginSymbol(t){return this.marginSymbol=t,this}toString(){return this.lines.concat(this.indentedCurrentLine()).join(`
`)}getCurrentLineLength(){return this.currentLine.length}indentedCurrentLine(){let t=this.currentLine.padStart(this.currentLine.length+2*this.currentIndent);return this.marginSymbol?this.marginSymbol+t.slice(1):t}};Qi();var Kt=class{constructor(t){this.value=t;}write(t){t.write(this.value);}markAsError(){this.value.markAsError();}};var zt=e=>e,Zt={bold:zt,red:zt,green:zt,dim:zt,enabled:false},Ji={bold:j,red:de,green:Xe,dim:Ze,enabled:true},Oe={write(e){e.writeLine(",");}};var W=class{constructor(t){this.contents=t;}isUnderlined=false;color=t=>t;underline(){return this.isUnderlined=true,this}setColor(t){return this.color=t,this}write(t){let r=t.getCurrentLineLength();t.write(this.color(this.contents)),this.isUnderlined&&t.afterNextNewline(()=>{t.write(" ".repeat(r)).writeLine(this.color("~".repeat(this.contents.length)));});}};var oe=class{hasError=false;markAsError(){return this.hasError=true,this}};var Ie=class extends oe{items=[];addItem(t){return this.items.push(new Kt(t)),this}getField(t){return this.items[t]}getPrintWidth(){return this.items.length===0?2:Math.max(...this.items.map(r=>r.value.getPrintWidth()))+2}write(t){if(this.items.length===0){this.writeEmpty(t);return}this.writeWithItems(t);}writeEmpty(t){let r=new W("[]");this.hasError&&r.setColor(t.context.colors.red).underline(),t.write(r);}writeWithItems(t){let{colors:r}=t.context;t.writeLine("[").withIndent(()=>t.writeJoined(Oe,this.items).newLine()).write("]"),this.hasError&&t.afterNextNewline(()=>{t.writeLine(r.red("~".repeat(this.getPrintWidth())));});}asObject(){}};var Fe=class e extends oe{fields={};suggestions=[];addField(t){this.fields[t.name]=t;}addSuggestion(t){this.suggestions.push(t);}getField(t){return this.fields[t]}getDeepField(t){let[r,...n]=t,i=this.getField(r);if(!i)return;let o=i;for(let s of n){let a;if(o.value instanceof e?a=o.value.getField(s):o.value instanceof Ie&&(a=o.value.getField(Number(s))),!a)return;o=a;}return o}getDeepFieldValue(t){return t.length===0?this:this.getDeepField(t)?.value}hasField(t){return !!this.getField(t)}removeAllFields(){this.fields={};}removeField(t){delete this.fields[t];}getFields(){return this.fields}isEmpty(){return Object.keys(this.fields).length===0}getFieldValue(t){return this.getField(t)?.value}getDeepSubSelectionValue(t){let r=this;for(let n of t){if(!(r instanceof e))return;let i=r.getSubSelectionValue(n);if(!i)return;r=i;}return r}getDeepSelectionParent(t){let r=this.getSelectionParent();if(!r)return;let n=r;for(let i of t){let o=n.value.getFieldValue(i);if(!o||!(o instanceof e))return;let s=o.getSelectionParent();if(!s)return;n=s;}return n}getSelectionParent(){let t=this.getField("select")?.value.asObject();if(t)return {kind:"select",value:t};let r=this.getField("include")?.value.asObject();if(r)return {kind:"include",value:r}}getSubSelectionValue(t){return this.getSelectionParent()?.value.fields[t].value}getPrintWidth(){let t=Object.values(this.fields);return t.length==0?2:Math.max(...t.map(n=>n.getPrintWidth()))+2}write(t){let r=Object.values(this.fields);if(r.length===0&&this.suggestions.length===0){this.writeEmpty(t);return}this.writeWithContents(t,r);}asObject(){return this}writeEmpty(t){let r=new W("{}");this.hasError&&r.setColor(t.context.colors.red).underline(),t.write(r);}writeWithContents(t,r){t.writeLine("{").withIndent(()=>{t.writeJoined(Oe,[...r,...this.suggestions]).newLine();}),t.write("}"),this.hasError&&t.afterNextNewline(()=>{t.writeLine(t.context.colors.red("~".repeat(this.getPrintWidth())));});}};var k=class extends oe{constructor(r){super();this.text=r;}getPrintWidth(){return this.text.length}write(r){let n=new W(this.text);this.hasError&&n.underline().setColor(r.context.colors.red),r.write(n);}asObject(){}};var ct=class{fields=[];addField(t,r){return this.fields.push({write(n){let{green:i,dim:o}=n.context.colors;n.write(i(o(`${t}: ${r}`))).addMarginSymbol(i(o("+")));}}),this}write(t){let{colors:{green:r}}=t.context;t.writeLine(r("{")).withIndent(()=>{t.writeJoined(Oe,this.fields).newLine();}).write(r("}")).addMarginSymbol(r("+"));}};function Gt(e,t,r){switch(e.kind){case "MutuallyExclusiveFields":hc(e,t);break;case "IncludeOnScalar":wc(e,t);break;case "EmptySelection":xc(e,t,r);break;case "UnknownSelectionField":Pc(e,t);break;case "InvalidSelectionValue":Ac(e,t);break;case "UnknownArgument":Sc(e,t);break;case "UnknownInputField":vc(e,t);break;case "RequiredArgumentMissing":Cc(e,t);break;case "InvalidArgumentType":Rc(e,t);break;case "InvalidArgumentValue":kc(e,t);break;case "ValueTooLarge":Oc(e,t);break;case "SomeFieldsMissing":Ic(e,t);break;case "TooManyFieldsGiven":Fc(e,t);break;case "Union":ji(e,t,r);break;default:throw new Error("not implemented: "+e.kind)}}function hc(e,t){let r=t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();r&&(r.getField(e.firstField)?.markAsError(),r.getField(e.secondField)?.markAsError()),t.addErrorMessage(n=>`Please ${n.bold("either")} use ${n.green(`\`${e.firstField}\``)} or ${n.green(`\`${e.secondField}\``)}, but ${n.red("not both")} at the same time.`);}function wc(e,t){let[r,n]=Me(e.selectionPath),i=e.outputType,o=t.arguments.getDeepSelectionParent(r)?.value;if(o&&(o.getField(n)?.markAsError(),i))for(let s of i.fields)s.isRelation&&o.addSuggestion(new $(s.name,"true"));t.addErrorMessage(s=>{let a=`Invalid scalar field ${s.red(`\`${n}\``)} for ${s.bold("include")} statement`;return i?a+=` on model ${s.bold(i.name)}. ${ut(s)}`:a+=".",a+=`
Note that ${s.bold("include")} statements only accept relation fields.`,a});}function xc(e,t,r){let n=t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();if(n){let i=n.getField("omit")?.value.asObject();if(i){bc(e,t,i);return}if(n.hasField("select")){Ec(e,t);return}}if(r?.[ie(e.outputType.name)]){Tc(e,t);return}t.addErrorMessage(()=>`Unknown field at "${e.selectionPath.join(".")} selection"`);}function bc(e,t,r){r.removeAllFields();for(let n of e.outputType.fields)r.addSuggestion(new $(n.name,"false"));t.addErrorMessage(n=>`The ${n.red("omit")} statement includes every field of the model ${n.bold(e.outputType.name)}. At least one field must be included in the result`);}function Ec(e,t){let r=e.outputType,n=t.arguments.getDeepSelectionParent(e.selectionPath)?.value,i=n?.isEmpty()??false;n&&(n.removeAllFields(),zi(n,r)),t.addErrorMessage(o=>i?`The ${o.red("`select`")} statement for type ${o.bold(r.name)} must not be empty. ${ut(o)}`:`The ${o.red("`select`")} statement for type ${o.bold(r.name)} needs ${o.bold("at least one truthy value")}.`);}function Tc(e,t){let r=new ct;for(let i of e.outputType.fields)i.isRelation||r.addField(i.name,"false");let n=new $("omit",r).makeRequired();if(e.selectionPath.length===0)t.arguments.addSuggestion(n);else {let[i,o]=Me(e.selectionPath),a=t.arguments.getDeepSelectionParent(i)?.value.asObject()?.getField(o);if(a){let l=a?.value.asObject()??new Fe;l.addSuggestion(n),a.value=l;}}t.addErrorMessage(i=>`The global ${i.red("omit")} configuration excludes every field of the model ${i.bold(e.outputType.name)}. At least one field must be included in the result`);}function Pc(e,t){let r=Zi(e.selectionPath,t);if(r.parentKind!=="unknown"){r.field.markAsError();let n=r.parent;switch(r.parentKind){case "select":zi(n,e.outputType);break;case "include":Mc(n,e.outputType);break;case "omit":Dc(n,e.outputType);break}}t.addErrorMessage(n=>{let i=[`Unknown field ${n.red(`\`${r.fieldName}\``)}`];return r.parentKind!=="unknown"&&i.push(`for ${n.bold(r.parentKind)} statement`),i.push(`on model ${n.bold(`\`${e.outputType.name}\``)}.`),i.push(ut(n)),i.join(" ")});}function Ac(e,t){let r=Zi(e.selectionPath,t);r.parentKind!=="unknown"&&r.field.value.markAsError(),t.addErrorMessage(n=>`Invalid value for selection field \`${n.red(r.fieldName)}\`: ${e.underlyingError}`);}function Sc(e,t){let r=e.argumentPath[0],n=t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();n&&(n.getField(r)?.markAsError(),Nc(n,e.arguments)),t.addErrorMessage(i=>Gi(i,r,e.arguments.map(o=>o.name)));}function vc(e,t){let[r,n]=Me(e.argumentPath),i=t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();if(i){i.getDeepField(e.argumentPath)?.markAsError();let o=i.getDeepFieldValue(r)?.asObject();o&&Yi(o,e.inputType);}t.addErrorMessage(o=>Gi(o,n,e.inputType.fields.map(s=>s.name)));}function Gi(e,t,r){let n=[`Unknown argument \`${e.red(t)}\`.`],i=Lc(t,r);return i&&n.push(`Did you mean \`${e.green(i)}\`?`),r.length>0&&n.push(ut(e)),n.join(" ")}function Cc(e,t){let r;t.addErrorMessage(l=>r?.value instanceof k&&r.value.text==="null"?`Argument \`${l.green(o)}\` must not be ${l.red("null")}.`:`Argument \`${l.green(o)}\` is missing.`);let n=t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();if(!n)return;let[i,o]=Me(e.argumentPath),s=new ct,a=n.getDeepFieldValue(i)?.asObject();if(a){if(r=a.getField(o),r&&a.removeField(o),e.inputTypes.length===1&&e.inputTypes[0].kind==="object"){for(let l of e.inputTypes[0].fields)s.addField(l.name,l.typeNames.join(" | "));a.addSuggestion(new $(o,s).makeRequired());}else {let l=e.inputTypes.map(Ki).join(" | ");a.addSuggestion(new $(o,l).makeRequired());}if(e.dependentArgumentPath){n.getDeepField(e.dependentArgumentPath)?.markAsError();let[,l]=Me(e.dependentArgumentPath);t.addErrorMessage(c=>`Argument \`${c.green(o)}\` is required because argument \`${c.green(l)}\` was provided.`);}}}function Ki(e){return e.kind==="list"?`${Ki(e.elementType)}[]`:e.name}function Rc(e,t){let r=e.argument.name,n=t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();n&&n.getDeepFieldValue(e.argumentPath)?.markAsError(),t.addErrorMessage(i=>{let o=Yt("or",e.argument.typeNames.map(s=>i.green(s)));return `Argument \`${i.bold(r)}\`: Invalid value provided. Expected ${o}, provided ${i.red(e.inferredType)}.`});}function kc(e,t){let r=e.argument.name,n=t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();n&&n.getDeepFieldValue(e.argumentPath)?.markAsError(),t.addErrorMessage(i=>{let o=[`Invalid value for argument \`${i.bold(r)}\``];if(e.underlyingError&&o.push(`: ${e.underlyingError}`),o.push("."),e.argument.typeNames.length>0){let s=Yt("or",e.argument.typeNames.map(a=>i.green(a)));o.push(` Expected ${s}.`);}return o.join("")});}function Oc(e,t){let r=e.argument.name,n=t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject(),i;if(n){let s=n.getDeepField(e.argumentPath)?.value;s?.markAsError(),s instanceof k&&(i=s.text);}t.addErrorMessage(o=>{let s=["Unable to fit value"];return i&&s.push(o.red(i)),s.push(`into a 64-bit signed integer for field \`${o.bold(r)}\``),s.join(" ")});}function Ic(e,t){let r=e.argumentPath[e.argumentPath.length-1],n=t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject();if(n){let i=n.getDeepFieldValue(e.argumentPath)?.asObject();i&&Yi(i,e.inputType);}t.addErrorMessage(i=>{let o=[`Argument \`${i.bold(r)}\` of type ${i.bold(e.inputType.name)} needs`];return e.constraints.minFieldCount===1?e.constraints.requiredFields?o.push(`${i.green("at least one of")} ${Yt("or",e.constraints.requiredFields.map(s=>`\`${i.bold(s)}\``))} arguments.`):o.push(`${i.green("at least one")} argument.`):o.push(`${i.green(`at least ${e.constraints.minFieldCount}`)} arguments.`),o.push(ut(i)),o.join(" ")});}function Fc(e,t){let r=e.argumentPath[e.argumentPath.length-1],n=t.arguments.getDeepSubSelectionValue(e.selectionPath)?.asObject(),i=[];if(n){let o=n.getDeepFieldValue(e.argumentPath)?.asObject();o&&(o.markAsError(),i=Object.keys(o.getFields()));}t.addErrorMessage(o=>{let s=[`Argument \`${o.bold(r)}\` of type ${o.bold(e.inputType.name)} needs`];return e.constraints.minFieldCount===1&&e.constraints.maxFieldCount==1?s.push(`${o.green("exactly one")} argument,`):e.constraints.maxFieldCount==1?s.push(`${o.green("at most one")} argument,`):s.push(`${o.green(`at most ${e.constraints.maxFieldCount}`)} arguments,`),s.push(`but you provided ${Yt("and",i.map(a=>o.red(a)))}. Please choose`),e.constraints.maxFieldCount===1?s.push("one."):s.push(`${e.constraints.maxFieldCount}.`),s.join(" ")});}function zi(e,t){for(let r of t.fields)e.hasField(r.name)||e.addSuggestion(new $(r.name,"true"));}function Mc(e,t){for(let r of t.fields)r.isRelation&&!e.hasField(r.name)&&e.addSuggestion(new $(r.name,"true"));}function Dc(e,t){for(let r of t.fields)!e.hasField(r.name)&&!r.isRelation&&e.addSuggestion(new $(r.name,"true"));}function Nc(e,t){for(let r of t)e.hasField(r.name)||e.addSuggestion(new $(r.name,r.typeNames.join(" | ")));}function Zi(e,t){let[r,n]=Me(e),i=t.arguments.getDeepSubSelectionValue(r)?.asObject();if(!i)return {parentKind:"unknown",fieldName:n};let o=i.getFieldValue("select")?.asObject(),s=i.getFieldValue("include")?.asObject(),a=i.getFieldValue("omit")?.asObject(),l=o?.getField(n);return o&&l?{parentKind:"select",parent:o,field:l,fieldName:n}:(l=s?.getField(n),s&&l?{parentKind:"include",field:l,parent:s,fieldName:n}:(l=a?.getField(n),a&&l?{parentKind:"omit",field:l,parent:a,fieldName:n}:{parentKind:"unknown",fieldName:n}))}function Yi(e,t){if(t.kind==="object")for(let r of t.fields)e.hasField(r.name)||e.addSuggestion(new $(r.name,r.typeNames.join(" | ")));}function Me(e){let t=[...e],r=t.pop();if(!r)throw new Error("unexpected empty path");return [t,r]}function ut({green:e,enabled:t}){return "Available options are "+(t?`listed in ${e("green")}`:"marked with ?")+"."}function Yt(e,t){if(t.length===1)return t[0];let r=[...t],n=r.pop();return `${r.join(", ")} ${e} ${n}`}var _c=3;function Lc(e,t){let r=1/0,n;for(let i of t){let o=(0, Wi.default)(e,i);o>_c||o<r&&(r=o,n=i);}return n}var eo=require$$1$8;var pt=class{modelName;name;typeName;isList;isEnum;constructor(t,r,n,i,o){this.modelName=t,this.name=r,this.typeName=n,this.isList=i,this.isEnum=o;}_toGraphQLInputType(){let t=this.isList?"List":"",r=this.isEnum?"Enum":"";return `${t}${r}${this.typeName}FieldRefInput<${this.modelName}>`}};function De(e){return e instanceof pt}var Xi=": ",Xt=class{constructor(t,r){this.name=t;this.value=r;}hasError=false;markAsError(){this.hasError=true;}getPrintWidth(){return this.name.length+this.value.getPrintWidth()+Xi.length}write(t){let r=new W(this.name);this.hasError&&r.underline().setColor(t.context.colors.red),t.write(r).write(Xi).write(this.value);}};var rn=class{arguments;errorMessages=[];constructor(t){this.arguments=t;}write(t){t.write(this.arguments);}addErrorMessage(t){this.errorMessages.push(t);}renderAllMessages(t){return this.errorMessages.map(r=>r(t)).join(`
`)}};function Ne(e){return new rn(to(e))}function to(e){let t=new Fe;for(let[r,n]of Object.entries(e)){let i=new Xt(r,ro(n));t.addField(i);}return t}function ro(e){if(typeof e=="string")return new k(JSON.stringify(e));if(typeof e=="number"||typeof e=="boolean")return new k(String(e));if(typeof e=="bigint")return new k(`${e}n`);if(e===null)return new k("null");if(e===void 0)return new k("undefined");if(Ce(e))return new k(`new Prisma.Decimal("${e.toFixed()}")`);if(e instanceof Uint8Array)return Buffer.isBuffer(e)?new k(`Buffer.alloc(${e.byteLength})`):new k(`new Uint8Array(${e.byteLength})`);if(e instanceof Date){let t=Qt(e)?e.toISOString():"Invalid Date";return new k(`new Date("${t}")`)}return e instanceof eo.ObjectEnumValue?new k(`Prisma.${e._getName()}`):De(e)?new k(`prisma.${ie(e.modelName)}.$fields.${e.name}`):Array.isArray(e)?$c(e):typeof e=="object"?to(e):new k(Object.prototype.toString.call(e))}function $c(e){let t=new Ie;for(let r of e)t.addItem(ro(r));return t}function er(e,t){let r=t==="pretty"?Ji:Zt,n=e.renderAllMessages(r),i=new ke(0,{colors:r}).write(e).toString();return {message:n,args:i}}function tr({args:e,errors:t,errorFormat:r,callsite:n,originalMethod:i,clientVersion:o,globalOmit:s}){let a=Ne(e);for(let p of t)Gt(p,a,s);let{message:l,args:c}=er(a,r),u=Wt({message:l,callsite:n,originalMethod:i,showColors:r==="pretty",callArguments:c});throw new no.PrismaClientValidationError(u,{clientVersion:o})}function G(e){return e.replace(/^./,t=>t.toLowerCase())}function oo(e,t,r){let n=G(r);return !t.result||!(t.result.$allModels||t.result[n])?e:qc({...e,...io(t.name,e,t.result.$allModels),...io(t.name,e,t.result[n])})}function qc(e){let t=new J,r=(n,i)=>t.getOrCreate(n,()=>i.has(n)?[n]:(i.add(n),e[n]?e[n].needs.flatMap(o=>r(o,i)):[n]));return Bt(e,n=>({...n,needs:r(n.name,new Set)}))}function io(e,t,r){return r?Bt(r,({needs:n,compute:i},o)=>({name:o,needs:n?Object.keys(n).filter(s=>n[s]):[],compute:Vc(t,o,i)})):{}}function Vc(e,t,r){let n=e?.[t]?.compute;return n?i=>r({...i,[t]:n(i)}):r}function so(e,t){if(!t)return e;let r={...e};for(let n of Object.values(t))if(e[n.name])for(let i of n.needs)r[i]=true;return r}function ao(e,t){if(!t)return e;let r={...e};for(let n of Object.values(t))if(!e[n.name])for(let i of n.needs)delete r[i];return r}var rr=class{constructor(t,r){this.extension=t;this.previous=r;}computedFieldsCache=new J;modelExtensionsCache=new J;queryCallbacksCache=new J;clientExtensions=ze(()=>this.extension.client?{...this.previous?.getAllClientExtensions(),...this.extension.client}:this.previous?.getAllClientExtensions());batchCallbacks=ze(()=>{let t=this.previous?.getAllBatchQueryCallbacks()??[],r=this.extension.query?.$__internalBatch;return r?t.concat(r):t});getAllComputedFields(t){return this.computedFieldsCache.getOrCreate(t,()=>oo(this.previous?.getAllComputedFields(t),this.extension,t))}getAllClientExtensions(){return this.clientExtensions.get()}getAllModelExtensions(t){return this.modelExtensionsCache.getOrCreate(t,()=>{let r=G(t);return !this.extension.model||!(this.extension.model[r]||this.extension.model.$allModels)?this.previous?.getAllModelExtensions(t):{...this.previous?.getAllModelExtensions(t),...this.extension.model.$allModels,...this.extension.model[r]}})}getAllQueryCallbacks(t,r){return this.queryCallbacksCache.getOrCreate(`${t}:${r}`,()=>{let n=this.previous?.getAllQueryCallbacks(t,r)??[],i=[],o=this.extension.query;return !o||!(o[t]||o.$allModels||o[r]||o.$allOperations)?n:(o[t]!==void 0&&(o[t][r]!==void 0&&i.push(o[t][r]),o[t].$allOperations!==void 0&&i.push(o[t].$allOperations)),t!=="$none"&&o.$allModels!==void 0&&(o.$allModels[r]!==void 0&&i.push(o.$allModels[r]),o.$allModels.$allOperations!==void 0&&i.push(o.$allModels.$allOperations)),o[r]!==void 0&&i.push(o[r]),o.$allOperations!==void 0&&i.push(o.$allOperations),n.concat(i))})}getAllBatchQueryCallbacks(){return this.batchCallbacks.get()}},_e=class e{constructor(t){this.head=t;}static empty(){return new e}static single(t){return new e(new rr(t))}isEmpty(){return this.head===void 0}append(t){return new e(new rr(t,this.head))}getAllComputedFields(t){return this.head?.getAllComputedFields(t)}getAllClientExtensions(){return this.head?.getAllClientExtensions()}getAllModelExtensions(t){return this.head?.getAllModelExtensions(t)}getAllQueryCallbacks(t,r){return this.head?.getAllQueryCallbacks(t,r)??[]}getAllBatchQueryCallbacks(){return this.head?.getAllBatchQueryCallbacks()??[]}};var nr=class{constructor(t){this.name=t;}};function lo(e){return e instanceof nr}function co(e){return new nr(e)}var uo=Symbol(),dt=class{constructor(t){if(t!==uo)throw new Error("Skip instance can not be constructed directly")}ifUndefined(t){return t===void 0?ir:t}},ir=new dt(uo);function K(e){return e instanceof dt}var Uc={findUnique:"findUnique",findUniqueOrThrow:"findUniqueOrThrow",findFirst:"findFirst",findFirstOrThrow:"findFirstOrThrow",findMany:"findMany",count:"aggregate",create:"createOne",createMany:"createMany",createManyAndReturn:"createManyAndReturn",update:"updateOne",updateMany:"updateMany",updateManyAndReturn:"updateManyAndReturn",upsert:"upsertOne",delete:"deleteOne",deleteMany:"deleteMany",executeRaw:"executeRaw",queryRaw:"queryRaw",aggregate:"aggregate",groupBy:"groupBy",runCommandRaw:"runCommandRaw",findRaw:"findRaw",aggregateRaw:"aggregateRaw"},po="explicitly `undefined` values are not allowed";function or({modelName:e,action:t,args:r,runtimeDataModel:n,extensions:i=_e.empty(),callsite:o,clientMethod:s,errorFormat:a,clientVersion:l,previewFeatures:c,globalOmit:u}){let p=new nn({runtimeDataModel:n,modelName:e,action:t,rootArgs:r,callsite:o,extensions:i,selectionPath:[],argumentPath:[],originalMethod:s,errorFormat:a,clientVersion:l,previewFeatures:c,globalOmit:u});return {modelName:e,action:Uc[t],query:mt(r,p)}}function mt({select:e,include:t,...r}={},n){let i=r.omit;return delete r.omit,{arguments:fo(r,n),selection:jc(e,t,i,n)}}function jc(e,t,r,n){return e?(t?n.throwValidationError({kind:"MutuallyExclusiveFields",firstField:"include",secondField:"select",selectionPath:n.getSelectionPath()}):r&&n.throwValidationError({kind:"MutuallyExclusiveFields",firstField:"omit",secondField:"select",selectionPath:n.getSelectionPath()}),Jc(e,n)):Bc(n,t,r)}function Bc(e,t,r){let n={};return e.modelOrType&&!e.isRawAction()&&(n.$composites=true,n.$scalars=true),t&&Qc(n,t,e),Hc(n,r,e),n}function Qc(e,t,r){for(let[n,i]of Object.entries(t)){if(K(i))continue;let o=r.nestSelection(n);if(on(i,o),i===false||i===void 0){e[n]=false;continue}let s=r.findField(n);if(s&&s.kind!=="object"&&r.throwValidationError({kind:"IncludeOnScalar",selectionPath:r.getSelectionPath().concat(n),outputType:r.getOutputTypeDescription()}),s){e[n]=mt(i===true?{}:i,o);continue}if(i===true){e[n]=true;continue}e[n]=mt(i,o);}}function Hc(e,t,r){let n=r.getComputedFields(),i={...r.getGlobalOmit(),...t},o=ao(i,n);for(let[s,a]of Object.entries(o)){if(K(a))continue;on(a,r.nestSelection(s));let l=r.findField(s);n?.[s]&&!l||(e[s]=!a);}}function Jc(e,t){let r={},n=t.getComputedFields(),i=so(e,n);for(let[o,s]of Object.entries(i)){if(K(s))continue;let a=t.nestSelection(o);on(s,a);let l=t.findField(o);if(!(n?.[o]&&!l)){if(s===false||s===void 0||K(s)){r[o]=false;continue}if(s===true){l?.kind==="object"?r[o]=mt({},a):r[o]=true;continue}r[o]=mt(s,a);}}return r}function mo(e,t){if(e===null)return null;if(typeof e=="string"||typeof e=="number"||typeof e=="boolean")return e;if(typeof e=="bigint")return {$type:"BigInt",value:String(e)};if(ve(e)){if(Qt(e))return {$type:"DateTime",value:e.toISOString()};t.throwValidationError({kind:"InvalidArgumentValue",selectionPath:t.getSelectionPath(),argumentPath:t.getArgumentPath(),argument:{name:t.getArgumentName(),typeNames:["Date"]},underlyingError:"Provided Date object is invalid"});}if(lo(e))return {$type:"Param",value:e.name};if(De(e))return {$type:"FieldRef",value:{_ref:e.name,_container:e.modelName}};if(Array.isArray(e))return Wc(e,t);if(ArrayBuffer.isView(e)){let{buffer:r,byteOffset:n,byteLength:i}=e;return {$type:"Bytes",value:Buffer.from(r,n,i).toString("base64")}}if(Gc(e))return e.values;if(Ce(e))return {$type:"Decimal",value:e.toFixed()};if(e instanceof se.ObjectEnumValue){if(!(0, se.isDbNull)(e)&&!(0, se.isJsonNull)(e)&&!(0, se.isAnyNull)(e))throw new Error("Invalid ObjectEnumValue");return {$type:"Enum",value:e._getName()}}if(Kc(e))return e.toJSON();if(typeof e=="object")return fo(e,t);t.throwValidationError({kind:"InvalidArgumentValue",selectionPath:t.getSelectionPath(),argumentPath:t.getArgumentPath(),argument:{name:t.getArgumentName(),typeNames:[]},underlyingError:`We could not serialize ${Object.prototype.toString.call(e)} value. Serialize the object to JSON or implement a ".toJSON()" method on it`});}function fo(e,t){if(e.$type)return {$type:"Raw",value:e};let r={};for(let n in e){let i=e[n],o=t.nestArgument(n);K(i)||(i!==void 0?r[n]=mo(i,o):t.isPreviewFeatureOn("strictUndefinedChecks")&&t.throwValidationError({kind:"InvalidArgumentValue",argumentPath:o.getArgumentPath(),selectionPath:t.getSelectionPath(),argument:{name:t.getArgumentName(),typeNames:[]},underlyingError:po}));}return r}function Wc(e,t){let r=[];for(let n=0;n<e.length;n++){let i=t.nestArgument(String(n)),o=e[n];if(o===void 0||K(o)){let s=o===void 0?"undefined":"Prisma.skip";t.throwValidationError({kind:"InvalidArgumentValue",selectionPath:i.getSelectionPath(),argumentPath:i.getArgumentPath(),argument:{name:`${t.getArgumentName()}[${n}]`,typeNames:[]},underlyingError:`Can not use \`${s}\` value within array. Use \`null\` or filter out \`${s}\` values`});}r.push(mo(o,i));}return r}function Gc(e){return typeof e=="object"&&e!==null&&e.__prismaRawParameters__===true}function Kc(e){return typeof e=="object"&&e!==null&&typeof e.toJSON=="function"}function on(e,t){e===void 0&&t.isPreviewFeatureOn("strictUndefinedChecks")&&t.throwValidationError({kind:"InvalidSelectionValue",selectionPath:t.getSelectionPath(),underlyingError:po});}var nn=class e{constructor(t){this.params=t;this.params.modelName&&(this.modelOrType=this.params.runtimeDataModel.models[this.params.modelName]??this.params.runtimeDataModel.types[this.params.modelName]);}modelOrType;throwValidationError(t){tr({errors:[t],originalMethod:this.params.originalMethod,args:this.params.rootArgs??{},callsite:this.params.callsite,errorFormat:this.params.errorFormat,clientVersion:this.params.clientVersion,globalOmit:this.params.globalOmit});}getSelectionPath(){return this.params.selectionPath}getArgumentPath(){return this.params.argumentPath}getArgumentName(){return this.params.argumentPath[this.params.argumentPath.length-1]}getOutputTypeDescription(){if(!(!this.params.modelName||!this.modelOrType))return {name:this.params.modelName,fields:this.modelOrType.fields.map(t=>({name:t.name,typeName:"boolean",isRelation:t.kind==="object"}))}}isRawAction(){return ["executeRaw","queryRaw","runCommandRaw","findRaw","aggregateRaw"].includes(this.params.action)}isPreviewFeatureOn(t){return this.params.previewFeatures.includes(t)}getComputedFields(){if(this.params.modelName)return this.params.extensions.getAllComputedFields(this.params.modelName)}findField(t){return this.modelOrType?.fields.find(r=>r.name===t)}nestSelection(t){let r=this.findField(t),n=r?.kind==="object"?r.type:void 0;return new e({...this.params,modelName:n,selectionPath:this.params.selectionPath.concat(t)})}getGlobalOmit(){return this.params.modelName&&this.shouldApplyGlobalOmit()?this.params.globalOmit?.[ie(this.params.modelName)]??{}:{}}shouldApplyGlobalOmit(){switch(this.params.action){case "findFirst":case "findFirstOrThrow":case "findUniqueOrThrow":case "findMany":case "upsert":case "findUnique":case "createManyAndReturn":case "create":case "update":case "updateManyAndReturn":case "delete":return  true;case "executeRaw":case "aggregateRaw":case "runCommandRaw":case "findRaw":case "createMany":case "deleteMany":case "groupBy":case "updateMany":case "count":case "aggregate":case "queryRaw":return  false;default:X(this.params.action,"Unknown action");}}nestArgument(t){return new e({...this.params,argumentPath:this.params.argumentPath.concat(t)})}};function go(e,t){let r=ze(()=>zc(t));Object.defineProperty(e,"dmmf",{get:()=>r.get()});}function zc(e){return {datamodel:{models:sn(e.models),enums:sn(e.enums),types:sn(e.types)}}}function sn(e){return Object.entries(e).map(([t,r])=>({name:t,...r}))}var an=new WeakMap,sr="$$PrismaTypedSql",ft=class{constructor(t,r){an.set(this,{sql:t,values:r}),Object.defineProperty(this,sr,{value:sr});}get sql(){return an.get(this).sql}get values(){return an.get(this).values}};function yo(e){return (...t)=>new ft(e,t)}function ar(e){return e!=null&&e[sr]===sr}var pl=require$$1$8;var dl=require$$0$8,ml=require$$5$2;function gt(e){return {getKeys(){return Object.keys(e)},getPropertyValue(t){return e[t]}}}function D(e,t){return {getKeys(){return [e]},getPropertyValue(){return t()}}}function fe(e){let t=new J;return {getKeys(){return e.getKeys()},getPropertyValue(r){return t.getOrCreate(r,()=>e.getPropertyValue(r))},getPropertyDescriptor(r){return e.getPropertyDescriptor?.(r)}}}var lr={enumerable:true,configurable:true,writable:true};function cr(e){let t=new Set(e);return {getPrototypeOf:()=>Object.prototype,getOwnPropertyDescriptor:()=>lr,has:(r,n)=>t.has(n),set:(r,n,i)=>t.add(n)&&Reflect.set(r,n,i),ownKeys:()=>[...t]}}var ho=Symbol.for("nodejs.util.inspect.custom");function Q(e,t){let r=Zc(t),n=new Set,i=new Proxy(e,{get(o,s){if(n.has(s))return o[s];let a=r.get(s);return a?a.getPropertyValue(s):o[s]},has(o,s){if(n.has(s))return  true;let a=r.get(s);return a?a.has?.(s)??true:Reflect.has(o,s)},ownKeys(o){let s=wo(Reflect.ownKeys(o),r),a=wo(Array.from(r.keys()),r);return [...new Set([...s,...a,...n])]},set(o,s,a){return r.get(s)?.getPropertyDescriptor?.(s)?.writable===false?false:(n.add(s),Reflect.set(o,s,a))},getOwnPropertyDescriptor(o,s){let a=Reflect.getOwnPropertyDescriptor(o,s);if(a&&!a.configurable)return a;let l=r.get(s);return l?l.getPropertyDescriptor?{...lr,...l?.getPropertyDescriptor(s)}:lr:a},defineProperty(o,s,a){return n.add(s),Reflect.defineProperty(o,s,a)},getPrototypeOf:()=>Object.prototype});return i[ho]=function(){let o={...this};return delete o[ho],o},i}function Zc(e){let t=new Map;for(let r of e){let n=r.getKeys();for(let i of n)t.set(i,r);}return t}function wo(e,t){return e.filter(r=>t.get(r)?.has?.(r)??true)}function Le(e){return {getKeys(){return e},has(){return  false},getPropertyValue(){}}}function xo(e){if(e===void 0)return "";let t=Ne(e);return new ke(0,{colors:Zt}).write(t).toString()}var yt="<unknown>";function bo(e){var t=e.split(`
`);return t.reduce(function(r,n){var i=eu(n)||ru(n)||ou(n)||cu(n)||au(n);return i&&r.push(i),r},[])}var Yc=/^\s*at (.*?) ?\(((?:file|https?|blob|chrome-extension|native|eval|webpack|rsc|<anonymous>|\/|[a-z]:\\|\\\\).*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i,Xc=/\((\S*)(?::(\d+))(?::(\d+))\)/;function eu(e){var t=Yc.exec(e);if(!t)return null;var r=t[2]&&t[2].indexOf("native")===0,n=t[2]&&t[2].indexOf("eval")===0,i=Xc.exec(t[2]);return n&&i!=null&&(t[2]=i[1],t[3]=i[2],t[4]=i[3]),{file:r?null:t[2],methodName:t[1]||yt,arguments:r?[t[2]]:[],lineNumber:t[3]?+t[3]:null,column:t[4]?+t[4]:null}}var tu=/^\s*at (?:((?:\[object object\])?.+) )?\(?((?:file|ms-appx|https?|webpack|rsc|blob):.*?):(\d+)(?::(\d+))?\)?\s*$/i;function ru(e){var t=tu.exec(e);return t?{file:t[2],methodName:t[1]||yt,arguments:[],lineNumber:+t[3],column:t[4]?+t[4]:null}:null}var nu=/^\s*(.*?)(?:\((.*?)\))?(?:^|@)((?:file|https?|blob|chrome|webpack|rsc|resource|\[native).*?|[^@]*bundle)(?::(\d+))?(?::(\d+))?\s*$/i,iu=/(\S+) line (\d+)(?: > eval line \d+)* > eval/i;function ou(e){var t=nu.exec(e);if(!t)return null;var r=t[3]&&t[3].indexOf(" > eval")>-1,n=iu.exec(t[3]);return r&&n!=null&&(t[3]=n[1],t[4]=n[2],t[5]=null),{file:t[3],methodName:t[1]||yt,arguments:t[2]?t[2].split(","):[],lineNumber:t[4]?+t[4]:null,column:t[5]?+t[5]:null}}var su=/^\s*(?:([^@]*)(?:\((.*?)\))?@)?(\S.*?):(\d+)(?::(\d+))?\s*$/i;function au(e){var t=su.exec(e);return t?{file:t[3],methodName:t[1]||yt,arguments:[],lineNumber:+t[4],column:t[5]?+t[5]:null}:null}var lu=/^\s*at (?:((?:\[object object\])?[^\\/]+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;function cu(e){var t=lu.exec(e);return t?{file:t[2],methodName:t[1]||yt,arguments:[],lineNumber:+t[3],column:t[4]?+t[4]:null}:null}var ln=class{getLocation(){return null}},cn=class{_error;constructor(){this._error=new Error;}getLocation(){let t=this._error.stack;if(!t)return null;let n=bo(t).find(i=>{if(!i.file)return  false;let o=zr(i.file);return o!=="<anonymous>"&&!o.includes("@prisma")&&!o.includes("/packages/client/src/runtime/")&&!o.endsWith("/runtime/client.js")&&!o.startsWith("internal/")&&!i.methodName.includes("new ")&&!i.methodName.includes("getCallSite")&&!i.methodName.includes("Proxy.")&&i.methodName.split(".").length<4});return !n||!n.file?null:{fileName:n.file,lineNumber:n.lineNumber,columnNumber:n.column}}};function ae(e){return e==="minimal"?typeof $EnabledCallSite=="function"&&e!=="minimal"?new $EnabledCallSite:new ln:new cn}var Eo={_avg:true,_count:true,_sum:true,_min:true,_max:true};function $e(e={}){let t=pu(e);return Object.entries(t).reduce((n,[i,o])=>(Eo[i]!==void 0?n.select[i]={select:o}:n[i]=o,n),{select:{}})}function pu(e={}){return typeof e._count=="boolean"?{...e,_count:{_all:e._count}}:e}function ur(e={}){return t=>(typeof e._count=="boolean"&&(t._count=t._count._all),t)}function To(e,t){let r=ur(e);return t({action:"aggregate",unpacker:r,argsMapper:$e})(e)}function du(e={}){let{select:t,...r}=e;return typeof t=="object"?$e({...r,_count:t}):$e({...r,_count:{_all:true}})}function mu(e={}){return typeof e.select=="object"?t=>ur(e)(t)._count:t=>ur(e)(t)._count._all}function Po(e,t){return t({action:"count",unpacker:mu(e),argsMapper:du})(e)}function fu(e={}){let t=$e(e);if(Array.isArray(t.by))for(let r of t.by)typeof r=="string"&&(t.select[r]=true);else typeof t.by=="string"&&(t.select[t.by]=true);return t}function gu(e={}){return t=>(typeof e?._count=="boolean"&&t.forEach(r=>{r._count=r._count._all;}),t)}function Ao(e,t){return t({action:"groupBy",unpacker:gu(e),argsMapper:fu})(e)}function So(e,t,r){if(t==="aggregate")return n=>To(n,r);if(t==="count")return n=>Po(n,r);if(t==="groupBy")return n=>Ao(n,r)}function vo(e,t){let r=t.fields.filter(i=>!i.relationName),n=ui(r,"name");return new Proxy({},{get(i,o){if(o in i||typeof o=="symbol")return i[o];let s=n[o];if(s)return new pt(e,o,s.type,s.isList,s.kind==="enum")},...cr(Object.keys(n))})}var Co=e=>Array.isArray(e)?e:e.split("."),un=(e,t)=>Co(t).reduce((r,n)=>r&&r[n],e),Ro=(e,t,r)=>Co(t).reduceRight((n,i,o,s)=>Object.assign({},un(e,s.slice(0,o)),{[i]:n}),r);function yu(e,t){return e===void 0||t===void 0?[]:[...t,"select",e]}function hu(e,t,r){return t===void 0?e??{}:Ro(t,r,e||true)}function pn(e,t,r,n,i,o){let a=e._runtimeDataModel.models[t].fields.reduce((l,c)=>({...l,[c.name]:c}),{});return l=>{let c=ae(e._errorFormat),u=yu(n,i),p=hu(l,o,u),y=r({dataPath:u,callsite:c})(p),h=wu(e,t);return new Proxy(y,{get(g,E){if(!h.includes(E))return g[E];let re=[a[E].type,r,E],R=[u,p];return pn(e,...re,...R)},...cr([...h,...Object.getOwnPropertyNames(y)])})}}function wu(e,t){return e._runtimeDataModel.models[t].fields.filter(r=>r.kind==="object").map(r=>r.name)}var xu=["findUnique","findUniqueOrThrow","findFirst","findFirstOrThrow","create","update","upsert","delete"],bu=["aggregate","count","groupBy"];function dn(e,t){let r=e._extensions.getAllModelExtensions(t)??{},n=[Eu(e,t),Pu(e,t),gt(r),D("name",()=>t),D("$name",()=>t),D("$parent",()=>e._appliedParent)];return Q({},n)}function Eu(e,t){let r=G(t),n=Object.keys(Re).concat("count");return {getKeys(){return n},getPropertyValue(i){let o=i,s=a=>l=>{let c=ae(e._errorFormat);return e._createPrismaPromise(u=>{let p={args:l,dataPath:[],action:o,model:t,clientMethod:`${r}.${i}`,jsModelName:r,transaction:u,callsite:c};return e._request({...p,...a})},{action:o,args:l,model:t})};return xu.includes(o)?pn(e,t,s):Tu(i)?So(e,i,s):s({})}}}function Tu(e){return bu.includes(e)}function Pu(e,t){return fe(D("fields",()=>{let r=e._runtimeDataModel.models[t];return vo(t,r)}))}function ko(e){return e.replace(/^./,t=>t.toUpperCase())}var mn=Symbol();function ht(e){let t=[Au(e),Su(e),D(mn,()=>e),D("$parent",()=>e._appliedParent)],r=e._extensions.getAllClientExtensions();return r&&t.push(gt(r)),Q(e,t)}function Au(e){let t=Object.getPrototypeOf(e._originalClient),r=[...new Set(Object.getOwnPropertyNames(t))];return {getKeys(){return r},getPropertyValue(n){return e[n]}}}function Su(e){let t=Object.keys(e._runtimeDataModel.models),r=t.map(G),n=[...new Set(t.concat(r))];return fe({getKeys(){return n},getPropertyValue(i){let o=ko(i);if(e._runtimeDataModel.models[o]!==void 0)return dn(e,o);if(e._runtimeDataModel.models[i]!==void 0)return dn(e,i)},getPropertyDescriptor(i){if(!r.includes(i))return {enumerable:false}}})}function Oo(e){return e[mn]?e[mn]:e}function Io(e){if(typeof e=="function")return e(this);let t=Object.create(this._originalClient,{_extensions:{value:this._extensions.append(e)},_appliedParent:{value:this,configurable:true},$on:{value:void 0}});return ht(t)}function Fo({result:e,modelName:t,select:r,omit:n,extensions:i}){let o=i.getAllComputedFields(t);if(!o)return e;let s=[],a=[];for(let l of Object.values(o)){if(n){if(n[l.name])continue;let c=l.needs.filter(u=>n[u]);c.length>0&&a.push(Le(c));}else if(r){if(!r[l.name])continue;let c=l.needs.filter(u=>!r[u]);c.length>0&&a.push(Le(c));}vu(e,l.needs)&&s.push(Cu(l,Q(e,s)));}return s.length>0||a.length>0?Q(e,[...s,...a]):e}function vu(e,t){return t.every(r=>Zr(e,r))}function Cu(e,t){return fe(D(e.name,()=>e.compute(t)))}function pr({visitor:e,result:t,args:r,runtimeDataModel:n,modelName:i}){if(Array.isArray(t)){for(let s=0;s<t.length;s++)t[s]=pr({result:t[s],args:r,modelName:i,runtimeDataModel:n,visitor:e});return t}let o=e(t,i,r)??t;return r.include&&Mo({includeOrSelect:r.include,result:o,parentModelName:i,runtimeDataModel:n,visitor:e}),r.select&&Mo({includeOrSelect:r.select,result:o,parentModelName:i,runtimeDataModel:n,visitor:e}),o}function Mo({includeOrSelect:e,result:t,parentModelName:r,runtimeDataModel:n,visitor:i}){for(let[o,s]of Object.entries(e)){if(!s||t[o]==null||K(s))continue;let l=n.models[r].fields.find(u=>u.name===o);if(!l||l.kind!=="object"||!l.relationName)continue;let c=typeof s=="object"?s:{};t[o]=pr({visitor:i,result:t[o],args:c,modelName:l.type,runtimeDataModel:n});}}function Do({result:e,modelName:t,args:r,extensions:n,runtimeDataModel:i,globalOmit:o}){return n.isEmpty()||e==null||typeof e!="object"||!i.models[t]?e:pr({result:e,args:r??{},modelName:t,runtimeDataModel:i,visitor:(a,l,c)=>{let u=G(l);return Fo({result:a,modelName:u,select:c.select,omit:c.select?void 0:{...o?.[u],...c.omit},extensions:n})}})}var ge=require$$1$8;var Ru=["$connect","$disconnect","$on","$transaction","$extends"],No=Ru;function _o(e){if(e instanceof ge.Sql)return ku(e);if(ar(e))return Ou(e);if(Array.isArray(e)){let r=[e[0]];for(let n=1;n<e.length;n++)r[n]=wt(e[n]);return r}let t={};for(let r in e)t[r]=wt(e[r]);return t}function ku(e){return new ge.Sql(e.strings,e.values)}function Ou(e){return new ft(e.sql,e.values)}function wt(e){if(typeof e!="object"||e==null||e instanceof ge.ObjectEnumValue||De(e))return e;if(Ce(e))return new ge.Decimal(e.toFixed());if(ve(e))return new Date(+e);if(ArrayBuffer.isView(e))return e.slice(0);if(Array.isArray(e)){let t=e.length,r;for(r=Array(t);t--;)r[t]=wt(e[t]);return r}if(typeof e=="object"){let t={};for(let r in e)r==="__proto__"?Object.defineProperty(t,r,{value:wt(e[r]),configurable:true,enumerable:true,writable:true}):t[r]=wt(e[r]);return t}X(e,"Unknown value");}function $o(e,t,r,n=0){return e._createPrismaPromise(i=>{let o=t.customDataProxyFetch;return "transaction"in t&&i!==void 0&&(t.transaction?.kind==="batch"&&t.transaction.lock.then(),t.transaction=i),n===r.length?e._executeRequest(t):r[n]({model:t.model,operation:t.model?t.action:t.clientMethod,args:_o(t.args??{}),__internalParams:t,query:(s,a=t)=>{let l=a.customDataProxyFetch;return a.customDataProxyFetch=jo(o,l),a.args=s,$o(e,a,r,n+1)}})})}function qo(e,t){let{jsModelName:r,action:n,clientMethod:i}=t,o=r?n:i;if(e._extensions.isEmpty())return e._executeRequest(t);let s=e._extensions.getAllQueryCallbacks(r??"$none",o);return $o(e,t,s)}function Vo(e){return t=>{let r={requests:t},n=t[0].extensions.getAllBatchQueryCallbacks();return n.length?Uo(r,n,0,e):e(r)}}function Uo(e,t,r,n){if(r===t.length)return n(e);let i=e.customDataProxyFetch,o=e.requests[0].transaction;return t[r]({args:{queries:e.requests.map(s=>({model:s.modelName,operation:s.action,args:s.args})),transaction:o?{isolationLevel:o.kind==="batch"?o.isolationLevel:void 0}:void 0},__internalParams:e,query(s,a=e){let l=a.customDataProxyFetch;return a.customDataProxyFetch=jo(i,l),Uo(a,t,r+1,n)}})}var Lo=e=>e;function jo(e=Lo,t=Lo){return r=>e(t(r))}var Go=require$$1$8;var xt=require$$1$8;function b(e,t){throw new Error(t)}function fn(e,t){return e===t||e!==null&&t!==null&&typeof e=="object"&&typeof t=="object"&&Object.keys(e).length===Object.keys(t).length&&Object.keys(e).every(r=>fn(e[r],t[r]))}function qe(e,t){let r=Object.keys(e),n=Object.keys(t);return (r.length<n.length?r:n).every(o=>{if(typeof e[o]==typeof t[o]&&typeof e[o]!="object")return e[o]===t[o];if(xt.Decimal.isDecimal(e[o])||xt.Decimal.isDecimal(t[o])){let s=Bo(e[o]),a=Bo(t[o]);return s&&a&&s.equals(a)}else if(e[o]instanceof Uint8Array||t[o]instanceof Uint8Array){let s=Qo(e[o]),a=Qo(t[o]);return s&&a&&s.equals(a)}else {if(e[o]instanceof Date||t[o]instanceof Date)return Ho(e[o])?.getTime()===Ho(t[o])?.getTime();if(typeof e[o]=="bigint"||typeof t[o]=="bigint")return Jo(e[o])===Jo(t[o]);if(typeof e[o]=="number"||typeof t[o]=="number")return Wo(e[o])===Wo(t[o])}return fn(e[o],t[o])})}function Bo(e){return xt.Decimal.isDecimal(e)?e:typeof e=="number"||typeof e=="string"?new xt.Decimal(e):void 0}function Qo(e){return Buffer.isBuffer(e)?e:e instanceof Uint8Array?Buffer.from(e.buffer,e.byteOffset,e.byteLength):typeof e=="string"?Buffer.from(e,"base64"):void 0}function Ho(e){return e instanceof Date?e:typeof e=="string"||typeof e=="number"?new Date(e):void 0}function Jo(e){return typeof e=="bigint"?e:typeof e=="number"||typeof e=="string"?BigInt(e):void 0}function Wo(e){return typeof e=="number"?e:typeof e=="string"?Number(e):void 0}function bt(e){return JSON.stringify(e,(t,r)=>typeof r=="bigint"?r.toString():ArrayBuffer.isView(r)?Buffer.from(r.buffer,r.byteOffset,r.byteLength).toString("base64"):r)}function Iu(e){return e!==null&&typeof e=="object"&&typeof e.$type=="string"}function Fu(e,t){let r={};for(let n of Object.keys(e))r[n]=t(e[n],n);return r}function le(e){return e===null?e:Array.isArray(e)?e.map(le):typeof e=="object"?Iu(e)?Mu(e):e.constructor!==null&&e.constructor.name!=="Object"?e:Fu(e,le):e}function Mu({$type:e,value:t}){switch(e){case "BigInt":return BigInt(t);case "Bytes":{let{buffer:r,byteOffset:n,byteLength:i}=Buffer.from(t,"base64");return new Uint8Array(r,n,i)}case "DateTime":return new Date(t);case "Decimal":return new Go.Decimal(t);case "Json":return JSON.parse(t);default:b(t,"Unknown tagged value");}}function dr(e){return e.name==="DriverAdapterError"&&typeof e.cause=="object"}var d={Int32:0,Int64:1,Float:2,Double:3,Numeric:4,Boolean:5,Character:6,Text:7,Date:8,Time:9,DateTime:10,Json:11,Enum:12,Bytes:13,Set:14,Uuid:15,Int32Array:64,Int64Array:65,FloatArray:66,DoubleArray:67,NumericArray:68,BooleanArray:69,CharacterArray:70,TextArray:71,DateArray:72,TimeArray:73,DateTimeArray:74,JsonArray:75,EnumArray:76,BytesArray:77,UuidArray:78,UnknownNumber:128};var N=class extends Error{name="UserFacingError";code;meta;constructor(t,r,n){super(t),this.code=r,this.meta=n??{};}toQueryResponseErrorObject(){return {error:this.message,user_facing_error:{is_panic:false,message:this.message,meta:this.meta,error_code:this.code}}}};function Ve(e){if(!dr(e))throw e;let t=Du(e),r=Ko(e);throw !t||!r?e:new N(r,t,{driverAdapterError:e})}function yn(e){throw dr(e)?new N(`Raw query failed. Code: \`${e.cause.originalCode??"N/A"}\`. Message: \`${e.cause.originalMessage??Ko(e)}\``,"P2010",{driverAdapterError:e}):e}function Du(e){switch(e.cause.kind){case "AuthenticationFailed":return "P1000";case "DatabaseNotReachable":return "P1001";case "DatabaseDoesNotExist":return "P1003";case "SocketTimeout":return "P1008";case "DatabaseAlreadyExists":return "P1009";case "DatabaseAccessDenied":return "P1010";case "TlsConnectionError":return "P1011";case "ConnectionClosed":return "P1017";case "TransactionAlreadyClosed":return "P1018";case "LengthMismatch":return "P2000";case "UniqueConstraintViolation":return "P2002";case "ForeignKeyConstraintViolation":return "P2003";case "UnsupportedNativeDataType":return "P2010";case "NullConstraintViolation":return "P2011";case "ValueOutOfRange":return "P2020";case "TableDoesNotExist":return "P2021";case "ColumnNotFound":return "P2022";case "InvalidIsolationLevel":case "InconsistentColumnData":return "P2023";case "MissingFullTextSearchIndex":return "P2030";case "TransactionWriteConflict":return "P2034";case "GenericJs":return "P2036";case "TooManyConnections":return "P2037";case "postgres":case "sqlite":case "mysql":case "mssql":return;default:b(e.cause,`Unknown error: ${e.cause}`);}}function Ko(e){switch(e.cause.kind){case "AuthenticationFailed":return `Authentication failed against the database server, the provided database credentials for \`${e.cause.user??"(not available)"}\` are not valid`;case "DatabaseNotReachable":{let t=e.cause.host&&e.cause.port?`${e.cause.host}:${e.cause.port}`:e.cause.host;return `Can't reach database server${t?` at ${t}`:""}`}case "DatabaseDoesNotExist":return `Database \`${e.cause.db??"(not available)"}\` does not exist on the database server`;case "SocketTimeout":return "Operation has timed out";case "DatabaseAlreadyExists":return `Database \`${e.cause.db??"(not available)"}\` already exists on the database server`;case "DatabaseAccessDenied":return `User was denied access on the database \`${e.cause.db??"(not available)"}\``;case "TlsConnectionError":return `Error opening a TLS connection: ${e.cause.reason}`;case "ConnectionClosed":return "Server has closed the connection.";case "TransactionAlreadyClosed":return e.cause.cause;case "LengthMismatch":return `The provided value for the column is too long for the column's type. Column: ${e.cause.column??"(not available)"}`;case "UniqueConstraintViolation":return `Unique constraint failed on the ${gn(e.cause.constraint)}`;case "ForeignKeyConstraintViolation":return `Foreign key constraint violated on the ${gn(e.cause.constraint)}`;case "UnsupportedNativeDataType":return `Failed to deserialize column of type '${e.cause.type}'. If you're using $queryRaw and this column is explicitly marked as \`Unsupported\` in your Prisma schema, try casting this column to any supported Prisma type such as \`String\`.`;case "NullConstraintViolation":return `Null constraint violation on the ${gn(e.cause.constraint)}`;case "ValueOutOfRange":return `Value out of range for the type: ${e.cause.cause}`;case "TableDoesNotExist":return `The table \`${e.cause.table??"(not available)"}\` does not exist in the current database.`;case "ColumnNotFound":return `The column \`${e.cause.column??"(not available)"}\` does not exist in the current database.`;case "InvalidIsolationLevel":return `Error in connector: Conversion error: ${e.cause.level}`;case "InconsistentColumnData":return `Inconsistent column data: ${e.cause.cause}`;case "MissingFullTextSearchIndex":return "Cannot find a fulltext index to use for the native search, try adding a @@fulltext([Fields...]) to your schema";case "TransactionWriteConflict":return "Transaction failed due to a write conflict or a deadlock. Please retry your transaction";case "GenericJs":return `Error in external connector (id ${e.cause.id})`;case "TooManyConnections":return `Too many database connections opened: ${e.cause.cause}`;case "sqlite":case "postgres":case "mysql":case "mssql":return;default:b(e.cause,`Unknown error: ${e.cause}`);}}function gn(e){return e&&"fields"in e?`fields: (${e.fields.map(t=>`\`${t}\``).join(", ")})`:e&&"index"in e?`constraint: \`${e.index}\``:e&&"foreignKey"in e?"foreign key":"(not available)"}function zo(e,t){let r=e.map(i=>t.keys.reduce((o,s)=>(o[s]=le(i[s]),o),{})),n=new Set(t.nestedSelection);return t.arguments.map(i=>{let o=r.findIndex(s=>qe(s,i));if(o===-1)return t.expectNonEmpty?new N("An operation failed because it depends on one or more records that were required but not found","P2025"):null;{let s=Object.entries(e[o]).filter(([a])=>n.has(a));return Object.fromEntries(s)}})}var Yo=require$$1$8;var A=class extends Error{name="DataMapperError"};function Xo(e,t,r){switch(t.type){case "affectedRows":if(typeof e!="number")throw new A(`Expected an affected rows count, got: ${typeof e} (${e})`);return {count:e};case "object":return wn(e,t.fields,r,t.skipNulls);case "field":return hn(e,"<result>",t.fieldType,r);default:b(t,`Invalid data mapping type: '${t.type}'`);}}function wn(e,t,r,n){if(e===null)return null;if(Array.isArray(e)){let i=e;return n&&(i=i.filter(o=>o!==null)),i.map(o=>Zo(o,t,r))}if(typeof e=="object")return Zo(e,t,r);if(typeof e=="string"){let i;try{i=JSON.parse(e);}catch(o){throw new A("Expected an array or object, got a string that is not valid JSON",{cause:o})}return wn(i,t,r,n)}throw new A(`Expected an array or an object, got: ${typeof e}`)}function Zo(e,t,r){if(typeof e!="object")throw new A(`Expected an object, but got '${typeof e}'`);let n={};for(let[i,o]of Object.entries(t))switch(o.type){case "affectedRows":throw new A(`Unexpected 'AffectedRows' node in data mapping for field '${i}'`);case "object":{if(o.serializedName!==null&&!Object.hasOwn(e,o.serializedName))throw new A(`Missing data field (Object): '${i}'; node: ${JSON.stringify(o)}; data: ${JSON.stringify(e)}`);let s=o.serializedName!==null?e[o.serializedName]:e;n[i]=wn(s,o.fields,r,o.skipNulls);break}case "field":{let s=o.dbName;if(Object.hasOwn(e,s))n[i]=Nu(e[s],s,o.fieldType,r);else throw new A(`Missing data field (Value): '${s}'; node: ${JSON.stringify(o)}; data: ${JSON.stringify(e)}`)}break;default:b(o,`DataMapper: Invalid data mapping node type: '${o.type}'`);}return n}function Nu(e,t,r,n){return e===null?r.arity==="list"?[]:null:r.arity==="list"?e.map((o,s)=>hn(o,`${t}[${s}]`,r,n)):hn(e,t,r,n)}function hn(e,t,r,n){switch(r.type){case "unsupported":return e;case "string":{if(typeof e!="string")throw new A(`Expected a string in column '${t}', got ${typeof e}: ${e}`);return e}case "int":switch(typeof e){case "number":return Math.trunc(e);case "string":{let i=Math.trunc(Number(e));if(Number.isNaN(i)||!Number.isFinite(i))throw new A(`Expected an integer in column '${t}', got string: ${e}`);if(!Number.isSafeInteger(i))throw new A(`Integer value in column '${t}' is too large to represent as a JavaScript number without loss of precision, got: ${e}. Consider using BigInt type.`);return i}default:throw new A(`Expected an integer in column '${t}', got ${typeof e}: ${e}`)}case "bigint":{if(typeof e!="number"&&typeof e!="string")throw new A(`Expected a bigint in column '${t}', got ${typeof e}: ${e}`);return {$type:"BigInt",value:e}}case "float":{if(typeof e=="number")return e;if(typeof e=="string"){let i=Number(e);if(Number.isNaN(i)&&!/^[-+]?nan$/.test(e.toLowerCase()))throw new A(`Expected a float in column '${t}', got string: ${e}`);return i}throw new A(`Expected a float in column '${t}', got ${typeof e}: ${e}`)}case "boolean":{if(typeof e=="boolean")return e;if(typeof e=="number")return e===1;if(typeof e=="string"){if(e==="true"||e==="TRUE"||e==="1")return  true;if(e==="false"||e==="FALSE"||e==="0")return  false;throw new A(`Expected a boolean in column '${t}', got ${typeof e}: ${e}`)}if(Array.isArray(e)){for(let i of e)if(i!==0)return  true;return  false}throw new A(`Expected a boolean in column '${t}', got ${typeof e}: ${e}`)}case "decimal":if(typeof e!="number"&&typeof e!="string"&&!Yo.Decimal.isDecimal(e))throw new A(`Expected a decimal in column '${t}', got ${typeof e}: ${e}`);return {$type:"Decimal",value:e};case "datetime":{if(typeof e=="string")return {$type:"DateTime",value:Lu(e)};if(typeof e=="number"||e instanceof Date)return {$type:"DateTime",value:e};throw new A(`Expected a date in column '${t}', got ${typeof e}: ${e}`)}case "object":return {$type:"Json",value:bt(e)};case "json":return {$type:"Json",value:`${e}`};case "bytes":{switch(r.encoding){case "base64":if(typeof e!="string")throw new A(`Expected a base64-encoded byte array in column '${t}', got ${typeof e}: ${e}`);return {$type:"Bytes",value:e};case "hex":if(typeof e!="string"||!e.startsWith("\\x"))throw new A(`Expected a hex-encoded byte array in column '${t}', got ${typeof e}: ${e}`);return {$type:"Bytes",value:Buffer.from(e.slice(2),"hex").toString("base64")};case "array":if(Array.isArray(e))return {$type:"Bytes",value:Buffer.from(e).toString("base64")};if(e instanceof Uint8Array)return {$type:"Bytes",value:Buffer.from(e).toString("base64")};throw new A(`Expected a byte array in column '${t}', got ${typeof e}: ${e}`);default:b(r.encoding,`DataMapper: Unknown bytes encoding: ${r.encoding}`);}break}case "enum":{let i=n[r.name];if(i===void 0)throw new A(`Unknown enum '${r.name}'`);let o=i[`${e}`];if(o===void 0)throw new A(`Value '${e}' not found in enum '${r.name}'`);return o}default:b(r,`DataMapper: Unknown result type: ${r.type}`);}}var _u=/\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|[+-]\d{2}(:?\d{2})?)?$/;function Lu(e){let t=_u.exec(e);if(t===null)return `${e}T00:00:00Z`;let r=e,[n,i,o]=t;if(i!==void 0&&i!=="Z"&&o===void 0?r=`${e}:00`:i===void 0&&(r=`${e}Z`),n.length===e.length)return `1970-01-01T${r}`;let s=t.index-1;return r[s]===" "&&(r=`${r.slice(0,s)}T${r.slice(s+1)}`),r}function $u(e){let t=Object.entries(e);return t.length===0?"":(t.sort(([n],[i])=>n.localeCompare(i)),`/*${t.map(([n,i])=>{let o=encodeURIComponent(n),s=encodeURIComponent(i).replace(/'/g,"\\'");return `${o}='${s}'`}).join(",")}*/`)}function mr(e,t){let r={};for(let n of e){let i=n(t);for(let[o,s]of Object.entries(i))s!==void 0&&(r[o]=s);}return r}function es(e,t){let r=mr(e,t);return $u(r)}function ts(e,t){return t?`${e} ${t}`:e}var Et;(function(e){e[e.INTERNAL=0]="INTERNAL",e[e.SERVER=1]="SERVER",e[e.CLIENT=2]="CLIENT",e[e.PRODUCER=3]="PRODUCER",e[e.CONSUMER=4]="CONSUMER";})(Et||(Et={}));function qu(e){switch(e){case "postgresql":case "postgres":case "prisma+postgres":return "postgresql";case "sqlserver":return "mssql";case "mysql":case "sqlite":case "cockroachdb":case "mongodb":return e;default:b(e,`Unknown provider: ${e}`);}}async function fr({query:e,tracingHelper:t,provider:r,onQuery:n,execute:i}){return await t.runInChildSpan({name:"db_query",kind:Et.CLIENT,attributes:{"db.query.text":e.sql,"db.system.name":qu(r)}},async()=>{let o=new Date,s=performance.now(),a=await i(),l=performance.now();return n?.({timestamp:o,duration:l-s,query:e.sql,params:e.args}),a})}function ye(e,t){var r="000000000"+e;return r.substr(r.length-t)}var rs=V(require$$3,1);function Vu(){try{return rs.default.hostname()}catch{return process.env._CLUSTER_NETWORK_NAME_||process.env.COMPUTERNAME||"hostname"}}var ns=2,Uu=ye(process.pid.toString(36),ns),is=Vu(),ju=is.length,Bu=ye(is.split("").reduce(function(e,t){return +e+t.charCodeAt(0)},+ju+36).toString(36),ns);function xn(){return Uu+Bu}function gr(e){return typeof e=="string"&&/^c[a-z0-9]{20,32}$/.test(e)}function bn(e){let n=Math.pow(36,4),i=0;function o(){return ye((Math.random()*n<<0).toString(36),4)}function s(){return i=i<n?i:0,i++,i-1}function a(){var l="c",c=new Date().getTime().toString(36),u=ye(s().toString(36),4),p=e(),y=o()+o();return l+c+u+p+y}return a.fingerprint=e,a.isCuid=gr,a}var Qu=bn(xn);var os=Qu;var ia=V(Ks());var kn=require$$0$f;var zs="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";var Op=128,we,Be;function Ip(e){!we||we.length<e?(we=Buffer.allocUnsafe(e*Op),kn.webcrypto.getRandomValues(we),Be=0):Be+e>we.length&&(kn.webcrypto.getRandomValues(we),Be=0),Be+=e;}function On(e=21){Ip(e|=0);let t="";for(let r=Be-e;r<Be;r++)t+=zs[we[r]&63];return t}var Ct=V(require$$0$f,1);var Ys="0123456789ABCDEFGHJKMNPQRSTVWXYZ",Rt=32;var Fp=16,Xs=10,Zs=0xffffffffffff;var xe;(function(e){e.Base32IncorrectEncoding="B32_ENC_INVALID",e.DecodeTimeInvalidCharacter="DEC_TIME_CHAR",e.DecodeTimeValueMalformed="DEC_TIME_MALFORMED",e.EncodeTimeNegative="ENC_TIME_NEG",e.EncodeTimeSizeExceeded="ENC_TIME_SIZE_EXCEED",e.EncodeTimeValueMalformed="ENC_TIME_MALFORMED",e.PRNGDetectFailure="PRNG_DETECT",e.ULIDInvalid="ULID_INVALID",e.Unexpected="UNEXPECTED",e.UUIDInvalid="UUID_INVALID";})(xe||(xe={}));var be=class extends Error{constructor(t,r){super(`${r} (${t})`),this.name="ULIDError",this.code=t;}};function Mp(e){let t=Math.floor(e()*Rt);return t===Rt&&(t=Rt-1),Ys.charAt(t)}function Dp(e){let t=Np(),r=t&&(t.crypto||t.msCrypto)||(typeof Ct.default<"u"?Ct.default:null);if(typeof r?.getRandomValues=="function")return ()=>{let n=new Uint8Array(1);return r.getRandomValues(n),n[0]/255};if(typeof r?.randomBytes=="function")return ()=>r.randomBytes(1).readUInt8()/255;if(Ct.default?.randomBytes)return ()=>Ct.default.randomBytes(1).readUInt8()/255;throw new be(xe.PRNGDetectFailure,"Failed to find a reliable PRNG")}function Np(){return $p()?self:typeof window<"u"?window:typeof commonjsGlobal<"u"?commonjsGlobal:typeof globalThis<"u"?globalThis:null}function _p(e,t){let r="";for(;e>0;e--)r=Mp(t)+r;return r}function Lp(e,t=Xs){if(isNaN(e))throw new be(xe.EncodeTimeValueMalformed,`Time must be a number: ${e}`);if(e>Zs)throw new be(xe.EncodeTimeSizeExceeded,`Cannot encode a time larger than ${Zs}: ${e}`);if(e<0)throw new be(xe.EncodeTimeNegative,`Time must be positive: ${e}`);if(Number.isInteger(e)===false)throw new be(xe.EncodeTimeValueMalformed,`Time must be an integer: ${e}`);let r,n="";for(let i=t;i>0;i--)r=e%Rt,n=Ys.charAt(r)+n,e=(e-r)/Rt;return n}function $p(){return typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope}function ea(e,t){let r=Dp(),n=Date.now();return Lp(n,Xs)+_p(Fp,r)}var O=[];for(let e=0;e<256;++e)O.push((e+256).toString(16).slice(1));function xr(e,t=0){return (O[e[t+0]]+O[e[t+1]]+O[e[t+2]]+O[e[t+3]]+"-"+O[e[t+4]]+O[e[t+5]]+"-"+O[e[t+6]]+O[e[t+7]]+"-"+O[e[t+8]]+O[e[t+9]]+"-"+O[e[t+10]]+O[e[t+11]]+O[e[t+12]]+O[e[t+13]]+O[e[t+14]]+O[e[t+15]]).toLowerCase()}var ta=require$$0$f,Er=new Uint8Array(256),br=Er.length;function Qe(){return br>Er.length-16&&((0, ta.randomFillSync)(Er),br=0),Er.slice(br,br+=16)}var ra=require$$0$f,In={randomUUID:ra.randomUUID};function qp(e,t,r){if(In.randomUUID&&!t&&!e)return In.randomUUID();e=e||{};let n=e.random??e.rng?.()??Qe();if(n.length<16)throw new Error("Random bytes length must be >= 16");if(n[6]=n[6]&15|64,n[8]=n[8]&63|128,t){if(r=r||0,r<0||r+16>t.length)throw new RangeError(`UUID byte range ${r}:${r+15} is out of buffer bounds`);for(let i=0;i<16;++i)t[r+i]=n[i];return t}return xr(n)}var Fn=qp;var Mn={};function Vp(e,t,r){let n;if(e)n=na(e.random??e.rng?.()??Qe(),e.msecs,e.seq,t,r);else {let i=Date.now(),o=Qe();Up(Mn,i,o),n=na(o,Mn.msecs,Mn.seq,t,r);}return t??xr(n)}function Up(e,t,r){return e.msecs??=-1/0,e.seq??=0,t>e.msecs?(e.seq=r[6]<<23|r[7]<<16|r[8]<<8|r[9],e.msecs=t):(e.seq=e.seq+1|0,e.seq===0&&e.msecs++),e}function na(e,t,r,n,i=0){if(e.length<16)throw new Error("Random bytes length must be >= 16");if(!n)n=new Uint8Array(16),i=0;else if(i<0||i+16>n.length)throw new RangeError(`UUID byte range ${i}:${i+15} is out of buffer bounds`);return t??=Date.now(),r??=e[6]*127<<24|e[7]<<16|e[8]<<8|e[9],n[i++]=t/1099511627776&255,n[i++]=t/4294967296&255,n[i++]=t/16777216&255,n[i++]=t/65536&255,n[i++]=t/256&255,n[i++]=t&255,n[i++]=112|r>>>28&15,n[i++]=r>>>20&255,n[i++]=128|r>>>14&63,n[i++]=r>>>6&255,n[i++]=r<<2&255|e[10]&3,n[i++]=e[11],n[i++]=e[12],n[i++]=e[13],n[i++]=e[14],n[i++]=e[15],n}var Dn=Vp;var Tr=class{#t={};constructor(){this.register("uuid",new _n),this.register("cuid",new Ln),this.register("ulid",new $n),this.register("nanoid",new qn),this.register("product",new Vn);}snapshot(){return Object.create(this.#t,{now:{value:new Nn}})}register(t,r){this.#t[t]=r;}},Nn=class{#t=new Date;generate(){return this.#t.toISOString()}},_n=class{generate(t){if(t===4)return Fn();if(t===7)return Dn();throw new Error("Invalid UUID generator arguments")}},Ln=class{generate(t){if(t===1)return os();if(t===2)return (0, ia.createId)();throw new Error("Invalid CUID generator arguments")}},$n=class{generate(){return ea()}},qn=class{generate(t){if(typeof t=="number")return On(t);if(t===void 0)return On();throw new Error("Invalid Nanoid generator arguments")}},Vn=class{generate(t,r){if(t===void 0||r===void 0)throw new Error("Invalid Product generator arguments");return Array.isArray(t)&&Array.isArray(r)?t.flatMap(n=>r.map(i=>[n,i])):Array.isArray(t)?t.map(n=>[n,r]):Array.isArray(r)?r.map(n=>[t,n]):[[t,r]]}};function Pr(e,t){return e==null?e:typeof e=="string"?Pr(JSON.parse(e),t):Array.isArray(e)?Bp(e,t):jp(e,t)}function jp(e,t){if(t.pagination){let{skip:r,take:n,cursor:i}=t.pagination;if(r!==null&&r>0||n===0||i!==null&&!qe(e,i))return null}return sa(e,t.nested)}function sa(e,t){for(let[r,n]of Object.entries(t))e[r]=Pr(e[r],n);return e}function Bp(e,t){if(t.distinct!==null){let r=t.linkingFields!==null?[...t.distinct,...t.linkingFields]:t.distinct;e=Qp(e,r);}return t.pagination&&(e=Hp(e,t.pagination,t.linkingFields)),t.reverse&&e.reverse(),Object.keys(t.nested).length===0?e:e.map(r=>sa(r,t.nested))}function Qp(e,t){let r=new Set,n=[];for(let i of e){let o=He(i,t);r.has(o)||(r.add(o),n.push(i));}return n}function Hp(e,t,r){if(r===null)return oa(e,t);let n=new Map;for(let o of e){let s=He(o,r);n.has(s)||n.set(s,[]),n.get(s).push(o);}let i=Array.from(n.entries());return i.sort(([o],[s])=>o<s?-1:o>s?1:0),i.flatMap(([,o])=>oa(o,t))}function oa(e,{cursor:t,skip:r,take:n}){let i=t!==null?e.findIndex(a=>qe(a,t)):0;if(i===-1)return [];let o=i+(r??0),s=n!==null?o+n:e.length;return e.slice(o,s)}function He(e,t){return JSON.stringify(t.map(r=>e[r]))}function Un(e){return typeof e=="object"&&e!==null&&e.prisma__type==="param"}function jn(e){return typeof e=="object"&&e!==null&&e.prisma__type==="generatorCall"}function Hn(e,t,r,n){let i=e.args.map(o=>H(o,t,r));switch(e.type){case "rawSql":return [Gp(e.sql,i,e.argTypes)];case "templateSql":return (e.chunkable?zp(e.fragments,i,n):[i]).map(s=>{if(n!==void 0&&s.length>n)throw new N("The query parameter limit supported by your database is exceeded.","P2029");return Jp(e.fragments,e.placeholderFormat,s,e.argTypes)});default:b(e.type,"Invalid query type");}}function H(e,t,r){for(;Kp(e);)if(Un(e)){let n=t[e.prisma__value.name];if(n===void 0)throw new Error(`Missing value for query variable ${e.prisma__value.name}`);e=n;}else if(jn(e)){let{name:n,args:i}=e.prisma__value,o=r[n];if(!o)throw new Error(`Encountered an unknown generator '${n}'`);e=o.generate(...i.map(s=>H(s,t,r)));}else b(e,`Unexpected unevaluated value type: ${e}`);return Array.isArray(e)&&(e=e.map(n=>H(n,t,r))),e}function Jp(e,t,r,n){let i="",o={placeholderNumber:1},s=[],a=[];for(let l of Qn(e,r,n)){if(i+=Wp(l,t,o),l.type==="stringChunk")continue;let c=s.length,u=s.push(...aa(l))-c;if(l.argType.arity==="tuple"){if(u%l.argType.elements.length!==0)throw new Error(`Malformed query template. Expected the number of parameters to match the tuple arity, but got ${u} parameters for a tuple of arity ${l.argType.elements.length}.`);for(let p=0;p<u/l.argType.elements.length;p++)a.push(...l.argType.elements);}else for(let p=0;p<u;p++)a.push(l.argType);}return {sql:i,args:s,argTypes:a}}function Wp(e,t,r){let n=e.type;switch(n){case "parameter":return Bn(t,r.placeholderNumber++);case "stringChunk":return e.chunk;case "parameterTuple":return `(${e.value.length==0?"NULL":e.value.map(()=>Bn(t,r.placeholderNumber++)).join(",")})`;case "parameterTupleList":return e.value.map(i=>{let o=i.map(()=>Bn(t,r.placeholderNumber++)).join(e.itemSeparator);return `${e.itemPrefix}${o}${e.itemSuffix}`}).join(e.groupSeparator);default:b(n,"Invalid fragment type");}}function Bn(e,t){return e.hasNumbering?`${e.prefix}${t}`:e.prefix}function Gp(e,t,r){return {sql:e,args:t,argTypes:r}}function Kp(e){return Un(e)||jn(e)}function*Qn(e,t,r){let n=0;for(let i of e)switch(i.type){case "parameter":{if(n>=t.length)throw new Error(`Malformed query template. Fragments attempt to read over ${t.length} parameters.`);yield {...i,value:t[n],argType:r?.[n]},n++;break}case "stringChunk":{yield i;break}case "parameterTuple":{if(n>=t.length)throw new Error(`Malformed query template. Fragments attempt to read over ${t.length} parameters.`);let o=t[n];yield {...i,value:Array.isArray(o)?o:[o],argType:r?.[n]},n++;break}case "parameterTupleList":{if(n>=t.length)throw new Error(`Malformed query template. Fragments attempt to read over ${t.length} parameters.`);let o=t[n];if(!Array.isArray(o))throw new Error("Malformed query template. Tuple list expected.");if(o.length===0)throw new Error("Malformed query template. Tuple list cannot be empty.");for(let s of o)if(!Array.isArray(s))throw new Error("Malformed query template. Tuple expected.");yield {...i,value:o,argType:r?.[n]},n++;break}}}function*aa(e){switch(e.type){case "parameter":yield e.value;break;case "stringChunk":break;case "parameterTuple":yield*e.value;break;case "parameterTupleList":for(let t of e.value)yield*t;break}}function zp(e,t,r){let n=0,i=0;for(let s of Qn(e,t,void 0)){let a=0;for(let l of aa(s))a++;i=Math.max(i,a),n+=a;}let o=[[]];for(let s of Qn(e,t,void 0))switch(s.type){case "parameter":{for(let a of o)a.push(s.value);break}case "stringChunk":break;case "parameterTuple":{let a=s.value.length,l=[];if(r&&o.length===1&&a===i&&n>r&&n-a<r){let c=r-(n-a);l=Zp(s.value,c);}else l=[s.value];o=o.flatMap(c=>l.map(u=>[...c,u]));break}case "parameterTupleList":{let a=s.value.reduce((p,y)=>p+y.length,0),l=[],c=[],u=0;for(let p of s.value)r&&o.length===1&&a===i&&c.length>0&&n-a+u+p.length>r&&(l.push(c),c=[],u=0),c.push(p),u+=p.length;c.length>0&&l.push(c),o=o.flatMap(p=>l.map(y=>[...p,y]));break}}return o}function Zp(e,t){let r=[];for(let n=0;n<e.length;n+=t)r.push(e.slice(n,n+t));return r}function la(e){return e.rows.map(t=>t.reduce((r,n,i)=>(r[e.columnNames[i]]=n,r),{}))}function ca(e){return {columns:e.columnNames,types:e.columnTypes.map(t=>Yp(t)),rows:e.rows.map(t=>t.map((r,n)=>Je(r,e.columnTypes[n])))}}function Je(e,t){if(e===null)return null;switch(t){case d.Int32:switch(typeof e){case "number":return Math.trunc(e);case "string":return Math.trunc(Number(e));default:throw new Error(`Cannot serialize value of type ${typeof e} as Int32`)}case d.Int32Array:if(!Array.isArray(e))throw new Error(`Cannot serialize value of type ${typeof e} as Int32Array`);return e.map(r=>Je(r,d.Int32));case d.Int64:switch(typeof e){case "number":return BigInt(Math.trunc(e));case "string":return e;default:throw new Error(`Cannot serialize value of type ${typeof e} as Int64`)}case d.Int64Array:if(!Array.isArray(e))throw new Error(`Cannot serialize value of type ${typeof e} as Int64Array`);return e.map(r=>Je(r,d.Int64));case d.Json:switch(typeof e){case "string":return JSON.parse(e);default:throw new Error(`Cannot serialize value of type ${typeof e} as Json`)}case d.JsonArray:if(!Array.isArray(e))throw new Error(`Cannot serialize value of type ${typeof e} as JsonArray`);return e.map(r=>Je(r,d.Json));case d.Bytes:if(Array.isArray(e))return new Uint8Array(e);throw new Error(`Cannot serialize value of type ${typeof e} as Bytes`);case d.BytesArray:if(!Array.isArray(e))throw new Error(`Cannot serialize value of type ${typeof e} as BytesArray`);return e.map(r=>Je(r,d.Bytes));case d.Boolean:switch(typeof e){case "boolean":return e;case "string":return e==="true"||e==="1";case "number":return e===1;default:throw new Error(`Cannot serialize value of type ${typeof e} as Boolean`)}case d.BooleanArray:if(!Array.isArray(e))throw new Error(`Cannot serialize value of type ${typeof e} as BooleanArray`);return e.map(r=>Je(r,d.Boolean));default:return e}}function Yp(e){switch(e){case d.Int32:return "int";case d.Int64:return "bigint";case d.Float:return "float";case d.Double:return "double";case d.Text:return "string";case d.Enum:return "enum";case d.Bytes:return "bytes";case d.Boolean:return "bool";case d.Character:return "char";case d.Numeric:return "decimal";case d.Json:return "json";case d.Uuid:return "uuid";case d.DateTime:return "datetime";case d.Date:return "date";case d.Time:return "time";case d.Int32Array:return "int-array";case d.Int64Array:return "bigint-array";case d.FloatArray:return "float-array";case d.DoubleArray:return "double-array";case d.TextArray:return "string-array";case d.EnumArray:return "string-array";case d.BytesArray:return "bytes-array";case d.BooleanArray:return "bool-array";case d.CharacterArray:return "char-array";case d.NumericArray:return "decimal-array";case d.JsonArray:return "json-array";case d.UuidArray:return "uuid-array";case d.DateTimeArray:return "datetime-array";case d.DateArray:return "date-array";case d.TimeArray:return "time-array";case d.UnknownNumber:return "unknown";case d.Set:return "string";default:b(e,`Unexpected column type: ${e}`);}}function ua(e,t,r){if(!t.every(n=>Jn(e,n))){let n=Xp(e,r),i=ed(r);throw new N(n,i,r.context)}}function Jn(e,t){switch(t.type){case "rowCountEq":return Array.isArray(e)?e.length===t.args:e===null?t.args===0:t.args===1;case "rowCountNeq":return Array.isArray(e)?e.length!==t.args:e===null?t.args!==0:t.args!==1;case "affectedRowCountEq":return e===t.args;case "never":return  false;default:b(t,`Unknown rule type: ${t.type}`);}}function Xp(e,t){switch(t.error_identifier){case "RELATION_VIOLATION":return `The change you are trying to make would violate the required relation '${t.context.relation}' between the \`${t.context.modelA}\` and \`${t.context.modelB}\` models.`;case "MISSING_RECORD":return `An operation failed because it depends on one or more records that were required but not found. No record was found for ${t.context.operation}.`;case "MISSING_RELATED_RECORD":{let r=t.context.neededFor?` (needed to ${t.context.neededFor})`:"";return `An operation failed because it depends on one or more records that were required but not found. No '${t.context.model}' record${r} was found for ${t.context.operation} on ${t.context.relationType} relation '${t.context.relation}'.`}case "INCOMPLETE_CONNECT_INPUT":return `An operation failed because it depends on one or more records that were required but not found. Expected ${t.context.expectedRows} records to be connected, found only ${Array.isArray(e)?e.length:e}.`;case "INCOMPLETE_CONNECT_OUTPUT":return `The required connected records were not found. Expected ${t.context.expectedRows} records to be connected after connect operation on ${t.context.relationType} relation '${t.context.relation}', found ${Array.isArray(e)?e.length:e}.`;case "RECORDS_NOT_CONNECTED":return `The records for relation \`${t.context.relation}\` between the \`${t.context.parent}\` and \`${t.context.child}\` models are not connected.`;default:b(t,`Unknown error identifier: ${t}`);}}function ed(e){switch(e.error_identifier){case "RELATION_VIOLATION":return "P2014";case "RECORDS_NOT_CONNECTED":return "P2017";case "INCOMPLETE_CONNECT_OUTPUT":return "P2018";case "MISSING_RECORD":case "MISSING_RELATED_RECORD":case "INCOMPLETE_CONNECT_INPUT":return "P2025";default:b(e,`Unknown error identifier: ${e}`);}}var kt=class e{#t;#e;#r;#n=new Tr;#l;#i;#s;#o;#c;#a;constructor({transactionManager:t,placeholderValues:r,onQuery:n,tracingHelper:i,serializer:o,rawSerializer:s,provider:a,connectionInfo:l,sqlCommenter:c}){this.#t=t,this.#e=r,this.#r=n,this.#l=i,this.#i=o,this.#s=s??o,this.#o=a,this.#c=l,this.#a=c;}static forSql(t){return new e({transactionManager:t.transactionManager,placeholderValues:t.placeholderValues,onQuery:t.onQuery,tracingHelper:t.tracingHelper,serializer:la,rawSerializer:ca,provider:t.provider,connectionInfo:t.connectionInfo,sqlCommenter:t.sqlCommenter})}async run(t,r){let{value:n}=await this.interpretNode(t,r,this.#e,this.#n.snapshot()).catch(i=>Ve(i));return n}async interpretNode(t,r,n,i){switch(t.type){case "value":return {value:H(t.args,n,i)};case "seq":{let o;for(let s of t.args)o=await this.interpretNode(s,r,n,i);return o??{value:void 0}}case "get":return {value:n[t.args.name]};case "let":{let o=Object.create(n);for(let s of t.args.bindings){let{value:a}=await this.interpretNode(s.expr,r,o,i);o[s.name]=a;}return this.interpretNode(t.args.expr,r,o,i)}case "getFirstNonEmpty":{for(let o of t.args.names){let s=n[o];if(!pa(s))return {value:s}}return {value:[]}}case "concat":{let o=await Promise.all(t.args.map(s=>this.interpretNode(s,r,n,i).then(a=>a.value)));return {value:o.length>0?o.reduce((s,a)=>s.concat(Wn(a)),[]):[]}}case "sum":{let o=await Promise.all(t.args.map(s=>this.interpretNode(s,r,n,i).then(a=>a.value)));return {value:o.length>0?o.reduce((s,a)=>z(s)+z(a)):0}}case "execute":{let o=Hn(t.args,n,i,this.#u()),s=0;for(let a of o){let l=this.#m(a);s+=await this.#d(l,r,()=>r.executeRaw(l).catch(c=>t.args.type==="rawSql"?yn(c):Ve(c)));}return {value:s}}case "query":{let o=Hn(t.args,n,i,this.#u()),s;for(let a of o){let l=this.#m(a),c=await this.#d(l,r,()=>r.queryRaw(l).catch(u=>t.args.type==="rawSql"?yn(u):Ve(u)));s===void 0?s=c:(s.rows.push(...c.rows),s.lastInsertId=c.lastInsertId);}return {value:t.args.type==="rawSql"?this.#s(s):this.#i(s),lastInsertId:s?.lastInsertId}}case "reverse":{let{value:o,lastInsertId:s}=await this.interpretNode(t.args,r,n,i);return {value:Array.isArray(o)?o.reverse():o,lastInsertId:s}}case "unique":{let{value:o,lastInsertId:s}=await this.interpretNode(t.args,r,n,i);if(!Array.isArray(o))return {value:o,lastInsertId:s};if(o.length>1)throw new Error(`Expected zero or one element, got ${o.length}`);return {value:o[0]??null,lastInsertId:s}}case "required":{let{value:o,lastInsertId:s}=await this.interpretNode(t.args,r,n,i);if(pa(o))throw new Error("Required value is empty");return {value:o,lastInsertId:s}}case "mapField":{let{value:o,lastInsertId:s}=await this.interpretNode(t.args.records,r,n,i);return {value:da(o,t.args.field),lastInsertId:s}}case "join":{let{value:o,lastInsertId:s}=await this.interpretNode(t.args.parent,r,n,i);if(o===null)return {value:null,lastInsertId:s};let a=await Promise.all(t.args.children.map(async l=>({joinExpr:l,childRecords:(await this.interpretNode(l.child,r,n,i)).value})));return {value:td(o,a),lastInsertId:s}}case "transaction":{if(!this.#t.enabled)return this.interpretNode(t.args,r,n,i);let o=this.#t.manager,s=await o.startInternalTransaction(),a=await o.getTransaction(s,"query");try{let l=await this.interpretNode(t.args,a,n,i);return await o.commitTransaction(s.id),l}catch(l){throw await o.rollbackTransaction(s.id),l}}case "dataMap":{let{value:o,lastInsertId:s}=await this.interpretNode(t.args.expr,r,n,i);return {value:Xo(o,t.args.structure,t.args.enums),lastInsertId:s}}case "validate":{let{value:o,lastInsertId:s}=await this.interpretNode(t.args.expr,r,n,i);return ua(o,t.args.rules,t.args),{value:o,lastInsertId:s}}case "if":{let{value:o}=await this.interpretNode(t.args.value,r,n,i);return Jn(o,t.args.rule)?await this.interpretNode(t.args.then,r,n,i):await this.interpretNode(t.args.else,r,n,i)}case "unit":return {value:void 0};case "diff":{let{value:o}=await this.interpretNode(t.args.from,r,n,i),{value:s}=await this.interpretNode(t.args.to,r,n,i),a=c=>c!==null?He(Ar(c),t.args.fields):null,l=new Set(Wn(s).map(a));return {value:Wn(o).filter(c=>!l.has(a(c)))}}case "process":{let{value:o,lastInsertId:s}=await this.interpretNode(t.args.expr,r,n,i);return {value:Pr(o,t.args.operations),lastInsertId:s}}case "initializeRecord":{let{lastInsertId:o}=await this.interpretNode(t.args.expr,r,n,i),s={};for(let[a,l]of Object.entries(t.args.fields))s[a]=rd(l,o,n,i);return {value:s,lastInsertId:o}}case "mapRecord":{let{value:o,lastInsertId:s}=await this.interpretNode(t.args.expr,r,n,i),a=o===null?{}:Ar(o);for(let[l,c]of Object.entries(t.args.fields))a[l]=nd(c,a[l],n,i);return {value:a,lastInsertId:s}}default:b(t,`Unexpected node type: ${t.type}`);}}#u(){return this.#c?.maxBindValues!==void 0?this.#c.maxBindValues:this.#p()}#p(){if(this.#o!==void 0)switch(this.#o){case "cockroachdb":case "postgres":case "postgresql":case "prisma+postgres":return 32766;case "mysql":return 65535;case "sqlite":return 999;case "sqlserver":return 2098;case "mongodb":return;default:b(this.#o,`Unexpected provider: ${this.#o}`);}}#d(t,r,n){return fr({query:t,execute:n,provider:this.#o??r.provider,tracingHelper:this.#l,onQuery:this.#r})}#m(t){if(!this.#a||this.#a.plugins.length===0)return t;let r=es(this.#a.plugins,{query:this.#a.queryInfo,sql:t.sql});return r?{...t,sql:ts(t.sql,r)}:t}};function pa(e){return Array.isArray(e)?e.length===0:e==null}function Wn(e){return Array.isArray(e)?e:[e]}function z(e){if(typeof e=="number")return e;if(typeof e=="string")return Number(e);throw new Error(`Expected number, got ${typeof e}`)}function Ar(e){if(typeof e=="object"&&e!==null)return e;throw new Error(`Expected object, got ${typeof e}`)}function da(e,t){return Array.isArray(e)?e.map(r=>da(r,t)):typeof e=="object"&&e!==null?e[t]??null:e}function td(e,t){for(let{joinExpr:r,childRecords:n}of t){let i=r.on.map(([a])=>a),o=r.on.map(([,a])=>a),s={};for(let a of Array.isArray(e)?e:[e]){let l=Ar(a),c=He(l,i);s[c]||(s[c]=[]),s[c].push(l),r.isRelationUnique?l[r.parentField]=null:l[r.parentField]=[];}for(let a of Array.isArray(n)?n:[n]){if(a===null)continue;let l=He(Ar(a),o);for(let c of s[l]??[])r.isRelationUnique?c[r.parentField]=a:c[r.parentField].push(a);}}return e}function rd(e,t,r,n){switch(e.type){case "value":return H(e.value,r,n);case "lastInsertId":return t;default:b(e,`Unexpected field initializer type: ${e.type}`);}}function nd(e,t,r,n){switch(e.type){case "set":return H(e.value,r,n);case "add":return z(t)+z(H(e.value,r,n));case "subtract":return z(t)-z(H(e.value,r,n));case "multiply":return z(t)*z(H(e.value,r,n));case "divide":{let i=z(t),o=z(H(e.value,r,n));return o===0?null:i/o}default:b(e,`Unexpected field operation type: ${e.type}`);}}async function id(){return globalThis.crypto??await import('node:crypto')}async function ma(){return (await id()).randomUUID()}async function fa(e,t){return new Promise(r=>{e.addEventListener(t,r,{once:true});})}var U=class extends N{name="TransactionManagerError";constructor(t,r){super("Transaction API error: "+t,"P2028",r);}},Ot=class extends U{constructor(){super("Transaction not found. Transaction ID is invalid, refers to an old closed transaction Prisma doesn't have information about anymore, or was obtained before disconnecting.");}},Sr=class extends U{constructor(t){super(`Transaction already closed: A ${t} cannot be executed on a committed transaction.`);}},vr=class extends U{constructor(t){super(`Transaction already closed: A ${t} cannot be executed on a transaction that was rolled back.`);}},Cr=class extends U{constructor(){super("Unable to start a transaction in the given time.");}},Rr=class extends U{constructor(t,{timeout:r,timeTaken:n}){super(`A ${t} cannot be executed on an expired transaction. The timeout for this transaction was ${r} ms, however ${n} ms passed since the start of the transaction. Consider increasing the interactive transaction timeout or doing less work in the transaction.`,{operation:t,timeout:r,timeTaken:n});}},We=class extends U{constructor(t){super(`Internal Consistency Error: ${t}`);}},kr=class extends U{constructor(t){super(`Invalid isolation level: ${t}`,{isolationLevel:t});}};var od=100,It=F("prisma:client:transactionManager"),sd=()=>({sql:"COMMIT",args:[],argTypes:[]}),ad=()=>({sql:"ROLLBACK",args:[],argTypes:[]}),ld=()=>({sql:'-- Implicit "COMMIT" query via underlying driver',args:[],argTypes:[]}),cd=()=>({sql:'-- Implicit "ROLLBACK" query via underlying driver',args:[],argTypes:[]}),Ft=class{transactions=new Map;closedTransactions=[];driverAdapter;transactionOptions;tracingHelper;#t;#e;constructor({driverAdapter:t,transactionOptions:r,tracingHelper:n,onQuery:i,provider:o}){this.driverAdapter=t,this.transactionOptions=r,this.tracingHelper=n,this.#t=i,this.#e=o;}async startInternalTransaction(t){let r=t!==void 0?this.#s(t):{};return await this.tracingHelper.runInChildSpan("start_transaction",()=>this.#r(r))}async startTransaction(t){let r=t!==void 0?this.#s(t):this.transactionOptions;return await this.tracingHelper.runInChildSpan("start_transaction",()=>this.#r(r))}async#r(t){let r={id:await ma(),status:"waiting",timer:void 0,timeout:t.timeout,startedAt:Date.now(),transaction:void 0},n=new AbortController,i=ga(()=>n.abort(),t.maxWait);switch(i?.unref?.(),r.transaction=await Promise.race([this.driverAdapter.startTransaction(t.isolationLevel).catch(Ve).finally(()=>clearTimeout(i)),fa(n.signal,"abort").then(()=>{})]),this.transactions.set(r.id,r),r.status){case "waiting":if(n.signal.aborted)throw await this.#i(r,"timed_out"),new Cr;return r.status="running",r.timer=this.#l(r.id,t.timeout),{id:r.id};case "timed_out":case "running":case "committed":case "rolled_back":throw new We(`Transaction in invalid state ${r.status} although it just finished startup.`);default:b(r.status,"Unknown transaction status.");}}async commitTransaction(t){return await this.tracingHelper.runInChildSpan("commit_transaction",async()=>{let r=this.#n(t,"commit");await this.#i(r,"committed");})}async rollbackTransaction(t){return await this.tracingHelper.runInChildSpan("rollback_transaction",async()=>{let r=this.#n(t,"rollback");await this.#i(r,"rolled_back");})}async getTransaction(t,r){let n=this.#n(t.id,r);if(n.status==="closing"&&(await n.closing,n=this.#n(t.id,r)),!n.transaction)throw new Ot;return n.transaction}#n(t,r){let n=this.transactions.get(t);if(!n){let i=this.closedTransactions.find(o=>o.id===t);if(i)switch(It("Transaction already closed.",{transactionId:t,status:i.status}),i.status){case "closing":case "waiting":case "running":throw new We("Active transaction found in closed transactions list.");case "committed":throw new Sr(r);case "rolled_back":throw new vr(r);case "timed_out":throw new Rr(r,{timeout:i.timeout,timeTaken:Date.now()-i.startedAt})}else throw It("Transaction not found.",t),new Ot}if(["committed","rolled_back","timed_out"].includes(n.status))throw new We("Closed transaction found in active transactions map.");return n}async cancelAllTransactions(){await Promise.allSettled([...this.transactions.values()].map(t=>this.#i(t,"rolled_back")));}#l(t,r){let n=Date.now(),i=ga(async()=>{It("Transaction timed out.",{transactionId:t,timeoutStartedAt:n,timeout:r});let o=this.transactions.get(t);o&&["running","waiting"].includes(o.status)?await this.#i(o,"timed_out"):It("Transaction already committed or rolled back when timeout happened.",t);},r);return i?.unref?.(),i}async#i(t,r){let n=async()=>{It("Closing transaction.",{transactionId:t.id,status:r});try{if(t.transaction&&r==="committed")if(t.transaction.options.usePhantomQuery)await this.#o(ld(),t.transaction,()=>t.transaction.commit());else {let i=sd();await this.#o(i,t.transaction,()=>t.transaction.executeRaw(i)).then(()=>t.transaction.commit(),o=>{let s=()=>Promise.reject(o);return t.transaction.rollback().then(s,s)});}else if(t.transaction)if(t.transaction.options.usePhantomQuery)await this.#o(cd(),t.transaction,()=>t.transaction.rollback());else {let i=ad();try{await this.#o(i,t.transaction,()=>t.transaction.executeRaw(i));}finally{await t.transaction.rollback();}}}finally{t.status=r,clearTimeout(t.timer),t.timer=void 0,this.transactions.delete(t.id),this.closedTransactions.push(t),this.closedTransactions.length>od&&this.closedTransactions.shift();}};t.status==="closing"?(await t.closing,this.#n(t.id,r==="committed"?"commit":"rollback")):await Object.assign(t,{status:"closing",reason:r,closing:n()}).closing;}#s(t){if(!t.timeout)throw new U("timeout is required");if(!t.maxWait)throw new U("maxWait is required");if(t.isolationLevel==="SNAPSHOT")throw new kr(t.isolationLevel);return {...t,timeout:t.timeout,maxWait:t.maxWait}}#o(t,r,n){return fr({query:t,execute:n,provider:this.#e??r.provider,tracingHelper:this.tracingHelper,onQuery:this.#t})}};function ga(e,t){return t!==void 0?setTimeout(e,t):void 0}var I=require$$1$8;var Or="7.1.0";function ya(e,t){return {batch:e,transaction:t?.kind==="batch"?{isolationLevel:t.options.isolationLevel}:void 0}}function ha(e){return e?e.replace(/".*"/g,'"X"').replace(/[\s:\[]([+-]?([0-9]*[.])?[0-9]+)/g,t=>`${t[0]}5`):""}function wa(e){return e.split(`
`).map(t=>t.replace(/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)\s*/,"").replace(/\+\d+\s*ms$/,"")).join(`
`)}var xa=V(Ii());function ba({title:e,user:t="prisma",repo:r="prisma",template:n="bug_report.yml",body:i}){return (0, xa.default)({user:t,repo:r,template:n,title:e,body:i})}function Ea({version:e,binaryTarget:t,title:r,description:n,engineVersion:i,database:o,query:s}){let a=xi(6e3-(s?.length??0)),l=wa(Se(a)),c=n?`# Description
\`\`\`
${n}
\`\`\``:"",u=Se(`Hi Prisma Team! My Prisma Client just crashed. This is the report:
## Versions

| Name            | Version            |
|-----------------|--------------------|
| Node            | ${process.version?.padEnd(19)}| 
| OS              | ${t?.padEnd(19)}|
| Prisma Client   | ${e?.padEnd(19)}|
| Query Engine    | ${i?.padEnd(19)}|
| Database        | ${o?.padEnd(19)}|

${c}

## Logs
\`\`\`
${l}
\`\`\`

## Client Snippet
\`\`\`ts
// PLEASE FILL YOUR CODE SNIPPET HERE
\`\`\`

## Schema
\`\`\`prisma
// PLEASE ADD YOUR SCHEMA HERE IF POSSIBLE
\`\`\`

## Prisma Engine Query
\`\`\`
${s?ha(s):""}
\`\`\`
`),p=ba({title:r,body:u});return `${r}

This is a non-recoverable error which probably happens when the Prisma Query Engine has a panic.

${Ye(p)}

If you want the Prisma team to look into it, please open the link above \u{1F64F}
To increase the chance of success, please post your schema and a snippet of
how you used Prisma Client in the issue. 
`}var Ir=class e{#t;#e;#r;#n;constructor(t,r,n){this.#t=t,this.#e=r,this.#r=n,this.#n=r.getConnectionInfo?.();}static async connect(t){let r,n;try{r=await t.driverAdapterFactory.connect(),n=new Ft({driverAdapter:r,transactionOptions:t.transactionOptions,tracingHelper:t.tracingHelper,onQuery:t.onQuery,provider:t.provider});}catch(i){throw await r?.dispose(),i}return new e(t,r,n)}getConnectionInfo(){let t=this.#n??{supportsRelationJoins:false};return Promise.resolve({provider:this.#e.provider,connectionInfo:t})}async execute({plan:t,placeholderValues:r,transaction:n,batchIndex:i,queryInfo:o}){let s=n?await this.#r.getTransaction(n,i!==void 0?"batch query":"query"):this.#e;return await kt.forSql({transactionManager:n?{enabled:false}:{enabled:true,manager:this.#r},placeholderValues:r,onQuery:this.#t.onQuery,tracingHelper:this.#t.tracingHelper,provider:this.#t.provider,connectionInfo:this.#n,sqlCommenter:this.#t.sqlCommenters&&{plugins:this.#t.sqlCommenters,queryInfo:o}}).run(t,s)}async startTransaction(t){return {...await this.#r.startTransaction(t),payload:void 0}}async commitTransaction(t){await this.#r.commitTransaction(t.id);}async rollbackTransaction(t){await this.#r.rollbackTransaction(t.id);}async disconnect(){try{await this.#r.cancelAllTransactions();}finally{await this.#e.dispose();}}apiKey(){return null}};var Ca=require$$1$8;var Fr=/^[\u0009\u0020-\u007E\u0080-\u00FF]+$/;function Ta(e,t,r){let n={},i=n.encode||encodeURIComponent;if(typeof i!="function")throw new TypeError("option encode is invalid");if(!Fr.test(e))throw new TypeError("argument name is invalid");let o=i(t);if(o&&!Fr.test(o))throw new TypeError("argument val is invalid");let s=e+"="+o;if(n.maxAge!==void 0&&n.maxAge!==null){let a=n.maxAge-0;if(Number.isNaN(a)||!Number.isFinite(a))throw new TypeError("option maxAge is invalid");s+="; Max-Age="+Math.floor(a);}if(n.domain){if(!Fr.test(n.domain))throw new TypeError("option domain is invalid");s+="; Domain="+n.domain;}if(n.path){if(!Fr.test(n.path))throw new TypeError("option path is invalid");s+="; Path="+n.path;}if(n.expires){if(!pd(n.expires)||Number.isNaN(n.expires.valueOf()))throw new TypeError("option expires is invalid");s+="; Expires="+n.expires.toUTCString();}if(n.httpOnly&&(s+="; HttpOnly"),n.secure&&(s+="; Secure"),n.priority)switch(typeof n.priority=="string"?n.priority.toLowerCase():n.priority){case "low":{s+="; Priority=Low";break}case "medium":{s+="; Priority=Medium";break}case "high":{s+="; Priority=High";break}default:throw new TypeError("option priority is invalid")}if(n.sameSite)switch(typeof n.sameSite=="string"?n.sameSite.toLowerCase():n.sameSite){case  true:{s+="; SameSite=Strict";break}case "lax":{s+="; SameSite=Lax";break}case "strict":{s+="; SameSite=Strict";break}case "none":{s+="; SameSite=None";break}default:throw new TypeError("option sameSite is invalid")}return n.partitioned&&(s+="; Partitioned"),s}function pd(e){return Object.prototype.toString.call(e)==="[object Date]"||e instanceof Date}function Pa(e,t){let r=(e||"").split(";").filter(l=>typeof l=="string"&&!!l.trim()),n=r.shift()||"",i=dd(n),o=i.name,s=i.value;try{s=t?.decode===!1?s:(t?.decode||decodeURIComponent)(s);}catch{}let a={name:o,value:s};for(let l of r){let c=l.split("="),u=(c.shift()||"").trimStart().toLowerCase(),p=c.join("=");switch(u){case "expires":{a.expires=new Date(p);break}case "max-age":{a.maxAge=Number.parseInt(p,10);break}case "secure":{a.secure=true;break}case "httponly":{a.httpOnly=true;break}case "samesite":{a.sameSite=p;break}default:a[u]=p;}}return a}function dd(e){let t="",r="",n=e.split("=");return n.length>1?(t=n.shift(),r=n.join("=")):r=e,{name:t,value:r}}var Mr=class extends Error{clientVersion;cause;constructor(t,r){super(t),this.clientVersion=r.clientVersion,this.cause=r.cause;}get[Symbol.toStringTag](){return this.name}};var Dr=class extends Mr{isRetryable;constructor(t,r){super(t,r),this.isRetryable=r.isRetryable??true;}};function Aa(e,t){return {...e,isRetryable:t}}var Ee=class extends Dr{name="InvalidDatasourceError";code="P6001";constructor(t,r){super(t,Aa(r,false));}};at(Ee,"InvalidDatasourceError");function Sa(e){let t={clientVersion:e.clientVersion},r;try{r=new URL(e.accelerateUrl);}catch(l){let c=l.message;throw new Ee(`Error validating \`accelerateUrl\`, the URL cannot be parsed, reason: ${c}`,t)}let{protocol:n,searchParams:i}=r;if(n!=="prisma:"&&n!==Ut)throw new Ee("Error validating `accelerateUrl`: the URL must start with the protocol `prisma://` or `prisma+postgres://`",t);let o=i.get("api_key");if(o===null||o.length<1)throw new Ee("Error validating `accelerateUrl`: the URL must contain a valid API key",t);let s=Wr(r)?"http:":"https:";process.env.TEST_CLIENT_ENGINE_REMOTE_EXECUTOR&&r.searchParams.has("use_http")&&(s="http:");let a=new URL(r.href.replace(n,s));return {apiKey:o,url:a}}var va=V(Ti()),Nr=class{apiKey;tracingHelper;logLevel;logQueries;engineHash;constructor({apiKey:t,tracingHelper:r,logLevel:n,logQueries:i,engineHash:o}){this.apiKey=t,this.tracingHelper=r,this.logLevel=n,this.logQueries=i,this.engineHash=o;}build({traceparent:t,transactionId:r}={}){let n={Accept:"application/json",Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json","Prisma-Engine-Hash":this.engineHash,"Prisma-Engine-Version":va.enginesVersion};this.tracingHelper.isEnabled()&&(n.traceparent=t??this.tracingHelper.getTraceParent()),r&&(n["X-Transaction-Id"]=r);let i=this.#t();return i.length>0&&(n["X-Capture-Telemetry"]=i.join(", ")),n}#t(){let t=[];return this.tracingHelper.isEnabled()&&t.push("tracing"),this.logLevel&&t.push(this.logLevel),this.logQueries&&t.push("query"),t}};function md(e){return e[0]*1e3+e[1]/1e6}function Gn(e){return new Date(md(e))}var Ra=F("prisma:client:clientEngine:remoteExecutor"),_r=class{#t;#e;#r;#n;#l;#i;constructor(t){this.#t=t.clientVersion,this.#n=t.logEmitter,this.#l=t.tracingHelper,this.#i=t.sqlCommenters;let{url:r,apiKey:n}=Sa({clientVersion:t.clientVersion,accelerateUrl:t.accelerateUrl});this.#r=new Kn(r),this.#e=new Nr({apiKey:n,engineHash:t.clientVersion,logLevel:t.logLevel,logQueries:t.logQueries,tracingHelper:t.tracingHelper});}async getConnectionInfo(){return await this.#s({path:"/connection-info",method:"GET"})}async execute({plan:t,placeholderValues:r,batchIndex:n,model:i,operation:o,transaction:s,customFetch:a,queryInfo:l}){let c=l&&this.#i?.length?mr(this.#i,{query:l}):void 0;return (await this.#s({path:s?`/transaction/${s.id}/query`:"/query",method:"POST",body:{model:i,operation:o,plan:t,params:r,comments:c&&Object.keys(c).length>0?c:void 0},batchRequestIdx:n,fetch:a})).data}async startTransaction(t){return {...await this.#s({path:"/transaction/start",method:"POST",body:t}),payload:void 0}}async commitTransaction(t){await this.#s({path:`/transaction/${t.id}/commit`,method:"POST"});}async rollbackTransaction(t){await this.#s({path:`/transaction/${t.id}/rollback`,method:"POST"});}disconnect(){return Promise.resolve()}apiKey(){return this.#e.apiKey}async#s({path:t,method:r,body:n,fetch:i=globalThis.fetch,batchRequestIdx:o}){let s=await this.#r.request({method:r,path:t,headers:this.#e.build(),body:n,fetch:i});s.ok||await this.#o(s,o);let a=await s.json();return typeof a.extensions=="object"&&a.extensions!==null&&this.#c(a.extensions),a}async#o(t,r){let n=t.headers.get("Prisma-Error-Code"),i=await t.text(),o,s=i;try{o=JSON.parse(i);}catch{o={};}typeof o.code=="string"&&(n=o.code),typeof o.error=="string"?s=o.error:typeof o.message=="string"?s=o.message:typeof o.InvalidRequestError=="object"&&o.InvalidRequestError!==null&&typeof o.InvalidRequestError.reason=="string"&&(s=o.InvalidRequestError.reason),s=s||`HTTP ${t.status}: ${t.statusText}`;let a=typeof o.meta=="object"&&o.meta!==null?o.meta:o;throw new Ca.PrismaClientKnownRequestError(s,{clientVersion:this.#t,code:n??"P6000",batchRequestIdx:r,meta:a})}#c(t){if(t.logs)for(let r of t.logs)this.#a(r);t.traces&&this.#l.dispatchEngineSpans(t.traces);}#a(t){switch(t.level){case "debug":case "trace":Ra(t);break;case "error":case "warn":case "info":{this.#n.emit(t.level,{timestamp:Gn(t.timestamp),message:t.attributes.message??"",target:t.target??"RemoteExecutor"});break}case "query":{this.#n.emit("query",{query:t.attributes.query??"",timestamp:Gn(t.timestamp),duration:t.attributes.duration_ms??0,params:t.attributes.params??"",target:t.target??"RemoteExecutor"});break}default:throw new Error(`Unexpected log level: ${t.level}`)}}},Kn=class{#t;#e;#r;constructor(t){this.#t=t,this.#e=new Map;}async request({method:t,path:r,headers:n,body:i,fetch:o}){let s=new URL(r,this.#t),a=this.#n(s);a&&(n.Cookie=a),this.#r&&(n["Accelerate-Query-Engine-Jwt"]=this.#r);let l=await o(s.href,{method:t,body:i!==void 0?JSON.stringify(i):void 0,headers:n});return Ra(t,s,l.status,l.statusText),this.#r=l.headers.get("Accelerate-Query-Engine-Jwt")??void 0,this.#l(s,l),l}#n(t){let r=[],n=new Date;for(let[i,o]of this.#e){if(o.expires&&o.expires<n){this.#e.delete(i);continue}let s=o.domain??t.hostname,a=o.path??"/";t.hostname.endsWith(s)&&t.pathname.startsWith(a)&&r.push(Ta(o.name,o.value));}return r.length>0?r.join("; "):void 0}#l(t,r){let n=r.headers.getSetCookie?.()||[];if(n.length===0){let i=r.headers.get("Set-Cookie");i&&n.push(i);}for(let i of n){let o=Pa(i),s=o.domain??t.hostname,a=o.path??"/",l=`${s}:${a}:${o.name}`;this.#e.set(l,{name:o.name,value:o.value,domain:s,path:a,expires:o.expires});}}};var Zn=require$$1$8,zn={},ka={async loadQueryCompiler(e){let{clientVersion:t,compilerWasm:r}=e;if(r===void 0)throw new Zn.PrismaClientInitializationError("WASM query compiler was unexpectedly `undefined`",t);let n;return e.activeProvider===void 0||zn[e.activeProvider]===void 0?(n=(async()=>{let i=await r.getRuntime(),o=await r.getQueryCompilerWasmModule();if(o==null)throw new Zn.PrismaClientInitializationError("The loaded wasm module was unexpectedly `undefined` or `null` once loaded",t);let s={"./query_compiler_bg.js":i},a=new WebAssembly.Instance(o,s),l=a.exports.__wbindgen_start;return i.__wbg_set_wasm(a.exports),l(),i.QueryCompiler})(),e.activeProvider!==void 0&&(zn[e.activeProvider]=n)):n=zn[e.activeProvider],await n}};var fd="P2038",Mt=F("prisma:client:clientEngine"),Ia=globalThis;Ia.PRISMA_WASM_PANIC_REGISTRY={set_message(e){throw new I.PrismaClientRustPanicError(e,Or)}};var Dt=class{name="ClientEngine";#t;#e={type:"disconnected"};#r;#n;config;datamodel;logEmitter;logQueries;logLevel;tracingHelper;#l;constructor(t,r){if(t.accelerateUrl!==void 0)this.#n={remote:true,accelerateUrl:t.accelerateUrl};else if(t.adapter)this.#n={remote:false,driverAdapterFactory:t.adapter},Mt("Using driver adapter: %O",t.adapter);else throw new I.PrismaClientInitializationError("Missing configured driver adapter. Engine type `client` requires an active driver adapter. Please check your PrismaClient initialization code.",t.clientVersion,fd);this.#r=r??ka,this.config=t,this.logQueries=t.logQueries??false,this.logLevel=t.logLevel??"error",this.logEmitter=t.logEmitter,this.datamodel=t.inlineSchema,this.tracingHelper=t.tracingHelper,t.enableDebugLogs&&(this.logLevel="debug"),this.logQueries&&(this.#l=n=>{this.logEmitter.emit("query",{...n,params:bt(n.params),target:"ClientEngine"});});}async#i(){switch(this.#e.type){case "disconnected":{let t=this.tracingHelper.runInChildSpan("connect",async()=>{let r,n;try{r=await this.#s(),n=await this.#o(r);}catch(o){throw this.#e={type:"disconnected"},n?.free(),await r?.disconnect(),o}let i={executor:r,queryCompiler:n};return this.#e={type:"connected",engine:i},i});return this.#e={type:"connecting",promise:t},await t}case "connecting":return await this.#e.promise;case "connected":return this.#e.engine;case "disconnecting":return await this.#e.promise,await this.#i()}}async#s(){return this.#n.remote?new _r({clientVersion:this.config.clientVersion,accelerateUrl:this.#n.accelerateUrl,logEmitter:this.logEmitter,logLevel:this.logLevel,logQueries:this.logQueries,tracingHelper:this.tracingHelper,sqlCommenters:this.config.sqlCommenters}):await Ir.connect({driverAdapterFactory:this.#n.driverAdapterFactory,tracingHelper:this.tracingHelper,transactionOptions:{...this.config.transactionOptions,isolationLevel:this.#d(this.config.transactionOptions.isolationLevel)},onQuery:this.#l,provider:this.config.activeProvider,sqlCommenters:this.config.sqlCommenters})}async#o(t){let r=this.#t;r===void 0&&(r=await this.#r.loadQueryCompiler(this.config),this.#t=r);let{provider:n,connectionInfo:i}=await t.getConnectionInfo();try{return this.#p(()=>new r({datamodel:this.datamodel,provider:n,connectionInfo:i}),void 0,!1)}catch(o){throw this.#c(o)}}#c(t){if(t instanceof I.PrismaClientRustPanicError)return t;try{let r=JSON.parse(t.message);return new I.PrismaClientInitializationError(r.message,this.config.clientVersion,r.error_code)}catch{return t}}#a(t,r){if(t instanceof I.PrismaClientInitializationError)return t;if(t.code==="GenericFailure"&&t.message?.startsWith("PANIC:"))return new I.PrismaClientRustPanicError(Oa(this,t.message,r),this.config.clientVersion);if(t instanceof N)return new I.PrismaClientKnownRequestError(t.message,{code:t.code,meta:t.meta,clientVersion:this.config.clientVersion});try{let n=JSON.parse(t);return new I.PrismaClientUnknownRequestError(`${n.message}
${n.backtrace}`,{clientVersion:this.config.clientVersion})}catch{return t}}#u(t){return t instanceof I.PrismaClientRustPanicError?t:typeof t.message=="string"&&typeof t.code=="string"?new I.PrismaClientKnownRequestError(t.message,{code:t.code,meta:t.meta,clientVersion:this.config.clientVersion}):typeof t.message=="string"?new I.PrismaClientUnknownRequestError(t.message,{clientVersion:this.config.clientVersion}):t}#p(t,r,n=true){let i=Ia.PRISMA_WASM_PANIC_REGISTRY.set_message,o;commonjsGlobal.PRISMA_WASM_PANIC_REGISTRY.set_message=s=>{o=s;};try{return t()}finally{if(commonjsGlobal.PRISMA_WASM_PANIC_REGISTRY.set_message=i,o)throw this.#t=void 0,n&&this.stop().catch(s=>Mt("failed to disconnect:",s)),new I.PrismaClientRustPanicError(Oa(this,o,r),this.config.clientVersion)}}onBeforeExit(){throw new Error('"beforeExit" hook is not applicable to the client engine, it is only relevant and implemented for the binary engine. Please add your event listener to the `process` object directly instead.')}async start(){await this.#i();}async stop(){switch(this.#e.type){case "disconnected":return;case "connecting":return await this.#e.promise,await this.stop();case "connected":{let t=this.#e.engine,r=this.tracingHelper.runInChildSpan("disconnect",async()=>{try{await t.executor.disconnect(),t.queryCompiler.free();}finally{this.#e={type:"disconnected"};}});return this.#e={type:"disconnecting",promise:r},await r}case "disconnecting":return await this.#e.promise}}version(){return "unknown"}async transaction(t,r,n){let i,{executor:o}=await this.#i();try{if(t==="start"){let s=n;i=await o.startTransaction({...s,isolationLevel:this.#d(s.isolationLevel)});}else if(t==="commit"){let s=n;await o.commitTransaction(s);}else if(t==="rollback"){let s=n;await o.rollbackTransaction(s);}else X(t,"Invalid transaction action.");}catch(s){throw this.#a(s)}return i?{id:i.id,payload:void 0}:void 0}async request(t,{interactiveTransaction:r,customDataProxyFetch:n}){Mt("sending request");let i=JSON.stringify(t),{executor:o,queryCompiler:s}=await this.#i().catch(l=>{throw this.#a(l,i)}),a;try{a=this.#p(()=>this.#m({queries:[t],execute:()=>s.compile(i)}));}catch(l){throw this.#u(l)}try{Mt("query plan created",a);let l={},c=await o.execute({plan:a,model:t.modelName,operation:t.action,placeholderValues:l,transaction:r,batchIndex:void 0,customFetch:n?.(globalThis.fetch),queryInfo:{type:"single",modelName:t.modelName,action:t.action,query:t.query}});return Mt("query plan executed"),{data:{[t.action]:c}}}catch(l){throw this.#a(l,i)}}async requestBatch(t,{transaction:r,customDataProxyFetch:n}){if(t.length===0)return [];let i=t[0].action,o=t[0].modelName,s=JSON.stringify(ya(t,r)),{executor:a,queryCompiler:l}=await this.#i().catch(u=>{throw this.#a(u,s)}),c;try{c=this.#p(()=>this.#m({queries:t,execute:()=>l.compileBatch(s)}));}catch(u){throw this.#u(u)}try{let u;r?.kind==="itx"&&(u=r.options);let p={};switch(c.type){case "multi":{if(r?.kind!=="itx"){let g=r?.options.isolationLevel?{...this.config.transactionOptions,isolationLevel:r.options.isolationLevel}:this.config.transactionOptions;u=await this.transaction("start",{},g);}let y=[],h=!1;for(let[g,E]of c.plans.entries())try{let C=await a.execute({plan:E,placeholderValues:p,model:t[g].modelName,operation:t[g].action,batchIndex:g,transaction:u,customFetch:n?.(globalThis.fetch),queryInfo:{type:"single",...t[g]}});y.push({data:{[t[g].action]:C}});}catch(C){y.push(C),h=!0;break}return u!==void 0&&r?.kind!=="itx"&&(h?await this.transaction("rollback",{},u):await this.transaction("commit",{},u)),y}case "compacted":{if(!t.every(g=>g.action===i&&g.modelName===o)){let g=t.map(C=>C.action).join(", "),E=t.map(C=>C.modelName).join(", ");throw new Error(`Internal error: All queries in a compacted batch must have the same action and model name, but received actions: [${g}] and model names: [${E}]. This indicates a bug in the client. Please report this issue to the Prisma team with your query details.`)}if(o===void 0)throw new Error("Internal error: A compacted batch cannot contain raw queries. This indicates a bug in the client. Please report this issue to the Prisma team with your query details.");let y=await a.execute({plan:c.plan,placeholderValues:p,model:o,operation:i,batchIndex:void 0,transaction:u,customFetch:n?.(globalThis.fetch),queryInfo:{type:"compacted",action:i,modelName:o,queries:t}});return zo(y,c).map(g=>({data:{[i]:g}}))}}}catch(u){throw this.#a(u,s)}}async apiKey(){let{executor:t}=await this.#i();return t.apiKey()}#d(t){switch(t){case void 0:return;case "ReadUncommitted":return "READ UNCOMMITTED";case "ReadCommitted":return "READ COMMITTED";case "RepeatableRead":return "REPEATABLE READ";case "Serializable":return "SERIALIZABLE";case "Snapshot":return "SNAPSHOT";default:throw new I.PrismaClientKnownRequestError(`Inconsistent column data: Conversion failed: Invalid isolation level \`${t}\``,{code:"P2023",clientVersion:this.config.clientVersion,meta:{providedIsolationLevel:t}})}}#m({queries:t,execute:r}){return this.tracingHelper.runInChildSpan({name:"compile",attributes:{models:t.map(n=>n.modelName).filter(n=>n!==void 0),actions:t.map(n=>n.action)}},r)}};function Oa(e,t,r){return Ea({binaryTarget:void 0,title:t,version:e.config.clientVersion,engineVersion:"unknown",database:e.config.activeProvider,query:r})}function Fa(e){return new Dt(e)}var Ma=e=>({command:e});var Ua=require$$1$8;var Da=e=>e.strings.reduce((t,r,n)=>`${t}@P${n}${r}`);var La=require$$1$8;function Ge(e){try{return Na(e,"fast")}catch{return Na(e,"slow")}}function Na(e,t){return JSON.stringify(e.map(r=>$a(r,t)))}function $a(e,t){if(Array.isArray(e))return e.map(r=>$a(r,t));if(typeof e=="bigint")return {prisma__type:"bigint",prisma__value:e.toString()};if(ve(e))return {prisma__type:"date",prisma__value:e.toJSON()};if(La.Decimal.isDecimal(e))return {prisma__type:"decimal",prisma__value:e.toJSON()};if(Buffer.isBuffer(e))return {prisma__type:"bytes",prisma__value:e.toString("base64")};if(gd(e))return {prisma__type:"bytes",prisma__value:Buffer.from(e).toString("base64")};if(ArrayBuffer.isView(e)){let{buffer:r,byteOffset:n,byteLength:i}=e;return {prisma__type:"bytes",prisma__value:Buffer.from(r,n,i).toString("base64")}}return typeof e=="object"&&t==="slow"?qa(e):e}function gd(e){return e instanceof ArrayBuffer||e instanceof SharedArrayBuffer?true:typeof e=="object"&&e!==null?e[Symbol.toStringTag]==="ArrayBuffer"||e[Symbol.toStringTag]==="SharedArrayBuffer":false}function qa(e){if(typeof e!="object"||e===null)return e;if(typeof e.toJSON=="function")return e.toJSON();if(Array.isArray(e))return e.map(_a);let t={};for(let r of Object.keys(e))t[r]=_a(e[r]);return t}function _a(e){return typeof e=="bigint"?e.toString():qa(e)}var yd=/^(\s*alter\s)/i,Va=F("prisma:client");function Yn(e,t,r,n){if(!(e!=="postgresql"&&e!=="cockroachdb")&&r.length>0&&yd.exec(t))throw new Error(`Running ALTER using ${n} is not supported
Using the example below you can still execute your query with Prisma, but please note that it is vulnerable to SQL injection attacks and requires you to take care of input sanitization.

Example:
  await prisma.$executeRawUnsafe(\`ALTER USER prisma WITH PASSWORD '\${password}'\`)

More Information: https://pris.ly/d/execute-raw
`)}var Xn=({clientMethod:e,activeProvider:t})=>r=>{let n="",i;if(ar(r))n=r.sql,i={values:Ge(r.values),__prismaRawParameters__:true};else if(Array.isArray(r)){let[o,...s]=r;n=o,i={values:Ge(s||[]),__prismaRawParameters__:true};}else switch(t){case "sqlite":case "mysql":{n=r.sql,i={values:Ge(r.values),__prismaRawParameters__:true};break}case "cockroachdb":case "postgresql":case "postgres":{n=r.text,i={values:Ge(r.values),__prismaRawParameters__:true};break}case "sqlserver":{n=Da(r),i={values:Ge(r.values),__prismaRawParameters__:true};break}default:throw new Error(`The ${t} provider does not support ${e}`)}return i?.values?Va(`prisma.${e}(${n}, ${i.values})`):Va(`prisma.${e}(${n})`),{query:n,parameters:i}},ja={requestArgsToMiddlewareArgs(e){return [e.strings,...e.values]},middlewareArgsToRequestArgs(e){let[t,...r]=e;return new Ua.Sql(t,r)}},Ba={requestArgsToMiddlewareArgs(e){return [e]},middlewareArgsToRequestArgs(e){return e[0]}};function ei(e){return function(r,n){let i,o=(s=e)=>{try{return s===void 0||s?.kind==="itx"?i??=Qa(r(s)):Qa(r(s))}catch(a){return Promise.reject(a)}};return {get spec(){return n},then(s,a){return o().then(s,a)},catch(s){return o().catch(s)},finally(s){return o().finally(s)},requestTransaction(s){let a=o(s);return a.requestTransaction?a.requestTransaction(s):a},[Symbol.toStringTag]:"PrismaPromise"}}}function Qa(e){return typeof e.then=="function"?e:Promise.resolve(e)}var Ha={version:"7.1.0"};var wd=Ha.version.split(".")[0],xd="PRISMA_INSTRUMENTATION",bd=`V${wd}_PRISMA_INSTRUMENTATION`,Ja=globalThis;function Wa(){let e=Ja[bd];return e?.helper?e.helper:Ja[xd]?.helper}var Ed={isEnabled(){return  false},getTraceParent(){return "00-10-10-00"},dispatchEngineSpans(){},getActiveContext(){},runInChildSpan(e,t){return t()}},ti=class{isEnabled(){return this.getTracingHelper().isEnabled()}getTraceParent(t){return this.getTracingHelper().getTraceParent(t)}dispatchEngineSpans(t){return this.getTracingHelper().dispatchEngineSpans(t)}getActiveContext(){return this.getTracingHelper().getActiveContext()}runInChildSpan(t,r){return this.getTracingHelper().runInChildSpan(t,r)}getTracingHelper(){return Wa()??Ed}};function Ga(){return new ti}function Ka(e,t=()=>{}){let r,n=new Promise(i=>r=i);return {then(i){return --e===0&&r(t()),i?.(n)}}}function za(e){return typeof e=="string"?e:e.reduce((t,r)=>{let n=typeof r=="string"?r:r.level;return n==="query"?t:t&&(r==="info"||t==="info")?"info":n},void 0)}var Xa=require$$1$8;function Za(e){if(e.action!=="findUnique"&&e.action!=="findUniqueOrThrow")return;let t=[];return e.modelName&&t.push(e.modelName),e.query.arguments&&t.push(ri(e.query.arguments)),t.push(ri(e.query.selection)),t.join("")}function ri(e){return `(${Object.keys(e).sort().map(r=>{let n=e[r];return typeof n=="object"&&n!==null?`(${r} ${ri(n)})`:r}).join(" ")})`}var Td={aggregate:false,aggregateRaw:false,createMany:true,createManyAndReturn:true,createOne:true,deleteMany:true,deleteOne:true,executeRaw:true,findFirst:false,findFirstOrThrow:false,findMany:false,findRaw:false,findUnique:false,findUniqueOrThrow:false,groupBy:false,queryRaw:false,runCommandRaw:true,updateMany:true,updateManyAndReturn:true,updateOne:true,upsertOne:true};function ni(e){return Td[e]}var Lr=class{constructor(t){this.options=t;this.batches={};}batches;tickActive=false;request(t){let r=this.options.batchBy(t);return r?(this.batches[r]||(this.batches[r]=[],this.tickActive||(this.tickActive=true,process.nextTick(()=>{this.dispatchBatches(),this.tickActive=false;}))),new Promise((n,i)=>{this.batches[r].push({request:t,resolve:n,reject:i});})):this.options.singleLoader(t)}dispatchBatches(){for(let t in this.batches){let r=this.batches[t];delete this.batches[t],r.length===1?this.options.singleLoader(r[0].request).then(n=>{n instanceof Error?r[0].reject(n):r[0].resolve(n);}).catch(n=>{r[0].reject(n);}):(r.sort((n,i)=>this.options.batchOrder(n.request,i.request)),this.options.batchLoader(r.map(n=>n.request)).then(n=>{if(n instanceof Error)for(let i=0;i<r.length;i++)r[i].reject(n);else for(let i=0;i<r.length;i++){let o=n[i];o instanceof Error?r[i].reject(o):r[i].resolve(o);}}).catch(n=>{for(let i=0;i<r.length;i++)r[i].reject(n);}));}}get[Symbol.toStringTag](){return "DataLoader"}};var Ya=require$$1$8;function Te(e,t){if(t===null)return t;switch(e){case "bigint":return BigInt(t);case "bytes":{let{buffer:r,byteOffset:n,byteLength:i}=Buffer.from(t,"base64");return new Uint8Array(r,n,i)}case "decimal":return new Ya.Decimal(t);case "datetime":case "date":return new Date(t);case "time":return new Date(`1970-01-01T${t}Z`);case "bigint-array":return t.map(r=>Te("bigint",r));case "bytes-array":return t.map(r=>Te("bytes",r));case "decimal-array":return t.map(r=>Te("decimal",r));case "datetime-array":return t.map(r=>Te("datetime",r));case "date-array":return t.map(r=>Te("date",r));case "time-array":return t.map(r=>Te("time",r));default:return t}}function $r(e){let t=[],r=Pd(e);for(let n=0;n<e.rows.length;n++){let i=e.rows[n],o={...r};for(let s=0;s<i.length;s++)o[e.columns[s]]=Te(e.types[s],i[s]);t.push(o);}return t}function Pd(e){let t={};for(let r=0;r<e.columns.length;r++)t[e.columns[r]]=null;return t}var Ad=F("prisma:client:request_handler"),qr=class{client;dataloader;logEmitter;constructor(t,r){this.logEmitter=r,this.client=t,this.dataloader=new Lr({batchLoader:Vo(async({requests:n,customDataProxyFetch:i})=>{let{transaction:o,otelParentCtx:s}=n[0],a=n.map(p=>p.protocolQuery),l=this.client._tracingHelper.getTraceParent(s),c=n.some(p=>ni(p.protocolQuery.action));return (await this.client._engine.requestBatch(a,{traceparent:l,transaction:Sd(o),containsWrite:c,customDataProxyFetch:i})).map((p,y)=>{if(p instanceof Error)return p;try{return this.mapQueryEngineResult(n[y],p)}catch(h){return h}})}),singleLoader:async n=>{let i=n.transaction?.kind==="itx"?el(n.transaction):void 0,o=await this.client._engine.request(n.protocolQuery,{traceparent:this.client._tracingHelper.getTraceParent(),interactiveTransaction:i,isWrite:ni(n.protocolQuery.action),customDataProxyFetch:n.customDataProxyFetch});return this.mapQueryEngineResult(n,o)},batchBy:n=>n.transaction?.id?`transaction-${n.transaction.id}`:Za(n.protocolQuery),batchOrder(n,i){return n.transaction?.kind==="batch"&&i.transaction?.kind==="batch"?n.transaction.index-i.transaction.index:0}});}async request(t){try{return await this.dataloader.request(t)}catch(r){let{clientMethod:n,callsite:i,transaction:o,args:s,modelName:a}=t;this.handleAndLogRequestError({error:r,clientMethod:n,callsite:i,transaction:o,args:s,modelName:a,globalOmit:t.globalOmit});}}mapQueryEngineResult({dataPath:t,unpacker:r},n){let i=n?.data,o=this.unpack(i,t,r);return process.env.PRISMA_CLIENT_GET_TIME?{data:o}:o}handleAndLogRequestError(t){try{this.handleRequestError(t);}catch(r){throw this.logEmitter&&this.logEmitter.emit("error",{message:r.message,target:t.clientMethod,timestamp:new Date}),r}}handleRequestError({error:t,clientMethod:r,callsite:n,transaction:i,args:o,modelName:s,globalOmit:a}){if(Ad(t),vd(t,i))throw t;if(t instanceof w.PrismaClientKnownRequestError&&Cd(t)){let c=tl(t.meta);tr({args:o,errors:[c],callsite:n,errorFormat:this.client._errorFormat,originalMethod:r,clientVersion:this.client._clientVersion,globalOmit:a});}let l=t.message;if(n&&(l=Wt({callsite:n,originalMethod:r,isPanic:t.isPanic,showColors:this.client._errorFormat==="pretty",message:l})),l=this.sanitizeMessage(l),t.code){let c=s?{modelName:s,...t.meta}:t.meta;throw new w.PrismaClientKnownRequestError(l,{code:t.code,clientVersion:this.client._clientVersion,meta:c,batchRequestIdx:t.batchRequestIdx})}else {if(t.isPanic)throw new w.PrismaClientRustPanicError(l,this.client._clientVersion);if(t instanceof w.PrismaClientUnknownRequestError)throw new w.PrismaClientUnknownRequestError(l,{clientVersion:this.client._clientVersion,batchRequestIdx:t.batchRequestIdx});if(t instanceof w.PrismaClientInitializationError)throw new w.PrismaClientInitializationError(l,this.client._clientVersion);if(t instanceof w.PrismaClientRustPanicError)throw new w.PrismaClientRustPanicError(l,this.client._clientVersion)}throw t.clientVersion=this.client._clientVersion,t}sanitizeMessage(t){return this.client._errorFormat&&this.client._errorFormat!=="pretty"?Se(t):t}unpack(t,r,n){if(!t||(t.data&&(t=t.data),!t))return t;let i=Object.keys(t)[0],o=Object.values(t)[0],s=r.filter(c=>c!=="select"&&c!=="include"),a=un(o,s),l=i==="queryRaw"?$r(a):le(a);return n?n(l):l}get[Symbol.toStringTag](){return "RequestHandler"}};function Sd(e){if(e){if(e.kind==="batch")return {kind:"batch",options:{isolationLevel:e.isolationLevel}};if(e.kind==="itx")return {kind:"itx",options:el(e)};X(e,"Unknown transaction kind");}}function el(e){return {id:e.id,payload:e.payload}}function vd(e,t){return (0, Xa.hasBatchIndex)(e)&&t?.kind==="batch"&&e.batchRequestIdx!==t.index}function Cd(e){return e.code==="P2009"||e.code==="P2012"}function tl(e){if(e.kind==="Union")return {kind:"Union",errors:e.errors.map(tl)};if(Array.isArray(e.selectionPath)){let[,...t]=e.selectionPath;return {...e,selectionPath:t}}return e}var ii=Or;var sl=V(en());var v=class extends Error{constructor(t){super(t+`
Read more at https://pris.ly/d/client-constructor`),this.name="PrismaClientConstructorValidationError";}get[Symbol.toStringTag](){return "PrismaClientConstructorValidationError"}};at(v,"PrismaClientConstructorValidationError");var rl=["errorFormat","adapter","accelerateUrl","log","transactionOptions","omit","comments","__internal"],nl=["pretty","colorless","minimal"],il=["info","query","warn","error"],Rd={adapter:()=>{},accelerateUrl:e=>{if(e!==void 0){if(typeof e!="string")throw new v(`Invalid value ${JSON.stringify(e)} for "accelerateUrl" provided to PrismaClient constructor.`);if(e.trim().length===0)throw new v('"accelerateUrl" provided to PrismaClient constructor must be a non-empty string.')}},errorFormat:e=>{if(e){if(typeof e!="string")throw new v(`Invalid value ${JSON.stringify(e)} for "errorFormat" provided to PrismaClient constructor.`);if(!nl.includes(e)){let t=Nt(e,nl);throw new v(`Invalid errorFormat ${e} provided to PrismaClient constructor.${t}`)}}},log:e=>{if(!e)return;if(!Array.isArray(e))throw new v(`Invalid value ${JSON.stringify(e)} for "log" provided to PrismaClient constructor.`);function t(r){if(typeof r=="string"&&!il.includes(r)){let n=Nt(r,il);throw new v(`Invalid log level "${r}" provided to PrismaClient constructor.${n}`)}}for(let r of e){t(r);let n={level:t,emit:i=>{let o=["stdout","event"];if(!o.includes(i)){let s=Nt(i,o);throw new v(`Invalid value ${JSON.stringify(i)} for "emit" in logLevel provided to PrismaClient constructor.${s}`)}}};if(r&&typeof r=="object")for(let[i,o]of Object.entries(r))if(n[i])n[i](o);else throw new v(`Invalid property ${i} for "log" provided to PrismaClient constructor`)}},transactionOptions:e=>{if(!e)return;let t=e.maxWait;if(t!=null&&t<=0)throw new v(`Invalid value ${t} for maxWait in "transactionOptions" provided to PrismaClient constructor. maxWait needs to be greater than 0`);let r=e.timeout;if(r!=null&&r<=0)throw new v(`Invalid value ${r} for timeout in "transactionOptions" provided to PrismaClient constructor. timeout needs to be greater than 0`)},omit:(e,t)=>{if(typeof e!="object")throw new v('"omit" option is expected to be an object.');if(e===null)throw new v('"omit" option can not be `null`');let r=[];for(let[n,i]of Object.entries(e)){let o=Id(n,t.runtimeDataModel);if(!o){r.push({kind:"UnknownModel",modelKey:n});continue}for(let[s,a]of Object.entries(i)){let l=o.fields.find(c=>c.name===s);if(!l){r.push({kind:"UnknownField",modelKey:n,fieldName:s});continue}if(l.relationName){r.push({kind:"RelationInOmit",modelKey:n,fieldName:s});continue}typeof a!="boolean"&&r.push({kind:"InvalidFieldValue",modelKey:n,fieldName:s});}}if(r.length>0)throw new v(Fd(e,r))},comments:e=>{if(e!==void 0){if(!Array.isArray(e))throw new v(`Invalid value ${JSON.stringify(e)} for "comments" provided to PrismaClient constructor. Expected an array of SQL commenter plugins.`);for(let t=0;t<e.length;t++)if(typeof e[t]!="function")throw new v(`Invalid value at index ${t} for "comments" provided to PrismaClient constructor. Each plugin must be a function.`)}},__internal:e=>{if(!e)return;let t=["debug","engine","configOverride"];if(typeof e!="object")throw new v(`Invalid value ${JSON.stringify(e)} for "__internal" to PrismaClient constructor`);for(let[r]of Object.entries(e))if(!t.includes(r)){let n=Nt(r,t);throw new v(`Invalid property ${JSON.stringify(r)} for "__internal" provided to PrismaClient constructor.${n}`)}}};function kd(e){let t=e.adapter!==void 0,r=e.accelerateUrl!==void 0;if(t&&r)throw new v('The "adapter" and "accelerateUrl" options are mutually exclusive. Please provide only one of them.');if(!t&&!r)throw new v('Using engine type "client" requires either "adapter" or "accelerateUrl" to be provided to PrismaClient constructor.')}function al(e,t){for(let[r,n]of Object.entries(e)){if(!rl.includes(r)){let i=Nt(r,rl);throw new v(`Unknown property ${r} provided to PrismaClient constructor.${i}`)}Rd[r](n,t);}kd(e);}function Nt(e,t){if(t.length===0||typeof e!="string")return "";let r=Od(e,t);return r?` Did you mean "${r}"?`:""}function Od(e,t){if(t.length===0)return null;let r=t.map(i=>({value:i,distance:(0, sl.default)(e,i)}));r.sort((i,o)=>i.distance<o.distance?-1:1);let n=r[0];return n.distance<3?n.value:null}function Id(e,t){return ol(t.models,e)??ol(t.types,e)}function ol(e,t){let r=Object.keys(e).find(n=>ie(n)===t);if(r)return e[r]}function Fd(e,t){let r=Ne(e);for(let o of t)switch(o.kind){case "UnknownModel":r.arguments.getField(o.modelKey)?.markAsError(),r.addErrorMessage(()=>`Unknown model name: ${o.modelKey}.`);break;case "UnknownField":r.arguments.getDeepField([o.modelKey,o.fieldName])?.markAsError(),r.addErrorMessage(()=>`Model "${o.modelKey}" does not have a field named "${o.fieldName}".`);break;case "RelationInOmit":r.arguments.getDeepField([o.modelKey,o.fieldName])?.markAsError(),r.addErrorMessage(()=>'Relations are already excluded by default and can not be specified in "omit".');break;case "InvalidFieldValue":r.arguments.getDeepFieldValue([o.modelKey,o.fieldName])?.markAsError(),r.addErrorMessage(()=>"Omit field option value must be a boolean.");break}let{message:n,args:i}=er(r,"colorless");return `Error validating "omit" option:

${i}

${n}`}var ll=require$$1$8;function cl(e){return e.length===0?Promise.resolve([]):new Promise((t,r)=>{let n=new Array(e.length),i=null,o=false,s=0,a=()=>{o||(s++,s===e.length&&(o=true,i?r(i):t(n)));},l=c=>{o||(o=true,r(c));};for(let c=0;c<e.length;c++)e[c].then(u=>{n[c]=u,a();},u=>{if(!(0, ll.hasBatchIndex)(u)){l(u);return}u.batchRequestIdx===c?l(u):(i||(i=u),a());});})}var _t=F("prisma:client");typeof globalThis=="object"&&(globalThis.NODE_CLIENT=true);var Md={requestArgsToMiddlewareArgs:e=>e,middlewareArgsToRequestArgs:e=>e},Dd=Symbol.for("prisma.client.transaction.id"),Nd={id:0,nextId(){return ++this.id}};function fl(e){class t{_originalClient=this;_runtimeDataModel;_requestHandler;_connectionPromise;_disconnectionPromise;_engineConfig;_accelerateEngineConfig;_clientVersion;_errorFormat;_tracingHelper;_previewFeatures;_activeProvider;_globalOmit;_extensions;_engine;_appliedParent;_createPrismaPromise=ei();constructor(n){if(!n)throw new w.PrismaClientInitializationError("`PrismaClient` needs to be constructed with a non-empty, valid `PrismaClientOptions`:\n\n```\nnew PrismaClient({\n  ...\n})\n```\n\nor\n\n```\nconstructor() {\n  super({ ... });\n}\n```\n          ",ii);e=n.__internal?.configOverride?.(e)??e,al(n,e);let i=new ml.EventEmitter().on("error",()=>{});this._extensions=_e.empty(),this._previewFeatures=e.previewFeatures,this._clientVersion=e.clientVersion??ii,this._activeProvider=e.activeProvider,this._globalOmit=n?.omit,this._tracingHelper=Ga();let o;if(n.adapter){o=n.adapter;let s=e.activeProvider==="postgresql"||e.activeProvider==="cockroachdb"?"postgres":e.activeProvider;if(o.provider!==s)throw new w.PrismaClientInitializationError(`The Driver Adapter \`${o.adapterName}\`, based on \`${o.provider}\`, is not compatible with the provider \`${s}\` specified in the Prisma schema.`,this._clientVersion)}try{let s=n??{},l=(s.__internal??{}).debug===!0;if(l&&F.enable("prisma:client"),s.errorFormat?this._errorFormat=s.errorFormat:process.env.NODE_ENV==="production"?this._errorFormat="minimal":process.env.NO_COLOR?this._errorFormat="colorless":this._errorFormat="colorless",this._runtimeDataModel=e.runtimeDataModel,this._engineConfig={enableDebugLogs:l,logLevel:s.log&&za(s.log),logQueries:s.log&&!!(typeof s.log=="string"?s.log==="query":s.log.find(c=>typeof c=="string"?c==="query":c.level==="query")),compilerWasm:e.compilerWasm,clientVersion:e.clientVersion,previewFeatures:this._previewFeatures,activeProvider:e.activeProvider,inlineSchema:e.inlineSchema,tracingHelper:this._tracingHelper,transactionOptions:{maxWait:s.transactionOptions?.maxWait??2e3,timeout:s.transactionOptions?.timeout??5e3,isolationLevel:s.transactionOptions?.isolationLevel},logEmitter:i,adapter:o,accelerateUrl:s.accelerateUrl,sqlCommenters:s.comments},this._accelerateEngineConfig=Object.create(this._engineConfig),this._accelerateEngineConfig.accelerateUtils={resolveDatasourceUrl:()=>{if(s.accelerateUrl)return s.accelerateUrl;throw new w.PrismaClientInitializationError(`\`accelerateUrl\` is required when using \`@prisma/extension-accelerate\`:

new PrismaClient({
  accelerateUrl: "prisma://...",
}).$extends(withAccelerate())
`,e.clientVersion)}},_t("clientVersion",e.clientVersion),this._engine=Fa(this._engineConfig),this._requestHandler=new qr(this,i),s.log)for(let c of s.log){let u=typeof c=="string"?c:c.emit==="stdout"?c.level:null;u&&this.$on(u,p=>{ot.log(`${ot.tags[u]??""}`,p.message||p.query);});}}catch(s){throw s.clientVersion=this._clientVersion,s}return this._appliedParent=ht(this)}get[Symbol.toStringTag](){return "PrismaClient"}$on(n,i){return n==="beforeExit"?this._engine.onBeforeExit(i):n&&this._engineConfig.logEmitter.on(n,i),this}$connect(){try{return this._engine.start()}catch(n){throw n.clientVersion=this._clientVersion,n}}async $disconnect(){try{await this._engine.stop();}catch(n){throw n.clientVersion=this._clientVersion,n}finally{bi();}}$executeRawInternal(n,i,o,s){let a=this._activeProvider;return this._request({action:"executeRaw",args:o,transaction:n,clientMethod:i,argsMapper:Xn({clientMethod:i,activeProvider:a}),callsite:ae(this._errorFormat),dataPath:[],middlewareArgsMapper:s})}$executeRaw(n,...i){return this._createPrismaPromise(o=>{if(n.raw!==void 0||n.sql!==void 0){let[s,a]=ul(n,i);return Yn(this._activeProvider,s.text,s.values,Array.isArray(n)?"prisma.$executeRaw`<SQL>`":"prisma.$executeRaw(sql`<SQL>`)"),this.$executeRawInternal(o,"$executeRaw",s,a)}throw new w.PrismaClientValidationError("`$executeRaw` is a tag function, please use it like the following:\n```\nconst result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`\n```\n\nOr read our docs at https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#executeraw\n",{clientVersion:this._clientVersion})})}$executeRawUnsafe(n,...i){return this._createPrismaPromise(o=>(Yn(this._activeProvider,n,i,"prisma.$executeRawUnsafe(<SQL>, [...values])"),this.$executeRawInternal(o,"$executeRawUnsafe",[n,...i])))}$runCommandRaw(n){if(e.activeProvider!=="mongodb")throw new w.PrismaClientValidationError(`The ${e.activeProvider} provider does not support $runCommandRaw. Use the mongodb provider.`,{clientVersion:this._clientVersion});return this._createPrismaPromise(i=>this._request({args:n,clientMethod:"$runCommandRaw",dataPath:[],action:"runCommandRaw",argsMapper:Ma,callsite:ae(this._errorFormat),transaction:i}))}async $queryRawInternal(n,i,o,s){let a=this._activeProvider;return this._request({action:"queryRaw",args:o,transaction:n,clientMethod:i,argsMapper:Xn({clientMethod:i,activeProvider:a}),callsite:ae(this._errorFormat),dataPath:[],middlewareArgsMapper:s})}$queryRaw(n,...i){return this._createPrismaPromise(o=>{if(n.raw!==void 0||n.sql!==void 0)return this.$queryRawInternal(o,"$queryRaw",...ul(n,i));throw new w.PrismaClientValidationError("`$queryRaw` is a tag function, please use it like the following:\n```\nconst result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`\n```\n\nOr read our docs at https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#queryraw\n",{clientVersion:this._clientVersion})})}$queryRawTyped(n){return this._createPrismaPromise(i=>{if(!this._hasPreviewFlag("typedSql"))throw new w.PrismaClientValidationError("`typedSql` preview feature must be enabled in order to access $queryRawTyped API",{clientVersion:this._clientVersion});return this.$queryRawInternal(i,"$queryRawTyped",n)})}$queryRawUnsafe(n,...i){return this._createPrismaPromise(o=>this.$queryRawInternal(o,"$queryRawUnsafe",[n,...i]))}_transactionWithArray({promises:n,options:i}){let o=Nd.nextId(),s=Ka(n.length),a=n.map((l,c)=>{if(l?.[Symbol.toStringTag]!=="PrismaPromise")throw new Error("All elements of the array need to be Prisma Client promises. Hint: Please make sure you are not awaiting the Prisma client calls you intended to pass in the $transaction function.");let u=i?.isolationLevel??this._engineConfig.transactionOptions.isolationLevel,p={kind:"batch",id:o,index:c,isolationLevel:u,lock:s};return l.requestTransaction?.(p)??l});return cl(a)}async _transactionWithCallback({callback:n,options:i}){let o={traceparent:this._tracingHelper.getTraceParent()},s={maxWait:i?.maxWait??this._engineConfig.transactionOptions.maxWait,timeout:i?.timeout??this._engineConfig.transactionOptions.timeout,isolationLevel:i?.isolationLevel??this._engineConfig.transactionOptions.isolationLevel},a=await this._engine.transaction("start",o,s),l;try{let c={kind:"itx",...a};l=await n(this._createItxClient(c)),await this._engine.transaction("commit",o,a);}catch(c){throw await this._engine.transaction("rollback",o,a).catch(()=>{}),c}return l}_createItxClient(n){return Q(ht(Q(Oo(this),[D("_appliedParent",()=>this._appliedParent._createItxClient(n)),D("_createPrismaPromise",()=>ei(n)),D(Dd,()=>n.id)])),[Le(No)])}$transaction(n,i){let o;typeof n=="function"?this._engineConfig.adapter?.adapterName==="@prisma/adapter-d1"?o=()=>{throw new Error("Cloudflare D1 does not support interactive transactions. We recommend you to refactor your queries with that limitation in mind, and use batch transactions with `prisma.$transactions([])` where applicable.")}:o=()=>this._transactionWithCallback({callback:n,options:i}):o=()=>this._transactionWithArray({promises:n,options:i});let s={name:"transaction",attributes:{method:"$transaction"}};return this._tracingHelper.runInChildSpan(s,o)}_request(n){n.otelParentCtx=this._tracingHelper.getActiveContext();let i=n.middlewareArgsMapper??Md,o={args:i.requestArgsToMiddlewareArgs(n.args),dataPath:n.dataPath,runInTransaction:!!n.transaction,action:n.action,model:n.model},s={operation:{name:"operation",attributes:{method:o.action,model:o.model,name:o.model?`${o.model}.${o.action}`:o.action}}},a=async l=>{let{runInTransaction:c,args:u,...p}=l,y={...n,...p};u&&(y.args=i.middlewareArgsToRequestArgs(u)),n.transaction!==void 0&&c===false&&delete y.transaction;let h=await qo(this,y);return y.model?Do({result:h,modelName:y.model,args:y.args,extensions:this._extensions,runtimeDataModel:this._runtimeDataModel,globalOmit:this._globalOmit}):h};return this._tracingHelper.runInChildSpan(s.operation,()=>new dl.AsyncResource("prisma-client-request").runInAsyncScope(()=>a(o)))}async _executeRequest({args:n,clientMethod:i,dataPath:o,callsite:s,action:a,model:l,argsMapper:c,transaction:u,unpacker:p,otelParentCtx:y,customDataProxyFetch:h}){try{n=c?c(n):n;let g={name:"serialize"},E=this._tracingHelper.runInChildSpan(g,()=>or({modelName:l,runtimeDataModel:this._runtimeDataModel,action:a,args:n,clientMethod:i,callsite:s,extensions:this._extensions,errorFormat:this._errorFormat,clientVersion:this._clientVersion,previewFeatures:this._previewFeatures,globalOmit:this._globalOmit}));return F.enabled("prisma:client")&&(_t("Prisma Client call:"),_t(`prisma.${i}(${xo(n)})`),_t("Generated request:"),_t(JSON.stringify(E,null,2)+`
`)),u?.kind==="batch"&&await u.lock,this._requestHandler.request({protocolQuery:E,modelName:l,action:a,clientMethod:i,dataPath:o,callsite:s,args:n,extensions:this._extensions,transaction:u,unpacker:p,otelParentCtx:y,otelChildCtx:this._tracingHelper.getActiveContext(),globalOmit:this._globalOmit,customDataProxyFetch:h})}catch(g){throw g.clientVersion=this._clientVersion,g}}_hasPreviewFlag(n){return !!this._engineConfig.previewFeatures?.includes(n)}$extends=Io}return t}function ul(e,t){return _d(e)?[new pl.Sql(e,t),ja]:[e,Ba]}function _d(e){return Array.isArray(e)&&Array.isArray(e.raw)}var Ld=new Set(["toJSON","$$typeof","asymmetricMatch",Symbol.iterator,Symbol.toStringTag,Symbol.isConcatSpreadable,Symbol.toPrimitive]);function gl(e){return new Proxy(e,{get(t,r){if(r in t)return t[r];if(!Ld.has(r))throw new TypeError(`Invalid enum value: ${String(r)}`)}})}var $d=()=>globalThis.process?.release?.name==="node",qd=()=>!!globalThis.Bun||!!globalThis.process?.versions?.bun,Vd=()=>!!globalThis.Deno,Ud=()=>typeof globalThis.Netlify=="object",jd=()=>typeof globalThis.EdgeRuntime=="object",Bd=()=>globalThis.navigator?.userAgent==="Cloudflare-Workers";function Qd(){return [[Ud,"netlify"],[jd,"edge-light"],[Bd,"workerd"],[Vd,"deno"],[qd,"bun"],[$d,"node"]].flatMap(r=>r[0]()?[r[1]]:[]).at(0)??""}var Hd={node:"Node.js",workerd:"Cloudflare Workers",deno:"Deno and Deno Deploy",netlify:"Netlify Edge Functions","edge-light":"Edge Runtime (Vercel Edge Functions, Vercel Edge Middleware, Next.js (Pages Router) Edge API Routes, Next.js (App Router) Edge Route Handlers or Next.js Middleware)"};function yl(){let e=Qd();return {id:e,prettyName:Hd[e]||e,isEdge:["workerd","deno","netlify","edge-light"].includes(e)}}var w=require$$1$8,Z=require$$1$8,M=require$$1$8,hl=require$$1$8;	/*! Bundled license information:

	@noble/hashes/utils.js:
	  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
	*/
	
	return client;
}

var clientExports = /*@__PURE__*/ requireClient();

/* !!! This is code generated by Prisma. Do not edit directly. !!! */
/* eslint-disable */
// biome-ignore-all lint: generated file
// @ts-nocheck 
/*
* WARNING: This is an internal file that is subject to change!
*
* 🛑 Under no circumstances should you import this file directly! 🛑
*
* Please import the `PrismaClient` class from the `client.ts` file instead.
*/
const config = {
	"previewFeatures": ["postgresqlExtensions"],
	"clientVersion": "7.1.0",
	"engineVersion": "ab635e6b9d606fa5c8fb8b1a7f909c3c3c1c98ba",
	"activeProvider": "postgresql",
	"inlineSchema": "model User {\n  id            String       @id\n  name          String\n  email         String\n  emailVerified Boolean      @default(false)\n  image         String?\n  createdAt     DateTime     @default(now())\n  updatedAt     DateTime     @updatedAt\n  role          String?\n  banned        Boolean?     @default(false)\n  banReason     String?\n  banExpires    DateTime?\n  sessions      Session[]\n  accounts      Account[]\n  members       Member[]\n  invitations   Invitation[]\n  auditLogs     AuditLog[]   @relation(\"AuditLogActor\")\n\n  @@unique([email])\n  @@map(\"user\")\n}\n\nmodel Session {\n  id                   String   @id\n  expiresAt            DateTime\n  token                String\n  createdAt            DateTime @default(now())\n  updatedAt            DateTime @updatedAt\n  ipAddress            String?\n  userAgent            String?\n  userId               String\n  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n  impersonatedBy       String?\n  activeOrganizationId String?\n\n  @@unique([token])\n  @@index([userId])\n  @@map(\"session\")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map(\"account\")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map(\"verification\")\n}\n\nmodel Organization {\n  id            String          @id\n  name          String\n  slug          String\n  logo          String?\n  createdAt     DateTime\n  metadata      String?\n  members       Member[]\n  invitations   Invitation[]\n  conversations conversations[]\n\n  @@unique([slug])\n  @@map(\"organization\")\n}\n\nmodel Member {\n  id             String       @id\n  organizationId String\n  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)\n  userId         String\n  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)\n  role           String       @default(\"member\")\n  createdAt      DateTime\n\n  @@index([organizationId])\n  @@index([userId])\n  @@map(\"member\")\n}\n\nmodel Invitation {\n  id             String       @id\n  organizationId String\n  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)\n  email          String\n  role           String?\n  status         String       @default(\"pending\")\n  expiresAt      DateTime\n  createdAt      DateTime     @default(now())\n  inviterId      String\n  user           User         @relation(fields: [inviterId], references: [id], onDelete: Cascade)\n\n  @@index([organizationId])\n  @@index([email])\n  @@map(\"invitation\")\n}\n\nmodel AuditLog {\n  id             String   @id @default(cuid())\n  action         String // e.g., \"SUPER_ADMIN_PROMOTED\", \"USER_SUSPENDED\"\n  actorId        String // Super admin who performed action\n  actor          User     @relation(\"AuditLogActor\", fields: [actorId], references: [id], onDelete: Cascade)\n  targetType     String // \"USER\" | \"ORGANIZATION\" | \"SESSION\"\n  targetId       String // ID of affected entity\n  organizationId String? // If action relates to an org\n  metadata       String? // JSON with additional context\n  ipAddress      String? // From request headers\n  userAgent      String? // From request headers\n  createdAt      DateTime @default(now())\n\n  @@index([actorId])\n  @@index([targetType, targetId])\n  @@index([organizationId])\n  @@index([createdAt])\n  @@map(\"audit_log\")\n}\n\n/// This model or at least one of its fields has comments in the database, and requires an additional setup for migrations: Read more: https://pris.ly/d/database-comments\nmodel documents {\n  id                    String                 @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  content_hash          String                 @unique(map: \"idx_documents_content_hash\")\n  filename              String\n  mimetype              String\n  size                  BigInt\n  storage_path          String\n  public_url            String\n  storage_bucket        String\n  /// Full extracted text from document - stored for reference and full-text search\n  extracted_text        String?\n  /// Character count of extracted text - used for metrics and debugging\n  extracted_text_length Int?                   @default(0)\n  /// Indicates if document has been chunked and embedded (true = chunks exist)\n  has_embedding         Boolean?               @default(false)\n  user_id               String?                @db.Uuid\n  created_at            DateTime               @default(now()) @db.Timestamptz(6)\n  updated_at            DateTime               @default(now()) @db.Timestamptz(6)\n  /// Legacy single embedding field - no longer used (replaced by chunk embeddings)\n  embedding             Unsupported(\"vector\")?\n  /// Relation to document chunks - one document has many chunks\n  chunks                document_chunks[]\n\n  @@index([created_at(sort: Desc)], map: \"idx_documents_created_at\")\n  @@index([user_id], map: \"idx_documents_user_id\")\n}\n\n/// Stores text chunks from documents with their vector embeddings for semantic search.\n/// Documents are split into overlapping chunks (1000 chars, 200 overlap) to enable\n/// precise semantic search and handle large documents within embedding token limits.\nmodel document_chunks {\n  id              String                 @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  /// Foreign key to parent document - links chunk back to its source document\n  document_id     String                 @db.Uuid\n  /// Position of chunk in document (0, 1, 2...) - used to retrieve chunks in order\n  chunk_index     Int\n  /// The actual text content of this chunk - returned in search results\n  content         String\n  /// Estimated token count (~chars/4) - useful for cost tracking and debugging\n  token_count     Int?\n  /// 3072-dimensional vector embedding from OpenAI (text-embedding-3-large)\n  /// Used for cosine similarity search with pgvector's <=> operator\n  embedding       Unsupported(\"vector\")?\n  /// JSON metadata storing chunk position info: chunkIndex, startPosition, endPosition, length\n  /// Useful for highlighting matches and retrieving surrounding context\n  metadata        Json?\n  created_at      DateTime               @default(now()) @db.Timestamptz(6)\n  document        documents              @relation(fields: [document_id], references: [id], onDelete: Cascade)\n  message_sources message_sources[]\n\n  @@unique([document_id, chunk_index], map: \"idx_document_chunks_unique\")\n  @@index([document_id], map: \"idx_document_chunks_document_id\")\n}\n\n/// Stores chat conversations - each conversation is a separate chat session\nmodel conversations {\n  id               String        @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  /// Optional title for the conversation - can be auto-generated from first message\n  title            String?\n  /// Indicates whether the conversation has been escalated to a human agent\n  is_escalated     Boolean       @default(false)\n  /// Optional escalation reason captured when the AI routes to a human\n  escalated_reason String?\n  /// Timestamp of when the conversation was escalated\n  escalated_at     DateTime?     @db.Timestamptz(6)\n  /// Indicates whether the conversation has been resolved by a human agent\n  is_resolved      Boolean       @default(false)\n  /// Timestamp of when the conversation was resolved\n  resolved_at      DateTime?     @db.Timestamptz(6)\n  /// Name of the agent that closed the conversation\n  resolved_by      String?\n  /// (Optional) Name of the human agent that picked up the conversation\n  agent_name       String?\n  /// Timestamp of when the agent joined the conversation\n  agent_joined_at  DateTime?     @db.Timestamptz(6)\n  /// Foreign key to the organization this conversation belongs to\n  organization_id  String?\n  /// Relation to the organization\n  organization     Organization? @relation(fields: [organization_id], references: [id], onDelete: SetNull)\n  created_at       DateTime      @default(now()) @db.Timestamptz(6)\n  updated_at       DateTime      @default(now()) @db.Timestamptz(6)\n  /// Relation to messages - one conversation has many messages\n  messages         messages[]\n\n  @@index([created_at(sort: Desc)], map: \"idx_conversations_created_at\")\n  @@index([updated_at(sort: Desc)], map: \"idx_conversations_updated_at\")\n  @@index([is_resolved, updated_at(sort: Desc)], map: \"idx_conversations_resolved\")\n  @@index([organization_id], map: \"idx_conversations_organization_id\")\n}\n\n/// Stores individual messages in conversations (user and assistant messages)\nmodel messages {\n  id              String            @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  /// Foreign key to parent conversation\n  conversation_id String            @db.Uuid\n  /// Message role: \"user\", \"assistant\", or \"system\"\n  role            String\n  /// The text content of the message\n  content         String\n  created_at      DateTime          @default(now()) @db.Timestamptz(6)\n  /// Relation to parent conversation\n  conversation    conversations     @relation(fields: [conversation_id], references: [id], onDelete: Cascade)\n  /// Relation to source chunks used to generate this message (for citations)\n  sources         message_sources[]\n\n  @@index([conversation_id], map: \"idx_messages_conversation_id\")\n  @@index([created_at(sort: Desc)], map: \"idx_messages_created_at\")\n}\n\n/// Links messages with document chunks used as context (for citation tracking)\nmodel message_sources {\n  id               String          @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  /// Foreign key to the message this source was used for\n  message_id       String          @db.Uuid\n  /// Foreign key to the document chunk that was used as context\n  chunk_id         String          @db.Uuid\n  /// Cosine similarity score (0-1) from vector search - indicates relevance\n  similarity_score Float\n  created_at       DateTime        @default(now()) @db.Timestamptz(6)\n  /// Relation to parent message\n  message          messages        @relation(fields: [message_id], references: [id], onDelete: Cascade)\n  /// Relation to document chunk used as source\n  chunk            document_chunks @relation(fields: [chunk_id], references: [id], onDelete: Cascade)\n\n  @@index([message_id], map: \"idx_message_sources_message_id\")\n  @@index([chunk_id], map: \"idx_message_sources_chunk_id\")\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider        = \"prisma-client\"\n  output          = \"../generated\"\n  previewFeatures = [\"postgresqlExtensions\"]\n}\n\ndatasource db {\n  provider   = \"postgresql\"\n  extensions = [vector]\n}\n",
	"runtimeDataModel": {
		"models": {},
		"enums": {},
		"types": {}
	}
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"emailVerified\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"image\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"role\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"banned\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"banReason\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"banExpires\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"sessions\",\"kind\":\"object\",\"type\":\"Session\",\"relationName\":\"SessionToUser\"},{\"name\":\"accounts\",\"kind\":\"object\",\"type\":\"Account\",\"relationName\":\"AccountToUser\"},{\"name\":\"members\",\"kind\":\"object\",\"type\":\"Member\",\"relationName\":\"MemberToUser\"},{\"name\":\"invitations\",\"kind\":\"object\",\"type\":\"Invitation\",\"relationName\":\"InvitationToUser\"},{\"name\":\"auditLogs\",\"kind\":\"object\",\"type\":\"AuditLog\",\"relationName\":\"AuditLogActor\"}],\"dbName\":\"user\"},\"Session\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expiresAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"token\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"ipAddress\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userAgent\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"SessionToUser\"},{\"name\":\"impersonatedBy\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"activeOrganizationId\",\"kind\":\"scalar\",\"type\":\"String\"}],\"dbName\":\"session\"},\"Account\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"accountId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"providerId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"AccountToUser\"},{\"name\":\"accessToken\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"refreshToken\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"idToken\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"accessTokenExpiresAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"refreshTokenExpiresAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"scope\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":\"account\"},\"Verification\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"identifier\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"value\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expiresAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":\"verification\"},\"Organization\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"slug\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"logo\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"metadata\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"members\",\"kind\":\"object\",\"type\":\"Member\",\"relationName\":\"MemberToOrganization\"},{\"name\":\"invitations\",\"kind\":\"object\",\"type\":\"Invitation\",\"relationName\":\"InvitationToOrganization\"},{\"name\":\"conversations\",\"kind\":\"object\",\"type\":\"conversations\",\"relationName\":\"OrganizationToconversations\"}],\"dbName\":\"organization\"},\"Member\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"organizationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"organization\",\"kind\":\"object\",\"type\":\"Organization\",\"relationName\":\"MemberToOrganization\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"MemberToUser\"},{\"name\":\"role\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":\"member\"},\"Invitation\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"organizationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"organization\",\"kind\":\"object\",\"type\":\"Organization\",\"relationName\":\"InvitationToOrganization\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"role\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"expiresAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"inviterId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"InvitationToUser\"}],\"dbName\":\"invitation\"},\"AuditLog\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"action\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"actorId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"actor\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"AuditLogActor\"},{\"name\":\"targetType\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"targetId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"organizationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"metadata\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"ipAddress\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userAgent\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":\"audit_log\"},\"documents\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"content_hash\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"filename\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"mimetype\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"size\",\"kind\":\"scalar\",\"type\":\"BigInt\"},{\"name\":\"storage_path\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"public_url\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"storage_bucket\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"extracted_text\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"extracted_text_length\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"has_embedding\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"user_id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"chunks\",\"kind\":\"object\",\"type\":\"document_chunks\",\"relationName\":\"document_chunksTodocuments\"}],\"dbName\":null},\"document_chunks\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"document_id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"chunk_index\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"content\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"token_count\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"metadata\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"document\",\"kind\":\"object\",\"type\":\"documents\",\"relationName\":\"document_chunksTodocuments\"},{\"name\":\"message_sources\",\"kind\":\"object\",\"type\":\"message_sources\",\"relationName\":\"document_chunksTomessage_sources\"}],\"dbName\":null},\"conversations\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"is_escalated\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"escalated_reason\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"escalated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"is_resolved\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"resolved_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"resolved_by\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"agent_name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"agent_joined_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"organization_id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"organization\",\"kind\":\"object\",\"type\":\"Organization\",\"relationName\":\"OrganizationToconversations\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updated_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"messages\",\"kind\":\"object\",\"type\":\"messages\",\"relationName\":\"conversationsTomessages\"}],\"dbName\":null},\"messages\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"conversation_id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"role\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"content\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"conversation\",\"kind\":\"object\",\"type\":\"conversations\",\"relationName\":\"conversationsTomessages\"},{\"name\":\"sources\",\"kind\":\"object\",\"type\":\"message_sources\",\"relationName\":\"message_sourcesTomessages\"}],\"dbName\":null},\"message_sources\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"message_id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"chunk_id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"similarity_score\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"created_at\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"message\",\"kind\":\"object\",\"type\":\"messages\",\"relationName\":\"message_sourcesTomessages\"},{\"name\":\"chunk\",\"kind\":\"object\",\"type\":\"document_chunks\",\"relationName\":\"document_chunksTomessage_sources\"}],\"dbName\":null}},\"enums\":{},\"types\":{}}");
async function decodeBase64AsWasm(wasmBase64) {
	const { Buffer } = await import('node:buffer');
	const wasmArray = Buffer.from(wasmBase64, "base64");
	return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
	getRuntime: async () => await import('@prisma/client/runtime/query_compiler_bg.postgresql.mjs'),
	getQueryCompilerWasmModule: async () => {
		const { wasm } = await import('@prisma/client/runtime/query_compiler_bg.postgresql.wasm-base64.mjs');
		return await decodeBase64AsWasm(wasm);
	}
};
function getPrismaClientClass() {
	return clientExports.getPrismaClient(config);
}

globalThis["__dirname"] = require$$5.dirname(fileURLToPath(import.meta.url));
/**
* ## Prisma Client
* 
* Type-safe database client for TypeScript
* @example
* ```
* const prisma = new PrismaClient()
* // Fetch zero or more Users
* const users = await prisma.user.findMany()
* ```
* 
* Read more in our [docs](https://pris.ly/d/client).
*/
const PrismaClient = getPrismaClientClass();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
* Find a document by its content hash using Prisma
* @param contentHash - The SHA-256 hash of the file content
* @returns The document if found, null otherwise
*/
async function findDocumentByHash(contentHash) {
	try {
		const document = await prisma.documents.findUnique({ where: { content_hash: contentHash } });
		return document;
	} catch (error) {
		throw new Error(`Failed to query document: ${error}`);
	}
}
/**
* Create a new document record in the database using Prisma
* @param input - Document data to insert
* @returns The created document
*/
async function createDocumentRecord(input) {
	try {
		const document = await prisma.documents.create({ data: {
			content_hash: input.content_hash,
			filename: input.filename,
			mimetype: input.mimetype,
			size: BigInt(input.size),
			storage_path: input.storage_path,
			public_url: input.public_url,
			storage_bucket: input.storage_bucket,
			extracted_text_length: input.extracted_text_length,
			has_embedding: input.has_embedding,
			user_id: input.user_id || null
		} });
		return document;
	} catch (error) {
		throw new Error(`Failed to create document record: ${error}`);
	}
}
/**
* Get a document by its ID using Prisma
* @param id - The document ID
* @returns The document if found, null otherwise
*/
async function getDocumentById(id) {
	try {
		const document = await prisma.documents.findUnique({ where: { id } });
		return document;
	} catch (error) {
		throw new Error(`Failed to get document: ${error}`);
	}
}
function withMessageRole(message) {
	return {
		...message,
		role: message.role
	};
}
/**
* Create a new conversation
* @param title - Optional title for the conversation
* @returns The created conversation
*/
async function createConversation(title) {
	try {
		const conversation = await prisma.conversations.create({ data: { title: title || null } });
		return conversation;
	} catch (error) {
		throw new Error(`Failed to create conversation: ${error}`);
	}
}
/**
* Get a conversation by ID
* @param id - The conversation ID
* @returns The conversation if found, null otherwise
*/
async function getConversation(id) {
	try {
		const conversation = await prisma.conversations.findUnique({ where: { id } });
		return conversation;
	} catch (error) {
		throw new Error(`Failed to get conversation: ${error}`);
	}
}
/**
* Get a conversation with all its messages
* @param id - The conversation ID
* @returns The conversation with messages, or null if not found
*/
async function getConversationWithMessages(id) {
	try {
		const conversation = await prisma.conversations.findUnique({
			where: { id },
			include: { messages: { orderBy: { created_at: "asc" } } }
		});
		if (!conversation) {
			return null;
		}
		return {
			...conversation,
			messages: conversation.messages.map((message) => withMessageRole(message))
		};
	} catch (error) {
		throw new Error(`Failed to get conversation with messages: ${error}`);
	}
}
/**
* List all conversations with pagination
* @param limit - Maximum number of conversations to return (default: 20)
* @param offset - Number of conversations to skip (default: 0)
* @returns Array of conversations ordered by updated_at DESC
*/
async function listConversations(limit = 20, offset = 0) {
	try {
		const conversations = await prisma.conversations.findMany({
			orderBy: { updated_at: "desc" },
			take: limit,
			skip: offset
		});
		return conversations;
	} catch (error) {
		throw new Error(`Failed to list conversations: ${error}`);
	}
}
/**
* List escalated conversations with their messages for the helpdesk dashboard.
* @param limit - Maximum number of conversations to return (default: 50)
* @param organizationId - Optional organization ID to filter by
*/
async function listEscalatedConversations(limit = 50, organizationId) {
	try {
		const conversations = await prisma.conversations.findMany({
			where: {
				is_escalated: true,
				is_resolved: false,
				...organizationId && { organization_id: organizationId }
			},
			orderBy: { escalated_at: "desc" },
			take: limit,
			include: { messages: {
				orderBy: { created_at: "asc" },
				take: 200
			} }
		});
		return conversations.map((conversation) => ({
			...conversation,
			messages: conversation.messages.map((message) => withMessageRole(message))
		}));
	} catch (error) {
		throw new Error(`Failed to list escalated conversations: ${error}`);
	}
}
/**
* Update a conversation's title
* @param id - The conversation ID
* @param title - New title for the conversation
* @returns The updated conversation
*/
async function updateConversationTitle(id, title) {
	try {
		const conversation = await prisma.conversations.update({
			where: { id },
			data: {
				title,
				updated_at: new Date()
			}
		});
		return conversation;
	} catch (error) {
		throw new Error(`Failed to update conversation title: ${error}`);
	}
}
/**
* Update the escalation metadata for a conversation. Used when the AI hands the
* session off to a human so downstream clients can lock the transcript.
*/
async function setConversationEscalationStatus(id, options) {
	const { isEscalated, reason = null, escalatedAt = new Date() } = options;
	try {
		const conversation = await prisma.conversations.update({
			where: { id },
			data: {
				is_escalated: isEscalated,
				escalated_reason: isEscalated ? reason : null,
				escalated_at: isEscalated ? escalatedAt : null,
				agent_name: isEscalated ? undefined : null,
				agent_joined_at: isEscalated ? undefined : null,
				is_resolved: isEscalated ? undefined : false,
				resolved_at: isEscalated ? undefined : null,
				resolved_by: isEscalated ? undefined : null,
				updated_at: new Date()
			}
		});
		return conversation;
	} catch (error) {
		throw new Error(`Failed to update conversation escalation: ${error}`);
	}
}
/**
* Record when a human agent joins an escalated conversation.
*/
async function setConversationAgentJoin(id, options) {
	const { agentName, joinedAt = new Date() } = options;
	try {
		const conversation = await prisma.conversations.update({
			where: { id },
			data: {
				agent_name: agentName,
				agent_joined_at: joinedAt,
				updated_at: new Date()
			}
		});
		return conversation;
	} catch (error) {
		throw new Error(`Failed to update conversation agent join: ${error}`);
	}
}
/**
* Mark a conversation as resolved by a human agent.
*/
async function setConversationResolutionStatus(id, options) {
	const { resolvedBy, resolvedAt = new Date() } = options;
	try {
		const conversation = await prisma.conversations.update({
			where: { id },
			data: {
				is_resolved: true,
				resolved_at: resolvedAt,
				resolved_by: resolvedBy,
				updated_at: new Date()
			}
		});
		return conversation;
	} catch (error) {
		throw new Error(`Failed to resolve conversation: ${error}`);
	}
}
/**
* Delete a conversation (cascades to messages and message_sources)
* @param id - The conversation ID
* @returns The deleted conversation
*/
async function deleteConversation(id) {
	try {
		const conversation = await prisma.conversations.delete({ where: { id } });
		return conversation;
	} catch (error) {
		throw new Error(`Failed to delete conversation: ${error}`);
	}
}
/**
* Create a new message in a conversation
* @param input - Message data including optional sources
* @returns The created message
*/
async function createMessage(input) {
	try {
		const message = await prisma.messages.create({ data: {
			conversation_id: input.conversation_id,
			role: input.role,
			content: input.content,
			sources: input.sources ? { create: input.sources.map((source) => ({
				chunk_id: source.chunk_id,
				similarity_score: source.similarity_score
			})) } : undefined
		} });
		// Update conversation's updated_at timestamp
		await prisma.conversations.update({
			where: { id: input.conversation_id },
			data: { updated_at: new Date() }
		});
		return withMessageRole(message);
	} catch (error) {
		throw new Error(`Failed to create message: ${error}`);
	}
}
/**
* Get all messages for a conversation
* @param conversationId - The conversation ID
* @param limit - Maximum number of messages to return (optional)
* @returns Array of messages ordered by created_at ASC
*/
async function getMessages(conversationId, limit) {
	try {
		const messages = await prisma.messages.findMany({
			where: { conversation_id: conversationId },
			orderBy: { created_at: "asc" },
			take: limit
		});
		return messages.map((message) => withMessageRole(message));
	} catch (error) {
		throw new Error(`Failed to get messages: ${error}`);
	}
}
/**
* Get a message with its source chunks (for citations)
* @param messageId - The message ID
* @returns The message with sources, or null if not found
*/
async function getMessageWithSources(messageId) {
	try {
		const message = await prisma.messages.findUnique({
			where: { id: messageId },
			include: { sources: { include: { chunk: { include: { document: { select: {
				filename: true,
				mimetype: true
			} } } } } } }
		});
		return message ? withMessageRole(message) : null;
	} catch (error) {
		throw new Error(`Failed to get message with sources: ${error}`);
	}
}

// Allowed file types
const ALLOWED_MIME_TYPES = [
	"application/pdf",
	"text/plain",
	"text/csv",
	"text/markdown"
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
async function uploadRoutes(fastify) {
	// File upload endpoint
	fastify.post("/upload", async (request, reply) => {
		try {
			// This method is provided by the @fastify/multipart plugin
			const data = await request.file();
			if (!data) {
				return reply.code(400).send({
					success: false,
					message: "No file uploaded"
				});
			}
			// Validate file type
			if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
				return reply.code(400).send({
					success: false,
					message: `Invalid file type. Allowed types: PDF, Text, CSV, Markdown. Received: ${data.mimetype}`
				});
			}
			// Read the file buffer
			const buffer = await data.toBuffer();
			// Validate file size
			if (buffer.length > MAX_FILE_SIZE) {
				return reply.code(400).send({
					success: false,
					message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
				});
			}
			// Compute content hash for duplicate detection
			const hash = createHash("sha256");
			hash.update(buffer);
			const contentHash = hash.digest("hex");
			fastify.log.info(`Processing file upload: ${data.filename} (${data.mimetype}), Hash: ${contentHash}`);
			// Check for duplicate document
			const existingDoc = await findDocumentByHash(contentHash);
			if (existingDoc) {
				fastify.log.info(`Duplicate file detected: ${data.filename}. Returning existing document ID: ${existingDoc.id}`);
				return reply.code(200).send({
					success: true,
					message: "File already exists. Returning existing document.",
					document: {
						id: existingDoc.id,
						filename: existingDoc.filename,
						mimetype: existingDoc.mimetype,
						size: Number(existingDoc.size),
						storagePath: existingDoc.storage_path,
						publicUrl: existingDoc.public_url,
						contentHash: existingDoc.content_hash,
						isDuplicate: true,
						uploadedAt: existingDoc.created_at.toISOString()
					}
				});
			}
			// Upload file to Supabase Storage
			fastify.log.info(`Uploading file to storage: ${data.filename}`);
			const uploadResult = await uploadFileToStorage(buffer, data.filename, data.mimetype);
			fastify.log.info(`File uploaded to storage: ${uploadResult.path}, Public URL: ${uploadResult.publicUrl}`);
			// Create document record in database
			const document = await createDocumentRecord({
				content_hash: contentHash,
				filename: data.filename,
				mimetype: data.mimetype,
				size: buffer.length,
				storage_path: uploadResult.path,
				public_url: uploadResult.publicUrl,
				storage_bucket: uploadResult.bucket,
				extracted_text_length: 0,
				has_embedding: false
			});
			fastify.log.info(`Document record created with ID: ${document.id}`);
			// Trigger workflow for post-upload processing (embeddings, text extraction)
			await start(processDocument, [document.id]);
			fastify.log.info(`Triggered post-upload processing for document ${document.id}`);
			return reply.code(201).send({
				success: true,
				message: "File uploaded successfully and queued for processing",
				document: {
					id: document.id,
					filename: document.filename,
					mimetype: document.mimetype,
					size: Number(document.size),
					storagePath: document.storage_path,
					publicUrl: document.public_url,
					contentHash: document.content_hash,
					isDuplicate: false,
					uploadedAt: document.created_at.toISOString()
				}
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to upload file"
			});
		}
	});
	// Get upload configuration info
	fastify.get("/upload/info", async (_request, reply) => {
		return reply.code(200).send({
			maxFileSize: MAX_FILE_SIZE,
			maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
			allowedMimeTypes: ALLOWED_MIME_TYPES,
			allowedExtensions: [
				".pdf",
				".txt",
				".csv",
				".md"
			]
		});
	});
}

/**
* Pagination schema for list endpoints
*/
const PaginationSchema = z.object({
	limit: z.number().int().positive(),
	offset: z.number().int().nonnegative(),
	count: z.number().int().nonnegative()
});
/**
* RAG (Retrieval Augmented Generation) options schema
*/
const RAGOptionsSchema = z.object({
	limit: z.number().int().min(1).max(50).default(5).optional(),
	similarityThreshold: z.number().min(0).max(1).default(.6).optional()
});
/**
* Generic error response schema
*/
z.object({
	success: z.literal(false),
	message: z.string(),
	error: z.string().optional()
});

/**
* Base Conversation schema
*/
const ConversationSchema = z.object({
	id: z.string().uuid(),
	title: z.string().nullable(),
	isEscalated: z.boolean(),
	escalatedReason: z.string().nullable(),
	escalatedAt: z.string().datetime().nullable(),
	isResolved: z.boolean(),
	resolvedAt: z.string().datetime().nullable(),
	resolvedBy: z.string().nullable(),
	agentName: z.string().nullable(),
	agentJoinedAt: z.string().datetime().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime()
});
/**
* Create conversation request schema
*/
const CreateConversationRequestSchema = z.object({ title: z.string().optional() });
/**
* Create conversation response schema
*/
z.object({
	success: z.literal(true),
	conversation: ConversationSchema
});
/**
* Get conversation response schema (with messages)
* Note: Messages are defined in message.ts to avoid circular dependency
*/
z.object({
	success: z.literal(true),
	conversation: ConversationSchema.extend({ messages: z.array(z.any()) })
});
/**
* List conversations response schema
*/
z.object({
	success: z.literal(true),
	conversations: z.array(ConversationSchema),
	pagination: PaginationSchema
});
/**
* Delete conversation response schema
*/
z.object({
	success: z.literal(true),
	message: z.string()
});

/**
* Source citation schema (for streaming responses)
* Used when AI responds with document citations
*/
const SourceSchema = z.object({
	id: z.string().uuid(),
	documentId: z.string().uuid(),
	similarity: z.number().min(0).max(1),
	content: z.string(),
	filename: z.string(),
	pageNumber: z.number().int().positive().optional(),
	pageEnd: z.number().int().positive().optional()
});
/**
* Detailed source schema (for /messages/:messageId/sources endpoint)
* Includes more detailed document information
*/
const MessageSourceDetailSchema = z.object({
	id: z.string().uuid(),
	chunkId: z.string().uuid(),
	similarityScore: z.number().min(0).max(1),
	content: z.string(),
	pageNumber: z.number().int().positive().optional(),
	pageEnd: z.number().int().positive().optional(),
	document: z.object({
		filename: z.string(),
		mimetype: z.string()
	})
});
/**
* Get message sources response schema
*/
z.object({
	success: z.literal(true),
	message: z.object({
		id: z.string().uuid(),
		role: z.enum([
			"user",
			"assistant",
			"system",
			"human_agent"
		]),
		content: z.string(),
		sources: z.array(MessageSourceDetailSchema)
	})
});

/**
* Message role enum
*/
const MessageRoleSchema = z.enum([
	"user",
	"assistant",
	"system",
	"human_agent"
]);
/**
* Base Message schema
* Note: Using conversationId (camelCase) for consistency
*/
const MessageSchema = z.object({
	id: z.string().uuid(),
	conversationId: z.string().uuid(),
	role: MessageRoleSchema,
	content: z.string(),
	createdAt: z.string().datetime()
});
/**
* Message with sources schema
*/
MessageSchema.extend({ sources: z.array(SourceSchema).optional() });
/**
* Send message request schema
*/
const SendMessageRequestSchema = z.object({
	message: z.string().min(1).max(1e4),
	useRAG: z.boolean().default(true).optional(),
	ragOptions: RAGOptionsSchema.optional()
});
/**
* Get messages response schema
*/
z.object({
	success: z.literal(true),
	messages: z.array(MessageSchema)
});

/**
* RAG (Retrieval Augmented Generation) Configuration
*
* Centralized configuration for vector search, embeddings, and RAG behavior.
* Adjust these settings to tune the performance and accuracy of your RAG system.
*/
/**
* Vector Search Configuration
* Controls how documents are retrieved from the vector database
*/
const VECTOR_SEARCH_CONFIG = {
	similarityThreshold: .6,
	defaultLimit: 5};
/**
* Embedding Configuration
* Settings for OpenAI text embeddings
*/
const EMBEDDING_CONFIG = {
	model: "text-embedding-3-large"};
/**
* Text Chunking Configuration
* Settings for splitting documents into chunks
*/
const CHUNKING_CONFIG = {
	chunkSize: 1e3,
	chunkOverlap: 200,
	separators: [
		"\n\n",
		"\n",
		". ",
		"! ",
		"? ",
		", ",
		" ",
		""
	]
};
/**
* Chat/RAG Integration Configuration
* Settings for how RAG context is used in chat
*/
const RAG_CHAT_CONFIG = {
	useRAGByDefault: true,
	defaultContextLimit: 5};
/**
* OpenAI Chat Model Configuration
* Settings for the chat completion model
*/
const CHAT_MODEL_CONFIG = {
	model: "gpt-4o",
	temperature: 1,
	maxTokens: 2e3,
	streaming: true
};
/**
* Title Generation Configuration
* Settings for auto-generating conversation titles
*/
const TITLE_GENERATION_CONFIG = {
	model: "gpt-4o-mini",
	temperature: .5,
	maxTokens: 50,
	maxLength: 50,
	maxWords: 6
};

// Initialize OpenAI embeddings with LangChain
const embeddings = new OpenAIEmbeddings({
	model: EMBEDDING_CONFIG.model,
	openAIApiKey: process.env.OPENAI_API_KEY
});
// Helper function to create embedding for a single document
async function createEmbedding(text) {
	try {
		const embedding = await embeddings.embedQuery(text);
		return embedding;
	} catch (error) {
		console.error("Error creating embedding:", error);
		throw error;
	}
}
// Helper function to create embeddings in batches
async function createEmbeddingsBatch(texts) {
	try {
		const embeddingResults = await embeddings.embedDocuments(texts);
		return embeddingResults;
	} catch (error) {
		console.error("Error creating batch embeddings:", error);
		throw error;
	}
}

/**
* Search for similar chunks across all documents using vector similarity.
* Returns results as LangChain Documents for use with LangChain chains.
*
* Uses adaptive threshold strategy:
* 1. First tries to find results above the similarity threshold
* 2. If no results found, falls back to top-K results without threshold
* This ensures the RAG system always has context when documents exist
*
* @param queryText - The text to search for
* @param limit - Maximum number of results to return (default from config)
* @param similarityThreshold - Minimum cosine similarity score (0-1, default from config)
* @returns Array of LangChain Documents with similarity scores
*/
async function searchSimilarChunks(queryText, limit = 10, similarityThreshold = VECTOR_SEARCH_CONFIG.similarityThreshold) {
	// Create embedding for the query text
	const queryEmbedding = await createEmbedding(queryText);
	// Convert embedding array to pgvector format string
	const embeddingString = `[${queryEmbedding.join(",")}]`;
	// First attempt: Search with similarity threshold
	let results = await prisma.$queryRaw`
    SELECT
      c.id,
      c.document_id as "documentId",
      c.chunk_index as "chunkIndex",
      c.content,
      c.metadata,
      1 - (c.embedding <=> ${embeddingString}::vector) as similarity,
      d.id as "document.id",
      d.filename as "document.filename",
      d.mimetype as "document.mimetype",
      d.created_at as "document.createdAt"
    FROM document_chunks c
    INNER JOIN documents d ON c.document_id = d.id
    WHERE c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> ${embeddingString}::vector) >= ${similarityThreshold}
    ORDER BY c.embedding <=> ${embeddingString}::vector
    LIMIT ${limit}
  `;
	// Adaptive fallback: If no results above threshold, get top-K anyway
	if (results.length === 0) {
		console.log(`No results above threshold ${similarityThreshold}, falling back to top-${limit} results`);
		results = await prisma.$queryRaw`
      SELECT
        c.id,
        c.document_id as "documentId",
        c.chunk_index as "chunkIndex",
        c.content,
        c.metadata,
        1 - (c.embedding <=> ${embeddingString}::vector) as similarity,
        d.id as "document.id",
        d.filename as "document.filename",
        d.mimetype as "document.mimetype",
        d.created_at as "document.createdAt"
      FROM document_chunks c
      INNER JOIN documents d ON c.document_id = d.id
      WHERE c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${embeddingString}::vector
      LIMIT ${limit}
    `;
	}
	// Transform to LangChain Documents
	return results.map((row) => {
		const similarity = typeof row.similarity === "string" ? parseFloat(row.similarity) : row.similarity;
		return {
			document: new Document({
				pageContent: row.content,
				metadata: {
					id: row.id,
					documentId: row.documentId,
					chunkIndex: row.chunkIndex,
					similarity,
					document: {
						id: row["document.id"],
						filename: row["document.filename"],
						mimetype: row["document.mimetype"],
						createdAt: row["document.createdAt"]
					},
					...row.metadata || {}
				}
			}),
			similarity
		};
	});
}
/**
* Search for similar chunks within a specific document using vector similarity.
* Returns results as LangChain Documents for use with LangChain chains.
*
* Uses adaptive threshold strategy:
* 1. First tries to find results above the similarity threshold
* 2. If no results found, falls back to top-K results without threshold
* This ensures the RAG system always has context when documents exist
*
* @param documentId - The ID of the document to search within
* @param queryText - The text to search for
* @param limit - Maximum number of results to return (default from config)
* @param similarityThreshold - Minimum cosine similarity score (0-1, default from config)
* @returns Array of LangChain Documents with similarity scores
*/
async function searchWithinDocument(documentId, queryText, limit = VECTOR_SEARCH_CONFIG.defaultLimit, similarityThreshold = VECTOR_SEARCH_CONFIG.similarityThreshold) {
	// Create embedding for the query text
	const queryEmbedding = await createEmbedding(queryText);
	// Convert embedding array to pgvector format string
	const embeddingString = `[${queryEmbedding.join(",")}]`;
	// First attempt: Search with similarity threshold
	let results = await prisma.$queryRaw`
    SELECT
      c.id,
      c.document_id as "documentId",
      c.chunk_index as "chunkIndex",
      c.content,
      c.metadata,
      1 - (c.embedding <=> ${embeddingString}::vector) as similarity,
      d.id as "document.id",
      d.filename as "document.filename",
      d.mimetype as "document.mimetype",
      d.created_at as "document.createdAt"
    FROM document_chunks c
    INNER JOIN documents d ON c.document_id = d.id
    WHERE c.document_id = ${documentId}::uuid
      AND c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> ${embeddingString}::vector) >= ${similarityThreshold}
    ORDER BY c.embedding <=> ${embeddingString}::vector
    LIMIT ${limit}
  `;
	// Adaptive fallback: If no results above threshold, get top-K anyway
	if (results.length === 0) {
		console.log(`No results above threshold ${similarityThreshold} for document ${documentId}, falling back to top-${limit} results`);
		results = await prisma.$queryRaw`
      SELECT
        c.id,
        c.document_id as "documentId",
        c.chunk_index as "chunkIndex",
        c.content,
        c.metadata,
        1 - (c.embedding <=> ${embeddingString}::vector) as similarity,
        d.id as "document.id",
        d.filename as "document.filename",
        d.mimetype as "document.mimetype",
        d.created_at as "document.createdAt"
      FROM document_chunks c
      INNER JOIN documents d ON c.document_id = d.id
      WHERE c.document_id = ${documentId}::uuid
        AND c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${embeddingString}::vector
      LIMIT ${limit}
    `;
	}
	// Transform to LangChain Documents
	return results.map((row) => {
		const similarity = typeof row.similarity === "string" ? parseFloat(row.similarity) : row.similarity;
		return {
			document: new Document({
				pageContent: row.content,
				metadata: {
					id: row.id,
					documentId: row.documentId,
					chunkIndex: row.chunkIndex,
					similarity,
					document: {
						id: row["document.id"],
						filename: row["document.filename"],
						mimetype: row["document.mimetype"],
						createdAt: row["document.createdAt"]
					},
					...row.metadata || {}
				}
			}),
			similarity
		};
	});
}

/**
* Custom LangChain retriever that wraps our Prisma/pgvector search.
* This allows us to use LangChain's retrieval chains while keeping
* our existing database schema and optimized queries.
*/
class PrismaRetriever extends BaseRetriever {
	lc_namespace = [
		"langchain",
		"retrievers",
		"prisma"
	];
	k;
	similarityThreshold;
	documentId;
	constructor(config = {}) {
		super(config);
		this.k = config.k ?? RAG_CHAT_CONFIG.defaultContextLimit;
		this.similarityThreshold = config.similarityThreshold ?? VECTOR_SEARCH_CONFIG.similarityThreshold;
		this.documentId = config.documentId;
	}
	/**
	* Core retrieval method required by LangChain.
	* Retrieves relevant documents based on a query string.
	*
	* @param query - The search query
	* @returns Array of relevant Documents
	*/
	async _getRelevantDocuments(query) {
		let results;
		if (this.documentId) {
			// Search within specific document
			results = await searchWithinDocument(this.documentId, query, this.k, this.similarityThreshold);
		} else {
			// Search across all documents
			results = await searchSimilarChunks(query, this.k, this.similarityThreshold);
		}
		// Extract just the documents (similarity scores are in metadata)
		const documents = results.map((r) => r.document);
		return documents;
	}
	/**
	* Factory method to create a retriever with custom configuration
	*/
	static create(config = {}) {
		return new PrismaRetriever(config);
	}
}

async function chunkText(text, pageMapping) {
	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize: CHUNKING_CONFIG.chunkSize,
		chunkOverlap: CHUNKING_CONFIG.chunkOverlap,
		separators: [...CHUNKING_CONFIG.separators],
		keepSeparator: false
	});
	const chunks = await splitter.createDocuments([text]);
	let currentPosition = 0;
	const documentChunks = [];
	for (let i = 0; i < chunks.length; i++) {
		const chunk = chunks[i];
		if (!chunk) continue;
		const chunkText = chunk.pageContent;
		const startPosition = currentPosition;
		const endPosition = startPosition + chunkText.length;
		// Calculate page numbers if pageMapping is provided
		let pageNumber;
		let pageEnd;
		let locationType;
		if (pageMapping) {
			const startPage = calculatePageForPosition(startPosition, pageMapping);
			const endPage = calculatePageForPosition(endPosition - 1, pageMapping);
			if (startPage !== null) {
				pageNumber = startPage;
				locationType = "page";
				// Only set pageEnd if chunk spans multiple pages
				if (endPage !== null && endPage !== startPage) {
					pageEnd = endPage;
				}
			}
		}
		documentChunks.push({
			content: chunkText,
			metadata: {
				chunkIndex: i,
				startPosition,
				endPosition,
				length: chunkText.length,
				...pageNumber !== undefined && { pageNumber },
				...pageEnd !== undefined && { pageEnd },
				...locationType !== undefined && { locationType }
			}
		});
		// Move position forward, accounting for overlap
		currentPosition = endPosition - CHUNKING_CONFIG.chunkOverlap;
	}
	return documentChunks;
}
function estimateTokenCount(text) {
	// Rough estimation: 1 token ≈ 4 characters for English text
	return Math.ceil(text.length / 4);
}
/**
* Calculate which page a given character position belongs to
* @param position Character position in the full text
* @param pageMapping Mapping of character positions to pages
* @returns Page number (1-indexed) or null if not found
*/
function calculatePageForPosition(position, pageMapping) {
	for (const page of pageMapping.pages) {
		if (position >= page.startPosition && position < page.endPosition) {
			return page.pageNumber;
		}
	}
	return null;
}
/**
* Format page reference for display
* @param pageNumber Starting page number
* @param pageEnd Ending page number (if chunk spans multiple pages)
* @returns Formatted string like "page 5" or "pages 5-6"
*/
function formatPageReference(pageNumber, pageEnd) {
	if (pageNumber === undefined) {
		return "";
	}
	if (pageEnd !== undefined && pageEnd !== pageNumber) {
		return `pages ${pageNumber}-${pageEnd}`;
	}
	return `page ${pageNumber}`;
}
/**
* Build page mapping from per-page text array
* @param pages Array of page text strings
* @returns PageMapping object with character position boundaries
*/
function buildPageMapping(pages) {
	const pageInfos = [];
	let currentPosition = 0;
	for (let i = 0; i < pages.length; i++) {
		const pageText = pages[i];
		if (!pageText) continue;
		const startPosition = currentPosition;
		const endPosition = startPosition + pageText.length;
		pageInfos.push({
			pageNumber: i + 1,
			startPosition,
			endPosition,
			text: pageText
		});
		currentPosition = endPosition;
	}
	return {
		pages: pageInfos,
		totalPages: pages.length
	};
}

/**
* Create a PrismaRetriever instance with the given options
* @param options - Configuration for the retriever
* @returns Configured PrismaRetriever
*/
function createRetriever(options = {}) {
	const { limit = RAG_CHAT_CONFIG.defaultContextLimit, similarityThreshold = VECTOR_SEARCH_CONFIG.similarityThreshold, documentId } = options;
	return PrismaRetriever.create({
		k: limit,
		similarityThreshold,
		documentId
	});
}
/**
* Format LangChain Documents into a structured context string
* @param documents - Array of LangChain Documents with metadata
* @returns Formatted context string with source numbers
*/
function formatDocumentsForContext(documents) {
	if (documents.length === 0) {
		return "No relevant context found in the knowledge base.";
	}
	const contextParts = documents.map((doc, index) => {
		const docName = doc.metadata?.document?.filename || "Unknown Document";
		let header = `[Source ${index}] ${docName}`;
		// Add page information if available
		const pageRef = formatPageReference(doc.metadata?.pageNumber, doc.metadata?.pageEnd);
		if (pageRef) {
			header += ` (${pageRef})`;
		}
		if (doc.metadata?.similarity) {
			const similarity = (doc.metadata.similarity * 100).toFixed(1);
			header += ` (Relevance: ${similarity}%)`;
		}
		return `${header}\n${doc.pageContent}`;
	});
	return contextParts.join("\n\n---\n\n");
}
/**
* Retrieve documents for a query using the PrismaRetriever.
* Returns both the documents and extracts metadata for compatibility.
*
* @param query - The user's query
* @param options - Retrieval configuration
* @returns Object with documents and formatted context
*/
async function retrieveDocuments(query, options = {}) {
	try {
		const { ...retrieverOptions } = options;
		const retriever = createRetriever(retrieverOptions);
		// Use invoke() which is the standard LangChain method for retrievers
		const documents = await retriever.invoke(query);
		const context = formatDocumentsForContext(documents);
		return {
			documents,
			context
		};
	} catch (error) {
		console.error("Error retrieving documents:", error);
		throw new Error(`Failed to retrieve documents: ${error}`);
	}
}

/**
* Prompts Configuration
*
* Centralized location for all system prompts used in the RAG system.
* Prompts are organized by feature and can be easily maintained and updated.
*/
/**
* Base guidelines shared across all prompts
*/
const BASE_GUIDELINES = `1. **Use the context**: Base your answers primarily on the information provided in the context below
3. **Be honest**: If the context doesn't contain relevant information to answer the question, clearly state that
4. **Don't hallucinate**: Don't make up information that isn't in the provided context
5. **Be conversational**: While being accurate, maintain a natural and helpful tone
6. **Synthesize information**: If multiple sources provide relevant information, combine them into a coherent answer`;
/**
* Inline citation instructions (0-indexed)
*/
const INLINE_CITATION_INSTRUCTIONS = `2. **Cite sources with inline numbers and rewritten chunk text**: When referencing information, use inline numeric citations immediately after the claim.
   - Citations are 0-indexed (first source is {{cite:0}}, second is {{cite:1}}, etc.)
   - Place citations right after the relevant statement and after the punctuation: "Machine learning is a subset of AI. {{cite:0, text:"[rewritten chunk content]"}}"
   - The \`text\` field should contain a **concise, rewritten version of the source chunk**, capturing the main point clearly. Do not use the raw chunk text verbatim, and ensure the rewritten sentence ends with proper punctuation (. ? !).
   - Include the source filename in each citation entry using filename:"<SOURCE FILENAME>" (matching the filename exactly as provided in the context): {{cite:0, filename:"example.pdf", text:"[rewritten chunk content]"}}.
   - Multiple sources supporting the same claim can be grouped: 
     "This is widely accepted. {{cite:0, filename:"chunk0.pdf", text:"[rewritten chunk 0]"}, {cite:1, filename:"chunk1.pdf", text:"[rewritten chunk 1]"}, {cite:2, filename:"chunk2.pdf"}}"
   - If no text is provided, still include the filename with the index.
   - Always cite specific sources when using information from the context

**Examples of proper inline citations:**
- "The transformer architecture was introduced in 2017. {{cite:0, filename:"attention_is_all_you_need.pdf", text:"Introduced the Transformer model for sequence processing"}}"
- "Deep learning has revolutionized computer vision. {{cite:1, filename:"alexnet_paper.pdf", text:"AlexNet improved image recognition accuracy"}, {cite:2, filename:"resnet_paper.pdf", text:"ResNet enabled deeper networks"}}"
- "According to the research {{cite:0, filename:"study_results.pdf", text:"Experiment showed 15% improvement"}}, accuracy improved significantly."`;
/**
* Generate RAG system prompt with inline citation instructions
*
* @param context - Formatted context string with sources
* @returns Complete system prompt for the LLM
*/
function generateRAGPrompt(context) {
	return `You are a helpful AI assistant with access to a knowledge base of documents.

Your task is to answer user questions based on the provided context from the knowledge base. Follow these guidelines:

${BASE_GUIDELINES}
${INLINE_CITATION_INSTRUCTIONS}

---

**Available Context:**

${context}

---

Now, answer the user's question using the context above with inline citations.`;
}
/**
* Generate conversation title from first user message
* Used for auto-generating descriptive conversation titles
*
* @param firstMessage - The first user message in the conversation
* @returns System prompt for title generation
*/
function generateTitlePrompt(firstMessage) {
	return `Generate a short, descriptive title (max 6 words, 50 characters) for a conversation that starts with the following user message. Only respond with the title, nothing else.

User message: "${firstMessage}"`;
}

// Re-export for backward compatibility
const CHAT_CONFIG = CHAT_MODEL_CONFIG;
// Initialize ChatOpenAI with streaming enabled
const chatModel = new ChatOpenAI({
	model: CHAT_CONFIG.model,
	temperature: CHAT_CONFIG.temperature,
	maxTokens: CHAT_CONFIG.maxTokens,
	streaming: CHAT_CONFIG.streaming,
	openAIApiKey: process.env.OPENAI_API_KEY
});
/**
* Convert chat message format to LangChain message format
* @param message - Chat message object
* @returns LangChain BaseMessage
*/
function convertToLangChainMessage(message) {
	switch (message.role) {
		case "user": return new HumanMessage(message.content);
		case "assistant": return new AIMessage(message.content);
		case "system": return new SystemMessage(message.content);
		default: throw new Error(`Unknown message role: ${message.role}`);
	}
}
/**
* Stream chat completion with optional RAG context using LangChain retriever
* @param params - Chat parameters including query, history, and RAG options
* @returns Async iterator of response chunks and source documents
*/
async function streamChatWithRAG(params) {
	const { userQuery, conversationHistory = [], useRAG = RAG_CHAT_CONFIG.useRAGByDefault, ragOptions = {} } = params;
	const messages = [];
	let sourceDocuments = [];
	// If RAG is enabled, retrieve relevant context using LangChain retriever
	if (useRAG) {
		try {
			const { documents, context } = await retrieveDocuments(userQuery, ragOptions);
			sourceDocuments = documents;
			// Build system prompt with retrieved context using inline citation instructions
			const systemPrompt = generateRAGPrompt(context);
			// Add system prompt with RAG context
			messages.push(new SystemMessage(systemPrompt));
		} catch (error) {
			console.error("Error retrieving documents:", error);
			// Continue without RAG if retrieval fails
			messages.push(new SystemMessage("You are a helpful AI assistant. Answer the user's questions to the best of your ability."));
		}
	} else {
		// Use basic system prompt if RAG is disabled
		messages.push(new SystemMessage("You are a helpful AI assistant. Answer the user's questions to the best of your ability."));
	}
	// Add conversation history
	for (const msg of conversationHistory) {
		messages.push(convertToLangChainMessage(msg));
	}
	// Add current user query
	messages.push(new HumanMessage(userQuery));
	// Create an async generator that yields string tokens
	async function* tokenGenerator() {
		try {
			// Stream the response
			const stream = await chatModel.stream(messages);
			for await (const chunk of stream) {
				const responseText = extractChunkText(chunk);
				if (responseText) {
					yield {
						type: "response",
						content: responseText
					};
				}
			}
		} catch (error) {
			console.error("Error during streaming:", error);
			if (error instanceof Error) {
				// Preserve original stack/message so callers (and logs) have actionable context
				throw error;
			}
			throw new Error(`Streaming failed: ${JSON.stringify(error)}`);
		}
	}
	return {
		stream: tokenGenerator(),
		sourceDocuments
	};
}
/**
* Generate a conversation title from the first user message
* @param firstMessage - The first user message in the conversation
* @returns A short, descriptive title (max characters from config)
*/
async function generateConversationTitle(firstMessage) {
	try {
		const titleModel = new ChatOpenAI({
			model: TITLE_GENERATION_CONFIG.model,
			temperature: TITLE_GENERATION_CONFIG.temperature,
			maxTokens: TITLE_GENERATION_CONFIG.maxTokens,
			openAIApiKey: process.env.OPENAI_API_KEY
		});
		const messages = [new SystemMessage(generateTitlePrompt(firstMessage))];
		const response = await titleModel.invoke(messages);
		const title = response.content.toString().trim();
		// Ensure title is not too long
		const maxLength = TITLE_GENERATION_CONFIG.maxLength;
		return title.length > maxLength ? title.substring(0, maxLength - 3) + "..." : title;
	} catch (error) {
		console.error("Error generating conversation title:", error);
		// Fallback: use first N characters of the message
		const maxLength = TITLE_GENERATION_CONFIG.maxLength;
		return firstMessage.length > maxLength ? firstMessage.substring(0, maxLength - 3) + "..." : firstMessage;
	}
}
/**
* Extract string content from a message chunk, regardless of structure.
*/
function extractChunkText(chunk) {
	const { content } = chunk ?? {};
	if (!content) {
		return undefined;
	}
	if (typeof content === "string") {
		return content;
	}
	if (Array.isArray(content)) {
		const combined = content.map((part) => {
			if (typeof part === "string") {
				return part;
			}
			if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
				return part.text;
			}
			return "";
		}).join("");
		return combined.length > 0 ? combined : undefined;
	}
	if (typeof content === "object" && "text" in content) {
		const maybeText = content.text;
		return typeof maybeText === "string" && maybeText.length > 0 ? maybeText : undefined;
	}
	return undefined;
}

const ESCALATION_KEYWORDS = [
	"human",
	"representative",
	"real person",
	"lawsuit",
	"escalate",
	"manager",
	"complaint",
	"urgent",
	"support ticket",
	"agent",
	"supervisor",
	"contact number"
];
/**
* Lightweight guardrail that inspects the latest user message (plus a short history window)
* and decides whether the request should be handed to a human operator instead of the model.
*
* The current strategy is intentionally simple—a keyword scan plus a high-sensitivity
* fallback that escalates when the user repeats themselves without resolution.
* Replace this with a proper classifier or moderation endpoint once available; the
* surrounding code expects the same return shape.
*/
function evaluateEscalationNeed(params) {
	const { userMessage, conversationHistory } = params;
	const normalized = userMessage.toLowerCase();
	const matchedSignals = ESCALATION_KEYWORDS.filter((keyword) => normalized.includes(keyword));
	if (matchedSignals.length > 0) {
		return {
			shouldEscalate: true,
			reason: "User explicitly requested a human agent.",
			matchedSignals
		};
	}
	const recentUserMessages = conversationHistory.filter((msg) => msg.role === "user").slice(-3).map((msg) => msg.content.toLowerCase());
	const userRepeating = recentUserMessages.some((pastMessage) => pastMessage === normalized);
	if (userRepeating) {
		return {
			shouldEscalate: true,
			reason: "User repeated the same question multiple times.",
			matchedSignals: ["repeat-detection"]
		};
	}
	return { shouldEscalate: false };
}

/**
* In-memory fan-out hub that lets multiple SSE subscribers listen for
* conversation-level events (agent joined, etc.).
*/
class ConversationEventHub {
	subscribers = new Map();
	subscribe(conversationId, reply) {
		const bucket = this.subscribers.get(conversationId) ?? new Set();
		const subscriber = { reply };
		bucket.add(subscriber);
		this.subscribers.set(conversationId, bucket);
		const stream = reply.raw;
		const cleanup = () => {
			bucket.delete(subscriber);
			if (bucket.size === 0) {
				this.subscribers.delete(conversationId);
			}
		};
		stream.on("close", cleanup);
		stream.on("error", cleanup);
	}
	emit(conversationId, event) {
		const bucket = this.subscribers.get(conversationId);
		if (!bucket || bucket.size === 0) {
			return;
		}
		const payload = `data: ${JSON.stringify(event)}\n\n`;
		for (const subscriber of bucket) {
			try {
				subscriber.reply.raw.write(payload);
			} catch (error) {
				subscriber.reply.log?.error({ error }, "Failed to write SSE event");
			}
		}
	}
}
const conversationEventHub = new ConversationEventHub();

/**
* Convert a raw conversation row into the camelCase DTO shared across clients.
*/
function serializeConversation(conversation) {
	return {
		id: conversation.id,
		title: conversation.title,
		isEscalated: conversation.is_escalated,
		escalatedReason: conversation.escalated_reason,
		escalatedAt: conversation.escalated_at ? conversation.escalated_at.toISOString() : null,
		isResolved: conversation.is_resolved,
		resolvedAt: conversation.resolved_at ? conversation.resolved_at.toISOString() : null,
		resolvedBy: conversation.resolved_by,
		agentName: conversation.agent_name,
		agentJoinedAt: conversation.agent_joined_at ? conversation.agent_joined_at.toISOString() : null,
		createdAt: conversation.created_at.toISOString(),
		updatedAt: conversation.updated_at.toISOString()
	};
}
/**
* Normalize a message row so downstream consumers receive consistent fields.
*/
function serializeMessage(message) {
	return {
		id: message.id,
		conversationId: message.conversation_id,
		role: message.role,
		content: message.content,
		createdAt: message.created_at.toISOString()
	};
}
/**
* Convenience helper for endpoints that need to bundle message history with
* conversation metadata (e.g., helpdesk escalations API).
*/
function serializeConversationWithMessages(conversation) {
	return {
		...serializeConversation(conversation),
		messages: conversation.messages.map((message) => serializeMessage(message))
	};
}

/**
* Adds close/error listeners to a socket and invokes `cleanup` once, regardless of
* how the connection terminates. This prevents leaked references in the gateway.
*/
function handleSocketLifecycle(socket, cleanup) {
	if (!socket || typeof socket.on !== "function") {
		return;
	}
	const tidy = () => {
		cleanup();
		if (typeof socket.off === "function") {
			socket.off("close", tidy);
			socket.off("error", tidy);
		} else if (typeof socket.removeListener === "function") {
			socket.removeListener("close", tidy);
			socket.removeListener("error", tidy);
		}
	};
	socket.on("close", tidy);
	socket.on("error", tidy);
}
/**
* Fan-out hub for websocket transports. Keeps track of helpdesk dashboards and
* per-conversation subscribers (chat widget) so API routes can broadcast events
* without duplicating wiring logic.
*/
class RealtimeGateway {
	/** Sockets for helpdesk dashboards subscribed to global escalations feed. */
	helpdeskClients = new Set();
	/** Per-conversation sockets for embedded widgets keyed by conversation ID. */
	conversationClients = new Map();
	/**
	* Registers the `/ws/helpdesk` and `/ws/conversations/:id` endpoints on the
	* Fastify instance. Each connection is added to the proper set so later calls
	* to `broadcastHelpdesk`/`emitConversationEvent` know where to fan out.
	*/
	register(app) {
		app.get("/ws/helpdesk", { websocket: true }, (socket) => {
			this.helpdeskClients.add(socket);
			handleSocketLifecycle(socket, () => {
				this.helpdeskClients.delete(socket);
			});
		});
		app.get("/ws/conversations/:id", { websocket: true }, (socket, request) => {
			const { id } = request.params;
			const bucket = this.conversationClients.get(id) ?? new Set();
			bucket.add(socket);
			this.conversationClients.set(id, bucket);
			handleSocketLifecycle(socket, () => {
				bucket.delete(socket);
				if (bucket.size === 0) {
					this.conversationClients.delete(id);
				}
			});
		});
	}
	/** Sends a helpdesk event to every connected dashboard. */
	broadcastHelpdesk(event) {
		if (this.helpdeskClients.size === 0) {
			return;
		}
		const payload = JSON.stringify(event);
		for (const socket of this.helpdeskClients) {
			try {
				socket.send(payload);
			} catch {
				socket.close();
			}
		}
	}
	/** Emits a conversation-scoped stream event to all widgets attached to that ID. */
	emitConversationEvent(conversationId, event) {
		const bucket = this.conversationClients.get(conversationId);
		if (!bucket || bucket.size === 0) {
			return;
		}
		const payload = JSON.stringify(event);
		for (const socket of bucket) {
			try {
				socket.send(payload);
			} catch {
				socket.close();
			}
		}
	}
}
const realtimeGateway = new RealtimeGateway();

/** Apply the headers Fastify needs for Server-Sent Events. */
function setSseHeaders(reply) {
	reply.raw.setHeader("Content-Type", "text/event-stream");
	reply.raw.setHeader("Cache-Control", "no-cache");
	reply.raw.setHeader("Connection", "keep-alive");
	reply.raw.setHeader("Access-Control-Allow-Origin", "*");
}
/**
* Register all chat-related routes
*
* Available endpoints:
* - POST   /conversations                    - Create new conversation
* - GET    /conversations                    - List conversations (paginated)
* - GET    /conversations/:id                - Get conversation with messages
* - DELETE /conversations/:id                - Delete conversation
* - POST   /conversations/:id/messages       - Send message (streaming SSE response)
* - GET    /conversations/:id/messages       - Get messages for conversation
* - GET    /messages/:messageId/sources      - Get message with source citations
*
* @param fastify - Fastify instance
*/
async function chatRoutes(fastify) {
	/**
	* POST /conversations
	* Create a new conversation
	*
	* Request body:
	*   - title?: string (optional conversation title)
	*
	* Response: 201 Created
	*   { success: true, conversation: { id, title, createdAt, updatedAt } }
	*/
	fastify.post("/conversations", async (request, reply) => {
		try {
			// Validate request body
			const validation = CreateConversationRequestSchema.safeParse(request.body);
			if (!validation.success) {
				return reply.code(400).send({
					success: false,
					message: "Invalid request body",
					error: validation.error.message
				});
			}
			const { title } = validation.data;
			const conversation = await createConversation(title);
			fastify.log.info(`Created conversation: ${conversation.id}`);
			return reply.code(201).send({
				success: true,
				conversation: serializeConversation(conversation)
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to create conversation"
			});
		}
	});
	/**
	* POST /conversations/:id/messages
	* Send a message and receive streaming AI response with RAG context
	*
	* This endpoint:
	* 1. Saves user message to database
	* 2. Retrieves relevant document chunks via vector search (if useRAG=true)
	* 3. Builds conversation context with history
	* 4. Streams AI response using Server-Sent Events (SSE)
	* 5. Saves assistant message with source citations
	* 6. Auto-generates conversation title on first message
	*
	* Request params:
	*   - id: conversation ID
	*
	* Request body:
	*   - message: string (user's message)
	*   - useRAG?: boolean (default: true) - enable RAG context retrieval
	*   - ragOptions?: {
	*       limit?: number,
	*       similarityThreshold?: number
	*     }
	*
	* Response: Server-Sent Events stream with JSON data:
	*   - { type: 'token', content: string } - individual tokens
	*   - { type: 'done', sources: [...] } - completion with source citations
	*   - { type: 'title', title: string } - auto-generated title (first message only)
	*   - { type: 'error', message: string } - error during streaming
	*/
	fastify.post("/conversations/:id/messages", async (request, reply) => {
		try {
			const { id: conversationId } = request.params;
			// Validate request body
			const validation = SendMessageRequestSchema.safeParse(request.body);
			if (!validation.success) {
				return reply.code(400).send({
					success: false,
					message: "Invalid request body",
					error: validation.error.message
				});
			}
			const { message: userMessage, useRAG = true, ragOptions } = validation.data;
			// Validate conversation exists
			const conversation = await getConversation(conversationId);
			if (!conversation) {
				return reply.code(404).send({
					success: false,
					message: "Conversation not found"
				});
			}
			const emitResolvedEvent = (resolved) => {
				const resolvedAt = (resolved.resolved_at ?? new Date()).toISOString();
				setSseHeaders(reply);
				reply.raw.write(`data: ${JSON.stringify({
					type: "resolved",
					conversationId,
					resolvedBy: resolved.resolved_by ?? resolved.agent_name ?? null,
					resolvedAt
				})}\n\n`);
				reply.raw.end();
			};
			if (conversation.is_resolved) {
				emitResolvedEvent(conversation);
				return;
			}
			// Save user message to database
			const savedUserMessage = await createMessage({
				conversation_id: conversationId,
				role: "user",
				content: userMessage
			});
			fastify.log.info(`User message saved to conversation: ${conversationId}`);
			const emitEscalatedMessageEvent = () => {
				realtimeGateway.broadcastHelpdesk({
					type: "helpdesk.message_created",
					conversationId,
					message: serializeMessage(savedUserMessage)
				});
			};
			// Prevent AI responses if conversation already escalated.
			if (conversation.is_escalated) {
				setSseHeaders(reply);
				reply.raw.write(`data: ${JSON.stringify({
					type: "escalated",
					conversationId,
					reason: conversation.escalated_reason ?? undefined,
					escalatedAt: (conversation.escalated_at ?? new Date()).toISOString()
				})}\n\n`);
				emitEscalatedMessageEvent();
				reply.raw.end();
				return;
			}
			// Get conversation history (excluding the just-added user message for now)
			const messages = await getMessages(conversationId);
			const conversationHistory = messages.slice(0, -1).map((msg) => ({
				role: msg.role,
				content: msg.content
			}));
			const escalationDecision = evaluateEscalationNeed({
				userMessage,
				conversationHistory
			});
			if (escalationDecision.shouldEscalate) {
				const escalatedAt = new Date();
				await setConversationEscalationStatus(conversationId, {
					isEscalated: true,
					reason: escalationDecision.reason,
					escalatedAt
				});
				const escalatedConversation = await getConversationWithMessages(conversationId);
				if (escalatedConversation) {
					realtimeGateway.broadcastHelpdesk({
						type: "helpdesk.conversation_escalated",
						conversation: serializeConversationWithMessages(escalatedConversation)
					});
				}
				fastify.log.info(`Conversation ${conversationId} escalated: ${escalationDecision.reason}`);
				setSseHeaders(reply);
				reply.raw.write(`data: ${JSON.stringify({
					type: "escalated",
					conversationId,
					reason: escalationDecision.reason,
					escalatedAt: escalatedAt.toISOString()
				})}\n\n`);
				reply.raw.end();
				return;
			}
			// Stream chat response with RAG
			const { stream, sourceDocuments } = await streamChatWithRAG({
				userQuery: userMessage,
				conversationHistory,
				useRAG,
				ragOptions
			});
			// Set headers for Server-Sent Events (SSE)
			setSseHeaders(reply);
			// Stream tokens to client
			let fullResponse = "";
			try {
				for await (const chunk of stream) {
					fullResponse += chunk.content;
					// Send token as SSE event
					reply.raw.write(`data: ${JSON.stringify({
						type: "token",
						content: chunk.content
					})}\n\n`);
				}
				// Save complete assistant message with sources to database
				// Extract chunk IDs and similarity scores from Document metadata
				const sources = sourceDocuments.map((doc) => ({
					chunk_id: doc.metadata.id,
					similarity_score: doc.metadata.similarity
				}));
				await createMessage({
					conversation_id: conversationId,
					role: "assistant",
					content: fullResponse,
					sources: sources.length > 0 ? sources : undefined
				});
				fastify.log.info(`Assistant message saved to conversation: ${conversationId}`);
				// Send completion event with metadata
				reply.raw.write(`data: ${JSON.stringify({
					type: "done",
					sources: sourceDocuments.map((doc) => ({
						id: doc.metadata.id,
						documentId: doc.metadata.documentId,
						filename: doc.metadata.document?.filename,
						content: doc.pageContent.substring(0, 200),
						similarity: doc.metadata.similarity,
						pageNumber: doc.metadata.pageNumber,
						pageEnd: doc.metadata.pageEnd
					}))
				})}\n\n`);
				// Auto-generate title if this is the first message
				if (messages.length === 1 && !conversation.title) {
					const title = await generateConversationTitle(userMessage);
					await updateConversationTitle(conversationId, title);
					fastify.log.info(`Generated title for conversation ${conversationId}: ${title}`);
					// Send title update event
					reply.raw.write(`data: ${JSON.stringify({
						type: "title",
						title
					})}\n\n`);
				}
				reply.raw.end();
			} catch (streamError) {
				fastify.log.error({ err: streamError }, "Streaming error");
				reply.raw.write(`data: ${JSON.stringify({
					type: "error",
					message: "Streaming failed"
				})}\n\n`);
				reply.raw.end();
			}
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to send message"
			});
		}
	});
	/**
	* GET /conversations/:id
	* Get a conversation with all its messages
	*
	* Response: 200 OK
	*   { success: true, conversation: { id, title, messages: [...] } }
	*/
	fastify.get("/conversations/:id", async (request, reply) => {
		try {
			const { id } = request.params;
			const conversation = await getConversationWithMessages(id);
			if (!conversation) {
				return reply.code(404).send({
					success: false,
					message: "Conversation not found"
				});
			}
			return reply.code(200).send({
				success: true,
				conversation: serializeConversationWithMessages(conversation)
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to get conversation"
			});
		}
	});
	/**
	* GET /conversations
	* List all conversations with pagination
	*
	* Query params:
	*   - limit?: number (default: 20)
	*   - offset?: number (default: 0)
	*
	* Response: 200 OK
	*   { success: true, conversations: [...], pagination: { limit, offset, count } }
	*/
	fastify.get("/conversations", async (request, reply) => {
		try {
			const limit = parseInt(request.query.limit || "20", 10);
			const offset = parseInt(request.query.offset || "0", 10);
			const conversations = await listConversations(limit, offset);
			return reply.code(200).send({
				success: true,
				conversations: conversations.map((conv) => serializeConversation(conv)),
				pagination: {
					limit,
					offset,
					count: conversations.length
				}
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to list conversations"
			});
		}
	});
	/**
	* GET /conversations/:id/messages
	* Get all messages for a conversation (lightweight endpoint, no full conversation data)
	*/
	fastify.get("/conversations/:id/messages", async (request, reply) => {
		try {
			const { id } = request.params;
			const messages = await getMessages(id);
			return reply.code(200).send({
				success: true,
				messages: messages.map((msg) => ({
					id: msg.id,
					role: msg.role,
					content: msg.content,
					createdAt: msg.created_at.toISOString()
				}))
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to get messages"
			});
		}
	});
	/**
	* DELETE /conversations/:id
	* Delete a conversation and all its messages (cascading delete)
	*/
	fastify.delete("/conversations/:id", async (request, reply) => {
		try {
			const { id } = request.params;
			// Check if conversation exists
			const conversation = await getConversation(id);
			if (!conversation) {
				return reply.code(404).send({
					success: false,
					message: "Conversation not found"
				});
			}
			await deleteConversation(id);
			fastify.log.info(`Deleted conversation: ${id}`);
			return reply.code(200).send({
				success: true,
				message: "Conversation deleted successfully"
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to delete conversation"
			});
		}
	});
	/**
	* GET /messages/:messageId/sources
	* Get a message with its source document chunks (for displaying citations)
	*
	* Response includes:
	* - Message content
	* - Source chunks that were used to generate the response
	* - Similarity scores
	* - Document metadata (filename, mimetype)
	*/
	fastify.get("/messages/:messageId/sources", async (request, reply) => {
		try {
			const { messageId } = request.params;
			const message = await getMessageWithSources(messageId);
			if (!message) {
				return reply.code(404).send({
					success: false,
					message: "Message not found"
				});
			}
			return reply.code(200).send({
				success: true,
				message: {
					id: message.id,
					role: message.role,
					content: message.content,
					createdAt: message.created_at.toISOString(),
					sources: message.sources.map((source) => {
						const sourceWithChunk = source;
						return {
							id: sourceWithChunk.id,
							chunkId: sourceWithChunk.chunk_id,
							similarityScore: sourceWithChunk.similarity_score,
							content: sourceWithChunk.chunk.content,
							pageNumber: sourceWithChunk.chunk.metadata?.pageNumber,
							pageEnd: sourceWithChunk.chunk.metadata?.pageEnd,
							document: {
								filename: sourceWithChunk.chunk.document.filename,
								mimetype: sourceWithChunk.chunk.document.mimetype
							}
						};
					})
				}
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to get message sources"
			});
		}
	});
	/**
	* GET /conversations/:id/events
	* Persistent SSE stream that emits conversation-level events (agent joined, etc.).
	*/
	fastify.get("/conversations/:id/events", async (request, reply) => {
		try {
			const { id } = request.params;
			const conversation = await getConversation(id);
			if (!conversation) {
				return reply.code(404).send({
					success: false,
					message: "Conversation not found"
				});
			}
			setSseHeaders(reply);
			reply.raw.write(": connected\n\n");
			conversationEventHub.subscribe(id, reply);
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to subscribe to events"
			});
		}
	});
	/**
	* POST /conversations/:id/typing
	* Records that the end-user is typing so helpdesk dashboards can display presence.
	*/
	fastify.post("/conversations/:id/typing", async (request, reply) => {
		try {
			const { id } = request.params;
			const { isTyping } = request.body ?? {};
			if (typeof isTyping !== "boolean") {
				return reply.code(400).send({
					success: false,
					message: "isTyping is required"
				});
			}
			const conversation = await getConversation(id);
			if (!conversation) {
				return reply.code(404).send({
					success: false,
					message: "Conversation not found"
				});
			}
			if (!conversation.is_escalated) {
				return reply.code(409).send({
					success: false,
					message: "Conversation is not escalated"
				});
			}
			if (conversation.is_resolved) {
				return reply.code(409).send({
					success: false,
					message: "Conversation has been resolved"
				});
			}
			const emittedAt = new Date().toISOString();
			const typingEvent = {
				type: "typing",
				conversationId: id,
				actor: "user",
				isTyping,
				emittedAt
			};
			conversationEventHub.emit(id, typingEvent);
			realtimeGateway.emitConversationEvent(id, typingEvent);
			realtimeGateway.broadcastHelpdesk({
				type: "helpdesk.typing",
				conversationId: id,
				actor: "user",
				isTyping,
				emittedAt
			});
			return reply.send({ success: true });
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to record typing indicator"
			});
		}
	});
	/**
	* POST /conversations/:id/agent/join
	* Mark that a human agent has joined and broadcast an SSE event.
	*/
	fastify.post("/conversations/:id/agent/join", async (request, reply) => {
		try {
			const { id } = request.params;
			const { agentName } = request.body ?? {};
			if (!agentName || typeof agentName !== "string") {
				return reply.code(400).send({
					success: false,
					message: "agentName is required"
				});
			}
			const conversation = await getConversation(id);
			if (!conversation) {
				return reply.code(404).send({
					success: false,
					message: "Conversation not found"
				});
			}
			if (conversation.agent_name && conversation.agent_name !== agentName) {
				return reply.code(409).send({
					success: false,
					message: `Conversation already claimed by ${conversation.agent_name}`
				});
			}
			if (conversation.agent_name === agentName) {
				return reply.code(200).send({
					success: true,
					conversation: serializeConversation(conversation)
				});
			}
			const updated = await setConversationAgentJoin(id, { agentName });
			const joinedAt = updated.agent_joined_at?.toISOString();
			if (joinedAt) {
				const eventPayload = {
					type: "agent_joined",
					conversationId: id,
					agentName,
					joinedAt
				};
				conversationEventHub.emit(id, eventPayload);
				realtimeGateway.emitConversationEvent(id, eventPayload);
				realtimeGateway.broadcastHelpdesk({
					type: "helpdesk.conversation_claimed",
					conversationId: id,
					agentName,
					agentJoinedAt: joinedAt
				});
			}
			return reply.code(200).send({
				success: true,
				conversation: serializeConversation(updated)
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to record agent join"
			});
		}
	});
}

async function helpdeskRoutes(fastify) {
	fastify.get("/helpdesk/escalations", async (request, reply) => {
		try {
			const limit = parseInt(request.query.limit || "50", 10);
			const { organizationId } = request.query;
			const conversations = await listEscalatedConversations(limit, organizationId);
			return reply.send({
				success: true,
				conversations: conversations.map((conversation) => serializeConversationWithMessages(conversation))
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to load escalations"
			});
		}
	});
	/**
	* POST /helpdesk/conversations/:id/messages
	* Persists a human-agent reply and replays it to both helpdesk dashboards
	* and the original chat widget via websocket.
	*/
	fastify.post("/helpdesk/conversations/:id/messages", async (request, reply) => {
		try {
			const { id } = request.params;
			const { agentName, content } = request.body ?? {};
			if (!agentName || typeof agentName !== "string") {
				return reply.code(400).send({
					success: false,
					message: "agentName is required"
				});
			}
			if (!content || typeof content !== "string" || !content.trim()) {
				return reply.code(400).send({
					success: false,
					message: "content is required"
				});
			}
			const conversation = await getConversation(id);
			if (!conversation) {
				return reply.code(404).send({
					success: false,
					message: "Conversation not found"
				});
			}
			if (!conversation.is_escalated) {
				return reply.code(409).send({
					success: false,
					message: "Conversation is not escalated"
				});
			}
			if (conversation.is_resolved) {
				return reply.code(409).send({
					success: false,
					message: "Conversation has already been resolved"
				});
			}
			if (conversation.agent_name !== agentName) {
				return reply.code(403).send({
					success: false,
					message: "Conversation is assigned to another agent"
				});
			}
			const message = await createMessage({
				conversation_id: id,
				role: "human_agent",
				content: content.trim()
			});
			const serializedMessage = serializeMessage(message);
			realtimeGateway.broadcastHelpdesk({
				type: "helpdesk.message_created",
				conversationId: id,
				message: serializedMessage
			});
			realtimeGateway.emitConversationEvent(id, {
				type: "agent_message",
				conversationId: id,
				message: serializedMessage
			});
			conversationEventHub.emit(id, {
				type: "agent_message",
				conversationId: id,
				message: serializedMessage
			});
			return reply.send({
				success: true,
				message: serializedMessage
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to send message"
			});
		}
	});
	/**
	* POST /helpdesk/conversations/:id/typing
	* Broadcasts that a human agent is actively composing a response.
	*/
	fastify.post("/helpdesk/conversations/:id/typing", async (request, reply) => {
		try {
			const { id } = request.params;
			const { agentName, isTyping } = request.body ?? {};
			if (!agentName || typeof agentName !== "string") {
				return reply.code(400).send({
					success: false,
					message: "agentName is required"
				});
			}
			if (typeof isTyping !== "boolean") {
				return reply.code(400).send({
					success: false,
					message: "isTyping is required"
				});
			}
			const conversation = await getConversation(id);
			if (!conversation) {
				return reply.code(404).send({
					success: false,
					message: "Conversation not found"
				});
			}
			if (!conversation.is_escalated) {
				return reply.code(409).send({
					success: false,
					message: "Conversation has not been escalated"
				});
			}
			if (!conversation.agent_name) {
				return reply.code(409).send({
					success: false,
					message: "Conversation has not been claimed"
				});
			}
			if (conversation.agent_name !== agentName) {
				return reply.code(403).send({
					success: false,
					message: "Conversation is assigned to another agent"
				});
			}
			if (conversation.is_resolved) {
				return reply.code(409).send({
					success: false,
					message: "Conversation has already been resolved"
				});
			}
			const emittedAt = new Date().toISOString();
			const typingEvent = {
				type: "typing",
				conversationId: id,
				actor: "human_agent",
				isTyping,
				emittedAt
			};
			conversationEventHub.emit(id, typingEvent);
			realtimeGateway.emitConversationEvent(id, typingEvent);
			realtimeGateway.broadcastHelpdesk({
				type: "helpdesk.typing",
				conversationId: id,
				actor: "human_agent",
				isTyping,
				emittedAt
			});
			return reply.send({ success: true });
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to record typing indicator"
			});
		}
	});
	/**
	* POST /helpdesk/conversations/:id/resolve
	* Marks an escalated conversation as resolved and notifies all websocket
	* subscribers (widget + dashboards) so the UI can lock immediately.
	*/
	fastify.post("/helpdesk/conversations/:id/resolve", async (request, reply) => {
		try {
			const { id } = request.params;
			const { agentName } = request.body ?? {};
			if (!agentName || typeof agentName !== "string") {
				return reply.code(400).send({
					success: false,
					message: "agentName is required"
				});
			}
			const conversation = await getConversation(id);
			if (!conversation) {
				return reply.code(404).send({
					success: false,
					message: "Conversation not found"
				});
			}
			if (!conversation.is_escalated) {
				return reply.code(409).send({
					success: false,
					message: "Conversation has not been escalated"
				});
			}
			if (conversation.agent_name && conversation.agent_name !== agentName) {
				return reply.code(403).send({
					success: false,
					message: `Conversation already assigned to ${conversation.agent_name}`
				});
			}
			if (conversation.is_resolved) {
				return reply.code(409).send({
					success: false,
					message: "Conversation already resolved"
				});
			}
			const resolved = await setConversationResolutionStatus(id, { resolvedBy: agentName });
			const resolvedAt = resolved.resolved_at?.toISOString();
			if (!resolvedAt) {
				return reply.code(500).send({
					success: false,
					message: "Conversation resolution timestamp missing"
				});
			}
			const resolvedEvent = {
				type: "resolved",
				conversationId: id,
				resolvedBy: resolved.resolved_by,
				resolvedAt
			};
			conversationEventHub.emit(id, resolvedEvent);
			realtimeGateway.emitConversationEvent(id, resolvedEvent);
			realtimeGateway.broadcastHelpdesk({
				type: "helpdesk.conversation_resolved",
				conversationId: id,
				resolvedBy: resolved.resolved_by ?? agentName,
				resolvedAt
			});
			return reply.send({
				success: true,
				conversation: serializeConversation(resolved)
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({
				success: false,
				message: "Failed to resolve conversation"
			});
		}
	});
}

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "internal-api-key-change-me";
function validateInternalKey(request, reply) {
	const apiKey = request.headers["x-internal-api-key"];
	if (apiKey !== INTERNAL_API_KEY) {
		reply.code(401).send({ error: "Unauthorized" });
		return false;
	}
	return true;
}
async function internalRoutes(fastify) {
	// GET /internal/documents/:id - Fetch document details
	fastify.get("/internal/documents/:id", async (request, reply) => {
		if (!validateInternalKey(request, reply)) return;
		const { id } = request.params;
		try {
			const document = await getDocumentById(id);
			if (!document) {
				return reply.code(404).send({ error: "Document not found" });
			}
			return reply.send({
				id: document.id,
				filename: document.filename,
				mimetype: document.mimetype,
				storage_path: document.storage_path
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({ error: "Failed to fetch document" });
		}
	});
	// GET /internal/documents/:id/file - Download file and return as base64
	fastify.get("/internal/documents/:id/file", async (request, reply) => {
		if (!validateInternalKey(request, reply)) return;
		const { id } = request.params;
		try {
			const document = await getDocumentById(id);
			if (!document) {
				return reply.code(404).send({ error: "Document not found" });
			}
			const buffer = await downloadFileFromStorage(document.storage_path);
			const base64 = buffer.toString("base64");
			return reply.send({
				base64,
				filename: document.filename,
				mimetype: document.mimetype,
				size: buffer.length
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({ error: "Failed to download file" });
		}
	});
	// POST /internal/documents/:id/extract-text - Extract text from file and store
	fastify.post("/internal/documents/:id/extract-text", async (request, reply) => {
		if (!validateInternalKey(request, reply)) return;
		const { id } = request.params;
		const { fileBase64, filename, mimetype } = request.body;
		try {
			const fileBuffer = Buffer.from(fileBase64, "base64");
			const isTextFile = mimetype.includes("text") || mimetype.includes("markdown") || filename.endsWith(".md") || filename.endsWith(".txt");
			const isPdf = mimetype === "application/pdf" || filename.endsWith(".pdf");
			let extractedText = "";
			let canCreateEmbedding = false;
			let pageTexts;
			if (isTextFile) {
				extractedText = fileBuffer.toString("utf-8");
				canCreateEmbedding = true;
				fastify.log.info(`Extracted ${extractedText.length} characters from text file`);
			} else if (isPdf) {
				try {
					const parser = new PDFParse({ data: fileBuffer });
					const result = await parser.getText();
					if (result.pages && Array.isArray(result.pages)) {
						pageTexts = result.pages.map((page) => page.text || "");
					}
					extractedText = result.text;
					canCreateEmbedding = true;
					const info = await parser.getInfo();
					fastify.log.info(`Extracted ${extractedText.length} characters from PDF (${info.pages} pages)`);
				} catch (error) {
					fastify.log.error(`Error extracting text from PDF: ${error}`);
					extractedText = "";
					canCreateEmbedding = false;
				}
			}
			const textLength = extractedText.length;
			// Store extracted text in database
			await prisma.documents.update({
				where: { id },
				data: {
					extracted_text: extractedText || null,
					extracted_text_length: textLength,
					updated_at: new Date()
				}
			});
			return reply.send({
				textLength,
				canCreateEmbedding,
				pageTexts
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({ error: "Failed to extract text" });
		}
	});
	// POST /internal/documents/:id/process-chunks - Create chunks, embeddings, and store
	fastify.post("/internal/documents/:id/process-chunks", async (request, reply) => {
		if (!validateInternalKey(request, reply)) return;
		const { id } = request.params;
		const { filename, pageTexts } = request.body;
		try {
			// Fetch the extracted text from database
			const doc = await prisma.documents.findUnique({
				where: { id },
				select: { extracted_text: true }
			});
			if (!doc?.extracted_text) {
				return reply.code(400).send({ error: "No extracted text found" });
			}
			// Build page mapping if page texts are available (PDFs)
			let pageMapping;
			if (pageTexts && pageTexts.length > 0) {
				pageMapping = buildPageMapping(pageTexts);
				fastify.log.info(`Built page mapping with ${pageMapping.totalPages} pages`);
			}
			// Chunk the text with optional page mapping
			fastify.log.info(`Chunking text for: ${filename}`);
			const chunks = await chunkText(doc.extracted_text, pageMapping);
			fastify.log.info(`Created ${chunks.length} chunks`);
			const chunkContents = chunks.map((chunk) => chunk.content);
			// Create embeddings in batch
			fastify.log.info(`Creating embeddings for ${chunks.length} chunks...`);
			const embeddingStartTime = Date.now();
			const embeddings = await createEmbeddingsBatch(chunkContents);
			const embeddingTime = ((Date.now() - embeddingStartTime) / 1e3).toFixed(2);
			fastify.log.info(`✓ Created ${embeddings.length} embeddings in ${embeddingTime}s`);
			// Delete existing chunks for this document (in case of reprocessing)
			await prisma.document_chunks.deleteMany({ where: { document_id: id } });
			fastify.log.info(`Storing ${chunks.length} chunks in database...`);
			const storeStartTime = Date.now();
			// Build VALUES rows for bulk insert
			const values = [];
			const params = [];
			let paramIndex = 1;
			for (let i = 0; i < chunks.length; i++) {
				const chunk = chunks[i];
				const embedding = embeddings[i];
				if (!chunk || !embedding) {
					return reply.code(500).send({ error: `Missing chunk or embedding at index ${i}` });
				}
				const embeddingString = `[${embedding.join(",")}]`;
				values.push(`(gen_random_uuid(), $${paramIndex}::uuid, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}::vector, $${paramIndex + 5}::jsonb, NOW())`);
				params.push(id, chunk.metadata.chunkIndex, chunk.content, estimateTokenCount(chunk.content), embeddingString, JSON.stringify(chunk.metadata));
				paramIndex += 6;
			}
			// Execute bulk insert
			await prisma.$executeRawUnsafe(`INSERT INTO document_chunks (id, document_id, chunk_index, content, token_count, embedding, metadata, created_at)
         VALUES ${values.join(", ")}`, ...params);
			const storeTime = ((Date.now() - storeStartTime) / 1e3).toFixed(2);
			fastify.log.info(`✓ Stored ${chunks.length} chunks in ${storeTime}s`);
			return reply.send({ chunkCount: chunks.length });
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({ error: "Failed to process chunks" });
		}
	});
	// PATCH /internal/documents/:id/metadata - Update document metadata
	fastify.patch("/internal/documents/:id/metadata", async (request, reply) => {
		if (!validateInternalKey(request, reply)) return;
		const { id } = request.params;
		const { hasEmbedding } = request.body;
		try {
			await prisma.documents.update({
				where: { id },
				data: {
					has_embedding: hasEmbedding,
					updated_at: new Date()
				}
			});
			return reply.send({ success: true });
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({ error: "Failed to update metadata" });
		}
	});
	// DELETE /internal/documents/:id - Delete document (for cleanup on failure)
	fastify.delete("/internal/documents/:id", async (request, reply) => {
		if (!validateInternalKey(request, reply)) return;
		const { id } = request.params;
		try {
			await prisma.documents.delete({ where: { id } });
			return reply.send({ success: true });
		} catch (error) {
			fastify.log.error(error);
			return reply.code(500).send({ error: "Failed to delete document" });
		}
	});
}

dotenv.config();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.CORS_ORIGINS ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
const fastify = Fastify({ logger: process.env.NODE_ENV === "production" ? true : { transport: {
	target: "pino-pretty",
	options: {
		translateTime: "HH:MM:ss Z",
		ignore: "pid,hostname"
	}
} } });
// Register CORS
await fastify.register(cors, {
	credentials: true,
	origin(origin, cb) {
		if (!origin || allowedOrigins.includes(origin)) {
			cb(null, true);
			return;
		}
		cb(new Error("Origin not allowed"), false);
	}
});
// Register multipart plugin for file uploads
await fastify.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
// Register websocket transport for realtime updates
await fastify.register(websocket);
realtimeGateway.register(fastify);
// Register upload routes
await fastify.register(uploadRoutes);
// Register chat routes
await fastify.register(chatRoutes);
// Helpdesk-specific routes
await fastify.register(helpdeskRoutes);
// Internal routes for workflow processing
await fastify.register(internalRoutes);
// Hello world endpoint
fastify.get("/", async () => {
	return { message: "Hello World" };
});
// Health check endpoint
fastify.get("/health", async () => {
	return { status: "ok" };
});
// For local development, start the server directly
const isDev = process.env.NODE_ENV !== "production";
if (isDev) {
	const startServer = async () => {
		try {
			await fastify.listen({
				port: Number(PORT),
				host: "0.0.0.0"
			});
			console.log(`Server is running on port ${PORT}`);
		} catch (err) {
			fastify.log.error(err);
			process.exit(1);
		}
	};
	startServer();
}
// For Nitro/Vercel compatibility, export the handler
await fastify.ready();
const _JoGCGO = (req, res) => {
	fastify.server.emit("request", req, res);
};

async function handler(request) {
  const url = new URL(request.url);
  // Extract token from pathname: /.well-known/workflow/v1/webhook/{token}
  const pathParts = url.pathname.split('/');
  const token = decodeURIComponent(pathParts[pathParts.length - 1]);

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  try {
    const response = await resumeWebhook(token, request);
    return response;
  } catch (error) {
    // TODO: differentiate between invalid token and other errors
    console.error('Error during resumeWebhook', error);
    return new Response(null, { status: 404 });
  }
}
const POST$1 = handler;

const _n9RDGO = async ({ req }) => {
	try {
		return await POST$1(req);
	} catch (error) {
		console.error("Handler error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
};

const _g3m8Xw = async ({ req }) => {
	try {
		return await stepEntrypoint(req);
	} catch (error) {
		console.error("Handler error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
};

// biome-ignore-all lint: generated file
/* eslint-disable */

const workflowCode = `globalThis.__private_workflows = new Map();
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/workflows/processDocument.ts
async function processDocument(documentId) {
  try {
    const document = await fetchDocument(documentId);
    const fileData = await downloadFile(documentId);
    const extractResult = await extractText(documentId, fileData.base64, fileData.filename, fileData.mimetype);
    let chunkCount = 0;
    if (extractResult.canCreateEmbedding) {
      const chunkResult = await processChunks(documentId, document.filename, extractResult.pageTexts);
      chunkCount = chunkResult.chunkCount;
    } else {
      console.log(\`Skipping embedding creation for unsupported file: \${document.filename}\`);
    }
    await updateMetadata(documentId, chunkCount > 0);
    return {
      success: true,
      message: "Document processed successfully",
      documentId,
      filename: document.filename,
      extractedTextLength: extractResult.textLength,
      hasEmbedding: chunkCount > 0,
      chunkCount
    };
  } catch (error) {
    console.error(\`Error processing document \${documentId}:\`, error);
    try {
      console.log(\`Cleaning up failed document: \${documentId}\`);
      await deleteDocument(documentId);
      console.log(\`Successfully deleted failed document: \${documentId}\`);
    } catch (deleteError) {
      console.error(\`Failed to delete document \${documentId}:\`, deleteError);
    }
    throw error;
  }
}
__name(processDocument, "processDocument");
processDocument.workflowId = "workflow//src/workflows/processDocument.ts//processDocument";
globalThis.__private_workflows.set("workflow//src/workflows/processDocument.ts//processDocument", processDocument);
var fetchDocument = globalThis[Symbol.for("WORKFLOW_USE_STEP")]("step//src/workflows/processDocument.ts//fetchDocument");
var downloadFile = globalThis[Symbol.for("WORKFLOW_USE_STEP")]("step//src/workflows/processDocument.ts//downloadFile");
var extractText = globalThis[Symbol.for("WORKFLOW_USE_STEP")]("step//src/workflows/processDocument.ts//extractText");
var processChunks = globalThis[Symbol.for("WORKFLOW_USE_STEP")]("step//src/workflows/processDocument.ts//processChunks");
var updateMetadata = globalThis[Symbol.for("WORKFLOW_USE_STEP")]("step//src/workflows/processDocument.ts//updateMetadata");
var deleteDocument = globalThis[Symbol.for("WORKFLOW_USE_STEP")]("step//src/workflows/processDocument.ts//deleteDocument");
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL3dvcmtmbG93cy9wcm9jZXNzRG9jdW1lbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKl9faW50ZXJuYWxfd29ya2Zsb3dze1wid29ya2Zsb3dzXCI6e1wic3JjL3dvcmtmbG93cy9wcm9jZXNzRG9jdW1lbnQudHNcIjp7XCJwcm9jZXNzRG9jdW1lbnRcIjp7XCJ3b3JrZmxvd0lkXCI6XCJ3b3JrZmxvdy8vc3JjL3dvcmtmbG93cy9wcm9jZXNzRG9jdW1lbnQudHMvL3Byb2Nlc3NEb2N1bWVudFwifX19LFwic3RlcHNcIjp7XCJzcmMvd29ya2Zsb3dzL3Byb2Nlc3NEb2N1bWVudC50c1wiOntcImRlbGV0ZURvY3VtZW50XCI6e1wic3RlcElkXCI6XCJzdGVwLy9zcmMvd29ya2Zsb3dzL3Byb2Nlc3NEb2N1bWVudC50cy8vZGVsZXRlRG9jdW1lbnRcIn0sXCJkb3dubG9hZEZpbGVcIjp7XCJzdGVwSWRcIjpcInN0ZXAvL3NyYy93b3JrZmxvd3MvcHJvY2Vzc0RvY3VtZW50LnRzLy9kb3dubG9hZEZpbGVcIn0sXCJleHRyYWN0VGV4dFwiOntcInN0ZXBJZFwiOlwic3RlcC8vc3JjL3dvcmtmbG93cy9wcm9jZXNzRG9jdW1lbnQudHMvL2V4dHJhY3RUZXh0XCJ9LFwiZmV0Y2hEb2N1bWVudFwiOntcInN0ZXBJZFwiOlwic3RlcC8vc3JjL3dvcmtmbG93cy9wcm9jZXNzRG9jdW1lbnQudHMvL2ZldGNoRG9jdW1lbnRcIn0sXCJwcm9jZXNzQ2h1bmtzXCI6e1wic3RlcElkXCI6XCJzdGVwLy9zcmMvd29ya2Zsb3dzL3Byb2Nlc3NEb2N1bWVudC50cy8vcHJvY2Vzc0NodW5rc1wifSxcInVwZGF0ZU1ldGFkYXRhXCI6e1wic3RlcElkXCI6XCJzdGVwLy9zcmMvd29ya2Zsb3dzL3Byb2Nlc3NEb2N1bWVudC50cy8vdXBkYXRlTWV0YWRhdGFcIn19fX0qLztcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcm9jZXNzRG9jdW1lbnQoZG9jdW1lbnRJZCkge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIFN0ZXAgMTogRmV0Y2ggZG9jdW1lbnQgZnJvbSBkYXRhYmFzZVxuICAgICAgICBjb25zdCBkb2N1bWVudCA9IGF3YWl0IGZldGNoRG9jdW1lbnQoZG9jdW1lbnRJZCk7XG4gICAgICAgIC8vIFN0ZXAgMjogRG93bmxvYWQgZmlsZSBmcm9tIHN0b3JhZ2VcbiAgICAgICAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCBkb3dubG9hZEZpbGUoZG9jdW1lbnRJZCk7XG4gICAgICAgIC8vIFN0ZXAgMzogUHJvY2VzcyBmaWxlIGNvbnRlbnQgYW5kIGV4dHJhY3QgdGV4dFxuICAgICAgICBjb25zdCBleHRyYWN0UmVzdWx0ID0gYXdhaXQgZXh0cmFjdFRleHQoZG9jdW1lbnRJZCwgZmlsZURhdGEuYmFzZTY0LCBmaWxlRGF0YS5maWxlbmFtZSwgZmlsZURhdGEubWltZXR5cGUpO1xuICAgICAgICAvLyBTdGVwIDQ6IENodW5rLCBjcmVhdGUgZW1iZWRkaW5ncywgYW5kIHN0b3JlXG4gICAgICAgIGxldCBjaHVua0NvdW50ID0gMDtcbiAgICAgICAgaWYgKGV4dHJhY3RSZXN1bHQuY2FuQ3JlYXRlRW1iZWRkaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBjaHVua1Jlc3VsdCA9IGF3YWl0IHByb2Nlc3NDaHVua3MoZG9jdW1lbnRJZCwgZG9jdW1lbnQuZmlsZW5hbWUsIGV4dHJhY3RSZXN1bHQucGFnZVRleHRzKTtcbiAgICAgICAgICAgIGNodW5rQ291bnQgPSBjaHVua1Jlc3VsdC5jaHVua0NvdW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFNraXBwaW5nIGVtYmVkZGluZyBjcmVhdGlvbiBmb3IgdW5zdXBwb3J0ZWQgZmlsZTogJHtkb2N1bWVudC5maWxlbmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBTdGVwIDU6IFVwZGF0ZSBkb2N1bWVudCBtZXRhZGF0YSB3aXRoIGZpbmFsIHN0YXR1c1xuICAgICAgICBhd2FpdCB1cGRhdGVNZXRhZGF0YShkb2N1bWVudElkLCBjaHVua0NvdW50ID4gMCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgbWVzc2FnZTogXCJEb2N1bWVudCBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5XCIsXG4gICAgICAgICAgICBkb2N1bWVudElkOiBkb2N1bWVudElkLFxuICAgICAgICAgICAgZmlsZW5hbWU6IGRvY3VtZW50LmZpbGVuYW1lLFxuICAgICAgICAgICAgZXh0cmFjdGVkVGV4dExlbmd0aDogZXh0cmFjdFJlc3VsdC50ZXh0TGVuZ3RoLFxuICAgICAgICAgICAgaGFzRW1iZWRkaW5nOiBjaHVua0NvdW50ID4gMCxcbiAgICAgICAgICAgIGNodW5rQ291bnQ6IGNodW5rQ291bnRcbiAgICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAvLyBJZiBwcm9jZXNzaW5nIGZhaWxzLCBkZWxldGUgdGhlIGRvY3VtZW50IHRvIGFsbG93IHJlLXVwbG9hZGluZ1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwcm9jZXNzaW5nIGRvY3VtZW50ICR7ZG9jdW1lbnRJZH06YCwgZXJyb3IpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYENsZWFuaW5nIHVwIGZhaWxlZCBkb2N1bWVudDogJHtkb2N1bWVudElkfWApO1xuICAgICAgICAgICAgYXdhaXQgZGVsZXRlRG9jdW1lbnQoZG9jdW1lbnRJZCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU3VjY2Vzc2Z1bGx5IGRlbGV0ZWQgZmFpbGVkIGRvY3VtZW50OiAke2RvY3VtZW50SWR9YCk7XG4gICAgICAgIH0gY2F0Y2ggKGRlbGV0ZUVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gZGVsZXRlIGRvY3VtZW50ICR7ZG9jdW1lbnRJZH06YCwgZGVsZXRlRXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbn1cbnByb2Nlc3NEb2N1bWVudC53b3JrZmxvd0lkID0gXCJ3b3JrZmxvdy8vc3JjL3dvcmtmbG93cy9wcm9jZXNzRG9jdW1lbnQudHMvL3Byb2Nlc3NEb2N1bWVudFwiO1xuZ2xvYmFsVGhpcy5fX3ByaXZhdGVfd29ya2Zsb3dzLnNldChcIndvcmtmbG93Ly9zcmMvd29ya2Zsb3dzL3Byb2Nlc3NEb2N1bWVudC50cy8vcHJvY2Vzc0RvY3VtZW50XCIsIHByb2Nlc3NEb2N1bWVudCk7XG4vLyBTdGVwIGZ1bmN0aW9ucyB0aGF0IGNhbGwgaW50ZXJuYWwgQVBJIGVuZHBvaW50c1xudmFyIGZldGNoRG9jdW1lbnQgPSBnbG9iYWxUaGlzW1N5bWJvbC5mb3IoXCJXT1JLRkxPV19VU0VfU1RFUFwiKV0oXCJzdGVwLy9zcmMvd29ya2Zsb3dzL3Byb2Nlc3NEb2N1bWVudC50cy8vZmV0Y2hEb2N1bWVudFwiKTtcbnZhciBkb3dubG9hZEZpbGUgPSBnbG9iYWxUaGlzW1N5bWJvbC5mb3IoXCJXT1JLRkxPV19VU0VfU1RFUFwiKV0oXCJzdGVwLy9zcmMvd29ya2Zsb3dzL3Byb2Nlc3NEb2N1bWVudC50cy8vZG93bmxvYWRGaWxlXCIpO1xudmFyIGV4dHJhY3RUZXh0ID0gZ2xvYmFsVGhpc1tTeW1ib2wuZm9yKFwiV09SS0ZMT1dfVVNFX1NURVBcIildKFwic3RlcC8vc3JjL3dvcmtmbG93cy9wcm9jZXNzRG9jdW1lbnQudHMvL2V4dHJhY3RUZXh0XCIpO1xudmFyIHByb2Nlc3NDaHVua3MgPSBnbG9iYWxUaGlzW1N5bWJvbC5mb3IoXCJXT1JLRkxPV19VU0VfU1RFUFwiKV0oXCJzdGVwLy9zcmMvd29ya2Zsb3dzL3Byb2Nlc3NEb2N1bWVudC50cy8vcHJvY2Vzc0NodW5rc1wiKTtcbnZhciB1cGRhdGVNZXRhZGF0YSA9IGdsb2JhbFRoaXNbU3ltYm9sLmZvcihcIldPUktGTE9XX1VTRV9TVEVQXCIpXShcInN0ZXAvL3NyYy93b3JrZmxvd3MvcHJvY2Vzc0RvY3VtZW50LnRzLy91cGRhdGVNZXRhZGF0YVwiKTtcbnZhciBkZWxldGVEb2N1bWVudCA9IGdsb2JhbFRoaXNbU3ltYm9sLmZvcihcIldPUktGTE9XX1VTRV9TVEVQXCIpXShcInN0ZXAvL3NyYy93b3JrZmxvd3MvcHJvY2Vzc0RvY3VtZW50LnRzLy9kZWxldGVEb2N1bWVudFwiKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7O0FBQ0EsZUFBc0IsZ0JBQWdCLFlBQVk7QUFDOUMsTUFBSTtBQUVBLFVBQU0sV0FBVyxNQUFNLGNBQWMsVUFBVTtBQUUvQyxVQUFNLFdBQVcsTUFBTSxhQUFhLFVBQVU7QUFFOUMsVUFBTSxnQkFBZ0IsTUFBTSxZQUFZLFlBQVksU0FBUyxRQUFRLFNBQVMsVUFBVSxTQUFTLFFBQVE7QUFFekcsUUFBSSxhQUFhO0FBQ2pCLFFBQUksY0FBYyxvQkFBb0I7QUFDbEMsWUFBTSxjQUFjLE1BQU0sY0FBYyxZQUFZLFNBQVMsVUFBVSxjQUFjLFNBQVM7QUFDOUYsbUJBQWEsWUFBWTtBQUFBLElBQzdCLE9BQU87QUFDSCxjQUFRLElBQUkscURBQXFELFNBQVMsUUFBUSxFQUFFO0FBQUEsSUFDeEY7QUFFQSxVQUFNLGVBQWUsWUFBWSxhQUFhLENBQUM7QUFDL0MsV0FBTztBQUFBLE1BQ0gsU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLE1BQ1Q7QUFBQSxNQUNBLFVBQVUsU0FBUztBQUFBLE1BQ25CLHFCQUFxQixjQUFjO0FBQUEsTUFDbkMsY0FBYyxhQUFhO0FBQUEsTUFDM0I7QUFBQSxJQUNKO0FBQUEsRUFDSixTQUFTLE9BQU87QUFFWixZQUFRLE1BQU0sNkJBQTZCLFVBQVUsS0FBSyxLQUFLO0FBQy9ELFFBQUk7QUFDQSxjQUFRLElBQUksZ0NBQWdDLFVBQVUsRUFBRTtBQUN4RCxZQUFNLGVBQWUsVUFBVTtBQUMvQixjQUFRLElBQUkseUNBQXlDLFVBQVUsRUFBRTtBQUFBLElBQ3JFLFNBQVMsYUFBYTtBQUNsQixjQUFRLE1BQU0sNkJBQTZCLFVBQVUsS0FBSyxXQUFXO0FBQUEsSUFDekU7QUFDQSxVQUFNO0FBQUEsRUFDVjtBQUNKO0FBdkNzQjtBQXdDdEIsZ0JBQWdCLGFBQWE7QUFDN0IsV0FBVyxvQkFBb0IsSUFBSSwrREFBK0QsZUFBZTtBQUVqSCxJQUFJLGdCQUFnQixXQUFXLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxFQUFFLHVEQUF1RDtBQUN2SCxJQUFJLGVBQWUsV0FBVyxPQUFPLElBQUksbUJBQW1CLENBQUMsRUFBRSxzREFBc0Q7QUFDckgsSUFBSSxjQUFjLFdBQVcsT0FBTyxJQUFJLG1CQUFtQixDQUFDLEVBQUUscURBQXFEO0FBQ25ILElBQUksZ0JBQWdCLFdBQVcsT0FBTyxJQUFJLG1CQUFtQixDQUFDLEVBQUUsdURBQXVEO0FBQ3ZILElBQUksaUJBQWlCLFdBQVcsT0FBTyxJQUFJLG1CQUFtQixDQUFDLEVBQUUsd0RBQXdEO0FBQ3pILElBQUksaUJBQWlCLFdBQVcsT0FBTyxJQUFJLG1CQUFtQixDQUFDLEVBQUUsd0RBQXdEOyIsCiAgIm5hbWVzIjogW10KfQo=
`;

const POST = workflowEntrypoint(workflowCode);

const _psdlYg = async ({ req }) => {
	try {
		return await POST(req);
	} catch (error) {
		console.error("Handler error:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
};

const assets = {};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = new Set(["HEAD", "GET"]);
const EncodingMap = {
	gzip: ".gz",
	br: ".br"
};
const _zHJ9HK = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) {
		return;
	}
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodingHeader = event.req.headers.get("accept-encoding") || "";
	const encodings = [...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	if (encodings.length > 1) {
		event.res.headers.append("Vary", "Accept-Encoding");
	}
	for (const encoding of encodings) {
		for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
			const _asset = getAsset(_id);
			if (_asset) {
				asset = _asset;
				id = _id;
				break;
			}
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	const ifNotMatch = event.req.headers.get("if-none-match") === asset.etag;
	if (ifNotMatch) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) {
		event.res.headers.set("Content-Type", asset.type);
	}
	if (asset.etag && !event.res.headers.has("ETag")) {
		event.res.headers.set("ETag", asset.etag);
	}
	if (asset.mtime && !event.res.headers.has("Last-Modified")) {
		event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	}
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) {
		event.res.headers.set("Content-Encoding", asset.encoding);
	}
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) {
		event.res.headers.set("Content-Length", asset.size.toString());
	}
	return readAsset(id);
});

const findRoute = /* @__PURE__ */ (() => { const $0={route:"/.well-known/workflow/v1/step",handler:toEventHandler(_g3m8Xw)},$1={route:"/.well-known/workflow/v1/flow",handler:toEventHandler(_psdlYg)},$2={route:"/.well-known/workflow/v1/webhook/:token",handler:toEventHandler(_n9RDGO)},$3={route:"/**",handler:toEventHandler(toFetchHandler(_JoGCGO))}; return (m,p)=>{if(p.charCodeAt(p.length-1)===47)p=p.slice(0,-1)||"/";if(p==="/.well-known/workflow/v1/step"){return {data:$0};}if(p==="/.well-known/workflow/v1/flow"){return {data:$1};}let s=p.split("/"),l=s.length-1;if(s[1]===".well-known"){if(s[2]==="workflow"){if(s[3]==="v1"){if(s[4]==="webhook"){if(l===5||l===4){if(l>=5)return {data:$2,params:{"token":s[5],}};}}}}}return {data:$3,params:{"_":s.slice(1).join('/'),}};}})();

const globalMiddleware = [
  toEventHandler(_zHJ9HK)
].filter(Boolean);

function useNitroApp() {
	return useNitroApp.__instance__ ??= initNitroApp();
}
function initNitroApp() {
	const nitroApp = createNitroApp();
	globalThis.__nitro__ = nitroApp;
	return nitroApp;
}
function createNitroApp() {
	const hooks = undefined;
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) {
				errors.push({
					error,
					context: errorCtx
				});
			}
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return errorHandler$1(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	const app = {
		fetch: appHandler,
		h3: h3App,
		hooks,
		captureError
	};
	return app;
}
function createH3App(config) {
	// Create H3 app
	const h3App = new H3Core(config);
	// Compiled route matching
	(h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname));
	h3App["~middleware"].push(...globalMiddleware);
	return h3App;
}

function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}

export { serve as s, trapUnhandledErrors as t, useNitroApp as u };
