import * as T from "three";
import { RoundedBoxGeometry } from "/RoundedBoxGeometry.mjs";
import { RoomEnvironment } from "/RoomEnvironment.mjs";
const params = new URLSearchParams(location.search);
const variant = params.get("variant");
const advanced = params.get("style") === "advanced";
const anchors = [];
const labelTexts = [];
const showSectionLabels = params.get("sectionLabels") === "true";
const dark = params.get("theme") === "dark";
const mobile = params.get("mobile") === "true";
const data = await (await fetch("/data.json")).json();
const fontResponse = await fetch("/font.woff2");
if (!fontResponse.ok) throw new Error("Gallery font request failed");
const fontFace = new FontFace(
  "Pretendard Variable",
  await fontResponse.arrayBuffer(),
  { weight: "100 900" },
);
await fontFace.load();
document.fonts.add(fontFace);
if (
  !(
    await document.fonts.load(
      '600 48px "Pretendard Variable"',
      "포트폴리오 활동 기록 함께 채우는 전시",
    )
  ).length
)
  throw new Error("Gallery font failed to load");
await document.fonts.ready;
const labelBounds = [];
const decorBounds = [];
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
renderer.toneMappingExposure = dark ? 1.1 : 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFShadowMap;
document.body.prepend(renderer.domElement);
const scene = new T.Scene();
const environment = new T.PMREMGenerator(renderer).fromScene(
  new RoomEnvironment(),
  0.04,
);
scene.environment = environment.texture;
scene.environmentIntensity = dark ? 0.32 : advanced ? 0.75 : 0.45;
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
camera.position.set(
  variant === "wall" ? 2.6 : variant === "pavilion" ? 4.8 : 7,
  mobile ? 8 : 7.5,
  23,
);
camera.lookAt(target);
camera.updateMatrixWorld();
scene.add(
  new T.HemisphereLight(
    0xffffff,
    dark ? 0x263248 : 0xc8d4e2,
    dark ? 0.85 : 1.6,
  ),
);
const light = new T.DirectionalLight(0xffffff, dark ? 1.5 : 2.5);
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
  new T.MeshStandardMaterial({
    color,
    roughness: advanced ? 0.36 : 0.74,
    metalness: advanced ? 0.18 : 0.02,
  });
