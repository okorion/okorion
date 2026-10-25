import * as T from "three";
import { GLTFLoader } from "/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "/RoomEnvironment.mjs";
import { RoundedBoxGeometry } from "/RoundedBoxGeometry.mjs";
import { objects, archiveParts } from "/catalog.mjs";
import { assetForArtwork, validateData, guestbookSlots, formatKoreanTime, artworkExpiresAt } from "/model.mjs";

const params = new URLSearchParams(location.search);
const part = params.get("part");
if (!archiveParts.includes(part)) throw new Error("Unknown archive part");
const dark = params.get("theme") === "dark";
const mobile = params.get("mobile") === "true";
document.body.classList.toggle("dark", dark);
document.body.classList.toggle("mobile", mobile);
const font = await document.fonts.load('550 25px "Pretendard Variable"', "프로젝트 소품 아카이브 최근 인사");
if (!font.length) throw new Error("Archive font failed to load");
const data = validateData(await (await fetch("/data.json")).json());
const asOf = Number(params.get("asOf") || Date.now());
if (!Number.isSafeInteger(asOf) || asOf < 0) throw new Error("Invalid gallery snapshot time");
const slots = guestbookSlots(data.artworks, asOf);
const recentEntries = slots.filter(Boolean);
const root = document.getElementById("archive");
const meta = document.createElement("div"); meta.className = "meta";
const section = document.createElement("span");
section.textContent = part === "portfolio" ? "okorion.github.io" : "소품 아카이브";
const detail = document.createElement("span");
detail.textContent = part === "portfolio" ? "프로젝트" : `진열장 6칸 · 최근 인사 ${recentEntries.length}`;
meta.append(section, detail); root.append(meta);

if (part === "portfolio") {
  const browser = document.createElement("div"); browser.className = "browser portfolio";
  const bar = document.createElement("div"); bar.className = "browser-bar"; bar.textContent = "okorion.github.io / 프로젝트";
  const image = document.createElement("img"); image.alt = "프로젝트 화면";
  image.src = `/portfolio${mobile ? "-mobile" : ""}${dark ? "-dark" : ""}.png`;
  browser.append(bar, image); root.append(browser); await image.decode();
} else {
  const grid = document.createElement("div"); grid.className = "models"; root.append(grid);
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(500, 470); renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const environment = new T.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const loader = new GLTFLoader();
  const surface = (color, metalness = 0.2, roughness = 0.3) => new T.MeshStandardMaterial({ color, metalness, roughness });
  const addBox = (scene, dimensions, position, material) => {
    const mesh = new T.Mesh(new RoundedBoxGeometry(...dimensions, 3, 0.018), material);
    mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
  };
  for (const artwork of slots) {
    const asset = artwork ? objects.find((object) => object.id === assetForArtwork(artwork)) : null;
    const scene = new T.Scene(); scene.background = new T.Color(0x151c27);
    scene.environment = environment; scene.environmentIntensity = 0.9;
    scene.add(new T.HemisphereLight(0xffffff, 0x2b3d56, 1.5));
    const key = new T.DirectionalLight(0xffffff, 3.5); key.position.set(-3, 7, 6); key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536); Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.1, far: 25 });
    key.shadow.normalBias = 0.015; key.shadow.bias = -0.0002; scene.add(key);
    const rim = new T.DirectionalLight(0xd5e5ff, 2); rim.position.set(5, 3, -3); scene.add(rim);
    const ground = new T.Mesh(new T.PlaneGeometry(30, 30), surface(0x182130, 0.1, 0.7));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    addBox(scene, [2.8, 0.32, 2.45], [0, 0.17, 0], surface(0x1c2c42, 0.35, 0.24));
    addBox(scene, [2.7, 0.055, 2.35], [0, 0.36, 0], surface(0x34475f, 0.65, 0.2));
    const glass = new T.MeshPhysicalMaterial({ color: 0xc9ddf8, transparent: true, opacity: 0.055, roughness: 0.04, metalness: 0.1, depthWrite: false, side: T.DoubleSide });
    addBox(scene, [0.024, 2.4, 2.45], [-1.42, 1.59, 0], glass);
    addBox(scene, [0.024, 2.4, 2.45], [1.42, 1.59, 0], glass);
    addBox(scene, [2.84, 0.024, 2.45], [0, 2.8, 0], glass);
    if (asset) {
    const object = (await loader.loadAsync(`/objects/${asset.id}/${asset.id}.gltf`)).scene;
    const bounds = new T.Box3().setFromObject(object); const size = bounds.getSize(new T.Vector3());
    const center = bounds.getCenter(new T.Vector3()); const scale = 1.95 / Math.max(size.x, size.y, size.z);
    object.scale.setScalar(scale); object.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    const group = new T.Group(); group.add(object); group.position.y = 0.4; group.rotation.y = asset.rotation; scene.add(group);
    object.traverse((node) => { if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; } });
    }
    const camera = new T.PerspectiveCamera(34, 500 / 470, 0.1, 100);
    camera.position.set(3.9, 3.0, 5.8); camera.lookAt(0, 1.25, 0);
    await renderer.compileAsync(scene, camera); renderer.render(scene, camera);
    const figure = document.createElement("figure"); figure.className = "item";
    const image = document.createElement("img"); image.src = renderer.domElement.toDataURL("image/png"); image.alt = asset ? asset.label : "인사가 없는 빈 유리 진열장";
    const caption = document.createElement("figcaption"); caption.append(document.createTextNode(asset ? asset.label : "빈 진열장"));
    const status = document.createElement("span"); status.className = `status${artwork ? " received" : ""}`;
    status.textContent = artwork ? `작성 ${formatKoreanTime(artwork.createdAt).slice(5)} KST` : "인사를 기다리는 중"; caption.append(status);
    const expires = document.createElement("span"); expires.className = "timestamp";
    expires.textContent = artwork ? `종료 ${formatKoreanTime(artworkExpiresAt(artwork)).slice(5)} KST` : "소품 9종 중 하나 고르기"; caption.append(expires);
    figure.append(image, caption); grid.append(figure); await image.decode();
  }
  const credit = document.createElement("div"); credit.className = "credit";
  for (const text of ["남긴 소품은 작성 후 3일 동안 전시됩니다.", "모델 · Poly Haven / CC0"]) { const span = document.createElement("span"); span.textContent = text; credit.append(span); }
  root.append(credit); renderer.dispose();
}
await document.fonts.ready;
const labelsFit = [...root.querySelectorAll("figcaption,.meta,.credit")].every((element) => element.scrollWidth <= element.clientWidth + 1);
window.galleryReady = {
  part, objects: part === "guestbook" ? recentEntries.map(assetForArtwork) : [],
  slots: part === "guestbook" ? slots.length : 0,
  emptySlots: slots.filter((artwork) => !artwork).length,
  recentEntries: recentEntries.length, labelsFit,
  contentFits: part === "portfolio" || root.getBoundingClientRect().bottom <= innerHeight,
  typography: "Pretendard Variable",
};
