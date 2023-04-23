import * as fs from 'fs'
import typescript from '@rollup/plugin-typescript'
import license from 'rollup-plugin-license'

const loadJSON = (path) =>
  JSON.parse(fs.readFileSync(new URL(path, import.meta.url)))

const pkg = loadJSON('./package.json')

const licenseBanner = license({
  banner: {
    content: '/*! <%= pkg.name %> v<%= pkg.version %> | <%= pkg.license %> */',
    commentStyle: 'none'
  }
})

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.module,
        format: 'esm'
      }
    ],
    plugins: [typescript(), licenseBanner]
  }
]
