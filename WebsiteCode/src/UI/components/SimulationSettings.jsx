import { sceneRef } from "../../global";
import { useState } from "react";
import "./SimulationSettings.css";

const SimulationSettings = () => {
    const [dt, setDt] = useState(sceneRef.current?.dt || 0.01);
    const [nsteps, setNsteps] = useState(sceneRef.current?.nsteps || 1);
    const [speedScale, setSpeedScale] = useState(sceneRef.current?.simulationSpeedScale || 1);
    const [voxelSize, setVoxelSize] = useState(sceneRef.current?.voxelSize || 0.01);

    const changeDt = (e) => {
        let val = parseFloat(e.target.value) || 0.0001;
        val = Math.max(0.0001, Math.min(0.5, val));
        setDt(val);
        if (sceneRef.current) sceneRef.current.dt = val;
    };

    const changeNsteps = (e) => {
        let val = parseInt(e.target.value) || 1;
        val = Math.max(1, Math.min(50, val));
        setNsteps(val);
        if (sceneRef.current) sceneRef.current.nsteps = val;
    };

    const changeSpeedScale = (e) => {
        let val = parseFloat(e.target.value) || 0.1;
        val = Math.max(0.1, Math.min(5.0, val));
        setSpeedScale(val);
        if (sceneRef.current) sceneRef.current.simulationSpeedScale = val;
    };

    const changeVoxelSize = (e) => {
        let val = parseFloat(e.target.value) || 0.005;
        val = Math.max(0.005, Math.min(5, val));
        setVoxelSize(val);
        if (sceneRef.current) sceneRef.current.voxelSize = val;
    };

    return (
        <div className="sim-settings-container">
            <h2 className="sim-settings-title">Simulation Settings</h2>
            <div className="settings-divider"></div>

            <div className="sim-settings-group">
                <label className="sim-settings-label">Time Step (dt)</label>
                <div className="sim-settings-input-wrapper">
                    <input className="sim-settings-input" type="number" step="0.001" value={dt} onChange={changeDt} />
                    <span className="sim-settings-unit">s</span>
                </div>
            </div>

            <div className="sim-settings-group">
                <label className="sim-settings-label">Steps Per Frame</label>
                <div className="sim-settings-input-wrapper">
                    <input className="sim-settings-input" type="number" value={nsteps} onChange={changeNsteps} />
                    <span className="sim-settings-unit">iter</span>
                </div>
            </div>

            <div className="sim-settings-group">
                <label className="sim-settings-label">Speed Scale</label>
                <div className="sim-settings-input-wrapper">
                    <input className="sim-settings-input" type="number" step="0.1" value={speedScale} onChange={changeSpeedScale} />
                    <span className="sim-settings-unit">x</span>
                </div>
            </div>

            <div className="sim-settings-group">
                <label className="sim-settings-label">Voxel Size</label>
                <div className="sim-settings-input-wrapper">
                    <input className="sim-settings-input" type="number" step="0.001" value={voxelSize} onChange={changeVoxelSize} />
                    <span className="sim-settings-unit">m</span>
                </div>
            </div>
        </div>
    );
};

export default SimulationSettings;