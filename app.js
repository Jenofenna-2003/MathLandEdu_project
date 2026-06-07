/* ==========================================
   MATHLAND GAME LOGIC & STATE ENGINE
   ========================================== */

// --- INITIAL STATE DATA ---
const DEFAULT_GAME_STATE = {
    name: "MathExplorer",
    characterClass: "knight",
    outfitColor: "crimson",
    coins: 0,
    stars: 0,
    level: 1,
    unlockedWorlds: [1], // 1: Forest, 2: Mountains, 3: Fractions, 4: Castle
    completedLevels: {}, // Format: {"1-1": true}
    badges: [],
    streak: 0,
    learningLogs: [
        { timestamp: Date.now() - 4 * 86400000, topic: "addition", answeredCorrectly: true, attempts: 1 },
        { timestamp: Date.now() - 3 * 86400000, topic: "addition", answeredCorrectly: false, attempts: 2 },
        { timestamp: Date.now() - 2 * 86400000, topic: "addition", answeredCorrectly: true, attempts: 1 },
        { timestamp: Date.now() - 1 * 86400000, topic: "multiplication", answeredCorrectly: false, attempts: 3 },
    ],
    weeklyActivity: [1, 2, 0, 3, 1, 2, 0], // Monday to Sunday counts
    skillsScores: {
        addition: 85,
        multiplication: 40,
        fractions: 25,
        geometry: 0
    }
};

let gameState = JSON.parse(JSON.stringify(DEFAULT_GAME_STATE));
let activeScreenId = "screen-home";
let currentWorldId = null;
let currentLevelId = null;
let selectedAnswer = null;
let soundEnabled = true;
let audioCtx = null;

// --- INITIAL TEACHER ROSTER ---
const DEFAULT_TEACHER_STUDENTS = [
    { id: 1, name: "Tom", age: 8, level: 3, coins: 140, stars: 15, addition: "100%", multiplication: "40%", fractions: "0%", geometry: "0%" },
    { id: 2, name: "Lily", age: 9, level: 5, coins: 280, stars: 32, addition: "100%", multiplication: "90%", fractions: "25%", geometry: "0%" },
    { id: 3, name: "Mark", age: 7, level: 2, coins: 80, stars: 8, addition: "75%", multiplication: "0%", fractions: "0%", geometry: "0%" },
    { id: 4, name: "Sarah", age: 10, level: 8, coins: 450, stars: 54, addition: "100%", multiplication: "100%", fractions: "95%", geometry: "80%" }
];
let teacherStudents = [...DEFAULT_TEACHER_STUDENTS];

// --- QUESTS DATASET ---
const QUESTS = {
    // WORLD 1: ADDITION FOREST (Target Age: 6-8)
    1: {
        title: "Addition Forest 🌳",
        avatar: "🌳",
        levels: [
            {
                id: "1-1",
                title: "The Rope Bridge Troll",
                story: "You walk down the mossy path, but a friendly green Troll blocks the old rope bridge. 'Halt explorer!' he grunts, 'Solve this riddle on my stone tablet to cross!'",
                npc: "👹",
                question: "5 + 7 = ?",
                options: ["10", "11", "12", "13"],
                answer: "12",
                hint: "Try counting up! Start at 7, and count forward 5 times: 8, 9, 10, 11, 12.",
                visualType: "addition",
                visualData: { term1: 5, term2: 7 }
            },
            {
                id: "1-2",
                title: "The Giant Owl's Branch",
                story: "High in the trees, a sleepy Giant Owl blocks the path. 'Whooo goes there? Solve my double digits addition, or I will stay asleep right here!'",
                npc: "🦉",
                question: "15 + 12 = ?",
                options: ["25", "27", "28", "30"],
                answer: "27",
                hint: "Split them! Add the ones first: 5 + 2 = 7. Then add the tens: 10 + 10 = 20. Put them together: 20 + 7 = 27.",
                visualType: "addition",
                visualData: { term1: 15, term2: 12 }
            },
            {
                id: "1-3",
                title: "The Whispering Tree",
                story: "A magical glowing tree glows in the dark woods. It whispers: 'To unlock my healing nectar, add 20 to 34. What number do you get?'",
                npc: "🌲",
                question: "34 + 20 = ?",
                options: ["50", "52", "54", "56"],
                answer: "54",
                hint: "Adding 20 is just adding 2 to the tens place of 34. The ones place stays 4!",
                visualType: "addition",
                visualData: { term1: 34, term2: 20 }
            },
            {
                id: "1-4",
                title: "The Pixie Cave",
                story: "Small pixies float around a hidden cavern. 'A boulder is blocking our sparkly crystal mine!' they squeak. 'Carry the addition sum to shatter it!'",
                npc: "🧚",
                question: "28 + 14 = ?",
                options: ["38", "40", "42", "44"],
                answer: "42",
                hint: "First, add the ones: 8 + 4 = 12. Write down 2, carry over 1. Then add the tens: 2 + 1 + (carried 1) = 4. The answer is 42!",
                visualType: "addition",
                visualData: { term1: 28, term2: 14 }
            }
        ]
    },
    // WORLD 2: MULTIPLICATION MOUNTAINS (Target Age: 8-10)
    2: {
        title: "Multiplication Mountains ⛰️",
        avatar: "⛰️",
        levels: [
            {
                id: "2-1",
                title: "The Mountain Goat's Toll",
                story: "A fluffy mountain goat steps in front of the steep trail. 'To climb the high peaks, you must pass my multiplication gate!'",
                npc: "🐐",
                question: "3 × 4 = ?",
                options: ["7", "10", "12", "16"],
                answer: "12",
                hint: "Multiplication is repeating addition! 3 groups of 4: 4 + 4 + 4 = 12.",
                visualType: "multiplication",
                visualData: { rows: 3, cols: 4 }
            },
            {
                id: "2-2",
                title: "The Squirrel Merchant",
                story: "A busy squirrel is packing bags of golden acorns. 'I need to pack 5 bags, and each bag must have exactly 3 acorns. How many acorns do I need in total?'",
                npc: "🐿️",
                question: "5 × 3 = ?",
                options: ["8", "12", "15", "18"],
                answer: "15",
                hint: "Acorns grouped up! Add 3 five times: 3 + 3 + 3 + 3 + 3 = 15.",
                visualType: "multiplication",
                visualData: { rows: 5, cols: 3 }
            },
            {
                id: "2-3",
                title: "The Stone Golem",
                story: "A giant stone golem rises from the gravel. 'None shall pass the mountain bridge unless they answer this. 6 times 5!'",
                npc: "🗿",
                question: "6 × 5 = ?",
                options: ["25", "30", "35", "40"],
                answer: "30",
                hint: "Count by 5s six times: 5, 10, 15, 20, 25, 30!",
                visualType: "multiplication",
                visualData: { rows: 6, cols: 5 }
            },
            {
                id: "2-4",
                title: "The Yeti's Ice Cavern",
                story: "A big blue Yeti stands inside the icy cave. 'Brrr! To light my campfire, solve this large math stone: 12 multiplied by 4!'",
                npc: "👣",
                question: "12 × 4 = ?",
                options: ["44", "46", "48", "50"],
                answer: "48",
                hint: "Break it down! 10 × 4 = 40, and 2 × 4 = 8. Add them: 40 + 8 = 48.",
                visualType: "multiplication",
                visualData: { rows: 4, cols: 12 }
            }
        ]
    },
    // WORLD 3: FRACTION KINGDOM (Target Age: 9-11)
    3: {
        title: "Fraction Kingdom 🍕",
        avatar: "🍕",
        levels: [
            {
                id: "3-1",
                title: "The Royal Bakery",
                story: "The Royal Baker is preparing a fresh tart. 'I cut it into 8 equal slices,' he says. 'If we eat exactly half (1/2) of the tart, how many slices do we eat?'",
                npc: "👨‍🍳",
                question: "1/2 of 8 slices = ?",
                options: ["2", "4", "6", "8"],
                answer: "4",
                hint: "Half means splitting the 8 slices into 2 equal piles. How many are in 1 pile?",
                visualType: "fraction",
                visualData: { numerator: 1, denominator: 2, totalItems: 8 }
            },
            {
                id: "3-2",
                title: "The Pizza Pixie",
                story: "A pixie points at a colorful visual chart. 'Look at this pizza pie! It is split into 4 parts, and 3 parts are shaded gold. What fraction is shaded?'",
                npc: "🧚‍♀️",
                question: "Shaded fraction of 4 parts?",
                options: ["1/4", "1/2", "3/4", "4/3"],
                answer: "3/4",
                hint: "Fractions write shaded parts on top, and total parts on the bottom. Shaded = 3, Total = 4.",
                visualType: "fraction-pizza",
                visualData: { numerator: 3, denominator: 4 }
            },
            {
                id: "3-3",
                title: "The Frozen Castle Gate",
                story: "A magical door is locked with ice. The runes say: 'Which fraction of the spell energy is larger: 1/2 or 1/4? Tap the correct choice.'",
                npc: "🚪",
                question: "Which is LARGER: 1/2 or 1/4?",
                options: ["1/2", "1/4", "They are equal", "None"],
                answer: "1/2",
                hint: "Think of a pizza! If you share a pizza between 2 people (1/2), you get a bigger slice than if you share it between 4 people (1/4)!",
                visualType: "fraction-compare",
                visualData: { fraction1: "1/2", fraction2: "1/4" }
            },
            {
                id: "3-4",
                title: "The Cauldron Recipe",
                story: "An old wizard is brewing a potion. 'Add 1/5 bottle of blue syrup, and then 2/5 bottle of purple syrup. What fraction of the bottle is filled?'",
                npc: "🧙",
                question: "1/5 + 2/5 = ?",
                options: ["3/10", "3/5", "2/5", "2/25"],
                answer: "3/5",
                hint: "When denominators (bottom numbers) are the same, just add the top numbers: 1 + 2 = 3. Keep the bottom number 5!",
                visualType: "fraction-addition",
                visualData: { num1: 1, num2: 2, den: 5 }
            }
        ]
    },
    // WORLD 4: GEOMETRY CASTLE (Target Age: 10-12)
    4: {
        title: "Geometry Castle 🏰",
        avatar: "🏰",
        levels: [
            {
                id: "4-1",
                title: "The Shield Guardian",
                story: "A heavy steel armor guard stands at the drawbridge. 'To cross, you must identify this shape carved on my shield! How many sides does a Pentagon have?'",
                npc: "💂",
                question: "Sides in a Pentagon?",
                options: ["4", "5", "6", "8"],
                answer: "5",
                hint: "Penta means 5! Think of a house shape; it has 5 sides (3 for walls/floor, 2 for roof).",
                visualType: "shape",
                visualData: { sides: 5, name: "Pentagon" }
            },
            {
                id: "4-2",
                title: "The Garden Perimeter",
                story: "A royal gardener needs to build a wooden fence around a square garden. 'Each side of this square garden is 5 meters. What is the total perimeter around the garden?'",
                npc: "🧑‍🌾",
                question: "Perimeter of square (side 5m)?",
                options: ["10m", "15m", "20m", "25m"],
                answer: "20m",
                hint: "Perimeter is the distance all the way around! A square has 4 equal sides. So add 5 four times: 5 + 5 + 5 + 5 = 20.",
                visualType: "shape-perimeter",
                visualData: { type: "square", side: 5 }
            },
            {
                id: "4-3",
                title: "The Royal Carpet",
                story: "The Princess is weaving a rectangular carpet. 'The length of this carpet is 6 meters, and the width is 4 meters. What is the total area of the floor it covers?'",
                npc: "👸",
                question: "Area of rectangle (6m × 4m)?",
                options: ["10 sq m", "20 sq m", "24 sq m", "28 sq m"],
                answer: "24 sq m",
                hint: "Area is the space inside! For a rectangle, multiply the Length by the Width: 6 × 4 = 24.",
                visualType: "shape-area",
                visualData: { type: "rectangle", length: 6, width: 4 }
            },
            {
                id: "4-4",
                title: "The Dragon King Challenge",
                story: "You enter the gold chamber. The mighty Dragon King roars: 'So you want my crown? Solve this final master geometry scroll! What is the area of a triangle with a base of 8 meters and height of 5 meters?'",
                npc: "🐲",
                question: "Area of triangle (Base 8m, Height 5m)?",
                options: ["13 sq m", "20 sq m", "40 sq m", "45 sq m"],
                answer: "20 sq m",
                hint: "Area of a triangle is: 1/2 × Base × Height. Multiply base times height (8 × 5 = 40), then cut it in half!",
                visualType: "shape-triangle",
                visualData: { base: 8, height: 5 }
            }
        ]
    }
};

