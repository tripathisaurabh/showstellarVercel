export type ShowStellarFeedbackState = 'loading' | 'success' | 'signup' | 'verification' | 'error' | 'lost'

type ShowStellarFeedbackConfig = {
  alt: string
  animationClass: string
  asset: string
  eyebrow: string
}

export const SHOWSTELLAR_FEEDBACK: Record<ShowStellarFeedbackState, ShowStellarFeedbackConfig> = {
  loading: {
    alt: 'ShowStellar loading star',
    animationClass: 'animate-[showstellar-float_3s_ease-in-out_infinite]',
    asset: '/illustrations/feedback/loading-star.svg',
    eyebrow: 'Getting the stage ready',
  },
  success: {
    alt: 'ShowStellar success star',
    animationClass: 'animate-[showstellar-celebrate_3.8s_ease-in-out_infinite]',
    asset: '/illustrations/feedback/success-star.svg',
    eyebrow: 'Inquiry sent successfully',
  },
  signup: {
    alt: 'ShowStellar artist signup star',
    animationClass: 'animate-[showstellar-celebrate_4.2s_ease-in-out_infinite]',
    asset: '/illustrations/feedback/signup-star.svg',
    eyebrow: 'Artist profile created successfully',
  },
  verification: {
    alt: 'ShowStellar verification star',
    animationClass: 'animate-[showstellar-drift_4.5s_ease-in-out_infinite]',
    asset: '/illustrations/feedback/verification-star.svg',
    eyebrow: 'Check your inbox',
  },
  error: {
    alt: 'ShowStellar error star',
    animationClass: 'animate-[showstellar-wobble_3.8s_ease-in-out_infinite]',
    asset: '/illustrations/feedback/error-star.svg',
    eyebrow: 'A problem occurred',
  },
  lost: {
    alt: 'ShowStellar lost star',
    animationClass: 'animate-[showstellar-drift_4.8s_ease-in-out_infinite]',
    asset: '/illustrations/feedback/lost-star.svg',
    eyebrow: 'This page missed the stage',
  },
}

