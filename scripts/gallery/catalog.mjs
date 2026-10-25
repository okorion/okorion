export const objects = [
  { id: "Camera_01", label: "빈티지 카메라", rotation: 0.1 },
  { id: "gamepad", label: "레트로 게임패드", rotation: 0.35 },
  { id: "rubber_duck_toy", label: "러버덕", rotation: -0.25 },
  { id: "boombox", label: "붐박스", rotation: -0.2 },
  { id: "pocket_watch", label: "회중시계", rotation: -0.2 },
  { id: "chess_set", label: "대리석 체스", rotation: 0.15 },
  { id: "carved_wooden_elephant", label: "목조 코끼리", rotation: 0.4 },
  { id: "horse_head", label: "말 조각", rotation: -0.25 },
  { id: "lambis_shell", label: "조개", rotation: 0.25 },
];
export const objectIds = objects.map((object) => object.id);
// Historical issue choices remain intact; only their displayed prop changes.
export const legacyObjectMap = new Map([
  ["sphere", "rubber_duck_toy"], ["cube", "gamepad"], ["torus", "lambis_shell"],
  ["arch", "horse_head"], ["pyramid", "chess_set"],
]);
export const archiveParts = ["portfolio", "guestbook"];
export const archiveImageSize = (part, mobile) => ({
  width: mobile ? 700 : 1200,
  height: part === "portfolio" ? (mobile ? 1300 : 590) : (mobile ? 1660 : 1100),
});
