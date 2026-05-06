// --- Configuration & Data ---
const CONFIG = {
    MOCK_CLINICS: [
        { id: "1", name: "寵之星 24H 急診 (Star Pet 24H)", address: "台北市信義區忠孝東路五段2號", slotsCount: 2, distance: "0.8km" },
        { id: "2", name: "愛生動物醫院 (Aisheng Animal Hospital)", address: "台北市大安區和平東路二段339號", slotsCount: 1, distance: "1.2km" },
        { id: "3", name: "康和寵物急診中心 (Kanghe Emergency)", address: "台北市松山區南京東路四段10號", slotsCount: 3, distance: "2.5km" }
    ],
    LOCK_DURATION_SECONDS: 180
};

// --- App State Management ---
const app = {
    viewElements: {
        input: document.getElementById('view-input'),
        analyzing: document.getElementById('view-analyzing'),
        results: document.getElementById('view-results'),
        locked: document.getElementById('view-locked'),
        modalSettings: document.getElementById('modal-settings')
    },
    state: {
        currentView: 'input',
        symptoms: '',
        analysis: null,
        lockId: null,
        lockExpiresAt: null,
        lockedClinic: null,
        apiKey: localStorage.getItem('GEMINI_API_KEY') || ''
    },

    init() {
        lucide.createIcons();
        this.showInput();
        this.bindEvents();
        
        // Polling emulation for slots
        setInterval(() => this.updateClinicsUI(), 10000);
    },

    bindEvents() {
        document.getElementById('btn-analyze').addEventListener('click', () => this.handleAnalysis());
        document.getElementById('btn-settings').addEventListener('click', () => {
            this.viewElements.modalSettings.classList.remove('hidden');
            document.getElementById('api-key-input').value = this.state.apiKey;
        });
        document.getElementById('btn-save-key').addEventListener('click', () => {
            const key = document.getElementById('api-key-input').value.trim();
            this.state.apiKey = key;
            localStorage.setItem('GEMINI_API_KEY', key);
            this.viewElements.modalSettings.classList.add('hidden');
        });
        document.getElementById('btn-navigate').addEventListener('click', () => {
            if (this.state.lockedClinic) {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(this.state.lockedClinic.address)}`;
                window.open(url, '_blank');
            }
        });
    },

    showView(viewName) {
        Object.keys(this.viewElements).forEach(key => {
            if (this.viewElements[key]) {
                this.viewElements[key].classList.add('hidden');
            }
        });
        this.viewElements[viewName].classList.remove('hidden');
        this.state.currentView = viewName;
        lucide.createIcons(); // Re-render icons for new view
    },

    showInput() { this.showView('input'); },
    showAnalyzing() { this.showView('analyzing'); },
    showResults() { this.showView('results'); },
    showLocked(clinic) {
        this.state.lockedClinic = clinic;
        this.state.lockExpiresAt = Date.now() + (CONFIG.LOCK_DURATION_SECONDS * 1000);
        
        document.getElementById('locked-clinic-name').textContent = clinic.name;
        document.getElementById('locked-clinic-address').textContent = clinic.address;
        
        this.showView('locked');
        this.startCountdown();
    },

    async handleAnalysis() {
        const input = document.getElementById('symptom-input').value.trim();
        if (!input) return;
        
        this.state.symptoms = input;
        this.showAnalyzing();

        let result;
        if (this.state.apiKey) {
            result = await this.callGeminiAPI(input);
        } else {
            // Mock result for demo if no API key
            await new Promise(r => setTimeout(r, 2000));
            result = {
                urgency: 8,
                department: "心臟外科 / 急診",
                warning_label: "寵物呼吸困難，請儘速在 15 分鐘內抵達診所。"
            };
        }

        this.state.analysis = result;
        this.renderResults();
        this.showResults();
    },

    async callGeminiAPI(symptoms) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.state.apiKey}`;
        
        const payload = {
            contents: [{ parts: [{ text: symptoms }] }],
            systemInstruction: {
                parts: [{ text: "You are a pet emergency dispatcher. Analyze the symptoms and return a JSON object.\n- urgency: integer 1-10\n- department: string (e.g., \"Surgery\", \"Internal Medicine\", \"Toxicology\", \"ER\")\n- warning_label: string (Short warning if urgency > 7, otherwise empty)\nALWAYS respond in valid JSON." }]
            },
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            return JSON.parse(text);
        } catch (error) {
            console.error("Gemini API Error:", error);
            return { urgency: 5, department: "一般急診", warning_label: "連線異常，請手動前往診所。" };
        }
    },

    renderResults() {
        const container = document.getElementById('analysis-card');
        const a = this.state.analysis;
        const colorClass = a.urgency > 7 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600';
        const iconColor = a.urgency > 7 ? 'text-red-500' : 'text-[#2563EB]';

        container.innerHTML = `
            <div class="relative z-10 space-y-6">
                <div class="flex justify-between items-start">
                    <div class="space-y-1">
                        <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${colorClass}">
                            緊急分流：Level ${a.urgency}
                        </span>
                        <h2 class="text-3xl font-extrabold text-[#1A1A1A] mt-2">${a.department}</h2>
                    </div>
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center ${a.urgency > 7 ? 'bg-red-50' : 'bg-blue-50'}">
                        <i data-lucide="alert-circle" class="${iconColor} w-6 h-6"></i>
                    </div>
                </div>
                ${a.warning_label ? `
                    <div class="bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
                        <p class="text-sm font-semibold text-red-600 leading-snug">${a.warning_label}</p>
                    </div>
                ` : ''}
            </div>
        `;
        this.updateClinicsUI();
    },

    updateClinicsUI() {
        const list = document.getElementById('clinics-list');
        if (!list) return;

        list.innerHTML = CONFIG.MOCK_CLINICS.map((c, i) => {
            const isFirst = i === 0;
            // Randomize availability for "live" feel
            const available = Math.max(0, c.slotsCount - (Math.random() > 0.7 ? 1 : 0));
            
            return `
                <div class="p-5 rounded-3xl transition-all relative overflow-hidden flex justify-between items-center ${isFirst ? 'bg-[#2563EB] text-white shadow-xl blue-shadow' : 'bg-white border border-gray-100 shadow-sm'}">
                    <div class="space-y-1">
                        ${isFirst ? '<div class="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-1">最快抵達 / 推薦</div>' : ''}
                        <h3 class="font-bold ${isFirst ? 'text-lg' : 'text-md'}">${c.name}</h3>
                        <div class="text-[10px] flex items-center gap-1 ${isFirst ? 'opacity-80' : 'text-gray-400'}">
                            <i data-lucide="map-pin" class="w-2.5 h-2.5"></i> ${c.distance} · 預計 15 分內抵達
                        </div>
                    </div>
                    <div class="text-right flex flex-col items-end space-y-3">
                        <div class="flex flex-col items-end">
                            <span class="text-[10px] font-bold uppercase tracking-tighter ${isFirst ? 'opacity-70' : 'text-gray-400'}">剩餘席位</span>
                            <div class="flex gap-1 mt-1">
                                ${[1, 2, 3].map(slotIdx => `
                                    <div class="w-3 h-1 rounded-full ${slotIdx <= available ? (isFirst ? 'bg-white' : 'bg-green-500') : (isFirst ? 'bg-white/20' : 'bg-gray-100')}"></div>
                                `).join('')}
                            </div>
                        </div>
                        <button onclick="app.reserveSlot('${c.id}')" ${available === 0 ? 'disabled' : ''} 
                           class="px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wide transition-all active:scale-95 ${isFirst ? 'bg-white text-[#2563EB] shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">
                           ${isFirst ? '搶佔席位' : '保留席位'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    },

    reserveSlot(id) {
        const clinic = CONFIG.MOCK_CLINICS.find(c => c.id === id);
        if (clinic) {
            this.showLocked(clinic);
        }
    },

    startCountdown() {
        if (this.timer) clearInterval(this.timer);
        
        const update = () => {
            const now = Date.now();
            const left = Math.max(0, Math.floor((this.state.lockExpiresAt - now) / 1000));
            
            const mm = Math.floor(left / 60).toString().padStart(2, '0');
            const ss = (left % 60).toString().padStart(2, '0');
            document.getElementById('countdown').textContent = `${mm}:${ss}`;

            if (left <= 0) {
                clearInterval(this.timer);
                alert("預約已過期，請重新搜尋。");
                this.showResults();
            }
        };
        
        update();
        this.timer = setInterval(update, 1000);
    }
};

// Start the app
window.onload = () => app.init();
