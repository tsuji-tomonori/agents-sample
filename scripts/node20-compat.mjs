import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

if (typeof process.getBuiltinModule === 'function') {
  const originalGetBuiltinModule = process.getBuiltinModule.bind(process);
  process.getBuiltinModule = (id) => {
    const module = originalGetBuiltinModule(id);
    if (id === 'module' && !module.createRequire && module.default?.createRequire) {
      return module.default;
    }
    return module;
  };
} else {
  process.getBuiltinModule = (id) => require(`node:${id}`);
}
