import { Disposable, Webview, WebviewPanel, window, ViewColumn, ExtensionContext, Uri, workspace } from "vscode";
import { getShadowSizes } from "../core/getShadowSizes";
import { getTracks } from "../core/getTracks";
import { getUri } from "../utils/getUri";

export class OverworldHelperPanel {
  public static currentPanel: OverworldHelperPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  private constructor(panel: WebviewPanel, context: ExtensionContext) {
    this._panel = panel;

    this._panel.onDidDispose(this.dispose, null, this._disposables);

    this._panel.webview.html = this._getWebviewContent(this._panel.webview, context);
  }

  public static render(context: ExtensionContext) {
    if (OverworldHelperPanel.currentPanel) {
      OverworldHelperPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      const panel = window.createWebviewPanel(
        // Panel view type
        "tasOverworldHelper",
        // Panel title
        "Ta's Overworld Helper",
        // The editor column the panel should be displayed in
        ViewColumn.One,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
        }
      );

      OverworldHelperPanel.currentPanel = new OverworldHelperPanel(panel, context);

      return panel;
    }
  }

  public dispose() {
    OverworldHelperPanel.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(webview: Webview, context: ExtensionContext) {
    const toolkitUri = getUri(webview, context.extensionUri, [
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist",
      "toolkit.js",
    ]);

    const styleMainUri = webview.asWebviewUri(Uri.joinPath(context.extensionUri, "media", "main.css"));

    const workspaceRoot =
      workspace.workspaceFolders && workspace.workspaceFolders.length > 0
        ? workspace.workspaceFolders[0].uri.fsPath
        : undefined;

    if (!workspaceRoot) {
      throw Error("There is no workspace root folder.");
    }

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
          <link href="${styleMainUri}" rel="stylesheet">
          <title>Ta's Overworld Helper</title>
        </head>
        <body>
          <div class="config-fields">
            <p>Name</p>
            <vscode-text-field id="oe-name"></vscode-text-field>

            <p>Images</p>
            <div id="oe-images"></div>
          
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
              <vscode-button id="delete-event-object">Delete</vscode-button>
              <vscode-button id="save-event-object">Save</vscode-button>
            </div>
        </body>
        <script>
          const vscode = acquireVsCodeApi();

          const tileTag = document.getElementById('oe-tile-tag');
          const paletteTag1 = document.getElementById('oe-palette-tag-1');
          const paletteTag2 = document.getElementById('oe-palette-tag-2');
          const size = document.getElementById('oe-size');
          const width = document.getElementById('oe-width');
          const height = document.getElementById('oe-height');
          const paletteSlot = document.getElementById('oe-palette-slot');
          const shadowSize = document.getElementById('oe-shadow-size');
          const inanimate = document.getElementById('oe-in-animate');
          const disableReflectionPaletteLoad = document.getElementById('oe-disable-reflection-palette-load');
          const tracks = document.getElementById('oe-tracks');
          const oam = document.getElementById('oe-oam');
          const subspriteTables = document.getElementById('oe-subsprite-tables');
          const anims = document.getElementById('oe-anims');
          const images = document.getElementById('oe-images');
          const affineAnims = document.getElementById('oe-affine-anims');
          const name = document.getElementById('oe-name');

          window.addEventListener('message', event => {
            const message = event.data; // The JSON data our extension sent
            switch (message.command) {
              case "editEntry":
                name.value = message.name;
                tileTag.value = message.data.tileTag;
                paletteTag1.value = message.data.paletteTag1;
                paletteTag2.value = message.data.paletteTag2;
                size.value = message.data.size;
                width.value = message.data.width;
                height.value = message.data.height;
                paletteSlot.value = message.data.paletteSlot;
                shadowSize.value = message.data.shadowSize;
                inanimate.checked = message.data.inanimate == "TRUE" ? true : false;
                disableReflectionPaletteLoad.checked = message.data.disableReflectionPaletteLoad == "TRUE" ? true : false;
                tracks.value = message.data.tracks;
                oam.value = message.data.oam;
                subspriteTables.value = message.data.subspriteTables;
                anims.value = message.data.anims;
                affineAnims.value = message.data.affineAnims;

                images.innerHTML = "";
                message.images.forEach(image=>{
                  const img = document.createElement("img");
                  img.src = image;
                  images.appendChild(img);
                });
                break;
            }
          });
        </script>
      </html>
        `;
  }
}
