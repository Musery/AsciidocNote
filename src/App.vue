<template>
  <n-layout has-sider>
    <n-config-provider :theme="darkTheme">
      <n-layout-sider
        bordered
        content-style="padding: 8px;"
        :width="240"
        style="height: 100vh"
      >
        <n-layout>
          <n-layout-header>
            <n-grid cols="4" item-responsive>
              <n-grid-item class="title">
                <n-icon :size="24">
                  <bookmarks-icon />
                </n-icon>
              </n-grid-item>
              <n-grid-item span="2" class="title">笔记本</n-grid-item>
              <n-grid-item class="title">
                <n-button quaternary @click="handleSelect('AddNotebook')">
                  <template #icon>
                    <n-icon :size="24">
                      <add-icon />
                    </n-icon>
                  </template>
                </n-button>
              </n-grid-item>
            </n-grid>
          </n-layout-header>
          <n-layout-content @contextmenu="handleContextmenu">
            <n-menu
              :options="initMenuOptions()"
              :node-props="setNodeProps"
              v-model:value="asciidoc.currentNote"
              v-model:expanded-keys="asciidoc.currentNotebook"
            ></n-menu>
          </n-layout-content>
        </n-layout>
      </n-layout-sider>
    </n-config-provider>
    <n-layout-content content-style="padding: 8px;" style="height: 100vh">
      <editor :path="currentPath" />
    </n-layout-content>
  </n-layout>
  <n-dropdown
    placement="bottom-start"
    trigger="manual"
    :x="contextMenu.x"
    :y="contextMenu.y"
    :options="contextMenu.options()"
    :show="contextMenu.show"
    :on-clickoutside="onClickoutside"
    @select="handleSelect"
  />
  <!--增改模板-->
  <n-modal
    style="width: 320px"
    v-model:show="modal.show"
    :showIcon="false"
    :closable="false"
    preset="dialog"
    positive-text="确认"
    negative-text="取消"
    @positive-click="submitCallback"
    actionStyle="justify-content:center"
    :title="modal.isDelete ? '' : modal.context"
  >
    <div v-if="modal.isDelete" style="text-align: center">
      {{ modal.context }}
    </div>
    <n-select
      v-else-if="modal.isMove"
      v-model:value="modal.move.to"
      :options="initMoveList()"
    ></n-select>
    <n-input
      v-else
      placeholder="请输入名称"
      v-model:value="modal.editName"
    ></n-input>
  </n-modal>
</template>

