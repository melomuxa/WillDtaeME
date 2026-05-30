'use client'

import { useState } from 'react'

interface CopyButtonProps {
  text: string
  className?: string
}

/**
 * Copies the given text to the clipboard and briefly shows a "Copied!" label.
 */
export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={
        className ??
        'bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors'
      }
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
