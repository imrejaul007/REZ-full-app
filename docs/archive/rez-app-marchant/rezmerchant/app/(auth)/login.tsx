import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Shadows, BorderRadius } from '@/constants/DesignTokens';
import { Card, Button, Heading1, BodyText, Heading3 } from '@/components/ui/DesignSystemComponents';
import { platformAlertSimple } from '@/utils/platformAlert';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { state, login, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.isAuthenticated) {
      router.replace('/(dashboard)');
    }
  }, [state.isAuthenticated]);

  useEffect(() => {
    if (state.error && typeof state.error === 'string') {
      platformAlertSimple('Login Error', state.error);
      clearError();
    }
  }, [state.error]);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      platformAlertSimple('Email Required', 'Please enter your email address.');
      return;
    }
    if (!password) {
      platformAlertSimple('Password Required', 'Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      await login(trimmedEmail, password);
    } catch (e: any) {
      platformAlertSimple('Login Failed', e.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary[500], Colors.primary[800]]}
          style={styles.backgroundGradient}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              {/* Header */}
              <View style={styles.header}>
                <Heading1 style={styles.title}>Rez Merchant</Heading1>
                <BodyText style={styles.subtitle}>
                  Sign in to your merchant account
                </BodyText>
              </View>

              {/* Card */}
              <Card style={styles.formContainer} variant="elevated">
                <Animated.View entering={FadeInDown.delay(50)} style={styles.form}>
                  {/* Email */}
                  <View>
                    <Heading3 style={styles.fieldLabel}>Email</Heading3>
                    <View style={styles.inputRow}>
                      <Ionicons name="mail-outline" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
                      <RNTextInput
                        style={styles.textInput}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor={Colors.text.tertiary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        editable={!loading}
                        autoFocus
                      />
                    </View>
                  </View>

                  {/* Password */}
                  <View>
                    <Heading3 style={styles.fieldLabel}>Password</Heading3>
                    <View style={styles.inputRow}>
                      <Ionicons name="lock-closed-outline" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
                      <RNTextInput
                        style={[styles.textInput, { flex: 1 }]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        placeholderTextColor={Colors.text.tertiary}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                        editable={!loading}
                        onSubmitEditing={handleLogin}
                      />
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color={Colors.text.tertiary}
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    </View>
                  </View>

                  {/* Forgot Password */}
                  <View style={styles.forgotRow}>
                    <Button
                      title="Forgot Password?"
                      variant="ghost"
                      onPress={() => router.push('/(auth)/forgot-password')}
                      size="small"
                      style={{ height: 'auto', paddingHorizontal: 0 }}
                    />
                  </View>

                  {/* Login Button */}
                  <Button
                    title={loading ? 'Signing in...' : 'Sign In'}
                    onPress={handleLogin}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                    style={styles.actionButton}
                  />

                  {/* Sign Up Link */}
                  <View style={styles.footer}>
                    <BodyText>Don't have an account? </BodyText>
                    <Button
                      title="Sign Up"
                      variant="ghost"
                      onPress={() => router.push('/(auth)/register')}
                      size="small"
                      style={{ height: 'auto', paddingHorizontal: 4 }}
                    />
                  </View>
                </Animated.View>
              </Card>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '40%',
  },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: 8,
  },
  title: {
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    ...Shadows.xl,
  },
  form: { gap: Spacing.md },
  fieldLabel: {
    marginBottom: Spacing.xs,
    color: Colors.primary[600],
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingLeft: 14,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 13,
    fontSize: 16,
    color: Colors.text.primary,
  },
  eyeIcon: {
    paddingRight: 14,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -Spacing.xs,
  },
  actionButton: { marginTop: Spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
});
