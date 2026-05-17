import { PREP_BRAND_LATIN, PREP_BRAND_NAV_HE, PREP_LOGO_PATH } from "@/lib/prep/brand";

export type JsonLdPrimitive = string | number | boolean | null;
export type JsonLdValue = JsonLdPrimitive | JsonLdObject | JsonLdValue[];
export type JsonLdObject = { [key: string]: JsonLdValue };

export function JsonLdScript({ data }: { data: JsonLdObject }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd(baseUrl: string): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: PREP_BRAND_LATIN,
    url: `${baseUrl}/prep`,
    logo: `${baseUrl}${PREP_LOGO_PATH}`,
    description: `${PREP_BRAND_LATIN}: ${PREP_BRAND_NAV_HE}`,
  };
}
