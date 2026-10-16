// app.js: Cédula B Simulator & E-Learning Platform Lógica

window.onerror = function(message, source, lineno, colno, error) {
    alert("Runtime Error: " + message + "\nLine: " + lineno + "\nSource: " + source);
    return false;
};

// Mock Database of Agents and SaaS details (Cédula B Modules)
let promoterData = {
    tokens: 7, // remaining days to assign
    totalGiftedThisQuarter: 7, // tracked for free tier
    agents: [
        {
            id: 1,
            name: "Sofía Gutiérrez",
            initials: "SG",
            email: "sofia.g@agencia.com",
            status: "active",
            studyTime: 1485, // minutes (24h 45m)
            remainingDays: 5,
            attempts: [
                { date: "2026-06-10", score: 55, passed: false },
                { date: "2026-06-15", score: 62, passed: false },
                { date: "2026-06-20", score: 68, passed: false },
                { date: "2026-06-25", score: 71, passed: true },
                { date: "2026-06-29", score: 74, passed: true }
            ],
            timesPerModule: {
                "Seguro de Personas (Grupo y Colectivo)": 420,
                "Seguro de Daños: Incendio y Catastróficos": 210,
                "Marítimo, Transportes y Automóviles Flotillas": 320,
                "Responsabilidad Civil y Admón. de Riesgos": 240,
                "Ramos Técnicos de Daños": 195,
                "Ramos Diversos y Misceláneos": 100,
                "Regulación CNSF, Marco Legal y PLD": 0
            },
            moduleScores: {
                "Seguro de Personas (Grupo y Colectivo)": 82,
                "Seguro de Daños: Incendio y Catastróficos": 78,
                "Marítimo, Transportes y Automóviles Flotillas": 72,
                "Responsabilidad Civil y Admón. de Riesgos": 68,
                "Ramos Técnicos de Daños": 64,
                "Ramos Diversos y Misceláneos": 58,
                "Regulación CNSF, Marco Legal y PLD": 0
            }
        },
        {
            id: 2,
            name: "Carlos Martínez",
            initials: "CM",
            email: "carlos.m@agencia.com",
            status: "active",
            studyTime: 920, // 15h 20m
            remainingDays: 10,
            attempts: [
                { date: "2026-06-12", score: 58, passed: false },
                { date: "2026-06-22", score: 64, passed: false },
                { date: "2026-06-28", score: 65, passed: false }
            ],
            timesPerModule: {
                "Seguro de Personas (Grupo y Colectivo)": 310,
                "Seguro de Daños: Incendio y Catastróficos": 150,
                "Marítimo, Transportes y Automóviles Flotillas": 240,
                "Responsabilidad Civil y Admón. de Riesgos": 180,
                "Ramos Técnicos de Daños": 40,
                "Ramos Diversos y Misceláneos": 0,
                "Regulación CNSF, Marco Legal y PLD": 0
            },
            moduleScores: {
                "Seguro de Personas (Grupo y Colectivo)": 70,
                "Seguro de Daños: Incendio y Catastróficos": 65,
                "Marítimo, Transportes y Automóviles Flotillas": 68,
                "Responsabilidad Civil y Admón. de Riesgos": 60,
                "Ramos Técnicos de Daños": 45,
                "Ramos Diversos y Misceláneos": 0,
                "Regulación CNSF, Marco Legal y PLD": 0
            }
        },
        {
            id: 3,
            name: "Lucía Ramírez",
            initials: "LR",
            email: "lucia.r@agencia.com",
            status: "inactive",
            studyTime: 490, // 8h 10m
            remainingDays: 0,
            attempts: [
                { date: "2026-06-05", score: 52, passed: false }
            ],
            timesPerModule: {
                "Seguro de Personas (Grupo y Colectivo)": 200,
                "Seguro de Daños: Incendio y Catastróficos": 90,
                "Marítimo, Transportes y Automóviles Flotillas": 120,
                "Responsabilidad Civil y Admón. de Riesgos": 80,
                "Ramos Técnicos de Daños": 0,
                "Ramos Diversos y Misceláneos": 0,
                "Regulación CNSF, Marco Legal y PLD": 0
            },
            moduleScores: {
                "Seguro de Personas (Grupo y Colectivo)": 55,
                "Seguro de Daños: Incendio y Catastróficos": 50,
                "Marítimo, Transportes y Automóviles Flotillas": 52,
                "Responsabilidad Civil y Admón. de Riesgos": 48,
                "Ramos Técnicos de Daños": 0,
                "Ramos Diversos y Misceláneos": 0,
                "Regulación CNSF, Marco Legal y PLD": 0
            }
        },
        {
            id: 4,
            name: "Alejandro Gómez",
            initials: "AG",
            email: "alejandro.g@agencia.com",
            status: "active",
            studyTime: 270, // 4h 30m
            remainingDays: 3,
            attempts: [],
            timesPerModule: {
                "Seguro de Personas (Grupo y Colectivo)": 120,
                "Seguro de Daños: Incendio y Catastróficos": 50,
                "Marítimo, Transportes y Automóviles Flotillas": 100,
                "Responsabilidad Civil y Admón. de Riesgos": 0,
                "Ramos Técnicos de Daños": 0,
                "Ramos Diversos y Misceláneos": 0,
                "Regulación CNSF, Marco Legal y PLD": 0
            },
            moduleScores: {
                "Seguro de Personas (Grupo y Colectivo)": 60,
                "Seguro de Daños: Incendio y Catastróficos": 52,
                "Marítimo, Transportes y Automóviles Flotillas": 48,
                "Responsabilidad Civil y Admón. de Riesgos": 0,
                "Ramos Técnicos de Daños": 0,
                "Ramos Diversos y Misceláneos": 0,
                "Regulación CNSF, Marco Legal y PLD": 0
            }
        },
        {
            id: 5,
            name: "Beatriz Soto",
            initials: "BS",
            email: "beatriz.s@agencia.com",
            status: "active",
            studyTime: 1875, // 31h 15m
            remainingDays: 12,
            attempts: [
                { date: "2026-06-18", score: 68, passed: false },
                { date: "2026-06-22", score: 75, passed: true },
                { date: "2026-06-26", score: 81, passed: true },
                { date: "2026-06-29", score: 86, passed: true }
            ],
            timesPerModule: {
                "Seguro de Personas (Grupo y Colectivo)": 510,
                "Seguro de Daños: Incendio y Catastróficos": 320,
                "Marítimo, Transportes y Automóviles Flotillas": 490,
                "Responsabilidad Civil y Admón. de Riesgos": 340,
                "Ramos Técnicos de Daños": 215,
                "Ramos Diversos y Misceláneos": 0,
                "Regulación CNSF, Marco Legal y PLD": 0
            },
            moduleScores: {
                "Seguro de Personas (Grupo y Colectivo)": 90,
                "Seguro de Daños: Incendio y Catastróficos": 84,
                "Marítimo, Transportes y Automóviles Flotillas": 82,
                "Responsabilidad Civil y Admón. de Riesgos": 80,
                "Ramos Técnicos de Daños": 74,
                "Ramos Diversos y Misceláneos": 0,
                "Regulación CNSF, Marco Legal y PLD": 0
            }
        },
        {
            id: 99,
            name: "Tú (Cuenta de Estudio)",
            initials: "PP",
            email: "promotor.estudio@agencia.com",
            status: "inactive",
            studyTime: 0,
            remainingDays: 0,
            attempts: [],
            timesPerModule: {
                "Seguro de Personas (Grupo y Colectivo)": 0,
                "Seguro de Daños: Incendio y Catastróficos": 0,
                "Marítimo, Transportes y Automóviles Flotillas": 0,
                "Responsabilidad Civil y Admón. de Riesgos": 0,
                "Ramos Técnicos de Daños": 0,
                "Ramos Diversos y Misceláneos": 0,
                "Regulación CNSF, Marco Legal y PLD": 0
            },
            moduleScores: {
                "Seguro de Personas (Grupo y Colectivo)": 0,
                "Seguro de Daños: Incendio y Catastróficos": 0,
                "Marítimo, Transportes y Automóviles Flotillas": 0,
                "Responsabilidad Civil y Admón. de Riesgos": 0,
                "Ramos Técnicos de Daños": 0,
                "Ramos Diversos y Misceláneos": 0,
                "Regulación CNSF, Marco Legal y PLD": 0
            }
        }
    ]
};

// Global App State

// NextAuth & Neon DB Integration variables
let currentUser = null; 

async function checkSession() {
    try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        
        if (!session || !session.user) {
            window.location.href = '/login';
            return false;
        }
        
        currentUser = session.user;
        console.log("Logged in user:", currentUser);
        
        // Determine role (add hardcoded fallback for super admin email in case JWT session is stale)
        const isSuperAdminEmail = currentUser.email === "enrique.ahumada@aacommx.com" || currentUser.email === "desarrollo.agencias@gmail.com";
        currentRole = (currentUser.email.toLowerCase().includes("promotor") || isSuperAdminEmail || currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" || currentUser.role === "PROMOTER" || currentUser.role === "PROMOTOR") ? "promoter" : "agent";
        
        // Load data from DB
        await refreshUserData();
        return true;
    } catch (err) {
        console.error("Session check failed, using local fallback mode:", err);
        return false;
    }
}

