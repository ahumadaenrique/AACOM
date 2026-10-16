// app.js: Cédula A Simulator & E-Learning Platform Lógica

window.onerror = function(message, source, lineno, colno, error) {
    alert("Runtime Error: " + message + "\nLine: " + lineno + "\nSource: " + source);
    return false;
};

// Mock Database of Agents and SaaS details
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
                "Aspectos Generales": 420,
                "Regulación CNSF": 210,
                "Vida Individual": 480,
                "Accidentes y Enfermedades": 280,
                "Seguros de Daños": 95,
                "Sistema y Mercados Financieros": 0
            },
            moduleScores: {
                "Aspectos Generales": 82,
                "Regulación CNSF": 78,
                "Vida Individual": 72,
                "Accidentes y Enfermedades": 64,
                "Seguros de Daños": 58,
                "Sistema y Mercados Financieros": 0
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
                "Aspectos Generales": 310,
                "Regulación CNSF": 150,
                "Vida Individual": 240,
                "Accidentes y Enfermedades": 180,
                "Seguros de Daños": 40,
                "Sistema y Mercados Financieros": 0
            },
            moduleScores: {
                "Aspectos Generales": 70,
                "Regulación CNSF": 65,
                "Vida Individual": 68,
                "Accidentes y Enfermedades": 60,
                "Seguros de Daños": 45,
                "Sistema y Mercados Financieros": 0
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
                "Aspectos Generales": 200,
                "Regulación CNSF": 90,
                "Vida Individual": 120,
                "Accidentes y Enfermedades": 80,
                "Seguros de Daños": 0,
                "Sistema y Mercados Financieros": 0
            },
            moduleScores: {
                "Aspectos Generales": 55,
                "Regulación CNSF": 50,
                "Vida Individual": 52,
                "Accidentes y Enfermedades": 48,
                "Seguros de Daños": 0,
                "Sistema y Mercados Financieros": 0
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
                "Aspectos Generales": 120,
                "Regulación CNSF": 50,
                "Vida Individual": 100,
                "Accidentes y Enfermedades": 0,
                "Seguros de Daños": 0,
                "Sistema y Mercados Financieros": 0
            },
            moduleScores: {
                "Aspectos Generales": 60,
                "Regulación CNSF": 52,
                "Vida Individual": 48,
                "Accidentes y Enfermedades": 0,
                "Seguros de Daños": 0,
                "Sistema y Mercados Financieros": 0
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
                "Aspectos Generales": 510,
                "Regulación CNSF": 320,
                "Vida Individual": 490,
                "Accidentes y Enfermedades": 340,
                "Seguros de Daños": 215,
                "Sistema y Mercados Financieros": 0
            },
            moduleScores: {
                "Aspectos Generales": 90,
                "Regulación CNSF": 84,
                "Vida Individual": 82,
                "Accidentes y Enfermedades": 80,
                "Seguros de Daños": 74,
                "Sistema y Mercados Financieros": 0
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
                "Aspectos Generales": 0,
                "Regulación CNSF": 0,
                "Vida Individual": 0,
                "Accidentes y Enfermedades": 0,
                "Seguros de Daños": 0,
                "Sistema y Mercados Financieros": 0
            },
            moduleScores: {
                "Aspectos Generales": 0,
                "Regulación CNSF": 0,
                "Vida Individual": 0,
                "Accidentes y Enfermedades": 0,
                "Seguros de Daños": 0,
                "Sistema y Mercados Financieros": 0
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
            const res = await fetch('/api/cedula-a/promoter-data');
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
            const res = await fetch('/api/cedula-a/agent-data');
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
        "module": "Vida Individual",
        "question": "¿Tipo de plan que siempre garantiza el pago de una cierta suma si el asegurado fallece durante la vigencia de la póliza o en caso de supervivencia?",
        "options": ["Flexible", "Temporal", "Dotal", "Universal"],
        "correct": 2,
        "explanation": "El Seguro Dotal Mixto combina la cobertura por fallecimiento con un componente de ahorro garantizado que paga la suma asegurada si el titular sobrevive al vencimiento del plazo contratado."
    },
    {
        "id": 2,
        "module": "Vida Individual",
        "question": "En un seguro de vida individual, ¿cuál es la definición correcta de fideicomitente?",
        "options": [
            "Persona que ordena y constituye el fideicomiso aportando los bienes",
            "Institución de seguros que administra los fondos del fideicomiso",
            "Persona física o moral beneficiaria del fideicomiso",
            "Institución financiera que funge como intermediaria para la celebración del contrato"
        ],
        "correct": 0,
        "explanation": "En la estructura del fideicomiso patrimonial o de seguros, el fideicomitente es la persona que aporta los bienes o derechos (la suma asegurada) y establece las instrucciones de administración."
    },
    {
        "id": 3,
        "module": "Regulación CNSF",
        "question": "¿Cuáles son los impedimentos para ser autorizados como agentes de seguros?",
        "options": [
            "Ser profesionista independiente con cédula profesional vigente",
            "Haber sido condenado por delito patrimonial intencional o estar sujeto a concurso mercantil",
            "Tener una carrera técnica concluida y constancia de capacitación",
            "Contar con una fianza de fidelidad contratada a su nombre"
        ],
        "correct": 1,
        "explanation": "De acuerdo con el Reglamento de Agentes de Seguros y de Fianzas, haber sido condenado por delito patrimonial intencional o encontrarse declarado en quiebra o concurso mercantil impide obtener autorización de la CNSF."
    },
    {
        "id": 4,
        "module": "Accidentes y Enfermedades",
        "question": "En seguros de Gastos Médicos Mayores, ¿qué es el coaseguro?",
        "options": [
            "La cantidad fija no reembolsable a cargo del asegurado antes del siniestro",
            "El porcentaje de participación del asegurado en los gastos cubiertos después del deducible",
            "El cobro de la prima fraccionada que realiza la aseguradora",
            "La póliza complementaria contratada con otra aseguradora para el mismo riesgo"
        ],
        "correct": 1,
        "explanation": "El coaseguro en Gastos Médicos Mayores es el porcentaje que aplica sobre los gastos médicos procedentes una vez descontado el deducible, funcionando como participación solidaria del asegurado."
    },
    {
        "id": 5,
        "module": "Aspectos Generales",
        "question": "¿Cuál es la prima que se obtiene directamente de las tablas de mortalidad y cubre únicamente el costo neto del riesgo?",
        "options": ["Prima de tarifa", "Prima pura de riesgo", "Prima única", "Prima total"],
        "correct": 1,
        "explanation": "La prima pura de riesgo (o prima neta) es el valor actuarial calculado a partir de la frecuencia y severidad estadística (tablas de mortalidad o siniestralidad) para hacer frente exclusivamente a las reclamaciones."
    },
    {
        "id": 6,
        "module": "Seguros de Daños",
        "question": "En una póliza de seguros de Automóviles, la cobertura de Responsabilidad Civil obliga a la Aseguradora a:",
        "options": [
            "Reparar los daños materiales causados al vehículo asegurado",
            "Resarcir los daños causados a bienes y personas de terceros por el uso del vehículo",
            "Indemnizar el robo total del automóvil del asegurado",
            "Pagar los gastos médicos de los ocupantes del vehículo asegurado"
        ],
        "correct": 1,
        "explanation": "La cobertura de Responsabilidad Civil ampara la obligación legal del asegurado de indemnizar los daños materiales o lesiones corporales causados sin dolo a terceros en sus bienes o personas."
    },
    {
        "id": 7,
        "module": "Sistema y Mercados Financieros",
        "question": "¿Cuál es la entidad gubernamental encargada de supervisar y regular a las instituciones de seguros y fianzas en México?",
        "options": [
            "Comisión Nacional Bancaria y de Valores (CNBV)",
            "Comisión Nacional de Seguros y Fianzas (CNSF)",
            "Secretaría de Hacienda y Crédito Público (SHCP)",
            "Banco de México (Banxico)"
        ],
        "correct": 1,
        "explanation": "La Comisión Nacional de Seguros y Fianzas (CNSF) es el órgano desconcentrado de la SHCP encargado de la inspección, vigilancia y supervisión de las instituciones de seguros y de fianzas."
    },
    {
        "id": 8,
        "module": "Vida Individual",
        "question": "Tipo de plan de seguro que otorga protección por un plazo fijo definido y cuyas primas cubren únicamente el riesgo de fallecimiento sin acumular valores garantizados:",
        "options": ["Dotal", "Temporal", "Ordinario de Vida", "Universal"],
        "correct": 1,
        "explanation": "El seguro Temporal ofrece protección pura por fallecimiento durante un plazo determinado; al concluir la vigencia sin siniestro, el contrato termina sin rescate ni valores garantizados."
    },
    {
        "id": 9,
        "module": "Accidentes y Enfermedades",
        "question": "¿Cuál es la función del deducible en una reclamación de seguro de Gastos Médicos Mayores?",
        "options": [
            "Evitar que la aseguradora pague cualquier reclamación menor a la cantidad establecida",
            "Dividir el costo médico final en partes iguales entre asegurado y aseguradora",
            "Garantizar el pago de honorarios médicos de forma inmediata",
            "Aumentar el monto máximo de la suma asegurada total de la póliza"
        ],
        "correct": 0,
        "explanation": "El deducible es el monto fijo inicial a cargo del asegurado que filtra reclamaciones menores a dicho umbral y fomenta la corresponsabilidad en el uso de la póliza."
    },
    {
        "id": 10,
        "module": "Regulación CNSF",
        "question": "El contrato de seguro se caracteriza por ser aleatorio porque:",
        "options": [
            "Las prestaciones de las partes están sujetas a un acontecimiento incierto de pérdida",
            "Se requiere la firma del contrato ante un notario público",
            "La aseguradora puede cambiar la prima en cualquier momento sin previo aviso",
            "Se rige exclusivamente por las leyes internacionales de comercio marítimo"
        ],
        "correct": 0,
        "explanation": "Es aleatorio porque la obligación de indemnizar por parte de la aseguradora depende de la realización de un evento futuro e incierto (el siniestro)."
    }
];

