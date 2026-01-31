#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "basic-ftp";
import { Readable, Writable } from "node:stream";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Configuration constants
const DEFAULT_FTP_HOST = "127.0.0.1";
const FTP_PORT = Number.parseInt(process.env.FTP_PORT || process.env.PORT || "1821", 10);
const FTP_USER = process.env.FTP_USER || "user";
const FTP_PASS = process.env.FTP_PASS || "user";
const FTP_SECURE = process.env.FTP_SECURE === "true";
const FTP_TIMEOUT = Number.parseInt(process.env.FTP_TIMEOUT || "10000", 10);
const USE_GCLOUD_FTP = process.env.MCP_FTP_USE_GCLOUD !== "false";
const GCLOUD_FTP_STARTUP_TIMEOUT = Number.parseInt(
  process.env.GCLOUD_FTP_STARTUP_TIMEOUT || "20000",
  10
);
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const GCLOUD_FTP_ROOT =
  process.env.GCLOUD_FTP_ROOT || path.resolve(MODULE_DIR, "../../../gcloud-ftp");
const GCLOUD_FTP_ENTRY =
  process.env.GCLOUD_FTP_ENTRY || path.join(GCLOUD_FTP_ROOT, "dist", "index.js");
const DEBUG = process.env.MCP_FTP_DEBUG === "true";

// Helper function for debug logging
function debugLog(message: string, ...args: unknown[]): void {
  if (DEBUG) {
    console.error(`[ftp-mcp] ${message}`, ...args);
  }
}

let ftpHost = process.env.FTP_HOST || DEFAULT_FTP_HOST;
let gcloudFtpProcess: ReturnType<typeof spawn> | null = null;
let spawnedGcloudFtp = false;

const ListArgsSchema = z.object({
  path: z.string().optional().describe("Remote path to list (default: current directory)"),
});

const DownloadArgsSchema = z.object({
  remotePath: z.string().describe("Remote file path to download"),
  localPath: z.string().optional().describe("Optional local path to save to (server-side)"),
  encoding: z.enum(["base64", "utf8"]).optional().describe("Encoding if returning content"),
});

const UploadArgsSchema = z.object({
  remotePath: z.string().describe("Remote file path to upload to"),
  localPath: z.string().optional().describe("Local file path to upload from (server-side)"),
  content: z.string().optional().describe("File content to upload"),
  encoding: z.enum(["base64", "utf8"]).optional().describe("Encoding for content"),
});

const DeleteArgsSchema = z.object({
  remotePath: z.string().describe("Remote file path to delete"),
});

const RenameArgsSchema = z.object({
  from: z.string().describe("Existing remote path"),
  to: z.string().describe("New remote path"),
});

const MkdirArgsSchema = z.object({
  path: z.string().describe("Remote directory path to create"),
  recursive: z.boolean().optional().describe("Create parent directories if needed"),
});

const RmdirArgsSchema = z.object({
  path: z.string().describe("Remote directory path to remove"),
  recursive: z.boolean().optional().describe("Remove contents if needed"),
});

const StatArgsSchema = z.object({
  remotePath: z.string().describe("Remote path to stat"),
});

const PwdArgsSchema = z.object({});

function normalizeRemotePath(remotePath: string): string {
  const normalized = remotePath.startsWith("/")
    ? path.posix.normalize(remotePath)
    : path.posix.normalize(`/${remotePath}`);
  return normalized === "" ? "/" : normalized;
}

function isLocalHost(host: string): boolean {
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

async function canConnect(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (result: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(500);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });
}

