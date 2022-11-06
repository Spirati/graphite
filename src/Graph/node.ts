export class DataType {
    get value(): any { return null }
    static color: string = "#fff"
    static zero: DataType
}

export type ClassFunction<S> = new (...args: any[]) => S

export interface DataManifest { [key: string]: ClassFunction<DataType> }

export class GraphNode {
    name: string
    inputs: DataManifest
    outputs: DataManifest
    processor: (...args: any[]) => any[]

    constructor(name: string, manifest: {inputs: DataManifest, outputs: DataManifest}, processor: (...args: any[]) => any[]) {
        this.inputs = manifest.inputs
        this.outputs = manifest.outputs
        this.name = name
        this.processor = processor
    }
}