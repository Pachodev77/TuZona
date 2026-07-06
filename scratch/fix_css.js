const fs = require('fs');
const file = 'g:/tuzona/TuZona/css/styles.css';
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/background:\s*(white|#ffffff|#fff)(?=[;!}])/gi, 'background: var(--white)');
css = css.replace(/background-color:\s*(white|#ffffff|#fff)(?=[;!}])/gi, 'background-color: var(--white)');
css = css.replace(/background:\s*(#f8f9fa|#f9f9f9|#f4f6f8|#f1f1f1)(?=[;!}])/gi, 'background: var(--bg-light)');
css = css.replace(/background-color:\s*(#f8f9fa|#f9f9f9|#f4f6f8|#f1f1f1)(?=[;!}])/gi, 'background-color: var(--bg-light)');
css = css.replace(/color:\s*(#333|#333333|#000|black)(?=[;!}])/gi, 'color: var(--text-color)');
css = css.replace(/color:\s*(#666|#666666|#777)(?=[;!}])/gi, 'color: var(--text-light)');
css = css.replace(/border(-[a-z]+)?:\s*([^;]+)(#e0e0e0|#ddd|#eee|#ccc|#dddddd|#eeeeee)(?=[;!}])/gi, 'border$1: $2var(--border-color)');

fs.writeFileSync(file, css);
console.log('CSS updated successfully');
