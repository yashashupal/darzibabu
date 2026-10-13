// Central registry of bundled image assets.
// Data records store stable keys like "asset:tee-black-polo" (never hashed build URLs),
// so seed data and localStorage records keep working across rebuilds.
import logo from './brand/logo.png';
import mark from './brand/mark.png';
import teeBlackPolo from './products/tee-black-polo.jpg';
import teesTrio from './products/tees-trio.jpg';
import hoodieBlack from './products/hoodie-black.jpg';
import capsMulti from './products/caps-multi.jpg';
import capNavy from './products/cap-navy.jpg';
import keychainMetal from './products/keychain-metal.jpg';
import keychainRect from './products/keychain-rect.jpg';
import keychainPhoto from './products/keychain-photo.jpg';
import kitBox from './products/kit-box.jpg';
import kitHanging from './products/kit-hanging.jpg';
import penPhoto from './products/pen-photo.jpg';
import badgeModel from './products/badge-model.jpg';
import badgePink from './products/badge-pink.jpg';

export const brandAssets = { logo, mark };

export const assetMap = {
  'tee-black-polo': teeBlackPolo,
  'tees-trio': teesTrio,
  'hoodie-black': hoodieBlack,
  'caps-multi': capsMulti,
  'cap-navy': capNavy,
  'keychain-metal': keychainMetal,
  'keychain-rect': keychainRect,
  'keychain-photo': keychainPhoto,
  'kit-box': kitBox,
  'kit-hanging': kitHanging,
  'pen-photo': penPhoto,
  'badge-model': badgeModel,
  'badge-pink': badgePink,
};

/** Resolve a stored image reference ("asset:key", data URL or http URL) to a usable src. */
export function resolveImage(ref) {
  if (!ref) return '';
  if (ref.startsWith('asset:')) return assetMap[ref.slice(6)] || '';
  return ref;
}

export const assetKeys = Object.keys(assetMap);
