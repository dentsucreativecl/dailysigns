export interface Category {
  id: string;
  label: string;
  query: string;
  color: string;
  active: boolean;
  created_at: string;
}

export interface NewsItem {
  id: string;
  category_id: string;
  category_label: string;
  title: string;
  summary: string;
  source: string;
  relevance: string | null;
  time_ago: string | null;
  url: string | null;
  image_url: string | null;
  fetched_at: string;
}

export interface ArticleFromAI {
  title: string;
  summary: string;
  source: string;
  relevance: string;
  time_ago: string;
  url: string;
}
