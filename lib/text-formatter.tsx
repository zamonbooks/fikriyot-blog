import React from 'react';
import { MessageEntity } from '@/types/post';

/**
 * Telegram text entities'ni HTML/React elementlariga transform qilish
 */
export function renderTextWithEntities(
  text: string,
  entities?: MessageEntity[]
): React.ReactNode {
  if (!text) return null;
  
  if (!entities || entities.length === 0) {
    return <div className="whitespace-pre-wrap break-words">{text}</div>;
  }

  // Entities'ni offset bo'yicha sort qilish
  const sortedEntities = [...entities].sort((a, b) => a.offset - b.offset);

  const parts: React.ReactNode[] = [];
  let lastOffset = 0;

  sortedEntities.forEach((entity, index) => {
    // Entity oldidagi oddiy text
    if (entity.offset > lastOffset) {
      const plainText = text.substring(lastOffset, entity.offset);
      parts.push(
        <span key={`text-${index}`} className="whitespace-pre-wrap">
          {plainText}
        </span>
      );
    }

    // Entity text
    const entityText = text.substring(
      entity.offset,
      entity.offset + entity.length
    );

    // Entity type'ga qarab render qilish
    parts.push(renderEntity(entityText, entity, index));

    lastOffset = entity.offset + entity.length;
  });

  // Oxirgi qism
  if (lastOffset < text.length) {
    const remainingText = text.substring(lastOffset);
    parts.push(
      <span key="text-end" className="whitespace-pre-wrap">
        {remainingText}
      </span>
    );
  }

  return <div className="text-content whitespace-pre-wrap break-words">{parts}</div>;
}

/**
 * Bitta entity'ni render qilish
 */
function renderEntity(
  text: string,
  entity: MessageEntity,
  key: number
): React.ReactNode {
  switch (entity.type) {
    case 'bold':
      return (
        <strong key={`bold-${key}`} className="font-bold">
          {text}
        </strong>
      );

    case 'italic':
      return (
        <em key={`italic-${key}`} className="italic">
          {text}
        </em>
      );

    case 'underline':
      return (
        <span key={`underline-${key}`} className="underline">
          {text}
        </span>
      );

    case 'strikethrough':
      return (
        <span key={`strike-${key}`} className="line-through">
          {text}
        </span>
      );

    case 'code':
      return (
        <code
          key={`code-${key}`}
          className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono"
        >
          {text}
        </code>
      );

    case 'pre':
      return (
        <pre
          key={`pre-${key}`}
          className="my-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-x-auto"
        >
          <code className="text-sm font-mono">
            {entity.language && (
              <span className="text-gray-500 text-xs block mb-2">
                {entity.language}
              </span>
            )}
            {text}
          </code>
        </pre>
      );

    case 'text_link':
      return (
        <a
          key={`link-${key}`}
          href={entity.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {text}
        </a>
      );

    case 'url':
      return (
        <a
          key={`url-${key}`}
          href={text}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline break-all"
        >
          {text}
        </a>
      );

    case 'mention':
      return (
        <a
          key={`mention-${key}`}
          href={`https://t.me/${text.substring(1)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {text}
        </a>
      );

    case 'hashtag':
      return (
        <span
          key={`hashtag-${key}`}
          className="text-blue-600 dark:text-blue-400 font-medium"
        >
          {text}
        </span>
      );

    case 'spoiler':
      return (
        <span
          key={`spoiler-${key}`}
          className="bg-gray-400 dark:bg-gray-600 hover:bg-transparent transition-colors cursor-pointer select-none"
          title="Spoiler - bosing ko'rish uchun"
        >
          {text}
        </span>
      );

    default:
      return (
        <span key={`default-${key}`} className="whitespace-pre-wrap">
          {text}
        </span>
      );
  }
}

/**
 * Text'ni sanitize qilish (XSS himoyasi)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
