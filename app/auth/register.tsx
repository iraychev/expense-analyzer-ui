import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Head from "expo-router/head";
import { useRouter } from "expo-router";
import { colors } from "@/constants/Colors";
import { register } from "@/api/auth";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import TermsAndConditionsModal from "../modals/TermsAndConditionsModal";
import { useAlert } from "@/context/AlertContext";
import { getApiError } from "@/api/errors";

type FieldName = "name" | "username" | "email" | "password" | "confirmPassword";
const FIELD_NAMES: FieldName[] = ["name", "username", "email", "password", "confirmPassword"];
const USERNAME_REGEX = /^(?=[a-zA-Z0-9._]{4,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { showAlert } = useAlert();

  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});

  const clearError = (field: FieldName) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /\d/.test(password);

  const validate = (): Partial<Record<FieldName, string>> => {
    const result: Partial<Record<FieldName, string>> = {};
    if (!name.trim()) result.name = "Full name is required";
    if (!USERNAME_REGEX.test(username.trim())) {
      result.username = "4-20 characters: letters, digits, '.' or '_' (not at the start or end)";
    }
    if (!EMAIL_REGEX.test(email.trim())) result.email = "Please enter a valid email address";
    if (!(hasMinLength && hasLetter && hasDigit)) {
      result.password = "Password must be at least 8 characters with a letter and a digit";
    }
    if (password !== confirmPassword) result.confirmPassword = "Passwords do not match";
    return result;
  };

  const handleRegister = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await register(username.trim(), password, name.trim(), email.trim());
      showAlert("Registration Successful", "Your account has been created. You can sign in now.", [
        {
          text: "OK",
          onPress: () => router.push("/auth/login"),
        },
      ]);
    } catch (error: any) {
      const { message, field } = getApiError(error, "Could not create your account. Please try again.");
      if (field && FIELD_NAMES.includes(field as FieldName)) {
        setErrors({ [field]: message });
      } else {
        showAlert("Registration Failed", message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register - Expense Analyzer</title>
      </Head>
      <LinearGradient
        colors={[colors.backgroundGradient.start, colors.backgroundGradient.end]}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <Ionicons name="wallet" size={60} color={colors.white} />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Start managing your finances today</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={[styles.inputWrapper, errors.name ? styles.inputWrapperError : null]}>
                <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    clearError("name");
                  }}
                  placeholder="Full Name *"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}

              <View style={[styles.inputWrapper, errors.username ? styles.inputWrapperError : null]}>
                <Ionicons name="at-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    clearError("username");
                  }}
                  autoCapitalize="none"
                  placeholder="Username *"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              {errors.username ? <Text style={styles.fieldError}>{errors.username}</Text> : null}

              <View style={[styles.inputWrapper, errors.email ? styles.inputWrapperError : null]}>
                <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError("email");
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="Email *"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}

              <View style={[styles.inputWrapper, errors.password ? styles.inputWrapperError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError("password");
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholder="Password *"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}

              <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputWrapperError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearError("confirmPassword");
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  placeholder="Confirm Password *"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.fieldError}>{errors.confirmPassword}</Text> : null}

              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Password must:</Text>
                {[
                  { met: hasMinLength, text: "Be at least 8 characters long" },
                  { met: hasLetter, text: "Contain a letter" },
                  { met: hasDigit, text: "Contain a digit" },
                ].map((rule) => (
                  <View key={rule.text} style={styles.requirementItem}>
                    <Ionicons
                      name={rule.met ? "checkmark-circle" : "close-circle"}
                      size={16}
                      color={rule.met ? colors.success : colors.textMuted}
                    />
                    <Text style={[styles.requirementText, rule.met && styles.requirementMet]}>{rule.text}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.disabledButton]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By creating an account, you agree to our{" "}
                  <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                    <Text style={styles.termsLink}>View Terms and Conditions</Text>
                  </TouchableOpacity>
                </Text>
              </View>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity style={styles.loginLink} onPress={() => router.push("/auth/login")}>
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <TermsAndConditionsModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: colors.white,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 30,
    padding: 30,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    backgroundColor: colors.background,
  },
  inputWrapperError: {
    borderColor: colors.danger,
    marginBottom: 4,
  },
  fieldError: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 14,
    marginLeft: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.text,
  },
  passwordRequirements: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  requirementText: {
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 8,
  },
  requirementMet: {
    color: colors.success,
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  termsContainer: {
    marginBottom: 20,
  },
  termsText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: colors.textMuted,
    fontSize: 14,
  },
  loginLink: {
    alignItems: "center",
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  loginTextBold: {
    color: colors.primary,
    fontWeight: "bold",
  },
});
