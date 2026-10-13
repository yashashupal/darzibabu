# Image assets

`products/*.jpg` are 13 curated product visuals taken from the image set supplied with the project
(resized to max 900 px). `brand/logo.png` and `brand/mark.png` are derived from the supplied Darzibabu logo
(transparent background versions).

Records never store hashed build URLs. They store keys such as `asset:tee-black-polo` that are resolved in
`src/assets/index.js`, plus uploaded images as data URLs. To add bundled images: drop a file in `products/`,
import it in `index.js`, and add it to `assetMap`. Or simply upload through **Admin → Media library**.

Excluded on purpose: third-party logos, press logos, vector UI icons, blog banners that carry another brand's
logo and URL, and photographs of real people. Several remaining visuals are marketing graphics with baked-in
headline text and "your logo here" placeholders. Replace them with Darzibabu's own product photography
before any public launch.
