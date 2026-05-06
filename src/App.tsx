import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Stethoscope, 
  ChevronRight, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Phone, 
  ArrowLeft,
  Activity,
  Mic,
  CheckCircle2
} from "lucide-react";
import { analyzeSymptoms, AnalysisResult } from "./services/geminiService";

// --- Types ---
interface Clinic {
  id: string;
  name: string;
  address: string;
  slots: number;
  availableSlots: number;
  distance: string;
}

interface LockInfo {
  lockId: string;
  expiresAt: number;
  clinicName: string;
  clinicAddress: string;
}

// --- Components ---

const SymptomInput = ({ onAnalyze }: { onAnalyze: (val: string) => void }) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => setIsListening(false), 3000);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 space-y-6">
      {/* Header Area */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-core-blue rounded-full animate-pulse"></div>
          <span className="text-[12px] font-bold tracking-widest text-core-blue uppercase">PetPulse OS</span>
        </div>
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-tighter">MVP V1.0</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold leading-tight text-natural-text">您的寵物有什麼<br/>緊急狀況？</h1>
        <p className="text-sm text-gray-500">AI 將即時分析嚴重程度並為您保留席位</p>
      </div>

      <div className="relative group">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="描述症狀 (如：貓咪誤食異物、呼吸困難...)"
          className="w-full h-48 p-6 rounded-3xl bg-gray-50 border border-gray-100 natural-shadow focus:bg-white focus:ring-2 focus:ring-core-blue/20 focus:border-core-blue transition-all outline-none text-lg resize-none italic text-gray-600 placeholder:text-gray-300"
        />
        <div className="absolute bottom-4 right-4 flex space-x-3">
          <button 
            onClick={toggleListening}
            type="button"
            className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-gray-400 hover:text-core-blue shadow-sm'}`}
          >
            <Mic size={20} />
          </button>
          <button
            onClick={() => input.trim() && onAnalyze(input)}
            disabled={!input.trim()}
            className="w-12 h-12 bg-core-blue text-white rounded-full flex items-center justify-center shadow-lg blue-shadow active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none"
          >
            <ChevronRight size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4">
        <div className="p-4 bg-white rounded-2xl border border-gray-50 shadow-sm flex flex-col space-y-2">
          <Clock className="text-core-blue" size={20} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">即時分配</span>
          <p className="text-xs font-semibold">180s 資源鎖定</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-gray-50 shadow-sm flex flex-col space-y-2">
          <Activity className="text-green-500" size={20} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">智慧分流</span>
          <p className="text-xs font-semibold">Gemini 1.5 Flash</p>
        </div>
      </div>
    </div>
  );
};

const AnalysisLoader = () => (
  <div className="flex flex-col items-center justify-center py-32 space-y-8 h-full">
    <div className="relative">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
        className="w-32 h-32 border-4 border-blue-50 rounded-[40px] flex items-center justify-center"
      >
        <div className="w-20 h-20 bg-core-blue/5 rounded-3xl flex items-center justify-center">
          <Activity className="text-core-blue w-10 h-10" />
        </div>
      </motion.div>
    </div>
    <div className="text-center space-y-3">
      <h2 className="text-2xl font-bold text-natural-text">正在鎖定資源...</h2>
      <p className="text-sm text-gray-400 max-w-[200px] mx-auto leading-relaxed">
        AI 正在分析嚴重程度並尋找最優醫學資源
      </p>
    </div>
  </div>
);

