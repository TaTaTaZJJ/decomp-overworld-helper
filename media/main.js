const vscode = acquireVsCodeApi();
// State
const state = {
  data: {
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
  },
  framesTable: [],
  imagesSrc: [],
  name: "",
};

// Bindings
const definition = document.getElementById("oe-name");
const tileTag = document.getElementById("oe-tile-tag");
const paletteTag1 = document.getElementById("oe-palette-tag-1");
const paletteTag2 = document.getElementById("oe-palette-tag-2");
const size = document.getElementById("oe-size");
const width = document.getElementById("oe-width");
const height = document.getElementById("oe-height");
const paletteSlot = document.getElementById("oe-palette-slot");
const shadowSize = document.getElementById("oe-shadow-size");
const inanimate = document.getElementById("oe-in-animate");
const disableReflectionPaletteLoad = document.getElementById("oe-disable-reflection-palette-load");
const tracks = document.getElementById("oe-tracks");
const oam = document.getElementById("oe-oam");
const subspriteTables = document.getElementById("oe-subsprite-tables");
const anims = document.getElementById("oe-anims");
const imageFrames = document.getElementById("oe-images");
const imagesPreview = document.getElementById("oe-images-preview");
const affineAnims = document.getElementById("oe-affine-anims");
const imagePtr = document.getElementById("oe-image-ptr");

// Methods
function renderImagesPreview() {
  imagesPreview.innerHTML = "";
  state.imagesSrc.forEach((image) => {
    const img = document.createElement("img");
    img.src = image;
    imagesPreview.appendChild(img);
  });
}

function renderFrameRow(image, imageIndex) {
  const div = document.createElement("div");
  div.style = "display:flex";

   // TODO: vscode-dropdown cannot set value in this method, this is temporary work around
  const typeField = document.createElement("select");
  const ptrField = document.createElement("vscode-text-field");
  const widthField = document.createElement("vscode-text-field");
  const heightField = document.createElement("vscode-text-field");
  const frameField = document.createElement("vscode-text-field");
  const deleteButton = document.createElement("vscode-button");

  typeField.style = "width:250px; margin-right:2px;padding-bottom:1px;";
  ptrField.style = "width:300px; margin-right:2px;padding-bottom:1px;";
  widthField.style = "width:100px; margin-right:2px;padding-bottom:1px;";
  heightField.style = "width:100px; margin-right:2px;padding-bottom:1px;";
  frameField.style = "width:100px; margin-right:2px;padding-bottom:1px;";
  deleteButton.style = "width:50px; height:25px; padding-bottom:1px";

  typeField.innerHTML = `
    <option value="overworld_frame">overworld_frame</option>
    <option value="obj_frame_tiles">obj_frame_tiles</option>
  `;
  deleteButton.innerText = "-";
  typeField.value = image.type;
  ptrField.value = image.ptr;
  widthField.value = image.width;
  heightField.value = image.height;
  frameField.value = image.frame;

  typeField.onchange = () => {
    image.type = typeField.value;
  };
  ptrField.oninput = () => {
    image.ptr = ptrField.value;
  };
  widthField.oninput = () => {
    image.width = widthField.value;
  };
  heightField.oninput = () => {
    image.height = heightField.value;
  };
  frameField.oninput = () => {
    image.frame = frameField.value;
  };

  deleteButton.onclick = () => {
    state.framesTable.splice(imageIndex, 1);
    imageFrames.removeChild(div);
    vscode.setState({
      state,
    });
  };

  div.appendChild(typeField);
  div.appendChild(ptrField);
  div.appendChild(widthField);
  div.appendChild(heightField);
  div.appendChild(frameField);
  div.appendChild(deleteButton);
  imageFrames.appendChild(div);
}

function renderFramesTable() {
  imageFrames.innerHTML = "";
  state.framesTable.forEach(renderFrameRow);
}

