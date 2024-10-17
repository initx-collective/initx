import createConfig from '@imba97/eslint-config'

export default createConfig({
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off'
  }
})
