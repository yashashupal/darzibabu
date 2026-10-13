const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

export const banners = [
  { id: 'ban-1', placement: 'home-hero', title: 'Wear your brand with pride', subtitle: 'Custom polos, tees and hoodies with crisp screen printing and embroidery - from 10 pieces.', ctaLabel: 'Shop apparel', link: '/category/t-shirts-polos', image: 'asset:tee-black-polo', active: true, sortOrder: 1 },
  { id: 'ban-2', placement: 'home-hero', title: 'Welcome kits that say "we are glad you are here"', subtitle: 'Branded onboarding boxes with diaries, bottles, pens and more, packed and delivered.', ctaLabel: 'Explore gift kits', link: '/category/corporate-gift-kits', image: 'asset:kit-hanging', active: true, sortOrder: 2 },
  { id: 'ban-3', placement: 'home-hero', title: 'Small details, big impressions', subtitle: 'Engraved metal keychains, stylus pens and pin-free magnetic badges for every team member.', ctaLabel: 'See accessories', link: '/category/metal-keychains', image: 'asset:keychain-metal', active: true, sortOrder: 3 },
  { id: 'ban-4', placement: 'announcement', title: 'Free standard shipping on orders above the free-shipping threshold - use code WELCOME10 for 10% off your first order.', subtitle: '', ctaLabel: 'Browse products', link: '/products', image: '', active: true, sortOrder: 1 },
  { id: 'ban-5', placement: 'promo-strip', title: 'Need 100+ pieces? Get a bulk quote within one business day.', subtitle: 'Volume pricing, artwork support and a dedicated account manager.', ctaLabel: 'Request a quote', link: '/contact?topic=quote', image: 'asset:badge-model', active: true, sortOrder: 1 },
];

export const coupons = [
  { id: 'cp-1', code: 'WELCOME10', description: '10% off your first order', type: 'percent', value: 10, minOrder: 1000, maxDiscount: 2000, usageLimit: 500, used: 41, expiresAt: daysAgo(-120).slice(0, 10), active: true },
  { id: 'cp-2', code: 'BULK500', description: 'Flat Rs. 500 off orders above Rs. 5,000', type: 'flat', value: 500, minOrder: 5000, maxDiscount: 0, usageLimit: 200, used: 18, expiresAt: daysAgo(-60).slice(0, 10), active: true },
  { id: 'cp-3', code: 'TEAMUP15', description: '15% off team orders above Rs. 15,000', type: 'percent', value: 15, minOrder: 15000, maxDiscount: 5000, usageLimit: 100, used: 7, expiresAt: daysAgo(-200).slice(0, 10), active: true },
  { id: 'cp-4', code: 'OLDSALE20', description: 'Expired sample coupon (for testing)', type: 'percent', value: 20, minOrder: 0, maxDiscount: 0, usageLimit: 100, used: 100, expiresAt: daysAgo(30).slice(0, 10), active: false },
];