// --- BADGES LIST ---
const BADGES = [
    { id: "addition-master", name: "Addition Master 🌳", desc: "Unlock by completing all Addition Forest levels.", icon: "🌳", color: "#8a3ffc" },
    { id: "multiplication-hero", name: "Multiplication Hero ⛰️", desc: "Unlock by completing all Multiplication levels.", icon: "⛰️", color: "#00f0ff" },
    { id: "fraction-king", name: "Fraction King 🍕", desc: "Unlock by completing all Fraction Kingdom levels.", icon: "🍕", color: "#39d353" },
    { id: "geometry-master", name: "Geometry Master 🏰", desc: "Unlock by completing all Geometry Castle levels.", icon: "🏰", color: "#ff9100" },
    { id: "math-conqueror", name: "Math Conqueror 👑", desc: "Unlock by defeating the Dragon King!", icon: "👑", color: "#ffd700" }
];

// --- CHARACTER CLASS AVATAR MAPS ---
const CLASS_AVATARS = {
    knight: { base: "🧑‍🛡️", head: "🪖", hand: "⚔️", effect: "🛡️" },
    wizard: { base: "🧙‍♂️", head: "🧙", hand: "🪄", effect: "✨" },
    princess: { base: "👸", head: "👑", hand: "💐", effect: "💖" },
    explorer: { base: "🧑‍🚀", head: "🤠", hand: "🧭", effect: "🔎" }
};

const COLOR_MAP = {
    crimson: "#ff3366",
    royal: "#3366ff",
    emerald: "#33cc66",
    amber: "#ffcc00",
    shadow: "#9933ff"
};

// --- SOUND SYNTHESIS ENGINE (Web Audio API) ---
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSynthSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    // Resume context if suspended (browser security block)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
        // Short tick
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    }
    else if (type === 'correct') {
        // Chiptune ascending arpeggio
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6

        osc.start(now);
        osc.stop(now + 0.35);
    }
    else if (type === 'wrong') {
        // Buzz descending sound
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
    }
    else if (type === 'levelup') {
        // Victory fanfare
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);

        osc.type = 'square';
        osc2.type = 'triangle';

        gain.gain.setValueAtTime(0.1, now);
        gain2.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        // Play chord C4-E4-G4 then C5-E5-G5
        osc.frequency.setValueAtTime(261.63, now); // C4
        osc2.frequency.setValueAtTime(329.63, now); // E4

        osc.frequency.setValueAtTime(523.25, now + 0.25); // C5
        osc2.frequency.setValueAtTime(659.25, now + 0.25); // E5

        osc.frequency.setValueAtTime(1046.50, now + 0.5); // C6
        osc2.frequency.setValueAtTime(1318.51, now + 0.5); // E6

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.8);
        osc2.stop(now + 0.8);
    }
}

