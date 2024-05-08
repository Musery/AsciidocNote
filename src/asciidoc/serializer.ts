import Handlebars from "handlebars";
import { Editor, TextSerializer, Range } from "@tiptap/vue-3";
import { Schema, Node as ProseMirrorNode } from "@tiptap/pm/model";

Handlebars.registerHelper("repeat", function (symbol, times) {
  let result = "";
  for (let i = 0; i < times; i++) {
    result += symbol;
  }
  return new Handlebars.SafeString(result);
});

export const toAsciidoc = (editor: Editor) => {
  return getTextBetween(
    editor.state.doc,
    { from: 0, to: editor.state.doc.content.size },
    asciidocOptions(editor.schema)
  );
};

export const asciidocOptions = (schema: Schema) => {
  return {
    blockSeparator: "\n\n",
    textSerializers: Object.fromEntries(
      Object.entries(schema.nodes)
        .filter(([, node]) => node.spec.toText)
        .map(([name, node]) => [name, node.spec.toText])
    ),
  };
};

export function getTextBetween(
  startNode: ProseMirrorNode,
  range: Range,
  options?: {
    blockSeparator?: string;
    textSerializers?: Record<string, TextSerializer>;
  }
): string {
  const { from, to } = range;
  const { blockSeparator = "\n\n", textSerializers = {} } = options || {};
  let separated = true;
  const document = [""];

  const iterator = nodesBetween(from, to, 0, startNode, textSerializers);

  // 后置遍历
  iterator.forEach(({ node, pos, parent, index, textSerializer }) => {
    if (textSerializer) {
      if (node.isBlock && !separated) {
        //需要换行
        document.push("");
        separated = true;
      }

      if (parent) {
        // 补充内容
        document[document.length - 1] += textSerializer({
          node,
          pos,
          parent,
          index,
          range,
        });
      }
      return;
    }

    if (node.isText) {
      let content = node?.text?.slice(Math.max(from, pos) - pos, to - pos); // eslint-disable-line
      node.marks.forEach((mark) => {
        if (mark.attrs.asciidocFormated) {
          const data = { content, ...mark.attrs };
          content = Handlebars.compile(mark.attrs.asciidocFormated)(data);
        }
      });
      document[document.length - 1] += content;
      separated = false;
    } else if (node.isBlock) {
      let index = 0;
      node.content.forEach((child) => {
        if (child.isBlock) {
          index++;
        }
      });
      if (index !== 0) {
        // 将 document.length - index - 1 到 document.length - 1的内容合并可能需要进行格式化
        let content = document
          .slice(
            document.length - index - 1,
            // 是否已经换行(已经换行就要注意结尾的内容不能重复添加)
            separated ? document.length - 1 : document.length
          )
          .join(blockSeparator);
        // 假如需要格式化
        if (node.attrs.asciidocFormated) {
          const data = { content, ...node.attrs };
          content = Handlebars.compile(node.attrs.asciidocFormated)(data);
        }
        document.splice(document.length - index - 1, index, content); // 截断
      } else {
        let content =
          document[separated ? document.length - 2 : document.length - 1];
        const data = { content, ...node.attrs };
        document[separated ? document.length - 2 : document.length - 1] =
          Handlebars.compile(node.attrs.asciidocFormated)(data);
      }
      // 换行
      if (!separated) {
        document.push("");
        separated = true;
      }
    }
  });
  return document.join(blockSeparator);
}

function nodesBetween(
  from: number,
  to: number,
  nodeStart = 0,
  current: ProseMirrorNode,
  textSerializers?: Record<string, TextSerializer>,
  parent?: ProseMirrorNode
): IteratorItem[] {
  const iterator: IteratorItem[] = [];
  for (let i = 0, pos = 0; pos < to; i++) {
    let child = current.content.child(i),
      end = pos + child.nodeSize;
    const textSerializer = textSerializers?.[child.type.name];
    if (end > from && textSerializer === undefined && child.content.size) {
      let start = pos + 1;
      iterator.push(
        ...nodesBetween(
          Math.max(0, from - start),
          Math.min(child.content.size, to - start),
          nodeStart + start,
          child,
          textSerializers
        )
      );
    }
    // 放入迭代起
    iterator.push({
      node: child,
      pos: nodeStart + pos,
      parent: current,
      index: i,
      textSerializer,
    });
    pos = end;
  }
  return iterator;
}

interface IteratorItem {
  node: ProseMirrorNode;
  pos: number;
  parent: ProseMirrorNode | undefined;
  index: number;
  textSerializer?: TextSerializer;
}
