import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";

export interface ItalicOptions {
  HTMLAttributes: Record<string, any>;
}

// feat asciidoc的highlight语法以及UI呈现方式 https://docs.asciidoctor.org/asciidoc/latest/text/italic/
// 摒弃asciidoc用法1, 使用_word_后面跟随标点符号的情况下, 也是斜体
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    italic: {
      /**
       * Set an italic mark
       */
      setItalic: () => ReturnType;
      /**
       * Toggle an italic mark
       */
      toggleItalic: () => ReturnType;
      /**
       * Unset an italic mark
       */
      unsetItalic: () => ReturnType;
    };
  }
}

//export const starInputRegex = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))$/
//export const starPasteRegex = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))/g
//export const underscoreInputRegex = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))$/
export const underscoreInputRegex = /(__(?!\s+__)((?:[^_]+))__(?!\s+__))$/;
export const underscorePasteRegex =
  /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))/g;

export const Italic = Mark.create<ItalicOptions>({
  name: "italic",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      asciidocFormated: {
        default: "__{{content}}__",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "em",
      },
      {
        tag: "i",
        getAttrs: (node) =>
          (node as HTMLElement).style.fontStyle !== "normal" && null,
      },
      {
        style: "font-style=italic",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "em",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setItalic:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleItalic:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetItalic:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-i": () => this.editor.commands.toggleItalic(),
      "Mod-I": () => this.editor.commands.toggleItalic(),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: underscoreInputRegex,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: underscorePasteRegex,
        type: this.type,
      }),
    ];
  },
});
