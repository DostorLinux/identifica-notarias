import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// Configuración de API que se carga dinámicamente
let apiConfig: any = null;

export interface User {
  id: string;
  username: string;
  doc_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  active: string;
  nationality?: string;
  must_change_password?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

class AuthAPI {
  private baseUrl: string = '';
  private endpoints: any = {};
  private timeout: number = 10000;
  private configLoaded: boolean = false;

  constructor() {
    this.loadConfig();
  }

  /**
   * Cargar configuración desde AsyncStorage o fallback
   */
  private async loadConfig(): Promise<void> {
    if (this.configLoaded) return;

    try {
      // Intentar cargar configuración desde AsyncStorage (configuración del usuario)
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        const userSettings = JSON.parse(savedSettings);
        if (userSettings.cliente) {
          apiConfig = {
            subdomain: `${userSettings.cliente}.identifica.ai`,
            defaultSettings: {
              timeout: 10000,
              retries: 3
            }
          };
          this.configLoaded = true;
          console.log('✅ API config loaded from user settings:', `${userSettings.cliente}.identifica.ai`);
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
        apiConfig = await response.json();
        this.configLoaded = true;
        console.log('✅ API config loaded from public/config/api.json');
        return;
      }
    } catch (error) {
      console.warn('⚠️ Could not load config from public/config/api.json:', error);
    }

    // Fallback final a configuración por defecto
    console.log('🔄 Using fallback API configuration');
    apiConfig = {
      subdomain: 'access-control-test.identifica.ai',
      defaultSettings: {
        timeout: 10000,
        retries: 3
      }
    };
    this.configLoaded = true;
  }

  /**
   * Construir URL usando la misma lógica del dashboard funcional
   */
  private buildUrl(path: string, isApi: boolean = true): string {
    const subdomain = apiConfig?.subdomain;
    if (!subdomain) {
      console.error('Subdomain is undefined');
      return '';
    }
    
    // Para desarrollo local, usar URL directa
    if (subdomain.includes('localhost')) {
      return `http://${subdomain}/gate/portal/web/${path}`;
    }
    
    // Para producción, si el subdomain ya incluye el dominio completo, usarlo directamente
    // Apache ya está posicionado en /gate/portal/web/, así que no agregamos esa ruta
    if (subdomain.includes('.')) {
      return `https://${subdomain}/${path}`;
    }
    
    // Para subdominio simple, usar formato identifica.ai
    const prefix = isApi ? 'api-' : '';
    return `https://${prefix}${subdomain}.identifica.ai/${path}`;
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
   * Recargar configuración (útil cuando el usuario cambia settings)
   */
  async reloadConfig(): Promise<void> {
    this.configLoaded = false;
    await this.loadConfig();
  }



  /**
   * Login con credenciales - Usando método exacto del dashboard funcional
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await this.ensureConfigLoaded();
    
    // Requerir credenciales explícitas (no usar fallback del archivo)
    const user = credentials.username;
    const pass = credentials.password;
    
    if (!user || !pass) {
      throw new Error('Debe proporcionar usuario y contraseña');
    }

    const urlLogin = this.buildUrl('services/login.php', false);
    
    if (!urlLogin) {
      throw new Error('URL de login inválida');
    }

    console.log('🔑 Attempting login to:', urlLogin);

    try {
      // Portal login expects POST parameters: user, pass, mode
      const loginData = {
        user: user,
        pass: pass,
        mode: 'jwt'  // Request JWT token instead of PHP session
      };
      
      const response = await axios.post(urlLogin, loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log('📡 Respuesta del servidor:', response.status, response.data);

      if (response.status === 200 && response.data) {
        const data = response.data;
        
        // Verificar si hay error en la respuesta
        if (data.error) {
          console.log('❌ Error del servidor:', data.error);
          throw new Error(data.error);
        }

        // Verificar que tenemos token y usuario
        if (data.token) {
          console.log('✅ Login exitoso');
          const authResponse: AuthResponse = {
            token: data.token,
            user: data.user
          };
          
          await this.storeAuthData(authResponse);
          return authResponse;
        }
        
        // Portal might return success without token in JWT mode
        if (data.success) {
          console.log('Login successful but no token received');
          throw new Error('No se recibió token de autenticación');
        }
      }
      
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorMsg = error.response.data?.error || `Error ${error.response.status}`;
          throw new Error(errorMsg);
        } else if (error.request) {
          throw new Error('Error de conexión - no se pudo contactar el servidor');
        }
      }
      
      throw new Error(error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  /**
   * Verificar si el token sigue siendo válido (simplificado)
   */
  async pingAuth(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      const user = await this.getStoredUser();
      
      // Verificación básica: si tenemos token y usuario almacenados, asumir válido
      // En un entorno de producción, esto debería hacer una verificación real con el servidor
      return !!(token && user);
    } catch (error) {
      console.error('Ping auth error:', error);
      return false;
    }
  }

