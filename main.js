const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require('electron');
const path = require('path');
const si = require('systeminformation');

let mainWindow;
let tray;
let isQuitting = false;
let updateInterval;

// Ultra-lightweight configuration
const CONFIG = {
    width: 320,
    height: 240,
    updateInterval: 2000, // 2 seconds
    opacity: 0.85,
    blur: 20,
    cornerRadius: 15
};

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    mainWindow = new BrowserWindow({
        width: CONFIG.width,
        height: CONFIG.height,
        x: width - CONFIG.width - 20,
        y: height - CONFIG.height - 40,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: true,
        minimizable: false,
        maximizable: false,
        closable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        show: false,
        opacity: CONFIG.opacity
    });

    mainWindow.loadFile('index.html');

    // Hide window when focus is lost
    mainWindow.on('blur', () => {
        if (!isQuitting) {
            mainWindow.hide();
        }
    });

    // Prevent window from being closed, just hide it
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    // Window is ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        startSystemMonitoring();
    });
}

function createTray() {
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    
    // Create a simple tray icon if file doesn't exist
    if (!require('fs').existsSync(iconPath)) {
        createTrayIcon();
    }
    
    tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Monitor',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Settings',
            click: () => {
                // TODO: Open settings window
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip('Glass System Monitor');
    tray.setContextMenu(contextMenu);
    
    // Show window on tray click
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
}

function createTrayIcon() {
    const { nativeImage } = require('electron');
    const iconSize = 16;
    
    // Create a simple colored square icon
    const canvas = document.createElement('canvas');
    canvas.width = iconSize;
    canvas.height = iconSize;
    const ctx = canvas.getContext('2d');
    
    // Draw a green square
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, iconSize, iconSize);
    
    const icon = nativeImage.createFromDataURL(canvas.toDataURL());
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    
    require('fs').mkdirSync(path.dirname(iconPath), { recursive: true });
    require('fs').writeFileSync(iconPath, icon.toPNG());
}

async function getSystemStats() {
    try {
        const [cpu, mem, temp, disk, currentLoad] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.cpuTemperature(),
            si.diskLayout(),
            si.currentLoad()
        ]);

        const stats = {
            cpu: {
                usage: Math.round(currentLoad.currentLoad || 0),
                cores: cpu.cores,
                speed: cpu.speed || 0,
                temp: temp.main || 0,
                tempCores: temp.cores || []
            },
            memory: {
                used: Math.round(mem.used / 1024 / 1024 / 1024 * 10) / 10, // GB
                total: Math.round(mem.total / 1024 / 1024 / 1024 * 10) / 10, // GB
                free: Math.round(mem.free / 1024 / 1024 / 1024 * 10) / 10, // GB
                usage: Math.round(mem.used / mem.total * 100)
            },
            disk: {
                temp: [],
                health: []
            },
            timestamp: new Date().toISOString()
        };

        // Get disk temperatures if available
        if (disk && disk.length > 0) {
            for (const d of disk) {
                try {
                    const diskTemp = await si.diskTemp(d.device);
                    if (diskTemp && diskTemp.temperature) {
                        stats.disk.temp.push({
                            device: d.device,
                            name: d.name,
                            temp: diskTemp.temperature
                        });
                    }
                } catch (e) {
                    // Ignore disk temp errors
                }
            }
        }

        return stats;
    } catch (error) {
        console.error('Error getting system stats:', error);
        return null;
    }
}

async function getN8NStatus() {
    try {
        const response = await fetch('http://localhost:5678/health', { 
            timeout: 5000 
        });
        
        if (response.ok) {
            // Simple n8n status check - just return if service is up
            return { healthy: true, running: 0 };
        }
    } catch (error) {
        // n8n is not responding
    }
    
    return { healthy: false, running: 0 };
}

function startSystemMonitoring() {
    updateInterval = setInterval(async () => {
        const stats = await getSystemStats();
        const n8nStatus = await getN8NStatus();
        
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('system-stats', {
                system: stats,
                n8n: n8nStatus
            });
        }
    }, CONFIG.updateInterval);
}

// App event handlers
app.whenReady().then(() => {
    createWindow();
    createTray();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    isQuitting = true;
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});

// IPC handlers
ipcMain.handle('get-system-stats', async () => {
    return await getSystemStats();
});

ipcMain.handle('get-n8n-status', async () => {
    return await getN8NStatus();
});

ipcMain.handle('minimize-window', () => {
    if (mainWindow) {
        mainWindow.hide();
    }
});

ipcMain.handle('close-window', () => {
    if (mainWindow) {
        mainWindow.hide();
    }
});