import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";
export interface SuperscriptExtensionOptions {
  HTMLAttributes: Object;
}

// TODO 增加asciidoc的语法 https://docs.asciidoctor.org/asciidoc/latest/text/subscript-and-superscript/

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    superscript: {
      /**
       * Set a superscript mark
       */
      setSuperscript: () => ReturnType;
      /**
       * Toggle a superscript mark
       */
      toggleSuperscript: () => ReturnType;
      /**
       * Unset a superscript mark
       */
      unsetSuperscript: () => ReturnType;
    };
  }
}

export const starInputRegex = /(\^(?!\s+\^)((?:[^\^]+))\^(?!\s+\^))$/;
export const starPasteRegex = /(?:^|\s)(\^(?!\s+\^)((?:[^\^]+))\^(?!\s+\^))/g;

export const Superscript = Mark.create<SuperscriptExtensionOptions>({
  name: "superscript",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      asciidocFormated: {
        default: "^{{content}}^",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "sup",
      },
      {
        style: "vertical-align",
        getAttrs(value) {
          // Don’t match this rule if the vertical align isn’t super.
          if (value !== "super") {
            return false;
          }

          // If it falls through we’ll match, and this mark will be applied.
          return null;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "sup",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setSuperscript:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleSuperscript:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetSuperscript:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-.": () => this.editor.commands.toggleSuperscript(),
    };
  },
  addInputRules() {
    return [
      markInputRule({
        find: starInputRegex,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: starPasteRegex,
        type: this.type,
      }),
    ];
  },
});
