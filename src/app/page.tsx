"use client"
const URL = "localhost:8000"
const client_id = Math.ceil(Math.random()*100)

import { ChangeEvent, useEffect, useState } from "react"
import { isEqual, omit, set } from "lodash"

import { getOperation } from "@/lib/diff"
import { applyOperation } from "@/lib/diff"
import { transform } from "@/lib/transformer"
import { Operation } from "@/lib/types"
import TextArea from "@/lib/TextArea"

const websocket = new WebSocket(`ws://${URL}/ws/${client_id}`)

websocket.onopen = () => console.log("connected") 
websocket.onclose = () => console.log("disconnected")
websocket.onerror = (error) => console.error(error)

export default function Home() {
  const [lastSyncedRevision, setLastSyncedRevision] = useState(0)
  const [pendingChanges, setPendingChanges] = useState<Operation[]>([])
  const [receivedChanges, setReceivedChanges] = useState<Operation[]>([])
  const [currentlyProcessingChange, setCurrentlyProcessingChange] = useState<Operation | null>(null)
  const [cursorPosition, setCursorPosition] = useState<number>(0)
  const [doc, setDoc] = useState("")

  const handleCursorPositionChange = (newPosition: number) => {
    setCursorPosition(newPosition);
  };

  const sendNextChange = async (websocket: WebSocket) => {
    // if there is a change currently being processed, do nothing
    if (currentlyProcessingChange !== null) return

    // next change to be processed
    const change = pendingChanges.shift()

    // all changes have been processed
    if (change === undefined) {
      return
    }
    setCurrentlyProcessingChange(change)

    change.revision = lastSyncedRevision
    console.log("sending change", omit(change, 'revision'))
    websocket.send(JSON.stringify(change))

  }

  const handleChange = (changeEvent: ChangeEvent) => {
    const target = changeEvent.target as HTMLTextAreaElement
    // const newDoc = (currentDoc[0] as any).children[0].text
    const newDoc = target.value
    const operation = getOperation(doc, newDoc)
    if (operation === null) return
    if (operation.op === "noop") return

    // check if change is same as the current change
    if (isEqual(
      omit(operation, 'revision'),
      omit(currentlyProcessingChange, 'revision'))
    ) return

    // check if change is in received changes
    for (const change of receivedChanges) {
      if (isEqual(
        omit(operation, 'revision'),
        omit(change, 'revision'))
      ) return
    }

    console.log("change was made", omit(operation, 'revision'))
    // Apply the change to the document
    setDoc(newDoc)
    // Add the change to the pending changes
    setPendingChanges((prevPendingChanges: Operation[]) =>
      [...prevPendingChanges, operation])
  }

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

  // When receivedchanges exceeds 3, remove the first change
  useEffect(() => {
    if(receivedChanges.length <= 3) return
    setReceivedChanges(prev => prev.slice(1))
  }, [receivedChanges])

  websocket.onmessage = (message) => {
    const data = JSON.parse(message.data)
    const incomingChange: Operation = data.change

    if(data.ack) {
      console.log("ack received", data.change)
      // Current change was processed
      setCurrentlyProcessingChange(null)

      // Remove current change from pending changes
      setPendingChanges((prevPendingChanges: Operation[]) =>
        prevPendingChanges.filter(
          (change) => !isEqual(change, incomingChange)
        )
      )
      
      sendNextChange(websocket)
      return
    }
    console.log("change was received", omit(incomingChange, 'revision'))

    setLastSyncedRevision(incomingChange.revision ?? 0)

    // Transform all pending changes with the current change
    setPendingChanges((prevPendingChanges: Operation[]) =>
      prevPendingChanges.map(
        (change) => transform(change, incomingChange)
      )
    )

    // Apply the change to the document
    const newDoc = applyOperation(doc, incomingChange)
    const currentCursorPosition = cursorPosition
    setDoc(newDoc)
    setCursorPosition(currentCursorPosition)

    // Add the change to the received changes
    setReceivedChanges((prevReceivedChanges: Operation[]) =>
      [...prevReceivedChanges, incomingChange])
  }

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if(!isMounted) return null

  return (
    <div>
      <h1>Client ID: {client_id}</h1>
      <h1>Last synced revision: {lastSyncedRevision}</h1>
      <h1>Cursor position: {cursorPosition}</h1>
      <TextArea
        cursorPosition={cursorPosition}
        onCursorPositionChange={handleCursorPositionChange}
        onChange={handleChange}
        value={doc}
      />
    </div>
  )

}