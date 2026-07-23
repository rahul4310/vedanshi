import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');
const PROJECTS_JSON = path.resolve(ROOT_DIR, 'src', 'generated', 'projects.json');
const BASE_URL = 'https://rahul4310.github.io/vedanshi/';

function generateSEO() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  let projects = [];
  try {
    if (fs.existsSync(PROJECTS_JSON)) {
      projects = JSON.parse(fs.readFileSync(PROJECTS_JSON, 'utf-8'));
    }
  } catch (e) {
    console.error('Could not read projects.json:', e);
  }

  // 1. Generate sitemap.xml
  const urls = [
    BASE_URL
  ];

  // Since we use HashRouter, the URLs have a /#/ in them.
  // Google typically indexes the root domain for HashRouters, but adding them to the sitemap can't hurt.
  projects.forEach(project => {
    urls.push(`${BASE_URL}#/project/${project.id}`);
  });

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>\n    <loc>${url}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapContent);
  console.log(`Generated sitemap.xml with ${urls.length} URLs`);

  // 2. Generate robots.txt
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}sitemap.xml
`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsContent);
  console.log('Generated robots.txt');
}

generateSEO();
