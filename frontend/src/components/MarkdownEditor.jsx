import { useRef } from 'react'

function MarkdownEditor({ value, onChange, rows, placeholder, children }) {
  const textareaRef = useRef(null)

  function wrap(mark) {
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end) || ''
    const newValue = value.slice(0, start) + mark + selected + mark + value.slice(end)
    onChange(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + mark.length, start + mark.length + selected.length)
    }, 0)
  }

  return (
    <div>
      <textarea
        ref={textareaRef}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="editor-bottom">
        <div className="toolbar">
          <button type="button" className="outline secondary" title="Kalın" onClick={() => wrap('**')}>
            <b>B</b>
          </button>
          <button type="button" className="outline secondary" title="İtalik" onClick={() => wrap('*')}>
            <i>I</i>
          </button>
          <button type="button" className="outline secondary" title="Kod" onClick={() => wrap('`')}>
            {'</>'}
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default MarkdownEditor
