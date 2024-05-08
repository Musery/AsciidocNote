import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";

export interface SubscriptExtensionOptions {
  HTMLAttributes: Object;
}

// TODO 增加asciidoc的语法 https://docs.asciidoctor.org/asciidoc/latest/text/subscript-and-superscript/

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    subscript: {
      /**
       * Set a subscript mark
       */
      setSubscript: () => ReturnType;
      /**
       * Toggle a subscript mark
       */
      toggleSubscript: () => ReturnType;
      /**
       * Unset a subscript mark
       */
      unsetSubscript: () => ReturnType;
    };
  }
}

export const starInputRegex = /(~(?!\s+~)((?:[^~]+))~(?!\s+~))$/;
export const starPasteRegex = /(?:^|\s)(~(?!\s+~)((?:[^~]+))~(?!\s+~))/g;

export const Subscript = Mark.create<SubscriptExtensionOptions>({
  name: "subscript",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  addAttributes() {
    return {
      asciidocFormated: {
        default: "~{{content}}~",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "sub",
      },
      {
        style: "vertical-align",
        getAttrs(value) {
          // Don’t match this rule if the vertical align isn’t sub.
          if (value !== "sub") {
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
      "sub",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setSubscript:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      toggleSubscript:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      unsetSubscript:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-,": () => this.editor.commands.toggleSubscript(),
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