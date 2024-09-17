import * as fs from 'fs';
import { VitePWA } from 'vite-plugin-pwa'

export default {
  build: {
    sourcemap: true,
	  outDir: 'docs',
    target: 'esnext'
  },
  base: '',
  /*server: {
    https: {
      pfx: fs.readFileSync('./cert/localhost.p12'),
      passphrase: ''
    }
  },*/
  plugins : [
    VitePWA(
      { 
        registerType: 'autoUpdate',
        devOptions: {
        enabled: false
      },
      manifest: false,
      })
  ]
}
