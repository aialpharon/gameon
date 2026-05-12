// RPG Quest Tracker - Main Application Logic

// Game State
const gameState = {
    character: {
        name: '',
        class: 'warrior',
        stats: {
            str: 5,
            int: 5,
            dex: 5,
            hp: 100,
            mp: 50
        },
        level: 1,
        xp: 0,
        xpToNextLevel: 100
    },
    quests: {
        main: [],
        sub: [],
        grinding: []
    },
    pointsRemaining: 10
};

// Class presets
const classPresets = {
    warrior: { str: 8, int: 3, dex: 4, hp: 120, mp: 30, avatar: '🗡️' },
    mage: { str: 3, int: 8, dex: 4, hp: 80, mp: 100, avatar: '🔮' },
    rogue: { str: 5, int: 5, dex: 7, hp: 90, mp: 60, avatar: '🗡️' },
    paladin: { str: 7, int: 4, dex: 3, hp: 130, mp: 50, avatar: '🛡️' },
    archer: { str: 4, int: 6, dex: 8, hp: 85, mp: 70, avatar: '🏹' }
};

// DOM Elements
const screens = {
    creation: document.getElementById('character-creation'),
    game: document.getElementById('game-screen')
};

const modal = document.getElementById('quest-modal');

// Current quest type being added
let currentQuestType = null;

// Initialize the application
function init() {
    setupStatButtons();
    setupClassSelection();
    setupStartButton();
    setupModal();
    setupQuestButtons();
    loadGameData();
}

// Setup stat allocation buttons
function setupStatButtons() {
    const statBtns = document.querySelectorAll('.stat-btn');
    
    statBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const stat = btn.dataset.stat;
            const isPlus = btn.classList.contains('plus');
            
            if (isPlus) {
                if (gameState.pointsRemaining > 0) {
                    increaseStat(stat);
                }
            } else {
                if (canDecreaseStat(stat)) {
                    decreaseStat(stat);
                }
            }
            
            updateStatDisplay();
            updatePointsRemaining();
        });
    });
}

// Increase a stat
function increaseStat(stat) {
    if (stat === 'hp' || stat === 'mp') {
        gameState.character.stats[stat] += 10;
    } else {
        gameState.character.stats[stat] += 1;
    }
    gameState.pointsRemaining--;
}

// Decrease a stat
function canDecreaseStat(stat) {
    const baseValues = { str: 1, int: 1, dex: 1, hp: 50, mp: 20 };
    return gameState.character.stats[stat] > baseValues[stat];
}

function decreaseStat(stat) {
    if (stat === 'hp' || stat === 'mp') {
        gameState.character.stats[stat] -= 10;
    } else {
        gameState.character.stats[stat] -= 1;
    }
    gameState.pointsRemaining++;
}

// Update stat display
function updateStatDisplay() {
    document.getElementById('str-value').textContent = gameState.character.stats.str;
    document.getElementById('int-value').textContent = gameState.character.stats.int;
    document.getElementById('dex-value').textContent = gameState.character.stats.dex;
    document.getElementById('hp-value').textContent = gameState.character.stats.hp;
    document.getElementById('mp-value').textContent = gameState.character.stats.mp;
}

// Update points remaining display
function updatePointsRemaining() {
    document.getElementById('points-remaining').textContent = gameState.pointsRemaining;
}

// Setup class selection
function setupClassSelection() {
    const classSelect = document.getElementById('hero-class');
    
    classSelect.addEventListener('change', (e) => {
        const selectedClass = e.target.value;
        applyClassPreset(selectedClass);
    });
}

// Apply class preset
function applyClassPreset(className) {
    const preset = classPresets[className];
    const totalBaseStats = preset.str + preset.int + preset.dex + preset.hp / 10 + preset.mp / 10;
    const pointsUsed = totalBaseStats - 15; // Base stats use some points
    gameState.pointsRemaining = Math.max(0, 10 - pointsUsed);
    
    gameState.character.stats = {
        str: preset.str,
        int: preset.int,
        dex: preset.dex,
        hp: preset.hp,
        mp: preset.mp
    };
    
    gameState.character.class = className;
    
    updateStatDisplay();
    updatePointsRemaining();
}

// Setup start button
function setupStartButton() {
    const startBtn = document.getElementById('start-adventure');
    
    startBtn.addEventListener('click', () => {
        const name = document.getElementById('hero-name').value.trim();
        
        if (!name) {
            alert('Please enter your hero\'s name!');
            return;
        }
        
        gameState.character.name = name;
        saveGameData();
        showGameScreen();
    });
}

