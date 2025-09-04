"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface AnimatedButtonProps {
  href?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const AnimatedButton = ({
  href,
  children,
  className = "",
  onClick,
}: AnimatedButtonProps) => {
  const content = (
    <motion.div
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        boxShadow: [
          "0 0 0 rgba(59, 130, 246, 0)",
          "0 0 8px rgba(59, 130, 246, 0.4)",
          "0 0 0 rgba(59, 130, 246, 0)",
        ],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {href ? (
        <Link
          href={href}
          className="flex items-center justify-center w-full h-full"
          onClick={onClick}
        >
          {children}
        </Link>
      ) : (
        <button
          type="button"
          className="flex items-center justify-center w-full h-full"
          onClick={onClick}
        >
          {children}
        </button>
      )}
    </motion.div>
  );

  return content;
};