document.getElementById("add-frame").onclick = (e) => {
  const image = {
    type: "overworld_frame",
    ptr: "",
    width: (state.data.width / 8).toString(),
    height: (state.data.height / 8).toString(),
    frame: state.framesTable.length.toString(),
  };
  state.framesTable.push(image);
  renderFrameRow(image, state.framesTable.length);
  vscode.setState({
    state,
  });
};

function deserializeData() {
  if (!vscode.getState()) {
    return;
  }
  const vscodeState = vscode.getState();
  const _state = vscodeState.state;

  state.data = _state.data;
  state.name = _state.name;

  definition.value = _state.name;
  tileTag.value = _state.data.tileTag;
  paletteTag1.value = _state.data.paletteTag1;
  paletteTag2.value = _state.data.paletteTag2;
  size.value = _state.data.size;
  width.value = _state.data.width;
  height.value = _state.data.height;
  paletteSlot.value = _state.data.paletteSlot;
  shadowSize.value = _state.data.shadowSize;
  inanimate.checked = _state.data.inanimate === "TRUE" ? true : false;
  disableReflectionPaletteLoad.checked = _state.data.disableReflectionPaletteLoad === "TRUE" ? true : false;
  tracks.value = _state.data.tracks;
  oam.value = _state.data.oam;
  subspriteTables.value = _state.data.subspriteTables;
  anims.value = _state.data.anims;
  affineAnims.value = _state.data.affineAnims;
  imagePtr.value = _state.data.images;

  state.framesTable = _state.framesTable;
  state.imagesSrc = _state.imagesSrc;
  renderImagesPreview();
  renderFramesTable();
}

function handleMessage(event) {
  const message = event.data;
  switch (message.command) {
    case "editEntry":
      vscode.setState({
        state: {
          data: message.data,
          imagesSrc: message.images,
          framesTable: message.imageTables,
          name: message.name,
        },
      });
      deserializeData();
      break;
  }
}

function handleSave() {
  vscode.postMessage({
    command: "saveEntry",
    definition: definition.value,
    data: state.data,
    frames: state.framesTable,
  });
}

function handleDelete() {
  vscode.postMessage({
    command: "deleteEntry",
    definition: definition.value,
  });
}

window.onload = () => {
  deserializeData();
  window.addEventListener("message", handleMessage);
  document.getElementById("save-object-event").addEventListener("click", handleSave);
  document.getElementById("delete-object-event").addEventListener("click", handleDelete);

  tileTag.oninput = () => {
    state.data.tileTag = tileTag.value;
  };

  paletteTag1.oninput = () => {
    state.data.paletteTag1 = paletteTag1.value;
  };

  paletteTag2.oninput = () => {
    state.data.paletteTag2 = paletteTag2.value;
  };

  size.oninput = () => {
    state.data.size = size.value;
  };

  width.oninput = () => {
    state.data.width = width.value;
  };

  height.oninput = () => {
    state.data.height = height.value;
  };

  paletteSlot.oninput = () => {
    state.data.paletteSlot = paletteSlot.value;
  };

  imagePtr.oninput = () => {
    state.data.images = imagePtr.value;
  };

  shadowSize.onchange = () => {
    state.data.shadowSize = shadowSize.value;
  };

  inanimate.onchange = () => {
    state.data.inanimate = inanimate.checked ? "TRUE" : "FALSE";
  };

  disableReflectionPaletteLoad.onchange = () => {
    state.data.disableReflectionPaletteLoad = disableReflectionPaletteLoad.checked ? "TRUE" : "FALSE";
  };

  tracks.onchange = () => {
    state.data.tracks = tracks.value;
  };

  oam.onchange = () => {
    state.data.oam = oam.value;
  };

  subspriteTables.oninput = () => {
    state.data.subspriteTables = subspriteTables.value;
  };

  anims.oninput = () => {
    state.data.anims = anims.value;
  };

  affineAnims.oninput = () => {
    state.data.affineAnims = affineAnims.value;
  };
};
