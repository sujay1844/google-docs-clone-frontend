"use client"
const URL = "localhost:8000"
import { ChangeEvent, useState } from "react"
import { getOperation, applyOperation } from "../lib/diff"

const websocket = new WebSocket("ws://" + URL + "/ws/" + Math.ceil(Math.random()*100))
websocket.onopen = () => {
  console.log("connected")
}
websocket.onclose = () => {
  console.log("disconnected")
}
websocket.onerror = (error) => {
  console.error(error)
}

export default function Home() {
  const [doc, setDoc] = useState("")

  websocket.onmessage = (message) => {
    const data = JSON.parse(message.data)
    console.log(data)
    const newDoc = applyOperation(doc, data)
    setDoc(newDoc)
  }

  function handleInput(changeEvent: ChangeEvent) {
    const target = changeEvent.target as HTMLTextAreaElement
    const newDoc = target.value
    const operation = getOperation(doc, newDoc)

    console.log(operation)
    websocket.send(JSON.stringify(operation))

    setDoc(newDoc)
  }

  return (<div>
    <h1>Hello World</h1>
    <textarea value={doc} onChange={handleInput}></textarea>
  </div>)

}