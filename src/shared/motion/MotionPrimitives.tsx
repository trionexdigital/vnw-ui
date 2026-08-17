import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/core/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;
const canUseViewportMotion = import.meta.env.MODE !== 'test' && typeof IntersectionObserver !== 'undefined';

export const motionEase = ease;
export const revealViewport = { once: true, amount: 0.12 } as const;
export const revealVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export function MotionPage({
  children,
  routeKey,
  className,
}: {
  children: ReactNode;
  routeKey: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        className={className}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function MotionSection({
  children,
  className,
  ...props
}: HTMLMotionProps<'section'> & { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className={className}
      initial={reduceMotion || !canUseViewportMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={revealViewport}
      transition={{ duration: reduceMotion ? 0 : 0.42, ease }}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function MotionGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion || !canUseViewportMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.055 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionGridItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn('min-w-0', className)}
      variants={{
        hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.36, ease } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion || !canUseViewportMotion ? false : revealVariants.hidden}
      whileInView={revealVariants.visible}
      viewport={revealViewport}
      transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({
  children,
  className,
  ...props
}: HTMLMotionProps<'article'> & { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className={className}
      variants={{
        hidden: reduceMotion ? { opacity: 1 } : revealVariants.hidden,
        visible: { ...revealVariants.visible, transition: { duration: reduceMotion ? 0 : 0.38, ease } },
      }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.72 }}
      {...props}
    >
      {children}
    </motion.article>
  );
}

export { motion, useReducedMotion };
