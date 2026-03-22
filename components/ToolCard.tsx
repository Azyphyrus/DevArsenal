'use client'
import React from "react";
import { IconType } from "react-icons";
import { useRouter } from 'next/navigation'

interface ToolCardProps {
  icon: IconType;
  title: string;
  description: string;
  onClick?: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon: Icon, title, description }) => {
    const router = useRouter();
    const urlTitle = title.replace(/\s+/g, '_');
  return (
    <div className="relative bg-[#222222] border border-[#333333] rounded-xl p-5 h-40 hover:border-[#444444] hover:shadow-xl transition-all duration-250 cursor-pointer group"
    onClick={() => router.push('/' + urlTitle)}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Icon className="text-xl text-white" />
        </div>
      </div>
      <h3 className="text-base font-semibold mb-2 truncate">{title}</h3>
      <p className="text-sm text-[#888888] line-clamp-2">{description}</p>
    </div>
  );
};

export default ToolCard;