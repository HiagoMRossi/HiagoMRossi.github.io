// PLACEHOLDERS: PNGs gerados offline apenas com módulos nativos do Node.
// Cruz geométrica inspirada no favicon existente; substituir pela identidade final.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4), checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length); checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}
function icon(size, maskable) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // A arte maskable fica inteiramente dentro do círculo seguro central de 80%.
      const px = (x + .5) / size, py = (y + .5) / size;
      const pad = maskable ? .26 : .20;
      const cross = (px >= .44 && px < .56 && py >= pad && py < 1 - pad) ||
        (px >= pad && px < 1 - pad && py >= .40 && py < .52);
      const color = cross ? [255, 180, 82] : [24, 63, 55];
      const offset = y * (size * 3 + 1) + 1 + x * 3;
      raw.set(color, offset);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 2; // RGB opaco, 8 bits por canal.
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))
  ]);
}
const directory = path.join(__dirname, '../dist/icons');
fs.mkdirSync(directory, { recursive: true });
for (const [name, size, maskable] of [
  ['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true]
]) fs.writeFileSync(path.join(directory, name), icon(size, maskable));
