'use strict';

// src/types.ts
var Breakpoints = [
  { id: "desktop", minWidth: 1200 },
  { id: "tablet", minWidth: 768 },
  { id: "mobile", minWidth: 375 }
];

// src/style.ts
function mergeStyle(base, override) {
  var _a, _b;
  const next = { ...base, ...override != null ? override : {} };
  if (base.cssVars || (override == null ? void 0 : override.cssVars)) {
    next.cssVars = { ...(_a = base.cssVars) != null ? _a : {}, ...(_b = override == null ? void 0 : override.cssVars) != null ? _b : {} };
  }
  return next;
}
function resolveStyle(style, bp) {
  if (!style.overrides || !style.overrides[bp]) return style.base;
  return mergeStyle(style.base, style.overrides[bp]);
}
function toKebabCase(key) {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}
function styleToCss(style) {
  const pairs = [];
  for (const [key, value] of Object.entries(style)) {
    if (value == null || key === "cssVars") continue;
    pairs.push(`${toKebabCase(key)}: ${value};`);
  }
  if (style.cssVars) {
    for (const [key, value] of Object.entries(style.cssVars)) {
      if (value == null) continue;
      const name = key.startsWith("--") ? key : `--${key}`;
      pairs.push(`${name}: ${value};`);
    }
  }
  return pairs.join(" ");
}

// src/templates.ts
var layoutTokens = {
  paddingDesktop: "80px 32px",
  paddingMobile: "48px 24px",
  maxWidthWide: "1280px",
  maxWidthStandard: "896px",
  maxWidthReading: "768px",
  gapTight: "16px",
  gapSection: "24px",
  gapGridX: "32px"};
