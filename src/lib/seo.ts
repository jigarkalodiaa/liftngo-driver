import type { Metadata } from "next";
import {
  SITE_URL,
  SITE_NAME,
  SEO_KEYWORDS,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  absoluteShareImageUrl,
} from "@/lib/site";

interface PageSEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  nofollow?: boolean;
  useAbsoluteTitle?: boolean;
  keywords?: string[];
}

export function generatePageMetadata({
  title,
  description,
  path = "",
  image = OG_IMAGE_PATH,
  noIndex = false,
  nofollow = false,
  useAbsoluteTitle = false,
  keywords = [],
}: PageSEOProps): Metadata {
  const url = `${SITE_URL}${path}`;
  const imageUrl = absoluteShareImageUrl(image);
  const ogW = image === OG_IMAGE_PATH ? OG_IMAGE_WIDTH : 1200;
  const ogH = image === OG_IMAGE_PATH ? OG_IMAGE_HEIGHT : 630;

  return {
    title: useAbsoluteTitle ? { absolute: title } : title,
    description,
    keywords: keywords.length > 0 ? keywords : SEO_KEYWORDS,
    alternates: {
      canonical: url,
      languages: {
        "en-IN": url,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_IN",
      images: [{ url: imageUrl, width: ogW, height: ogH, alt: title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: noIndex ? { index: false, follow: !nofollow } : { index: true, follow: true },
  };
}

export function generateArticleMetadata({
  title,
  description,
  path,
  image,
  publishedTime,
  modifiedTime,
  authors,
  tags,
  keywords = [],
  noIndex = false,
  nofollow = false,
  useAbsoluteTitle = false,
}: PageSEOProps & {
  publishedTime: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
}): Metadata {
  const baseMetadata = generatePageMetadata({
    title,
    description,
    path,
    image,
    noIndex,
    nofollow,
    useAbsoluteTitle,
    keywords,
  });

  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      type: "article",
      publishedTime,
      modifiedTime,
      authors,
      tags,
    },
  };
}
