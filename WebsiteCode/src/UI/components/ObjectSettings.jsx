import { sceneRef } from "../../global";
import { useEffect, useState } from "react";
import "./ObjectSettings.css";

const ObjectSettings = () => {
    const [objTemp, setObjTemp] = useState(sceneRef.current?.obj_temp || 0);
    const [objDiff, setObjDiff] = useState(sceneRef.current?.obj_diff || 0);

    const handleObjTemp = (e) => {
        let temp = parseFloat(e.target.value) || 0;
        temp = temp > 10000 ? 10000 : temp;
        temp = temp < -10000 ? -10000 : temp;
        setObjTemp(temp);
        sceneRef.current?.changeObjectTemp(temp);
    };

    const handleObjDiff = (e) => {
        const diff = parseFloat(e.target.value) || 0;
        setObjDiff(diff);
        sceneRef.current?.changeObjectDiff(diff);
    };


    return (
        <div className="object-settings-container">
            <h2 className="object-settings-title">Object Settings</h2>
            
            <div className="settings-divider"></div>

            <div className="object-settings-group">
                <label className="object-settings-label">Initial Temperature</label>
                <div className="object-settings-input-wrapper">
                    <input 
                        className="object-settings-input" 
                        type="text" 
                        value={objTemp} 
                        onChange={handleObjTemp} 
                        max={10000}
                        min={-10000}
                    />
                    <span className="object-settings-unit">°C</span>
                </div>
            </div>

            <div className="object-settings-group">
                <label className="object-settings-label">Thermal Diffusivity</label>
                <div className="object-settings-input-wrapper">
                    <input 
                        className="object-settings-input" 
                        type="number" 
                        step="0.01"
                        value={objDiff} 
                        onChange={handleObjDiff} 
                    />
                    <span className="object-settings-unit">α</span>
                </div>
            </div>

        </div>
    );
};

export default ObjectSettings;