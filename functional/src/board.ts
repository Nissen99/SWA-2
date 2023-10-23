export type Generator<T>= { next:() => T } 

export type Position = {
    row: number,
    col: number
}    

export type Match<T> = {
    matched: T,
    positions: Position[]
}    

export type Board<T> = {
    width: number,
    height: number,
    tiles: Tile<T>[]
};

export type Effect<T> = {
    kind: T,
    match: Match<T>,
    board: Board<T>
};

export type MoveResult<T> = {
    board: Board<T>,
    effects: Effect<T>[]
}    

export function create<T>(generator: Generator<T>, width: number, height: number): Board<T> {
    return {
        width: width,
        height: height,
        tiles: generateTiles<T>(generator, width, height)
    }
}    

export function piece<T>(board: Board<T>, p: Position): T | undefined {
    const tile = getTileByPosition(board, p)
    if (!tile) return
    return tile.value
}    

export function positions<T>(board: Board<T>): Position[] {
    return board.tiles.map(tile => tile.position)
}

export function canMove<T>(board: Board<T>, first: Position, second: Position): boolean {
    if (isDiagonalMove(first, second)) return false

    const tempTiles = swapTiles(board, first, second)
    const tempBoard = createTempBoard(board, tempTiles)
    
    const hMatches = getHorisontalMatches(tempBoard)
    const vMatches = getVerticalMatches(tempBoard)
    const matches = [...hMatches, ...vMatches]

    if (matches.length === 0) return false
    return true
}

export function move<T>(generator: Generator<T>, board: Board<T>, first: Position, second: Position): MoveResult<T> {
    if (!canMove(board, first, second)) return {board: board, effects: []}
    
    const newTiles = swapTiles(board, first, second)
    const tempBoard = createTempBoard(board, newTiles)
    const matches = findMatches(tempBoard)
    return processMove(generator,tempBoard, matches)
}

type Tile<T> = {
    value: T,
    position: Position
}
function createTempBoard<T>(board: Board<T>, tiles: Tile<T>[]): Board<T>{
    return {...board, tiles: tiles}
}

const createPosition = (row: number, col:number): Position => {
    return {row: row, col: col}
}

const positionsEqual = (first: Position, second: Position) => first.col === second.col && first.row === second.row



const createEffect = <T>(kind: string, match: Match<T> | null, board: Board<T> | null):Effect<T> => {
    if (kind === "Match"){
        return {
            kind: kind as T,
            match: match
        } as Effect<T>
    } else {
        return {
            kind: kind as T,
            match: match,
            board: board            
        }
    }
}

const createHorisontalMatchPositions = (matchCount: number, rowIndex: number, colIndex:number) => 
    Array.from({length: matchCount}, (_, i) =>{
    const col = colIndex - i - 1
    return createPosition(rowIndex, col)
}).sort((a,b) => a.col - b.col)

const createVerticalMatchPositions = (matchCount: number, rowIndex: number, colIndex:number) => 
    Array.from({length: matchCount}, (_, i) => {
    const row = rowIndex - i -1
    return createPosition(row, colIndex)
}).sort((a,b) => a.row - b.row)

const createMatch = <T>(
    matchOn: T, 
    matchCount: number, 
    rowIndex: number, 
    colIndex: number, 
    fn: (matchCount: number, rowIndex: number, colIndex: number) => Position[]
): Match<T> => {
    return {
        matched: matchOn,
        positions: fn(matchCount, rowIndex, colIndex)
    }
}

const findMatches = <T>(board: Board<T>): Match<T>[] => [...getHorisontalMatches(board), ...getVerticalMatches(board)]

const generateTile = <T>(generator: Generator<T>, row: number, col: number): Tile<T> => {
    return {
        value: generator.next(),
        position: createPosition(row, col)
    }
}
const generateTiles = <T>(generator: Generator<T>, width: number, height: number): Tile<T>[] => 
    Array.from({length: height}, (_, row) => 
        Array.from({length: width}, (_, col) => generateTile(generator, row, col))
    ).flat()

const getTileByPosition = <T>(board: Board<T>, p: Position): Tile<T> => 
    board.tiles.find(t => t.position.col === p.col && t.position.row === p.row)

const setTile = <T>(board: Board<T>, p: Position, value: T) => {
    return board.tiles.map(tile => {
        if (tile.position.col === p.col && tile.position.row === p.row){
            return {value: value, position: p}
        } else {
            return tile
        }
    })
}

const boardIsFull = <T>(board: Board<T>) => !board.tiles.some(tile => tile.value === "*")
const isDiagonalMove = (first: Position, second: Position) => first.col !== second.col && first.row !== second.row
const tileHasValue = <T>(tile: Tile<T>) => tile.value !== "*"


function removeTiles<T>(board: Board<T>, tiles: Position[]): Board<T>{
    function helper(boardN: Board<T>, tiles: Position[]){
        if (tiles.length === 0) {
            return boardN
        }
        const [head, ...tail] = tiles
        const newTiles = setTile(boardN, head, "*" as T)
        const newBoard = createTempBoard(boardN, newTiles)
        return helper(newBoard, tail)
    }
    return helper(board, tiles)
} 

