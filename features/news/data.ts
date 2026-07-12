export type NewsSection = {
  heading: string;
  paragraphs: readonly string[];
};

export type NewsStory = {
  id: string;
  slug: string;
  featured?: boolean;
  category: string;
  date: string;
  dateFull: string;
  readTime: string;
  source: string;
  title: string;
  summary: string;
  sourceUrl: string;
  coverImage: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  sections: readonly NewsSection[];
  takeaways: readonly string[];
};

export const newsStories = [
  {
    id: "00",
    slug: "gpt-5-6-frontier-model-family",
    featured: true,
    category: "مدل‌های زبانی",
    date: "۱۸ تیر",
    dateFull: "۱۸ تیر ۱۴۰۵",
    readTime: "۶ دقیقه",
    source: "OpenAI",
    title: "GPT‑5.6 با سه سطح تازه برای کارهای روزمره تا پیچیده عرضه شد",
    summary:
      "خانواده جدید با مدل‌های Sol، Terra و Luna روی کیفیت بیشتر به‌ازای هر توکن، کار با ابزارها و انجام پروژه‌های بلندمدت تمرکز دارد.",
    sourceUrl: "https://openai.com/index/gpt-5-6/",
    coverImage: "/images/news/ai-agent-newsroom-cover.png",
    accent: "bg-[#caffdf]",
    accentSoft: "bg-[#caffdf]/10",
    accentText: "text-[#8effc1]",
    sections: [
      {
        heading: "یک خانواده، سه سطح توان",
        paragraphs: [
          "OpenAI در نسل ۵.۶ به‌جای یک مدل واحد، سه سطح پایدار معرفی کرده است: Sol برای دشوارترین کارها، Terra برای تعادل میان کیفیت و هزینه، و Luna برای پاسخ‌گویی سریع و اقتصادی. این ساختار به تیم‌ها اجازه می‌دهد مدل را با عمق واقعی هر وظیفه هماهنگ کنند.",
          "تمرکز اصلی این نسل فقط روی امتیازهای بنچمارک نیست. توانایی دنبال‌کردن کارهای طولانی، استفاده برنامه‌ریزی‌شده از ابزارها و ساخت خروجی‌های حرفه‌ای در کد، سند و ارائه از محورهای اصلی معرفی هستند.",
        ],
      },
      {
        heading: "برای سازندگان چه تغییری می‌کند؟",
        paragraphs: [
          "انتخاب مدل حالا بیش از گذشته یک تصمیم محصولی است. یک گردش‌کار می‌تواند مرحله‌های ساده را به Luna، تحلیل‌های میانی را به Terra و تصمیم‌های حساس را به Sol بسپارد؛ بدون اینکه تجربه کاربر به یک مدل ثابت وابسته بماند.",
          "پشتیبانی از ابزارها و کارهای چندمرحله‌ای نیز به این معناست که ارزیابی کیفیت باید از پاسخ نهایی فراتر برود و هزینه، تعداد فراخوانی ابزار و پایداری مسیر اجرا را هم اندازه بگیرد.",
        ],
      },
    ],
    takeaways: [
      "سه سطح Sol، Terra و Luna برای نیازها و بودجه‌های متفاوت",
      "تمرکز بیشتر روی کارهای بلندمدت و استفاده از ابزار",
      "عرضه در ChatGPT، Codex و API",
    ],
  },
  {
    id: "01",
    slug: "meta-muse-spark-1-1-model-api",
    category: "ایجنت‌ها",
    date: "۱۸ تیر",
    dateFull: "۱۸ تیر ۱۴۰۵",
    readTime: "۵ دقیقه",
    source: "Meta AI",
    title: "Muse Spark 1.1 و پیش‌نمایش عمومی API جدید متا معرفی شدند",
    summary: "مدلی چندوجهی برای کدنویسی، کار با رایانه و هماهنگی چند ایجنت.",
    sourceUrl: "https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/",
    coverImage: "/images/news/ai-agent-newsroom-cover.png",
    accent: "bg-[#b8ffdf]",
    accentSoft: "bg-[#b8ffdf]/10",
    accentText: "text-[#8effc1]",
    sections: [
      {
        heading: "مدلی برای انجام کار، نه فقط پاسخ‌دادن",
        paragraphs: [
          "Muse Spark 1.1 یک مدل استدلالی چندوجهی است که برای وظایف ایجنتی ساخته شده؛ یعنی می‌تواند زمینه را جمع‌آوری کند، برنامه بسازد و اجرای بخش‌های مختلف را میان ابزارها یا ایجنت‌های دیگر تقسیم کند.",
          "متا می‌گوید مدل تازه در کار با رایانه، کدنویسی و درک ورودی‌های تصویری پیشرفت کرده و می‌تواند میان نوشتن اسکریپت و تعامل مستقیم با رابط کاربری انتخاب کند.",
        ],
      },
      {
        heading: "API تازه برای توسعه‌دهندگان",
        paragraphs: [
          "هم‌زمان با مدل، Meta Model API به‌صورت پیش‌نمایش عمومی معرفی شده است. این مسیر به توسعه‌دهندگان اجازه می‌دهد Muse Spark 1.1 را در گردش‌کارهای خود آزمایش کنند و سناریوهای چندابزاری را بسازند.",
          "برای تیم‌های محصول، نکته مهم توانایی مدیریت زمینه‌های بلند و هماهنگی چند ایجنت است؛ قابلیتی که باید در پروژه واقعی از نظر تأخیر، قابلیت بازیابی و کنترل خطا سنجیده شود.",
        ],
      },
    ],
    takeaways: [
      "تمرکز روی برنامه‌ریزی و هماهنگی چند ایجنت",
      "بهبود کدنویسی و کار مستقیم با رایانه",
      "دسترسی توسعه‌دهندگان از طریق Meta Model API",
    ],
  },
  {
    id: "02",
    slug: "making-of-claude-code",
    category: "توسعه نرم‌افزار",
    date: "۱۵ تیر",
    dateFull: "۱۵ تیر ۱۴۰۵",
    readTime: "۷ دقیقه",
    source: "Anthropic",
    title: "داستان ساخت Claude Code؛ از ابزار داخلی تا یک ایجنت کدنویسی",
    summary: "روایتی از تصمیم‌ها و آزمایش‌هایی که ابزار خط فرمان Anthropic را شکل دادند.",
    sourceUrl: "https://www.anthropic.com/features/making-of-claude-code",
    coverImage: "/images/news/claude-code-editorial-cover.png",
    accent: "bg-[#ffd6ad]",
    accentSoft: "bg-[#ffd6ad]/10",
    accentText: "text-[#ffd6ad]",
    sections: [
      {
        heading: "شروع از یک نیاز داخلی",
        paragraphs: [
          "Claude Code ابتدا برای حل مسئله‌های روزمره مهندسان Anthropic ساخته شد. نزدیک‌بودن سازندگان به کاربران اولیه باعث شد بازخوردها سریع وارد محصول شوند و ابزار به‌جای نمایش قابلیت مدل، حول جریان واقعی توسعه نرم‌افزار شکل بگیرد.",
          "محیط خط فرمان انتخاب مهمی بود: ایجنت می‌توانست کنار ابزارهای موجود توسعه‌دهنده کار کند، فایل‌ها را ببیند، فرمان اجرا کند و نتیجه را در همان زمینه دنبال کند.",
        ],
      },
      {
        heading: "اعتماد از مسیر مشاهده‌پذیری",
        paragraphs: [
          "یک ایجنت کدنویسی زمانی قابل اتکا می‌شود که کاربر بتواند مسیر تصمیم‌ها و تغییرها را دنبال کند. تجربه ساخت Claude Code نشان می‌دهد کنترل، بازگشت‌پذیری و بازخورد سریع به‌اندازه کیفیت تولید کد اهمیت دارند.",
          "برای تیم‌هایی که ابزار مشابه می‌سازند، درس اصلی این است که رابط ایجنت باید با عادت‌های موجود توسعه‌دهنده هماهنگ باشد و هنگام نیاز، کنترل را شفاف به انسان برگرداند.",
        ],
      },
    ],
    takeaways: [
      "محصول از استفاده روزمره مهندسان خود Anthropic رشد کرد",
      "خط فرمان زمینه مشترک خوبی برای انسان و ایجنت فراهم کرد",
      "مشاهده‌پذیری و کنترل، بخش اصلی تجربه اعتماد هستند",
    ],
  },
  {
    id: "03",
    slug: "google-gemma-4-12b-local-agents",
    category: "مدل‌های باز",
    date: "۱۰ تیر",
    dateFull: "۱۰ تیر ۱۴۰۵",
    readTime: "۴ دقیقه",
    source: "Google",
    title: "Gemma 4 12B اجرای ایجنت‌های محلی را به لپ‌تاپ‌ها می‌آورد",
    summary: "مدل تازه گوگل با حافظه ۱۶ گیگابایت، ورودی تصویر و پردازش بومی صدا اجرا می‌شود.",
    sourceUrl: "https://blog.google/innovation-and-ai/technology/ai/google-ai-updates-june-2026/",
    coverImage: "/images/news/local-ai-laptop-cover.png",
    accent: "bg-[#c9dcff]",
    accentSoft: "bg-[#c9dcff]/10",
    accentText: "text-[#c9dcff]",
    sections: [
      {
        heading: "هوش محلی، نزدیک‌تر به محصول",
        paragraphs: [
          "Gemma 4 12B برای اجرای محلی روی لپ‌تاپی با ۱۶ گیگابایت حافظه معرفی شده است. ترکیب ورودی تصویر، پردازش صوت و معماری یکپارچه، آن را برای نمونه‌سازی ایجنت‌هایی مناسب می‌کند که نباید برای هر مرحله به ابر وابسته باشند.",
          "اجرای محلی می‌تواند تأخیر را کاهش دهد و کنترل بیشتری روی داده ایجاد کند؛ هرچند تیم‌ها همچنان باید مصرف حافظه، سرعت و کیفیت مدل را روی سخت‌افزار هدف خود بسنجند.",
        ],
      },
      {
        heading: "یک مسیر ترکیبی برای تیم‌ها",
        paragraphs: [
          "مدل‌های کوچک محلی لزوماً جایگزین مدل‌های مرزی نیستند. معماری عملی‌تر می‌تواند وظایف خصوصی یا پرتکرار را محلی نگه دارد و فقط مسئله‌های پیچیده را به مدل ابری بسپارد.",
          "این الگو برای دستیارهای سازمانی، ابزارهای آفلاین و محصولاتی که با صوت و تصویر کار می‌کنند جذاب است؛ چون بخشی از تجربه حتی با اتصال محدود هم در دسترس می‌ماند.",
        ],
      },
    ],
    takeaways: [
      "اجرای محلی با ۱۶ گیگابایت حافظه",
      "پشتیبانی از تصویر و پردازش بومی صوت",
      "مناسب برای معماری ترکیبی محلی و ابری",
    ],
  },
  {
    id: "04",
    slug: "meta-muse-image-video-content-seal",
    category: "رسانه مولد",
    date: "۱۶ تیر",
    dateFull: "۱۶ تیر ۱۴۰۵",
    readTime: "۵ دقیقه",
    source: "Meta AI",
    title: "Muse Image منتشر شد و Muse Video در راه است",
    summary: "متا همراه مدل تصویر تازه، نشان نامرئی Content Seal را برای اصالت‌سنجی معرفی کرد.",
    sourceUrl: "https://ai.meta.com/blog/introducing-muse-image-muse-video-msl/",
    coverImage: "/images/news/generative-media-cover.png",
    accent: "bg-[#e8d2ff]",
    accentSoft: "bg-[#e8d2ff]/10",
    accentText: "text-[#e8d2ff]",
    sections: [
      {
        heading: "نسل تازه رسانه در متا",
        paragraphs: [
          "Muse Image مدل تازه تولید و ویرایش تصویر متا است و Muse Video نیز به‌صورت پیش‌نمایش معرفی شده. تمرکز محصول روی پیروی دقیق‌تر از دستور، ترکیب چند مرجع و آوردن تولید رسانه به تجربه‌های اجتماعی متا است.",
          "مدل ویدئو هنوز در مسیر عرضه قرار دارد و متا به چالش‌هایی مانند هماهنگی صوت و تصویر و حرکت‌های سریع از نظر فیزیکی اشاره کرده است.",
        ],
      },
      {
        heading: "Content Seal چه می‌کند؟",
        paragraphs: [
          "تصویرهای تولیدشده با Muse Image یک سیگنال نامرئی منشأ دریافت می‌کنند که برای باقی‌ماندن پس از برش، فشرده‌سازی، تغییر اندازه یا اسکرین‌شات طراحی شده است.",
          "این رویکرد اصالت‌سنجی را از یک برچسب ظاهری به بخشی از زیرساخت محتوا تبدیل می‌کند. ارزش واقعی آن به پوشش ابزار تشخیص و سازگاری میان پلتفرم‌ها وابسته خواهد بود.",
        ],
      },
    ],
    takeaways: [
      "Muse Image برای تولید و ویرایش دقیق‌تر تصویر",
      "پیش‌نمایش Muse Video برای تولید ویدئو",
      "Content Seal به‌عنوان سیگنال نامرئی منشأ محتوا",
    ],
  },
] as const satisfies readonly NewsStory[];

export const leadStory = newsStories[0];
export const homeNewsItems = newsStories.slice(1);

export function getNewsStory(slug: string) {
  return newsStories.find((story) => story.slug === slug);
}