var colorTokens = {
  primaryText: "#111827",
  bodyText: "#4b5563",
  mutedText: "#6b7280",
  border: "#f3f4f6",
  lightBg: "#f9fafb"
};
var typographyTokens = {
  display: {
    base: { fontSize: "48px", lineHeight: "1.1", fontWeight: "600", letterSpacing: "-0.025em", color: colorTokens.primaryText },
    mobile: { fontSize: "36px" }
  },
  section: {
    base: { fontSize: "30px", lineHeight: "1.2", fontWeight: "700", letterSpacing: "-0.02em", color: colorTokens.primaryText },
    mobile: { fontSize: "24px" }
  },
  card: {
    base: { fontSize: "18px", lineHeight: "1.3", fontWeight: "600", color: colorTokens.primaryText }
  },
  lead: {
    base: { fontSize: "20px", lineHeight: "1.6", color: colorTokens.bodyText }
  },
  body: {
    base: { fontSize: "16px", lineHeight: "1.65", color: colorTokens.bodyText }
  },
  meta: {
    base: { fontSize: "14px", fontWeight: "500", color: colorTokens.mutedText }
  }
};
function sectionPaddingStyle(base = {}) {
  return {
    base: {
      width: "100%",
      padding: layoutTokens.paddingDesktop,
      ...base
    },
    overrides: {
      mobile: {
        padding: layoutTokens.paddingMobile
      }
    }
  };
}
function contentWidthStyle(width, base = {}, overrides = {}) {
  const maxWidthMap = {
    wide: layoutTokens.maxWidthWide,
    standard: layoutTokens.maxWidthStandard,
    reading: layoutTokens.maxWidthReading
  };
  return {
    base: {
      width: "100%",
      maxWidth: maxWidthMap[width],
      margin: "0 auto",
      ...base
    },
    overrides
  };
}
function headingDisplayStyle() {
  return {
    base: typographyTokens.display.base,
    overrides: { mobile: typographyTokens.display.mobile }
  };
}
function headingSectionStyle() {
  return {
    base: typographyTokens.section.base,
    overrides: { mobile: typographyTokens.section.mobile }
  };
}
function headingCardStyle() {
  return {
    base: typographyTokens.card.base
  };
}
function leadTextStyle(color) {
  return {
    base: { ...typographyTokens.lead.base, ...{ color }  }
  };
}
function bodyTextStyle() {
  return {
    base: typographyTokens.body.base
  };
}
function metaTextStyle() {
  return {
    base: typographyTokens.meta.base
  };
}
function primaryButtonStyle() {
  return {
    display: "inline-block",
    padding: "12px 24px",
    background: "#111827",
    color: "#ffffff",
    borderRadius: "9999px",
    fontWeight: "500",
    border: "1px solid #111827",
    textAlign: "center"
  };
}
function secondaryButtonStyle() {
  return {
    display: "inline-block",
    padding: "12px 24px",
    background: "#f3f4f6",
    color: colorTokens.primaryText,
    borderRadius: "9999px",
    fontWeight: "500",
    border: "1px solid #e5e7eb",
    textAlign: "center"
  };
}
function cardSurfaceStyle(extra) {
  return {
    base: {
      background: "#ffffff",
      borderRadius: "16px",
      border: `1px solid ${colorTokens.border}`,
      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
      ...extra
    }
  };
}
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
function heroSection() {
  return {
    id: "hero-split",
    name: "Hero Split",
    description: "Two-column hero with copy and image.",
    category: "Hero",
    root: "section-hero",
    blocks: {
      "section-hero": {
        id: "section-hero",
        type: "section",
        name: "Hero",
        children: ["container-hero"],
        style: {
          base: {
            width: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: layoutTokens.gapSection,
            padding: layoutTokens.paddingDesktop,
            background: "#0f172a",
            color: "#f8fafc"
          },
          overrides: {
            tablet: { flexDirection: "column" },
            mobile: { flexDirection: "column", gap: layoutTokens.gapSection, padding: layoutTokens.paddingMobile }
          }
        }
      },
      "container-hero": {
        id: "container-hero",
        type: "container",
        name: "Hero Layout",
        children: ["container-hero-copy", "image-hero"],
        style: {
          base: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: layoutTokens.gapSection,
            width: "100%",
            maxWidth: layoutTokens.maxWidthStandard,
            margin: "0 auto"
          },
          overrides: {
            tablet: { flexDirection: "column" },
            mobile: { flexDirection: "column" }
          }
        }
      },
      "container-hero-copy": {
        id: "container-hero-copy",
        type: "container",
        name: "Hero Copy",
        children: ["text-hero-title", "text-hero-body", "button-hero"],
        style: {
          base: {
            display: "flex",
            flexDirection: "column",
            gap: layoutTokens.gapSection,
            maxWidth: layoutTokens.maxWidthStandard,
            textAlign: "center"
          }
        }
      },
      "text-hero-title": {
        id: "text-hero-title",
        type: "text",
        name: "Headline",
        content: { text: "Launch your next site in hours." },
        style: headingDisplayStyle()
      },
      "text-hero-body": {
        id: "text-hero-body",
        type: "text",
        name: "Subhead",
        content: { text: "Design responsive sections, export clean HTML, and ship fast." },
        style: leadTextStyle("#e5e7eb")
      },
      "button-hero": {
        id: "button-hero",
        type: "button",
        name: "Primary CTA",
        content: { label: "Start building", href: "#" },
        style: {
          base: { ...primaryButtonStyle(), width: "fit-content" }
        }
      },
      "image-hero": {
        id: "image-hero",
        type: "image",
        name: "Hero Image",
        content: {
          src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
          alt: "Workspace"
        },
        style: {
          base: {
            width: "100%",
            maxWidth: "520px",
            borderRadius: "18px",
            boxShadow: "0 30px 50px rgba(15, 23, 42, 0.35)"
          },
          overrides: {
            tablet: { width: "100%" },
            mobile: { width: "100%" }
          }
        }
      }
    }
  };
}
function featureGrid() {
  return {
    id: "feature-grid",
    name: "Feature Grid",
    description: "Headline with three feature cards.",
    category: "Features",
    root: "section-features",
    blocks: {
      "section-features": {
        id: "section-features",
        type: "section",
        name: "Features",
        children: ["container-features"],
        style: sectionPaddingStyle({
          display: "flex",
          flexDirection: "column",
          gap: layoutTokens.gapSection,
          background: colorTokens.lightBg,
          color: colorTokens.primaryText
        })
      },
      "container-features": {
        id: "container-features",
        type: "container",
        name: "Feature Layout",
        children: ["text-features-title", "container-feature-cards"],
        style: contentWidthStyle("wide", {
          display: "flex",
          flexDirection: "column",
          gap: layoutTokens.gapSection
        })
      },
      "text-features-title": {
        id: "text-features-title",
        type: "text",
        name: "Section Title",
        content: { text: "Everything you need to launch." },
        style: headingSectionStyle()
      },
      "container-feature-cards": {
        id: "container-feature-cards",
        type: "container",
        name: "Cards",
        children: ["card-1", "card-2", "card-3"],
        meta: { repeatable: true },
        style: {
          base: {
            display: "flex",
            flexDirection: "row",
            gap: layoutTokens.gapGridX,
            flexWrap: "wrap"
          },
          overrides: {
            tablet: { flexDirection: "column" },
            mobile: { flexDirection: "column" }
          }
        }
      },
      "card-1": featureCard("card-1", "Fast setup"),
      "card-2": featureCard("card-2", "Responsive"),
      "card-3": featureCard("card-3", "Exportable")
    }
  };
}
function featureCard(id, title) {
  return {
    id,
    type: "container",
    name: title,
    children: [`${id}-title`, `${id}-body`],
    style: cardSurfaceStyle({
      display: "flex",
      flexDirection: "column",
      gap: layoutTokens.gapTight,
      padding: "20px",
      flex: "1"
    })
  };
}
function featureCardText(id, text, isTitle) {
  return {
    id,
    type: "text",
    name: isTitle ? "Card Title" : "Card Body",
    content: { text },
    style: isTitle ? headingCardStyle() : bodyTextStyle()
  };
}
function ctaBanner() {
  return {
    id: "cta-banner",
    name: "CTA Banner",
    description: "Short call-to-action with button.",
    category: "CTA",
    root: "section-cta",
    blocks: {
      "section-cta": {
        id: "section-cta",
        type: "section",
        name: "CTA",
        children: ["container-cta"],
        style: sectionPaddingStyle({
          display: "flex",
          flexDirection: "column",
          background: "#111827",
          color: "#f9fafb"
        })
      },
      "container-cta": {
        id: "container-cta",
        type: "container",
        name: "CTA Layout",
        children: ["text-cta", "button-cta"],
        style: contentWidthStyle("standard", {
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: layoutTokens.gapSection
        }, {
          tablet: { flexDirection: "column", alignItems: "flex-start" },
          mobile: { flexDirection: "column", alignItems: "flex-start" }
        })
      },
      "text-cta": {
        id: "text-cta",
        type: "text",
        name: "CTA Copy",
        content: { text: "Ready to publish your site?" },
        style: headingSectionStyle()
      },
      "button-cta": {
        id: "button-cta",
        type: "button",
        name: "CTA Button",
        content: { label: "Export now", href: "#" },
        style: {
          base: { ...primaryButtonStyle(), width: "fit-content" }
        }
      }
    }
  };
}
function statsRow() {
  return {
    id: "stats-row",
    name: "Stats Row",
    description: "Three stats in a row.",
    category: "Stats",
    root: "section-stats",
    blocks: {
      "section-stats": {
        id: "section-stats",
        type: "section",
        name: "Stats",
        children: ["container-stats"],
        style: sectionPaddingStyle({
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          color: colorTokens.primaryText
        })
      },
      "container-stats": {
        id: "container-stats",
        type: "container",
        name: "Stats Layout",
        children: ["stat-1", "stat-2", "stat-3"],
        meta: { repeatable: true },
        style: contentWidthStyle("wide", {
          display: "flex",
          flexDirection: "row",
          gap: layoutTokens.gapGridX,
          justifyContent: "space-between"
        }, {
          tablet: { flexDirection: "column" },
          mobile: { flexDirection: "column" }
        })
      },
      ...statCard("stat-1", "120+", "Sections ready"),
      ...statCard("stat-2", "4x", "Faster delivery"),
      ...statCard("stat-3", "99.9%", "Uptime target")
    }
  };
}
function statCard(id, value, label) {
  return {
    [id]: {
      id,
      type: "container",
      name: label,
      children: [`${id}-value`, `${id}-label`],
      style: {
        base: {
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "16px 20px",
          background: "#f8fafc",
          borderRadius: "14px",
          flex: "1"
        }
      }
    },
    [`${id}-value`]: {
      id: `${id}-value`,
      type: "text",
      name: "Value",
      content: { text: value },
      style: {
        base: {
          fontSize: "28px",
          fontWeight: "600"
        }
      }
    },
    [`${id}-label`]: {
      id: `${id}-label`,
      type: "text",
      name: "Label",
      content: { text: label },
      style: {
        base: {
          fontSize: "14px",
          color: "#475569"
        }
      }
    }
  };
}
function logoStrip() {
  return {
    id: "logo-strip",
    name: "Logo Strip",
    description: "Row of brand logos.",
    category: "Social Proof",
    root: "section-logos",
    blocks: {
      "section-logos": {
        id: "section-logos",
        type: "section",
        name: "Logo Strip",
        children: ["container-logos"],
        style: sectionPaddingStyle({
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          color: colorTokens.primaryText
        })
      },
      "container-logos": {
        id: "container-logos",
        type: "container",
        name: "Logo Layout",
        children: ["text-logos-title", "container-logo-row"],
        style: contentWidthStyle("wide", {
          display: "flex",
          flexDirection: "column",
          gap: layoutTokens.gapSection
        })
      },
      "text-logos-title": {
        id: "text-logos-title",
        type: "text",
        name: "Logo Title",
        content: { text: "Trusted by teams at" },
        style: metaTextStyle()
      },
      "container-logo-row": {
        id: "container-logo-row",
        type: "container",
        name: "Logos",
        children: ["logo-1", "logo-2", "logo-3", "logo-4"],
        meta: { repeatable: true },
        style: {
          base: {
            display: "flex",
            flexDirection: "row",
            gap: "24px",
            justifyContent: "space-between",
            flexWrap: "wrap"
          }
        }
      },
      "logo-1": logoText("logo-1", "ALPHA"),
      "logo-2": logoText("logo-2", "ORBIT"),
      "logo-3": logoText("logo-3", "NOVA"),
      "logo-4": logoText("logo-4", "SHIFT")
    }
  };
}
function logoText(id, label) {
  return {
    id,
    type: "text",
    name: "Logo",
    content: { text: label },
    style: {
      base: {
        fontSize: "16px",
        fontWeight: "600",
        letterSpacing: "0.2em",
        color: "#0f172a"
      }
    }
  };
}
function testimonialCards() {
  return {
    id: "testimonial-cards",
    name: "Testimonials",
    description: "Two testimonials side by side.",
    category: "Social Proof",
    root: "section-testimonials",
    blocks: {
      "section-testimonials": {
        id: "section-testimonials",
        type: "section",
        name: "Testimonials",
        children: ["container-testimonials"],
        style: sectionPaddingStyle({
          display: "flex",
          flexDirection: "column",
          background: "#f8fafc",
          color: colorTokens.primaryText
        })
      },
      "container-testimonials": {
        id: "container-testimonials",
        type: "container",
        name: "Testimonials Layout",
        children: ["text-testimonials-title", "container-testimonial-cards"],
        style: contentWidthStyle("standard", {
          display: "flex",
          flexDirection: "column",
          gap: layoutTokens.gapSection
        })
      },
      "text-testimonials-title": {
        id: "text-testimonials-title",
        type: "text",
        name: "Testimonials Title",
        content: { text: "Loved by fast-moving teams." },
        style: headingSectionStyle()
      },
      "container-testimonial-cards": {
        id: "container-testimonial-cards",
        type: "container",
        name: "Testimonial Cards",
        children: ["testimonial-1", "testimonial-2"],
        meta: { repeatable: true },
        style: {
          base: {
            display: "flex",
            flexDirection: "row",
            gap: layoutTokens.gapGridX
          },
          overrides: {
            tablet: { flexDirection: "column" },
            mobile: { flexDirection: "column" }
          }
        }
      },
      ...testimonialCard(
        "testimonial-1",
        "We shipped a full landing page in a single afternoon. The export was clean and easy to tweak.",
        "Jiyun Park \xB7 Product Lead"
      ),
      ...testimonialCard(
        "testimonial-2",
        "Responsive tweaks are painless. It feels like a design system with a publish button.",
        "Minseo Kim \xB7 Growth Designer"
      )
    }
  };
}
function testimonialCard(id, quote, name) {
  return {
    [id]: {
      id,
      type: "container",
      name: "Testimonial",
      children: [`${id}-quote`, `${id}-name`],
      style: cardSurfaceStyle({
        display: "flex",
        flexDirection: "column",
        gap: layoutTokens.gapTight,
        padding: "24px",
        flex: "1"
      })
    },
    [`${id}-quote`]: {
      id: `${id}-quote`,
      type: "text",
      name: "Quote",
      content: { text: quote },
      style: bodyTextStyle()
    },
    [`${id}-name`]: {
      id: `${id}-name`,
      type: "text",
      name: "Name",
      content: { text: name },
      style: metaTextStyle()
    }
  };
}
function pricingCards() {
  return {
    id: "pricing-cards",
    name: "Pricing Cards",
    description: "Three pricing options.",
    category: "Pricing",
    root: "section-pricing",
    blocks: {
      "section-pricing": {
        id: "section-pricing",
        type: "section",
        name: "Pricing",
        children: ["container-pricing"],
        style: sectionPaddingStyle({
          display: "flex",
          flexDirection: "column",
          background: "#eef2f7",
          color: colorTokens.primaryText
        })
      },
      "container-pricing": {
        id: "container-pricing",
        type: "container",
        name: "Pricing Layout",
        children: ["text-pricing-title", "container-pricing-cards"],
        style: contentWidthStyle("wide", {
          display: "flex",
          flexDirection: "column",
          gap: layoutTokens.gapSection
        })
      },
      "text-pricing-title": {
        id: "text-pricing-title",
        type: "text",
        name: "Pricing Title",
        content: { text: "Pricing that scales with you." },
        style: headingSectionStyle()
      },
      "container-pricing-cards": {
        id: "container-pricing-cards",
        type: "container",
        name: "Pricing Cards",
        children: ["pricing-1", "pricing-2", "pricing-3"],
        meta: { repeatable: true },
        style: {
          base: {
            display: "flex",
            flexDirection: "row",
            gap: layoutTokens.gapGridX
          },
          overrides: {
            tablet: { flexDirection: "column" },
            mobile: { flexDirection: "column" }
          }
        }
      },
      ...pricingCard("pricing-1", "Starter", "$19", "Choose Starter", false),
      ...pricingCard("pricing-2", "Growth", "$49", "Choose Growth", true),
      ...pricingCard("pricing-3", "Scale", "$99", "Choose Scale", false)
    }
  };
}
function pricingCard(id, plan, price, cta2, accent) {
  const textColor = accent ? "#f8fafc" : colorTokens.primaryText;
  const subColor = accent ? "#cbd5f5" : colorTokens.mutedText;
  const background = accent ? "#111827" : "#ffffff";
  const border = accent ? "1px solid #1f2937" : `1px solid ${colorTokens.border}`;
  const buttonBase = accent ? primaryButtonStyle() : secondaryButtonStyle();
  const priceStyle = headingSectionStyle();
  const planStyle = metaTextStyle();
  return {
    [id]: {
      id,
      type: "container",
      name: plan,
      children: [`${id}-plan`, `${id}-price`, `${id}-button`],
      style: cardSurfaceStyle({
        display: "flex",
        flexDirection: "column",
        gap: layoutTokens.gapTight,
        padding: "24px",
        background,
        border,
        textAlign: "center",
        flex: "1"
      })
    },
    [`${id}-plan`]: {
      id: `${id}-plan`,
      type: "text",
      name: "Plan",
      content: { text: plan },
      style: { base: { ...planStyle.base, color: subColor } }
    },
    [`${id}-price`]: {
      id: `${id}-price`,
      type: "text",
      name: "Price",
      content: { text: price },
      style: { base: { ...priceStyle.base, color: textColor }, overrides: priceStyle.overrides }
    },
    [`${id}-button`]: {
      id: `${id}-button`,
      type: "button",
      name: "CTA",
      content: { label: cta2, href: "#" },
      style: {
        base: { ...buttonBase, width: "fit-content", margin: "0 auto" }
      }
    }
  };
}
function footerSection() {
  return {
    id: "footer-simple",
    name: "Footer Simple",
    description: "Footer with brand and links.",
    category: "Footer",
    root: "section-footer",
    blocks: {
      "section-footer": {
        id: "section-footer",
        type: "section",
        name: "Footer",
        children: ["container-footer"],
        style: sectionPaddingStyle({
          display: "flex",
          flexDirection: "column",
          background: "#0f172a",
          color: "#e2e8f0"
        })
      },
      "container-footer": {
        id: "container-footer",
        type: "container",
        name: "Footer Layout",
        children: ["text-footer-brand", "container-footer-links"],
        style: contentWidthStyle("standard", {
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: layoutTokens.gapSection
        }, {
          tablet: { flexDirection: "column" },
          mobile: { flexDirection: "column" }
        })
      },
      "text-footer-brand": {
        id: "text-footer-brand",
        type: "text",
        name: "Brand",
        content: { text: "PageGL Studio" },
        style: headingCardStyle()
      },
      "container-footer-links": {
        id: "container-footer-links",
        type: "container",
        name: "Footer Links",
        children: ["text-footer-link-1", "text-footer-link-2", "text-footer-link-3"],
        style: {
          base: {
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }
        }
      },
      "text-footer-link-1": linkText("text-footer-link-1", "Product"),
      "text-footer-link-2": linkText("text-footer-link-2", "Pricing"),
      "text-footer-link-3": linkText("text-footer-link-3", "Contact")
    }
  };
}
function linkText(id, label) {
  return {
    id,
    type: "text",
    name: "Footer Link",
    content: { text: label },
    style: metaTextStyle()
  };
}
function attachCardText(template, bodyMap) {
  var _a, _b;
  const blocks = template.blocks;
  const cardIds = Object.keys(blocks).filter((id) => id.startsWith("card-"));
  for (const cardId of cardIds) {
    const block = blocks[cardId];
    if (!block.children) continue;
    const titleId = `${cardId}-title`;
    const bodyId = `${cardId}-body`;
    const bodyText = (_a = bodyMap == null ? void 0 : bodyMap[cardId]) != null ? _a : "Explain the benefit in one clear sentence.";
    blocks[titleId] = featureCardText(titleId, (_b = block.name) != null ? _b : "Feature", true);
    blocks[bodyId] = featureCardText(bodyId, bodyText, false);
    block.children = [titleId, bodyId];
  }
}
var hero = heroSection();
var features = featureGrid();
var logos = logoStrip();
var testimonials = testimonialCards();
var pricing = pricingCards();
var cta = ctaBanner();
var stats = statsRow();
var footer = footerSection();
attachCardText(features, {
  "card-1": "Build sections in minutes.",
  "card-2": "Desktop, tablet, mobile ready.",
  "card-3": "Clean HTML & CSS output."
});
var sectionTemplates = [
  hero,
  features,
  logos,
  testimonials,
  pricing,
  cta,
  stats,
  footer
];
function instantiateSectionTemplate(template) {
  var _a, _b;
  const suffix = Math.random().toString(16).slice(2, 8);
  const idMap = /* @__PURE__ */ new Map();
  for (const id of Object.keys(template.blocks)) {
    idMap.set(id, `${id}-${suffix}`);
  }
  const blocks = {};
  for (const block of Object.values(template.blocks)) {
    const next = clone(block);
    next.id = (_a = idMap.get(block.id)) != null ? _a : block.id;
    if (next.children) {
      next.children = next.children.map((childId) => {
        var _a2;
        return (_a2 = idMap.get(childId)) != null ? _a2 : childId;
      });
    }
    blocks[next.id] = next;
  }
  return {
    rootId: (_b = idMap.get(template.root)) != null ? _b : template.root,
    blocks
  };
}