// Current Agent State (Default Sofía Gutiérrez)
let activeAgent = promoterData.agents[0]; 

// Study Mode State
let studyModule = "Vida Individual";
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
        const response = await fetch('/api/cedula-a/preguntas');
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("Empty DB response");
        questionsDb = data;
        console.log(`Loaded ${questionsDb.length} questions from Neon Database.`);
    } catch (e) {
        console.log("Neon DB API error. Falling back to local preguntas.json:", e);
        try {
            const response = await fetch('preguntas.json');
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
                    await fetch('/api/cedula-a/progreso', {
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
        { name: "Aspectos Generales", total: 108, display: "1. Aspectos Generales" },
        { name: "Regulación CNSF", total: 26, display: "2. Regulación CNSF" },
        { name: "Vida Individual", total: 77, display: "3. Vida Individual" },
        { name: "Accidentes y Enfermedades", total: 69, display: "4. Accidentes y Enfermedades" },
        { name: "Seguros de Daños", total: 145, display: "5. Seguros de Daños" },
        { name: "Sistema y Mercados Financieros", total: 117, display: "6. Sistema y Mercados Fin." }
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

    const overallCompletionPct = Math.round((totalCompletedModules / 6) * 100);
    const overallText = `${totalCompletedModules} de 6 Módulos completados`;
    
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
        await fetch('/api/cedula-a/progreso', {
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
        const res = await fetch('/api/cedula-a/licencias', {
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
                    if (mod === "Sistema y Mercados Financieros") shortMod = "Finanzas";
                    else if (mod === "Accidentes y Enfermedades") shortMod = "Accidentes";
                    
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
    
    let lastModule = "Vida Individual";
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
        const audioUrl = `/api/cedula-a/audio?text=${encodeURIComponent(textToRead)}&id=${encodeURIComponent(trackId)}`;
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
    
    const explanation = q.explanation || q.explicacion || "Este reactivo forma parte del temario oficial de certificación Cédula A.";
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
    const mod = qObj.module || studyModule || "Aspectos Generales";

    // Coherent module descriptions for the pre-answer state (no misleading keyword guesses before the user answers)
    const moduleGuides = {
        "Aspectos Generales": {
            badge: "Ley sobre el Contrato de Seguro (LSCS)",
            summary: "Evalúa los principios jurídicos y técnicos del seguro: interés asegurable, agravación del riesgo, prescripción, subrogación, primas e indemnización."
        },
        "Regulación CNSF": {
            badge: "Marco Normativo y Reglamento de Agentes",
            summary: "Evalúa las facultades de inspección de la CNSF, autorizaciones, cédulas, sanciones administrativas e impedimentos legales del agente."
        },
        "Vida Individual": {
            badge: "Ramo de Vida Individual (Cédula A)",
            summary: "Evalúa planes Temporales, Ordinarios de Vida y Dotales, valores garantizados (rescate, saldado, prorrogado), indisputabilidad y beneficios adicionales."
        },
        "Accidentes y Enfermedades": {
            badge: "Gastos Médicos Mayores y Accidentes Personales",
            summary: "Evalúa deducible, coaseguro, periodos de espera, preexistencias, tabuladores médicos y coberturas de pérdidas orgánicas."
        },
        "Seguros de Daños": {
            badge: "Riesgos Individuales de Daños (Hogar y Autos)",
            summary: "Evalúa seguro múltiple familiar, incendio, robo con violencia, responsabilidad civil familiar/vehicular, proporción indemnizable y embarcaciones de placer."
        },
        "Sistema y Mercados Financieros": {
            badge: "Sistema Financiero Mexicano e Inversiones",
            summary: "Evalúa autoridades reguladoras (SHCP, Banxico, CNBV, CNSF, CONSAR, CONDUSEF), mercado de deuda, renta variable y sociedades de inversión."
        }
    };

    const guide = moduleGuides[mod] || {
        badge: "Certificación Oficial Cédula A (CNSF)",
        summary: "Riesgos Individuales de Personas y Daños conforme al temario vigente de la Comisión Nacional de Seguros y Fianzas."
    };

    descEl.innerHTML = `
        <div style="background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 14px; text-align: left;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">${guide.badge}</span>
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

    // Render coherent SVG diagram based on unambiguous topic + module
    if (text.includes("condusef") || text.includes("protección y defensa al usuario")) {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 220">
                <rect width="400" height="220" rx="10" fill="rgba(255,255,255,0.01)"/>
                <line x1="200" y1="50" x2="200" y2="165" stroke="#9ca3af" stroke-width="4"/>
                <line x1="160" y1="165" x2="240" y2="165" stroke="#9ca3af" stroke-width="6"/>
                <line x1="100" y1="70" x2="300" y2="70" stroke="#9ca3af" stroke-width="4" class="timeline-line"/>
                <circle cx="200" cy="70" r="6" fill="#8b5cf6"/>
                <line x1="100" y1="70" x2="100" y2="120" stroke="#9ca3af" stroke-width="1.5"/>
                <path d="M75,120 L125,120 L115,135 L85,135 Z" fill="rgba(20, 184, 166, 0.2)" stroke="#14b8a6" stroke-width="2"/>
                <text x="100" y="111" font-size="10" fill="#2dd4bf" font-weight="700" text-anchor="middle">Usuario</text>
                <line x1="300" y1="70" x2="300" y2="120" stroke="#9ca3af" stroke-width="1.5"/>
                <path d="M275,120 L325,120 L315,135 L285,135 Z" fill="rgba(139, 92, 246, 0.2)" stroke="#8b5cf6" stroke-width="2"/>
                <text x="300" y="111" font-size="10" fill="#a78bfa" font-weight="700" text-anchor="middle">Institución</text>
                <g transform="translate(145, 180)">
                    <rect width="110" height="28" rx="6" fill="#14b8a6"/>
                    <text x="55" y="18" font-size="12" fill="#fff" font-weight="800" text-anchor="middle">CONDUSEF</text>
                </g>
                <text x="200" y="35" font-size="13" fill="#fff" font-weight="700" text-anchor="middle">Conciliación, Arbitraje y Defensa del Usuario</text>
            </svg>
        `;
    } else if (text.includes("fideicomiso") || text.includes("fideicomitente") || text.includes("fiduciario") || text.includes("fideicomisario")) {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 220">
                <rect width="400" height="220" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(20, 80)">
                    <rect width="95" height="50" rx="8" fill="var(--glass-bg)" stroke="#8b5cf6" stroke-width="2"/>
                    <text x="47" y="26" font-size="10" fill="#fff" font-weight="600" text-anchor="middle">Fideicomitente</text>
                    <text x="47" y="40" font-size="8" fill="#9ca3af" text-anchor="middle">(Aporta / Ordena)</text>
                </g>
                <path d="M120,105 L150,105" stroke="#14b8a6" stroke-width="2" fill="none" stroke-dasharray="4" class="fideicomiso-flow"/>
                <g transform="translate(155, 80)" class="pulse-shield">
                    <rect width="90" height="50" rx="8" fill="var(--glass-bg)" stroke="#14b8a6" stroke-width="2"/>
                    <text x="45" y="26" font-size="10" fill="#fff" font-weight="600" text-anchor="middle">Fiduciario</text>
                    <text x="45" y="40" font-size="8" fill="#9ca3af" text-anchor="middle">(Administra)</text>
                </g>
                <path d="M250,105 L280,105" stroke="#10b981" stroke-width="2" fill="none" stroke-dasharray="4" class="fideicomiso-flow"/>
                <g transform="translate(285, 80)">
                    <rect width="95" height="50" rx="8" fill="var(--glass-bg)" stroke="#10b981" stroke-width="2"/>
                    <text x="47" y="26" font-size="10" fill="#fff" font-weight="600" text-anchor="middle">Fideicomisario</text>
                    <text x="47" y="40" font-size="8" fill="#9ca3af" text-anchor="middle">(Beneficiario)</text>
                </g>
                <text x="200" y="45" font-size="13" fill="#fff" font-weight="700" text-anchor="middle">Estructura Patrimonial del Fideicomiso</text>
            </svg>
        `;
    } else if (text.includes("valores garantizados") || text.includes("seguro saldado") || text.includes("seguro prorrogado") || text.includes("valor de rescate")) {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 220">
                <rect width="400" height="220" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(30, 50)">
                    <rect width="100" height="120" rx="6" fill="rgba(20, 184, 166, 0.1)" stroke="#14b8a6" stroke-width="1.5"/>
                    <text x="50" y="25" font-size="11" fill="#14b8a6" font-weight="700" text-anchor="middle">Valor Rescate</text>
                    <text x="50" y="60" font-size="10" fill="#fff" text-anchor="middle">Efectivo Líquido</text>
                    <text x="50" y="85" font-size="9" fill="#9ca3af" text-anchor="middle">Termina Contrato</text>
                </g>
                <g transform="translate(150, 50)">
                    <rect width="100" height="120" rx="6" fill="rgba(139, 92, 246, 0.1)" stroke="#8b5cf6" stroke-width="1.5"/>
                    <text x="50" y="25" font-size="11" fill="#8b5cf6" font-weight="700" text-anchor="middle">Seguro Saldado</text>
                    <text x="50" y="60" font-size="10" fill="#fff" text-anchor="middle">Mismo Plazo</text>
                    <text x="50" y="85" font-size="9" fill="#9ca3af" text-anchor="middle">Suma Reducida</text>
                </g>
                <g transform="translate(270, 50)">
                    <rect width="100" height="120" rx="6" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" stroke-width="1.5"/>
                    <text x="50" y="25" font-size="11" fill="#ef4444" font-weight="700" text-anchor="middle">S. Prorrogado</text>
                    <text x="50" y="60" font-size="10" fill="#fff" text-anchor="middle">Misma Suma</text>
                    <text x="50" y="85" font-size="9" fill="#9ca3af" text-anchor="middle">Plazo Reducido</text>
                </g>
            </svg>
        `;
    } else if (mod === "Accidentes y Enfermedades" && (text.includes("coaseguro") || text.includes("deducible"))) {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 220">
                <rect width="400" height="220" rx="10" fill="rgba(255,255,255,0.01)"/>
                <text x="200" y="40" font-size="13" fill="#fff" font-weight="700" text-anchor="middle">Participación en Gastos Médicos Mayores</text>
                <g class="grow-bar">
                    <rect x="45" y="75" width="85" height="40" fill="#ef4444" rx="4"/>
                    <text x="87" y="100" font-size="11" fill="#fff" font-weight="700" text-anchor="middle">1. Deducible</text>
                    <text x="87" y="135" font-size="10" fill="#fca5a5" text-anchor="middle">Monto Fijo Inicial</text>
                </g>
                <g class="grow-bar">
                    <rect x="145" y="75" width="90" height="40" fill="#8b5cf6" rx="4"/>
                    <text x="190" y="100" font-size="11" fill="#fff" font-weight="700" text-anchor="middle">2. Coaseguro</text>
                    <text x="190" y="135" font-size="10" fill="#c084fc" text-anchor="middle">% Remanente</text>
                </g>
                <g class="grow-bar">
                    <rect x="250" y="75" width="110" height="40" fill="#10b981" rx="4"/>
                    <text x="305" y="100" font-size="11" fill="#fff" font-weight="700" text-anchor="middle">3. Aseguradora</text>
                    <text x="305" y="135" font-size="10" fill="#34d399" text-anchor="middle">Indemnización Neta</text>
                </g>
            </svg>
        `;
    } else if (mod === "Aspectos Generales") {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(160, 20)">
                    <rect width="80" height="95" rx="6" fill="rgba(139, 92, 246, 0.15)" stroke="#8b5cf6" stroke-width="2"/>
                    <line x1="15" y1="30" x2="65" y2="30" stroke="#8b5cf6" stroke-width="2"/>
                    <line x1="15" y1="50" x2="65" y2="50" stroke="#8b5cf6" stroke-width="2"/>
                    <line x1="15" y1="70" x2="50" y2="70" stroke="#8b5cf6" stroke-width="2"/>
                </g>
                <text x="200" y="145" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Aspectos Generales y Contrato de Seguro</text>
                <text x="200" y="170" font-size="11" fill="#9ca3af" text-anchor="middle">Ley sobre el Contrato de Seguro (LSCS) • Principios Técnicos</text>
            </svg>
        `;
    } else if (mod === "Regulación CNSF") {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g class="pulse-shield" transform="translate(150, 15)">
                    <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="#14b8a6" stroke-width="2"/>
                    <path d="M25,30 L50,15 L75,30 V60 C75,75 50,85 50,85 C50,85 25,75 25,60 V30 Z" fill="rgba(20, 184, 166, 0.2)" stroke="#14b8a6" stroke-width="3"/>
                </g>
                <text x="200" y="145" font-size="15" fill="#fff" font-weight="700" text-anchor="middle">Regulación Oficial CNSF</text>
                <text x="200" y="170" font-size="11" fill="#9ca3af" text-anchor="middle">LISF • Reglamento de Agentes de Seguros y de Fianzas</text>
            </svg>
        `;
    } else if (mod === "Vida Individual") {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <line x1="50" y1="125" x2="350" y2="125" stroke="#6b7280" stroke-width="2" class="timeline-line"/>
                <circle cx="70" cy="125" r="6" fill="#14b8a6"/>
                <circle cx="200" cy="125" r="6" fill="#8b5cf6"/>
                <circle cx="330" cy="125" r="6" fill="#10b981"/>
                <text x="200" y="80" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Seguro de Vida Individual (Cédula A)</text>
                <text x="200" y="165" font-size="11" fill="#9ca3af" text-anchor="middle">Planes Temporales • Ordinario de Vida • Dotales • Valores Garantizados</text>
            </svg>
        `;
    } else if (mod === "Accidentes y Enfermedades") {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <circle cx="200" cy="70" r="30" fill="rgba(20, 184, 166, 0.15)" stroke="#14b8a6" stroke-width="2.5"/>
                <path d="M190,70 h20 M200,60 v20" stroke="#14b8a6" stroke-width="3"/>
                <text x="200" y="135" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Accidentes Personales y Gastos Médicos</text>
                <text x="200" y="160" font-size="11" fill="#9ca3af" text-anchor="middle">Deducible • Coaseguro • Periodos de Espera • Pérdidas Orgánicas</text>
            </svg>
        `;
    } else if (mod === "Seguros de Daños") {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(160, 25)">
                    <polygon points="40,10 75,40 65,40 65,75 15,75 15,40 5,40" fill="rgba(139, 92, 246, 0.2)" stroke="#8b5cf6" stroke-width="2"/>
                </g>
                <text x="200" y="135" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Seguros de Daños (Riesgos Individuales)</text>
                <text x="200" y="160" font-size="11" fill="#9ca3af" text-anchor="middle">Hogar • Automóviles Residentes • RC Familiar • Proporción Indemnizable</text>
            </svg>
        `;
    } else {
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 200">
                <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                <rect x="150" y="20" width="100" height="30" rx="4" fill="rgba(139, 92, 246, 0.2)" stroke="#8b5cf6" stroke-width="1.5"/>
                <text x="200" y="39" font-size="10" fill="#fff" font-weight="bold" text-anchor="middle">SHCP / BANXICO</text>
                <line x1="200" y1="50" x2="200" y2="80" stroke="#8b5cf6" stroke-width="1.5"/>
                <line x1="100" y1="80" x2="300" y2="80" stroke="#8b5cf6" stroke-width="1.5"/>
                <line x1="100" y1="80" x2="100" y2="110" stroke="#14b8a6" stroke-width="1.5"/>
                <line x1="300" y1="80" x2="300" y2="110" stroke="#10b981" stroke-width="1.5"/>
                <rect x="50" y="110" width="100" height="30" rx="4" fill="rgba(20, 184, 166, 0.2)" stroke="#14b8a6" stroke-width="1.5"/>
                <text x="100" y="129" font-size="9" fill="#fff" text-anchor="middle">CNSF / CNBV</text>
                <rect x="250" y="110" width="100" height="30" rx="4" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="1.5"/>
                <text x="300" y="129" font-size="9" fill="#fff" text-anchor="middle">CONDUSEF / CONSAR</text>
                <text x="200" y="175" font-size="12" fill="#fff" font-weight="700" text-anchor="middle">Sistema y Mercados Financieros</text>
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

    const startConfirm = confirm("¿Deseas iniciar el simulador oficial? Tendrás 80 preguntas aleatorias de los 6 módulos y 2 horas límite.");
    if (!startConfirm) return;
    
    // Pick 80 random questions with balanced CNSF module sizes
    // 16 from Aspectos, 6 from Regulación, 14 from Vida, 12 from Accidentes, 16 from Daños, 16 from Finanzas
    const config = [
        { mod: "Aspectos Generales", count: 16 },
        { mod: "Regulación CNSF", count: 6 },
        { mod: "Vida Individual", count: 14 },
        { mod: "Accidentes y Enfermedades", count: 12 },
        { mod: "Seguros de Daños", count: 16 },
        { mod: "Sistema y Mercados Financieros", count: 16 }
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
        await fetch('/api/cedula-a/intentos', {
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
    
    alert(`Examen Terminado.\n\nTu Calificación: ${finalScore}%\nEstado: ${passed ? "APROBADO (Apto para Cédula A)" : "REPROBADO (Sigue estudiando)"}`);
    
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
            <p style="font-size: 14px; color: #94a3b8; margin-bottom: 24px; line-height: 1.5;">El simulador y academia de Cédula A no está disponible en período de pruebas.</p>
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
