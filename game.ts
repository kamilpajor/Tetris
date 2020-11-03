class MainGame {
  private readonly _canvas : HTMLCanvasElement;
  private readonly _ctx : CanvasRenderingContext2D;

  private _colors = [
    'black', '#CC33CC', '#CC99CC', '#6633FF', '#CC0099', '#FFCCFF', '#CC3399', '#CC0066'
  ];

  private __blocks = [
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

  private readonly _width = 10;
  private readonly _height = 20;
  private readonly _obstacle_size = 32;
  private readonly _next_obstacle = 4;

  private _landed = [];
  private _currentX = 0;
  private _currentY = 0;
  private _currentBlockIndex;
  private _nextBlockIndexes = [];
  private _currentSchema;
  private _difficultyEasy = document.getElementById("diff_easy");
  private _difficultyMedium = document.getElementById("diff_medium");
  private _difficultyHard = document.getElementById("diff_hard");
  private _timeBefore = 0;
  private _timeAfter = 0;
  private _stoper = 0;
  private _score = 0;
  private _difficulty = 500;
  private _newGame = document.getElementById("new_game");

  public constructor(selector : string) {
    this._canvas = document.querySelector(selector) as HTMLCanvasElement;
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

  public run() {
    window.addEventListener('keydown', this.onPressKeyboard, false);
    this._difficultyEasy.addEventListener('click', (e:Event) => this.diff_lvl_easy());
    this._difficultyMedium.addEventListener('click', (e:Event) => this.diff_lvl_medium());
    this._difficultyHard.addEventListener('click', (e:Event) => this.diff_lvl_hard());
    this._newGame.addEventListener('click', (e:Event) => this.new_game());
    this._landed = MainGame.getNewArray(this._width, this._height);
    this.getNewBlock();
    this.update();
  }
  private new_game() {
    window.location.reload(true);
  }
  private diff_lvl_easy() {
    this._difficulty = 500;
  }
  private diff_lvl_medium() {
    this._difficulty = 350;
  }
  private diff_lvl_hard() {
    this._difficulty = 200;
  }
  private update() {
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
  }
  


  private render() {
    const ctx = this._ctx;
    const canvas = this._canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000b1f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < this._height; y++) {
      for (let x = 0; x < this._width; x++) {
        ctx.fillRect(x * this._obstacle_size, y * this._obstacle_size, this._obstacle_size, this._obstacle_size)
        this.drawBlock(
          x * this._obstacle_size,
          y * this._obstacle_size,
          this._colors[this._landed[y][x]]
        )
      }
    }

    for (let y = 0; y < this._currentSchema.length; y++) {
      for (let x = 0; x < this._currentSchema[y].length; x++) {
        if (this._currentSchema[y][x] === 1) {
          this.drawBlock(
            (x + this._currentX) * this._obstacle_size,
            (y + this._currentY) * this._obstacle_size,
            this._colors[this.__blocks[this._currentBlockIndex].colors]
          )
        }
      }
    }

    for (let i = 0; i < this._nextBlockIndexes.length; i++) {
      for (let y = 0; y < this.__blocks[this._nextBlockIndexes[i]].schema.length; y++) {
        for (let x = 0; x < this.__blocks[this._nextBlockIndexes[i]].schema[y].length; x++) {
          if (this.__blocks[this._nextBlockIndexes[i]].schema[y][x] === 1) {
            this.drawBlock(
              (x + this._width) * this._obstacle_size + 32,
              y * this._obstacle_size + ((i + 1) * 128),
              this._colors[this.__blocks[this._nextBlockIndexes[i]].colors]
            )
          }
        }
      }
    }

    ctx.font = '30px arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Wynik: ${this._score}`, (this._width + 1) * this._obstacle_size, 64);

    ctx.font = '16px arial';
    ctx.fillText(`Kolejny obiekt:`, (this._width + 1) * this._obstacle_size, 90);

  }

  private drawBlock(x : number, y : number, colors : string) {
    this._ctx.fillStyle = colors;
    this._ctx.fillRect(
      x,
      y,
      this._obstacle_size,
      this._obstacle_size
    )
  }

  private checkCollision(schema : Array<Array<number>>, offsetX : number, offsetY : number) : boolean {
    for (let y = 0; y < schema.length; y++) {
      for (let x = 0; x < schema[y].length; x++) {
        const pieceY = y + this._currentY + offsetY;
        const pieceX = x + this._currentX + offsetX;

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
  }

  private setSolid() {
    for (let y = 0; y < this._currentSchema.length; y++) {
      for (let x = 0; x < this._currentSchema[y].length; x++) {
        if (this._currentSchema[y][x] === 1) {
          this._landed[y + this._currentY - 1][x + this._currentX] = this.__blocks[this._currentBlockIndex].colors;
        }
      }
    }
  }

  private onPressKeyboard(event) {
    switch (event.code) {
      case 'ArrowUp':
        const newSchema = MainGame.rotateClockwise(this._currentSchema);
        if (!this.checkCollision(newSchema, 0, 0)
          && !this.checkCollision(newSchema, 0, 1)
        ) {
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
  }

  private getNewBlock() {
    if (this._nextBlockIndexes.length === 0) {
      for(let i = 0; i < this._next_obstacle; i++) {
        this._nextBlockIndexes.push(Math.floor(Math.random() * (this.__blocks.length - 0.5)));
      }
    }
    this._currentBlockIndex = this._nextBlockIndexes[0];
    this._currentSchema = MainGame.copy(this.__blocks[this._currentBlockIndex].schema);
    this._nextBlockIndexes.shift();
    this._nextBlockIndexes.push(Math.floor(Math.random() * (this.__blocks.length - 0.5)));

    for (let i = 0; i < Math.random() * 4; i++) {
      this._currentSchema = MainGame.rotateClockwise(this._currentSchema);
    }

    this._currentY = -this._currentSchema.length + 1;
    this._currentX = Math.floor((this._width / 2) - (this._currentSchema[0].length / 2));
  }

  private static getNewArray(width : number, height : number) : Array<Array<number>>{
    let newArray = [];
    for (let y = 0; y < height; y++) {
      newArray.push([]);
      for(let x = 0; x < width; x++) {
        newArray[y].push(0);
      }
    }

    return newArray;
  }

  private static copy(arr : Array<Array<number>>) : Array<Array<number>> {
    return JSON.parse(JSON.stringify(arr));
  }

  private static rotateClockwise(arr : Array<Array<number>>) : Array<Array<number>> {
    let transformedArray = [];

    const M = arr.length;
    const N = arr[0].length;

    for (let y = 0; y < N; y++) {
      transformedArray.push([]);
      for (let x = 0; x < M; x++) {
        transformedArray[y].push([]);
      }
    }

    for (let y = 0; y < M; y++) {
      for (let x = 0; x < N; x++) {
        transformedArray[x][M - 1 - y] = arr[y][x];
      }
    }

    return transformedArray;
  }

  private checkLines() {
    let linesToShift = [];
    for (let y = this._height - 1; y > 0; y--) {
      let blocksInRow = 0;
      for (let x = 0; x < this._width; x++) {
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
        this._score += 400 + ( 400 * linesToShift.length)
        break;
    }

    for (const line of linesToShift) {
      this.shiftLines(line);
    }
  }

  private shiftLines(line : number) {
    for (let y = line; y > 0; y--) {
      if (line === 0) {
        this._landed[y][0] = 0;
      }
      for (let x = 0; x < this._width; x++) {
        this._landed[y][x] = this._landed[y-1][x];
      }
    }
  }
 }