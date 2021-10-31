import { getFileString } from "../utils/getFileString";
import { parseCDefines } from "../utils/parser";

export function getTracks(workspaceRoot: string) {
  // load object event define list
  const objectEventsH = getFileString("include/constants/event_objects.h", workspaceRoot);
  const tracks = parseCDefines(objectEventsH, "TRACKS_");

  return tracks.map((s) => s.symbol);
}
