#!/usr/bin/env node
// check-inline.js — 检查 index.html 内联脚本语法
var fs = require('fs');
var path = require('path');
var htmlPath = path.join(__dirname, '..', 'index.html');
var c = fs.readFileSync(htmlPath, 'utf8');
var m = c.match(/<script>([\s\S]*)<\/script>/);
if (!m) {
  console.log('  [SKIP] no inline <script> found');
  process.exit(0);
}
try {
  new Function(m[1]);
  console.log('  [PASS] index.html inline script');
} catch(e) {
  console.log('  [FAIL] index.html inline script: ' + e.message.split('\n')[0]);
  process.exit(1);
}
