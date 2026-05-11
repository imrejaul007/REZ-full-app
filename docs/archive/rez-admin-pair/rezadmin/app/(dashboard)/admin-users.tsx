import React, { useState, useCallback, useMemo } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { showAlert, showConfirm } from '../../utils/alert';
import {
  adminUsersService,
  AdminUserProfile,
  CreateAdminData,
} from '../../services/api/adminUsers';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { s } from './admin-users.styles';
import {
  ADMIN_ROLES,
  AdminRole,
  getRoleDisplayName,
  VALID_ADMIN_ROLES,
} from '../../constants/roles';

export default function AdminUsersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { hasRole } = useAuth();

  const [admins, setAdmins] = useState<AdminUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: ADMIN_ROLES.SUPPORT,
  });
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminUserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });
  const [editing, setEditing] = useState(false);

  const loadAdmins = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminUsersService.listAdmins();
      setAdmins(data);
    } catch (error) {
      logger.error('Failed to load admins:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load admins when screen comes into focus (also handles initial load)
  useFocusEffect(
    useCallback(() => {
      loadAdmins();
    }, [loadAdmins])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAdmins();
  }, []);

  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!createForm.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) errors.email = 'Invalid email';
    if (!createForm.password) errors.password = 'Password is required';
    else if (createForm.password.length < 8) errors.password = 'Min 8 characters';
    if (!createForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!createForm.lastName.trim()) errors.lastName = 'Last name is required';
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreateForm()) return;
    setCreating(true);
    try {
      const result = await adminUsersService.createAdmin(createForm);
      if (result) {
        showAlert('Success', 'Admin user created successfully.');
        setShowCreateModal(false);
        setCreateForm({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phoneNumber: '',
          role: ADMIN_ROLES.SUPPORT,
        });
        setCreateErrors({});
        loadAdmins();
      } else {
        showAlert('Error', 'Failed to create admin user. Email may already exist.');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to create admin.');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!editAdmin) return;
    setEditing(true);
    try {
      const result = await adminUsersService.updateAdmin(editAdmin._id, editForm);
      if (result) {
        showAlert('Success', 'Admin user updated.');
        setShowEditModal(false);
        setEditAdmin(null);
        loadAdmins();
      } else {
        showAlert('Error', 'Failed to update admin user.');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to update admin.');
    } finally {
      setEditing(false);
    }
  };

  const handleToggleActive = async (admin: AdminUserProfile) => {
    if (admin.isActive) {
      const confirmed = await showConfirm(
        'Deactivate Admin',
        `Are you sure you want to deactivate ${admin.fullName}? Their open tickets will be unassigned.`
      );
      if (!confirmed) return;
      try {
        await adminUsersService.deactivateAdmin(admin._id);
        showAlert('Success', 'Admin deactivated.');
        await loadAdmins();
      } catch (error: any) {
        showAlert('Error', error.message || 'Failed to deactivate admin.');
      }
    } else {
      try {
        const result = await adminUsersService.updateAdmin(admin._id, { isActive: true });
        if (result) {
          showAlert('Success', 'Admin reactivated.');
          await loadAdmins();
        } else {
          showAlert('Error', 'Failed to reactivate admin.');
        }
      } catch (error: any) {
        showAlert('Error', error.message || 'Failed to reactivate admin.');
      }
    }
  };

  const openEditModal = (admin: AdminUserProfile) => {
    setEditAdmin(admin);
    setEditForm({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
    });
    setShowEditModal(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
    } catch {
      return dateStr;
    }
  };

  const renderAdminItem = useCallback(
    ({ item }: { item: AdminUserProfile }) => (
      <View
        style={[s.adminCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={s.adminCardHeader}>
          <View style={s.adminInfo}>
            <View
              style={[
                s.adminAvatar,
                { backgroundColor: item.isActive ? colors.navy : colors.icon },
              ]}
            >
              <Text style={s.adminAvatarText}>
                {item.firstName?.charAt(0)?.toUpperCase() || 'A'}
                {item.lastName?.charAt(0)?.toUpperCase() || ''}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.adminName, { color: colors.text }]}>{item.fullName}</Text>
              <Text style={[s.adminEmail, { color: colors.icon }]}>{item.email}</Text>
              {item.phoneNumber ? (
                <Text style={[s.adminPhone, { color: colors.icon }]}>{item.phoneNumber}</Text>
              ) : null}
            </View>
          </View>
          <View
            style={[
              s.statusBadge,
              { backgroundColor: item.isActive ? colors.success + '15' : colors.error + '15' },
            ]}
          >
            <View
              style={[
                s.statusDot,
                { backgroundColor: item.isActive ? colors.success : colors.error },
              ]}
            />
            <Text
              style={[s.statusText, { color: item.isActive ? colors.success : colors.error }]}
            >
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={s.adminMeta}>
          <View style={s.adminMetaItem}>
            <Ionicons name="ticket-outline" size={14} color={colors.icon} />
            <Text style={[s.adminMetaText, { color: colors.icon }]}>
              {item.assignedTickets} open tickets
            </Text>
          </View>
          <View style={s.adminMetaItem}>
            <Ionicons name="log-in-outline" size={14} color={colors.icon} />
            <Text style={[s.adminMetaText, { color: colors.icon }]}>
              Last login: {formatDate(item.lastLogin)}
            </Text>
          </View>
          <View style={s.adminMetaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.icon} />
            <Text style={[s.adminMetaText, { color: colors.icon }]}>
              Created: {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>

        <View style={s.adminActions}>
          <TouchableOpacity
            style={[
              s.actionBtn,
              { backgroundColor: colors.info + '10', borderColor: colors.info + '30' },
            ]}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={16} color={colors.info} />
            <Text style={[s.actionBtnText, { color: colors.info }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              s.actionBtn,
              {
                backgroundColor: item.isActive ? colors.error + '10' : colors.success + '10',
                borderColor: item.isActive ? colors.error + '30' : colors.success + '30',
              },
            ]}
            onPress={() => handleToggleActive(item)}
          >
            <Ionicons
              name={item.isActive ? 'close-circle-outline' : 'checkmark-circle-outline'}
              size={16}
              color={item.isActive ? colors.error : colors.success}
            />
            <Text
              style={[
                s.actionBtnText,
                { color: item.isActive ? colors.error : colors.success },
              ]}
            >
              {item.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [colors, openEditModal, handleToggleActive, formatDate]
  );

  // Create Modal
  const renderCreateModal = () => (
    <Modal visible={showCreateModal} transparent animationType="slide">
      <View style={s.modalOverlay}>
        <View style={[s.modalContent, { backgroundColor: colors.card }]}>
          <View style={s.modalHeader}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Create Admin User</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.modalBody}>
            {/* First Name */}
            <Text style={[s.inputLabel, { color: colors.text }]}>First Name *</Text>
            <TextInput
              style={[
                s.input,
                {
                  color: colors.text,
                  borderColor: createErrors.firstName ? colors.error : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="First name"
              placeholderTextColor={colors.icon}
              value={createForm.firstName}
              onChangeText={(v) => setCreateForm((f) => ({ ...f, firstName: v }))}
            />
            {createErrors.firstName && (
              <Text style={s.errorText}>{createErrors.firstName}</Text>
            )}

            {/* Last Name */}
            <Text style={[s.inputLabel, { color: colors.text }]}>Last Name *</Text>
            <TextInput
              style={[
                s.input,
                {
                  color: colors.text,
                  borderColor: createErrors.lastName ? colors.error : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Last name"
              placeholderTextColor={colors.icon}
              value={createForm.lastName}
              onChangeText={(v) => setCreateForm((f) => ({ ...f, lastName: v }))}
            />
            {createErrors.lastName && <Text style={s.errorText}>{createErrors.lastName}</Text>}

            {/* Email */}
            <Text style={[s.inputLabel, { color: colors.text }]}>Email *</Text>
            <TextInput
              style={[
                s.input,
                {
                  color: colors.text,
                  borderColor: createErrors.email ? colors.error : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="admin@example.com"
              placeholderTextColor={colors.icon}
              value={createForm.email}
              onChangeText={(v) => setCreateForm((f) => ({ ...f, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {createErrors.email && <Text style={s.errorText}>{createErrors.email}</Text>}

            {/* Password */}
            <Text style={[s.inputLabel, { color: colors.text }]}>Password *</Text>
            <TextInput
              style={[
                s.input,
                {
                  color: colors.text,
                  borderColor: createErrors.password ? colors.error : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Min 8 characters"
              placeholderTextColor={colors.icon}
              value={createForm.password}
              onChangeText={(v) => setCreateForm((f) => ({ ...f, password: v }))}
              secureTextEntry
            />
            {createErrors.password && <Text style={s.errorText}>{createErrors.password}</Text>}

            {/* Phone */}
            <Text style={[s.inputLabel, { color: colors.text }]}>Phone Number</Text>
            <TextInput
              style={[
                s.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Optional"
              placeholderTextColor={colors.icon}
              value={createForm.phoneNumber}
              onChangeText={(v) => setCreateForm((f) => ({ ...f, phoneNumber: v }))}
              keyboardType="phone-pad"
            />

            {/* Role */}
            <Text style={[s.inputLabel, { color: colors.text }]}>Role *</Text>
            <View style={s.rolePicker}>
              {VALID_ADMIN_ROLES.map((role: AdminRole) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    s.roleOption,
                    {
                      backgroundColor: createForm.role === role ? colors.navy : colors.background,
                      borderColor: createForm.role === role ? colors.navy : colors.border,
                    },
                  ]}
                  onPress={() => setCreateForm((f) => ({ ...f, role }))}
                >
                  <Text
                    style={[
                      s.roleOptionText,
                      { color: createForm.role === role ? colors.card : colors.text },
                    ]}
                  >
                    {getRoleDisplayName(role)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={s.modalFooter}>
            <TouchableOpacity
              style={[s.modalBtn, { backgroundColor: colors.border }]}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={[s.modalBtnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalBtn, { backgroundColor: colors.navy }]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color={colors.card} />
              ) : (
                <Text style={[s.modalBtnText, { color: colors.card }]}>Create Admin</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Edit Modal
  const renderEditModal = () => {
    if (!editAdmin) return null;
    return (
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.card }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Edit Admin</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalBody}>
              <Text style={[s.inputLabel, { color: colors.text }]}>First Name</Text>
              <TextInput
                style={[
                  s.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                value={editForm.firstName}
                onChangeText={(v) => setEditForm((f) => ({ ...f, firstName: v }))}
              />

              <Text style={[s.inputLabel, { color: colors.text }]}>Last Name</Text>
              <TextInput
                style={[
                  s.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                value={editForm.lastName}
                onChangeText={(v) => setEditForm((f) => ({ ...f, lastName: v }))}
              />

              <Text style={[s.inputLabel, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[
                  s.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                value={editForm.email}
                onChangeText={(v) => setEditForm((f) => ({ ...f, email: v }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[s.inputLabel, { color: colors.text }]}>Phone Number</Text>
              <TextInput
                style={[
                  s.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                value={editForm.phoneNumber}
                onChangeText={(v) => setEditForm((f) => ({ ...f, phoneNumber: v }))}
                keyboardType="phone-pad"
              />
            </ScrollView>

            <View style={s.modalFooter}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[s.modalBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: colors.navy }]}
                onPress={handleEdit}
                disabled={editing}
              >
                {editing ? (
                  <ActivityIndicator size="small" color={colors.card} />
                ) : (
                  <Text style={[s.modalBtnText, { color: colors.card }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Require super_admin role
  if (!hasRole(ADMIN_ROLES.SUPER_ADMIN)) {
    return (
      <View style={[s.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.icon} />
        <Text
          style={[s.headerTitle, { color: colors.text, marginTop: 16, textAlign: 'center' }]}
        >
          Access Denied
        </Text>
        <Text
          style={{ color: colors.icon, textAlign: 'center', paddingHorizontal: 32, marginTop: 8 }}
        >
          You need Super Admin privileges to manage Admin Users.
        </Text>
      </View>
    );
  }

  if (isLoading && admins.length === 0) {
    return (
      <View style={[s.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View
        style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        <Text style={[s.headerTitle, { color: colors.text }]}>Admin Users</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => {
            setCreateForm({
              email: '',
              password: '',
              firstName: '',
              lastName: '',
              phoneNumber: '',
              role: ADMIN_ROLES.SUPPORT,
            });
            setCreateErrors({});
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={18} color={colors.card} />
          <Text style={s.addBtnText}>Add Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={s.summaryRow}>
        <View
          style={[
            s.summaryCard,
            { backgroundColor: `${colors.navy}10`, borderColor: `${colors.navy}30` },
          ]}
        >
          <Text style={[s.summaryValue, { color: colors.navy }]}>{admins.length}</Text>
          <Text style={[s.summaryLabel, { color: colors.navy }]}>Total</Text>
        </View>
        <View
          style={[
            s.summaryCard,
            { backgroundColor: colors.success + '10', borderColor: colors.success + '30' },
          ]}
        >
          <Text style={[s.summaryValue, { color: colors.success }]}>
            {admins.filter((a) => a.isActive).length}
          </Text>
          <Text style={[s.summaryLabel, { color: colors.success }]}>Active</Text>
        </View>
        <View
          style={[
            s.summaryCard,
            { backgroundColor: colors.error + '10', borderColor: colors.error + '30' },
          ]}
        >
          <Text style={[s.summaryValue, { color: colors.error }]}>
            {admins.filter((a) => !a.isActive).length}
          </Text>
          <Text style={[s.summaryLabel, { color: colors.error }]}>Inactive</Text>
        </View>
      </View>

      <FlatList
        data={admins}
        renderItem={renderAdminItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.icon} />
            <Text style={[s.emptyText, { color: colors.icon }]}>No admin users found</Text>
          </View>
        }
      />

      {renderCreateModal()}
      {renderEditModal()}
    </View>
  );
}

