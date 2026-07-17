import { createHash } from "node:crypto";

import { loadEnvConfig } from "@next/env";
import mongoose, { Types } from "mongoose";

import { AIAnalysis, AIJob } from "../models/AI";
import { Comment } from "../models/Comment";
import {
  Conversation,
  ConversationMember,
  Message,
} from "../models/Conversation";
import { Follow } from "../models/Follow";
import {
  ImprovementDiscussionMessage,
  ImprovementRequest,
} from "../models/ImprovementRequest";
import { Like, Rating, Reaction, Save } from "../models/Interaction";
import { Block, ModerationAction, Report } from "../models/Moderation";
import { Notification } from "../models/Notification";
import { OtpChallenge } from "../models/OtpChallenge";
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
import { configureMongoDns, DEFAULT_MONGODB_URI } from "../lib/db/config";

loadEnvConfig(process.cwd());

type SeedDocument = {
  _id: Types.ObjectId;
  createdAt?: Date;
  [key: string]: unknown;
};

const id = (key: string) =>
  new Types.ObjectId(
    createHash("sha256").update(`proai-seed:${key}`).digest("hex").slice(0, 24),
  );
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const seedImages = (index: number, title: string) => {
  const first = (index % 8) + 1;
  const images = [
    {
      url: `/images/seed/cover-${String(first).padStart(2, "0")}.svg`,
      alt: `تصویر جلد ${title}`,
    },
  ];
  if (index % 4 === 0) {
    const second = ((index + 3) % 8) + 1;
    images.push({
      url: `/images/seed/cover-${String(second).padStart(2, "0")}.svg`,
      alt: `نمای تکمیلی ${title}`,
    });
  }
  return images;
};
function getSeedSafety(): {
  isDevelopment: boolean;
  seedPrivilegedDemoUser: boolean;
} {
  // `npm run seed` intentionally treats an unset NODE_ENV as local development.
  // Any explicitly production-like environment must opt in and supply a unique
  // explicit confirmation before the script can connect to MongoDB or mutate data.
  const runtimeEnvironment = process.env.NODE_ENV?.trim() || "development";
  const isDevelopment = runtimeEnvironment === "development";

  if (!isDevelopment) {
    if (process.env.ALLOW_NON_DEVELOPMENT_SEED !== "true") {
      throw new Error(
        `Refusing to seed demo data with NODE_ENV=${runtimeEnvironment}. ` +
          "Set ALLOW_NON_DEVELOPMENT_SEED=true only for an intentional non-production demo environment.",
      );
    }
  }

  return {
    isDevelopment,
    seedPrivilegedDemoUser:
      isDevelopment || process.env.SEED_ENABLE_PRIVILEGED_DEMO_USER === "true",
  };
}

