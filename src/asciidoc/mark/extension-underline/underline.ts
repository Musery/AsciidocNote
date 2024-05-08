import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";

export interface UnderlineOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    underline: {
      /**
       * Set an underline mark
       */
      setUnderline: () => ReturnType;
      /**
       * Toggle an underline mark
       */
      toggleUnderline: () => ReturnType;
      /**
       * Unset an underline mark
       */
      unsetUnderline: () => ReturnType;
    };
  }
}

export const startInputRegex =
  /(\[.?underline\]#(?!\s+#)((?:[^#]+))#(?!\s+#))$/;
export const startPasteRegex =
  /(?:^|\s)(\[.?underline\]#(?!\s+#)((?:[^#]+))#(?!\s+#))/g;

export const Underline = Mark.create<UnderlineOptions>({
  name: "underline",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      asciidocFormated: {
        default: "[.underline]#{{content}}#",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "u",
      },
      {
        style: "text-decoration",
        consuming: false,
        getAttrs: (style) =>
          (style as string).includes("underline") ? {} : false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "u",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setUnderline:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleUnderline:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetUnderline:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-u": () => this.editor.commands.toggleUnderline(),
      "Mod-U": () => this.editor.commands.toggleUnderline(),
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
