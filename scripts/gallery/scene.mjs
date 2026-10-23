import * as T from "three";
const params = new URLSearchParams(location.search);
const variant = params.get("variant");
const dark = params.get("theme") === "dark";
const mobile = params.get("mobile") === "true";
const data = await (await fetch("/data.json")).json();
document.body.classList.toggle("dark", dark);
const palette = {
  background: dark ? 0x0d1117 : 0xffffff,
  wall: dark ? 0x222c3b : 0xf3f5f7,
  edge: dark ? 0x344358 : 0xe0e5ec,
  white: dark ? 0x52647c : 0xfafcff,
  ink: dark ? 0x91b5ff : 0x3466dc,
};
const width = innerWidth,
  height = innerHeight;
const renderer = new T.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setSize(width, height);
renderer.setPixelRatio(1);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = dark ? 1.3 : 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFShadowMap;
document.body.prepend(renderer.domElement);
const scene = new T.Scene();
scene.background = new T.Color(palette.background);
const span = mobile ? 10.2 : 18.7;
const camera = new T.OrthographicCamera(
  -span / 2,
  span / 2,
  (span * height) / width / 2,
  (-span * height) / width / 2,
  0.1,
  100,
);
const target = new T.Vector3(0, mobile ? 3.55 : 2, 0);
camera.position.set(variant === "wall" ? 3.4 : 7, mobile ? 8 : 7.5, 23);
camera.lookAt(target);
camera.updateMatrixWorld();
scene.add(new T.HemisphereLight(0xffffff, dark ? 0x344153 : 0xc8d4e2, 2.1));
const light = new T.DirectionalLight(0xffffff, 3.6);
light.position.set(-5, 12, 10);
light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
Object.assign(light.shadow.camera, {
  left: -15,
  right: 15,
  top: 15,
  bottom: -15,
  near: 0.1,
  far: 50,
});
light.shadow.bias = -0.0003;
light.shadow.normalBias = 0.035;
scene.add(light);
const mat = (color) =>
  new T.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.04 });
