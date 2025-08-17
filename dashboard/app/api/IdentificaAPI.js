import axios from 'axios';
import { encode as btoa } from 'base-64';
import { getSettings, saveToken, getToken as getStoredToken, saveUserData } from '../utils/storage';

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

  async handleResponse(response) {
    console.log('📝 handleResponse - procesando respuesta...');
    console.log('📝 Response data:', response.data);
    
    if (response.data && response.data.error) {
      console.error('❌ handleResponse - Error en data:', response.data.error);
      throw new Error(response.data.error);
    }
    
    console.log('✅ handleResponse - Respuesta procesada exitosamente');
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

      const urlLogin = this.buildUrl('services/login.php', false);
      
      if (!urlLogin) {
        throw new Error('URL de login inválida');
      }

      // Portal login expects POST parameters: user, pass, mode
      const loginData = {
        user: user,
        pass: pass,
        mode: 'jwt'  // Request JWT token instead of PHP session
      };
      
      console.log('Attempting login to:', urlLogin);
      const response = await axios.post(urlLogin, loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const data = await this.handleResponse(response);
      
      if (data.token) {
        this.token = data.token;
        await saveToken(data.token);
        
        // Save user data if provided
        if (data.user) {
          await saveUserData(data.user);
          console.log('✅ User data saved:', data.user.username, 'Role:', data.user.role);
        }
        
        return { success: true, token: data.token, user: data.user };
      }
      
      // Portal might return success without token in JWT mode
      if (data.success) {
        console.log('Login successful but no token received');
        return { success: true, message: data.message };
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
    try {
      console.log('🔑 getAuthHeaders - useApiKey:', useApiKey);
      console.log('🔑 getAuthHeaders - apiKey disponible:', !!this.settings?.apiKey);
      console.log('🔑 getAuthHeaders - token actual:', this.token ? '[TOKEN PRESENTE]' : '[NO TOKEN]');
      
      if (useApiKey && this.settings?.apiKey) {
        console.log('🔑 Usando API Key para autenticación');
        return { 'api-key': this.settings.apiKey };
      }
      
      if (!this.token) {
        console.log('🔑 No hay token, intentando login...');
        const loginResult = await this.login();
        if (!loginResult.success) {
          console.error('❌ Login falló:', loginResult.error);
          throw new Error('No se pudo obtener token de autenticación: ' + loginResult.error);
        }
        console.log('✅ Login exitoso, token obtenido');
      }
      
      console.log('🔑 Usando Bearer token para autenticación');
      return { 'Authorization': `Bearer ${this.token}` };
    } catch (error) {
      console.error('❌ Error en getAuthHeaders:', error);
      throw error;
    }
  }

  // User management
  async saveUser(userData) {
    try {
      console.log('=== INICIO saveUser API (NUEVO FLUJO) ===');
      console.log('📤 IdentificaAPI.saveUser - Datos recibidos:', {
        ...userData,
        picture: userData.picture ? `[base64 image - ${userData.picture.length} chars]` : null
      });

      // Verificar configuración
      if (!this.settings) {
        console.log('🔄 Inicializando configuración...');
        await this.initialize();
      }

      // Validar campos obligatorios según la documentación
      if (!userData.doc_id) {
        throw new Error('El campo doc_id es obligatorio');
      }
      if (!userData.first_name) {
        throw new Error('El campo first_name es obligatorio');
      }
      if (!userData.last_name) {
        throw new Error('El campo last_name es obligatorio');
      }

      console.log('🔑 Obteniendo headers de autenticación...');
      const headers = await this.getAuthHeaders();
      console.log('🔐 Headers obtenidos:', {
        ...headers,
        Authorization: headers.Authorization ? '[TOKEN PRESENTE]' : '[NO TOKEN]'
      });

      // PASO 1: Guardar datos del usuario (sin foto)
      console.log('📝 PASO 1: Guardando datos del usuario con FormData...');
      const userUrl = this.buildUrl('services/saveUser.php', false);
      console.log('🌐 URL para saveUser:', userUrl);
      
      if (!userUrl) {
        throw new Error('No se pudo construir la URL del servicio saveUser');
      }

      // Preparar el payload para saveUser.php con el mapeo de campos correcto
      const userPayload = {
        doc_id: userData.doc_id,           // Número de documento
        first_name: userData.first_name,   // nombres
        last_name: userData.last_name,     // apellidos
        active: 'Y',                       // Usuario activo por defecto
        nationality: '',                   // Nacionalidad por defecto
      };

      // Incluir ID si es una actualización
      if (userData.id) {
        userPayload.id = userData.id;
      }

      // Campos opcionales
      if (userData.sec_id) userPayload.sec_id = userData.sec_id;        // otro documento
      if (userData.email) userPayload.email = userData.email;           // correo electrónico
      if (userData.username) userPayload.login = userData.username;     // login (no username)
      if (userData.password) userPayload.password = userData.password;
      if (userData.role) userPayload.role = userData.role;
      
      // Nuevos campos adicionales según el PHP
      if (userData.user_type) userPayload.user_type = userData.user_type;
      if (userData.pin) userPayload.pin = userData.pin;
      if (userData.nationality) userPayload.nationality = userData.nationality;
      if (userData.groups) userPayload.groups = userData.groups;
      if (userData.placeIds) userPayload.placeIds = userData.placeIds;
      if (userData.devicesIds) userPayload.devicesIds = userData.devicesIds;
      
      // Campos de expiración
      if (userData.hasExpiration !== undefined) userPayload.hasExpiration = userData.hasExpiration;
      if (userData.expirationDate) userPayload.expirationDate = userData.expirationDate;
      
      // No incluir picture aquí - se enviará por separado a savePicture.php

      console.log('📦 Payload para saveUser.php:', userPayload);

      // Convertir a FormData para que PHP pueda leer con getPostParameter()
      const formData = new FormData();
      for (const [key, value] of Object.entries(userPayload)) {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      }

      console.log('🚀 Enviando petición POST a saveUser.php como FormData...');
      const userResponse = await axios.post(userUrl, formData, { 
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 segundos de timeout
      });
      
      console.log('📥 Respuesta de saveUser.php:');
      console.log('- Status:', userResponse.status);
      console.log('- Data:', userResponse.data);
      
      const userResult = await this.handleResponse(userResponse);
      console.log('📝 Resultado procesado de saveUser:', userResult);
      
      // Verificar que la respuesta tenga el campo id
      if (!userResult.id) {
        throw new Error('saveUser.php no devolvió un id válido: ' + JSON.stringify(userResult));
      }

      console.log('✅ Usuario guardado exitosamente con ID:', userResult.id);

      // PASO 2: Guardar la foto (si existe) usando JSON
      console.log('🔍 Verificando si hay foto para guardar...');
      console.log('🔍 userData.picture existe:', !!userData.picture);
      console.log('🔍 userData.picture tipo:', typeof userData.picture);
      if (userData.picture) {
        console.log('🔍 userData.picture longitud:', userData.picture.length);
        console.log('📸 PASO 2: Guardando foto del usuario...');
        
        const pictureUrl = this.buildUrl('services/savePicture.php', false);
        console.log('🌐 URL para savePicture:', pictureUrl);
        
        if (!pictureUrl) {
          throw new Error('No se pudo construir la URL del servicio savePicture');
        }

        // Preparar el payload JSON para savePicture.php
        const picturePayload = {
          user_id: userResult.id,
          picture: userData.picture.includes('data:image/') 
            ? userData.picture.split(',')[1] // Extraer solo la parte base64
            : userData.picture
        };

        console.log('📦 Payload JSON para savePicture.php:', {
          user_id: picturePayload.user_id,
          picture: `[base64 data - ${picturePayload.picture.length} chars]`
        });

        console.log('🚀 Enviando petición POST JSON a savePicture.php...');
        const pictureResponse = await axios.post(pictureUrl, picturePayload, { 
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 segundos de timeout para imágenes grandes
        });
        
        console.log('📥 Respuesta de savePicture.php:');
        console.log('- Status:', pictureResponse.status);
        console.log('- Data:', pictureResponse.data);
        
        const pictureResult = await this.handleResponse(pictureResponse);
        console.log('📝 Resultado procesado de savePicture:', pictureResult);
        
        console.log('✅ Foto guardada exitosamente');
      } else {
        console.log('⚠️ No se proporcionó foto, saltando savePicture.php');
        console.log('⚠️ Razón: userData.picture =', userData.picture);
      }

      // Devolver el resultado final con el formato esperado
      const finalResult = {
        id: userResult.id,
        result: userResult.result || 'created', // Asumir 'created' si no se especifica
        ...userResult // Incluir cualquier otro campo que pueda devolver saveUser.php
      };

      console.log('📝 Resultado final:', finalResult);
      console.log('=== FIN saveUser API EXITOSO (NUEVO FLUJO) ===');
      return finalResult;

    } catch (error) {
      console.log('=== ERROR en saveUser API (NUEVO FLUJO) ===');
      console.error('❌ Error completo:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
        console.error('❌ Response headers:', error.response.headers);
      }
      
      // Mejorar el manejo de errores
      if (error.response?.data) {
        const serverError = error.response.data;
        console.error('❌ Error estructurado del servidor:', serverError);
        
        // Crear un error más descriptivo
        const enhancedError = new Error(serverError.error || 'Error del servidor');
        enhancedError.code = serverError.code;
        enhancedError.httpStatus = error.response.status;
        enhancedError.response = error.response;
        
        throw enhancedError;
      }
      
      throw error;
    }
  }

  async updateUser(userData) {
    try {
      console.log('📝 IdentificaAPI.updateUser - Redirigiendo a saveUser');
      
      // El endpoint POST /user/save funciona tanto para crear como actualizar
      // Si el doc_id ya existe, actualiza; si no existe, crea
      return await this.saveUser(userData);
    } catch (error) {
      console.error('❌ Error en updateUser:', error);
      throw error;
    }
  }

  async deleteUser(docId) {
    try {
      const url = this.buildUrl('services/saveUser.php', false); // Usar el endpoint correcto para eliminar
      const headers = await this.getAuthHeaders();
      
      const response = await axios.post(url, { doc_id: docId }, { headers });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  }

  async getUsers(params = {}) {
    try {
      console.log('👥 IdentificaAPI.getUsers - Obteniendo usuarios');
      console.log('👥 Parámetros recibidos:', params);
      
      if (!this.settings) {
        await this.initialize();
      }

      // Si es una llamada legacy con solo tipo, usar el endpoint anterior
      if (typeof params === 'string') {
        console.log('🔄 Usando llamada legacy con tipo:', params);
        const url = this.buildUrl('services/getUsers.php', false);
        const headers = await this.getAuthHeaders();
        const urlParams = params ? { type: params } : {};
        
        const response = await axios.get(url, { headers, params: urlParams });
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
              deniedNote: user[11],
              user_type: user[12]
            }))
          };
        }
        
        return { success: false, error: 'No se encontraron usuarios' };
      }

      // Nueva implementación con paginación
      const url = this.buildUrl('services/getUsersPaginated.php', false);
      const headers = await this.getAuthHeaders();
      
      // Preparar el payload según el formato requerido
      const payload = {
        page: params.page || 1,
        size: params.size || 10,
        direction: params.direction || "asc",
        column: params.column || "first_name",
        filter: params.filter || null
      };
      
      console.log('🌐 URL:', url);
      console.log('📦 Payload enviado:', payload);
      console.log('🔐 Headers:', { ...headers, Authorization: headers.Authorization ? '[TOKEN PRESENTE]' : '[NO TOKEN]' });
      
      const response = await axios.post(url, payload, { 
        headers,
        timeout: 10000 // 10 segundos de timeout
      });
      
      console.log('📥 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      const result = await this.handleResponse(response);
      
      // Mapear los datos al formato esperado
      if (result.data) {
        const mappedUsers = result.data.map(user => ({
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
        }));

        console.log('✅ Usuarios procesados:', {
          totalData: mappedUsers.length,
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          firstUser: mappedUsers[0]
        });
        
        return {
          success: true,
          users: mappedUsers,
          totalItems: result.total || mappedUsers.length,
          totalPages: result.totalPages || 1,
          currentPage: result.page || payload.page,
          pageSize: result.size || payload.size,
          hasMore: (result.page || payload.page) < (result.totalPages || 1),
          // Para compatibilidad con estadísticas, también incluir todos los usuarios si es la primera página
          allUsersStats: result.allUsersStats || mappedUsers
        };
      }
      
      return { success: false, error: 'No se encontraron usuarios' };
    } catch (error) {
      console.error('❌ Error en getUsers:');
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response data:', error.response.data);
        console.error('- Response headers:', error.response.headers);
      }
      
      // Si el endpoint paginado no existe, usar el legacy como fallback
      if (error.response?.status === 404) {
        console.log('🔄 Endpoint paginado no encontrado, usando fallback legacy...');
        return this.getUsersLegacy(params.filter);
      }
      
      // Crear un error más descriptivo
      let errorMessage = 'Error al cargar usuarios';
      
      if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor (500). Verifica los logs del servidor.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Error de autenticación. Verifica las credenciales.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Acceso denegado. Verifica los permisos.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // Método legacy de fallback
  async getUsersLegacy(type = '') {
    try {
      console.log('🔄 Usando getUsersLegacy con tipo:', type);
      
      const url = this.buildUrl('services/getUsers.php', false);
      const headers = await this.getAuthHeaders();
      const params = type ? { type } : {};
      
      const response = await axios.get(url, { headers, params });
      const data = await this.handleResponse(response);
      
      if (data.data) {
        const mappedUsers = data.data.map(user => ({
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
        }));

        // Simular paginación con los datos completos
        return {
          success: true,
          users: mappedUsers.slice(0, 10), // Solo primeros 10
          totalItems: mappedUsers.length,
          totalPages: Math.ceil(mappedUsers.length / 10),
          currentPage: 1,
          pageSize: 10,
          hasMore: mappedUsers.length > 10,
          allUsersStats: mappedUsers // Para estadísticas
        };
      }
      
      return { success: false, error: 'No se encontraron usuarios' };
    } catch (error) {
      console.error('❌ Error en getUsersLegacy:', error);
      return { success: false, error: error.message };
    }
  }

  // Device management method removed - using unified version below

  // Event management
  async saveEvent(eventData) {
    try {
      const url = this.buildUrl('services/eventSave.php', false);
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
      const url = this.buildUrl('services/getEvents.php', false);
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
      const url = this.buildUrl('services/getLastEvents.php', false);
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
      const url = this.buildUrl('services/imageValidate.php', false);
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
      const url = this.buildUrl('services/documentRead.php', false);
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

  // Get user picture
  async getUserPicture(id, pubId) {
    try {
      await this.initialize();
      
      if (!this.token) {
        const loginResult = await this.login();
        if (!loginResult.success) {
          throw new Error('No se pudo obtener token de autenticación');
        }
      }
      
      const url = this.buildUrl(`services/getPicture.php?id=${id}&pub_id=${pubId}`, false);
      
      // Return the URL and token for the image request
      return {
        success: true,
        imageUrl: url,
        token: this.token
      };
    } catch (error) {
      console.error('Error in getUserPicture:', error);
      return { success: false, error: error.message };
    }
  }

  // Events management
  async getEvents(params = {}) {
    try {
      console.log('📅 IdentificaAPI.getEvents - Obteniendo eventos/marcaciones');
      console.log('📅 Parámetros recibidos:', params);
      
      if (!this.settings) {
        await this.initialize();
      }

      const url = this.buildUrl('services/getEvents.php', false);
      const headers = await this.getAuthHeaders();
      
      // Preparar el payload según el formato esperado: {page: 1, size: 10, direction: "desc", column: "created", filter: null}
      const payload = {
        page: params.page || 1,
        size: params.size || 10, // Cambiar de 5 a 10 por defecto
        direction: params.direction || "desc",
        column: params.column || "created",
        filter: params.filter || null
      };
      
      console.log('🌐 URL:', url);
      console.log('📦 Payload enviado:', payload);
      console.log('🔐 Headers:', { ...headers, Authorization: headers.Authorization ? '[TOKEN PRESENTE]' : '[NO TOKEN]' });
      
      // Cambiar de GET a POST según el formato que espera el servicio
      const response = await axios.post(url, payload, { 
        headers,
        timeout: 10000 // 10 segundos de timeout
      });
      
      console.log('📥 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      const result = await this.handleResponse(response);
      
      console.log('✅ Eventos procesados:', {
        totalData: result.data?.length || result.length || 0,
        firstEvent: result.data?.[0] || result[0]
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error en getEvents:');
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response data:', error.response.data);
        console.error('- Response headers:', error.response.headers);
      }
      
      // Crear un error más descriptivo
      let errorMessage = 'Error al cargar eventos';
      
      if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor (500). Verifica los logs del servidor.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Error de autenticación. Verifica las credenciales.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Acceso denegado. Verifica los permisos.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
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

  // Company management
  async getCompanies(params = {}) {
    try {
      console.log('📋 IdentificaAPI.getCompanies - Obteniendo lista de empresas');
      console.log('📋 Parámetros recibidos:', params);
      
      if (!this.settings) {
        await this.initialize();
      }

      const url = this.buildUrl('services/company/getList.php', false);
      const headers = await this.getAuthHeaders();
      
      // Crear el payload exactamente como lo espera el PHP
      const payload = {
        page: params.page || 1,
        size: params.size || 25,
        column: params.column || 'created',  // columna para ordenar
        direction: params.direction || 'desc', // dirección del ordenamiento
        filter: params.filter || '' // filtro de búsqueda
      };
      
      console.log('🌐 URL:', url);
      console.log('📦 Payload enviado:', payload);
      console.log('🔐 Headers:', { ...headers, Authorization: headers.Authorization ? '[TOKEN PRESENTE]' : '[NO TOKEN]' });
      
      const response = await axios.post(url, payload, { 
        headers,
        timeout: 10000 // 10 segundos de timeout
      });
      
      console.log('📥 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      const result = await this.handleResponse(response);
      
      console.log('✅ Empresas procesadas:', {
        totalData: result.data?.length || 0,
        total: result.total,
        firstCompany: result.data?.[0]
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error en getCompanies:');
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response data:', error.response.data);
        console.error('- Response headers:', error.response.headers);
      }
      
      // Crear un error más descriptivo
      let errorMessage = 'Error al cargar empresas';
      
      if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor (500). Verifica los logs del servidor.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Error de autenticación. Verifica las credenciales.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Acceso denegado. Verifica los permisos.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async createCompanyWithUser(companyData) {
    try {
      console.log('💾 IdentificaAPI.createCompanyWithUser - Creando empresa con usuario:', companyData);
      
      if (!this.settings) {
        await this.initialize();
      }
      const url = this.buildUrl('services/company/createWithUser.php', false);
      const headers = await this.getAuthHeaders();
      
      const payload = {
        name: companyData.name,
        rut: companyData.rut,
        address: companyData.address || '',
        notes: companyData.notes || '',
        username: companyData.username,
        password: companyData.password,
        email: companyData.email
      };
      
      console.log('🌐 URL:', url);
      console.log('📦 Payload enviado:', { ...payload, password: '[HIDDEN]' });
      
      const response = await axios.post(url, payload, { 
        headers,
        timeout: 10000
      });
      
      console.log('📥 Respuesta:', response.data);
      return await this.handleResponse(response);
      
    } catch (error) {
      console.error('❌ Error en createCompanyWithUser:', error);
      throw error;
    }
  }

  async getCompanyWithUser(companyId) {
    try {
      console.log('📋 IdentificaAPI.getCompanyWithUser - Obteniendo empresa con usuario:', companyId);
      
      if (!this.settings) {
        await this.initialize();
      }
      const url = this.buildUrl('services/company/getWithUser.php', false);
      const headers = await this.getAuthHeaders();
      
      const payload = { id: companyId };
      
      console.log('🌐 URL:', url);
      console.log('📦 Payload enviado:', payload);
      
      const response = await axios.post(url, payload, { 
        headers,
        timeout: 10000
      });
      
      console.log('📥 Respuesta:', response.data);
      return await this.handleResponse(response);
      
    } catch (error) {
      console.error('❌ Error en getCompanyWithUser:', error);
      throw error;
    }
  }

  async updateCompanyWithUser(companyData) {
    try {
      console.log('💾 IdentificaAPI.updateCompanyWithUser - Actualizando empresa con usuario:', companyData);
      
      if (!this.settings) {
        await this.initialize();
      }
      const url = this.buildUrl('services/company/updateWithUser.php', false);
      const headers = await this.getAuthHeaders();
      
      const payload = {
        id: companyData.id,
        name: companyData.name,
        rut: companyData.rut,
        address: companyData.address || '',
        notes: companyData.notes || '',
        username: companyData.username,
        email: companyData.email,
        userId: companyData.userId
      };
      
      // Solo incluir contraseña si se proporcionó una nueva
      if (companyData.password && companyData.password.trim()) {
        payload.password = companyData.password;
      }
      
      console.log('🌐 URL:', url);
      console.log('📦 Payload enviado:', { ...payload, password: payload.password ? '[HIDDEN]' : '[NOT PROVIDED]' });
      
      const response = await axios.post(url, payload, { 
        headers,
        timeout: 10000
      });
      
      console.log('📥 Respuesta:', response.data);
      return await this.handleResponse(response);
      
    } catch (error) {
      console.error('❌ Error en updateCompanyWithUser:', error);
      throw error;
    }
  }

  // Device management (unified version)
  async getDevices(params = {}) {
    try {
      console.log('📦 IdentificaAPI.getDevices - Obteniendo lista de dispositivos');
      console.log('📦 Parámetros recibidos:', params);
      
      if (!this.settings) {
        await this.initialize();
      }

      const url = this.buildUrl('services/device/getList.php', false);
      const headers = await this.getAuthHeaders();
      
      console.log('🌐 URL:', url);
      console.log('🔐 Headers:', { ...headers, Authorization: headers.Authorization ? '[TOKEN PRESENTE]' : '[NO TOKEN]' });
      
      // El PHP siempre espera POST con parámetros, nunca GET
      // Formato EXACTO del otro sistema: {"page":1,"size":5,"direction":"","column":"asc","filter":null}
      // IMPORTANTE: page debe ser >= 1, nunca 0
      const payload = {
        page: Math.max(params.page || 1, 1),  // Asegurar que page >= 1
        size: params.size || 5, // Tamaño por defecto como en el otro sistema
        direction: params.direction !== undefined ? params.direction : "", // String vacío por defecto
        column: params.column || "asc", // "asc" como en el otro sistema
        filter: params.filter || null
      };
      
      console.log('📦 Payload POST enviado:', payload);
      
      // Probar diferentes formatos de Content-Type según el servidor PHP
      console.log('📦 Intentando envío con Content-Type application/json...');
      
      let response;
      try {
        // Primer intento: JSON con headers exactos del otro sistema
        response = await axios.post(url, payload, { 
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
          },
          timeout: 10000
        });
      } catch (jsonError) {
        console.log('⚠️ Error con JSON, probando con form-urlencoded...');
        
        // Segundo intento: Form-encoded (como esperan algunos PHP)
        const formParams = new URLSearchParams();
        Object.keys(payload).forEach(key => {
          if (payload[key] !== null && payload[key] !== undefined) {
            formParams.append(key, payload[key].toString());
          } else {
            formParams.append(key, '');
          }
        });
        
        console.log('📦 Payload form-encoded:', formParams.toString());
        
        response = await axios.post(url, formParams, { 
          headers: {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        });
      }
      
      console.log('📥 Respuesta POST del servidor:', {
        status: response.status,
        data: response.data
      });
      
      const data = await this.handleResponse(response);
      
      // Log para debug - ver respuesta cruda
      console.log('🔍 Respuesta cruda del servidor:', JSON.stringify(data, null, 2));
        
      // Procesar respuesta del servidor
      if (data && data.data && Array.isArray(data.data)) {
        console.log('✅ Dispositivos procesados:', {
          totalData: data.data.length,
          total: data.total,
          firstDevice: data.data[0]
        });
        
        // Mapear al formato esperado según el formato real de datos:
        // Formato: ["4","Divisa 900-B","0","1","0","20","3","La Divisa","333236","704148","20","1969-12-31 20:33:45","1969-12-31 20:33:45",["conductor","externo"],"1"]
        // 0: id, 1: name, 2: status1, 3: active, 4: status2, 5: limit,
        // 6: location_id, 7: location_name, 8: coord1, 9: coord2, 10: field10, 11: created_at, 12: updated_at,
        // 13: allowed_roles (array), 14: is_active
        const mappedDevices = data.data.map(device => {
          if (Array.isArray(device)) {
            return {
              id: device[0],
              name: device[1],
              status1: device[2],
              active: device[3],
              status2: device[4],
              limit: device[5],
              location_id: device[6],
              location_name: device[7],
              coord1: device[8],
              coord2: device[9],
              field10: device[10],
              created_at: device[11],
              updated_at: device[12],
              allowed_roles: Array.isArray(device[13]) ? device[13] : [],
              is_active: device[14]
            };
          }
          // Si ya es un objeto, devolverlo tal cual
          return device;
        });
        
        console.log('📋 Dispositivos mapeados:', mappedDevices.length, 'dispositivos');
        console.log('📋 Muestra de dispositivos:', mappedDevices.slice(0, 3));
        
        return {
          success: true,
          devices: mappedDevices,
          total: data.total || mappedDevices.length,
          page: payload.page,
          totalPages: Math.ceil((data.total || mappedDevices.length) / payload.size)
        };
      }
      
      console.log('⚠️ No se encontraron dispositivos en la respuesta');
      return { success: false, error: 'No se encontraron dispositivos', devices: [] };
    } catch (error) {
      console.error('❌ Error en getDevices:');
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response data:', error.response.data);
        console.error('- Response headers:', error.response.headers);
      }
      
      // Crear un mensaje de error más descriptivo
      let errorMessage = 'Error al cargar dispositivos';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor (500)';
      } else if (error.response?.status === 401) {
        errorMessage = 'Error de autenticación';
      } else if (error.response?.status === 403) {
        errorMessage = 'Acceso denegado';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Retornar array vacío en lugar de error para no romper la UI
      return { 
        success: false, 
        error: errorMessage,
        devices: [] // Array vacío para evitar errores en el componente
      };
    }
  }

  // Device management methods
  async getDevice(deviceId) {
    try {
      console.log('📱 IdentificaAPI.getDevice - Obteniendo dispositivo:', deviceId);
      
      if (!this.settings) {
        await this.initialize();
      }

      const url = this.buildUrl(`services/device/getOne.php?id=${deviceId}`, false);
      const headers = await this.getAuthHeaders();
      
      console.log('🌐 URL:', url);
      
      const response = await axios.get(url, { 
        headers,
        timeout: 10000
      });
      
      console.log('📥 Respuesta del servidor:', response.data);
      
      if (response.data && response.data.device) {
        return {
          success: true,
          device: response.data.device
        };
      } else {
        return {
          success: false,
          error: 'Dispositivo no encontrado'
        };
      }
      
    } catch (error) {
      console.error('❌ Error en getDevice:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener dispositivo'
      };
    }
  }

  async saveDevice(deviceData) {
    try {
      console.log('💾 IdentificaAPI.saveDevice - Guardando dispositivo:', deviceData);
      
      if (!this.settings) {
        await this.initialize();
      }

      const url = this.buildUrl('services/device/save.php', false);
      const headers = await this.getAuthHeaders();
      
      // Preparar los datos según el formato que espera save.php
      const formData = new FormData();
      
      if (deviceData.id) {
        formData.append('id', deviceData.id);
      }
      
      formData.append('name', deviceData.name || '');
      formData.append('hasDependency', deviceData.hasDependency ? '1' : '0');
      formData.append('dependencyId', deviceData.dependencyId || '');
      formData.append('maxMinutes', deviceData.maxMinutes || '');
      formData.append('hasPlate', deviceData.hasPlate ? '1' : '0');
      formData.append('placeId', deviceData.placeId || '');
      formData.append('lat', deviceData.lat || '');
      formData.append('lng', deviceData.lng || '');
      formData.append('radio', deviceData.radio || '');
      formData.append('allowInvitation', deviceData.allowInvitation ? '1' : '0');
      formData.append('location', deviceData.location || '');
      
      // user_types como string separado por comas
      if (deviceData.user_types && Array.isArray(deviceData.user_types)) {
        formData.append('user_types', deviceData.user_types.join(','));
      }
      
      console.log('🌐 URL:', url);
      console.log('📦 Datos a enviar:', Object.fromEntries(formData));
      
      const response = await axios.post(url, formData, { 
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000
      });
      
      console.log('📥 Respuesta del servidor:', response.data);
      
      if (response.data && response.data.id) {
        return {
          success: true,
          id: response.data.id,
          message: deviceData.id ? 'Dispositivo actualizado correctamente' : 'Dispositivo creado correctamente'
        };
      } else {
        return {
          success: false,
          error: 'Error al guardar dispositivo'
        };
      }
      
    } catch (error) {
      console.error('❌ Error en saveDevice:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || 'Error al guardar dispositivo'
      };
    }
  }

  // Settings management
  async getSettings() {
    try {
      console.log('⚙️ IdentificaAPI.getSettings - Obteniendo configuración del sistema');
      
      if (!this.settings) {
        await this.initialize();
      }

      const url = this.buildUrl('services/settings/getSettings.php', false);
      const headers = await this.getAuthHeaders();
      
      console.log('🌐 URL:', url);
      console.log('🔐 Headers:', { ...headers, Authorization: headers.Authorization ? '[TOKEN PRESENTE]' : '[NO TOKEN]' });
      
      const response = await axios.get(url, { 
        headers,
        timeout: 10000
      });
      
      console.log('📥 Respuesta del servidor:', {
        status: response.status,
        data: response.data
      });
      
      const data = await this.handleResponse(response);
      
      // Procesar user_types si existe
      if (data.user_types && typeof data.user_types === 'string') {
        data.user_types_array = data.user_types.split(',').map(type => type.trim()).filter(type => type);
        console.log('📋 Tipos de usuario procesados:', data.user_types_array);
      }
      
      console.log('✅ Configuración obtenida:', data);
      return {
        success: true,
        settings: data
      };
    } catch (error) {
      console.error('❌ Error en getSettings:');
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response data:', error.response.data);
        console.error('- Response headers:', error.response.headers);
      }
      
      let errorMessage = 'Error al obtener configuración';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor (500)';
      } else if (error.response?.status === 401) {
        errorMessage = 'Error de autenticación';
      } else if (error.response?.status === 403) {
        errorMessage = 'Acceso denegado';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage,
        settings: null
      };
    }
  }

  async saveCompany(companyData) {
    try {
      console.log('💾 IdentificaAPI.saveCompany - Guardando empresa:', companyData);
      
      if (!this.settings) {
        await this.initialize();
      }

      const url = this.buildUrl('services/company/save.php', false);
      const headers = await this.getAuthHeaders();
      
      // El save.php espera parámetros POST tradicionales, no JSON
      const formData = new FormData();
      
      if (companyData.id) {
        formData.append('id', companyData.id.toString());
      }
      if (companyData.name) {
        formData.append('name', companyData.name);
      }
      if (companyData.rut) {
        formData.append('rut', companyData.rut);
      }
      if (companyData.address) {
        formData.append('address', companyData.address);
      }
      // El save.php espera 'notes', no 'deniedNote'
      if (companyData.notes) {
        formData.append('notes', companyData.notes);
      }
      
      console.log('🌐 URL:', url);
      console.log('📦 FormData enviado:', {
        id: companyData.id || 'undefined',
        name: companyData.name || 'undefined',
        rut: companyData.rut || 'undefined',
        address: companyData.address || 'undefined',
        notes: companyData.notes || 'undefined'
      });
      
      // Configurar headers para form data
      const requestHeaders = {
        ...headers
        // No establecer Content-Type manualmente, axios lo hará automáticamente para FormData
      };
      
      const response = await axios.post(url, formData, { 
        headers: requestHeaders,
        timeout: 10000
      });
      
      console.log('📥 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      const result = await this.handleResponse(response);
      
      console.log('✅ Empresa guardada:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en saveCompany:');
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response data:', error.response.data);
        console.error('- Response headers:', error.response.headers);
      }
      
      // Crear un error más descriptivo
      let errorMessage = 'Error al guardar empresa';
      
      if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor (500). Verifica los logs del servidor.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Error de autenticación. Verifica las credenciales.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Acceso denegado. Verifica los permisos.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async deleteCompany(companyId) {
    try {
      console.log('🗑️ IdentificaAPI.deleteCompany - Eliminando empresa:', companyId);
      
      if (!this.settings) {
        await this.initialize();
      }

      // Como el save.php original no maneja eliminación, necesitamos crear un endpoint separado
      const url = this.buildUrl('services/company/delete.php', false);
      const headers = await this.getAuthHeaders();
      
      // Usar FormData para consistencia con el patrón de save.php
      const formData = new FormData();
      formData.append('id', companyId.toString());
      
      console.log('🌐 URL:', url);
      console.log('📦 FormData enviado:', { id: companyId });
      
      const response = await axios.post(url, formData, { 
        headers,
        timeout: 10000
      });
      
      const result = await this.handleResponse(response);
      
      console.log('✅ Empresa eliminada:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en deleteCompany:');
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response data:', error.response.data);
        console.error('- Response headers:', error.response.headers);
      }
      
      // Si el endpoint de delete no existe, intentar con una actualización que marque como inactiva
      if (error.response?.status === 404) {
        console.log('🔄 Endpoint delete.php no encontrado, intentando soft delete...');
        return this.softDeleteCompany(companyId);
      }
      
      // Crear un error más descriptivo
      let errorMessage = 'Error al eliminar empresa';
      
      if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor (500). Verifica los logs del servidor.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Error de autenticación. Verifica las credenciales.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Acceso denegado. Verifica los permisos.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
  
  // Método auxiliar para soft delete cuando no existe delete.php
  async softDeleteCompany(companyId) {
    try {
      console.log('🔄 Intentando soft delete para empresa:', companyId);
      
      // Primero obtener los datos actuales de la empresa
      const companies = await this.getCompanies({ filter: '', page: 1, size: 1000 });
      const company = companies.data?.find(row => row[0] === companyId);
      
      if (!company) {
        throw new Error('Empresa no encontrada');
      }
      
      // Marcar la empresa como denegada para simular eliminación
      const updateData = {
        id: companyId,
        name: company[2], // name
        rut: company[1],  // rut
        address: company[3], // address
        notes: '[ELIMINADA] ' + (company[6] || '') // deniedNote
      };
      
      console.log('📦 Datos para soft delete:', updateData);
      
      await this.saveCompany(updateData);
      
      return {
        success: true,
        result: 'deleted',
        id: companyId
      };
    } catch (error) {
      console.error('❌ Error en softDeleteCompany:', error);
      throw error;
    }
  }

  // ========================================
  // BLACKLIST & WHITELIST MANAGEMENT
  // ========================================

  // Blacklisted Users
  async getBlacklistedUsers() {
    try {
      console.log('🚫 IdentificaAPI.getBlacklistedUsers - Obteniendo usuarios denegados');
      
      // Usar el endpoint existente con el parámetro type=denied
      const result = await this.getUsers('denied');
      
      if (result.success && result.users) {
        console.log('✅ Usuarios denegados obtenidos:', result.users.length);
        return {
          success: true,
          users: result.users
        };
      }
      
      return { success: false, error: 'No se pudieron obtener usuarios denegados' };
    } catch (error) {
      console.error('❌ Error en getBlacklistedUsers:', error);
      return { success: false, error: error.message };
    }
  }

  async addUserToBlacklist(userData) {
    try {
      console.log('🚫 IdentificaAPI.addUserToBlacklist - Agregando usuario a lista negra:', userData);
      
      // TODO: Implementar endpoint específico para agregar a lista negra
      // Por ahora, usar saveUser con un campo especial
      const userWithBlacklistFlag = {
        ...userData,
        isDenied: true,
        deniedNote: userData.reason || 'Agregado a lista negra'
      };
      
      const result = await this.saveUser(userWithBlacklistFlag);
      console.log('✅ Usuario agregado a lista negra:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en addUserToBlacklist:', error);
      throw error;
    }
  }

  async removeUserFromBlacklist(docId) {
    try {
      console.log('✅ IdentificaAPI.removeUserFromBlacklist - Removiendo usuario de lista negra:', docId);
      
      // TODO: Implementar endpoint específico para remover de lista negra
      // Por ahora, podrías actualizar el usuario para quitar el flag de denegado
      
      throw new Error('Funcionalidad en desarrollo - Usar deleteUser por ahora');
    } catch (error) {
      console.error('❌ Error en removeUserFromBlacklist:', error);
      throw error;
    }
  }

  // Blacklisted Vehicles
  async getBlacklistedVehicles() {
    try {
      console.log('🚗 IdentificaAPI.getBlacklistedVehicles - Obteniendo vehículos denegados');
      
      // TODO: Implementar endpoint para vehículos denegados
      const url = this.buildUrl('services/getVehicles.php?type=denied', false);
      const headers = await this.getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      const data = await this.handleResponse(response);
      
      if (data.data) {
        return {
          success: true,
          vehicles: data.data.map(vehicle => ({
            id: vehicle[0],
            plate: vehicle[1],
            brand: vehicle[2],
            model: vehicle[3],
            year: vehicle[4],
            color: vehicle[5],
            owner_name: vehicle[6],
            owner_doc_id: vehicle[7],
            reason: vehicle[8],
            blocked_date: vehicle[9],
            blocked_by: vehicle[10],
            status: vehicle[11]
          }))
        };
      }
      
      return { success: false, error: 'No se encontraron vehículos denegados' };
    } catch (error) {
      console.error('❌ Error en getBlacklistedVehicles:', error);
      return { success: false, error: error.message };
    }
  }

  async addVehicleToBlacklist(vehicleData) {
    try {
      console.log('🚗 IdentificaAPI.addVehicleToBlacklist - Agregando vehículo a lista negra:', vehicleData);
      
      // TODO: Implementar endpoint específico para agregar vehículo a lista negra
      const url = this.buildUrl('services/addVehicleToBlacklist.php', false);
      const headers = await this.getAuthHeaders();
      
      const response = await axios.post(url, vehicleData, { headers });
      const result = await this.handleResponse(response);
      
      console.log('✅ Vehículo agregado a lista negra:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en addVehicleToBlacklist:', error);
      throw error;
    }
  }

  async removeVehicleFromBlacklist(vehicleId) {
    try {
      console.log('✅ IdentificaAPI.removeVehicleFromBlacklist - Removiendo vehículo de lista negra:', vehicleId);
      
      // TODO: Implementar endpoint específico para remover vehículo de lista negra
      const url = this.buildUrl('services/removeVehicleFromBlacklist.php', false);
      const headers = await this.getAuthHeaders();
      
      const response = await axios.post(url, { id: vehicleId }, { headers });
      const result = await this.handleResponse(response);
      
      console.log('✅ Vehículo removido de lista negra:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en removeVehicleFromBlacklist:', error);
      throw error;
    }
  }

  // Blacklisted Companies
  async getBlacklistedCompanies() {
    try {
      console.log('🏢 IdentificaAPI.getBlacklistedCompanies - Obteniendo empresas denegadas');
      
      // TODO: Implementar endpoint para empresas denegadas
      const url = this.buildUrl('services/getCompanies.php?type=denied', false);
      const headers = await this.getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      const data = await this.handleResponse(response);
      
      if (data.data) {
        return {
          success: true,
          companies: data.data.map(company => ({
            id: company[0],
            rut: company[1],
            company_name: company[2],
            address: company[3],
            legal_representative: company[4],
            rep_doc_id: company[5],
            email: company[6],
            phone: company[7],
            reason: company[8],
            blocked_date: company[9],
            blocked_by: company[10],
            status: company[11]
          }))
        };
      }
      
      return { success: false, error: 'No se encontraron empresas denegadas' };
    } catch (error) {
      console.error('❌ Error en getBlacklistedCompanies:', error);
      return { success: false, error: error.message };
    }
  }

  async addCompanyToBlacklist(companyData) {
    try {
      console.log('🏢 IdentificaAPI.addCompanyToBlacklist - Agregando empresa a lista negra:', companyData);
      
      // TODO: Implementar endpoint específico para agregar empresa a lista negra
      const url = this.buildUrl('services/addCompanyToBlacklist.php', false);
      const headers = await this.getAuthHeaders();
      
      const response = await axios.post(url, companyData, { headers });
      const result = await this.handleResponse(response);
      
      console.log('✅ Empresa agregada a lista negra:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en addCompanyToBlacklist:', error);
      throw error;
    }
  }

  async removeCompanyFromBlacklist(companyId) {
    try {
      console.log('✅ IdentificaAPI.removeCompanyFromBlacklist - Removiendo empresa de lista negra:', companyId);
      
      // TODO: Implementar endpoint específico para remover empresa de lista negra
      const url = this.buildUrl('services/removeCompanyFromBlacklist.php', false);
      const headers = await this.getAuthHeaders();
      
      const response = await axios.post(url, { id: companyId }, { headers });
      const result = await this.handleResponse(response);
      
      console.log('✅ Empresa removida de lista negra:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en removeCompanyFromBlacklist:', error);
      throw error;
    }
  }

  // Whitelist Management (similares a blacklist pero para autorizados)
  async getWhitelistedUsers() {
    try {
      console.log('✅ IdentificaAPI.getWhitelistedUsers - Obteniendo usuarios autorizados');
      
      // TODO: Implementar endpoint para usuarios autorizados
      const result = await this.getUsers('authorized');
      
      if (result.success && result.users) {
        console.log('✅ Usuarios autorizados obtenidos:', result.users.length);
        return {
          success: true,
          users: result.users
        };
      }
      
      return { success: false, error: 'No se pudieron obtener usuarios autorizados' };
    } catch (error) {
      console.error('❌ Error en getWhitelistedUsers:', error);
      return { success: false, error: error.message };
    }
  }

  async getWhitelistedVehicles() {
    try {
      console.log('🚗 IdentificaAPI.getWhitelistedVehicles - Obteniendo vehículos autorizados');
      
      // TODO: Implementar endpoint para vehículos autorizados
      const url = this.buildUrl('services/getVehicles.php?type=authorized', false);
      const headers = await this.getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      const data = await this.handleResponse(response);
      
      if (data.data) {
        return {
          success: true,
          vehicles: data.data
        };
      }
      
      return { success: false, error: 'No se encontraron vehículos autorizados' };
    } catch (error) {
      console.error('❌ Error en getWhitelistedVehicles:', error);
      return { success: false, error: error.message };
    }
  }

  async getWhitelistedCompanies() {
    try {
      console.log('🏢 IdentificaAPI.getWhitelistedCompanies - Obteniendo empresas autorizadas');
      
      // TODO: Implementar endpoint para empresas autorizadas
      const url = this.buildUrl('services/getCompanies.php?type=authorized', false);
      const headers = await this.getAuthHeaders();
      
      const response = await axios.get(url, { headers });
      const data = await this.handleResponse(response);
      
      if (data.data) {
        return {
          success: true,
          companies: data.data
        };
      }
      
      return { success: false, error: 'No se encontraron empresas autorizadas' };
    } catch (error) {
      console.error('❌ Error en getWhitelistedCompanies:', error);
      return { success: false, error: error.message };
    }
  }

  // Security Statistics
  async getSecurityStats() {
    try {
      console.log('📊 IdentificaAPI.getSecurityStats - Obteniendo estadísticas de seguridad');
      
      // TODO: Implementar endpoint específico para estadísticas de seguridad
      // Por ahora, calculamos las estadísticas obteniendo los datos por separado
      const [blacklistUsers, blacklistVehicles, blacklistCompanies, whitelistUsers] = await Promise.allSettled([
        this.getBlacklistedUsers(),
        this.getBlacklistedVehicles(),
        this.getBlacklistedCompanies(),
        this.getWhitelistedUsers()
      ]);
      
      const stats = {
        blacklistUsers: blacklistUsers.status === 'fulfilled' && blacklistUsers.value.success 
          ? blacklistUsers.value.users.length : 0,
        blacklistVehicles: blacklistVehicles.status === 'fulfilled' && blacklistVehicles.value.success 
          ? blacklistVehicles.value.vehicles.length : 0,
        blacklistCompanies: blacklistCompanies.status === 'fulfilled' && blacklistCompanies.value.success 
          ? blacklistCompanies.value.companies.length : 0,
        whitelistUsers: whitelistUsers.status === 'fulfilled' && whitelistUsers.value.success 
          ? whitelistUsers.value.users.length : 0,
        totalBlacklist: 0,
        totalWhitelist: 0
      };
      
      stats.totalBlacklist = stats.blacklistUsers + stats.blacklistVehicles + stats.blacklistCompanies;
      stats.totalWhitelist = stats.whitelistUsers; // Se puede expandir cuando tengamos más datos
      
      console.log('✅ Estadísticas de seguridad calculadas:', stats);
      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('❌ Error en getSecurityStats:', error);
      return { success: false, error: error.message };
    }
  }

  // Método para obtener permisos de usuario desde el servidor
  async getUserPermissions() {
    try {
      console.log('🔐 API: Obteniendo permisos de usuario desde servidor...');
      const headers = await this.getAuthHeaders();
      const url = this.buildUrl('services/user/getPermissions.php'); // URL sugerida
      
      if (!url) {
        throw new Error('URL de permisos inválida');
      }
      
      console.log('📡 API: Enviando petición a:', url);
      const response = await axios.get(url, { headers });
      
      const data = await this.handleResponse(response);
      console.log('🔐 API: Permisos de usuario recibidos:', data);
      
      return { success: true, ...data };
    } catch (error) {
      console.error('❌ API: Error obteniendo permisos de usuario:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Error obteniendo permisos' 
      };
    }
  }

  // Método para obtener configuración del dashboard (settings)
  async getSettings() {
    try {
      console.log('⚙️ API: Obteniendo configuración del servidor...');
      const headers = await this.getAuthHeaders();
      const url = this.buildUrl('services/settings/getSettings.php');
      
      if (!url) {
        throw new Error('URL de configuración inválida');
      }
      
      console.log('📡 API: Enviando petición a:', url);
      const response = await axios.get(url, { headers });
      
      const data = await this.handleResponse(response);
      console.log('⚙️ API: Datos de configuración recibidos:', data);
      
      // Procesar user_types si existe
      if (data.user_types && typeof data.user_types === 'string') {
        data.user_types_array = data.user_types.split(',').map(type => type.trim()).filter(type => type);
        console.log('⚙️ API: user_types procesados:', data.user_types_array);
      }
      
      return { success: true, settings: data };
    } catch (error) {
      console.error('❌ API: Error obteniendo configuración:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Error obteniendo configuración' 
      };
    }
  }

  // Scheduler/Appointments management
  async getAppointments(params = {}) {
    try {
      console.log('📅 IdentificaAPI.getAppointments - Obteniendo agendamientos');
      console.log('📅 Parámetros recibidos:', params);
      
      if (!this.settings) {
        await this.initialize();
      }

      const url = this.buildUrl('services/scheduler/getList.php', false);
      const headers = await this.getAuthHeaders();
      
      // Preparar el payload según el formato esperado
      const payload = {
        page: params.page || 1,
        size: params.size || 10,
        direction: params.direction || "desc",
        column: params.column || "created",
        filter: params.filter || ""
      };
      
      console.log('🌐 URL:', url);
      console.log('📦 Payload enviado:', payload);
      console.log('🔐 Headers:', { ...headers, Authorization: headers.Authorization ? '[TOKEN PRESENTE]' : '[NO TOKEN]' });
      
      const response = await axios.post(url, payload, { 
        headers,
        timeout: 10000 // 10 segundos de timeout
      });
      
      console.log('📥 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      const result = await this.handleResponse(response);
      
      // Mapear los datos al formato esperado por el frontend
      if (result.data && Array.isArray(result.data)) {
        const mappedAppointments = result.data.map(row => ({
          id: row[0],
          numeroContenedor: row[1],
          rutUsuario: row[2],
          nombreConductor: row[3],
          apellidoConductor: row[4],
          patenteVehiculo: row[5],
          fechaAsignacion: new Date(row[6]),
          status: row[7],
          enPuertaStatus: row[8],
          enPuertaTimestamp: row[9] ? new Date(row[9]) : null,
          gateStatus: row[10],
          gateTimestamp: row[11] ? new Date(row[11]) : null,
          patioStatus: row[12],
          patioTimestamp: row[13] ? new Date(row[13]) : null,
          salidaStatus: row[14],
          salidaTimestamp: row[15] ? new Date(row[15]) : null,
          createdBy: row[16],
          created: new Date(row[17]),
          updated: new Date(row[18])
        }));

        console.log('✅ Agendamientos procesados:', {
          totalData: mappedAppointments.length,
          total: result.total,
          firstAppointment: mappedAppointments[0]
        });
        
        return {
          success: true,
          appointments: mappedAppointments,
          totalItems: result.total || mappedAppointments.length,
          totalPages: result.totalPages || 1,
          currentPage: result.page || payload.page,
          pageSize: result.size || payload.size,
          hasMore: result.hasMore || false
        };
      }
      
      return { success: false, error: 'No se encontraron agendamientos' };
    } catch (error) {
      console.error('❌ Error en getAppointments:');
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response data:', error.response.data);
        console.error('- Response headers:', error.response.headers);
      }
      
      // Crear un error más descriptivo
      let errorMessage = 'Error al cargar agendamientos';
      
      if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor (500). Verifica los logs del servidor.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Error de autenticación. Verifica las credenciales.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Acceso denegado. Verifica los permisos.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  async saveAppointment(appointmentData) {
    try {
      console.log('💾 IdentificaAPI.saveAppointment - Guardando agendamiento:', appointmentData);
      
      if (!this.settings) {
        await this.initialize();
      }

      const url = this.buildUrl('services/scheduler/save.php', false);
      const headers = await this.getAuthHeaders();
      
      // Preparar el payload
      const payload = {
        numero_contenedor: appointmentData.numeroContenedor,
        rut_usuario: appointmentData.rutUsuario || appointmentData.rut_usuario,
        nombre_conductor: appointmentData.nombreConductor,
        apellido_conductor: appointmentData.apellidoConductor,
        patente_vehiculo: appointmentData.patenteVehiculo,
        fecha_asignacion: appointmentData.fechaAsignacion instanceof Date 
          ? appointmentData.fechaAsignacion.toISOString().split('T')[0] 
          : appointmentData.fechaAsignacion,
        status: appointmentData.status || 'Pendiente'
      };

      // Incluir ID si es una actualización
      if (appointmentData.id) {
        payload.id = appointmentData.id;
      }
      
      console.log('🌐 URL:', url);
      console.log('📦 Payload enviado:', payload);
      
      const response = await axios.post(url, payload, { 
        headers,
        timeout: 10000
      });
      
      console.log('📥 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      const result = await this.handleResponse(response);
      
      console.log('✅ Agendamiento guardado:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en saveAppointment:');
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response data:', error.response.data);
        console.error('- Response headers:', error.response.headers);
      }
      
      // Crear un error más descriptivo
      let errorMessage = 'Error al guardar agendamiento';
      
      if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor (500). Verifica los logs del servidor.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Error de autenticación. Verifica las credenciales.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Acceso denegado. Verifica los permisos.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  // User lookup by RUT
  async getUserByRut(rut) {
    try {
      console.log('🔍 IdentificaAPI.getUserByRut - Buscando usuario por RUT:', rut);
      
      if (!this.settings) {
        await this.initialize();
      }

      const url = this.buildUrl('services/scheduler/getUserByRut.php', false);
      const headers = await this.getAuthHeaders();
      
      const payload = {
        rut: rut
      };
      
      console.log('🌐 URL:', url);
      console.log('📦 Payload enviado:', payload);
      
      const response = await axios.post(url, payload, { 
        headers,
        timeout: 5000 // 5 segundos de timeout para búsquedas rápidas
      });
      
      console.log('📥 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      const result = await this.handleResponse(response);
      
      console.log('✅ Búsqueda de usuario completada:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en getUserByRut:');
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response data:', error.response.data);
        console.error('- Response headers:', error.response.headers);
      }
      
      // Crear un error más descriptivo
      let errorMessage = 'Error al buscar usuario por RUT';
      
      if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor (500). Verifica los logs del servidor.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Error de autenticación. Verifica las credenciales.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Acceso denegado. Verifica los permisos.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }
}

// Export a singleton instance
const api = new IdentificaAPI();
export default api;
