"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, Plus, Bell, Search, Radio } from "lucide-react";

export default function ChannelsView() {
  const [following, setFollowing] = useState<string[]>(["chan_1"]);

  const sampleChannels = [
    {
      id: "chan_1",
      name: "WhatsApp Official Updates",
      followers: "125M followers",
      about: "Get the latest news, feature updates, and safety tips directly from WhatsApp.",
      verified: true,
      photo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "chan_2",
      name: "TechCrunch Breaking",
      followers: "14.2M followers",
      about: "Silicon Valley, AI breakthroughs, startup funding and gadget reviews.",
      verified: true,
      photo: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "chan_3",
      name: "National Geographic Highlights",
      followers: "45.8M followers",
      about: "Inspiring people to care about the planet through photography and storytelling.",
      verified: true,
      photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=80",
    },
  ];

  const toggleFollow = (id: string) => {
    if (following.includes(id)) {
      setFollowing(following.filter((i) => i !== id));
    } else {
      setFollowing([...following, id]);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#111B21] overflow-y-auto">
      {/* Header Banner */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#075E54] dark:text-[#25D366] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>WhatsApp Channels</span>
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
            Stay updated on topics you care about.
          </p>
        </div>
      </div>

      {/* Subscribed Feed */}
      <div className="p-3 bg-gray-50 dark:bg-[#111B21] text-xs font-bold text-gray-500 uppercase tracking-wider">
        Channels you follow
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {sampleChannels
          .filter((c) => following.includes(c.id))
          .map((c) => (
            <div key={c.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#202C33] cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={c.photo} alt={c.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                      <span>{c.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white" />
                    </h3>
                    <p className="text-xs text-gray-400">{c.followers}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFollow(c.id)}
                  className="text-xs font-bold text-gray-500 border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-full cursor-pointer"
                >
                  Following
                </button>
              </div>

              <div className="mt-3 p-3 bg-gray-50 dark:bg-[#202C33] rounded-2xl text-xs text-gray-700 dark:text-gray-200">
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  📢 Latest Update
                </p>
                <p className="text-gray-600 dark:text-gray-300">{c.about}</p>
              </div>
            </div>
          ))}
      </div>

      {/* Discover Channels */}
      <div className="p-3 bg-gray-50 dark:bg-[#111B21] text-xs font-bold text-gray-500 uppercase tracking-wider mt-2">
        Find Channels to follow
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {sampleChannels
          .filter((c) => !following.includes(c.id))
          .map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#202C33]">
              <div className="flex items-center gap-3">
                <img src={c.photo} alt={c.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                    <span>{c.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-500 text-white" />
                  </h3>
                  <p className="text-xs text-gray-400">{c.followers}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleFollow(c.id)}
                className="text-xs font-bold bg-[#25D366] text-white px-4 py-1.5 rounded-full shadow-sm hover:bg-[#20bd5a] cursor-pointer"
              >
                + Follow
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
