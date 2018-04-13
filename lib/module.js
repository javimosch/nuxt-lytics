const { resolve } = require('path')

module.exports = function module (moduleOptions) {
  const options = this.options['analytics'] || {}
  
  
  this.addPlugin({
    src: resolve(__dirname, './templates/plugin.js'),
    fileName: 'nuxt-lytics.js',
    options: options,
    ssr: false
  })
  
}