async function refreshUserData() {
    try {
        if (currentRole === "promoter") {
            const res = await fetch('/api/cedula-b/promoter-data');
            if (res.status === 403) {
                const data = await res.json();
                if (data.trial) {
                    showTrialBlockedScreen();
                    return false;
                }
            }
            if (res.ok) {
                promoterData = await res.json();
                console.log("Loaded promoterData from Neon DB:", promoterData);
                
                // Render replenish date if element exists
                const replenishDateVal = promoterData.nextReplenishDate || promoterData.promoter?.nextReplenish;
                if (replenishDateVal) {
                    const nextDateStr = new Date(replenishDateVal).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                    const dateEl = document.getElementById('replenish-date');
                    if (dateEl) {
                        dateEl.innerText = `Fecha de reposición de créditos: ${nextDateStr}`;
                    }
                }
                
                // Also set activeAgent to promoter's self account
                const myEmail = currentUser?.email?.toLowerCase();
                activeAgent = promoterData.agents.find(a => a.id === 99) || 
                              promoterData.agents.find(a => a.email?.toLowerCase() === myEmail) || 
                              promoterData.agents[0];
            }
        } else {
            const res = await fetch('/api/cedula-b/agent-data');
            if (res.status === 403) {
                const data = await res.json();
                if (data.trial) {
                    showTrialBlockedScreen();
                    return false;
                }
            }
            if (res.ok) {
                activeAgent = await res.json();
                console.log("Loaded agent data from Neon DB:", activeAgent);
                
                // Mock promoterData wrapper so existing agent UI works
                promoterData = {
                    tokens: 0,
                    totalGiftedThisQuarter: 0,
                    agents: [activeAgent]
                };
            }
        }
        return true;
    } catch (err) {
        console.error("Failed to refresh user data from DB:", err);
        return false;
    }
}

let currentRole = "promoter"; // promoter or agent
let activeTab = "promoter-dash";
let questionsDb = [];
let fallbackQuestions = [
    {
        "id": 1,
        "module": "Seguro de Personas (Grupo y Colectivo)",
        "question": "¿Cuál es el documento que la aseguradora entrega a cada integrante asegurado dentro de una póliza de Seguro de Vida Grupo?",
        "options": ["Carátula de póliza individual", "Certificado individual", "Endoso de inclusión", "Consentimiento de tarifa"],
        "correct": 1,
        "explanation": "En los seguros de Grupo y Colectivos, el contratante recibe la póliza maestra y cada integrante asegurado recibe un Certificado Individual que acredita su cobertura y designación de beneficiarios."
    },
    {
        "id": 2,
        "module": "Seguro de Daños: Incendio y Catastróficos",
        "question": "En el seguro empresarial de Incendio, ¿qué cobertura ampara los gastos fijos que continúan generándose cuando la empresa detiene operaciones por un siniestro cubierto?",
        "options": ["Remoción de escombros", "Pérdidas consecuenciales (reducción de ingresos / gastos fijos)", "Cobertura básica de edificio", "Inflación y revaluación"],
        "correct": 1,
        "explanation": "La cobertura de Pérdidas Consecuenciales (o Lucro Cesante / Interrupción de Negocios) indemniza la pérdida de utilidad neta y los gastos fijos permanentes durante la paralización forzosa por un siniestro amparado."
    },
    {
        "id": 3,
        "module": "Marítimo, Transportes y Automóviles Flotillas",
        "question": "¿Qué principio del seguro marítimo implica que todos los interesados en la expedición marítima contribuyan proporcionalmente ante un sacrificio extraordinario hecho por el capitán para salvar el buque y la carga?",
        "options": ["Avería Particular", "Avería Gruesa o Común", "Abandono de Mercancías", "Subrogación Portuaria"],
        "correct": 1,
        "explanation": "La Avería Gruesa o Común se configura cuando se realiza intencional y razonablemente un sacrificio o gasto extraordinario para la seguridad común del buque y las mercancías ante un peligro inminente."
    },
    {
        "id": 4,
        "module": "Responsabilidad Civil y Admón. de Riesgos",
        "question": "Dentro del proceso de Administración de Riesgos Empresariales, ¿cuál es la etapa que consiste en transferir financieramente las consecuencias económicas del riesgo a una institución aseguradora?",
        "options": ["Identificación del riesgo", "Eliminación física del riesgo", "Transferencia del riesgo", "Retención pasiva"],
        "correct": 2,
        "explanation": "El seguro constituye el mecanismo financiero por excelencia de transferencia del riesgo, trasladando el impacto severo del siniestro del balance de la empresa a la mutualidad administrada por la aseguradora."
    },
    {
        "id": 5,
        "module": "Ramos Técnicos de Daños",
        "question": "¿Qué ramo técnico cubre los daños internos sufridos por maquinaria industrial en operación a causa de impericia, corto circuito, falta de agua en calderas o fuerza centrífuga?",
        "options": ["Obra Civil en Construcción", "Rotura de Maquinaria", "Incendio Todo Riesgo", "Transporte de Maquinaria"],
        "correct": 1,
        "explanation": "El seguro de Rotura de Maquinaria ampara accidentes súbitos e imprevistos ocurridos a la maquinaria fija durante su operación normal, incluyendo causas internas, eléctricas o errores de manejo."
    },
    {
        "id": 6,
        "module": "Ramos Diversos y Misceláneos",
        "question": "En el seguro de Robo de Mercancías para empresas, ¿cómo se define el robo con violencia?",
        "options": [
            "El extravío de inventario detectado durante la auditoría anual",
            "El apoderamiento de bienes dejando huellas visibles de fuerza en el local o ejerciendo violencia física o moral sobre las personas",
            "El fraude cometido por empleados del área contable sin forzar cerraduras",
            "La pérdida de mercancía durante maniobras de carga y descarga"
        ],
        "correct": 1,
        "explanation": "La cobertura de Robo con Violencia exige que el perpetrador penetre del exterior al interior dejando señales visibles de violencia en los accesos, o bien mediante asalto (violencia física o moral sobre las personas)."
    },
    {
        "id": 7,
        "module": "Regulación CNSF, Marco Legal y PLD",
        "question": "Conforme al artículo 492 de la LISF en materia de Prevención de Lavado de Dinero (PLD), las instituciones y agentes de seguros están obligados a:",
        "options": [
            "Integrar el expediente de identificación del cliente y reportar operaciones relevantes, inusuales e internas preocupantes",
            "Congelar directamente las cuentas bancarias del contratante sin orden judicial",
            "Publicar la lista de asegurados investigados en el Diario Oficial",
            "Exentar de identificación a personas morales con primas mayores a 10,000 USD"
        ],
        "correct": 0,
        "explanation": "Las Disposiciones de Carácter General a que se refiere el artículo 492 de la LISF obligan a identificar y conocer al cliente (KYC), conservar la documentación por al menos 10 años y coadyuvar en los reportes regulatorios."
    }
];

// Current Agent State (Default Sofía Gutiérrez)
let activeAgent = promoterData.agents[0]; 

// Study Mode State
let studyModule = "Seguro de Personas (Grupo y Colectivo)";
let studyQuestions = [];
let studyCurrentIdx = 0;
let studyTimerInterval = null;
let studySessionSeconds = 0;
let isSpeaking = false;
let speechUtterance = null;

// Simulator State
let simQuestions = [];
let simCurrentIdx = 0;
let simAnswers = {}; // { questionIndex: selectedOptionIndex }
let simTimerInterval = null;
let simRemainingSeconds = 7200; // 2 hours

// Charts elements
let studyTimeChartInstance = null;
let strengthsChartInstance = null;

// Initialize App
window.addEventListener("DOMContentLoaded", async () => {
    const loggedIn = await checkSession();
    if (!loggedIn) return; // redirected to login
    
    await loadQuestions();
    
    // Set initial active state
    switchRole(currentRole);
    
    setupAgentListSelector();
    initGlobalTimers();
});

// Load questions from JSON or use fallback
async function loadQuestions() {
    try {
        const response = await fetch('/api/cedula-b/preguntas?v=8', { cache: 'no-store' });
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("Empty DB response");
        const hasAllExplanations = data.every(q => (q.explanation || q.explicacion || "").length > 40);
        if (!hasAllExplanations) {
            throw new Error("Stale response lacking pedagogical explanations; falling back to canonical preguntas.json");
        }
        questionsDb = data;
        console.log(`Loaded ${questionsDb.length} verified Cédula B questions with explanations.`);
    } catch (e) {
        console.log("Loading canonical local preguntas.json?v=8:", e);
        try {
            const response = await fetch('preguntas.json?v=8', { cache: 'no-store' });
            if (!response.ok) throw new Error("Local file error");
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) throw new Error("Empty local file");
            questionsDb = data;
        } catch (localErr) {
            console.log("Local fallback failed. Using mock seeds:", localErr);
            questionsDb = fallbackQuestions;
        }
    }
}

