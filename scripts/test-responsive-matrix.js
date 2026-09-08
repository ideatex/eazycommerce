/**
 * VANIGAM B2B2C Commerce Platform
 * Automated Responsive Matrix & Device Compatibility Verification Suite
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔\x1b[0m ${message}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖\x1b[0m ${message}`);
    failedTests++;
  }
}

function readFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf-8');
}

console.log('\n\x1b[36m========================================================================');
console.log('  VANIGAM RESPONSIVE MATRIX & DEVICE COMPATIBILITY TEST SUITE');
console.log('========================================================================\x1b[0m\n');

// 1. Viewport Meta & Safe Area Utility Checks
console.log('\x1b[33m[Section 1: Viewport Meta, Safe-Area & CSS Foundation]\x1b[0m');
const layoutContent = readFile('src/app/layout.tsx');
assert(layoutContent.includes('viewport: Viewport'), 'Root layout exports Viewport object');
assert(layoutContent.includes('viewportFit: "cover"'), 'Root layout enables viewportFit: cover for iOS notch support');
assert(layoutContent.includes('initialScale: 1'), 'Root layout defines initialScale: 1');
assert(layoutContent.includes('min-h-screen flex flex-col'), 'Root layout body has min-h-screen flex flex-col sticky footer shell');

const siteLayoutContent = readFile('src/app/(site)/layout.tsx');
assert(siteLayoutContent.includes('min-h-screen flex flex-col'), 'Storefront layout wraps content in flex-1 sticky layout');

const cssContent = readFile('src/app/css/style.css');
assert(cssContent.includes('pb-safe') && cssContent.includes('env(safe-area-inset-bottom'), 'style.css defines pb-safe utility');
assert(cssContent.includes('pt-safe') && cssContent.includes('env(safe-area-inset-top'), 'style.css defines pt-safe utility');
assert(cssContent.includes('.momentum-scroll'), 'style.css defines momentum-scroll touch utility');

// 2. Navigation, Header & Modals Checks
console.log('\n\x1b[33m[Section 2: Navigation, Header & Modals]\x1b[0m');
const headerContent = readFile('src/components/Header/MainHeader.tsx');
assert(headerContent.includes('document.body.style.overflow = "hidden"'), 'MainHeader locks body scroll when mobile menu is open');
assert(headerContent.includes('w-10 h-10 flex items-center justify-center'), 'MainHeader defines minimum 40px touch target bounding box for controls');

const mobileMenuContent = readFile('src/components/Header/MobileMenu.tsx');
assert(mobileMenuContent.includes('100dvh'), 'MobileMenu uses dynamic viewport height 100dvh');
assert(mobileMenuContent.includes('pb-safe'), 'MobileMenu uses safe-area bottom padding');
assert(mobileMenuContent.includes('Escape'), 'MobileMenu listens for Escape key dismissal');

const cartModalContent = readFile('src/components/Common/CartSidebarModal/index.tsx');
assert(cartModalContent.includes('100dvh'), 'CartSidebarModal uses 100dvh for mobile slide-out drawer');
assert(cartModalContent.includes('Escape'), 'CartSidebarModal listens for Escape key dismissal');

const quickViewContent = readFile('src/components/Common/QuickViewModal.tsx');
assert(quickViewContent.includes('grid-cols-1 lg:grid-cols-2'), 'QuickViewModal adapts from 1 col on mobile to 2 cols on desktop');
assert(!quickViewContent.includes('2xl:py-[230px]'), 'QuickViewModal removed rigid 2xl:py-[230px] viewport blow-out padding');

// 3. Storefront Components
console.log('\n\x1b[33m[Section 3: Storefront & Homepage Components]\x1b[0m');
const heroCarouselContent = readFile('src/components/Home/Hero/HeroCarousel.tsx');
assert(heroCarouselContent.includes('max-w-[80vw] sm:max-w-[320px]'), 'HeroCarousel bounds slide images responsively');

const categoryAreaContent = readFile('src/components/Home/Categories/CategoryCarouselArea.tsx');
assert(categoryAreaContent.includes('0:') && categoryAreaContent.includes('slidesPerView: 2'), 'CategoryCarouselArea provides smooth 0px breakpoint');
assert(categoryAreaContent.includes('1024:') && categoryAreaContent.includes('slidesPerView: 5'), 'CategoryCarouselArea provides desktop breakpoints');

const countdownContent = readFile('src/components/Home/Countdown/CountdownTimer.tsx');
assert(countdownContent.includes('gap-2.5 sm:gap-4'), 'CountdownTimer uses fluid gap to fit all 4 blocks on 1 row');

const productDetailsContent = readFile('src/components/Product/ProductDetailsView.tsx');
assert(productDetailsContent.includes('fixed bottom-0 inset-x-0') && productDetailsContent.includes('pb-safe') && productDetailsContent.includes('md:hidden'), 'ProductDetailsView provides Mobile Sticky Purchase Bar');

// 4. Cart & Wishlist
console.log('\n\x1b[33m[Section 4: Cart & Wishlist Responsive Controls]\x1b[0m');
const cartViewContent = readFile('src/components/Cart/CartView.tsx');
assert(cartViewContent.includes('w-8 h-8 sm:w-9 sm:h-9'), 'CartView uses >=32px-36px touch targets for quantity buttons');
assert(cartViewContent.includes('w-9 h-9 flex items-center justify-center'), 'CartView uses touch-friendly delete button');

const wishlistContent = readFile('src/components/Wishlist/WishlistView.tsx');
assert(wishlistContent.includes('block md:hidden') && wishlistContent.includes('hidden md:block'), 'WishlistView provides dual mobile card & desktop table layout');

// 5. Admin Layout & Dashboards
console.log('\n\x1b[33m[Section 5: Enterprise Business Dashboards & Admin Shell]\x1b[0m');
const adminLayoutContent = readFile('src/components/Admin/AdminLayout.tsx');
assert(adminLayoutContent.includes('mobileSidebarOpen'), 'AdminLayout implements mobileSidebarOpen off-canvas state');
assert(adminLayoutContent.includes('md:hidden flex items-center justify-center'), 'AdminLayout provides hamburger button in top bar for mobile devices');
assert(adminLayoutContent.includes('bg-black/60 z-40 md:hidden'), 'AdminLayout provides backdrop overlay on mobile');

const ordersSplitContent = readFile('src/components/Admin/OrdersSplitView.tsx');
assert(ordersSplitContent.includes('block lg:hidden') && ordersSplitContent.includes('hidden lg:block'), 'OrdersSplitView provides dual mobile card & desktop table layout');

const businessMgmtContent = readFile('src/components/Admin/BusinessManagementView.tsx');
assert(businessMgmtContent.includes('block md:hidden') && businessMgmtContent.includes('hidden md:block'), 'BusinessManagementView provides dual mobile card & desktop table layout');

const b2bOrdersContent = readFile('src/components/Admin/B2BOrdersView.tsx');
assert(b2bOrdersContent.includes('block lg:hidden') && b2bOrdersContent.includes('hidden lg:block'), 'B2BOrdersView provides dual mobile card & desktop table layout');

const financeContent = readFile('src/components/Admin/FinanceView.tsx');
assert(financeContent.includes('block lg:hidden') && financeContent.includes('hidden lg:block'), 'FinanceView provides dual mobile card & desktop table layout');

const cmsContent = readFile('src/components/Admin/CMSManagementView.tsx');
assert(cmsContent.includes('grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'), 'CMSManagementView uses balanced responsive KPI metrics grid');

// Summary
console.log('\n------------------------------------------------------------------------');
console.log(`TOTAL TESTS: ${passedTests + failedTests} | PASSED: \x1b[32m${passedTests}\x1b[0m | FAILED: \x1b[31m${failedTests}\x1b[0m`);
console.log('------------------------------------------------------------------------\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ ALL RESPONSIVE MATRIX TESTS PASSED!\x1b[0m\n');
  process.exit(0);
}
