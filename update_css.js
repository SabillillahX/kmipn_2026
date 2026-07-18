const fs = require('fs');

let css = fs.readFileSync('app/globals.css', 'utf8');

// 1. Change root variables for clean white/red theme
css = css.replace(/:root \{[\s\S]*?\}/, `:root {
  --ink: #111827;
  --ink-2: #1f2937;
  --ink-3: #374151;
  --paper: #ffffff;
  --paper-2: #f9fafb;
  --white: #ffffff;
  --blue: #E32636;
  --sky: #fecaca;
  --mint: #ef4444;
  --lime: #E32636;
  --coral: #dc2626;
  --gold: #f59e0b;
  --line-dark: rgba(0,0,0,.1);
  --line-light: rgba(0,0,0,.08);
}`);

// 2. Remove script and civic fonts
css = css.replace(/var\(--font-civic\), serif/g, 'var(--font-display), sans-serif');
css = css.replace(/var\(--font-script\), cursive/g, 'var(--font-display), sans-serif');
css = css.replace(/font-family: var\(--font-civic\), serif;/g, 'font-family: var(--font-display), sans-serif;');
css = css.replace(/font-family: var\(--font-script\), cursive;/g, 'font-family: var(--font-display), sans-serif;');

// 3. Update all font sizes
css = css.replace(/font-size: (\d+)px/g, (match, sizeStr) => {
  let size = parseInt(sizeStr, 10);
  if (size < 10) size = 14;
  else if (size < 13) size = 16;
  else if (size < 16) size = 18;
  return `font-size: ${size}px`;
});

// 4. Fix contrast for elements using lime (now red) with ink (now dark gray)
css = css.replace(/background: var\(--lime\); color: var\(--ink\);/g, 'background: var(--lime); color: var(--paper);');
css = css.replace(/background: var\(--lime\);(\s*)color: var\(--ink\);/g, 'background: var(--lime);$1color: var(--paper);');
css = css.replace(/color: var\(--lime\);/g, 'color: var(--blue);'); // use blue instead of lime for text highlights to be red

fs.writeFileSync('app/globals.css', css, 'utf8');
console.log('CSS updated successfully');
