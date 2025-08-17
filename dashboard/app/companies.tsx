import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from './styles/theme';
import api from './api/IdentificaAPI';

interface Company {
  id: number;
  rut: string;
  name: string;
  address: string;
  created: string;
  isDenied: number;
  deniedNote: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

interface CompanyFormData {
  id?: number;
  name: string;
  rut: string;
  address: string;
  notes: string;
  username: string;
  email: string;
  userId?: number;
}

export default function CompaniesScreen() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    rut: '',
    address: '',
    notes: '',
    username: '',
    email: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const pageSize = 25;

  useEffect(() => {
    loadCompanies();
  }, [searchQuery, currentPage]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      console.log('📋 Cargando empresas...');
      console.log('📋 Parámetros de búsqueda:', {
        page: currentPage,
        size: pageSize,
        filter: searchQuery,
      });
      
      const response = await api.getCompanies({
        page: currentPage,
        size: pageSize,
        filter: searchQuery,
        column: 'created',
        direction: 'desc'
      });
      
      console.log('📋 Respuesta de empresas:', response);
      
      if (response.data) {
        // Transform the array response to objects
        const transformedCompanies = response.data.map((row: any[]) => ({
          id: row[0],
          rut: row[1],
          name: row[2],
          address: row[3],
          created: row[4],
          isDenied: row[5],
          deniedNote: row[6],
        }));
        setCompanies(transformedCompanies);
        setTotalCount(response.total || 0);
        console.log('✅ Empresas cargadas:', transformedCompanies.length, 'de', response.total);
      } else {
        setCompanies([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('❌ Error loading companies:', error);
      Alert.alert('Error', `No se pudieron cargar las empresas: ${error.message}`);
      setCompanies([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      console.log('🚀 handleSave ejecutado - Iniciando proceso de guardado');
      console.log('🔍 Estado actual:', { isEditing, formData: { ...formData, password: '***' } });
      
      // Limpiar mensaje de error previo
      setErrorMessage('');
    
    if (!formData.name.trim() || !formData.rut.trim()) {
      console.log('❌ Validación falló: Nombre y RUT son obligatorios');
      setErrorMessage('Nombre y RUT son obligatorios');
      return;
    }

    console.log('✅ Validación 1 pasada: Nombre y RUT OK');

    // Validaciones de usuario tanto para crear como para editar
    if (!formData.username.trim() || !formData.email.trim()) {
      console.log('❌ Validación falló: Usuario y email son obligatorios');
      setErrorMessage('Usuario y email son obligatorios');
      return;
    }

    console.log('✅ Validación 2 pasada: Usuario y email OK');
    
    if (!formData.email.includes('@')) {
      console.log('❌ Validación falló: El email debe tener un formato válido');
      setErrorMessage('El email debe tener un formato válido');
      return;
    }

    console.log('✅ Validación 3 pasada: Email OK');

    try {
      console.log('💾 Guardando empresa:', formData);
      console.log('🔧 Modo edición:', isEditing);
      
      const payload = { ...formData };
      if (isEditing && formData.id) {
        payload.id = formData.id;
      }

      console.log('📦 Payload final:', payload);

      console.log('🌐 Llamando a la API...');
      const result = isEditing 
        ? await api.updateCompanyWithUser(payload)
        : await api.createCompanyWithUser(payload);
      console.log('🌐 API respondió:', result);
      console.log('✅ Empresa guardada:', result);
      
      // El save.php original solo devuelve { "id": id }, no devuelve "result"
      if (result.id) {
        setModalVisible(false);
        resetForm();
        setCurrentPage(1); // Volver a la primera página
        loadCompanies();
        // Success message could be added here if needed
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error saving company:', error);
      setErrorMessage('No se pudo guardar la empresa: ' + (error.message || 'Error desconocido'));
    }
    } catch (outerError) {
      console.error('❌ Error crítico en handleSave:', outerError);
      setErrorMessage('Error crítico: ' + (outerError.message || 'Error desconocido'));
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar esta empresa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Eliminando empresa:', id);
              const result = await api.deleteCompany(id);
              
              // Verificar que la eliminación fue exitosa
              if (result.success || result.id) {
                Alert.alert('Éxito', 'Empresa eliminada correctamente');
                loadCompanies();
              } else {
                throw new Error('Respuesta inválida del servidor');
              }
            } catch (error) {
              console.error('❌ Error deleting company:', error);
              Alert.alert('Error', 'No se pudo eliminar la empresa: ' + (error.message || 'Error desconocido'));
            }
          },
        },
      ]
    );
  };

  const handleEdit = async (company: Company) => {
    try {
      // Cargar datos del usuario asociado a la empresa
      const companyWithUser = await api.getCompanyWithUser(company.id);
      
      setFormData({
        id: company.id,
        name: company.name,
        rut: company.rut,
        address: company.address,
        notes: company.deniedNote || '',
        username: companyWithUser.user?.username || '',
        email: companyWithUser.user?.email || '',
        userId: companyWithUser.user?.id,
      });
      setIsEditing(true);
      setErrorMessage('');
      setModalVisible(true);
    } catch (error) {
      console.error('Error al cargar datos de usuario:', error);
      setErrorMessage('No se pudieron cargar los datos del usuario asociado');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rut: '',
      address: '',
      notes: '',
      username: '',
      email: '',
    });
    setIsEditing(false);
  };

