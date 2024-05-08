import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";

// feat asciidoc的Bold语法以及UI呈现方式 https://docs.asciidoctor.org/asciidoc/latest/text/bold/
// 摒弃asciidoc用法1, 使用*word*后面跟随标点符号的情况下, 也是加粗

export interface BoldOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    bold: {
      /**
       * Set a bold mark
       */
      setBold: () => ReturnType;
      /**
       * Toggle a bold mark
       */
      toggleBold: () => ReturnType;
      /**
       * Unset a bold mark
       */
      unsetBold: () => ReturnType;
    };
  }
}

//export const starInputRegex = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))$/
export const startInputRegex = /(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))$/;
export const startPasteRegex =
  /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))/g;

export const Bold = Mark.create<BoldOptions>({
  name: "bold",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      asciidocFormated: {
        default: "**{{content}}**",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "strong",
      },
      {
        tag: "b",
        getAttrs: (node) =>
          (node as HTMLElement).style.fontWeight !== "normal" && null,
      },
      {
        style: "font-weight",
        getAttrs: (value) =>
          /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "strong",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setBold:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleBold:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetBold:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-b": () => this.editor.commands.toggleBold(),
      "Mod-B": () => this.editor.commands.toggleBold(),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: startInputRegex,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: startPasteRegex,
        type: this.type,
      }),
    ];
  },
});
