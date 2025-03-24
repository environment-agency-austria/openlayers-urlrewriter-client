const getHttps = require('localhost-https');
export default {
  build: {
    sourcemap: true,
	  outDir: 'docs',
    target: 'esnext'
  },
  server : {
      https: getHttps(),
  },
  base: ''
}