// -------------------------------------------------------------
// TIMER REGISTRATION (Track Study time dynamically)
// -------------------------------------------------------------
let progressSyncCounter = 0;
function initGlobalTimers() {
    // Session timer for study mode
    setInterval(async () => {
        if (activeTab === "agent-study" && currentRole === "agent") {
            studySessionSeconds++;
            progressSyncCounter++;
            
            // Format timer display
            const minutes = Math.floor(studySessionSeconds / 60);
            const seconds = studySessionSeconds % 60;
            const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            const timerEl = document.getElementById("study-session-timer");
            if (timerEl) timerEl.innerText = formatted;

            // Log time in active agent profile (1 second = 1/60 minute)
            activeAgent.studyTime += (1 / 60);
            if (activeAgent.timesPerModule[studyModule] !== undefined) {
                activeAgent.timesPerModule[studyModule] += (1 / 60);
            } else {
                activeAgent.timesPerModule[studyModule] = (1 / 60);
            }

            // Sync to Neon DB every 10 seconds
            if (progressSyncCounter >= 10) {
                progressSyncCounter = 0;
                try {
                    await fetch('/api/cedula-b/progreso', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            module: studyModule,
                            tiempo_segundos: Math.round(activeAgent.timesPerModule[studyModule] * 60),
                            pregunta_actual: activeAgent.studyProgress[studyModule] || 0
                        })
                    });
                } catch (e) {
                    console.error("Failed to sync progress to database:", e);
                }
            }
        }
    }, 1000);
}

// -------------------------------------------------------------
// NAVIGATION AND ROLE LOGIC
// -------------------------------------------------------------
function switchRole(role) {
    currentRole = role;
    
    // UI active buttons
    document.getElementById("btn-role-promoter").classList.toggle("active", role === "promoter");
    document.getElementById("btn-role-agent").classList.toggle("active", role === "agent");
    
    // Sidebar items visibility
    document.getElementById("nav-promoter-group").style.display = role === "promoter" ? "block" : "none";
    document.getElementById("nav-agent-group").style.display = role === "agent" ? "block" : "none";
    
    // User card update
    const nameEl = document.getElementById("user-display-name");
    const roleEl = document.getElementById("user-display-role");
    const avatarEl = document.getElementById("user-avatar-char");
    const roleSwitcher = document.querySelector(".role-switcher");
    const logoutBtn = document.getElementById("btn-logout");
 
    if (role === "promoter") {
        nameEl.innerText = "Promotor Principal";
        roleEl.innerText = "Organizador de Ventas";
        avatarEl.innerText = "P";
        
        // Show role switcher, hide logout
        if (roleSwitcher) roleSwitcher.style.display = "flex";
        if (logoutBtn) logoutBtn.style.display = "none";
        
        switchTab("promoter-dash");
    } else {
        // By default log into the promoter's personal study account (id: 99 or matching currentUser.email)
        const myEmail = currentUser?.email?.toLowerCase();
        activeAgent = promoterData.agents.find(a => a.id === 99) || 
                      promoterData.agents.find(a => a.email?.toLowerCase() === myEmail) || 
                      promoterData.agents[0];
        
        nameEl.innerText = activeAgent ? activeAgent.name : (currentUser?.name || "Mi Cuenta");
        roleEl.innerText = "Agente en Capacitación";
        avatarEl.innerText = activeAgent ? activeAgent.initials : "PR";
        
        // Hide role switcher, show logout (hides promoter navigation features from the agent view)
        if (roleSwitcher) roleSwitcher.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "flex";
        
        // Update agent metrics UI
        document.getElementById("agent-active-badge").innerText = `Acceso Activo (${activeAgent.remainingDays} días restantes)`;
        document.getElementById("agent-active-badge").className = activeAgent.remainingDays > 0 ? "status-badge active" : "status-badge inactive";
        document.getElementById("agent-total-study-time").innerText = `${Math.floor(activeAgent.studyTime / 60)}h ${Math.round(activeAgent.studyTime % 60)}m`;
        
        const lastAttempt = activeAgent.attempts[activeAgent.attempts.length - 1];
        document.getElementById("agent-last-score").innerText = lastAttempt ? `${lastAttempt.score}%` : "N/A";
        
        updateAgentDashboard();
        switchTab("agent-dash");
    }
}

function logoutAgent() {
    window.location.href = '/api/auth/signout';
}

function switchTab(tabId) {
    activeTab = tabId;
    
    // Stop speaking if switching tabs
    stopAudioSpeech();

    // Hide all panels
    const panels = document.querySelectorAll(".tab-panel");
    panels.forEach(p => p.classList.remove("active"));
    
    // Show selected panel
    const activePanel = document.getElementById(`panel-${tabId}`);
    if (activePanel) activePanel.classList.add("active");
    
    // Update navigation items active state
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(n => n.classList.remove("active"));
    
    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) activeNav.classList.add("active");

    // Specific panel actions
    if (tabId === "promoter-dash") {
        updatePromoterDashboard();
    } else if (tabId === "promoter-reports") {
        loadAgentReport();
    } else if (tabId === "agent-dash") {
        updateAgentDashboard();
    }
}

// -------------------------------------------------------------
// AGENT DASHBOARD & PROGRESS LOGIC
// -------------------------------------------------------------
function updateAgentDashboard() {
    const bannerContainer = document.getElementById("agent-restricted-banner-container");
    const container = document.getElementById("modules-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    const isAccessRestricted = activeAgent.remainingDays <= 0;
    
    // Render restricted warning banner
    if (bannerContainer) {
        if (isAccessRestricted) {
            bannerContainer.innerHTML = `
                <div class="glass-card" style="border: 1px solid rgba(239, 68, 68, 0.25); background: rgba(239, 68, 68, 0.08); color: #f87171; padding: 16px; margin-bottom: 24px; border-radius: 12px; display: flex; align-items: center; gap: 12px;">
                    <svg style="width:24px; height:24px; fill:currentColor; flex-shrink: 0;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    <div>
                        <div style="font-weight: 600; font-size: 15px; margin-bottom: 2px;">Acceso Restringido</div>
                        <div style="font-size: 13px; opacity: 0.95;">Tu promotor tiene que asignarte días de estudio para poder iniciar o continuar los módulos del curso.</div>
                    </div>
                </div>
            `;
        } else {
            bannerContainer.innerHTML = "";
        }
    }
    
    const modulesData = [
        { name: "Seguro de Personas (Grupo y Colectivo)", total: 175, display: "1. Personas (Grupo y Col.)" },
        { name: "Seguro de Daños: Incendio y Catastróficos", total: 71, display: "2. Daños: Incendio y Cat." },
        { name: "Marítimo, Transportes y Automóviles Flotillas", total: 79, display: "3. Marítimo y Flotillas" },
        { name: "Responsabilidad Civil y Admón. de Riesgos", total: 78, display: "4. Resp. Civil y Riesgos" },
        { name: "Ramos Técnicos de Daños", total: 90, display: "5. Ramos Técnicos" },
        { name: "Ramos Diversos y Misceláneos", total: 68, display: "6. Diversos y Misceláneos" },
        { name: "Regulación CNSF, Marco Legal y PLD", total: 84, display: "7. Regulación CNSF y PLD" }
    ];

    if (!activeAgent.studyProgress) {
        activeAgent.studyProgress = {};
    }

    let totalCompletedModules = 0;

    modulesData.forEach(mod => {
        const dbCount = Array.isArray(questionsDb) && questionsDb.length > 10
            ? questionsDb.filter(q => q.module === mod.name).length
            : 0;
        const effectiveTotal = dbCount > 0 ? dbCount : mod.total;
        mod.total = effectiveTotal;
        const currentIdx = activeAgent.studyProgress[mod.name] || 0;
        
        let pct = 0;
        if (currentIdx > 0) {
            pct = Math.min(100, Math.round((currentIdx / effectiveTotal) * 100));
        }
        
        if (pct >= 100) {
            totalCompletedModules++;
        }

        const progressFillStyle = `width: ${pct}%;`;
        
        let btnClass = "btn-primary";
        let btnText = "Iniciar";
        
        if (pct >= 100) {
            btnClass = "btn-secondary";
            btnText = "Repasar";
        } else if (pct > 0) {
            btnClass = "btn-primary";
            btnText = "Estudiar";
        }

        const card = document.createElement("div");
        card.className = "glass-card";
        card.style.cssText = "border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.15);";
        if (isAccessRestricted) {
            card.style.opacity = "0.6";
        }
        
        const buttonHTML = isAccessRestricted 
            ? `<button class="${btnClass}" style="padding: 6px 12px; font-size: 12px; opacity: 0.5; cursor: not-allowed;" onclick="event.stopPropagation(); alert('Tu promotor tiene que asignarte días de estudio.');" disabled>${btnText}</button>`
            : `<button class="${btnClass}" style="padding: 6px 12px; font-size: 12px;" onclick="launchStudyModule('${mod.name}')">${btnText}</button>`;
        
        card.innerHTML = `
            <h4 style="margin-bottom: 8px;">${mod.display}</h4>
            <div class="progress-bar-container" style="margin-bottom: 12px;">
                <div class="progress-bar-fill" style="${progressFillStyle}"></div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:12px; color:var(--text-secondary);">${mod.total} Preguntas • ${pct}% Comp.</span>
                ${buttonHTML}
            </div>
        `;
        container.appendChild(card);
    });

    const totalModulesCount = modulesData.length || 7;
    const overallCompletionPct = Math.round((totalCompletedModules / totalModulesCount) * 100);
    const overallText = `${totalCompletedModules} de ${totalModulesCount} Módulos completados`;
    
    const progressPercentEl = document.getElementById("agent-curriculum-progress");
    if (progressPercentEl) {
        progressPercentEl.innerText = `${overallCompletionPct}%`;
    }
    const progressDescEl = document.getElementById("agent-curriculum-desc");
    if (progressDescEl) {
        progressDescEl.innerText = overallText;
    }
}

async function syncStudyProgressImmediate() {
    if (currentRole !== "agent" || !studyModule) return;
    try {
        await fetch('/api/cedula-b/progreso', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                module: studyModule,
                tiempo_segundos: Math.round((activeAgent.timesPerModule[studyModule] || 0) * 60),
                pregunta_actual: activeAgent.studyProgress[studyModule] || 0
            })
        });
    } catch (e) {
        console.error("Failed to immediate sync progress:", e);
    }
}

