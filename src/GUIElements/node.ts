import { Path } from "two.js/src/path"
import { Group } from "two.js/src/group"
import { Vector } from "two.js/src/vector"
import { Text } from "two.js/src/text"
import Two from "two.js"

import { GraphNode, DataType } from "../Graph/node"
import { Gradient } from "two.js/src/effects/gradient"
import { Texture } from "two.js/src/effects/texture"
import { ConstantNode, DisplayNode } from "../Graph/nodeTypes"

export interface ConnectionInfo { 
    obj: DraggableNode, 
    data: { type: "input" | "output", index: number } 
}

export interface Connection {
    input: ConnectionInfo, 
    output: ConnectionInfo,
    line: Path
}

export class DraggableNode {

    static nodeWidth = 100
    static nodeHeight = 75

    public body: Path
    private label: Text
    protected group: Group
    protected node: GraphNode

    private inputHandles: Path[]
    protected inputLinks: {[key: number]: Connection}
    private outputHandles: Path[]
    protected outputLinks: {[key: number]: Connection[]}

    protected inputColors: string[]
    protected outputColors: string[]

    private active: boolean

    selected: {type: "input"|"output", index: number}|null

    name: string

    precedence: number

    constructor(two: Two, scene: Group, node: GraphNode) {
        this.precedence = scene.children.length
        this.group = new Group() as Group
        this.body = two.makeRoundedRectangle(0, 0, DraggableNode.nodeWidth, DraggableNode.nodeHeight, 10).addTo(this.group) as Path
        scene.children.unshift(this.group)
        this.body.fill = "lightgrey"
        this.label = two.makeText(node.name, 0, DraggableNode.nodeHeight / 2 + 10).addTo(this.group) as Text
        this.label.fill = "white"
        this.name = node.name
        this._initHandles(two, node)
        this.selected = null
        this.node = node
    }
    evaluate() {
        let inputs = Array.from(Object.values(this.inputLinks))
        if(inputs.includes(null)) {
            return null
        }
        inputs = inputs.map(connection => {
            let out = connection.output.obj.evaluate()
            if(out == null)
                return null
            else return out[connection.output.data.index]
        })
        if(inputs.includes(null)) {
            return null
        }
        return this.node.processor(...inputs)
    }

