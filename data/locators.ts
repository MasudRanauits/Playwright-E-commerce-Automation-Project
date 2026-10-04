/**
 * Locator repository.
 *
 * The keys are the names the workflow test case document uses, so a case can be
 * traced from its written steps to the selector it actually drives. Components
 * and page objects read from here; specs never hard-code a selector.
 */
export const locators = {
  /* ---------------------------------------------------------------- header */
  HDR_LOGO: '.logo img',
  HDR_NAV: '.shop-menu .nav',
  HDR_NAV_ITEMS: '.shop-menu .nav > li > a',
  HDR_HOME: '.shop-menu .nav a[href="/"]',
  HDR_PRODUCTS: '.shop-menu .nav a[href="/products"]',
  HDR_CART: '.shop-menu .nav a[href="/view_cart"]',
  HDR_SIGNUP_LOGIN: '.shop-menu .nav a[href="/login"]',
  HDR_TEST_CASES: '.shop-menu .nav a[href="/test_cases"]',
  HDR_API_TESTING: '.shop-menu .nav a[href="/api_list"]',
  HDR_VIDEO_TUTORIALS: '.shop-menu .nav a[href*="youtube"]',
  HDR_CONTACT_US: '.shop-menu .nav a[href="/contact_us"]',
  HDR_LOGOUT: '.shop-menu .nav a[href="/logout"]',
  HDR_DELETE_ACCOUNT: '.shop-menu .nav a[href="/delete_account"]',
  HDR_LOGGED_IN_AS: '.shop-menu .nav li:has-text("Logged in as")',

  /* ---------------------------------------------------------------- slider */
  HOME_SLIDER: '#slider-carousel',
  HOME_SLIDER_ITEMS: '#slider-carousel .carousel-inner .item',
  HOME_SLIDER_ACTIVE: '#slider-carousel .carousel-inner .item.active',
  HOME_SLIDER_NEXT: '#slider-carousel a.right.control-carousel',
  HOME_SLIDER_PREV: '#slider-carousel a.left.control-carousel',
  HOME_SLIDER_INDICATORS: '#slider-carousel .carousel-indicators li',

  /* -------------------------------------------------------- category panel */
  HOME_CATEGORY_PANEL: '#accordian',
  HOME_CATEGORY_HEADINGS: '#accordian .panel-heading .panel-title a',
  HOME_CATEGORY_WOMEN: '#accordian a[href="#Women"]',
  HOME_CATEGORY_MEN: '#accordian a[href="#Men"]',
  HOME_CATEGORY_KIDS: '#accordian a[href="#Kids"]',
  HOME_CATEGORY_BODIES: '#accordian .panel-collapse',
  HOME_CATEGORY_SUB_LINKS: '.panel-body ul li a',

  /* ----------------------------------------------------------- brand panel */
  HOME_BRANDS_PANEL: '.brands_products',
  HOME_BRAND_LINKS: '.brands_products .brands-name ul li a',
  HOME_BRAND_COUNT: '.pull-right',

  /* -------------------------------------------------------- features items */
  HOME_FEATURES_TITLE: '.features_items h2.title',
  HOME_PRODUCT_CARDS: '.features_items .product-image-wrapper',
  HOME_CARD_NAME: '.productinfo p',
  HOME_CARD_PRICE: '.productinfo h2',
  HOME_CARD_IMAGE: '.productinfo img',
  HOME_CARD_ADD_TO_CART: '.productinfo .add-to-cart',
  HOME_CARD_OVERLAY_ADD: '.product-overlay .add-to-cart',
  HOME_CARD_VIEW_PRODUCT: '.choose a',

  /* ------------------------------------------------------ recommended item */
  HOME_RECOMMENDED_TITLE: '.recommended_items h2.title',
  HOME_RECOMMENDED_CAROUSEL: '#recommended-item-carousel',
  HOME_RECOMMENDED_ACTIVE_CARDS:
    '#recommended-item-carousel .item.active .product-image-wrapper',
  HOME_RECOMMENDED_NEXT: '#recommended-item-carousel a.right',
  HOME_RECOMMENDED_PREV: '#recommended-item-carousel a.left',
  HOME_RECOMMENDED_ADD: '.add-to-cart',

  /* ------------------------------------------------------------- utilities */
  SCROLL_UP: '#scrollUp',

  /* ---------------------------------------------------- footer subscription */
  FTR_SUBSCRIPTION_TITLE: '.single-widget h2',
  /** The markup spells the id "susbscribe_email". Keep the typo; it is the real id. */
  FTR_SUBSCRIBE_EMAIL: '#susbscribe_email',
  FTR_SUBSCRIBE_SUBMIT: '#subscribe',
  FTR_SUBSCRIBE_SUCCESS: '#success-subscribe .alert-success',

  /* ------------------------------------------------------------- products */
  PRD_PAGE_TITLE: '.features_items h2.title',
  PRD_SEARCH_TITLE: '.features_items h2.title',
  PRD_PRODUCT_CARDS: '.features_items .product-image-wrapper',
  PRD_CARD_NAME: '.productinfo p',
  PRD_CARD_PRICE: '.productinfo h2',
  PRD_CARD_IMAGE: '.productinfo img',
  PRD_CARD_ADD_TO_CART: '.productinfo .add-to-cart',
  PRD_CARD_OVERLAY_ADD: '.product-overlay .add-to-cart',
  PRD_VIEW_PRODUCT_LINKS: '.features_items .choose a',
  PRD_SEARCH_INPUT: '#search_product',
  PRD_SEARCH_SUBMIT: '#submit_search',
  PRD_CATEGORY_PANEL: '#accordian',
  PRD_BRAND_LINKS: '.brands_products .brands-name ul li a',

  /* ------------------------------------------------------- product detail */
  PDP_NAME: '.product-information h2',
  PDP_PRICE: '.product-information span span',
  PDP_CATEGORY: '.product-information p:has-text("Category")',

  /* ------------------------------------------------------- add-to-cart modal */
  MODAL_CONTENT: '#cartModal .modal-content',
  MODAL_TITLE: '#cartModal .modal-title',
  MODAL_BODY: '#cartModal .modal-body',
  MODAL_CONTINUE_SHOPPING: '#cartModal .close-modal',
  MODAL_VIEW_CART: '#cartModal .modal-body a[href="/view_cart"]',

  /* --------------------------------------------------------- checkout modal */
  CHECKOUT_MODAL: '#checkoutModal .modal-content',
  CHECKOUT_MODAL_BODY: '#checkoutModal .modal-body',
  MODAL_REGISTER_LOGIN: '#checkoutModal .modal-body a[href="/login"]',
  CHECKOUT_MODAL_CLOSE: '#checkoutModal .close-checkout-modal',

  /* ------------------------------------------------------------------ cart */
  CART_TABLE: '#cart_info_table',
  CART_HEADER_CELLS: '#cart_info_table thead td',
  CART_ROWS: '#cart_info_table tbody tr',
  CART_ROW_IMAGE: '.cart_product img',
  CART_ROW_NAME: '.cart_description h4 a',
  CART_ROW_CATEGORY: '.cart_description p',
  CART_ROW_PRICE: '.cart_price p',
  CART_ROW_QUANTITY: '.cart_quantity button',
  CART_ROW_TOTAL: '.cart_total .cart_total_price',
  CART_ROW_DELETE: '.cart_quantity_delete',
  CART_EMPTY_BLOCK: '#empty_cart',
  CART_EMPTY_LINK: '#empty_cart a[href="/products"]',
  CART_BREADCRUMB: '.breadcrumbs',
  CART_CHECKOUT_BUTTON: '.check_out',
} as const;

export type LocatorKey = keyof typeof locators;

/** Paths the workflow cases assert on. */
export const paths = {
  home: '/',
  products: '/products',
  cart: '/view_cart',
  login: '/login',
  testCases: '/test_cases',
  apiList: '/api_list',
  contactUs: '/contact_us',
  checkout: '/checkout',
  productDetail: '/product_details',
  categoryProducts: '/category_products',
  brandProducts: '/brand_products',
} as const;
