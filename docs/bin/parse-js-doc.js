import fs from 'node:fs';
// import jsdoc2md from 'jsdoc-to-markdown';
import showdown from 'showdown';
import * as documentation from 'documentation';

const build = await documentation.build(['../src/Scheduler.js'], { markdownToc: true });
const md = await documentation.formats.md(build);

console.log(md)
const converter = new showdown.Converter({ tables: true });

// @todo - replace by new lib (see jsdoc-to-readme)
// const md = await jsdoc2md.render({ files: '../src/Scheduler.js' });

let html = converter.makeHtml(md);

html = html
  .replace('<pre><code class="javascript language-javascript">', '<sc-code-example language="javascript">')
  .replace('</code></pre>', '</sc-code-example>')

console.log(html);

const doc = `\
import { html } from 'lit';

export const template = html\`${html}\`
`

fs.writeFileSync('./src/scheduler-api.js', doc);
