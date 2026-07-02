// app.js: Cédula A Simulator & E-Learning Platform Lógica

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
        
        // Determine role
        currentRole = (currentUser.email.toLowerCase().includes("promotor") || currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" || currentUser.role === "PROMOTER" || currentUser.role === "PROMOTOR") ? "promoter" : "agent";
        
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
            if (res.ok) {
                promoterData = await res.json();
                console.log("Loaded promoterData from Neon DB:", promoterData);
                // Also set activeAgent to promoter's self account
                activeAgent = promoterData.agents.find(a => a.email === currentUser.email.toLowerCase()) || promoterData.agents[0];
            }
        } else {
            const res = await fetch('/api/cedula-a/agent-data');
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
    } catch (err) {
        console.error("Failed to refresh user data from DB:", err);
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
        "correct": 2
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
        "correct": 0
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
        "correct": 1
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
        "correct": 1
    },
    {
        "id": 5,
        "module": "Aspectos Generales",
        "question": "¿Cuál es la prima que se obtiene directamente de las tablas de mortalidad y cubre únicamente el costo neto del riesgo?",
        "options": ["Prima de tarifa", "Prima pura de riesgo", "Prima única", "Prima total"],
        "correct": 1
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
        "correct": 1
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
        "correct": 1
    },
    {
        "id": 8,
        "module": "Vida Individual",
        "question": "Tipo de plan de seguro que otorga protección por un plazo fijo definido y cuyas primas cubren únicamente el riesgo de fallecimiento sin acumular valores garantizados:",
        "options": ["Dotal", "Temporal", "Ordinario de Vida", "Universal"],
        "correct": 1
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
        "correct": 0
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
        "correct": 0
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
    populateVoiceSelector();
});

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        populateVoiceSelector();
    };
}

