import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { useUserAPI, SystemUser, UserFormData } from '../../hooks/useUserAPI';

interface FormData {
  doc_id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: string;
  password: string;
  active: boolean;
}

const UserManagementScreen = () => {
  const { currentUser } = useAuth();
  const { getSystemUsers, saveSystemUser, deleteSystemUser } = useUserAPI();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState<FormData>({
    doc_id: '',
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    role: 'user',
    password: '',
    active: true,
  });

  useEffect(() => {
    // Solo permitir acceso a admins
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
      return;
    }
    
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('👥 Certificados: Cargando usuarios del sistema...');

      const result = await getSystemUsers();
      
      if (result.success && result.users) {
        setUsers(result.users);
        console.log('✅ Certificados: Usuarios cargados:', result.users.length);
      } else {
        console.error('❌ Certificados: Error cargando usuarios:', result.error);
        Alert.alert('Error', result.error || 'Error cargando usuarios');
      }
    } catch (error: any) {
      console.error('❌ Certificados: Error cargando usuarios:', error);
      Alert.alert('Error', `Error cargando usuarios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      doc_id: '',
      first_name: '',
      last_name: '',
      email: '',
      username: '',
      role: 'user',
      password: '',
      active: true,
    });
    setModalVisible(true);
  };

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setFormData({
      doc_id: user.doc_id || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      username: user.username || '',
      role: user.role || 'user',
      password: '',
      active: user.active === 'Y' || user.active === 'y' || user.active === true,
    });
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    try {
      // Validaciones
      if (!formData.first_name.trim()) {
        Alert.alert('Error', 'El nombre es requerido');
        return;
      }
      if (!formData.last_name.trim()) {
        Alert.alert('Error', 'El apellido es requerido');
        return;
      }
      if (!formData.username.trim()) {
        Alert.alert('Error', 'El nombre de usuario es requerido');
        return;
      }
      if (!editingUser && !formData.password.trim()) {
        Alert.alert('Error', 'La contraseña es requerida para usuarios nuevos');
        return;
      }

      setSaving(true);
      
      const userData: UserFormData = {
        id: editingUser?.id || undefined,
        doc_id: formData.doc_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        login: formData.username,
        role: formData.role,
        active: formData.active ? 'Y' : 'N',
        user_type: 'system',
      };

      // Agregar contraseña solo si se proporcionó
      if (formData.password.trim()) {
        userData.password = formData.password;
      }

      console.log('💾 Certificados: Guardando usuario...');
      
      const result = await saveSystemUser(userData);
      
      if (result.success) {
        Alert.alert('Éxito', editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
        setModalVisible(false);
        await loadUsers();
      } else {
        Alert.alert('Error', result.error || 'Error al guardar usuario');
      }
    } catch (error) {
      console.error('❌ Certificados: Error guardando usuario:', error);
      Alert.alert('Error', `Error guardando usuario: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = (user: SystemUser) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro que deseas eliminar al usuario ${user.username}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              
              const result = await deleteSystemUser(user.id);
              
              if (result.success) {
                Alert.alert('Éxito', 'Usuario eliminado correctamente');
                await loadUsers();
              } else {
                Alert.alert('Error', result.error || 'Error al eliminar usuario');
              }
            } catch (error: any) {
              console.error('❌ Certificados: Error eliminando usuario:', error);
              Alert.alert('Error', `Error eliminando usuario: ${error.message}`);
            } finally {
              setSaving(false);
            }
          }
        },
      ]
    );
  };

  const toggleUserStatus = async (user: SystemUser) => {
    try {
      setSaving(true);
      
      const userData: UserFormData = {
        id: user.id,
        doc_id: user.doc_id || '',
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email || '',
        login: user.username,
        role: user.role,
        active: user.active === 'Y' || user.active === 'y' ? 'N' : 'Y',
        user_type: 'system',
      };

      const result = await saveSystemUser(userData);
      
      if (result.success) {
        await loadUsers();
      } else {
        Alert.alert('Error', result.error || 'Error al cambiar estado del usuario');
      }
    } catch (error: any) {
      console.error('❌ Certificados: Error cambiando estado:', error);
      Alert.alert('Error', `Error cambiando estado: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => {
    // Solo mostrar usuarios con roles admin y user, excluir clients
    const allowedRoles = ['admin', 'user', 'super_admin'];
    const roleFilter = allowedRoles.includes(u.role);
    
    // Aplicar filtro de búsqueda
    const searchFilter = searchQuery === '' || (
      u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.doc_id?.includes(searchQuery)
    );
    
    return roleFilter && searchFilter;
  });

  // Verificar permisos de admin
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }}>
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyText}>Acceso Restringido</Text>
          <Text style={styles.emptySubtext}>
            Solo los administradores pueden gestionar usuarios
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const UserCard = ({ user }: { user: SystemUser }) => (
    <Animatable.View animation="fadeInUp" style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user.first_name} {user.last_name}
          </Text>
          <Text style={styles.userDetail}>@{user.username}</Text>
          {user.doc_id && <Text style={styles.userDetail}>RUT: {user.doc_id}</Text>}
          {user.email && <Text style={styles.userDetail}>{user.email}</Text>}
        </View>
        
        <View style={styles.userActions}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: (user.active === 'Y' || user.active === 'y') ? colors.success.light : colors.error.light }
          ]}>
            <Text style={[
              styles.statusText,
              { color: (user.active === 'Y' || user.active === 'y') ? colors.success.main : colors.error.main }
            ]}>
              {(user.active === 'Y' || user.active === 'y') ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
          
          <View style={[
            styles.roleBadge,
            { backgroundColor: user.role === 'admin' ? colors.primary.purple + '20' : colors.primary.green + '20' }
          ]}>
            <Text style={[
              styles.roleText,
              { color: user.role === 'admin' ? colors.primary.purple : colors.primary.green }
            ]}>
              {user.role === 'admin' ? 'Admin' : 'Usuario'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.userFooter}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary.green + '20' }]}
          onPress={() => handleEditUser(user)}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.primary.green} />
          <Text style={[styles.actionButtonText, { color: colors.primary.green }]}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { 
            backgroundColor: (user.active === 'Y' || user.active === 'y') ? colors.warning.light : colors.success.light 
          }]}
          onPress={() => toggleUserStatus(user)}
        >
          <Ionicons 
            name={(user.active === 'Y' || user.active === 'y') ? "pause-outline" : "play-outline"} 
            size={16} 
            color={(user.active === 'Y' || user.active === 'y') ? colors.warning.main : colors.success.main} 
          />
          <Text style={[styles.actionButtonText, { 
            color: (user.active === 'Y' || user.active === 'y') ? colors.warning.main : colors.success.main 
          }]}>
            {(user.active === 'Y' || user.active === 'y') ? 'Desactivar' : 'Activar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error.light }]}
          onPress={() => handleDeleteUser(user)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error.main} />
          <Text style={[styles.actionButtonText, { color: colors.error.main }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }}>
      {/* Header */}
      <LinearGradient
        colors={colors.gradients.purple}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
        <Text style={styles.headerSubtitle}>
          Administra los usuarios del sistema • Solo admin y usuarios
        </Text>
      </LinearGradient>

      {/* Search and Add Button */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateUser}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg }}
      >
        {loading && users.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary.purple} />
            <Text style={styles.loadingText}>Cargando usuarios...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </Text>
          </View>
        ) : (
          filteredUsers.map((user, index) => (
            <UserCard key={user.id || index} user={user} />
          ))
        )}
      </ScrollView>

      {/* User Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.first_name}
                  onChangeText={(text) => setFormData({...formData, first_name: text})}
                  placeholder="Ingresa el nombre"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Apellido *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.last_name}
                  onChangeText={(text) => setFormData({...formData, last_name: text})}
                  placeholder="Ingresa el apellido"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>RUT</Text>
                <TextInput
                  style={styles.input}
                  value={formData.doc_id}
                  onChangeText={(text) => setFormData({...formData, doc_id: text})}
                  placeholder="Ingresa el RUT (opcional)"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  placeholder="Ingresa el email (opcional)"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Usuario *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(text) => setFormData({...formData, username: text})}
                  placeholder="Ingresa el nombre de usuario"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Rol *</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      formData.role === 'user' && styles.roleButtonActive
                    ]}
                    onPress={() => setFormData({...formData, role: 'user'})}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      formData.role === 'user' && styles.roleButtonTextActive
                    ]}>Usuario</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      formData.role === 'admin' && styles.roleButtonActive
                    ]}
                    onPress={() => setFormData({...formData, role: 'admin'})}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      formData.role === 'admin' && styles.roleButtonTextActive
                    ]}>Admin</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Contraseña {editingUser ? '(dejar vacío para mantener actual)' : '*'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => setFormData({...formData, password: text})}
                  placeholder={editingUser ? "Nueva contraseña" : "Ingresa la contraseña"}
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={[
                    styles.switchContainer,
                    formData.active && styles.switchContainerActive
                  ]}
                  onPress={() => setFormData({...formData, active: !formData.active})}
                >
                  <Text style={[
                    styles.switchText,
                    formData.active && styles.switchTextActive
                  ]}>
                    Usuario Activo
                  </Text>
                  <View style={[
                    styles.switch,
                    formData.active && styles.switchActive
                  ]}>
                    <View style={[
                      styles.switchThumb,
                      formData.active && styles.switchThumbActive
                    ]} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveUser}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingUser ? 'Actualizar' : 'Crear'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    opacity: 0.9,
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginRight: spacing.md,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingLeft: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  addButton: {
    backgroundColor: colors.primary.green,
    borderRadius: borderRadius.full,
    padding: spacing.md,
    ...shadows.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
  emptySubtext: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  userActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    flex: 1,
    marginHorizontal: spacing.xs,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  roleContainer: {
    flexDirection: 'row',
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: colors.primary.green,
    borderColor: colors.primary.green,
  },
  roleButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  roleButtonTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  switchContainerActive: {},
  switchText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  switchTextActive: {
    color: colors.primary.green,
    fontWeight: typography.fontWeight.medium,
  },
  switch: {
    width: 50,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border.light,
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: colors.primary.green,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  saveButton: {
    backgroundColor: colors.primary.green,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
});

export default UserManagementScreen;