export const faqs = [
  { id: 'faq-1', category: 'Ordering', question: 'What is the minimum order quantity?', answer: 'Most apparel and caps start from 10 pieces, gift kits from 5 kits, and small accessories such as keychains, pens and badges from 25 pieces. Each product page shows its exact minimum.', sortOrder: 1, active: true },
  { id: 'faq-2', category: 'Ordering', question: 'Can I order a sample before placing a bulk order?', answer: 'Yes. Contact us with the product you are considering and we will quote a sample price. Sample charges can be adjusted against your bulk order when you confirm.', sortOrder: 2, active: true },
  { id: 'faq-3', category: 'Ordering', question: 'Can I mix sizes and colours in one order?', answer: 'Absolutely. Add each colour and size combination to your cart separately. Quantity-based pricing is applied per line, and our team can help combine lines into a single price break on request.', sortOrder: 3, active: true },
  { id: 'faq-4', category: 'Artwork & Printing', question: 'Which logo file formats do you accept?', answer: 'Vector files (SVG, AI, PDF, EPS) are best. High-resolution PNG or JPG files also work. In this demo you can upload a PNG, JPG or SVG to preview placement.', sortOrder: 4, active: true },
  { id: 'faq-5', category: 'Artwork & Printing', question: 'Do I get a design proof before production?', answer: 'Yes. After your order is placed our design team prepares a proof for approval. Production only starts once you approve it, and the order status changes to "Design Approval" while we wait.', sortOrder: 5, active: true },
  { id: 'faq-6', category: 'Artwork & Printing', question: 'What is the difference between screen printing, DTF and embroidery?', answer: 'Screen printing is ideal for simple one or two colour designs in bulk. DTF handles full-colour and gradient artwork. Embroidery gives a premium, textured look and is best for polos, caps and jackets.', sortOrder: 6, active: true },
  { id: 'faq-7', category: 'Shipping', question: 'How long does production and delivery take?', answer: 'Production typically takes 5 to 12 working days depending on the product, followed by 2 to 7 days for delivery. Lead time is shown on every product page.', sortOrder: 7, active: true },
  { id: 'faq-8', category: 'Shipping', question: 'Can you ship to multiple addresses?', answer: 'Yes, for larger orders we can split deliveries across locations. Mention it in the order notes or contact us after checkout so the team can arrange it.', sortOrder: 8, active: true },
  { id: 'faq-9', category: 'Payments', question: 'Which payment methods do you accept?', answer: 'The live store will support UPI, cards, net banking and bank transfer. This prototype only demonstrates the checkout flow - no real payment is taken.', sortOrder: 9, active: true },
  { id: 'faq-10', category: 'Payments', question: 'Do you provide GST invoices?', answer: 'Yes. Add your GSTIN at checkout and a GST invoice is issued with your order.', sortOrder: 10, active: true },
  { id: 'faq-11', category: 'Returns', question: 'What if there is a printing mistake?', answer: 'If the finished product differs from the approved proof we will reprint or refund the affected items. Report the issue within 48 hours of delivery with photos.', sortOrder: 11, active: true },
  { id: 'faq-12', category: 'Returns', question: 'Can I cancel an order?', answer: 'Orders can be cancelled free of charge until the design proof is approved. After production starts, customised goods cannot be cancelled.', sortOrder: 12, active: true },
];

