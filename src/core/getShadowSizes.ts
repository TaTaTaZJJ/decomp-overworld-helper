import { getFileString } from "../utils/getFileString";
import { parseCDefines } from "../utils/parser";

export function getShadowSizes(workspaceRoot: string) {
  // load object event define list
  const objectEventsH = getFileString("include/constants/event_objects.h", workspaceRoot);
  const shadowSizes = parseCDefines(objectEventsH, "SHADOW_SIZE_");

  return shadowSizes.map((s) => s.symbol);
}
