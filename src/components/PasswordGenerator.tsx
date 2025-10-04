'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PasswordGeneratorOptions } from '@/types';
import { generatePassword, getDefaultPasswordOptions, estimatePasswordStrength } from '@/lib/passwordGenerator';
import { copyWithAutoClear } from '@/lib/clipboard';
import { cn } from '@/lib/utils';
import Button from './ui/Button';
import Input from './ui/Input';
import { Copy, RefreshCw, Check } from 'lucide-react';

interface PasswordGeneratorProps {
  onPasswordGenerated?: (password: string) => void;
  className?: string;
}

export default function PasswordGenerator({ onPasswordGenerated, className }: PasswordGeneratorProps) {
  const [options, setOptions] = useState<PasswordGeneratorOptions>(getDefaultPasswordOptions());
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Memoize the password generation to avoid infinite re-renders
  const generateNewPassword = useCallback(() => {
    const password = generatePassword(options);
    setGeneratedPassword(password);
    onPasswordGenerated?.(password);
  }, [options, onPasswordGenerated]);

  // Generate password on mount and when options change
  useEffect(() => {
    generateNewPassword();
  }, [generateNewPassword]);

  const handleOptionChange = (key: keyof PasswordGeneratorOptions, value: boolean | number) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const length = parseInt(e.target.value);
    if (length >= 4 && length <= 128) {
      handleOptionChange('length', length);
    }
  };

  const regeneratePassword = () => {
    generateNewPassword();
  };

  const handleCopy = async () => {
    const success = await copyWithAutoClear(generatedPassword, 15000);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const strength = estimatePasswordStrength(generatedPassword);

  return (
    <div className={cn('space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Password Generator</h3>
          <Button
            onClick={regeneratePassword}
            variant="ghost"
            size="icon"
            title="Generate new password"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Generated Password Display */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              value={generatedPassword}
              readOnly
              className="font-mono text-sm"
              placeholder="Generated password will appear here"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
              title="Copy password (auto-clears in 15s)"
            >
              {copySuccess ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Password Strength Indicator */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Strength:</span>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'h-2 w-6 rounded-sm',
                      level <= strength.score
                        ? strength.score <= 1
                          ? 'bg-red-500'
                          : strength.score <= 2
                          ? 'bg-yellow-500'
                          : strength.score <= 3
                          ? 'bg-blue-500'
                          : 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-600'
                    )}
                  />
                ))}
              </div>
              <span className={cn(
                'font-medium',
                strength.score <= 1 ? 'text-red-500' :
                strength.score <= 2 ? 'text-yellow-500' :
                strength.score <= 3 ? 'text-blue-500' : 'text-green-500'
              )}>
                {strength.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Options */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        {/* Length Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Length
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {options.length} characters
            </span>
          </div>
          <input
            type="range"
            min="4"
            max="128"
            value={options.length}
            onChange={handleLengthChange}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Character Type Checkboxes */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeUppercase}
              onChange={(e) => handleOptionChange('includeUppercase', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Uppercase (A-Z)</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeLowercase}
              onChange={(e) => handleOptionChange('includeLowercase', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Lowercase (a-z)</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeNumbers}
              onChange={(e) => handleOptionChange('includeNumbers', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Numbers (0-9)</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeSymbols}
              onChange={(e) => handleOptionChange('includeSymbols', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Symbols (!@#$)</span>
          </label>
        </div>

        {/* Exclude Similar Characters */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.excludeSimilar}
            onChange={(e) => handleOptionChange('excludeSimilar', e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Exclude similar characters (i, l, 1, L, o, 0, O)
          </span>
        </label>
      </div>
    </div>
  );
}