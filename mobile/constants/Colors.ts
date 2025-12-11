// Vibrant Travel App Color Palette
const primaryColor = '#E53935'; // RedBus-like red
const secondaryColor = '#FF6E40'; // Warm orange accent
const accentColor = '#00C853'; // Success green

export default {
  // Primary brand colors
  primary: primaryColor,
  secondary: secondaryColor,
  accent: accentColor,
  
  // Semantic colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  light: {
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    background: '#F8F9FD',
    card: '#FFFFFF',
    border: '#E5E7EB',
    tint: primaryColor,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primaryColor,
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#0F0F23',
    card: '#1A1A2E',
    border: '#374151',
    tint: '#FF6E40',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#FF6E40',
  },
};
