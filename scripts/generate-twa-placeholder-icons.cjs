// PLACEHOLDERS: redimensiona offline o PNG RGB gerado por generate-placeholder-icons.cjs.
// Usa somente módulos nativos do Node e escreve apenas dentro de android-twa/.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '../dist/icons/icon-192.png'));
const width = source.readUInt32BE(16), height = source.readUInt32BE(20);
assert.equal(width, 192); assert.equal(height, 192);
assert.equal(source[24], 8); assert.equal(source[25], 2); assert.equal(source[28], 0);
const idat = [];
for (let offset = 8; offset < source.length;) {
  const length = source.readUInt32BE(offset);
  if (source.toString('ascii', offset + 4, offset + 8) === 'IDAT') idat.push(source.subarray(offset + 8, offset + 8 + length));
  offset += length + 12;
}
const pixels = zlib.inflateSync(Buffer.concat(idat));
assert.equal(pixels.length, (width * 3 + 1) * height);
for (let y = 0; y < height; y++) {
  assert.equal(pixels[y * (width * 3 + 1)], 0, 'Este script aceita os placeholders RGB sem filtro do repositório.');
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const length = Buffer.alloc(4), checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, body, checksum]);
}

function resize(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = Math.floor((x + 0.5) * width / size), sy = Math.floor((y + 0.5) * height / size);
      const start = sy * (width * 3 + 1) + 1 + sx * 3;
      pixels.copy(raw, y * (size * 3 + 1) + 1 + x * 3, start, start + 3);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 2;
  return Buffer.concat([source.subarray(0, 8), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const res = path.join(__dirname, '../android-twa/app/src/main/res');
for (const [density, size] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  const directory = path.join(res, 'mipmap-' + density);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'ic_launcher.png'), size === width ? source : resize(size));
}
fs.mkdirSync(path.join(res, 'drawable'), { recursive: true });
fs.copyFileSync(path.join(__dirname, '../dist/icons/icon-512.png'), path.join(res, 'drawable/splash.png'));
