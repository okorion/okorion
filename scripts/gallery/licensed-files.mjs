import { readFile } from "node:fs/promises";
// Exact original models and material files approved on 2026-10-25.
// Literal readers prevent source metadata from selecting arbitrary local files.
const licensedObjectReaders = new Map([
  ["assets/gallery/objects/Camera_01/textures/Camera_01_lens_body_arm_1k.jpg", () => readFile("assets/gallery/objects/Camera_01/textures/Camera_01_lens_body_arm_1k.jpg")],
  ["assets/gallery/objects/Camera_01/textures/Camera_01_body_diff_1k.jpg", () => readFile("assets/gallery/objects/Camera_01/textures/Camera_01_body_diff_1k.jpg")],
  ["assets/gallery/objects/Camera_01/textures/Camera_01_strap_arm_1k.jpg", () => readFile("assets/gallery/objects/Camera_01/textures/Camera_01_strap_arm_1k.jpg")],
  ["assets/gallery/objects/Camera_01/textures/Camera_01_lens_body_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/Camera_01/textures/Camera_01_lens_body_nor_gl_1k.jpg")],
  ["assets/gallery/objects/Camera_01/Camera_01.bin", () => readFile("assets/gallery/objects/Camera_01/Camera_01.bin")],
  ["assets/gallery/objects/Camera_01/textures/Camera_01_lens_body_diff_1k.jpg", () => readFile("assets/gallery/objects/Camera_01/textures/Camera_01_lens_body_diff_1k.jpg")],
  ["assets/gallery/objects/Camera_01/textures/Camera_01_body_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/Camera_01/textures/Camera_01_body_nor_gl_1k.jpg")],
  ["assets/gallery/objects/Camera_01/textures/Camera_01_body_arm_1k.jpg", () => readFile("assets/gallery/objects/Camera_01/textures/Camera_01_body_arm_1k.jpg")],
  ["assets/gallery/objects/Camera_01/textures/Camera_01_strap_diff_1k.jpg", () => readFile("assets/gallery/objects/Camera_01/textures/Camera_01_strap_diff_1k.jpg")],
  ["assets/gallery/objects/Camera_01/textures/Camera_01_strap_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/Camera_01/textures/Camera_01_strap_nor_gl_1k.jpg")],
  ["assets/gallery/objects/gamepad/textures/gamepad_diff_1k.jpg", () => readFile("assets/gallery/objects/gamepad/textures/gamepad_diff_1k.jpg")],
  ["assets/gallery/objects/gamepad/gamepad.bin", () => readFile("assets/gallery/objects/gamepad/gamepad.bin")],
  ["assets/gallery/objects/gamepad/textures/gamepad_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/gamepad/textures/gamepad_nor_gl_1k.jpg")],
  ["assets/gallery/objects/gamepad/textures/gamepad_arm_1k.jpg", () => readFile("assets/gallery/objects/gamepad/textures/gamepad_arm_1k.jpg")],
  ["assets/gallery/objects/rubber_duck_toy/textures/rubber_duck_toy_diff_1k.jpg", () => readFile("assets/gallery/objects/rubber_duck_toy/textures/rubber_duck_toy_diff_1k.jpg")],
  ["assets/gallery/objects/rubber_duck_toy/rubber_duck_toy.bin", () => readFile("assets/gallery/objects/rubber_duck_toy/rubber_duck_toy.bin")],
  ["assets/gallery/objects/rubber_duck_toy/textures/rubber_duck_toy_arm_1k.jpg", () => readFile("assets/gallery/objects/rubber_duck_toy/textures/rubber_duck_toy_arm_1k.jpg")],
  ["assets/gallery/objects/rubber_duck_toy/textures/rubber_duck_toy_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/rubber_duck_toy/textures/rubber_duck_toy_nor_gl_1k.jpg")],
  ["assets/gallery/objects/boombox/textures/boombox_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/boombox/textures/boombox_nor_gl_1k.jpg")],
  ["assets/gallery/objects/boombox/textures/boombox_speakers_arm_1k.jpg", () => readFile("assets/gallery/objects/boombox/textures/boombox_speakers_arm_1k.jpg")],
  ["assets/gallery/objects/boombox/textures/boombox_diff_1k.jpg", () => readFile("assets/gallery/objects/boombox/textures/boombox_diff_1k.jpg")],
  ["assets/gallery/objects/boombox/boombox.bin", () => readFile("assets/gallery/objects/boombox/boombox.bin")],
  ["assets/gallery/objects/boombox/textures/boombox_speakers_diff_1k.jpg", () => readFile("assets/gallery/objects/boombox/textures/boombox_speakers_diff_1k.jpg")],
  ["assets/gallery/objects/boombox/textures/boombox_arm_1k.jpg", () => readFile("assets/gallery/objects/boombox/textures/boombox_arm_1k.jpg")],
  ["assets/gallery/objects/pocket_watch/textures/pocket_watch_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/pocket_watch/textures/pocket_watch_nor_gl_1k.jpg")],
  ["assets/gallery/objects/pocket_watch/textures/pocket_watch_diff_1k.jpg", () => readFile("assets/gallery/objects/pocket_watch/textures/pocket_watch_diff_1k.jpg")],
  ["assets/gallery/objects/pocket_watch/textures/pocket_watch_arm_1k.jpg", () => readFile("assets/gallery/objects/pocket_watch/textures/pocket_watch_arm_1k.jpg")],
  ["assets/gallery/objects/pocket_watch/textures/pocket_watch_glass_rough_1k.jpg", () => readFile("assets/gallery/objects/pocket_watch/textures/pocket_watch_glass_rough_1k.jpg")],
  ["assets/gallery/objects/pocket_watch/pocket_watch.bin", () => readFile("assets/gallery/objects/pocket_watch/pocket_watch.bin")],
  ["assets/gallery/objects/chess_set/textures/chess_set_pieces_white_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/chess_set/textures/chess_set_pieces_white_nor_gl_1k.jpg")],
  ["assets/gallery/objects/chess_set/textures/chess_set_pieces_black_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/chess_set/textures/chess_set_pieces_black_nor_gl_1k.jpg")],
  ["assets/gallery/objects/chess_set/textures/chess_set_pieces_black_arm_1k.jpg", () => readFile("assets/gallery/objects/chess_set/textures/chess_set_pieces_black_arm_1k.jpg")],
  ["assets/gallery/objects/chess_set/textures/chess_set_board_diff_1k.jpg", () => readFile("assets/gallery/objects/chess_set/textures/chess_set_board_diff_1k.jpg")],
  ["assets/gallery/objects/chess_set/textures/chess_set_board_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/chess_set/textures/chess_set_board_nor_gl_1k.jpg")],
  ["assets/gallery/objects/chess_set/textures/chess_set_board_arm_1k.jpg", () => readFile("assets/gallery/objects/chess_set/textures/chess_set_board_arm_1k.jpg")],
  ["assets/gallery/objects/chess_set/chess_set.bin", () => readFile("assets/gallery/objects/chess_set/chess_set.bin")],
  ["assets/gallery/objects/chess_set/textures/chess_set_pieces_white_arm_1k.jpg", () => readFile("assets/gallery/objects/chess_set/textures/chess_set_pieces_white_arm_1k.jpg")],
  ["assets/gallery/objects/chess_set/textures/chess_set_pieces_black_diff_1k.jpg", () => readFile("assets/gallery/objects/chess_set/textures/chess_set_pieces_black_diff_1k.jpg")],
  ["assets/gallery/objects/chess_set/textures/chess_set_pieces_white_diff_1k.jpg", () => readFile("assets/gallery/objects/chess_set/textures/chess_set_pieces_white_diff_1k.jpg")],
  ["assets/gallery/objects/carved_wooden_elephant/textures/carved_wooden_elephant_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/carved_wooden_elephant/textures/carved_wooden_elephant_nor_gl_1k.jpg")],
  ["assets/gallery/objects/carved_wooden_elephant/textures/carved_wooden_elephant_rough_1k.jpg", () => readFile("assets/gallery/objects/carved_wooden_elephant/textures/carved_wooden_elephant_rough_1k.jpg")],
  ["assets/gallery/objects/carved_wooden_elephant/textures/carved_wooden_elephant_diff_1k.jpg", () => readFile("assets/gallery/objects/carved_wooden_elephant/textures/carved_wooden_elephant_diff_1k.jpg")],
  ["assets/gallery/objects/carved_wooden_elephant/carved_wooden_elephant.bin", () => readFile("assets/gallery/objects/carved_wooden_elephant/carved_wooden_elephant.bin")],
  ["assets/gallery/objects/horse_head/textures/horse_head_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/horse_head/textures/horse_head_nor_gl_1k.jpg")],
  ["assets/gallery/objects/horse_head/textures/horse_head_diff_1k.jpg", () => readFile("assets/gallery/objects/horse_head/textures/horse_head_diff_1k.jpg")],
  ["assets/gallery/objects/horse_head/textures/horse_head_arm_1k.jpg", () => readFile("assets/gallery/objects/horse_head/textures/horse_head_arm_1k.jpg")],
  ["assets/gallery/objects/horse_head/horse_head.bin", () => readFile("assets/gallery/objects/horse_head/horse_head.bin")],
  ["assets/gallery/objects/lambis_shell/lambis_shell.bin", () => readFile("assets/gallery/objects/lambis_shell/lambis_shell.bin")],
  ["assets/gallery/objects/lambis_shell/textures/lambis_shell_diff_1k.jpg", () => readFile("assets/gallery/objects/lambis_shell/textures/lambis_shell_diff_1k.jpg")],
  ["assets/gallery/objects/lambis_shell/textures/lambis_shell_arm_1k.jpg", () => readFile("assets/gallery/objects/lambis_shell/textures/lambis_shell_arm_1k.jpg")],
  ["assets/gallery/objects/lambis_shell/textures/lambis_shell_nor_gl_1k.jpg", () => readFile("assets/gallery/objects/lambis_shell/textures/lambis_shell_nor_gl_1k.jpg")],
  ["assets/gallery/objects/Camera_01/Camera_01.gltf", () => readFile("assets/gallery/objects/Camera_01/Camera_01.gltf")],
  ["assets/gallery/objects/gamepad/gamepad.gltf", () => readFile("assets/gallery/objects/gamepad/gamepad.gltf")],
  ["assets/gallery/objects/rubber_duck_toy/rubber_duck_toy.gltf", () => readFile("assets/gallery/objects/rubber_duck_toy/rubber_duck_toy.gltf")],
  ["assets/gallery/objects/boombox/boombox.gltf", () => readFile("assets/gallery/objects/boombox/boombox.gltf")],
  ["assets/gallery/objects/pocket_watch/pocket_watch.gltf", () => readFile("assets/gallery/objects/pocket_watch/pocket_watch.gltf")],
  ["assets/gallery/objects/chess_set/chess_set.gltf", () => readFile("assets/gallery/objects/chess_set/chess_set.gltf")],
  ["assets/gallery/objects/carved_wooden_elephant/carved_wooden_elephant.gltf", () => readFile("assets/gallery/objects/carved_wooden_elephant/carved_wooden_elephant.gltf")],
  ["assets/gallery/objects/horse_head/horse_head.gltf", () => readFile("assets/gallery/objects/horse_head/horse_head.gltf")],
  ["assets/gallery/objects/lambis_shell/lambis_shell.gltf", () => readFile("assets/gallery/objects/lambis_shell/lambis_shell.gltf")],
]);
export const licensedObjectFilePaths = new Set(
  [...licensedObjectReaders.keys()].filter((path) => !path.endsWith(".gltf")),
);
export async function readLicensedObjectFile(path) {
  const reader = licensedObjectReaders.get(path);
  if (!reader) throw new Error("Unapproved model file");
  return reader();
}
const archiveImageReaders = new Map([
  ["assets/gallery/archive-portfolio-light.png", () => readFile("assets/gallery/archive-portfolio-light.png")],
  ["assets/gallery/archive-portfolio-mobile-light.png", () => readFile("assets/gallery/archive-portfolio-mobile-light.png")],
  ["assets/gallery/archive-portfolio-dark.png", () => readFile("assets/gallery/archive-portfolio-dark.png")],
  ["assets/gallery/archive-portfolio-mobile-dark.png", () => readFile("assets/gallery/archive-portfolio-mobile-dark.png")],
  ["assets/gallery/archive-guestbook-light.png", () => readFile("assets/gallery/archive-guestbook-light.png")],
  ["assets/gallery/archive-guestbook-mobile-light.png", () => readFile("assets/gallery/archive-guestbook-mobile-light.png")],
  ["assets/gallery/archive-guestbook-dark.png", () => readFile("assets/gallery/archive-guestbook-dark.png")],
  ["assets/gallery/archive-guestbook-mobile-dark.png", () => readFile("assets/gallery/archive-guestbook-mobile-dark.png")],
]);
export async function readArchiveImage(path) {
  const reader = archiveImageReaders.get(path);
  if (!reader) throw new Error("Unknown archive image");
  return reader();
}
