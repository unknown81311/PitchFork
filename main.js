// Modules to control application life and create native browser window
const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron')
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require("https");
const fsPromises = require("fs/promises");
const axios = require('axios').default;
var registry_js_1 = require("registry-js");
var path_1 = path;
var fs_1 = fs;
var VDF = require("@node-steam/vdf");
var os_1 = os;


function verifyGameManifestPath(gameId, libraryPath) {
    if (fs_1.existsSync(path_1.join(libraryPath, "appmanifest_".concat(gameId, ".acf")))) {
        return path_1.join(libraryPath, "appmanifest_".concat(gameId, ".acf"));
    }
    return null;
}
function getGameManifestPath(paths, gameId) {
    for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
        var path_2 = paths_1[_i];
        var manifest = verifyGameManifestPath(gameId, path_2);
        if (manifest && getGame(manifest)) {
            return manifest;
        }
    }
    return null;
}
function getSteamLibraries(steamPath) {
    if (fs_1.existsSync(path_1.join(steamPath, 'steamapps', "libraryfolders.vdf"))) {
        var content = fs_1.readFileSync(path_1.join(steamPath, 'steamapps', "libraryfolders.vdf"), 'UTF-8');
        try {
            var parsed = VDF.parse(content);
            var libraries = parsed.LibraryFolders || parsed.libraryfolders;
            var paths = [];
            if (!libraries) {
                return null;
            }
            var values = Object.values(libraries);
            for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
                var value = values_1[_i];
                if (!value) {
                    continue;
                }
                if (typeof value === "string") {
                    paths.push(path_1.join(value, "steamapps"));
                }
                else if (value && value.path) {
                    paths.push(path_1.join(value.path, 'steamapps'));
                }
            }
            return paths;
        }
        catch (e) {
            return null;
        }
    }
    return null;
}
function getSteamPath() {
    if (process.platform === "linux") {
        var steamPath = path_1.join((0, os_1.homedir)(), ".steam", "root");
        if (fs_1.existsSync(steamPath)) {
            return steamPath;
        }
        return null;
    }
    if (process.platform !== "win32") {
        throw new Error("Unsupported operating system");
    }
    try {
        var entry = (0, registry_js_1.enumerateValues)(registry_js_1.HKEY.HKEY_LOCAL_MACHINE, 'SOFTWARE\\WOW6432Node\\Valve\\Steam').filter(function (value) { return value.name === "InstallPath"; })[0];
        var value = entry && String(entry.data) || null;
        return value;
    }
    catch (e) {
        return null;
    }
}
function getGame(manifestDir) {
    var content = fs_1.readFileSync(manifestDir, 'UTF-8');
    try {
        var parsed = VDF.parse(content);
        var dir = path_1.join(manifestDir, "../", 'common', parsed.AppState.installdir);
        if (!fs_1.existsSync(dir)) {
            return null;
        }
        var name = parsed.AppState.name;
        return { path: dir, name: name };
    }
    catch (e) {
        return null;
    }
}
function getGamePath(gameId) {
    var steamPath = getSteamPath();
    if (!steamPath)
        return null;
    var libraries = getSteamLibraries(steamPath);
    if (libraries === null) {
        return {
            game: null,
            steam: {
                path: steamPath,
                libraries: []
            }
        };
    }
    libraries.push(path_1.join(steamPath, 'steamapps'));
    var manifest = getGameManifestPath(libraries, gameId);
    if (!manifest) {
        return {
            game: null,
            steam: {
                path: steamPath,
                libraries: libraries
            }
        };
    }
    var game = getGame(manifest);
    return {
        game: game,
        steam: {
            path: steamPath,
            libraries: libraries
        }
    };
}

ipcMain.on("install", async(event) => {
    let _path = getGamePath(387990).game.path+'\\Survival\\Scripts\\game\\tools'
    if(!fs.existsSync(_path+'\\PotatoRifle.lua.bak'))
        fs.copyFileSync(_path+'\\PotatoRifle.lua',_path+'\\PotatoRifle.lua.bak')
    axios({
      method: 'get',
      url: 'https://github.com/unknown81311/PitchFork/raw/main/PotatoRifle.lua',
      responseType: 'stream'
    })
      .then(function (response) {
        response.data.pipe(fs.createWriteStream(_path+'\\PotatoRifle.lua'))
      });
    event.returnValue = true
})

ipcMain.on("uninstall", (event) => {
    let _path = getGamePath(387990).game.path+'\\Survival\\Scripts\\game\\tools'
    fs.copyFileSync(_path+'\\PotatoRifle.lua.bak',_path+'\\PotatoRifle.lua')
    fs.unlink(_path+'\\PotatoRifle.lua.bak',_=>{})
    event.returnValue = true
})


function createWindow() {

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        width: 850,
        height: 450,
        center: true,
        resizable: false,
        fullscreen: false,
        title: 'SM-CH Installer',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            nodeIntergration: true
        }
    })

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    app.on('activate', function() {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.