const grad = (from, to, icon) => ({ from, to, icon });
export const posts = [
  { id: 'post-1', slug: 'how-to-choose-the-right-team-uniform', title: 'How to choose the right uniform for your team', excerpt: 'Fabric, fit and finish: a simple checklist for picking uniforms people are happy to wear every day.', category: 'Uniforms', author: 'Darzibabu Studio', date: daysAgo(6), readMins: 5, cover: grad('#064072', '#2a5ea6', 'Shirt'), tags: ['uniforms', 'guide'], status: 'published',
    content: ['A uniform is worn for eight hours a day, so comfort matters as much as the logo. Start with the work your team actually does: a kitchen crew needs breathable, stain-friendly fabric, while a front-desk team may prefer a crisp piqué polo.', '## Fabric first', 'Pure cotton is soft and breathable, polyester blends resist creases and fading, and cotton-poly mixes are a dependable middle ground. If your team works outdoors, consider moisture-wicking fabrics.', '## Fit and sizing', 'Order a size run before placing a large order. Collect measurements or let employees try sample sizes so that you avoid exchanges later.', '## Branding that lasts', 'Embroidery lasts longest on polos and jackets. Screen printing is more economical on tees. Keep logos simple and reserve small details for embroidery digitising.'] },
  { id: 'post-2', slug: 'screen-printing-vs-embroidery-vs-dtf', title: 'Screen printing vs embroidery vs DTF: which should you pick?', excerpt: 'Three decoration methods, three different looks and price points. Here is how to choose.', category: 'Printing', author: 'Darzibabu Studio', date: daysAgo(14), readMins: 4, cover: grad('#f24b69', '#b9213f', 'Palette'), tags: ['printing', 'embroidery'], status: 'published',
    content: ['Every garment tells a different story depending on how your logo is applied. Here is a quick comparison.', '## Screen printing', 'Best for simple designs with one or two solid colours in volume. It is the most economical choice as quantity grows.', '## DTF printing', 'Direct-to-film suits full-colour logos, gradients and photographic artwork on cotton and blends.', '## Embroidery', 'Embroidery has a premium, raised texture and is the classic choice for polos, caps and jackets. It works best for logos that can be simplified into clean shapes.'] },
  { id: 'post-3', slug: 'onboarding-kit-ideas-that-employees-love', title: 'Onboarding kit ideas new employees actually love', excerpt: 'Make day one memorable with a welcome kit that is useful, personal and well presented.', category: 'Gifting', author: 'Darzibabu Studio', date: daysAgo(22), readMins: 6, cover: grad('#0f3a6a', '#f24b69', 'Gift'), tags: ['onboarding', 'gifting'], status: 'published',
    content: ['A joining kit is often the first physical impression of your company. Aim for items people will really use.', '## Start with the essentials', 'A diary, a good pen and a bottle cover the basics. Add a tee or polo so new hires can feel part of the team immediately.', '## Make it personal', 'Add the employee name on the diary or pen and include a short handwritten note from the manager.', '## Presentation matters', 'A neat rigid box with a branded sleeve elevates even simple items.'] },
  { id: 'post-4', slug: 'preparing-logo-artwork-for-print', title: 'Preparing your logo artwork for print', excerpt: 'File formats, colours and sizes: how to give our design team the best starting point.', category: 'Printing', author: 'Darzibabu Studio', date: daysAgo(31), readMins: 4, cover: grad('#3b78c8', '#064072', 'Palette'), tags: ['artwork', 'logo'], status: 'published',
    content: ['Good artwork means sharper results and fewer proof revisions.', '## Prefer vector files', 'SVG, AI, EPS or PDF files can be scaled to any size without losing quality.', '## If you only have a PNG', 'Provide the largest version you have, on a transparent background where possible.', '## Colour matching', 'Share Pantone or hex codes. Printed colours can differ slightly from screen colours so a proof is always shared.'] },
  { id: 'post-5', slug: 'corporate-gifting-calendar', title: 'A simple corporate gifting calendar for the year', excerpt: 'Plan ahead for festive seasons, work anniversaries and client thank-yous.', category: 'Gifting', author: 'Darzibabu Studio', date: daysAgo(44), readMins: 5, cover: grad('#b9213f', '#064072', 'Gift'), tags: ['gifting', 'planning'], status: 'published',
    content: ['Gifting works best when it is planned. Map out the moments that matter to your team and customers.', '## Festive season', 'Order at least four weeks ahead so printing and packing are not rushed.', '## Work anniversaries', 'Small, personalised items such as engraved pens or keychains make long service feel valued.', '## Client appreciation', 'Choose a premium but useful gift, and add a personal note.'] },
  { id: 'post-6', slug: 'why-magnetic-badges-beat-pins', title: 'Why magnetic badges beat pins for uniforms', excerpt: 'No holes, easy to reposition and always neat: the case for magnetic name badges.', category: 'Accessories', author: 'Darzibabu Studio', date: daysAgo(58), readMins: 3, cover: grad('#2a5ea6', '#f24b69', 'BadgeCheck'), tags: ['badges', 'uniforms'], status: 'published',
    content: ['Pin badges poke holes in expensive uniforms and can fall off. Magnetic badges avoid both problems.', '## Clean and consistent', 'A magnet keeps the badge straight and flat, so your team always looks put together.', '## Safe for fabrics', 'Delicate fabrics and tailored jackets stay intact because there are no pin holes.', '## Good to know', 'Magnetic badges are not recommended for wearers with certain medical implants. Offer a clutch-back alternative where needed.'] },
];

