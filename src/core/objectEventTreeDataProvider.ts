import { ObjectEvent } from "./objectEvent";
import * as vscode from "vscode";
import { getObjectEventDefinitions } from "./getObjectEventDefinitions";

export class ObjectEventsTreeDataProvider implements vscode.TreeDataProvider<ObjectEvent> {
  constructor(private workspaceRoot: string | undefined) {}
  private _onDidChangeTreeData: vscode.EventEmitter<ObjectEvent | undefined | null | void> = new vscode.EventEmitter<
    ObjectEvent | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<ObjectEvent | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ObjectEvent): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ObjectEvent): Thenable<ObjectEvent[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("No dependency in empty workspace");
      return Promise.resolve([]);
    }

    return Promise.resolve(this.getObjectEventListFromCurrentWorkspace());
  }

  private getObjectEventListFromCurrentWorkspace() {
    const workspaceRoot = this.workspaceRoot;

    if (!workspaceRoot) {
      return [];
    }

    const definitionList = getObjectEventDefinitions(workspaceRoot).objectEvents;

    return definitionList.map(
      (define) => new ObjectEvent(define.symbol, define.value, vscode.TreeItemCollapsibleState.None, workspaceRoot)
    );
  }
}
