export function MarkdownPreview({ body }: { body: string }) {
  return <>{body.split(/(```[\s\S]*?```)/g).map((block, index) => {
    if (block.startsWith('```')) return <pre key={index}><code>{block.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')}</code></pre>
    return block.split(/\n\s*\n/).filter(Boolean).map((paragraph, line) => {
      const key = `${index}-${line}`
      if (/^#{1,3} /.test(paragraph)) return <h3 key={key}>{paragraph.replace(/^#{1,3} /, '')}</h3>
      if (paragraph.split('\n').every(item => /^- /.test(item))) return <ul key={key}>{paragraph.split('\n').map((item, n) => <li key={n}>{item.slice(2)}</li>)}</ul>
      return <p key={key}>{paragraph}</p>
    })
  })}</>
}
