import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";

export default function MarkdownRenderer({ content, className = "" }) {
  // React markdown component created for my portfolio site, used here to take the gemini analysis and convert it to styled HTML
  return (
    <div
      className={`prose prose-lg max-w-none prose-p:text-gray-50 prose-p:leading-relaxed prose-p:mb-10${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Heading styles
          h1: ({ children }) => (
            <h1 className="text-5xl mb-1 text-gray-50 border-zinc-50 font-rubik">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-3xl mb-8 text-gray-50 font-rubik">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-2xl mb-3 text-gray-50 mt-6 font-rubik">
              {children}
            </h3>
          ),

          h4: ({ children }) => (
            <h4 className="text-xl mb-3 text-gray-50 mt-6 font-rubik">
              {children}
            </h4>
          ),

          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              className="rounded-lg shadow-md max-w-full h-auto"
              {...props}
            />
          ),

          // Paragraph and text
          p: ({ children }) => (
            <p className="max-w-full mb-7 font-rubik text-lg leading-relaxedz">
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="mb-10 space-y-2 list-disc list-inside text-lg text-gray-50 leading-loose">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 space-y-2 list-decimal list-inside text-gray-50 text-lg leading-loose">
              {children}
            </ol>
          ),

          // Code blocks
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <pre className="bg-gray-700 text-green-400 p-4 rounded-lg overflow-x-auto mb-4">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className="bg-gray-950 text-red-600 px-2 py-1 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-zinc-50 italic text-gray-50">
              {children}
            </blockquote>
          ),

          strong: ({ children }) => (
            <strong className="font-black text-gray-50 px-1 rounded">
              {children}
            </strong>
          ),

          // Horizontal rule
          hr: () => <hr className="my-8 border-zinc-50" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
