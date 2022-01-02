import { assertEquals, assertStringIncludes } from '../deps.ts';

import { EsBuildPluginImport } from './plugin.ts';

const cachePath = JSON
  .parse(
    new TextDecoder()
      .decode(
        await Deno.run({
          cmd: [
            'deno',
            'info',
            '--json'
          ],
          stdout: 'piped'
        }).output()
      )
  )
  .modulesCache;

const importMap = {
  imports: {
    "router/": "https://deno.land/x/azizka_deno_router@1.2.0/",
    "i18n/": "https://deno.land/x/azizka_deno_i18n@1.1.0/"
  }
};

const plugin = new EsBuildPluginImport(
  'esbuild-plugin-import',
  cachePath,
  new URL(import.meta.url),
  importMap
);

interface ResolveHandlerOption {
  path: string;
  importer?: string;
}

interface ResolveHandlerOutput {
  path: string;
  namespace?: string;
}

interface LoadHandlerOutput {
  loader: string;
  contents: string;
}

interface ResolveOption {
  filter: RegExp;
  namespace?: string;
}

interface Resolver extends ResolveOption {
  handler: (option: ResolveHandlerOption) => ResolveHandlerOutput;
}

interface Loader extends ResolveOption {
  handler: (option: ResolveHandlerOption) => Promise<LoadHandlerOutput>;
}

const resolvers: Resolver[] = [];
const loaders: Loader[] = [];

function onResolve(
  option: ResolveOption, 
  handler: (option: ResolveHandlerOption) => ResolveHandlerOutput
) {
  resolvers.push({
    ...option,
    handler
  });
}

function onLoad(
  option: ResolveOption,
  handler: (option: ResolveHandlerOption) => Promise<LoadHandlerOutput>
) {
  loaders.push({
    ...option,
    handler
  });
}

plugin.setup({
  onResolve,
  onLoad
} as any);

Deno.test('should correct resolve path "router/src/route-navigator.ts"', () => {
  const path = 'router/src/route-navigator.ts';
  
  const result = resolvers[0].handler({ path });

  const expectedPath = 'https://deno.land/x/azizka_deno_router@1.2.0/src/route-navigator.ts';
  const expectedNamespace = plugin.name;

  assertEquals(
    result.path, 
    expectedPath, 
    `The path "${path}" should transform to "${expectedPath}" but the result is "${result.path}"`
  );

  assertEquals(
    result.namespace,
    expectedNamespace,
    `The namespace should be "${expectedNamespace}" but the result is "${result.namespace}"`
  );
});

Deno.test('should correct resolve path "i18n/src/translator.ts"', () => {
  const path = 'i18n/src/translator.ts';
  
  const result = resolvers[0].handler({ path });

  const expectedPath = 'https://deno.land/x/azizka_deno_i18n@1.1.0/src/translator.ts';
  const expectedNamespace = plugin.name;

  assertEquals(
    result.path, 
    expectedPath, 
    `The path "${path}" should transform to "${expectedPath}" but the result is "${result.path}"`
  );

  assertEquals(
    result.namespace,
    expectedNamespace,
    `The namespace should be "${expectedNamespace}" but the result is "${result.namespace}"`
  );
});

Deno.test('should correct resolve "https://deno.land/x/importmap@0.2.1/mod.ts"', () => {
  const path = 'https://deno.land/x/importmap@0.2.1/mod.ts';
  
  const result = resolvers[0].handler({ path });

  const expectedPath = 'https://deno.land/x/importmap@0.2.1/mod.ts';
  const expectedNamespace = plugin.name;

  assertEquals(
    result.path, 
    expectedPath, 
    `The path "${path}" should transform to "${expectedPath}" but the result is "${result.path}"`
  );

  assertEquals(
    result.namespace,
    expectedNamespace,
    `The namespace should be "${expectedNamespace}" but the result is "${result.namespace}"`
  );
});

Deno.test('should correct resolve "./utils.ts" from path "https://deno.land/x/azizka_deno_router@1.2.0/src/route-navigator.ts"', () => {
  const path = './utils.ts';
  const importer = 'https://deno.land/x/azizka_deno_router@1.2.0/src/route-navigator.ts';
  
  const result = resolvers[1].handler({ path, importer });

  const expectedPath = 'https://deno.land/x/azizka_deno_router@1.2.0/src/utils.ts';
  const expectedNamespace = plugin.name;

  assertEquals(
    result.path, 
    expectedPath, 
    `The path "${path}" should transform to "${expectedPath}" but the result is "${result.path}"`
  );

  assertEquals(
    result.namespace,
    expectedNamespace,
    `The namespace should be "${expectedNamespace}" but the result is "${result.namespace}"`
  );
});

Deno.test('should correct import from path "https://deno.land/x/azizka_deno_router@1.2.0/src/route-navigator.ts"', async () => {
  const path = 'https://deno.land/x/azizka_deno_router@1.2.0/src/route-navigator.ts';

  const result = await loaders[0].handler({ path });

  const expectedLoader = 'ts';
  const expectedContent = "RouteNavigator";

  assertEquals(
    result.loader,
    expectedLoader,
    `The loader should be "${expectedLoader}" but the result is "${result.loader}"`
  );

  assertStringIncludes(
    result.contents,
    expectedContent,
    `The contents should contain "${expectedContent}"`
  );
});
