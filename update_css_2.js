const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf8');

// 1. Remove weird italic/script styling from em tags and make them normal and dark
css = css.replace(/h2 em \{[\s\S]*?\}/g, 'h2 em { font-style: normal; color: var(--ink); }');
css = css.replace(/h1 em \{[\s\S]*?\}/g, 'h1 em { font-style: normal; color: var(--ink); }');
// Also catch inline em styles in editorial-heading etc.
css = css.replace(/\.editorial-heading h2 em,\.process-heading h2 em,\.report-message h2 em \{[\s\S]*?\}/g, '.editorial-heading h2 em,.process-heading h2 em,.report-message h2 em { font-style: normal; color: inherit; font-family: inherit; font-size: inherit; transform: none; letter-spacing: inherit; }');
css = css.replace(/\.hero h1 em \{[\s\S]*?\}/g, '.hero h1 em { font-style: normal; color: inherit; font-family: inherit; font-size: inherit; transform: none; letter-spacing: inherit; margin-top: 0; display: inline; }');

// General fix for any em tags with script font
css = css.replace(/font-family: var\(--font-script\), cursive;/g, 'font-family: var(--font-display), sans-serif; font-style: normal;');

// 2. Hide useless small text elements and decorators
const uselessClasses = [
  '.map-index', 
  '.coordinate-stamp', 
  '.form-corner-label', 
  '.stat-index', 
  '.hero-ghost-word', 
  '.section-watermark', 
  '.hero-orbit', 
  '.portal-rings', 
  '.map-noise', 
  '.ambient-cursor', 
  '.map-scan',
  '.chapter-mark', // maybe keep but hide the line
  '.map-compass',
  '.map-ornament-dots',
  '.process-threads'
];
for (const cls of uselessClasses) {
  const regex = new RegExp(`\\${cls}\\s*\\{`, 'g');
  css = css.replace(regex, `${cls} { display: none !important; `);
}

// 3. Increase font sizes further
css = css.replace(/font-size: (\d+)px/g, (match, sizeStr) => {
  let size = parseInt(sizeStr, 10);
  if (size < 14) size += 4;
  else if (size < 18) size += 4;
  else if (size < 24) size += 4;
  return `font-size: ${size}px`;
});

// Also remove transform rotates on any em
css = css.replace(/transform: rotate\(-?\d+deg\);/g, 'transform: none;');

fs.writeFileSync('app/globals.css', css, 'utf8');
console.log('CSS updated successfully for second iteration');