interface ClinicCardProps {
  clinic: Clinic;
  onLock: (id: string) => Promise<void>;
  urgency: number;
  isFirst?: boolean;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onLock, urgency, isFirst }) => (
  <div 
    className={`p-5 rounded-3xl transition-all relative overflow-hidden flex justify-between items-center ${
      isFirst 
        ? 'bg-core-blue text-white shadow-xl blue-shadow' 
        : 'bg-white border border-gray-100 shadow-sm'
    }`}
  >
    <div className="space-y-1">
      {isFirst && <div className="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-1">最快抵達 / 推薦</div>}
      <h3 className={`font-bold ${isFirst ? 'text-lg' : 'text-md text-natural-text'}`}>{clinic.name}</h3>
      <div className={`text-[10px] flex items-center gap-1 ${isFirst ? 'opacity-80' : 'text-gray-400'}`}>
        <MapPin size={10} /> {clinic.distance} · 預計 15 分內抵達
      </div>
    </div>

    <div className="text-right flex flex-col items-end space-y-3">
      <div className="flex flex-col items-end">
        <span className={`text-[10px] font-bold uppercase tracking-tighter ${isFirst ? 'opacity-70' : 'text-gray-400'}`}>
          剩餘席位
        </span>
        <div className="flex gap-1 mt-1">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className={`w-3 h-1 rounded-full ${
                i < clinic.availableSlots 
                  ? (isFirst ? 'bg-white' : 'bg-green-500') 
                  : (isFirst ? 'bg-white/20' : 'bg-gray-100')
              }`} 
            />
          ))}
        </div>
      </div>
      
      <button 
        onClick={() => onLock(clinic.id)}
        disabled={clinic.availableSlots === 0}
        className={`px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wide transition-all active:scale-95 ${
          isFirst 
            ? 'bg-white text-core-blue shadow-lg' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {isFirst ? '搶佔席位' : '保留席位'}
      </button>
    </div>
  </div>
);

const LockScreen = ({ lockInfo, onFinish }: { lockInfo: LockInfo, onFinish: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(180);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((lockInfo.expiresAt - now) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockInfo]);

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const ss = (timeLeft % 60).toString().padStart(2, '0');

  const handleNavigation = () => {
    const encodedAddress = encodeURIComponent(lockInfo.clinicAddress);
    // Open in new tab for reliable navigation
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Notch Emulation */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-white rounded-b-2xl border-x border-b border-gray-50"></div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col p-8 pt-16 max-w-md mx-auto w-full"
      >
        <div className="flex-1 flex flex-col items-center justify-center space-y-12">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 block">資源鎖定倒計時</span>
            <span className="text-7xl font-mono font-bold text-core-blue tracking-tighter">{mm}:{ss}</span>
          </div>

          <div className="w-full bg-gray-50 rounded-[40px] p-8 border border-gray-100 text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle2 size={12} />
              <span>席位已鎖定</span>
            </div>
            <h2 className="text-2xl font-bold text-natural-text">{lockInfo.clinicName}</h2>
            <p className="text-[10px] text-gray-400 font-medium mb-2">{lockInfo.clinicAddress}</p>
            <p className="text-sm text-gray-500 leading-relaxed px-4">
              系統已為您鎖定該診所資源。請於限時內抵達櫃檯。
            </p>
          </div>
        </div>

        <div className="space-y-4 pb-8">
          <button 
            onClick={handleNavigation}
            className="w-full h-16 bg-core-blue text-white rounded-2xl font-bold flex items-center justify-center space-x-3 text-lg shadow-xl blue-shadow active:scale-95 transition-transform"
          >
            <MapPin size={24} strokeWidth={2.5} />
            <span>開啟 Google 導航</span>
          </button>
          
          <div className="text-center">
            <button onClick={onFinish} className="px-6 py-2 text-gray-400 font-medium text-xs uppercase tracking-widest hover:text-natural-text transition-colors">
              放棄席位 (取消預約)
            </button>
            <p className="text-[10px] text-gray-300 mt-2 italic px-8">
              注意：放棄席位將資源釋放給其他急診患者
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [step, setStep] = useState<'input' | 'analyzing' | 'results' | 'locked'>('input');
  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);

  const fetchClinics = useCallback(async () => {
    try {
      const res = await fetch("/api/clinics");
      const data = await res.json();
      setClinics(data);
    } catch (err) {
      console.error("Fetch clinics failed", err);
    }
  }, []);

  // Poll clinics update
  useEffect(() => {
    if (step === 'results') {
      const interval = setInterval(fetchClinics, 10000);
      return () => clearInterval(interval);
    }
  }, [step, fetchClinics]);

  const handleAnalyze = async (input: string) => {
    setSymptoms(input);
    setStep('analyzing');
    
    try {
      const result = await analyzeSymptoms(input);
      setAnalysis(result);
      await fetchClinics();
      setStep('results');
    } catch (err) {
      console.error(err);
      setStep('input');
    }
  };

  const handleLock = async (clinicId: string) => {
    try {
      const res = await fetch("/api/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId, phone: "0912345678" })
      });
      const data = await res.json();
      const selectedClinic = clinics.find(c => c.id === clinicId);

      if (res.ok) {
        setLockInfo({
          lockId: data.lockId,
          expiresAt: data.expiresAt,
          clinicName: data.clinicName,
          clinicAddress: selectedClinic?.address || ""
        });
        setStep('locked');
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Lock error", err);
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-clinical-white selection:bg-blue-100 relative">
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="pt-10"
          >
            <SymptomInput onAnalyze={handleAnalyze} />
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnalysisLoader />
          </motion.div>
        )}

        {step === 'results' && analysis && (
          <motion.div
            key="results"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-8 space-y-6 pb-24"
          >
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setStep('input')} 
                className="w-10 h-10 bg-white shadow-sm border border-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-natural-text transition-colors"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-core-blue rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">緊急分析報告</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] natural-shadow border border-gray-50/50 relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      analysis.urgency > 7 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-core-blue'
                    }`}>
                      緊急分流：Level {analysis.urgency}
                    </span>
                    <h2 className="text-3xl font-extrabold text-natural-text mt-2">{analysis.department}</h2>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    analysis.urgency > 7 ? 'bg-red-50' : 'bg-blue-50'
                  }`}>
                    <AlertCircle className={analysis.urgency > 7 ? 'text-red-500' : 'text-core-blue'} size={24} />
                  </div>
                </div>

                {analysis.warning_label && (
                  <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
                    <p className="text-sm font-semibold text-red-600 leading-snug">
                      {analysis.warning_label}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-natural-text text-lg">智能匹配最近診所</h3>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  即時狀態盤點
                </span>
              </div>
              
              <div className="space-y-3">
                {clinics.map((clinic, index) => (
                  <ClinicCard 
                    key={clinic.id} 
                    clinic={clinic} 
                    onLock={handleLock} 
                    urgency={analysis.urgency} 
                    isFirst={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Bar Integration */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-clinical-white via-clinical-white to-transparent max-w-lg mx-auto z-40">
              <div className="bg-natural-text text-white p-5 rounded-2xl flex items-center justify-between shadow-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Phone size={20} className="text-core-blue" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">緊急協助專線</p>
                    <p className="font-mono text-sm">24H EMERGENCY</p>
                  </div>
                </div>
                <button className="bg-core-blue hover:bg-blue-600 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg blue-shadow">
                  立即撥打
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 'locked' && lockInfo && (
        <LockScreen lockInfo={lockInfo} onFinish={() => setStep('results')} />
      )}
    </div>
  );
}
