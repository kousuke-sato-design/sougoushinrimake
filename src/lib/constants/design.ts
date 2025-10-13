// 統一デザインシステム定数

export const COLORS = {
	primary: 'blue-600',
	primaryHover: 'blue-700',
	secondary: 'indigo-600',
	secondaryHover: 'indigo-700',
	accent: 'blue-500',
	background: 'gray-50',
	surface: 'white',
	text: 'gray-800',
	textSecondary: 'gray-600',
	textLight: 'gray-500',
	border: 'gray-200',
	borderHover: 'gray-300'
} as const;

export const GRADIENTS = {
	primary: 'from-blue-600 to-indigo-600',
	primaryHover: 'from-blue-700 to-indigo-700',
	background: 'from-blue-50 to-indigo-100'
} as const;

export const SHADOWS = {
	sm: 'shadow-sm',
	md: 'shadow',
	lg: 'shadow-lg',
	xl: 'shadow-xl'
} as const;

export const SPACING = {
	section: 'py-16 md:py-24',
	container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
} as const;

export const TYPOGRAPHY = {
	h1: 'text-4xl md:text-5xl lg:text-6xl font-bold',
	h2: 'text-3xl md:text-4xl lg:text-5xl font-bold',
	h3: 'text-2xl md:text-3xl font-semibold',
	h4: 'text-xl md:text-2xl font-semibold',
	body: 'text-base md:text-lg',
	small: 'text-sm'
} as const;

export const BUTTONS = {
	primary: `px-8 py-3 bg-${COLORS.primary} text-white rounded-lg font-semibold hover:bg-${COLORS.primaryHover} transition`,
	secondary: `px-8 py-3 bg-${COLORS.secondary} text-white rounded-lg font-semibold hover:bg-${COLORS.secondaryHover} transition`,
	outline: `px-8 py-3 border-2 border-${COLORS.primary} text-${COLORS.primary} rounded-lg font-semibold hover:bg-${COLORS.primary} hover:text-white transition`
} as const;