function mesh(geometry, color, x, y, z) {
  const o = new T.Mesh(geometry, mat(color));
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  scene.add(o);
  return o;
}
function box(w, h, d, x, y, z, color = palette.wall) {
  return mesh(new T.BoxGeometry(w, h, d), color, x, y, z);
}
function label(text, x, y, z, kind = "") {
  const p = new T.Vector3(x, y, z).project(camera);
  const el = document.createElement("span");
  el.className = `label ${kind}`;
  el.textContent = text;
  el.style.left = `${((p.x + 1) * width) / 2}px`;
  el.style.top = `${((1 - p.y) * height) / 2}px`;
  document.getElementById("labels").append(el);
}
function plant(x, z, scale = 0.8) {
  mesh(
    new T.CylinderGeometry(0.28 * scale, 0.22 * scale, 0.42 * scale, 24),
    palette.edge,
    x,
    0.25 * scale,
    z,
  );
  for (let i = 0; i < 5; i++) {
    const angle = i * 2.4;
    const leaf = mesh(
      new T.SphereGeometry(0.23 * scale, 16, 12),
      dark ? 0x568478 : 0x8ba99d,
      x + Math.cos(angle) * 0.15 * scale,
      (0.65 + i * 0.06) * scale,
      z + Math.sin(angle) * 0.13 * scale,
    );
    leaf.scale.set(0.7, 1.5, 0.7);
    leaf.rotation.z = angle;
  }
}
function calendar(cx, cy, z, tile = 0.12, gap = 0.018) {
  const weeks = data.weeks,
    max = Math.max(1, ...weeks.flat().map((d) => d.count));
  const w = 26 * (tile + gap),
    h = 7 * (tile + gap);
  box(w + 0.32, h + 0.32, 0.1, cx, cy, z, palette.edge);
  weeks.forEach((week, col) =>
    week.forEach((day, row) => {
      const level = day.count ? Math.log1p(day.count) / Math.log1p(max) : 0;
      const depth = 0.04 + level * 0.19;
      const color = new T.Color(palette.white).lerp(
        new T.Color(palette.ink),
        level * 0.9,
      );
      box(
        tile,
        tile,
        depth,
        cx - w / 2 + col * (tile + gap) + tile / 2,
        cy + h / 2 - row * (tile + gap) - tile / 2,
        z + 0.07 + depth / 2,
        color,
      );
    }),
  );
  label("GitHub 활동", cx, cy - h / 2 - 0.38, z + 0.2);
}
const colorMap = {
  blue: 0x3569e8,
  mint: 0x24a7a0,
  violet: 0x8d6bd1,
  white: 0xdbe4ef,
};
function artwork(item, x, y, z, size = 0.3) {
  const color = colorMap[item.color];
  let geo;
  if (item.shape === "sphere") geo = new T.SphereGeometry(size, 32, 24);
  if (item.shape === "cube")
    geo = new T.BoxGeometry(size * 1.5, size * 1.5, size * 1.5);
  if (item.shape === "torus")
    geo = new T.TorusGeometry(size * 0.75, size * 0.24, 16, 40);
  if (item.shape === "pyramid") geo = new T.ConeGeometry(size, size * 1.85, 4);
  if (item.shape === "arch") {
    mesh(
      new T.TorusGeometry(size * 0.65, size * 0.2, 16, 28, Math.PI),
      color,
      x,
      y + size * 0.2,
      z,
    );
    box(
      size * 0.4,
      size * 0.9,
      size * 0.4,
      x - size * 0.65,
      y - size * 0.25,
      z,
      color,
    );
    box(
      size * 0.4,
      size * 0.9,
      size * 0.4,
      x + size * 0.65,
      y - size * 0.25,
      z,
      color,
    );
    return;
  }
  const o = mesh(geo, color, x, y, z);
  if (item.shape === "cube" || item.shape === "pyramid")
    o.rotation.y = Math.PI / 6;
}
function niches(cx, cy, z, cell = 0.83) {
  box(cell * 3 + 0.2, cell * 3 + 0.2, 0.1, cx, cy, z - 0.17, palette.edge);
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      const x = cx + (col - 1) * cell,
        y = cy + (1 - row) * cell;
      box(cell - 0.1, cell - 0.1, 0.12, x, y, z, palette.wall);
      box(cell, 0.07, 0.5, x, y - cell / 2 + 0.05, z + 0.21, palette.white);
      box(0.06, cell, 0.5, x - cell / 2 + 0.025, y, z + 0.21, palette.white);
      const item = data.artworks[row * 3 + col];
      if (item) artwork(item, x, y - 0.06, z + 0.3, cell * 0.28);
    }
  box(
    0.06,
    cell * 3,
    0.5,
    cx + cell * 1.5 - 0.025,
    cy,
    z + 0.21,
    palette.white,
  );
  box(cell * 3, 0.07, 0.5, cx, cy + cell * 1.5 - 0.03, z + 0.21, palette.white);
  label(
    data.artworks.length
      ? "방문자가 남긴 오브젝트"
      : "첫 오브젝트를 남겨 주세요",
    cx,
    cy - cell * 1.5 - 0.35,
    z + 0.3,
  );
}
const texture = await new T.TextureLoader().loadAsync(
  dark ? "/portfolio-dark.png" : "/portfolio.png",
);
texture.colorSpace = T.SRGBColorSpace;
function display(x, y, z, w = 5.3) {
  const h = (w * 760) / 1184;
  box(w + 0.22, h + 0.22, 0.18, x, y, z, palette.white);
  const screen = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  screen.position.set(x, y, z + 0.1);
  scene.add(screen);
  label("okorion.github.io", x, y + h / 2 + 0.32, z + 0.1, "title");
}
if (variant === "island") {
  const island = mesh(
    new T.CylinderGeometry(mobile ? 4.4 : 8.2, mobile ? 3.9 : 7.3, 0.65, 8),
    palette.wall,
    0,
    -0.47,
    0.4,
  );
  island.scale.z = mobile ? 0.55 : 0.44;
} else box(mobile ? 8.8 : 16.7, 0.18, 4.8, 0, -0.12, 0.2, palette.wall);
if (variant === "wall") {
  if (mobile) {
    box(8.7, 7.7, 0.24, 0, 3.75, -0.35);
    display(0, 5.45, -0.05, 6.7);
    calendar(-2.25, 1.65, -0.05, 0.125, 0.014);
    niches(2.25, 1.72, -0.03, 0.85);
  } else {
    box(16.5, 4.9, 0.24, 0, 2.35, -0.35);
    display(0.1, 2.5, -0.06, 5.5);
    calendar(-5.55, 2.45, -0.05, 0.143, 0.02);
    niches(5.3, 2.5, -0.03, 1.05);
  }
  plant(mobile ? -3.95 : -7.8, 1.4);
  plant(mobile ? 4 : 7.7, 1.1, 0.6);
} else if (variant === "gallery") {
  if (mobile) {
    display(0, 5.4, 0, 6.5);
    calendar(-2.2, 1.7, -0.65, 0.12, 0.015);
    niches(2.25, 1.6, -0.4, 0.82);
  } else {
    box(16, 4.1, 0.16, 0, 1.9, -1.3);
    box(0.16, 4.1, 4.8, -8, 1.9, 1);
    display(0.2, 2.55, 0.8, 5.5);
    calendar(-5.5, 2.45, -1.15, 0.14, 0.015);
    for (let i = 0; i < 9; i++) {
      const x = 3.8 + (i % 3) * 1.12,
        z = -0.1 + Math.floor(i / 3) * 1.02;
      box(0.82, 0.62, 0.72, x, 0.25, z, palette.white);
      if (data.artworks[i]) artwork(data.artworks[i], x, 0.88, z, 0.27);
    }
    label(
      data.artworks.length ? "방문자 작품" : "첫 오브젝트를 남겨 주세요",
      5.0,
      0.12,
      3.2,
    );
  }
  plant(mobile ? -3.9 : -7.2, 2.1);
  box(2.2, 0.22, 0.55, mobile ? -2.2 : -4.8, 0.35, 2.1, palette.edge);
  for (const offset of [-0.8, 0.8])
    box(
      0.13,
      0.28,
      0.4,
      (mobile ? -2.2 : -4.8) + offset,
      0.1,
      2.1,
      palette.edge,
    );
} else if (variant === "island") {
  const counts = data.weeks.flat().map((d) => d.count),
    max = Math.max(1, ...counts);
  data.weeks.forEach((week, col) =>
    week.forEach((day, row) => {
      const x = (col - 12.5) * (mobile ? 0.26 : 0.5),
        z = 1.1 + row * 0.26;
      const level = Math.log1p(day.count) / Math.log1p(max),
        h = 0.09 + level * 0.38;
      box(
        mobile ? 0.24 : 0.48,
        h,
        0.24,
        x,
        -0.1 + h / 2,
        z,
        new T.Color(palette.white).lerp(new T.Color(palette.ink), level * 0.8),
      );
    }),
  );
  if (mobile) {
    display(0, 5.15, 0, 6.5);
    calendar(-2.2, 1.6, -0.4, 0.12, 0.015);
    niches(2.25, 1.65, -0.4, 0.82);
  } else {
    display(0, 2.65, -0.1, 5.9);
    calendar(-5.75, 1.8, -0.3, 0.12, 0.014);
    for (let i = 0; i < 9; i++) {
      const a = -0.3 + i * 0.32;
      const x = 4.8 + Math.cos(a) * 1.2,
        z = Math.sin(a) * 2.1;
      box(0.7, 0.48, 0.65, x, 0.2, z, palette.white);
      if (data.artworks[i]) artwork(data.artworks[i], x, 0.77, z, 0.24);
    }
    label(
      data.artworks.length ? "방문자 작품" : "첫 오브젝트를 남겨 주세요",
      5.5,
      -0.5,
      3.2,
    );
  }
  plant(mobile ? -3.9 : -7.2, 1.5);
}
await document.fonts.ready;
renderer.render(scene, camera);
if (renderer.info.render.calls < 20)
  throw new Error("Scene rendered too few objects");
window.galleryReady = {
  variant,
  dark,
  mobile,
  drawCalls: renderer.info.render.calls,
  artworks: data.artworks.length,
};