// -------------------------------------------------------------
// PROMOTER DASHBOARD LOGIC
// -------------------------------------------------------------
function updatePromoterDashboard() {
    // Global metrics
    const tokens = typeof promoterData.tokens === 'number' ? promoterData.tokens : (promoterData.promoter?.tokens ?? 0);
    const tokenEl = document.getElementById("promoter-tokens");
    if (tokenEl) tokenEl.innerText = `${tokens} Días`;
    
    const quotaDescEl = document.getElementById("promoter-quota-desc");
    if (quotaDescEl) {
        const planLimit = promoterData.planLimit || promoterData.promoter?.planLimit || 52;
        quotaDescEl.innerHTML = `Tienes <strong>${planLimit} días incluidos</strong> garantizados según tu suscripción. Adquiere paquetes adicionales de 7 días por <strong>$299 MXN</strong> para distribuirlos entre tus agentes en formación.`;
    }
    
    document.getElementById("stat-active-agents").innerText = promoterData.agents.filter(a => a.remainingDays > 0).length;
    
    let sumTime = 0;
    let sumScores = 0;
    let countAttempts = 0;
    
    promoterData.agents.forEach(a => {
        sumTime += a.studyTime;
        a.attempts.forEach(att => {
            sumScores += att.score;
            countAttempts++;
        });
    });
    
    document.getElementById("stat-total-time").innerText = `${Math.floor(sumTime / 60)}h ${Math.round(sumTime % 60)}m`;
    document.getElementById("stat-avg-score").innerText = countAttempts > 0 ? `${(sumScores / countAttempts).toFixed(1)}%` : "N/A";
    
    // Render Agent Table
    const tbody = document.querySelector("#agents-table tbody");
    tbody.innerHTML = "";
    
    promoterData.agents.forEach(agent => {
        const tr = document.createElement("tr");
        
        const avgScore = agent.attempts.length > 0 
            ? `${Math.round(agent.attempts.reduce((sum, a) => sum + a.score, 0) / agent.attempts.length)}%`
            : "N/A";
            
        const statusClass = agent.remainingDays > 0 ? "active" : "inactive";
        const statusText = agent.remainingDays > 0 ? "Activo" : "Sin Tiempo";
        
        tr.innerHTML = `
            <td>
                <div class="agent-cell">
                    <div class="agent-initials">${agent.initials}</div>
                    <div>
                        <div style="font-weight:600;">${agent.name}</div>
                        <div style="font-size:12px; color:var(--text-secondary);">${agent.email}</div>
                    </div>
                </div>
            </td>
            <td>${Math.floor(agent.studyTime / 60)}h ${Math.round(agent.studyTime % 60)}m</td>
            <td>${agent.attempts.length} Exámenes</td>
            <td>${avgScore}</td>
            <td style="font-weight: 600;">${agent.remainingDays} Días</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-secondary" style="padding: 6px 12px; font-size: 13px;" onclick="assignDaysPrompt(${agent.id})">+ Asignar Días</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function assignDaysPrompt(agentId) {
    const agent = promoterData.agents.find(a => String(a.id) === String(agentId));
    if (!agent) return;
    
    const availableTokens = typeof promoterData.tokens === 'number' ? promoterData.tokens : (promoterData.promoter?.tokens ?? 0);
    
    if (availableTokens <= 0) {
        alert("No tienes días disponibles para transferir en tu saldo. Adquiere un paquete primero.");
        return;
    }
    
    const days = prompt(`¿Cuántos días de simulador deseas asignarle a ${agent.name}? (Tienes ${availableTokens} días disponibles)`);
    if (days === null) return;
    
    const parsedDays = parseInt(days);
    
    if (isNaN(parsedDays) || parsedDays <= 0) {
        alert("Por favor ingresa un número de días válido.");
        return;
    }
    
    if (parsedDays > availableTokens) {
        alert(`No tienes suficientes días de saldo. Disponibles: ${availableTokens}. Adquiere un paquete primero.`);
        return;
    }
    
    try {
        const res = await fetch('/api/cedula-b/licencias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'assign', agentEmail: agent.email, days: parsedDays })
        });
        if (res.ok) {
            await refreshUserData();
            updatePromoterDashboard();
            setupAgentListSelector();
            alert(`Se han transferido ${parsedDays} días de estudio a ${agent.name} con éxito.`);
        } else {
            const errData = await res.json();
            alert(`Error al transferir días: ${errData.error}`);
        }
    } catch (e) {
        console.error(e);
        alert("Error al transferir días.");
    }
}

async function buyTokens() {
    const promoCode = prompt("¿Deseas comprar un paquete de 7 días para tu estructura por $299 MXN?\n\nSi tienes un código de descuento, ingrésalo aquí (déjalo vacío si no tienes):");
    
    if (promoCode === null) {
        return;
    }

    try {
        const response = await fetch('/api/checkout/promoter-package', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ promoCode: promoCode.trim() })
        });

        const data = await response.json();

        if (response.ok && data.url) {
            window.location.href = data.url;
        } else {
            alert(data.error || "Ocurrió un error al iniciar la compra.");
        }
    } catch (error) {
        console.error("Error al iniciar checkout:", error);
        alert("Error de conexión. Inténtalo más tarde.");
    }
}

// -------------------------------------------------------------
// REPORTS / CHARTING LOGIC
// -------------------------------------------------------------
function setupAgentListSelector() {
    const selector = document.getElementById("agent-selector");
    selector.innerHTML = "";
    promoterData.agents.forEach(agent => {
        const opt = document.createElement("option");
        opt.value = agent.id;
        opt.innerText = agent.name;
        selector.appendChild(opt);
    });
}

function loadAgentReport() {
    const selector = document.getElementById("agent-selector");
    const agentId = parseInt(selector.value);
    const agent = promoterData.agents.find(a => a.id === agentId);
    if (!agent) return;
    
    // Update attempts table
    const tbody = document.querySelector("#simulator-history-table tbody");
    tbody.innerHTML = "";
    if (agent.attempts.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; color:var(--text-muted);'>Sin exámenes presentados</td></tr>";
    } else {
        agent.attempts.slice().reverse().forEach(att => {
            const tr = document.createElement("tr");
            const badgeClass = att.passed ? "active" : "inactive";
            const badgeText = att.passed ? "Aprobado" : "Reprobado";
            const timeStr = att.time || "12:00";
            const typeStr = att.type || "Examen Completo";
            
            let detailsHTML = "";
            if (att.details) {
                detailsHTML = `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px;">`;
                Object.keys(att.details).forEach(mod => {
                    const score = att.details[mod];
                    const modPct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
                    const colorClass = modPct >= 70 ? "#2dd4bf" : "#f87171";
                    
                    let shortMod = mod;
                    if (mod === "Seguro de Personas (Grupo y Colectivo)") shortMod = "Personas Col.";
                    else if (mod === "Seguro de Daños: Incendio y Catastróficos") shortMod = "Incendio/Cat.";
                    else if (mod === "Marítimo, Transportes y Automóviles Flotillas") shortMod = "Transportes/Autos";
                    else if (mod === "Responsabilidad Civil y Admón. de Riesgos") shortMod = "Resp. Civil";
                    else if (mod === "Ramos Técnicos de Daños") shortMod = "Ramos Técnicos";
                    else if (mod === "Ramos Diversos y Misceláneos") shortMod = "Diversos";
                    else if (mod === "Regulación CNSF, Marco Legal y PLD") shortMod = "Regulación/PLD";
                    
                    detailsHTML += `<span style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                        ${shortMod}: <strong style="color: ${colorClass}">${score.correct}/${score.total} (${modPct}%)</strong>
                    </span>`;
                });
                detailsHTML += `</div>`;
            }
            
            tr.innerHTML = `
                <td>${att.date} ${timeStr}</td>
                <td>
                    <div style="font-weight: 500;">${typeStr}</div>
                    ${detailsHTML}
                </td>
                <td style="font-weight:600;">${att.score}%</td>
                <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // Recommendations logic
    const recsContainer = document.getElementById("agent-recommendations-list");
    recsContainer.innerHTML = "";
    
    // Identify low score modules
    const modules = Object.keys(agent.moduleScores);
    let lowModules = [];
    modules.forEach(m => {
        // Only trigger recommendation if studied/attempted and score < 70
        if (agent.moduleScores[m] > 0 && agent.moduleScores[m] < 70) {
            lowModules.push({ name: m, score: agent.moduleScores[m] });
        }
    });
    
    if (lowModules.length === 0) {
        recsContainer.innerHTML = `
            <div style="background: rgba(16,185,129,0.08); border-left: 3px solid var(--accent-success); padding: 12px; border-radius: 4px; font-size:14px;">
                <strong>Excelente rendimiento:</strong> El agente mantiene un promedio aprobatorio en todos los temas. Recomienda seguir practicando en el simulador completo.
            </div>
        `;
    } else {
        lowModules.forEach(mod => {
            const div = document.createElement("div");
            div.style.background = "rgba(239, 68, 68, 0.08)";
            div.style.borderLeft = "3px solid var(--accent-error)";
            div.style.padding = "12px";
            div.style.borderRadius = "4px";
            div.style.fontSize = "14px";
            div.innerHTML = `
                <div style="font-weight:600; color: #fca5a5;">Reforzar: ${mod.name} (${mod.score}% acierto)</div>
                <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
                    El agente necesita incrementar su tiempo de estudio interactivo en este tema. Se recomienda asignarle 2 horas obligatorias en modo audio-explicado.
                </div>
            `;
            recsContainer.appendChild(div);
        });
    }

    // Render Charts
    renderStudyTimeChart(agent);
    renderStrengthsRadar(agent);
}

function renderStudyTimeChart(agent) {
    const ctx = document.getElementById("chart-study-time").getContext("2d");
    
    if (studyTimeChartInstance) {
        studyTimeChartInstance.destroy();
    }
    
    const labels = Object.keys(agent.timesPerModule);
    const dataValues = Object.values(agent.timesPerModule).map(v => Math.round(v)); // in minutes
    
    studyTimeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.length > 15 ? l.substring(0, 15) + '...' : l),
            datasets: [{
                label: 'Minutos de Estudio',
                data: dataValues,
                backgroundColor: 'rgba(139, 92, 246, 0.6)',
                borderColor: '#8b5cf6',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                }
            }
        }
    });
}

function renderStrengthsRadar(agent) {
    const ctx = document.getElementById("chart-strengths-radar").getContext("2d");
    
    if (strengthsChartInstance) {
        strengthsChartInstance.destroy();
    }
    
    const labels = Object.keys(agent.moduleScores);
    const scores = Object.values(agent.moduleScores);
    
    strengthsChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels.map(l => l.length > 15 ? l.substring(0, 15) + '...' : l),
            datasets: [{
                label: 'Porcentaje de acierto',
                data: scores,
                backgroundColor: 'rgba(20, 184, 166, 0.2)',
                borderColor: '#14b8a6',
                borderWidth: 2,
                pointBackgroundColor: '#14b8a6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.08)' },
                    grid: { color: 'rgba(255,255,255,0.08)' },
                    ticks: {
                        color: '#6b7280',
                        backdropColor: 'transparent',
                        beginAtZero: true,
                        max: 100
                    },
                    pointLabels: {
                        color: '#9ca3af',
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

// -------------------------------------------------------------
// AGENT E-LEARNING (STUDY MODE) LOGIC
// -------------------------------------------------------------
function launchStudyModule(moduleName) {
    if (activeAgent.remainingDays <= 0) {
        alert("No tienes tiempo de acceso disponible (Días de simulador y estudio). Por favor solicita días a tu promotor.");
        switchTab("agent-dash");
        return;
    }

    studyModule = moduleName;
    studyQuestions = questionsDb.filter(q => q.module === moduleName);
    
    if (studyQuestions.length === 0) {
        // Fallback filter
        studyQuestions = fallbackQuestions.filter(q => q.module === moduleName);
    }
    
    if (studyQuestions.length === 0) {
        // If no questions found for this module, just use all available
        studyQuestions = questionsDb;
    }
    
    // Retrieve progress per module for the active agent
    if (!activeAgent.studyProgress) activeAgent.studyProgress = {};
    studyCurrentIdx = activeAgent.studyProgress[moduleName] || 0;
    
    // Ensure index doesn't exceed array boundaries
    if (studyCurrentIdx >= studyQuestions.length) {
        studyCurrentIdx = 0;
    }
    
    studySessionSeconds = 0;
    
    document.getElementById("study-current-module").innerText = moduleName;
    
    switchTab("agent-study");
    renderStudyQuestion();
}

function startStudyMode() {
    if (activeAgent.remainingDays <= 0) {
        alert("No tienes tiempo de acceso disponible (Días de simulador y estudio). Por favor solicita días a tu promotor.");
        switchTab("agent-dash");
        return;
    }
    
    let lastModule = "Seguro de Personas (Grupo y Colectivo)";
    if (activeAgent.studyProgress) {
        const keys = Object.keys(activeAgent.studyProgress);
        if (keys.length > 0) {
            lastModule = keys[keys.length - 1]; // Load last studied module
        }
    }
    launchStudyModule(lastModule);
}

let isCurrentQuestionSolved = false;

function renderStudyQuestion() {
    if (studyQuestions.length === 0) return;
    
    stopAudioSpeech(); // Stop speech on render
    
    isCurrentQuestionSolved = false;
    const nextBtn = document.getElementById("btn-study-next");
    if (nextBtn) nextBtn.disabled = true; // Block next question until solved
    
    const q = studyQuestions[studyCurrentIdx];
    document.getElementById("study-question-counter").innerText = `Pregunta ${studyCurrentIdx + 1} de ${studyQuestions.length}`;
    document.getElementById("study-question-text").innerText = q.question;
    
    const container = document.getElementById("study-options-container");
    container.innerHTML = "";
    
    q.options.forEach((opt, idx) => {
        const item = document.createElement("div");
        item.className = "option-item";
        item.innerHTML = `
            <div class="bullet-circle">${String.fromCharCode(65 + idx)}</div>
            <div style="font-size:15px; font-weight:500;">${opt}</div>
        `;
        item.onclick = () => selectStudyOption(idx);
        container.appendChild(item);
    });

    // Render Contextual Animation
    renderContextAnimation(q);
    
    // Reset any playing audio on next question (silent study by default)
    stopAudioSpeech();
}

function selectStudyOption(selectedIndex) {
    const q = studyQuestions[studyCurrentIdx];
    const items = document.querySelectorAll("#study-options-container .option-item");
    
    if (selectedIndex === q.correct) {
        // CORRECT CHOICE
        isCurrentQuestionSolved = true;
        
        // Remove incorrect highlights
        items.forEach(item => item.classList.remove("incorrect", "selected"));
        
        // Highlight correct in green
        items[q.correct].classList.add("correct");
        
        // Render rich legal and technical explanation
        showQuestionExplanation(q);
        
        // Enable next button
        const nextBtn = document.getElementById("btn-study-next");
        if (nextBtn) nextBtn.disabled = false;
        
        // Log performance on active agent
        if (activeAgent.moduleScores[studyModule] < 95) {
            activeAgent.moduleScores[studyModule] = Math.min(100, activeAgent.moduleScores[studyModule] + 1);
        }
    } else {
        // INCORRECT CHOICE
        if (isCurrentQuestionSolved) return; // ignore if already solved
        
        // Show red error highlight
        items[selectedIndex].classList.remove("selected");
        items[selectedIndex].classList.add("incorrect");
        
        // Provide immediate coherent feedback in the explanation box
        const descEl = document.getElementById("animation-concept-desc");
        if (descEl) {
            const chosenText = (q.options && q.options[selectedIndex]) || "";
            descEl.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 12px; padding: 14px; text-align: left;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 11px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 0.5px;">✕ Opción Incorrecta (${String.fromCharCode(65 + selectedIndex)})</span>
                        <button onclick="revealExplanation()" style="background: rgba(20,184,166,0.2); border: 1px solid rgba(20,184,166,0.4); color: #2dd4bf; border-radius: 6px; padding: 3px 10px; font-size: 11px; cursor: pointer; font-weight: 700;">
                            Ver respuesta y fundamento →
                        </button>
                    </div>
                    <div style="font-size: 13px; color: #fca5a5; margin-bottom: 6px; font-weight: 600;">${chosenText}</div>
                    <p style="font-size: 13px; line-height: 1.5; color: #cbd5e1; margin: 0;">
                        Analiza nuevamente las opciones del reactivo o presiona <strong>Ver respuesta y fundamento</strong> (o el botón <strong>Explicar</strong>) para consultar la explicación técnica y legal exacta.
                    </p>
                </div>
            `;
        }

        // Block next button
        const nextBtn = document.getElementById("btn-study-next");
        if (nextBtn) nextBtn.disabled = true;
    }
}

