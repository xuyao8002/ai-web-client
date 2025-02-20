const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {    
    webSocketServer: false,
    proxy: {
      '/api': {
        target: 'http://192.168.14.137:5000', // 后端服务地址
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/', // 去掉路径中的/api
        },
      },
    },	  
  }
})
