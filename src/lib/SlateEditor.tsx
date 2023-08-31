"use client"
import React, { useState } from 'react'
import { Transforms, createEditor } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'

import { Operation } from '@/lib/types'

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
    children: [{ text: 'A line of text in a paragraph.' }],
  },
]
export function getText(editor: BaseEditor&ReactEditor) {
  return (editor.children[0] as any).children[0].text
}

export function applyOperation(editor: BaseEditor&ReactEditor, operation: Operation) {
  if(operation.op === "ins") {
    Transforms.insertText(editor, operation.str!, {
      at: { path: [0, 0], offset: operation.pos },
    })
  } else if(operation.op === "del") {
    Transforms.delete(editor, {
      at: { path: [0, 0], offset: operation.pos },
      distance: operation.str!.length,
    })
  }
}

export default function SlateEditor(editor: BaseEditor&ReactEditor) {
  // const [editor] = useState(() => withReact(createEditor()))

  // Render the Slate context.
  return <div>
   <Slate editor={editor} initialValue={initialValue}>
      <Editable />
   </Slate>
  </div>
}