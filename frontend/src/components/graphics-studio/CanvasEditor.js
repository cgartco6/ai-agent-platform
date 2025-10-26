import React, { useRef, useEffect, useState } from 'react';
import { FabricCanvas } from 'fabric';
import { saveDesign, exportDesign } from '../../services/graphicsService';
import AIAssist from './AIAssist';

const CanvasEditor = () => {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [aiAssistActive, setAiAssistActive] = useState(false);

  useEffect(() => {
    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff'
    });
    
    setFabricCanvas(canvas);
    
    return () => {
      canvas.dispose();
    };
  }, []);

  const handleSave = async () => {
    const designData = fabricCanvas.toJSON();
    await saveDesign(designData);
  };

  const handleExport = async (format) => {
    const data = await exportDesign(fabricCanvas, format);
    // Download logic here
  };

  const handleAIAssist = (prompt) => {
    // AI-powered design suggestions
    setAiAssistActive(true);
    // Implementation for AI design assistance
  };

  return (
    <div className="graphics-studio">
      <div className="toolbar">
        <button onClick={() => setActiveTool('select')}>Select</button>
        <button onClick={() => setActiveTool('rectangle')}>Rectangle</button>
        <button onClick={() => setActiveTool('text')}>Text</button>
        <button onClick={() => setActiveTool('brush')}>Brush</button>
        <button onClick={handleSave}>Save</button>
        <button onClick={() => handleExport('png')}>Export PNG</button>
        <button onClick={() => handleExport('pdf')}>Export PDF</button>
        <button onClick={() => setAiAssistActive(!aiAssistActive)}>
          AI Assist
        </button>
      </div>
      
      <div className="canvas-container">
        <canvas ref={canvasRef} />
        {aiAssistActive && (
          <AIAssist onPrompt={handleAIAssist} />
        )}
      </div>
    </div>
  );
};

export default CanvasEditor;