  /**
   * Obtener eventos de marcación usando el método exacto del dashboard funcional
   */
  async getEvents(params: any = {}): Promise<any> {
    try {
      await this.ensureConfigLoaded();
      const token = await this.getStoredToken();
      
      if (!token) {
        throw new Error('No token available');
      }

      console.log('📅 IdentificaAPI.getEvents - Obteniendo eventos/marcaciones');
      console.log('📅 Parámetros recibidos:', params);
      
      const url = this.buildUrl('services/getEvents.php', false);
      
      // Preparar el payload según el formato esperado exacto del dashboard funcional
      const payload = {
        page: Math.max(params.page || 1, 1), // Asegurar que page nunca sea 0
        size: params.size || 10,
        direction: params.direction || "desc",
        column: params.column || "created",
        filter: params.filter || null
      };
      
      console.log('🌐 URL:', url);
      console.log('📦 Payload enviado:', payload);
      
      // Usar exactamente los mismos headers que el dashboard funcional
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json', // Cambiar a JSON como en el dashboard funcional
        'Accept': 'application/json'
      };
      
      console.log('🔐 Headers:', { ...headers, Authorization: '[TOKEN PRESENTE]' });
      
      const response = await axios.post(url, payload, { 
        headers,
        timeout: apiConfig?.defaultSettings?.timeout || 10000
      });
      
      console.log('📥 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      if (response.data && response.data.error) {
        throw new Error(response.data.error);
      }
      
      console.log('✅ Eventos procesados:', {
        totalData: response.data?.data?.length || response.data?.length || 0,
        firstEvent: response.data?.data?.[0] || response.data?.[0]
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error en getEvents:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('- Response status:', error.response.status);
          console.error('- Response data:', error.response.data);
          
          let errorMessage = 'Error al cargar eventos';
          
          if (error.response.status === 500) {
            errorMessage = 'Error interno del servidor (500). Verifica los logs del servidor.';
          } else if (error.response.status === 401) {
            errorMessage = 'Error de autenticación. Verifica las credenciales.';
          } else if (error.response.status === 403) {
            errorMessage = 'Acceso denegado. Verifica los permisos.';
          } else if (error.response.data?.error) {
            errorMessage = error.response.data.error;
          }
          
          throw new Error(errorMessage);
        } else if (error.request) {
          throw new Error('Error de conexión - no se pudo contactar el servidor');
        }
      }
      
      throw new Error(error instanceof Error ? error.message : 'Error desconocido al cargar eventos');
    }
  }

