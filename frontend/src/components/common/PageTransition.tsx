import type { PropsWithChildren } from 'react';

import { motion } from 'framer-motion';

export const PageTransition = ({ children }: PropsWithChildren) => {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};