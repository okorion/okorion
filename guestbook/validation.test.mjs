import test from "node:test";
import assert from "node:assert/strict";
import { validSubmission } from "./validation.mjs";
const valid = { asset: "lambis_shell", requestId: "9021245a-47a1-46a3-9619-191c3de715ec", token: "local-test", consent: true };
test("submission accepts only chosen assets, explicit consent and a bounded token", () => {
  assert.ok(validSubmission(valid));
  for (const bad of [null, [], { ...valid, asset: "../../secret" }, { ...valid, consent: false }, { ...valid, createdAt: "2026-01-01" }, { ...valid, token: "" }, { ...valid, token: "x".repeat(2049) }, { ...valid, requestId: "not-a-request-id" }]) assert.ok(!validSubmission(bad));
});
