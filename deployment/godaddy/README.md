# WAR Performance — GoDaddy Node.js upload

This ZIP is the complete standalone WAR Performance website. The layout, page content, inline fonts, images, animations, mobile navigation and original booking/contact destinations are preserved. A standard Node server replaces the platform-specific outer iframe. No database, API keys or external npm packages are required.

## Upload

1. Open GoDaddy **Node.js Hosting**, choose **Upload ZIP**, and upload `WAR-Performance-GoDaddy-Node.zip`.
2. Keep the commands `npm run build` and `npm start` if prompted. Use Node 20 or newer. GoDaddy supplies `PORT`; the server binds to all interfaces on that port.
3. Open the GoDaddy preview and check the site before selecting **Publish Now** and connecting the desired domain.

Reference: https://www.godaddy.com/help/upload-my-ai-generated-app-to-godaddy-nodejs-hosting-42987

This package is for Node.js Hosting. For ordinary cPanel Web Hosting, use `WAR-Performance-GoDaddy-cPanel.zip` instead and extract its files directly into the domain's web root (`public_html` for the primary domain). These archives are not Website Builder templates or WordPress themes.

## Local use

```sh
npm install --omit=dev
npm run build
npm test
PORT=4178 npm start
```

Open http://localhost:4178. The archive also includes already-built public files, so `npm start` works without first running the build.

## Optional final-domain metadata

After choosing the domain, set `SITE_URL` to its origin (for example `https://your-domain.com`) and run the build again. This adds canonical and absolute social-image URLs. Without it, the package has relative social-image URLs and does not claim an unrelated canonical domain. For cPanel, run this step in the Node package and upload the updated `public/index.html` and assets.

Booking links still lead to `https://www.tbteast.com/` and `https://www.tbteast.com/packages`. Phone and email links remain the source site's destinations. No booking or payment transaction has been performed as part of packaging.

The files are ready to upload; uploading and publishing in your GoDaddy account are separate steps. Keep an existing site's backup before replacing its files.