async function waitForPort(host: string, port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await canConnect(host, port)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for gcloud-ftp to listen on ${host}:${port}`);
}

async function ensureGcloudFtpRunning(): Promise<void> {
  if (!USE_GCLOUD_FTP) {
    debugLog("gcloud-ftp integration disabled");
    return;
  }

  if (!isLocalHost(ftpHost)) {
    console.error(
      `FTP_HOST=${ftpHost} is not local. Forcing FTP_HOST=127.0.0.1 to use gcloud-ftp.`
    );
    ftpHost = DEFAULT_FTP_HOST;
  }

  if (await canConnect(ftpHost, FTP_PORT)) {
    debugLog(`FTP server already running on ${ftpHost}:${FTP_PORT}`);
    return;
  }

  if (!fs.existsSync(GCLOUD_FTP_ENTRY)) {
    throw new Error(
      `gcloud-ftp entry not found at ${GCLOUD_FTP_ENTRY}. Set GCLOUD_FTP_ROOT/GCLOUD_FTP_ENTRY or build gcloud-ftp first.`
    );
  }

  debugLog(`Starting gcloud-ftp from ${GCLOUD_FTP_ENTRY}...`);

  const env = {
    ...process.env,
    PORT: String(FTP_PORT),
    SERVER: ftpHost,
    FTP_USER,
    FTP_PASS,
  };

  gcloudFtpProcess = spawn(process.execPath, [GCLOUD_FTP_ENTRY], {
    cwd: GCLOUD_FTP_ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  spawnedGcloudFtp = true;

  gcloudFtpProcess.stdout?.on("data", (chunk) => {
    process.stderr.write(`[gcloud-ftp] ${chunk}`);
  });
  gcloudFtpProcess.stderr?.on("data", (chunk) => {
    process.stderr.write(`[gcloud-ftp] ${chunk}`);
  });

  const exitPromise = new Promise<never>((_, reject) => {
    gcloudFtpProcess?.once("exit", (code, signal) => {
      reject(new Error(`gcloud-ftp exited early (code=${code} signal=${signal ?? "none"})`));
    });
  });

  try {
    await Promise.race([waitForPort(ftpHost, FTP_PORT, GCLOUD_FTP_STARTUP_TIMEOUT), exitPromise]);
    debugLog(`gcloud-ftp started successfully on ${ftpHost}:${FTP_PORT}`);
  } catch (error) {
    stopGcloudFtpIfSpawned();
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to start gcloud-ftp: ${detail}. Ensure client_secrets.json and token cache exist in ${GCLOUD_FTP_ROOT}.`
    );
  }
}

function stopGcloudFtpIfSpawned(): void {
  if (spawnedGcloudFtp && gcloudFtpProcess && !gcloudFtpProcess.killed) {
    gcloudFtpProcess.kill("SIGTERM");
  }
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client(FTP_TIMEOUT);
  try {
    debugLog(`Connecting to FTP server at ${ftpHost}:${FTP_PORT}...`);
    await client.access({
      host: ftpHost,
      port: FTP_PORT,
      user: FTP_USER,
      password: FTP_PASS,
      secure: FTP_SECURE,
    });
    debugLog("FTP connection established");
    return await fn(client);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`FTP operation failed: ${errorMsg}`);
    throw error;
  } finally {
    client.close();
    debugLog("FTP connection closed");
  }
}

function bufferWritable(): { writable: Writable; getBuffer: () => Buffer } {
  const chunks: Buffer[] = [];
  const writable = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      cb();
    },
  });
  return {
    writable,
    getBuffer: () => Buffer.concat(chunks),
  };
}

