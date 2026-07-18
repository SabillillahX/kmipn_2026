const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf8');

// Fix overlapping headings by resetting line-height
css = css.replace(/line-height: \.[0-9]+;/g, 'line-height: 1.1;');
// Fix specific tight margins if any
css = css.replace(/margin: (\d+)px 0 0;/g, 'margin: $1px 0 16px;'); 

fs.writeFileSync('app/globals.css', css, 'utf8');
console.log('CSS updated to fix line-height overlaps');
