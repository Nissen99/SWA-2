export type Generator<T>= { next:() => T } 

export type Position = {
    row: number,
    col: number
}

type Tile<T> = {
    value: T,
    position: Position
}

export type Match<T> = {
    matched: T,
    positions: Position[]
}
type Refill = {
    kind: "Refill"
}

type MatchEvent<T> = {
    kind: "Match",
    match: Match<T>
}

export type BoardEvent<T> = Refill | MatchEvent<T>;

export type BoardListener<T> = (event: BoardEvent<T>) => void;

export class Board<T> {
    readonly width: number
    readonly height: number
    generator: Generator<T>
    tiles: Tile<T>[]
    matches: Match<T>[]
    listeners: BoardListener<T>[]

    // Constructor here
    constructor(generator: Generator<T>, width: number, height: number){
        this.generator = generator
        this.width = width
        this.height = height
        this.tiles = []
        this.matches = []
        this.listeners = []

        this.generateBoard()
    }

    generateBoard(){
        for (let i = 0; i < this.height; i++){
            for (let j = 0; j < this.width; j++){
                let position: Position = {row: i, col: j}
                let value = this.generator.next()
                let tile = {value: value, position: position}
                this.tiles.push(tile)
            }
        }
    }

    getTileByPosition(p: Position): Tile<T> {
        return this.tiles.find(tile => tile.position.row === p.row && tile.position.col === p.col)
    }

    swapTiles(first: Position, second: Position) {
        let firstValue = this.piece(first);
        let secondValue = this.piece(second);

        this.setTile(first, secondValue);
        this.setTile(second, firstValue);
    }

    setTile(p: Position, value : T){
        this.tiles.find(tile => tile.position.col === p.col && tile.position.row === p.row).value = value;
    }

    addListener(listener: BoardListener<T>) {
        this.listeners.push(listener)
    }

    positions(): Position[] {
        return this.tiles.map(tile => tile.position)
    }

    piece(p: Position): T | undefined {
        let piece = this.getTileByPosition(p)
        if (!piece) return undefined

        return piece.value
    }

    canMove(first: Position, second: Position): boolean {
        if (this.isDiagonalMove(first, second)) return false
        if (this.isOutOfBounds(first, second)) return false

        this.swapTiles(first, second)       

        let hMatches = this.getHorisontalMatches()
        let vMatches = this.getVerticalMatches()

        this.matches = [...hMatches, ...vMatches]
        this.swapTiles(first, second)
        if (this.matches.length === 0) return false;
        return true 
    }

    isOutOfBounds(first: Position, second: Position): boolean {
        let p1 = this.piece(first)
        let p2 = this.piece(second)
        return p1 === undefined || p2 === undefined
    }

    isDiagonalMove(first: Position, second: Position): boolean {
        return first.col !== second.col && first.row !== second.row
    }
    // private getMatches(isVertical: boolean): Match<T>[] {
    //     let matches = []
    //     let matchCount = 1
    //     let matchOnValue
    //     for (let i = 0; i < (isVertical ? this.width : this.height); i++) {
    //         matchCount = 1
    //         matchOnValue = this.piece(isVertical ? {row:0, col:i} : {row:i, col:0})
    //         for (let j = 1; j < (isVertical ? this.height : this.width); j++){
    //             let tile = this.piece(isVertical ? {row: j, col: i}: {row: i, col: j})

    //             if (tile === matchOnValue){
    //                 matchCount++
    //                 continue
    //             } else if (tile !== matchOnValue && matchCount >= 3){
    //                 matches = isVertical ? this.updateVerticalMatches(j, i, matchCount, matches)
    //                                     : this.updateHorisontalMatches(i, j, matchCount, matches)
    //             } 
    //             matchCount = 1
    //             matchOnValue = tile 
    //         }
    //         if (matchCount >= 3){
    //             matches = isVertical ? this.updateVerticalMatches(this.height, i, matchCount, matches) 
    //                                 : this.updateHorisontalMatches(i, this.width, matchCount, matches)
    //         }   
    //     }
    //     return matches
    // }

