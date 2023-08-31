"use client"
const URL = "localhost:8000"
const client_id = Math.ceil(Math.random()*100)

import { ChangeEvent, useEffect, useState, useRef } from "react"
import { get, isEqual, omit } from "lodash"

import { getOperation, applyOperation } from "@/lib/diff"
import { transform } from "@/lib/transformer"
import { Operation } from "@/lib/types"

const websocket = new WebSocket(`ws://${URL}/ws/${client_id}`)

websocket.onopen = () => console.log("connected") 
websocket.onclose = () => console.log("disconnected")
websocket.onerror = (error) => console.error(error)

import { Transforms, createEditor } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'


// Typsescript specific code
import { BaseEditor, Descendant } from 'slate'
import { ReactEditor } from 'slate-react'

type CustomElement = { type: 'paragraph'; children: CustomText[] }
type CustomText = { text: string }

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}
const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: 'hi' }],
  },
]

export default function Home() {
  const [lastSyncedRevision, setLastSyncedRevision] = useState(0) as [number, Function]
  const [pendingChanges, setPendingChanges] = useState([]) as [Operation[], Function]
  const [currentlyProcessingChange, setCurrentlyProcessingChange] = useState(null) as [Operation | null, Function]
  const [doc, setDoc] = useState("")
  const [isMounted, setIsMounted] = useState(false);
  const editor = withReact(createEditor())

  function getText(editor: BaseEditor & ReactEditor) {
    return (editor.children[0] as any).children[0].text
  }

  function applyOperation(editor: BaseEditor & ReactEditor, operation: Operation) {
    if (operation.op === "ins") {
      Transforms.insertText(editor, operation.str!, {
        at: { path: [0, 0], offset: operation.pos },
      })
    } else if (operation.op === "del") {
      Transforms.delete(editor, {
        at: { path: [0, 0], offset: operation.pos },
        distance: operation.str!.length,
      })
    }
    return getText(editor)
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

    change.revision = lastSyncedRevision
    websocket.send(JSON.stringify(change))

  }

  async function handleInput(currentDoc: Descendant[]) {
    // const target = changeEvent.target as HTMLTextAreaElement
    const newDoc = getText(editor)
    const operation = getOperation(doc, newDoc)
    console.log("change was made", operation)

    // Apply the change to the document
    setDoc(newDoc)
    // Add the change to the pending changes
    await setPendingChanges((prevPendingChanges: Operation[]) => [...prevPendingChanges, operation])
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  websocket.onmessage = async (message) => {
    const data = JSON.parse(message.data)
    const incomingChange = data as Operation
    console.log("change was received", omit(incomingChange, 'revision'))

    setLastSyncedRevision(incomingChange.revision)

    if (isEqual(omit(incomingChange, 'revision'), omit(currentlyProcessingChange, 'revision'))) { 
      console.log("change was processed", omit(incomingChange, 'revision'))
      // Current change was processed
      setCurrentlyProcessingChange(null)

      // Remove current change from pending changes
      setPendingChanges(pendingChanges.filter((change) => !isEqual(change, incomingChange)))
      
      sendNextChange(websocket)
      return
    }
    // Transform all pending changes with the current change
    setPendingChanges(pendingChanges.map((change) => transform(change, incomingChange)))

    // Apply the change to the document
    const newDoc = applyOperation(editor, incomingChange)
    setDoc(newDoc)
  }

  if (!isMounted) return null

  return (
    <div>
      <h1>Client ID: {client_id}</h1>
      <h1>Last synced revision: {lastSyncedRevision}</h1>
      <button onClick={() => console.log(pendingChanges, currentlyProcessingChange)}>Click me</button>
      <Slate editor={editor} initialValue={initialValue} onChange={handleInput}>
          <Editable />
      </Slate>
    </div>
  )

}