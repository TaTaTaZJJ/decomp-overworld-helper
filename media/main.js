const vscode = acquireVsCodeApi();

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
const images = document.getElementById("oe-images");
const imagesPreview = document.getElementById("oe-images-preview");
const affineAnims = document.getElementById("oe-affine-anims");

window.onload = () => {
  const { data, images, name } = vscode.getState();

  definition.value = name;
  tileTag.value = data.tileTag;
  paletteTag1.value = data.paletteTag1;
  paletteTag2.value = data.paletteTag2;
  size.value = data.size;
  width.value = data.width;
  height.value = data.height;
  paletteSlot.value = data.paletteSlot;
  shadowSize.value = data.shadowSize;
  inanimate.checked = data.inanimate === "TRUE" ? true : false;
  disableReflectionPaletteLoad.checked = data.disableReflectionPaletteLoad === "TRUE" ? true : false;
  tracks.value = data.tracks;
  oam.value = data.oam;
  subspriteTables.value = data.subspriteTables;
  anims.value = data.anims;
  affineAnims.value = data.affineAnims;

  imagesPreview.innerHTML = "";
  images.forEach((image) => {
    const img = document.createElement("img");
    img.src = image;
    imagesPreview.appendChild(img);
  });
};

window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.command) {
    case "editEntry":
      vscode.setState({ data: message.data, images: message.images });
      definition.value = message.name;
      tileTag.value = message.data.tileTag;
      paletteTag1.value = message.data.paletteTag1;
      paletteTag2.value = message.data.paletteTag2;
      size.value = message.data.size;
      width.value = message.data.width;
      height.value = message.data.height;
      paletteSlot.value = message.data.paletteSlot;
      shadowSize.value = message.data.shadowSize;
      inanimate.checked = message.data.inanimate === "TRUE" ? true : false;
      disableReflectionPaletteLoad.checked = message.data.disableReflectionPaletteLoad === "TRUE" ? true : false;
      tracks.value = message.data.tracks;
      oam.value = message.data.oam;
      subspriteTables.value = message.data.subspriteTables;
      anims.value = message.data.anims;
      affineAnims.value = message.data.affineAnims;

      imagesPreview.innerHTML = "";
      message.images.forEach((image) => {
        const img = document.createElement("img");
        img.src = image;
        imagesPreview.appendChild(img);
      });

      break;
  }
});

document.getElementById("save-object-event").onclick = (e) => {
  vscode.postMessage({
    command: "saveEntry",
    definition: definition.value,
    data: {
      tileTag: tileTag.value,
      paletteTag1: paletteTag1.value,
      paletteTag2: paletteTag2.value,
      size: size.value,
      width: width.value,
      height: height.value,
      paletteSlot: paletteSlot.value,
      images: images.value,
      shadowSize: shadowSize.value,
      inanimate: inanimate.checked ? "TRUE" : "FALSE",
      disableReflectionPaletteLoad: disableReflectionPaletteLoad.checked ? "TRUE" : "FALSE",
      tracks: tracks.value,
      oam: oam.value,
      subspriteTables: subspriteTables.value,
      anims: anims.value,
      affineAnims: affineAnims.value,
    },
  });
};

document.getElementById("delete-object-event").onclick = (e) => {
  vscode.postMessage({
    command: "deleteEntry",
    definition: definition.value,
  });
};