// src/document.ts
var defaultPageStyle = {
  background: "#f8fafc",
  color: "#0f172a",
  fontSize: "16px",
  lineHeight: "1.6"
};
var starterTemplateIds = [
  "hero-split",
  "feature-grid",
  "cta-banner",
  "footer-simple"
];
function buildStarterSections() {
  const blocks = {};
  const order = [];
  for (const id of starterTemplateIds) {
    const template = sectionTemplates.find((item) => item.id === id);
    if (!template) continue;
    const inst = instantiateSectionTemplate(template);
    Object.assign(blocks, inst.blocks);
    order.push(inst.rootId);
  }
  return { blocks, order };
}
function createDefaultDocument() {
  const { blocks: sectionBlocks, order } = buildStarterSections();
  return {
    version: 1,
    breakpoints: Breakpoints,
    page: {
      title: "Untitled",
      lang: "en",
      style: { base: defaultPageStyle }
    },
    root: "page-root",
    blocks: {
      "page-root": {
        id: "page-root",
        type: "container",
        name: "Page",
        children: order,
        style: {
          base: {
            display: "flex",
            flexDirection: "column"
          }
        }
      },
      ...sectionBlocks
    }
  };
}
function cloneDocument(doc) {
  return JSON.parse(JSON.stringify(doc));
}

