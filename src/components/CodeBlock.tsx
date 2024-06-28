import Prism from "prismjs";

export function CodeBlock({ code }: { code: string }) {
  const highlighted = Prism.highlight(code, Prism.languages.javascript, "json");
  return (
    <pre>
      <code
        className="language-json overflow-auto max-h-40"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      ></code>
    </pre>
  );
}
