"use strict";

const crypto = require("crypto");

process.stderr.write("Enter dashboard password: ");
process.stdin.setRawMode(true);
process.stdin.resume();

let password = "";
process.stdin.on("data", (chunk) => {
  for (const character of chunk.toString()) {
    if (character === "\u0003") process.exit(1);
    if (character === "\r" || character === "\n") {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = crypto.scryptSync(password, salt, 64).toString("hex");
      process.stdout.write(`scrypt$${salt}$${hash}\n`);
      return;
    }
    if (character === "\u007f") password = password.slice(0, -1);
    else password += character;
  }
});