// --- STATE MANAGEMENT AND SYNC ---
function loadGameState() {
    const saved = localStorage.getItem("mathland_gamestate");
    if (saved) {
        try {
            gameState = JSON.parse(saved);
            // Backfill missing properties if schemas evolved
            for (let key in DEFAULT_GAME_STATE) {
                if (gameState[key] === undefined) {
                    gameState[key] = JSON.parse(JSON.stringify(DEFAULT_GAME_STATE[key]));
                }
            }
        } catch (e) {
            gameState = JSON.parse(JSON.stringify(DEFAULT_GAME_STATE));
        }
    } else {
        gameState = JSON.parse(JSON.stringify(DEFAULT_GAME_STATE));
    }
    updateHeaderStats();
}

function saveGameState() {
    localStorage.setItem("mathland_gamestate", JSON.stringify(gameState));
    updateHeaderStats();
}

function resetAllData() {
    if (confirm("Are you sure you want to delete your progress and start over? This cannot be undone!")) {
        gameState = JSON.parse(JSON.stringify(DEFAULT_GAME_STATE));
        saveGameState();
        teacherStudents = [...DEFAULT_TEACHER_STUDENTS];
        renderParentDashboard();
        renderTeacherDashboard();
        renderWorldMap();
        navigateToScreen("screen-home");
        playSynthSound("wrong");
    }
}

function updateHeaderStats() {
    document.getElementById("user-coins").textContent = gameState.coins;
    document.getElementById("user-stars").textContent = gameState.stars;
    document.getElementById("user-level-badge").textContent = `Lvl ${gameState.level}`;

    // Render mini avatar in header
    const avatarMini = document.getElementById("user-avatar-mini");
    const avatarData = CLASS_AVATARS[gameState.characterClass] || CLASS_AVATARS.knight;
    avatarMini.textContent = avatarData.base;
    avatarMini.style.backgroundColor = COLOR_MAP[gameState.outfitColor] || "#ff3366";
}

