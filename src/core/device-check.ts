interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
    downlink?: number;
    rtt?: number;
  };
}

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number;
  hardwareConcurrency: number;
}

interface DeviceCapabilities {
  webgl: boolean;
  webgl2?: boolean;
  lowEndDevice: boolean;
  memory?: number;
  cores?: number;
}

/**
 * Проверка возможностей устройства
 */

export class DeviceCheck {
  private static capabilitiesCache: DeviceCapabilities | null = null;

  static async getCapabilities(
    forceCheck = false
  ): Promise<DeviceCapabilities> {
    // Возвращаем кэш, если уже проверяли
    if (!forceCheck && this.capabilitiesCache) {
      return this.capabilitiesCache;
    }

    const capabilities: DeviceCapabilities = {
      webgl: this.isWebGLSupported(),
      webgl2: this.isWebGL2Supported(),
      lowEndDevice: false,
    };

    const nav = navigator as NavigatorWithDeviceMemory &
      NavigatorWithConnection;

    // Проверка аппаратных характеристик (если доступно)
    if (nav.deviceMemory !== undefined) {
      capabilities.memory = nav.deviceMemory; // в ГБ
    }

    if (nav.hardwareConcurrency !== undefined) {
      capabilities.cores = nav.hardwareConcurrency;
    }

    // Оценка "слабого устройства"
    capabilities.lowEndDevice =
      capabilities.memory !== undefined
        ? capabilities.memory < 4
        : capabilities.cores !== undefined
          ? capabilities.cores <= 2
          : false;

    // Дополнительно: медленное соединение?
    if (
      nav.connection?.effectiveType &&
      /2g|slow-2g/.test(nav.connection.effectiveType)
    ) {
      capabilities.lowEndDevice = true;
    }

    // Кэшируем результат
    this.capabilitiesCache = capabilities;

    return capabilities;
  }

  /**
   * Быстрая проверка без асинхронности (использует кэш или базовую проверку)
   */
  static canUse3D(): boolean {
    if (this.capabilitiesCache) {
      return (
        this.capabilitiesCache.webgl && !this.capabilitiesCache.lowEndDevice
      );
    }
    // Базовая проверка WebGL без кэша
    return this.isWebGLSupported();
  }

  /**
   * Проверка WebGL
   */
  private static isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  /**
   * Проверка WebGL 2
   */
  private static isWebGL2Supported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      return !!gl;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
