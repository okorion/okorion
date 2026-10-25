import test from "node:test";
import assert from "node:assert/strict";
import {
  parseArtwork,
  selectArtworks,
  normalizeCalendar,
  validateData,
  assetForArtwork,
  guestbookSlots,
  activeArtworks,
  artworkLifetimeMs,
  artworkExpiresAt,
  formatKoreanTime,
} from "./model.mjs";
import { objects } from "./catalog.mjs";
const now = Date.parse("2026-10-25T00:00:00Z");
const body =
  "### 도형\n\n구체 (sphere)\n\n### 색상\n\n파랑 (blue)\n\n### 공개 안내\n\n- [x] 선택한 도형과 색상이 공개 README에 표시되는 데 동의합니다.";
const issue = (number, id = number) => ({
  number,
  title: "[Gallery] 오브젝트 남기기",
  state: "open",
  body,
  user: { id, type: "User" },
  created_at: "2026-10-23T00:00:00Z",
});
test("valid form accepts exact enums, not arbitrary text or code", () => {
  assert.equal(parseArtwork(issue(1)).shape, "sphere");
  for (const bad of [
    body + "\n<script>bad</script>",
    body.replace("구체 (sphere)", "$(echo bad)"),
    body.replace("[x]", "[ ]"),
    body.repeat(15),
  ])
    assert.equal(parseArtwork({ ...issue(1), body: bad }), null);
  assert.equal(parseArtwork({ ...issue(1), state: "closed" }), null);
  assert.equal(parseArtwork({ ...issue(1), pull_request: {} }), null);
  assert.equal(
    parseArtwork({ ...issue(1), user: { id: 1, type: "Bot" } }),
    null,
  );
});
test("one work per account and latest six, independent of API ordering", () => {
  const issues = [
    ...Array.from({ length: 12 }, (_, i) => issue(i + 1)),
    issue(30, 12),
  ];
  const a = selectArtworks(issues, 6, now),
    b = selectArtworks([...issues].reverse(), 6, now);
  assert.deepEqual(a, b);
  assert.equal(a.length, 6);
  assert.equal(a.at(-1).issue, 30);
  assert.equal(
    a.some((x) => x.issue === 12),
    false,
  );
  assert.deepEqual(selectArtworks([]), []);
});
test("calendar rejects fabricated/invalid counts and keeps bounded weeks", () => {
  assert.throws(() => normalizeCalendar(null));
  assert.throws(() =>
    normalizeCalendar([
      { contributionDays: [{ date: "2026-10-23", contributionCount: -1 }] },
    ]),
  );
  const weeks = normalizeCalendar(
    Array.from({ length: 40 }, () => ({
      contributionDays: [{ date: "2026-10-23", contributionCount: 3 }],
    })),
  );
  assert.equal(weeks.length, 26);
  assert.equal(weeks[0][0].count, 3);
  assert.throws(() =>
    validateData({ version: 1, weeks, artworks: [{ shape: "script" }] }),
  );
});
test("all nine approved props accept exact consent; untrusted names and URLs are rejected", () => {
  for (const asset of objects) {
    const selected = `### 소품\n\n${asset.label} (${asset.id})\n\n### 공개 안내\n\n- [x] 선택한 소품이 공개 README에 표시되는 데 동의합니다.`;
    const parsed = parseArtwork({ ...issue(50), body: selected });
    assert.equal(parsed.asset, asset.id);
    assert.equal(parsed.shape, undefined);
    assert.doesNotThrow(() => validateData({ version: 1, weeks: [], artworks: [parsed] }));
    for (const bad of [selected.replace("[x]", "[ ]"), selected + "\n### URL\n\nhttps://example.com/model.gltf", selected.replace(asset.id, "../../untrusted"), selected.replace(asset.label, "임의 소품")]) {
      assert.equal(parseArtwork({ ...issue(50), body: bad }), null);
    }
  }
});
test("old participant choices remain intact and map to approved props; latest entry wins across forms", () => {
  const old = parseArtwork(issue(20, 7));
  assert.equal(old.shape, "sphere"); assert.equal(old.color, "blue");
  assert.equal(assetForArtwork(old), "rubber_duck_toy");
  const newer = { ...issue(21, 7), body: "### 소품\n\n붐박스 (boombox)\n\n### 공개 안내\n\n- [x] 선택한 소품이 공개 README에 표시되는 데 동의합니다." };
  const selected = selectArtworks([newer, issue(20, 7)], 6, now);
  assert.equal(selected.length, 1); assert.equal(selected[0].asset, "boombox");
  assert.equal(selectArtworks([{ ...newer, state: "closed" }, issue(20, 7)], 6, now)[0].shape, "sphere");
  assert.throws(() => validateData({ version: 1, weeks: [], artworks: [{ ...old, asset: "remote-script" }] }));
});

test("props expire at exactly 72 hours; edits do not extend creation time", () => {
  const timed = (number, age) => ({ ...issue(number), created_at: new Date(now - age).toISOString(), updated_at: new Date(now).toISOString() });
  assert.equal(selectArtworks([timed(1, artworkLifetimeMs - 1)], 6, now).length, 1);
  for (const age of [artworkLifetimeMs, artworkLifetimeMs + 1, -1]) {
    assert.deepEqual(selectArtworks([timed(1, age)], 6, now), []);
  }
  assert.deepEqual(selectArtworks([{ ...issue(1), created_at: "invalid" }], 6, now), []);
  assert.throws(() => selectArtworks([], 7, now), /capacity/);
});

test("six display cases contain only active greetings and otherwise stay empty", () => {
  assert.deepEqual(guestbookSlots([], now), Array(6).fill(null));
  const item = parseArtwork(issue(1));
  const slots = guestbookSlots([item], now);
  assert.equal(slots.length, 6);
  assert.equal(slots.filter(Boolean).length, 1);
  assert.equal(slots[0].issue, 1);
  assert.deepEqual(guestbookSlots([item], Date.parse(item.createdAt) + artworkLifetimeMs), Array(6).fill(null));
  assert.equal(activeArtworks(Array.from({ length: 8 }, (_, i) => ({ ...item, issue: i + 1 })), now).length, 6);
  assert.equal(artworkExpiresAt(item), "2026-10-26T00:00:00.000Z");
  assert.equal(formatKoreanTime("2026-10-24T16:55:38Z"), "2026.10.25 01:55");
  assert.throws(() => validateData({ version: 1, weeks: [], artworks: [{ ...item, createdAt: "invalid" }] }), /Invalid artwork/);
});
