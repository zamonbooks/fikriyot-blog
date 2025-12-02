/**
 * Aqlli scraping - kattaroq son bilan va duplikatlarni chiqarish
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { PostInput } from '../types/post';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME!;

interface ScrapedPost extends PostInput {
    textHash: string; // Matn hash'i duplikatlarni aniqlash uchun
}

// Matnni hash qilish (oddiy hash funksiyasi)
function simpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit integer'ga aylantirish
    }
    return Math.abs(hash).toString(36);
}

// Matnlarni taqqoslash (o'xshashlik foizi)
function textSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    if (words1.length === 0 && words2.length === 0) return 1;
    if (words1.length === 0 || words2.length === 0) return 0;

    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));

    return intersection.size / Math.max(set1.size, set2.size);
}

async function scrapeSmartPosts() {
    try {
        console.log('🔍 Aqlli scraping boshlandi...');
        console.log(`Channel: @${CHANNEL_USERNAME}`);
        console.log('Post ID range: 1 dan 1000 gacha\n');

        const allPosts: ScrapedPost[] = [];
        let foundCount = 0;
        let checkedCount = 0;
        let duplicateCount = 0;

        // 1 dan 1200 gacha barcha ID'larni tekshirish (yangi postlar uchun)
        for (let postId = 1; postId <= 1200; postId++) {
            try {
                checkedCount++;

                const postUrl = `https://t.me/s/${CHANNEL_USERNAME}/${postId}`;

                const response = await axios.get(postUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    timeout: 8000
                });

                const $ = cheerio.load(response.data);
                const messageElement = $('.tgme_widget_message').first();

                if (messageElement.length > 0) {
                    // Post matnini olish
                    const textElement = messageElement.find('.tgme_widget_message_text');
                    let text = '';

                    if (textElement.length > 0) {
                        text = textElement.text().trim();
                    }

                    // Agar matn bo'sh bo'lsa, skip qilish
                    if (!text || text.length < 10) {
                        continue;
                    }

                    // Sana va vaqtni olish
                    const dateElement = messageElement.find('.tgme_widget_message_date time');
                    const datetime = dateElement.attr('datetime');

                    if (datetime) {
                        const date = new Date(datetime);
                        const timestamp = Math.floor(date.getTime() / 1000);

                        // Media borligini tekshirish
                        const hasPhoto = messageElement.find('.tgme_widget_message_photo').length > 0;
                        const hasVideo = messageElement.find('.tgme_widget_message_video').length > 0;
                        const hasDocument = messageElement.find('.tgme_widget_message_document').length > 0;
                        const hasMedia = hasPhoto || hasVideo || hasDocument;

                        const textHash = simpleHash(text);

                        const post: ScrapedPost = {
                            channelUsername: CHANNEL_USERNAME,
                            postId: postId,
                            date: date.toISOString(),
                            timestamp: timestamp,
                            text: text,
                            hasMedia: hasMedia,
                            textHash: textHash,
                        };

                        allPosts.push(post);
                        foundCount++;

                        console.log(`✓ Post ${postId} found:`);
                        console.log(`  Date: ${date.toLocaleDateString()}`);
                        console.log(`  Text: ${text.substring(0, 60)}${text.length > 60 ? '...' : ''}`);
                        console.log(`  Hash: ${textHash}`);
                        console.log('');
                    }
                }

                // Progress ko'rsatish
                if (checkedCount % 100 === 0) {
                    console.log(`📊 Progress: ${checkedCount}/1200 checked, ${foundCount} posts found`);
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 50));

            } catch (error: any) {
                if (error.response?.status === 404) {
                    continue;
                } else if (error.code === 'ECONNABORTED') {
                    console.log(`⏱ Timeout for post ${postId}, skipping...`);
                    continue;
                } else {
                    console.log(`? Error checking post ${postId}: ${error.message}`);
                }
            }
        }

        console.log(`\n🔍 Duplikatlarni aniqlash va chiqarish...`);

        // Duplikatlarni aniqlash va eng kech yuklangani saqlash
        const postGroups = new Map<string, ScrapedPost[]>();
        const duplicates: { kept: number, removed: number[], similarity: number }[] = [];

        // Postlarni matn bo'yicha guruhlash
        for (const post of allPosts) {
            let foundGroup = false;

            for (const [groupKey, groupPosts] of postGroups) {
                const firstInGroup = groupPosts[0];

                // Hash bo'yicha yoki matn o'xshashligi bo'yicha tekshirish
                const isExactMatch = post.textHash === firstInGroup.textHash;
                const similarity = textSimilarity(post.text, firstInGroup.text);
                const isSimilar = similarity > 0.85;

                if (isExactMatch || isSimilar) {
                    groupPosts.push(post);
                    foundGroup = true;
                    break;
                }
            }

            if (!foundGroup) {
                postGroups.set(post.textHash, [post]);
            }
        }

        // Har bir guruhdan eng kech yuklangani (eng katta postId) saqlash
        const uniquePosts: ScrapedPost[] = [];

        for (const [groupKey, groupPosts] of postGroups) {
            if (groupPosts.length === 1) {
                // Yagona post - duplikat emas
                uniquePosts.push(groupPosts[0]);
            } else {
                // Bir necha post - eng kech yuklangani saqlash
                // Avval sana bo'yicha, keyin postId bo'yicha tartiblash
                groupPosts.sort((a, b) => {
                    const dateA = new Date(a.date).toDateString();
                    const dateB = new Date(b.date).toDateString();

                    if (dateA === dateB) {
                        // Bir kunda yuklangan bo'lsa, eng katta postId (eng kech)
                        return b.postId - a.postId;
                    } else {
                        // Turli kunlarda bo'lsa, eng kech sana
                        return b.timestamp - a.timestamp;
                    }
                });

                const keptPost = groupPosts[0]; // Eng kech yuklangan
                const removedPosts = groupPosts.slice(1); // Qolganlar

                uniquePosts.push(keptPost);
                duplicateCount += removedPosts.length;

                duplicates.push({
                    kept: keptPost.postId,
                    removed: removedPosts.map(p => p.postId),
                    similarity: 1.0
                });
            }
        }

        console.log(`\n🎉 Scraping yakunlandi!`);
        console.log(`📊 Statistika:`);
        console.log(`  - Tekshirildi: ${checkedCount}`);
        console.log(`  - Topildi: ${foundCount}`);
        console.log(`  - Duplikatlar: ${duplicateCount}`);
        console.log(`  - Noyob postlar: ${uniquePosts.length}`);

        if (duplicates.length > 0) {
            console.log(`\n🔄 Duplikatlar (eng kech yuklangan saqlandi):`);
            duplicates.forEach(dup => {
                console.log(`  ✅ Saqlandi: Post ${dup.kept}`);
                console.log(`  ❌ O'chirildi: Post ${dup.removed.join(', ')}`);
                console.log('');
            });
        }

        if (uniquePosts.length === 0) {
            console.log('❌ Hech qanday noyob post topilmadi!');
            return;
        }

        // Posts'ni timestamp bo'yicha tartiblash (eng yangi birinchi)
        uniquePosts.sort((a, b) => b.timestamp - a.timestamp);

        // JSON faylga saqlash
        const jsonData = {
            posts: uniquePosts.map((post, index) => ({
                id: (index + 1).toString(),
                channelUsername: post.channelUsername,
                postId: post.postId,
                date: post.date,
                timestamp: post.timestamp,
                text: post.text,
                hasMedia: post.hasMedia,
                createdAt: post.date,
            })),
            lastSync: new Date().toISOString(),
            totalFound: uniquePosts.length,
            duplicatesRemoved: duplicateCount,
            scrapingRange: '1-1200',
        };

        const jsonPath = path.resolve(__dirname, '../data/posts.json');
        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
        console.log(`✅ ${uniquePosts.length} ta noyob post saqlandi: ${jsonPath}`);

        console.log(`\n📈 Yakuniy statistika:`);
        console.log(`  - Noyob postlar: ${uniquePosts.length}`);
        console.log(`  - Media bilan: ${uniquePosts.filter(p => p.hasMedia).length}`);
        console.log(`  - Faqat matn: ${uniquePosts.filter(p => !p.hasMedia).length}`);
        console.log(`  - Sana oralig'i: ${new Date(Math.min(...uniquePosts.map(p => p.timestamp * 1000))).toLocaleDateString()} - ${new Date(Math.max(...uniquePosts.map(p => p.timestamp * 1000))).toLocaleDateString()}`);

    } catch (error: any) {
        console.error('❌ Scraping xatosi:', error.message);
    }
}

scrapeSmartPosts()
    .then(() => {
        console.log('\n✅ Aqlli scraping yakunlandi');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });