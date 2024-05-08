<template>
  <n-layout position="absolute">
    <n-layout-header style="height: 48px; padding: 12px" bordered>
      <n-flex size="small">
        <n-button
          v-for="(item, index) in pluginButtons"
          size="small"
          @click="item.click"
          :index="index"
          :type="item.active() ? 'primary' : 'default'"
          :disabled="item.disabled()"
        >
          <template #icon>
            <n-icon :component="item.icon" />
          </template>
        </n-button>
        <n-button
          v-for="(item, index) in markButtons"
          size="small"
          @click="item.click"
          :index="index"
          :type="item.active() ? 'primary' : 'default'"
          :disabled="item.disabled()"
        >
          <template #icon>
            <n-icon :component="item.icon" />
          </template>
        </n-button>
        <n-button
          v-for="(item, index) in nodeButtons"
          size="small"
          @click="item.click"
          :index="index"
          :type="item.active() ? 'primary' : 'default'"
          :disabled="item.disabled()"
        >
          <template v-if="typeof item.icon === 'string'">
            {{ item.icon }}
          </template>
          <template v-else>
            <n-icon :component="item.icon" />
          </template>
        </n-button>
      </n-flex>
    </n-layout-header>
  </n-layout>
  <n-layout position="absolute" style="top: 48px; bottom: 48px">
    <n-layout-content>
      <bubble-menu
        :editor="editor"
        :tippy-options="{ duration: 100 }"
        v-if="editor"
      >
        <n-button
          v-for="(item, index) in markButtons"
          size="small"
          @click="item.click"
          :index="index"
          secondary
          :type="item.active() ? 'primary' : 'default'"
        >
          <template #icon>
            <n-icon :component="item.icon" />
          </template>
        </n-button>
      </bubble-menu>
      <floating-menu
        :editor="editor"
        :tippy-options="{ duration: 100 }"
        v-if="editor"
      >
        <n-button
          v-for="(item, index) in nodeButtons"
          size="small"
          @click="item.click"
          :index="index"
          secondary
          :type="item.active() ? 'primary' : 'default'"
        >
          <template v-if="typeof item.icon === 'string'">
            {{ item.icon }}
          </template>
          <template v-else>
            <n-icon :component="item.icon" />
          </template>
        </n-button>
      </floating-menu>
      <div class="table-of-content">
        <ToC :editor="editor" :items="anchors"></ToC>
      </div>
      <editor-content :editor="editor" />
    </n-layout-content>
  </n-layout>
</template>

<script>
import { toAsciidoc } from "../asciidoc/serializer";

import codemark from "prosemirror-codemark";
import "prosemirror-codemark/dist/codemark.css";

import {
  Editor,
  EditorContent,
  BubbleMenu,
  FloatingMenu,
  Extension,
} from "@tiptap/vue-3";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { History } from "@tiptap/extension-history";
import { Placeholder } from "@tiptap/extension-placeholder";
import {
  TableOfContents,
  getHierarchicalIndexes,
} from "@tiptap-pro/extension-table-of-contents";
import { ToC } from "./ToC";

import { Document } from "../asciidoc/node/extension-document";
import { Paragraph } from "../asciidoc/node/extension-paragraph";
import { Text } from "../asciidoc/node/extension-text";
import { Blockquote } from "../asciidoc/node/extension-blockquote";
import { HardBreak } from "../asciidoc/node/extension-hard-break";
import { Heading } from "../asciidoc/node/extension-heading";
import { HorizontalRule } from "../asciidoc/node/extension-horizontal-rule";
import { Image } from "../asciidoc/node/extension-image";
import { BulletList } from "../asciidoc/node/extension-bullet-list";
import { OrderedList } from "../asciidoc/node/extension-ordered-list";
import { ListItem } from "../asciidoc/node/extension-list-item";
import { TaskList } from "../asciidoc/node/extension-task-list";
import { TaskItem } from "../asciidoc/node/extension-task-item";
import { CodeBlockLowlight } from "../asciidoc/node/extension-code-block-lowlight";
import { Table } from "../asciidoc/node/extension-table";
import { TableRow } from "../asciidoc/node/extension-table-row";
import { TableHeader } from "../asciidoc/node/extension-table-header";
import { TableCell } from "../asciidoc/node/extension-table-cell";

import { Bold } from "../asciidoc/mark/extension-bold";
import { Code } from "../asciidoc/mark/extension-code";
import { Italic } from "../asciidoc/mark/extension-italic";
import { Link } from "../asciidoc/mark/extension-link";
import { Strike } from "../asciidoc/mark/extension-strike";
import { Underline } from "../asciidoc/mark/extension-underline";
import { Subscript } from "../asciidoc/mark/extension-subscript";
import { Superscript } from "../asciidoc/mark/extension-superscript";
import { Highlight } from "../asciidoc/mark/extension-highlight";

import css from "highlight.js/lib/languages/css";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
// load all highlight.js languages
import { createLowlight } from "lowlight";

import "./styles.scss";
import {
  FormatBoldOutlined as BoldIcon,
  FormatItalicOutlined as ItalicIcon,
  FormatStrikethroughOutlined as StrikeIcon,
  FormatColorFillOutlined as HighlightIcon,
  LinkOutlined as LinkIcon,
  FormatUnderlinedOutlined as UnderlineIcon,
  SubscriptOutlined as SubscriptIcon,
  SuperscriptOutlined as SuperscriptIcon,
  FormatQuoteOutlined as BlockQuoteIcon,
  CodeOutlined as CodeBlockIcon,
  FormatListBulletedOutlined as BulletedIcon,
  FormatListNumberedOutlined as OrderedIcon,
  ChecklistOutlined as CheckedIcon,
  HorizontalRuleOutlined as HorizontalIcon,
  TableChartOutlined as TableIcon,
  UndoOutlined as UndoIcon,
  RedoOutlined as RedoIcon,
} from "@vicons/material";
import { markRaw } from "vue";

export default {
  components: {
    EditorContent,
    ToC,
    FloatingMenu,
    BubbleMenu,
  },

  props: {
    path: {
      type: String,
      default: undefined,
    },
  },

  data() {
    return {
      editor: null,
      content: "",
      anchors: [],
      pluginButtons: [
        {
          icon: markRaw(UndoIcon),
          click: () => {
            this.editor.chain().focus().undo().run();
          },
          disabled: () => !(this.editor && this.editor.can().undo()),
          active: () => false,
        },
        {
          icon: markRaw(RedoIcon),
          click: () => {
            this.editor.chain().focus().redo().run();
          },
          disabled: () => !(this.editor && this.editor.can().redo()),
          active: () => false,
        },
      ],
      markButtons: [
        {
          icon: markRaw(BoldIcon),
          click: () => {
            this.editor.chain().focus().toggleBold().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("bold"),
        },
        {
          icon: markRaw(ItalicIcon),
          click: () => {
            this.editor.chain().focus().toggleItalic().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("italic"),
        },
        {
          icon: markRaw(StrikeIcon),
          click: () => {
            this.editor.chain().focus().toggleStrike().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("strike"),
        },
        {
          icon: markRaw(HighlightIcon),
          click: () => {
            this.editor.chain().focus().toggleHighlight().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("highlight"),
        },
        {
          // todo
          icon: markRaw(LinkIcon),
          click: () => {
            this.editor.chain().focus().toggleLink().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("link"),
        },
        {
          icon: markRaw(UnderlineIcon),
          click: () => {
            this.editor.chain().focus().toggleUnderline().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("underline"),
        },
        {
          icon: markRaw(UnderlineIcon),
          click: () => {
            this.editor.chain().focus().toggleUnderline().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("underline"),
        },
        {
          icon: markRaw(SubscriptIcon),
          click: () => {
            this.editor.chain().focus().toggleSubscript().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("subscript"),
        },
        {
          icon: markRaw(SuperscriptIcon),
          click: () => {
            this.editor.chain().focus().toggleSuperscript().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("superscript"),
        },
      ],
      nodeButtons: [
        {
          icon: "H1",
          click: () => {
            this.editor.chain().focus().toggleHeading({ level: 1 }).run();
          },
          disabled: () => {},
          active: () =>
            this.editor && this.editor.isActive("heading", { level: 1 }),
        },
        {
          icon: "H2",
          click: () => {
            this.editor.chain().focus().toggleHeading({ level: 2 }).run();
          },
          disabled: () => {},
          active: () =>
            this.editor && this.editor.isActive("heading", { level: 2 }),
        },
        {
          icon: markRaw(BlockQuoteIcon),
          click: () => {
            this.editor.chain().focus().toggleBlockquote().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("blockquote"),
        },
        {
          icon: markRaw(CodeBlockIcon),
          click: () => {
            this.editor.chain().focus().toggleCodeBlock().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("codeBlock"),
        },
        {
          icon: markRaw(BulletedIcon),
          click: () => {
            this.editor.chain().focus().toggleBulletList().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("bulletList"),
        },
        {
          icon: markRaw(OrderedIcon),
          click: () => {
            this.editor.chain().focus().toggleOrderedList().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("orderedList"),
        },
        {
          icon: markRaw(CheckedIcon),
          click: () => {
            this.editor.chain().focus().toggleTaskList().run();
          },
          disabled: () => {},
          active: () => this.editor && this.editor.isActive("taskList"),
        },
        {
          icon: markRaw(HorizontalIcon),
          click: () => {
            this.editor.chain().focus().setHorizontalRule().run();
          },
          disabled: () => {},
          active: () => false,
        },
        {
          icon: markRaw(TableIcon),
          click: () => {
            this.editor.chain().focus().insertTable().run();
          },
          disabled: () => {},
          active: () => false,
        },
      ],
    };
  },

  watch: {
    path(newValue, oldValue) {
      if (newValue === oldValue) {
        return;
      }
      if (newValue !== undefined) {
        window.electronAPI.readFile(newValue, "initNote", (data) => {
          if (data.filePath !== undefined) {
            // 读取文件内容然后设置值
            this.editor.commands.setContent(data.content, true);
          } else {
            // 除文件不存在以外的需要进行错误提示 todo
            this.editor.commands.setContent("", true);
          }
        });
      }
    },
  },
  mounted() {
    const update = (anchors) => {
      this.anchors = anchors;
    };
    const lowlight = createLowlight();
    lowlight.register({ html });
    lowlight.register({ css });
    lowlight.register({ js });
    lowlight.register({ ts });
    this.editor = new Editor({
      extensions: [
        Bold,
        Code,
        Italic,
        Link, //需要注意和Image输入冲突(已经调整image priority)
        Highlight, // 注意插件优先级(与所有内置样式[.?\S]#\S#存在冲突, 已经调整Highlight priority)
        Underline,
        Strike,
        Subscript,
        Superscript,

        Document,
        Paragraph,
        Text,
        Heading,
        HorizontalRule,
        HardBreak,
        Blockquote,
        Image.configure({
          allowBase64: true,
        }),
        ListItem,
        BulletList,
        OrderedList,
        TaskItem,
        TaskList,
        //CodeBlock,
        CodeBlockLowlight.configure({
          lowlight,
        }),
        TableCell,
        TableHeader,
        TableRow,
        Table,

        //Typography,
        Extension.create({
          name: "codemarkPlugin",
          addProseMirrorPlugins() {
            return codemark({ markType: this.editor.schema.marks.code });
          },
        }),
        History,
        Dropcursor,
        Gapcursor,
        TableOfContents.configure({
          getIndex: getHierarchicalIndexes,
          onUpdate: update,
        }),
        Placeholder.configure({
          placeholder: "",
        }),
      ],
      content: this.content,
      onUpdate: () => {
        if (this.path !== undefined) {
          window.electronAPI.writeFile(
            this.path,
            this.editor.getHTML(),
            "saveNote",
            (data) => {}
          );
          console.log(toAsciidoc(this.editor));
        }
      },
    });
  },
  beforeUnmount() {
    this.editor.destroy();
  },
};
</script>
<style scoped lang="scss">
::v-deep(.ProseMirror) {
  padding: 0.5em 0.75em;
  min-height: 95vh;
  outline: none;
  /**区块样式*/
  blockquote {
    padding-left: 1rem;
    border-left: 3px solid rgba(#0d0d0d, 0.1);
  }

  /**PlaceHolder 样式*/
  p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }

  /**内联样式code*/
  code {
    font-size: 0.9rem;
    padding: 0.25em;
    border-radius: 0.25em;
    background-color: rgba(#616161, 0.1);
    color: #616161;
    box-decoration-break: clone;
  }

  /**代码块 */
  pre {
    background: #0d0d0d;
    color: #fff;
    font-family: "JetBrainsMono", monospace;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
    }
    .hljs-comment,
    .hljs-quote {
      color: #616161;
    }

    .hljs-variable,
    .hljs-template-variable,
    .hljs-attribute,
    .hljs-tag,
    .hljs-name,
    .hljs-regexp,
    .hljs-link,
    .hljs-name,
    .hljs-selector-id,
    .hljs-selector-class {
      color: #f98181;
    }

    .hljs-number,
    .hljs-meta,
    .hljs-built_in,
    .hljs-builtin-name,
    .hljs-literal,
    .hljs-type,
    .hljs-params {
      color: #fbbc88;
    }

    .hljs-string,
    .hljs-symbol,
    .hljs-bullet {
      color: #b9f18d;
    }

    .hljs-title,
    .hljs-section {
      color: #faf594;
    }

    .hljs-keyword,
    .hljs-selector-tag {
      color: #70cff8;
    }

    .hljs-emphasis {
      font-style: italic;
    }

    .hljs-strong {
      font-weight: 700;
    }
  }
  /** 任务样式 */
  ul[data-type="taskList"] {
    list-style: none;
    padding: 1em;

    p {
      margin: 0;
    }

    li {
      display: flex;

      > label {
        flex: 0 0 auto;
        margin-right: 0.5rem;
        user-select: none;
      }

      > div {
        flex: 1 1 auto;
      }

      ul li,
      ol li {
        display: list-item;
      }

      ul[data-type="taskList"] > li {
        display: flex;
      }
    }
  }
  table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    margin: 0;
    overflow: hidden;

    td,
    th {
      min-width: 1em;
      border: 2px solid #ced4da;
      padding: 3px 5px;
      vertical-align: top;
      box-sizing: border-box;
      position: relative;

      > * {
        margin-bottom: 0;
      }
    }

    th {
      font-weight: bold;
      text-align: left;
      background-color: #f1f3f5;
    }

    .selectedCell:after {
      z-index: 2;
      position: absolute;
      content: "";
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      background: rgba(200, 200, 255, 0.4);
      pointer-events: none;
    }

    .column-resize-handle {
      position: absolute;
      right: -2px;
      top: 0;
      bottom: -2px;
      width: 4px;
      background-color: #adf;
      pointer-events: none;
    }

    p {
      margin: 0;
    }
  }
  .tableWrapper {
    padding: 1rem 0;
    overflow-x: auto;
  }

  .resize-cursor {
    cursor: ew-resize;
    cursor: col-resize;
  }
}

.tippy-content {
  button {
    margin: 0 0.1rem;
    font-size: medium;
  }
}
</style>