// src/exporter.ts
function sanitizeClass(id) {
  return `b-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}
function renderBlock(doc, blockId) {
  var _a, _b;
  const block = doc.blocks[blockId];
  if (!block) return "";
  const className = sanitizeClass(block.id);
  const attrs = `class="${className}" data-block-id="${block.id}"`;
  switch (block.type) {
    case "section":
      return `<section ${attrs}>${renderChildren(doc, block)}</section>`;
    case "container":
      return `<div ${attrs}>${renderChildren(doc, block)}</div>`;
    case "text":
      return `<p ${attrs}>${escapeHtml(block.content.text)}</p>`;
    case "image":
      return `<img ${attrs} src="${escapeHtml(block.content.src)}" alt="${escapeHtml(
        (_a = block.content.alt) != null ? _a : ""
      )}" />`;
    case "button":
      return `<a ${attrs} href="${escapeHtml((_b = block.content.href) != null ? _b : "#")}">${escapeHtml(
        block.content.label
      )}</a>`;
    default:
      return "";
  }
}
function renderChildren(doc, block) {
  if (!block.children || block.children.length === 0) return "";
  return block.children.map((id) => renderBlock(doc, id)).join("");
}
function sortBreakpoints(bps) {
  return [...bps].sort((a, b) => a.minWidth - b.minWidth);
}
function maxWidthFor(bp, sorted) {
  const index = sorted.findIndex((item) => item.id === bp.id);
  if (index < 0 || index === sorted.length - 1) return null;
  return sorted[index + 1].minWidth - 1;
}
function cssForResponsive(selector, style, breakpoints) {
  const cssChunks = [];
  const baseCss = styleToCss(style.base);
  if (baseCss) cssChunks.push(`${selector} { ${baseCss} }`);
  if (!style.overrides) return cssChunks;
  const sorted = sortBreakpoints(breakpoints);
  const byId = new Map(sorted.map((bp) => [bp.id, bp]));
  const order = ["tablet", "mobile"];
  for (const id of order) {
    const override = style.overrides[id];
    const bp = byId.get(id);
    if (!override || !bp) continue;
    const maxWidth = maxWidthFor(bp, sorted);
    if (!maxWidth) continue;
    const css = styleToCss({ ...style.base, ...override });
    if (!css) continue;
    cssChunks.push(`@media (max-width: ${maxWidth}px) { ${selector} { ${css} } }`);
  }
  return cssChunks;
}
function cssForPage(page, breakpoints) {
  return cssForResponsive("body", page.style, breakpoints).join("\n");
}
function cssForBlocks(doc) {
  const cssChunks = [];
  for (const block of Object.values(doc.blocks)) {
    cssChunks.push(
      ...cssForResponsive(`.${sanitizeClass(block.id)}`, block.style, doc.breakpoints)
    );
  }
  return cssChunks.join("\n");
}
function exportToHtml(doc) {
  const html = `<!doctype html>
<html lang="${escapeHtml(doc.page.lang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(doc.page.title)}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    ${renderBlock(doc, doc.root)}
  </body>
</html>`;
  const css = [
    "* { box-sizing: border-box; }",
    'body { margin: 0; font-family: "Space Grotesk", system-ui, sans-serif; }',
    "img { max-width: 100%; display: block; }",
    cssForPage(doc.page, doc.breakpoints),
    cssForBlocks(doc)
  ].filter(Boolean).join("\n");
  return { html, css };
}

