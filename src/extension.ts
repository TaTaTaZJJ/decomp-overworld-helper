import * as vscode from "vscode";
import { ObjectEventsDataProvider } from "./dataProvider";
import { OverworldHelperPanel } from "./panels/objectEventPanel";
import { getObjectEventInfoPointers } from "./core/getObjectEventInfoPointers";
import { getObjectEventInfo, ObjectEventInfo } from "./core/getObjectEventInfo";
import { getObjectEventImages } from "./core/getObjectEventImages";

const state = {
  objectEventInfo: {} as ObjectEventInfo,
  objectEventInfoStrToReplace: "",
};

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  if (!workspaceRoot) {
    vscode.window.showErrorMessage("There is no workspace root folder.");
    return;
  }

  const infoPointers = getObjectEventInfoPointers(workspaceRoot);

  vscode.window.createTreeView("overworldOutline", {
    treeDataProvider: new ObjectEventsDataProvider(workspaceRoot),
  });

  const panel = OverworldHelperPanel.render(context);

  /** Record the selected definition state, then post the data to webview panel */
  vscode.commands.registerCommand("overworldOutline.editEntry", (params: { definition: string; label: string }) => {
    try {
      const pointer = infoPointers.items.find((item) => item.index === params.definition);
      if (!pointer) {
        throw Error("Missing pointer for this entry.");
      }
      const { data, toReplaceStr } = getObjectEventInfo(pointer.value.replace("&", ""), workspaceRoot);
      const name = params.label;
      state.objectEventInfo = data;
      state.objectEventInfoStrToReplace = toReplaceStr;

      const images = getObjectEventImages(data.images, workspaceRoot);
      panel?.webview.postMessage({ command: "editEntry", name, data, images });
    } catch (error) {
      console.log(error);
    }
  });
}

export function deactivate() {}
