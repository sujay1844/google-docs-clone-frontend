"use client"
const URL = "localhost:8000"
const client_id = Math.ceil(Math.random()*100)

import { ChangeEvent, useState } from "react"
import { getOperation, applyOperation } from "../lib/diff"
import { transform } from "../lib/transformer"

const websocket = new WebSocket(`ws://${URL}/${client_id}/ws`)

websocket.onopen = () => console.log("connected") 
websocket.onclose = () => console.log("disconnected")
websocket.onerror = (error) => console.error(error)

export default function Home() {
  const [lastSyncedRevision, setLastSyncedRevision] = useState(0) as [number, Function]
  const [pendingChanges, setPendingChanges] = useState([]) as [object[], Function]
  const [currentlyProcessingChange, setCurrentlyProcessingChange] = useState(null) as [object | null, Function]
  const [doc, setDoc] = useState("")

  websocket.onmessage = async (message) => {
    const data = JSON.parse(message.data)
    console.log("change received", data)

    setLastSyncedRevision(data.revision)

    if (JSON.stringify(data.change) === JSON.stringify(currentlyProcessingChange)) { 
      // Current change was processed
      setCurrentlyProcessingChange(null)

      // Remove current change from pending changes
      setPendingChanges(pendingChanges.filter((change) => JSON.stringify(change) !== JSON.stringify(data.change)))
      
      await sendNextChange(websocket)
      return
    }
    // Transform all pending changes with the current change
    setPendingChanges(pendingChanges.map((change) => transform(change, data.change)))

    // Apply the change to the document
    const newDoc = applyOperation(doc, data.change)
    setDoc(newDoc)
  }

  async function sendNextChange(websocket: WebSocket) {
    // if there is a change currently being processed, do nothing
    if (currentlyProcessingChange !== null) return

    // next change to be processed
    const change = pendingChanges.pop()

    // all changes have been processed
    if (change === undefined) {
      console.log("all changes processed")
      return
    }

    websocket.send(JSON.stringify({
      change: change,
      revision: lastSyncedRevision + 1
    }))
    setCurrentlyProcessingChange(change)
  }

  async function handleInput(changeEvent: ChangeEvent) {
    const target = changeEvent.target as HTMLTextAreaElement
    const newDoc = target.value
    const operation = getOperation(doc, newDoc)

    // Apply the change to the document
    setDoc(newDoc)
    // Add the change to the pending changes
    setPendingChanges([...pendingChanges, operation])

    // For the first change, send it immediately
    if(currentlyProcessingChange === null) 
      await sendNextChange(websocket)
  }

  return (
    <div>
      <h1>Last synced revision: {lastSyncedRevision}</h1>
      <textarea value={doc} onChange={handleInput}></textarea>
      <button onClick={() => console.log(pendingChanges, currentlyProcessingChange)}>Click me</button>
    </div>
  )

}