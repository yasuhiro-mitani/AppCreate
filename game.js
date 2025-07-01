class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 20;
        this.mapWidth = 16;
        this.mapHeight = 16;
        
        this.player = {
            x: 8,
            y: 8,
            hp: 100,
            maxHp: 100,
            level: 1,
            exp: 0,
            expToNext: 100,
            inventory: []
        };
        
        this.enemies = [];
        this.items = [];
        this.floor = 1;
        this.map = [];
        this.messages = [];
        
        this.initializeGame();
        this.setupControls();
        this.gameLoop();
    }
    
    initializeGame() {
        this.generateMap();
        this.generateEnemies();
        this.generateItems();
        this.updateUI();
        this.addMessage("ダンジョンに入った！");
    }
    
    generateMap() {
        // シンプルなマップ生成（壁と床）
        this.map = [];
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                if (x === 0 || x === this.mapWidth - 1 || y === 0 || y === this.mapHeight - 1) {
                    this.map[y][x] = 'wall';
                } else if (Math.random() < 0.15) {
                    this.map[y][x] = 'wall';
                } else {
                    this.map[y][x] = 'floor';
                }
            }
        }
        
        // プレイヤースタート位置を確保
        this.map[this.player.y][this.player.x] = 'floor';
        
        // 階段を配置
        let stairsPlaced = false;
        while (!stairsPlaced) {
            let x = Math.floor(Math.random() * (this.mapWidth - 2)) + 1;
            let y = Math.floor(Math.random() * (this.mapHeight - 2)) + 1;
            if (this.map[y][x] === 'floor' && (x !== this.player.x || y !== this.player.y)) {
                this.map[y][x] = 'stairs';
                stairsPlaced = true;
            }
        }
    }
    
    generateEnemies() {
        this.enemies = [];
        const enemyCount = 3 + this.floor;
        
        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.mapWidth - 2)) + 1;
                y = Math.floor(Math.random() * (this.mapHeight - 2)) + 1;
            } while (this.map[y][x] !== 'floor' || (x === this.player.x && y === this.player.y));
            
            this.enemies.push({
                x: x,
                y: y,
                hp: 20 + this.floor * 5,
                maxHp: 20 + this.floor * 5,
                attack: 5 + this.floor * 2,
                type: 'goblin'
            });
        }
    }
    
    generateItems() {
        this.items = [];
        const itemCount = 2 + Math.floor(this.floor / 2);
        
        for (let i = 0; i < itemCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.mapWidth - 2)) + 1;
                y = Math.floor(Math.random() * (this.mapHeight - 2)) + 1;
            } while (this.map[y][x] !== 'floor' || (x === this.player.x && y === this.player.y));
            
            const itemTypes = ['potion', 'sword', 'armor'];
            const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            
            this.items.push({
                x: x,
                y: y,
                type: type,
                name: this.getItemName(type)
            });
        }
    }
    
    getItemName(type) {
        switch (type) {
            case 'potion': return 'ヒールポーション';
            case 'sword': return '剣';
            case 'armor': return '鎧';
            default: return 'アイテム';
        }
    }
    
    setupControls() {
        // 方向キーの設定
        document.getElementById('up-btn').addEventListener('click', () => this.movePlayer(0, -1));
        document.getElementById('down-btn').addEventListener('click', () => this.movePlayer(0, 1));
        document.getElementById('left-btn').addEventListener('click', () => this.movePlayer(-1, 0));
        document.getElementById('right-btn').addEventListener('click', () => this.movePlayer(1, 0));
        
        // アクションボタン
        document.getElementById('center-btn').addEventListener('click', () => this.playerAttack());
        document.getElementById('inventory-btn').addEventListener('click', () => this.openInventory());
        document.getElementById('stairs-btn').addEventListener('click', () => this.useStairs());
        document.getElementById('close-inventory').addEventListener('click', () => this.closeInventory());
        
        // タッチイベントの追加（スワイプ操作）
        this.setupTouchControls();
        
        // キーボード操作
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp': this.movePlayer(0, -1); break;
                case 'ArrowDown': this.movePlayer(0, 1); break;
                case 'ArrowLeft': this.movePlayer(-1, 0); break;
                case 'ArrowRight': this.movePlayer(1, 0); break;
                case ' ': this.playerAttack(); break;
                case 'i': this.openInventory(); break;
            }
        });
    }
    
    setupTouchControls() {
        let startX, startY;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!startX || !startY) return;
            
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const minSwipeDistance = 30;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.movePlayer(1, 0); // 右
                    } else {
                        this.movePlayer(-1, 0); // 左
                    }
                }
            } else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.movePlayer(0, 1); // 下
                    } else {
                        this.movePlayer(0, -1); // 上
                    }
                }
            }
            
            startX = null;
            startY = null;
        });
        
        // タップ攻撃
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.tileSize);
            const y = Math.floor((e.clientY - rect.top) / this.tileSize);
            
            // 隣接する敵をタップした場合は攻撃
            const enemy = this.enemies.find(e => e.x === x && e.y === y);
            if (enemy && this.isAdjacent(this.player.x, this.player.y, x, y)) {
                this.attackEnemy(enemy);
            }
        });
    }
    
    movePlayer(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // 境界チェック
        if (newX < 0 || newX >= this.mapWidth || newY < 0 || newY >= this.mapHeight) {
            return;
        }
        
        // 壁チェック
        if (this.map[newY][newX] === 'wall') {
            return;
        }
        
        // 敵チェック
        const enemy = this.enemies.find(e => e.x === newX && e.y === newY);
        if (enemy) {
            this.attackEnemy(enemy);
            return;
        }
        
        // 移動実行
        this.player.x = newX;
        this.player.y = newY;
        
        // アイテムチェック
        const itemIndex = this.items.findIndex(item => item.x === newX && item.y === newY);
        if (itemIndex !== -1) {
            this.pickupItem(itemIndex);
        }
        
        // 敵のターン
        this.enemyTurn();
    }
    
    attackEnemy(enemy) {
        const damage = 15 + Math.floor(Math.random() * 10);
        enemy.hp -= damage;
        this.addMessage(`ゴブリンに${damage}ダメージ！`);
        
        if (enemy.hp <= 0) {
            this.addMessage("ゴブリンを倒した！");
            const index = this.enemies.indexOf(enemy);
            this.enemies.splice(index, 1);
            
            // 経験値獲得
            this.player.exp += 25;
            if (this.player.exp >= this.player.expToNext) {
                this.levelUp();
            }
        }
        
        this.enemyTurn();
    }
    
    playerAttack() {
        // 隣接する敵を攻撃
        const adjacentEnemies = this.enemies.filter(enemy => 
            this.isAdjacent(this.player.x, this.player.y, enemy.x, enemy.y)
        );
        
        if (adjacentEnemies.length > 0) {
            this.attackEnemy(adjacentEnemies[0]);
        } else {
            this.addMessage("攻撃する対象がいない");
        }
    }
    
    enemyTurn() {
        this.enemies.forEach(enemy => {
            // プレイヤーに隣接している場合は攻撃
            if (this.isAdjacent(enemy.x, enemy.y, this.player.x, this.player.y)) {
                const damage = enemy.attack + Math.floor(Math.random() * 5);
                this.player.hp -= damage;
                this.addMessage(`ゴブリンから${damage}ダメージを受けた！`);
                
                if (this.player.hp <= 0) {
                    this.gameOver();
                    return;
                }
            } else {
                // プレイヤーに向かって移動
                this.moveEnemyTowardsPlayer(enemy);
            }
        });
        
        this.updateUI();
    }
    
    moveEnemyTowardsPlayer(enemy) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        
        let moveX = 0, moveY = 0;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            moveX = dx > 0 ? 1 : -1;
        } else {
            moveY = dy > 0 ? 1 : -1;
        }
        
        const newX = enemy.x + moveX;
        const newY = enemy.y + moveY;
        
        // 移動可能かチェック
        if (this.map[newY] && this.map[newY][newX] === 'floor' && 
            !this.enemies.some(e => e.x === newX && e.y === newY) &&
            !(newX === this.player.x && newY === this.player.y)) {
            enemy.x = newX;
            enemy.y = newY;
        }
    }
    
    isAdjacent(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1 && !(x1 === x2 && y1 === y2);
    }
    
    pickupItem(itemIndex) {
        const item = this.items[itemIndex];
        this.player.inventory.push(item);
        this.items.splice(itemIndex, 1);
        this.addMessage(`${item.name}を拾った！`);
    }
    
    useStairs() {
        if (this.map[this.player.y][this.player.x] === 'stairs') {
            this.floor++;
            this.addMessage(\`\${this.floor}階に降りた！\`);
            this.initializeGame();
        } else {
            this.addMessage("ここに階段はない");
        }
    }
    
    levelUp() {
        this.player.level++;
        this.player.exp = 0;
        this.player.expToNext = this.player.level * 100;
        this.player.maxHp += 20;
        this.player.hp = this.player.maxHp;
        this.addMessage(\`レベルアップ！ レベル\${this.player.level}になった！\`);
    }
    
    openInventory() {
        const modal = document.getElementById('inventory-modal');
        const list = document.getElementById('inventory-list');
        
        list.innerHTML = '';
        
        if (this.player.inventory.length === 0) {
            list.innerHTML = '<div>アイテムがありません</div>';
        } else {
            this.player.inventory.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'inventory-item';
                div.textContent = item.name;
                div.addEventListener('click', () => this.useItem(index));
                list.appendChild(div);
            });
        }
        
        modal.classList.remove('hidden');
    }
    
    closeInventory() {
        document.getElementById('inventory-modal').classList.add('hidden');
    }
    
    useItem(index) {
        const item = this.player.inventory[index];
        
        switch (item.type) {
            case 'potion':
                const heal = 30;
                this.player.hp = Math.min(this.player.hp + heal, this.player.maxHp);
                this.addMessage(\`\${heal}回復した！\`);
                this.player.inventory.splice(index, 1);
                break;
        }
        
        this.closeInventory();
        this.updateUI();
    }
    
    gameOver() {
        this.addMessage("ゲームオーバー！");
        alert("ゲームオーバー！ページを更新してリスタートしてください。");
    }
    
    addMessage(text) {
        this.messages.push(text);
        if (this.messages.length > 10) {
            this.messages.shift();
        }
        
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = this.messages.map(msg => \`<div class="message">\${msg}</div>\`).join('');
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    updateUI() {
        document.getElementById('player-hp').textContent = this.player.hp;
        document.getElementById('player-max-hp').textContent = this.player.maxHp;
        document.getElementById('player-level').textContent = this.player.level;
        document.getElementById('floor-level').textContent = this.floor;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // マップ描画
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tileX = x * this.tileSize;
                const tileY = y * this.tileSize;
                
                switch (this.map[y][x]) {
                    case 'wall':
                        this.ctx.fillStyle = '#666';
                        this.ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                        break;
                    case 'floor':
                        this.ctx.fillStyle = '#333';
                        this.ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                        break;
                    case 'stairs':
                        this.ctx.fillStyle = '#333';
                        this.ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                        this.ctx.fillStyle = '#ff0';
                        this.ctx.fillRect(tileX + 2, tileY + 2, this.tileSize - 4, this.tileSize - 4);
                        break;
                }
            }
        }
        
        // アイテム描画
        this.items.forEach(item => {
            const tileX = item.x * this.tileSize;
            const tileY = item.y * this.tileSize;
            
            this.ctx.fillStyle = '#0f0';
            this.ctx.fillRect(tileX + 4, tileY + 4, this.tileSize - 8, this.tileSize - 8);
        });
        
        // 敵描画
        this.enemies.forEach(enemy => {
            const tileX = enemy.x * this.tileSize;
            const tileY = enemy.y * this.tileSize;
            
            this.ctx.fillStyle = '#f00';
            this.ctx.fillRect(tileX + 2, tileY + 2, this.tileSize - 4, this.tileSize - 4);
        });
        
        // プレイヤー描画
        const playerTileX = this.player.x * this.tileSize;
        const playerTileY = this.player.y * this.tileSize;
        
        this.ctx.fillStyle = '#00f';
        this.ctx.fillRect(playerTileX + 2, playerTileY + 2, this.tileSize - 4, this.tileSize - 4);
    }
    
    gameLoop() {
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ゲーム開始
window.addEventListener('load', () => {
    new Game();
});