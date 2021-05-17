import pkg from './package.json';

export default {
  input: 'lib/index.js',
  external: ['xstate'],
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    }
  ]
}