// --- ROUTING ENGINE ---
function navigateToScreen(screenId) {
    playSynthSound("click");

    // Hide all screens
    document.querySelectorAll(".game-screen").forEach(screen => {
        screen.classList.remove("active-screen");
    });

    // Show target screen
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add("active-screen");
        activeScreenId = screenId;
    }

    // Update navigation buttons active state
    document.querySelectorAll(".nav-btn").forEach(btn => {
        if (btn.getAttribute("data-target") === screenId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Call screen-specific drawers
    if (screenId === "screen-map") {
        renderWorldMap();
    } else if (screenId === "screen-parent") {
        renderParentDashboard();
    } else if (screenId === "screen-teacher") {
        renderTeacherDashboard();
    }
}

// --- CHARACTER CUSTOMIZER PAGE CONTROLLER ---
function setupCharacterCustomizer() {
    const nameInput = document.getElementById("hero-name-input");
    nameInput.value = gameState.name;

    // Setup Class options
    const classCards = document.querySelectorAll(".class-card-option");
    classCards.forEach(card => {
        // Mark active
        if (card.getAttribute("data-class") === gameState.characterClass) {
            card.classList.add("active");
        } else {
            card.classList.remove("active");
        }

        card.addEventListener("click", () => {
            classCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            gameState.characterClass = card.getAttribute("data-class");
            updateCharacterPreview();
            playSynthSound("click");
        });
    });

    // Setup Color options
    const colorDots = document.querySelectorAll(".color-dot");
    colorDots.forEach(dot => {
        if (dot.getAttribute("data-color") === gameState.outfitColor) {
            dot.classList.add("active");
        } else {
            dot.classList.remove("active");
        }

        dot.addEventListener("click", () => {
            colorDots.forEach(d => d.classList.remove("active"));
            dot.classList.add("active");
            gameState.outfitColor = dot.getAttribute("data-color");
            updateCharacterPreview();
            playSynthSound("click");
        });
    });

    updateCharacterPreview();

    // Save Character
    document.getElementById("btn-save-hero").addEventListener("click", () => {
        const enteredName = nameInput.value.trim();
        if (enteredName) {
            gameState.name = enteredName;
        }
        saveGameState();
        navigateToScreen("screen-map");
    });
}

function updateCharacterPreview() {
    const avatarBase = document.getElementById("avatar-preview-base");
    const avatarHead = document.getElementById("avatar-preview-head");
    const avatarHand = document.getElementById("avatar-preview-hand");
    const avatarEffect = document.getElementById("avatar-preview-effect");
    const previewBox = document.querySelector(".avatar-preview-box");

    const avatarData = CLASS_AVATARS[gameState.characterClass] || CLASS_AVATARS.knight;
    avatarBase.textContent = avatarData.base;
    avatarHead.textContent = avatarData.head;
    avatarHand.textContent = avatarData.hand;
    avatarEffect.textContent = avatarData.effect;

    const hexColor = COLOR_MAP[gameState.outfitColor] || "#ff3366";
    previewBox.style.background = `radial-gradient(circle, ${hexColor}33 0%, rgba(12, 10, 36, 0.4) 100%)`;
    previewBox.style.borderColor = hexColor;
}

// --- WORLD MAP CONTROLLER ---
function renderWorldMap() {
    // Update node unlocks and percentages
    const worlds = [1, 2, 3, 4];

    // Rules for unlocks based on player level
    // Forest: Always unlocked
    // Mountains: Level >= 2
    // Fractions: Level >= 4
    // Castle: Level >= 6
    if (gameState.level >= 2 && !gameState.unlockedWorlds.includes(2)) gameState.unlockedWorlds.push(2);
    if (gameState.level >= 4 && !gameState.unlockedWorlds.includes(3)) gameState.unlockedWorlds.push(3);
    if (gameState.level >= 6 && !gameState.unlockedWorlds.includes(4)) gameState.unlockedWorlds.push(4);

    worlds.forEach(wId => {
        const isUnlocked = gameState.unlockedWorlds.includes(wId);
        const node = document.querySelector(`.world-node[data-world="${wId}"]`);

        if (node) {
            const progressBar = node.querySelector(".progress-bar-fill");
            const progressText = node.querySelector(".node-progress-text");
            const lockIndicator = node.querySelector(".lock-indicator");

            // Calculate progress
            const totalLevels = QUESTS[wId].levels.length;
            let completedCount = 0;
            QUESTS[wId].levels.forEach(lvl => {
                if (gameState.completedLevels[lvl.id]) completedCount++;
            });

            const percent = totalLevels > 0 ? (completedCount / totalLevels) * 100 : 0;

            if (isUnlocked) {
                node.classList.remove("locked-node");
                node.classList.add("active-node");
                if (lockIndicator) lockIndicator.remove();
                if (progressBar) progressBar.style.width = `${percent}%`;
                if (progressText) progressText.textContent = `${completedCount} / ${totalLevels} Cleared`;
            } else {
                node.classList.add("locked-node");
                node.classList.remove("active-node");
                // Ensure lock indicator is present
                if (!lockIndicator) {
                    const wrapper = node.querySelector(".node-icon-wrapper");
                    const lock = document.createElement("span");
                    lock.className = "lock-indicator";
                    lock.textContent = "🔒";
                    wrapper.appendChild(lock);
                }
                if (progressBar) progressBar.style.width = "0%";
                if (progressText) {
                    const reqLevel = wId === 2 ? 2 : wId === 3 ? 4 : 6;
                    progressText.textContent = `Requires Lvl ${reqLevel}`;
                }
            }
        }
    });

    // Re-draw map connecting SVG path lines
    drawConnectingMapPaths();
}

function drawConnectingMapPaths() {
    const svg = document.querySelector(".map-path-svg");
    const path = document.getElementById("map-path");
    if (!svg || !path) return;

    const nodes = ["node-forest", "node-mountains", "node-fractions", "node-castle"];
    let pathD = "";

    nodes.forEach((nId, idx) => {
        const el = document.getElementById(nId);
        if (el) {
            // Find coordinates of centers
            const x = el.offsetLeft + el.offsetWidth / 2;
            const y = el.offsetTop + 45; // Height of node-icon-wrapper is 90px, center is 45px

            if (idx === 0) {
                pathD += `M ${x} ${y}`;
            } else {
                // Curve to the next point
                const prevEl = document.getElementById(nodes[idx - 1]);
                const prevX = prevEl.offsetLeft + prevEl.offsetWidth / 2;
                const prevY = prevEl.offsetTop + 45;
                const cpX1 = prevX + (x - prevX) / 2;
                const cpY1 = prevY;
                const cpX2 = prevX + (x - prevX) / 2;
                const cpY2 = y;
                pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
            }
        }
    });

    path.setAttribute("d", pathD);
}

// Drawer Overlay logic
function openLevelsDrawer(worldId) {
    currentWorldId = parseInt(worldId);
    const worldData = QUESTS[currentWorldId];
    if (!worldData) return;

    document.getElementById("drawer-world-title").textContent = worldData.title;
    const listContainer = document.getElementById("drawer-levels-list");
    listContainer.innerHTML = "";

    // Render levels
    worldData.levels.forEach((lvl, index) => {
        const isCompleted = gameState.completedLevels[lvl.id] === true;
        const isLocked = index > 0 && !gameState.completedLevels[worldData.levels[index - 1].id];

        const item = document.createElement("div");
        item.className = `level-item ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;

        // Status Icon
        let statusIcon = "⬜";
        if (isCompleted) statusIcon = "⭐";
        else if (isLocked) statusIcon = "🔒";
        else statusIcon = "⚔️";

        item.innerHTML = `
      <div class="level-status-circle">${statusIcon}</div>
      <div class="level-details">
        <h4>Quest ${index + 1}: ${lvl.title}</h4>
        <p>${isLocked ? 'Solve previous level to unlock!' : 'Click to start quest!'}</p>
      </div>
    `;

        if (!isLocked) {
            item.addEventListener("click", () => {
                document.getElementById("levels-drawer-overlay").classList.remove("open");
                startQuest(currentWorldId, lvl.id);
            });
        }

        listContainer.appendChild(item);
    });

    document.getElementById("levels-drawer-overlay").classList.add("open");
    playSynthSound("click");
}

// --- QUEST ENGINE CONTROLLER ---
let currentLevel = null;
let currentAttempts = 0;

function startQuest(worldId, levelId) {
    currentWorldId = worldId;
    currentLevelId = levelId;
    currentAttempts = 0;
    selectedAnswer = null;

    const worldData = QUESTS[worldId];
    currentLevel = worldData.levels.find(l => l.id === levelId);

    if (!currentLevel) return;

    // Update layout tags
    document.getElementById("quest-world-tag").textContent = worldData.title;
    document.getElementById("quest-npc-sprite").textContent = currentLevel.npc;
    document.getElementById("quest-level-title").textContent = currentLevel.title;
    document.getElementById("quest-story-text").textContent = currentLevel.story;
    document.getElementById("quest-question-text").textContent = currentLevel.question;

    // Set NPC greeting bubble
    document.getElementById("quest-dialog-bubble").textContent = `"${currentLevel.story.substring(currentLevel.story.indexOf('\'') + 1, currentLevel.story.lastIndexOf('\'')) || 'Halt hero!'}"`;

    // Hide any old feedback alerts
    const alertBox = document.getElementById("quest-feedback-alert");
    alertBox.className = "alert-box";
    alertBox.textContent = "";

    // Disable submit answer button initially
    document.getElementById("btn-submit-answer").disabled = true;

    // Populate answer choices
    const optionsGrid = document.getElementById("puzzle-options-container");
    optionsGrid.innerHTML = "";

    currentLevel.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
            document.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedAnswer = opt;
            document.getElementById("btn-submit-answer").disabled = false;
            playSynthSound("click");
        });
        optionsGrid.appendChild(btn);
    });

    navigateToScreen("screen-quest");

    // Auto narration read story aloud
    narrateText(`${currentLevel.title}. ${currentLevel.story}`);
}

function handleAnswerCheck() {
    if (!selectedAnswer || !currentLevel) return;

    currentAttempts++;
    const isCorrect = selectedAnswer === currentLevel.answer;
    const alertBox = document.getElementById("quest-feedback-alert");

    if (isCorrect) {
        playSynthSound("correct");

        // Add coins and stars
        const coinReward = currentAttempts === 1 ? 50 : 25;
        const starReward = 5;
        gameState.coins += coinReward;
        gameState.stars += starReward;

        // Increment solve streak
        gameState.streak++;
        document.getElementById("streak-count").textContent = gameState.streak;

        // Check level up (every 100 coins yields a player level up)
        const oldLevel = gameState.level;
        gameState.level = Math.floor(gameState.coins / 100) + 1;
        const didLevelUp = gameState.level > oldLevel;

        // Save level status
        gameState.completedLevels[currentLevel.id] = true;

        // Update skills scores
        let topicKey = getTopicKeyByWorldId(currentWorldId);
        let currentScore = gameState.skillsScores[topicKey] || 0;
        // Calculate new rolling average score for this skill topic
        const newScore = Math.min(100, Math.round(currentScore + (100 / currentAttempts - currentScore) * 0.3));
        gameState.skillsScores[topicKey] = newScore;

        // Add activity log
        gameState.learningLogs.push({
            timestamp: Date.now(),
            topic: topicKey,
            answeredCorrectly: true,
            attempts: currentAttempts
        });

        // Update weekly activity bar
        const dayOfWeek = (new Date()).getDay(); // 0 is Sunday, 1 is Monday...
        const mapDayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Map Sunday to 6, Mon to 0
        gameState.weeklyActivity[mapDayIdx]++;

        saveGameState();

        alertBox.className = "alert-box alert-success show-alert";
        alertBox.innerHTML = `🌟 **CORRECT!** You earned 🪙 ${coinReward} and ⭐ ${starReward}! ${didLevelUp ? '🛡️ **LEVEL UP!** You are now Level ' + gameState.level + '!' : ''}`;

        // NPC Dialog Bubble changes
        document.getElementById("quest-dialog-bubble").textContent = `"Incredible work, hero! You may cross the bridge now!"`;

        // Audio level up fanfare
        if (didLevelUp) {
            setTimeout(() => playSynthSound("levelup"), 400);
        }

        // Check badges
        checkAndAwardBadges();

        // Disable choices and double check
        document.querySelectorAll(".option-btn").forEach(btn => btn.disabled = true);
        document.getElementById("btn-submit-answer").disabled = true;

        // Change check button to Next Quest
        const submitBtn = document.getElementById("btn-submit-answer");
        submitBtn.textContent = "Continue to Map 🗺️";
        submitBtn.disabled = false;

        // Temporarily rewrite behavior of Submit button to navigate back
        const nextStep = () => {
            navigateToScreen("screen-map");
            submitBtn.textContent = "Check Answer ✔️";
            submitBtn.removeEventListener("click", nextStep);
            document.getElementById("btn-submit-answer").addEventListener("click", handleAnswerCheck);
        };
        submitBtn.removeEventListener("click", handleAnswerCheck);
        submitBtn.addEventListener("click", nextStep);
    }
    else {
        playSynthSound("wrong");
        gameState.streak = 0;
        document.getElementById("streak-count").textContent = 0;

        // Register log
        gameState.learningLogs.push({
            timestamp: Date.now(),
            topic: getTopicKeyByWorldId(currentWorldId),
            answeredCorrectly: false,
            attempts: currentAttempts
        });

        // Depreciate skills score slightly on failure
        let topicKey = getTopicKeyByWorldId(currentWorldId);
        gameState.skillsScores[topicKey] = Math.max(0, (gameState.skillsScores[topicKey] || 0) - 5);
        saveGameState();

        alertBox.className = "alert-box alert-danger show-alert";
        alertBox.innerHTML = `❌ **TRY AGAIN!** That isn't quite right. Need a hint? Click **🤖 Help Me** for assistance!`;

        // NPC Dialogue changes
        document.getElementById("quest-dialog-bubble").textContent = `"Hehe! That answer is wrong! Try again, traveler!"`;
    }
}

function getTopicKeyByWorldId(wId) {
    if (wId === 1) return "addition";
    if (wId === 2) return "multiplication";
    if (wId === 3) return "fractions";
    return "geometry";
}

// --- VOICE NARRATION (Web Speech API) ---
function narrateText(text) {
    if ('speechSynthesis' in window) {
        // Stop ongoing speeches
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for kids
        utterance.pitch = 1.1; // Friendly higher pitch
        window.speechSynthesis.speak(utterance);
    }
}

// --- BADGE REWARDS CHECKER ---
function checkAndAwardBadges() {
    BADGES.forEach(badge => {
        // Check if player already has this badge
        if (gameState.badges.includes(badge.id)) return;

        let qualifies = false;

        if (badge.id === "addition-master") {
            // Complete World 1 levels
            qualifies = QUESTS[1].levels.every(l => gameState.completedLevels[l.id]);
        }
        else if (badge.id === "multiplication-hero") {
            qualifies = QUESTS[2].levels.every(l => gameState.completedLevels[l.id]);
        }
        else if (badge.id === "fraction-king") {
            qualifies = QUESTS[3].levels.every(l => gameState.completedLevels[l.id]);
        }
        else if (badge.id === "geometry-master") {
            qualifies = QUESTS[4].levels.every(l => gameState.completedLevels[l.id]);
        }
        else if (badge.id === "math-conqueror") {
            // Completed level 4-4
            qualifies = gameState.completedLevels["4-4"] === true;
        }

        if (qualifies) {
            gameState.badges.push(badge.id);
            gameState.coins += 100; // Gift bonus coins
            saveGameState();

            // Trigger Badge Modal
            showBadgeCelebrationModal(badge);
        }
    });
}

function showBadgeCelebrationModal(badge) {
    document.getElementById("badge-unlocked-icon").textContent = badge.icon;
    document.getElementById("badge-unlocked-name").textContent = badge.name;
    document.getElementById("badge-unlocked-desc").textContent = `${badge.desc} You received a bonus of 🪙 100 coins!`;

    const modal = document.getElementById("badge-modal");
    modal.classList.add("open");
    playSynthSound("levelup");
}

// --- AI HELPER DYNAMIC VISUALS GENERATOR ---
function triggerAiHelper() {
    if (!currentLevel) return;

    const explanationBox = document.getElementById("ai-helper-explanation-text");
    const guidelinesBox = document.getElementById("ai-helper-guidelines");
    const canvas = document.getElementById("ai-visual-canvas");

    explanationBox.textContent = `Hello, ${gameState.name}! I am your AI Helper. Let's look at ${currentLevel.question} using a fun picture:`;
    guidelinesBox.innerHTML = `<strong>Rule-based Hint:</strong><br>${currentLevel.hint}`;

    // Clear visual board
    canvas.innerHTML = "";

    const visType = currentLevel.visualType;
    const visData = currentLevel.visualData;

    if (visType === "addition") {
        // Render equations visually (e.g. 5 apples + 7 apples)
        const t1 = visData.term1;
        const t2 = visData.term2;

        let html = `<div style="display:flex; flex-direction:column; align-items:center; gap:1rem;">
      <div style="display:flex; align-items:center; gap:0.8rem; font-size:1.5rem; flex-wrap:wrap; justify-content:center;">`;

        // Add t1 apples
        html += `<div style="display:flex; border: 1px dashed rgba(255,255,255,0.2); padding:0.4rem; border-radius:8px;">`;
        for (let i = 0; i < t1; i++) {
            html += `<span class="ai-visual-apple" style="animation-delay: ${i * 0.05}s">🍎</span>`;
        }
        html += `</div>`;

        // Add Plus
        html += `<span style="font-size: 2rem; font-weight: 700; color:var(--color-accent);">+</span>`;

        // Add t2 apples
        html += `<div style="display:flex; border: 1px dashed rgba(255,255,255,0.2); padding:0.4rem; border-radius:8px;">`;
        for (let i = 0; i < t2; i++) {
            html += `<span class="ai-visual-apple" style="animation-delay: ${(t1 + i) * 0.05}s">🍎</span>`;
        }
        html += `</div>`;

        html += `</div>
      <div style="font-size:1.1rem; color:var(--color-text-muted);">
        Count all the apples together: <strong>${t1}</strong> apples on the left plus <strong>${t2}</strong> apples on the right equals <strong>${t1 + t2}</strong> total!
      </div>
    </div>`;

        canvas.innerHTML = html;
    }
    else if (visType === "multiplication") {
        // Render repeated additions / grids of apples
        const rows = visData.rows;
        const cols = visData.cols;

        let html = `<div style="display:flex; flex-direction:column; align-items:center; gap:1rem; width:100%;">`;

        // Grid representation
        html += `<div style="display:grid; grid-template-columns: repeat(${cols}, auto); gap: 0.5rem; margin-bottom:0.5rem; justify-content:center;">`;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                html += `<span class="ai-visual-apple" style="animation-delay: ${(r * cols + c) * 0.03}s">🍓</span>`;
            }
        }
        html += `</div>`;

        html += `<div style="text-align:center; font-size:1.05rem; color:var(--color-text-muted); line-height:1.4;">
      This is a grid of <strong>${rows} groups</strong> of <strong>${cols} strawberries</strong>.<br>
      Adding them up group by group: ${Array(rows).fill(cols).join(" + ")} = <strong>${rows * cols}</strong>!
    </div>
    </div>`;

        canvas.innerHTML = html;
    }
    else if (visType === "fraction") {
        // Slice of items
        const num = visData.numerator;
        const den = visData.denominator;
        const total = visData.totalItems;
        const share = (num / den) * total;

        let html = `<div style="display:flex; flex-direction:column; align-items:center; gap:1rem; width:100%;">
      <div style="display:flex; gap:0.6rem; flex-wrap:wrap; justify-content:center;">`;

        for (let i = 0; i < total; i++) {
            const isSelected = i < share;
            html += `<span class="ai-visual-apple" style="font-size:2rem; filter:${isSelected ? 'none' : 'grayscale(1) opacity(0.3)'};">🍪</span>`;
        }

        html += `</div>
      <div style="font-size:1rem; color:var(--color-text-muted); text-align:center;">
        We have <strong>${total} cookies</strong> in total. Sharing them equally into <strong>${den} halves</strong> gives us two piles of <strong>${total / den}</strong> cookies.<br>
        Taking <strong>${num}</strong> of those halves gives us <strong>${share}</strong> cookies!
      </div>
    </div>`;

        canvas.innerHTML = html;
    }
    else if (visType === "fraction-pizza") {
        // Draw an SVG Pizza
        const num = visData.numerator;
        const den = visData.denominator;
        const radius = 60;
        const cx = 80;
        const cy = 80;

        let svgPathHtml = "";

        for (let i = 0; i < den; i++) {
            const angle1 = (i * 2 * Math.PI) / den - Math.PI / 2;
            const angle2 = ((i + 1) * 2 * Math.PI) / den - Math.PI / 2;

            const x1 = cx + radius * Math.cos(angle1);
            const y1 = cy + radius * Math.sin(angle1);
            const x2 = cx + radius * Math.cos(angle2);
            const y2 = cy + radius * Math.sin(angle2);

            const fill = i < num ? "var(--color-accent)" : "rgba(255,255,255,0.08)";
            const highlightClass = i < num ? "highlighted" : "";

            svgPathHtml += `
        <path class="ai-visual-slice ${highlightClass}" d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z" fill="${fill}" />
      `;
        }

        let html = `<div style="display:flex; align-items:center; gap:2rem; justify-content:center; flex-wrap:wrap;">
      <svg width="160" height="160">
        ${svgPathHtml}
        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
      </svg>
      <div style="flex:1; font-size:0.95rem; color:var(--color-text-muted); min-width:200px;">
        A whole pizza cut into <strong>${den} slices</strong>.<br>
        If we shade <strong>${num} slices</strong> in gold, we get the fraction:<br>
        <span style="font-size:1.6rem; color:var(--color-accent); font-weight:700; line-height:2;"><sup>${num}</sup>&frasl;<sub>${den}</sub></span> (Three-Quarters!)
      </div>
    </div>`;

        canvas.innerHTML = html;
    }
    else if (visType === "fraction-compare") {
        // Draw two pizzas to compare
        let html = `<div style="display:flex; gap:2rem; align-items:center; justify-content:center; flex-wrap:wrap; text-align:center;">
      <div>
        <svg width="100" height="100">
          <path d="M 50 50 L 50 10 A 40 40 0 0 1 50 90 Z" fill="var(--color-secondary)" stroke="var(--bg-deep)" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
        </svg>
        <p style="font-weight:700; margin-top:0.4rem;">1/2 (Half)</p>
      </div>
      <div style="font-size:1.5rem; font-weight:700; color:var(--color-accent);">></div>
      <div>
        <svg width="100" height="100">
          <path d="M 50 50 L 50 10 A 40 40 0 0 1 90 50 Z" fill="var(--color-primary-hover)" stroke="var(--bg-deep)" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
          <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.2)" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.2)" />
        </svg>
        <p style="font-weight:700; margin-top:0.4rem;">1/4 (Quarter)</p>
      </div>
      <div style="width:100%; font-size:0.95rem; color:var(--color-text-muted);">
        Compare the colored areas! The half-pizza segment is double the size of the quarter-pizza slice. So, <strong>1/2 is larger than 1/4</strong>.
      </div>
    </div>`;

        canvas.innerHTML = html;
    }
    else if (visType === "fraction-addition") {
        // Add segments of bottles
        const n1 = visData.num1;
        const n2 = visData.num2;
        const den = visData.den;

        let html = `<div style="display:flex; flex-direction:column; align-items:center; gap:1rem; width:100%;">
      <div style="display:flex; gap:1.2rem; align-items:center; justify-content:center;">
        <div style="display:flex; flex-direction:column-reverse; border:2px solid #fff; width:35px; height:80px; border-radius:4px; overflow:hidden;">
          <div style="height:${(n1 / den) * 100}%; background:var(--color-secondary);"></div>
        </div>
        <span style="font-size:1.8rem; font-weight:700;">+</span>
        <div style="display:flex; flex-direction:column-reverse; border:2px solid #fff; width:35px; height:80px; border-radius:4px; overflow:hidden;">
          <div style="height:${(n2 / den) * 100}%; background:var(--color-primary-hover);"></div>
        </div>
        <span style="font-size:1.8rem; font-weight:700;">=</span>
        <div style="display:flex; flex-direction:column-reverse; border:2px solid var(--color-accent); width:35px; height:80px; border-radius:4px; overflow:hidden; box-shadow:var(--shadow-glow-gold);">
          <div style="height:${(n1 / den) * 100}%; background:var(--color-secondary);"></div>
          <div style="height:${(n2 / den) * 100}%; background:var(--color-primary-hover);"></div>
        </div>
      </div>
      <div style="font-size:0.95rem; color:var(--color-text-muted); text-align:center;">
        When adding fractions with the same denominator, keep the container parts constant (5 sections), and just pool the fills together: <strong>${n1} + ${n2} = ${n1 + n2} sections</strong>!
      </div>
    </div>`;
        canvas.innerHTML = html;
    }
    else if (visType === "shape") {
        // Render dynamic geometric shape SVG outline
        const sides = visData.sides;
        const name = visData.name;

        // Draw polygon mathematically
        const size = 60;
        const cx = 80;
        const cy = 80;
        let points = [];

        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            const x = cx + size * Math.cos(angle);
            const y = cy + size * Math.sin(angle);
            points.push(`${x},${y}`);
        }

        let html = `<div style="display:flex; gap:2rem; align-items:center; justify-content:center; flex-wrap:wrap;">
      <svg width="160" height="160">
        <polygon class="ai-shape" points="${points.join(" ")}" />
        <!-- Draw small numbers next to each vertex -->
        ${points.map((pt, index) => {
            const coords = pt.split(",");
            const px = parseFloat(coords[0]);
            const py = parseFloat(coords[1]);
            // Offset labels slightly outwards
            const lx = cx + (px - cx) * 1.25 - 4;
            const ly = cy + (py - cy) * 1.2 - 2;
            return `<text x="${lx}" y="${ly}" fill="var(--color-accent)" font-weight="bold" font-size="12">${index + 1}</text>`;
        }).join("")}
      </svg>
      <div style="flex:1; font-size:0.95rem; color:var(--color-text-muted); min-width:200px;">
        This is a regular <strong>${name}</strong>.<br>
        Counting each of the outer straight segments (numbered 1 to 5 in gold), we confirm a pentagon has exactly <strong>${sides} sides</strong>!
      </div>
    </div>`;

        canvas.innerHTML = html;
    }
    else if (visType === "shape-perimeter") {
        // Perimeter of square side 5
        const side = visData.side;

        let html = `<div style="display:flex; gap:2rem; align-items:center; justify-content:center; flex-wrap:wrap;">
      <svg width="150" height="150">
        <rect class="ai-shape" x="25" y="25" width="100" height="100" />
        <text x="70" y="20" class="chart-text" fill="#fff" font-weight="bold">${side}m</text>
        <text x="130" y="75" class="chart-text" fill="#fff" font-weight="bold">${side}m</text>
        <text x="70" y="140" class="chart-text" fill="#fff" font-weight="bold">${side}m</text>
        <text x="5" y="75" class="chart-text" fill="#fff" font-weight="bold">${side}m</text>
      </svg>
      <div style="flex:1; font-size:0.95rem; color:var(--color-text-muted); min-width:200px;">
        To find the <strong>Perimeter</strong>, imagine walking all the way around the outer border of the garden. Add the 4 sides of the square:<br>
        <span style="font-size:1.1rem; color:var(--color-accent); font-weight:700;">${side} + ${side} + ${side} + ${side} = 20 meters</span>
      </div>
    </div>`;

        canvas.innerHTML = html;
    }
    else if (visType === "shape-area") {
        // Area of rectangle 6x4
        const l = visData.length;
        const w = visData.width;

        let gridLines = "";
        // Draw internal grid blocks inside rectangular SVG (width=120, height=80)
        for (let i = 1; i < l; i++) {
            const x = 20 + i * 20;
            gridLines += `<line x1="${x}" y1="20" x2="${x}" y2="100" stroke="rgba(255,255,255,0.25)" />`;
        }
        for (let j = 1; j < w; j++) {
            const y = 20 + j * 20;
            gridLines += `<line x1="20" y1="${y}" x2="140" y2="${y}" stroke="rgba(255,255,255,0.25)" />`;
        }

        let html = `<div style="display:flex; gap:2rem; align-items:center; justify-content:center; flex-wrap:wrap;">
      <svg width="180" height="130">
        <rect class="ai-shape" x="20" y="20" width="120" height="80" />
        ${gridLines}
        <text x="70" y="15" class="chart-text" fill="#fff" font-weight="bold">${l}m (Length)</text>
        <text x="145" y="65" class="chart-text" fill="#fff" font-weight="bold">${w}m (Width)</text>
      </svg>
      <div style="flex:1; font-size:0.95rem; color:var(--color-text-muted); min-width:200px;">
        The area is the total number of square grids inside the shape.<br>
        Instead of counting all blocks one by one, multiply length times width:<br>
        <span style="font-size:1.1rem; color:var(--color-accent); font-weight:700;">${l} × ${w} = 24 square meters</span>
      </div>
    </div>`;

        canvas.innerHTML = html;
    }
    else if (visType === "shape-triangle") {
        // Area of triangle base 8, height 5
        const b = visData.base;
        const h = visData.height;

        let html = `<div style="display:flex; gap:2rem; align-items:center; justify-content:center; flex-wrap:wrap;">
      <svg width="180" height="140">
        <!-- Draw bounding box in dotted line -->
        <rect x="20" y="20" width="140" height="100" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-dasharray="4,4" />
        <!-- Draw Triangle -->
        <polygon class="ai-shape" points="20,120 160,120 90,20" />
        <!-- Height line -->
        <line x1="90" y1="20" x2="90" y2="120" stroke="var(--color-error)" stroke-width="2" stroke-dasharray="3,3" />
        
        <text x="75" y="135" class="chart-text" fill="#fff" font-weight="bold">Base = ${b}m</text>
        <text x="95" y="70" class="chart-text" fill="var(--color-error)" font-weight="bold">Height = ${h}m</text>
      </svg>
      <div style="flex:1; font-size:0.95rem; color:var(--color-text-muted); min-width:200px;">
        A triangle is exactly **half** of a bounding rectangle! <br>
        First find the rectangle's area (Base × Height): 8 × 5 = 40. Then cut it in half:<br>
        <span style="font-size:1.1rem; color:var(--color-accent); font-weight:700;">1/2 × ${b} × ${h} = 20 square meters</span>
      </div>
    </div>`;

        canvas.innerHTML = html;
    }

    // Open the modal
    document.getElementById("ai-helper-modal").classList.add("open");
    playSynthSound("click");
}