function prevStudyQuestion() {
    if (studyCurrentIdx > 0) {
        studyCurrentIdx--;
        if (!activeAgent.studyProgress) activeAgent.studyProgress = {};
        activeAgent.studyProgress[studyModule] = studyCurrentIdx;
        syncStudyProgressImmediate();
        renderStudyQuestion();
    }
}

function nextStudyQuestion() {
    if (!isCurrentQuestionSolved) {
        alert("Debes seleccionar la respuesta correcta antes de continuar.");
        return;
    }
    if (studyCurrentIdx < studyQuestions.length - 1) {
        studyCurrentIdx++;
        if (!activeAgent.studyProgress) activeAgent.studyProgress = {};
        activeAgent.studyProgress[studyModule] = studyCurrentIdx;
        syncStudyProgressImmediate();
        renderStudyQuestion();
    } else {
        alert("¡Has completado todas las preguntas de este módulo!");
        if (!activeAgent.studyProgress) activeAgent.studyProgress = {};
        activeAgent.studyProgress[studyModule] = 0; // Reset index on complete
        syncStudyProgressImmediate();
        switchTab("agent-dash");
    }
}

function revealExplanation() {
    const q = studyQuestions[studyCurrentIdx];
    if (!q) return;
    const items = document.querySelectorAll("#study-options-container .option-item");
    if (items[q.correct]) {
        items[q.correct].classList.add("correct");
    }
    isCurrentQuestionSolved = true;
    const nextBtn = document.getElementById("btn-study-next");
    if (nextBtn) nextBtn.disabled = false;
    
    showQuestionExplanation(q);
}

