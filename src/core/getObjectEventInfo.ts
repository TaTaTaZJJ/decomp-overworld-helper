import { getFileString } from "../utils/getFileString";
import { parseCObject, purgeCurlyBracket, purgeSpaceAndLineBreak } from "../utils/parser";

const OBJECT_EVENT_GRAPHICS_INFO_PATH = "src/data/object_events/object_event_graphics_info.h";

export type ObjectEventInfo = {
  tileTag: string;
  paletteTag1: string;
  paletteTag2: string;
  size: string;
  width: string;
  height: string;
  paletteSlot: string;
  shadowSize: string;
  inanimate: string;
  disableReflectionPaletteLoad: string;
  tracks: string;
  oam: string;
  subspriteTables: string;
  anims: string;
  images: string;
  affineAnims: string;
};

const indexKeys = [
  "tileTag",
  "paletteTag1",
  "paletteTag2",
  "size",
  "width",
  "height",
  "paletteSlot",
  "shadowSize",
  "inanimate",
  "disableReflectionPaletteLoad",
  "tracks",
  "oam",
  "subspriteTables",
  "anims",
  "images",
  "affineAnims",
];

export function getObjectEventInfo(pointer: string, workspaceRoot: string) {
  const objectEventGraphicsInfoH = getFileString(OBJECT_EVENT_GRAPHICS_INFO_PATH, workspaceRoot);
  const parsedData = parseCObject(objectEventGraphicsInfoH, pointer);
  if (parsedData.length === 0) {
    throw Error(`${pointer} not found in ${OBJECT_EVENT_GRAPHICS_INFO_PATH}.`);
  }
  if (parsedData.length > 1) {
    throw Error(`Duplicate ${pointer} found in ${OBJECT_EVENT_GRAPHICS_INFO_PATH}.`);
  }
  const toReplaceStr = parsedData[0].match;
  const raw = purgeCurlyBracket(purgeSpaceAndLineBreak(parsedData[0].value)).split(",");

  const data: ObjectEventInfo = {
    tileTag: "",
    paletteTag1: "",
    paletteTag2: "",
    size: "",
    width: "",
    height: "",
    paletteSlot: "",
    shadowSize: "",
    inanimate: "",
    disableReflectionPaletteLoad: "",
    tracks: "",
    oam: "",
    subspriteTables: "",
    anims: "",
    images: "",
    affineAnims: "",
  };

  raw.forEach((r, i) => {
    if (i >= indexKeys.length) {
      throw Error(`Unidentified graphic info at "${pointer}".`);
    }
    if (r.includes("=")) {
      const splitted = r.split("=");
      const key = splitted[0].replace(".", "");
      const value = splitted[1];
      if (indexKeys.indexOf(key) === -1) {
        throw Error(`Unidentified graphic info field "${key}" at "${pointer}".`);
      }
      data[key as keyof typeof data] = value;
    } else {
      const key = indexKeys[i];
      const value = r;
      data[key as keyof typeof data] = value;
    }
  });

  return {
    toReplaceStr,
    data,
  };
}
