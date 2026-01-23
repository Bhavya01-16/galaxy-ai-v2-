import { currentUser } from "@clerk/nextjs/server";

export default async function SettingsPage() {
  const user = await currentUser();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          {user?.imageUrl && (
            <img
              src={user.imageUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <p className="text-white font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-gray-400 text-sm">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        </div>
      </div>

      {/* API Keys Section (Placeholder) */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">API Keys</h2>
        <p className="text-gray-400 text-sm mb-4">
          Configure your AI provider API keys
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              OpenAI API Key
            </label>
            <input
              type="password"
              placeholder="sk-..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Anthropic API Key
            </label>
            <input
              type="password"
              placeholder="sk-ant-..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              disabled
            />
          </div>
        </div>

        <p className="text-gray-500 text-xs mt-4">
          * API key management will be available in a future update
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-gray-900 border border-red-900/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
        <p className="text-gray-400 text-sm mb-4">
          Irreversible actions for your account
        </p>
        <button
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors text-sm"
          disabled
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
