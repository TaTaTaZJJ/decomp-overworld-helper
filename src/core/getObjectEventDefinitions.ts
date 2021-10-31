import { getFileString } from "../utils/getFileString";
import { parseCDefines } from "../utils/parser";

export function getObjectEventDefinitions(workspaceRoot: string) {
  // load object event define list
  const objectEventsH = getFileString("include/constants/event_objects.h", workspaceRoot);
  const objectEventsDefines = parseCDefines(objectEventsH);

  const sanitizedObjectEvents = objectEventsDefines.filter(
    (define) =>
      define.symbol.includes("OBJ_EVENT_GFX_") &&
      !define.value.includes("OBJ_EVENT_GFX_VARS") &&
      !define.value.includes("NUM_OBJ_EVENT_GFX") &&
      define.symbol !== "NUM_OBJ_EVENT_GFX"
  );

  const totalObjectEvent = objectEventsDefines.find((define) => define.symbol === "NUM_OBJ_EVENT_GFX");
  if (!totalObjectEvent) {
    throw Error("Missing NUM_OBJ_EVENT_GFX definition");
  }

  return { objectEvent: sanitizedObjectEvents, totalObjectEvent: totalObjectEvent.value };
}
