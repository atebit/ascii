// A tiny zip writer: STORE method (no compression), CRC32, local headers, central directory and
// end record. No libraries. zipStore([[path, text], ...]) -> Uint8Array. Paths ending in / are
// folders. Stage 5 uses it to build the skill download from SKILL_FILES (embedded by build.py).
const ZIP_CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function zipCrc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = ZIP_CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// DOS time and date fields, local time.
function zipDosTime(d) {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((Math.max(d.getFullYear(), 1980) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

function zipStore(entries, when = new Date()) {
  const enc = new TextEncoder();
  const { time, date } = zipDosTime(when);
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [path, text] of entries) {
    const name = enc.encode(path);
    const isDir = path.endsWith('/');
    const data = isDir ? new Uint8Array(0) : enc.encode(text);
    const crc = zipCrc32(data);

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);   // local file header signature
    lh.setUint16(4, 20, true);           // version needed: 2.0
    lh.setUint16(6, 0x0800, true);       // flags: UTF-8 names
    lh.setUint16(8, 0, true);            // method: STORE
    lh.setUint16(10, time, true);
    lh.setUint16(12, date, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); // compressed size
    lh.setUint32(22, data.length, true); // uncompressed size
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);           // extra length
    locals.push(new Uint8Array(lh.buffer), name, data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);   // central directory header signature
    ch.setUint16(4, 0x031e, true);       // made by: Unix, spec 3.0
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, time, true);
    ch.setUint16(14, date, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true);
    ch.setUint32(24, data.length, true);
    ch.setUint16(28, name.length, true);
    ch.setUint16(30, 0, true);           // extra length
    ch.setUint16(32, 0, true);           // comment length
    ch.setUint16(34, 0, true);           // disk number
    ch.setUint16(36, 0, true);           // internal attributes
    ch.setUint32(38, isDir ? ((0o40755 << 16) | 0x10) >>> 0 : (0o100644 << 16) >>> 0, true);
    ch.setUint32(42, offset, true);      // local header offset
    centrals.push(new Uint8Array(ch.buffer), name);

    offset += 30 + name.length + data.length;
  }
  const cdSize = centrals.reduce((s, b) => s + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);    // end of central directory signature
  end.setUint16(8, entries.length, true);  // entries on this disk
  end.setUint16(10, entries.length, true); // entries total
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);       // central directory offset
  const parts = [...locals, ...centrals, new Uint8Array(end.buffer)];
  const out = new Uint8Array(offset + cdSize + 22);
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}
