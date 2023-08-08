import fs from 'node:fs';
import jsdoc2md from 'jsdoc-to-markdown';
import showdown from 'showdown';

const converter = new showdown.Converter({ tables: true });

const md = await jsdoc2md.render({ files: '../src/Scheduler.js' });
const html = converter.makeHtml(md);

console.log(html);

fs.writeFileSync('./index.html', html);