    mouseOver(mouse: Vector, checkOver: boolean = false): boolean {
        let rect = this.group.getBoundingClientRect()
        let boxRect = this.body.getBoundingClientRect()
        let labelRect = this.label.getBoundingClientRect()
        let height = rect.bottom - rect.top - (labelRect.bottom - labelRect.top)
        let changed = false
        if (checkOver) {
            if(this.inputHandles.length > 0) {
                // on input side
                let bounds = this.inputHandles[0].getBoundingClientRect()
                if (mouse.x > bounds.left && mouse.x < bounds.right && mouse.y > rect.top && mouse.y < boxRect.bottom) {
                    let selectedInput = Math.floor(this.inputHandles.length * (mouse.y - rect.top + 5) / height)
                    if(selectedInput >= 0 && selectedInput < this.inputHandles.length) {
                        // this.inputHandles.filter((handle, i) => handle.fill != "#fff" && i != selectedInput).forEach(handle => handle.fill = "#fff")
                        this.inputHandles
                            .map((handle, i) => [handle, this.inputColors[i]])
                            // .filter(([handle, color]: [handle: Path, color: string], i) => handle.fill != color && i != selectedInput)
                            .forEach(([handle, color]: [handle: Path, color: string]) => handle.fill = color)
                        
                        this.inputHandles[selectedInput].fill = "#fff"
                        this.selected = {type: "input", index: selectedInput}
                        changed = true
                    }
                }
            }
            if(this.outputHandles.length > 0) {
                let bounds = this.outputHandles[0].getBoundingClientRect()
                if (mouse.x > bounds.left && mouse.x < bounds.right && mouse.y > rect.top && mouse.y < boxRect.bottom) {
                    let selectedOutput = Math.floor(this.outputHandles.length * (mouse.y - rect.top + 5) / height)
                    if(selectedOutput >= 0 && selectedOutput < this.outputHandles.length) {
                        this.outputHandles
                            .map((handle, i) => [handle, this.outputColors[i]])
                            // .filter(([handle, color]: [handle: Path, color: string], i) => handle.fill != color && i != selectedOutput)
                            .forEach(([handle, color]: [handle: Path, color: string]) => handle.fill = color)
                        this.outputHandles[selectedOutput].fill = "#fff"
                        this.selected = {type: "output", index: selectedOutput}
                        changed = true
                    }
                }
            } if(!changed) {
                this.inputHandles.forEach((handle, i) => handle.fill = this.inputColors[i])
                this.outputHandles.forEach((handle, i) => handle.fill = this.outputColors[i])
                this.selected = null
            }
        }
        if(mouse.x > rect.left && mouse.x < rect.right
            && mouse.y > rect.top && mouse.y < boxRect.bottom) {
                return true
        } else {
            this.body.linewidth = 1
            this.body.stroke = "black"
            return false
        }
    }
    get position() {
        return this.group.position
    }
    private _initHandles(two: Two, node: GraphNode): void {
        this.inputHandles = []
        this.outputHandles = []
        this.inputLinks = []
        this.outputLinks = []
        this.inputColors = []
        this.outputColors = []
        Object.entries(node.inputs).forEach((input, index, array) => {
            this.inputLinks[index] = null
            let handle = two.makeCircle(-DraggableNode.nodeWidth / 2, (index + 1) * (DraggableNode.nodeHeight / (array.length + 1)) - DraggableNode.nodeHeight / 2, 7).addTo(this.group) as Path
            //@ts-ignore
            this.inputColors.push(input[1].color)
            handle.fill = this.inputColors[index-1]
            this.inputHandles.push(handle)
        })
        Object.entries(node.outputs).forEach((output, index, array) => {
            this.outputLinks[index] = []
            let handle = two.makeCircle(DraggableNode.nodeWidth / 2, (index + 1) * (DraggableNode.nodeHeight / (array.length + 1)) - DraggableNode.nodeHeight / 2, 7).addTo(this.group) as Path
            //@ts-ignore
            this.outputColors.push(output[1].color)
            handle.fill = this.outputColors[index-1]
            this.outputHandles.push(handle)
        })
    }
    handlePosition(type: "input"|"output", index: number): [number, number] {
        let pos = Two.Vector.add(this.group.position, (type == "input" ? this.inputHandles : this.outputHandles)[index].position)
        return [pos.x, pos.y]
    }
    get bounds() {
        return this.group.getBoundingClientRect()
    }
    connectInput(conn: Connection): boolean {
        if(!(conn.input.obj.inputColors[conn.input.data.index] == "#fff") && conn.input.obj.inputColors[conn.input.data.index] != conn.output.obj.outputColors[conn.output.data.index]) {
            return false
        }
        if(this.inputLinks[conn.input.data.index] == null) {
            this.inputLinks[conn.input.data.index] = conn
            return true
        }
        return false
    }
    disconnectInput(index: number) {
        let link = this.inputLinks[index]
        if(link == null) return
        link.output.obj.outputLinks[link.output.data.index] = link.output.obj.outputLinks[link.output.data.index].filter((k: Connection) => k.input.obj.name != this.name)
        link.line.remove()
        this.inputLinks[index] = null
    }
    connectOutput(conn: Connection) {
        this.outputLinks[conn.output.data.index].push(conn)
    }
    connectedInput(index: number): Connection|null {
        return this.inputLinks[index]
    }
    connectedOutputs(index: number): Connection[] {
        return this.outputLinks[index]
    }
    remove() {
        new Array(this.inputHandles.length).fill(0).forEach((_, i) => this.disconnectInput(i))
        Object.values(this.outputLinks).forEach((connections, i) => {
            connections.forEach(connection => {
                connection.input.obj.disconnectInput(connection.input.data.index)
            })
            this.outputLinks[i] = []
        })
        this.inputHandles.forEach(a => a.remove())
        this.outputHandles.forEach(a => a.remove())
        this.body.remove()
        this.group.remove()
    }

    get numInputs(): number {
        return this.inputHandles.length
    }
    get numOutputs(): number {
        return this.outputHandles.length
    }

    // get fill() {
    //     return this.body.fill
    // }
    // set fill(val: string|Gradient|Texture) {
    //     this.body.fill = val
    // }
}

export class ConstantGUINode<T extends DataType> extends DraggableNode {
    constructor(two: Two, scene: Group, node: ConstantNode<T>) {
        super(two, scene, node);

        (node as ConstantNode<T>).label = two.makeText(`${node.constant.value}`, 0, 0, {weight: 700}).addTo(this.group) as Text
    }
}

export class DisplayGUINode extends DraggableNode {

    constructor(two: Two, scene: Group, node: DisplayNode) {
        super(two, scene, node);

        (node as DisplayNode).label = two.makeText("", 0, 0, {weight: 700}).addTo(this.group) as Text
    }

    override connectInput(conn: Connection): boolean {
        if(super.connectInput(conn)) {
            try {
                this.evaluate()
                return true
            } catch(e) {
                this.inputLinks[conn.input.data.index] = null
                return false
            }
        }
        return false
    }
    override disconnectInput(index: number): void {
        super.disconnectInput(index);

        (this.node as DisplayNode).label.value = ""
    }
}