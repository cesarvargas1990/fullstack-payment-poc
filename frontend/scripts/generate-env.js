const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');
const envPath = path.join(frontendRoot, '.env');
const envExamplePath = path.join(frontendRoot, '.env.example');
const outputPath = path.join(frontendRoot, 'src', 'shared', 'config', 'env.ts');

const values = readEnvFile(envPath);

if (!values.API_BASE_URL) {
  Object.assign(values, readEnvFile(envExamplePath));
}

if (!values.API_BASE_URL) {
  throw new Error('API_BASE_URL is required. Create frontend/.env from frontend/.env.example.');
}

fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(
  outputPath,
  [
    '// Local environment config. Do not edit manually.',
    '// Source: frontend/.env',
    `export const API_BASE_URL = ${JSON.stringify(values.API_BASE_URL)};`,
    '',
  ].join('\n'),
);

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return env;
      }

      const separatorIndex = trimmedLine.indexOf('=');

      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

      return {
        ...env,
        [key]: value,
      };
    }, {});
}
