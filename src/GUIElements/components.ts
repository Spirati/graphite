import { DataType, GraphNode, ClassFunction } from "../Graph/node"
import { GraphVector, GraphNumber, ConstantNode, NumberNode } from "../Graph/nodeTypes"

export type MonicNode = new (name: string) => GraphNode

export type NodeBuilderFunction = ({name, node, value}: {name: string, node: MonicNode, value?: any[]}) => void

export class ComponentDrawer {
    sidebar: HTMLDivElement
    sidebarNav: HTMLDivElement
    trashcan: HTMLParagraphElement
    clear: HTMLDivElement

    variables: {name: string, type: typeof GraphVector|typeof GraphNumber, value: any}[]

    private factory: NodeBuilderFunction

    overTrash: boolean

    private nodeList: HTMLDivElement
    private varList: HTMLDivElement

    constructor(availableTypes: {name: string, node: MonicNode}[], factory: NodeBuilderFunction) {

        document.body.oncontextmenu = (e: Event) => e.preventDefault()

        this.variables = []

        this.sidebar = document.getElementById("sidebar") as HTMLDivElement
        this.sidebarNav = document.getElementById("sidebar-nav") as HTMLDivElement
        this.trashcan = document.getElementById("trash") as HTMLParagraphElement
        this.clear = document.getElementById("clear") as HTMLDivElement
        this.nodeList = document.getElementById("node-list") as HTMLDivElement
        this.varList = document.getElementById("variable-list") as HTMLDivElement

        this.factory = factory

        this.overTrash = false

        this.trashcan.onmouseenter = () => this.overTrash = true
        this.trashcan.onmouseleave = () => this.overTrash = false

        this.sidebarNav.onclick = () => {
            this.sidebar.className = (this.sidebar.className == "" ? "collapsed" : "")
        }

        document.getElementById("new-constant").onclick = () => {
            let node = this.variables[this.variables.push({
                name: `Variable ${this.variables.length+1}`,
                type: GraphNumber,
                value: GraphNumber.zero
            })-1]
            const n = document.createElement("div")
            const nTag = document.createElement("input")
            const vTag = document.createElement("input")
            const button = document.createElement("button")
            button.innerText = "Add"

            button.onclick = () => this.factory({name: "Number", node: NumberNode, value: [node.value.value] })

            nTag.style.width = "40%"
            nTag.placeholder = "Variable"
            nTag.value = node.name

            nTag.onchange = e => node.name = nTag.value
            vTag.onchange = e => node.value = new GraphNumber(parseInt(vTag.value))
            vTag.style.width = "25%"
            vTag.value = `${GraphNumber.zero.value}`
            vTag.type = "number"
            n.appendChild(nTag)
            n.appendChild(vTag)
            n.appendChild(button)

            this.varList.appendChild(n)

        }

        availableTypes.forEach(({name, node}) => {
            const n = document.createElement("div")
            n.innerText = name
            n.onclick = () => this.factory({name,node})
            this.nodeList.appendChild(n)
        })
    }
}