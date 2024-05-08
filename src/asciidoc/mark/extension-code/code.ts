import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";

export interface CodeOptions {
  HTMLAttributes: Record<string, any>;
}

// feat asciidoc的Code语法以及UI呈现方式 https://docs.asciidoctor.org/asciidoc/latest/text/monospace/
// 摒弃asciidoc用法1, 使用`word`后面跟随标点符号的情况下, 也是背显

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    code: {
      /**
       * Set a code mark
       */
      setCode: () => ReturnType;
      /**
       * Toggle inline code
       */
      toggleCode: () => ReturnType;
      /**
       * Unset a code mark
       */
      unsetCode: () => ReturnType;
    };
  }
}

//export const inputRegex = /(?:^|\s)(`(?!\s+`)((?:[^`]+))`(?!\s+`))$/
export const inputRegex = /(``(?!\s+``)((?:[^`]+))``(?!\s+``))$/;
export const pasteRegex = /(?:^|\s)(``(?!\s+``)((?:[^`]+))``(?!\s+``))/g;

export const Code = Mark.create<CodeOptions>({
  name: "code",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      asciidocFormated: {
        default: "``{{content}}``",
      },
    };
  },

  excludes: "_",

  code: true,

  exitable: true,

  parseHTML() {
    return [{ tag: "code" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "code",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setCode:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleCode:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetCode:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-e": () => this.editor.commands.toggleCode(),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: pasteRegex,
        type: this.type,
      }),
    ];
  },
});
