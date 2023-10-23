import { Board, Generator } from './board'
import { Model } from './model'
import { View } from './view'
import { Controller } from './controller'

class SequenceGenerator implements Generator<string> {
    private sequence: string
    private index: number

    constructor(sequence: string) {
        this.sequence = sequence
        this.index = 0
    }

    next(): string {
        const n = this.sequence.charAt(this.index)
        this.index = (this.index + 1) % this.sequence.length
        return n
    }
}

class GeneratorFake<T> implements Generator<T> {
    private upcoming: T[]

    constructor(...upcoming: T[]) {
        this.upcoming = upcoming
    }

    prepare(...e: T[]) {
        this.upcoming.push(...e)
    }

    next(): T {
        let v = this.upcoming.shift()
        if (v === undefined) 
            throw new Error('Empty queue')
        else
            return v
    }

}

class RandGenerator implements Generator<String>{
    private characters: string
    constructor(characters){
        this.characters = characters
    }
    next(): string {
        const randomIndex = Math.floor(Math.random() * this.characters.length)
        return this.characters[randomIndex]
    }
}

async function init() {
    const generator = new SequenceGenerator("ABC")
    const board = new Board<String>(generator, 9, 9)
    const model = new Model<String>(board)
    const controller = new Controller<String>(model)
    const view = new View(window, controller)
    model.addObserver(m => view.view(m))
    view.view(model)
}

init()