<script>
import Editor from "./components/Editor.vue";
import YAML from "yaml";
import {
  MenuBookOutlined as BookIcon,
  BookmarkBorderOutlined as BookmarkIcon,
  BookmarksOutlined as BookmarksIcon,
  AddCircleOutlineOutlined as AddIcon,
} from "@vicons/material";
import { h, nextTick, computed } from "vue";
import { NIcon, darkTheme } from "naive-ui";
import { v4 as uuidv4 } from "uuid";
export default {
  props: {
    workspace: {
      type: String,
      default: "/Users/jonathan/Documents/doc/asciidoc",
    },
  },

  components: {
    Editor,
    BookmarksIcon,
    AddIcon,
  },

  data() {
    return {
      asciidoc: {
        notebooks: [],
        currentNote: "",
        currentNotebook: [],
      },
      darkTheme,
      // 当前右键选中Menu节点名字
      currentName: "",
      // 当前右键选中Menu节点UUID
      currentUUid: "",
      // 当前右键选中Menu节点类型 (notebook|note)
      currentType: "",
      // 当前选中的文件路径
      currentPath: computed(() => {
        let note = undefined;
        for (const notebook of this.asciidoc.notebooks) {
          note = notebook.notes.find(
            (note) => note.uuid === this.asciidoc.currentNote
          );
          if (note !== undefined) {
            break;
          }
        }
        return note?.path;
      }),
      modal: {
        show: false,
        option: "",
        editName: "",
        move: {
          from: "",
          to: "",
        },
        isMove: computed(() => {
          return this.modal.option === "MoveNote";
        }),
        isDelete: computed(() => {
          return (
            this.modal.option === "DeleteNote" ||
            this.modal.option === "DeleteNotebook"
          );
        }),
        context: computed(() => {
          switch (this.modal.option) {
            case "AddNotebook":
              return "创建笔记本";
            case "AddNote":
              return "创建笔记";
            case "EditNotebook":
              return `编辑笔记本`;
            case "EditNote":
              return `编辑笔记`;
            case "DeleteNotebook":
              return `是否删除笔记本 "${this.currentName}"`;
            case "DeleteNote":
              return `是否删除笔记 "${this.currentName}"`;
            case "MoveNote":
              return `移动笔记 "${this.currentName}" 到`;
            default:
              return "";
          }
        }),
      },
      contextMenu: {
        show: false,
        x: 0,
        y: 0,
        options: () => {
          if (this.currentType === "notebook") {
            return [
              {
                label: "新增笔记本",
                key: "AddNotebook",
                show: false,
              },
              {
                label: "新增笔记",
                key: "AddNote",
              },
              {
                label: "编辑笔记本",
                key: "EditNotebook",
              },
              {
                label: "删除笔记本",
                key: "DeleteNotebook",
              },
              {
                label: "置顶",
                key: "MoveUpNotebook",
              },
            ];
          } else {
            return [
              {
                label: "编辑笔记",
                key: "EditNote",
              },
              {
                label: "删除笔记",
                key: "DeleteNote",
              },
              {
                label: "置顶",
                key: "MoveUpNote",
              },
              {
                label: "移动到笔记本",
                key: "MoveNote",
              },
            ];
          }
        },
      },
    };
  },

  mounted() {
    const path = `${this.workspace}/notebook.yaml`;
    window.electronAPI.readFile(path, "initNotebook", (data) => {
      const asciidoc = YAML.parse(data.content);
      this.asciidoc.notebooks = asciidoc.notebooks;
      if (asciidoc.currentNote) {
        this.asciidoc.currentNote = asciidoc.currentNote;
        this.asciidoc.currentNotebook = asciidoc.currentNotebook;
      } else {
        // 设置默认
        if (asciidoc.notebooks.length > 0) {
          this.asciidoc.currentNotebook.push(asciidoc.notebooks[0].uuid);
          if (asciidoc.notebooks[0].notes.length > 0) {
            this.asciidoc.currentNote = asciidoc.notebooks[0].notes[0].uuid;
          }
        }
      }
    });
  },
  methods: {
    renderIcon(icon) {
      return () => h(NIcon, null, { default: () => h(icon) });
    },
    initMenuOptions() {
      return this.asciidoc.notebooks.map((notebook) => {
        return {
          label: notebook.name,
          key: notebook.uuid,
          type: "notebook",
          icon: this.renderIcon(BookmarkIcon),
          children: notebook.notes.map((note) => {
            return {
              label: note.name,
              path: note.path,
              key: note.uuid,
              type: "note",
              icon: this.renderIcon(BookIcon),
            };
          }),
        };
      });
    },
    setNodeProps(option) {
      // 渲染属性ID
      return {
        name: option.label,
        uuid: option.key,
        type: option.type,
      };
    },
    handleContextmenu(e) {
      e.preventDefault();
      // 不停往上找id和type, 直至找到(或者最多5次)
      let node = e.target;
      let time = 0;
      while (time < 5 && "n-menu-item" !== node.className) {
        time++;
        node = node.offsetParent;
      }
      this.contextMenu.show = false;
      this.currentUUid = node.attributes.uuid.value;
      this.currentType = node.attributes.type.value;
      this.currentName = node.attributes.name.value;
      if (this.currentUUid) {
        nextTick().then(() => {
          this.contextMenu.show = true;
          this.contextMenu.x = e.clientX;
          this.contextMenu.y = e.clientY;
        });
      }
    },
    onClickoutside() {
      this.contextMenu.show = false;
    },
    handleSelect(key) {
      switch (key) {
        case "EditNote":
        case "EditNotebook":
          this.modal.editName = this.currentName;
          this.modal.option = key;
          this.modal.show = true;
          break;
        case "DeleteNote":
        case "DeleteNotebook":
          this.modal.option = key;
          this.modal.show = true;
          break;
        case "AddNote":
        case "AddNotebook":
          this.modal.editName = "";
          this.modal.option = key;
          this.modal.show = true;
          break;
        case "MoveUpNote":
        case "MoveUpNotebook":
          this.modal.option = key;
          this.submitCallback();
          break;
        case "MoveNote":
          // 找到起始值
          this.asciidoc.notebooks.forEach((notebook) => {
            const note = notebook.notes.find(
              (note) => note.uuid === this.currentUUid
            );
            if (note !== undefined) {
              this.modal.move.from = notebook.uuid;
              this.modal.move.to = notebook.uuid;
            }
          });
          this.modal.option = key;
          this.modal.show = true;
          break;
        default:
          break;
      }
      this.contextMenu.show = false;
    },
    initMoveList() {
      return this.asciidoc.notebooks.map((notebook) => {
        return {
          label: notebook.name,
          value: notebook.uuid,
        };
      });
    },
    submitCallback() {
      switch (this.modal.option) {
        case "AddNotebook":
          const notebook = {
            name: this.modal.editName,
            uuid: uuidv4(),
            notes: [],
          };
          this.asciidoc.notebooks.push(notebook);
          break;
        case "EditNotebook":
          this.asciidoc.notebooks.find(
            (notebook) => notebook.uuid === this.currentUUid
          ).name = this.modal.editName;
          break;
        case "DeleteNotebook":
          const deleteIndex = this.asciidoc.notebooks.findIndex(
            (notebook) => notebook.uuid === this.currentUUid
          );
          if (deleteIndex !== -1) {
            this.asciidoc.notebooks.splice(deleteIndex, 1);
          }
          break;
        case "MoveUpNotebook":
          const moveIndex = this.asciidoc.notebooks.findIndex(
            (notebook) => notebook.uuid === this.currentUUid
          );
          if (moveIndex > 0) {
            const notebook = this.asciidoc.notebooks.splice(moveIndex, 1)[0];
            this.asciidoc.notebooks.unshift(notebook);
          }
          break;
        case "AddNote":
          const uuid = uuidv4();
          const note = {
            name: this.modal.editName,
            uuid: uuid,
            path: `${this.workspace}/${uuid}`,
          };
          this.asciidoc.notebooks
            .find((notebook) => notebook.uuid === this.currentUUid)
            .notes.push(note);
          break;
        case "EditNote":
          this.asciidoc.notebooks.forEach((notebook) => {
            const note = notebook.notes.find(
              (note) => note.uuid === this.currentUUid
            );
            if (note !== undefined) {
              note.name = this.modal.editName;
            }
          });
          break;
        case "DeleteNote":
          this.asciidoc.notebooks.forEach((notebook) => {
            const index = notebook.notes.findIndex(
              (note) => note.uuid === this.currentUUid
            );
            if (index !== -1) {
              notebook.notes.splice(index, 1);
            }
          });
          break;
        case "MoveUpNote":
          this.asciidoc.notebooks.forEach((notebook) => {
            const index = notebook.notes.findIndex(
              (note) => note.uuid === this.currentUUid
            );
            if (index > 0) {
              const note = notebook.notes.splice(index, 1)[0];
              notebook.notes.unshift(note);
            }
          });
          break;
        case "MoveNote":
          if (this.modal.move.from !== this.modal.move.to) {
            const notebookFrom = this.asciidoc.notebooks.find(
              (notebook) => notebook.uuid === this.modal.move.from
            );
            if (notebookFrom !== undefined) {
              const moveIndex = notebookFrom.notes.findIndex(
                (note) => note.uuid === this.currentUUid
              );
              if (moveIndex !== -1) {
                const notebookTo = this.asciidoc.notebooks.find(
                  (notebook) => notebook.uuid === this.modal.move.to
                );
                if (notebookTo !== undefined) {
                  const node = notebookFrom.notes.splice(moveIndex, 1)[0];
                  notebookTo.notes.push(node);
                }
              }
            }
          }
          break;
      }
      // 反写回文件
      window.electronAPI.writeFile(
        `${this.workspace}/notebook.yaml`,
        YAML.stringify(this.asciidoc),
        "saveNotebook",
        (data) => {}
      );
    },
  },
};
</script>
<style scoped>
.title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
</style>
