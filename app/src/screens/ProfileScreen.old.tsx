import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api.service';
import { colors, spacing, typography, layout, borderRadius } from '@/theme';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLanguage, setEditLanguage] = useState('English');

  // Initialize form with user data when editing
  const openEditModal = () => {
    if (user) {
      setEditName(user.name || '');
      setEditLocation(user.region || '');
      setEditLanguage(user.language || 'English');
    }
    setIsEditing(true);
  };

  // Refresh user data when screen is focused (only once on focus, not on every user update)
  useFocusEffect(
    useCallback(() => {
      // Only load if we don't have user data yet
      if (!user) {
        loadProfileData();
      }
      // Cleanup function
      return () => {
        // Optional: Cancel any pending requests if needed
      };
    }, []) // Empty dependency array - only runs on focus
  );

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      await refreshUser();
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      await apiService.updateProfile({
        name: editName,
        region: editLocation,
        language: editLanguage,
      });
      await refreshUser();
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } catch (error: any) {
            setIsLoggingOut(false);
            Alert.alert('Error', error.message || 'Failed to logout');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return 'U';
    }
    try {
      return name
        .trim()
        .split(' ')
        .filter(word => word.length > 0)
        .map((word) => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
    } catch (error) {
      console.error('Error generating initials:', error);
      return 'U';
    }
  };

  if (isLoading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      </SafeAreaView>
    );
  }

  const initials = user ? getInitials(user.name) : 'U';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image 
            source={require('../../assets/checkmate-logo.png')} 
            style={styles.headerLogo}
          />
          <View style={styles.profilePhoto}>
            <Text style={styles.profileInitial}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          <Text style={styles.profileMeta}>
            Joined{' '}
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : 'Recently'}
          </Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingRow
            label="Edit Profile"
            onPress={openEditModal}
          />
          <SettingRow label="Change Password" onPress={() => {}} />
          <SettingRow label="Two-Factor Authentication" onPress={() => {}} />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingRow 
            label="Accessibility" 
            onPress={() => navigation.navigate('AccessibilitySettings')} 
          />
          <SettingRow label="Language" value={user?.language || 'English'} onPress={() => {}} />
          <SettingRow label="Location" value={user?.region || 'Global'} onPress={() => {}} />
          <SettingRow label="Notifications" onPress={() => {}} />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingRow label="Help Center" onPress={() => {}} />
          <SettingRow label="Report a Bug" onPress={() => {}} />
          <SettingRow label="Privacy Policy" onPress={() => {}} />
          <SettingRow label="Terms of Service" onPress={() => {}} />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={colors.red} />
          ) : (
            <Text style={styles.logoutText}>Log Out</Text>
          )}
        </TouchableOpacity>

        <View style={styles.spacing} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditing(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={handleEditProfile}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.modalClose,
                    { color: isLoading ? colors.gray300 : colors.blue },
                  ]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Your name"
                  value={editName}
                  onChangeText={setEditName}
                  editable={!isLoading}
                  placeholderTextColor={colors.gray400}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Email</Text>
                <View style={[styles.textInput, styles.disabledInput]}>
                  <Text style={styles.textInputText}>{user?.email}</Text>
                </View>
                <Text style={styles.formHint}>Email cannot be changed</Text>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Your location"
                  value={editLocation}
                  onChangeText={setEditLocation}
                  editable={!isLoading}
                  placeholderTextColor={colors.gray400}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Language</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Your language"
                  value={editLanguage}
                  onChangeText={setEditLanguage}
                  editable={!isLoading}
                  placeholderTextColor={colors.gray400}
                />
              </View>

              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.blue} />
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

interface SettingRowProps {
  label: string;
  value?: string;
  onPress: () => void;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, value, onPress }) => {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <Text style={styles.settingLabel}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.md,
  },
  headerLogo: {
    width: 60,
    height: 60,
    marginBottom: spacing.sm,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  profileName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  profileEmail: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  },
  profileMeta: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textTertiary,
  },
  section: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.base,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  settingRow: {
    height: layout.settingRowHeight,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingLabel: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  settingValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  },
  arrow: {
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
  },
  spacing: {
    height: spacing.xl,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalClose: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.blue,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  modalScroll: {
    flex: 1,
  },
  formSection: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.base,
    gap: spacing.sm,
  },
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  formHint: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    color: colors.textTertiary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  textInputText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  disabledInput: {
    backgroundColor: colors.backgroundTertiary,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    margin: layout.screenPadding,
    marginTop: spacing['2xl'],
    height: layout.buttonHeight,
    backgroundColor: colors.redLight,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.red,
  },
});