function mesh(geometry, color, x, y, z) {
  const o = new T.Mesh(geometry, mat(color));
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  scene.add(o);
  return o;
}
function box(w, h, d, x, y, z, color = palette.wall) {
  return mesh(
    new RoundedBoxGeometry(w, h, d, 2, Math.min(0.07, w / 8, h / 8, d / 3)),
    color,
    x,
    y,
    z,
  );
}
function label(text, x, y, z, kind = "") {
  if (kind !== "title" && !showSectionLabels) return;
  labelTexts.push(text);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const fontSize = kind === "title" ? 104 : 96;
  const font = `${kind === "title" ? 600 : 500} ${fontSize}px "Pretendard Variable"`;
  ctx.font = font;
  canvas.width = Math.ceil(ctx.measureText(text).width + 48);
  canvas.height = 160;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = dark ? "#cbd7ee" : "#4d5c73";
  ctx.fillText(text, canvas.width / 2, 82);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const h = kind === "title" ? 0.4 : 0.34;
  const w = (h * canvas.width) / canvas.height;
  const writing = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.01,
      toneMapped: false,
    }),
  );
  writing.position.set(x, y, z + 0.06);
  scene.add(writing);
  labelBounds.push({ x, y, z: z + 0.06, w, h });
}
const chrome = new T.MeshPhysicalMaterial({
  color: dark ? 0x7c99cc : 0xcbd9f4,
  metalness: 0.9,
  roughness: 0.21,
  clearcoat: 1,
});
const glass = new T.MeshPhysicalMaterial({
  color: dark ? 0x182844 : 0xa9c7ff,
  metalness: 0.14,
  roughness: 0.19,
  transmission: dark ? 0.06 : 0.25,
  thickness: 0.35,
  transparent: true,
  opacity: 0.9,
  clearcoat: 1,
});
function accent(w, h, d, x, y, z) {
  const o = box(w, h, d, x, y, z);
  o.material = new T.MeshStandardMaterial({
    color: 0x6787e5,
    emissive: 0x3455c4,
    emissiveIntensity: dark ? 0.65 : 0.1,
    roughness: 0.3,
    metalness: 0.5,
  });
  return o;
}
function frame(w, h, x, y, z) {
  const o = box(w, h, 0.1, x, y, z);
  o.material = glass;
  return o;
}
function calendar(cx, cy, z, tile = 0.12, gap = 0.018) {
  anchors.push({ kind: "calendar", cx, cy, z, tile, gap });
  const weeks = data.weeks,
    max = Math.max(1, ...weeks.flat().map((d) => d.count));
  const w = 26 * (tile + gap),
    h = 7 * (tile + gap);
  if (advanced) {
    frame(w + 0.43, h + 0.43, cx, cy, z - 0.05);
    accent(w + 0.25, 0.025, 0.035, cx, cy + h / 2 + 0.17, z + 0.07);
  }
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
  label("활동 기록", cx, cy - h / 2 - 0.3, z + 0.2);
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
  anchors.push({ kind: "niches", cx, cy, z, cell });
  if (advanced) {
    frame(cell * 3 + 0.36, cell * 3 + 0.36, cx, cy, z - 0.24);
    for (let row = 0; row < 3; row++)
      accent(
        cell * 3 - 0.08,
        0.024,
        0.025,
        cx,
        cy + (1.5 - row) * cell - 0.1,
        z + 0.44,
      );
  }
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
    data.artworks.length ? "방문자의 오브젝트" : "함께 채우는 전시",
    cx,
    cy - cell * 1.5 - 0.35,
    z + 0.3,
  );
}
const texture = await new T.TextureLoader().loadAsync(
  dark ? "/portfolio-dark.png" : "/portfolio.png",
);
texture.colorSpace = T.SRGBColorSpace;
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
function display(x, y, z, w = 5.3) {
  anchors.push({ kind: "display", x, y, z, w });
  const h = (w * 760) / 1184;
  if (advanced) {
    frame(w + 0.46, h + 0.46, x, y, z - 0.06);
    const radius = h * 0.65;
    const halo = new T.Mesh(
      new T.TorusGeometry(radius, 0.045, 16, 128, Math.PI * 1.64),
      chrome,
    );
    halo.position.set(x, y, z - 0.1);
    halo.geometry.rotateZ(Math.PI * 0.68);
    halo.scale.x = (w * 0.6) / radius;
    scene.add(halo);
    const arc = new T.Mesh(
      new T.TorusGeometry(radius - 0.07, 0.025, 12, 96, Math.PI * 0.4),
      new T.MeshStandardMaterial({
        color: 0x6688ea,
        emissive: 0x4866d3,
        emissiveIntensity: dark ? 0.7 : 0.1,
        metalness: 0.5,
        roughness: 0.25,
      }),
    );
    arc.position.set(x, y, z - 0.04);
    arc.scale.x = halo.scale.x;
    arc.geometry.rotateZ(-0.3);
    scene.add(arc);
    decorBounds.push(halo, arc);
    accent(w - 0.2, 0.028, 0.07, x, y - h / 2 - 0.1, z + 0.1);
  }
  box(w + 0.22, h + 0.22, 0.18, x, y, z, palette.white);
  const screen = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  screen.position.set(x, y, z + 0.1);
  scene.add(screen);
  label("okorion.github.io", x, y + h / 2 + 0.28, z + 0.1, "title");
}
if (variant === "island") {
  const island = mesh(
    new T.CylinderGeometry(
      mobile ? 4.4 : 8.2,
      mobile ? 3.9 : 7.3,
      0.65,
      advanced ? 96 : 32,
    ),
    palette.wall,
    0,
    -0.47,
    0.4,
  );
  island.scale.z = mobile ? 0.55 : 0.44;
} else if (variant !== "pavilion")
  box(mobile ? 8.8 : 16.7, 0.18, 4.8, 0, -0.12, 0.2, palette.wall);
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
      data.artworks.length ? "방문자의 오브젝트" : "함께 채우는 전시",
      5.0,
      0.12,
      3.2,
    );
  }
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
      data.artworks.length ? "방문자의 오브젝트" : "함께 채우는 전시",
      5.5,
      -0.5,
      3.2,
    );
  }
}
if (variant === "pavilion") {
  const pearl = dark ? 0x233044 : 0xf5f7fb;
  const stage = mesh(
    new T.CylinderGeometry(mobile ? 4.5 : 8.6, mobile ? 4.35 : 8.35, 0.32, 96),
    pearl,
    0,
    -0.16,
    0.3,
  );
  stage.scale.z = mobile ? 0.65 : 0.43;
  const rim = mesh(
    new T.CylinderGeometry(mobile ? 4.35 : 8.4, mobile ? 4.35 : 8.4, 0.055, 96),
    dark ? 0x6688ff : 0x5977e8,
    0,
    -0.34,
    0.3,
  );
  rim.scale.z = mobile ? 0.65 : 0.43;
  const mainY = mobile ? 5.25 : 2.65;
  display(0, mainY, 0.02, mobile ? 6.65 : 6.2);
  if (mobile) {
    calendar(-2.18, 1.6, -0.15, 0.119, 0.015);
    niches(2.18, 1.6, -0.02, 0.8);
    box(3.8, 0.15, 0.8, -2.18, 0.8, 0.22, pearl);
    box(2.65, 0.15, 0.8, 2.18, 0.26, 0.3, pearl);
  } else {
    calendar(-5.7, 2.0, -0.05, 0.142, 0.017);
    niches(5.65, 2.15, 0.05, 0.95);
    box(4.8, 0.22, 1.45, -5.7, 1.15, 0.15, pearl);
    box(3.35, 0.22, 1.45, 5.65, 0.57, 0.3, pearl);
    box(0.12, 1.1, 0.25, -7.7, 0.55, 0.1, dark ? 0x5e7dbb : 0xb7c8f4);
    box(0.12, 1.1, 0.25, -3.7, 0.55, 0.1, dark ? 0x5e7dbb : 0xb7c8f4);
    for (let i = 0; i < 9; i++) {
      const fin = box(0.1, 3.5 + i * 0.07, 0.25, 4.2 + i * 0.44, 2.3, -1.0);
      fin.material = glass;
    }
    // An open metal cube and glass core echo the 3D editor's spatial frame.
    const sculpture = new T.Group();
    const edgeSize = 1.12;
    const half = edgeSize / 2;
    for (let axis = 0; axis < 3; axis++) {
      for (const a of [-half, half])
        for (const b of [-half, half]) {
          const dims = [0.055, 0.055, 0.055];
          dims[axis] = edgeSize;
          const bar = new T.Mesh(
            new RoundedBoxGeometry(...dims, 2, 0.018),
            chrome,
          );
          const offsets = [a, b];
          let offset = 0;
          for (let coordinate = 0; coordinate < 3; coordinate++)
            if (coordinate !== axis)
              bar.position.setComponent(coordinate, offsets[offset++]);
          bar.castShadow = true;
          sculpture.add(bar);
        }
    }
    const core = new T.Mesh(
      new RoundedBoxGeometry(0.69, 0.69, 0.69, 3, 0.055),
      glass,
    );
    core.rotation.set(0, -0.16, 0.04);
    sculpture.add(core);
    sculpture.position.set(-6.8, 3.93, -0.3);
    sculpture.rotation.set(-0.1, 0.4, 0.12);
    scene.add(sculpture);
    box(1.35, 0.09, 0.72, -6.8, 3.22, -0.2, dark ? 0x34466c : 0xe1e8fa);
  }
  const path = new T.Mesh(
    new T.TorusGeometry(mobile ? 3.8 : 7.5, 0.025, 12, 128, Math.PI * 0.91),
    new T.MeshBasicMaterial({ color: dark ? 0x7a9aff : 0x7e9bed }),
  );
  path.rotation.set(Math.PI / 2, 0, Math.PI * 0.06);
  path.scale.y = mobile ? 0.6 : 0.37;
  path.position.set(0, 0.025, 0.35);
  scene.add(path);
}
if (advanced) {
  // Architectural lighting follows each layout; all exhibit anchors stay fixed.
  if (variant === "wall") {
    const w = mobile ? 8.7 : 16.5;
    const h = mobile ? 7.7 : 4.9;
    const y = mobile ? 3.75 : 2.35;
    accent(w - 0.18, 0.028, 0.035, 0, y + h / 2 - 0.1, -0.2);
    for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
      const trim = box(0.035, h - 0.14, 0.04, x, y, -0.2);
      trim.material = chrome;
    }
    // Soft blue glass provides a slight tint without obscuring the exhibits.
    frame(w - 0.2, h - 0.2, 0, y, -0.21);
  } else if (variant === "gallery" && !mobile) {
    accent(15.8, 0.03, 0.04, 0, 3.9, -1.17);
    accent(0.03, 0.03, 4.6, -7.88, 3.9, 1);
    for (let i = 0; i < 9; i++)
      accent(
        0.72,
        0.025,
        0.03,
        3.8 + (i % 3) * 1.12,
        0.57,
        0.28 + Math.floor(i / 3) * 1.02,
      );
  }
  if (variant === "island") {
    const rim = mesh(
      new T.CylinderGeometry(
        mobile ? 4.35 : 8.12,
        mobile ? 4.3 : 8.02,
        0.045,
        96,
      ),
      0x7189d9,
      0,
      -0.18,
      0.4,
    );
    rim.scale.z = mobile ? 0.55 : 0.44;
    rim.material = chrome;
  } else if (variant !== "pavilion") {
    accent(mobile ? 8.5 : 16.4, 0.035, 0.035, 0, -0.095, 2.62);
  }
  const blueLight = new T.PointLight(0x5c8dff, dark ? 7 : 9, 12, 2);
  blueLight.position.set(-3, 4, 2);
  scene.add(blueLight);
  const lilacLight = new T.PointLight(0xb28bff, dark ? 5 : 7, 10, 2);
  lilacLight.position.set(5, 4, 1);
  scene.add(lilacLight);
}
await document.fonts.ready;
renderer.render(scene, camera);
if (renderer.info.render.calls < 20)
  throw new Error("Scene rendered too few objects");
window.galleryReady = {
  variant,
  style: advanced ? "advanced" : "simple",
  anchors,
  labelTexts,
  decorFits: decorBounds.every((object) => {
    object.updateWorldMatrix(true, false);
    const positions = object.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const p = new T.Vector3()
        .fromBufferAttribute(positions, i)
        .applyMatrix4(object.matrixWorld)
        .project(camera);
      if (Math.abs(p.x) > 1 || Math.abs(p.y) > 1) return false;
    }
    return true;
  }),
  dark,
  mobile,
  drawCalls: renderer.info.render.calls,
  artworks: data.artworks.length,
  labelsFit: labelBounds.every(({ x, y, z, w, h }) =>
    [-1, 1].every((sx) =>
      [-1, 1].every((sy) => {
        const p = new T.Vector3(x + (sx * w) / 2, y + (sy * h) / 2, z).project(
          camera,
        );
        return p.x >= -1 && p.x <= 1 && p.y >= -1 && p.y <= 1;
      }),
    ),
  ),
};
