import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  structuredData?: object;
  canonical?: string;
}

/**
 * SEO Head Component für dynamische Meta-Tags und strukturierte Daten
 */
const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = 'Entdecken Sie exklusive Mode und Premium Fashion bei DressForPleasure. Hochwertige Kleidung, stilvolle Accessoires und zeitlose Designs für jeden Anlass.',
  keywords = ['mode', 'fashion', 'kleidung', 'online shop', 'premium', 'style'],
  image = '/images/og-image.jpg',
  url,
  type = 'website',
  noIndex = false,
  structuredData,
  canonical,
}) => {
  const siteTitle = 'DressForPleasure - Premium Mode & Fashion';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const currentUrl = url || window.location.href;
  const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;
    
    // Helper function to update meta tags
    const updateMeta = (name: string, content: string, property: boolean = false) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Update basic meta tags
    updateMeta('description', description);
    updateMeta('keywords', keywords.join(', '));
    updateMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Update Open Graph tags
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', fullImageUrl, true);
    updateMeta('og:url', currentUrl, true);
    updateMeta('og:type', type, true);
    updateMeta('og:site_name', 'DressForPleasure', true);
    updateMeta('og:locale', 'de_DE', true);

    // Update Twitter tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', fullImageUrl);
    updateMeta('twitter:url', currentUrl);

    // Update canonical link
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonical;
    }

    // Update structured data
    if (structuredData) {
      let scriptTag = document.querySelector('script[data-type="structured-data"]') as HTMLScriptElement;
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.type = 'application/ld+json';
        scriptTag.setAttribute('data-type', 'structured-data');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    }
  }, [fullTitle, description, keywords, fullImageUrl, currentUrl, type, noIndex, canonical, structuredData]);

  return null;
};

/**
 * Product SEO Component mit E-Commerce spezifischen Meta-Tags
 */
export const ProductSEO: React.FC<{
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    images: string[];
    category: string;
    inStock: boolean;
    sku?: string;
  };
}> = ({ product }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.images.map(img => img.startsWith('http') ? img : `${window.location.origin}${img}`),
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": "DressForPleasure"
    },
    "category": product.category,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "EUR",
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "DressForPleasure"
      }
    }
  };

  return (
    <SEOHead
      title={product.name}
      description={product.description}
      keywords={['mode', 'fashion', product.category, product.name]}
      image={product.images[0]}
      type="product"
      structuredData={structuredData}
    />
  );
};

/**
 * Category SEO Component für Kategorie-Seiten
 */
export const CategorySEO: React.FC<{
  category: string;
  productCount: number;
}> = ({ category, productCount }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${category} - DressForPleasure`,
    "description": `Entdecken Sie ${productCount} Produkte in der Kategorie ${category}`,
    "url": `${window.location.origin}/produkte?kategorie=${encodeURIComponent(category)}`
  };

  return (
    <SEOHead
      title={`${category} Mode & Fashion`}
      description={`Entdecken Sie ${productCount} hochwertige ${category} Produkte bei DressForPleasure. Premium Qualität und zeitloses Design.`}
      keywords={['mode', 'fashion', category, 'online shop', 'premium']}
      structuredData={structuredData}
    />
  );
};

/**
 * Collection SEO Component für Kollektions-Seiten
 */
export const CollectionSEO: React.FC<{
  collection: {
    name: string;
    description: string;
    productCount: number;
    image?: string;
    season?: string;
  };
}> = ({ collection }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${collection.name} Kollektion - DressForPleasure`,
    "description": collection.description,
    "url": `${window.location.origin}/kollektionen/${encodeURIComponent(collection.name.toLowerCase())}`,
    "image": collection.image ? (collection.image.startsWith('http') ? collection.image : `${window.location.origin}${collection.image}`) : undefined
  };

  return (
    <SEOHead
      title={`${collection.name} Kollektion`}
      description={collection.description}
      keywords={['kollektion', 'mode', 'fashion', collection.name, collection.season].filter(Boolean)}
      image={collection.image}
      structuredData={structuredData}
    />
  );
};

export default SEOHead;
