import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp, resetPassword } from '../lib/auth.js';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const DISPLAY_NAME_REGEX = /^[a-zA-Z\s'\-]+$/;
const SPECIAL_CHAR_REGEX = /[@$!%*?&]/;

function validateSignIn(email, password) {
  const errs = {};
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    errs.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errs.email = 'Enter a valid email address.';
  }
  if (!password) {
    errs.password = 'Password is required.';
  }
  return errs;
}

function validateCreate(email, password, confirmPassword, displayName) {
  const errs = {};
  const trimmedEmail = email.trim();
  const trimmedName = displayName.trim();

  if (!trimmedEmail) {
    errs.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errs.email = 'Enter a valid email address.';
  }

  if (!trimmedName) {
    errs.displayName = 'Name is required.';
  } else if (trimmedName.length < 2) {
    errs.displayName = 'Name must be at least 2 characters.';
  } else if (trimmedName.length > 50) {
    errs.displayName = 'Name is too long.';
  } else if (!DISPLAY_NAME_REGEX.test(trimmedName)) {
    errs.displayName = 'Name can only contain letters, spaces, hyphens, and apostrophes.';
  }

  if (!password) {
    errs.password = 'Password is required.';
  } else if (password.length < 8) {
    errs.password = 'Minimum 8 characters.';
  } else if (!/[A-Z]/.test(password)) {
    errs.password = 'Include an uppercase letter.';
  } else if (!/[0-9]/.test(password)) {
    errs.password = 'Include a number.';
  } else if (!SPECIAL_CHAR_REGEX.test(password)) {
    errs.password = 'Include a special character.';
  }

  if (!confirmPassword) {
    errs.confirmPassword = 'Please confirm your password.';
  } else if (password !== confirmPassword) {
    errs.confirmPassword = 'Passwords do not match.';
  }

  return errs;
}

function validateForgot(email) {
  const errs = {};
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    errs.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errs.email = 'Enter a valid email address.';
  }
  return errs;
}

export function useLoginForm() {
  const [activeTab, setActiveTab] = useState('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();

  function handleTabChange(tab) {
    setActiveTab(tab);
    setErrors({});
    setIsSuccess(false);
    setForgotSent(false);
    setFormData({ email: '', password: '', displayName: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: null }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    let validationErrors = {};
    if (activeTab === 'signin') {
      validationErrors = validateSignIn(formData.email, formData.password);
    } else if (activeTab === 'create') {
      validationErrors = validateCreate(
        formData.email,
        formData.password,
        formData.confirmPassword,
        formData.displayName
      );
    } else if (activeTab === 'forgot') {
      validationErrors = validateForgot(formData.email);
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (activeTab === 'signin') {
        await signIn(formData.email.trim(), formData.password);
        setIsSuccess(true);
        setTimeout(() => navigate('/dashboard'), 900);
      } else if (activeTab === 'create') {
        await signUp(formData.email.trim(), formData.password, formData.displayName.trim());
        setIsSuccess(true);
        setTimeout(() => navigate('/dashboard'), 900);
      } else if (activeTab === 'forgot') {
        await resetPassword(formData.email.trim());
        setForgotSent(true);
      }
    } catch (err) {
      const message = err?.message || 'An error occurred. Please try again.';
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  }

  return {
    activeTab,
    handleTabChange,
    formData,
    handleChange,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isLoading,
    errors,
    isSuccess,
    forgotSent,
    handleSubmit,
  };
}