// --- PARENT PORTAL CONTROLLER ---
function renderParentDashboard() {
    // Update summaries
    document.getElementById("parent-hero-level").textContent = gameState.level;
    document.getElementById("parent-coins-count").textContent = gameState.coins;
    document.getElementById("parent-stars-count").textContent = gameState.stars;

    const completedCount = Object.keys(gameState.completedLevels).length;
    document.getElementById("parent-lessons-count").textContent = completedCount;
    document.getElementById("parent-badges-count").textContent = gameState.badges.length;

    // Render Skill scores bars
    const skillsList = document.getElementById("parent-skills-list");
    skillsList.innerHTML = "";

    const topics = [
        { key: "addition", name: "Addition & Subtraction", barClass: "bar-addition" },
        { key: "multiplication", name: "Multiplication Tables", barClass: "bar-multiplication" },
        { key: "fractions", name: "Fractions & Parts", barClass: "bar-fractions" },
        { key: "geometry", name: "Geometry Shapes", barClass: "bar-geometry" }
    ];

    topics.forEach(t => {
        const score = gameState.skillsScores[t.key] || 0;
        const item = document.createElement("div");
        item.className = "skill-progress-item";
        item.innerHTML = `
      <div class="skill-meta">
        <span>${t.name}</span>
        <span>${score}% Mastery</span>
      </div>
      <div class="skill-bar-container">
        <div class="skill-bar-fill ${t.barClass}" style="width: ${score}%;"></div>
      </div>
    `;
        skillsList.appendChild(item);
    });

    // Render Practice Recommendations
    const recList = document.getElementById("parent-recommendations-list");
    recList.innerHTML = "";

    let recommendations = [];

    if (gameState.skillsScores.addition < 70) {
        recommendations.push({ icon: "🌳", text: "Addition Forest score is low (${gameState.skillsScores.addition}%). We recommend practicing carry-over math drills like 28 + 14." });
    }
    if (gameState.skillsScores.multiplication < 70) {
        recommendations.push({ icon: "⛰️", text: `Multiplication Mastery is at ${gameState.skillsScores.multiplication}%. Try reviewing 3x and 5x tables using visual grids.` });
    }
    if (gameState.skillsScores.fractions < 70) {
        recommendations.push({ icon: "🍕", text: `Fractions are proving tricky (${gameState.skillsScores.fractions}%). Suggest using real-life objects (like cutting a pie/pizza) to show fractional halves and parts.` });
    }
    if (gameState.skillsScores.geometry < 70) {
        recommendations.push({ icon: "🏰", text: "Geometry Castle is locked or just starting. Work on naming shapes like pentagons and calculating simple perimeters." });
    }

    if (recommendations.length === 0) {
        recommendations.push({ icon: "🌟", text: "Excellent job! Your child shows over 70% proficiency across all active topics. Encourage them to challenge the Dragon King!" });
    }

    recommendations.forEach(r => {
        const div = document.createElement("div");
        div.className = "alert-recommendation";
        div.innerHTML = `
      <span class="alert-recommendation-icon">${r.icon}</span>
      <p>${r.text}</p>
    `;
        recList.appendChild(div);
    });

    // Render Activity Line Chart (Custom SVG)
    renderActivityChart();

    // Render Badges Shelf
    renderBadgesCabinet();
}