async function migrateLegacyUserAuthentication(
  isDevelopment: boolean,
): Promise<void> {
  const missingPhoneUsers = await User.collection
    .find(
      {
        $or: [
          { phoneNumber: { $exists: false } },
          { phoneNumber: null },
          { phoneNumber: "" },
        ],
      },
      { projection: { _id: 1, username: 1 } },
    )
    .sort({ _id: 1 })
    .toArray();

  if (missingPhoneUsers.length > 0 && !isDevelopment) {
    throw new Error(
      `${missingPhoneUsers.length} users do not have a phone number. ` +
        "Assign verified Iranian mobile numbers before running a non-development seed.",
    );
  }

  if (missingPhoneUsers.length > 0) {
    const usedPhoneNumbers = new Set(
      (await User.collection.distinct("phoneNumber", {
        phoneNumber: { $type: "string" },
      })) as string[],
    );
    let sequence = 1;

    for (const user of missingPhoneUsers) {
      let phoneNumber: string;
      do {
        phoneNumber = `+98990${String(sequence).padStart(7, "0")}`;
        sequence += 1;
      } while (usedPhoneNumbers.has(phoneNumber));

      await User.collection.updateOne(
        { _id: user._id },
        { $set: { phoneNumber } },
      );
      usedPhoneNumbers.add(phoneNumber);
      console.log(
        `Assigned development phone ${phoneNumber} to @${String(user.username)}.`,
      );
    }
  }

  await User.collection.updateMany(
    {},
    { $unset: { email: "", passwordHash: "" } },
  );
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
  const { isDevelopment, seedPrivilegedDemoUser } = getSeedSafety();
  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  configureMongoDns(mongoUri);
  await mongoose.connect(mongoUri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5_000,
  });

  // Reconcile the pre-MVP prompt-only save index before inserting polymorphic saves.
  // This preserves existing documents while allowing prompt and skill saves to coexist.
  await Save.syncIndexes();

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
      phoneNumber: "+989121111111",
      displayName: "سارا معمار",
      avatar: null,
      bio: "معمار سامانه‌های هوش مصنوعی و علاقه‌مند به ساخت ابزارهای متن‌باز فارسی.",
      roles: ["user"],
      accountStatus: "active",
      locale: "fa-IR",
      messagingPolicy: "mutual",
      reputationScore: 2_480,
      rank: "architect",
      stats: {
        followers: 2,
        following: 2,
        prompts: 9,
        skills: 5,
        acceptedImprovements: 18,
      },
      lastSeenAt: new Date("2026-07-10T08:20:00.000Z"),
      createdAt: new Date("2025-10-04T09:30:00.000Z"),
    },
    {
      _id: users.builder,
      username: "amir-builder",
      phoneNumber: "+989122222222",
      displayName: "امیر سازنده",
      avatar: null,
      bio: "توسعه‌دهنده فول‌استک؛ تمرکزم روی تجربه توسعه‌دهنده و کیفیت نرم‌افزار است.",
      roles: ["user"],
      accountStatus: "active",
      locale: "fa-IR",
      messagingPolicy: "mutual",
      reputationScore: 1_320,
      rank: "engineer",
      stats: {
        followers: 2,
        following: 2,
        prompts: 9,
        skills: 4,
        acceptedImprovements: 9,
      },
      lastSeenAt: new Date("2026-07-10T08:18:00.000Z"),
      createdAt: new Date("2025-11-18T14:10:00.000Z"),
    },
    {
      _id: users.researcher,
      username: "niloofar-lab",
      phoneNumber: "+989123333333",
      displayName: "نیلوفر پژوهشگر",
      avatar: null,
      bio: "پژوهشگر تجربه کاربری و ارزیابی خروجی مدل‌های زبانی.",
      roles: ["user"],
      accountStatus: "active",
      locale: "fa-IR",
      messagingPolicy: "following",
      reputationScore: 780,
      rank: "builder",
      stats: {
        followers: 1,
        following: 1,
        prompts: 9,
        skills: 5,
        acceptedImprovements: 4,
      },
      lastSeenAt: new Date("2026-07-09T18:42:00.000Z"),
      createdAt: new Date("2026-01-09T07:45:00.000Z"),
    },
    {
      _id: users.moderator,
      username: "proai-team",
      phoneNumber: "+989383091833",
      displayName: "تیم پروای‌آی",
      avatar: null,
      bio: "تیم نگه‌داری و راهنمای جامعه پروای‌آی.",
      roles: seedPrivilegedDemoUser ? ["user", "moderator", "admin"] : ["user"],
      accountStatus: "active",
      locale: "fa-IR",
      messagingPolicy: "everyone",
      reputationScore: 5_000,
      rank: "ai-master",
      stats: {
        followers: 0,
        following: 0,
        prompts: 0,
        skills: 0,
        acceptedImprovements: 42,
      },
      lastSeenAt: new Date("2026-07-10T08:25:00.000Z"),
      createdAt: new Date("2025-09-01T06:00:00.000Z"),
    },
  ]);

  await migrateLegacyUserAuthentication(isDevelopment);

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

  const promptCatalog = [
    {
      key: "ai-product-manager",
      title: "مدیر محصول هوش مصنوعی",
      slug: "ai-product-manager-fa",
      description:
        "تبدیل مسئله مبهم محصول به فرضیه، دامنه MVP، معیار موفقیت و برنامه یادگیری.",
      category: "business",
      tags: ["محصول", "mvp", "هوش-مصنوعی"],
      goal: "برای ایده محصول داده‌شده، مسئله واقعی کاربر و کوچک‌ترین آزمایش معتبر را تعریف کن",
      output: "بیانیه مسئله، فرضیه‌ها، دامنه MVP، معیارها و برنامه دو هفته‌ای",
    },
    {
      key: "contract-reviewer",
      title: "تحلیل‌گر قراردادهای تجاری",
      slug: "commercial-contract-reviewer-fa",
      description:
        "مرور ساختاریافته بندهای قرارداد و برجسته‌کردن ریسک‌ها و ابهام‌های نیازمند بررسی حقوقی.",
      category: "business",
      tags: ["قرارداد", "ریسک", "کسب‌وکار"],
      goal: "متن قرارداد را بدون ارائه مشاوره حقوقی قطعی، از نظر تعهد، ریسک و ابهام مرور کن",
      output: "جدول بند، تعهد، ریسک، پرسش پیشنهادی و اولویت پیگیری",
    },
    {
      key: "ux-microcopy",
      title: "بازنویس میکروکپی تجربه کاربری",
      slug: "ux-microcopy-editor-fa",
      description:
        "بازنویسی متن رابط کاربری با لحن روشن، کوتاه، انسانی و سازگار با موقعیت کاربر.",
      category: "design",
      tags: ["ux-writing", "میکروکپی", "طراحی"],
      goal: "متن‌های رابط را بر اساس زمینه، حالت و اقدام بعدی کاربر بازنویسی کن",
      output: "نسخه اصلی، دو جایگزین، دلیل انتخاب و متن حالت خطا",
    },
    {
      key: "test-designer",
      title: "طراح سناریوهای آزمون نرم‌افزار",
      slug: "software-test-scenario-designer",
      description:
        "ساخت سناریوهای آزمون مبتنی بر ریسک برای مسیرهای اصلی، لبه‌ها و شکست‌ها.",
      category: "development",
      tags: ["آزمون", "کیفیت", "توسعه"],
      goal: "نیازمندی را به سناریوهای آزمون قابل اجرا و اولویت‌بندی‌شده تبدیل کن",
      output: "پیش‌شرط، مراحل، داده آزمون، نتیجه مورد انتظار و شدت شکست",
    },
    {
      key: "interview-coach",
      title: "مربی مصاحبه شغلی فنی",
      slug: "technical-interview-coach-fa",
      description:
        "شبیه‌سازی مصاحبه فنی، بازخورد مرحله‌ای و برنامه تمرین متناسب با نقش هدف.",
      category: "education",
      tags: ["مصاحبه", "یادگیری", "شغل"],
      goal: "برای نقش هدف یک مصاحبه تعاملی برگزار کن و پاسخ‌ها را منصفانه ارزیابی کن",
      output: "سؤال‌ها، بازخورد، نقاط قوت، شکاف دانشی و برنامه تمرین",
    },
    {
      key: "market-research",
      title: "پژوهشگر بازار و رقبا",
      slug: "market-competition-researcher-fa",
      description:
        "چارچوب پژوهش بازار با تفکیک شواهد، فرض‌ها، رقبا و فرصت‌های قابل آزمایش.",
      category: "research",
      tags: ["بازار", "رقبا", "پژوهش"],
      goal: "بازار هدف را با شواهد قابل ارجاع و تفکیک واقعیت از فرض تحلیل کن",
      output: "بخش‌بندی بازار، نقشه رقبا، شکاف‌ها، ریسک‌ها و پرسش‌های باز",
    },
    {
      key: "design-system",
      title: "معمار سیستم طراحی",
      slug: "design-system-architect-fa",
      description:
        "طراحی پایه یک سیستم طراحی شامل توکن‌ها، اجزا، قواعد دسترس‌پذیری و حاکمیت.",
      category: "design",
      tags: ["design-system", "دسترس‌پذیری", "کامپوننت"],
      goal: "نیازهای برند و محصول را به یک سیستم طراحی مقیاس‌پذیر تبدیل کن",
      output: "توکن‌ها، اجزای پایه، قرارداد API، قواعد استفاده و نقشه مهاجرت",
    },
    {
      key: "data-analyst",
      title: "تحلیل‌گر داده محصول",
      slug: "product-data-analyst-fa",
      description:
        "تبدیل پرسش محصول به تعریف متریک، طرح تحلیل و روایت تصمیم‌پذیر بدون جعل داده.",
      category: "research",
      tags: ["داده", "متریک", "محصول"],
      goal: "پرسش کسب‌وکار را به تحلیل داده‌ای قابل تکرار و قابل تصمیم تبدیل کن",
      output: "تعریف متریک، نیاز داده، روش تحلیل، محدودیت و قالب نتیجه",
    },
    {
      key: "proposal-writer",
      title: "تدوین‌گر پروپوزال حرفه‌ای",
      slug: "professional-proposal-writer-fa",
      description:
        "ساخت پروپوزال شفاف با مسئله، روش اجرا، تحویل‌دادنی‌ها، زمان‌بندی و ریسک‌ها.",
      category: "writing",
      tags: ["پروپوزال", "فروش", "نوشتن"],
      goal: "اطلاعات پروژه را به یک پیشنهاد حرفه‌ای و قابل مذاکره تبدیل کن",
      output: "خلاصه اجرایی، دامنه، روش، زمان‌بندی، هزینه فرضی و شروط",
    },
    {
      key: "personal-tutor",
      title: "مدرس شخصی یادگیری عمیق",
      slug: "adaptive-personal-tutor-fa",
      description:
        "طراحی مسیر یادگیری تطبیقی با تشخیص دانش قبلی، تمرین بازیابی و بازخورد پیوسته.",
      category: "education",
      tags: ["آموزش", "یادگیری", "مربی"],
      goal: "موضوع را متناسب با سطح یادگیرنده آموزش بده و فهم را مرحله‌ای بسنج",
      output: "نقشه مفهومی، درس کوتاه، مثال، تمرین و معیار عبور",
    },
    {
      key: "incident-commander",
      title: "فرمانده مدیریت بحران سرویس",
      slug: "service-incident-commander-fa",
      description:
        "هدایت رخداد عملیاتی با اولویت مهار، ارتباط شفاف، بازیابی و یادگیری بدون سرزنش.",
      category: "development",
      tags: ["incident", "devops", "پایداری"],
      goal: "شرح رخداد را به برنامه مهار و بازیابی زمان‌مند تبدیل کن",
      output: "شدت، نقش‌ها، اقدامات فوری، پیام وضعیت و طرح پسارخداد",
    },
    {
      key: "meeting-synthesizer",
      title: "جمع‌بندی‌کننده جلسه تصمیم‌محور",
      slug: "decision-meeting-synthesizer-fa",
      description:
        "تبدیل یادداشت جلسه به تصمیم‌ها، اقدام‌ها، مسئول‌ها، موعدها و ابهام‌های باز.",
      category: "productivity",
      tags: ["جلسه", "تصمیم", "بهره‌وری"],
      goal: "یادداشت‌های پراکنده جلسه را بدون افزودن اطلاعات تازه ساختاربندی کن",
      output: "خلاصه، تصمیم‌ها، اقدام‌ها، مسئول، موعد و پارکینگ موضوعات",
    },
    {
      key: "code-reviewer",
      title: "بازبین کد نوع‌امن و امن",
      slug: "secure-type-safe-code-reviewer",
      description:
        "بازبینی کد با تمرکز بر درستی، امنیت، کارایی، نگه‌داری و کیفیت آزمون.",
      category: "development",
      tags: ["code-review", "امنیت", "typescript"],
      goal: "تغییر کد را بر اساس ریسک و اثر واقعی بازبینی کن",
      output: "یافته‌های اولویت‌بندی‌شده با شاهد، پیامد و پیشنهاد اصلاح",
    },
    {
      key: "content-calendar",
      title: "برنامه‌ریز تقویم محتوایی",
      slug: "content-calendar-planner-fa",
      description:
        "طراحی تقویم محتوایی متعادل بر اساس مخاطب، هدف، کانال و ظرفیت واقعی تیم.",
      category: "writing",
      tags: ["تقویم-محتوا", "شبکه-اجتماعی", "برنامه"],
      goal: "اهداف و ظرفیت تیم را به برنامه محتوایی چهار هفته‌ای تبدیل کن",
      output: "ستون‌های محتوا، تقویم، قالب، مسئول، CTA و معیار هر محتوا",
    },
    {
      key: "seo-auditor",
      title: "ممیز سئوی محتوایی",
      slug: "content-seo-auditor-fa",
      description:
        "ممیزی محتوای صفحه با تمرکز بر نیت جست‌وجو، ساختار، پوشش موضوع و تجربه خواندن.",
      category: "writing",
      tags: ["seo", "محتوا", "ممیزی"],
      goal: "صفحه را بدون وعده رتبه قطعی از نظر نیت و کیفیت محتوا ارزیابی کن",
      output: "یافته‌ها، اولویت، پیشنهاد عنوان، ساختار و فرصت پیوند داخلی",
    },
    {
      key: "campaign-designer",
      title: "طراح کمپین چندکاناله",
      slug: "multi-channel-campaign-designer-fa",
      description:
        "طراحی کمپین هماهنگ با پیام مرکزی، بخش مخاطب، سفر تبدیل و برنامه آزمایش.",
      category: "business",
      tags: ["کمپین", "بازاریابی", "آزمایش"],
      goal: "هدف تجاری را به کمپین چندکاناله قابل اندازه‌گیری تبدیل کن",
      output: "پیام، مخاطب، کانال، تقویم، دارایی‌ها، بودجه فرضی و KPI",
    },
    {
      key: "paper-critic",
      title: "منتقد مقاله علمی",
      slug: "scientific-paper-critic-fa",
      description:
        "نقد روش‌شناسی مقاله با توجه به طراحی مطالعه، نمونه، تحلیل، سوگیری و قابلیت تعمیم.",
      category: "research",
      tags: ["مقاله", "روش‌شناسی", "شواهد"],
      goal: "مقاله را منصفانه و بدون فراتررفتن از شواهد نقد کن",
      output: "پرسش، روش، یافته، اعتبار، محدودیت و سطح اطمینان",
    },
    {
      key: "sql-assistant",
      title: "دستیار تحلیل و طراحی SQL",
      slug: "sql-analysis-assistant-fa",
      description:
        "تبدیل نیاز تحلیلی به SQL خوانا، کنترل‌شده و همراه با بررسی کیفیت داده.",
      category: "development",
      tags: ["sql", "داده", "پایگاه-داده"],
      goal: "نیاز تحلیل را به کوئری امن و قابل توضیح تبدیل کن",
      output: "فرض‌ها، SQL، توضیح گام‌ها، کنترل کیفیت و پیشنهاد ایندکس",
    },
    {
      key: "threat-modeler",
      title: "مدل‌ساز تهدید محصول",
      slug: "product-threat-modeler-fa",
      description:
        "مدل‌سازی تهدید بر اساس دارایی، مرز اعتماد، مهاجم، سناریو و کنترل‌های اولویت‌دار.",
      category: "development",
      tags: ["امنیت", "threat-model", "حریم-خصوصی"],
      goal: "معماری محصول را به مدل تهدید عملی و اولویت‌بندی‌شده تبدیل کن",
      output: "دارایی‌ها، مرزها، سناریوها، شدت، کنترل و ریسک باقی‌مانده",
    },
    {
      key: "support-responder",
      title: "پاسخ‌گوی حرفه‌ای پشتیبانی",
      slug: "customer-support-responder-fa",
      description:
        "نوشتن پاسخ همدلانه و دقیق برای پشتیبانی با اقدام روشن و بدون وعده غیرقابل کنترل.",
      category: "writing",
      tags: ["پشتیبانی", "مشتری", "پاسخ"],
      goal: "پیام مشتری را تحلیل و پاسخی روشن، انسانی و اقدام‌محور آماده کن",
      output: "پاسخ نهایی، اقدام داخلی، اطلاعات لازم و سطح فوریت",
    },
    {
      key: "roadmap-prioritizer",
      title: "اولویت‌بند نقشه راه محصول",
      slug: "product-roadmap-prioritizer-fa",
      description:
        "مقایسه فرصت‌ها بر اساس اثر، شواهد، هزینه، ریسک و وابستگی به‌جای امتیازسازی کاذب.",
      category: "business",
      tags: ["roadmap", "اولویت", "محصول"],
      goal: "فهرست فرصت‌ها را با معیارهای شفاف و حساسیت‌سنجی اولویت‌بندی کن",
      output: "معیارها، جدول مقایسه، رتبه، وابستگی و پیشنهاد بازبینی",
    },
    {
      key: "prompt-evaluator",
      title: "ارزیاب کیفیت پرامپت",
      slug: "prompt-quality-evaluator-fa",
      description:
        "ارزیابی پرامپت از نظر هدف، زمینه، محدودیت، آزمون‌پذیری و پایداری خروجی.",
      category: "productivity",
      tags: ["پرامپت", "ارزیابی", "کیفیت"],
      goal: "پرامپت را با معیارهای روشن نقد و نسخه بهبودیافته ارائه کن",
      output: "امتیاز ابعاد، خطاها، پیشنهادها، نسخه بازنویسی و تست‌های نمونه",
    },
    {
      key: "translation-editor",
      title: "ویراستار ترجمه تخصصی",
      slug: "technical-translation-editor-fa",
      description:
        "ویرایش ترجمه تخصصی برای دقت مفهومی، زبان طبیعی فارسی و ثبات اصطلاحات.",
      category: "writing",
      tags: ["ترجمه", "ویرایش", "فارسی"],
      goal: "ترجمه را با حفظ معنا و لحن، طبیعی و یکدست کن",
      output: "متن ویرایش‌شده، فهرست اصطلاحات و موارد نیازمند تأیید متخصص",
    },
    {
      key: "business-model",
      title: "طراح مدل کسب‌وکار",
      slug: "business-model-designer-fa",
      description:
        "ساخت و نقد مدل کسب‌وکار با تمرکز بر ارزش، مشتری، درآمد، هزینه و فرض‌های پرریسک.",
      category: "business",
      tags: ["مدل-کسب‌وکار", "استارتاپ", "اعتبارسنجی"],
      goal: "ایده را به مدل کسب‌وکار قابل آزمایش و مجموعه فرض‌های شفاف تبدیل کن",
      output: "بوم مدل، فرض‌های بحرانی، آزمایش‌ها، اقتصاد واحد و نقاط توقف",
    },
  ] as const;

  const promptCreators = [
    users.architect,
    users.builder,
    users.researcher,
  ] as const;
  const catalogPrompts: SeedDocument[] = [];
  const catalogPromptVersions: SeedDocument[] = [];
  promptCatalog.forEach((item, index) => {
    const promptId = id(`prompt:catalog:${item.key}`);
    const versionId = id(`prompt-version:catalog:${item.key}:1`);
    const creatorId = promptCreators[index % promptCreators.length];
    const createdAt = new Date(
      Date.UTC(2026, 0, 12 + index, 8 + (index % 8), 0),
    );
    const content = `نقش شما: ${item.title} هستید.\n\nهدف: ${item.goal}.\n\nروش کار:\n۱. ابتدا زمینه، مخاطب، محدودیت و اطلاعات ناقص را مشخص کن.\n۲. واقعیت‌ها را از فرض‌ها جدا و هر فرض مهم را علامت‌گذاری کن.\n۳. تحلیل را مرحله‌به‌مرحله انجام بده و گزینه‌ها را با معیار روشن مقایسه کن.\n۴. ریسک‌ها، موارد لبه و اطلاعات نیازمند منبع یا تأیید متخصص را بنویس.\n۵. پاسخ را به اقدام بعدی قابل اجرا متصل کن.\n\nقالب خروجی: ${item.output}.\n\nقواعد: داده یا منبع نساز؛ عدم قطعیت را پنهان نکن؛ اگر اطلاعات حیاتی کم است حداکثر سه سؤال دقیق بپرس؛ پاسخ را به فارسی روان، فشرده و ساختاریافته ارائه کن.`;
    catalogPrompts.push({
      _id: promptId,
      title: item.title,
      slug: item.slug,
      description: item.description,
      content,
      images: seedImages(index, item.title),
      category: item.category,
      creatorId,
      currentVersionId: versionId,
      currentVersion: 1,
      currentVersionLabel: "1.0.0",
      visibility: "public",
      moderationStatus: "visible",
      tags: [...item.tags],
      forkedFrom: { promptId: null, versionId: null, creatorId: null },
      stats: {
        likes: 4 + (index % 18),
        saves: 2 + (index % 12),
        forks: index % 4,
        comments: index % 6,
        ratingAverage: 4 + (index % 9) / 10,
        ratingCount: 3 + (index % 21),
        views: 180 + index * 73,
      },
      aiScore: 82 + (index % 16),
      publishedAt: new Date(createdAt.getTime() + 30 * 60_000),
      archivedAt: null,
      createdAt,
    });
    catalogPromptVersions.push({
      _id: versionId,
      promptId,
      versionNumber: 1,
      versionLabel: "1.0.0",
      title: item.title,
      description: item.description,
      content,
      tags: [...item.tags],
      category: item.category,
      changeSummary: "نسخه نخست با روش کار مرحله‌ای و قالب خروجی قابل ارزیابی.",
      authorId: creatorId,
      parentVersionId: null,
      acceptedRequestId: null,
      source: "initial",
      contentHash: hash(content),
      isOfficial: true,
      createdAt,
    });
  });

  await upsertDocuments(Prompt.collection.collectionName, [
    {
      _id: prompts.architect,
      title: "معمار سامانه‌های هوش مصنوعی",
      slug: "ai-system-architect-fa",
      description:
        "پرامپتی ساختاریافته برای طراحی معماری امن، مقیاس‌پذیر و قابل اجرای محصولات هوش مصنوعی.",
      content: architectContent,
      images: seedImages(0, "معمار سامانه‌های هوش مصنوعی"),
      category: "development",
      creatorId: users.architect,
      currentVersionId: promptVersions.architect,
      currentVersion: 1,
      visibility: "public",
      moderationStatus: "visible",
      tags: ["معماری", "هوش-مصنوعی", "امنیت", "مقیاس‌پذیری"],
      forkedFrom: { promptId: null, versionId: null, creatorId: null },
      stats: {
        likes: 2,
        saves: 2,
        forks: 1,
        comments: 2,
        ratingAverage: 4.5,
        ratingCount: 2,
        views: 684,
      },
      aiScore: 92,
      publishedAt: new Date("2026-05-20T08:00:00.000Z"),
      archivedAt: null,
      createdAt: new Date("2026-05-20T07:40:00.000Z"),
    },
    {
      _id: prompts.writer,
      title: "استراتژیست محتوای فارسی",
      slug: "persian-content-strategist",
      description:
        "ساخت زاویه محتوایی، طرح کلی و متن طبیعی متناسب با مخاطب فارسی‌زبان.",
      content: writerContent,
      images: seedImages(1, "استراتژیست محتوای فارسی"),
      category: "writing",
      creatorId: users.researcher,
      currentVersionId: promptVersions.writer,
      currentVersion: 1,
      visibility: "public",
      moderationStatus: "visible",
      tags: ["محتوا", "فارسی", "بازاریابی"],
      forkedFrom: { promptId: null, versionId: null, creatorId: null },
      stats: {
        likes: 1,
        saves: 1,
        forks: 0,
        comments: 0,
        ratingAverage: 5,
        ratingCount: 1,
        views: 231,
      },
      aiScore: 88,
      publishedAt: new Date("2026-06-12T12:00:00.000Z"),
      archivedAt: null,
      createdAt: new Date("2026-06-12T11:20:00.000Z"),
    },
    {
      _id: prompts.fork,
      title: "معمار سامانه هوش مصنوعی با مشاهده‌پذیری",
      slug: "observable-ai-system-architect",
      description:
        "فورکی اجرایی از پرامپت معماری با تمرکز بر لاگ، متریک، ردگیری و بازیابی شکست.",
      content: forkContent,
      images: seedImages(2, "معمار سامانه هوش مصنوعی با مشاهده‌پذیری"),
      category: "development",
      creatorId: users.builder,
      currentVersionId: promptVersions.fork,
      currentVersion: 1,
      visibility: "public",
      moderationStatus: "visible",
      tags: ["معماری", "مشاهده‌پذیری", "devops"],
      forkedFrom: {
        promptId: prompts.architect,
        versionId: promptVersions.architect,
        creatorId: users.architect,
      },
      stats: {
        likes: 1,
        saves: 0,
        forks: 0,
        comments: 0,
        ratingAverage: 4,
        ratingCount: 1,
        views: 94,
      },
      aiScore: 94,
      publishedAt: new Date("2026-07-02T10:00:00.000Z"),
      archivedAt: null,
      createdAt: new Date("2026-07-02T09:10:00.000Z"),
    },
    ...catalogPrompts,
  ]);

  await upsertDocuments(PromptVersion.collection.collectionName, [
    {
      _id: promptVersions.architect,
      promptId: prompts.architect,
      versionNumber: 1,
      title: "معمار سامانه‌های هوش مصنوعی",
      description: "نسخه پایه معماری هوش مصنوعی",
      content: architectContent,
      tags: ["معماری", "هوش-مصنوعی", "امنیت", "مقیاس‌پذیری"],
      changeSummary: "انتشار نخست با چارچوب تصمیم‌گیری و نقشه راه.",
      authorId: users.architect,
      parentVersionId: null,
      acceptedRequestId: null,
      source: "initial",
      contentHash: hash(architectContent),
      isOfficial: true,
      createdAt: new Date("2026-05-20T07:40:00.000Z"),
    },
    {
      _id: promptVersions.writer,
      promptId: prompts.writer,
      versionNumber: 1,
      title: "استراتژیست محتوای فارسی",
      description: "نسخه پایه استراتژی محتوای فارسی",
      content: writerContent,
      tags: ["محتوا", "فارسی", "بازاریابی"],
      changeSummary: "انتشار نخست با سه زاویه محتوایی.",
      authorId: users.researcher,
      parentVersionId: null,
      acceptedRequestId: null,
      source: "initial",
      contentHash: hash(writerContent),
      isOfficial: true,
      createdAt: new Date("2026-06-12T11:20:00.000Z"),
    },
    {
      _id: promptVersions.fork,
      promptId: prompts.fork,
      versionNumber: 1,
      title: "معمار سامانه هوش مصنوعی با مشاهده‌پذیری",
      description: "فورک مشاهده‌پذیر از نسخه پایه",
      content: forkContent,
      tags: ["معماری", "مشاهده‌پذیری", "devops"],
      changeSummary: "افزودن شاخص‌های عملیاتی و سناریوی بازیابی.",
      authorId: users.builder,
      parentVersionId: null,
      acceptedRequestId: null,
      source: "initial",
      contentHash: hash(forkContent),
      isOfficial: true,
      createdAt: new Date("2026-07-02T09:10:00.000Z"),
    },
    ...catalogPromptVersions,
  ]);
  await Promise.all([
    Prompt.collection.updateMany({}, { $unset: { license: "" } }),
    PromptVersion.collection.updateMany({}, { $unset: { license: "" } }),
  ]);

  const fullstackInstructions = `در نقش توسعه‌دهنده ارشد فول‌استک عمل کن. ابتدا نیازمندی و معیار پذیرش را بازنویسی کن. سپس مرزهای فرانت‌اند، بک‌اند و داده را مشخص کن. برای هر تغییر، امنیت، دسترس‌پذیری، کارایی و آزمون را بررسی کن. کد را کوچک، نوع‌امن و قابل بازبینی نگه دار و تصمیم‌های مهم را مستند کن.`;
  const researchInstructions = `پرسش پژوهش را به فرضیه‌های قابل بررسی تبدیل کن؛ شواهد موافق و مخالف را جدا جمع‌بندی کن؛ کیفیت و تاریخ منبع را بسنج؛ عدم قطعیت را صریح بنویس؛ و در پایان، نتیجه، محدودیت‌ها و پیشنهاد بررسی بعدی را ارائه بده.`;
  const fullstackWorkflow = [
    {
      order: 1,
      title: "صورت‌بندی",
      instruction: "نیازمندی، محدودیت و معیار پذیرش را روشن کن.",
    },
    {
      order: 2,
      title: "طراحی",
      instruction: "مرز اجزا، قرارداد داده و تهدیدهای اصلی را مشخص کن.",
    },
    {
      order: 3,
      title: "پیاده‌سازی",
      instruction: "کوچک‌ترین تغییر کامل و نوع‌امن را بساز.",
    },
    {
      order: 4,
      title: "راستی‌آزمایی",
      instruction: "آزمون، لینت، دسترس‌پذیری و سناریوهای شکست را بررسی کن.",
    },
  ];
  const researchWorkflow = [
    {
      order: 1,
      title: "تعریف پرسش",
      instruction: "دامنه، واژه‌ها و بازه زمانی را تعیین کن.",
    },
    {
      order: 2,
      title: "ارزیابی شواهد",
      instruction: "منابع اولیه را اولویت بده و تعارض‌ها را ثبت کن.",
    },
    {
      order: 3,
      title: "ترکیب نتیجه",
      instruction: "نتیجه را همراه سطح اطمینان و محدودیت‌ها بنویس.",
    },
  ];

  const skillCatalog = [
    {
      key: "product-discovery",
      name: "کشف مسئله و فرصت محصول",
      slug: "product-discovery-facilitator-fa",
      description:
        "مهارتی برای مصاحبه، ترکیب شواهد و تبدیل مسئله به فرصت قابل آزمایش.",
      focus:
        "مسئله کاربر را پیش از راه‌حل روشن کن و شواهد رفتاری را بر نظرهای کلی مقدم بدان",
      knowledge: ["تحقیق کاربر", "مدیریت محصول", "مصاحبه"],
      tools: ["دفترچه پژوهش", "نقشه فرصت", "تحلیل مصاحبه"],
      tags: ["product-discovery", "پژوهش", "محصول"],
      license: "cc-by-4.0",
    },
    {
      key: "nextjs-engineer",
      name: "مهندسی اپلیکیشن Next.js",
      slug: "nextjs-application-engineer-fa",
      description:
        "مهارتی عملی برای معماری App Router، مرز سرور و کلاینت، داده و کارایی.",
      focus:
        "تغییرات Next.js را بر اساس مستندات نسخه نصب‌شده، مرزهای رندر و اندازه باندل طراحی کن",
      knowledge: ["TypeScript", "React", "Next.js", "HTTP"],
      tools: ["مستندات Next.js", "TypeScript", "DevTools", "Vitest"],
      tags: ["nextjs", "react", "typescript"],
      license: "mit",
    },
    {
      key: "ux-research",
      name: "پژوهش تجربه کاربری",
      slug: "ux-research-practitioner-fa",
      description:
        "طراحی مطالعه، نمونه‌گیری، اجرای مصاحبه و ترکیب یافته‌های پژوهش UX.",
      focus:
        "روش پژوهش را متناسب با تصمیم انتخاب کن و میان مشاهده، تفسیر و توصیه فاصله روشن بگذار",
      knowledge: ["روش تحقیق", "مصاحبه", "اخلاق پژوهش"],
      tools: ["راهنمای مصاحبه", "کدگذاری کیفی", "نقشه سفر"],
      tags: ["ux-research", "تجربه-کاربری", "شواهد"],
      license: "cc-by-sa-4.0",
    },
    {
      key: "data-storytelling",
      name: "روایت‌گری با داده",
      slug: "data-storytelling-fa",
      description:
        "ساخت روایت تصمیم‌محور از تحلیل داده با نمودار درست و بیان صادقانه عدم قطعیت.",
      focus:
        "هر نمودار را به یک پرسش و یک تصمیم متصل کن و از تزئین یا مقیاس گمراه‌کننده دوری کن",
      knowledge: ["تحلیل داده", "آمار پایه", "طراحی اطلاعات"],
      tools: ["SQL", "صفحه گسترده", "ابزار نمودار"],
      tags: ["داده", "داستان‌گویی", "نمودار"],
      license: "cc-by-4.0",
    },
    {
      key: "secure-api",
      name: "طراحی API امن",
      slug: "secure-api-designer-fa",
      description:
        "طراحی قرارداد API، احراز هویت، مجوزدهی، اعتبارسنجی و مدیریت خطا.",
      focus:
        "مرز اعتماد و دارایی‌ها را پیش از endpointها مشخص کن و هر ورودی را غیرقابل اعتماد بدان",
      knowledge: ["HTTP", "امنیت وب", "مدل داده"],
      tools: ["OpenAPI", "مدل تهدید", "آزمون قرارداد"],
      tags: ["api", "امنیت", "backend"],
      license: "mit",
    },
    {
      key: "content-operations",
      name: "عملیات محتوای مقیاس‌پذیر",
      slug: "scalable-content-operations-fa",
      description:
        "ساخت گردش‌کار محتوا از brief تا انتشار، بازبینی، اندازه‌گیری و بازاستفاده.",
      focus:
        "کیفیت و سرعت تولید را با قالب، نقش، نقطه کنترل و تعریف انجام‌شده متوازن کن",
      knowledge: ["استراتژی محتوا", "ویرایش", "مدیریت گردش‌کار"],
      tools: ["تقویم محتوا", "راهنمای لحن", "چک‌لیست QA"],
      tags: ["content-ops", "محتوا", "فرایند"],
      license: "cc-by-4.0",
    },
    {
      key: "technical-seo",
      name: "سئوی فنی و محتوایی",
      slug: "technical-content-seo-fa",
      description:
        "ممیزی crawl، index، معماری اطلاعات، داده ساختاریافته و کیفیت محتوایی.",
      focus:
        "مشکل‌های فنی و محتوایی را با شاهد، اثر و هزینه اصلاح اولویت‌بندی کن و رتبه را تضمین نکن",
      knowledge: ["HTML", "HTTP", "تحلیل محتوا"],
      tools: ["Search Console", "crawler", "Lighthouse"],
      tags: ["seo", "فنی", "محتوا"],
      license: "cc-by-sa-4.0",
    },
    {
      key: "scientific-review",
      name: "مرور نظام‌مند شواهد",
      slug: "systematic-evidence-review-fa",
      description:
        "تعریف پرسش، راهبرد جست‌وجو، غربالگری و ترکیب شفاف شواهد علمی.",
      focus:
        "پروتکل را پیش از دیدن نتیجه تعریف کن و کیفیت، ناهمگونی و سوگیری انتشار را گزارش بده",
      knowledge: ["روش تحقیق", "آمار", "ارزیابی منبع"],
      tools: ["مدیریت منابع", "جدول استخراج", "چک‌لیست کیفیت"],
      tags: ["systematic-review", "علم", "پژوهش"],
      license: "cc-by-4.0",
    },
    {
      key: "sql-analytics",
      name: "تحلیل داده با SQL",
      slug: "sql-data-analysis-fa",
      description:
        "تبدیل پرسش کسب‌وکار به مدل داده، کوئری معتبر و کنترل کیفیت قابل تکرار.",
      focus: "دانه‌بندی، کلیدها و تعریف متریک را پیش از نوشتن کوئری تثبیت کن",
      knowledge: ["SQL", "مدل‌سازی داده", "آمار توصیفی"],
      tools: ["PostgreSQL", "dbt", "EXPLAIN"],
      tags: ["sql", "analytics", "data"],
      license: "mit",
    },
    {
      key: "prompt-evaluation",
      name: "ارزیابی سیستماتیک پرامپت",
      slug: "systematic-prompt-evaluation-fa",
      description:
        "طراحی مجموعه آزمون، rubric، نمونه مرزی و تحلیل رگرسیون برای پرامپت‌ها.",
      focus:
        "کیفیت پرامپت را روی نمونه‌های نماینده و شکست‌های مهم بسنج، نه یک خروجی خوش‌شانس",
      knowledge: ["مدل‌های زبانی", "طراحی آزمون", "تحلیل خطا"],
      tools: ["مجموعه ارزیابی", "rubric", "گزارش رگرسیون"],
      tags: ["prompt-eval", "llm", "کیفیت"],
      license: "cc-by-sa-4.0",
    },
    {
      key: "team-facilitation",
      name: "تسهیل‌گری جلسات تیمی",
      slug: "team-meeting-facilitation-fa",
      description:
        "طراحی و هدایت جلسه‌هایی که به تصمیم، تعهد و اقدام مشخص منتهی می‌شوند.",
      focus:
        "هدف، تصمیم مورد نیاز و نقش افراد را پیش از دعوت روشن کن و صدای افراد کم‌حرف را وارد بحث کن",
      knowledge: ["تسهیل‌گری", "ارتباط", "تصمیم‌گیری"],
      tools: ["دستور جلسه", "تایم‌باکس", "دفتر تصمیم"],
      tags: ["جلسه", "تیم", "تصمیم"],
      license: "cc-by-4.0",
    },
    {
      key: "incident-response",
      name: "پاسخ‌گویی به رخداد سرویس",
      slug: "service-incident-response-fa",
      description:
        "تشخیص، مهار، ارتباط، بازیابی و پسارخداد بدون سرزنش برای سرویس‌های آنلاین.",
      focus:
        "ایمنی و بازیابی را بر یافتن مقصر مقدم بدان و خط زمانی و تصمیم‌ها را هم‌زمان ثبت کن",
      knowledge: ["عملیات سرویس", "مشاهده‌پذیری", "مدیریت بحران"],
      tools: ["لاگ و متریک", "runbook", "صفحه وضعیت"],
      tags: ["incident-response", "sre", "devops"],
      license: "mit",
    },
  ] as const;

  const skillCreators = [
    users.architect,
    users.researcher,
    users.builder,
  ] as const;
  const catalogSkills: SeedDocument[] = [];
  const catalogSkillVersions: SeedDocument[] = [];
  skillCatalog.forEach((item, index) => {
    const skillId = id(`skill:catalog:${item.key}`);
    const versionId = id(`skill-version:catalog:${item.key}:1`);
    const creatorId = skillCreators[index % skillCreators.length];
    const createdAt = new Date(
      Date.UTC(2026, 2, 4 + index * 2, 7 + (index % 7), 0),
    );
    const instructions = `ماموریت این مهارت: ${item.focus}.\n\nدر هر اجرا:\n۱. هدف، زمینه، محدودیت و معیار موفقیت را بازنویسی کن.\n۲. اطلاعات ناقص و ریسک‌های پراثر را پیش از اقدام مشخص کن.\n۳. کار را به گام‌های کوچک با خروجی قابل بررسی تقسیم کن.\n۴. در هر گام شواهد، فرض‌ها و تصمیم‌ها را جدا ثبت کن.\n۵. نتیجه را با کنترل کیفیت، محدودیت‌ها و اقدام بعدی تحویل بده.\n\nاگر اطلاعات کافی نیست سؤال‌های محدود و دقیق بپرس. از ساختن داده، منبع یا قطعیت کاذب خودداری کن و پاسخ را برای همکاری تیمی قابل بازبینی نگه دار.`;
    const workflow = [
      {
        order: 1,
        title: "صورت‌بندی",
        instruction: "هدف، مخاطب، محدودیت و معیار موفقیت را مشخص کن.",
      },
      {
        order: 2,
        title: "طراحی رویکرد",
        instruction: "روش، ورودی‌ها، ریسک‌ها و نقاط کنترل را انتخاب کن.",
      },
      {
        order: 3,
        title: "اجرا",
        instruction: "خروجی را مرحله‌ای بساز و فرض‌ها را آشکار نگه دار.",
      },
      {
        order: 4,
        title: "کنترل کیفیت",
        instruction: "نتیجه را با معیارها، حالت‌های شکست و شواهد بازبینی کن.",
      },
      {
        order: 5,
        title: "تحویل",
        instruction: "نتیجه، محدودیت و اقدام بعدی را روشن ارائه کن.",
      },
    ];
    catalogSkills.push({
      _id: skillId,
      name: item.name,
      slug: item.slug,
      description: item.description,
      instructions,
      images: seedImages(index + 24, item.name),
      requiredKnowledge: [...item.knowledge],
      workflow,
      tools: [...item.tools],
      dependencies: [],
      creatorId,
      currentVersionId: versionId,
      currentVersion: 1,
      currentVersionLabel: "1.0.0",
      visibility: "public",
      moderationStatus: "visible",
      tags: [...item.tags],
      license: item.license,
      forkedFrom: { skillId: null, versionId: null, creatorId: null },
      stats: {
        likes: 5 + (index % 15),
        saves: 3 + (index % 10),
        forks: index % 3,
        comments: index % 5,
        ratingAverage: 4.1 + (index % 8) / 10,
        ratingCount: 4 + (index % 17),
        users: 45 + index * 28,
      },
      aiScore: 84 + (index % 14),
      publishedAt: new Date(createdAt.getTime() + 45 * 60_000),
      archivedAt: null,
      createdAt,
    });
    catalogSkillVersions.push({
      _id: versionId,
      skillId,
      versionNumber: 1,
      versionLabel: "1.0.0",
      name: item.name,
      description: item.description,
      instructions,
      requiredKnowledge: [...item.knowledge],
      workflow,
      tools: [...item.tools],
      dependencies: [],
      tags: [...item.tags],
      license: item.license,
      changeSummary: "نسخه نخست با گردش‌کار پنج‌مرحله‌ای و کنترل کیفیت.",
      authorId: creatorId,
      parentVersionId: null,
      acceptedRequestId: null,
      source: "initial",
      contentHash: hash(instructions),
      isOfficial: true,
      createdAt,
    });
  });

  await upsertDocuments(Skill.collection.collectionName, [
    {
      _id: skills.fullstack,
      name: "توسعه‌دهنده ارشد فول‌استک",
      slug: "senior-fullstack-developer-fa",
      description:
        "مهارتی جامع برای تحلیل، طراحی، پیاده‌سازی امن و آزمون محصولات وب.",
      instructions: fullstackInstructions,
      images: seedImages(6, "توسعه‌دهنده ارشد فول‌استک"),
      requiredKnowledge: [
        "TypeScript",
        "React",
        "پایگاه داده",
        "امنیت وب",
        "آزمون نرم‌افزار",
      ],
      workflow: fullstackWorkflow,
      tools: ["ویرایشگر کد", "ترمینال", "مرورگر", "Git"],
      dependencies: [],
      creatorId: users.architect,
      currentVersionId: skillVersions.fullstack,
      currentVersion: 1,
      currentVersionLabel: "1.0.0",
      visibility: "public",
      moderationStatus: "visible",
      tags: ["توسعه-وب", "typescript", "آزمون"],
      license: "mit",
      forkedFrom: { skillId: null, versionId: null, creatorId: null },
      stats: {
        likes: 2,
        saves: 2,
        forks: 0,
        comments: 1,
        ratingAverage: 5,
        ratingCount: 2,
        users: 146,
      },
      aiScore: 95,
      publishedAt: new Date("2026-04-08T09:00:00.000Z"),
      archivedAt: null,
      createdAt: new Date("2026-04-08T08:30:00.000Z"),
    },
    {
      _id: skills.research,
      name: "تحلیل‌گر پژوهش و شواهد",
      slug: "evidence-research-analyst-fa",
      description:
        "مهارتی برای پژوهش منبع‌محور، سنجش کیفیت شواهد و گزارش عدم قطعیت.",
      instructions: researchInstructions,
      images: seedImages(7, "تحلیل‌گر پژوهش و شواهد"),
      requiredKnowledge: ["سواد پژوهش", "ارزیابی منبع", "تفکر نقاد"],
      workflow: researchWorkflow,
      tools: ["جست‌وجوی وب", "مدیریت منابع"],
      dependencies: [],
      creatorId: users.researcher,
      currentVersionId: skillVersions.research,
      currentVersion: 1,
      currentVersionLabel: "1.0.0",
      visibility: "public",
      moderationStatus: "visible",
      tags: ["پژوهش", "منبع", "تفکر-نقاد"],
      license: "cc-by-4.0",
      forkedFrom: { skillId: null, versionId: null, creatorId: null },
      stats: {
        likes: 1,
        saves: 1,
        forks: 0,
        comments: 0,
        ratingAverage: 4,
        ratingCount: 1,
        users: 61,
      },
      aiScore: 91,
      publishedAt: new Date("2026-06-24T06:30:00.000Z"),
      archivedAt: null,
      createdAt: new Date("2026-06-24T06:00:00.000Z"),
    },
    ...catalogSkills,
  ]);

  await upsertDocuments(SkillVersion.collection.collectionName, [
    {
      _id: skillVersions.fullstack,
      skillId: skills.fullstack,
      versionNumber: 1,
      name: "توسعه‌دهنده ارشد فول‌استک",
      description: "نسخه پایه مهارت فول‌استک",
      instructions: fullstackInstructions,
      requiredKnowledge: [
        "TypeScript",
        "React",
        "پایگاه داده",
        "امنیت وب",
        "آزمون نرم‌افزار",
      ],
      workflow: fullstackWorkflow,
      tools: ["ویرایشگر کد", "ترمینال", "مرورگر", "Git"],
      dependencies: [],
      tags: ["توسعه-وب", "typescript", "آزمون"],
      changeSummary: "نسخه نخست با گردش‌کار چهارمرحله‌ای.",
      authorId: users.architect,
      parentVersionId: null,
      acceptedRequestId: null,
      source: "initial",
      contentHash: hash(fullstackInstructions),
      isOfficial: true,
      createdAt: new Date("2026-04-08T08:30:00.000Z"),
    },
    {
      _id: skillVersions.research,
      skillId: skills.research,
      versionNumber: 1,
      name: "تحلیل‌گر پژوهش و شواهد",
      description: "نسخه پایه تحلیل شواهد",
      instructions: researchInstructions,
      requiredKnowledge: ["سواد پژوهش", "ارزیابی منبع", "تفکر نقاد"],
      workflow: researchWorkflow,
      tools: ["جست‌وجوی وب", "مدیریت منابع"],
      dependencies: [],
      tags: ["پژوهش", "منبع", "تفکر-نقاد"],
      changeSummary: "نسخه نخست با تأکید بر منابع اولیه.",
      authorId: users.researcher,
      parentVersionId: null,
      acceptedRequestId: null,
      source: "initial",
      contentHash: hash(researchInstructions),
      isOfficial: true,
      createdAt: new Date("2026-06-24T06:00:00.000Z"),
    },
    ...catalogSkillVersions,
  ]);

  await upsertDocuments(ImprovementRequest.collection.collectionName, [
    {
      _id: improvementId,
      targetType: "Prompt",
      targetId: prompts.architect,
      ownerId: users.architect,
      proposerId: users.builder,
      forkId: prompts.fork,
      baseVersionModel: "PromptVersion",
      baseVersionId: promptVersions.architect,
      title: "افزودن مشاهده‌پذیری و سناریوی بازیابی",
      summary:
        "این پیشنهاد خروجی معماری را به شاخص‌های قابل پایش و یک سناریوی شکست عملی متصل می‌کند.",
      proposedSnapshot: {
        title: "معمار سامانه‌های هوش مصنوعی",
        description: "نسخه تکمیل‌شده با مشاهده‌پذیری",
        content: forkContent,
        tags: ["معماری", "هوش-مصنوعی", "مشاهده‌پذیری"],
      },
      changedPaths: ["content", "tags"],
      status: "changes-requested",
      decisionReason:
        "لطفاً هزینه نگه‌داری متریک‌ها را هم به بخش بده‌بستان‌ها اضافه کن.",
      acceptedVersionModel: null,
      acceptedVersionId: null,
      hasBaseConflict: false,
      submittedAt: new Date("2026-07-03T08:10:00.000Z"),
      decidedAt: null,
      closedAt: null,
      lastActivityAt: new Date("2026-07-04T14:20:00.000Z"),
      createdAt: new Date("2026-07-03T08:00:00.000Z"),
    },
  ]);

  const discussionMessages = [
    {
      _id: id("improvement-message:1"),
      requestId: improvementId,
      senderId: users.builder,
      kind: "message",
      content:
        "سلام سارا، بخش مشاهده‌پذیری را روی فورک کامل کردم. خوشحال می‌شوم نظرت را بدانم.",
      readBy: [users.builder, users.architect],
      editedAt: null,
      deletedAt: null,
      createdAt: new Date("2026-07-03T08:11:00.000Z"),
    },
    {
      _id: id("improvement-message:2"),
      requestId: improvementId,
      senderId: users.architect,
      kind: "changes-requested",
      content:
        "خیلی کاربردی شده. فقط هزینه نگه‌داری متریک‌ها و راه کاهش نویز هشدار را هم اضافه کن.",
      readBy: [users.architect, users.builder],
      editedAt: null,
      deletedAt: null,
      createdAt: new Date("2026-07-04T14:20:00.000Z"),
    },
  ];
  await upsertDocuments(
    ImprovementDiscussionMessage.collection.collectionName,
    discussionMessages,
  );

  const comments = [
    {
      _id: id("comment:architect:1"),
      userId: users.researcher,
      targetType: "Prompt",
      targetId: prompts.architect,
      parentId: null,
      content:
        "تفکیک فرض‌ها از تصمیم‌ها خیلی خوب است؛ برای تیم‌های محصول هم قابل استفاده است.",
      mentions: [],
      status: "visible",
      editedAt: null,
      replyCount: 1,
      reactionCount: 1,
      createdAt: new Date("2026-06-02T10:20:00.000Z"),
    },
    {
      _id: id("comment:architect:reply"),
      userId: users.architect,
      targetType: "Prompt",
      targetId: prompts.architect,
      parentId: id("comment:architect:1"),
      content:
        "ممنون نیلوفر. در نسخه بعد یک نمونه مخصوص تیم محصول هم اضافه می‌کنم.",
      mentions: [users.researcher],
      status: "visible",
      editedAt: null,
      replyCount: 0,
      reactionCount: 0,
      createdAt: new Date("2026-06-02T11:00:00.000Z"),
    },
    {
      _id: id("comment:skill:1"),
      userId: users.builder,
      targetType: "Skill",
      targetId: skills.fullstack,
      parentId: null,
      content:
        "مرحله معیار پذیرش باعث می‌شود قبل از کدنویسی ابهام‌ها مشخص شوند.",
      mentions: [],
      status: "visible",
      editedAt: null,
      replyCount: 0,
      reactionCount: 1,
      createdAt: new Date("2026-06-18T16:00:00.000Z"),
    },
  ];
  await upsertDocuments(Comment.collection.collectionName, comments);

  await upsertDocuments(Follow.collection.collectionName, [
    {
      _id: id("follow:architect:builder"),
      followerId: users.architect,
      followingId: users.builder,
      createdAt: new Date("2026-02-01T08:00:00.000Z"),
    },
    {
      _id: id("follow:builder:architect"),
      followerId: users.builder,
      followingId: users.architect,
      createdAt: new Date("2026-02-01T09:00:00.000Z"),
    },
    {
      _id: id("follow:researcher:architect"),
      followerId: users.researcher,
      followingId: users.architect,
      createdAt: new Date("2026-03-12T12:00:00.000Z"),
    },
    {
      _id: id("follow:architect:researcher"),
      followerId: users.architect,
      followingId: users.researcher,
      createdAt: new Date("2026-03-13T12:00:00.000Z"),
    },
    {
      _id: id("follow:builder:researcher"),
      followerId: users.builder,
      followingId: users.researcher,
      createdAt: new Date("2026-05-01T12:00:00.000Z"),
    },
  ]);

  await upsertDocuments(Like.collection.collectionName, [
    {
      _id: id("like:builder:architect-prompt"),
      userId: users.builder,
      targetType: "Prompt",
      targetId: prompts.architect,
      createdAt: new Date("2026-06-01T08:00:00.000Z"),
    },
    {
      _id: id("like:researcher:architect-prompt"),
      userId: users.researcher,
      targetType: "Prompt",
      targetId: prompts.architect,
      createdAt: new Date("2026-06-02T08:00:00.000Z"),
    },
    {
      _id: id("like:architect:writer-prompt"),
      userId: users.architect,
      targetType: "Prompt",
      targetId: prompts.writer,
      createdAt: new Date("2026-06-13T08:00:00.000Z"),
    },
    {
      _id: id("like:builder:fullstack-skill"),
      userId: users.builder,
      targetType: "Skill",
      targetId: skills.fullstack,
      createdAt: new Date("2026-04-10T08:00:00.000Z"),
    },
    {
      _id: id("like:researcher:fullstack-skill"),
      userId: users.researcher,
      targetType: "Skill",
      targetId: skills.fullstack,
      createdAt: new Date("2026-04-11T08:00:00.000Z"),
    },
  ]);
  await upsertDocuments(Save.collection.collectionName, [
    {
      _id: id("save:builder:architect"),
      userId: users.builder,
      targetType: "Prompt",
      targetId: prompts.architect,
      folder: "معماری",
      createdAt: new Date("2026-06-01T08:05:00.000Z"),
    },
    {
      _id: id("save:researcher:architect"),
      userId: users.researcher,
      targetType: "Prompt",
      targetId: prompts.architect,
      folder: "مطالعه",
      createdAt: new Date("2026-06-02T08:05:00.000Z"),
    },
    {
      _id: id("save:builder:fullstack"),
      userId: users.builder,
      targetType: "Skill",
      targetId: skills.fullstack,
      folder: "توسعه",
      createdAt: new Date("2026-04-10T08:05:00.000Z"),
    },
  ]);
  await upsertDocuments(Rating.collection.collectionName, [
    {
      _id: id("rating:builder:architect"),
      userId: users.builder,
      targetType: "Prompt",
      targetId: prompts.architect,
      value: 5,
    },
    {
      _id: id("rating:researcher:architect"),
      userId: users.researcher,
      targetType: "Prompt",
      targetId: prompts.architect,
      value: 4,
    },
    {
      _id: id("rating:builder:fullstack"),
      userId: users.builder,
      targetType: "Skill",
      targetId: skills.fullstack,
      value: 5,
    },
  ]);
  await upsertDocuments(Reaction.collection.collectionName, [
    {
      _id: id("reaction:builder:comment"),
      userId: users.builder,
      targetType: "Comment",
      targetId: id("comment:architect:1"),
      kind: "insightful",
    },
    {
      _id: id("reaction:architect:skill-comment"),
      userId: users.architect,
      targetType: "Comment",
      targetId: id("comment:skill:1"),
      kind: "helpful",
    },
  ]);

  const firstMessageId = id("message:direct:1");
  const secondMessageId = id("message:direct:2");
  await upsertDocuments(Conversation.collection.collectionName, [
    {
      _id: directConversationId,
      type: "direct",
      directKey: [users.architect.toHexString(), users.builder.toHexString()]
        .sort()
        .join(":"),
      contextModel: null,
      contextId: null,
      createdById: users.builder,
      lastMessageId: secondMessageId,
      lastMessageAt: new Date("2026-07-09T17:32:00.000Z"),
      closedAt: null,
      createdAt: new Date("2026-07-09T17:25:00.000Z"),
    },
  ]);
  await upsertDocuments(ConversationMember.collection.collectionName, [
    {
      _id: id("conversation-member:architect"),
      conversationId: directConversationId,
      userId: users.architect,
      role: "member",
      unreadCount: 0,
      lastReadMessageId: secondMessageId,
      lastReadAt: new Date("2026-07-09T17:35:00.000Z"),
      mutedUntil: null,
      archivedAt: null,
      leftAt: null,
    },
    {
      _id: id("conversation-member:builder"),
      conversationId: directConversationId,
      userId: users.builder,
      role: "member",
      unreadCount: 0,
      lastReadMessageId: secondMessageId,
      lastReadAt: new Date("2026-07-09T17:33:00.000Z"),
      mutedUntil: null,
      archivedAt: null,
      leftAt: null,
    },
  ]);
  await upsertDocuments(Message.collection.collectionName, [
    {
      _id: firstMessageId,
      conversationId: directConversationId,
      senderId: users.builder,
      type: "text",
      content:
        "سلام سارا، برای نسخه بعدی مهارت فول‌استک یک پیشنهاد تست قرارداد دارم.",
      replyToId: null,
      readBy: [users.builder, users.architect],
      editedAt: null,
      deletedAt: null,
      clientNonce: "seed-direct-1",
      createdAt: new Date("2026-07-09T17:26:00.000Z"),
    },
    {
      _id: secondMessageId,
      conversationId: directConversationId,
      senderId: users.architect,
      type: "text",
      content: "عالیه؛ نمونه تست و معیار شکست را بفرست تا با هم بررسی کنیم.",
      replyToId: firstMessageId,
      readBy: [users.architect, users.builder],
      editedAt: null,
      deletedAt: null,
      clientNonce: "seed-direct-2",
      createdAt: new Date("2026-07-09T17:32:00.000Z"),
    },
  ]);

  const achievements = {
    firstPublish: id("achievement:first-publish"),
    collaborator: id("achievement:collaborator"),
    architect: id("achievement:architect"),
  };
  await upsertDocuments(Achievement.collection.collectionName, [
    {
      _id: achievements.firstPublish,
      slug: "first-publish",
      name: "اولین انتشار",
      description: "نخستین پرامپت یا مهارت عمومی را منتشر کرده‌اید.",
      icon: "sparkles",
      points: 20,
      tier: "bronze",
      criteria: { event: "content-published", count: 1 },
      isActive: true,
      sortOrder: 10,
    },
    {
      _id: achievements.collaborator,
      slug: "helpful-collaborator",
      name: "همکار اثرگذار",
      description: "پنج پیشنهاد بهبود شما پذیرفته شده است.",
      icon: "git-pull-request",
      points: 100,
      tier: "silver",
      criteria: { event: "improvement-accepted", count: 5 },
      isActive: true,
      sortOrder: 20,
    },
    {
      _id: achievements.architect,
      slug: "ai-architect",
      name: "معمار هوش مصنوعی",
      description: "به رتبه معمار و امتیاز دو هزار رسیده‌اید.",
      icon: "network",
      points: 250,
      tier: "gold",
      criteria: { reputation: 2000, rank: "architect" },
      isActive: true,
      sortOrder: 30,
    },
  ]);
  await upsertDocuments(UserAchievement.collection.collectionName, [
    {
      _id: id("user-achievement:architect:first"),
      userId: users.architect,
      achievementId: achievements.firstPublish,
      awardedAt: new Date("2026-04-08T09:00:00.000Z"),
      progress: 100,
      metadata: {},
    },
    {
      _id: id("user-achievement:architect:collab"),
      userId: users.architect,
      achievementId: achievements.collaborator,
      awardedAt: new Date("2026-05-10T09:00:00.000Z"),
      progress: 100,
      metadata: { accepted: 18 },
    },
    {
      _id: id("user-achievement:architect:rank"),
      userId: users.architect,
      achievementId: achievements.architect,
      awardedAt: new Date("2026-06-01T09:00:00.000Z"),
      progress: 100,
      metadata: { score: 2480 },
    },
  ]);
  await upsertDocuments(ReputationEvent.collection.collectionName, [
    {
      _id: id("reputation:architect:prompt"),
      userId: users.architect,
      actorId: null,
      reason: "prompt-published",
      points: 30,
      balanceAfter: 2480,
      targetModel: "Prompt",
      targetId: prompts.architect,
      description: "انتشار پرامپت معمار سامانه‌های هوش مصنوعی",
      dedupeKey: "seed:architect:prompt-published",
      metadata: {},
    },
    {
      _id: id("reputation:builder:improvement"),
      userId: users.builder,
      actorId: users.architect,
      reason: "improvement-accepted",
      points: 80,
      balanceAfter: 1320,
      targetModel: "ImprovementRequest",
      targetId: improvementId,
      description: "مشارکت در بهبود محتوای فنی",
      dedupeKey: "seed:builder:accepted-improvement",
      metadata: { historical: true },
    },
  ]);

  const aiJobId = id("ai-job:architect-analysis");
  await upsertDocuments(AIJob.collection.collectionName, [
    {
      _id: aiJobId,
      requesterId: users.architect,
      type: "analyze",
      provider: "openai",
      model: "seed-demo-model",
      targetType: "Prompt",
      targetId: prompts.architect,
      status: "completed",
      inputHash: hash(architectContent),
      requestKey: "seed:analysis:architect:v1",
      output: { score: 92 },
      errorCode: null,
      errorMessage: null,
      attempts: 1,
      startedAt: new Date("2026-05-20T07:45:00.000Z"),
      completedAt: new Date("2026-05-20T07:45:04.000Z"),
    },
  ]);
  await upsertDocuments(AIAnalysis.collection.collectionName, [
    {
      _id: id("ai-analysis:architect"),
      jobId: aiJobId,
      targetType: "Prompt",
      targetId: prompts.architect,
      analyzedVersionId: promptVersions.architect,
      score: 92,
      summary:
        "نقش، مراحل و محدودیت‌ها شفاف‌اند؛ افزودن یک نمونه ورودی و خروجی کیفیت استفاده نخست را بهتر می‌کند.",
      dimensions: [
        {
          key: "clarity",
          label: "شفافیت",
          score: 96,
          feedback: "نقش و هدف دقیق تعریف شده‌اند.",
        },
        {
          key: "structure",
          label: "ساختار",
          score: 94,
          feedback: "مراحل پاسخ ترتیب منطقی دارند.",
        },
        {
          key: "examples",
          label: "مثال",
          score: 72,
          feedback: "یک نمونه کامل می‌تواند ابهام را کاهش دهد.",
        },
      ],
      suggestions: [
        {
          severity: "info",
          title: "افزودن نمونه",
          description: "یک ورودی کوتاه و شکل خروجی مطلوب اضافه کنید.",
        },
      ],
      provider: "openai",
      model: "seed-demo-model",
      inputHash: hash(architectContent),
    },
  ]);

  await upsertDocuments(Notification.collection.collectionName, [
    {
      _id: id("notification:improvement"),
      recipientId: users.architect,
      actorId: users.builder,
      type: "improvement-opened",
      title: "پیشنهاد بهبود جدید",
      body: "امیر برای پرامپت معمار سامانه‌های هوش مصنوعی پیشنهادی فرستاد.",
      entityModel: "ImprovementRequest",
      entityId: improvementId,
      href: `/improvements/${improvementId.toHexString()}`,
      metadata: {},
      dedupeKey: "seed:improvement-opened",
      readAt: new Date("2026-07-03T09:00:00.000Z"),
    },
    {
      _id: id("notification:message"),
      recipientId: users.builder,
      actorId: users.architect,
      type: "message",
      title: "پیام جدید از سارا",
      body: "نمونه تست و معیار شکست را بفرست تا با هم بررسی کنیم.",
      entityModel: "Conversation",
      entityId: directConversationId,
      href: `/messages/${directConversationId.toHexString()}`,
      metadata: {},
      dedupeKey: "seed:direct-message-2",
      readAt: new Date("2026-07-09T17:33:00.000Z"),
    },
  ]);

  await upsertDocuments(Report.collection.collectionName, [
    {
      _id: id("report:demo-resolved"),
      reporterId: users.researcher,
      targetModel: "Comment",
      targetId: id("comment:architect:1"),
      reason: "other",
      details: "گزارش آزمایشی برای نمایش گردش‌کار مدیریت محتوا.",
      status: "dismissed",
      assignedToId: users.moderator,
      resolution: "محتوا نقض قوانین نداشت؛ گزارش آزمایشی بسته شد.",
      resolvedAt: new Date("2026-06-03T08:00:00.000Z"),
    },
  ]);
  await upsertDocuments(Block.collection.collectionName, []);

  // The seed is also the local-development schema bootstrap. Reconciliation keeps
  // indexes aligned when an earlier MVP schema already exists without deleting data.
  await Promise.all([
    User.syncIndexes(),
    Session.syncIndexes(),
    OtpChallenge.syncIndexes(),
    Prompt.syncIndexes(),
    PromptVersion.syncIndexes(),
    Skill.syncIndexes(),
    SkillVersion.syncIndexes(),
    ImprovementRequest.syncIndexes(),
    ImprovementDiscussionMessage.syncIndexes(),
    Comment.syncIndexes(),
    Like.syncIndexes(),
    Reaction.syncIndexes(),
    Save.syncIndexes(),
    Rating.syncIndexes(),
    Follow.syncIndexes(),
    Notification.syncIndexes(),
    Conversation.syncIndexes(),
    ConversationMember.syncIndexes(),
    Message.syncIndexes(),
    ReputationEvent.syncIndexes(),
    Achievement.syncIndexes(),
    UserAchievement.syncIndexes(),
    AIJob.syncIndexes(),
    AIAnalysis.syncIndexes(),
    RateLimit.syncIndexes(),
    Report.syncIndexes(),
    Block.syncIndexes(),
    ModerationAction.syncIndexes(),
    NewsArticle.syncIndexes(),
  ]);

  console.log("ProAI Persian development data seeded successfully.");
  console.log("Accounts: 09121111111, 09122222222, 09123333333, 09383091833 (admin)");
  if (!isDevelopment) {
    if (!seedPrivilegedDemoUser) {
      console.log(
        "The proai-team demo account was seeded without moderator or admin roles.",
      );
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
