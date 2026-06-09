const { execSync } = require('child_process');

const LAMBDAS = ['delete-user', 'jwt-authorizer'];

for (const name of LAMBDAS) {
  execSync(`node deploy/scripts/bundle.js ${name}`, { stdio: 'inherit' });
}

console.log(`Esbuild succeeded for ${LAMBDAS.length} lambdas`);
