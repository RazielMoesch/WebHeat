

import "./SimulationToolbar.css";
import { sceneRef } from "../../global";
import { useState } from "react";

const SimulationToolbar = ({ simToggle }) => {

    const [isPaused, setIsPaused] = useState(false); 
    
    const pauseButton = () => {
        

        sceneRef.current.computeRunning = isPaused;


        setIsPaused(p => !p);

    }
    


    return <>
    
    
    <div className="simulation-toolbar-container">

        <button onClick={pauseButton} className="simulation-toolbar-button">

                <p className="simulation-toolbar-button-text">
                    {isPaused ? "Unpause" : "Pause"}
                </p>


            </button>

        <button onClick={simToggle} className="simulation-toolbar-button">

                <p className="simulation-toolbar-button-text">Stop Simulation</p>


            </button>

    </div>
    
    
    
    </>


}

export default SimulationToolbar;