export const homepageSections = [
  { id: 'trust', label: 'Trust bar', enabled: true, title: '', subtitle: '' },
  { id: 'categories', label: 'Shop by category', enabled: true, title: 'Shop by category', subtitle: 'From uniforms to gift kits, everything made to carry your brand.' },
  { id: 'featured', label: 'Featured products', enabled: true, title: 'Customer favourites', subtitle: 'Best-selling products our clients reorder again and again.' },
  { id: 'process', label: 'How it works', enabled: true, title: 'From logo to doorstep in four steps', subtitle: 'A simple process designed to take the effort out of custom merchandise.' },
  { id: 'bulk', label: 'Bulk quote banner', enabled: true, title: 'Ordering for a large team?', subtitle: 'Tell us what you need and get a tailored quote with volume pricing and artwork support.' },
  { id: 'new', label: 'New arrivals', enabled: true, title: 'New arrivals', subtitle: 'Fresh additions to the Darzibabu catalogue.' },
  { id: 'testimonials', label: 'Customer reviews', enabled: true, title: 'Loved by teams across India', subtitle: 'Real feedback from demo reviews stored in this prototype.' },
  { id: 'blog', label: 'From the blog', enabled: true, title: 'Ideas and guides', subtitle: 'Practical advice on uniforms, printing and gifting.' },
  { id: 'faq', label: 'FAQ teaser', enabled: true, title: 'Quick answers', subtitle: 'The questions we hear most often.' },
];

export const settings = {
  site: {
    name: 'Darzibabu',
    tagline: 'The art of thread',
    email: 'hello@darzibabu.example',
    phone: '+91 00000 00000',
    whatsapp: '+91 00000 00000',
    address: 'Demo Studio, Textile Lane, Your City, India',
    hours: 'Mon - Sat, 10:00 - 19:00',
    announcementEnabled: true,
    social: { instagram: '', facebook: '', linkedin: '', youtube: '' },
  },
  tax: { gstPercent: 18, pricesIncludeTax: false, gstin: '' },
  shipping: {
    freeShippingThreshold: 5000,
    processingNote: 'Production takes 5 to 12 working days after design approval.',
    methods: [
      { id: 'standard', label: 'Standard delivery (5-7 days)', price: 150, enabled: true },
      { id: 'express', label: 'Express delivery (2-3 days)', price: 450, enabled: true },
      { id: 'pickup', label: 'Studio pickup', price: 0, enabled: true },
    ],
  },
  payments: {
    demoMode: true,
    methods: [
      { id: 'upi', label: 'UPI', note: 'Pay with any UPI app (demo)', enabled: true },
      { id: 'card', label: 'Credit / Debit card', note: 'Visa, Mastercard, RuPay (demo)', enabled: true },
      { id: 'netbanking', label: 'Net banking', note: 'All major banks (demo)', enabled: true },
      { id: 'bank', label: 'Bank transfer / proforma invoice', note: 'Ideal for large business orders (demo)', enabled: true },
      { id: 'cod', label: 'Cash on delivery', note: 'Available for small orders only (demo)', enabled: false },
    ],
  },
  orders: { minOrderValue: 0, prefix: 'DB', nextNumber: 10001 },
};

export const roles = [
  { id: 'super_admin', name: 'Super Admin', description: 'Full access to every area.', permissions: ['dashboard', 'products', 'categories', 'inventory', 'orders', 'customers', 'reviews', 'marketing', 'content', 'media', 'inquiries', 'settings', 'roles'], system: true },
  { id: 'catalog_manager', name: 'Catalog Manager', description: 'Manages products, categories, inventory and media.', permissions: ['dashboard', 'products', 'categories', 'inventory', 'media', 'reviews'], system: false },
  { id: 'order_manager', name: 'Order Manager', description: 'Processes orders and manages customers.', permissions: ['dashboard', 'orders', 'customers', 'inventory', 'inquiries'], system: false },
  { id: 'content_editor', name: 'Content Editor', description: 'Edits banners, homepage, blog and FAQs.', permissions: ['dashboard', 'marketing', 'content', 'media'], system: false },
];

export const PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard analytics' },
  { id: 'products', label: 'Products & pricing' },
  { id: 'categories', label: 'Categories' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'marketing', label: 'Banners, coupons & homepage' },
  { id: 'content', label: 'Blog & FAQs' },
  { id: 'media', label: 'Media library' },
  { id: 'inquiries', label: 'Inquiries' },
  { id: 'settings', label: 'Site, shipping & payment settings' },
  { id: 'roles', label: 'Roles & permissions' },
];
