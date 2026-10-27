const sharp = require("sharp");

const SRC = "assets/images/icon.png";
const DIR = "assets/images/";
const SIZE = 1024;

async function square(width) {
    // trim the empty margin around the wordmark, then resize
    const word = await sharp(SRC, { limitInputPixels: false })
        .trim()
        .resize({ width })
        .png()
        .toBuffer();
    const { height } = await sharp(word).metadata();

    const left = Math.floor((SIZE - width) / 2);
    const top = Math.floor((SIZE - height) / 2);

    // center it on an opaque white 1024x1024 canvas
    return sharp(word)
        .extend({
            top,
            bottom: SIZE - height - top,
            left,
            right: SIZE - width - left,
            background: "#ffffff",
        })
        .flatten({ background: "#ffffff" })
        .png()
        .toBuffer();
}

(async () => {
    // iOS / main icon (opaque)
    await sharp(await square(780)).toFile(DIR + "app-icon.png");

    // Android foreground: smaller, to stay inside the adaptive-icon safe zone
    const fg = await square(520);
    await sharp(fg).toFile(DIR + "android-icon-foreground.png");

    // Android monochrome: black wordmark on transparent background
    const alpha = await sharp(fg).greyscale().negate().raw().toBuffer();
    await sharp({
        create: { width: SIZE, height: SIZE, channels: 3, background: "#000000" },
    })
        .joinChannel(alpha, { raw: { width: SIZE, height: SIZE, channels: 1 } })
        .png()
        .toFile(DIR + "android-icon-monochrome.png");

    console.log("Icons generated");
})();