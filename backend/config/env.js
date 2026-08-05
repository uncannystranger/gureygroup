import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(__dirname, '../../.env');

dotenv.config({ path: rootEnvPath });
dotenv.config();

export const BACKEND_PORT = Number(process.env.PORT || 5050);
