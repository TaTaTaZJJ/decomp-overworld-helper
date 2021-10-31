import { getFileString } from "../utils/getFileString";
import { parseCIndexedObjectArray } from "../utils/parser";

export function getObjectEventInfoPointers(workspaceRoot: string) {
  const objectEventGraphicsInfoH = getFileString(
    "src/data/object_events/object_event_graphics_info_pointers.h",
    workspaceRoot
  );
  return parseCIndexedObjectArray(objectEventGraphicsInfoH, "gObjectEventGraphicsInfoPointers");
}
