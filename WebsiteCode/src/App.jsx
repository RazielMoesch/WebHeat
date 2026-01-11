

import { useEffect, useRef, useState } from 'react'
import SceneManager from './gpu/SceneManager';
import CameraControls from "./gpu/CameraControls.js";
import loadSTL from "./data/loadSTL.js";
import UI from './UI/UI.jsx';
import { sceneRef } from './global.js';
import './App.css'

function App() {

  const canvasRef = useRef(null);
  const initializing = useRef(false);


  useEffect(
    () => {

      const init = async () => {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;

        if (initializing.current === true) {
          console.log("stopped init");
          return;
        }

        initializing.current = true;


        console.log("useEffect called for sceneref init");


        if (!canvasRef.current) return;
        if (sceneRef.current) return;

        sceneRef.current = await SceneManager.create(canvasRef);


        const resize = () => {canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight;}

        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize)


      }

      init();


      return () => {
        if (sceneRef.current) {
          sceneRef.current.stopEngine();
        }
      }

    }, []
  )

  useEffect(
    () => {

      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mouseup", handleMouseUp);
      }

    }, []
  )

  const handleInsert = async (e) => {

    let units = prompt("Scale in Meters: ");
    units = units ? units : 0.01;
    const file = e.target.files[0]; 
    const vertices = await loadSTL(file);
    console.log("Vertices Length", vertices.length)
    sceneRef.current.handleFileUpload(vertices, units);
    sceneRef.current.viewmode = "geometry";


  }

  const handleMouseDown = (e) => {
    
    if (e.buttons === 1) sceneRef.current.mouseLeftDown(e); 

  };
  
  const handleMouseUp = () => {
    sceneRef.current.mouseRightUp();
    sceneRef.current.mouseLeftUp();
  };

  const handleMouseMove = (e) => {
    if (e.buttons === 1) sceneRef.current.mouseLeftMove(e);
  };
  const handleMouseZoom = (e) => sceneRef.current.mouseZoom(e);

  const handleContextMenu = (e) => e.preventDefault();







  return (
    <>

    <canvas 
    ref={canvasRef} 
    className='webgpu-canvas'
    onMouseDown={handleMouseDown}
    onMouseUp={handleMouseUp}
    onMouseMove={handleMouseMove}
    onWheel={handleMouseZoom}
    onContextMenu={handleContextMenu}
    style={{cursor: "grab"}}
    ></canvas>
    <UI handleInsert={handleInsert}  />

    </>

  
  )
}

export default App
