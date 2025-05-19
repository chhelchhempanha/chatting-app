"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [channelName, setChannelName] = useState("");
  const [userName, setUserName] = useState("");

  const rounter = useRouter();

  // Dummy handler for demonstration
  const onCallClick = () => {
    const queryParams = new URLSearchParams({
      channelName,
      userName,
    });
    const url = `/call?${queryParams.toString()}`;

    rounter.push(url);
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <section className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          Video Calling App
        </h1>
        <p className="mb-8 text-center text-gray-600 dark:text-gray-300">
          Welcome to your own video calling app built from scratch!
        </p>
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            onCallClick();
          }}
        >
          <div>
            <label
              htmlFor="channelName"
              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Channel Name
            </label>
            <input
              id="channelName"
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Enter channel name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label
              htmlFor="userName"
              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Username
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Call
          </button>
        </form>
      </section>
    </main>
  );
}
