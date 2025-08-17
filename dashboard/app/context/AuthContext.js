import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserData, getToken, clearUserData, removeToken } from '../utils/storage';
import api from '../api/IdentificaAPI';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Check if user is authenticated on app start
  useEffect(() => {
    console.log('🔍 AuthProvider: Iniciando verificación de autenticación...');
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 AuthProvider: Verificando estado de autenticación...');
      setIsLoading(true);
      
      // Get stored token and user data
      const storedToken = await getToken();
      const storedUser = await getUserData();
      
      console.log('🔍 AuthProvider: Datos almacenados:', {
        hasToken: !!storedToken,
        hasUser: !!storedUser,
        username: storedUser?.username || 'null'
      });
      
      if (storedToken && storedUser) {
        console.log('✅ AuthProvider: Sesión válida encontrada, autenticando directamente...');
        
        // No hacer validación de token aquí para evitar logout prematuro
        // Si el token está almacenado, asumir que es válido
        // La validación se hará en las llamadas API cuando sea necesario
        
        // Initialize API with stored data
        try {
          await api.initialize();
          console.log('✅ AuthProvider: API inicializada correctamente');
        } catch (apiError) {
          console.log('⚠️ AuthProvider: Error inicializando API, pero manteniendo sesión:', apiError.message);
          // No limpiar sesión por error de API
        }
        
        // Set authentication state
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);
        
        console.log('✅ AuthProvider: Usuario autenticado exitosamente:', storedUser.username);
      } else {
        console.log('❌ AuthProvider: No hay sesión válida, requiere login');
        
        // No valid session found
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('❌ AuthProvider: Error verificando estado de auth:', error);
      // Solo limpiar estado local, NO forzar logout ni limpiar storage
      // El usuario puede tener una sesión válida pero hubo un error temporal
      console.log('⚠️ AuthProvider: Error temporal, verificando si hay datos almacenados...');
      
      try {
        // Intento de recuperación: verificar si hay datos almacenados
        const recoveryToken = await getToken();
        const recoveryUser = await getUserData();
        
        if (recoveryToken && recoveryUser) {
          console.log('🚑 AuthProvider: Recuperando sesión desde storage...');
          setToken(recoveryToken);
          setUser(recoveryUser);
          setIsAuthenticated(true);
        } else {
          console.log('❌ AuthProvider: No hay datos para recuperar');
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
        }
      } catch (recoveryError) {
        console.error('❌ AuthProvider: Error en recuperación:', recoveryError);
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } finally {
      setIsLoading(false);
      console.log('🔍 AuthProvider: Verificación completada');
    }
  };

  const login = async (username, password) => {
    try {
      console.log('🔐 AuthProvider: Intentando login para:', username);
      setIsLoading(true);
      
      // Initialize API first
      await api.initialize();
      
      // Attempt login
      const result = await api.login(username, password);
      
      if (result.success) {
        console.log('✅ AuthProvider: Login exitoso');
        setToken(result.token);
        setUser(result.user);
        setIsAuthenticated(true);
        
        return { success: true, user: result.user };
      } else {
        console.log('❌ AuthProvider: Login falló:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthProvider: Error en login:', error);
      return { success: false, error: 'Error de conexión' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 AuthProvider: Iniciando logout RÁPIDO...');
    
    // Limpiar INMEDIATAMENTE el estado para navegación instantánea
    console.log('⚡ AuthProvider: Limpiando estado inmediatamente...');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // NO usar setIsLoading para evitar demoras en UI
    
    try {
      // Limpiar storage en background sin bloquear
      console.log('🧨 AuthProvider: Limpiando storage en background...');
      await Promise.all([
        clearUserData(),
        removeToken()
      ]);
      
      console.log('✅ AuthProvider: Logout rápido completado');
      return { success: true };
    } catch (error) {
      console.error('❌ AuthProvider: Error en storage (no crítico):', error);
      // No importa si hay error en storage, el estado ya está limpio
      return { success: true }; // Considerar éxito porque el estado está limpio
    }
  };

  // Force logout without loading state (for cleanup)
  const forceLogout = async () => {
    try {
      console.log('🧹 AuthProvider: Forzando limpieza de sesión...');
      
      // Clear stored data
      await clearUserData();
      await removeToken();
      
      // Reset state
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      
      console.log('✅ AuthProvider: Limpieza forzada completada');
    } catch (error) {
      console.error('❌ AuthProvider: Error en limpieza forzada:', error);
    }
  };

  const refreshAuth = async () => {
    try {
      if (!token) {
        throw new Error('No token available');
      }
      
      console.log('🔄 AuthProvider: Refrescando autenticación...');
      
      // Try to refresh the token
      const result = await api.refreshToken();
      
      if (result.success) {
        console.log('✅ AuthProvider: Token refrescado exitosamente');
        setToken(result.token);
        setUser(result.user);
        return { success: true };
      } else {
        console.log('❌ AuthProvider: Fallo al refrescar token, cerrando sesión');
        // Refresh failed, logout user
        await logout();
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthProvider: Error refrescando auth:', error);
      await logout();
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    token,
    login,
    logout,
    forceLogout,
    refreshAuth,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
