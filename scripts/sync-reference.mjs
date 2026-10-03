import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const sourceUrl = "https://warperformancedemo.netlify.app/";
const outputPath = resolve("public/war.html");
const faviconPath = resolve("public/favicon.png");

const localOnly = process.argv.includes("--local");
let html;

if (localOnly) {
  html = await readFile(outputPath, "utf8");
} else {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Unable to mirror ${sourceUrl}: ${response.status}`);
  }
  html = await response.text();
}

if (!html.includes('<meta name="robots" content="index,follow">')) {
  html = html.replace(
    "<head>",
    '<head>\n  <meta name="robots" content="index,follow">',
  );
}

// The former TBT East booking URLs now return 404s. Keep the mirrored design,
// but route each call to action to a current, purpose-specific destination.
html = html.replaceAll(
  'href="https://www.tbteast.com/" target="_blank" rel="noreferrer" aria-label=',
  'href="https://tbttraining.com/athletic-performance-training" target="_blank" rel="noreferrer" aria-label=',
);
html = html.replace(
  '<a class="button button--bronze" href="https://www.tbteast.com/" target="_blank" rel="noreferrer">Book a lesson',
  '<a class="button button--bronze" href="https://tbttraining.com/baseball" target="_blank" rel="noreferrer">Book a lesson',
);
html = html.replaceAll(
  'href="https://www.tbteast.com/packages" target="_blank" rel="noreferrer"',
  'href="mailto:performance@tbttraining.com?subject=WAR%20Performance%20membership%20inquiry"',
);
html = html.replaceAll(
  'href="https://www.tbteast.com/" target="_blank" rel="noreferrer"',
  'href="#visit"',
);
html = html.replaceAll(
  "mailto:tbteast@elettoteam.com",
  "mailto:performance@tbttraining.com",
);
html = html.replaceAll(
  "tbteast@elettoteam.com",
  "performance@tbttraining.com",
);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, html, "utf8");

const favicon = html.match(
  /<link rel="icon" href="data:image\/png;base64,([^"]+)"/,
);
if (favicon) {
  await writeFile(faviconPath, Buffer.from(favicon[1], "base64"));
}

console.log(
  localOnly
    ? `Updated destinations in ${outputPath}`
    : `Mirrored ${sourceUrl} to ${outputPath}`,
);
