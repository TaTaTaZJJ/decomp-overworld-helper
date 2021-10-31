import * as vscode from "vscode";
import * as path from "path";
import { getObjectEventDefinitions } from "./core/getObjectEventDefinitions";

export class ObjectEventsDataProvider implements vscode.TreeDataProvider<ObjectEventDefinition> {
  constructor(private workspaceRoot: string | undefined) {}

  getTreeItem(element: ObjectEventDefinition): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ObjectEventDefinition): Thenable<ObjectEventDefinition[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("No dependency in empty workspace");
      return Promise.resolve([]);
    }

    return Promise.resolve(this.getObjectEventListFromCurrentWorkspace());
  }

  private getObjectEventListFromCurrentWorkspace() {
    if (!this.workspaceRoot) {
      return [];
    }
    const definitionList = getObjectEventDefinitions(this.workspaceRoot).objectEvent;
    return definitionList.map(
      (define) => new ObjectEventDefinition(define.symbol, define.value, vscode.TreeItemCollapsibleState.None)
    );
  }
}

class ObjectEventDefinition extends vscode.TreeItem {
  constructor(
    public readonly definition: string,
    public readonly id: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(definition.replace("OBJ_EVENT_GFX_", ""), collapsibleState);
    this.tooltip = `${this.label}-${this.id}`;
    this.description = this.id;
  }

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "light", "dependency.svg"),
    dark: path.join(__filename, "..", "..", "resources", "dark", "dependency.svg"),
  };
}
