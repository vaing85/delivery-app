import net from 'net';

export interface PortManagerOptions {
  preferredPort: number;
  maxAttempts?: number;
  portRange?: { start: number; end: number };
}

export class PortManager {
  private static instance: PortManager;
  private usedPorts: Set<number> = new Set();

  private constructor() {}

  static getInstance(): PortManager {
    if (!PortManager.instance) {
      PortManager.instance = new PortManager();
    }
    return PortManager.instance;
  }

  /**
   * Check if a port is available
   */
  async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Find an available port starting from preferred port
   */
  async findAvailablePort(options: PortManagerOptions): Promise<number> {
    const { preferredPort, maxAttempts = 10, portRange = { start: 5000, end: 5100 } } = options;
    
    // Try preferred port first
    if (await this.isPortAvailable(preferredPort)) {
      this.usedPorts.add(preferredPort);
      return preferredPort;
    }

    // Try to kill any process on the preferred port first
    console.log(`🔄 Port ${preferredPort} is busy, attempting to free it...`);
    await this.killProcessOnPort(preferredPort);
    
    // Wait a moment for the port to be released
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try preferred port again after killing process
    if (await this.isPortAvailable(preferredPort)) {
      this.usedPorts.add(preferredPort);
      console.log(`✅ Port ${preferredPort} is now available`);
      return preferredPort;
    }

    // Search for available port in range (sequential search for better reliability)
    for (let port = portRange.start; port <= portRange.end; port++) {
      if (!this.usedPorts.has(port) && await this.isPortAvailable(port)) {
        this.usedPorts.add(port);
        console.log(`🔄 Port ${preferredPort} busy, using port ${port}`);
        return port;
      }
    }

    // If sequential search fails, try random ports
    for (let i = 0; i < maxAttempts; i++) {
      const port = portRange.start + Math.floor(Math.random() * (portRange.end - portRange.start + 1));
      
      if (!this.usedPorts.has(port) && await this.isPortAvailable(port)) {
        this.usedPorts.add(port);
        console.log(`🔄 Port ${preferredPort} busy, using random port ${port}`);
        return port;
      }
    }

    throw new Error(`No available ports found in range ${portRange.start}-${portRange.end}`);
  }

  /**
   * Release a port when server shuts down
   */
  releasePort(port: number): void {
    this.usedPorts.delete(port);
  }

  /**
   * Kill processes using a specific port
   */
  async killProcessOnPort(port: number): Promise<boolean> {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      // Try to find process using the port with multiple methods
      let stdout = '';
      
      try {
        // Method 1: netstat (Windows)
        const { stdout: netstatOutput } = await execAsync(`netstat -ano | findstr :${port}`);
        stdout = netstatOutput;
      } catch (netstatError) {
        try {
          // Method 2: netstat (Unix/Linux)
          const { stdout: netstatOutput } = await execAsync(`netstat -tulpn | grep :${port}`);
          stdout = netstatOutput;
        } catch (grepError) {
          try {
            // Method 3: lsof (Unix/Linux)
            const { stdout: lsofOutput } = await execAsync(`lsof -ti:${port}`);
            stdout = lsofOutput;
          } catch (lsofError) {
            // If all methods fail, just return false
            console.warn(`⚠️ Could not find process on port ${port} using any method`);
            return false;
          }
        }
      }
      
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(parseInt(pid))) {
              console.log(`🔪 Killing process ${pid} on port ${port}`);
              try {
                await execAsync(`taskkill /PID ${pid} /F`);
              } catch (killError) {
                try {
                  await execAsync(`kill -9 ${pid}`);
                } catch (killError2) {
                  console.warn(`⚠️ Could not kill process ${pid}:`, killError2);
                }
              }
              return true;
            }
          }
        }
      }
      return false;
    } catch (error) {
      console.warn(`⚠️ Could not kill process on port ${port}:`, error);
      return false;
    }
  }

  /**
   * Clean up all used ports
   */
  cleanup(): void {
    this.usedPorts.clear();
  }
}

export default PortManager;
