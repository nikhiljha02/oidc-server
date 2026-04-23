import { readFileSync } from "fs";

import path from "path";

export const privateKey = readFileSync(path.resolve("cert/private-key.pem"));
export const publicKey = readFileSync(path.resolve("cert/public-key.pub"));
