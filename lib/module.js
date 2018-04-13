const { resolve } = require('path')

module.exports = function module (moduleOptions) {
  const options = this.options['analytics'] || {}
  const config = options['options'] || moduleOptions['options'] || {}
  this.addPlugin({
    src: resolve(__dirname, './templates/plugin.js'),
    fileName: 'nuxt-lytics.js',
    options: config,
    ssr: false
  })
}
