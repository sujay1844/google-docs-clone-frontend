import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import Editor from '../components/Editor'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  return (
    <div className="p-2">
      <Editor />
    </div>
  )
}
