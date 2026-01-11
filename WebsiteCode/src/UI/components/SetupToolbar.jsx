import { useRef, useState } from "react"
import "./SetupToolbar.css"
import ObjectSettings from "./ObjectSettings";
import AmbientSettings from "./AmbientSettings";
import { sceneRef } from "../../global";
import SimulationSettings from "./SimulationSettings";

const SetupToolbar = ({ handleInsert, simToggle }) => {

    const [displayObjectSettings, setDisplayObjectSettings] = useState(false);
    const [displayAmbientSettings, setDisplayAmbientSettings] = useState(false);
    const [displaySimSettings, setDisplaySimSettings] = useState(false);


    const fileRef = useRef(null);

    const handleFile = (e) => {

        handleInsert(e);

    
    }

    const handleObjBtn = () => {
        if (displayAmbientSettings) setDisplayAmbientSettings(false);
        if (displaySimSettings) setDisplaySimSettings(false);
        setDisplayObjectSettings(!displayObjectSettings);
    }

    const handleAmbBtn = () => {
        if (displayObjectSettings) setDisplayObjectSettings(false);
        if (displaySimSettings) setDisplaySimSettings(false);
        setDisplayAmbientSettings(!displayAmbientSettings);
    }

    const handleSimBtn = () => {
        if (displayObjectSettings) setDisplayObjectSettings(false);
        if (displayAmbientSettings) setDisplayAmbientSettings(false);
        setDisplaySimSettings(!displaySimSettings);
    }



    return <>

        <input type="file" accept=".stl" ref={fileRef} onChange={handleFile} style={{display: "none"}}/>
        <div className="setup-toolbar-container">

            <button onClick={() => fileRef.current.click()} className="setup-toolbar-button">

                <p className="setup-toolbar-button-text">Insert</p>


            </button>

            <button  
            className={displayObjectSettings ? "setup-toolbar-button-highlighted" :"setup-toolbar-button"} 
            onClick={handleObjBtn}>

                <p className="setup-toolbar-button-text">Objects</p>


            </button>

            <button  
            className={displayAmbientSettings ? "setup-toolbar-button-highlighted" : "setup-toolbar-button"}
            onClick={handleAmbBtn}
            >

                <p className="setup-toolbar-button-text">Ambient</p>


            </button>

            <button  
            className={displaySimSettings ? "setup-toolbar-button-highlighted" : "setup-toolbar-button"}
            onClick={handleSimBtn}
            >

                <p className="setup-toolbar-button-text">Sim Settings</p>


            </button>

            <button  className="setup-toolbar-button" onClick={simToggle}>

                <p className="setup-toolbar-button-text">
                    Start Simulation
                </p>


            </button>

            


        </div>

        {
                displayObjectSettings && <ObjectSettings />
            }

        {
            displayAmbientSettings && <AmbientSettings />
        }

        {
            displaySimSettings && <SimulationSettings />
        }
    
    
    
    </>



}

export default SetupToolbar;