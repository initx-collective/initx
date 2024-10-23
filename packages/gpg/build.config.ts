import { mergeDefaultBuildConfig } from '../../scripts/build.common'

export default mergeDefaultBuildConfig({
  entries: [
    'src/index'
  ],
  externals: [
    'inquirer'
  ]
})
