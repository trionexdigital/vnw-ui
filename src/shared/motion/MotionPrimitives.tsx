import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/core/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

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
        transition={{ duration: reduceMotion ? 0 : 0.22, ease }}
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
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduceMotion ? 0 : 0.3, ease }}
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
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.035 } },
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
        visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.24, ease } },
      }}
    >
      {children}
    </motion.div>
  );
}

export { motion, useReducedMotion };
