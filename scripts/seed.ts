import { createHash } from "node:crypto";

import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import mongoose, { Types } from "mongoose";

import { AIAnalysis, AIJob } from "../models/AI";
import { Comment } from "../models/Comment";
import { Conversation, ConversationMember, Message } from "../models/Conversation";
import { Follow } from "../models/Follow";
import {
  ImprovementDiscussionMessage,
  ImprovementRequest,
} from "../models/ImprovementRequest";
import { Like, Rating, Reaction, Save } from "../models/Interaction";
import { Block, ModerationAction, Report } from "../models/Moderation";
import { Notification } from "../models/Notification";
import { NewsArticle } from "../models/NewsArticle";
import { Prompt } from "../models/Prompt";
import { PromptVersion } from "../models/PromptVersion";
import { RateLimit } from "../models/RateLimit";
import {
  Achievement,
  ReputationEvent,
  UserAchievement,
} from "../models/Reputation";
import { Session } from "../models/Session";
import { Skill } from "../models/Skill";
import { SkillVersion } from "../models/SkillVersion";
import { User } from "../models/User";
import { DEFAULT_MONGODB_URI } from "../lib/db/config";

loadEnvConfig(process.cwd());

type SeedDocument = {
  _id: Types.ObjectId;
  createdAt?: Date;
  [key: string]: unknown;
};

const id = (key: string) =>
  new Types.ObjectId(createHash("sha256").update(`proai-seed:${key}`).digest("hex").slice(0, 24));
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const DEVELOPMENT_SEED_PASSWORD = "ProAI-Dev-1405!";

function getSeedSafety(): {
  isDevelopment: boolean;
  password: string;
  seedPrivilegedDemoUser: boolean;
} {
  // `npm run seed` intentionally treats an unset NODE_ENV as local development.
  // Any explicitly production-like environment must opt in and supply a unique
  // password before the script can connect to MongoDB or mutate data.
  const runtimeEnvironment = process.env.NODE_ENV?.trim() || "development";
  const isDevelopment = runtimeEnvironment === "development";
  const password = process.env.SEED_DEFAULT_PASSWORD || DEVELOPMENT_SEED_PASSWORD;

  if (!isDevelopment) {
    if (process.env.ALLOW_NON_DEVELOPMENT_SEED !== "true") {
      throw new Error(
        `Refusing to seed demo data with NODE_ENV=${runtimeEnvironment}. ` +
          "Set ALLOW_NON_DEVELOPMENT_SEED=true only for an intentional non-production demo environment.",
      );
    }

    if (
      !process.env.SEED_DEFAULT_PASSWORD ||
      password === DEVELOPMENT_SEED_PASSWORD ||
      password.length < 16
    ) {
      throw new Error(
        "Non-development seeding requires an explicit, unique SEED_DEFAULT_PASSWORD of at least 16 characters.",
      );
    }
  }

  return {
    isDevelopment,
    password,
    seedPrivilegedDemoUser:
      isDevelopment || process.env.SEED_ENABLE_PRIVILEGED_DEMO_USER === "true",
  };
}

async function upsertDocuments(
  collectionName: string,
  documents: SeedDocument[],
): Promise<void> {
  if (documents.length === 0) return;

  const updatedAt = new Date();
  const operations = documents.map((document) => {
    const { _id, createdAt = updatedAt, ...fields } = document;
    return {
      updateOne: {
        filter: { _id },
        update: {
          $set: { ...fields, updatedAt },
          $setOnInsert: { _id, createdAt },
        },
        upsert: true,
      },
    };
  });

  await mongoose.connection.collection(collectionName).bulkWrite(operations, {
    ordered: true,
  });
}

