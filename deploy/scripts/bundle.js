const esbuild = require('esbuild');
const esBuildPluginTsc = require('esbuild-plugin-tsc');

const lambdaName = process.argv[2];

if (!lambdaName) {
  console.error('Usage: node deploy/scripts/bundle.js <lambda-name>');
  console.error('  Example: node deploy/scripts/bundle.js delete-user');
  process.exit(1);
}

esbuild
  .build({
    entryPoints: [`app/lambda/src/${lambdaName}/index.ts`],
    bundle: true,
    outfile: `build/${lambdaName}/app.js`,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    sourcemap: true,
    minify: true,
    plugins: [
      esBuildPluginTsc({
        force: true,
      }),
    ],
    external: ['@prisma/client', 'prisma', '@valkey/valkey-glide'],
  })
  .then(() => {
    console.log(`Esbuild succeeded for ${lambdaName} ${new Date().toISOString()}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
