/**
 * app.config.ts — Central application configuration for VIP Number World.
 */

export const APP_CONFIG = {
  /** Short brand name. */
  name: 'VIP Number World',

  /** Full name shown in the browser tab. */
  fullName: 'VIP Number World — Premium VIP Numbers Marketplace',

  /** Tagline. */
  tagline: 'Your Number. Your Identity.',

  /** One-line description. */
  description:
    'Buy & sell premium VIP, fancy and lucky mobile numbers. Handpicked, genuine and securely transferred.',

  /** Primary brand colour (gold). */
  themeColor: '#D4AF37',

  /** Page background. */
  backgroundColor: '#0a0a0a',

  /** Currency. */
  currency: 'INR',
  currencySymbol: '₹',

  /** Support contact (overridable via admin settings). */
  contactEmail: 'support@vipnumberworld.com',
  contactPhone: '+91 90000 00000',
  whatsapp: '919000000000',

  version: '1.0.0',
} as const;
