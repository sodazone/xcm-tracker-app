import Prism from "prismjs";

export function CodeBlock({ code }: { code: string }) {
  const highlighted = Prism.highlight(code, Prism.languages.javascript, "json");
  return (
    <pre>
      <code
        className="language-json"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      ></code>
    </pre>
  );
}
