import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';

import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import api from '../api/IdentificaAPI';

const MarcacionesScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [eventStats, setEventStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
    sortDirection: 'desc', // 'asc' or 'desc'
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState(new Date());

  // Configuración de paginación
  const PAGE_SIZE = 10; // Cambiado de 5 a 10

  // Helper function to build date filter parameters
  const getDateFilterParams = () => {
    if (!dateFilter.startDate && !dateFilter.endDate) {
      return null;
    }
    
    const filter = {};
    if (dateFilter.startDate) {
      filter.start_date = formatDateForAPI(dateFilter.startDate);
    }
    if (dateFilter.endDate) {
      filter.end_date = formatDateForAPI(dateFilter.endDate);
    }
    
    return filter;
  };

  // Helper function to format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // Helper function to format date for display
  const formatDateForDisplay = (date) => {
    if (!date) return 'Seleccionar fecha';
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Date picker functions (copied from CreateUserModal)
  const formatDateForPicker = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleOpenStartDatePicker = () => {
    if (dateFilter.startDate) {
      setSelectedStartDate(dateFilter.startDate);
    }
    setShowStartDatePicker(true);
  };

  const handleOpenEndDatePicker = () => {
    if (dateFilter.endDate) {
      setSelectedEndDate(dateFilter.endDate);
    }
    setShowEndDatePicker(true);
  };

  const handleStartDateSelection = (date) => {
    setSelectedStartDate(date);
    if (Platform.OS === 'web') {
      setDateFilter(prev => ({ ...prev, startDate: date }));
      setShowStartDatePicker(false);
    }
  };

  const handleEndDateSelection = (date) => {
    setSelectedEndDate(date);
    if (Platform.OS === 'web') {
      setDateFilter(prev => ({ ...prev, endDate: date }));
      setShowEndDatePicker(false);
    }
  };

  const handleConfirmStartDate = () => {
    setDateFilter(prev => ({ ...prev, startDate: selectedStartDate }));
    setShowStartDatePicker(false);
  };

  const handleConfirmEndDate = () => {
    setDateFilter(prev => ({ ...prev, endDate: selectedEndDate }));
    setShowEndDatePicker(false);
  };

  // Apply date filter
  const applyDateFilter = () => {
    setEvents([]);
    setCurrentPage(1);
    loadEvents(1, false);
    setShowDateFilter(false);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateFilter({
      startDate: null,
      endDate: null,
      sortDirection: 'desc',
    });
    setEvents([]);
    setCurrentPage(1);
    loadEvents(1, false);
    setShowDateFilter(false);
  };

  const loadEvents = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      console.log('📅 Marcaciones: Cargando eventos... Página:', page);
      
      // Preparar parámetros según el formato esperado
      const params = {
        page: page,
        size: PAGE_SIZE,
        direction: dateFilter.sortDirection, // Usar la dirección del filtro
        column: "created",
        filter: getDateFilterParams()
      };
      
      console.log('📅 Parámetros enviados:', params);
      
      const result = await api.getEvents(params);
      
      // Handle different response formats
      let eventsData = [];
      let total = 0;
      
      if (result && result.data) {
        eventsData = result.data;
        total = result.total || result.data.length;
      } else if (Array.isArray(result)) {
        eventsData = result;
        total = result.length;
      }
      
      // Convertir array de arrays a objetos más manejables
      const formattedEvents = eventsData.map(event => {
        if (Array.isArray(event)) {
          // Formato: ["501","13878116-K","SAMUEL ENRIQUE PIZARRO SILVA","19","f82f428b-9ca2-49ce-b921-41254e6fd325","1","peleador","enter","2025-06-12 10:28:03","Lote A","0","0","Chileno","","ZU3445","Bodega Valparaíso"]
          return {
            id: event[0],
            doc_id: event[1],
            full_name: event[2],
            user_id: event[3],
            uuid: event[4],
            location_id: event[5],
            role: event[6],
            event_type: event[7],
            created_at: event[8],
            location: event[9],
            lat: event[10],
            lng: event[11],
            nationality: event[12],
            notes: event[13],
            plate: event[14],
            location_name: event[15]
          };
        }
        return event;
      });
      
      if (append) {
        setEvents(prevEvents => [...prevEvents, ...formattedEvents]);
      } else {
        setEvents(formattedEvents);
        setCurrentPage(1);
      }
      
      setTotalEvents(total);
      
      // Solo calcular stats con los primeros datos
      if (page === 1) {
        calculateStats(formattedEvents, total);
      }
      
      console.log('📅 Marcaciones: Eventos cargados:', formattedEvents.length, 'Total:', total);
    } catch (error) {
      console.error('❌ Marcaciones: Error cargando eventos:', error);
      Alert.alert('Error', 'Error al cargar las marcaciones: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMoreEvents = useCallback(async () => {
    if (loadingMore || events.length >= totalEvents) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadEvents(nextPage, true);
  }, [currentPage, loadingMore, events.length, totalEvents, loadEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const calculateStats = (eventsData, total) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total: total || eventsData.length,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    };

    eventsData.forEach(event => {
      // Usar created_at que viene en el formato de respuesta
      const eventDate = new Date(event.created_at || event.timestamp || event.date);
      
      if (eventDate >= today) {
        stats.today++;
      }
      if (eventDate >= weekStart) {
        stats.thisWeek++;
      }
      if (eventDate >= monthStart) {
        stats.thisMonth++;
      }
    });

    setEventStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setEvents([]); // Limpiar eventos actuales
    await loadEvents(1, false); // Cargar desde la primera página
    setRefreshing(false);
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Animatable.View animation="fadeInUp" style={{
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginHorizontal: spacing.xs,
      marginBottom: spacing.sm,
      ...shadows.md,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.xs,
          }}>
            {title}
          </Text>
          <Text style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}>
            {value}
          </Text>
        </View>
        <View style={{
          backgroundColor: color + '20',
          borderRadius: borderRadius.full,
          padding: spacing.md,
        }}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
      </View>
    </Animatable.View>
  );

  const DateFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showDateFilter}
      onRequestClose={() => setShowDateFilter(false)}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}>
        <View style={{
          width: '90%',
          maxWidth: 400,
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.xl,
          ...shadows.lg,
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.lg,
          }}>
            <Text style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}>
              Filtrar por Fecha
            </Text>
            <TouchableOpacity
              onPress={() => setShowDateFilter(false)}
              style={{
                backgroundColor: colors.background.light,
                borderRadius: borderRadius.full,
                padding: spacing.sm,
              }}
            >
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Sort Direction */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              marginBottom: spacing.sm,
            }}>
              Ordenar por Fecha
            </Text>
            <View style={{
              flexDirection: 'row',
              backgroundColor: colors.background.light,
              borderRadius: borderRadius.lg,
              padding: spacing.xs,
            }}>
              <TouchableOpacity
                onPress={() => setDateFilter(prev => ({ ...prev, sortDirection: 'desc' }))}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: dateFilter.sortDirection === 'desc' ? colors.primary.purple : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: dateFilter.sortDirection === 'desc' ? colors.white : colors.text.secondary,
                }}>
                  Más Reciente
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDateFilter(prev => ({ ...prev, sortDirection: 'asc' }))}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: dateFilter.sortDirection === 'asc' ? colors.primary.purple : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: dateFilter.sortDirection === 'asc' ? colors.white : colors.text.secondary,
                }}>
                  Más Antiguo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Date Filters */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              marginBottom: spacing.sm,
            }}>
              Filtros Rápidos
            </Text>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.xs,
              marginBottom: spacing.md,
            }}>
              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  setDateFilter(prev => ({ ...prev, startDate: today, endDate: today }));
                }}
                style={{
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                }}
              >
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  Hoy
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
                  setDateFilter(prev => ({ ...prev, startDate: weekStart, endDate: today }));
                }}
                style={{
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                }}
              >
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  Esta Semana
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  setDateFilter(prev => ({ ...prev, startDate: monthStart, endDate: today }));
                }}
                style={{
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                }}
              >
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  Este Mes
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Range */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              marginBottom: spacing.sm,
            }}>
              Selección Manual de Fechas
            </Text>
            
            <View style={{ marginBottom: spacing.md }}>
              <Text style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                marginBottom: spacing.xs,
              }}>
                Fecha Inicio
              </Text>
              <TouchableOpacity
                onPress={handleOpenStartDatePicker}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors.white,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: dateFilter.startDate ? colors.text.primary : colors.text.secondary,
                }}>
                  {formatDateForDisplay(dateFilter.startDate)}
                </Text>
                <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                marginBottom: spacing.xs,
              }}>
                Fecha Fin
              </Text>
              <TouchableOpacity
                onPress={handleOpenEndDatePicker}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors.white,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: dateFilter.endDate ? colors.text.primary : colors.text.secondary,
                }}>
                  {formatDateForDisplay(dateFilter.endDate)}
                </Text>
                <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: spacing.md,
          }}>
            <TouchableOpacity
              onPress={clearDateFilter}
              style={{
                flex: 1,
                backgroundColor: colors.background.light,
                borderRadius: borderRadius.lg,
                paddingVertical: spacing.md,
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.secondary,
              }}>
                Limpiar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={applyDateFilter}
              style={{
                flex: 1,
                backgroundColor: colors.primary.purple,
                borderRadius: borderRadius.lg,
                paddingVertical: spacing.md,
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.white,
              }}>
                Aplicar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const formatEventType = (eventType) => {
    const types = {
      'enter': 'Entrada',
      'exit': 'Salida',
      'access': 'Acceso',
      'denied': 'Denegado',
      'none': 'Sin especificar',
    };
    return types[eventType] || eventType || 'Desconocido';
  };

  const getEventTypeColor = (eventType) => {
    const colors_map = {
      'enter': colors.success,
      'exit': colors.extended.blue,
      'access': colors.primary.green,
      'denied': colors.error,
      'none': colors.text.secondary,
    };
    return colors_map[eventType] || colors.text.secondary;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString || 'Fecha inválida';
    }
  };

  const UserAvatarForEvent = ({ event }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
      const loadUserAndImage = async () => {
        try {
          // Primero obtener la lista de usuarios para encontrar pub_id
          const result = await api.getUsers();
          if (result.success && result.users) {
            // Buscar el usuario por doc_id
            const user = result.users.find(u => u.doc_id === event.doc_id);
            if (user && user.id && user.pub_id) {
              // Ahora obtener la imagen
              const imageResult = await api.getUserPicture(user.id, user.pub_id);
              if (imageResult.success) {
                setImageUrl(imageResult.imageUrl);
                setAuthToken(imageResult.token);
              } else {
                setImageError(true);
              }
            } else {
              setImageError(true);
            }
          } else {
            setImageError(true);
          }
        } catch (error) {
          console.log('Error loading user image for event:', error);
          setImageError(true);
        }
      };

      if (event.doc_id) {
        loadUserAndImage();
      } else {
        setImageError(true);
      }
    }, [event.doc_id]);

    const handleImagePress = () => {
      if (imageUrl && !imageError) {
        setSelectedImage({
          uri: imageUrl,
          user: {
            full_name: event.full_name,
            doc_id: event.doc_id,
            role: event.role,
          },
          token: authToken
        });
        setImageModalVisible(true);
      }
    };

    if (imageError || !imageUrl) {
      // Fallback to icon avatar
      return (
        <View style={{
          backgroundColor: getEventTypeColor(event.event_type) + '20',
          borderRadius: borderRadius.full,
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons name="person" size={18} color={getEventTypeColor(event.event_type)} />
        </View>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={(e) => {
          e.stopPropagation();
          handleImagePress();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: 40,
          height: 40,
          borderRadius: borderRadius.full,
          borderWidth: isHovered ? 2 : 0,
          borderColor: isHovered ? getEventTypeColor(event.event_type) : 'transparent',
          padding: isHovered ? 0 : 1,
          transform: [{ scale: isHovered ? 1.05 : 1 }],
          transition: 'all 0.2s ease',
        }}
      >
        <Image
          source={{
            uri: imageUrl,
            headers: authToken ? {
              'Authorization': `Bearer ${authToken}`,
            } : undefined
          }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: borderRadius.full,
            backgroundColor: colors.background.light,
          }}
          onLoad={() => setImageLoaded(true)}
          onError={(error) => {
            console.log('Image failed to load for event user:', event.doc_id, error.nativeEvent.error);
            setImageError(true);
          }}
        />
        {!imageLoaded && !imageError && (
          <View style={{
            position: 'absolute',
            top: isHovered ? 1 : 0,
            left: isHovered ? 1 : 0,
            right: isHovered ? 1 : 0,
            bottom: isHovered ? 1 : 0,
            backgroundColor: getEventTypeColor(event.event_type) + '20',
            borderRadius: borderRadius.full,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Ionicons name="person" size={18} color={getEventTypeColor(event.event_type)} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const EventCard = ({ item }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          // Handle event details if needed
          console.log('Evento seleccionado:', item);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          flex: 1,
          maxWidth: '48%',
          margin: spacing.xs,
        }}
      >
        <View style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          minHeight: 220,
          transform: [{ scale: isHovered ? 1.02 : 1 }],
          ...shadows.md,
          ...(isHovered && {
            ...shadows.lg,
            borderWidth: 2,
            borderColor: colors.primary.purple + '20',
          }),
          transition: 'all 0.2s ease-in-out',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Event Type Badge */}
            <View style={{
              backgroundColor: getEventTypeColor(item.event_type || item.type) + '20',
              borderColor: getEventTypeColor(item.event_type || item.type) + '40',
              borderWidth: 1,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.lg,
              marginBottom: spacing.sm,
            }}>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: getEventTypeColor(item.event_type || item.type),
                fontWeight: typography.fontWeight.medium,
              }}>
                {formatEventType(item.event_type || item.type)}
              </Text>
            </View>

            {/* Date */}
            <Text style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.medium,
            }}>
              {formatDate(item.created_at || item.timestamp || item.date)}
            </Text>
          </View>

          {/* User Info */}
          <View style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              {/* User Avatar */}
              <UserAvatarForEvent event={item} />
              
              {/* User Name and Details */}
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                }} numberOfLines={1}>
                  {item.full_name || 'Usuario desconocido'}
                </Text>
                
                {item.doc_id && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs / 2 }}>
                    <Ionicons name="card-outline" size={12} color={colors.text.secondary} />
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      marginLeft: spacing.xs,
                    }} numberOfLines={1}>
                      {item.doc_id}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <Ionicons name="location-outline" size={12} color={colors.text.secondary} />
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              marginLeft: spacing.xs,
            }} numberOfLines={1}>
              {item.location_name || item.location || 'Sin ubicación'}
            </Text>
          </View>

          {/* Additional Info */}
          {(item.role || item.nationality || item.plate) && (
            <View style={{ 
              backgroundColor: colors.background.light,
              borderRadius: borderRadius.md,
              padding: spacing.sm,
              marginTop: spacing.sm,
            }}>
              {item.role && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs / 2 }}>
                  <Ionicons name="person-circle-outline" size={12} color={colors.text.secondary} />
                  <Text style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    marginLeft: spacing.xs,
                  }} numberOfLines={1}>
                    {item.role}
                  </Text>
                </View>
              )}
              {item.nationality && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs / 2 }}>
                  <Ionicons name="flag-outline" size={12} color={colors.text.secondary} />
                  <Text style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    marginLeft: spacing.xs,
                  }} numberOfLines={1}>
                    {item.nationality}
                  </Text>
                </View>
              )}
              {item.plate && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="car-outline" size={12} color={colors.text.secondary} />
                  <Text style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    marginLeft: spacing.xs,
                  }} numberOfLines={1}>
                    {item.plate}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={{ 
        paddingVertical: spacing.lg, 
        alignItems: 'center',
        width: '100%',
      }}>
        <ActivityIndicator size="small" color={colors.primary.purple} />
        <Text style={{
          marginTop: spacing.sm,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
        }}>
          Cargando más eventos...
        </Text>
      </View>
    );
  };

  const canLoadMore = events.length < totalEvents && !loadingMore;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradients.purple}
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              style={{
                backgroundColor: colors.white + '20',
                borderRadius: borderRadius.full,
                padding: spacing.sm,
                marginRight: spacing.md,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.white} />
            </TouchableOpacity>
            
            <View>
              <Text style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.white,
              }}>
                Marcaciones
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.white,
                opacity: 0.9,
              }}>
                Registro de eventos del sistema
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => setShowDateFilter(true)}
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="filter" size={20} color={colors.primary.purple} />
              <Text style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.primary.purple,
                marginLeft: spacing.xs,
              }}>
                Filtrar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onRefresh}
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="refresh" size={20} color={colors.primary.purple} />
              <Text style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.primary.purple,
                marginLeft: spacing.xs,
              }}>
                Actualizar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Statistics Cards */}
      <View style={{
        paddingHorizontal: spacing.md,
        marginTop: -spacing.md,
        marginBottom: spacing.lg,
      }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <StatCard
            title="Total Eventos"
            value={eventStats.total}
            icon="calendar-outline"
            color={colors.primary.purple}
          />
          <StatCard
            title="Hoy"
            value={eventStats.today}
            icon="today-outline"
            color={colors.primary.green}
          />
        </View>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <StatCard
            title="Esta Semana"
            value={eventStats.thisWeek}
            icon="calendar-clear-outline"
            color={colors.extended.blue}
          />
          <StatCard
            title="Este Mes"
            value={eventStats.thisMonth}
            icon="calendar-number-outline"
            color={colors.extended.greenBright}
          />
        </View>
      </View>

      {/* Events List */}
      <View style={{ flex: 1 }}>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.md,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}>
              Eventos Recientes
            </Text>
            {(dateFilter.startDate || dateFilter.endDate || dateFilter.sortDirection !== 'desc') && (
              <View style={{
                backgroundColor: colors.primary.purple + '20',
                borderRadius: borderRadius.lg,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                marginLeft: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Ionicons name="filter" size={12} color={colors.primary.purple} />
                <Text style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.primary.purple,
                  fontWeight: typography.fontWeight.medium,
                  marginLeft: spacing.xs,
                }}>
                  Filtrado
                </Text>
              </View>
            )}
          </View>
          <View style={{
            backgroundColor: colors.primary.purple + '10',
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
          }}>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.primary.purple,
              fontWeight: typography.fontWeight.medium,
            }}>
              {events.length} de {totalEvents} eventos
            </Text>
          </View>
        </View>

        <FlatList
          data={events}
          keyExtractor={(item, index) => `event-${item.id || index}-${item.created_at || Math.random()}`}
          renderItem={({ item }) => <EventCard item={item} />}
          numColumns={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={canLoadMore ? loadMoreEvents : null}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          columnWrapperStyle={{
            justifyContent: 'space-between',
          }}
          contentContainerStyle={{ 
            paddingBottom: spacing.xl,
            paddingHorizontal: spacing.sm,
          }}
          ListEmptyComponent={() => (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: spacing['3xl'],
              width: '100%',
            }}>
              <View style={{
                backgroundColor: colors.background.light,
                borderRadius: borderRadius.full,
                padding: spacing.xl,
                marginBottom: spacing.lg,
              }}>
                <Ionicons name="calendar-outline" size={64} color={colors.text.secondary} />
              </View>
              <Text style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.xs,
                textAlign: 'center',
              }}>
                {loading ? 'Cargando marcaciones...' : 'No hay marcaciones'}
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                textAlign: 'center',
              }}>
                {loading ? 'Por favor espera un momento' : 'No se encontraron eventos en el sistema'}
              </Text>
            </View>
          )}
        />
      </View>
      
      {/* Image Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => {
          setImageModalVisible(false);
          setSelectedImage(null);
        }}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 60,
              right: 20,
              backgroundColor: colors.white + '20',
              borderRadius: borderRadius.full,
              padding: spacing.md,
              zIndex: 1,
            }}
            onPress={() => {
              setImageModalVisible(false);
              setSelectedImage(null);
            }}
          >
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          
          {selectedImage && (
            <View style={{ alignItems: 'center' }}>
              <Image
                source={{
                  uri: selectedImage.uri,
                  headers: selectedImage.token ? {
                    'Authorization': `Bearer ${selectedImage.token}`,
                  } : undefined
                }}
                style={{
                  width: Math.min(350, Dimensions.get('window').width * 0.8),
                  height: Math.min(350, Dimensions.get('window').width * 0.8),
                  borderRadius: borderRadius.xl,
                  backgroundColor: colors.background.light,
                }}
                resizeMode="cover"
              />
              
              {/* User info overlay */}
              <View style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.xl,
                padding: spacing.lg,
                marginTop: spacing.lg,
                alignItems: 'center',
                minWidth: 250,
                ...shadows.lg,
              }}>
                <Text style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  marginBottom: spacing.xs,
                  textAlign: 'center',
                }}>
                  {selectedImage.user.full_name}
                </Text>
                
                <View style={{
                  backgroundColor: getEventTypeColor(selectedImage.user.role) + '20',
                  borderColor: getEventTypeColor(selectedImage.user.role) + '40',
                  borderWidth: 1,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.lg,
                  marginBottom: spacing.sm,
                }}>
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: getEventTypeColor(selectedImage.user.role),
                    fontWeight: typography.fontWeight.medium,
                  }}>
                    Rol: {selectedImage.user.role}
                  </Text>
                </View>
                
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: spacing.xs,
                }}>
                  <Ionicons name="card-outline" size={16} color={colors.text.secondary} />
                  <Text style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                    marginLeft: spacing.xs,
                    fontWeight: typography.fontWeight.medium,
                  }}>
                    {selectedImage.user.doc_id}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
      
      {/* Date Filter Modal */}
      <DateFilterModal />
      
      {/* Start Date Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showStartDatePicker}
        onRequestClose={() => setShowStartDatePicker(false)}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          elevation: 9999,
        }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
            width: '90%',
            maxWidth: 400,
            ...shadows.lg,
            zIndex: 10000,
            elevation: 10000,
          }}>
            <View style={{ padding: spacing.lg }}>
              {Platform.OS === 'web' ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.secondary,
                    marginBottom: spacing.lg,
                    textAlign: 'center',
                  }}>
                    Selecciona la fecha de inicio
                  </Text>
                  
                  <input
                    type="date"
                    value={selectedStartDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      handleStartDateSelection(newDate);
                    }}
                    style={{
                      fontSize: '16px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #ccc',
                      width: '200px',
                    }}
                  />
                </View>
              ) : (
                <View>
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.secondary,
                    marginBottom: spacing.lg,
                    textAlign: 'center',
                  }}>
                    Selecciona la fecha de inicio
                  </Text>
                  
                  {/* Selector de año */}
                  <View style={{ marginBottom: spacing.md }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                      marginBottom: spacing.sm,
                    }}>
                      Año
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedStartDate);
                          newDate.setFullYear(selectedStartDate.getFullYear() - 1);
                          setSelectedStartDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.background.light,
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                      
                      <Text style={{
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary,
                        marginHorizontal: spacing.lg,
                        minWidth: 80,
                        textAlign: 'center',
                      }}>
                        {selectedStartDate.getFullYear()}
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedStartDate);
                          newDate.setFullYear(selectedStartDate.getFullYear() + 1);
                          setSelectedStartDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.background.light,
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Selector de mes */}
                  <View style={{ marginBottom: spacing.md }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                      marginBottom: spacing.sm,
                    }}>
                      Mes
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedStartDate);
                          newDate.setMonth(selectedStartDate.getMonth() - 1);
                          setSelectedStartDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.background.light,
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                      
                      <Text style={{
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary,
                        marginHorizontal: spacing.lg,
                        minWidth: 120,
                        textAlign: 'center',
                      }}>
                        {selectedStartDate.toLocaleDateString('es-ES', { month: 'long' })}
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedStartDate);
                          newDate.setMonth(selectedStartDate.getMonth() + 1);
                          setSelectedStartDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.background.light,
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Selector de día */}
                  <View style={{ marginBottom: spacing.lg }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                      marginBottom: spacing.sm,
                    }}>
                      Día
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedStartDate);
                          newDate.setDate(selectedStartDate.getDate() - 1);
                          setSelectedStartDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.background.light,
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                      
                      <Text style={{
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary,
                        marginHorizontal: spacing.lg,
                        minWidth: 60,
                        textAlign: 'center',
                      }}>
                        {selectedStartDate.getDate()}
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedStartDate);
                          newDate.setDate(selectedStartDate.getDate() + 1);
                          setSelectedStartDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.background.light,
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{
                    backgroundColor: colors.primary.purple + '10',
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    marginBottom: spacing.lg,
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.primary.purple,
                      fontWeight: typography.fontWeight.medium,
                    }}>
                      Fecha seleccionada: {formatDateForPicker(selectedStartDate)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Botones */}
              {Platform.OS !== 'web' && (
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: spacing.md,
                }}>
                  <TouchableOpacity
                    onPress={() => setShowStartDatePicker(false)}
                    style={{
                      flex: 1,
                      backgroundColor: colors.background.light,
                      borderRadius: borderRadius.lg,
                      paddingVertical: spacing.md,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.secondary,
                    }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmStartDate}
                    style={{
                      flex: 1,
                      backgroundColor: colors.primary.purple,
                      borderRadius: borderRadius.lg,
                      paddingVertical: spacing.md,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.white,
                    }}>
                      Confirmar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* End Date Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEndDatePicker}
        onRequestClose={() => setShowEndDatePicker(false)}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          elevation: 9999,
        }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
            width: '90%',
            maxWidth: 400,
            ...shadows.lg,
            zIndex: 10000,
            elevation: 10000,
          }}>
            <View style={{ padding: spacing.lg }}>
              {Platform.OS === 'web' ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.secondary,
                    marginBottom: spacing.lg,
                    textAlign: 'center',
                  }}>
                    Selecciona la fecha de fin
                  </Text>
                  
                  <input
                    type="date"
                    value={selectedEndDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      handleEndDateSelection(newDate);
                    }}
                    style={{
                      fontSize: '16px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #ccc',
                      width: '200px',
                    }}
                  />
                </View>
              ) : (
                <View>
                  <Text style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.secondary,
                    marginBottom: spacing.lg,
                    textAlign: 'center',
                  }}>
                    Selecciona la fecha de fin
                  </Text>
                  
                  {/* Selector de año */}
                  <View style={{ marginBottom: spacing.md }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                      marginBottom: spacing.sm,
                    }}>
                      Año
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedEndDate);
                          newDate.setFullYear(selectedEndDate.getFullYear() - 1);
                          setSelectedEndDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.background.light,
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                      
                      <Text style={{
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary,
                        marginHorizontal: spacing.lg,
                        minWidth: 80,
                        textAlign: 'center',
                      }}>
                        {selectedEndDate.getFullYear()}
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedEndDate);
                          newDate.setFullYear(selectedEndDate.getFullYear() + 1);
                          setSelectedEndDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.background.light,
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Selector de mes */}
                  <View style={{ marginBottom: spacing.md }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                      marginBottom: spacing.sm,
                    }}>
                      Mes
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedEndDate);
                          newDate.setMonth(selectedEndDate.getMonth() - 1);
                          setSelectedEndDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.background.light,
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                      
                      <Text style={{
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary,
                        marginHorizontal: spacing.lg,
                        minWidth: 120,
                        textAlign: 'center',
                      }}>
                        {selectedEndDate.toLocaleDateString('es-ES', { month: 'long' })}
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedEndDate);
                          newDate.setMonth(selectedEndDate.getMonth() + 1);
                          setSelectedEndDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.background.light,
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Selector de día */}
                  <View style={{ marginBottom: spacing.lg }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                      marginBottom: spacing.sm,
                    }}>
                      Día
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedEndDate);
                          newDate.setDate(selectedEndDate.getDate() - 1);
                          setSelectedEndDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.background.light,
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                      
                      <Text style={{
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary,
                        marginHorizontal: spacing.lg,
                        minWidth: 60,
                        textAlign: 'center',
                      }}>
                        {selectedEndDate.getDate()}
                      </Text>
                      
                      <TouchableOpacity
                        onPress={() => {
                          const newDate = new Date(selectedEndDate);
                          newDate.setDate(selectedEndDate.getDate() + 1);
                          setSelectedEndDate(newDate);
                        }}
                        style={{
                          backgroundColor: colors.background.light,
                          borderRadius: borderRadius.full,
                          padding: spacing.sm,
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{
                    backgroundColor: colors.primary.purple + '10',
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    marginBottom: spacing.lg,
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.primary.purple,
                      fontWeight: typography.fontWeight.medium,
                    }}>
                      Fecha seleccionada: {formatDateForPicker(selectedEndDate)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Botones */}
              {Platform.OS !== 'web' && (
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: spacing.md,
                }}>
                  <TouchableOpacity
                    onPress={() => setShowEndDatePicker(false)}
                    style={{
                      flex: 1,
                      backgroundColor: colors.background.light,
                      borderRadius: borderRadius.lg,
                      paddingVertical: spacing.md,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.secondary,
                    }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmEndDate}
                    style={{
                      flex: 1,
                      backgroundColor: colors.primary.purple,
                      borderRadius: borderRadius.lg,
                      paddingVertical: spacing.md,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.white,
                    }}>
                      Confirmar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MarcacionesScreen;