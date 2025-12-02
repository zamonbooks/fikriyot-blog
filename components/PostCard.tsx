'use client';

import { useState } from 'react';
import { Post } from '@/types/post';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';
import { renderTextWithEntities } from '@/lib/text-formatter';
import MediaLightbox from './MediaLightbox';
import AudioPlayer from './AudioPlayer';

interface PostCardProps {
  post: Post;
  priority?: boolean;
}

function getHighQualityCloudinaryUrl(url: string): string {
  if (!url.includes('cloudinary.com')) return url;
  
  // Insert quality parameters before /upload/
  return url.replace(
    '/upload/',
    '/upload/q_auto:best,f_auto/'
  );
}

export default function PostCard({ post, priority = false }: PostCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState<'image' | 'video'>('image');
  const [lightboxUrls, setLightboxUrls] = useState<string[]>([]);
  const postUrl = `https://t.me/${post.channelUsername}/${post.postId}`;
  
  const relativeTime = formatDistanceToNow(new Date(post.date), {
    addSuffix: true,
    locale: uz,
  });

  // Debug: Log media groups
  if (post.media?.mediaGroup && post.media.mediaGroup.length > 1) {
    console.log(`Post ${post.postId} has ${post.media.mediaGroup.length} images in media group`);
  }

  return (
    <article className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all duration-300">
      {/* Media Section */}
      {post.media && (
        <div className="relative w-full">
          {post.media.type === 'photo' && (
            <>
              {/* Check if photo has media group (multiple images) */}
              {post.media.mediaGroup && post.media.mediaGroup.length > 1 ? (
                <div className="grid grid-cols-2 gap-1">
                  {post.media.mediaGroup.map((imageUrl: string, index: number) => (
                    <div 
                      key={index} 
                      className="relative w-full aspect-square cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => {
                        setLightboxType('image');
                        setLightboxUrls(post.media!.mediaGroup!);
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      <Image
                        src={getHighQualityCloudinaryUrl(imageUrl)}
                        alt={`${post.media?.caption || 'Post image'} ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={priority && index < 4}
                        quality={100}
                        unoptimized={imageUrl.includes('cloudinary.com')}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 400px"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Single image */
                <div 
                  className="relative w-full cursor-pointer hover:opacity-95 transition-opacity" 
                  style={{ aspectRatio: `${post.media?.width || 16}/${post.media?.height || 9}` }}
                  onClick={() => {
                    const imageUrl = (post.media as any)?.cloudinaryUrl || post.media?.url;
                    setLightboxType('image');
                    setLightboxUrls([imageUrl]);
                    setLightboxIndex(0);
                    setLightboxOpen(true);
                  }}
                >
                  <Image
                    src={getHighQualityCloudinaryUrl((post.media as any).cloudinaryUrl || post.media.url)}
                    alt={post.media.caption || 'Post image'}
                    fill
                    className="object-cover"
                    priority={priority}
                    quality={100}
                    unoptimized={((post.media as any).cloudinaryUrl || post.media.url).includes('cloudinary.com')}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                  />
                </div>
              )}
            </>
          )}
          
          {post.media.type === 'video' && (
            <div className="relative w-full bg-black">
              {(post.media as any).cloudinaryUrl || (post.media as any).videoUrl ? (
                <div className="space-y-2">
                  {/* Check if video has multiple parts */}
                  {(post.media as any).videoParts && (post.media as any).videoParts.length > 1 ? (
                    <>
                      {/* Multi-part video */}
                      {(post.media as any).videoParts.map((videoUrl: string, index: number) => (
                        <div 
                          key={index} 
                          className="relative cursor-pointer group"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLightboxType('video');
                            setLightboxUrls((post.media as any).videoParts);
                            setLightboxIndex(index);
                            setLightboxOpen(true);
                          }}
                        >
                          <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/70 text-white text-sm rounded-full font-medium">
                            Qism {index + 1}/{(post.media as any).videoParts.length}
                          </div>
                          {/* Thumbnail with play button */}
                          <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                            <video
                              src={videoUrl}
                              poster={index === 0 ? post.media?.url : undefined}
                              className="w-full h-full object-cover"
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    /* Single video */
                    <div 
                      className="relative cursor-pointer group"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const videoUrl = (post.media as any).cloudinaryUrl || (post.media as any).videoUrl;
                        setLightboxType('video');
                        setLightboxUrls([videoUrl]);
                        setLightboxIndex(0);
                        setLightboxOpen(true);
                      }}
                    >
                      {/* Thumbnail with play button */}
                      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                        <video
                          src={(post.media as any).cloudinaryUrl || (post.media as any).videoUrl}
                          poster={post.media.url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-10 h-10 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                  {post.media.url && (
                    <img
                      src={post.media.url}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <a
                      href={postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white font-medium text-sm transition-all hover:scale-105"
                    >
                      Telegram'da ko'rish
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {post.media.type === 'document' && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg border border-blue-100 dark:border-gray-600">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">📄 Hujjat</p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate mb-2">
                    {post.media.fileName || 'Fayl'}
                  </p>
                  {post.media.fileSize && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Hajmi: {(post.media.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.326.016.094.036.308.02.475z"/>
                    </svg>
                    Telegram'da yuklab olish
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Unsupported media types */}
          {post.media && !['photo', 'video', 'audio', 'voice', 'document'].includes(post.media.type) && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {post.media.type === 'sticker' && '🎨 Stiker'}
                    {post.media.type === 'animation' && '🎬 Animatsiya'}
                    {post.media.type === 'poll' && '📊 So\'rovnoma'}
                    {post.media.type === 'location' && '📍 Joylashuv'}
                    {post.media.type === 'contact' && '👤 Kontakt'}
                    {!['sticker', 'animation', 'poll', 'location', 'contact'].includes(post.media.type) && '📎 Media'}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white mb-3">
                    Ushbu media turi saytda ko'rsatilmaydi
                  </p>
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.326.016.094.036.308.02.475z"/>
                    </svg>
                    Telegram'da ko'rish
                  </a>
                </div>
              </div>
            </div>
          )}

          {(post.media.type === 'audio' || post.media.type === 'voice') && (
            <div className="p-4">
              <AudioPlayer
                src={(post.media as any).cloudinaryUrl || post.media.url}
                type={post.media.type}
                title={post.media.title}
                performer={post.media.performer}
                duration={post.media.duration}
                waveform={post.media.waveform}
              />
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-6">
        {/* Post Text */}
        {post.text && (
          <div className="prose prose-lg dark:prose-invert max-w-none mb-4 whitespace-pre-wrap">
            {renderTextWithEntities(post.text, post.entities)}
          </div>
        )}

        {/* Media Caption */}
        {post.media?.caption && post.media.caption !== post.text && (
          <div className="text-gray-600 dark:text-gray-400 italic mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {post.media.caption}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Forwarded info */}
          {post.forwardedFrom && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span>Uzatilgan:</span>
              {post.forwardedFromUrl ? (
                <a 
                  href={post.forwardedFromUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {post.forwardedFrom}
                </a>
              ) : (
                <span className="font-medium">{post.forwardedFrom}</span>
              )}
            </div>
          )}
          
          {/* Date and stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <time 
                dateTime={post.date} 
                title={new Date(post.date).toLocaleString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                className="flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(post.date).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })} • {new Date(post.date).toLocaleTimeString('uz-UZ', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
              
              {post.views && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {post.views.toLocaleString('uz-UZ')}
                </span>
              )}
            </div>

            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.326.016.094.036.308.02.475z"/>
              </svg>
              Telegramda ko'rish
            </a>
          </div>
        </div>
      </div>

      {/* Media Lightbox */}
      <MediaLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        mediaType={lightboxType}
        mediaUrls={lightboxUrls}
        currentIndex={lightboxIndex}
        onNavigate={setLightboxIndex}
        caption={post.media?.caption}
      />
    </article>
  );
}
