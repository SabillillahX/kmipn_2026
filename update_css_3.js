const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf8');

// 1. Change red colors to blue
css = css.replace(/--blue: #[a-f0-9]+;/i, '--blue: #2563eb;');
css = css.replace(/--sky: #[a-f0-9]+;/i, '--sky: #dbeafe;');
css = css.replace(/--mint: #[a-f0-9]+;/i, '--mint: #0ea5e9;');
css = css.replace(/--lime: #[a-f0-9]+;/i, '--lime: #2563eb;');
css = css.replace(/--coral: #[a-f0-9]+;/i, '--coral: #1e40af;');

// 2. Fix header height and sizes
// We appended some things last time, but replacing min-height is better
css = css.replace(/\.header-grid\s*\{[\s\S]*?min-height:\s*\d+px;/g, (match) => {
    return match.replace(/min-height:\s*\d+px;/, 'min-height: 96px;');
});

// Force small nav text
css += `\n
.desktop-nav a { font-size: 14px !important; }
.brand-words strong { font-size: 22px !important; }
.cta-pill { font-size: 13px !important; height: 48px !important; }
.site-header { padding: 8px 0; }
`;

fs.writeFileSync('app/globals.css', css, 'utf8');
console.log('CSS updated for blue theme and header fixes');
