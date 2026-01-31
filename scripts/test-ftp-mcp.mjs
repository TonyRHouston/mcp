import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const repoRoot = process.cwd();
const transport = new StdioClientTransport({
  command: "node",
  args: ["src/ftp/dist/index.js"],
  cwd: repoRoot,
  env: {
    GCLOUD_FTP_ROOT: "/home/web3tony/mcp/gcloud-ftp",
    FTP_HOST: "127.0.0.1",
    FTP_PORT: "1821",
    FTP_USER: "user",
    FTP_PASS: "user",
    FTP_TIMEOUT: "180000",
  },
  stderr: "pipe",
});

if (transport.stderr) {
  transport.stderr.on("data", (chunk) => {
    process.stderr.write(String(chunk));
  });
}

const client = new Client({ name: "ftp-mcp-test", version: "0.1.0" }, { capabilities: {} });
const requestOptions = { timeout: 300000, maxTotalTimeout: 300000 };

function parseText(result) {
  const textItem = result.content?.find((item) => item.type === "text");
  if (!textItem) return null;
  try {
    return JSON.parse(textItem.text);
  } catch {
    return textItem.text;
  }
}

const folder = `/mcp-ftp-test-${Date.now()}`;
const filePath = `${folder}/hello.txt`;
const payload = "hello from mcp test";

try {
  await client.connect(transport);
  const tools = await client.listTools({}, requestOptions);
  console.log("Tools:", tools.tools.map((t) => t.name).join(", "));

  console.log("pwd");
  const pwdResult = await client.callTool({ name: "ftp_pwd", arguments: {} }, undefined, requestOptions);
  console.log(parseText(pwdResult));

  console.log("mkdir", folder);
  await client.callTool(
    { name: "ftp_mkdir", arguments: { path: folder, recursive: true } },
    undefined,
    requestOptions
  );

  console.log("upload", filePath);
  await client.callTool(
    {
      name: "ftp_upload",
      arguments: { remotePath: filePath, content: payload, encoding: "utf8" },
    },
    undefined,
    requestOptions
  );

  console.log("list", folder);
  const listResult = await client.callTool(
    { name: "ftp_list", arguments: { path: folder } },
    undefined,
    requestOptions
  );
  console.log(parseText(listResult));

  console.log("download", filePath);
  const downloadResult = await client.callTool(
    {
      name: "ftp_download",
      arguments: { remotePath: filePath, encoding: "utf8" },
    },
    undefined,
    requestOptions
  );
  console.log(parseText(downloadResult));

  console.log("delete", filePath);
  await client.callTool(
    { name: "ftp_delete", arguments: { remotePath: filePath } },
    undefined,
    requestOptions
  );

  console.log("rmdir", folder);
  await client.callTool(
    { name: "ftp_rmdir", arguments: { path: folder, recursive: true } },
    undefined,
    requestOptions
  );

  console.log("OK: FTP MCP upload/download/delete passed");
} catch (error) {
  console.error("Test failed:", error);
  process.exitCode = 1;
} finally {
  await transport.close();
}