function renderActivityChart() {
    const container = document.getElementById("parent-activity-chart");
    container.innerHTML = "";

    const data = gameState.weeklyActivity;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Find max for scaling
    const maxVal = Math.max(5, ...data); // Avoid divide-by-zero, min scaling is 5

    const width = 500;
    const height = 200;
    const paddingX = 40;
    const paddingY = 30;

    // Calculate points
    const points = data.map((val, idx) => {
        const x = paddingX + (idx * (width - 2 * paddingX)) / 6;
        const y = height - paddingY - (val * (height - 2 * paddingY)) / maxVal;
        return { x, y, val };
    });

    const pathD = points.reduce((acc, p, idx) => {
        return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, "");

    // Area path (closes at the bottom axis)
    const areaD = pathD + ` L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    let pointsHtml = "";
    let textLabelsHtml = "";
    let gridLines = "";

    // Draw grid lines
    for (let i = 0; i <= 4; i++) {
        const yVal = paddingY + (i * (height - 2 * paddingY)) / 4;
        const scaleVal = Math.round(maxVal - (i * maxVal) / 4);
        gridLines += `
      <line x1="${paddingX}" y1="${yVal}" x2="${width - paddingX}" y2="${yVal}" stroke="rgba(255,255,255,0.05)" />
      <text x="${paddingX - 10}" y="${yVal + 4}" class="chart-text" text-anchor="end">${scaleVal}</text>
    `;
    }

    points.forEach((p, idx) => {
        pointsHtml += `
      <circle cx="${p.x}" cy="${p.y}" r="6" class="chart-point" title="Quests: ${p.val}" />
      <text x="${p.x}" y="${p.y - 12}" class="chart-text" font-weight="bold" text-anchor="middle">${p.val > 0 ? p.val : ''}</text>
    `;
        textLabelsHtml += `
      <text x="${p.x}" y="${height - 10}" class="chart-text" text-anchor="middle">${days[idx]}</text>
    `;
    });

    const svgHtml = `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-secondary)" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="var(--color-secondary)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      
      <!-- Grid Lines & Y Axis Labels -->
      ${gridLines}

      <!-- Bottom X Axis -->
      <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" class="chart-axis" />

      <!-- Area under the curve -->
      <path d="${areaD}" class="chart-area" />

      <!-- Plot Line -->
      <path d="${pathD}" class="chart-line" />

      <!-- Points & Data text labels -->
      ${pointsHtml}

      <!-- X Axis Labels -->
      ${textLabelsHtml}
    </svg>
  `;

    container.innerHTML = svgHtml;
}

function renderBadgesCabinet() {
    const shelf = document.getElementById("parent-badges-shelf");
    shelf.innerHTML = "";

    BADGES.forEach(badge => {
        const isUnlocked = gameState.badges.includes(badge.id);
        const card = document.createElement("div");
        card.className = `badge-card ${isUnlocked ? 'unlocked' : 'locked'}`;

        card.innerHTML = `
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-desc">${badge.desc}</div>
    `;

        shelf.appendChild(card);
    });
}

// --- TEACHER PANEL CONTROLLER ---
function renderTeacherDashboard() {
    // Update aggregates
    document.getElementById("teacher-class-size").textContent = `${teacherStudents.length} Students`;

    // Calculate average accuracy
    let totalAcc = 0;
    teacherStudents.forEach(stud => {
        totalAcc += parseInt(stud.addition) + parseInt(stud.multiplication) + parseInt(stud.fractions) + parseInt(stud.geometry);
    });
    const avg = Math.round(totalAcc / (teacherStudents.length * 4));
    document.getElementById("teacher-avg-accuracy").textContent = `${avg}%`;

    // Render Table
    const tbody = document.getElementById("teacher-student-table-body");
    tbody.innerHTML = "";

    teacherStudents.forEach(stud => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td><strong>${stud.name}</strong></td>
      <td>Lvl ${stud.level}</td>
      <td>🪙 ${stud.coins}</td>
      <td>⭐ ${stud.stars}</td>
      <td><span class="badge-count-tag" style="background:${parseInt(stud.addition) >= 80 ? 'rgba(57,211,83,0.1)' : 'rgba(255,215,0,0.1)'}; color:${parseInt(stud.addition) >= 80 ? 'var(--color-success)' : 'var(--color-accent)'}">${stud.addition}</span></td>
      <td><span class="badge-count-tag" style="background:${parseInt(stud.multiplication) >= 80 ? 'rgba(57,211,83,0.1)' : 'rgba(255,215,0,0.1)'}; color:${parseInt(stud.multiplication) >= 80 ? 'var(--color-success)' : 'var(--color-accent)'}">${stud.multiplication}</span></td>
      <td><span class="badge-count-tag" style="background:${parseInt(stud.fractions) >= 80 ? 'rgba(57,211,83,0.1)' : 'rgba(255,215,0,0.1)'}; color:${parseInt(stud.fractions) >= 80 ? 'var(--color-success)' : 'var(--color-accent)'}">${stud.fractions}</span></td>
      <td><span class="badge-count-tag" style="background:${parseInt(stud.geometry) >= 80 ? 'rgba(57,211,83,0.1)' : 'rgba(255,215,0,0.1)'}; color:${parseInt(stud.geometry) >= 80 ? 'var(--color-success)' : 'var(--color-accent)'}">${stud.geometry}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="alert('Sent practice assignment reminders to ${stud.name}!')">Assign 📝</button>
      </td>
    `;
        tbody.appendChild(tr);
    });
}

