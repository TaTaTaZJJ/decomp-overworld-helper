import { ObjectEvent } from "./../core/objectEvent";
import { Disposable, Webview, WebviewPanel, window, ViewColumn, ExtensionContext, Uri, workspace } from "vscode";
import { getShadowSizes } from "../core/getShadowSizes";
import { getTracks } from "../core/getTracks";
import { getUri } from "../utils/getUri";

export class OverworldHelperPanel {
  public static currentPanel: OverworldHelperPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  private constructor(panel: WebviewPanel, context: ExtensionContext, workspaceRoot: string) {
    this._panel = panel;
    this._panel.onDidDispose(this.dispose, null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, context, workspaceRoot);
  }

  public static render(context: ExtensionContext, workspaceRoot: string) {
    if (OverworldHelperPanel.currentPanel) {
      OverworldHelperPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      const panel = window.createWebviewPanel("overworldHelper", "Decomp Overworld Helper", ViewColumn.One, {
        enableScripts: true,
      });
      OverworldHelperPanel.currentPanel = new OverworldHelperPanel(panel, context, workspaceRoot);
    }
  }

  public static setData(objectEvent: ObjectEvent, context: ExtensionContext, workspaceRoot: string) {
    if (!OverworldHelperPanel.currentPanel) {
      this.render(context, workspaceRoot);
    }
    const name = objectEvent.definition;
    const data = objectEvent.getDataFromWorkspace();
    this.currentPanel?._panel.webview.postMessage({
      command: "editEntry",
      name,
      data: data.info,
      images: data.images,
      imageTables: data.imageTables,
    });
    this.currentPanel?._panel.webview.onDidReceiveMessage(message=>{
      switch (message.command) {
        case 'saveEntry':
          objectEvent.setDataToWorkspace(message.data);
          break;
        case 'deleteEntry':
          objectEvent.deleteFromWorkspace();
          break;
      }
    });
  }

  public dispose() {
    OverworldHelperPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(webview: Webview, context: ExtensionContext, workspaceRoot: string) {
    const toolkitUri = getUri(webview, context.extensionUri, [
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist",
      "toolkit.js",
    ]);

    const styleMainUri = webview.asWebviewUri(Uri.joinPath(context.extensionUri, "media", "main.css"));
    const mainUri = getUri(webview, context.extensionUri, ["media", "main.js"]);

    const shadowSizeOptions = getShadowSizes(workspaceRoot)
      .map((s) => "<vscode-option>" + s + "</vscode-option>")
      .join("\n");

    const tracksOptions = getTracks(workspaceRoot)
      .map((t) => "<vscode-option>" + t + "</vscode-option>")
      .join("\n");

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script type="module" src="${toolkitUri}"></script>
          <script type="module" src="${mainUri}"></script>
          <link href="${styleMainUri}" rel="stylesheet">
          <title>Decomp. Overworld Helper</title>
        </head>
        <body>
          <div class="config-fields">
            <p>Name</p>
            <vscode-text-field id="oe-name"></vscode-text-field>

            <p>Images</p>
            <div id="oe-images"></div>

            <p>Preview</p>
            <div id="oe-images-preview"></div>

            <p>Tile Tag</p>
            <vscode-text-field id="oe-tile-tag"></vscode-text-field>
          
            <p>Palette Slot</p>
            <vscode-text-field id="oe-palette-slot"></vscode-text-field>
          
            <p>Palette Tag 1</p>
            <vscode-text-field id="oe-palette-tag-1"></vscode-text-field>
          
            <p>Palette Tag 2</p>
            <vscode-text-field id="oe-palette-tag-2"></vscode-text-field>
          
            <p>Height</p>
            <vscode-text-field id="oe-height"></vscode-text-field>
          
            <p>Width</p>
            <vscode-text-field id="oe-width"></vscode-text-field>
          
            <p>Size</p>
            <vscode-text-field id="oe-size"></vscode-text-field>
          
            <p>Shadow Size</p>
            <vscode-dropdown id="oe-shadow-size">
              ${shadowSizeOptions}
            </vscode-dropdown>
          
            <p>Tracks</p>
            <vscode-dropdown id="oe-tracks">
              ${tracksOptions}
            </vscode-dropdown>
          
            <p>Oam</p>
            <vscode-dropdown id="oe-oam">
              <vscode-option>&gObjectEventBaseOam_8x8</vscode-option>
              <vscode-option>&gObjectEventBaseOam_16x8</vscode-option>
              <vscode-option>&gObjectEventBaseOam_16x16</vscode-option>
              <vscode-option>&gObjectEventBaseOam_32x8</vscode-option>
              <vscode-option>&gObjectEventBaseOam_64x32</vscode-option>
              <vscode-option>&gObjectEventBaseOam_16x32</vscode-option>
              <vscode-option>&gObjectEventBaseOam_32x32</vscode-option>
              <vscode-option>&gObjectEventBaseOam_64x64</vscode-option>
            </vscode-dropdown>
          
            <p>Subsprite Tables</p>
            <vscode-text-field id="oe-subsprite-tables"></vscode-text-field>
          
            <p>Animations</p>
            <vscode-text-field id="oe-anims"></vscode-text-field>
          
            <p>Affine Animations</p>
            <vscode-text-field id="oe-affine-anims"></vscode-text-field>
          </div>
            <div class="config-boolean-fields">
              <vscode-checkbox id="oe-in-animate">In animate</vscode-checkbox>
              <vscode-checkbox id="oe-disable-reflection-palette-load">Disable Reflection Palette Load</vscode-checkbox>
            </div>

            <div class="config-actions">
              <vscode-button id="delete-object-event">Delete</vscode-button>
              <vscode-button id="save-object-event">Save</vscode-button>
            </div>
        </body>
      </html>`;
  }
}
