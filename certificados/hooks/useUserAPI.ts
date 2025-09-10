import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export interface SystemUser {
  id: string;
  pub_id?: string;
  doc_id?: string;
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: string;
  active: string | number | boolean;
  isDenied?: string | number | boolean;
}

export interface UserFormData {
  id?: string;
  doc_id: string;
  first_name: string;
  last_name: string;
  email: string;
  login: string; // username
  role: string;
  password?: string;
  active: string;
  user_type: string;
}

class UserAPI {
  private apiConfig: any = null;
  private configLoaded: boolean = false;

  constructor() {
    this.loadConfig();
  }

  /**
   * Cargar configuración de la API usando la misma lógica que useAuthAPI
   */
  private async loadConfig(): Promise<void> {
    if (this.configLoaded) return;

    try {
      // Intentar cargar configuración desde AsyncStorage (configuración del usuario)
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        const userSettings = JSON.parse(savedSettings);
        if (userSettings.cliente) {
          this.apiConfig = {
            subdomain: `${userSettings.cliente}.identifica.ai`,
            defaultSettings: {
              timeout: 10000,
              retries: 3
            }
          };
          this.configLoaded = true;
          console.log('✅ UserAPI config loaded from user settings:', `${userSettings.cliente}.identifica.ai`);
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load user settings from AsyncStorage:', error);
    }

    try {
      // Fallback: cargar desde archivo público
      const response = await fetch('/config/api.json');
      if (response.ok) {
        this.apiConfig = await response.json();
        this.configLoaded = true;
        console.log('✅ UserAPI config loaded from public/config/api.json');
        return;
      }
    } catch (error) {
      console.warn('⚠️ Could not load config from public/config/api.json:', error);
    }

    // Fallback final a configuración por defecto
    console.log('🔄 Using fallback UserAPI configuration');
    this.apiConfig = {
      subdomain: 'access-control-test.identifica.ai',
      defaultSettings: {
        timeout: 10000,
        retries: 3
      }
    };
    this.configLoaded = true;
  }

  /**
   * Construir URL usando la misma lógica que useAuthAPI
   */
  private buildUrl(path: string, isApi: boolean = false): string {
    const subdomain = this.apiConfig?.subdomain;
    if (!subdomain) {
      console.error('Subdomain is undefined in UserAPI');
      return '';
    }
    
    // Para desarrollo local, usar URL directa
    if (subdomain.includes('localhost')) {
      return `http://${subdomain}/gate/portal/web/services/${path}`;
    }
    
    // Para producción, si el subdomain ya incluye el dominio completo, usarlo directamente
    if (subdomain.includes('.')) {
      return `https://${subdomain}/services/${path}`;
    }
    
    // Para subdominio simple, usar formato identifica.ai
    const prefix = isApi ? 'api-' : '';
    return `https://${prefix}${subdomain}.identifica.ai/services/${path}`;
  }

  /**
   * Obtener headers de autenticación
   */
  private async getAuthHeaders(): Promise<{ [key: string]: string }> {
    try {
      const token = await AsyncStorage.getItem('gate_auth_token');
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return headers;
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
    }
  }

  /**
   * Asegurar que la configuración esté cargada
   */
  private async ensureConfigLoaded(): Promise<void> {
    if (!this.configLoaded) {
      await this.loadConfig();
    }
  }

  /**
   * Obtener usuarios del sistema
   */
  async getSystemUsers(): Promise<{ success: boolean; users?: SystemUser[]; error?: string }> {
    try {
      await this.ensureConfigLoaded();
      
      const url = this.buildUrl('getUsers.php');
      const headers = await this.getAuthHeaders();
      
      console.log('👥 UserAPI: Fetching system users from:', url);
      
      const response = await axios.get(`${url}?type=system`, {
        headers,
        timeout: 10000,
      });

      if (response.data && response.data.data) {
        // Mapear datos de array a objeto
        const mappedUsers = response.data.data.map((user: any[]) => ({
          id: user[9],
          pub_id: user[0],
          doc_id: user[1],
          username: user[3],
          first_name: user[4],
          last_name: user[5],
          email: user[6],
          role: user[7],
          active: user[8],
          isDenied: user[10],
        }));

        console.log('✅ UserAPI: System users loaded:', mappedUsers.length);
        return {
          success: true,
          users: mappedUsers
        };
      }

      return { success: false, error: 'Invalid response format' };
    } catch (error: any) {
      console.error('❌ UserAPI: Error loading system users:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Error loading users'
      };
    }
  }

  /**
   * Guardar usuario del sistema
   */
  async saveSystemUser(userData: UserFormData): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      await this.ensureConfigLoaded();
      
      const url = this.buildUrl('saveUser.php');
      const headers = await this.getAuthHeaders();
      
      console.log('💾 UserAPI: Saving system user to:', url);
      console.log('📦 UserAPI: User data:', userData);
      
      // Crear FormData para envío
      const formData = new URLSearchParams();
      Object.entries(userData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await axios.post(url, formData, {
        headers,
        timeout: 10000,
      });

      if (response.data && response.data.id) {
        console.log('✅ UserAPI: User saved successfully:', response.data.id);
        return {
          success: true,
          id: response.data.id
        };
      }

      return { 
        success: false, 
        error: response.data?.error || 'Error saving user'
      };
    } catch (error: any) {
      console.error('❌ UserAPI: Error saving system user:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Error saving user'
      };
    }
  }

  /**
   * Eliminar usuario del sistema
   */
  async deleteSystemUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureConfigLoaded();
      
      const url = this.buildUrl('deleteUser.php');
      const headers = await this.getAuthHeaders();
      
      console.log('🗑️ UserAPI: Deleting system user:', userId);
      
      const formData = new URLSearchParams();
      formData.append('id', userId);

      const response = await axios.post(url, formData, {
        headers,
        timeout: 10000,
      });

      if (response.data && response.data.success) {
        console.log('✅ UserAPI: User deleted successfully');
        return { success: true };
      }

      return { 
        success: false, 
        error: response.data?.error || 'Error deleting user'
      };
    } catch (error: any) {
      console.error('❌ UserAPI: Error deleting system user:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Error deleting user'
      };
    }
  }

  /**
   * Recargar configuración (útil cuando el usuario cambia settings)
   */
  async reloadConfig(): Promise<void> {
    this.configLoaded = false;
    await this.loadConfig();
  }
}

// Hook personalizado para usar UserAPI
export function useUserAPI() {
  const userAPI = new UserAPI();

  const getSystemUsers = async () => {
    return await userAPI.getSystemUsers();
  };

  const saveSystemUser = async (userData: UserFormData) => {
    return await userAPI.saveSystemUser(userData);
  };

  const deleteSystemUser = async (userId: string) => {
    return await userAPI.deleteSystemUser(userId);
  };

  const reloadConfig = async () => {
    return await userAPI.reloadConfig();
  };

  return {
    getSystemUsers,
    saveSystemUser,
    deleteSystemUser,
    reloadConfig,
  };
}