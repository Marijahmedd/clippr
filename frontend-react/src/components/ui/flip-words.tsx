import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function FlipWords({
    words,
    duration = 3000,
    className,
}: {
    words: string[];
    duration?: number;
    className?: string;
}) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }, duration);

        return () => clearInterval(interval);
    }, [words.length, duration]);

    return (
        <div className="relative inline-block overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentWordIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                        duration: 0.3,
                        ease: "easeInOut"
                    }}
                    className={cn(
                        "inline-block text-white whitespace-nowrap",
                        className
                    )}
                >
                    {words[currentWordIndex]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}