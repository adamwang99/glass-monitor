FROM node:18-slim

# Install dependencies for Electron and system access
RUN apt-get update && apt-get install -y \
    libgtk-3-0 \
    libnotify4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    libatspi2.0-0 \
    libdrm2 \
    libxcb-dri3-0 \
    libgbm1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxtst6 \
    fonts-liberation \
    libappindicator3-1 \
    x11-xserver-utils \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create assets directory for tray icon
RUN mkdir -p assets

# Create non-root user
RUN useradd -m -u 1001 monitor \
    && chown -R monitor:monitor /app
USER monitor

# Expose port for debugging
EXPOSE 9222

CMD ["npm", "start"]