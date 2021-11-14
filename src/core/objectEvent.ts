import * as path from "path";
import * as fs from "fs";
import * as config from "../config/pokeemerald.json";
import { TreeItem, TreeItemCollapsibleState, window } from "vscode";
import { getFileString, writeFileString } from "../utils/getFileString";
import {
  parseCIndexedObjectArray,
  parseCObject,
  parseCObjectArray,
  parseIncBin,
  parseObjectEventGfxMk,
  purgeCurlyBracket,
  purgeSpaceAndLineBreak,
} from "../utils/parser";
import { getObjectEventDefinitions } from "./getObjectEventDefinitions";
import { camelCase, snakeCase, upperFirst } from "lodash";

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

const objectInfoKeys = [
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

// TODO: Add pokefirered pokeruby support

export class ObjectEvent extends TreeItem {
  constructor(
    public readonly definition: string,
    public readonly id: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly workspaceRoot: string
  ) {
    super(definition.replace("OBJ_EVENT_GFX_", ""), collapsibleState);
    this.tooltip = `${this.label}-${this.id}`;
    this.description = this.id;
  }

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "light", "dependency.svg"),
    dark: path.join(__filename, "..", "..", "resources", "dark", "dependency.svg"),
  };

  contextValue = "objectEvent";

  /* -------------------------------------------------------------------------- */
  /*                       Data that parsed from workspace                      */
  /* -------------------------------------------------------------------------- */
  graphicsInfoPointer?: string;
  objectEventInfo?: ObjectEventInfo;
  images?: string[]; // image stored in base64 encoding, not sure there is better way to load picture on webview
  imageTables?: {
    type: string;
    ptr: string;
    width?: string;
    height?: string;
    frame?: string;
  }[];

  /* -------------------------------------------------------------------------- */
  /*                       Raw text parsed from workspace                       */
  /* -------------------------------------------------------------------------- */
  objectEventInfoStr?: string;
  objectEventInfoPointerStr?: string;

  /* -------------------------------------------------------------------------- */
  /*                                   Methods                                  */
  /* -------------------------------------------------------------------------- */
  private _getGraphicsInfoPointers() {
    const objectEventGraphicsInfoH = getFileString(config["object_event_graphics_info_pointers.h"], this.workspaceRoot);
    return parseCIndexedObjectArray(objectEventGraphicsInfoH, "gObjectEventGraphicsInfoPointers");
  }

  private _getGraphicsInfoPointer() {
    const pointer = this._getGraphicsInfoPointers().items.find((item) => item.index === this.definition);
    if (!pointer) {
      throw Error("Missing pointer for this entry.");
    }
    this.graphicsInfoPointer = pointer.value;
    return pointer.value.replace("&", "");
  }

  private _getObjectEventInfo() {
    const objectEventGraphicsInfoH = getFileString(config["object_event_graphics_info.h"], this.workspaceRoot);
    const pointer = this._getGraphicsInfoPointer();
    const parsedData = parseCObject(objectEventGraphicsInfoH, "const struct ObjectEventGraphicsInfo " + pointer);

    if (parsedData.length === 0) {
      throw Error(`${pointer} not found in ${config["object_event_graphics_info.h"]}.`);
    }
    if (parsedData.length > 1) {
      throw Error(`Duplicate ${pointer} found in ${config["object_event_graphics_info.h"]}.`);
    }

    this.objectEventInfoStr = parsedData[0].match;
    this.objectEventInfoPointerStr = `const struct ObjectEventGraphicsInfo ${pointer};`;
    const raw = purgeCurlyBracket(purgeSpaceAndLineBreak(parsedData[0].value)).split(",");

    this.objectEventInfo = {
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
      if (!this.objectEventInfo) {
        throw Error("Object Event Info is not initialized.");
      }

      if (i >= objectInfoKeys.length) {
        throw Error(`Unidentified graphic info key at "${pointer}", index=${i}.`);
      }

      if (r.includes("=")) {
        const splitted = r.split("=");
        const key = splitted[0].replace(".", "");
        const value = splitted[1];

        if (objectInfoKeys.indexOf(key) === -1) {
          throw Error(`Missing graphic info field "${key}" at "${pointer}".`);
        }

        this.objectEventInfo[key as keyof typeof this.objectEventInfo] = value;
      } else {
        /** Handle case if object key is not provided */
        const key = objectInfoKeys[i];
        const value = r;
        this.objectEventInfo[key as keyof typeof this.objectEventInfo] = value;
      }
    });
    return this.objectEventInfo;
  }

  private _getObjectEventImages() {
    const imageTablePointer = this.objectEventInfo?.images;
    if (!imageTablePointer) {
      throw Error("Missing image table pointer.");
    }
    const objectEventsPicTablesH = getFileString(config["object_event_pic_tables.h"], this.workspaceRoot);
    const objectEventGraphicsH = getFileString(config["object_event_graphics.h"], this.workspaceRoot);

    const parsedData = parseCObjectArray(
      objectEventsPicTablesH,
      `static const struct SpriteFrameImage ${imageTablePointer}`
    );

    const overworldFramesStr = purgeSpaceAndLineBreak(parsedData.body)
      .split("),")
      .filter((x) => x);

    const regex = /(obj_frame_tiles)\((\b\w+\b)|(overworld_frame)\((\b\w+\b),\s*(\d+),\s*(\d+),\s*(\d+)/;

    this.imageTables = overworldFramesStr.map((str) => {
      const match = str.match(regex);
      if (!match) {
        throw Error(`${str} is an invalid overworld frame or object frame tiles.`);
      }
      const isObjectFrameTiles = match[1] === "obj_frame_tiles";

      return {
        type: match[1],
        ptr: isObjectFrameTiles ? match[2] : match[4],
        width: isObjectFrameTiles ? undefined : match[5],
        height: isObjectFrameTiles ? undefined : match[6],
        frame: isObjectFrameTiles ? undefined : match[7],
      };
    });

    const removeDuplicate = [...new Set(this.imageTables.map((i) => i.ptr))];
    const picIncBins = removeDuplicate.map((pointer) => parseIncBin(objectEventGraphicsH, `const u32 ${pointer}`));

    this.images = picIncBins.map(
      (i) =>
        "data:image/png;base64, " +
        fs.readFileSync(path.join(this.workspaceRoot, i.path.replace(".4bpp", ".png")), { encoding: "base64" })
    );

    return { images: this.images, imageTables: this.imageTables, imageStr: parsedData.match, picIncBins };
  }

  getDataFromWorkspace() {
    const info = this._getObjectEventInfo();
    const { images, imageTables } = this._getObjectEventImages();
    return {
      info,
      images,
      imageTables,
    };
  }

  setDataToWorkspace(newObjectEventData: ObjectEventInfo) {
    const info = this._getObjectEventInfo();
    const infoStr: string[] = [];
    for (let index = 0; index < objectInfoKeys.length; index++) {
      const key = objectInfoKeys[index];
      infoStr.push(newObjectEventData[key as keyof ObjectEventInfo]);
    }
    const replaceStr = `const struct ObjectEventGraphicsInfo ${this.graphicsInfoPointer?.replace(
      "&",
      ""
    )} = {${infoStr.join(", ")}};`;
    let objectEventGraphicsInfoH = getFileString(config["object_event_graphics_info.h"], this.workspaceRoot);
    objectEventGraphicsInfoH = objectEventGraphicsInfoH.replace(this.objectEventInfoStr || "", replaceStr);
    writeFileString(objectEventGraphicsInfoH, config["object_event_graphics_info.h"], this.workspaceRoot);
    window.showInformationMessage(`${this.definition} related data has been saved.`);
  }

  deleteFromWorkspace() {
    const info = this._getObjectEventInfo();
    const { imageStr, picIncBins } = this._getObjectEventImages();
    let objectEventsPicTablesH = getFileString(config["object_event_pic_tables.h"], this.workspaceRoot);
    let objectEventGraphicsH = getFileString(config["object_event_graphics.h"], this.workspaceRoot);
    let objectEventGraphicsInfoH = getFileString(config["object_event_graphics_info.h"], this.workspaceRoot);
    let objectEventGraphicsInfoPointersH = getFileString(
      config["object_event_graphics_info_pointers.h"],
      this.workspaceRoot
    );

    // Clear object event info and pointers
    objectEventGraphicsInfoH = objectEventGraphicsInfoH.replace(this.objectEventInfoStr || "", "");
    objectEventGraphicsInfoPointersH = objectEventGraphicsInfoPointersH.replace(
      this.objectEventInfoPointerStr || "",
      ""
    );
    const regex = new RegExp(`\\[${this.definition}\\]\\s*=\\s*${this.graphicsInfoPointer},`);
    objectEventGraphicsInfoPointersH = objectEventGraphicsInfoPointersH.replace(regex, "");

    // Clear object event pic tables text
    objectEventsPicTablesH = objectEventsPicTablesH.replace(imageStr, "");

    // Clear object event pic inc bins
    picIncBins.forEach((bin) => {
      objectEventGraphicsH = objectEventGraphicsH.replace(bin.match, "");
    });

    let spriteSheetMk = getFileString(config["spritesheet_rules.mk"], this.workspaceRoot);
    // Clear spritesheet mk
    picIncBins.forEach((bin) => {
      const parsed = parseObjectEventGfxMk(spriteSheetMk, bin.path);
      spriteSheetMk = spriteSheetMk.replace(parsed.match, "");
    });

    writeFileString(
      objectEventGraphicsInfoPointersH,
      config["object_event_graphics_info_pointers.h"],
      this.workspaceRoot
    );
    writeFileString(objectEventGraphicsInfoH, config["object_event_graphics_info.h"], this.workspaceRoot);
    writeFileString(objectEventsPicTablesH, config["object_event_pic_tables.h"], this.workspaceRoot);
    writeFileString(objectEventGraphicsH, config["object_event_graphics.h"], this.workspaceRoot);
    writeFileString(spriteSheetMk, config["spritesheet_rules.mk"], this.workspaceRoot);
    window.showInformationMessage(`${this.definition} related data has been deleted, but the definition will be kept.`);
  }

  private static _generateFrames(objectEventPicSymbol: string, width: number, height: number, count: number) {
    const framesArr: string[] = [];
    for (let index = 0; index < count; index++) {
      framesArr.push(`overworld_frame(${objectEventPicSymbol}, ${width / 8}, ${height / 8}, ${index})`);
    }
    return framesArr.join(",\n\t");
  }

  private static _generateFramesObject(
    objectEventPicTableSymbol: string,
    objectEventPicSymbol: string,
    width: number,
    height: number,
    count: number
  ) {
    return `\nstatic const struct SpriteFrameImage ${objectEventPicTableSymbol}[] = {\n\t${this._generateFrames(
      objectEventPicSymbol,
      width,
      height,
      count
    )}\n};\n`;
  }

  private static _generateSpriteSheetRule(path: string, width: number, height: number) {
    return `${path}: %.4bpp: %.png\n\t$(GFX) $< $@ -mwidth ${width / 8} -mheight ${height / 8}`;
  }

  private static _generateObjectEventGraphicsInfo(
    objectEventGraphicsInfoSymbol: string,
    objectEventPicTableSymbol: string,
    paletteTag1: string,
    width: number,
    height: number
  ) {
    return `const struct ObjectEventGraphicsInfo ${objectEventGraphicsInfoSymbol} = { 0xFFFF, ${paletteTag1}, OBJ_EVENT_PAL_TAG_NONE, ${
      (width * height * 4) / 8
    }, ${width}, ${height}, 0, SHADOW_SIZE_M, FALSE, FALSE, TRACKS_FOOT, &gObjectEventBaseOam_${width}x${height}, sOamTables_${width}x${height}, sAnimTable_Standard, ${objectEventPicTableSymbol}, gDummySpriteAffineAnimTable};`;
  }

  // TODO refactor: detach create into functions to increase readability
  static async create(workspaceRoot: string) {
    const nameStr = await window.showInputBox({
      title: "Name",
      validateInput: (v) => (v ? null : "Name is required, eq.: Test"),
    });
    const sizeStr = await window.showInputBox({
      title: "Width x Height",
      placeHolder: "32x32",
      value: "32x32",
      validateInput: (v) => (/\d+x\d+/.test(v) ? null : "Size should be in format of {WIDTH}x{HEIGHT}, eg.: 32x32"),
    });
    const framesStr = await window.showInputBox({
      title: "Frames",
      placeHolder: "9",
      value: "9",
      validateInput: (v) => (/\d+/.test(v) ? null : "Frames should be in a number greater than 0, eg.: 9"),
    });
    const paletteStr = await window.showInputBox({
      title: "Use existing palette tag(optional)",
      placeHolder: "",
      value: "",
    });

    if (!nameStr || !sizeStr || !framesStr) {
      return;
    }

    // Naming
    const nameInUpperSnakecase = snakeCase(nameStr).toUpperCase();
    const nameInLowerSnakecase = snakeCase(nameStr).toLowerCase();
    const nameInCamelcase = camelCase(nameInUpperSnakecase);
    const nameInUpperFirstCamelcase = upperFirst(nameInCamelcase);

    // create definition
    const objectEventGfxDefinitionSymbol = `OBJ_EVENT_GFX_${nameInUpperSnakecase}`;
    const { totalObjectEvent: newDefinitionId, objectEvents } = getObjectEventDefinitions(workspaceRoot);
    const newTotalObjectEvent = Number(newDefinitionId) + 1;
    const newObjectEvent = new ObjectEvent(
      objectEventGfxDefinitionSymbol,
      newDefinitionId,
      TreeItemCollapsibleState.None,
      workspaceRoot
    );

    let eventObjectsH = getFileString(config["event_objects.h"], workspaceRoot);
    let lastObjectEventDefinition = objectEvents[objectEvents.length - 1].match;

    eventObjectsH = eventObjectsH.replace(
      lastObjectEventDefinition,
      lastObjectEventDefinition + "\n" + `#define ${objectEventGfxDefinitionSymbol}\t\t${newDefinitionId}`
    );

    eventObjectsH = eventObjectsH.replace(
      new RegExp(`#define\\s+NUM_OBJ_EVENT_GFX\\s+${newDefinitionId}`),
      `#define NUM_OBJ_EVENT_GFX\t\t${newTotalObjectEvent}`
    );
    writeFileString(eventObjectsH, config["event_objects.h"], workspaceRoot);

    // create frames
    const objectEventPicTableSymbol = `sPicTable_${nameInUpperFirstCamelcase}`;
    const objectEventPicSymbol = `gObjectEventPic_${nameInUpperFirstCamelcase}`;
    const objectEventPaletteSymbol = `gObjectEventPalette_${nameInUpperFirstCamelcase}`;
    const objectEventPicIncBinPath = `graphics/object_events/pics/people/${nameInLowerSnakecase}.4bpp`;
    const objectEventPaletteIncBinPath = `graphics/object_events/pics/people/${nameInLowerSnakecase}.gbapal`;

    const [width, height] = sizeStr.split("x");
    const frameCount = Number(framesStr);

    const framesObjectStr = this._generateFramesObject(
      objectEventPicTableSymbol,
      objectEventPicSymbol,
      Number(width),
      Number(height),
      frameCount
    );
    let objectEventPicTablesH = getFileString(config["object_event_pic_tables.h"], workspaceRoot);
    objectEventPicTablesH = objectEventPicTablesH + framesObjectStr;
    writeFileString(objectEventPicTablesH, config["object_event_pic_tables.h"], workspaceRoot);

    // create inc bins
    const gObjectEventPicStr = `const u32 ${objectEventPicSymbol}[] = INCBIN_U32("${objectEventPicIncBinPath}");`;
    const gObjectEventPaletteStr = `const u16 ${objectEventPaletteSymbol}[] = INCBIN_U16("${objectEventPaletteIncBinPath}");`;
    let objectEventGraphicsH = getFileString(config["object_event_graphics.h"], workspaceRoot);
    objectEventGraphicsH = objectEventGraphicsH + gObjectEventPicStr + "\n" + gObjectEventPaletteStr + "\n";
    writeFileString(objectEventGraphicsH, config["object_event_graphics.h"], workspaceRoot);

    // create spritesheet rule
    const objectEventMkPath = `$(OBJEVENTGFXDIR)/people/${nameInLowerSnakecase}.4bpp`;

    let spriteSheetRulesMk = getFileString(config["spritesheet_rules.mk"], workspaceRoot);
    spriteSheetRulesMk =
      spriteSheetRulesMk +
      "\n" +
      this._generateSpriteSheetRule(objectEventMkPath, Number(width), Number(height)) +
      "\n";
    writeFileString(spriteSheetRulesMk, config["spritesheet_rules.mk"], workspaceRoot);
    // create palette
    const objectEventPaletteTagDefinitionSymbol = paletteStr || `OBJ_EVENT_PAL_${nameInUpperSnakecase}`;
    if (!paletteStr) {
      let eventObjectMovementC = getFileString(config["event_object_movement.c"], workspaceRoot);
      let fieldEffectHelpersC = getFileString(config["field_effect_helpers.c"], workspaceRoot);
      const parsedStr = eventObjectMovementC.match(
        /(#define[^0]+(0x\b\d|\w+\b))\n(#define OBJ_EVENT_PAL_TAG_NONE\s+(0x\b\d|\w+\b))/
      );
      const parsedStr2 = fieldEffectHelpersC.match(/(#define OBJ_EVENT_PAL_TAG_NONE\s+0x)(\b\d|\w+\b)/);
      const parsedStr3 = eventObjectMovementC.match(/\s*{NULL,\s*0x0000},/); //Probably not a good searching method, might conflict

      if (parsedStr) {
        const lastIndex = parseInt(parsedStr[2], 16) + 1;
        let tagNoneIndex = parseInt(parsedStr[4], 16);
        if (lastIndex > tagNoneIndex) {
          tagNoneIndex += 1;
        }
        const lastIndexStr = lastIndex.toString(16).toUpperCase();
        const tagNoneIndexStr = tagNoneIndex.toString(16).toUpperCase();
        //TODO auto tab size
        eventObjectMovementC = eventObjectMovementC.replace(
          parsedStr[3],
          `#define ${objectEventPaletteTagDefinitionSymbol}\t0x${lastIndexStr}\n#define OBJ_EVENT_PAL_TAG_NONE\t0x${tagNoneIndexStr}`
        );

        if (parsedStr2) {
          fieldEffectHelpersC = fieldEffectHelpersC.replace(parsedStr2[0], parsedStr2[1] + tagNoneIndexStr);
          writeFileString(fieldEffectHelpersC, config["field_effect_helpers.c"], workspaceRoot);
        }

        if (parsedStr3) {
          eventObjectMovementC = eventObjectMovementC.replace(
            parsedStr3[0],
            `\n\t{${objectEventPaletteSymbol},\t${objectEventPaletteTagDefinitionSymbol}},` + parsedStr3[0]
          );
          writeFileString(fieldEffectHelpersC, config["field_effect_helpers.c"], workspaceRoot);
        }
        writeFileString(eventObjectMovementC, config["event_object_movement.c"], workspaceRoot);
      }
      objectEventPaletteTagDefinitionSymbol;
    }

    // create graphic info
    const gObjectEventGraphicInfoSymbol = `gObjectEventGraphicsInfo_${nameInUpperFirstCamelcase}`;

    const objectEventGraphicInfo = this._generateObjectEventGraphicsInfo(
      gObjectEventGraphicInfoSymbol,
      objectEventPicTableSymbol,
      objectEventPaletteTagDefinitionSymbol,
      Number(width),
      Number(height)
    );

    let objectEventGraphicsInfoH = getFileString(config["object_event_graphics_info.h"], workspaceRoot);
    objectEventGraphicsInfoH = objectEventGraphicsInfoH + objectEventGraphicInfo + "\n";
    writeFileString(objectEventGraphicsInfoH, config["object_event_graphics_info.h"], workspaceRoot);

    // create graphic info pointers
    let objectEventGraphicsInfoPointerStr = `const struct ObjectEventGraphicsInfo ${gObjectEventGraphicInfoSymbol};`;
    let objectEventGraphicsInfoPointerH = getFileString(config["object_event_graphics_info_pointers.h"], workspaceRoot);
    const insertLine = objectEventGraphicsInfoPointerH.match(
      /(const struct ObjectEventGraphicsInfo[^;]*;\n)\n(\/\/ Decomp Overworld helper: Please don't remove line break at this area for overworld insertion!)*/
    );
    if (insertLine) {
      const lineBreakNote = insertLine[2]
        ? ""
        : "\n\n// Decomp Overworld helper: Please don't remove line break at this area for overworld insertion!\n";
      objectEventGraphicsInfoPointerStr = insertLine[1] + objectEventGraphicsInfoPointerStr + lineBreakNote;
      objectEventGraphicsInfoPointerH = objectEventGraphicsInfoPointerH.replace(
        insertLine[1],
        objectEventGraphicsInfoPointerStr
      );
    }

    let objectEventGraphicsInfoPointerArrStr = `\t[${objectEventGfxDefinitionSymbol}] =\t&${gObjectEventGraphicInfoSymbol},`;
    const insertArr = objectEventGraphicsInfoPointerH.match(
      /const struct ObjectEventGraphicsInfo \*const gObjectEventGraphicsInfoPointers\[NUM_OBJ_EVENT_GFX\] = {[^}]*/
    );
    if (insertArr) {
      objectEventGraphicsInfoPointerArrStr = insertArr + objectEventGraphicsInfoPointerArrStr + "\n";
      objectEventGraphicsInfoPointerH = objectEventGraphicsInfoPointerH.replace(
        insertArr[0],
        objectEventGraphicsInfoPointerArrStr
      );
    }
    writeFileString(objectEventGraphicsInfoPointerH, config["object_event_graphics_info_pointers.h"], workspaceRoot);

    return newObjectEvent;
  }
}
