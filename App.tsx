import React, { useState, useRef, useEffect } from 'react';
import { AppStep, MimicMode, ImageAsset, SAMPLE_REFERENCES, SAMPLE_SOURCES, GenerationResult } from './types';
import { 
    IconUpload, IconCamera, IconSparkles, IconRefresh, IconDownload, IconArrowLeft,
    IconPose, IconLighting, IconOutfit, IconScene, IconComposition, IconX, IconInfinity
} from './components/Icons';
import { generateVibeCopy, urlToBase64 } from './services/geminiService';

// Map modes to specific icons
const ModeIcons: Record<MimicMode, React.ReactNode> = {
    [MimicMode.COMPOSITE]: <IconSparkles />,
    [MimicMode.POSE]: <IconPose />,
    [MimicMode.LIGHTING]: <IconLighting />,
    [MimicMode.OUTFIT]: <IconOutfit />,
    [MimicMode.SCENE]: <IconScene />,
    [MimicMode.COMPOSITION]: <IconComposition />,
};

const App = () => {
  // -- State --
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD_SOURCE);
  const [sourceImage, setSourceImage] = useState<ImageAsset | null>(null);
  const [refImage, setRefImage] = useState<ImageAsset | null>(null);
  const [selectedMode, setSelectedMode] = useState<MimicMode>(MimicMode.COMPOSITE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [results, setResults] = useState<GenerationResult[]>([]);
  
  // -- Refs --
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  // -- Handlers --

  const handleSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage({
          id: 'source',
          url: URL.createObjectURL(file),
          base64: reader.result as string,
          isLocal: true
        });
        setStep(AppStep.SELECT_MODE);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSourceSample = (sample: { id: string, url: string }) => {
    setSourceImage({
        id: sample.id,
        url: sample.url,
        isLocal: false
    });
    setStep(AppStep.SELECT_MODE);
  };

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefImage({
          id: 'ref-custom',
          url: URL.createObjectURL(file),
          base64: reader.result as string,
          isLocal: true
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSampleRef = async (sample: { id: string, url: string }) => {
    setRefImage({
      id: sample.id,
      url: sample.url,
      isLocal: false
    });
  };

  const clearReference = () => {
      setRefImage(null);
  }

  const handleGenerate = async () => {
    if (!sourceImage || !refImage) return;
    
    setStep(AppStep.GENERATING);
    setIsGenerating(true);
    
    const messages = [
      "Reading vibe...",
      "Matching lighting...",
      "Applying style...",
      "Finalizing...",
    ];
    let msgIdx = 0;
    setLoadingText(messages[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setLoadingText(messages[msgIdx]);
    }, 1500);

    try {
      // Ensure we have base64 for source
      let sourceBase64 = sourceImage.base64;
      if (!sourceBase64 && sourceImage.url) {
        sourceBase64 = await urlToBase64(sourceImage.url);
      }
      if (!sourceBase64) throw new Error("Source image data missing");

      // Ensure we have base64 for reference
      let refBase64 = refImage.base64;
      if (!refBase64 && refImage.url) {
        refBase64 = await urlToBase64(refImage.url);
      }
      if (!refBase64) throw new Error("Reference image data missing");

      const generatedBase64 = await generateVibeCopy(sourceBase64, refBase64, selectedMode);
      
      if (generatedBase64) {
        setResults([
          { id: 'res1', url: generatedBase64 },
          { id: 'res2', url: generatedBase64 },
          { id: 'res3', url: generatedBase64 },
          { id: 'res4', url: generatedBase64 },
        ]);
      } else {
        setResults([]);
        alert("Generation failed. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong.");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      setStep(AppStep.RESULTS);
    }
  };

  const resetFlow = () => {
    setSourceImage(null);
    setRefImage(null);
    setResults([]);
    setStep(AppStep.UPLOAD_SOURCE);
  };

  const goBack = () => {
    if (step === AppStep.SELECT_MODE) {
        if (refImage) {
            // Unselect reference if one is selected
            setRefImage(null);
        } else {
             // Go back to source upload
            setSourceImage(null);
            setStep(AppStep.UPLOAD_SOURCE);
        }
    }
    if (step === AppStep.RESULTS) setStep(AppStep.SELECT_MODE);
  };

  // -- Render Helpers --

  const Header = () => (
    <div className="flex items-center h-14 px-4 sticky top-0 z-20 bg-[#020617] text-white">
        <button 
            onClick={step === AppStep.UPLOAD_SOURCE ? undefined : goBack} 
            className={`p-2 -ml-2 rounded-full text-white/90 hover:bg-white/10 transition-colors ${step === AppStep.UPLOAD_SOURCE ? 'opacity-0 pointer-events-none' : ''}`}
        >
            <IconArrowLeft />
        </button>
        <div className="flex-1 text-center pr-8 font-semibold text-lg">
            AI Vibe Copy
        </div>
    </div>
  );

  // -- Views --

  const renderUploadSource = () => (
    <div className="flex flex-col h-full fade-in relative">
      <div className="flex-1 flex flex-col px-6 pt-8 pb-24">
         <div className="flex-1 flex flex-col justify-center items-center gap-6">
            {/* Main Preview Area */}
            <div className="w-full aspect-[3/4] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-between p-6 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none"></div>
                 
                 {/* Top Icon Area */}
                 <div className="flex-1 flex flex-col items-center justify-center mt-4">
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-4 group-hover:scale-110 transition-transform duration-500">
                        <IconUpload />
                    </div>
                    <p className="text-slate-500 font-medium">No photo selected</p>
                 </div>

                 {/* Sample Section within the card */}
                 <div className="z-10 w-full flex flex-col items-center">
                    <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-3">Or try a sample</p>
                    <div className="flex gap-4 justify-center w-full">
                        {SAMPLE_SOURCES.map(s => (
                            <button 
                                key={s.id}
                                onClick={(e) => { e.stopPropagation(); handleSelectSourceSample(s); }}
                                className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-700 hover:border-indigo-500 transition-colors relative shadow-lg active:scale-95"
                            >
                                <img src={s.url} className="w-full h-full object-cover" alt="sample" />
                            </button>
                        ))}
                    </div>
                 </div>
            </div>
         </div>
      </div>

      {/* Bottom Action Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#020617]">
          <button 
            onClick={() => sourceInputRef.current?.click()}
            className="w-full bg-[#E0E7FF] text-slate-950 h-14 rounded-full font-bold text-lg shadow-lg hover:bg-white transition-colors flex items-center justify-center"
          >
            Import Photo
          </button>
      </div>
      <input ref={sourceInputRef} type="file" accept="image/*" className="hidden" onChange={handleSourceUpload}/>
    </div>
  );

  const renderSelectMode = () => {
    return (
        <div className="flex flex-col h-full fade-in relative bg-[#020617]">
            {/* Top Section: Visualization of Source + Reference */}
            {/* This matches the 'Page 3' framework but integrates Page 2's selection logic */}
            <div className="px-6 py-6 flex justify-center items-center gap-2 h-[35vh] flex-shrink-0">
                {/* Source Image */}
                <div className="relative h-48 w-32 rounded-xl overflow-hidden border-2 border-slate-800 shadow-lg transform -rotate-3 z-0">
                    <img src={sourceImage?.url} className="w-full h-full object-cover opacity-90" alt="Source" />
                </div>
                
                {/* Connector */}
                <div className="relative z-10 bg-slate-800 rounded-full p-2 border-4 border-[#020617] text-white">
                    <IconInfinity />
                </div>
                
                {/* Reference Slot (Dynamic) */}
                <div 
                    className={`relative h-48 w-32 rounded-xl overflow-hidden border-2 shadow-lg transform rotate-3 z-0 group transition-all duration-300 ${refImage ? 'border-slate-800' : 'border-dashed border-slate-600 bg-slate-900/50 flex items-center justify-center cursor-pointer hover:border-indigo-500'}`}
                    onClick={() => !refImage && refInputRef.current?.click()}
                >
                    {refImage ? (
                        <>
                            <img src={refImage.url} className="w-full h-full object-cover opacity-90" alt="Ref" />
                            <button 
                                onClick={(e) => { e.stopPropagation(); clearReference(); }}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white/90 hover:bg-black/80 transition-colors z-20 backdrop-blur-sm"
                            >
                                <IconX />
                            </button>
                        </>
                    ) : (
                        <div className="text-slate-500 flex flex-col items-center text-xs font-medium text-center p-2">
                             <div className="mb-1"><IconCamera /></div>
                             <span>Select Style</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Card: Dynamic Content based on Reference Selection */}
            <div className="flex-1 bg-[#0F172A] rounded-t-[2.5rem] px-6 py-8 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
                
                {!refImage ? (
                    /* STATE A: No Reference Selected - Show Options */
                    <div className="flex flex-col h-full fade-in">
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-white font-semibold">Recommended Styles</h2>
                             <button 
                                onClick={() => refInputRef.current?.click()}
                                className="text-xs text-indigo-400 font-bold uppercase tracking-wide px-3 py-1 bg-indigo-500/10 rounded-full"
                             >
                                Upload Own
                             </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto scrollbar-hide -mx-2 px-2 pb-6">
                            <div className="grid grid-cols-2 gap-3">
                                {SAMPLE_REFERENCES.map((ref, idx) => (
                                    <div 
                                        key={ref.id}
                                        onClick={() => handleSelectSampleRef(ref)}
                                        className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer bg-slate-800 active:scale-95 transition-transform border border-slate-700 hover:border-indigo-500"
                                    >
                                        <img src={ref.url} className="w-full h-full object-cover" alt="ref" />
                                        <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* STATE B: Reference Selected - Show Modes & Generate */
                    <div className="flex flex-col h-full fade-in">
                        <h2 className="text-white font-semibold text-center mb-6">Select Editing Mode</h2>
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            <div className="grid grid-cols-3 gap-3">
                                {Object.values(MimicMode).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setSelectedMode(mode)}
                                        className={`flex flex-col items-center justify-center aspect-square rounded-2xl transition-all duration-200 ${
                                            selectedMode === mode 
                                            ? 'bg-indigo-600 text-white shadow-indigo-500/30 shadow-lg scale-105' 
                                            : 'bg-[#1E293B] text-slate-400 hover:bg-slate-700'
                                        }`}
                                    >
                                        <div className="mb-2 scale-90">
                                            {ModeIcons[mode]}
                                        </div>
                                        <span className="text-[10px] font-medium uppercase tracking-wide text-center leading-tight">{mode}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6">
                             <button 
                                onClick={handleGenerate}
                                className="w-full bg-[#E0E7FF] text-slate-950 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <input ref={refInputRef} type="file" accept="image/*" className="hidden" onChange={handleRefUpload}/>
        </div>
    );
  };

  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center h-full px-6 fade-in bg-[#020617]">
        <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Generating...</h3>
        <p className="text-slate-400 text-sm">{loadingText}</p>
    </div>
  );

  const renderResults = () => (
    <div className="flex flex-col h-full fade-in relative">
         <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
             <div className="grid grid-cols-2 gap-3 pb-24">
                {results.map((res, idx) => (
                    <div key={idx} className="bg-slate-900 rounded-2xl overflow-hidden relative group aspect-[4/5]">
                        <img src={res.url} alt="Result" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <a href={res.url} download className="p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/40">
                                <IconDownload />
                             </a>
                        </div>
                    </div>
                ))}
             </div>
         </div>
         
         {/* Bottom Floating Action Bar */}
         <div className="absolute bottom-8 left-6 right-6 flex gap-4">
            <button onClick={resetFlow} className="flex-1 bg-slate-800 text-white py-3 rounded-full font-medium hover:bg-slate-700 transition-colors">
                New Photo
            </button>
            <button onClick={() => setStep(AppStep.SELECT_MODE)} className="flex-1 bg-indigo-600 text-white py-3 rounded-full font-medium shadow-lg shadow-indigo-900/40 hover:bg-indigo-500 transition-colors">
                Regenerate
            </button>
         </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] flex justify-center font-sans select-none">
      <div className="w-full max-w-md bg-[#020617] min-h-screen relative flex flex-col overflow-hidden">
        {step !== AppStep.GENERATING && <Header />}
        
        <main className="flex-1 relative overflow-hidden">
            {step === AppStep.UPLOAD_SOURCE && renderUploadSource()}
            {step === AppStep.SELECT_MODE && renderSelectMode()}
            {step === AppStep.GENERATING && renderGenerating()}
            {step === AppStep.RESULTS && renderResults()}
        </main>
      </div>
    </div>
  );
};

export default App;