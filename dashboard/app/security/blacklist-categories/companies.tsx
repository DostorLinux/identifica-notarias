import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { router } from 'expo-router';

import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';

const BlacklistCompaniesScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addCompanyModalVisible, setAddCompanyModalVisible] = useState(false);
  const [blacklistedCompanies, setBlacklistedCompanies] = useState([
    {
      id: '1',
      company_name: 'Constructora XYZ Ltda.',
      rut: '76.123.456-7',
      legal_representative: 'Carlos Mendoza',
      rep_doc_id: '15.678.901-2',
      email: 'contacto@constructoraxyz.cl',
      phone: '+56 9 8765 4321',
      address: 'Av. Los Leones 1234, Las Condes',
      reason: 'Incumplimiento de contratos de servicios',
      blocked_date: '2024-01-15',
      blocked_by: 'Admin Sistema',
      status: 'active'
    },
    {
      id: '2',
      company_name: 'Servicios ABC S.A.',
      rut: '96.789.012-3',
      legal_representative: 'Ana Torres',
      rep_doc_id: '12.345.678-9',
      email: 'info@serviciosabc.cl',
      phone: '+56 2 2345 6789',
      address: 'Calle Principal 567, Santiago Centro',
      reason: 'Problemas de facturación y pagos',
      blocked_date: '2024-01-10',
      blocked_by: 'Supervisor Comercial',
      status: 'active'
    },
    {
      id: '3',
      company_name: 'Transportes DEF SpA',
      rut: '77.456.789-0',
      legal_representative: 'Roberto Silva',
      rep_doc_id: '98.765.432-1',
      email: 'gerencia@transportesdef.cl',
      phone: '+56 9 1234 5678',
      address: 'Ruta 68 Km 15, Pudahuel',
      reason: 'Infracciones de seguridad en transporte',
      blocked_date: '2024-01-08',
      blocked_by: 'Admin Sistema',
      status: 'pending_review'
    }
  ]);
  const [stats, setStats] = useState({
    totalBlocked: 0,
    activeBlocks: 0,
    pendingReview: 0,
    recentBlocks: 0,
  });

  useEffect(() => {
    loadBlacklistCompanies();
    calculateStats();
  }, [blacklistedCompanies]);

  const loadBlacklistCompanies = async () => {
    try {
      console.log('🏢 Loading blacklisted companies...');
      // TODO: Implementar llamada a la API
      // const result = await api.getBlacklistedCompanies();
      // setBlacklistedCompanies(result.companies);
    } catch (error) {
      console.error('❌ Error loading blacklisted companies:', error);
    }
  };

  const calculateStats = () => {
    const stats = {
      totalBlocked: blacklistedCompanies.length,
      activeBlocks: blacklistedCompanies.filter(c => c.status === 'active').length,
      pendingReview: blacklistedCompanies.filter(c => c.status === 'pending_review').length,
      recentBlocks: blacklistedCompanies.filter(c => {
        const blockDate = new Date(c.blocked_date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return blockDate >= weekAgo;
      }).length,
    };
    setStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBlacklistCompanies();
    setRefreshing(false);
  };

  const filteredCompanies = blacklistedCompanies.filter(company =>
    company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.rut.includes(searchQuery) ||
    company.legal_representative.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatCard = ({ title, value, icon, color, library }) => (
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
          {library === 'MCI' ? (
            <MaterialCommunityIcons name={icon} size={20} color={color} />
          ) : (
            <Ionicons name={icon} size={20} color={color} />
          )}
        </View>
      </View>
    </Animatable.View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return colors.error;
      case 'pending_review': return colors.warning;
      default: return colors.text.secondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'pending_review': return 'En Revisión';
      default: return status;
    }
  };

  const BlacklistedCompanyCard = ({ item }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const handleRemoveFromBlacklist = () => {
      Alert.alert(
        'Remover de Lista Negra',
        `¿Estás seguro que deseas remover a ${item.company_name} de la lista negra?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Remover', 
            style: 'destructive', 
            onPress: () => {
              // TODO: Implementar llamada a la API
              setBlacklistedCompanies(prev => prev.filter(c => c.id !== item.id));
              Alert.alert('Éxito', 'Empresa removida de la lista negra');
            }
          },
        ]
      );
    };

    const handleViewDetails = () => {
      Alert.alert(
        'Detalles de la Empresa',
        `Razón Social: ${item.company_name}\nRUT: ${item.rut}\nRepresentante Legal: ${item.legal_representative}\nRUT Rep.: ${item.rep_doc_id}\nEmail: ${item.email}\nTeléfono: ${item.phone}\nDirección: ${item.address}\nMotivo: ${item.reason}\nFecha de bloqueo: ${item.blocked_date}\nBloqueado por: ${item.blocked_by}`,
        [{ text: 'OK' }]
      );
    };

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleViewDetails}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          marginBottom: spacing.md,
          transform: [{ scale: isHovered ? 1.02 : 1 }],
          ...shadows.md,
          ...(isHovered && {
            ...shadows.lg,
            borderWidth: 2,
            borderColor: colors.error + '20',
          }),
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            {/* Header with company name and status */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                flex: 1,
                marginRight: spacing.sm,
              }} numberOfLines={2}>
                {item.company_name}
              </Text>
              
              <View style={{
                backgroundColor: getStatusColor(item.status) + '20',
                borderColor: getStatusColor(item.status),
                borderWidth: 1,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.md,
              }}>
                <Text style={{
                  fontSize: typography.fontSize.xs,
                  color: getStatusColor(item.status),
                  fontWeight: typography.fontWeight.medium,
                }}>
                  {getStatusText(item.status)}
                </Text>
              </View>
            </View>

            {/* Company details */}
            <View style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <Ionicons name="business-outline" size={14} color={colors.text.secondary} />
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  marginLeft: spacing.xs,
                }}>
                  RUT: {item.rut}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <Ionicons name="person-outline" size={14} color={colors.text.secondary} />
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  marginLeft: spacing.xs,
                }}>
                  {item.legal_representative} - {item.rep_doc_id}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <Ionicons name="mail-outline" size={14} color={colors.text.secondary} />
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  marginLeft: spacing.xs,
                  flex: 1,
                }} numberOfLines={1}>
                  {item.email}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <Ionicons name="call-outline" size={14} color={colors.text.secondary} />
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  marginLeft: spacing.xs,
                }}>
                  {item.phone}
                </Text>
              </View>
            </View>

            {/* Reason and date */}
            <View style={{
              backgroundColor: colors.error + '10',
              borderRadius: borderRadius.md,
              padding: spacing.sm,
              marginBottom: spacing.sm,
            }}>
              <Text style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.error,
                marginBottom: spacing.xs,
              }}>
                Motivo del bloqueo:
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
              }}>
                {item.reason}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                flex: 1,
                marginRight: spacing.sm,
              }}>
                Bloqueado el {item.blocked_date} por {item.blocked_by}
              </Text>
              
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemoveFromBlacklist();
                }}
                style={{
                  backgroundColor: colors.success + '20',
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="checkmark" size={14} color={colors.success} />
                <Text style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.success,
                  marginLeft: spacing.xs,
                  fontWeight: typography.fontWeight.medium,
                }}>
                  Remover
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const AddCompanyModal = () => {
    const [newCompany, setNewCompany] = useState({
      company_name: '',
      rut: '',
      legal_representative: '',
      rep_doc_id: '',
      email: '',
      phone: '',
      address: '',
      reason: '',
    });

    const handleAddCompany = () => {
      if (!newCompany.company_name || !newCompany.rut || !newCompany.legal_representative || !newCompany.reason) {
        Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
        return;
      }

      const companyToAdd = {
        ...newCompany,
        id: Date.now().toString(),
        blocked_date: new Date().toISOString().split('T')[0],
        blocked_by: 'Usuario Actual', // TODO: Obtener del contexto de autenticación
        status: 'active'
      };

      setBlacklistedCompanies(prev => [...prev, companyToAdd]);
      setNewCompany({ company_name: '', rut: '', legal_representative: '', rep_doc_id: '', email: '', phone: '', address: '', reason: '' });
      setAddCompanyModalVisible(false);
      Alert.alert('Éxito', 'Empresa agregada a la lista negra');
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={addCompanyModalVisible}
        onRequestClose={() => setAddCompanyModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        }}>
          <ScrollView style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            width: '100%',
            maxWidth: 400,
            maxHeight: '80%',
            ...shadows.lg,
          }}>
            <Text style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}>
              Agregar Empresa a Lista Negra
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.background.light,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                fontSize: typography.fontSize.base,
              }}
              placeholder="Razón Social"
              value={newCompany.company_name}
              onChangeText={(text) => setNewCompany(prev => ({ ...prev, company_name: text }))}
            />

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.background.light,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                fontSize: typography.fontSize.base,
              }}
              placeholder="RUT (ej: 76.123.456-7)"
              value={newCompany.rut}
              onChangeText={(text) => setNewCompany(prev => ({ ...prev, rut: text }))}
            />

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.background.light,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                fontSize: typography.fontSize.base,
              }}
              placeholder="Representante Legal"
              value={newCompany.legal_representative}
              onChangeText={(text) => setNewCompany(prev => ({ ...prev, legal_representative: text }))}
            />

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.background.light,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                fontSize: typography.fontSize.base,
              }}
              placeholder="RUT Representante (opcional)"
              value={newCompany.rep_doc_id}
              onChangeText={(text) => setNewCompany(prev => ({ ...prev, rep_doc_id: text }))}
            />

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.background.light,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                fontSize: typography.fontSize.base,
              }}
              placeholder="Email (opcional)"
              value={newCompany.email}
              onChangeText={(text) => setNewCompany(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
            />

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.background.light,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                fontSize: typography.fontSize.base,
              }}
              placeholder="Teléfono (opcional)"
              value={newCompany.phone}
              onChangeText={(text) => setNewCompany(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.background.light,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
                fontSize: typography.fontSize.base,
                minHeight: 60,
                textAlignVertical: 'top',
              }}
              placeholder="Dirección (opcional)"
              value={newCompany.address}
              onChangeText={(text) => setNewCompany(prev => ({ ...prev, address: text }))}
              multiline
            />

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.background.light,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.lg,
                fontSize: typography.fontSize.base,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Motivo del bloqueo"
              value={newCompany.reason}
              onChangeText={(text) => setNewCompany(prev => ({ ...prev, reason: text }))}
              multiline
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setAddCompanyModalVisible(false)}
                style={{
                  backgroundColor: colors.background.light,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  flex: 1,
                  marginRight: spacing.sm,
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.base,
                  color: colors.text.secondary,
                  textAlign: 'center',
                  fontWeight: typography.fontWeight.medium,
                }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddCompany}
                style={{
                  backgroundColor: colors.error,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  flex: 1,
                  marginLeft: spacing.sm,
                }}
              >
                <Text style={{
                  fontSize: typography.fontSize.base,
                  color: colors.white,
                  textAlign: 'center',
                  fontWeight: typography.fontWeight.medium,
                }}>
                  Agregar
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.error, colors.extended.red]}
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.back()}
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
                Empresas en Lista Negra
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.white,
                opacity: 0.9,
              }}>
                Gestiona empresas denegadas en el sistema
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => setAddCompanyModalVisible(true)}
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="add" size={20} color={colors.error} />
            <Text style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.error,
              marginLeft: spacing.xs,
            }}>
              Agregar
            </Text>
          </TouchableOpacity>
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
            title="Total Bloqueadas"
            value={stats.totalBlocked}
            icon="business-outline"
            color={colors.error}
          />
          <StatCard
            title="Bloqueos Activos"
            value={stats.activeBlocks}
            icon="lock-closed-outline"
            color={colors.extended.red}
          />
        </View>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <StatCard
            title="En Revisión"
            value={stats.pendingReview}
            icon="time-outline"
            color={colors.warning}
          />
          <StatCard
            title="Recientes (7 días)"
            value={stats.recentBlocks}
            icon="calendar-outline"
            color={colors.extended.redLight}
          />
        </View>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <View style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          ...shadows.sm,
        }}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: spacing.sm,
              fontSize: typography.fontSize.base,
              color: colors.text.primary,
            }}
            placeholder="Buscar por razón social, RUT, representante o email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Companies List */}
      <FlatList
        data={filteredCompanies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BlacklistedCompanyCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ 
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xl,
        }}
        ListEmptyComponent={() => (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: spacing['3xl'],
          }}>
            <View style={{
              backgroundColor: colors.background.light,
              borderRadius: borderRadius.full,
              padding: spacing.xl,
              marginBottom: spacing.lg,
            }}>
              <Ionicons name="business-outline" size={64} color={colors.text.secondary} />
            </View>
            <Text style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              marginBottom: spacing.xs,
            }}>
              {searchQuery ? 'No se encontraron empresas' : 'No hay empresas en lista negra'}
            </Text>
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              textAlign: 'center',
            }}>
              {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Las empresas denegadas aparecerán aquí'}
            </Text>
          </View>
        )}
      />

      <AddCompanyModal />
    </SafeAreaView>
  );
};

export default BlacklistCompaniesScreen;