// Post-build script: patch web-mobile index.html and copy splash image
// Run after Cocos Creator build: `node tools/post-build.js`

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(PROJECT_ROOT, 'build', 'web-mobile');
const INDEX_HTML = path.join(BUILD_DIR, 'index.html');
const SPLASH_SRC = path.join(PROJECT_ROOT, 'images', 'splash.png');
const SPLASH_DST = path.join(BUILD_DIR, 'assets', 'splash.png');

const TITLE = '乒乓控场挑战';
const SPLASH_HTML = `      <div id="CustomSplash" style="position: absolute; width: 100%; height: 100%; background-color: #FFF; display: flex; align-items: center; justify-content: center;">
        <img src="assets/splash.png" style="width: 100%; height: 100%;object-fit: cover;" />
        <div style="color: #FFF;font-size: 1em;position: absolute;left: 50%;top: 50%;transform: translate(-50%, -50%)">场景构建中...</div>
      </div>
`;

function fail(msg) {
  console.error('[post-build] ' + msg);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(INDEX_HTML)) {
    fail('index.html not found: ' + INDEX_HTML + ' — did you run a Cocos build first?');
  }

  let html = fs.readFileSync(INDEX_HTML, 'utf8');

  // 1. Update <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${TITLE}</title>`);

  // 2. Insert CustomSplash before Cocos3dGameContainer (avoid duplicates)
  if (html.includes('id="CustomSplash"')) {
    // Replace existing CustomSplash block to keep it fresh
    html = html.replace(
      /[\s]*<div id="CustomSplash"[\s\S]*?<\/div>[\s]*<\/div>\n/,
      '\n' + SPLASH_HTML
    );
  } else {
    html = html.replace(
      /(\s*)(<div id="Cocos3dGameContainer">)/,
      '\n' + SPLASH_HTML + '$1$2'
    );
  }

  fs.writeFileSync(INDEX_HTML, html, 'utf8');
  console.log('[post-build] index.html patched (title + CustomSplash)');

  // 3. Copy splash.png into build/web-mobile/assets
  if (!fs.existsSync(SPLASH_SRC)) {
    fail('splash.png not found: ' + SPLASH_SRC);
  }
  const assetsDir = path.dirname(SPLASH_DST);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  fs.copyFileSync(SPLASH_SRC, SPLASH_DST);
  console.log('[post-build] splash.png copied to ' + path.relative(PROJECT_ROOT, SPLASH_DST));

  console.log('[post-build] done.');
}

main();