// src/validate.ts
function blockLabel(block) {
  var _a;
  return (_a = block.name) != null ? _a : block.type;
}
function validateDocument(doc) {
  const issues = [];
  if (!doc.blocks[doc.root]) {
    issues.push({ level: "error", message: "Root block is missing." });
    return issues;
  }
  for (const block of Object.values(doc.blocks)) {
    if (block.children) {
      for (const childId of block.children) {
        if (!doc.blocks[childId]) {
          issues.push({
            level: "error",
            blockId: block.id,
            message: `Missing child block ${childId} in ${blockLabel(block)}.`
          });
        }
      }
    }
    if (block.type === "image" && !block.content.src) {
      issues.push({
        level: "warning",
        blockId: block.id,
        message: `Image block ${blockLabel(block)} is missing a source URL.`
      });
    }
    if (block.type === "button" && !block.content.label) {
      issues.push({
        level: "warning",
        blockId: block.id,
        message: `Button block ${blockLabel(block)} is missing a label.`
      });
    }
  }
  return issues;
}

exports.Breakpoints = Breakpoints;
exports.cloneDocument = cloneDocument;
exports.createDefaultDocument = createDefaultDocument;
exports.exportToHtml = exportToHtml;
exports.instantiateSectionTemplate = instantiateSectionTemplate;
exports.mergeStyle = mergeStyle;
exports.resolveStyle = resolveStyle;
exports.sectionTemplates = sectionTemplates;
exports.styleToCss = styleToCss;
exports.validateDocument = validateDocument;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map