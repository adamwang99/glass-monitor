const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const si = require('systeminformation');
const axios = require('axios');

// Enable remote module
require('@electron/remote/main').initialize();

let mainWindow;
let tray;
let updateInterval;

const CONFIG = {
    width: 360,
    height: 280,
    updateInterval: 2000
};

function createWindow() {
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Place window at top-right corner instead of bottom
    const winX = Math.max(0, width - CONFIG.width - 20);
    const winY = 20; // Top of screen

    console.log(`Creating window at x=${winX}, y=${winY} (screen: ${width}x${height})`);

    mainWindow = new BrowserWindow({
        width: CONFIG.width,
        height: CONFIG.height,
        x: winX,
        y: winY,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: false,
        resizable: false,
        movable: true,
        minimizable: true,
        maximizable: false,
        closable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Enable remote module for this window
    require('@electron/remote/main').enable(mainWindow.webContents);

    // Debug logging
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Window loaded successfully');
    });

    mainWindow.webContents.on('console-message', (event, level, message) => {
        console.log('Renderer:', message);
    });

    mainWindow.once('ready-to-show', () => {
        console.log('Window ready to show');
        mainWindow.show();
        console.log('Window shown, starting monitoring...');
        startMonitoring();
    });

    mainWindow.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            mainWindow.hide();
        }
    });
}

function createTray() {
    // Tạo icon đơn giản
    const iconSize = 16;
    const canvas = `<svg width="${iconSize}" height="${iconSize}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${iconSize}" height="${iconSize}" rx="3" fill="#007bff"/>
        <text x="3" y="12" font-size="8" fill="white" font-family="Arial">GM</text>
    </svg>`;
    
    const icon = nativeImage.createFromDataURL(
        `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`
    );
    
    tray = new Tray(icon);
    tray.setToolTip('Glass Monitor');

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show', click: () => { mainWindow.show(); mainWindow.focus(); } },
        { type: 'separator' },
        { label: 'Exit', click: () => { app.isQuitting = true; app.quit(); } }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('click', () => { mainWindow.show(); mainWindow.focus(); });
}

async function getSystemStats() {
    try {
        const [cpu, mem, temp, currentLoad, fsSize, graphics] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.cpuTemperature(),
            si.currentLoad(),
            si.fsSize(),
            si.graphics()
        ]);

        console.log('Temperature data:', JSON.stringify(temp));

        // Get ACPI temperature (motherboard/system)
        let acpiTemp = 'N/A';
        try {
            const fs = require('fs');
            const acpiPath = '/sys/class/thermal/thermal_zone0/temp';
            if (fs.existsSync(acpiPath)) {
                const raw = fs.readFileSync(acpiPath, 'utf8');
                acpiTemp = Math.round(parseInt(raw) / 1000);
            }
        } catch {}

        // Get disk temperatures
        let diskTemps = [];
        try {
            const disks = await si.diskLayout();
            for (const disk of disks) {
                try {
                    const temp = await si.diskTemp(disk.device);
                    if (temp && temp.temperature) {
                        diskTemps.push({
                            name: disk.name || disk.device,
                            temp: temp.temperature
                        });
                    }
                } catch {}
            }
        } catch {}

        // Get fan speeds
        let fans = [];
        try {
            const fs = require('fs');
            const hwmonDirs = fs.readdirSync('/sys/class/hwmon');
            for (const dir of hwmonDirs) {
                const basePath = `/sys/class/hwmon/${dir}`;
                const files = fs.readdirSync(basePath);
                for (const file of files) {
                    if (file.startsWith('fan') && file.endsWith('_input')) {
                        try {
                            const rpm = parseInt(fs.readFileSync(`${basePath}/${file}`, 'utf8'));
                            const labelFile = file.replace('_input', '_label');
                            let label = file.replace('_input', '');
                            if (fs.existsSync(`${basePath}/${labelFile}`)) {
                                label = fs.readFileSync(`${basePath}/${labelFile}`, 'utf8').trim();
                            }
                            fans.push({ label, rpm });
                        } catch {}
                    }
                }
            }
        } catch {}

        // GPU info
        let gpuTemp = 'N/A';
        let gpuFan = 'N/A';
        if (graphics && graphics.controllers && graphics.controllers.length > 0) {
            const gpu = graphics.controllers[0];
            if (gpu.temperatureGpu) gpuTemp = gpu.temperatureGpu;
            if (gpu.fanSpeed) gpuFan = gpu.fanSpeed;
        }

        return {
            ram: {
                used: Math.round(mem.used / 1024 / 1024 / 1024 * 10) / 10,
                total: Math.round(mem.total / 1024 / 1024 / 1024 * 10) / 10,
                percent: Math.round(mem.used / mem.total * 100)
            },
            cpu: {
                percent: Math.round(currentLoad.currentLoad || 0),
                cores: cpu.cores,
                temp: temp.main || temp.cpu || 'N/A',
                coreMax: temp.max || 'N/A'
            },
            motherboard: acpiTemp,
            disks: diskTemps,
            fans: fans,
            gpu: {
                temp: gpuTemp,
                fan: gpuFan
            }
        };
    } catch (e) {
        console.error('Stats error:', e);
        return null;
    }
}

async function getN8NStatus() {
    try {
        const r = await axios.get('http://localhost:5678/health', { timeout: 3000 });
        if (r.status === 200) {
            const r2 = await axios.get('http://localhost:5678/api/v1/workflows', {
                headers: { 'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NTllMmQwZi0xYzM1LTRmMDMtOWRhMC1hMzExNmQ4MjlmOGQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNDE1MjE3NzItZThkOS00NjYzLWE4NjctZDFhYjQwZmQyYTk2IiwiaWF0IjoxNzc1NzIwODY2fQ.tyz6QGcgQRd8BudAaA8z_Yrv7qoCVAI9MW7s-afevkQ' },
                timeout: 3000
            });
            if (r2.status === 200) {
                const running = (r2.data.data || []).filter(w => w.active).length;
                return { healthy: true, running };
            }
        }
        return { healthy: false, running: 0 };
    } catch { return { healthy: false, running: 0 }; }
}

function startMonitoring() {
    console.log('Starting monitoring interval...');
    updateInterval = setInterval(async () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            const stats = await getSystemStats();
            const n8n = await getN8NStatus();
            console.log('Stats:', JSON.stringify({ cpu: stats?.cpu?.percent, ram: stats?.ram?.percent, n8n: n8n?.healthy }));
            mainWindow.webContents.send('stats', { system: stats, n8n });
        }
    }, CONFIG.updateInterval);
}

app.whenReady().then(() => {
    createWindow();
    createTray();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    app.isQuitting = true;
    if (updateInterval) clearInterval(updateInterval);
});

ipcMain.on('minimize', () => mainWindow.hide());
ipcMain.on('close', () => mainWindow.hide());
