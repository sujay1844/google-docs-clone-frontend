"use client"
import React, { useState } from 'react'
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
    children: [{ text: 'A line of text in a paragraph.' }],
  },
]
function insertText(editor: BaseEditor&ReactEditor, text: string, offset: number) {
  Transforms.insertText(editor, text, {
    at: { path: [0, 0], offset: offset },
  })
}
function deleteText(editor: BaseEditor&ReactEditor ,offset: number, length: number) {
  Transforms.delete(editor, {
    at: { path: [0, 0], offset: offset },
    distance: length,
  })
}
function getText(editor: BaseEditor&ReactEditor) {
  return editor.children[0].children[0].text
}

export default function App() {
  const [editor] = useState(() => withReact(createEditor()))

  // Render the Slate context.
  return <div>
   <Slate editor={editor} initialValue={initialValue}>
      <Editable />
   </Slate>
  </div>
}