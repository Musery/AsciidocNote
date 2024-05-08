// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron");

const replayOnCallback = {};

const registReplay = (replayOn, callback) => {
  if (replayOnCallback[replayOn] === undefined) {
    replayOnCallback[replayOn] = "regist";
    ipcRenderer.on(replayOn, (event, data) => {
      callback(data);
    });
  }
};

contextBridge.exposeInMainWorld("electronAPI", {
  readFile: (filePath, replayOn, callback) => {
    registReplay(replayOn, callback);
    ipcRenderer.send("read-file-request", filePath, replayOn);
  },
  writeFile: (filePath, content, replayOn, callback) => {
    registReplay(replayOn, callback);
    ipcRenderer.send("write-file-request", filePath, content, replayOn);
  },
});