function setupTeacherDashboardActions() {
    document.getElementById("btn-teacher-add-student").addEventListener("click", () => {
        document.getElementById("teacher-add-modal").classList.add("open");
        playSynthSound("click");
    });

    document.getElementById("btn-close-add-modal").addEventListener("click", () => {
        document.getElementById("teacher-add-modal").classList.remove("open");
        playSynthSound("click");
    });

    document.getElementById("btn-cancel-add-student").addEventListener("click", () => {
        document.getElementById("teacher-add-modal").classList.remove("open");
        playSynthSound("click");
    });

    document.getElementById("btn-confirm-add-student").addEventListener("click", () => {
        const nameInput = document.getElementById("new-student-name");
        const ageInput = document.getElementById("new-student-age");

        const name = nameInput.value.trim();
        const age = parseInt(ageInput.value);

        if (name) {
            // Create student entry
            const newStud = {
                id: teacherStudents.length + 1,
                name: name,
                age: age || 8,
                level: 1,
                coins: 0,
                stars: 0,
                addition: "0%",
                multiplication: "0%",
                fractions: "0%",
                geometry: "0%"
            };

            teacherStudents.push(newStud);
            renderTeacherDashboard();

            // Clear form & close
            nameInput.value = "";
            document.getElementById("teacher-add-modal").classList.remove("open");
            playSynthSound("correct");
        } else {
            alert("Please enter a student name!");
        }
    });
}

