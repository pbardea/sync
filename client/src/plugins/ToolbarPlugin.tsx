import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { $createHeadingNode } from "@lexical/rich-text";

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const formatHeading = (headingSize: 'h1' | 'h2') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element =
          anchorNode.getKey() === "root"
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow();
        const elementKey = element.getKey();
        const headingNode = $createHeadingNode(headingSize);
        element.replace(headingNode, true);
      }
    });
  };

  return (
    <div className="toolbar">
      <button onClick={() => formatHeading('h1')}>H1</button>
      <button onClick={() => formatHeading('h2')}>H2</button>
    </div>
  );
}