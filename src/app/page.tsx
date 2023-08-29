"use client"
const URL = "localhost:8000"
const client_id = Math.ceil(Math.random()*100)

import { ChangeEvent, useEffect, useState } from "react"
import { getOperation, applyOperation } from "@/lib/diff"
import { transform } from "@/lib/transformer"
import { Operation } from "@/lib/types"

const websocket = new WebSocket(`ws://${URL}/ws/${client_id}`)

websocket.onopen = () => console.log("connected") 
websocket.onclose = () => console.log("disconnected")
websocket.onerror = (error) => console.error(error)

export default function Home() {
  const [lastSyncedRevision, setLastSyncedRevision] = useState(0) as [number, Function]
  const [pendingChanges, setPendingChanges] = useState([]) as [Operation[], Function]
  const [currentlyProcessingChange, setCurrentlyProcessingChange] = useState(null) as [Operation | null, Function]
  const [doc, setDoc] = useState("")
  const [isMounted, setIsMounted] = useState(false);

  // When a change is added to the pending changes, send it to the server
  useEffect(() => {
    if(pendingChanges.length === 0) return
    sendNextChange(websocket)
  }, [pendingChanges])

  // When a change is processed, send the next change to the server
  useEffect(() => {
    if(currentlyProcessingChange === null) return
    sendNextChange(websocket)
  }, [currentlyProcessingChange])

  useEffect(() => {
    setIsMounted(true);
  }, []);

  websocket.onmessage = async (message) => {
    const data = JSON.parse(message.data)
    console.log("change received", data)
    const incomingChange = data.change as Operation

    setLastSyncedRevision(data.revision as number)

    if (JSON.stringify(incomingChange) === JSON.stringify(currentlyProcessingChange)) { 
      // Current change was processed
      setCurrentlyProcessingChange(null)

      // Remove current change from pending changes
      setPendingChanges(pendingChanges.filter((change) => JSON.stringify(change) !== JSON.stringify(incomingChange)))
      
      sendNextChange(websocket)
      return
    }
    // Transform all pending changes with the current change
    setPendingChanges(pendingChanges.map((change) => transform(change, incomingChange)))

    // Apply the change to the document
    const newDoc = applyOperation(doc, incomingChange)
    setDoc(newDoc)
  }

  async function sendNextChange(websocket: WebSocket) {
    // if there is a change currently being processed, do nothing
    if (currentlyProcessingChange !== null) return

    // next change to be processed
    const change = pendingChanges.shift()

    // all changes have been processed
    if (change === undefined) {
      return
    }
    setCurrentlyProcessingChange(change)

    websocket.send(JSON.stringify({
      change: change,
      revision: lastSyncedRevision + 1
    }))

  }

  async function handleInput(changeEvent: ChangeEvent) {
    const target = changeEvent.target as HTMLTextAreaElement
    const newDoc = target.value
    const operation = getOperation(doc, newDoc)

    // Apply the change to the document
    setDoc(newDoc)
    // Add the change to the pending changes
    await setPendingChanges((prevPendingChanges: Operation[]) => [...prevPendingChanges, operation])
  }

  if (!isMounted) return null

  return (
    <div>
      <h1>Client ID: {client_id}</h1>
      <h1>Last synced revision: {lastSyncedRevision}</h1>
      <textarea value={doc} onChange={handleInput}></textarea>
      <button onClick={() => console.log(pendingChanges, currentlyProcessingChange)}>Click me</button>
    </div>
  )

}