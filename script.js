class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.restartButton = document.getElementById('restartButton');

        // 游戏配置
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        this.gameSpeed = 150;
        
        // 游戏状态
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameLoopId = null; // 添加游戏循环ID
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        
        // 蛇的初始状态
        this.snake = [
            {x: 10, y: 10}
        ];
        this.snakeLength = 1;
        this.dx = 0;
        this.dy = 0;
        
        // 食物位置
        this.food = this.generateFood();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化显示
        this.updateHighScore();
        this.draw();
    }

    bindEvents() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        // 按钮控制
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });

        this.pauseButton.addEventListener('click', () => {
            this.togglePause();
        });

        this.restartButton.addEventListener('click', () => {
            this.restartGame();
        });
    }

    handleKeyPress(e) {
        if (!this.gameRunning) {
            if (e.code === 'Space') {
                e.preventDefault();
                this.restartGame();
            }
            return;
        }

        switch(e.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
            case 'ArrowLeft':
            case 'KeyA':
                if (this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
            case 'Space':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }

    startGame() {
        // 停止之前的游戏循环
        this.stopGameLoop();
        
        // 确保蛇有初始移动方向
        if (this.dx === 0 && this.dy === 0) {
            this.dx = 1; // 默认向右移动
            this.dy = 0;
        }
        
        this.gameRunning = true;
        this.gamePaused = false;
        this.overlay.classList.add('hidden');
        this.gameLoop();
    }

    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        this.pauseButton.textContent = this.gamePaused ? '继续' : '暂停';
        
        if (this.gamePaused) {
            this.stopGameLoop(); // 暂停时停止游戏循环
        } else {
            this.gameLoop(); // 继续时重新开始游戏循环
        }
    }

    stopGameLoop() {
        if (this.gameLoopId) {
            clearTimeout(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    restartGame() {
        this.resetGame();
        this.startGame();
    }

    resetGame() {
        this.stopGameLoop(); // 停止游戏循环
        this.snake = [{x: 10, y: 10}];
        this.snakeLength = 1;
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.food = this.generateFood();
        this.gameRunning = false;
        this.gamePaused = false;
        this.pauseButton.textContent = '暂停';
        this.updateScore();
        this.showOverlay('游戏开始', '按空格键开始游戏');
        this.draw(); // 重新绘制游戏画面
    }

    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;

        this.gameLoopId = setTimeout(() => {
            this.update();
            this.draw();
            this.gameLoop();
        }, this.gameSpeed);
    }

    update() {
        // 移动蛇
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // 检查碰撞
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }
    }

    checkCollision(head) {
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        // 检查自身碰撞（跳过头部，因为新头部位置会与旧头部重叠）
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        
        return food;
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#f7fafc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制蛇
        this.drawSnake();
        
        // 绘制食物
        this.drawFood();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }

    drawSnake() {
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // 蛇头
                this.ctx.fillStyle = '#2d3748';
                this.ctx.fillRect(segment.x * this.gridSize + 1, segment.y * this.gridSize + 1, 
                                this.gridSize - 2, this.gridSize - 2);
                
                // 蛇头装饰
                this.ctx.fillStyle = '#4a5568';
                this.ctx.fillRect(segment.x * this.gridSize + 3, segment.y * this.gridSize + 3, 
                                4, 4);
                this.ctx.fillRect(segment.x * this.gridSize + 13, segment.y * this.gridSize + 3, 
                                4, 4);
            } else {
                // 蛇身
                this.ctx.fillStyle = '#48bb78';
                this.ctx.fillRect(segment.x * this.gridSize + 1, segment.y * this.gridSize + 1, 
                                this.gridSize - 2, this.gridSize - 2);
            }
        });
    }

    drawFood() {
        this.ctx.fillStyle = '#e53e3e';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
        
        // 食物高光
        this.ctx.fillStyle = '#fed7d7';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2 - 2,
            this.food.y * this.gridSize + this.gridSize / 2 - 2,
            2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
    }

    gameOver() {
        this.stopGameLoop(); // 停止游戏循环
        this.gameRunning = false;
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScore();
            this.showOverlay('游戏结束', `恭喜！新纪录：${this.score}分\n点击"重新开始"按钮或按空格键重新开始`);
        } else {
            this.showOverlay('游戏结束', `得分：${this.score}分\n点击"重新开始"按钮或按空格键重新开始`);
        }
        
        // 添加分享功能
        this.addShareButton();
    }

    addShareButton() {
        // 检查是否支持分享API
        if (navigator.share) {
            const shareButton = document.createElement('button');
            shareButton.textContent = '分享游戏';
            shareButton.className = 'game-button';
            shareButton.style.marginTop = '10px';
            shareButton.onclick = () => {
                navigator.share({
                    title: '贪吃蛇游戏',
                    text: `我在贪吃蛇游戏中获得了${this.score}分！来挑战我吧！`,
                    url: window.location.href
                });
            };
            
            const overlayContent = document.querySelector('.overlay-content');
            overlayContent.appendChild(shareButton);
        }
    }

    showOverlay(title, message) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        
        // 如果是游戏结束，添加重新开始按钮
        if (title === '游戏结束') {
            this.startButton.textContent = '重新开始';
            this.startButton.onclick = () => this.restartGame();
        } else {
            this.startButton.textContent = '开始游戏';
            this.startButton.onclick = () => this.startGame();
        }
        
        this.overlay.classList.remove('hidden');
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    updateHighScore() {
        this.highScoreElement.textContent = this.highScore;
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
}); 