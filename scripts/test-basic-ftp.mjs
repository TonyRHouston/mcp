import { Client } from "basic-ftp";

const client = new Client(180000);
client.ftp.verbose = false;

try {
  await client.access({
    host: "127.0.0.1",
    port: 1821,
    user: "user",
    password: "user",
    secure: false,
  });
  console.log("connected");
  const pwd = await client.pwd();
  console.log("pwd", pwd);
  const list = await client.list("/");
  console.log("list", list.map((i) => i.name));
} catch (err) {
  console.error("error", err);
} finally {
  client.close();
}