// ==========================================
// ELEVENLABS AUDIO CONTROLLER & EXPLANATIONS
// ==========================================
let currentStudyAudio = null;
let currentStudyAudioVolume = 1.0;
let isAudioPlaying = false;

function changeAudioVolume(val) {
    currentStudyAudioVolume = parseFloat(val);
    if (currentStudyAudio) {
        currentStudyAudio.volume = currentStudyAudioVolume;
    }
}

function updatePlayButtonUI(playing) {
    isAudioPlaying = playing;
    const btn = document.getElementById("btn-audio-speak");
    const icon = document.getElementById("audio-speak-icon");
    const wave = document.getElementById("voice-waveform");
    
    if (btn) {
        if (playing) {
            btn.classList.add("active");
            btn.title = "Pausar narración";
            if (icon) icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        } else {
            btn.classList.remove("active");
            btn.title = "Escuchar con ElevenLabs HD";
            if (icon) icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
        }
    }
    if (wave) {
        if (playing) wave.classList.add("active");
        else wave.classList.remove("active");
    }
}

function stopAudioSpeech() {
    isAudioPlaying = false;
    updatePlayButtonUI(false);
    
    if (currentStudyAudio) {
        try {
            currentStudyAudio.pause();
            currentStudyAudio.currentTime = 0;
        } catch (e) {}
        currentStudyAudio = null;
    }
    
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

async function toggleAudioSpeech() {
    if (isAudioPlaying) {
        stopAudioSpeech();
        return;
    }
    
    const q = studyQuestions[studyCurrentIdx];
    if (!q) return;
    
    const optionA = q.options && q.options[0] ? `Opción A: ${q.options[0]}. ` : "";
    const optionB = q.options && q.options[1] ? `Opción B: ${q.options[1]}. ` : "";
    const optionC = q.options && q.options[2] ? `Opción C: ${q.options[2]}. ` : "";
    const optionD = q.options && q.options[3] ? `Opción D: ${q.options[3]}. ` : "";
    const textToRead = `${q.question}. ${optionA}${optionB}${optionC}${optionD}`;
    
    await playAudioStream(textToRead, `q_${q.id || studyCurrentIdx}`);
}

async function playExplanationAudio() {
    const q = studyQuestions[studyCurrentIdx];
    if (!q) return;
    
    if (isAudioPlaying) {
        stopAudioSpeech();
        return;
    }
    
    const correctText = (q.options && q.options[q.correct]) || q.respuesta_correcta || "";
    const explanation = q.explanation || q.explicacion || "";
    const textToRead = `Respuesta correcta: ${correctText}. Explicación y fundamento: ${explanation}`;
    
    await playAudioStream(textToRead, `expl_${q.id || studyCurrentIdx}`);
}

async function playAudioStream(textToRead, trackId = "") {
    stopAudioSpeech();
    updatePlayButtonUI(true);
    
    try {
        const audioUrl = `/api/cedula-b/audio?text=${encodeURIComponent(textToRead)}&id=${encodeURIComponent(trackId)}`;
        const audio = new Audio(audioUrl);
        audio.volume = currentStudyAudioVolume;
        currentStudyAudio = audio;
        
        audio.onended = () => {
            stopAudioSpeech();
        };
        
        audio.onerror = (e) => {
            console.warn("ElevenLabs audio endpoint no disponible o sin conexión. Usando respaldo de voz local:", e);
            fallbackToWebSpeech(textToRead);
        };
        
        await audio.play();
    } catch (err) {
        console.warn("Error en reproducción ElevenLabs, usando respaldo:", err);
        fallbackToWebSpeech(textToRead);
    }
}

function fallbackToWebSpeech(textToRead) {
    if (!('speechSynthesis' in window)) {
        stopAudioSpeech();
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "es-MX";
    utterance.rate = 0.96;
    utterance.volume = currentStudyAudioVolume;
    
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.includes("MX") || v.lang === "es-MX") || voices.find(v => v.lang.startsWith("es"));
    if (esVoice) utterance.voice = esVoice;
    
    utterance.onend = stopAudioSpeech;
    utterance.onerror = stopAudioSpeech;
    
    window.speechSynthesis.speak(utterance);
}

function showQuestionExplanation(q) {
    const descEl = document.getElementById("animation-concept-desc");
    if (!descEl) return;
    
    const explanation = q.explanation || q.explicacion || "Este reactivo forma parte del temario oficial de certificación Cédula B.";
    const correctOptionText = (q.options && q.options[q.correct]) || q.respuesta_correcta || "";
    
    descEl.innerHTML = `
        <div style="background: rgba(13, 148, 136, 0.15); border: 1px solid rgba(20, 184, 166, 0.4); border-radius: 12px; padding: 14px; text-align: left;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 11px; font-weight: 800; color: #2dd4bf; text-transform: uppercase; letter-spacing: 0.5px;">✓ Respuesta Correcta (${String.fromCharCode(65 + (q.correct || 0))})</span>
                <button onclick="playExplanationAudio()" style="background: rgba(20,184,166,0.2); border: 1px solid rgba(20,184,166,0.4); color: #2dd4bf; border-radius: 6px; padding: 3px 8px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 700;">
                    <span>🔊</span> Escuchar explicación
                </button>
            </div>
            <div style="font-weight: 700; color: #f8fafc; font-size: 14px; margin-bottom: 10px; line-height: 1.4;">
                ${correctOptionText}
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
                <span style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Fundamento Técnico y Legal:</span>
                <p style="font-size: 13.5px; line-height: 1.6; color: #e2e8f0; margin: 0;">${explanation}</p>
            </div>
        </div>
    `;
}

function renderContextAnimation(qOrText) {
    const container = document.getElementById("animation-canvas-container");
    const descEl = document.getElementById("animation-concept-desc");
    if (!container || !descEl) return;

    const qObj = typeof qOrText === "object" && qOrText !== null ? qOrText : { question: String(qOrText || ""), module: studyModule };
    const text = (qObj.question || "").toLowerCase();
    const mod = qObj.module || studyModule || "Seguro de Personas (Grupo y Colectivo)";

    // Coherent Cédula B module guides for pre-answer state (strictly isolated from Cédula A individual concepts)
    const moduleGuides = {
        "Seguro de Personas (Grupo y Colectivo)": {
            badge: "Seguros de Grupo y Colectivos (Cédula B)",
            summary: "Evalúa el Reglamento del Seguro de Grupo y del Seguro Colectivo: grupos asegurables, certificados individuales, dividendos por siniestralidad, alta/baja de integrantes y conversión."
        },
        "Seguro de Daños: Incendio y Catastróficos": {
            badge: "Incendio Empresarial y Riesgos Catastróficos",
            summary: "Evalúa incendio y/o rayo en naves comerciales/industriales, pérdidas consecuenciales (lucro cesante, gastos fijos), terremoto, erupción volcánica y riesgos hidrometeorológicos."
        },
        "Marítimo, Transportes y Automóviles Flotillas": {
            badge: "Transporte de Carga, Cascos y Flotillas",
            summary: "Evalúa seguro de transporte de mercancías, avería gruesa y particular, Incoterms, embarcaciones comerciales, aeronaves y administración de flotillas vehiculares."
        },
        "Responsabilidad Civil y Admón. de Riesgos": {
            badge: "RC Empresarial y Administración de Riesgos",
            summary: "Evalúa etapas de administración de riesgos (identificación, evaluación, control, financiamiento), RC General, RC Productos, RC Contractual y RC Profesional."
        },
        "Ramos Técnicos de Daños": {
            badge: "Ramos Técnicos e Ingeniería (Cédula B)",
            summary: "Evalúa Calderas y Recipientes Sujetos a Presión, Rotura de Maquinaria, Equipo Electrónico, Montaje de Maquinaria, Obra Civil en Construcción y Equipo de Contratistas."
        },
        "Ramos Diversos y Misceláneos": {
            badge: "Ramos Diversos Empresariales",
            summary: "Evalúa Robo de Mercancías con Violencia, Dinero y Valores (en local y tránsito), Rotura de Cristales, Anuncios Luminosos y Objetos Valiosos."
        },
        "Regulación CNSF, Marco Legal y PLD": {
            badge: "Marco Legal Empresarial, LISF y PLD/FT",
            summary: "Evalúa la Ley sobre el Contrato de Seguro, Ley de Instituciones de Seguros y de Fianzas (LISF), Reglamento de Agentes, CONDUSEF y Prevención de Lavado de Dinero (Art. 492)."
        }
    };

    const guide = moduleGuides[mod] || {
        badge: "Certificación Oficial Cédula B (CNSF)",
        summary: "Riesgos Empresariales de Personas (Grupo/Colectivo) y Daños Comerciales e Industriales conforme al temario de la CNSF."
    };

    descEl.innerHTML = `
        <div style="background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 14px; text-align: left;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 11px; font-weight: 800; color: #2dd4bf; text-transform: uppercase; letter-spacing: 0.5px;">${guide.badge}</span>
                <span style="font-size: 11px; color: #94a3b8;">Reactivo #${qObj.id || (studyCurrentIdx + 1)}</span>
            </div>
            <p style="font-size: 13px; line-height: 1.5; color: #cbd5e1; margin: 0 0 10px 0;">
                ${guide.summary}
            </p>
            <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <span style="font-size: 12.5px; color: #94a3b8;">Selecciona la respuesta correcta o consulta el fundamento directo:</span>
                <button onclick="revealExplanation()" style="background: rgba(20,184,166,0.15); border: 1px solid rgba(20,184,166,0.35); color: #2dd4bf; border-radius: 6px; padding: 4px 10px; font-size: 11.5px; cursor: pointer; font-weight: 700; white-space: nowrap;">
                    Explicar reactivo
                </button>
            </div>
        </div>
    `;

    // Render Cédula B-specific SVG graphic based on module and enterprise topic
    if (mod === "Seguro de Personas (Grupo y Colectivo)") {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(150, 20)">
                    <circle cx="25" cy="30" r="14" fill="rgba(20, 184, 166, 0.25)" stroke="#14b8a6" stroke-width="2"/>
                    <circle cx="75" cy="30" r="14" fill="rgba(139, 92, 246, 0.25)" stroke="#8b5cf6" stroke-width="2"/>
                    <circle cx="50" cy="65" r="16" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" stroke-width="2"/>
                </g>
                <text x="200" y="140" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Seguro de Personas (Grupo y Colectivo)</text>
                <text x="200" y="165" font-size="11" fill="#9ca3af" text-anchor="middle">Póliza Maestra • Certificados Individuales • Dividendos de Siniestralidad</text>
            </svg>
        `;
    } else if (mod === "Seguro de Daños: Incendio y Catastróficos") {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(160, 20)">
                    <polygon points="40,15 72,75 8,75" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" stroke-width="2"/>
                    <path d="M40,35 Q48,50 40,65 Q32,50 40,35 Z" fill="#f59e0b"/>
                </g>
                <text x="200" y="140" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Incendio Empresarial y Riesgos Catastróficos</text>
                <text x="200" y="165" font-size="11" fill="#9ca3af" text-anchor="middle">Edificio y Contenidos • Pérdidas Consecuenciales • Terremoto e Hidrometeorológicos</text>
            </svg>
        `;
    } else if (mod === "Marítimo, Transportes y Automóviles Flotillas") {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(150, 30)">
                    <rect x="10" y="18" width="80" height="35" rx="5" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="2"/>
                    <circle cx="28" cy="55" r="8" fill="#38bdf8"/>
                    <circle cx="72" cy="55" r="8" fill="#38bdf8"/>
                </g>
                <text x="200" y="140" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Marítimo, Transportes y Flotillas</text>
                <text x="200" y="165" font-size="11" fill="#9ca3af" text-anchor="middle">Carga en Tránsito • Avería Gruesa y Particular • Cascos y Flotillas</text>
            </svg>
        `;
    } else if (mod === "Responsabilidad Civil y Admón. de Riesgos") {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g class="pulse-shield" transform="translate(160, 20)">
                    <polygon points="40,5 75,22 75,60 40,80 5,60 5,22" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" stroke-width="2"/>
                    <text x="40" y="50" font-size="20" fill="#fff" text-anchor="middle" font-weight="bold">⚖</text>
                </g>
                <text x="200" y="140" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Responsabilidad Civil y Admón. de Riesgos</text>
                <text x="200" y="165" font-size="11" fill="#9ca3af" text-anchor="middle">Identificación, Control y Transferencia • RC General, Productos y Actividades</text>
            </svg>
        `;
    } else if (mod === "Ramos Técnicos de Daños") {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <circle cx="200" cy="65" r="28" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" stroke-width="2"/>
                <circle cx="200" cy="65" r="12" fill="none" stroke="#f59e0b" stroke-width="2"/>
                <text x="200" y="140" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Ramos Técnicos de Daños</text>
                <text x="200" y="165" font-size="11" fill="#9ca3af" text-anchor="middle">Rotura de Maquinaria • Calderas • Equipo Electrónico • Montaje y Obra Civil</text>
            </svg>
        `;
    } else if (mod === "Ramos Diversos y Misceláneos") {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(160, 22)">
                    <rect x="15" y="10" width="50" height="60" rx="4" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="2"/>
                    <circle cx="40" cy="35" r="8" fill="none" stroke="#10b981" stroke-width="2"/>
                    <line x1="40" y1="43" x2="40" y2="55" stroke="#10b981" stroke-width="2"/>
                </g>
                <text x="200" y="140" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Ramos Diversos y Misceláneos</text>
                <text x="200" y="165" font-size="11" fill="#9ca3af" text-anchor="middle">Robo con Violencia • Dinero y Valores • Cristales • Anuncios Luminosos</text>
            </svg>
        `;
    } else {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <rect x="150" y="20" width="100" height="30" rx="4" fill="rgba(139, 92, 246, 0.2)" stroke="#8b5cf6" stroke-width="1.5"/>
                <text x="200" y="39" font-size="10" fill="#fff" font-weight="bold" text-anchor="middle">CNSF / SHCP</text>
                <line x1="200" y1="50" x2="200" y2="80" stroke="#8b5cf6" stroke-width="1.5"/>
                <line x1="100" y1="80" x2="300" y2="80" stroke="#8b5cf6" stroke-width="1.5"/>
                <line x1="100" y1="80" x2="100" y2="110" stroke="#14b8a6" stroke-width="1.5"/>
                <line x1="300" y1="80" x2="300" y2="110" stroke="#10b981" stroke-width="1.5"/>
                <rect x="50" y="110" width="100" height="30" rx="4" fill="rgba(20, 184, 166, 0.2)" stroke="#14b8a6" stroke-width="1.5"/>
                <text x="100" y="129" font-size="9" fill="#fff" text-anchor="middle">LISF & LSCS</text>
                <rect x="250" y="110" width="100" height="30" rx="4" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="1.5"/>
                <text x="300" y="129" font-size="9" fill="#fff" text-anchor="middle">PLD / FT (Art. 492)</text>
                <text x="200" y="175" font-size="12" fill="#fff" font-weight="700" text-anchor="middle">Regulación CNSF, Marco Legal y PLD</text>
            </svg>
        `;
    }
}

// -------------------------------------------------------------
// AGENT SIMULATOR (EXAM MODE) LOGIC
// -------------------------------------------------------------
function startSimulatorMode() {
    if (activeAgent.remainingDays <= 0) {
        alert("No tienes días de simulador disponibles. Por favor solicita tiempo a tu promotor.");
        switchTab("agent-dash");
        return;
    }

    const startConfirm = confirm("¿Deseas iniciar el simulador oficial? Tendrás 80 preguntas aleatorias de los 7 módulos y 2 horas límite.");
    if (!startConfirm) return;
    
    // Pick 80 random questions with balanced CNSF module sizes
    // 16 from Aspectos, 6 from Regulación, 14 from Vida, 12 from Accidentes, 16 from Daños, 16 from Finanzas
    const config = [
        { mod: "Seguro de Personas (Grupo y Colectivo)", count: 18 },
        { mod: "Seguro de Daños: Incendio y Catastróficos", count: 10 },
        { mod: "Marítimo, Transportes y Automóviles Flotillas", count: 10 },
        { mod: "Responsabilidad Civil y Admón. de Riesgos", count: 10 },
        { mod: "Ramos Técnicos de Daños", count: 12 },
        { mod: "Ramos Diversos y Misceláneos", count: 10 },
        { mod: "Regulación CNSF, Marco Legal y PLD", count: 10 }
    ];
    
    simQuestions = [];
    
    config.forEach(c => {
        let pool = questionsDb.filter(q => q.module === c.mod);
        if (pool.length === 0) pool = fallbackQuestions.filter(q => q.module === c.mod);
        if (pool.length === 0) pool = fallbackQuestions; // Absolute fallback
        
        // Shuffle pool
        const shuffled = pool.sort(() => 0.5 - Math.random());
        // Add counts
        simQuestions = simQuestions.concat(shuffled.slice(0, c.count));
    });
    
    // Safety check if we couldn't load enough
    if (simQuestions.length < 80) {
        let pool = questionsDb.concat(fallbackQuestions);
        const shuffled = pool.sort(() => 0.5 - Math.random());
        simQuestions = shuffled.slice(0, 80);
    }
    
    simCurrentIdx = 0;
    simAnswers = {};
    simRemainingSeconds = 7200; // 2 hours
    
    // Clear simulator timer
    if (simTimerInterval) clearInterval(simTimerInterval);
    
    // Start countdown
    simTimerInterval = setInterval(() => {
        simRemainingSeconds--;
        if (simRemainingSeconds <= 0) {
            clearInterval(simTimerInterval);
            finishSimulatorExam(true);
        } else {
            // Update clock
            const hours = Math.floor(simRemainingSeconds / 3600);
            const minutes = Math.floor((simRemainingSeconds % 3600) / 60);
            const seconds = simRemainingSeconds % 60;
            document.getElementById("sim-timer").innerText = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
    
    // Render nav grid buttons
    renderSimNavGrid();
    
    // Switch tab and render first question
    switchTab("agent-sim");
    renderSimQuestion();
}

function renderSimNavGrid() {
    const grid = document.getElementById("sim-nav-grid");
    grid.innerHTML = "";
    
    for (let i = 0; i < simQuestions.length; i++) {
        const btn = document.createElement("button");
        btn.className = "q-nav-btn";
        btn.id = `q-nav-btn-${i}`;
        btn.innerText = i + 1;
        btn.onclick = () => selectSimQuestionIndex(i);
        grid.appendChild(btn);
    }
}

function renderSimQuestion() {
    if (simQuestions.length === 0) return;
    
    const q = simQuestions[simCurrentIdx];
    document.getElementById("sim-current-q-num").innerText = `Pregunta ${simCurrentIdx + 1} de ${simQuestions.length}`;
    document.getElementById("sim-module-display").innerText = `Módulo: ${q.module}`;
    document.getElementById("sim-question-text").innerText = q.question;
    
    const container = document.getElementById("sim-options-container");
    container.innerHTML = "";
    
    q.options.forEach((opt, idx) => {
        const item = document.createElement("div");
        item.className = "option-item";
        if (simAnswers[simCurrentIdx] === idx) {
            item.classList.add("selected");
        }
        item.innerHTML = `
            <div class="bullet-circle">${String.fromCharCode(65 + idx)}</div>
            <div style="font-size:15px; font-weight:500;">${opt}</div>
        `;
        item.onclick = () => selectSimOption(idx);
        container.appendChild(item);
    });
    
    // Update active state in nav grid
    const buttons = document.querySelectorAll("#sim-nav-grid .q-nav-btn");
    buttons.forEach((btn, idx) => {
        btn.classList.remove("active");
        if (idx === simCurrentIdx) btn.classList.add("active");
    });
}

function selectSimOption(optionIndex) {
    simAnswers[simCurrentIdx] = optionIndex;
    
    // Re-render choices to update selected style
    renderSimQuestion();
    
    // Mark as answered in nav grid
    const navBtn = document.getElementById(`q-nav-btn-${simCurrentIdx}`);
    if (navBtn) navBtn.classList.add("answered");
}

function selectSimQuestionIndex(idx) {
    simCurrentIdx = idx;
    renderSimQuestion();
}

function prevSimQuestion() {
    if (simCurrentIdx > 0) {
        simCurrentIdx--;
        renderSimQuestion();
    }
}

function nextSimQuestion() {
    if (simCurrentIdx < simQuestions.length - 1) {
        simCurrentIdx++;
        renderSimQuestion();
    }
}

async function finishSimulatorExam(auto = false) {
    if (!auto) {
        const confirmEnd = confirm("¿Estás seguro de que deseas finalizar tu examen? Se guardará tu calificación y se enviará el reporte a tu promotor.");
        if (!confirmEnd) return;
    }
    
    clearInterval(simTimerInterval);
    
    // Calculate final score
    let correctCount = 0;
    
    // Count per module for strengths mapping
    let moduleTotals = {};
    let moduleCorrects = {};
    
    simQuestions.forEach((q, idx) => {
        const selected = simAnswers[idx];
        const module = q.module;
        
        moduleTotals[module] = (moduleTotals[module] || 0) + 1;
        
        if (selected !== undefined && selected === q.correct) {
            correctCount++;
            moduleCorrects[module] = (moduleCorrects[module] || 0) + 1;
        }
    });
    
    const finalScore = Math.round((correctCount / simQuestions.length) * 100);
    const passed = finalScore >= 70; // 70% approval line
    
    // Format date and time
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
    
    // 1. Save attempt to Neon DB
    const detalles_modulos = {};
    Object.keys(moduleTotals).forEach(mod => {
        detalles_modulos[mod] = {
            correct: moduleCorrects[mod] || 0,
            total: moduleTotals[mod]
        };
    });

    try {
        await fetch('/api/cedula-b/intentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                calificacion: finalScore,
                aprobado: passed,
                respuestas_correctas: correctCount,
                total_preguntas: simQuestions.length,
                detalles_modulos
            })
        });
        console.log("Exam attempt saved to Neon DB successfully!");
    } catch (e) {
        console.error("Failed to save exam attempt to Neon DB:", e);
    }
    
    // Refresh user data to get updated statistics
    await refreshUserData();
    
    alert(`Examen Terminado.\n\nTu Calificación: ${finalScore}%\nEstado: ${passed ? "APROBADO (Apto para Cédula B)" : "REPROBADO (Sigue estudiando)"}`);
    
    // Switch to agent dashboard and update values
    switchRole("agent");
}

// --- Mobile Navigation ---
function toggleMobileMenu() {
    const sidebar = document.getElementById('main-sidebar');
    const body = document.body;
    sidebar.classList.toggle('open');
    body.classList.toggle('menu-open');
}

// Close menu when clicking outside backdrop (implemented via body click if target is body::after? 
// No, CSS pseudo-elements don't trigger direct clicks easily, but we can add a listener to document.
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('main-sidebar');
    if (document.body.classList.contains('menu-open') && 
        !sidebar.contains(e.target) && 
        !e.target.closest('.mobile-menu-btn')) {
        toggleMobileMenu();
    }
});

// Auto-close menu when navigating
const originalSwitchTab = switchTab;
switchTab = function(tabId) {
    originalSwitchTab(tabId);
    if (document.body.classList.contains('menu-open')) {
        toggleMobileMenu();
    }
}

function showTrialBlockedScreen() {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
    overlay.style.backdropFilter = 'blur(12px)';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.color = '#fff';
    overlay.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    overlay.style.padding = '20px';
    overlay.style.textAlign = 'center';

    overlay.innerHTML = `
        <div style="max-width: 400px; padding: 40px; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
            <svg style="width: 64px; height: 64px; fill: #f59e0b; margin-bottom: 24px; display: inline-block;" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 12px; color: #fff;">Módulo Bloqueado</h2>
            <p style="font-size: 14px; color: #94a3b8; margin-bottom: 24px; line-height: 1.5;">El simulador y academia de Cédula B no está disponible en período de pruebas.</p>
            <div style="font-size: 13px; font-weight: 700; color: #f59e0b; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 10px 16px; border-radius: 12px; margin-bottom: 24px;">
                Módulo se desbloquea con cuentas permanentes.
            </div>
            <a href="/academia" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; transition: background 0.2s;">
                Volver a la Academia
            </a>
        </div>
    `;
    document.body.appendChild(overlay);
}