    private getHorisontalMatches(): Match<T>[]{
        let matches = []
        let matchCount = 1
        let matchOnValue
        for (let i = 0; i < this.height; i++){
            matchCount = 1
            matchOnValue = this.piece({row:i, col:0})
            for (let j = 1; j < this.width; j++) {
                let tile = this.piece({row: i, col: j})
                
                if (tile === matchOnValue){
                    matchCount++
                    continue
                } else if (tile !== matchOnValue && matchCount >= 3){
                    matches = this.updateHorisontalMatches(i, j, matchCount, matches)
                } 

                matchCount = 1
                matchOnValue = tile                
            }
            if (matchCount >= 3){
                matches = this.updateHorisontalMatches(i, this.width, matchCount, matches)
            }        
        }
        return matches
    }

    private getVerticalMatches(): Match<T>[]{
        let matches = []
        let matchCount = 1
        let matchOnValue
        for (let i = 0; i < this.width; i++){
            matchCount = 1
            matchOnValue = this.piece({row:0, col:i})
            for (let j = 1; j < this.height; j++) {
                let tile = this.piece({row: j, col: i})
                if (tile === matchOnValue){
                    matchCount++
                    continue
                } else if (tile !== matchOnValue && matchCount >= 3){
                    matches = this.updateVerticalMatches(j, i, matchCount, matches)
                } 
                matchCount = 1
                matchOnValue = tile                
            }
            if (matchCount >= 3){
                matches = this.updateVerticalMatches(this.height, i, matchCount, matches)
            }        
        }
        return matches
    }
    updateHorisontalMatches(currentRow:number, currentCol:number, count: number, matches: Match<T>[]){
        let matchOn = this.getTileByPosition({row:currentRow, col:currentCol-1}).value
        let positions: Position[] = []
        for (let j = currentCol - 1; j >= currentCol - count; j--){
            positions.push({row: currentRow, col: j})
        }
        positions.sort((a,b) => a.col - b.col)
        let match: Match<T> = {matched: matchOn, positions: [...positions]}
        matches.push(match)
        return matches
    }

    updateVerticalMatches(currentRow:number, currentCol:number, count: number, matches: Match<T>[]){
        let matchOn = this.getTileByPosition({row:currentRow - 1, col:currentCol}).value
        let positions: Position[] = []
        for (let j = currentRow - 1; j >= currentRow - count; j--){
            positions.push({row: j, col: currentCol})
        }
        positions.sort((a,b) => a.row - b.row)
        let match: Match<T> = {matched: matchOn, positions: [...positions]}
        matches.push(match)
        return matches
    }
    
    move(first: Position, second: Position) {
        if (!this.canMove(first, second)) return

        this.swapTiles(first, second)

        do {
            this.handleMatches()
            this.shiftDownTiles()
            this.replaceTiles()
            this.updateMatches()
        } while (this.matches.length > 0)
    }
    updateMatches(){
        let hMatches = this.getHorisontalMatches()
        let vMatches = this.getVerticalMatches()

        this.matches = [...hMatches, ...vMatches]
    }
    handleMatches(){
        for (let match of this.matches){
            let event: MatchEvent<T> = {
                kind: "Match",
                match: match
            }            
            this.removeTiles(match.positions)            
            this.fireEvent(event)
        }
    }


    replaceTiles(){
        let hasEmpty = false
        do {
            hasEmpty = false
            for (let i = 0; i < this.width; i++){
                let tile = this.getTileByPosition({row: 0, col: i})
                if (tile.value === "*"){
                    hasEmpty = true
                    this.setTile(tile.position, this.generator.next())
                    this.shiftDownTiles()
                }
            }
        } while (hasEmpty)
        let event: Refill = {kind: "Refill"} 
        this.fireEvent(event)
    }

    shiftDownTiles(){
        for (let i = this.tiles.length - 1; i >=0; i--){
            let tile = this.tiles[i]
            this.handleFloaters(tile.position)
        }
    }
    handleFloaters(p: Position){
        let tile = this.getTileByPosition(p)
        let positionBelow = {row: tile.position.row + 1, col: tile.position.col}
        let tileValueBelow = this.piece(positionBelow)

        if (tileValueBelow === "*"){
            this.swapTiles(positionBelow, tile.position)
            this.handleFloaters(positionBelow)
        }
    }

    removeTiles(p: Position[]){
        for (let pos of p){
            this.setTile(pos, "*" as T)
        }
    }

    fireEvent(event: BoardEvent<T>){
        for (let listener of this.listeners){
            listener(event)
        }
    }


}
