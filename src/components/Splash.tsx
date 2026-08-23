"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";

export default function Splash({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 200);
          return 100;
        }
        return prev + 15;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-white dark:bg-[#111B21] py-12 px-4 transition-all">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-lg shadow-[#25D366]/20 animate-bounce">
          <MessageSquare className="w-12 h-12 text-white fill-white" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-wide">
          WhatsApp
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
          Instant Messaging Platform
        </p>
      </div>

      <div className="w-full max-w-xs flex flex-col items-center gap-4">
        <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#25D366] h-full transition-all duration-150 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
            from
          </span>
          <span className="text-sm font-bold text-[#075E54] dark:text-[#25D366] tracking-wider">
            ULTRA PLATFORM
          </span>
        </div>
      </div>
    </div>
  );
}
