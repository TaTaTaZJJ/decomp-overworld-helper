import { commands, Disposable, ExtensionContext, window, workspace } from "vscode";
import { ObjectEventsTreeDataProvider } from "./core/objectEventTreeDataProvider";
import { ObjectEvent } from "./core/objectEvent";
import { OverworldHelperPanel } from "./panels/objectEventPanel";

let objectEventListener: Disposable | null = null; // allow only one listener

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
  window.registerTreeDataProvider("objectEvents", objectEventsProvider);

  context.subscriptions.push(
    commands.registerCommand("objectEvents.refreshEntry", () => objectEventsProvider.refresh()),
    commands.registerCommand("objectEvents.addEntry", async () => {
      try {
        const created = await ObjectEvent.create(workspaceRoot);
        objectEventsProvider.refresh();
        if (created) {
          OverworldHelperPanel.render(context, workspaceRoot);
          setTimeout(() => {
            objectEventListener?.dispose();
            objectEventListener = OverworldHelperPanel.setData(created, context, workspaceRoot);
          }, 1000);
        }
      } catch (error) {
        window.showErrorMessage(String(error));
      }
    }),
    commands.registerCommand("objectEvents.editEntry", (objectEvent: ObjectEvent) => {
      try {
        OverworldHelperPanel.render(context, workspaceRoot);
        setTimeout(() => {
          objectEventListener?.dispose();
          objectEventListener = OverworldHelperPanel.setData(objectEvent, context, workspaceRoot);
        }, 1000);
      } catch (error) {
        window.showErrorMessage(String(error));
      }
    }),
    commands.registerCommand("objectEvents.deleteEntry", (objectEvent: ObjectEvent) => {
      try {
        objectEvent.deleteFromWorkspace();
      } catch (error) {
        window.showErrorMessage(String(error));
      }
    })
  );
}

export function deactivate() {}
