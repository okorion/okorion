import { objectIds } from "../scripts/gallery/catalog.mjs";
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validSubmission(input) {
  return input && typeof input === "object" && !Array.isArray(input) &&
    Object.keys(input).every((key) => ["asset", "requestId", "token", "consent"].includes(key)) &&
    objectIds.includes(input.asset) && uuidPattern.test(input.requestId) && input.consent === true &&
    typeof input.token === "string" && input.token.length > 0 && input.token.length <= 2048;
}
