// ASCII pass: render the scene at one or two pixels per cell, then draw one glyph per cell
// from a font atlas. Brightness picks a glyph from the ramp; depth edges pick | / - \.
// Options (all settable after construction):
//   edges   depth breaks (silhouettes) draw as | / - \
//   ridges  thin bright lines (line art, grids, streaks) draw as | / - \ along the line
//   scramble 0..1: share of cells swapped for random glyphs (the shell's stage transition)
const ASCII_RAMP = ' .:-~=+*oxX#%@';
const ASCII_EDGES = '|/-\\';
const ASCII_FONT = 'Menlo, "SF Mono", Consolas, "DejaVu Sans Mono", monospace';

function makeGlyphAtlas(chars, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w * chars.length;
  canvas.height = h;
  const g = canvas.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = '#fff';
  g.font = `bold ${Math.round(h * 0.8)}px ${ASCII_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  [...chars].forEach((ch, i) => g.fillText(ch, i * w + w / 2, h * 0.54));
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

const ASCII_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const ASCII_FRAG = /* glsl */ `
uniform sampler2D tScene;
uniform sampler2D tDepth;
uniform sampler2D tAtlas;
uniform vec2 grid;
uniform vec2 cellPx;
uniform vec2 offsetPx;
uniform float nGlyph;
uniform float rampLen;
uniform int mode;
uniform bool edges;
uniform bool ridges;
uniform float scramble;
uniform float seed;
uniform float near;
uniform float far;
uniform float glow;
uniform float fill;
uniform vec3 bg;

vec3 toSRGB(vec3 c) { return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)); }
vec3 sceneAt(vec2 uv) { return toSRGB(texture2D(tScene, uv).rgb); }
float lumOf(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float lumAt(vec2 uv) { return lumOf(sceneAt(uv)); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float lineGlyph(float deg) {
  float e = mod(deg, 180.0);
  return (e < 22.5 || e >= 157.5) ? 2.0 : (e < 67.5 ? 1.0 : (e < 112.5 ? 0.0 : 3.0));
}
float depthAt(vec2 uv) {
  float z = texture2D(tDepth, uv).r * 2.0 - 1.0;
  return (2.0 * near * far) / (far + near - z * (far - near));
}

void main() {
  vec2 p = gl_FragCoord.xy - offsetPx;
  vec2 cell = floor(p / cellPx);
  if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= grid.x || cell.y >= grid.y) {
    gl_FragColor = vec4(bg, 1.0);
    return;
  }
  vec2 f = fract(p / cellPx);
  vec2 px = 1.0 / grid;
  vec2 uv = (cell + 0.5) * px;

  vec3 c = sceneAt(uv);
  float l = lumOf(c);
  float idx = floor(clamp(pow(l, 1.25) * 1.15, 0.0, 0.999) * rampLen);
  vec3 tint = c;
  bool edged = false;

  if (edges) {
    float d00 = depthAt(uv + px * vec2(-1.0,  1.0));
    float d10 = depthAt(uv + px * vec2( 0.0,  1.0));
    float d20 = depthAt(uv + px * vec2( 1.0,  1.0));
    float d01 = depthAt(uv + px * vec2(-1.0,  0.0));
    float d21 = depthAt(uv + px * vec2( 1.0,  0.0));
    float d02 = depthAt(uv + px * vec2(-1.0, -1.0));
    float d12 = depthAt(uv + px * vec2( 0.0, -1.0));
    float d22 = depthAt(uv + px * vec2( 1.0, -1.0));
    float dc  = depthAt(uv);
    float gx = (d20 + 2.0 * d21 + d22) - (d00 + 2.0 * d01 + d02);
    float gy = (d00 + 2.0 * d10 + d20) - (d02 + 2.0 * d12 + d22);
    float dmin = min(min(min(d00, d10), min(d20, d01)), min(min(d21, d02), min(min(d12, d22), dc)));
    float dmax = max(max(max(d00, d10), max(d20, d01)), max(max(d21, d02), max(max(d12, d22), dc)));
    // Only real breaks in depth (silhouettes, overlaps), not the curve of a surface.
    if ((dmax - dmin) / max(dmin, 0.001) > 0.12 && dmin < far * 0.9) {
      // Edge runs at right angles to the depth gradient, measured in screen space.
      idx = rampLen + lineGlyph(degrees(atan(gy / cellPx.y, gx / cellPx.x)) + 90.0);
      edged = true;
      tint = max(c, max(max(sceneAt(uv + px * vec2(-1.0, 0.0)), sceneAt(uv + px * vec2(1.0, 0.0))),
                        max(sceneAt(uv + px * vec2(0.0, 1.0)), sceneAt(uv + px * vec2(0.0, -1.0)))));
    }
  }

  if (ridges && !edged && l > 0.06) {
    // A thin bright line has bright neighbors on both sides along it and dark ones across it.
    // Score the 4 line directions by the dimmer of the two neighbors along each one.
    // Single specks (no support) and filled areas (support everywhere) keep their ramp glyph.
    float l00 = lumAt(uv + px * vec2(-1.0,  1.0));
    float l10 = lumAt(uv + px * vec2( 0.0,  1.0));
    float l20 = lumAt(uv + px * vec2( 1.0,  1.0));
    float l01 = lumAt(uv + px * vec2(-1.0,  0.0));
    float l21 = lumAt(uv + px * vec2( 1.0,  0.0));
    float l02 = lumAt(uv + px * vec2(-1.0, -1.0));
    float l12 = lumAt(uv + px * vec2( 0.0, -1.0));
    float l22 = lumAt(uv + px * vec2( 1.0, -1.0));
    vec4 along = vec4(min(l10, l12), min(l20, l02), min(l01, l21), min(l00, l22)); // glyphs | / - and back-slash
    vec4 across = along.zwxy;
    vec4 score = along - 1.6 * across - 0.03;
    float best = max(max(score.x, score.y), max(score.z, score.w));
    if (best > 0.3 * l) {
      idx = rampLen + (score.x == best ? 0.0 : score.y == best ? 1.0 : score.z == best ? 2.0 : 3.0);
    }
  }

  if (scramble > 0.0) {
    float h = hash(cell + seed);
    if (h < scramble) {
      float h2 = hash(cell * 1.7 + seed + 3.1);
      idx = 1.0 + floor(h2 * (nGlyph - 1.0));
      if (lumOf(tint) < 0.08 && h < scramble * 0.45) {
        float h3 = hash(cell * 0.7 + seed + 9.4);
        tint = h3 < 0.3 ? vec3(1.0, 0.24, 0.55) : h3 < 0.55 ? vec3(0.29, 0.89, 0.94)
             : h3 < 0.75 ? vec3(1.0, 0.77, 0.24) : vec3(0.6, 0.36, 1.0);
        tint *= 0.35 + 0.45 * h2;
      }
    }
  }

  float m = texture2D(tAtlas, vec2((idx + f.x) / nGlyph, f.y)).r;
  float lt = sqrt(max(lumOf(tint), 0.0));
  vec3 col;
  if (mode == 0) {
    // Brighten without clipping: scale back down by the top channel so pink stays pink.
    col = max(mix(vec3(lumOf(tint)), tint, 1.5) * 1.65, 0.0);
    col /= max(1.0, max(col.r, max(col.g, col.b)));
  }
  else if (mode == 1) col = vec3(1.0, 0.93, 0.82) * (0.35 + 0.75 * lt);
  else col = vec3(0.25, 1.0, 0.45) * (0.3 + 0.85 * lt);

  // Each cell gets a dim fill of its own color (like an ANSI background color), so dark
  // features such as eyes read as holes in the fur.
  vec3 outc = bg + mix(c * fill, col, m) + c * glow;
  outc *= 0.9 + 0.1 * sin(gl_FragCoord.y * 3.14159 / max(cellPx.y * 0.25, 1.0));
  gl_FragColor = vec4(outc, 1.0);
}
`;

class AsciiPass {
  constructor(renderer, { cell = 12, mode = 0, edges = true, ridges = false, glow = 0.1, fill = 0.4, scale = 2 } = {}) {
    this.renderer = renderer;
    this.cell = cell;      // cell height in CSS px
    this.aspect = 0.6;     // glyph width / height
    this.scale = scale;    // scene pixels per cell, per axis
    this.chars = ASCII_RAMP + ASCII_EDGES;
    this.target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
    this.target.depthTexture = new THREE.DepthTexture(1, 1);
    this.material = new THREE.ShaderMaterial({
      vertexShader: ASCII_VERT,
      fragmentShader: ASCII_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tScene: { value: this.target.texture },
        tDepth: { value: this.target.depthTexture },
        tAtlas: { value: null },
        grid: { value: new THREE.Vector2(1, 1) },
        cellPx: { value: new THREE.Vector2(1, 1) },
        offsetPx: { value: new THREE.Vector2(0, 0) },
        nGlyph: { value: this.chars.length },
        rampLen: { value: ASCII_RAMP.length },
        mode: { value: mode },
        edges: { value: edges },
        ridges: { value: ridges },
        scramble: { value: 0 },
        seed: { value: 0 },
        near: { value: 0.1 },
        far: { value: 100 },
        glow: { value: glow },
        fill: { value: fill },
        bg: { value: new THREE.Color(0x000000) },
      },
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.quad.frustumCulled = false;
    this.quadScene = new THREE.Scene();
    this.quadScene.add(this.quad);
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.cols = 1;
    this.rows = 1;
  }

  get mode() { return this.material.uniforms.mode.value; }
  set mode(v) { this.material.uniforms.mode.value = v; }
  get fill() { return this.material.uniforms.fill.value; }
  set fill(v) { this.material.uniforms.fill.value = v; }
  get edges() { return this.material.uniforms.edges.value; }
  set edges(v) { this.material.uniforms.edges.value = v; }
  get ridges() { return this.material.uniforms.ridges.value; }
  set ridges(v) { this.material.uniforms.ridges.value = v; }
  get scramble() { return this.material.uniforms.scramble.value; }
  set scramble(v) { this.material.uniforms.scramble.value = v; }
  get seed() { return this.material.uniforms.seed.value; }
  set seed(v) { this.material.uniforms.seed.value = v; }

  setSize(w, h) {
    const dpr = this.renderer.getPixelRatio();
    const ch = this.cell;
    const cw = ch * this.aspect;
    this.cols = Math.max(1, Math.floor(w / cw));
    this.rows = Math.max(1, Math.floor(h / ch));
    this.target.setSize(this.cols * this.scale, this.rows * this.scale);
    const u = this.material.uniforms;
    u.grid.value.set(this.cols, this.rows);
    u.cellPx.value.set(cw * dpr, ch * dpr);
    u.offsetPx.value.set(((w - this.cols * cw) / 2) * dpr, ((h - this.rows * ch) / 2) * dpr);
    if (u.tAtlas.value) u.tAtlas.value.dispose();
    u.tAtlas.value = makeGlyphAtlas(this.chars, Math.ceil(cw * dpr * 2), Math.ceil(ch * dpr * 2));
  }

  render(scene, camera) {
    const r = this.renderer;
    const u = this.material.uniforms;
    u.near.value = camera.near;
    u.far.value = camera.far;
    r.setRenderTarget(this.target);
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.quadScene, this.quadCam);
  }
}
