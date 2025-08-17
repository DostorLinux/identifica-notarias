import axios from 'axios';
import { encode as btoa } from 'base-64';
import { getSettings, saveToken, getToken as getStoredToken } from '../utils/storage';

class IdentificaAPI {
  constructor() {
    this.token = null;
    this.settings = null;
  }

  async initialize() {
    this.settings = await getSettings();
    this.token = await getStoredToken();
    
    if (!this.settings) {
      throw new Error('No se pudo cargar la configuración');
    }
  }

  buildUrl(path, isApi = true) {
    const { subdomain } = this.settings;
    if (!subdomain) {
      console.error('Subdomain is undefined');
      return null;
    }
    const prefix = isApi ? 'api-' : '';
    return `https://${prefix}${subdomain}.identifica.ai/${path}`;
  }

  async handleResponse(response) {
    if (response.data && response.data.error) {
      throw new Error(response.data.error);
    }
    return response.data;
  }

  // Authentication methods
  async login(username = null, password = null) {
    try {
      // Use provided credentials or fall back to settings
      const user = username || this.settings.username;
      const pass = password || this.settings.password;
      
      if (!user || !pass) {
        throw new Error('Credenciales no configuradas');
      }

      const apiLogin = `${user}:${pass}`;
      const urlLogin = this.buildUrl('api/v1/login');
      
      if (!urlLogin) {
        throw new Error('URL de login inválida');
      }

      const apiLoginB64 = btoa(apiLogin);
      const headers = { 'Authorization': `Basic ${apiLoginB64}` };
      
      console.log('Attempting login to:', urlLogin);
      const response = await axios.get(urlLogin, { headers });
      const data = await this.handleResponse(response);
      
      if (data.token) {
        this.token = data.token;
        await saveToken(data.token);
        return { success: true, token: data.token, user: data.user };
      }
      
      throw new Error('No se recibió token de autenticación');
    } catch (error) {
      console.error('Error in login:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Error de autenticación' 
      };
    }
  }

  async refreshToken() {
    return this.login();
  }

  async getAuthHeaders(useApiKey = false) {
    if (useApiKey && this.settings.apiKey) {
      return { 'api-key': this.settings.apiKey };
    }
    
    if (!this.token) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        throw new Error('No se pudo obtener token de autenticación');
      }
    }
    
    return { 'Authorization': `Bearer ${this.token}` };
  }

  // User management
  async saveUser(userData) {
    try {
      const url = this.buildUrl('api/v1/user/save');
      const headers = await this.getAuthHeaders();
      
      const response = await axios.post(url, userData, { headers });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in saveUser:', error);
      throw error;
    }
  }

  async deleteUser(docId) {
    try {
      const url = this.buildUrl('api/v1/user/del');
      const headers = await this.getAuthHeaders();
      
      const response = await axios.post(url, { doc_id: docId }, { headers });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  }

  async getUsers(type = '') {
    try {
      const url = this.buildUrl('services/getUsers.php', false);
      const headers = await this.getAuthHeaders();
      const params = type ? { type } : {};
      
      const response = await axios.get(url, { headers, params });
      const data = await this.handleResponse(response);
      
      if (data.data) {
        return {
          success: true,
          users: data.data.map(user => ({
            pub_id: user[0],
            doc_id: user[1],
            sec_id: user[2],
            username: user[3],
            first_name: user[4],
            last_name: user[5],
            email: user[6],
            role: user[7],
            active: user[8],
            id: user[9],
            isDenied: user[10],
            deniedNote: user[11]
          }))
        };
      }
      
      return { success: false, error: 'No se encontraron usuarios' };
    } catch (error) {
      console.error('Error in getUsers:', error);
      return { success: false, error: error.message };
    }
  }

  // Event management
  async saveEvent(eventData) {
    try {
      const url = this.buildUrl('api/v1/event/save');
      const headers = await this.getAuthHeaders(eventData.useApiKey);
      
      const response = await axios.post(url, eventData, { headers });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in saveEvent:', error);
      throw error;
    }
  }

  async getEventList(params) {
    try {
      const url = this.buildUrl('api/v1/event/list');
      const headers = await this.getAuthHeaders();
      
      const response = await axios.get(url, { headers, params });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in getEventList:', error);
      throw error;
    }
  }

  async getLastEvents(location = null) {
    try {
      const url = this.buildUrl('api/v1/event/last');
      const headers = await this.getAuthHeaders(true);
      const params = location ? { location } : {};
      
      const response = await axios.get(url, { headers, params });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in getLastEvents:', error);
      throw error;
    }
  }

  // Image validation
  async validateImage(base64Image) {
    try {
      const url = this.buildUrl('api/v1/image/validate');
      const headers = await this.getAuthHeaders(true);
      
      const response = await axios.post(url, { picture: base64Image }, { headers });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in validateImage:', error);
      throw error;
    }
  }

  // Document scanning
  async scanDocument(base64Image) {
    try {
      const url = this.buildUrl('api/v1/document/read');
      const headers = await this.getAuthHeaders(true);
      
      const response = await axios.post(url, { picture: base64Image }, { headers });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in scanDocument:', error);
      throw error;
    }
  }

  // Device configuration
  async getDeviceConfig() {
    try {
      const { deviceId } = this.settings;
      if (!deviceId) {
        throw new Error('Device ID no configurado');
      }
      
      const url = this.buildUrl(`services/device/getOne.php?id=${deviceId}`, false);
      const headers = await this.getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in getDeviceConfig:', error);
      throw error;
    }
  }

  // Parking events
  async sendParkingEvent(eventData) {
    try {
      const url = this.buildUrl('services/parking/events.php', false);
      const headers = await this.getAuthHeaders();
      
      const formData = new FormData();
      Object.keys(eventData).forEach(key => {
        formData.append(key, eventData[key]);
      });
      
      headers['Content-Type'] = 'multipart/form-data';
      
      const response = await axios.post(url, formData, { headers });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in sendParkingEvent:', error);
      throw error;
    }
  }

  // Facial recognition
  async identifyUser(face, docId = null, plate = null, location, entry = 'none') {
    try {
      const eventData = {
        picture: face,
        location,
        entry,
        useApiKey: !docId // Use API key if no docId provided
      };
      
      if (docId) {
        eventData.doc_id = docId;
      }
      
      if (plate) {
        eventData.plate = plate;
      }
      
      const response = await this.saveEvent(eventData);
      
      if (response.status === 'success' && response.user) {
        const fullName = response.user.first_name?.trim() || '';
        const firstName = fullName.split(' ')[0];
        return {
          success: true,
          firstName,
          user: response.user
        };
      }
      
      return { success: false, error: response.code || 'UNKNOWN_ERROR' };
    } catch (error) {
      console.error('Error in identifyUser:', error);
      return { success: false, error: error.message || 'API_ERROR' };
    }
  }

  // Detectlite integration
  async detectLite(docId, session) {
    try {
      const url = this.buildUrl('detectlite/');
      const headers = await this.getAuthHeaders(true);
      const params = { doc_id: docId, session };
      
      const response = await axios.get(url, { headers, params });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in detectLite:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const api = new IdentificaAPI();
export default api;
