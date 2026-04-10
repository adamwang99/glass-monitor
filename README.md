# 🔮 Glass Monitor

<p align="center">
  <img src="app/logo.jpg" alt="Glass Monitor Logo" width="200"/>
</p>

<p align="center">
  <strong>Beautiful transparent system monitor for your desktop</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#building">Building</a> •
  <a href="#license">License</a>
</p>

---

## ✨ Features

- **🪞 True Glass Effect** - Real-time backdrop blur and transparency
- **🌈 Adaptive Color Coding** - Visual indicators for system health
- **🔥 Temperature Monitoring** - CPU, cores, motherboard, and disk temperatures
- **💨 Fan Speed Monitoring** - Track all system fans (CPU, case, GPU)
- **🎮 GPU Monitoring** - GPU temperature and fan speed
- **💾 Storage Monitoring** - HDD/SSD/NVMe temperature tracking
- **⚡ n8n Integration** - Real-time workflow status monitoring
- **🎯 Always on Top** - Stays visible across all workspaces
- **🖱️ Drag & Drop** - Move anywhere on your screen
- **💫 Minimal Footprint** - Low CPU and memory usage
- **🎨 Elegant UI** - Modern, minimal design with smooth animations

## 📸 Screenshots

*Coming soon*

## 🚀 Installation

### Windows

1. Download `Glass-Monitor-Setup-1.0.0.exe` from [Releases](https://github.com/adamwang99/glass-monitor/releases)
2. Run the installer
3. Launch Glass Monitor from Start Menu

### macOS

1. Download `Glass-Monitor-1.0.0.dmg` from [Releases](https://github.com/adamwang99/glass-monitor/releases)
2. Open the DMG file
3. Drag Glass Monitor to Applications folder
4. Launch from Applications

**Note for Apple Silicon (M1/M2/M3):** Native ARM64 build available for optimal performance.

### Linux

#### Ubuntu/Debian
```bash
wget https://github.com/adamwang99/glass-monitor/releases/download/v1.0.0/glass-monitor_1.0.0_amd64.deb
sudo dpkg -i glass-monitor_1.0.0_amd64.deb
```

#### Fedora/RHEL
```bash
wget https://github.com/adamwang99/glass-monitor/releases/download/v1.0.0/glass-monitor-1.0.0.x86_64.rpm
sudo rpm -i glass-monitor-1.0.0.x86_64.rpm
```

#### AppImage (Universal)
```bash
wget https://github.com/adamwang99/glass-monitor/releases/download/v1.0.0/Glass-Monitor-1.0.0.AppImage
chmod +x Glass-Monitor-1.0.0.AppImage
./Glass-Monitor-1.0.0.AppImage
```

## 🎯 Usage

### First Launch

Glass Monitor will appear in the top-right corner of your screen. You can:

- **Drag to move** - Click and drag anywhere on the window
- **Close** - Click the × button (minimizes to tray)
- **View stats** - Real-time updates every 2 seconds

### System Requirements

- **Windows**: Windows 10/11 (x64, ARM64)
- **macOS**: macOS 10.15+ (Intel, Apple Silicon)
- **Linux**: Ubuntu 20.04+, Fedora 35+, or equivalent

### Monitored Metrics

#### CPU
- Usage percentage
- Package temperature
- Core temperatures (max)
- Individual core temps

#### Memory
- Usage percentage
- Used/Total GB

#### Temperatures
- CPU package
- CPU cores (max)
- Motherboard (ACPI)
- GPU
- Storage devices (HDD/SSD/NVMe)

#### Fans
- CPU fans
- Case fans
- GPU fan
- RPM readings

#### n8n Integration
- Workflow status
- Active workflow count
- Health check

## 🛠️ Building from Source

### Prerequisites

```bash
# Install Node.js 18+ and npm
node --version  # Should be 18.x or higher
npm --version
```

### Clone and Install

```bash
git clone https://github.com/adamwang99/glass-monitor.git
cd glass-monitor
npm install
```

### Development

```bash
npm start
```

### Build for Your Platform

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# All platforms
npm run build:all
```

Built packages will be in the `dist/` directory.

## 🔧 Configuration

Edit `app/main.js` to customize:

```javascript
const CONFIG = {
    width: 360,           // Window width
    height: 280,          // Window height
    updateInterval: 2000  // Update every 2 seconds
};
```

## 🐛 Troubleshooting

### Linux: Sensors not showing

```bash
# Install lm-sensors
sudo apt install lm-sensors

# Detect sensors
sudo sensors-detect

# Restart Glass Monitor
```

### macOS: "App is damaged" error

```bash
# Remove quarantine attribute
xattr -cr /Applications/Glass\ Monitor.app
```

### Windows: Antivirus blocking

Add Glass Monitor to your antivirus exclusions. The app is safe and open-source.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 👨‍💻 Author

**Adam Wang**
- GitHub: [@adamwang99](https://github.com/adamwang99)

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- System info powered by [systeminformation](https://github.com/sebhildebrandt/systeminformation)
- Icons and design inspired by modern glass morphism trends

---

<p align="center">
  Made with ❤️ by Adam Wang
</p>