// Load questions from JSON or use fallback
async function loadQuestions() {
    try {
        const response = await fetch('/api/cedula-a/preguntas');
        if (!response.ok) throw new Error("API Error");
        questionsDb = await response.json();
        console.log(`Loaded ${questionsDb.length} questions from Neon Database.`);
    } catch (e) {
        console.log("Neon DB API error. Falling back to local preguntas.json:", e);
        try {
            const response = await fetch('preguntas.json');
            if (!response.ok) throw new Error("Local file error");
            questionsDb = await response.json();
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
                            tiempo_segundos: Math.round(activeAgent.timesPerModule[studyModule] * 60)
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
        // By default log into the promoter's personal study account (id: 99)
        activeAgent = promoterData.agents.find(a => a.id === 99) || promoterData.agents[0];
        
        nameEl.innerText = activeAgent.name;
        roleEl.innerText = "Agente en Capacitación";
        avatarEl.innerText = activeAgent.initials;
        
        // Hide role switcher, show logout (hides promoter navigation features from the agent view)
        if (roleSwitcher) roleSwitcher.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "flex";
        
        // Update agent metrics UI
        document.getElementById("agent-active-badge").innerText = `Acceso Activo (${activeAgent.remainingDays} días restantes)`;
        document.getElementById("agent-active-badge").className = activeAgent.remainingDays > 0 ? "status-badge active" : "status-badge inactive";
        document.getElementById("agent-total-study-time").innerText = `${Math.floor(activeAgent.studyTime / 60)}h ${Math.round(activeAgent.studyTime % 60)}m`;
        
        const lastAttempt = activeAgent.attempts[activeAgent.attempts.length - 1];
        document.getElementById("agent-last-score").innerText = lastAttempt ? `${lastAttempt.score}%` : "N/A";
        
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
    }
}

// -------------------------------------------------------------
// PROMOTER DASHBOARD LOGIC
// -------------------------------------------------------------
function updatePromoterDashboard() {
    // Global metrics
    document.getElementById("promoter-tokens").innerText = `${promoterData.tokens} Días`;
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
    const agent = promoterData.agents.find(a => a.id === agentId);
    if (!agent) return;
    
    const days = prompt(`¿Cuántos días de simulador deseas asignarle a ${agent.name}? (Tienes ${promoterData.tokens} días disponibles)`);
    const parsedDays = parseInt(days);
    
    if (isNaN(parsedDays) || parsedDays <= 0) {
        alert("Por favor ingresa un número de días válido.");
        return;
    }
    
    if (parsedDays > promoterData.tokens) {
        alert("No tienes suficientes días de saldo. Compra un paquete primero.");
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

function buyTokens() {
    const confirmBuy = confirm("¿Deseas comprar un paquete de 7 días de simulador para tu estructura por $299 MXN?");
    if (confirmBuy) {
        promoterData.tokens += 7;
        alert("¡Compra procesada con éxito! Se han añadido 7 días a tu saldo disponible.");
        updatePromoterDashboard();
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
            tr.innerHTML = `
                <td>${att.date} ${timeStr}</td>
                <td>${typeStr}</td>
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
    renderContextAnimation(q.question);
    
    // Autoplay voice narration (reads question + choices, but NOT the answer)
    // Slight timeout to let DOM render and ensure focus activation
    setTimeout(() => {
        if (activeTab === "agent-study" && currentRole === "agent") {
            startAudioSpeech();
        }
    }, 450);
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
        
        // Enable next button
        const nextBtn = document.getElementById("btn-study-next");
        if (nextBtn) nextBtn.disabled = false;
        
        // Play success notification in speech if desired or just let them read
        // Log performance on active agent
        if (activeAgent.moduleScores[studyModule] < 95) {
            activeAgent.moduleScores[studyModule] = Math.min(100, activeAgent.moduleScores[studyModule] + 1);
        }
    } else {
        // INCORRECT CHOICE
        if (isCurrentQuestionSolved) return; // ignore if already solved
        
        // Show scandalous red error highlight
        items[selectedIndex].classList.remove("selected");
        items[selectedIndex].classList.add("incorrect");
        
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
        renderStudyQuestion();
    } else {
        alert("¡Has completado todas las preguntas de este módulo!");
        if (!activeAgent.studyProgress) activeAgent.studyProgress = {};
        activeAgent.studyProgress[studyModule] = 0; // Reset index on complete
        switchTab("agent-dash");
    }
}

function revealExplanation() {
    const q = studyQuestions[studyCurrentIdx];
    const items = document.querySelectorAll("#study-options-container .option-item");
    items[q.correct].classList.add("correct");
    
    // Read correct answer & explanation
    if ('speechSynthesis' in window) {
        stopAudioSpeech();
        const correctText = q.options[q.correct];
        const descText = document.getElementById("animation-concept-desc").innerText.replace("Coaseguro y Deducible:", "").replace("Seguro Dotal vs Temporal:", "").replace("Estructura del Fideicomiso en Seguros:", "").replace("Composición de la Prima:", "");
        
        isSpeaking = true;
        document.getElementById("btn-audio-speak").classList.add("active");
        document.getElementById("voice-waveform").classList.add("active");
        
        const explanationText = `La respuesta correcta es la opción: ${correctText}. Explicación: ${descText}`;
        speechUtterance = new SpeechSynthesisUtterance(explanationText);
        speechUtterance.voice = getBestSpanishVoice();
        speechUtterance.lang = "es-MX";
        speechUtterance.rate = 0.98;
        
        speechUtterance.onend = stopAudioSpeech;
        speechUtterance.onerror = stopAudioSpeech;
        window.speechSynthesis.speak(speechUtterance);
    }
}

// TEXT TO SPEECH (VOICE NARRATOR) WITH PREMIUM SPANISH VOICE
let selectedVoiceName = "";

function populateVoiceSelector() {
    if (!('speechSynthesis' in window)) return;
    const selector = document.getElementById("study-voice-selector");
    if (!selector) return;
    
    const voices = window.speechSynthesis.getVoices();
    const esVoices = voices.filter(v => v.lang.startsWith("es") || v.lang.includes("ES") || v.lang.includes("MX"));
    
    selector.innerHTML = "";
    
    if (esVoices.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.innerText = "Voz por defecto";
        selector.appendChild(opt);
        voices.forEach(v => {
            const optAll = document.createElement("option");
            optAll.value = v.name;
            optAll.innerText = `${v.name} (${v.lang})`;
            selector.appendChild(optAll);
        });
        return;
    }
    
    esVoices.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.name;
        let displayName = v.name.replace("Microsoft", "MS").replace("Google", "Google");
        if (v.name.includes("Natural") || v.name.includes("Online")) {
            displayName += " (Neural)";
        }
        opt.innerText = `${displayName} (${v.lang})`;
        selector.appendChild(opt);
    });
    
    const bestVoice = getBestSpanishVoice();
    if (bestVoice && !selectedVoiceName) {
        selector.value = bestVoice.name;
        selectedVoiceName = bestVoice.name;
    } else if (selectedVoiceName) {
        selector.value = selectedVoiceName;
    }
}

function changeVoice() {
    selectedVoiceName = document.getElementById("study-voice-selector").value;
    stopAudioSpeech();
    setTimeout(startAudioSpeech, 150);
}

function getBestSpanishVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    
    if (selectedVoiceName) {
        const chosen = voices.find(v => v.name === selectedVoiceName);
        if (chosen) return chosen;
    }
    
    // 1. Try to find a premium Mexican Spanish voice (neural / Google / Microsoft / Hilda / Jorge / Dalia)
    let voice = voices.find(v => v.lang.includes("MX") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Microsoft") || v.name.includes("Online")));
    // 2. Fallback to any Mexican Spanish voice
    if (!voice) voice = voices.find(v => v.lang.includes("MX") || v.lang === "es-MX");
    // 3. Fallback to a premium Spanish voice (Spain / other)
    if (!voice) voice = voices.find(v => v.lang.startsWith("es") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Microsoft") || v.name.includes("Online")));
    // 4. Fallback to any Spanish voice
    if (!voice) voice = voices.find(v => v.lang.startsWith("es"));
    
    return voice;
}

function toggleAudioSpeech() {
    // If speaking, clicking the "repeat" button restarts reading
    stopAudioSpeech();
    setTimeout(startAudioSpeech, 100);
}

function startAudioSpeech() {
    if (!('speechSynthesis' in window)) {
        console.log("Speech synthesis not supported.");
        return;
    }
    
    const q = studyQuestions[studyCurrentIdx];
    if (!q) return;
    
    isSpeaking = true;
    const btn = document.getElementById("btn-audio-speak");
    if (btn) btn.classList.add("active");
    
    const wave = document.getElementById("voice-waveform");
    if (wave) wave.classList.add("active");
    
    // Reads question + options, but NOT the answer to let the user guess
    const optionA = q.options[0] ? `Opción A: ${q.options[0]}. ` : "";
    const optionB = q.options[1] ? `Opción B: ${q.options[1]}. ` : "";
    const optionC = q.options[2] ? `Opción C: ${q.options[2]}. ` : "";
    const optionD = q.options[3] ? `Opción D: ${q.options[3]}. ` : "";
    
    const textToRead = `${q.question}. ${optionA}${optionB}${optionC}${optionD}`;
    
    speechUtterance = new SpeechSynthesisUtterance(textToRead);
    
    // Choose premium Mexican voice if possible
    const bestVoice = getBestSpanishVoice();
    if (bestVoice) {
        speechUtterance.voice = bestVoice;
        console.log(`Using Spanish Voice: ${bestVoice.name} (${bestVoice.lang})`);
    }
    
    speechUtterance.lang = "es-MX";
    speechUtterance.rate = 0.96; // Slightly slower, highly clear
    
    speechUtterance.onend = stopAudioSpeech;
    speechUtterance.onerror = stopAudioSpeech;
    
    window.speechSynthesis.speak(speechUtterance);
}

function stopAudioSpeech() {
    isSpeaking = false;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    
    const btn = document.getElementById("btn-audio-speak");
    if (btn) btn.classList.remove("active");
    
    const wave = document.getElementById("voice-waveform");
    if (wave) wave.classList.remove("active");
}

function renderContextAnimation(questionText) {
    const container = document.getElementById("animation-canvas-container");
    const descEl = document.getElementById("animation-concept-desc");
    
    const text = questionText.toLowerCase();
    
    // 1. CONDUSEF / Equidad / Usuarios
    if (text.includes("condusef") || text.includes("equidad entre") || text.includes("protección y defensa") || text.includes("de los usuarios")) {
        descEl.innerHTML = `
            <strong>CONDUSEF (Defensa del Usuario):</strong><br>
            Tiene como objetivo prioritario **procurar la equidad** en las relaciones entre los usuarios de servicios financieros y las instituciones, actuando como órgano de consulta, conciliación y arbitraje para proteger sus derechos e intereses.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 240">
                <rect width="400" height="240" rx="10" fill="rgba(255,255,255,0.01)"/>
                <line x1="200" y1="60" x2="200" y2="180" stroke="#9ca3af" stroke-width="4"/>
                <line x1="160" y1="180" x2="240" y2="180" stroke="#9ca3af" stroke-width="6"/>
                <line x1="100" y1="80" x2="300" y2="80" stroke="#9ca3af" stroke-width="4" class="timeline-line"/>
                <circle cx="200" cy="80" r="6" fill="#8b5cf6"/>
                
                <line x1="100" y1="80" x2="100" y2="130" stroke="#9ca3af" stroke-width="1.5"/>
                <path d="M75,130 L125,130 L115,145 L85,145 Z" fill="rgba(20, 184, 166, 0.2)" stroke="#14b8a6" stroke-width="2"/>
                <text x="100" y="121" font-size="10" fill="#2dd4bf" font-weight="700" text-anchor="middle">Usuario</text>
                
                <line x1="300" y1="80" x2="300" y2="130" stroke="#9ca3af" stroke-width="1.5"/>
                <path d="M275,130 L325,130 L315,145 L285,145 Z" fill="rgba(139, 92, 246, 0.2)" stroke="#8b5cf6" stroke-width="2"/>
                <text x="300" y="121" font-size="10" fill="#a78bfa" font-weight="700" text-anchor="middle">Institución</text>
                
                <g transform="translate(145, 195)">
                    <rect width="110" height="30" rx="6" fill="#14b8a6"/>
                    <text x="55" y="19" font-size="12" fill="#fff" font-weight="800" text-anchor="middle">CONDUSEF</text>
                </g>
                <text x="200" y="45" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Equidad y Protección</text>
            </svg>
        `;
    }
    // 2. SHCP / Secretaría de Hacienda (Máxima Autoridad)
    else if (text.includes("shcp") || text.includes("secretaría de hacienda") || text.includes("secretaria de hacienda")) {
        descEl.innerHTML = `
            <strong>SHCP (Máxima Autoridad Financiera):</strong><br>
            Es el órgano rector del sistema financiero en México. Coordina las políticas de seguros y tiene la facultad exclusiva de **otorgar o revocar autorizaciones** para operar instituciones de seguros y fianzas.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 240">
                <rect width="400" height="240" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(150, 20)">
                    <rect width="100" height="40" rx="6" fill="rgba(139, 92, 246, 0.2)" stroke="#8b5cf6" stroke-width="2"/>
                    <text x="50" y="24" font-size="12" fill="#fff" font-weight="800" text-anchor="middle">SHCP</text>
                </g>
                <line x1="200" y1="60" x2="200" y2="100" stroke="#8b5cf6" stroke-width="2"/>
                
                <g transform="translate(150, 100)">
                    <rect width="100" height="40" rx="6" fill="rgba(20, 184, 166, 0.2)" stroke="#14b8a6" stroke-width="2"/>
                    <text x="50" y="24" font-size="12" fill="#fff" font-weight="800" text-anchor="middle">CNSF</text>
                </g>
                <line x1="200" y1="140" x2="200" y2="180" stroke="#14b8a6" stroke-width="2"/>
                
                <g transform="translate(125, 180)">
                    <rect width="150" height="40" rx="6" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="2"/>
                    <text x="75" y="24" font-size="11" fill="#fff" font-weight="800" text-anchor="middle">Aseguradoras</text>
                </g>
            </svg>
        `;
    }
    // 3. CNSF (Supervisión y Solvencia)
    else if (text.includes("cnsf") || text.includes("comisión nacional de seguros")) {
        descEl.innerHTML = `
            <strong>CNSF (Supervisión y Solvencia):</strong><br>
            Órgano desconcentrado de la SHCP que **supervisa e inspecciona** la solvencia de aseguradoras y afianzadoras, autoriza el registro de pólizas y expide las **cédulas de agentes de seguros**.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 220">
                <rect width="400" height="220" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g class="pulse-shield" transform="translate(150, 20)">
                    <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="#14b8a6" stroke-width="2"/>
                    <path d="M25,30 L50,15 L75,30 V60 C75,75 50,85 50,85 C50,85 25,75 25,60 V30 Z" fill="rgba(20, 184, 166, 0.2)" stroke="#14b8a6" stroke-width="3"/>
                </g>
                <text x="200" y="150" font-size="16" fill="#fff" font-weight="800" text-anchor="middle">CNSF</text>
                <text x="200" y="175" font-size="11" fill="#9ca3af" text-anchor="middle">Supervisión • Solvencia • Cédulas</text>
            </svg>
        `;
    }
    // 4. Banco de México / BANXICO
    else if (text.includes("banco de méxico") || text.includes("banxico") || text.includes("banco central")) {
        descEl.innerHTML = `
            <strong>Banco de México (Banco Central):</strong><br>
            Regula la emisión monetaria, controla la inflación, determina políticas de tasa de interés y administra las reservas internacionales del país, influyendo en las inversiones de las aseguradoras.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 220">
                <rect width="400" height="220" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(160, 30)">
                    <rect x="0" y="10" width="80" height="60" rx="4" fill="none" stroke="#8b5cf6" stroke-width="2"/>
                    <line x1="40" y1="10" x2="40" y2="70" stroke="#8b5cf6" stroke-width="2"/>
                    <circle cx="40" cy="40" r="15" fill="rgba(139, 92, 246, 0.2)" stroke="#8b5cf6" stroke-width="2"/>
                    <text x="40" y="44" font-size="12" fill="#fff" font-weight="800" text-anchor="middle">$</text>
                </g>
                <text x="200" y="140" font-size="15" fill="#fff" font-weight="800" text-anchor="middle">BANXICO</text>
                <text x="200" y="165" font-size="11" fill="#9ca3af" text-anchor="middle">Estabilidad Cambiaria • Política Monetaria</text>
            </svg>
        `;
    }
    // 5. Lavado de dinero (UIF / Querella)
    else if (text.includes("lavado") || text.includes("recursos de procedencia ilícita") || text.includes("proceda penalmente")) {
        descEl.innerHTML = `
            <strong>Lavado de Dinero (Petición Penal):</strong><br>
            La **SHCP** es el único organismo facultado en México para formular la denuncia o querella ante el Ministerio Público Federal para proceder penalmente contra operaciones de lavado.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 220">
                <rect width="400" height="220" rx="10" fill="rgba(255,255,255,0.01)"/>
                <rect x="130" y="40" width="140" height="50" rx="8" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" stroke-width="2"/>
                <text x="200" y="69" font-size="12" fill="#fff" font-weight="800" text-anchor="middle">SHCP / UIF</text>
                
                <path d="M200,90 L200,130" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow)" stroke-dasharray="4"/>
                
                <rect x="110" y="135" width="180" height="40" rx="6" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="1.5"/>
                <text x="200" y="160" font-size="11" fill="#fff" font-weight="700" text-anchor="middle">✔ Querella Penal al M.P.</text>
            </svg>
        `;
    }
    // 6. Accidente Colectivo
    else if (text.includes("colectivo") || text.includes("accidente colectivo")) {
        descEl.innerHTML = `
            <strong>Accidente Colectivo:</strong><br>
            Se considera **Accidente Colectivo** a la muerte o incapacidad que deriva de un siniestro en entornos públicos regulados o eventos catastróficos colectivos, tales como un **incendio en un edificio público**, el colapso de un ascensor público, descarrilamiento de trenes o hundimiento de transportes de servicio público concesionado.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 240">
                <rect width="400" height="240" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(40, 50)">
                    <rect x="0" y="10" width="70" height="80" fill="none" stroke="#6b7280" stroke-width="2"/>
                    <rect x="10" y="20" width="15" height="15" fill="#f3f4f6" opacity="0.3"/>
                    <rect x="45" y="20" width="15" height="15" fill="#f3f4f6" opacity="0.3"/>
                    <rect x="10" y="45" width="15" height="15" fill="#f3f4f6" opacity="0.3"/>
                    <rect x="45" y="45" width="15" height="15" fill="#f3f4f6" opacity="0.3"/>
                    <path d="M25,80 C20,70 25,60 35,55 C30,65 35,70 32,80 Z" fill="#ef4444" class="pulse-shield"/>
                    <path d="M30,80 C28,73 32,68 38,65 C35,72 38,75 36,80 Z" fill="#f59e0b" class="pulse-shield"/>
                </g>
                <g transform="translate(140, 45)">
                    <text x="0" y="20" font-size="14" fill="#ef4444" font-weight="700">Accidente Colectivo (CNSF)</text>
                    <text x="0" y="40" font-size="11" fill="#9ca3af">Se define por eventos de afectación pública:</text>
                    <circle cx="10" cy="65" r="4" fill="#ef4444"/>
                    <text x="22" y="69" font-size="11" fill="#f3f4f6" font-weight="600">✔ Incendio en Edificio Público</text>
                    <circle cx="10" cy="85" r="4" fill="#14b8a6"/>
                    <text x="22" y="89" font-size="11" fill="#9ca3af">✔ Ascensor Público de uso común</text>
                    <circle cx="10" cy="105" r="4" fill="#14b8a6"/>
                    <text x="22" y="109" font-size="11" fill="#9ca3af">✔ Transporte Público Concesionado</text>
                </g>
            </svg>
        `;
    }
    // 7. Fideicomiso
    else if (text.includes("fideicomiso") || text.includes("fideicomitente") || text.includes("fiduciario")) {
        descEl.innerHTML = `
            <strong>Estructura del Fideicomiso:</strong><br>
            * **Fideicomitente:** Quien ordena el fideicomiso y aporta los bienes (ej. asegurado).<br>
            * **Fiduciario:** La aseguradora o banco que administra e invierte dichos bienes.<br>
            * **Fideicomisario:** El beneficiario que recibe los fondos fideicomitidos según las reglas.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 240">
                <rect width="400" height="240" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(30, 90)">
                    <rect width="95" height="50" rx="8" fill="var(--glass-bg)" stroke="#8b5cf6" stroke-width="2"/>
                    <text x="12" y="28" font-size="10" fill="#fff" font-weight="600">Fideicomitente</text>
                    <text x="20" y="42" font-size="8" fill="#9ca3af">(Asegurado/Ordena)</text>
                </g>
                <path d="M130,115 L175,115" stroke="#14b8a6" stroke-width="2" fill="none" stroke-dasharray="4" class="fideicomiso-flow"/>
                <polygon points="175,111 183,115 175,119" fill="#14b8a6" />
                <g transform="translate(180, 90)" class="pulse-shield">
                    <rect width="90" height="50" rx="8" fill="var(--glass-bg)" stroke="#14b8a6" stroke-width="2"/>
                    <text x="22" y="28" font-size="10" fill="#fff" font-weight="600">Fiduciario</text>
                    <text x="12" y="42" font-size="8" fill="#9ca3af">(Aseguradora/Admin)</text>
                </g>
                <path d="M275,115 L320,115" stroke="#10b981" stroke-width="2" fill="none" stroke-dasharray="4" class="fideicomiso-flow"/>
                <polygon points="320,111 328,115 320,119" fill="#10b981" />
                <g transform="translate(325, 90)">
                    <rect width="95" height="50" rx="8" fill="var(--glass-bg)" stroke="#10b981" stroke-width="2"/>
                    <text x="12" y="28" font-size="10" fill="#fff" font-weight="600">Fideicomisario</text>
                    <text x="16" y="42" font-size="8" fill="#9ca3af">(Beneficiario/Recibe)</text>
                </g>
            </svg>
        `;
    }
    // 8. Fianzas
    else if (text.includes("fianza") || text.includes("fiado") || text.includes("solidario")) {
        descEl.innerHTML = `
            <strong>Estructura de la Fianza:</strong><br>
            Contrato accesorio de garantía. El **Fiado** (deudor) garantiza a favor del **Beneficiario** (acreedor) el cumplimiento de una obligación mediante el respaldo de la **Afianzadora** (institución autorizada), quien puede exigir contragarantía al **Obligado Solidario**.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 240">
                <rect width="400" height="240" rx="10" fill="rgba(255,255,255,0.01)"/>
                <circle cx="200" cy="60" r="25" fill="var(--glass-bg)" stroke="#8b5cf6" stroke-width="2"/>
                <text x="200" y="64" font-size="9" fill="#fff" font-weight="600" text-anchor="middle">Beneficiario</text>
                <circle cx="100" cy="160" r="25" fill="var(--glass-bg)" stroke="#14b8a6" stroke-width="2"/>
                <text x="100" y="164" font-size="9" fill="#fff" font-weight="600" text-anchor="middle">Fiado</text>
                <circle cx="300" cy="160" r="25" fill="var(--glass-bg)" stroke="#10b981" stroke-width="2"/>
                <text x="300" y="164" font-size="9" fill="#fff" font-weight="600" text-anchor="middle">Afianzadora</text>
                <line x1="120" y1="145" x2="180" y2="78" stroke="#8b5cf6" stroke-width="2"/>
                <line x1="280" y1="145" x2="220" y2="78" stroke="#10b981" stroke-width="2"/>
                <line x1="125" y1="160" x2="275" y2="160" stroke="#14b8a6" stroke-dasharray="3" stroke-width="2"/>
            </svg>
        `;
    }
    // 9. Subrogación de derechos
    else if (text.includes("subrogación") || text.includes("subroga")) {
        descEl.innerHTML = `
            <strong>Subrogación de Derechos:</strong><br>
            Una vez pagado el siniestro, el asegurado transfiere a la aseguradora los derechos de cobrar al tercero culpable. Esto evita que el asegurado reciba una doble indemnización y garantiza que el responsable asuma el costo.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 240">
                <rect width="400" height="240" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(30, 90)">
                    <rect width="90" height="50" rx="6" fill="var(--glass-bg)" stroke="#14b8a6" stroke-width="1.5"/>
                    <text x="45" y="28" font-size="10" fill="#fff" text-anchor="middle">Asegurado</text>
                </g>
                <path d="M120,80 L200,80 L200,100" stroke="#10b981" stroke-width="2" fill="none" class="fideicomiso-flow"/>
                <polygon points="196,100 200,108 204,100" fill="#10b981" />
                <g transform="translate(160, 110)">
                    <rect width="90" height="50" rx="6" fill="var(--glass-bg)" stroke="#8b5cf6" stroke-width="1.5"/>
                    <text x="45" y="28" font-size="10" fill="#fff" text-anchor="middle">Aseguradora</text>
                </g>
                <path d="M250,135 L300,135 L300,115" stroke="#ef4444" stroke-width="2" fill="none" class="fideicomiso-flow"/>
                <polygon points="296,115 300,107 304,115" fill="#ef4444" />
                <g transform="translate(290, 50)">
                    <rect width="80" height="50" rx="6" fill="var(--glass-bg)" stroke="#ef4444" stroke-width="1.5"/>
                    <text x="40" y="28" font-size="10" fill="#fff" text-anchor="middle">Tercero Culpable</text>
                </g>
            </svg>
        `;
    }
    // 10. Coaseguro y Deducible / Gastos Médicos
    else if (text.includes("coaseguro") || text.includes("deducible") || text.includes("gastos médicos") || text.includes("copago") || text.includes("g.m.m") || text.includes("gastos medicos") || text.includes("gatos médicos")) {
        descEl.innerHTML = `
            <strong>Coaseguro y Deducible:</strong><br>
            * **Deducible:** Cantidad fija que paga el asegurado al inicio de un siniestro.<br>
            * **Coaseguro:** Porcentaje (ej. 10%) que paga el asegurado del gasto remanente.<br>
            Ambos buscan desincentivar el sobreuso de servicios médicos y regular el costo de la prima.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 240">
                <rect width="400" height="240" rx="10" fill="rgba(255,255,255,0.01)"/>
                <text x="50" y="45" font-size="13" fill="#9ca3af" font-weight="600">Repartición del Gasto Médico (Siniestro)</text>
                <g class="grow-bar">
                    <rect x="50" y="80" width="80" height="40" fill="#ef4444" rx="4"/>
                    <text x="63" y="105" font-size="11" fill="#fff" font-weight="700">Deducible</text>
                    <text x="65" y="140" font-size="11" fill="#fca5a5">(Cargo Fijo)</text>
                </g>
                <g class="grow-bar">
                    <rect x="140" y="80" width="85" height="40" fill="#8b5cf6" rx="4"/>
                    <text x="150" y="105" font-size="11" fill="#fff" font-weight="700">Coaseguro</text>
                    <text x="158" y="140" font-size="11" fill="#c084fc">(Copago %)</text>
                </g>
                <g class="grow-bar">
                    <rect x="235" y="80" width="115" height="40" fill="#10b981" rx="4"/>
                    <text x="245" y="105" font-size="11" fill="#fff" font-weight="700">Aseguradora</text>
                    <text x="255" y="140" font-size="11" fill="#34d399">(Cubre el Resto)</text>
                </g>
            </svg>
        `;
    }
    // 11. Muerte Accidental (Exclusiones y Excepciones)
    else if (text.includes("accidental") || text.includes("accidente") || text.includes("exclusiones y excepciones")) {
        descEl.innerHTML = `
            <strong>Muerte Accidental (Exclusiones y Excepciones):</strong><br>
            Ciertos eventos de muerte por accidente tienen condiciones específicas en pólizas de vida y accidentes:<br>
            * **Excepciones (Sí Cubierto):** Eventos ajenos e involuntarios (inhalación accidental de gas, fármacos recetados).<br>
            * **Exclusiones (No Cubierto):** Negligencias o dolo (actos delictivos, alcoholismo/drogas, riña).
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 240">
                <rect width="400" height="240" rx="10" fill="rgba(255,255,255,0.01)"/>
                <text x="50" y="45" font-size="13" fill="#ef4444" font-weight="700">Beneficio Muerte Accidental (CNSF)</text>
                <g transform="translate(40, 70)">
                    <rect width="150" height="120" rx="8" fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" stroke-width="1.5"/>
                    <text x="75" y="22" font-size="11" fill="#10b981" font-weight="700" text-anchor="middle">✔ Excepciones (Cubierto)</text>
                    <text x="15" y="50" font-size="10" fill="#a7f3d0">• Gas inhalado por accidente</text>
                    <text x="15" y="75" font-size="10" fill="#a7f3d0">• Medicamentos recetados</text>
                    <text x="15" y="100" font-size="10" fill="#a7f3d0">• Asfixia por inmersión</text>
                </g>
                <g transform="translate(210, 70)">
                    <rect width="150" height="120" rx="8" fill="rgba(239, 68, 68, 0.08)" stroke="#ef4444" stroke-width="1.5"/>
                    <text x="75" y="22" font-size="11" fill="#ef4444" font-weight="700" text-anchor="middle">✖ Exclusiones (Excluido)</text>
                    <text x="15" y="50" font-size="10" fill="#fca5a5">• Alcoholismo o riña</text>
                    <text x="15" y="75" font-size="10" fill="#fca5a5">• Actos delictivos propios</text>
                    <text x="15" y="100" font-size="10" fill="#fca5a5">• Deportes de alto riesgo</text>
                </g>
            </svg>
        `;
    }
    // 12. Valores Garantizados (Saldado, Prorrogado, Rescate)
    else if (text.includes("valores garantizados") || text.includes("saldado") || text.includes("prorrogado") || text.includes("rescate")) {
        descEl.innerHTML = `
            <strong>Valores Garantizados:</strong><br>
            Derechos adquiridos por el asegurado al acumular reserva matemática en pólizas de vida con ahorro:<br>
            * **Rescate:** Devolución del dinero en efectivo (cancela la póliza).<br>
            * **Seguro Saldado:** Misma vigencia original, pero con una suma asegurada reducida.<br>
            * **Seguro Prorrogado:** Misma suma asegurada original, pero con vigencia reducida (temporal).
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 240">
                <rect width="400" height="240" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(30, 60)">
                    <rect width="100" height="130" rx="6" fill="rgba(20, 184, 166, 0.1)" stroke="#14b8a6" stroke-width="1.5"/>
                    <text x="50" y="25" font-size="11" fill="#14b8a6" font-weight="700" text-anchor="middle">Valor Rescate</text>
                    <text x="50" y="65" font-size="10" fill="#fff" text-anchor="middle">Efectivo Cash</text>
                    <text x="50" y="90" font-size="9" fill="#9ca3af" text-anchor="middle">Cancela Contrato</text>
                </g>
                <g transform="translate(150, 60)">
                    <rect width="100" height="130" rx="6" fill="rgba(139, 92, 246, 0.1)" stroke="#8b5cf6" stroke-width="1.5"/>
                    <text x="50" y="25" font-size="11" fill="#8b5cf6" font-weight="700" text-anchor="middle">Seguro Saldado</text>
                    <text x="50" y="65" font-size="10" fill="#fff" text-anchor="middle">Mismo Plazo</text>
                    <text x="50" y="90" font-size="9" fill="#9ca3af" text-anchor="middle">Suma Reducida</text>
                </g>
                <g transform="translate(270, 60)">
                    <rect width="100" height="130" rx="6" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" stroke-width="1.5"/>
                    <text x="50" y="25" font-size="11" fill="#ef4444" font-weight="700" text-anchor="middle">S. Prorrogado</text>
                    <text x="50" y="65" font-size="10" fill="#fff" text-anchor="middle">Misma Suma</text>
                    <text x="50" y="90" font-size="9" fill="#9ca3af" text-anchor="middle">Plazo Reducido</text>
                </g>
            </svg>
        `;
    }
    // 13. Seguro Dotal (Supervivencia)
    else if (text.includes("dotal") || text.includes("supervivencia")) {
        descEl.innerHTML = `
            <strong>Seguro Dotal:</strong><br>
            El plan **Dotal** combina protección (Vida) y ahorro. Garantiza el pago de la suma asegurada si el asegurado fallece durante la vigencia, **O** al propio asegurado si sobrevive al término del contrato. Genera reservas y valores garantizados.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 240">
                <rect width="400" height="240" rx="10" fill="rgba(255,255,255,0.01)"/>
                <line x1="50" y1="160" x2="350" y2="160" stroke="#6b7280" stroke-width="2" stroke-dasharray="2" class="timeline-line"/>
                <polygon points="350,156 360,160 350,164" fill="#6b7280" />
                <text x="350" y="180" font-size="11" fill="#9ca3af" font-weight="500">Plazo Póliza</text>
                <circle cx="60" cy="160" r="5" fill="#14b8a6"/>
                <text x="45" y="195" font-size="12" fill="#14b8a6" font-weight="600">Año 0: Inicio</text>
                <path d="M70,140 Q180,110 290,140" stroke="#8b5cf6" stroke-width="2" fill="none" stroke-dasharray="5" class="fideicomiso-flow"/>
                <text x="145" y="100" font-size="11" fill="#a78bfa">Ahorro y Primas</text>
                <circle cx="300" cy="160" r="6" fill="#10b981" class="timeline-point timeline-point-2"/>
                <text x="250" y="195" font-size="12" fill="#10b981" font-weight="600">Vencimiento (Supervivencia)</text>
                <g transform="translate(280, 50)" class="timeline-point timeline-point-3">
                    <rect width="40" height="40" rx="8" fill="#10b981" opacity="0.8"/>
                    <path d="M12,12 h16 v16 h-16 z M15,20 h10 M20,15 v10" stroke="#fff" stroke-width="2" fill="none"/>
                    <text x="-40" y="-10" font-size="11" fill="#34d399" font-weight="600">Pago Suma Asegurada</text>
                </g>
                <line x1="300" y1="160" x2="300" y2="90" stroke="#10b981" stroke-width="2" stroke-dasharray="4" class="timeline-line"/>
            </svg>
        `;
    }
    // 14. Seguro Temporal
    else if (text.includes("temporal")) {
        descEl.innerHTML = `
            <strong>Seguro Temporal:</strong><br>
            El plan **Temporal** es protección pura a bajo costo. Solo paga si el asegurado fallece dentro del plazo de vigencia. Si el asegurado sobrevive al plazo, el contrato se da por terminado sin devolver dinero ni acumular valores.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 240">
                <rect width="400" height="240" rx="10" fill="rgba(255,255,255,0.01)"/>
                <line x1="50" y1="160" x2="350" y2="160" stroke="#6b7280" stroke-width="2" stroke-dasharray="2" class="timeline-line"/>
                <polygon points="350,156 360,160 350,164" fill="#6b7280" />
                <text x="350" y="180" font-size="11" fill="#9ca3af" font-weight="500">Límite Plazo</text>
                <circle cx="60" cy="160" r="5" fill="#14b8a6"/>
                <text x="45" y="195" font-size="12" fill="#14b8a6" font-weight="600">Año 0: Inicio</text>
                <circle cx="200" cy="160" r="6" fill="#ef4444" class="timeline-point timeline-point-2"/>
                <text x="140" y="195" font-size="12" fill="#ef4444" font-weight="600">Fallecimiento (CUBIERTO)</text>
                <g transform="translate(180, 50)" class="timeline-point timeline-point-3">
                    <rect width="40" height="40" rx="8" fill="#ef4444" opacity="0.8"/>
                    <path d="M12,15 L20,11 L28,15 V22 C28,26 20,29 20,29 C20,29 12,26 12,22 V15 Z" fill="none" stroke="#fff" stroke-width="2"/>
                    <text x="-40" y="-10" font-size="11" fill="#fca5a5" font-weight="600">Suma a Beneficiarios</text>
                </g>
                <line x1="200" y1="160" x2="200" y2="90" stroke="#ef4444" stroke-width="2" stroke-dasharray="4" class="timeline-line"/>
            </svg>
        `;
    }
    // 15. Prima de Tarifa vs Prima Pura de Riesgo
    else if (text.includes("prima") || text.includes("mortalidad") || text.includes("tarifa")) {
        descEl.innerHTML = `
            <strong>Composición de la Prima Comercial:</strong><br>
            * **Prima Pura de Riesgo:** Costo calculado actuarialmente para cubrir fallecimientos.<br>
            * **Gastos de Adquisición/Operación + Margen:** Recargos por comisiones, administración y utilidades.<br>
            La suma de ambos componentes constituye la **Prima de Tarifa** comercial.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 240">
                <rect width="400" height="240" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(50, 40)" class="grow-bar">
                    <rect width="130" height="150" fill="rgba(20, 184, 166, 0.15)" stroke="#14b8a6" stroke-width="2" rx="6"/>
                    <rect y="110" width="130" height="40" fill="#14b8a6" rx="0 0 6 6"/>
                    <text x="15" y="40" font-size="11" fill="#9ca3af" font-weight="500">Costo de Siniestralidad</text>
                    <text x="12" y="60" font-size="10" fill="#6b7280">(Tablas de Mortalidad)</text>
                    <text x="15" y="133" font-size="12" fill="#fff" font-weight="700">Prima Pura de Riesgo</text>
                </g>
                <text x="195" y="120" font-size="28" fill="#8b5cf6" font-weight="bold">+</text>
                <g transform="translate(220, 40)" class="grow-bar">
                    <rect width="130" height="150" fill="rgba(139, 92, 246, 0.15)" stroke="#8b5cf6" stroke-width="2" rx="6"/>
                    <rect y="0" width="130" height="40" fill="#7c3aed" opacity="0.9" rx="6 6 0 0"/>
                    <text x="15" y="24" font-size="10" fill="#fff" font-weight="600">Comisiones y Venta</text>
                    <rect y="40" width="130" height="40" fill="#8b5cf6" opacity="0.8"/>
                    <text x="15" y="64" font-size="10" fill="#fff" font-weight="600">Gastos Administración</text>
                    <rect y="80" width="130" height="30" fill="#a78bfa" opacity="0.7"/>
                    <text x="15" y="98" font-size="10" fill="#000" font-weight="600">Margen de Utilidad</text>
                    <rect y="110" width="130" height="40" fill="#312e81" rx="0 0 6 6"/>
                    <text x="20" y="133" font-size="12" fill="#fff" font-weight="700">Gastos y Recargos</text>
                </g>
                <text x="200" y="215" font-size="13" fill="#a78bfa" font-weight="700" text-anchor="middle">PRIMA DE TARIFA = RIESGO + RECARGOS</text>
            </svg>
        `;
    }
    // 16. Carencia de Restricciones
    else if (text.includes("carencia") || text.includes("restricciones") || text.includes("género de vida")) {
        descEl.innerHTML = `
            <strong>Carencia de Restricciones:</strong><br>
            Cláusula del seguro de Vida que garantiza que la póliza estará exenta de limitaciones por causa de **residencia, ocupación, viajes o género de vida** una vez emitida.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 220">
                <rect width="400" height="220" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(60, 40)">
                    <rect width="80" height="80" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="2"/>
                    <text x="40" y="35" font-size="10" fill="#fff" text-anchor="middle">Residencia</text>
                    <text x="40" y="55" font-size="10" fill="#a7f3d0" text-anchor="middle" font-weight="bold">CUBIERTA</text>
                </g>
                <g transform="translate(160, 40)">
                    <rect width="80" height="80" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="2"/>
                    <text x="40" y="35" font-size="10" fill="#fff" text-anchor="middle">Ocupación</text>
                    <text x="40" y="55" font-size="10" fill="#a7f3d0" text-anchor="middle" font-weight="bold">CUBIERTA</text>
                </g>
                <g transform="translate(260, 40)">
                    <rect width="80" height="80" rx="4" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="2"/>
                    <text x="40" y="35" font-size="10" fill="#fff" text-anchor="middle">Viajes</text>
                    <text x="40" y="55" font-size="10" fill="#a7f3d0" text-anchor="middle" font-weight="bold">CUBIERTA</text>
                </g>
                <text x="200" y="165" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Sin Restricciones Posteriores</text>
            </svg>
        `;
    }
    // 17. Interés Asegurable
    else if (text.includes("interés asegurable") || text.includes("asegurable")) {
        descEl.innerHTML = `
            <strong>Interés Asegurable:</strong><br>
            Principio fundamental del seguro. Es la **relación económica o afectiva legítima** que el beneficiario tiene en la preservación del bien o de la vida del asegurado, evitando el azar o el fraude.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 220">
                <rect width="400" height="220" rx="10" fill="rgba(255,255,255,0.01)"/>
                <circle cx="200" cy="80" r="40" fill="rgba(20, 184, 166, 0.15)" stroke="#14b8a6" stroke-width="3"/>
                <path d="M190,85 C185,75 190,68 200,65 C210,68 215,75 210,85 L200,95 Z" fill="#fff" stroke="#14b8a6" stroke-width="1.5"/>
                <text x="200" y="150" font-size="14" fill="#fff" font-weight="800" text-anchor="middle">Relación Económica y Afectiva</text>
                <text x="200" y="175" font-size="11" fill="#9ca3af" text-anchor="middle">Evita la especulación del azar o juego</text>
            </svg>
        `;
    }
    // 18. Plazo de Pago de Siniestro (30 días)
    else if (text.includes("plazo para efectuar la indemnización") || text.includes("30 días") || text.includes("plazo máximo para efectuar")) {
        descEl.innerHTML = `
            <strong>Plazo Límite de Indemnización:</strong><br>
            Establecido por la Ley sobre el Contrato de Seguro. La aseguradora tiene un **plazo máximo de 30 días** naturales tras recibir la reclamación y documentos para efectuar el pago correspondiente.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 220">
                <rect width="400" height="220" rx="10" fill="rgba(255,255,255,0.01)"/>
                <rect x="150" y="30" width="100" height="100" rx="8" fill="rgba(20, 184, 166, 0.1)" stroke="#14b8a6" stroke-width="2"/>
                <line x1="150" y1="60" x2="250" y2="60" stroke="#14b8a6" stroke-width="2"/>
                <text x="200" y="52" font-size="11" fill="#9ca3af" font-weight="800" text-anchor="middle">LÍMITE</text>
                <text x="200" y="105" font-size="32" fill="#fff" font-weight="900" text-anchor="middle">30</text>
                <text x="200" y="120" font-size="10" fill="#2dd4bf" font-weight="700" text-anchor="middle">DÍAS LEY</text>
                <text x="200" y="165" font-size="13" fill="#fff" font-weight="700" text-anchor="middle">Pago Obligatorio de Siniestros</text>
            </svg>
        `;
    }
    // 19. Obligación de declarar los hechos
    else if (text.includes("obligado al solicitar") || text.includes("declarar por escrito") || text.includes("apreciación del riesgo")) {
        descEl.innerHTML = `
            <strong>Deber de Declaración Escrita:</strong><br>
            El prospecto tiene la obligación legal de **declarar por escrito y con veracidad** todos los hechos importantes para la apreciación del riesgo, permitiendo a la aseguradora tarifar adecuadamente.
        `;
        
        container.innerHTML = `
            <svg class="concept-svg" viewBox="0 0 400 220">
                <rect width="400" height="220" rx="10" fill="rgba(255,255,255,0.01)"/>
                <g transform="translate(160, 30)">
                    <rect width="80" height="90" rx="6" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="2"/>
                    <line x1="15" y1="30" x2="65" y2="30" stroke="#10b981" stroke-width="2"/>
                    <line x1="15" y1="50" x2="65" y2="50" stroke="#10b981" stroke-width="2"/>
                    <line x1="15" y1="70" x2="45" y2="70" stroke="#10b981" stroke-width="2"/>
                </g>
                <text x="200" y="150" font-size="14" fill="#fff" font-weight="800" text-anchor="middle">Declaración Escrita de Buena Fe</text>
                <text x="200" y="175" font-size="11" fill="#9ca3af" text-anchor="middle">Sin omisión de hechos importantes</text>
            </svg>
        `;
    }
    // 20. MODULE-SPECIFIC FALLBACKS
    else {
        if (studyModule === "Aspectos Generales") {
            descEl.innerHTML = `
                <strong>Fundamentos y Aspectos Generales:</strong><br>
                La Ley sobre el Contrato de Seguro regula los derechos y deberes mutuos (buena fe, interés asegurable, solicitudes).
            `;
            container.innerHTML = `
                <svg class="concept-svg" viewBox="0 0 400 200">
                    <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                    <g transform="translate(160, 20)">
                        <rect width="80" height="100" rx="6" fill="rgba(139, 92, 246, 0.15)" stroke="#8b5cf6" stroke-width="2"/>
                        <line x1="15" y1="30" x2="65" y2="30" stroke="#8b5cf6" stroke-width="2"/>
                        <line x1="15" y1="50" x2="65" y2="50" stroke="#8b5cf6" stroke-width="2"/>
                        <line x1="15" y1="70" x2="55" y2="70" stroke="#8b5cf6" stroke-width="2"/>
                    </g>
                    <text x="200" y="150" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Aspectos Generales y Contrato</text>
                    <text x="200" y="175" font-size="11" fill="#9ca3af" text-anchor="middle">Bases de la Ley sobre el Contrato de Seguro</text>
                </svg>
            `;
        }
        else if (studyModule === "Regulación CNSF") {
            descEl.innerHTML = `
                <strong>Regulación y Supervisión CNSF:</strong><br>
                La **CNSF** se encarga de supervisar que la operación de las instituciones de seguros y fianzas se apegue a la ley, protegiendo al usuario.
            `;
            container.innerHTML = `
                <svg class="concept-svg" viewBox="0 0 400 200">
                    <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                    <g class="pulse-shield" transform="translate(150, 15)">
                        <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="#14b8a6" stroke-width="2"/>
                        <path d="M25,30 L50,15 L75,30 V60 C75,75 50,85 50,85 C50,85 25,75 25,60 V30 Z" fill="rgba(20, 184, 166, 0.2)" stroke="#14b8a6" stroke-width="3"/>
                    </g>
                    <text x="200" y="145" font-size="15" fill="#fff" font-weight="700" text-anchor="middle">Regulación Oficial CNSF</text>
                    <text x="200" y="170" font-size="11" fill="#9ca3af" text-anchor="middle">Inspección de solvencia y sanas prácticas</text>
                </svg>
            `;
        }
        else if (studyModule === "Vida Individual") {
            descEl.innerHTML = `
                <strong>Seguro de Vida Individual:</strong><br>
                El ramo de **Vida** protege la estabilidad económica familiar ante el deceso, invalidez o supervivencia del asegurado.
            `;
            container.innerHTML = `
                <svg class="concept-svg" viewBox="0 0 400 200">
                    <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                    <line x1="50" y1="130" x2="350" y2="130" stroke="#6b7280" stroke-width="2" class="timeline-line"/>
                    <circle cx="60" cy="130" r="5" fill="#14b8a6"/>
                    <circle cx="300" cy="130" r="6" fill="#10b981"/>
                    <text x="200" y="90" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Protección y Ahorro en Vida</text>
                    <text x="200" y="165" font-size="11" fill="#9ca3af" text-anchor="middle">Ordinario de Vida • Temporales • Dotales</text>
                </svg>
            `;
        }
        else if (studyModule === "Accidentes y Enfermedades") {
            descEl.innerHTML = `
                <strong>Gastos Médicos y Accidentes:</strong><br>
                Las coberturas de **Gastos Médicos Mayores** e indemnizaciones por accidentes resarcen gastos hospitalarios ante imprevistos de salud.
            `;
            container.innerHTML = `
                <svg class="concept-svg" viewBox="0 0 400 200">
                    <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                    <circle cx="200" cy="70" r="30" fill="rgba(20, 184, 166, 0.15)" stroke="#14b8a6" stroke-width="2.5"/>
                    <path d="M190,70 h20 M200,60 v20" stroke="#14b8a6" stroke-width="3"/>
                    <text x="200" y="135" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Accidentes y Enfermedades</text>
                    <text x="200" y="160" font-size="11" fill="#9ca3af" text-anchor="middle">Deducibles, coaseguros y periodos de espera</text>
                </svg>
            `;
        }
        else if (studyModule === "Seguros de Daños") {
            descEl.innerHTML = `
                <strong>Riesgos Individuales de Daños:</strong><br>
                Los seguros de **Daños** (autos, incendio, embarcaciones) resarcen el valor real o reposición de bienes materiales tras un siniestro fortuito.
            `;
            container.innerHTML = `
                <svg class="concept-svg" viewBox="0 0 400 200">
                    <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                    <g transform="translate(160, 30)">
                        <path d="M12,15 L20,11 L28,15 V22 C28,26 20,29 20,29 C20,29 12,26 12,22 V15 Z" fill="rgba(139, 92, 246, 0.15)" stroke="#8b5cf6" stroke-width="2.5"/>
                    </g>
                    <text x="200" y="135" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Seguros de Daños</text>
                    <text x="200" y="160" font-size="11" fill="#9ca3af" text-anchor="middle">Principio indemnizatorio y valuación de bienes</text>
                </svg>
            `;
        }
        else if (studyModule === "Sistema y Mercados Financieros") {
            descEl.innerHTML = `
                <strong>Sistema y Mercados Financieros:</strong><br>
                Estructura regulatoria y entidades operativas (bancos, aseguradoras, afores) coordinadas bajo la SHCP, Banxico y comisiones.
            `;
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
                    <text x="300" y="129" font-size="9" fill="#fff" text-anchor="middle">CONDUSEF</text>
                    <text x="200" y="175" font-size="12" fill="#fff" font-weight="700" text-anchor="middle">Sistema Financiero Mexicano</text>
                </svg>
            `;
        }
        else {
            descEl.innerHTML = `
                <strong>Seguro de Cédula A - CNSF:</strong><br>
                El análisis del riesgo es la piedra angular del seguro. Esta sección abarca los fundamentos de la transferencia del riesgo, coaseguro y mutualidad.
            `;
            container.innerHTML = `
                <svg class="concept-svg" viewBox="0 0 400 200">
                    <rect width="400" height="200" rx="10" fill="rgba(255,255,255,0.01)"/>
                    <g class="pulse-shield" transform="translate(150, 20)">
                        <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="var(--accent-purple)" stroke-width="2"/>
                        <path d="M25,30 L50,15 L75,30 V60 C75,75 50,85 50,85 C50,85 25,75 25,60 V30 Z" fill="rgba(20, 184, 166, 0.2)" stroke="var(--accent-teal)" stroke-width="3"/>
                        <path d="M50,30 L53,40 L63,40 L55,46 L58,56 L50,50 L42,56 L45,46 L37,40 L47,40 Z" fill="#fff"/>
                    </g>
                    <text x="130" y="145" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Mutualidad</text>
                    <text x="270" y="145" font-size="14" fill="#fff" font-weight="700" text-anchor="middle">Previsión</text>
                    <text x="200" y="175" font-size="12" fill="var(--text-secondary)" text-anchor="middle">Evaluación del Riesgo e Intermediación Comercial</text>
                </svg>
            `;
        }
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

    const startConfirm = confirm("¿Deseas iniciar el simulador oficial? Tendrás 40 preguntas aleatorias de los 6 módulos y 2 horas límite.");
    if (!startConfirm) return;
    
    // Pick 40 random questions with balanced CNSF module sizes
    // 8 from Aspectos, 3 from Regulación, 7 from Vida, 6 from Accidentes, 8 from Daños, 8 from Finanzas
    const config = [
        { mod: "Aspectos Generales", count: 8 },
        { mod: "Regulación CNSF", count: 3 },
        { mod: "Vida Individual", count: 7 },
        { mod: "Accidentes y Enfermedades", count: 6 },
        { mod: "Seguros de Daños", count: 8 },
        { mod: "Sistema y Mercados Financieros", count: 8 }
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
    if (simQuestions.length < 40) {
        let pool = questionsDb.concat(fallbackQuestions);
        const shuffled = pool.sort(() => 0.5 - Math.random());
        simQuestions = shuffled.slice(0, 40);
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
