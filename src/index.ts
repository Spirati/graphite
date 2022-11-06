import Two from "two.js"
import { ZUI } from "two.js/extras/jsm/zui"
import * as nodeTypes from "./Graph/nodeTypes"
import { DraggableNode, DisplayGUINode, ConnectionInfo, Connection, ConstantGUINode } from "./GUIElements/node"
import { DataType, ClassFunction } from "./Graph/node"
import { ComponentDrawer, MonicNode } from "./GUIElements/components"
import { Points } from "two.js/src/shapes/points"
import { Path } from "two.js/src/path"

import "./styles.css"

const hook = document.getElementById("hook")
const root = document.querySelector("body")

const two = new Two({
  type: Two.Types.canvas,
  fullscreen: true,
  autostart: true
})
  .appendTo(hook)

const nodes = new Set<DraggableNode>()

const stage = new Two.Group()
const connections = new Two.Group()
two.add(stage)
stage.add(connections)

addZUI()

// const scaleNode = new DraggableNode(two, stage, new ScaleVector("Scale"))
// scaleNode.position.x = two.width / 2
// scaleNode.position.y = two.height / 2

// const truncNode = new DraggableNode(two, stage, new DotProduct("Dot Product"))
// truncNode.position.x = two.width / 3
// truncNode.position.y = two.height / 3

let GraphNumber = nodeTypes.GraphNumber


// const inputVector = new DraggableNode(two, stage, new ConstantNode<GraphVector>(GraphVector, "Constant", 1,2,3))

// const addNodes = (...nodeList: DraggableNode[]) => nodeList.forEach(node => nodes.add(node))

// addNodes(scaleNode, truncNode, constNode, inputVector)

const drawer = new ComponentDrawer([
  {
    name: "Dot Product",
    node: nodeTypes.DotProduct
  }, {
    name: "Scale Vector",
    node: nodeTypes.ScaleVector
  }, {
    name: "Component Split-3",
    node: nodeTypes.Vector3Splitter
  }, {
    name: "Component Split-2",
    node: nodeTypes.Vector2Splitter
  }, {
    name: "Truncate-2",
    node: nodeTypes.TruncateVector2
  }, {
    name: "Truncate-3",
    node: nodeTypes.TruncateVector3
  }, {
    name: "Vector2",
    node: nodeTypes.Vector2Node
  }, {
    name: "Vector3",
    node: nodeTypes.Vector3Node
  }, {
    name: "Length",
    node: nodeTypes.VectorNormNode
  }, {
    name: "Display",
    node: nodeTypes.DisplayNode
  }
], ({name, node, dataType, value}: {name: string, node: MonicNode, dataType?: ClassFunction<DataType>, value?: any[]}) => {
  let x: DraggableNode

  switch(name) {
    case "Display":
      x = new DisplayGUINode(two, stage, new nodeTypes.DisplayNode(name))
      break
    case "Number":
      x = new ConstantGUINode(two, stage, new nodeTypes.NumberNode(name, ...value))
      break
    default:
      x = new DraggableNode(two, stage, new node(name))

  }
  nodes.add(x)
  x.position.x = two.width/3 + 50*(Math.random()*5 - 2.5)
  x.position.y = two.height/3 + 50*(Math.random()*5 - 2.5)
})

drawer.clear.onclick = () => nodes.forEach(node => node.remove())