const server = new Server(
  { name: "ftp-mcp-bridge", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ftp_list",
        description: "List files in a remote FTP directory",
        inputSchema: zodToJsonSchema(ListArgsSchema),
      },
      {
        name: "ftp_download",
        description: "Download a remote file (returns content or saves to local path)",
        inputSchema: zodToJsonSchema(DownloadArgsSchema),
      },
      {
        name: "ftp_upload",
        description: "Upload a local file or provided content to a remote path",
        inputSchema: zodToJsonSchema(UploadArgsSchema),
      },
      {
        name: "ftp_delete",
        description: "Delete a remote file",
        inputSchema: zodToJsonSchema(DeleteArgsSchema),
      },
      {
        name: "ftp_rename",
        description: "Rename or move a remote file or directory",
        inputSchema: zodToJsonSchema(RenameArgsSchema),
      },
      {
        name: "ftp_mkdir",
        description: "Create a remote directory",
        inputSchema: zodToJsonSchema(MkdirArgsSchema),
      },
      {
        name: "ftp_rmdir",
        description: "Remove a remote directory",
        inputSchema: zodToJsonSchema(RmdirArgsSchema),
      },
      {
        name: "ftp_stat",
        description: "Get metadata for a remote path",
        inputSchema: zodToJsonSchema(StatArgsSchema),
      },
      {
        name: "ftp_pwd",
        description: "Get current working directory on the FTP server",
        inputSchema: zodToJsonSchema(PwdArgsSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "ftp_list": {
      const { path: listPath } = ListArgsSchema.parse(args ?? {});
      const remotePath = listPath ? normalizeRemotePath(listPath) : ".";
      const listing = await withClient((client) => client.list(remotePath));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              listing.map((entry) => ({
                name: entry.name,
                size: entry.size,
                type: entry.type,
                modifiedAt: entry.modifiedAt?.toISOString() ?? null,
                rawModifiedAt: entry.rawModifiedAt ?? null,
              })),
              null,
              2
            ),
          },
        ],
      };
    }
    case "ftp_download": {
      const { remotePath, localPath, encoding } = DownloadArgsSchema.parse(args ?? {});
      const normalized = normalizeRemotePath(remotePath);

      if (localPath) {
        await withClient((client) => client.downloadTo(localPath, normalized));
        return {
          content: [{ type: "text", text: JSON.stringify({ savedTo: localPath }, null, 2) }],
        };
      }

      const { writable, getBuffer } = bufferWritable();
      await withClient((client) => client.downloadTo(writable, normalized));
      const buffer = getBuffer();
      const outEncoding = encoding || "base64";
      const data = outEncoding === "utf8" ? buffer.toString("utf8") : buffer.toString("base64");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                path: normalized,
                bytes: buffer.length,
                encoding: outEncoding,
                data,
              },
              null,
              2
            ),
          },
        ],
      };
    }
    case "ftp_upload": {
      const { remotePath, localPath, content, encoding } = UploadArgsSchema.parse(args ?? {});
      const normalized = normalizeRemotePath(remotePath);

      if (!localPath && !content) {
        throw new Error("Either localPath or content must be provided.");
      }

      if (localPath) {
        await withClient((client) => client.uploadFrom(localPath, normalized));
        return {
          content: [{ type: "text", text: JSON.stringify({ uploadedFrom: localPath }, null, 2) }],
        };
      }

      const outEncoding = encoding || "utf8";
      const buffer = outEncoding === "base64" ? Buffer.from(content!, "base64") : Buffer.from(content!, "utf8");
      const readable = Readable.from(buffer);
      await withClient((client) => client.uploadFrom(readable, normalized));
      return {
        content: [{ type: "text", text: JSON.stringify({ uploadedBytes: buffer.length }, null, 2) }],
      };
    }
    case "ftp_delete": {
      const { remotePath } = DeleteArgsSchema.parse(args ?? {});
      const normalized = normalizeRemotePath(remotePath);
      await withClient((client) => client.remove(normalized));
      return { content: [{ type: "text", text: "Deleted." }] };
    }
    case "ftp_rename": {
      const { from, to } = RenameArgsSchema.parse(args ?? {});
      await withClient((client) => client.rename(normalizeRemotePath(from), normalizeRemotePath(to)));
      return { content: [{ type: "text", text: "Renamed." }] };
    }
    case "ftp_mkdir": {
      const { path: mkdirPath } = MkdirArgsSchema.parse(args ?? {});
      const normalized = normalizeRemotePath(mkdirPath);
      await withClient(async (client) => {
        const cwd = await client.pwd();
        await client.ensureDir(normalized);
        await client.cd(cwd);
      });
      return { content: [{ type: "text", text: "Directory created." }] };
    }
    case "ftp_rmdir": {
      const { path: rmdirPath } = RmdirArgsSchema.parse(args ?? {});
      const normalized = normalizeRemotePath(rmdirPath);
      await withClient((client) => client.removeDir(normalized));
      return { content: [{ type: "text", text: "Directory removed." }] };
    }
    case "ftp_stat": {
      const { remotePath } = StatArgsSchema.parse(args ?? {});
      const normalized = normalizeRemotePath(remotePath);
      const dirname = path.posix.dirname(normalized);
      const basename = path.posix.basename(normalized);
      const listing = await withClient((client) => client.list(dirname === "/" ? "/" : dirname));
      const entry = listing.find((item) => item.name === basename);
      if (!entry) {
        throw new Error("Path not found");
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                name: entry.name,
                size: entry.size,
                type: entry.type,
                modifiedAt: entry.modifiedAt?.toISOString() ?? null,
                rawModifiedAt: entry.rawModifiedAt ?? null,
              },
              null,
              2
            ),
          },
        ],
      };
    }
    case "ftp_pwd": {
      const cwd = await withClient((client) => client.pwd());
      return { content: [{ type: "text", text: cwd }] };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  try {
    debugLog("Starting FTP MCP Server...");
    debugLog(`Configuration: host=${ftpHost} port=${FTP_PORT} secure=${FTP_SECURE}`);
    debugLog(`Using gcloud-ftp: ${USE_GCLOUD_FTP}`);
    
    await ensureGcloudFtpRunning();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`FTP MCP server running (host=${ftpHost} port=${FTP_PORT})`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to start FTP MCP server: ${errorMsg}`);
    throw error;
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  stopGcloudFtpIfSpawned();
  process.exit(1);
});

process.on("exit", () => {
  stopGcloudFtpIfSpawned();
});

process.on("SIGINT", () => {
  stopGcloudFtpIfSpawned();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopGcloudFtpIfSpawned();
  process.exit(0);
});
