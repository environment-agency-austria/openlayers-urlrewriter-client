import * as fs from 'fs';
import { VitePWA } from 'vite-plugin-pwa'

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
  },
  plugins : [
    VitePWA(
      { 
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: false
      })
  ]

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
