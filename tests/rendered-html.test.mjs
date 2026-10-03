import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the WAR Performance site shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /WAR Performance \| Elite Athletic Training in Boca Raton/);
  assert.match(html, /Elite strength, speed, recovery and baseball development/);
  assert.match(
    html,
    /<iframe[^>]+src="\/war\.html"[^>]+title="WAR Performance"/i,
  );
  assert.match(
    html,
    /https:\/\/war-performance\.lukeb721\.chatgpt\.site\/og\.png/,
  );
  assert.doesNotMatch(html, /codex-preview|Building your site/);
});

test("preserves the complete mirrored page and removes starter previews", async () => {
  const mirroredPage = await readFile(
    new URL("../public/war.html", import.meta.url),
    "utf8",
  );

  for (const section of ["programs", "baseball", "memberships", "coaches"]) {
    assert.match(mirroredPage, new RegExp(`id=["']${section}["']`, "i"));
  }
  assert.match(mirroredPage, /Return to Play/i);
  assert.match(mirroredPage, /tel:\+15615767800/);
  assert.match(mirroredPage, /mailto:performance@tbttraining\.com/);
  assert.match(
    mirroredPage,
    /https:\/\/tbttraining\.com\/athletic-performance-training/,
  );
  assert.match(mirroredPage, /https:\/\/tbttraining\.com\/baseball/);
  assert.match(
    mirroredPage,
    /mailto:performance@tbttraining\.com\?subject=WAR%20Performance%20membership%20inquiry/,
  );
  assert.doesNotMatch(mirroredPage, /https:\/\/www\.tbteast\.com/);

  const sectionIds = new Set(
    [...mirroredPage.matchAll(/\bid=["']([^"']+)["']/gi)].map(
      ([, id]) => id,
    ),
  );
  const destinations = [
    ...mirroredPage.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi),
  ].map(([, href]) => href);
  assert.ok(destinations.length >= 39);
  for (const destination of destinations) {
    assert.ok(destination.length > 0, "links must have a destination");
    if (destination.startsWith("#")) {
      assert.ok(
        sectionIds.has(destination.slice(1)),
        `missing section for ${destination}`,
      );
    } else {
      assert.match(destination, /^(?:https?:\/\/|mailto:|tel:)/i);
    }
  }

  await assert.rejects(
    access(new URL("../app/_sites-preview", import.meta.url)),
  );
  await assert.rejects(access(new URL("public/_sites-preview", templateRoot)));
});
