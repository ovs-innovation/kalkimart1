import useTranslation from "next-translate/useTranslation";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  FiChevronRight,
  FiMinus,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiShare2,
  FiHeart,
  FiShuffle,
  FiTruck,
} from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import {
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import { FaInstagram } from "react-icons/fa";
//internal import

import Price from "@components/common/Price";
import Stock from "@components/common/Stock";
import Tags from "@components/common/Tags";
import Layout from "@layout/Layout";
import Card from "@components/slug-card/Card";
import useAddToCart from "@hooks/useAddToCart";
import { useCart } from "react-use-cart";
import Loading from "@components/preloader/Loading";
import ProductCard from "@components/product/ProductCard";
import VariantList from "@components/variants/VariantList";
import { SidebarContext } from "@context/SidebarContext";
import { UserContext } from "@context/UserContext";
import AttributeServices from "@services/AttributeServices";
import ProductServices from "@services/ProductServices";
import useUtilsFunction from "@hooks/useUtilsFunction";
import Discount from "@components/common/Discount";
import useGetSetting from "@hooks/useGetSetting";
import ProductImageGallery from "@components/product/ProductImageGallery";
import ProductDetailsSection from "@components/product/ProductDetailsSection";
import LocationPickerDropdown from "@components/location/LocationPickerDropdown";
import RatingSummary from "@components/reviews/RatingSummary";
import ReviewFilters from "@components/reviews/ReviewFilters";
import ReviewList from "@components/reviews/ReviewList";
import WriteReviewForm from "@components/reviews/WriteReviewForm";
import ReviewServices from "@services/ReviewServices";
import { notifyError, notifySuccess } from "@utils/toast";
import { useSession } from "next-auth/react";
import { addToWishlist } from "@lib/wishlist";
import { getExpectedDeliveryTime } from "@utils/deliveryTime";
import CustomerServices from "@services/CustomerServices";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import SuggestedProducts from "@components/product/SuggestedProducts";

const ProductScreen = ({ product, attributes, relatedProducts }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { state: userState } = useContext(UserContext) || {};

  // Get user info from session, context, or cookies
  const cookieUserInfo = (typeof window !== "undefined") ? (() => {
    try { const c = Cookies.get("userInfo"); return c ? JSON.parse(c) : null; } catch (e) { return null; }
  })() : null;

  const sessionRole = session?.user?.role;
  const contextRole = userState?.userInfo?.role;
  const cookieRole = cookieUserInfo?.role;
  const userRole = sessionRole || contextRole || cookieRole || null;

  // also expose a userInfo object for other usages (cookies/context/session)
  const userInfo = session?.user || userState?.userInfo || cookieUserInfo || null;

  // normalized wholesaler check (case-insensitive)
  const isWholesaler = userRole && userRole.toString().toLowerCase() === 'wholesaler';

  const { lang, showingTranslateValue, getNumber, currency, getNumberTwo } =
    useUtilsFunction();
  const { isLoading, setIsLoading } = useContext(SidebarContext);
  const { handleAddItem, item, setItem } = useAddToCart();
  const { setItems, addItem } = useCart();
  const { storeCustomizationSetting, globalSetting } = useGetSetting();

  // Handle Product View Tracking
  useEffect(() => {
    if (product?._id) {
      // 1. Backend Tracking (fire and forget)
      ProductServices.addProductView({ productId: product._id }).catch(err =>
        console.error("Tracking view failed", err)
      );

      // 2. Guest LocalStorage Tracking
      if (typeof window !== "undefined") {
        try {
          let history = [];
          const stored = localStorage.getItem("recentlyViewed");
          if (stored) history = JSON.parse(stored);

          // Remove if exists (to move to top)
          history = history.filter(p => p._id !== product._id);

          // Add current
          history.unshift({
            _id: product._id,
            viewedAt: Date.now()
          });

          // Limit to 10
          if (history.length > 10) history = history.slice(0, 10);

          localStorage.setItem("recentlyViewed", JSON.stringify(history));
        } catch (e) {
          console.error("LS Error", e);
        }
      }
    }
  }, [product, session]);

  // react hook

  const [value, setValue] = useState("");
  const [price, setPrice] = useState(0);
  const [activeImage, setActiveImage] = useState("");
  const [originalPrice, setOriginalPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [selectVariant, setSelectVariant] = useState({});
  const [isReadMore, setIsReadMore] = useState(true);
  const [selectVa, setSelectVa] = useState({});
  const [variantTitle, setVariantTitle] = useState([]);
  const [variants, setVariants] = useState([]);
  const [dynamicTitle, setDynamicTitle] = useState("");
  const [dynamicDescription, setDynamicDescription] = useState("");
  const [variantDynamicSections, setVariantDynamicSections] = useState(null);
  const [variantMediaSections, setVariantMediaSections] = useState(null);
  const isUpdatingUrlRef = useRef(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);
  const [currentImages, setCurrentImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsHasMore, setReviewsHasMore] = useState(false);
  const [reviewsSort, setReviewsSort] = useState("newest");
  const [reviewsRatingFilter, setReviewsRatingFilter] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [activeTab, setActiveTab] = useState("product-description");
  const [showStickyBottomBar, setShowStickyBottomBar] = useState(false);
  const [expectedDeliveryTime, setExpectedDeliveryTime] = useState(null);
  const [clientRelatedProducts, setClientRelatedProducts] = useState(relatedProducts || []);

  useEffect(() => {
    if (relatedProducts && relatedProducts.length > 0) {
      setClientRelatedProducts(relatedProducts);
    } else if (product?._id || router.query?.slug) {
      ProductServices.getShowingStoreProducts({
        category: "",
        slug: product?.slug || router.query?.slug || "",
      })
        .then((res) => {
          if (res?.relatedProducts && res.relatedProducts.length > 0) {
            setClientRelatedProducts(res.relatedProducts);
          } else if (res?.products && res.products.length > 0) {
            setClientRelatedProducts(res.products);
          }
        })
        .catch((err) => console.error("Error fetching related products", err));
    }
  }, [relatedProducts, product?.slug, product?._id, router.query?.slug]);

  const relatedList = useMemo(() => {
    const source =
      clientRelatedProducts && clientRelatedProducts.length > 0
        ? clientRelatedProducts
        : relatedProducts || [];

    const baseList = isWholesaler
      ? source.filter(
          (p) => (p?.wholePrice && Number(p.wholePrice) > 0) || p?.isWholesaler
        )
      : source;

    const currentIdStr = product?._id ? String(product._id) : "";
    const currentSlug = product?.slug || router.query?.slug || "";

    return baseList
      .filter((p) => {
        if (!p) return false;
        const pIdStr = p?._id ? String(p._id) : "";
        if (currentIdStr && pIdStr && pIdStr === currentIdStr) return false;
        if (currentSlug && p?.slug && p.slug === currentSlug) return false;
        return true;
      })
      .slice(0, 12);
  }, [
    clientRelatedProducts,
    relatedProducts,
    isWholesaler,
    product,
    router.query?.slug,
  ]);

  // Fetch shipping address if user is logged in
  const { data: shippingAddressData } = useQuery({
    queryKey: ["shippingAddress", { id: userInfo?.id }],
    queryFn: async () =>
      await CustomerServices.getShippingAddress({
        userId: userInfo?.id,
      }),
    select: (data) => data?.shippingAddress,
    enabled: !!userInfo?.id,
  });

  // Simple stock derivation to avoid infinite variant loops
  useEffect(() => {
    if (!product) return;

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      // sum of variant quantities as overall stock
      const total = product.variants.reduce(
        (sum, v) => sum + (Number(v.quantity) || 0),
        0
      );
      setStock(total);
    } else {
      setStock(Number(product.stock) || 0);
    }
  }, [product]);

  // Get product media (images + optional video) - supports up to 5 items
  const productImages = useMemo(() => {
    const media = [];

    // Add images first
    if (Array.isArray(product?.image)) {
      media.push(
        ...product.image.filter(
          (img) => img && typeof img === "string" && img.trim() !== ""
        )
      );
    } else if (product?.image) {
      media.push(product.image);
    }

    // If legacy 'video' field exists, also push it into media array
    if (
      product?.video &&
      typeof product.video === "string" &&
      product.video.trim() !== ""
    ) {
      media.push(product.video);
    }

    return media.slice(0, 5);
  }, [product?.image, product?.video]);

  // Keep a sharable URL in sync with current selection (includes query params)
  useEffect(() => {
    if (!router.isReady) return;
    if (typeof window === "undefined") return;

    // Always take the real browser URL so that we include query params
    setShareUrl(window.location.href);
  }, [router.isReady, router.asPath]);

  // Auto-select first available variant on initial load
  useEffect(() => {
    if (!product?.variants || product.variants.length === 0) return;
    if (!variantTitle || variantTitle.length === 0) return;

    // If we already have any attribute selected, don't override
    if (selectVa && Object.keys(selectVa).some((key) => selectVa[key])) return;

    // Pick first variant with stock > 0, otherwise just first variant
    const firstAvailableVariant =
      product.variants.find((v) => Number(v.quantity) > 0) ||
      product.variants[0];

    if (!firstAvailableVariant) return;

    const initialSelection = {};
    variantTitle.forEach((att) => {
      if (firstAvailableVariant[att._id]) {
        initialSelection[att._id] = firstAvailableVariant[att._id];
      }
    });

    if (Object.keys(initialSelection).length === 0) return;

    // Initialize attribute selection; price/images/stock will be synced
    // by the variant-matching effect below.
    setSelectVa(initialSelection);
    setSelectVariant((prev) =>
      Object.keys(prev || {}).length === 0 ? initialSelection : prev
    );
  }, [product?.variants, variantTitle]);

  useEffect(() => {
    // Trigger when we have variants and some selection
    if (!product?.variants || product.variants.length === 0) return;

    // Check if we have any attribute selection
    const attributeKeys = variantTitle?.map(att => att._id) || [];
    const hasSelection = value || (selectVa && Object.keys(selectVa).length > 0 && attributeKeys.some(key => selectVa[key]));

    if (!hasSelection) {
      return;
    }

    if (hasSelection) {
      // Merge current selectVa with selectVariant to get complete selection
      const mergedSelection = { ...selectVariant, ...selectVa };

      // Filter out non-attribute keys for comparison
      const attributeKeys = variantTitle?.map(att => att._id) || [];

      // If we have attribute keys, filter by them; otherwise use all variants
      let result = product?.variants || [];

      if (attributeKeys.length > 0) {
        result = product?.variants?.filter((variant) => {
          // Check if variant matches all selected attributes
          return attributeKeys.every((attrKey) => {
            const selectedValue = mergedSelection[attrKey];
            // If no selection for this attribute, skip it (allow any value)
            if (!selectedValue) return true;
            return variant[attrKey] === selectedValue;
          });
        }) || [];
      }

      const res = result?.map(
        ({
          originalPrice,
          price,
          discount,
          quantity,
          barcode,
          sku,
          productId,
          image,
          images,
          title,
          description,
          ...rest
        }) => ({ ...rest })
      );

      const filterKey = Object.keys(Object.assign({}, ...res));
      const selectVar = filterKey?.reduce(
        (obj, key) => ({ ...obj, [key]: mergedSelection[key] || selectVariant[key] }),
        {}
      );
      const newObj = Object.entries(selectVar).reduce(
        (a, [k, v]) => (v ? ((a[k] = v), a) : a),
        {}
      );

      // Find the variant that matches all selected attributes
      let result2 = null;

      if (Object.keys(newObj).length > 0) {
        result2 = result?.find((v) =>
          Object.keys(newObj).every((k) => newObj[k] === v[k])
        );
      } else if (result.length > 0) {
        // If no specific selection, use first matching variant
        result2 = result[0];
      }

      // console.log("result2", result2);
      if (result.length <= 0 || result2 === undefined || result2 === null) {
        // If no exact match, try to find partial match
        if (result.length > 0) {
          result2 = result[0];
        } else {
          setStock(0);
          return;
        }
      }

      setVariants(result);
      const sameVariant =
        result2 && selectVariant && result2._id === selectVariant._id;
      if (!sameVariant) {
        setSelectVariant(result2);
        setSelectVa(result2);
      }

      // Get variant images - prioritize variant images
      let variantImages = [];
      if (Array.isArray(result2?.images) && result2.images.length > 0) {
        variantImages = result2.images;
      } else if (result2?.image) {
        variantImages = [result2.image];
      }

      // If variant has video, add it to images array
      if (result2?.video && typeof result2.video === "string" && result2.video.trim() !== "") {
        if (!variantImages.includes(result2.video)) {
          variantImages.push(result2.video);
        }
      }

      // Set active image to first variant image, or fallback to product image
      const variantImage = variantImages.length > 0
        ? variantImages[0]
        : (productImages[0] || "");
      setActiveImage(variantImage);
      setCurrentImages(
        variantImages.length > 0 ? variantImages : productImages
      );

      setStock(result2?.quantity);
      const price = getNumber(result2?.price);
      const originalPrice = getNumber(result2?.originalPrice);

      // Use actual discount percentage from database (variant discount)
      // Check variant discount first, then fallback to product discount
      const variantDiscount = getNumber(result2?.discount ?? result2?.prices?.discount ?? null);
      const productDiscount = getNumber(product?.prices?.discount ?? 0);
      // Use variant discount if available, otherwise use product discount
      const discount = variantDiscount !== null && variantDiscount !== undefined ? variantDiscount : productDiscount;

      console.log("Discount Debug (result2):", {
        result2: result2,
        result2Discount: result2?.discount,
        result2PricesDiscount: result2?.prices?.discount,
        variantDiscount,
        productDiscount,
        productPricesDiscount: product?.prices?.discount,
        finalDiscount: discount
      });

      setDiscount(discount);
      console.log("Discount state set to:", discount);
      setPrice(price);
      setOriginalPrice(originalPrice);

      // Set dynamic title and description - variant first, then product
      const variantTitleText = showingTranslateValue(result2?.title);
      const variantDescText = showingTranslateValue(result2?.description);
      setDynamicTitle(variantTitleText || showingTranslateValue(product?.title));
      setDynamicDescription(variantDescText || showingTranslateValue(product?.description));

      // Set variant-specific dynamic and media sections
      // Always set if array exists, even if sections have isVisible: false
      setVariantDynamicSections(
        Array.isArray(result2?.dynamicSections) && result2.dynamicSections.length > 0
          ? result2.dynamicSections
          : null
      );
      setVariantMediaSections(
        Array.isArray(result2?.mediaSections) && result2.mediaSections.length > 0
          ? result2.mediaSections
          : null
      );
    } else if (product?.variants?.length > 0) {
      const result = product?.variants?.filter((variant) =>
        Object.keys(selectVa).every((k) => selectVa[k] === variant[k])
      );

      setVariants(result);

      // Pick first variant with non-zero price, fall back to index 0
      const pricedVariant =
        product.variants.find(
          (v) => getNumber(v?.price ?? 0) > 0
        ) || product.variants[0];

      setStock(pricedVariant?.quantity);
      setSelectVariant(pricedVariant);
      setSelectVa(pricedVariant);

      // Get variant image - handle both variant.image (string) and variant.images (array)
      const firstVariantImageArr =
        Array.isArray(pricedVariant?.images) && pricedVariant.images.length > 0
          ? pricedVariant.images
          : pricedVariant?.image
            ? [pricedVariant.image]
            : [];

      const firstVariantImage =
        firstVariantImageArr[0] || productImages[0] || "";
      setActiveImage(firstVariantImage);
      setCurrentImages(
        firstVariantImageArr.length > 0 ? firstVariantImageArr : productImages
      );

      const rawVariantPrice =
        pricedVariant?.price ?? product?.prices?.price ?? 0;
      const rawVariantOriginal =
        pricedVariant?.originalPrice ??
        product?.prices?.originalPrice ??
        rawVariantPrice;

      const price = getNumber(rawVariantPrice);
      const originalPrice = getNumber(rawVariantOriginal);

      // Use actual discount percentage from database (variant or product discount)
      const variantDiscount = getNumber(pricedVariant?.discount ?? pricedVariant?.prices?.discount ?? null);
      const productDiscount = getNumber(product?.prices?.discount ?? 0);
      // Use variant discount if available, otherwise use product discount
      const discount = variantDiscount !== null && variantDiscount !== undefined ? variantDiscount : productDiscount;

      console.log("Discount Debug (pricedVariant):", {
        pricedVariantDiscount: pricedVariant?.discount,
        pricedVariantPricesDiscount: pricedVariant?.prices?.discount,
        variantDiscount,
        productDiscount,
        finalDiscount: discount
      });

      setDiscount(discount);
      setPrice(price);
      setOriginalPrice(originalPrice);

      // Set dynamic title and description - variant first, then product
      const firstVariantTitleText = showingTranslateValue(pricedVariant?.title);
      const firstVariantDescText = showingTranslateValue(
        pricedVariant?.description
      );
      setDynamicTitle(
        firstVariantTitleText || showingTranslateValue(product?.title)
      );
      setDynamicDescription(
        firstVariantDescText || showingTranslateValue(product?.description)
      );

      // Set variant-specific dynamic and media sections
      setVariantDynamicSections(
        Array.isArray(pricedVariant?.dynamicSections) &&
          pricedVariant.dynamicSections.length > 0
          ? pricedVariant.dynamicSections
          : null
      );
      setVariantMediaSections(
        Array.isArray(pricedVariant?.mediaSections) &&
          pricedVariant.mediaSections.length > 0
          ? pricedVariant.mediaSections
          : null
      );
    } else {
      setStock(product?.stock);
      setActiveImage(productImages[0] || "");

      const baseRawPrice = product?.prices?.price ?? 0;
      const baseRawOriginal =
        product?.prices?.originalPrice ?? baseRawPrice;

      const price = getNumber(baseRawPrice);
      const originalPrice = getNumber(baseRawOriginal);

      // Use actual discount percentage from database (product discount)
      const discount = getNumber(product?.prices?.discount ?? 0);

      console.log("Discount Debug (no variant):", {
        productPricesDiscount: product?.prices?.discount,
        finalDiscount: discount
      });

      setDiscount(discount);
      setPrice(price);
      setOriginalPrice(originalPrice);

      // Set dynamic title and description - use product title/description when no variant
      setDynamicTitle(showingTranslateValue(product?.title));
      setDynamicDescription(showingTranslateValue(product?.description));

      // Reset variant-specific sections when no variant
      setVariantDynamicSections(null);
      setVariantMediaSections(null);
    }
  }, [
    product?.prices?.discount,
    product?.prices?.originalPrice,
    product?.prices?.price,
    product?.stock,
    product?.variants,
    selectVa,
    selectVariant,
    value,
    productImages,
    variantTitle,
    showingTranslateValue,
    getNumber,
    product?.title,
    product?.description,
  ]);

  useEffect(() => {
    // Initialize gallery images and active image when product media changes
    const initialImage = productImages[0] || "";
    setActiveImage(initialImage);
    setCurrentImages((prev) =>
      prev && prev.length > 0 ? prev : productImages
    );
    // Initialize dynamic title and description on mount
    if (!dynamicTitle) {
      setDynamicTitle(showingTranslateValue(product?.title));
    }
    if (!dynamicDescription) {
      setDynamicDescription(showingTranslateValue(product?.description));
    }
  }, [productImages]);

  // Calculate expected delivery time
  useEffect(() => {
    const calculateDelivery = async () => {
      try {
        console.log("Calculating delivery time...", {
          hasGlobalSetting: !!globalSetting,
          hasShippingAddress: !!shippingAddressData,
          globalSetting: globalSetting ? {
            hasAddress: !!globalSetting.address,
            hasPostCode: !!globalSetting.post_code
          } : null
        });

        const deliveryTime = await getExpectedDeliveryTime(
          globalSetting,
          shippingAddressData
        );

        console.log("Delivery time result:", deliveryTime);
        setExpectedDeliveryTime(deliveryTime);
      } catch (error) {
        console.error("Error calculating delivery time:", error);
        // Set to null on error so we show the location picker
        setExpectedDeliveryTime(null);
      }
    };

    calculateDelivery();

    const handleLocationUpdate = () => {
      console.log("Location updated event received, recalculating delivery time...");
      calculateDelivery();
    };

    if (typeof window !== "undefined") {
      window.addEventListener('locationUpdated', handleLocationUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener('locationUpdated', handleLocationUpdate);
      }
    };
  }, [globalSetting, shippingAddressData]);

  // Fetch reviews when product or filters change
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product?._id) return;
      try {
        setReviewsLoading(true);
        const res = await ReviewServices.getProductReviews({
          productId: product._id,
          sort: reviewsSort,
          rating: reviewsRatingFilter,
          page: 1,
          limit: 6,
        });
        setReviews(res.reviews || []);
        setRatingSummary(res.ratingSummary || null);
        setReviewsPage(1);
        setReviewsHasMore(
          res.pagination && res.pagination.page < res.pagination.pages
        );
      } catch (err) {
        notifyError(
          err?.response?.data?.message || "Failed to load reviews."
        );
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [product?._id, reviewsSort, reviewsRatingFilter]);

  const handleLoadMoreReviews = async () => {
    if (!product?._id || !reviewsHasMore || reviewsLoading) return;
    try {
      const nextPage = reviewsPage + 1;
      setReviewsLoading(true);
      const res = await ReviewServices.getProductReviews({
        productId: product._id,
        sort: reviewsSort,
        rating: reviewsRatingFilter,
        page: nextPage,
        limit: 6,
      });
      setReviews((prev) => [...prev, ...(res.reviews || [])]);
      setReviewsPage(nextPage);
      setReviewsHasMore(
        res.pagination && res.pagination.page < res.pagination.pages
      );
    } catch (err) {
      notifyError(
        err?.response?.data?.message || "Failed to load more reviews."
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReview = async ({ productId, rating, reviewText }) => {
    if (!productId) return;
    try {
      setReviewSubmitting(true);
      const res = await ReviewServices.addOrUpdateReview({
        productId,
        rating,
        reviewText,
      });

      if (res.review) {
        setReviews((prev) => {
          const idx = prev.findIndex((r) => r._id === res.review._id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = res.review;
            return updated;
          }
          return [res.review, ...prev];
        });
      }
      if (res.ratingSummary) {
        setRatingSummary(res.ratingSummary);
      }
    } catch (err) {
      notifyError(
        err?.response?.data?.message || "Failed to submit review."
      );
      throw err;
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleMarkHelpful = async (review) => {
    if (!review?._id) return;
    try {
      const res = await ReviewServices.markHelpful(review._id);
      if (res.review) {
        setReviews((prev) =>
          prev.map((r) => (r._id === res.review._id ? res.review : r))
        );
      }
    } catch (err) {
      notifyError(
        err?.response?.data?.message || "Failed to mark as helpful."
      );
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId) return;
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await ReviewServices.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      notifySuccess("Review deleted successfully.");
      // If we deleted the only review by the current user, it will disappear from existingReview too
    } catch (err) {
      notifyError(
        err?.response?.data?.message || "Failed to delete review."
      );
    }
  };

  // Additional useEffect to handle variant changes when selectVa changes (for immediate updates on button click)
  useEffect(() => {
    // Only trigger if we have variants
    if (!product?.variants || product.variants.length === 0) return;

    // Get attribute keys
    const attributeKeys = variantTitle?.map(att => att._id) || [];
    if (attributeKeys.length === 0) return;

    // Check if selectVa has any attribute selections
    const hasAttributeSelection = selectVa && Object.keys(selectVa).some(key => attributeKeys.includes(key));

    if (!hasAttributeSelection) return;

    // Find matching variant based on selected attributes
    const matchingVariant = product.variants.find((variant) => {
      return attributeKeys.every((attrKey) => {
        const selectedValue = selectVa[attrKey];
        // If attribute is selected, it must match; if not selected, allow any value
        if (!selectedValue) return true;
        return variant[attrKey] === selectedValue;
      });
    });

    // Compare by SKU or by checking if attributes match
    const isDifferent = !selectVariant ||
      matchingVariant?.sku !== selectVariant?.sku ||
      attributeKeys.some(key => matchingVariant[key] !== selectVariant[key]);

    if (matchingVariant && isDifferent) {
      setSelectVariant(matchingVariant);

      // Update images immediately - prioritize variant images
      let variantImages = [];
      if (Array.isArray(matchingVariant?.images) && matchingVariant.images.length > 0) {
        variantImages = matchingVariant.images;
      } else if (matchingVariant?.image) {
        variantImages = [matchingVariant.image];
      }

      // If variant has video, add it to images array
      if (matchingVariant?.video && typeof matchingVariant.video === "string" && matchingVariant.video.trim() !== "") {
        if (!variantImages.includes(matchingVariant.video)) {
          variantImages.push(matchingVariant.video);
        }
      }

      const variantImage = variantImages.length > 0
        ? variantImages[0]
        : (productImages[0] || "");
      setActiveImage(variantImage);
      setCurrentImages(
        variantImages.length > 0 ? variantImages : productImages
      );

      // Update price, stock, etc. immediately
      setStock(matchingVariant?.quantity || 0);
      const price = getNumber(matchingVariant?.price);
      const originalPrice = getNumber(matchingVariant?.originalPrice);

      // Use actual discount percentage from database (variant discount)
      const variantDiscount = getNumber(matchingVariant?.discount ?? matchingVariant?.prices?.discount ?? null);
      const productDiscount = getNumber(product?.prices?.discount ?? 0);
      // Use variant discount if available, otherwise use product discount
      const discount = variantDiscount !== null && variantDiscount !== undefined ? variantDiscount : productDiscount;

      setDiscount(discount);
      setPrice(price);
      setOriginalPrice(originalPrice);

      // Update dynamic title and description immediately
      const variantTitleText = showingTranslateValue(matchingVariant?.title);
      const variantDescText = showingTranslateValue(matchingVariant?.description);
      setDynamicTitle(variantTitleText || showingTranslateValue(product?.title));
      setDynamicDescription(variantDescText || showingTranslateValue(product?.description));

      // Update variant-specific dynamic and media sections immediately
      // Always set if array exists, even if sections have isVisible: false
      setVariantDynamicSections(
        Array.isArray(matchingVariant?.dynamicSections) && matchingVariant.dynamicSections.length > 0
          ? matchingVariant.dynamicSections
          : null
      );
      setVariantMediaSections(
        Array.isArray(matchingVariant?.mediaSections) && matchingVariant.mediaSections.length > 0
          ? matchingVariant.mediaSections
          : null
      );
    }
  }, [selectVa, variantTitle, product?.variants, productImages, showingTranslateValue, getNumber, product?.title, product?.description, selectVariant]);
  useEffect(() => {
    // GUARD: Exit early if product or variants array doesn't exist yet
    if (!product || !product.variants || product.variants.length === 0) {
      return;
    }

    // Now this is completely safe to run because variants is guaranteed to be an array
    const res = Object.keys(Object.assign({}, ...product.variants));
    const varTitle = attributes?.filter((att) => res.includes(att?._id));

    setVariantTitle(varTitle?.sort());
  }, [product, variants, attributes]); // Added 'product' here to re-run once the product details load

  useEffect(() => {
    setIsLoading(false);
  }, [product]);

  // Scroll spy to update active tab and show/hide sticky bottom bar
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "product-description",
        "specification",
        "key-uses",
        "how-to-use",
        "safety-information",
        "additional-information",
        "faq"
      ];

      let currentSection = "";
      const isDesktop = window.innerWidth >= 1024;
      // Desktop: Header (~100px) + Tabs (~60px) + Buffer = ~180px
      // Mobile: Header (~64px) + Tabs (~60px) + Buffer = ~140px
      const offset = isDesktop ? 180 : 140;

      // Check if product-description section is reached to show sticky bottom bar (mobile only)
      const productDescriptionElement = document.getElementById("product-description");
      if (productDescriptionElement && !isDesktop) {
        const rect = productDescriptionElement.getBoundingClientRect();
        // Show sticky bottom bar when product description section reaches top
        const shouldShowSticky = rect.top <= offset;
        setShowStickyBottomBar(shouldShowSticky);
      } else {
        setShowStickyBottomBar(false);
      }

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= offset) {
            currentSection = sectionId;
          }
        }
      }

      if (currentSection) {
        setActiveTab(currentSection);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll active tab into view when it changes
  useEffect(() => {
    const tabContainer = document.querySelector('.tab-navigation-container');
    if (!tabContainer || !activeTab) return;

    const activeButton = tabContainer.querySelector(`[data-tab="${activeTab}"]`);
    if (activeButton) {
      const containerWidth = tabContainer.offsetWidth;
      const buttonLeft = activeButton.offsetLeft;
      const buttonWidth = activeButton.offsetWidth;

      const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);

      tabContainer.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

  const handleAddToCart = (p) => {
    if (stock <= 0) return notifyError("Insufficient stock");

    const hasVariants = product?.variants && product.variants.length > 0;
    if (
      hasVariants &&
      (!selectVariant || Object.keys(selectVariant).length === 0)
    ) {
      return notifyError("Please select all variants first!");
    }

    const { variants, categories, description, ...updatedProduct } = product;

    // Ensure we have a valid price (prefer wholesaler price when applicable)
    const currentPrice = (isWholesaler && product?.wholePrice && Number(product.wholePrice) > 0)
      ? Number(product.wholePrice)
      : (price > 0
        ? price
        : getNumber(selectVariant?.price ?? product?.prices?.price ?? 0)
      );

    const currentOriginalPrice = (isWholesaler && product?.wholePrice && Number(product.wholePrice) > 0)
      ? (product?.prices?.originalPrice ?? product?.prices?.price ?? 0)
      : (originalPrice > 0
        ? originalPrice
        : getNumber(selectVariant?.originalPrice ?? product?.prices?.originalPrice ?? currentPrice)
      );

    const newItem = {
      ...updatedProduct,
      id: `${!hasVariants || p.variants.length === 0
          ? p._id
          : p._id +
          "-" +
          variantTitle?.map((att) => selectVariant[att._id]).join("-")
        }`,

      title: `${!hasVariants || p.variants.length === 0
          ? dynamicTitle || showingTranslateValue(product?.title)
          : (dynamicTitle || showingTranslateValue(product?.title)) +
          "-" +
          variantTitle
            ?.map((att) =>
              att.variants?.find((v) => v._id === selectVariant[att._id])
            )
            .map((el) => showingTranslateValue(el?.name))
        }`,
      image: activeImage || product.image?.[0] || product.images?.[0],
      variant: selectVariant,
      price: currentPrice,
      originalPrice: currentOriginalPrice,
    };

    const minQty = isWholesaler && product?.minQuantity ? Number(product.minQuantity) : 1;
    handleAddItem(newItem, minQty);
  };

  const handleAddToWishlist = (p) => {
    if (typeof window === "undefined") return;

    try {
      const result = addToWishlist(p);

      if (!result.ok && result.reason === "exists") {
        notifyError("Product already in wishlist");
        return;
      }

      if (!result.ok) {
        notifyError("Failed to add to wishlist");
        return;
      }

      notifySuccess("Product added to wishlist");
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      notifyError("Failed to add to wishlist");
    }
  };

  const handleAddToCompare = (p) => {
    if (typeof window === "undefined") return;

    try {
      const storedCompare = localStorage.getItem("compare");
      let compare = storedCompare ? JSON.parse(storedCompare) : [];

      // Check if product already exists in compare
      const exists = compare.some((item) => item._id === p._id);

      if (exists) {
        notifyError("Product already in compare list");
        return;
      }

      // Limit compare list to 4 products
      if (compare.length >= 4) {
        notifyError("You can compare maximum 4 products");
        return;
      }

      // Add product to compare
      compare.push(p);
      localStorage.setItem("compare", JSON.stringify(compare));
      notifySuccess("Product added to compare list");
    } catch (error) {
      console.error("Error adding to compare:", error);
      notifyError("Failed to add to compare list");
    }
  };

  const handleBuyNow = (p) => {
    try {
      // Check stock first - handle products with and without variants
      if (stock <= 0) {
        return notifyError("Insufficient stock");
      }

      // Check if variants need to be selected
      const hasVariants = product?.variants && product.variants.length > 0;
      if (
        hasVariants &&
        (!selectVariant || Object.keys(selectVariant).length === 0)
      ) {
        return notifyError("Please select all variants first!");
      }

      // Prepare product item for direct checkout
      const { variants, categories, description, ...updatedProduct } = product;

      // Ensure we have a valid price (prefer wholesaler price when applicable)
      const currentPrice = (isWholesaler && product?.wholePrice && Number(product.wholePrice) > 0)
        ? Number(product.wholePrice)
        : (price > 0
          ? price
          : getNumber(selectVariant?.price ?? product?.prices?.price ?? 0)
        );
      const currentOriginalPrice = (isWholesaler && product?.wholePrice && Number(product.wholePrice) > 0)
        ? (product?.prices?.originalPrice ?? product?.prices?.price ?? 0)
        : (originalPrice > 0
          ? originalPrice
          : getNumber(selectVariant?.originalPrice ?? product?.prices?.originalPrice ?? currentPrice)
        );

      const minQtyBuy = isWholesaler && product?.minQuantity ? Number(product.minQuantity) : item;
      const newItem = {
        ...updatedProduct,
        id: `${!hasVariants || (p.variants && p.variants.length <= 1)
            ? p._id
            : p._id +
            variantTitle?.map((att) => selectVariant[att._id]).join("-")
          }`,
        title: `${!hasVariants || (p.variants && p.variants.length <= 1)
            ? dynamicTitle || showingTranslateValue(product?.title)
            : (dynamicTitle || showingTranslateValue(product?.title)) +
            "-" +
            variantTitle
              ?.map((att) =>
                att.variants?.find((v) => v._id === selectVariant[att._id])
              )
              .map((el) => showingTranslateValue(el?.name))
          }`,
        image: activeImage || product.image?.[0],
        variant: selectVariant || {},
        price: currentPrice,
        originalPrice: currentOriginalPrice,
        quantity: minQtyBuy,
      };

      // Replace entire cart with only this product (Flipkart style - Buy Now replaces cart)
      setItems([newItem]);

      // Flipkart-style: login first if needed, then existing checkout page
      setTimeout(() => {
        if (!userInfo?.token) {
          router.push("/auth/login?redirectUrl=checkout");
          return;
        }
        router.push("/checkout");
      }, 150);
    } catch (error) {
      console.error("Buy Now error:", error);
      notifyError("Something went wrong. Please try again.");
    }
  };

  // Share current product + variant selection URL
  const handleShareCurrentVariant = async () => {
    const urlToShare =
      (typeof window !== "undefined" && window.location.href) ||
      shareUrl ||
      `https://Farmacykart-store-nine.vercel.app/product/${router.query.slug}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: dynamicTitle || showingTranslateValue(product?.title),
          text: dynamicDescription || showingTranslateValue(product?.description),
          url: urlToShare,
        });
        return;
      }

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(urlToShare);
        notifySuccess("Link copied to clipboard!");
        return;
      }

      notifySuccess("Share this link: " + urlToShare);
    } catch (err) {
      if (err?.name === "AbortError") return;
      notifyError("Unable to share link. Please try again.");
    }
  };

  const handleChangeImage = (img) => {
    if (img) {
      setActiveImage(img);
    }
  };

  // Update images when variant changes - create variant-specific image list
  const variantImages = useMemo(() => {
    if (!selectVariant || Object.keys(selectVariant).length === 0) {
      return productImages;
    }

    // Get images for selected variant
    const variantImgs = [];
    if (Array.isArray(selectVariant?.images) && selectVariant.images.length > 0) {
      variantImgs.push(...selectVariant.images);
    } else if (selectVariant?.image) {
      variantImgs.push(selectVariant.image);
    }

    // If variant has images, use them; otherwise use all product images
    return variantImgs.length > 0 ? variantImgs : productImages;
  }, [selectVariant, productImages]);

  const { t } = useTranslation();

  const productFaqs = useMemo(() => {
    // Handle new listSectionSchema structure (with items array)
    if (product?.faqs && typeof product.faqs === 'object' && !Array.isArray(product.faqs)) {
      // New structure: { enabled, icon, title, items: [{ key, value }] }
      if (product.faqs.items && Array.isArray(product.faqs.items)) {
        return product.faqs.items
          .filter(
            (item) =>
              item &&
              (item.key || item.value) &&
              (item.key?.trim() || item.value?.trim()) &&
              product.faqs.enabled !== false
          )
          .map((item) => ({
            question: item.key || item.value || "",
            answer: item.value || item.key || "",
            answerType: "custom",
            isVisible: true,
          }));
      }
      return [];
    }

    // Handle old array structure (backward compatibility)
    if (Array.isArray(product?.faqs)) {
      return product.faqs.filter(
        (faq) =>
          faq &&
          faq?.question &&
          faq.question.trim() !== "" &&
          faq?.isVisible !== false
      );
    }

    return [];
  }, [product?.faqs]);

  // category name slug
  const category_name = (showingTranslateValue(product?.category?.name) || "")
    .toLowerCase()
    .replace(/[^A-Z0-9]+/gi, "-");

  // Helper to create URL-friendly slugs for attribute/variant names
  const slugify = (str = "") =>
    str
      ?.toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  // NOTE: Variant URL syncing disabled to avoid navigation loops during Buy Now flow.
  // If you want to re-enable deep-linking by variant, restore the previous
  // useEffects that read/write variant params from/to the URL.

  // console.log("discount", discount);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    const element = document.getElementById(tabId);
    if (element) {
      const rect = element.getBoundingClientRect();
      // Header is approx 80-100px. Tabs are 50-60px. Total ~140-160px. 
      // Using 180px provides a safe buffer so the title is clearly visible.
      const offset = 180;
      const targetPosition = window.pageYOffset + rect.top - offset;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
      {isLoading ? (
        <Loading loading={isLoading} />
      ) : (
        <Layout
          title={dynamicTitle || showingTranslateValue(product?.title)}
          description={dynamicDescription || showingTranslateValue(product?.description)}
        >
          <div className="lg:px-8 py-4">
            <div className="mx-auto px-4 lg:px-12 max-w-screen-2xl">
              <div className="flex items-center pb-6 justify-between gap-4">
                <nav className="flex items-center space-x-2 text-sm text-neutral-400 font-medium">
                  <Link href="/" className="hover:text-[#FED7AA] transition-colors flex items-center">
                    Home
                  </Link>
                  <FiChevronRight className="w-4 h-4 text-neutral-600" />
                  <Link
                    href={`/search?category=${category_name}&_id=${product?.category?._id}`}
                    className="hover:text-[#FED7AA] transition-colors bg-[#141418] text-neutral-300 px-3 py-1 rounded-full border border-neutral-800 text-xs font-medium"
                  >
                    {category_name}
                  </Link>
                  <FiChevronRight className="w-4 h-4 text-neutral-600" />
                  <span className="text-[#FED7AA] font-semibold truncate max-w-[150px] sm:max-w-xs">
                    {dynamicTitle || showingTranslateValue(product?.title)}
                  </span>
                </nav>
              </div>
              <div className="w-full">
                <div className="flex flex-col lg:flex-row gap-10">
                  <div className="flex-shrink-0 w-full mx-auto md:w-5/12 lg:w-5/12 xl:w-5/12">
                    <div className="mt-1 lg:mt-2 lg:sticky lg:top-28 lg:space-y-4">
                      {!isWholesaler && <Discount slug product={product} discount={discount} />}

                      {/* Flipkart-style Product Image Gallery with buttons inside */}
                      <ProductImageGallery
                        images={currentImages.length > 0 ? currentImages : productImages}
                        productTitle={
                          dynamicTitle || showingTranslateValue(product?.title)
                        }
                        buttons={
                          <div className="absolute left-3.5 top-3.5 z-20 flex flex-col items-start gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddToWishlist(product)}
                              className="flex items-center gap-1.5 text-xs font-medium text-neutral-200 hover:text-[#FED7AA] border border-neutral-700/80 hover:border-[#D4A359]/70 rounded-full px-3 py-1.5 bg-[#121216]/85 backdrop-blur-md shadow-md transition-all"
                              aria-label="Add to wishlist"
                            >
                              <FiHeart className="w-3.5 h-3.5 text-[#FED7AA]" />
                              <span className="hidden sm:inline">Wishlist</span>
                            </button>
                          </div>
                        }
                      />

                      {/* Add to Cart & Buy Now under gallery (Premium Style) */}
                      <div className="mt-6">
                        <div className="flex gap-3 sm:gap-4">
                          <button
                            onClick={() => handleAddToCart(product)}
                            type="button"
                            className="add-to-cart-btn flex-1 h-13 sm:h-14 rounded-xl text-base font-bold flex items-center justify-center bg-[#FED7AA] text-[#111827] border-2 border-[#FED7AA] hover:bg-[#FDBA74] hover:border-[#D4A359] transform hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md"
                          >
                            {t("AddToCart")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleBuyNow(product);
                            }}
                            type="button"
                            className="flex-1 h-13 sm:h-14 rounded-xl text-base font-extrabold flex items-center justify-center bg-gradient-to-r from-[#D4A359] via-[#E5B56E] to-[#D4A359] text-[#111827] hover:brightness-110 transform hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg hover:shadow-amber-500/20"
                          >
                            Buy Now
                          </button>
                        </div>
                        <p className="text-center text-[11px] sm:text-xs text-neutral-400 mt-3 font-medium flex items-center justify-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                          Secure &amp; Verified Transaction
                        </p>



                      </div>
                    </div>
                  </div>



                  <div className="w-full lg:w-7/12 relative min-w-0">
                    <div className="flex flex-col md:flex-row lg:flex-row xl:flex-row">
                      <div className="xl:pr-6 md:pr-6 w-full">
                        <div className="mb-6">
                          <h1 className="leading-tight text-xl md:text-2xl lg:text-3xl mb-3 font-bold font-serif text-white tracking-tight">
                            {dynamicTitle || showingTranslateValue(product?.title)}
                          </h1>

                          <div className="text-sm leading-6 text-neutral-300 md:leading-7 mb-4">
                            {(() => {
                              const descriptionText = dynamicDescription || showingTranslateValue(product?.description);
                              const displayText = isReadMore
                                ? (descriptionText?.slice(0, 230) || "")
                                : (descriptionText || "");
                              const textLength = descriptionText?.length || 0;

                              return (
                                <>
                                  {displayText}
                                  {textLength > 230 && (
                                    <>
                                      <br />
                                      <span
                                        onClick={() => setIsReadMore(!isReadMore)}
                                        className="read-or-hide cursor-pointer text-[#FED7AA] hover:text-[#F3C47A] font-semibold ml-1"
                                      >
                                        {isReadMore
                                          ? t("moreInfo")
                                          : t("showLess")}
                                      </span>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>

                          <div className="relative mb-3">
                            <Stock stock={stock} />
                          </div>

                        </div>
                        <div className="bg-[#101014] rounded-2xl p-5 sm:p-6 mb-6 border border-neutral-800/90 shadow-md">
                          <Price
                            // If wholesaler and product has wholesale price, show that price
                            price={
                              (isWholesaler && product?.wholePrice && Number(product.wholePrice) > 0)
                                ? Number(product.wholePrice)
                                : (price > 0
                                  ? price
                                  : getNumber(
                                    (product?.variants?.[0]?.price ??
                                      product?.prices?.price) || 0
                                  ))
                            }
                            product={product}
                            currency={currency}
                            discount={discount || product?.prices?.discount || 0}
                            originalPrice={
                              originalPrice > 0
                                ? originalPrice
                                : getNumber(
                                  (product?.variants?.[0]?.originalPrice ??
                                    product?.prices?.originalPrice ??
                                    product?.variants?.[0]?.price ??
                                    product?.prices?.price) || 0
                                )
                            }
                            hideDiscountAndMRP={isWholesaler}
                            showTaxLabel
                          />

                          {discount > 0 && !isWholesaler && (
                            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold ring-1 ring-green-200">
                              <span className="animate-bounce-short mr-1">🔥</span> Special Discount Applied
                            </div>
                          )}

                          {isWholesaler && product?.minQuantity && Number(product.minQuantity) > 0 && (
                            <p className="text-xs md:text-sm text-gray-500 mt-4 border-t pt-3 border-gray-200">
                              Min order quantity: <span className="font-bold text-gray-800">{product.minQuantity} Units</span>
                            </p>
                          )}
                        </div>

                        {/* Flipkart-style Variant Selection */}
                        <div className="mb-6 space-y-4">
                          {variantTitle?.map((a, i) => (
                            <div key={i + 1} className="pb-3">
                              <div className="flex items-center mb-2">
                                <h4 className="text-sm font-semibold text-gray-800 mr-2">
                                  {showingTranslateValue(a?.name)}:
                                </h4>
                                {selectVariant[a._id] && (
                                  <span className="text-xs text-gray-500">
                                    {
                                      showingTranslateValue(
                                        a?.variants?.find(v => v._id === selectVariant[a._id])?.name
                                      )
                                    }
                                  </span>
                                )}
                              </div>
                              <div className="max-w-full">
                                <VariantList
                                  att={a._id}
                                  lang={lang}
                                  option={a.option}
                                  setValue={setValue}
                                  varTitle={variantTitle}
                                  setSelectVa={setSelectVa}
                                  variants={product.variants}
                                  selectVariant={selectVariant}
                                  setSelectVariant={setSelectVariant}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div>                          <div className="flex items-center gap-2 mt-4">
                            <span className="text-neutral-400 font-medium text-sm">
                              {t("category")}:
                            </span>
                            <Link
                              href={`/search?category=${category_name}&_id=${product?.category?._id}`}
                            >
                              <button
                                type="button"
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#161412] text-[#FED7AA] border border-[#D4A359]/40 hover:border-[#D4A359] hover:bg-[#201c18] transition-all"
                                onClick={() => setIsLoading(!isLoading)}
                              >
                                {category_name}
                              </button>
                            </Link>
                            <Tags product={product} />
                          </div>

                          <div className="mt-6 space-y-3 pt-4 border-t border-neutral-800/80">
                            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-300">
                              <span className="text-neutral-400">Call Us To Order:</span>
                              <a
                                href={`tel:${(storeCustomizationSetting?.navbar?.phone || storeCustomizationSetting?.footer?.bottom_contact || globalSetting?.contact || "+0044235234").replace(/\s+/g, '')}`}
                                className="text-[#FED7AA] font-semibold hover:underline flex items-center gap-1.5"
                              >
                                {storeCustomizationSetting?.navbar?.phone || storeCustomizationSetting?.footer?.bottom_contact || globalSetting?.contact || "+0044235234"}
                              </a>
                            </div>

                            {/* Expected Delivery Time */}
                            {expectedDeliveryTime ? (
                              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-300">
                                <FiTruck className="w-4 h-4 text-[#FED7AA] flex-shrink-0" />
                                <span className="text-neutral-400">Expected Delivery:</span>
                                <span className="text-white font-bold text-sm">
                                  {expectedDeliveryTime}
                                </span>
                              </div>
                            ) : (
                              <div className="mt-2 flex gap-3 items-center">
                                <div className="text-xs sm:text-sm text-neutral-400 font-medium">Check delivery time &amp; availability:</div>
                                <LocationPickerDropdown className="w-30 !border !border-neutral-700 rounded-md py-1.5 px-3 bg-[#161412] text-neutral-200 hover:bg-[#201c18] hover:!border-[#D4A359] transition-all justify-between !h-auto" />
                              </div>
                            )}
                          </div>
                          {/* social share
                          <div className="mt-2">
                              <h3 className="text-base font-semibold mb-1 font-serif">
                              {t("shareYourSocial")}
                            </h3>
                              <p className="font-sans text-sm text-gray-500">
                              {t("shareYourSocialText")}
                            </p>
                            <ul className="flex mt-4">
                              <li className="flex items-center text-center border border-gray-100 rounded-full hover:bg-store-500  mr-2 transition ease-in-out duration-500">
                                <FacebookShareButton
                                  url={
                                    shareUrl ||
                                    (typeof window !== "undefined"
                                      ? window.location.href
                                      : `https://Farmacykart-store-nine.vercel.app/product/${router.query.slug}`)
                                  }
                                  quote=""
                                >
                                  <FacebookIcon size={32} round />
                                </FacebookShareButton>
                              </li>
                              <li className="flex items-center text-center border border-gray-100 rounded-full hover:bg-store-500  mr-2 transition ease-in-out duration-500">
                                <TwitterShareButton
                                  url={
                                    shareUrl ||
                                    (typeof window !== "undefined"
                                      ? window.location.href
                                      : `https://Farmacykart-store-nine.vercel.app/product/${router.query.slug}`)
                                  }
                                  quote=""
                                >
                                  <TwitterIcon size={32} round />
                                </TwitterShareButton>
                              </li>
                              <li className="flex items-center text-center border border-gray-100 rounded-full hover:bg-store-500  mr-2 transition ease-in-out duration-500">
                                <a
                                  href={`https://www.instagram.com/?url=${
                                    shareUrl ||
                                    (typeof window !== "undefined"
                                      ? window.location.href
                                      : `https://Farmacykart-store-nine.vercel.app/product/${router.query.slug}`)
                                  }`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-full h-full"
                                  aria-label="Share on Instagram"
                                >
                                  <FaInstagram size={32} style={{ color: '#E4405F' }} />
                                </a>
                              </li>
                              <li className="flex items-center text-center border border-gray-100 rounded-full hover:bg-store-500  mr-2 transition ease-in-out duration-500">
                                <WhatsappShareButton
                                  url={
                                    shareUrl ||
                                    (typeof window !== "undefined"
                                      ? window.location.href
                                      : `https://Farmacykart-store-nine.vercel.app/product/${router.query.slug}`)
                                  }
                                  quote=""
                                >
                                  <WhatsappIcon size={32} round />
                                </WhatsappShareButton>
                              </li>
                              <li className="flex items-center text-center border border-gray-100 rounded-full hover:bg-store-500  mr-2 transition ease-in-out duration-500">
                                <LinkedinShareButton
                                  url={
                                    shareUrl ||
                                    (typeof window !== "undefined"
                                      ? window.location.href
                                      : `https://Farmacykart-store-nine.vercel.app/product/${router.query.slug}`)
                                  }
                                  quote=""
                                >
                                  <LinkedinIcon size={32} round />
                                </LinkedinShareButton>
                              </li>
                            </ul>
                          </div> */}


                          {/* Composition Section */}
                          {product?.composition?.enabled !== false && product?.composition?.description && (
                            <div className="mt-6 border border-neutral-800/90 rounded-2xl p-5 sm:p-6 bg-[#101014] shadow-sm">
                              <div className="flex items-center gap-2.5 mb-3">
                                <span className="w-1.5 h-4 rounded-full bg-[#D4A359]" />
                                <h2 className="text-lg font-bold text-white tracking-tight">
                                  {product.composition.title || "Composition"}
                                </h2>
                              </div>
                              <p className="text-sm text-neutral-300 leading-relaxed text-justify font-sans">
                                {product.composition.description}
                              </p>
                            </div>
                          )}

                          {/* Product Highlights Section */}
                          {product?.productHighlights?.enabled !== false && product?.productHighlights?.items?.length > 0 && (
                            <div className="mt-6 border border-neutral-800/90 rounded-2xl p-5 sm:p-6 bg-[#101014] shadow-sm">
                              <div className="flex items-center gap-3 mb-4">
                                {product.productHighlights.icon && (
                                  <img src={product.productHighlights.icon} alt="" className="w-8 h-8 object-contain" />
                                )}
                                <h2 className="text-lg font-bold text-white tracking-tight">
                                  {product.productHighlights.title || "Product Highlights"}
                                </h2>
                              </div>
                              <ul className="list-disc list-inside space-y-2 text-sm text-neutral-300 text-justify">
                                {product.productHighlights.items.map((item, idx) => (
                                  <li key={idx} className="leading-relaxed">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Premium Tab Navigation */}
                          <div className="sticky top-16 lg:top-[80px] z-40 bg-[#070709]/95 backdrop-blur-md mt-10 mb-6 py-1 border-b border-neutral-800/90">
                            <style jsx global>{`
                              .tab-navigation-container {
                                scrollbar-width: none !important;
                                -ms-overflow-style: none !important;
                              }
                              .tab-navigation-container::-webkit-scrollbar {
                                display: none !important;
                              }
                              @keyframes pulse-subtle {
                                0% { opacity: 0.95; transform: scale(1); }
                                50% { opacity: 1; transform: scale(1.02); }
                                100% { opacity: 0.95; transform: scale(1); }
                              }
                              .lg\:animate-pulse-subtle:hover {
                                animation: pulse-subtle 2s infinite ease-in-out;
                              }
                              .animate-bounce-short {
                                animation: bounce-short 1s infinite;
                              }
                              @keyframes bounce-short {
                                0%, 100% { transform: translateY(0); }
                                50% { transform: translateY(-3px); }
                              }
                            `}</style>
                            <div className="max-w-screen-2xl mx-auto px-4 lg:px-12">
                              <div className="flex gap-6 overflow-x-auto tab-navigation-container">
                                {product?.productDescription?.enabled !== false && (
                                  <button
                                    data-tab="product-description"
                                    onClick={() => handleTabClick("product-description")}
                                    className={`relative py-3 text-sm font-bold transition-all whitespace-nowrap ${activeTab === "product-description"
                                        ? "text-[#FED7AA]"
                                        : "text-neutral-400 hover:text-white"
                                      }`}
                                  >
                                    Description
                                    {activeTab === "product-description" && (
                                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FED7AA] rounded-full" />
                                    )}
                                  </button>
                                )}
                                {product?.dynamicSections?.some(s => s?.name?.toLowerCase().includes("specification")) && (
                                  <button
                                    data-tab="specification"
                                    onClick={() => handleTabClick("specification")}
                                    className={`relative py-3 text-sm font-bold transition-all whitespace-nowrap ${activeTab === "specification"
                                        ? "text-[#FED7AA]"
                                        : "text-neutral-400 hover:text-white"
                                      }`}
                                  >
                                    Specification
                                    {activeTab === "specification" && (
                                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FED7AA] rounded-full" />
                                    )}
                                  </button>
                                )}
                                {product?.keyUses?.enabled !== false && product?.keyUses?.items?.length > 0 && (
                                  <button
                                    data-tab="key-uses"
                                    onClick={() => handleTabClick("key-uses")}
                                    className={`relative py-3 text-sm font-bold transition-all whitespace-nowrap ${activeTab === "key-uses"
                                        ? "text-[#FED7AA]"
                                        : "text-neutral-400 hover:text-white"
                                      }`}
                                  >
                                    Key Uses
                                    {activeTab === "key-uses" && (
                                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FED7AA] rounded-full" />
                                    )}
                                  </button>
                                )}
                                {product?.howToUse?.enabled !== false && product?.howToUse?.items?.length > 0 && (
                                  <button
                                    data-tab="how-to-use"
                                    onClick={() => handleTabClick("how-to-use")}
                                    className={`relative py-3 text-sm font-bold transition-all whitespace-nowrap ${activeTab === "how-to-use"
                                        ? "text-[#FED7AA]"
                                        : "text-neutral-400 hover:text-white"
                                      }`}
                                  >
                                    Usage Guide
                                    {activeTab === "how-to-use" && (
                                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FED7AA] rounded-full" />
                                    )}
                                  </button>
                                )}
                                {product?.safetyInformation?.enabled !== false && product?.safetyInformation?.items?.length > 0 && (
                                  <button
                                    data-tab="safety-information"
                                    onClick={() => handleTabClick("safety-information")}
                                    className={`relative py-3 text-sm font-bold transition-all whitespace-nowrap ${activeTab === "safety-information"
                                        ? "text-[#FED7AA]"
                                        : "text-neutral-400 hover:text-white"
                                      }`}
                                  >
                                    Safety
                                    {activeTab === "safety-information" && (
                                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FED7AA] rounded-full" />
                                    )}
                                  </button>
                                )}
                                {productFaqs.length > 0 && (
                                  <button
                                    data-tab="faq"
                                    onClick={() => handleTabClick("faq")}
                                    className={`relative py-3 text-sm font-bold transition-all whitespace-nowrap ${activeTab === "faq"
                                        ? "text-[#FED7AA]"
                                        : "text-neutral-400 hover:text-white"
                                      }`}
                                  >
                                    FAQs
                                    {activeTab === "faq" && (
                                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FED7AA] rounded-full" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Product Description Section */}
                          {product?.productDescription?.enabled !== false && (product?.productDescription?.description || showingTranslateValue(product?.description)) && (
                            <div id="product-description" className="mt-6 border border-neutral-800/90 rounded-2xl p-5 sm:p-6 bg-[#101014]">
                              <div className="flex items-center gap-2.5 mb-3">
                                {product.productDescription?.icon && (
                                  <img src={product.productDescription.icon} alt="" className="w-8 h-8 object-contain" />
                                )}
                                <h2 className="text-lg font-bold text-white tracking-tight">
                                  {product.productDescription?.title || "Product Description"} of {dynamicTitle || showingTranslateValue(product?.title)}
                                </h2>
                              </div>
                              <p className="text-sm text-neutral-300 leading-relaxed text-justify">
                                {product.productDescription?.description || showingTranslateValue(product?.description)}
                              </p>
                            </div>
                          )}

                          {/* Specification Section */}
                          {product?.dynamicSections?.some(s => s?.name?.toLowerCase().includes("specification")) && (
                            <div id="specification" className="mt-8 border border-slate-800 rounded-lg p-6 bg-slate-900/50">
                              {product.dynamicSections
                                .filter(s => s?.name?.toLowerCase().includes("specification"))
                                .map((section, idx) => (
                                  <div key={idx} className="mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                      <h2 className="text-xl font-semibold text-slate-200">
                                        {section.name} of {dynamicTitle || showingTranslateValue(product?.title)}
                                      </h2>
                                    </div>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 text-justify">
                                      {section.subsections
                                        ?.filter(sub => sub?.type !== "paragraph" && (sub?.key || sub?.value))
                                        .map((sub, subIdx) => (
                                          <li key={subIdx}>
                                            <strong className="text-white">{sub.key || sub.title}:</strong> {sub.value || sub.content}
                                          </li>
                                        ))}
                                    </ul>
                                  </div>
                                ))}
                            </div>
                          )}

                          {/* Key Uses Section */}
                          {product?.keyUses?.enabled !== false && product?.keyUses?.items?.length > 0 && (
                            <div id="key-uses" className="mt-8 border border-slate-800 rounded-lg p-6 bg-slate-900/50">
                              <div className="flex items-center gap-3 mb-4">
                                {product.keyUses.icon && (
                                  <img src={product.keyUses.icon} alt="" className="w-10 h-10" />
                                )}
                                <h2 className="text-xl font-semibold text-slate-200">
                                  {product.keyUses.title || "Key Uses"} of {dynamicTitle || showingTranslateValue(product?.title)}
                                </h2>
                              </div>
                              <ul className="list-disc list-inside space-y-4 text-sm text-slate-300 text-justify">
                                {product.keyUses.items.map((item, idx) => (
                                  <li key={idx} className="leading-relaxed">
                                    <strong className="text-white">{item.key || item.value}:</strong>{" "}
                                    {item.value && item.key ? item.value : ""}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* How To Use Section */}
                          {product?.howToUse?.enabled !== false && product?.howToUse?.items?.length > 0 && (
                            <div id="how-to-use" className="mt-8 border border-slate-800 rounded-lg p-6 bg-slate-900/50">
                              <div className="flex items-center gap-3 mb-4">
                                {product.howToUse.icon && (
                                  <img src={product.howToUse.icon} alt="" className="w-10 h-10" />
                                )}
                                <h2 className="text-xl font-semibold text-slate-200">
                                  {product.howToUse.title || "How To Use"}
                                </h2>
                              </div>
                              <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 text-justify">
                                {product.howToUse.items.map((item, idx) => (
                                  <li key={idx} className="leading-relaxed">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Safety Information Section */}
                          {product?.safetyInformation?.enabled !== false && product?.safetyInformation?.items?.length > 0 && (
                            <div id="safety-information" className="mt-8 border border-slate-800 rounded-lg p-6 bg-slate-900/50">
                              <div className="flex items-center gap-3 mb-4">
                                {product.safetyInformation.icon && (
                                  <img src={product.safetyInformation.icon} alt="" className="w-10 h-10" />
                                )}
                                <h2 className="text-xl font-semibold text-slate-200">
                                  {product.safetyInformation.title || "Safety Information"}
                                </h2>
                              </div>
                              <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 text-justify">
                                {product.safetyInformation.items.map((item, idx) => (
                                  <li key={idx} className="leading-relaxed">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Additional Information Section */}
                          {product?.additionalInformation?.enabled !== false && product?.additionalInformation?.subsections?.length > 0 && (
                            <div id="additional-information" className="mt-8 border border-slate-800 rounded-lg p-6 bg-slate-900/50">
                              <div className="flex items-center gap-3 mb-4">
                                {product.additionalInformation.icon && (
                                  <img src={product.additionalInformation.icon} alt="" className="w-10 h-10" />
                                )}
                                <h2 className="text-xl font-semibold text-slate-200">
                                  {product.additionalInformation.title || "Additional Information"}
                                </h2>
                              </div>
                              <div className="space-y-6">
                                {product.additionalInformation.subsections.map((subsection, idx) => (
                                  <div key={idx} className="bg-slate-900 border border-slate-850 rounded-lg p-4">
                                    <h3 className="inline-block px-3 py-1 mb-3 text-sm font-semibold text-teal-300 bg-teal-500/10 border border-teal-500/20 rounded-full">
                                      {subsection.label}
                                    </h3>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-slate-300 text-justify">
                                      {subsection.items.map((item, itemIdx) => (
                                        <li key={itemIdx} className="leading-relaxed">
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Product Details Section (Dynamic & Media) */}
                          <ProductDetailsSection
                            dynamicSections={variantDynamicSections || product?.dynamicSections}
                            mediaSections={variantMediaSections || product?.mediaSections}
                            selectedAttributes={selectVa || selectVariant || {}}
                            isVariantSpecific={!!variantDynamicSections}
                          />


                          {/* Modern FAQ Section */}
                          {productFaqs.length > 0 && (
                            <div id="faq" className="mt-12 border border-slate-850 rounded-[2rem] p-8 bg-slate-900/40 backdrop-blur-md shadow-sm">
                              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                <span className="w-2 h-8 bg-store-500 rounded-full" />
                                {product?.faqs?.title || (product?.faqTitle && product.faqTitle.trim().length
                                  ? product.faqTitle
                                  : t("frequentlyAskedQuestions") ||
                                  "Common Questions")}
                              </h3>
                              <div className="space-y-4">
                                {productFaqs.map((faq, index) => {
                                  const isOpen = activeFaqIndex === index;
                                  return (
                                    <div key={`${faq.question}-${index}`} className={`rounded-2xl border transition-all duration-300 ${isOpen ? 'border-store-200 bg-store-50/30' : 'border-gray-50 bg-gray-50/50 hover:bg-gray-100/50'}`}>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setActiveFaqIndex(isOpen ? null : index)
                                        }
                                        className="w-full flex items-center justify-between text-left px-6 py-5 focus:outline-none"
                                      >
                                        <span className="text-base font-bold text-gray-800 pr-4">
                                          {faq.question}
                                        </span>
                                        <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-store-600' : 'text-gray-400'}`}>
                                          <FiChevronDown className="w-5 h-5" />
                                        </span>
                                      </button>
                                      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-store-100/50 pt-4">
                                          {faq.answerType === "yes" || faq.answerType === "no"
                                            ? faq.answer
                                            : faq.answer || faq.customAnswer || ""}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}


                          {/* Manufacturer Details Section */}
                          {product?.manufacturerDetails?.enabled !== false && product?.manufacturerDetails?.items?.length > 0 && (
                            <div className="mt-6 border border-neutral-800/90 rounded-2xl p-5 sm:p-6 bg-[#101014]">
                              <h3 className="text-lg font-bold text-white mb-3">
                                {product?.manufacturerDetails?.title || "Manufacturer details"}
                              </h3>
                              <div className="space-y-2 text-sm text-neutral-300 text-justify">
                                {product.manufacturerDetails.items.map((item, idx) => (
                                  <p key={idx} className="leading-relaxed">
                                    {item}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Disclaimer Section */}
                          {product?.disclaimer?.enabled !== false && product?.disclaimer?.description && (
                            <div className="mt-6 border border-neutral-800/90 rounded-2xl p-5 sm:p-6 bg-[#101014]">
                              <h3 className="text-lg font-bold text-white mb-3">
                                {product?.disclaimer?.title || "Disclaimer"}
                              </h3>
                              <div className="text-sm text-neutral-300 leading-relaxed text-justify">
                                <p className="leading-relaxed">
                                  {typeof product.disclaimer.description === 'object' && product.disclaimer.description !== null
                                    ? showingTranslateValue(product.disclaimer.description)
                                    : product.disclaimer.description}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Contact Section */}
                          {/* <div className="mt-4 p-6 bg-white">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                              In case of any issues, contact us:
                            </h3>
                            <div className="space-y-2 text-sm text-gray-600">
                              {(() => {
                                // Try storeCustomizationSetting first, then fallback to globalSetting
                                // Get email - handle both translated object and plain string
                                const emailRaw = storeCustomizationSetting?.contact_us?.email_box_email || globalSetting?.email;
                                const email = emailRaw 
                                  ? (typeof emailRaw === 'object' && emailRaw !== null && !Array.isArray(emailRaw) ? showingTranslateValue(emailRaw) : (typeof emailRaw === 'string' ? emailRaw : ""))
                                  : "";
                                
                                // Get phone - handle both translated object and plain string
                                const phoneRaw = storeCustomizationSetting?.contact_us?.call_box_phone || globalSetting?.contact;
                                const phone = phoneRaw 
                                  ? (typeof phoneRaw === 'object' && phoneRaw !== null && !Array.isArray(phoneRaw) ? showingTranslateValue(phoneRaw) : (typeof phoneRaw === 'string' ? phoneRaw : ""))
                                  : "";
                                
                                // Get address - handle both translated object and plain string
                                const addressRaw = storeCustomizationSetting?.contact_us?.address_box_address_one || globalSetting?.address;
                                const address = addressRaw 
                                  ? (typeof addressRaw === 'object' && addressRaw !== null && !Array.isArray(addressRaw) ? showingTranslateValue(addressRaw) : (typeof addressRaw === 'string' ? addressRaw : ""))
                                  : "";
                                
                                return (
                                  <>
                                    {(email || phone) ? (
                                      <p className="leading-relaxed">
                                        {email && (
                                          <a href={`mailto:${email}`} className="text-blue-600 hover:text-blue-800">
                                            {email}
                                          </a>
                                        )}
                                        {email && phone && " | "}
                                        {phone && (
                                          <a href={`tel:${phone}`} className="text-blue-600 hover:text-blue-800">
                                            {phone}
                                          </a>
                                        )}
                                      </p>
                                    ) : null}
                                    {address ? (
                                      <p className="leading-relaxed">
                                        Address: {address}
                                      </p>
                                    ) : null}
                                  </>
                                );
                              })()}
                            </div>
                          </div> */}

                          {/* Enhanced Sticky Bottom Bar (Mobile only) */}
                          {showStickyBottomBar && (
                            <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[#070709]/95 backdrop-blur-md border-t border-neutral-800 shadow-2xl lg:hidden transition-all duration-300 slide-up">
                              <div className="max-w-screen-2xl mx-auto px-5 py-3.5">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-xs font-semibold text-neutral-400 truncate mb-1">
                                      {dynamicTitle || showingTranslateValue(product?.title)}
                                    </h3>
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-xl font-extrabold text-white tracking-tight">
                                        {currency}
                                        {getNumberTwo(
                                          (isWholesaler && product?.wholePrice && Number(product.wholePrice) > 0)
                                            ? Number(product.wholePrice)
                                            : (price > 0 ? price : getNumber((product?.variants?.[0]?.price ?? product?.prices?.price) || 0))
                                        )}
                                      </span>
                                      {discount > 0 && (
                                        <span className="text-xs font-bold text-emerald-400">
                                          ({discount}% OFF)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleAddToCart(product)}
                                    type="button"
                                    className="add-to-cart-btn flex-shrink-0 h-12 px-6 rounded-xl text-sm font-bold flex items-center justify-center bg-[#FED7AA] text-[#111827] active:scale-95 transition-all shadow-md"
                                  >
                                    Add To Cart
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}






                        </div>


                      </div>

                      {/* shipping description card */}
                      {/* <div className="w-full xl:w-5/12 lg:w-6/12 md:w-5/12">
                        <div
                          className={`mt-6 md:mt-0 lg:mt-0 bg-gray-50 border border-gray-100 p-4 lg:p-8 rounded-lg`}
                        >
                          <Card />
                        </div>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Variant Specification Section */}
              {/* {product?.variants && product.variants.length > 0 && (
                <div className="mt-8 pt-8">
                  <VariantSpecification
                    variants={product.variants}
                    variantTitle={variantTitle}
                    attributes={attributes}
                    onVariantSelect={(variant) => {
                      setSelectVariant(variant);
                      setSelectVa(variant);
                      const variantImages = Array.isArray(variant?.images) 
                        ? variant.images 
                        : (variant?.image ? [variant.image] : []);
                      setActiveImage(variantImages[0] || productImages[0] || "");
                      setStock(variant?.quantity || 0);
                      const price = getNumber(variant?.price);
                      const originalPrice = getNumber(variant?.originalPrice);
                      const discountPercentage = getNumber(
                        ((originalPrice - price) / originalPrice) * 100
                      );
                      setDiscount(getNumber(discountPercentage));
                      setPrice(price);
                      setOriginalPrice(originalPrice);
                      
                      // Update dynamic title and description - variant first, then product
                      const variantTitleText = showingTranslateValue(variant?.title);
                      const variantDescText = showingTranslateValue(variant?.description);
                      setDynamicTitle(variantTitleText || showingTranslateValue(product?.title));
                      setDynamicDescription(variantDescText || showingTranslateValue(product?.description));
                    }}
                    selectedVariant={selectVariant}
                  />
                </div>
              )} */}



              {/* Related Products */}
              {relatedList?.length > 0 && (
                <section
                  aria-labelledby="related-products-heading"
                  className="pt-10 lg:pt-14 pb-12 mt-12 border-t border-neutral-800/80"
                >
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A359]/10 border border-[#D4A359]/20 text-[#FED7AA] text-xs font-semibold uppercase tracking-wider mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A359] animate-pulse" />
                        Recommendations
                      </div>
                      <h3
                        id="related-products-heading"
                        className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-serif"
                      >
                        {t("common:relatedProducts") || "Related Products"}
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                        Explore more curated items you might like from our store
                      </p>
                    </div>

                    <div className="text-xs sm:text-sm text-neutral-400 font-medium">
                      Showing{" "}
                      <span className="text-[#FED7AA] font-bold">
                        {relatedList.length}
                      </span>{" "}
                      items
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5">
                      {relatedList.map((relProduct) => (
                        <ProductCard
                          key={relProduct._id}
                          product={relProduct}
                          attributes={attributes}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </Layout>
      )}
    </>
  );
};

// you can use getServerSideProps alternative for getStaticProps and getStaticPaths

export const getServerSideProps = async (context) => {
  const { slug } = context.params;

  const [data, attributesResponse] = await Promise.all([
    ProductServices.getShowingStoreProducts({
      category: "",
      slug: slug,
    }),

    AttributeServices.getShowingAttributes({}),
  ]);

  let product = {};

  if (slug) {
    product = data?.products?.find((p) => p.slug === slug);
  }

  let related = (data?.relatedProducts || []).filter(
    (p) => String(p?._id) !== String(product?._id) && p?.slug !== slug
  );

  if (!related || related.length === 0) {
    try {
      const allStore = await ProductServices.getShowingStoreProducts({
        category: "",
        slug: "",
      });
      related = (allStore?.products || []).filter(
        (p) => String(p?._id) !== String(product?._id) && p?.slug !== slug
      );
    } catch (e) {
      // fallback
    }
  }

  return {
    props: {
      product: product || null,
      attributes: attributesResponse?.attributes || [],
      relatedProducts: related || [],
    },
  };
};
export default ProductScreen;

