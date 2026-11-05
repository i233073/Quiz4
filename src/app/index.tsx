
import React, { useRef, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';

import { auth } from '@/config/firebase';

export default function HomeScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);

  const recaptchaVerifier =
    useRef<RecaptchaVerifier | null>(null);

  const confirmationResult =
    useRef<ConfirmationResult | null>(null);

  // SEND OTP
  const handleSendOTP = async () => {
    if (Platform.OS !== 'web') {
      setMessage('This implementation is for Expo Web.');
      return;
    }

    const formattedPhone = phoneNumber.replace(/\s/g, '');

    if (!/^\+[1-9]\d{7,14}$/.test(formattedPhone)) {
      setMessage(
        'Enter a valid phone number with country code.'
      );
      return;
    }

    try {
      setLoading(true);
      setMessage('Preparing verification...');

      setOtpSent(false);
      setVerified(false);
      confirmationResult.current = null;

      // Create reCAPTCHA verifier
      if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          {
            size: 'normal',
            callback: () => {
              console.log('reCAPTCHA completed');
            },
            'expired-callback': () => {
              setMessage('reCAPTCHA expired. Please try again.');
            },
          }
        );
      }

      // Send OTP using Firebase
      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier.current
      );

      // Store confirmation result
      confirmationResult.current = result;

      setOtpSent(true);
      setMessage('OTP sent successfully! Check your SMS.');

    } catch (error: any) {
      console.error('OTP Sending Error:', error);

      setMessage(
        error.code
          ? `Failed to send OTP: ${error.code}`
          : error.message || 'Failed to send OTP.'
      );

      recaptchaVerifier.current?.clear();
      recaptchaVerifier.current = null;

    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP
  const handleVerifyOTP = async () => {
    console.log('Verify button clicked');

    if (!confirmationResult.current || !otpSent) {
      setMessage('Please request an OTP first.');
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setMessage('Please enter a valid 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      setMessage('Verifying OTP...');

      // Confirm OTP with Firebase
      const result = await confirmationResult.current.confirm(
        otp.trim()
      );

      if (result.user) {
        setVerified(true);
        setMessage('Phone number verified successfully!');

        console.log('Phone verified successfully!');
        console.log('Firebase User UID:', result.user.uid);
      }

    } catch (error: any) {
      console.error('OTP Verification Error:', error);
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);

      setVerified(false);

      if (error.code === 'auth/invalid-verification-code') {
        setMessage('Incorrect OTP. Please enter the correct code.');
      } else if (
        error.code === 'auth/code-expired' ||
        error.code === 'auth/session-expired'
      ) {
        setMessage('OTP expired. Please request a new OTP.');
        setOtpSent(false);
        confirmationResult.current = null;
      } else {
        setMessage(
          `Verification failed: ${error.code || error.message}`
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Phone Verification
      </Text>

      {/* PHONE NUMBER INPUT */}

      <Text style={styles.label}>
        Enter Phone Number
      </Text>

      <TextInput
        style={styles.input}
        placeholder="+923001234567"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={(value) => {
          setPhoneNumber(value);
          setVerified(false);
          setOtpSent(false);
          confirmationResult.current = null;
          setOtp('');
        }}
        editable={!loading}
      />

      {/* SEND OTP BUTTON */}

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send OTP'}
        </Text>
      </TouchableOpacity>

      {/* OTP INPUT */}

      <Text style={styles.label}>
        Enter OTP
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit OTP"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        editable={otpSent && !verified && !loading}
      />

      {/* VERIFY BUTTON */}

      <TouchableOpacity
        style={[
          styles.button,
          (!otpSent || loading || verified) &&
            styles.disabledButton,
        ]}
        onPress={handleVerifyOTP}
        disabled={!otpSent || loading || verified}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'Verifying...'
            : verified
              ? 'Verified'
              : 'Verify OTP'}
        </Text>
      </TouchableOpacity>

      {/* STATUS MESSAGE */}

      {message !== '' && (
        <Text
          style={[
            styles.message,
            verified && styles.successMessage,
          ]}
        >
          {message}
        </Text>
      )}

      {/* FIREBASE RECAPTCHA */}

      {Platform.OS === 'web' && (
        <View
          nativeID="recaptcha-container"
          style={styles.recaptcha}
        />
      )}

    </View>
  );
}

// STYLES

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#F3F6FF',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 35,
    color: '#16245C',
  },

  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
    color: '#16245C',
  },

  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    backgroundColor: 'white',
    fontSize: 16,
  },

  button: {
    backgroundColor: '#208AEF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 25,
  },

  disabledButton: {
    opacity: 0.55,
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  message: {
    textAlign: 'center',
    color: '#16245C',
    marginTop: 10,
    fontSize: 15,
  },

  successMessage: {
    color: '#16803C',
    fontWeight: 'bold',
  },

  recaptcha: {
    alignItems: 'center',
  },
});
