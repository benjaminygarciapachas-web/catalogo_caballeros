import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'src/config/catalogo.sqlite');
const uploadsDir = path.resolve(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Inicializar DB
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

// Ejecutar init.sql
const initSql = fs.readFileSync(path.resolve(__dirname, 'src/config/init.sql'), 'utf-8');
db.exec(initSql);

console.log('🔄 Ejecutando Seed para CATALOGO CABALLEROS...');

// 1. Roles
db.exec(`
  INSERT OR IGNORE INTO roles (id, name, description) VALUES
  (1, 'admin', 'Administrador con control total del catálogo y visualización de sesiones'),
  (2, 'cliente', 'Cliente visitante del catálogo');
`);

// 2. Usuario Administrador
// Credenciales estrictas: PATTYps / PATTYpschincha452416
const adminExisting = db.prepare('SELECT id FROM usuarios WHERE username = ?').get('PATTYps');
if (!adminExisting) {
  db.prepare(`
    INSERT INTO usuarios (username, password_hash, role_id)
    VALUES (?, ?, ?)
  `).run('PATTYps', 'PATTYpschincha452416', 1);
  console.log('👑 Usuario Administrador creado: PATTYps');
}

// 3. Categorías
db.exec(`
  INSERT OR IGNORE INTO categorias (id, name, slug, icon) VALUES
  (1, 'Ropa', 'ropa', 'shirt'),
  (2, 'Calzado', 'calzado', 'footprints');
`);

// 4. Subcategorías
const subcats = [
  // Ropa - Marcas
  { id: 1, categoria_id: 1, tipo_grupo: 'Marcas', name: 'camisas de marca', slug: 'camisas-de-marca' },
  { id: 2, categoria_id: 1, tipo_grupo: 'Marcas', name: 'polos de marca', slug: 'polos-de-marca' },
  { id: 3, categoria_id: 1, tipo_grupo: 'Marcas', name: 'pantalones y shorts de marca', slug: 'pantalones-y-shorts-de-marca' },
  { id: 4, categoria_id: 1, tipo_grupo: 'Marcas', name: 'casacas y chompas de marca', slug: 'casacas-y-chompas-de-marca' },
  { id: 5, categoria_id: 1, tipo_grupo: 'Marcas', name: 'conjuntos de marca', slug: 'conjuntos-de-marca' },
  // Ropa - Normal
  { id: 6, categoria_id: 1, tipo_grupo: 'Normal', name: 'polo y camisas', slug: 'polo-y-camisas' },
  { id: 7, categoria_id: 1, tipo_grupo: 'Normal', name: 'pantalones y shorts', slug: 'pantalones-y-shorts' },
  { id: 8, categoria_id: 1, tipo_grupo: 'Normal', name: 'conjuntos', slug: 'conjuntos' },
  // Calzado
  { id: 9, categoria_id: 2, tipo_grupo: 'Calzado', name: 'Zapatillas', slug: 'zapatillas' },
  { id: 10, categoria_id: 2, tipo_grupo: 'Calzado', name: 'Zapatos', slug: 'zapatos' },
  { id: 11, categoria_id: 2, tipo_grupo: 'Calzado', name: 'Sandalias', slug: 'sandalias' }
];

const insertSubcat = db.prepare(`
  INSERT OR REPLACE INTO subcategorias (id, categoria_id, tipo_grupo, name, slug)
  VALUES (?, ?, ?, ?, ?)
`);
for (const sc of subcats) {
  insertSubcat.run(sc.id, sc.categoria_id, sc.tipo_grupo, sc.name, sc.slug);
}

// Generador de imágenes SVG locales estilizadas (Paleta: Celeste, Fucsia, Azul, Rojo, Rosa)
function generateSvgImage(filename, title, subtitle, colorTheme) {
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    const gradients = {
      celeste: { bg1: '#E0F2FE', bg2: '#BAE6FD', stroke: '#0284C7', text: '#0369A1' },
      fucsia: { bg1: '#FCE7F3', bg2: '#FBCFE8', stroke: '#DB2777', text: '#BE185D' },
      azul: { bg1: '#EFF6FF', bg2: '#DBEAFE', stroke: '#2563EB', text: '#1D4ED8' },
      rojo: { bg1: '#FEF2F2', bg2: '#FEE2E2', stroke: '#EF4444', text: '#B91C1C' },
      rosa: { bg1: '#FFF1F2', bg2: '#FFE4E6', stroke: '#F43F5E', text: '#E11D48' }
    };
    const c = gradients[colorTheme] || gradients.azul;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
      <defs>
        <linearGradient id="grad_${filename.replace(/[^a-z0-9]/gi, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c.bg1}" />
          <stop offset="100%" stop-color="${c.bg2}" />
        </linearGradient>
      </defs>
      <rect width="600" height="600" rx="24" fill="url(#grad_${filename.replace(/[^a-z0-9]/gi, '')})" />
      <circle cx="300" cy="240" r="120" fill="#FFFFFF" fill-opacity="0.8" stroke="${c.stroke}" stroke-width="4" stroke-dasharray="6 6" />
      <g transform="translate(240, 180) scale(2.5)" stroke="${c.stroke}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
      </g>
      <text x="300" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" text-anchor="middle" fill="${c.text}">
        ${title.toUpperCase()}
      </text>
      <text x="300" y="460" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" text-anchor="middle" fill="#64748B">
        ${subtitle}
      </text>
      <rect x="230" y="500" width="140" height="34" rx="17" fill="${c.stroke}" />
      <text x="300" y="523" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="#FFFFFF">
        CABALLEROS
      </text>
    </svg>`;
    fs.writeFileSync(filePath, svg, 'utf-8');
  }
  return `/uploads/${filename}`;
}

// 5. Productos de muestra elegantes
const sampleProducts = [
  // ROPA - MARCAS
  {
    title: 'Camisa Oxford Slim Premium',
    description: 'Camisa de diseñador manga larga en algodón pima peruano, corte estilizado y botones aperlados.',
    price: 139.00,
    original_price: 179.00,
    image_file: 'camisa-oxford-marca.svg',
    image_theme: 'celeste',
    categoria_id: 1,
    subcategoria_id: 1, // camisas de marca
    sizes: 'S, M, L, XL',
    stock: 15,
    badge: 'Destacado'
  },
  {
    title: 'Polo Piqué Signature Collection',
    description: 'Polo cuello camisero con bordado de alta gama, tejido transpirable de máxima durabilidad.',
    price: 99.00,
    original_price: 129.00,
    image_file: 'polo-pique-marca.svg',
    image_theme: 'fucsia',
    categoria_id: 1,
    subcategoria_id: 2, // polos de marca
    sizes: 'M, L, XL',
    stock: 20,
    badge: 'Nuevo'
  },
  {
    title: 'Pantalón Chino Comfort Luxury',
    description: 'Pantalón semi formal con tecnología elástica de alta costura, bolsillos traseros de ribete.',
    price: 159.00,
    original_price: 199.00,
    image_file: 'pantalon-chino-marca.svg',
    image_theme: 'azul',
    categoria_id: 1,
    subcategoria_id: 3, // pantalones y shorts de marca
    sizes: '30, 32, 34, 36',
    stock: 12,
    badge: 'Exclusivo'
  },
  {
    title: 'Casaca Cortavientos Urbana Brand',
    description: 'Chaqueta ligera con forro térmico impermeable, acabados mate y cremalleras selladas.',
    price: 219.00,
    original_price: 279.00,
    image_file: 'casaca-urbana-marca.svg',
    image_theme: 'rojo',
    categoria_id: 1,
    subcategoria_id: 4, // casacas y chompas de marca
    sizes: 'M, L, XL',
    stock: 8,
    badge: 'Oferta'
  },
  {
    title: 'Conjunto Deportivo Tracksuit Elite',
    description: 'Conjunto de casaca y pantalón jogger con franja lateral distintiva y tejido térmico liviano.',
    price: 249.00,
    original_price: 310.00,
    image_file: 'conjunto-tracksuit-marca.svg',
    image_theme: 'rosa',
    categoria_id: 1,
    subcategoria_id: 5, // conjuntos de marca
    sizes: 'S, M, L',
    stock: 10,
    badge: 'Top Ventas'
  },

  // ROPA - NORMAL
  {
    title: 'Polo Básico Cuello Redondo Soft',
    description: 'Polo esencial 100% algodón prelavado, tacto suave ideal para el día a día.',
    price: 49.00,
    original_price: 65.00,
    image_file: 'polo-basico-normal.svg',
    image_theme: 'celeste',
    categoria_id: 1,
    subcategoria_id: 6, // polo y camisas
    sizes: 'S, M, L, XL, XXL',
    stock: 35,
    badge: 'Esencial'
  },
  {
    title: 'Bermuda Denim Casual Wash',
    description: 'Short en denim resistente con lavado medio, cinco bolsillos y ajuste anatómico.',
    price: 79.00,
    original_price: 99.00,
    image_file: 'bermuda-denim-normal.svg',
    image_theme: 'azul',
    categoria_id: 1,
    subcategoria_id: 7, // pantalones y shorts
    sizes: '30, 32, 34',
    stock: 18,
    badge: 'Verano'
  },
  {
    title: 'Conjunto Casual Short + Polo Relax',
    description: 'Set coordinado de polo manga corta y short en french terry liviano, comodidad total.',
    price: 119.00,
    original_price: 145.00,
    image_file: 'conjunto-casual-normal.svg',
    image_theme: 'fucsia',
    categoria_id: 1,
    subcategoria_id: 8, // conjuntos
    sizes: 'S, M, L',
    stock: 14,
    badge: 'Popular'
  },

  // CALZADO
  {
    title: 'Zapatillas Urban Air Runner',
    description: 'Calzado ergonómico con suela amortiguada antideslizante y capellada transpirable knit.',
    price: 189.00,
    original_price: 239.00,
    image_file: 'zapatillas-urban-air.svg',
    image_theme: 'azul',
    categoria_id: 2,
    subcategoria_id: 9, // Zapatillas
    sizes: '39, 40, 41, 42, 43',
    stock: 16,
    badge: 'Tendencia'
  },
  {
    title: 'Zapatos Oxford Cuero Genuino',
    description: 'Zapato de vestir formal en cuero legítimo con acabado lustre brillante y suela de alta tracción.',
    price: 229.00,
    original_price: 289.00,
    image_file: 'zapatos-oxford-cuero.svg',
    image_theme: 'rojo',
    categoria_id: 2,
    subcategoria_id: 10, // Zapatos
    sizes: '40, 41, 42, 43',
    stock: 11,
    badge: 'Elegancia'
  },
  {
    title: 'Sandalias Anatómicas Doble Hebilla',
    description: 'Sandalias veraniegas con plantilla acolchada de corcho natural y tiras ajustables resistentes.',
    price: 89.00,
    original_price: 110.00,
    image_file: 'sandalias-anatomicas.svg',
    image_theme: 'celeste',
    categoria_id: 2,
    subcategoria_id: 11, // Sandalias
    sizes: '39, 40, 41, 42',
    stock: 22,
    badge: 'Temporada'
  }
];

const insertProduct = db.prepare(`
  INSERT INTO productos (title, description, price, original_price, image_url, categoria_id, subcategoria_id, sizes, stock, badge)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Comprobar si ya existen productos para no duplicar
const countProd = db.prepare('SELECT count(*) as count FROM productos').get();
if (countProd.count === 0) {
  for (const prod of sampleProducts) {
    const imageUrl = generateSvgImage(prod.image_file, prod.title.split(' ')[0], prod.title, prod.image_theme);
    insertProduct.run(
      prod.title,
      prod.description,
      prod.price,
      prod.original_price,
      imageUrl,
      prod.categoria_id,
      prod.subcategoria_id,
      prod.sizes,
      prod.stock,
      prod.badge
    );
  }
  console.log(`✅ ${sampleProducts.length} productos de muestra inicializados.`);
} else {
  console.log(`ℹ️ La base de datos ya contiene ${countProd.count} productos.`);
}

console.log('🎉 Seed completado con éxito.');