// Show game screen
function showGameScreen() {
    screens.creation.classList.remove('active');
    screens.game.classList.add('active');
    
    updateCharacterDisplay();
    renderQuests();
}

// Update character display on game screen
function updateCharacterDisplay() {
    const char = gameState.character;
    
    document.getElementById('display-name').textContent = char.name;
    document.getElementById('display-class').textContent = char.class.charAt(0).toUpperCase() + char.class.slice(1);
    document.getElementById('class-avatar').textContent = classPresets[char.class].avatar;
    document.getElementById('level-display').textContent = char.level;
    
    // Update stats
    document.getElementById('stat-str').textContent = char.stats.str;
    document.getElementById('stat-int').textContent = char.stats.int;
    document.getElementById('stat-dex').textContent = char.stats.dex;
    document.getElementById('stat-hp').textContent = `${char.stats.hp}/${char.stats.hp}`;
    document.getElementById('stat-mp').textContent = `${char.stats.mp}/${char.stats.mp}`;
    
    // Update bars
    document.getElementById('hp-bar').style.width = '100%';
    document.getElementById('mp-bar').style.width = '100%';
    
    // Update XP
    updateXPDisplay();
}

// Update XP display
function updateXPDisplay() {
    const char = gameState.character;
    const percentage = (char.xp / char.xpToNextLevel) * 100;
    
    document.getElementById('xp-progress').style.width = `${percentage}%`;
    document.getElementById('xp-text').textContent = `${char.xp}/${char.xpToNextLevel} XP`;
}

// Setup modal
function setupModal() {
    const cancelBtn = document.getElementById('cancel-quest');
    const saveBtn = document.getElementById('save-quest');
    
    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveQuest);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Open modal for adding quest
function openQuestModal(questType) {
    currentQuestType = questType;
    
    const titles = {
        main: '📜 Add Main Quest',
        sub: '📋 Add Sub Quest',
        grinding: '⚔️ Add Grinding Task'
    };
    
    document.getElementById('modal-title').textContent = titles[questType];
    document.getElementById('quest-name').value = '';
    document.getElementById('quest-xp').value = '10';
    document.getElementById('quest-stat').value = '';
    
    modal.classList.add('active');
    document.getElementById('quest-name').focus();
}

// Close modal
function closeModal() {
    modal.classList.remove('active');
    currentQuestType = null;
}

// Save quest
function saveQuest() {
    const name = document.getElementById('quest-name').value.trim();
    const xp = parseInt(document.getElementById('quest-xp').value) || 10;
    const statBonus = document.getElementById('quest-stat').value;
    
    if (!name) {
        alert('Please enter a quest name!');
        return;
    }
    
    // Check limits
    if (currentQuestType === 'main' && gameState.quests.main.length >= 1) {
        alert('You can only have 1 Main Quest at a time!');
        return;
    }
    
    if (currentQuestType === 'sub' && gameState.quests.sub.length >= 3) {
        alert('You can only have 3 Sub Quests at a time!');
        return;
    }
    
    const quest = {
        id: Date.now(),
        name: name,
        xp: xp,
        statBonus: statBonus,
        completed: false
    };
    
    gameState.quests[currentQuestType].push(quest);
    saveGameData();
    renderQuests();
    closeModal();
}

// Setup quest buttons
function setupQuestButtons() {
    document.getElementById('add-main-quest').addEventListener('click', () => openQuestModal('main'));
    document.getElementById('add-sub-quest').addEventListener('click', () => openQuestModal('sub'));
    document.getElementById('add-grinding').addEventListener('click', () => openQuestModal('grinding'));
    
    document.getElementById('reset-daily').addEventListener('click', resetDaily);
    document.getElementById('edit-character').addEventListener('click', editCharacter);
}

// Render all quests
function renderQuests() {
    renderQuestList('main-quest-list', gameState.quests.main, 'main');
    renderQuestList('sub-quest-list', gameState.quests.sub, 'sub');
    renderQuestList('grinding-list', gameState.quests.grinding, 'grinding');
    
    // Update counters
    document.querySelector('.sub-quests h3').textContent = `📋 Sub Quests (${gameState.quests.sub.length}/3)`;
}

