import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components: Components = {
  p: (props) => <p className="text-sm leading-relaxed text-slate-200 my-1.5 first:mt-0 last:mb-0 whitespace-pre-wrap" {...props} />,
  h1: (props) => <h1 className="text-lg font-bold text-white mt-4 mb-1.5 first:mt-0" {...props} />,
  h2: (props) => <h2 className="text-base font-bold text-white mt-4 mb-1.5 first:mt-0" {...props} />,
  h3: (props) => <h3 className="text-sm font-semibold text-white mt-3 mb-1 first:mt-0" {...props} />,
  strong: (props) => <strong className="font-semibold text-white" {...props} />,
  em: (props) => <em className="italic text-slate-300" {...props} />,
  a: (props) => (
    <a
      className="text-violet-400 hover:text-violet-300 underline underline-offset-2 decoration-violet-500/40"
      target="_blank"
      rel="noreferrer noopener"
      {...props}
    />
  ),
  ul: (props) => <ul className="list-disc pl-5 my-1.5 space-y-1" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 my-1.5 space-y-1" {...props} />,
  li: (props) => <li className="text-sm leading-relaxed text-slate-200 pl-1" {...props} />,
  blockquote: (props) => (
    <blockquote className="border-l-2 border-violet-500/50 pl-3 my-2 italic text-slate-300" {...props} />
  ),
  code: (props) => {
    const { className, children } = props
    const isBlock = /language-/.test(className || '')
    if (isBlock) {
      return (
        <code className="text-xs font-mono text-slate-300 block" {...props} />
      )
    }
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-violet-300" {...props} />
    )
  },
  pre: (props) => <pre className="my-2 p-3 rounded-lg bg-slate-950/80 border border-slate-800 overflow-x-auto elora-scroll" {...props} />,
  hr: () => <hr className="my-3 border-slate-800" />,
  table: (props) => (
    <div className="my-2 overflow-x-auto elora-scroll">
      <table className="w-full text-xs border-collapse" {...props} />
    </div>
  ),
  th: (props) => <th className="px-2 py-1.5 text-left font-semibold text-slate-200 border-b border-slate-700" {...props} />,
  td: (props) => <td className="px-2 py-1.5 text-slate-300 border-b border-slate-800/60 align-top" {...props} />,
  input: (props) => <input className="mr-1.5 accent-violet-500" {...props} />,
  del: (props) => <del className="text-slate-500" {...props} />,
}

export default function MarkdownView({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}