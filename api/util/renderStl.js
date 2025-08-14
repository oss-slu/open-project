import {
  stl2png,
  makeStandardMaterial,
  makeEdgeMaterial,
} from "@scalenc/stl-to-png";

const mat = makeStandardMaterial(1, 0x53c3ee);
const edgemat = makeEdgeMaterial(1, 0x53c3ee);

const prefixUrl = (url) => {
  // if url doesnt start with http:// or https://, add it
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
};

export const renderStl = async (stlUrl, size = 200) => {
  const stlData = await fetch(prefixUrl(stlUrl)).then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch STL: ${res.status}`);
    return res.arrayBuffer();
  });

  if (stlData.byteLength < 84) {
    throw new Error("STL file too small or malformed");
  }

  const pngData = stl2png(stlData, {
    width: size,
    height: size,
    materials: [mat],
    edgeMaterials: [edgemat],
  });

  return [pngData, stlData];
};
