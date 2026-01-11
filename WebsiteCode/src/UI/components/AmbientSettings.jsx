import { sceneRef } from "../../global";
import { useState } from "react";
import "./AmbientSettings.css";

const AmbientSettings = () => {
    const [ambTemp, setAmbTemp] = useState(sceneRef.current?.ambient_temperature || 0);
    const [ambDiff, setAmbDiff] = useState(sceneRef.current?.ambient_diffusivity || 0);

    const handleAmbTemp = (e) => {
        let temp = parseFloat(e.target.value) || 0;
        temp = Math.max(-10000, Math.min(10000, temp));
        setAmbTemp(temp);
        sceneRef.current?.changeAmbientTemp(temp);
    }

    const handleAmbDiff = (e) => {
        let diff = parseFloat(e.target.value) || 0;
        setAmbDiff(diff);
        sceneRef.current?.changeAmbientDiff(diff);
    }

    return (
        <div className="ambient-settings-container">
            <h2 className="ambient-settings-title">Ambient Settings</h2>
            
            <div className="settings-divider"></div>

            <div className="ambient-settings-group">
                <label className="ambient-settings-label">Ambient Temperature</label>
                <div className="ambient-settings-input-wrapper">
                    <input 
                        className="ambient-settings-input" 
                        type="number" 
                        value={ambTemp} 
                        onChange={handleAmbTemp} 
                    />
                    <span className="ambient-settings-unit">°C</span>
                </div>
            </div>

            <div className="ambient-settings-group">
                <label className="ambient-settings-label">Ambient Diffusivity</label>
                <div className="ambient-settings-input-wrapper">
                    <input 
                        className="ambient-settings-input" 
                        type="number" 
                        step="0.01"
                        value={ambDiff} 
                        onChange={handleAmbDiff} 
                    />
                    <span className="ambient-settings-unit">α</span>
                </div>
            </div>
        </div>
    );
}

export default AmbientSettings;