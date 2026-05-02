// Game State
const gameState = {
    inventory: [],
    messages: [],
    gameStarted: false,
    currentLocation: 'start'
};

// API Configuration - CUSTOMIZE THIS WITH YOUR BACKEND
const API_BASE_URL = 'http://localhost:8000'; // Mude para seu backend Haskell

// DOM Elements
const gameArea = document.getElementById('game-area');
const inventoryList = document.getElementById('inventory-list');
const messagesDiv = document.getElementById('messages');
const btnInteract = document.getElementById('btn-interact');
const btnExamine = document.getElementById('btn-examine');
const btnUse = document.getElementById('btn-use');
const btnReset = document.getElementById('btn-reset');

// Initialize Event Listeners
btnInteract.addEventListener('click', handleInteract);
btnExamine.addEventListener('click', handleExamine);
btnUse.addEventListener('click', handleUseItem);
btnReset.addEventListener('click', handleReset);

// Initialize Game
window.addEventListener('DOMContentLoaded', initializeGame);

async function initializeGame() {
    addMessage('Inicializando jogo...');
    try {
        const response = await fetch(`${API_BASE_URL}/api/game/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            gameState.gameStarted = true;
            gameState.currentLocation = data.location || 'start';
            updateGameDisplay(data.description);
            addMessage('Jogo iniciado!');
        } else {
            setupOfflineMode();
        }
    } catch (error) {
        console.error('Connection error:', error);
        setupOfflineMode();
    }
}

async function handleInteract() {
    if (!gameState.gameStarted) return;
    
    const target = prompt('Interagir com quem/o quê?');
    if (!target) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/game/interact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target, location: gameState.currentLocation })
        });
        
        if (response.ok) {
            const data = await response.json();
            addMessage(data.message || `Você interagiu com ${target}`);
            
            if (data.item_gained) {
                addItemToInventory(data.item_gained);
                addMessage(`✓ Você obteve: ${data.item_gained}`);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function handleExamine() {
    if (!gameState.gameStarted) return;
    
    const target = prompt('Examinar o quê?');
    if (!target) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/game/examine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target, location: gameState.currentLocation })
        });
        
        if (response.ok) {
            const data = await response.json();
            addMessage(`📋 ${data.description || 'Nada de especial.'}`);
        }
    } catch (error) {
        console.error(error);
    }
}

async function handleUseItem() {
    if (gameState.inventory.length === 0) {
        addMessage('Nenhum item no inventário!');
        return;
    }
    
    const item = prompt(`Qual item? (${gameState.inventory.join(', ')})`);
    if (!item || !gameState.inventory.includes(item)) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/game/use-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item, location: gameState.currentLocation })
        });
        
        if (response.ok) {
            const data = await response.json();
            addMessage(data.message || `Você usou ${item}`);
            
            if (data.item_consumed) removeItemFromInventory(item);
            if (data.game_won) {
                addMessage('🎉 Parabéns! Você escapou!');
                gameState.gameStarted = false;
            }
        }
    } catch (error) {
        console.error(error);
    }
}

function handleReset() {
    if (confirm('Reiniciar jogo?')) {
        gameState.inventory = [];
        gameState.messages = [];
        messagesDiv.innerHTML = '';
        inventoryList.innerHTML = '';
        initializeGame();
    }
}

function addItemToInventory(item) {
    if (!gameState.inventory.includes(item)) {
        gameState.inventory.push(item);
        updateInventoryDisplay();
    }
}

function removeItemFromInventory(item) {
    gameState.inventory = gameState.inventory.filter(i => i !== item);
    updateInventoryDisplay();
}

function updateInventoryDisplay() {
    inventoryList.innerHTML = '';
    if (gameState.inventory.length === 0) {
        inventoryList.innerHTML = '<li style="color: #999;">Vazio</li>';
    } else {
        gameState.inventory.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            inventoryList.appendChild(li);
        });
    }
}

function addMessage(message) {
    gameState.messages.push(message);
    const p = document.createElement('p');
    p.textContent = message;
    messagesDiv.appendChild(p);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateGameDisplay(description) {
    gameArea.innerHTML = `<p>${description || 'Explore...'}</p>`;
}

function setupOfflineMode() {
    addMessage('❌ Modo offline (backend não encontrado)');
    addMessage('💡 Configure: const API_BASE_URL = "http://seu-backend:porta"');
    gameState.gameStarted = true;
    updateGameDisplay('Você está preso em um quarto. Procure pela chave!');
}