  /**
   * Logout - limpiar datos almacenados
   */
  async logout(): Promise<void> {
    try {
      await this.ensureConfigLoaded();
      const tokenKey = apiConfig?.auth?.tokenKey || 'gate_auth_token';
      const userKey = apiConfig?.auth?.userKey || 'gate_user_info';
      
      await AsyncStorage.multiRemove([tokenKey, userKey]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Obtener token almacenado
   */
  async getStoredToken(): Promise<string | null> {
    try {
      await this.ensureConfigLoaded();
      const tokenKey = apiConfig?.auth?.tokenKey || 'gate_auth_token';
      const token = await AsyncStorage.getItem(tokenKey);
      
      // Verificar que el token no sea null, undefined, o una cadena inválida
      if (!token || token === 'undefined' || token === 'null') {
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Error getting stored token:', error);
      // Limpiar token corrupto
      const tokenKey = apiConfig?.auth?.tokenKey || 'gate_auth_token';
      await AsyncStorage.removeItem(tokenKey);
      return null;
    }
  }

  /**
   * Obtener usuario almacenado
   */
  async getStoredUser(): Promise<User | null> {
    try {
      await this.ensureConfigLoaded();
      const userKey = apiConfig?.auth?.userKey || 'gate_user_info';
      const userJson = await AsyncStorage.getItem(userKey);
      
      // Verificar que el valor no sea null, undefined, o una cadena inválida
      if (!userJson || userJson === 'undefined' || userJson === 'null') {
        return null;
      }
      
      return JSON.parse(userJson);
    } catch (error) {
      console.error('Error getting stored user:', error);
      // Limpiar datos corruptos
      const userKey = apiConfig?.auth?.userKey || 'gate_user_info';
      await AsyncStorage.removeItem(userKey);
      return null;
    }
  }

  /**
   * Guardar datos de autenticación
   */
  private async storeAuthData(authData: AuthResponse): Promise<void> {
    try {
      await this.ensureConfigLoaded();
      const tokenKey = apiConfig?.auth?.tokenKey || 'gate_auth_token';
      const userKey = apiConfig?.auth?.userKey || 'gate_user_info';
      
      await AsyncStorage.setItem(tokenKey, authData.token);
      await AsyncStorage.setItem(userKey, JSON.stringify(authData.user));
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  }

  /**
   * Limpiar todos los datos de autenticación corruptos
   */
  private async clearCorruptedData(): Promise<void> {
    try {
      await this.ensureConfigLoaded();
      const tokenKey = apiConfig?.auth?.tokenKey || 'gate_auth_token';
      const userKey = apiConfig?.auth?.userKey || 'gate_user_info';
      
      await AsyncStorage.multiRemove([tokenKey, userKey]);
      console.log('🧹 Cleared corrupted auth data');
    } catch (error) {
      console.error('Error clearing corrupted data:', error);
    }
  }

  /**
   * Verificar si hay sesión válida almacenada
   */
  async hasValidSession(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      const user = await this.getStoredUser();
      
      if (!token || !user) {
        // Limpiar datos parciales o corruptos
        await this.clearCorruptedData();
        return false;
      }

      // Verificar con el servidor
      const isValid = await this.pingAuth();
      
      if (!isValid) {
        // Si el servidor dice que no es válido, limpiar datos
        await this.clearCorruptedData();
      }
      
      return isValid;
    } catch (error) {
      console.error('Error checking session validity:', error);
      await this.clearCorruptedData();
      return false;
    }
  }
}

export const useAuthAPI = () => {
  const [authAPI] = useState(() => new AuthAPI());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Verificar autenticación al cargar
   */
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    setIsLoading(true);
    try {
      const hasSession = await authAPI.hasValidSession();
      if (hasSession) {
        const user = await authAPI.getStoredUser();
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        await authAPI.logout(); // Limpiar datos inválidos
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const authData = await authAPI.login(credentials);
      setCurrentUser(authData.user);
      setIsAuthenticated(true);
    } catch (error) {
      setCurrentUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authAPI.logout();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuthState = async (): Promise<void> => {
    await checkAuthState();
  };

  return {
    authAPI,
    isAuthenticated,
    currentUser,
    isLoading,
    login,
    logout,
    refreshAuthState,
    reloadConfig: authAPI.reloadConfig.bind(authAPI),
  };
};