async function seed(): Promise<void> {
  const { isDevelopment, password, seedPrivilegedDemoUser } = getSeedSafety();
  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  await mongoose.connect(mongoUri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5_000,
  });

  // Reconcile the pre-MVP prompt-only save index before inserting polymorphic saves.
  // This preserves existing documents while allowing prompt and skill saves to coexist.
  await Save.syncIndexes();

  const passwordHash = await bcrypt.hash(password, 10);

  const users = {
    architect: id("user:architect"),
    builder: id("user:builder"),
    researcher: id("user:researcher"),
    moderator: id("user:moderator"),
  };
  const prompts = {
    architect: id("prompt:ai-system-architect"),
    writer: id("prompt:persian-content-strategist"),
    fork: id("prompt:ai-system-architect-fork"),
  };
  const promptVersions = {
    architect: id("prompt-version:architect:1"),
    writer: id("prompt-version:writer:1"),
    fork: id("prompt-version:fork:1"),
  };
  const skills = {
    fullstack: id("skill:senior-fullstack"),
    research: id("skill:research-analyst"),
  };
  const skillVersions = {
    fullstack: id("skill-version:fullstack:1"),
    research: id("skill-version:research:1"),
  };
  const improvementId = id("improvement:architect-observability");
  const directConversationId = id("conversation:architect-builder");

  await upsertDocuments(User.collection.collectionName, [
    {
      _id: users.architect,
      username: "sara-architect",
      email: "sara@proai.local",
      passwordHash,
      displayName: "سارا معمار",
      avatar: null,
      bio: "معمار سامانه‌های هوش مصنوعی و علاقه‌مند به ساخت ابزارهای متن‌باز فارسی.",
      roles: ["user"],
      accountStatus: "active",
      locale: "fa-IR",
      messagingPolicy: "mutual",
      reputationScore: 2_480,
      rank: "architect",
      stats: { followers: 2, following: 2, prompts: 1, skills: 1, acceptedImprovements: 18 },
      lastSeenAt: new Date("2026-07-10T08:20:00.000Z"),
      createdAt: new Date("2025-10-04T09:30:00.000Z"),
    },
    {
      _id: users.builder,
      username: "amir-builder",
      email: "amir@proai.local",
      passwordHash,
      displayName: "امیر سازنده",
      avatar: null,
      bio: "توسعه‌دهنده فول‌استک؛ تمرکزم روی تجربه توسعه‌دهنده و کیفیت نرم‌افزار است.",
      roles: ["user"],
      accountStatus: "active",
      locale: "fa-IR",
      messagingPolicy: "mutual",
      reputationScore: 1_320,
      rank: "engineer",
      stats: { followers: 2, following: 2, prompts: 1, skills: 0, acceptedImprovements: 9 },
      lastSeenAt: new Date("2026-07-10T08:18:00.000Z"),
      createdAt: new Date("2025-11-18T14:10:00.000Z"),
    },
    {
      _id: users.researcher,
      username: "niloofar-lab",
      email: "niloofar@proai.local",
      passwordHash,
      displayName: "نیلوفر پژوهشگر",
      avatar: null,
      bio: "پژوهشگر تجربه کاربری و ارزیابی خروجی مدل‌های زبانی.",
      roles: ["user"],
      accountStatus: "active",
      locale: "fa-IR",
      messagingPolicy: "following",
      reputationScore: 780,
      rank: "builder",
      stats: { followers: 1, following: 1, prompts: 1, skills: 1, acceptedImprovements: 4 },
      lastSeenAt: new Date("2026-07-09T18:42:00.000Z"),
      createdAt: new Date("2026-01-09T07:45:00.000Z"),
    },
    {
      _id: users.moderator,
      username: "proai-team",
      email: "team@proai.local",
      passwordHash,
      displayName: "تیم پروای‌آی",
      avatar: null,
      bio: "تیم نگه‌داری و راهنمای جامعه پروای‌آی.",
      roles: seedPrivilegedDemoUser ? ["user", "moderator", "admin"] : ["user"],
      accountStatus: "active",
      locale: "fa-IR",
      messagingPolicy: "everyone",
      reputationScore: 5_000,
      rank: "ai-master",
      stats: { followers: 0, following: 0, prompts: 0, skills: 0, acceptedImprovements: 42 },
      lastSeenAt: new Date("2026-07-10T08:25:00.000Z"),
      createdAt: new Date("2025-09-01T06:00:00.000Z"),
    },
  ]);

  const architectContent = `نقش شما: معمار ارشد سامانه‌های هوش مصنوعی هستید.

هدف: برای مسئله‌ای که کاربر شرح می‌دهد، یک معماری عملیاتی، امن و قابل توسعه پیشنهاد کنید.

مراحل پاسخ:
۱. فرض‌ها و محدودیت‌ها را شفاف کنید.
۲. اجزای اصلی و جریان داده را توضیح دهید.
۳. تصمیم‌های فنی و بده‌بستان‌های هرکدام را مقایسه کنید.
۴. ریسک‌های امنیت، حریم خصوصی، هزینه و مقیاس را بررسی کنید.
۵. یک نقشه راه مرحله‌ای با معیار پذیرش ارائه دهید.

قواعد: اگر اطلاعات حیاتی کم است، سؤال دقیق بپرسید. هیچ سرویس یا عددی را بدون بیان فرض قطعی جلوه ندهید. خروجی را با تیترهای فارسی و جدول تصمیم‌ها ارائه کنید.`;
  const writerContent = `به‌عنوان استراتژیست محتوای فارسی، موضوع، مخاطب و هدفی را که کاربر می‌دهد تحلیل کن. سه زاویه محتوایی متمایز پیشنهاد بده، سپس بهترین زاویه را با یک عنوان روشن، طرح کلی، لحن پیشنهادی و دعوت به اقدام توسعه بده. از کلیشه، ترجمه لفظ‌به‌لفظ و جمله‌های طولانی پرهیز کن. خروجی باید برای خواننده فارسی‌زبان طبیعی باشد و ادعاهای نیازمند منبع را مشخص کند.`;
  const forkContent = `${architectContent}

الزام اجرایی: برای هر جزء، شاخص‌های مشاهده‌پذیری شامل لاگ، متریک، ردگیری و هشدارهای حداقلی را نیز تعریف کنید. در پایان یک سناریوی شکست و روش بازیابی آن بنویسید.`;

  await upsertDocuments(Prompt.collection.collectionName, [
    {
      _id: prompts.architect,
      title: "معمار سامانه‌های هوش مصنوعی",
      slug: "ai-system-architect-fa",
      description: "پرامپتی ساختاریافته برای طراحی معماری امن، مقیاس‌پذیر و قابل اجرای محصولات هوش مصنوعی.",
      content: architectContent,
      category: "development",
      creatorId: users.architect,
      currentVersionId: promptVersions.architect,
      currentVersion: 1,
      visibility: "public",
      moderationStatus: "visible",
      tags: ["معماری", "هوش-مصنوعی", "امنیت", "مقیاس‌پذیری"],
      license: "cc-by-sa-4.0",
      forkedFrom: { promptId: null, versionId: null, creatorId: null },
      stats: { likes: 2, saves: 2, forks: 1, comments: 2, ratingAverage: 4.5, ratingCount: 2, views: 684 },
      aiScore: 92,
      publishedAt: new Date("2026-05-20T08:00:00.000Z"),
      archivedAt: null,
      createdAt: new Date("2026-05-20T07:40:00.000Z"),
    },
    {
      _id: prompts.writer,
      title: "استراتژیست محتوای فارسی",
      slug: "persian-content-strategist",
      description: "ساخت زاویه محتوایی، طرح کلی و متن طبیعی متناسب با مخاطب فارسی‌زبان.",
      content: writerContent,
      category: "writing",
      creatorId: users.researcher,
      currentVersionId: promptVersions.writer,
      currentVersion: 1,
      visibility: "public",
      moderationStatus: "visible",
      tags: ["محتوا", "فارسی", "بازاریابی"],
      license: "cc-by-4.0",
      forkedFrom: { promptId: null, versionId: null, creatorId: null },
      stats: { likes: 1, saves: 1, forks: 0, comments: 0, ratingAverage: 5, ratingCount: 1, views: 231 },
      aiScore: 88,
      publishedAt: new Date("2026-06-12T12:00:00.000Z"),
      archivedAt: null,
      createdAt: new Date("2026-06-12T11:20:00.000Z"),
    },
    {
      _id: prompts.fork,
      title: "معمار سامانه هوش مصنوعی با مشاهده‌پذیری",
      slug: "observable-ai-system-architect",
      description: "فورکی اجرایی از پرامپت معماری با تمرکز بر لاگ، متریک، ردگیری و بازیابی شکست.",
      content: forkContent,
      category: "development",
      creatorId: users.builder,
      currentVersionId: promptVersions.fork,
      currentVersion: 1,
      visibility: "public",
      moderationStatus: "visible",
      tags: ["معماری", "مشاهده‌پذیری", "devops"],
      license: "cc-by-sa-4.0",
      forkedFrom: { promptId: prompts.architect, versionId: promptVersions.architect, creatorId: users.architect },
      stats: { likes: 1, saves: 0, forks: 0, comments: 0, ratingAverage: 4, ratingCount: 1, views: 94 },
      aiScore: 94,
      publishedAt: new Date("2026-07-02T10:00:00.000Z"),
      archivedAt: null,
      createdAt: new Date("2026-07-02T09:10:00.000Z"),
    },
  ]);

  await upsertDocuments(PromptVersion.collection.collectionName, [
    { _id: promptVersions.architect, promptId: prompts.architect, versionNumber: 1, title: "معمار سامانه‌های هوش مصنوعی", description: "نسخه پایه معماری هوش مصنوعی", content: architectContent, tags: ["معماری", "هوش-مصنوعی", "امنیت", "مقیاس‌پذیری"], changeSummary: "انتشار نخست با چارچوب تصمیم‌گیری و نقشه راه.", authorId: users.architect, parentVersionId: null, acceptedRequestId: null, source: "initial", contentHash: hash(architectContent), isOfficial: true, createdAt: new Date("2026-05-20T07:40:00.000Z") },
    { _id: promptVersions.writer, promptId: prompts.writer, versionNumber: 1, title: "استراتژیست محتوای فارسی", description: "نسخه پایه استراتژی محتوای فارسی", content: writerContent, tags: ["محتوا", "فارسی", "بازاریابی"], changeSummary: "انتشار نخست با سه زاویه محتوایی.", authorId: users.researcher, parentVersionId: null, acceptedRequestId: null, source: "initial", contentHash: hash(writerContent), isOfficial: true, createdAt: new Date("2026-06-12T11:20:00.000Z") },
    { _id: promptVersions.fork, promptId: prompts.fork, versionNumber: 1, title: "معمار سامانه هوش مصنوعی با مشاهده‌پذیری", description: "فورک مشاهده‌پذیر از نسخه پایه", content: forkContent, tags: ["معماری", "مشاهده‌پذیری", "devops"], changeSummary: "افزودن شاخص‌های عملیاتی و سناریوی بازیابی.", authorId: users.builder, parentVersionId: null, acceptedRequestId: null, source: "initial", contentHash: hash(forkContent), isOfficial: true, createdAt: new Date("2026-07-02T09:10:00.000Z") },
  ]);

  const fullstackInstructions = `در نقش توسعه‌دهنده ارشد فول‌استک عمل کن. ابتدا نیازمندی و معیار پذیرش را بازنویسی کن. سپس مرزهای فرانت‌اند، بک‌اند و داده را مشخص کن. برای هر تغییر، امنیت، دسترس‌پذیری، کارایی و آزمون را بررسی کن. کد را کوچک، نوع‌امن و قابل بازبینی نگه دار و تصمیم‌های مهم را مستند کن.`;
  const researchInstructions = `پرسش پژوهش را به فرضیه‌های قابل بررسی تبدیل کن؛ شواهد موافق و مخالف را جدا جمع‌بندی کن؛ کیفیت و تاریخ منبع را بسنج؛ عدم قطعیت را صریح بنویس؛ و در پایان، نتیجه، محدودیت‌ها و پیشنهاد بررسی بعدی را ارائه بده.`;
  const fullstackWorkflow = [
    { order: 1, title: "صورت‌بندی", instruction: "نیازمندی، محدودیت و معیار پذیرش را روشن کن." },
    { order: 2, title: "طراحی", instruction: "مرز اجزا، قرارداد داده و تهدیدهای اصلی را مشخص کن." },
    { order: 3, title: "پیاده‌سازی", instruction: "کوچک‌ترین تغییر کامل و نوع‌امن را بساز." },
    { order: 4, title: "راستی‌آزمایی", instruction: "آزمون، لینت، دسترس‌پذیری و سناریوهای شکست را بررسی کن." },
  ];
  const researchWorkflow = [
    { order: 1, title: "تعریف پرسش", instruction: "دامنه، واژه‌ها و بازه زمانی را تعیین کن." },
    { order: 2, title: "ارزیابی شواهد", instruction: "منابع اولیه را اولویت بده و تعارض‌ها را ثبت کن." },
    { order: 3, title: "ترکیب نتیجه", instruction: "نتیجه را همراه سطح اطمینان و محدودیت‌ها بنویس." },
  ];

  await upsertDocuments(Skill.collection.collectionName, [
    { _id: skills.fullstack, name: "توسعه‌دهنده ارشد فول‌استک", slug: "senior-fullstack-developer-fa", description: "مهارتی جامع برای تحلیل، طراحی، پیاده‌سازی امن و آزمون محصولات وب.", instructions: fullstackInstructions, requiredKnowledge: ["TypeScript", "React", "پایگاه داده", "امنیت وب", "آزمون نرم‌افزار"], workflow: fullstackWorkflow, tools: ["ویرایشگر کد", "ترمینال", "مرورگر", "Git"], dependencies: [], creatorId: users.architect, currentVersionId: skillVersions.fullstack, currentVersion: 1, visibility: "public", moderationStatus: "visible", tags: ["توسعه-وب", "typescript", "آزمون"], license: "mit", forkedFrom: { skillId: null, versionId: null, creatorId: null }, stats: { likes: 2, saves: 2, forks: 0, comments: 1, ratingAverage: 5, ratingCount: 2, users: 146 }, aiScore: 95, publishedAt: new Date("2026-04-08T09:00:00.000Z"), archivedAt: null, createdAt: new Date("2026-04-08T08:30:00.000Z") },
    { _id: skills.research, name: "تحلیل‌گر پژوهش و شواهد", slug: "evidence-research-analyst-fa", description: "مهارتی برای پژوهش منبع‌محور، سنجش کیفیت شواهد و گزارش عدم قطعیت.", instructions: researchInstructions, requiredKnowledge: ["سواد پژوهش", "ارزیابی منبع", "تفکر نقاد"], workflow: researchWorkflow, tools: ["جست‌وجوی وب", "مدیریت منابع"], dependencies: [], creatorId: users.researcher, currentVersionId: skillVersions.research, currentVersion: 1, visibility: "public", moderationStatus: "visible", tags: ["پژوهش", "منبع", "تفکر-نقاد"], license: "cc-by-4.0", forkedFrom: { skillId: null, versionId: null, creatorId: null }, stats: { likes: 1, saves: 1, forks: 0, comments: 0, ratingAverage: 4, ratingCount: 1, users: 61 }, aiScore: 91, publishedAt: new Date("2026-06-24T06:30:00.000Z"), archivedAt: null, createdAt: new Date("2026-06-24T06:00:00.000Z") },
  ]);

  await upsertDocuments(SkillVersion.collection.collectionName, [
    { _id: skillVersions.fullstack, skillId: skills.fullstack, versionNumber: 1, name: "توسعه‌دهنده ارشد فول‌استک", description: "نسخه پایه مهارت فول‌استک", instructions: fullstackInstructions, requiredKnowledge: ["TypeScript", "React", "پایگاه داده", "امنیت وب", "آزمون نرم‌افزار"], workflow: fullstackWorkflow, tools: ["ویرایشگر کد", "ترمینال", "مرورگر", "Git"], dependencies: [], tags: ["توسعه-وب", "typescript", "آزمون"], changeSummary: "نسخه نخست با گردش‌کار چهارمرحله‌ای.", authorId: users.architect, parentVersionId: null, acceptedRequestId: null, source: "initial", contentHash: hash(fullstackInstructions), isOfficial: true, createdAt: new Date("2026-04-08T08:30:00.000Z") },
    { _id: skillVersions.research, skillId: skills.research, versionNumber: 1, name: "تحلیل‌گر پژوهش و شواهد", description: "نسخه پایه تحلیل شواهد", instructions: researchInstructions, requiredKnowledge: ["سواد پژوهش", "ارزیابی منبع", "تفکر نقاد"], workflow: researchWorkflow, tools: ["جست‌وجوی وب", "مدیریت منابع"], dependencies: [], tags: ["پژوهش", "منبع", "تفکر-نقاد"], changeSummary: "نسخه نخست با تأکید بر منابع اولیه.", authorId: users.researcher, parentVersionId: null, acceptedRequestId: null, source: "initial", contentHash: hash(researchInstructions), isOfficial: true, createdAt: new Date("2026-06-24T06:00:00.000Z") },
  ]);

  await upsertDocuments(ImprovementRequest.collection.collectionName, [
    { _id: improvementId, targetType: "Prompt", targetId: prompts.architect, ownerId: users.architect, proposerId: users.builder, forkId: prompts.fork, baseVersionModel: "PromptVersion", baseVersionId: promptVersions.architect, title: "افزودن مشاهده‌پذیری و سناریوی بازیابی", summary: "این پیشنهاد خروجی معماری را به شاخص‌های قابل پایش و یک سناریوی شکست عملی متصل می‌کند.", proposedSnapshot: { title: "معمار سامانه‌های هوش مصنوعی", description: "نسخه تکمیل‌شده با مشاهده‌پذیری", content: forkContent, tags: ["معماری", "هوش-مصنوعی", "مشاهده‌پذیری"] }, changedPaths: ["content", "tags"], status: "changes-requested", decisionReason: "لطفاً هزینه نگه‌داری متریک‌ها را هم به بخش بده‌بستان‌ها اضافه کن.", acceptedVersionModel: null, acceptedVersionId: null, hasBaseConflict: false, submittedAt: new Date("2026-07-03T08:10:00.000Z"), decidedAt: null, closedAt: null, lastActivityAt: new Date("2026-07-04T14:20:00.000Z"), createdAt: new Date("2026-07-03T08:00:00.000Z") },
  ]);

  const discussionMessages = [
    { _id: id("improvement-message:1"), requestId: improvementId, senderId: users.builder, kind: "message", content: "سلام سارا، بخش مشاهده‌پذیری را روی فورک کامل کردم. خوشحال می‌شوم نظرت را بدانم.", readBy: [users.builder, users.architect], editedAt: null, deletedAt: null, createdAt: new Date("2026-07-03T08:11:00.000Z") },
    { _id: id("improvement-message:2"), requestId: improvementId, senderId: users.architect, kind: "changes-requested", content: "خیلی کاربردی شده. فقط هزینه نگه‌داری متریک‌ها و راه کاهش نویز هشدار را هم اضافه کن.", readBy: [users.architect, users.builder], editedAt: null, deletedAt: null, createdAt: new Date("2026-07-04T14:20:00.000Z") },
  ];
  await upsertDocuments(ImprovementDiscussionMessage.collection.collectionName, discussionMessages);

  const comments = [
    { _id: id("comment:architect:1"), userId: users.researcher, targetType: "Prompt", targetId: prompts.architect, parentId: null, content: "تفکیک فرض‌ها از تصمیم‌ها خیلی خوب است؛ برای تیم‌های محصول هم قابل استفاده است.", mentions: [], status: "visible", editedAt: null, replyCount: 1, reactionCount: 1, createdAt: new Date("2026-06-02T10:20:00.000Z") },
    { _id: id("comment:architect:reply"), userId: users.architect, targetType: "Prompt", targetId: prompts.architect, parentId: id("comment:architect:1"), content: "ممنون نیلوفر. در نسخه بعد یک نمونه مخصوص تیم محصول هم اضافه می‌کنم.", mentions: [users.researcher], status: "visible", editedAt: null, replyCount: 0, reactionCount: 0, createdAt: new Date("2026-06-02T11:00:00.000Z") },
    { _id: id("comment:skill:1"), userId: users.builder, targetType: "Skill", targetId: skills.fullstack, parentId: null, content: "مرحله معیار پذیرش باعث می‌شود قبل از کدنویسی ابهام‌ها مشخص شوند.", mentions: [], status: "visible", editedAt: null, replyCount: 0, reactionCount: 1, createdAt: new Date("2026-06-18T16:00:00.000Z") },
  ];
  await upsertDocuments(Comment.collection.collectionName, comments);

  await upsertDocuments(Follow.collection.collectionName, [
    { _id: id("follow:architect:builder"), followerId: users.architect, followingId: users.builder, createdAt: new Date("2026-02-01T08:00:00.000Z") },
    { _id: id("follow:builder:architect"), followerId: users.builder, followingId: users.architect, createdAt: new Date("2026-02-01T09:00:00.000Z") },
    { _id: id("follow:researcher:architect"), followerId: users.researcher, followingId: users.architect, createdAt: new Date("2026-03-12T12:00:00.000Z") },
    { _id: id("follow:architect:researcher"), followerId: users.architect, followingId: users.researcher, createdAt: new Date("2026-03-13T12:00:00.000Z") },
    { _id: id("follow:builder:researcher"), followerId: users.builder, followingId: users.researcher, createdAt: new Date("2026-05-01T12:00:00.000Z") },
  ]);

  await upsertDocuments(Like.collection.collectionName, [
    { _id: id("like:builder:architect-prompt"), userId: users.builder, targetType: "Prompt", targetId: prompts.architect, createdAt: new Date("2026-06-01T08:00:00.000Z") },
    { _id: id("like:researcher:architect-prompt"), userId: users.researcher, targetType: "Prompt", targetId: prompts.architect, createdAt: new Date("2026-06-02T08:00:00.000Z") },
    { _id: id("like:architect:writer-prompt"), userId: users.architect, targetType: "Prompt", targetId: prompts.writer, createdAt: new Date("2026-06-13T08:00:00.000Z") },
    { _id: id("like:builder:fullstack-skill"), userId: users.builder, targetType: "Skill", targetId: skills.fullstack, createdAt: new Date("2026-04-10T08:00:00.000Z") },
    { _id: id("like:researcher:fullstack-skill"), userId: users.researcher, targetType: "Skill", targetId: skills.fullstack, createdAt: new Date("2026-04-11T08:00:00.000Z") },
  ]);
  await upsertDocuments(Save.collection.collectionName, [
    { _id: id("save:builder:architect"), userId: users.builder, targetType: "Prompt", targetId: prompts.architect, folder: "معماری", createdAt: new Date("2026-06-01T08:05:00.000Z") },
    { _id: id("save:researcher:architect"), userId: users.researcher, targetType: "Prompt", targetId: prompts.architect, folder: "مطالعه", createdAt: new Date("2026-06-02T08:05:00.000Z") },
    { _id: id("save:builder:fullstack"), userId: users.builder, targetType: "Skill", targetId: skills.fullstack, folder: "توسعه", createdAt: new Date("2026-04-10T08:05:00.000Z") },
  ]);
  await upsertDocuments(Rating.collection.collectionName, [
    { _id: id("rating:builder:architect"), userId: users.builder, targetType: "Prompt", targetId: prompts.architect, value: 5 },
    { _id: id("rating:researcher:architect"), userId: users.researcher, targetType: "Prompt", targetId: prompts.architect, value: 4 },
    { _id: id("rating:builder:fullstack"), userId: users.builder, targetType: "Skill", targetId: skills.fullstack, value: 5 },
  ]);
  await upsertDocuments(Reaction.collection.collectionName, [
    { _id: id("reaction:builder:comment"), userId: users.builder, targetType: "Comment", targetId: id("comment:architect:1"), kind: "insightful" },
    { _id: id("reaction:architect:skill-comment"), userId: users.architect, targetType: "Comment", targetId: id("comment:skill:1"), kind: "helpful" },
  ]);

  const firstMessageId = id("message:direct:1");
  const secondMessageId = id("message:direct:2");
  await upsertDocuments(Conversation.collection.collectionName, [
    { _id: directConversationId, type: "direct", directKey: [users.architect.toHexString(), users.builder.toHexString()].sort().join(":"), contextModel: null, contextId: null, createdById: users.builder, lastMessageId: secondMessageId, lastMessageAt: new Date("2026-07-09T17:32:00.000Z"), closedAt: null, createdAt: new Date("2026-07-09T17:25:00.000Z") },
  ]);
  await upsertDocuments(ConversationMember.collection.collectionName, [
    { _id: id("conversation-member:architect"), conversationId: directConversationId, userId: users.architect, role: "member", unreadCount: 0, lastReadMessageId: secondMessageId, lastReadAt: new Date("2026-07-09T17:35:00.000Z"), mutedUntil: null, archivedAt: null, leftAt: null },
    { _id: id("conversation-member:builder"), conversationId: directConversationId, userId: users.builder, role: "member", unreadCount: 0, lastReadMessageId: secondMessageId, lastReadAt: new Date("2026-07-09T17:33:00.000Z"), mutedUntil: null, archivedAt: null, leftAt: null },
  ]);
  await upsertDocuments(Message.collection.collectionName, [
    { _id: firstMessageId, conversationId: directConversationId, senderId: users.builder, type: "text", content: "سلام سارا، برای نسخه بعدی مهارت فول‌استک یک پیشنهاد تست قرارداد دارم.", replyToId: null, readBy: [users.builder, users.architect], editedAt: null, deletedAt: null, clientNonce: "seed-direct-1", createdAt: new Date("2026-07-09T17:26:00.000Z") },
    { _id: secondMessageId, conversationId: directConversationId, senderId: users.architect, type: "text", content: "عالیه؛ نمونه تست و معیار شکست را بفرست تا با هم بررسی کنیم.", replyToId: firstMessageId, readBy: [users.architect, users.builder], editedAt: null, deletedAt: null, clientNonce: "seed-direct-2", createdAt: new Date("2026-07-09T17:32:00.000Z") },
  ]);

  const achievements = {
    firstPublish: id("achievement:first-publish"),
    collaborator: id("achievement:collaborator"),
    architect: id("achievement:architect"),
  };
  await upsertDocuments(Achievement.collection.collectionName, [
    { _id: achievements.firstPublish, slug: "first-publish", name: "اولین انتشار", description: "نخستین پرامپت یا مهارت عمومی را منتشر کرده‌اید.", icon: "sparkles", points: 20, tier: "bronze", criteria: { event: "content-published", count: 1 }, isActive: true, sortOrder: 10 },
    { _id: achievements.collaborator, slug: "helpful-collaborator", name: "همکار اثرگذار", description: "پنج پیشنهاد بهبود شما پذیرفته شده است.", icon: "git-pull-request", points: 100, tier: "silver", criteria: { event: "improvement-accepted", count: 5 }, isActive: true, sortOrder: 20 },
    { _id: achievements.architect, slug: "ai-architect", name: "معمار هوش مصنوعی", description: "به رتبه معمار و امتیاز دو هزار رسیده‌اید.", icon: "network", points: 250, tier: "gold", criteria: { reputation: 2000, rank: "architect" }, isActive: true, sortOrder: 30 },
  ]);
  await upsertDocuments(UserAchievement.collection.collectionName, [
    { _id: id("user-achievement:architect:first"), userId: users.architect, achievementId: achievements.firstPublish, awardedAt: new Date("2026-04-08T09:00:00.000Z"), progress: 100, metadata: {} },
    { _id: id("user-achievement:architect:collab"), userId: users.architect, achievementId: achievements.collaborator, awardedAt: new Date("2026-05-10T09:00:00.000Z"), progress: 100, metadata: { accepted: 18 } },
    { _id: id("user-achievement:architect:rank"), userId: users.architect, achievementId: achievements.architect, awardedAt: new Date("2026-06-01T09:00:00.000Z"), progress: 100, metadata: { score: 2480 } },
  ]);
  await upsertDocuments(ReputationEvent.collection.collectionName, [
    { _id: id("reputation:architect:prompt"), userId: users.architect, actorId: null, reason: "prompt-published", points: 30, balanceAfter: 2480, targetModel: "Prompt", targetId: prompts.architect, description: "انتشار پرامپت معمار سامانه‌های هوش مصنوعی", dedupeKey: "seed:architect:prompt-published", metadata: {} },
    { _id: id("reputation:builder:improvement"), userId: users.builder, actorId: users.architect, reason: "improvement-accepted", points: 80, balanceAfter: 1320, targetModel: "ImprovementRequest", targetId: improvementId, description: "مشارکت در بهبود محتوای فنی", dedupeKey: "seed:builder:accepted-improvement", metadata: { historical: true } },
  ]);

  const aiJobId = id("ai-job:architect-analysis");
  await upsertDocuments(AIJob.collection.collectionName, [
    { _id: aiJobId, requesterId: users.architect, type: "analyze", provider: "openai", model: "seed-demo-model", targetType: "Prompt", targetId: prompts.architect, status: "completed", inputHash: hash(architectContent), requestKey: "seed:analysis:architect:v1", output: { score: 92 }, errorCode: null, errorMessage: null, attempts: 1, startedAt: new Date("2026-05-20T07:45:00.000Z"), completedAt: new Date("2026-05-20T07:45:04.000Z") },
  ]);
  await upsertDocuments(AIAnalysis.collection.collectionName, [
    { _id: id("ai-analysis:architect"), jobId: aiJobId, targetType: "Prompt", targetId: prompts.architect, analyzedVersionId: promptVersions.architect, score: 92, summary: "نقش، مراحل و محدودیت‌ها شفاف‌اند؛ افزودن یک نمونه ورودی و خروجی کیفیت استفاده نخست را بهتر می‌کند.", dimensions: [{ key: "clarity", label: "شفافیت", score: 96, feedback: "نقش و هدف دقیق تعریف شده‌اند." }, { key: "structure", label: "ساختار", score: 94, feedback: "مراحل پاسخ ترتیب منطقی دارند." }, { key: "examples", label: "مثال", score: 72, feedback: "یک نمونه کامل می‌تواند ابهام را کاهش دهد." }], suggestions: [{ severity: "info", title: "افزودن نمونه", description: "یک ورودی کوتاه و شکل خروجی مطلوب اضافه کنید." }], provider: "openai", model: "seed-demo-model", inputHash: hash(architectContent) },
  ]);

  await upsertDocuments(Notification.collection.collectionName, [
    { _id: id("notification:improvement"), recipientId: users.architect, actorId: users.builder, type: "improvement-opened", title: "پیشنهاد بهبود جدید", body: "امیر برای پرامپت معمار سامانه‌های هوش مصنوعی پیشنهادی فرستاد.", entityModel: "ImprovementRequest", entityId: improvementId, href: `/improvements/${improvementId.toHexString()}`, metadata: {}, dedupeKey: "seed:improvement-opened", readAt: new Date("2026-07-03T09:00:00.000Z") },
    { _id: id("notification:message"), recipientId: users.builder, actorId: users.architect, type: "message", title: "پیام جدید از سارا", body: "نمونه تست و معیار شکست را بفرست تا با هم بررسی کنیم.", entityModel: "Conversation", entityId: directConversationId, href: `/messages/${directConversationId.toHexString()}`, metadata: {}, dedupeKey: "seed:direct-message-2", readAt: new Date("2026-07-09T17:33:00.000Z") },
  ]);

  await upsertDocuments(Report.collection.collectionName, [
    { _id: id("report:demo-resolved"), reporterId: users.researcher, targetModel: "Comment", targetId: id("comment:architect:1"), reason: "other", details: "گزارش آزمایشی برای نمایش گردش‌کار مدیریت محتوا.", status: "dismissed", assignedToId: users.moderator, resolution: "محتوا نقض قوانین نداشت؛ گزارش آزمایشی بسته شد.", resolvedAt: new Date("2026-06-03T08:00:00.000Z") },
  ]);
  await upsertDocuments(Block.collection.collectionName, []);

  // The seed is also the local-development schema bootstrap. Reconciliation keeps
  // indexes aligned when an earlier MVP schema already exists without deleting data.
  await Promise.all([
    User.syncIndexes(), Session.syncIndexes(), Prompt.syncIndexes(), PromptVersion.syncIndexes(),
    Skill.syncIndexes(), SkillVersion.syncIndexes(), ImprovementRequest.syncIndexes(),
    ImprovementDiscussionMessage.syncIndexes(), Comment.syncIndexes(), Like.syncIndexes(),
    Reaction.syncIndexes(), Save.syncIndexes(), Rating.syncIndexes(), Follow.syncIndexes(),
    Notification.syncIndexes(), Conversation.syncIndexes(), ConversationMember.syncIndexes(),
    Message.syncIndexes(), ReputationEvent.syncIndexes(), Achievement.syncIndexes(),
    UserAchievement.syncIndexes(), AIJob.syncIndexes(), AIAnalysis.syncIndexes(), RateLimit.syncIndexes(),
    Report.syncIndexes(), Block.syncIndexes(), ModerationAction.syncIndexes(), NewsArticle.syncIndexes(),
  ]);

  console.log("ProAI Persian development data seeded successfully.");
  console.log("Accounts: sara@proai.local, amir@proai.local, niloofar@proai.local");
  if (isDevelopment) {
    console.log(`Development password: ${password}`);
  } else {
    console.log("The non-development seed password was supplied through the environment and was not printed.");
    if (!seedPrivilegedDemoUser) {
      console.log("The proai-team demo account was seeded without moderator or admin roles.");
    }
  }
}

seed()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
