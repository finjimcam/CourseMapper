import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

dotenv.config() // load env vars from .env

// https://vite.dev/config/
export default defineConfig(() => {
  const processEnvValues = {
    "process.env": Object.entries(process.env).reduce((prev, [key, val]) => {
      console.log(key, val);
      return {
        ...prev,
        [key]: val,
      };
    }, {}),
  };

  return {
    plugins: [react()],
    define: processEnvValues,
  };
});