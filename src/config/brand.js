export const BRAND = {
  name: 'Darzibabu',
  tagline: 'The art of thread',
  description:
    "Darzibabu specializes in premium, custom apparel for every need, from individual youth clothing to large-scale corporate orders. As a leading manufacturer and wholesaler, they offer a wide range of services, including expert screen printing and embroidery to bring any design to life. Whether you're a business looking for high-quality merchandise or an organization needing custom uniforms, Darzibabu delivers exceptional craftsmanship and style. They are dedicated to producing sophisticated and high-quality clothing that perfectly represents your vision.",
  email: 'hello@darzibabu.example',
  phone: '+91 00000 00000',
  whatsapp: '+91 00000 00000',
  address: 'Demo Studio, Textile Lane, Your City, India',
  social: { instagram: '#', facebook: '#', linkedin: '#', youtube: '#' },
};

export const ORDER_STATUSES = [
  'Placed',
  'Design Approval',
  'In Production',
  'Quality Check',
  'Dispatched',
  'Delivered',
];
export const ALL_ORDER_STATUSES = [...ORDER_STATUSES, 'Cancelled'];

export const PAYMENT_STATUSES = ['Pending', 'Paid (demo)', 'Refunded (demo)'];

export const DEMO_NOTICE =
  'Demo prototype: no real payments, orders or logins. All data lives in this browser only.';
