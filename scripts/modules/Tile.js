'use strict';

class Tile {
    
    constructor(grid, {structure, colour}) {
        this.grid = grid;
        this.structure = structure;
        this.colour = colour;
        this.pos = {
            x: Math.floor(grid.width / 2 - this.structure[0].length / 2),
            y: 0
        };
        this.drawPos = {
            x: this.pos.x,
            y: this.pos.y
        }
        this.animationDuration = 50;
    }

    getSides(x, y) {
        // Returns an array of sides that are connected to another cell
        // Top, clockwise
        return [
            y > 0 && this.structure[y - 1][x],
            x < this.structure[0].length - 1 && this.structure[y][x + 1],
            y < this.structure.length - 1 && this.structure[y + 1][x],
            x > 0 && this.structure[y][x - 1]
        ];
    }

    detectCollision(game, transform) {
        for (const cell of this) {
            if (!cell.filled) continue;
            const abs = transform(cell);
            const rel = { x: abs.x - this.pos.x, y: abs.y - this.pos.y };
            if (abs.x < 0 || abs.x >= game.grid.width || abs.y < 0 || abs.y >= game.grid.height) return true;
            // Compares each cell of this tile to cells in every other tile
            // Fairly inefficient but there are never many tiles so should not be an issue
            for (const otherTile of game.tiles) {
                for (const otherCell of otherTile) {
                    if (!otherCell.filled) continue;
                    if (otherCell.x === abs.x && otherCell.y === abs.y) return true;
                }
            }
        }
        return false;
    }

    hardDrop(game) {
        const offsetY = this.getHeightAboveGround(game);
        if (offsetY === 0) return;
        this.pos.y += offsetY;
        game.addAnimation(createLinearAnimation({
            obj: this.drawPos,
            prop: 'y',
            finalValue: this.pos.y,
            startTime: game.currentTime,
            duration: this.animationDuration
        }));
        game.resetUpdateInterval();
        game.currentScore += offsetY;
    }

    moveDown(game) {
        const transform = ({x, y}) => ({x, y: y + 1});
        const collision = this.detectCollision(game, transform);
        if (!collision) {
            this.pos.y++;
            game.addAnimation(createLinearAnimation({
                obj: this.drawPos,
                prop: 'y',
                finalValue: this.pos.y,
                startTime: game.currentTime,
                duration: this.animationDuration
            }));
        }
        return (!collision);
    }
    
    moveLeft(game) {
        const transform = ({x, y}) => ({x: x - 1, y});
        const collision = this.detectCollision(game, transform);
        if (!collision) {
            this.pos.x--;
            game.addAnimation(createLinearAnimation({
                obj: this.drawPos,
                prop: 'x',
                finalValue: this.pos.x,
                startTime: game.currentTime,
                duration: this.animationDuration
            }));
        }
        return (!collision);
    }

    moveRight(game) {
        const transform = ({x, y}) => ({x: x + 1, y});
        const collision = this.detectCollision(game, transform);
        if (!collision) {
            this.pos.x++;
            game.addAnimation(createLinearAnimation({
                obj: this.drawPos,
                prop: 'x',
                finalValue: this.pos.x,
                startTime: game.currentTime,
                duration: this.animationDuration
            }));
        }
        return (!collision);
    }

    rotate(game) {
        const transform = ({relX, relY}) => ({x: this.pos.x + this.structure.length - relY - 1, y: this.pos.y + relX});
        const collision = this.detectCollision(game, transform);
        if (!collision) {
            const newStruct = new Array(this.structure.length).fill(null).map(x => new Array(this.structure.length).fill(0));
            for (let i = 0; i < this.structure.length; i++) {
                for (let j = 0; j < this.structure[i].length; j++) {
                    newStruct[j][i] = this.structure[this.structure.length - i - 1][j];
                }
            }
            this.structure = newStruct;
        }
        return (!collision); 
    }

    trimEmpty() {
        // Remove empty rows
        while (this.structure[this.structure.length - 1].every(x => x === 0)) this.structure.pop();
    }

    getHeightAboveGround(game) {
        let offsetY = 0;
        while (!this.detectCollision(game, ({x, y}) => ({x, y: y + offsetY}) )) offsetY++;
        return --offsetY;
    }

    projectDown(game) {
        const offsetY = this.getHeightAboveGround(game);
        game.ctx.strokeStyle = "#ffffff";
        this.render({
            ctx: game.ctx,
            size: game.cellSize,
            fill: false,
            stroke: true,
            offset: {
                x: this.pos.x - this.drawPos.x,
                y: offsetY + (this.pos.y - this.drawPos.y)
            }
        });
    }

    renderPreview(ctx) {
        this.drawPos = { x: 0, y: 0 };
        this.render({
            ctx,
            size: ctx.canvas.width / Math.max(this.structure.length, this.structure[0].length),
            fill: true,
            stroke: false
        });
        this.drawPos = {
            x: this.pos.x,
            y: this.pos.y
        }
    }

    render({ ctx, size, fill = true, stroke = false, offset = {x: 0, y: 0} }) {
        ctx.fillStyle = this.colour;
        ctx.strokeStyle = this.colour;
        for (const cell of this) {
            if (cell.filled) {
                cell.render({
                    ctx, size, fill, stroke, offset,
                    sides: this.getSides(cell.relX, cell.relY)
                });
            }
        }
    }

    [Symbol.iterator]() {
        // Return arr with coordinates for each cell
        const struct = [];
        for (let y = 0; y < this.structure.length; y++) {
            for (let x = 0; x < this.structure[0].length; x++) {
                struct.push(new Cell({
                    relX: x,
                    relY: y,
                    x: x + this.pos.x,
                    y: y + this.pos.y,
                    drawX: x + this.drawPos.x,
                    drawY: y + this.drawPos.y,
                    filled: this.structure[y][x]
                }));
            }
        }
        return struct.values();
    }


    /*
     * TILE TYPES
     */

    static randomTile() {
        const tileIndex = Math.floor(Math.random() * 7);
        switch (tileIndex) {
            case 0 : return Tile.I;
            case 1 : return Tile.O;
            case 2 : return Tile.J;
            case 3 : return Tile.L;
            case 4 : return Tile.S;
            case 5 : return Tile.T;
            case 6 : return Tile.Z;
            default: throw "uhm what";
        }
    }

    static get I() { return {
        colour: "#0092ff",
        structure: [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    }}

    static get O() { return {
        colour: "#4900ff",
        structure: [
            [1, 1],
            [1, 1],
        ]
    }} 

    static get J() { return {
        colour: "#ff0000",
        structure: [
            [0, 1, 0],
            [0, 1, 0],
            [1, 1, 0]
        ]
    }}

    static get L() { return {
        colour: "#49ff00",
        structure: [
            [1, 0, 0],
            [1, 0, 0],
            [1, 1, 0]
        ]
    }}

    static get S() { return {
        colour: "#00ff92",
        structure: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ]
    }}

    static get T() { return {
        colour: "#ffdb00",
        structure: [
            [1, 1, 1],
            [0, 1, 0],
            [0, 0, 0]
        ]
    }}

    static get Z() { return {
        colour: "#ff00db",
        structure: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ]
    }}

}
