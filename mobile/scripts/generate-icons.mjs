#!/usr/bin/env node
// Genererar de fyra ikon-filerna Vaccinloggen behöver från två käll-PNGs:
//
//   sources/icon-source.png            — kvadratisk med solid teal bakgrund
//   sources/icon-transparent.png       — samma motiv på transparent bakgrund
//
// Outputs (skrivs över i assets/images/):
//
//   icon.png                           1024×1024, solid teal-bakgrund (iOS-master)
//   splash-icon.png                    1024×1024, transparent
//   android-icon-foreground.png        1024×1024, transparent
//   android-icon-background.png        1024×1024, solid #0E7C7B
//   android-icon-monochrome.png        1024×1024, ren vit silhuett (för Material You)

import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCES = path.join(ROOT, "assets/images/sources");
const OUT = path.join(ROOT, "assets/images");

const TEAL = "#0E7C7B";
const SIZE = 1024;

async function run() {
  // 1. Master icon — normalize the teal-bg source to 1024×1024 with no alpha
  await sharp(path.join(SOURCES, "icon-source.png"))
    .resize(SIZE, SIZE, { fit: "cover" })
    .flatten({ background: TEAL })
    .png()
    .toFile(path.join(OUT, "icon.png"));

  // 2. Splash + Android foreground — normalize transparent source to 1024,
  //    keep alpha
  const transparentBuf = await sharp(path.join(SOURCES, "icon-transparent.png"))
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp(transparentBuf).toFile(path.join(OUT, "splash-icon.png"));
  await sharp(transparentBuf).toFile(path.join(OUT, "android-icon-foreground.png"));

  // 3. Android background — solid teal square, no transparency
  await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: TEAL },
  })
    .png()
    .toFile(path.join(OUT, "android-icon-background.png"));

  // 4. Android monochrome — threshold alpha → pure white silhouette
  //    Used by Material You "themed icons"; Android tints it.
  const mono = await sharp(transparentBuf)
    .ensureAlpha()
    .extractChannel("alpha")
    .threshold(64) // anything >25% opaque becomes opaque white
    .toBuffer();
  await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: await sharp({
          create: { width: SIZE, height: SIZE, channels: 4, background: "#FFFFFF" },
        })
          .png()
          .toBuffer(),
        blend: "dest-in",
        // dest-in keeps the white only where the mask is opaque
      },
      { input: mono, blend: "dest-in" },
    ])
    .png()
    .toFile(path.join(OUT, "android-icon-monochrome.png"));

  console.log("Icons regenerated in", OUT);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
