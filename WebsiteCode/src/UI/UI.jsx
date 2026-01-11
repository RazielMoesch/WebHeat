
import './UI.css';
import SetupToolbar from './components/SetupToolbar';
import { sceneRef, timerRef } from '../global';
import { useEffect, useState } from 'react';
import SimulationToolbar from './components/SimulationToolbar';




const UI = ({

    handleInsert,
    
    

}) => {

    const [simRunning, setSimRunning] = useState(false);
    const [timeValue, setTimeValue] = useState(0);
    const [tick, setTick] = useState(0);
    

    const handleSimToggle = () => {

        if (sceneRef.current.viewmode === "geometry") {
            sceneRef.current.startSimulation()
        }
        else {
            sceneRef.current.timestepped = 0;
            sceneRef.current.stopSimulation();
        }

        setSimRunning(p => !p);
        setTimeValue(0);
        
        
        
    }

    useEffect(
        () => {

            if (!simRunning) return;

            const tick = () => {
                if (!simRunning) return;
                if (tick < 100) setTick(t => t++); else setTick(0);
                setTimeValue(timerRef.current);
                requestAnimationFrame(tick);
                
            }
            requestAnimationFrame(tick);


        }, [simRunning]
    )




    return <>

        {
            simRunning
            ?
            <> 
            <h2 className='timer'>{`Time Simulated: ${timeValue.toFixed(2)}s`}</h2>
            <SimulationToolbar simToggle={handleSimToggle}/>
            </>
            :
            <SetupToolbar handleInsert={handleInsert} simToggle={handleSimToggle} />

        }
        

    
    </>

}

export default UI;