// --- APP ATTACHMENT & INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Load data
    loadGameState();

    // 2. Setup routing listeners
    document.querySelectorAll(".nav-btn").forEach(btn => {
        const target = btn.getAttribute("data-target");
        if (target) {
            btn.addEventListener("click", () => navigateToScreen(target));
        }
    });

    document.getElementById("nav-logo-btn").addEventListener("click", () => {
        navigateToScreen("screen-home");
    });

    // 3. Home Screen events
    document.getElementById("btn-start-adventure").addEventListener("click", () => {
        navigateToScreen("screen-customizer");
    });

    document.getElementById("btn-quick-login").addEventListener("click", () => {
        navigateToScreen("screen-map");
    });

    // 4. Character Customizer Setup
    setupCharacterCustomizer();

    // 5. Change Character option from map
    document.getElementById("btn-change-character").addEventListener("click", () => {
        navigateToScreen("screen-customizer");
    });

    // 6. Map World Nodes Click events
    document.querySelectorAll(".world-node").forEach(node => {
        node.addEventListener("click", () => {
            if (!node.classList.contains("locked-node")) {
                const wId = node.getAttribute("data-world");
                openLevelsDrawer(wId);
            } else {
                const reqLevel = node.getAttribute("data-world") === "2" ? 2 : node.getAttribute("data-world") === "3" ? 4 : 6;
                alert(`🔒 This world is locked! Earn more coins and level up to Lvl ${reqLevel} to unlock!`);
                playSynthSound("wrong");
            }
        });
    });

    // Close Drawer
    document.getElementById("btn-close-drawer").addEventListener("click", () => {
        document.getElementById("levels-drawer-overlay").classList.remove("open");
        playSynthSound("click");
    });

    // Close Drawer clicking outside it
    document.getElementById("levels-drawer-overlay").addEventListener("click", (e) => {
        if (e.target.id === "levels-drawer-overlay") {
            document.getElementById("levels-drawer-overlay").classList.remove("open");
            playSynthSound("click");
        }
    });

    // 7. Quest Events
    document.getElementById("btn-quest-back-map").addEventListener("click", () => {
        navigateToScreen("screen-map");
    });

    document.getElementById("btn-read-aloud").addEventListener("click", () => {
        if (currentLevel) {
            narrateText(`${currentLevel.title}. ${currentLevel.story}`);
        }
        playSynthSound("click");
    });

    document.getElementById("btn-submit-answer").addEventListener("click", handleAnswerCheck);

    // AI Helper triggering
    document.getElementById("btn-ai-helper-trigger").addEventListener("click", triggerAiHelper);

    // AI Close Modals
    const closeAiModal = () => {
        document.getElementById("ai-helper-modal").classList.remove("open");
        playSynthSound("click");
    };
    document.getElementById("btn-close-ai-modal").addEventListener("click", closeAiModal);
    document.getElementById("btn-close-ai-modal-ok").addEventListener("click", closeAiModal);

    // Close Badge Celebration
    document.getElementById("btn-close-badge-modal").addEventListener("click", () => {
        document.getElementById("badge-modal").classList.remove("open");
        playSynthSound("correct");
    });

    // Reset Data Event
    document.getElementById("btn-reset-data").addEventListener("click", resetAllData);

    // Sound Toggle
    document.getElementById("btn-sound-toggle").addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        document.getElementById("sound-icon").textContent = soundEnabled ? "🔊" : "🔇";
        if (soundEnabled) {
            initAudio();
            playSynthSound("click");
        }
    });

    // 8. Teacher Panel Setup
    setupTeacherDashboardActions();

    // Draw connectors on resize
    window.addEventListener("resize", () => {
        if (activeScreenId === "screen-map") {
            drawConnectingMapPaths();
        }
    });
});
