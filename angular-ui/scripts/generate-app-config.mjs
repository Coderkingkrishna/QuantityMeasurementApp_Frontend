import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const configPath = resolve(process.cwd(), 'public/data/app-config.json');

const config = {
  apiBaseUrl: process.env.API_BASE_URL?.trim() || '',
  endpoints: {
    signup: '/api/auth/signup',
    login: '/api/auth/login',
    google: '/api/auth/google',
    logout: '/api/auth/logout',
    convert: '/api/quantitymeasurement/convert',
    compare: '/api/quantitymeasurement/compare',
    add: '/api/quantitymeasurement/add',
    subtract: '/api/quantitymeasurement/subtract',
    divide: '/api/quantitymeasurement/divide',
    history: '/api/quantitymeasurement/history'
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || ''
};

mkdirSync(dirname(configPath), { recursive: true });
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

console.log(`Generated ${configPath}`);
