import * as fs from 'fs';

export default {
  build: {
    sourcemap: true,
	outDir: 'docs'
  },
  base: '',
  server: {
    https: {
      pfx: fs.readFileSync('./cert/localhost.p12'),
      passphrase: ''
    }
  }

  /*server: {
    https: true
  },
  plugins: [
    basicSsl({
      name: 'test',
      domains: ['*.custom.com'],
    })]
      */
}
