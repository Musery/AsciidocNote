import {
  Mark,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from "@tiptap/core";

export interface HighlightOptions {
  multicolor: boolean;
  HTMLAttributes: Record<string, any>;
}

// feat asciidoc的highlight语法以及UI呈现方式 https://docs.asciidoctor.org/asciidoc/latest/text/highlight/

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    highlight: {
      /**
       * Set a highlight mark
       */
      setHighlight: (attributes?: { color: string }) => ReturnType;
      /**
       * Toggle a highlight mark
       */
      toggleHighlight: (attributes?: { color: string }) => ReturnType;
      /**
       * Unset a highlight mark
       */
      unsetHighlight: () => ReturnType;
    };
  }
}

//export const inputRegex = /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))$/
export const shapeInputRegex = /(#(?!\s+#)((?:[^#]+))#(?!\s+#))$/;
export const shapePasteRegex = /(?:^|\s)(#(?!\s+#)((?:[^#]+))#(?!\s+#))/g;

export const Highlight = Mark.create<HighlightOptions>({
  name: "highlight",
  priority: 20,
  addOptions() {
    return {
      multicolor: false,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    if (!this.options.multicolor) {
      return {
        asciidocFormated: {
          default: "##{{content}}##",
        },
      };
    }

    return {
      asciidocFormated: {
        default: "##{{content}}##",
      },
      color: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-color") || element.style.backgroundColor,
        renderHTML: (attributes) => {
          if (!attributes.color) {
            return {};
          }

          return {
            "data-color": attributes.color,
            style: `background-color: ${attributes.color}; color: inherit`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "mark",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "mark",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setHighlight:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleHighlight:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-h": () => this.editor.commands.toggleHighlight(),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: shapeInputRegex,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: shapePasteRegex,
        type: this.type,
      }),
    ];
  },
});
