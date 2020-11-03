var MainGame = /** @class */ (function () {
    function MainGame(selector) {
        this._colors = [
            'black', '#CC33CC', '#CC99CC', '#6633FF', '#CC0099', '#FFCCFF', '#CC3399', '#CC0066'
        ];
        this.__blocks = [
            {
                name: 'I',
                colors: 1,
                schema: [
                    [1, 1, 1, 1]
                ]
            }, {
                name: 'J',
                colors: 2,
                schema: [
                    [1, 1, 1],
                    [0, 0, 1]
                ]
            }, {
                name: 'S',
                colors: 3,
                schema: [
                    [1, 1, 0],
                    [0, 1, 1]
                ]
            }, {
                name: 'L',
                colors: 4,
                schema: [
                    [1, 1, 1],
                    [1, 0, 0]
                ]
            }, {
                name: 'Z',
                colors: 5,
                schema: [
                    [0, 1, 1],
                    [1, 1, 0]
                ]
            }, {
                name: 'O',
                colors: 6,
                schema: [
                    [1, 1],
                    [1, 1]
                ]
            }, {
                name: 'T',
                colors: 7,
                schema: [
                    [0, 1, 0],
                    [1, 1, 1]
                ]
            }
        ];
        this._width = 10;
        this._height = 20;
        this._obstacle_size = 32;
        this._next_obstacle = 4;
        this._landed = [];
        this._currentX = 0;
        this._currentY = 0;
        this._nextBlockIndexes = [];
        this._difficultyEasy = document.getElementById("diff_easy");
        this._difficultyMedium = document.getElementById("diff_medium");
        this._difficultyHard = document.getElementById("diff_hard");
        this._timeBefore = 0;
        this._timeAfter = 0;
        this._stoper = 0;
        this._score = 0;
        this._difficulty = 500;
        this._newGame = document.getElementById("new_game");
        this._canvas = document.querySelector(selector);
        this._ctx = this._canvas.getContext('2d');
        this.run = this.run.bind(this);
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
        this.drawBlock = this.drawBlock.bind(this);
        this.onPressKeyboard = this.onPressKeyboard.bind(this);
        this.getNewBlock = this.getNewBlock.bind(this);
        this.checkCollision = this.checkCollision.bind(this);
        this.checkLines = this.checkLines.bind(this);
    }
    MainGame.prototype.run = function () {
        var _this = this;
        window.addEventListener('keydown', this.onPressKeyboard, false);
        this._difficultyEasy.addEventListener('click', function (e) { return _this.diff_lvl_easy(); });
        this._difficultyMedium.addEventListener('click', function (e) { return _this.diff_lvl_medium(); });
        this._difficultyHard.addEventListener('click', function (e) { return _this.diff_lvl_hard(); });
        this._newGame.addEventListener('click', function (e) { return _this.new_game(); });
        this._landed = MainGame.getNewArray(this._width, this._height);
        this.getNewBlock();
        this.update();
    };
    MainGame.prototype.new_game = function () {
        window.location.reload(true);
    };
    MainGame.prototype.diff_lvl_easy = function () {
        this._difficulty = 500;
    };
    MainGame.prototype.diff_lvl_medium = function () {
        this._difficulty = 350;
    };
    MainGame.prototype.diff_lvl_hard = function () {
        this._difficulty = 200;
    };
    MainGame.prototype.update = function () {
        this._timeBefore = performance.now();
        this._stoper += this._timeBefore - this._timeAfter;
        if (this._stoper > this._difficulty) {
            this._currentY += 1;
            this._stoper = 0;
        }
        if (this.checkCollision(this._currentSchema, 0, 0)) {
            this.setSolid();
            this.getNewBlock();
        }
        this.checkLines();
        this.render();
        requestAnimationFrame(this.update);
        this._timeAfter = performance.now();
    };
    MainGame.prototype.render = function () {
        var ctx = this._ctx;
        var canvas = this._canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000b1f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (var y = 0; y < this._height; y++) {
            for (var x = 0; x < this._width; x++) {
                ctx.fillRect(x * this._obstacle_size, y * this._obstacle_size, this._obstacle_size, this._obstacle_size);
                this.drawBlock(x * this._obstacle_size, y * this._obstacle_size, this._colors[this._landed[y][x]]);
            }
        }
        for (var y = 0; y < this._currentSchema.length; y++) {
            for (var x = 0; x < this._currentSchema[y].length; x++) {
                if (this._currentSchema[y][x] === 1) {
                    this.drawBlock((x + this._currentX) * this._obstacle_size, (y + this._currentY) * this._obstacle_size, this._colors[this.__blocks[this._currentBlockIndex].colors]);
                }
            }
        }
        for (var i = 0; i < this._nextBlockIndexes.length; i++) {
            for (var y = 0; y < this.__blocks[this._nextBlockIndexes[i]].schema.length; y++) {
                for (var x = 0; x < this.__blocks[this._nextBlockIndexes[i]].schema[y].length; x++) {
                    if (this.__blocks[this._nextBlockIndexes[i]].schema[y][x] === 1) {
                        this.drawBlock((x + this._width) * this._obstacle_size + 32, y * this._obstacle_size + ((i + 1) * 128), this._colors[this.__blocks[this._nextBlockIndexes[i]].colors]);
                    }
                }
            }
        }
        ctx.font = '30px arial';
        ctx.fillStyle = 'white';
        ctx.fillText("Wynik: " + this._score, (this._width + 1) * this._obstacle_size, 64);
        ctx.font = '16px arial';
        ctx.fillText("Kolejny obiekt:", (this._width + 1) * this._obstacle_size, 90);
    };
    MainGame.prototype.drawBlock = function (x, y, colors) {
        this._ctx.fillStyle = colors;
        this._ctx.fillRect(x, y, this._obstacle_size, this._obstacle_size);
    };
    MainGame.prototype.checkCollision = function (schema, offsetX, offsetY) {
        for (var y = 0; y < schema.length; y++) {
            for (var x = 0; x < schema[y].length; x++) {
                var pieceY = y + this._currentY + offsetY;
                var pieceX = x + this._currentX + offsetX;
                if (schema[y][x] !== 0 && pieceY > 0
                    && (pieceY >= this._height
                        || pieceX < 0
                        || pieceX > this._width
                        || this._landed[pieceY][pieceX] !== 0)) {
                    return true;
                }
            }
        }
        return false;
    };
    MainGame.prototype.setSolid = function () {
        for (var y = 0; y < this._currentSchema.length; y++) {
            for (var x = 0; x < this._currentSchema[y].length; x++) {
                if (this._currentSchema[y][x] === 1) {
                    this._landed[y + this._currentY - 1][x + this._currentX] = this.__blocks[this._currentBlockIndex].colors;
                }
            }
        }
    };
    MainGame.prototype.onPressKeyboard = function (event) {
        switch (event.code) {
            case 'ArrowUp':
                var newSchema = MainGame.rotateClockwise(this._currentSchema);
                if (!this.checkCollision(newSchema, 0, 0)
                    && !this.checkCollision(newSchema, 0, 1)) {
                    this._currentSchema = newSchema;
                }
                break;
            case 'ArrowLeft':
                if (!this.checkCollision(this._currentSchema, -1, 0)) {
                    this._currentX -= 1;
                }
                break;
            case 'ArrowRight':
                if (!this.checkCollision(this._currentSchema, 1, 0)) {
                    this._currentX += 1;
                }
                break;
            case 'ArrowDown':
                if (!this.checkCollision(this._currentSchema, 0, 1)) {
                    this._currentY += 1;
                    this._stoper = 0;
                }
                break;
            case 'Space':
                while (!this.checkCollision(this._currentSchema, 0, 1)) {
                    this._currentY += 1;
                    this._stoper = 0;
                }
                break;
        }
    };
    MainGame.prototype.getNewBlock = function () {
        if (this._nextBlockIndexes.length === 0) {
            for (var i = 0; i < this._next_obstacle; i++) {
                this._nextBlockIndexes.push(Math.floor(Math.random() * (this.__blocks.length - 0.5)));
            }
        }
        this._currentBlockIndex = this._nextBlockIndexes[0];
        this._currentSchema = MainGame.copy(this.__blocks[this._currentBlockIndex].schema);
        this._nextBlockIndexes.shift();
        this._nextBlockIndexes.push(Math.floor(Math.random() * (this.__blocks.length - 0.5)));
        for (var i = 0; i < Math.random() * 4; i++) {
            this._currentSchema = MainGame.rotateClockwise(this._currentSchema);
        }
        this._currentY = -this._currentSchema.length + 1;
        this._currentX = Math.floor((this._width / 2) - (this._currentSchema[0].length / 2));
    };
    MainGame.getNewArray = function (width, height) {
        var newArray = [];
        for (var y = 0; y < height; y++) {
            newArray.push([]);
            for (var x = 0; x < width; x++) {
                newArray[y].push(0);
            }
        }
        return newArray;
    };
    MainGame.copy = function (arr) {
        return JSON.parse(JSON.stringify(arr));
    };
    MainGame.rotateClockwise = function (arr) {
        var transformedArray = [];
        var M = arr.length;
        var N = arr[0].length;
        for (var y = 0; y < N; y++) {
            transformedArray.push([]);
            for (var x = 0; x < M; x++) {
                transformedArray[y].push([]);
            }
        }
        for (var y = 0; y < M; y++) {
            for (var x = 0; x < N; x++) {
                transformedArray[x][M - 1 - y] = arr[y][x];
            }
        }
        return transformedArray;
    };
    MainGame.prototype.checkLines = function () {
        var linesToShift = [];
        for (var y = this._height - 1; y > 0; y--) {
            var blocksInRow = 0;
            for (var x = 0; x < this._width; x++) {
                if (this._landed[y][x] !== 0) {
                    blocksInRow++;
                }
            }
            if (blocksInRow === this._width) {
                linesToShift.push(y);
            }
        }
        switch (linesToShift.length) {
            case 0:
                break;
            case 1:
                this._score += 50;
                break;
            case 2:
                this._score += 100;
                break;
            case 3:
                this._score += 200;
                break;
            case 4:
                this._score += 300;
                break;
            default:
                this._score += 400 + (400 * linesToShift.length);
                break;
        }
        for (var _i = 0, linesToShift_1 = linesToShift; _i < linesToShift_1.length; _i++) {
            var line = linesToShift_1[_i];
            this.shiftLines(line);
        }
    };
    MainGame.prototype.shiftLines = function (line) {
        for (var y = line; y > 0; y--) {
            if (line === 0) {
                this._landed[y][0] = 0;
            }
            for (var x = 0; x < this._width; x++) {
                this._landed[y][x] = this._landed[y - 1][x];
            }
        }
    };
    return MainGame;
}());
