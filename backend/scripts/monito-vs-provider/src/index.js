#!/usr/bin/env node

require('tsx/cjs/api').register({
  esbuildOptions: {
    tsconfigRaw: {
      compilerOptions: {
        moduleResolution: 'bundler',
      },
    },
  },
})

require('./index.ts')
