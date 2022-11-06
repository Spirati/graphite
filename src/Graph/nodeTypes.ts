import { Text } from "two.js/src/text"
import { Vector } from "two.js/src/vector"
import { DataType, GraphNode } from "./node"
import { ClassFunction } from "./node"

export class GraphVector extends DataType {
    protected elements: number[]

    constructor(...elements: number[]) {
        super()
        this.elements = elements
    }

    override get value(): number[] {
        return this.elements
    }

    get normSquared() {
        return GraphVector.dot(this,this)
    }
    dot(v: GraphVector): number {
        return GraphVector.dot(this, v)
    }
    add(v: GraphVector): GraphVector {
        return GraphVector.add(this, v)
    }
    sub(v: GraphVector): GraphVector {
        return GraphVector.sub(this, v)
    }
    scale(s: number): GraphVector {
        return GraphVector.scale(s, this)
    }
    
    static scale(s: number, v: GraphVector) {
        return new GraphVector(...v.elements.map(e => e*s))

    }
    static add(v1: GraphVector, v2: GraphVector) {
        if(v1.elements.length != v2.elements.length) throw "Can only add vectors of same length"

        return new GraphVector(...v1.elements.map((v,i) => v+v2.elements[i]))
    }
    static sub(v1: GraphVector, v2: GraphVector) {
        if(v1.elements.length != v2.elements.length) throw "Can only subtract vectors of same length"

        return new GraphVector(...v1.elements.map((v, i)=> v-v2.elements[i]))
    }
    static dot(v1: GraphVector, v2: GraphVector): number {
        if(v1.elements.length != v2.elements.length) throw "Can only calculate dot product between vectors of same length"

        return v1.elements.reduce((v,c,i) => v+c*v2.elements[i], 0)
    }

    get x() {
        return this.elements[0]
    }
    get y() {
        return this.elements[1]
    }
    get z() {
        return this.elements[2]
    }

    public toString(): string {
        return `[${this.elements.map(e => e.toString()).join(", ")}]`
    }

    truncate(length: number): GraphVector {
        return new GraphVector(...this.elements.slice(0, length))
    }

    static color = "#ff0"

    static get zero(): GraphVector {
        return new GraphVector()
    }
}

export class ConstantNode<T extends DataType> extends GraphNode {
    constant: T
    label: Text

    constructor(dataType: ClassFunction<T>, name: string, ...args: any[]) {
        super(
            name, {
            inputs: {},
            outputs: {"Value": dataType}
        }, () => [this.constant])

        this.constant = new dataType(...args)
    }
}

export class NumberNode extends ConstantNode<GraphNumber> {
    constructor(name: string, ...args: any[]) {
        super(
            GraphNumber, name, ...args
        )
    }
}

export class GraphNumber extends DataType {
    private _value: number
    
    constructor(value: number) {
        super()
        this._value = value
    }
    override get value(): number {
        return this._value
    }
    static get zero(): GraphNumber {
        return new GraphNumber(0)
    }
    static color = "#f00"
}

export class Vector2Splitter extends GraphNode {
    constructor(name: string) {
        super(name, {
            inputs: {
                "vector": GraphVector
            },
            outputs: {
                "x": GraphNumber,
                "y": GraphNumber
            }
        },
        (vector: GraphVector) => [new GraphNumber(vector.x), new GraphNumber(vector.y)] 
        )
    }
}
export class Vector3Splitter extends GraphNode {
    constructor(name: string) {
        super(name, {
            inputs: {
                "vector": GraphVector
            },
            outputs: {
                "x": GraphNumber,
                "y": GraphNumber,
                "z": GraphNumber
            }
        },
        (vector: GraphVector) => [new GraphNumber(vector.x), new GraphNumber(vector.y), new GraphNumber(vector.z || 0)] 
        )
    }
}
export class DotProduct extends GraphNode {
    constructor(name: string) {
        super(name, {
            inputs: {
                "v1": GraphVector,
                "v2": GraphVector
            },
            outputs: {
                "dp": GraphNumber
            }
        },
        (v1: GraphVector, v2: GraphVector) => [new GraphNumber(GraphVector.dot(v1, v2))])
    }
}
export class ScaleVector extends GraphNode {
    constructor(name: string) {
        super(name, {
            inputs: {
                "s": GraphNumber,
                "v": GraphVector
            }, 
            outputs: {
                "dp": GraphVector
            }
        },
        (s: GraphNumber, v: GraphVector) => [v.scale(s.value)])
    }
}

export class TruncateVector2 extends GraphNode {
    constructor(name: string) {
        super(name, {
            inputs: {
                "v": GraphVector
            },
            outputs: {
                "vt": GraphVector
            }
        }, (v: GraphVector) => [new GraphVector(v.x, v.y)])
    }
}
export class TruncateVector3 extends GraphNode {
    constructor(name: string) {
        super(name, {
            inputs: {
                "v": GraphVector
            },
            outputs: {
                "vt": GraphVector
            }
        }, (v: GraphVector) => [new GraphVector(v.x, v.y, v.z)])
    }
}

export class Vector2Node extends GraphNode {
    constructor(name: string) {
        super(name, {
            inputs: {
                "x": GraphNumber,
                "y": GraphNumber
            }, outputs: {
                "v": GraphVector
            }
        }, (x: GraphNumber, y: GraphNumber) => [new GraphVector(x.value, y.value)])
    }
}
export class Vector3Node extends GraphNode {
    constructor(name: string) {
        super(name, {
            inputs: {
                "x": GraphNumber,
                "y": GraphNumber,
                "z": GraphNumber
            }, outputs: {
                "v": GraphVector
            }
        }, (x: GraphNumber, y: GraphNumber, z: GraphNumber) => [new GraphVector(x.value, y.value, z.value)])
    }
}

export class VectorNormNode extends GraphNode {
    constructor(name: string) {
        super(name, {
            inputs: {
                "v": GraphVector,
            },
            outputs: {
                "n": GraphNumber
            }
        },
        (v: GraphVector) => [new GraphNumber(Math.sqrt(v.normSquared))])
    }
}

export class DisplayNode extends GraphNode {
    label: Text
    constructor(name: string) {
        super(name, {
            inputs: {
                "node": DataType
            }, outputs: {}
        }, (node: DataType) => {
            this.label.value = JSON.stringify(node.value)
            return null
        })
    }
}