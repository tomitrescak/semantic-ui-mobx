const {
  FuseBox,
  JSONPlugin,
  CSSPlugin,
  CSSResourcePlugin,
  EnvPlugin,
  WebIndexPlugin,
  UglifyJSPlugin,
  QuantumPlugin
} = require('fuse-box');
const StubPlugin = require('proxyrequire').FuseBoxStubPlugin(/\.tsx?/);

const luisFuse = FuseBox.init({
  homeDir: 'src',
  emitHMRDependencies: true,
  output: 'public/$name.js',
  plugins: [
    EnvPlugin({ NODE_ENV: 'test', Luis: 'true' }),
    JSONPlugin(),
    [
      CSSResourcePlugin(),
      CSSPlugin({
        group: 'luis.css',
        outFile: `public/luis.css`,
        inject: false
      })
    ],
    WebIndexPlugin({ template: 'src/luis/index.html', target: 'index.html' })
  ],
  shim: {
    crypto: {
      exports: '{ randomBytes: () => crypto.getRandomValues(new global.Uint16Array(1))[0] }'
    },
    stream: {
      exports: '{ Writable: function() {}, Readable: function() {}, Transform: function() {} }'
    }
  }
});

const historyAPIFallback = require('connect-history-api-fallback');
luisFuse.dev({ port: 3000 }, server => {
  const app = server.httpServer.app;
  app.use(historyAPIFallback());
});

luisFuse
  .bundle('luis-vendor')
  .hmr()
  .target('browser')
  .instructions(' ~ luis/luis.tsx'); // nothing has changed here

luisFuse
  .bundle('luis-client')
  .watch() // watch only client related code
  .hmr()
  .target('browser@es6')
  .sourceMaps(true)
  .plugin([StubPlugin])
  .globals({
    proxyrequire: '*'
  })
  .instructions(' !> [luis/luis.tsx] +proxyrequire'); // + **/**.json


luisFuse.run();