  const handleNewCompany = () => {
    resetForm();
    setErrorMessage('');
    setModalVisible(true);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1); // Reset to first page when searching
    loadCompanies();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage * pageSize < totalCount) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary.purple} />
          </TouchableOpacity>
          <Text style={styles.title}>Gestión de Empresas</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.purple} />
          <Text style={styles.loadingText}>Cargando empresas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary.purple} />
        </TouchableOpacity>
        <Text style={styles.title}>Gestión de Empresas</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleNewCompany}>
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o RUT..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pagination Info */}
      <View style={styles.paginationInfo}>
        <Text style={styles.paginationText}>
          Mostrando {Math.min((currentPage - 1) * pageSize + 1, totalCount)}-{Math.min(currentPage * pageSize, totalCount)} de {totalCount} empresas
        </Text>
      </View>

      {/* Companies List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {companies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No se encontraron empresas</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Intenta con otro término de búsqueda' : 'Agrega tu primera empresa'}
            </Text>
          </View>
        ) : (
          companies.map((company) => (
            <View key={company.id} style={styles.companyCard}>
              <View style={styles.companyInfo}>
                <View style={styles.companyHeader}>
                  <Text style={styles.companyName}>{company.name}</Text>
                  {company.isDenied === 1 && (
                    <View style={styles.deniedBadge}>
                      <Text style={styles.deniedText}>DENEGADA</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.companyRut}>RUT: {company.rut}</Text>
                {company.address && (
                  <Text style={styles.companyAddress}>{company.address}</Text>
                )}
                <Text style={styles.companyDate}>
                  Creado: {new Date(company.created).toLocaleDateString('es-CL')}
                </Text>
              </View>
              
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(company)}
                >
                  <Ionicons name="pencil" size={16} color="white" />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(company.id)}
                >
                  <Ionicons name="trash" size={16} color="white" />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Pagination Controls */}
      {totalCount > pageSize && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={handlePrevPage}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? colors.text.disabled : colors.primary.purple} />
            <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
              Anterior
            </Text>
          </TouchableOpacity>

          <Text style={styles.paginationCurrentPage}>
            Página {currentPage} de {Math.ceil(totalCount / pageSize)}
          </Text>

          <TouchableOpacity
            style={[styles.paginationButton, currentPage * pageSize >= totalCount && styles.paginationButtonDisabled]}
            onPress={handleNextPage}
            disabled={currentPage * pageSize >= totalCount}
          >
            <Text style={[styles.paginationButtonText, currentPage * pageSize >= totalCount && styles.paginationButtonTextDisabled]}>
              Siguiente
            </Text>
            <Ionicons name="chevron-forward" size={20} color={currentPage * pageSize >= totalCount ? colors.text.disabled : colors.primary.purple} />
          </TouchableOpacity>
        </View>
      )}

      {/* Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Mensaje de error */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de la empresa"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>RUT *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="99.999.999-9"
                  value={formData.rut}
                  onChangeText={(text) => setFormData({ ...formData, rut: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dirección</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dirección de la empresa"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notas</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Notas adicionales"
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Campos de usuario */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Datos de Acceso</Text>
                <Text style={styles.sectionSubtitle}>
                  {isEditing 
                    ? 'Modifica los datos de acceso del usuario asociado a esta empresa'
                    : 'Se generará una contraseña temporal que será enviada por correo'
                  }
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Usuario *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre de usuario para login"
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text })}
                  autoCapitalize="none"
                />
              </View>


              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@empresa.com"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={() => {
                  console.log('🔴 Botón Actualizar/Guardar presionado');
                  handleSave();
                }}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    ...shadows.sm,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  addButton: {
    backgroundColor: colors.primary.purple,
    borderRadius: borderRadius.full,
    padding: spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  paginationInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  paginationText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.md,
  },
  emptySubtext: {
    color: colors.text.disabled,
    fontSize: typography.fontSize.base,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  companyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    ...shadows.md,
  },
  companyInfo: {
    marginBottom: spacing.md,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  companyName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  companyRut: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  companyAddress: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  companyDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.disabled,
  },
  deniedBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  deniedText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  editButton: {
    backgroundColor: colors.extended.blue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  editButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  deleteButton: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary.purple,
  },
  paginationButtonTextDisabled: {
    color: colors.text.disabled,
  },
  paginationCurrentPage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  textArea: {
    height: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  cancelButtonText: {
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary.purple,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  sectionHeader: {
    marginVertical: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.purple,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
});
