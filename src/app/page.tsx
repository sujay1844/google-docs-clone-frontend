"use client"
const URL = "localhost:8000"
const client_id = Math.ceil(Math.random()*100)

import { ChangeEvent, useState } from "react"
import { getOperation, applyOperation } from "../lib/diff"
import { transform } from "@/lib/transformer"

const websocket = new WebSocket(`ws://${URL}/${client_id}/ws`)

websocket.onopen = () => console.log("connected") 
websocket.onclose = () => console.log("disconnected")
websocket.onerror = (error) => console.error(error)

export default function Home() {
  const [last_synced_revision, setLastSyncedRevision] = useState(0) as [number, Function]
  const [pending_changes, setPendingChanges] = useState([]) as [object[], Function]
  const [currently_processing_change, setCurrentlyProcessingChange] = useState(null) as [object | null, Function]
  const [doc, setDoc] = useState("")

  websocket.onmessage = async (message) => {
    const data = JSON.parse(message.data)
    console.log("change received", data)

    if (JSON.stringify(data.change) === JSON.stringify(currently_processing_change)) { 
      setCurrentlyProcessingChange(null)
      setPendingChanges(pending_changes.filter((change) => JSON.stringify(change) !== JSON.stringify(data.change)))
      await sendNextChange(websocket)
      return
    }
    setPendingChanges(pending_changes.map((change) => transform(change, data.change)))
    const newDoc = applyOperation(doc, data.change)
    setDoc(newDoc)
    setLastSyncedRevision(data.revision)
  }

  async function sendNextChange(websocket: WebSocket) {
    // if there is a change currently being processed, do nothing
    if (currently_processing_change !== null) return

    // next change to be processed
    const change = pending_changes.pop()

    // all changes have been processed
    if (change === undefined) {
      console.log("all changes processed")
      return
    }

    websocket.send(JSON.stringify({
      change: change,
      revision: last_synced_revision + 1
    }))
    setCurrentlyProcessingChange(change)
  }

  async function handleInput(changeEvent: ChangeEvent) {
    const target = changeEvent.target as HTMLTextAreaElement
    const newDoc = target.value
    const operation = getOperation(doc, newDoc)


    setDoc(newDoc)
    setPendingChanges([...pending_changes, operation])
    if(currently_processing_change === null) 
      await sendNextChange(websocket)
  }

  return (
    <div>
      <h1>Last synced revision: {last_synced_revision}</h1>
      <textarea value={doc} onChange={handleInput}></textarea>
      <button onClick={() => console.log(pending_changes, currently_processing_change)}>Click me</button>
    </div>
  )

}