function addZUI() {
  const domElement = two.renderer.domElement
  const zui = new ZUI(stage)
  var mouse = new Two.Vector()
  var touches: { [key: number]: Touch } = {}
  var distance = 0
  var dragging = false
  var highlightNode: ConnectionInfo | null = null
  var dragNode: DraggableNode

  let currentDraw: Points | null = null

  zui.addLimits(0.06, 8)

  zui.translateSurface(two.width/5, two.height/5)

  domElement.addEventListener('mousedown', mousedown, false)
  domElement.addEventListener('mousewheel', mousewheel, false)
  domElement.addEventListener('wheel', mousewheel, false)

  domElement.addEventListener('touchstart', touchstart, false)
  domElement.addEventListener('touchmove', touchmove, false)
  domElement.addEventListener('touchend', touchend, false)
  domElement.addEventListener('touchcancel', touchend, false)

  domElement.addEventListener('mousemove', (e: MouseEvent) => {
    let m = new Two.Vector(e.clientX - root.getBoundingClientRect().left, e.clientY - root.getBoundingClientRect().top)

    let mousedOver = Array.from(nodes).filter(node => node.mouseOver(m, true)).sort((a,b)=>a.precedence-b.precedence)
    if(mousedOver.length > 0) {
      mousedOver[0].body.linewidth = 2
      mousedOver[0].body.stroke = "white"
    }
  }, false)

  function mousedown(e: MouseEvent) {
    mouse.x = e.clientX - root.getBoundingClientRect().left
    mouse.y = e.clientY - root.getBoundingClientRect().top
    var dragged = Array.from(nodes).filter(node => node.mouseOver(mouse)).sort((a, b) => a.precedence - b.precedence)
    dragging = dragged.length > 0
    if (dragging) {
      drawer.trashcan.className = "selected"
      dragNode = dragged[0]
      if (dragged[0].selected == null) {
        if (dragNode.precedence != 0) {
          Array.from(nodes).filter(node => node.precedence < dragNode.precedence).forEach(node => node.precedence++)
          stage.children.unshift(
            ...stage.children.splice(dragNode.precedence, 1)
          )
          dragNode.precedence = 0
        }
        highlightNode = null
      } else {
        highlightNode = { obj: dragged[0], data: dragged[0].selected }
        let v = dragged[0].handlePosition(highlightNode.data.type, highlightNode.data.index)
        dragging = false
      }
    } else {
      highlightNode = null
    }

    window.addEventListener('mousemove', mousemove, false)
    window.addEventListener('mouseup', mouseup, false)
  }

  function mousemove(e: MouseEvent) {
    var dx = e.clientX - root.getBoundingClientRect().left - mouse.x
    var dy = e.clientY - root.getBoundingClientRect().top - mouse.y

    if (dragging) {
      dragNode.position.x += dx / zui.scale
      dragNode.position.y += dy / zui.scale

      new Array(dragNode.numInputs).fill(0).forEach((_, i) => {
        let line = dragNode.connectedInput(i)?.line
        if(line) {
          line.vertices[1].x += dx/zui.scale
          line.vertices[1].y += dy/zui.scale
        }
      })
      new Array(dragNode.numOutputs).fill(0).forEach((_, i) => {
        dragNode.connectedOutputs(i).forEach(connection => {
          connection.line.vertices[0].x += dx/zui.scale
          connection.line.vertices[0].y += dy/zui.scale
        })
      })
      
    } else if (highlightNode == null && !dragging) {
      zui.translateSurface(dx, dy)
    } else {
    }
    mouse.set(e.clientX - root.getBoundingClientRect().left, e.clientY - root.getBoundingClientRect().top)
  }

  function mouseup(e: MouseEvent) {
    if(drawer.overTrash) {
      dragNode.remove()
      dragNode = null
    } else {
      var overNodes = Array.from(nodes).filter(node => node.mouseOver(mouse)).sort((a, b) => a.precedence - b.precedence)
      if (overNodes.length > 0) {
        var topNode = overNodes[0]
        if (topNode.selected != null && topNode != highlightNode.obj) {
          let endNode = { obj: topNode, data: topNode.selected }
          if (endNode.data.type != highlightNode.data.type) {
  
            let conn: Connection = {
              input: null,
              output: null,
              line: null
            }
  
            switch(endNode.data.type) {
              case "input":
                conn.input = endNode
                conn.output = highlightNode
                break
              case "output":
                conn.input = highlightNode
                conn.output = endNode
            }
            if(conn.input.obj.connectInput(conn)) {
              conn.output.obj.connectOutput(conn)
              let end = conn.input.obj.handlePosition(conn.input.data.type, conn.input.data.index)
              let start = conn.output.obj.handlePosition(conn.output.data.type, conn.output.data.index)
              conn.line = two.makeLine(...start, ...end).addTo(connections) as Path // start at output, end at input
              conn.line.stroke = "white"
              conn.line.linewidth = 2
            }
          }
        }
      } else if(highlightNode && highlightNode.data.type == "input" && highlightNode.obj.connectedInput(highlightNode.data.index)) {
        highlightNode.obj.disconnectInput(highlightNode.data.index)
      }
    }
    drawer.trashcan.className = ""

    window.removeEventListener('mousemove', mousemove, false)
    window.removeEventListener('mouseup', mouseup, false)
  }

  function mousewheel(e: any) {
    var dy = (e.wheelDeltaY || - e.deltaY) / 1000
    zui.zoomBy(dy, e.clientX, e.clientY)
  }

  function touchstart(e: TouchEvent) {
    switch (e.touches.length) {
      case 2:
        pinchstart(e)
        break
      case 1:
        panstart(e)
        break
    }
  }

  function touchmove(e: TouchEvent) {
    switch (e.touches.length) {
      case 2:
        pinchmove(e)
        break
      case 1:
        panmove(e)
        break
    }
  }

  function touchend(e: TouchEvent) {
    touches = {}
    var touch = e.touches[0]
    if (touch) {  // Pass through for panning after pinching
      mouse.x = touch.clientX - root.getBoundingClientRect().left
      mouse.y = touch.clientY - root.getBoundingClientRect().top
    }
  }

  function panstart(e: TouchEvent) {
    var touch = e.touches[0]
    mouse.x = touch.clientX - root.getBoundingClientRect().left
    mouse.y = touch.clientY - root.getBoundingClientRect().top
  }

  function panmove(e: TouchEvent) {
    var touch = e.touches[0]
    var dx = touch.clientX - root.getBoundingClientRect().left - mouse.x
    var dy = touch.clientY - root.getBoundingClientRect().top - mouse.y
    zui.translateSurface(dx, dy)
    mouse.set(touch.clientX - root.getBoundingClientRect().left, touch.clientY - root.getBoundingClientRect().top)
  }

  function pinchstart(e: TouchEvent) {
    for (var i = 0; i < e.touches.length; i++) {
      var touch = e.touches[i]
      touches[touch.identifier] = touch
    }
    var a = touches[0]
    var b = touches[1]
    var dx = b.clientX - a.clientX
    var dy = b.clientY - a.clientY
    distance = Math.sqrt(dx * dx + dy * dy)
    mouse.x = dx / 2 + a.clientX - root.getBoundingClientRect().left
    mouse.y = dy / 2 + a.clientY - root.getBoundingClientRect().top
  }

  function pinchmove(e: TouchEvent) {
    for (var i = 0; i < e.touches.length; i++) {
      var touch = e.touches[i]
      touches[touch.identifier] = touch
    }
    var a = touches[0]
    var b = touches[1]
    var dx = b.clientX - a.clientX
    var dy = b.clientY - a.clientY
    var d = Math.sqrt(dx * dx + dy * dy)
    var delta = d - distance
    zui.zoomBy(delta / 250, mouse.x, mouse.y)
    distance = d
  }
}