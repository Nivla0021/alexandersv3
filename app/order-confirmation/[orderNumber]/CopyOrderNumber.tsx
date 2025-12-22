'use client';

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CopyOrderNumberProps {
  orderNumber?: string;
}

export default function CopyOrderNumber({ orderNumber }: CopyOrderNumberProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      toast.success("Order number copied!");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-amber-100 transition-colors"
      aria-label="Copy order number"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 text-amber-600" />
      )}
    </button>
  );
}