function swapTiles<T>(board: Board<T>, first: Position, second: Position): Tile<T>[] {
    return board.tiles.map(tile => {
        if (positionsEqual(tile.position, first)){
            return {value: piece(board, second), position: tile.position}
        } else if(positionsEqual(tile.position, second)){
            return {value: piece(board, first), position: tile.position}
        } else {
            return tile
        }
    })
}
function getHorisontalMatches<T>(board: Board<T>): Match<T>[] {
    const matches = Array(board.height).fill(Array(board.width).fill((f) => {
        return f
    })).flat()
    console.log(matches)

    return
}

function getHorisontalMatches2<T>(board: Board<T>): Match<T> []{
    let matches = []
    let matchCount = 1
    let matchOnValue
    for (let i = 0; i < board.height; i++){
        matchCount = 1
        matchOnValue = piece(board, {row:i, col:0})
        for (let j = 1; j < board.width; j++) {
            let tile = piece(board, {row: i, col: j})
            if (tile === matchOnValue){
                matchCount++
                continue
            } else if (tile !== matchOnValue && matchCount >= 3){
                matches.push(createMatch(matchOnValue, matchCount, i, j, createHorisontalMatchPositions))
            } 
            matchCount = 1
            matchOnValue = tile                
        }
        if (matchCount >= 3){
            matches.push(createMatch(matchOnValue, matchCount, i, board.width, createHorisontalMatchPositions))
        }        
    }
    return matches   
}

function getVerticalMatches<T>(board: Board<T>): Match<T> []{
    let matches = []
    let matchCount = 1
    let matchOnValue
    for (let i = 0; i < board.width; i++){
        matchCount = 1
        matchOnValue = piece(board, {row:0, col:i})
        for (let j = 1; j < board.height; j++) {
            let tile = piece(board, {row: j, col: i})
            if (tile === matchOnValue){
                matchCount++
                continue
            } else if (tile !== matchOnValue && matchCount >= 3){
                matches.push(createMatch(matchOnValue, matchCount, j, i, createVerticalMatchPositions))
            } 
            matchCount = 1
            matchOnValue = tile                
        }
        if (matchCount >= 3){
            matches.push(createMatch(matchOnValue, matchCount, board.height, i, createVerticalMatchPositions))
        }        
    }
    return matches   
}

function refill<T>(generator: Generator<T>, board: Board<T>): Board<T>{
    function helper(generator: Generator<T>, currentBoard: Board<T>, currentCol: number){
        const nextCol = (currentCol + 1) % currentBoard.width
        if (boardIsFull(currentBoard)) return currentBoard

        const tile = getTileByPosition(currentBoard, {row: 0, col: currentCol})
        if (tileHasValue(tile)){
            return helper(generator, currentBoard, nextCol)
        }

        const updatedTile = {...tile, value: generator.next()}
        const updatedTiles = setTile(currentBoard, tile.position, updatedTile.value)
        const updatedBoard = createTempBoard(currentBoard, updatedTiles)
        const shiftedBoard = shiftDownTiles(updatedBoard)
        
        return helper(generator, shiftedBoard, nextCol)
    }
    return helper(generator, board, 0)
}

function processMove<T>(generator: Generator<T>, board: Board<T>, matches: Match<T>[]): MoveResult<T>{
    
    function helper(generator: Generator<T>, currentBoard: Board<T>, currentMatches: Match<T>[], currentEffects: Effect<T>[]): MoveResult<T>{
        if (currentMatches.length === 0){
            return {board: currentBoard, effects: currentEffects}
        }
        
        const matchEffects = currentMatches.map((match) => {
            return createEffect("Match", match, currentBoard)
        })
        const tiles = currentMatches.flatMap(match => [...match.positions])
        const removedTiles = removeTiles(currentBoard, tiles)
        const shiftedBoard = shiftDownTiles(removedTiles)
        const refilledBoard = refill(generator, shiftedBoard)
        const refillEffect = createEffect("Refill", null, refilledBoard)
        const effects = [...currentEffects, ...matchEffects, refillEffect]
        const newMatches = findMatches(refilledBoard)
        return helper(generator, refilledBoard, newMatches, effects)
    }
    return helper(generator, board, matches, [])
}

function shiftDownTiles<T>(board: Board<T>): Board<T>{
    const newBoard = createTempBoard(board, board.tiles)
    function helper(board: Board<T>, tiles: Tile<T>[], currentIndex: number): Board<T>{
        const [head, ...tail] = tiles
        if (!head) return board

        const newBoard = handleFloaters(board, head.position)
        return helper(newBoard, tail, currentIndex++)
    }
    const reversedTiles = newBoard.tiles.reverse()
    const result = helper(board, reversedTiles, 0)
    return createTempBoard(result, result.tiles.reverse())
}

function handleFloaters<T>(board: Board<T>, p: Position): Board<T>{
    const tile = getTileByPosition(board, p)
    const positionBelow = {row: tile.position.row + 1, col: tile.position.col}
    const tileValueBelow = piece(board, positionBelow)

    if (tileValueBelow === "*"){
        const newTiles = swapTiles(board, positionBelow, tile.position)
        const newBoard = createTempBoard(board, newTiles)
        return handleFloaters(newBoard, positionBelow)
    }
    return board    
}
