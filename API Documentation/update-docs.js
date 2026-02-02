import fs from "fs";
import path from "path";

const OPENAPI_URL = "http://localhost:5000/api-json";
const OUTPUT_DIR = process.cwd(); // assumes script is run inside "API Documentation"

async function fetchOpenApi() {
  const res = await fetch(OPENAPI_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${res.status}`);
  }
  return res.json();
}

function cleanOutputDir() {
  const files = fs.readdirSync(OUTPUT_DIR);

  for (const file of files) {
    if (file.endsWith(".json")) {
      fs.unlinkSync(path.join(OUTPUT_DIR, file));
    }
  }

  console.log("🧹 Cleared existing JSON files");
}

function splitByTags(openapi) {
  const tagBuckets = {};

  for (const [route, methods] of Object.entries(openapi.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const tags = operation.tags || ["untagged"];

      for (const tag of tags) {
        if (!tagBuckets[tag]) {
          tagBuckets[tag] = {};
        }

        if (!tagBuckets[tag][route]) {
          tagBuckets[tag][route] = {};
        }

        tagBuckets[tag][route][method] = operation;
      }
    }
  }

  return tagBuckets;
}

function writeTagFiles(openapi, tagBuckets) {
  for (const [tag, paths] of Object.entries(tagBuckets)) {
    const doc = {
      openapi: openapi.openapi,
      info: openapi.info,
      tags: [{ name: tag }],
      paths,
    };

    const filename = `${tag.toLowerCase().replace(/\s+/g, "-")}.json`;
    fs.writeFileSync(
      path.join(OUTPUT_DIR, filename),
      JSON.stringify(doc, null, 2)
    );

    console.log(`✅ Generated ${filename}`);
  }
}

async function run() {
  console.log("📥 Fetching OpenAPI spec...");
  const openapi = await fetchOpenApi();

  cleanOutputDir();

  const tagBuckets = splitByTags(openapi);
  writeTagFiles(openapi, tagBuckets);

  console.log("🎉 API documentation successfully generated");
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
