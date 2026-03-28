export interface ArticleSection {
  subheading: string;
  paragraph: string;
  image: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  tag: string;
  img: string;
  excerpt: string;
  content: string;
  sections?: ArticleSection[];
  author: string;
  avatar: string;
  createdAt: string | null;
  views: number;
}

export interface NewsFormData {
  title: string;
  slug: string;
  tag: string;
  img: string;
  excerpt: string;
  content: string;
  sections?: ArticleSection[];
  author: string;
  avatar: string;
}

export const NEWS_TAGS = [
  "ब्रेकिंग",
  "राजनीति",
  "खेल",
  "टेक",
  "मनोरंजन",
  "फ़िल्मी दुनिया",
  "रोचक-तथ्य",
  "शिक्षा",
  "अंतरराष्ट्रीय",
  "बिज़नेस",
  "स्वास्थ्य",
  "विज्ञान",
  "अपराध",
  "ऑटो",
];
