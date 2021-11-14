import { commands, ExtensionContext, window, workspace } from "vscode";
import { ObjectEventsTreeDataProvider } from "./core/objectEventTreeDataProvider";
import { ObjectEvent } from "./core/objectEvent";
import { OverworldHelperPanel } from "./panels/objectEventPanel";

export function activate(context: ExtensionContext) {
  const workspaceRoot =
    workspace.workspaceFolders && workspace.workspaceFolders.length > 0
      ? workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  if (!workspaceRoot) {
    window.showErrorMessage("There is no workspace root folder.");
    return;
  }

  const objectEventsProvider = new ObjectEventsTreeDataProvider(workspaceRoot);

  window.createTreeView("objectEvents", {
    treeDataProvider: objectEventsProvider,
  });

  commands.registerCommand("objectEvents.refreshEntry", () => objectEventsProvider.refresh());

  OverworldHelperPanel.render(context, workspaceRoot);

  commands.registerCommand("objectEvents.addEntry", () => {
    try {
      console.log(ObjectEvent.create(workspaceRoot));
    } catch (error) {
      console.log(error);
    }
  });

  commands.registerCommand("objectEvents.editEntry", (objectEvent: ObjectEvent) => {
    try {
      OverworldHelperPanel.setData(objectEvent, context, workspaceRoot);
    } catch (error) {
      console.log(error);
    }
  });

  commands.registerCommand("objectEvents.deleteEntry", (objectEvent: ObjectEvent) => {
    try {
      // OverworldHelperPanel.setData(objectEvent, context, workspaceRoot);
      objectEvent.deleteFromWorkspace();
    } catch (error) {
      console.log(error);
    }
  });
}

export function deactivate() {}
