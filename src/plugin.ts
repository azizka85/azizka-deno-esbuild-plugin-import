import { 
  Plugin, PluginBuild, Loader,
  resolveImportMap, resolveModuleSpecifier, ImportMap 
} from '../deps.ts';

import { path as resolvePath } from './utils.ts';

export class EsBuildPluginImport implements Plugin {
  protected rule: RegExp;

  constructor(
    public name: string,
    protected cachePath: string, 
    protected baseUrl: URL,
    protected importMap: ImportMap
  ) {
    importMap = resolveImportMap(
      importMap,
      baseUrl
    );
  
    const imports = ['https?://'];
  
    if(importMap.imports) {
      const aliases = Object.keys(importMap.imports);
  
      imports.push(...aliases);
    }
  
    this.rule = new RegExp(`^(${imports.join('|')})`);
  }

  setup({ onResolve, onLoad }: PluginBuild) {
    onResolve(
      { filter: this.rule }, 
      ({ path }) => {
        const resolvedPath = resolveModuleSpecifier(
          path,
          this.importMap,
          this.baseUrl
        );;                             

        return {
          path: resolvedPath,
          namespace: this.name                
        };
      }
    );

    onResolve(
      {filter: /.*/, namespace: this.name},
      ({ path, importer }) => {       
        return {
          path: new URL(path, importer).href,
          namespace: this.name
        };
      }
    );

    onLoad({
      filter: /.*/, namespace: this.name}, 
      async ({ path }) => {
        await Deno.emit(path);

        const localPath = resolvePath(new URL(path), this.cachePath);        
        
        const contents = await Deno.readTextFile(localPath);
        
        const ext = path.split('.').pop();

        const loader = (ext?.match(/"j|tsx?$/) ? ext : 'js') as Loader;

        return { loader, contents }
    });
  }
}

