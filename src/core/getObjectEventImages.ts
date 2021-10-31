import { getFileString } from "../utils/getFileString";
import { parseCObjectArray, parseIncBin, purgeSpaceAndLineBreak } from "../utils/parser";
import * as fs from "fs";
import * as path from "path";

export function getObjectEventImages(pictureTablePointer: string, workspaceRoot: string) {
  const objectEventsPicTablesH = getFileString("src/data/object_events/object_event_pic_tables.h", workspaceRoot);
  const objectEventGraphicsH = getFileString("src/data/object_events/object_event_graphics.h", workspaceRoot);

  const parsedData = parseCObjectArray(objectEventsPicTablesH, pictureTablePointer);

  const overworldFramesStr = purgeSpaceAndLineBreak(parsedData.body)
    .split("),")
    .filter((x) => x);

  const regex = /overworld_frame\((\b\w+\b),\s*(\d+),\s*(\d+),\s*(\d+)/;
  const overworldFrames = overworldFramesStr.map((str) => {
    const match = str.match(regex);
    if (!match) {
      throw Error(`${str} is an invalid overworld frame.`);
    }
    return {
      ptr: match[1],
      width: match[2],
      height: match[3],
      frame: match[4],
    };
  });

  const removeDDuplicate = [...new Set(overworldFrames.map((i) => i.ptr))];
  const incBins = removeDDuplicate.map((pointer) => parseIncBin(objectEventGraphicsH, pointer));

  const imageBase64s = incBins.map((i) =>
    "data:image/png;base64, " + fs.readFileSync(path.join(workspaceRoot, i.path.replace(".4bpp", ".png")), { encoding: "base64" })
  );

  return imageBase64s;
}
