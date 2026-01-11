

function loadSTL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = reject;

    reader.onload = () => {
      const buffer = reader.result;
      const view = new DataView(buffer);

      const triangleCount = view.getUint32(80, true);

      const vertices = new Float32Array(triangleCount * 9);

      let offset = 84;
      let i = 0;

      for (let t = 0; t < triangleCount; t++) {
        offset += 12; 

        for (let v = 0; v < 3; v++) {
          vertices[i++] = view.getFloat32(offset, true);     
          vertices[i++] = view.getFloat32(offset + 4, true); 
          vertices[i++] = view.getFloat32(offset + 8, true); 
          offset += 12;
        }

        offset += 2; 
      }

      resolve(vertices);
    };

    reader.readAsArrayBuffer(file);
  });
}

export default loadSTL;