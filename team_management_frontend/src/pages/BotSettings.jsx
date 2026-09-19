import { useState, useEffect } from 'react';
import { botApi } from '../api/botApi';
import {
  Cog6ToothIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const BotSettings = () => {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [botConfig, setBotConfig] = useState(null);
  const [chatId, setChatId] = useState('');
  const [testMessage, setTestMessage] = useState('Test message from Team Management System');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBotConfig();
  }, []);

  const fetchBotConfig = async () => {
    setLoading(true);
    try {
      const response = await botApi.getBotConfig();
      setBotConfig(response.data);
      // If chat_id exists in config, set it
      if (response.data.chat_id) {
        setChatId(response.data.chat_id);
      }
    } catch (error) {
      console.error('Failed to fetch bot config:', error);
      // Continue even if config fetch fails
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!chatId.trim()) {
      setError('Please enter a Chat ID');
      return;
    }

    if (!testMessage.trim()) {
      setError('Please enter a test message');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');
    try {
      await botApi.sendTestMessage({
        chat_id: chatId.trim(),
        message: testMessage.trim(),
      });
      setSuccess('Test message sent successfully!');
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to send test message. Please try again.';
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bot settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bot Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure and test Telegram bot settings
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {success}
              </p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setSuccess('')}
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setError('')}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <Cog6ToothIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Bot Configuration
          </h2>
        </div>

        {/* Chat ID Field */}
        <div>
          <label
            htmlFor="chatId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Chat ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="chatId"
            value={chatId}
            onChange={(e) => {
              setChatId(e.target.value);
              setError('');
              setSuccess('');
            }}
            placeholder="Enter Telegram Chat ID"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Enter the Telegram Chat ID where test messages should be sent
          </p>
        </div>

        {/* Test Message Field */}
        <div>
          <label
            htmlFor="testMessage"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Test Message
          </label>
          <textarea
            id="testMessage"
            rows={3}
            value={testMessage}
            onChange={(e) => {
              setTestMessage(e.target.value);
              setError('');
              setSuccess('');
            }}
            placeholder="Enter test message"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Test Message Button */}
        <div>
          <button
            onClick={handleSendTestMessage}
            disabled={sending || !chatId.trim() || !testMessage.trim()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="w-5 h-5" />
                <span>Send Test Message</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BotSettings;