// Render a quest list
function renderQuestList(elementId, quests, type) {
    const container = document.getElementById(elementId);
    
    if (quests.length === 0) {
        const messages = {
            main: 'No main quest set. Click + to add one!',
            sub: 'No sub quests. Click + to add up to 3!',
            grinding: 'No habits set. Click + to add grinding tasks!'
        };
        container.innerHTML = `<p class="empty-message">${messages[type]}</p>`;
        return;
    }
    
    container.innerHTML = quests.map(quest => `
        <div class="quest-item ${quest.completed ? 'completed' : ''}" data-id="${quest.id}">
            <div class="quest-info">
                <div class="quest-name">${escapeHtml(quest.name)}</div>
                <div class="quest-rewards">
                    <span class="quest-xp">✨ ${quest.xp} XP</span>
                    ${quest.statBonus ? `<span class="quest-stat-bonus"> | +1 ${quest.statBonus.toUpperCase()}</span>` : ''}
                </div>
            </div>
            <div class="quest-actions">
                ${!quest.completed ? `
                    <button class="action-btn complete-btn" onclick="completeQuest('${type}', ${quest.id})">✓ Complete</button>
                ` : ''}
                <button class="action-btn delete-btn" onclick="deleteQuest('${type}', ${quest.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Complete a quest
window.completeQuest = function(type, questId) {
    const quest = gameState.quests[type].find(q => q.id === questId);
    
    if (quest && !quest.completed) {
        quest.completed = true;
        addXP(quest.xp);
        
        // Apply stat bonus
        if (quest.statBonus) {
            gameState.character.stats[quest.statBonus] += 1;
            showStatIncrease(quest.statBonus);
        }
        
        saveGameData();
        renderQuests();
        updateCharacterDisplay();
    }
};

// Delete a quest
window.deleteQuest = function(type, questId) {
    if (confirm('Are you sure you want to delete this quest?')) {
        gameState.quests[type] = gameState.quests[type].filter(q => q.id !== questId);
        saveGameData();
        renderQuests();
    }
};

// Add XP
function addXP(amount) {
    gameState.character.xp += amount;
    
    // Check for level up
    while (gameState.character.xp >= gameState.character.xpToNextLevel) {
        gameState.character.xp -= gameState.character.xpToNextLevel;
        gameState.character.level++;
        gameState.character.xpToNextLevel = Math.floor(gameState.character.xpToNextLevel * 1.5);
        
        // Stat increases on level up
        gameState.character.stats.str += 1;
        gameState.character.stats.int += 1;
        gameState.character.stats.dex += 1;
        gameState.character.stats.hp += 10;
        gameState.character.stats.mp += 10;
        
        setTimeout(() => {
            alert(`🎉 Level Up! You are now level ${gameState.character.level}!`);
        }, 100);
    }
    
    updateXPDisplay();
}

// Show stat increase animation
function showStatIncrease(stat) {
    const statNames = {
        str: '💪 STR',
        int: '🧠 INT',
        dex: '🎯 DEX',
        hp: '❤️ HP',
        mp: '✨ MP'
    };
    
    // Visual feedback could be added here
    console.log(`${statNames[stat]} increased by 1!`);
}

// Reset daily (for grinding tasks)
function resetDaily() {
    if (confirm('Start a new day? This will reset incomplete grinding tasks.')) {
        // Keep completed grinding tasks for streak tracking (optional)
        // For now, just mark incomplete grinding as incomplete
        gameState.quests.grinding.forEach(quest => {
            quest.completed = false;
        });
        
        saveGameData();
        renderQuests();
        
        // Restore HP and MP
        updateCharacterDisplay();
    }
}

// Edit character (return to creation screen)
function editCharacter() {
    if (confirm('Return to character creation? Your progress will be saved.')) {
        saveGameData();
        screens.game.classList.remove('active');
        screens.creation.classList.add('active');
        
        // Populate fields with current values
        document.getElementById('hero-name').value = gameState.character.name;
        document.getElementById('hero-class').value = gameState.character.class;
        updateStatDisplay();
        updatePointsRemaining();
    }
}

// Save game data to localStorage
function saveGameData() {
    localStorage.setItem('rpgQuestTracker', JSON.stringify(gameState));
}

// Load game data from localStorage
function loadGameData() {
    const saved = localStorage.getItem('rpgQuestTracker');
    
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            
            // Merge with default state to ensure all properties exist
            gameState.character = { ...gameState.character, ...loaded.character };
            gameState.quests = loaded.quests || gameState.quests;
            
            // If character has a name, show game screen directly
            if (gameState.character.name) {
                showGameScreen();
            }
        } catch (e) {
            console.error('Error loading saved game:', e);
            localStorage.removeItem('rpgQuestTracker');
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
